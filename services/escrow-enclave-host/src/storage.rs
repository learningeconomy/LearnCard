//! Untrusted persistence: canonical structure is checked here, signatures in enclave/monitor.
use crate::Event;
use aws_sdk_dynamodb::{
    Client,
    primitives::Blob,
    types::{AttributeValue as A, Put, TransactWriteItem},
};
use aws_sdk_s3::primitives::ByteStream;
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppendError {
    Conflict,
    Unavailable,
}
type Result<T> = std::result::Result<T, AppendError>;
const BAD: AppendError = AppendError::Unavailable;
pub const MAX_RECORD: usize = 8192;
pub const MAX_CHAIN: usize = 64;

#[async_trait::async_trait]
pub trait HeadStore: Send + Sync {
    async fn get_chain(&self, chain: &str) -> Result<Vec<Vec<u8>>>;
    async fn append(&self, chain: &str, bytes: &[u8]) -> Result<()>;
}

pub struct Record {
    pub tenant: String,
    pub seq: u64,
    pub prev_hash: [u8; 32],
    pub hash: [u8; 32],
}
struct Reader<'a>(&'a [u8]);
impl<'a> Reader<'a> {
    fn take(&mut self, n: usize) -> Result<&'a [u8]> {
        if n > self.0.len() {
            return Err(BAD);
        }
        let (v, rest) = self.0.split_at(n);
        self.0 = rest;
        Ok(v)
    }
    fn arg(&mut self, major: u8) -> Result<u64> {
        let byte = self.take(1)?[0];
        if byte >> 5 != major {
            return Err(BAD);
        }
        let (n, min) = match byte & 31 {
            v @ 0..=23 => return Ok(v.into()),
            24 => (1, 24),
            25 => (2, 256),
            26 => (4, 65536),
            27 => (8, 4294967296),
            _ => return Err(BAD),
        };
        let mut v = 0u64;
        for b in self.take(n)? {
            v = (v << 8) | u64::from(*b);
        }
        if v < min {
            return Err(BAD);
        }
        Ok(v)
    }
    fn exact(&mut self, major: u8, n: u64) -> Result<()> {
        if self.arg(major)? != n {
            return Err(BAD);
        }
        Ok(())
    }
    fn bytes<const N: usize>(&mut self) -> Result<[u8; N]> {
        self.exact(2, N as u64)?;
        self.take(N)?.try_into().map_err(|_| BAD)
    }
    fn text(&mut self) -> Result<&'a str> {
        let n = self.arg(3)?;
        if !(1..=128).contains(&n) {
            return Err(BAD);
        }
        let s = std::str::from_utf8(self.take(n as usize)?).map_err(|_| BAD)?;
        if !s
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
        {
            return Err(BAD);
        }
        Ok(s)
    }
}
impl Record {
    pub fn decode(bytes: &[u8]) -> Result<Self> {
        if bytes.len() > MAX_RECORD {
            return Err(BAD);
        }
        let mut r = Reader(bytes);
        r.exact(5, 16)?;
        r.exact(0, 0)?;
        r.exact(0, 1)?;
        r.exact(0, 1)?;
        let tenant = r.text()?.to_owned();
        r.exact(0, 2)?;
        r.text()?;
        r.exact(0, 3)?;
        r.arg(0)?;
        r.exact(0, 4)?;
        r.bytes::<32>()?;
        r.exact(0, 5)?;
        let seq = r.arg(0)?;
        if seq >= MAX_CHAIN as u64 {
            return Err(BAD);
        }
        r.exact(0, 6)?;
        let prev_hash = r.bytes()?;
        r.exact(0, 7)?;
        let n = r.arg(4)?;
        let event = r.arg(0)?;
        match (event, n) {
            (1, 2) => {
                if !(1..=10).contains(&r.arg(0)?) {
                    return Err(BAD);
                }
            }
            (0 | 2..=6, 1) => {}
            _ => return Err(BAD),
        }
        r.exact(0, 8)?;
        r.text()?;
        r.exact(0, 9)?;
        r.bytes::<32>()?;
        r.exact(0, 10)?;
        r.text()?;
        r.exact(0, 11)?;
        r.exact(4, 3)?;
        let lo = r.arg(0)?;
        let hi = r.arg(0)?;
        if lo > hi {
            return Err(BAD);
        }
        let count = r.arg(4)?;
        if !(2..=16).contains(&count) {
            return Err(BAD);
        }
        let mut previous = "";
        for _ in 0..count {
            r.exact(4, 4)?;
            let id = r.text()?;
            if id <= previous {
                return Err(BAD);
            }
            previous = id;
            r.arg(0)?;
            r.arg(0)?;
            r.bytes::<32>()?;
        }
        r.exact(0, 12)?;
        r.bytes::<32>()?;
        r.exact(0, 13)?;
        r.exact(0, 1)?;
        r.exact(0, 14)?;
        r.bytes::<32>()?;
        let unsigned_end = bytes.len() - r.0.len();
        r.exact(0, 15)?;
        r.bytes::<64>()?;
        if !r.0.is_empty() {
            return Err(BAD);
        }
        let mut hash = Sha256::new();
        hash.update([0xaf]);
        hash.update(&bytes[1..unsigned_end]);
        Ok(Self {
            tenant,
            seq,
            prev_hash,
            hash: hash.finalize().into(),
        })
    }
    pub fn audit_key(&self, chain: &str) -> String {
        format!(
            "audit/{}/{}/{}-{}.cbor",
            self.tenant,
            chain,
            self.seq,
            hex::encode(self.hash)
        )
    }
}
pub fn partition(chain: &str) -> Result<String> {
    if chain.len() != 64
        || !chain
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(BAD);
    }
    Ok(format!("ENROLL#{chain}"))
}
/// The head condition MUST bind both previous sequence and hash, never an OR for successors.
pub fn transaction(
    records: &str,
    heads: &str,
    chain: &str,
    bytes: &[u8],
) -> Result<Vec<TransactWriteItem>> {
    let r = Record::decode(bytes)?;
    let pk = partition(chain)?;
    if r.seq == 0 && r.prev_hash != [0; 32] {
        return Err(BAD);
    }
    let record = Put::builder()
        .table_name(records)
        .item("pk", A::S(pk.clone()))
        .item("sk", A::S(format!("SEQ#{:020}", r.seq)))
        .item("record", A::B(Blob::new(bytes)))
        .condition_expression("attribute_not_exists(pk)")
        .build()
        .map_err(|_| BAD)?;
    let mut head = Put::builder()
        .table_name(heads)
        .item("pk", A::S(pk))
        .item("head_seq", A::N(r.seq.to_string()))
        .item("head_hash", A::B(Blob::new(r.hash)));
    if r.seq == 0 {
        head = head.condition_expression("attribute_not_exists(pk)");
    } else {
        head = head
            .condition_expression("head_seq = :prev AND head_hash = :prev_hash")
            .expression_attribute_values(":prev", A::N((r.seq - 1).to_string()))
            .expression_attribute_values(":prev_hash", A::B(Blob::new(r.prev_hash)));
    }
    Ok(vec![
        TransactWriteItem::builder().put(record).build(),
        TransactWriteItem::builder()
            .put(head.build().map_err(|_| BAD)?)
            .build(),
    ])
}
pub struct AwsStore {
    pub db: Client,
    pub s3: aws_sdk_s3::Client,
    pub records: String,
    pub heads: String,
    pub audit_bucket: String,
}
#[async_trait::async_trait]
pub trait JournalBackend: Send + Sync {
    async fn commit(&self, chain: &str, bytes: &[u8]) -> Result<()>;
    async fn audit(&self, chain: &str, bytes: &[u8]) -> Result<()>;
}
/// No rollback or retry after commit, including cancellation during the audit write.
pub async fn commit_then_audit(
    backend: &dyn JournalBackend,
    chain: &str,
    bytes: &[u8],
) -> Result<()> {
    backend.commit(chain, bytes).await?;
    if backend.audit(chain, bytes).await.is_err() {
        Event::AuditUnavailable.log();
        return Err(BAD);
    }
    Ok(())
}
#[async_trait::async_trait]
impl JournalBackend for AwsStore {
    async fn commit(&self, chain: &str, bytes: &[u8]) -> Result<()> {
        let items = transaction(&self.records, &self.heads, chain, bytes)?;
        self.db
            .transact_write_items()
            .set_transact_items(Some(items))
            .send()
            .await
            .map_err(|e| {
                if e.as_service_error()
                    .is_some_and(|e| e.is_transaction_canceled_exception())
                {
                    AppendError::Conflict
                } else {
                    BAD
                }
            })?;
        Ok(())
    }
    async fn audit(&self, chain: &str, bytes: &[u8]) -> Result<()> {
        let r = Record::decode(bytes)?;
        self.s3
            .put_object()
            .bucket(&self.audit_bucket)
            .key(r.audit_key(chain))
            .body(ByteStream::from(bytes.to_vec()))
            .content_type("application/cbor")
            .send()
            .await
            .map_err(|_| BAD)?;
        Ok(())
    }
}
#[async_trait::async_trait]
impl HeadStore for AwsStore {
    async fn append(&self, chain: &str, bytes: &[u8]) -> Result<()> {
        commit_then_audit(self, chain, bytes).await
    }
    async fn get_chain(&self, chain: &str) -> Result<Vec<Vec<u8>>> {
        // One item per page bounds SDK allocation even if storage has been corrupted.
        let pk = partition(chain)?;
        let mut cursor = None;
        let mut records = Vec::new();
        // A LastEvaluatedKey at the limit does not prove there is another item.
        // Permit one final bounded exhaustion probe after the 64th record.
        for _ in 0..=MAX_CHAIN {
            let page = self
                .db
                .query()
                .table_name(&self.records)
                .consistent_read(true)
                .key_condition_expression("pk = :pk")
                .expression_attribute_values(":pk", A::S(pk.clone()))
                .scan_index_forward(true)
                .limit(1)
                .set_exclusive_start_key(cursor)
                .send()
                .await
                .map_err(|_| BAD)?;
            for item in page.items() {
                if records.len() == MAX_CHAIN {
                    return Err(BAD);
                }
                let b = item
                    .get("record")
                    .and_then(|v| v.as_b().ok())
                    .ok_or(BAD)?
                    .as_ref();
                let r = Record::decode(b)?;
                if r.seq != records.len() as u64 {
                    return Err(BAD);
                }
                records.push(b.to_vec());
            }
            cursor = page.last_evaluated_key;
            if cursor.as_ref().is_none_or(|c| c.is_empty()) {
                return Ok(records);
            }
        }
        Err(BAD)
    }
}

