//! Independent, read-only detection. No record identifiers or SDK errors enter telemetry.
use escrow_enclave::ledger::{Enrollment, Event, Ledger, LedgerRecord, MAX_CHAIN_RECORDS};
use p256::ecdsa::VerifyingKey;
use std::collections::BTreeMap;

pub mod aws;

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum Error {
    #[error("monitor unavailable")]
    Unavailable,
    #[error("invalid monitor configuration")]
    Configuration,
    #[error("ledger integrity failure")]
    Integrity,
}
pub type Result<T> = std::result::Result<T, Error>;

/// Only fixed metric names and an operator-configured tenant leave the monitor.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Metric {
    LedgerIntegrityFailure,
    AuditMismatch,
    HoldCreated,
    Released,
    PinAttemptReserved,
    PinAttemptFailed,
    PinAttemptSucceeded,
    PinLocked,
    Cancelled,
    Carried,
    SweepCompleted,
}
impl Metric {
    pub fn name(self) -> &'static str {
        match self {
            Self::LedgerIntegrityFailure => "LedgerIntegrityFailure",
            Self::AuditMismatch => "AuditMismatch",
            Self::HoldCreated => "HoldCreated",
            Self::Released => "Released",
            Self::PinAttemptReserved => "PinAttemptReserved",
            Self::PinAttemptFailed => "PinAttemptFailed",
            Self::PinAttemptSucceeded => "PinAttemptSucceeded",
            Self::PinLocked => "PinLocked",
            Self::Cancelled => "Cancelled",
            Self::Carried => "Carried",
            Self::SweepCompleted => "SweepCompleted",
        }
    }
}
impl From<Event> for Metric {
    fn from(event: Event) -> Self {
        match event {
            Event::HoldCreated => Self::HoldCreated,
            Event::Released => Self::Released,
            Event::PinAttemptReserved { .. } => Self::PinAttemptReserved,
            Event::PinAttemptFailed => Self::PinAttemptFailed,
            Event::PinAttemptSucceeded => Self::PinAttemptSucceeded,
            Event::PinLocked => Self::PinLocked,
            Event::Cancelled => Self::Cancelled,
            Event::Carried { .. } => Self::Carried,
        }
    }
}

#[derive(Clone)]
pub struct Head {
    pub chain: String,
    pub seq: u64,
    pub hash: [u8; 32],
}

#[async_trait::async_trait]
pub trait Backend: Send + Sync {
    async fn head(&self, chain: &str) -> Result<Option<Head>>;
    async fn chain(&self, chain: &str) -> Result<Vec<Vec<u8>>>;
    async fn audit(&self, key: &str) -> Result<Option<Vec<u8>>>;
    async fn metric(&self, metric: Metric) -> Result<()>;
    async fn notify(&self, metric: Metric) -> Result<()>;
}

pub struct Monitor<B> {
    pub backend: B,
    pub tenant: String,
    pub key: TrustedKeys,
}

pub enum TrustedKeys {
    Legacy(VerifyingKey),
    ById(BTreeMap<String, VerifyingKey>),
}

impl TrustedKeys {
    /// Bounded security-owned SSM trust anchor; never loaded from the parent.
    pub fn parse(value: &str) -> Result<Self> {
        fn key(value: &str, lowercase: bool) -> Result<VerifyingKey> {
            if value.len() != 130
                || !value.starts_with("04")
                || (lowercase
                    && !value
                        .bytes()
                        .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)))
            {
                return Err(Error::Configuration);
            }
            VerifyingKey::from_sec1_bytes(&hex::decode(value).map_err(|_| Error::Configuration)?)
                .map_err(|_| Error::Configuration)
        }
        if value.len() == 130 && !value.starts_with('{') {
            return Ok(Self::Legacy(key(value, false)?));
        }
        if value.len() > 2048 {
            return Err(Error::Configuration);
        }
        let values: BTreeMap<String, String> =
            serde_json::from_str(value).map_err(|_| Error::Configuration)?;
        if values.is_empty() || values.len() > 4 {
            return Err(Error::Configuration);
        }
        let mut keys = BTreeMap::new();
        for (id, value) in values {
            if id.is_empty()
                || id.len() > 128
                || !id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
            {
                return Err(Error::Configuration);
            }
            keys.insert(id, key(&value, true)?);
        }
        Ok(Self::ById(keys))
    }
}

