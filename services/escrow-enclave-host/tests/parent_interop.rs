use aws_credential_types::{Credentials, provider::SharedCredentialsProvider};
use escrow_enclave::{
    ledger::{AppendError as ClientError, Event, LedgerRecord},
    server::parent,
    time::{SourceEvidence, TimeEvidence, TrustedInterval, relay::exchange_stream},
};
use escrow_enclave_host::{
    framing,
    relay::Relay,
    services::{Boot, Services},
    storage::{self, AppendError, HeadStore, JournalBackend, Record, SealedStorage},
};
use std::{
    collections::HashMap,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, SystemTime},
};
use tokio::{
    io::{AsyncWriteExt, DuplexStream},
    sync::Mutex,
};

#[derive(Default)]
struct Memory {
    chains: Mutex<HashMap<String, Vec<Vec<u8>>>>,
    audit_fails: AtomicBool,
}
#[async_trait::async_trait]
impl JournalBackend for Memory {
    async fn commit(&self, chain: &str, bytes: &[u8]) -> Result<(), AppendError> {
        storage::partition(chain)?;
        let record = Record::decode(bytes)?;
        let mut chains = self.chains.lock().await;
        let entries = chains.entry(chain.into()).or_default();
        let previous = entries
            .last()
            .map(|b| Record::decode(b).map(|r| r.hash))
            .transpose()?
            .unwrap_or([0; 32]);
        if record.seq != entries.len() as u64 || record.prev_hash != previous {
            return Err(AppendError::Conflict);
        }
        entries.push(bytes.to_vec());
        Ok(())
    }
    async fn audit(&self, _: &str, _: &[u8]) -> Result<(), AppendError> {
        if self.audit_fails.load(Ordering::SeqCst) {
            Err(AppendError::Unavailable)
        } else {
            Ok(())
        }
    }
}
#[async_trait::async_trait]
impl HeadStore for Memory {
    async fn get_chain(&self, chain: &str) -> Result<Vec<Vec<u8>>, AppendError> {
        Ok(self
            .chains
            .lock()
            .await
            .get(chain)
            .cloned()
            .unwrap_or_default())
    }
    async fn append(&self, chain: &str, bytes: &[u8]) -> Result<(), AppendError> {
        storage::commit_then_audit(self, chain, bytes).await
    }
}
#[derive(Default)]
struct Sealed(Mutex<Option<Vec<u8>>>);
#[async_trait::async_trait]
impl SealedStorage for Sealed {
    async fn load_for_boot(&self, allow: bool) -> Result<Option<Vec<u8>>, AppendError> {
        let value = self.0.lock().await.clone();
        if value.is_none() && !allow {
            return Err(AppendError::Unavailable);
        }
        Ok(value)
    }
    async fn save_new(&self, bytes: Vec<u8>) -> Result<(), AppendError> {
        let mut value = self.0.lock().await;
        if value.is_some() || bytes.is_empty() || bytes.len() > 16384 {
            return Err(AppendError::Unavailable);
        }
        *value = Some(bytes);
        Ok(())
    }
}
fn services(memory: Arc<Memory>) -> Arc<Services<Sealed>> {
    Arc::new(Services {
        store: memory,
        boot: Arc::new(Boot {
            credentials: SharedCredentialsProvider::new(Credentials::new(
                "test-access",
                "test-secret",
                Some("test-session".into()),
                Some(SystemTime::now() + Duration::from_secs(600)),
                "interop",
            )),
            sealed: Sealed::default(),
            key_id: "key".into(),
            allow_first_boot: true,
        }),
    })
}
fn connect(
    services: &Arc<Services<Sealed>>,
) -> (DuplexStream, tokio::task::JoinHandle<std::io::Result<()>>) {
    let (mut host, client) = tokio::io::duplex(1024);
    let services = services.clone();
    (
        client,
        tokio::spawn(async move { services.serve(&mut host).await }),
    )
}
fn record(seq: u64, prev_hash: [u8; 32]) -> LedgerRecord {
    // Structural transport fixture; policy authentication is tested separately.
    LedgerRecord {
        version: 1,
        tenant: "tenant".into(),
        enrollment_id: [0; 32],
        hold_id: format!("hold-{seq}"),
        enrollment_epoch: 1,
        blob_hash: [0; 32],
        seq,
        prev_hash,
        event: Event::HoldCreated,
        request_id: format!("request-{seq}"),
        measurement: [1; 32],
        key_id: "key".into(),
        time_evidence: TimeEvidence {
            interval: TrustedInterval { lo_ms: 1, hi_ms: 2 },
            sources: ["a", "b"]
                .into_iter()
                .map(|id| SourceEvidence {
                    server_id: id.into(),
                    midpoint_ms: 1,
                    radius_ms: 1,
                    response_hash: [0; 32],
                })
                .collect(),
        },
        payload_hash: [0; 32],
        policy_version: 1,
        sig: [1; 64],
    }
}