/// Fixed object key configured by operator, never selected by a caller.
pub struct SealedStore {
    pub s3: aws_sdk_s3::Client,
    pub bucket: String,
    pub key: String,
}
impl SealedStore {
    pub async fn load(&self) -> Result<Vec<u8>> {
        self.load_for_boot(false).await?.ok_or(BAD)
    }
    pub async fn load_for_boot(&self, allow_first_boot: bool) -> Result<Option<Vec<u8>>> {
        let object = self
            .s3
            .get_object()
            .bucket(&self.bucket)
            .key(&self.key)
            .send()
            .await;
        let mut object = match object {
            Ok(object) => object,
            Err(error)
                if allow_first_boot
                    && error.as_service_error().is_some_and(|e| e.is_no_such_key()) =>
            {
                return Ok(None);
            }
            Err(_) => return Err(BAD),
        };
        if !object
            .content_length
            .is_some_and(|n| (1..=16384).contains(&n))
        {
            return Err(BAD);
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = object.body.try_next().await.map_err(|_| BAD)? {
            if bytes.len() + chunk.len() > 16384 {
                return Err(BAD);
            }
            bytes.extend_from_slice(&chunk);
        }
        if bytes.is_empty() {
            return Err(BAD);
        }
        Ok(Some(bytes))
    }
    pub async fn save_new(&self, bytes: Vec<u8>) -> Result<()> {
        if bytes.is_empty() || bytes.len() > 16384 {
            return Err(BAD);
        }
        self.s3
            .put_object()
            .bucket(&self.bucket)
            .key(&self.key)
            .if_none_match("*")
            .body(ByteStream::from(bytes))
            .send()
            .await
            .map_err(|_| BAD)?;
        Ok(())
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use std::collections::HashMap;
    #[derive(Default)]
    pub struct FakeStore(tokio::sync::Mutex<HashMap<String, Vec<Vec<u8>>>>);
    #[async_trait::async_trait]
    impl HeadStore for FakeStore {
        async fn get_chain(&self, chain: &str) -> Result<Vec<Vec<u8>>> {
            Ok(self.0.lock().await.get(chain).cloned().unwrap_or_default())
        }
        async fn append(&self, chain: &str, bytes: &[u8]) -> Result<()> {
            partition(chain)?;
            let r = Record::decode(bytes)?;
            let mut state = self.0.lock().await;
            let entries = state.entry(chain.into()).or_default();
            let prev = entries
                .last()
                .map(|b| Record::decode(b).map(|r| r.hash))
                .transpose()?
                .unwrap_or([0; 32]);
            if r.seq != entries.len() as u64 || r.prev_hash != prev {
                return Err(AppendError::Conflict);
            }
            entries.push(bytes.to_vec());
            Ok(())
        }
    }
    pub fn record(seq: u64, prev: [u8; 32]) -> Vec<u8> {
        let mut e = minicbor::Encoder::new(Vec::new());
        e.map(16)
            .unwrap()
            .u8(0)
            .unwrap()
            .u8(1)
            .unwrap()
            .u8(1)
            .unwrap()
            .str("tenant")
            .unwrap()
            .u8(2)
            .unwrap()
            .str("hold")
            .unwrap()
            .u8(3)
            .unwrap()
            .u8(1)
            .unwrap()
            .u8(4)
            .unwrap()
            .bytes(&[0; 32])
            .unwrap()
            .u8(5)
            .unwrap()
            .u64(seq)
            .unwrap()
            .u8(6)
            .unwrap()
            .bytes(&prev)
            .unwrap()
            .u8(7)
            .unwrap()
            .array(1)
            .unwrap()
            .u8(0)
            .unwrap()
            .u8(8)
            .unwrap()
            .str("req")
            .unwrap()
            .u8(9)
            .unwrap()
            .bytes(&[0; 32])
            .unwrap()
            .u8(10)
            .unwrap()
            .str("key")
            .unwrap()
            .u8(11)
            .unwrap()
            .array(3)
            .unwrap()
            .u8(1)
            .unwrap()
            .u8(2)
            .unwrap()
            .array(2)
            .unwrap();
        for id in ["a", "b"] {
            e.array(4)
                .unwrap()
                .str(id)
                .unwrap()
                .u8(1)
                .unwrap()
                .u8(1)
                .unwrap()
                .bytes(&[0; 32])
                .unwrap();
        }
        e.u8(12)
            .unwrap()
            .bytes(&[0; 32])
            .unwrap()
            .u8(13)
            .unwrap()
            .u8(1)
            .unwrap()
            .u8(14)
            .unwrap()
            .bytes(&[0; 32])
            .unwrap()
            .u8(15)
            .unwrap()
            .bytes(&[1; 64])
            .unwrap();
        e.into_writer()
    }
    #[tokio::test]
    async fn conditional_append_and_builder() {
        let chain = "a".repeat(64);
        let store = FakeStore::default();
        let first = record(0, [0; 32]);
        store.append(&chain, &first).await.unwrap();
        assert_eq!(
            store.append(&chain, &first).await,
            Err(AppendError::Conflict)
        );
        assert_eq!(
            store.append(&chain, &record(1, [0; 32])).await,
            Err(AppendError::Conflict)
        );
        let next = record(1, Record::decode(&first).unwrap().hash);
        store.append(&chain, &next).await.unwrap();
        assert_eq!(store.get_chain(&chain).await.unwrap().len(), 2);
        for (bytes, condition) in [
            (&first, "attribute_not_exists(pk)"),
            (&next, "head_seq = :prev AND head_hash = :prev_hash"),
        ] {
            let t = transaction("records", "heads", &chain, bytes).unwrap();
            assert_eq!(
                t[0].put.as_ref().unwrap().condition_expression(),
                Some("attribute_not_exists(pk)")
            );
            assert_eq!(
                t[1].put.as_ref().unwrap().condition_expression(),
                Some(condition)
            );
            assert_eq!(
                t[0].put.as_ref().unwrap().item()["pk"],
                A::S(format!("ENROLL#{chain}"))
            );
        }
    }
    #[test]
    fn strict_cbor_and_paths() {
        let bytes = record(0, [0; 32]);
        let r = Record::decode(&bytes).unwrap();
        assert!(r.audit_key(&"a".repeat(64)).starts_with("audit/tenant/"));
        for mut b in [bytes.clone(), bytes.clone(), bytes.clone()] {
            b.push(0);
            assert!(Record::decode(&b).is_err());
        }
        let mut b = bytes.clone();
        b[0] = 0xbf;
        assert!(Record::decode(&b).is_err());
        let mut b = bytes;
        b.splice(1..2, [0x18, 0]);
        assert!(Record::decode(&b).is_err());
        assert!(partition("../unsafe").is_err());
    }

    struct FailingAudit {
        store: FakeStore,
        attempts: tokio::sync::Mutex<usize>,
    }
    #[async_trait::async_trait]
    impl JournalBackend for FailingAudit {
        async fn commit(&self, chain: &str, bytes: &[u8]) -> Result<()> {
            self.store.append(chain, bytes).await
        }
        async fn audit(&self, _: &str, _: &[u8]) -> Result<()> {
            *self.attempts.lock().await += 1;
            Err(BAD)
        }
    }
    #[tokio::test]
    async fn audit_failure_preserves_committed_reservation_without_retry() {
        let backend = FailingAudit {
            store: FakeStore::default(),
            attempts: Default::default(),
        };
        let chain = "a".repeat(64);
        let bytes = record(0, [0; 32]);
        assert_eq!(
            commit_then_audit(&backend, &chain, &bytes).await,
            Err(AppendError::Unavailable)
        );
        assert_eq!(
            backend.store.get_chain(&chain).await.unwrap(),
            vec![bytes.clone()]
        );
        assert_eq!(
            commit_then_audit(&backend, &chain, &bytes).await,
            Err(AppendError::Conflict)
        );
        assert_eq!(*backend.attempts.lock().await, 1);
    }
}