pub fn chain_from_pk(pk: &str) -> Result<&str> {
    let chain = pk.strip_prefix("ENROLL#").ok_or(Error::Integrity)?;
    if chain.len() != 64
        || !chain
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(Error::Integrity);
    }
    Ok(chain)
}

impl<B: Backend> Monitor<B> {
    pub async fn alarm(&self, metric: Metric) -> Result<()> {
        // Attempt both independently; an unavailable sink must cause Lambda retry.
        let (metric_result, sns_result) =
            tokio::join!(self.backend.metric(metric), self.backend.notify(metric));
        metric_result.and(sns_result)
    }

    fn verify(&self, chain: &str, bytes: &[Vec<u8>]) -> Result<Vec<LedgerRecord>> {
        if bytes.is_empty() || bytes.len() > MAX_CHAIN_RECORDS {
            return Err(Error::Integrity);
        }
        let records: Vec<_> = bytes
            .iter()
            .map(|b| LedgerRecord::decode(b))
            .collect::<std::result::Result<_, _>>()
            .map_err(|_| Error::Integrity)?;
        let first = &records[0];
        let enrollment = Enrollment {
            tenant: first.tenant.clone(),
            enrollment_id: first.enrollment_id,
            epoch: first.enrollment_epoch,
            blob_hash: first.blob_hash,
        };
        if first.tenant != self.tenant || enrollment.chain_id() != chain {
            return Err(Error::Integrity);
        }
        match &self.key {
            TrustedKeys::Legacy(key) => Ledger::verify_chain(&records, &enrollment, key),
            TrustedKeys::ById(keys) => Ledger::verify_chain_with_keys(&records, &enrollment, keys),
        }
        .map_err(|_| Error::Integrity)?;
        Ok(records)
    }

    /// Validate one cross-chain edge, not a recursive ancestry walk. Each source
    /// chain's own first record already commits to its inherited floor.
    async fn verify_carry(&self, records: &[LedgerRecord]) -> Result<()> {
        let first = records.first().ok_or(Error::Integrity)?;
        let Event::Carried {
            source_chain_id,
            source_head_hash,
            attempts_carried,
        } = first.event
        else {
            return Ok(());
        };
        let chain = hex::encode(source_chain_id);
        let bytes = self.backend.chain(&chain).await?;
        if source_head_hash == [0; 32] {
            // Zero denotes the empty prefix, which has neither carry nor attempts.
            // A source may have acquired records since that observation.
            if attempts_carried != 0 {
                return Err(Error::Integrity);
            }
            if !bytes.is_empty() {
                let source = self.verify(&chain, &bytes)?;
                if source[0].enrollment_id != first.enrollment_id
                    || matches!(source[0].event, Event::Carried { .. })
                {
                    return Err(Error::Integrity);
                }
            }
            return Ok(());
        }
        let source = self.verify(&chain, &bytes)?;
        if source[0].enrollment_id != first.enrollment_id {
            return Err(Error::Integrity);
        }
        let index = source
            .iter()
            .position(|r| r.record_hash().ok() == Some(source_head_hash))
            .ok_or(Error::Integrity)?;
        let floor = match source[0].event {
            Event::Carried {
                attempts_carried, ..
            } => attempts_carried,
            _ => 0,
        };
        let used = source[..=index]
            .iter()
            .filter(|r| matches!(r.event, Event::PinAttemptReserved { .. }))
            .count() as u8;
        if attempts_carried != floor.saturating_add(used).min(10) {
            return Err(Error::Integrity);
        }
        Ok(())
    }

