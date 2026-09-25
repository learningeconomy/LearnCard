use super::*;
use escrow_enclave::{
    crypto::generate_escrow_key_pair,
    ledger::{FakeHeadStore, HeadStore, Operation},
    time::{SourceEvidence, TimeEvidence, TrustedInterval},
};
use std::{collections::HashMap, sync::Mutex};

#[derive(Default)]
struct Fake {
    records: Vec<Vec<u8>>,
    objects: HashMap<String, Vec<u8>>,
    metrics: Mutex<Vec<Metric>>,
    notices: Mutex<Vec<Metric>>,
    unavailable: bool,
}
#[async_trait::async_trait]
impl Backend for Fake {
    async fn chain(&self, _: &str) -> Result<Vec<Vec<u8>>> {
        if self.unavailable {
            Err(Error::Unavailable)
        } else {
            Ok(self.records.clone())
        }
    }
    async fn audit(&self, key: &str) -> Result<Option<Vec<u8>>> {
        Ok(self.objects.get(key).cloned())
    }
    async fn metric(&self, metric: Metric) -> Result<()> {
        self.metrics.lock().unwrap().push(metric);
        Ok(())
    }
    async fn notify(&self, metric: Metric) -> Result<()> {
        self.notices.lock().unwrap().push(metric);
        Ok(())
    }
}

fn operation(id: &str) -> Operation {
    Operation {
        hold_id: "sensitive-hold".into(),
        request_id: id.into(),
        payload_hash: [1; 32],
        time_evidence: TimeEvidence {
            interval: TrustedInterval {
                lo_ms: 100,
                hi_ms: 101,
            },
            sources: ["a", "b"]
                .into_iter()
                .map(|id| SourceEvidence {
                    server_id: id.into(),
                    midpoint_ms: 100,
                    radius_ms: 1,
                    response_hash: [0; 32],
                })
                .collect(),
        },
    }
}

async fn fixture() -> (Monitor<Fake>, Head) {
    let keys = generate_escrow_key_pair().unwrap();
    let mut ledger = Ledger::new(&keys, "key".into(), [0; 32]).unwrap();
    let enrollment = Enrollment::new("tenant".into(), "did:example:private", 1, [2; 32]);
    let store = FakeHeadStore::default();
    ledger
        .transition(
            &store,
            &enrollment,
            &operation("create"),
            Event::HoldCreated,
        )
        .await
        .unwrap();
    ledger
        .verify_pin(&store, &enrollment, &operation("pin"), || false)
        .await
        .unwrap();
    ledger
        .transition(&store, &enrollment, &operation("release"), Event::Released)
        .await
        .unwrap();
    let records = store.get_chain(&enrollment.chain_id()).await.unwrap();
    let mut backend = Fake::default();
    for record in &records {
        let bytes = record.canonical_bytes().unwrap();
        backend.records.push(bytes.clone());
        backend.objects.insert(
            format!(
                "audit/tenant/{}/{}-{}.cbor",
                enrollment.chain_id(),
                record.seq,
                hex::encode(record.record_hash().unwrap())
            ),
            bytes,
        );
    }
    let last = records.last().unwrap();
    let head = Head {
        chain: enrollment.chain_id(),
        seq: last.seq,
        hash: last.record_hash().unwrap(),
    };
    (
        Monitor {
            backend,
            tenant: "tenant".into(),
            key: ledger.public_key(),
        },
        head,
    )
}

async fn insert(monitor: &Monitor<Fake>, head: &Head, seq: usize) {
    monitor
        .stream(
            "INSERT",
            &format!("ENROLL#{}", head.chain),
            &format!("SEQ#{seq:020}"),
            &monitor.backend.records[seq],
        )
        .await
        .unwrap();
}

#[tokio::test]
async fn valid_chain_emits_only_inserted_event_metrics() {
    let (monitor, head) = fixture().await;
    for seq in 0..4 {
        insert(&monitor, &head, seq).await;
    }
    assert_eq!(
        *monitor.backend.metrics.lock().unwrap(),
        [
            Metric::HoldCreated,
            Metric::PinAttemptReserved,
            Metric::PinAttemptFailed,
            Metric::Released
        ]
    );
    assert!(monitor.backend.notices.lock().unwrap().is_empty());
    monitor.sweep_head(&head).await.unwrap();
    assert!(monitor.backend.notices.lock().unwrap().is_empty());
    assert_eq!(Metric::from(Event::Cancelled), Metric::Cancelled);
    assert_eq!(Metric::from(Event::PinLocked), Metric::PinLocked);
    assert_eq!(
        Metric::from(Event::PinAttemptSucceeded),
        Metric::PinAttemptSucceeded
    );
}