#[tokio::test]
async fn first_boot_persist_reload_and_credentials() {
    let services = services(Arc::new(Memory::default()));
    let (mut client, task) = connect(&services);
    let initial = parent::boot(&mut client, "key").await.unwrap();
    assert!(initial.sealed.is_none());
    assert_eq!(initial.access_key_id, "test-access");
    assert_eq!(initial.secret_access_key, "test-secret");
    assert_eq!(initial.session_token, "test-session");
    task.await.unwrap().unwrap();
    for succeeds in [true, false] {
        let (mut client, task) = connect(&services);
        assert_eq!(
            parent::persist_key(&mut client, "key", b"sealed-key")
                .await
                .is_ok(),
            succeeds
        );
        task.await.unwrap().unwrap();
    }
    let (mut client, task) = connect(&services);
    assert_eq!(
        parent::boot(&mut client, "key")
            .await
            .unwrap()
            .sealed
            .as_deref(),
        Some("c2VhbGVkLWtleQ==")
    );
    task.await.unwrap().unwrap();
    let (mut client, task) = connect(&services);
    assert!(parent::boot(&mut client, "wrong-key").await.is_err());
    assert!(task.await.unwrap().is_err());
}

#[tokio::test]
async fn chain_boundary_conflicts_and_audit_failure() {
    let memory = Arc::new(Memory::default());
    let services = services(memory.clone());
    let chain = "a".repeat(64);
    let mut expected = Vec::new();
    let mut previous = [0; 32];
    for seq in 0..64 {
        let (mut client, task) = connect(&services);
        assert_eq!(
            parent::get_chain(&mut client, &chain).await.unwrap(),
            expected
        );
        task.await.unwrap().unwrap();
        let record = record(seq, previous);
        let (mut client, task) = connect(&services);
        parent::append(&mut client, &chain, &record).await.unwrap();
        task.await.unwrap().unwrap();
        previous = Record::decode(&record.canonical_bytes().unwrap())
            .unwrap()
            .hash;
        expected.push(record);
    }
    let (mut client, task) = connect(&services);
    assert_eq!(
        parent::get_chain(&mut client, &chain).await.unwrap(),
        expected
    );
    task.await.unwrap().unwrap();
    for record in [expected[0].clone(), record(63, [0; 32])] {
        let (mut client, task) = connect(&services);
        assert_eq!(
            parent::append(&mut client, &chain, &record).await,
            Err(ClientError::Conflict)
        );
        task.await.unwrap().unwrap();
    }
    memory.audit_fails.store(true, Ordering::SeqCst);
    let other = "b".repeat(64);
    let (mut client, task) = connect(&services);
    assert_eq!(
        parent::append(&mut client, &other, &expected[0]).await,
        Err(ClientError::Unavailable)
    );
    task.await.unwrap().unwrap();
    let (mut client, task) = connect(&services);
    assert_eq!(
        parent::get_chain(&mut client, &other).await.unwrap(),
        vec![expected[0].clone()]
    );
    task.await.unwrap().unwrap();
}

#[tokio::test]
async fn malformed_and_oversized_frames_fail_closed() {
    let services = services(Arc::new(Memory::default()));
    for size in [0, 32769, u32::MAX] {
        let (mut client, task) = connect(&services);
        client.write_u32(size).await.unwrap();
        assert!(task.await.unwrap().is_err());
    }
    let (mut client, task) = connect(&services);
    framing::write(&mut client, b"not-json", 32768)
        .await
        .unwrap();
    assert!(task.await.unwrap().is_err());
    for reply in [
        65u32.to_be_bytes().to_vec(),
        [1u32.to_be_bytes(), 8193u32.to_be_bytes()].concat(),
        [1u32.to_be_bytes(), 1u32.to_be_bytes()]
            .concat()
            .into_iter()
            .chain([0xff])
            .collect(),
    ] {
        let (mut host, mut client) = tokio::io::duplex(1024);
        let task = tokio::spawn(async move {
            framing::read(&mut host, 32768).await.unwrap();
            host.write_all(&reply).await.unwrap();
        });
        assert!(
            parent::get_chain(&mut client, &"a".repeat(64))
                .await
                .is_err()
        );
        task.await.unwrap();
    }
    for reply in [b"not-json".to_vec(), vec![]] {
        let (mut host, mut client) = tokio::io::duplex(1024);
        let task = tokio::spawn(async move {
            framing::read(&mut host, 32768).await.unwrap();
            host.write_u32(if reply.is_empty() {
                262145
            } else {
                reply.len() as u32
            })
            .await
            .unwrap();
            host.write_all(&reply).await.unwrap();
        });
        assert!(parent::boot(&mut client, "key").await.is_err());
        task.await.unwrap();
    }
}

#[tokio::test]
async fn real_relay_client_to_host_to_udp_and_back() {
    for size in [1024, 1025] {
        let udp = tokio::net::UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let endpoint = udp.local_addr().unwrap().to_string();
        let relay =
            Relay::configured([("a".into(), endpoint.clone()), ("b".into(), endpoint)].into())
                .unwrap();
        let responder = tokio::spawn(async move {
            let mut bytes = [0; 1024];
            let (n, peer) = udp.recv_from(&mut bytes).await.unwrap();
            assert_eq!(&bytes[..n], &[82, 79, 0, 255]);
            udp.send_to(&vec![7; size], peer).await.unwrap();
        });
        let (mut host, mut client) = tokio::io::duplex(1024);
        let task = tokio::spawn(async move { relay.serve(&mut host).await });
        let result = exchange_stream(&mut client, "a", vec![82, 79, 0, 255]).await;
        if size == 1024 {
            assert_eq!(result.unwrap(), vec![7; 1024]);
        } else {
            assert!(result.is_err());
        }
        assert_eq!(task.await.unwrap().is_ok(), size == 1024);
        responder.await.unwrap();
    }
}