    /// MODIFY/REMOVE alarm without parsing images or making storage reads.
    pub async fn stream(&self, action: &str, pk: &str, sk: &str, image: &[u8]) -> Result<()> {
        if matches!(action, "MODIFY" | "REMOVE") {
            return self.alarm(Metric::LedgerIntegrityFailure).await;
        }
        if action != "INSERT" {
            return self.alarm(Metric::LedgerIntegrityFailure).await;
        }
        let result = self.insert(pk, sk, image).await;
        match result {
            Err(Error::Integrity) => self.alarm(Metric::LedgerIntegrityFailure).await,
            other => other,
        }
    }

    async fn insert(&self, pk: &str, sk: &str, image: &[u8]) -> Result<()> {
        let chain = chain_from_pk(pk)?;
        // Read the head first: a subsequent append may extend the chain, but
        // this captured head must remain a valid prefix. The reverse order
        // would falsely alarm when a valid head advances beyond our snapshot.
        let head = self.backend.head(chain).await?.ok_or(Error::Integrity)?;
        let bytes = self.backend.chain(chain).await?;
        let records = self.verify(chain, &bytes)?;
        self.verify_carry(&records).await?;
        let incoming = LedgerRecord::decode(image).map_err(|_| Error::Integrity)?;
        if sk != format!("SEQ#{:020}", incoming.seq)
            || bytes.get(incoming.seq as usize).map(Vec::as_slice) != Some(image)
        {
            return Err(Error::Integrity);
        }
        if head.chain != chain
            || head.seq < incoming.seq
            || records
                .get(head.seq as usize)
                .and_then(|r| r.record_hash().ok())
                != Some(head.hash)
        {
            return Err(Error::Integrity);
        }
        if !self.audit_matches(chain, &incoming, image).await? {
            return self.alarm(Metric::AuditMismatch).await;
        }
        self.backend
            .metric(records[incoming.seq as usize].event.into())
            .await
    }

    async fn audit_matches(
        &self,
        chain: &str,
        record: &LedgerRecord,
        bytes: &[u8],
    ) -> Result<bool> {
        let hash = record.record_hash().map_err(|_| Error::Integrity)?;
        let key = format!(
            "audit/{}/{}/{}-{}.cbor",
            self.tenant,
            chain,
            record.seq,
            hex::encode(hash)
        );
        // DynamoDB commit precedes the S3 put. Retry absence only, never mismatched bytes.
        for attempt in 0..3 {
            if let Some(audit) = self.backend.audit(&key).await? {
                return Ok(audit == bytes);
            }
            if attempt < 2 {
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
        }
        Ok(false)
    }

    /// Called for every record partition encountered by the bounded paginated sweep.
    pub async fn sweep_record_chain(&self, chain: &str) -> Result<()> {
        match self.backend.head(chain).await? {
            Some(head) => self.sweep_head(&head).await,
            None => self.alarm(Metric::LedgerIntegrityFailure).await,
        }
    }

    /// Snapshot head may lag concurrent appends: it must match a verified prefix.
    pub async fn sweep_head(&self, head: &Head) -> Result<()> {
        match self.check_head(head).await {
            Err(Error::Integrity) => self.alarm(Metric::LedgerIntegrityFailure).await,
            other => other,
        }
    }

    async fn check_head(&self, head: &Head) -> Result<()> {
        let bytes = self.backend.chain(&head.chain).await?;
        let records = self.verify(&head.chain, &bytes)?;
        self.verify_carry(&records).await?;
        if records
            .get(head.seq as usize)
            .and_then(|r| r.record_hash().ok())
            != Some(head.hash)
        {
            return Err(Error::Integrity);
        }
        for (record, bytes) in records.iter().zip(bytes.iter()) {
            if !self.audit_matches(&head.chain, record, bytes).await? {
                self.alarm(Metric::AuditMismatch).await?;
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests;