#[tokio::test]
async fn tampered_record_broken_prev_hash_and_bad_signature_alarm() {
    for attack in 0..3 {
        let (mut monitor, head) = fixture().await;
        let mut record = LedgerRecord::decode(&monitor.backend.records[1]).unwrap();
        match attack {
            0 => record.payload_hash[0] ^= 1,
            1 => record.prev_hash[0] ^= 1,
            _ => record.sig[0] ^= 1,
        }
        monitor.backend.records[1] = record.canonical_bytes().unwrap();
        insert(&monitor, &head, 1).await;
        assert_eq!(
            *monitor.backend.notices.lock().unwrap(),
            [Metric::LedgerIntegrityFailure]
        );
    }
}

#[tokio::test]
async fn missing_middle_and_wrong_key_and_transplant_alarm() {
    let (mut monitor, head) = fixture().await;
    monitor.backend.records.remove(1);
    insert(&monitor, &head, 0).await;
    assert_eq!(
        *monitor.backend.notices.lock().unwrap(),
        [Metric::LedgerIntegrityFailure]
    );
    let (mut monitor, head) = fixture().await;
    monitor.key = fixture().await.0.key;
    insert(&monitor, &head, 0).await;
    assert_eq!(
        *monitor.backend.notices.lock().unwrap(),
        [Metric::LedgerIntegrityFailure]
    );
    let (monitor, mut head) = fixture().await;
    head.chain = "a".repeat(64);
    insert(&monitor, &head, 0).await;
    assert_eq!(
        *monitor.backend.notices.lock().unwrap(),
        [Metric::LedgerIntegrityFailure]
    );
}

#[tokio::test]
async fn modify_remove_do_not_read_storage_or_parse_images() {
    let (mut monitor, _) = fixture().await;
    monitor.backend.unavailable = true;
    for action in ["MODIFY", "REMOVE"] {
        monitor
            .stream(action, "private-did", "sensitive-hold", &[])
            .await
            .unwrap();
    }
    assert_eq!(
        *monitor.backend.notices.lock().unwrap(),
        [Metric::LedgerIntegrityFailure; 2]
    );
    assert_eq!(
        *monitor.backend.metrics.lock().unwrap(),
        [Metric::LedgerIntegrityFailure; 2]
    );
}

#[tokio::test]
async fn missing_and_byte_mismatched_s3_objects_alarm() {
    for missing in [true, false] {
        let (mut monitor, head) = fixture().await;
        let key = monitor.backend.objects.keys().next().unwrap().clone();
        if missing {
            monitor.backend.objects.remove(&key);
        } else {
            monitor.backend.objects.get_mut(&key).unwrap()[0] ^= 1;
        }
        monitor.sweep_head(&head).await.unwrap();
        assert_eq!(
            *monitor.backend.notices.lock().unwrap(),
            [Metric::AuditMismatch]
        );
    }
}

#[tokio::test]
async fn stream_image_must_match_storage_and_sort_key() {
    let (monitor, head) = fixture().await;
    monitor
        .stream(
            "INSERT",
            &format!("ENROLL#{}", head.chain),
            "SEQ#1",
            &monitor.backend.records[0],
        )
        .await
        .unwrap();
    let other = fixture().await.0.backend.records[0].clone();
    monitor
        .stream(
            "INSERT",
            &format!("ENROLL#{}", head.chain),
            "SEQ#00000000000000000000",
            &other,
        )
        .await
        .unwrap();
    assert_eq!(
        *monitor.backend.notices.lock().unwrap(),
        [Metric::LedgerIntegrityFailure; 2]
    );
}

#[tokio::test]
async fn head_binding_and_storage_failure() {
    let (mut monitor, mut head) = fixture().await;
    head.hash[0] ^= 1;
    monitor.sweep_head(&head).await.unwrap();
    assert_eq!(
        *monitor.backend.notices.lock().unwrap(),
        [Metric::LedgerIntegrityFailure]
    );
    monitor.backend.unavailable = true;
    assert_eq!(monitor.sweep_head(&head).await, Err(Error::Unavailable));
}

#[tokio::test]
async fn telemetry_and_errors_have_no_pii() {
    let (monitor, head) = fixture().await;
    monitor
        .stream("REMOVE", "did:example:private", "sensitive-hold", b"secret")
        .await
        .unwrap();
    let output = format!(
        "{:?}{:?}{}{}",
        monitor.backend.metrics.lock().unwrap(),
        monitor.backend.notices.lock().unwrap(),
        Error::Integrity,
        Error::Unavailable
    );
    for forbidden in ["did:", "sensitive-hold", "secret", &head.chain] {
        assert!(!output.contains(forbidden));
    }
    // Application has no logging calls; only closed enums cross the telemetry seam.
    for source in [
        include_str!("lib.rs"),
        include_str!("aws.rs"),
        include_str!("main.rs"),
    ] {
        assert!(!source.contains("println!"));
        assert!(!source.contains("tracing::"));
    }
}
