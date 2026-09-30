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
    head: Option<Head>,
    advance_after_chain: bool,
    chain_read: Mutex<bool>,
}
#[async_trait::async_trait]
impl Backend for Fake {
    async fn head(&self, _: &str) -> Result<Option<Head>> {
        let mut head = self.head.clone();
        if self.advance_after_chain && *self.chain_read.lock().unwrap() {
            if let Some(head) = &mut head {
                head.seq += 1;
                head.hash = [9; 32];
            }
        }
        Ok(head)
    }
    async fn chain(&self, _: &str) -> Result<Vec<Vec<u8>>> {
        *self.chain_read.lock().unwrap() = true;
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
    backend.head = Some(head.clone());
    (
        Monitor {
            backend,
            tenant: "tenant".into(),
            key: TrustedKeys::Legacy(ledger.public_key()),
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

#[tokio::test]
async fn inserts_require_head_and_identical_audit_object() {
    for attack in 0..3 {
        let (mut monitor, head) = fixture().await;
        match attack {
            0 => monitor.backend.head = None,
            1 => monitor.backend.objects.clear(),
            _ => {
                for bytes in monitor.backend.objects.values_mut() {
                    bytes[0] ^= 1;
                }
            }
        }
        insert(&monitor, &head, 0).await;
        assert_eq!(
            *monitor.backend.notices.lock().unwrap(),
            [if attack == 0 {
                Metric::LedgerIntegrityFailure
            } else {
                Metric::AuditMismatch
            }]
        );
    }
}

#[tokio::test]
async fn reconciliation_finds_records_without_heads() {
    let (mut monitor, head) = fixture().await;
    monitor.backend.head = None;
    monitor.sweep_record_chain(&head.chain).await.unwrap();
    assert_eq!(
        *monitor.backend.notices.lock().unwrap(),
        [Metric::LedgerIntegrityFailure]
    );
}

#[tokio::test]
async fn insert_uses_head_prefix_despite_concurrent_append() {
    let (mut monitor, head) = fixture().await;
    monitor.backend.advance_after_chain = true;
    insert(&monitor, &head, 0).await;
    assert!(monitor.backend.notices.lock().unwrap().is_empty());
    assert_eq!(
        *monitor.backend.metrics.lock().unwrap(),
        [Metric::HoldCreated]
    );
}

#[tokio::test]
async fn insert_rejects_head_behind_record_or_with_wrong_hash() {
    for wrong_hash in [false, true] {
        let (mut monitor, head) = fixture().await;
        if wrong_hash {
            monitor.backend.head.as_mut().unwrap().hash[0] ^= 1;
        } else {
            monitor.backend.head.as_mut().unwrap().seq = 0;
        }
        insert(&monitor, &head, 3).await;
        assert_eq!(
            *monitor.backend.notices.lock().unwrap(),
            [Metric::LedgerIntegrityFailure]
        );
    }
}

#[tokio::test]
async fn key_map_accepts_rotation_and_rejects_unknown_ids() {
    let old_keys = generate_escrow_key_pair().unwrap();
    let new_keys = generate_escrow_key_pair().unwrap();
    let mut old = Ledger::new(&old_keys, "K1".into(), [0; 32]).unwrap();
    let mut new = Ledger::new(&new_keys, "K2".into(), [0; 32]).unwrap();
    new.add_previous_key("K1".into(), &old_keys).unwrap();
    let enrollment = Enrollment::new("tenant".into(), "did:test", 1, [2; 32]);
    let store = FakeHeadStore::default();
    old.transition(
        &store,
        &enrollment,
        &operation("create"),
        Event::HoldCreated,
    )
    .await
    .unwrap();
    new.transition(&store, &enrollment, &operation("release"), Event::Released)
        .await
        .unwrap();
    let bytes: Vec<_> = store
        .get_chain(&enrollment.chain_id())
        .await
        .unwrap()
        .iter()
        .map(|r| r.canonical_bytes().unwrap())
        .collect();
    let value = serde_json::json!({
        "K1": hex::encode(old.public_key().to_encoded_point(false).as_bytes()),
        "K2": hex::encode(new.public_key().to_encoded_point(false).as_bytes()),
    })
    .to_string();
    let mut monitor = Monitor {
        backend: Fake::default(),
        tenant: "tenant".into(),
        key: TrustedKeys::parse(&value).unwrap(),
    };
    assert!(monitor.verify(&enrollment.chain_id(), &bytes).is_ok());
    if let TrustedKeys::ById(keys) = &mut monitor.key {
        keys.remove("K1");
    }
    assert!(matches!(
        monitor.verify(&enrollment.chain_id(), &bytes),
        Err(Error::Integrity)
    ));
    let legacy = hex::encode(old.public_key().to_encoded_point(false).as_bytes());
    monitor.key = TrustedKeys::parse(&legacy).unwrap();
    assert!(monitor.verify(&enrollment.chain_id(), &bytes[..1]).is_ok());
    assert!(monitor.verify(&enrollment.chain_id(), &bytes).is_err());
    for invalid in ["{}", "[]", "{\"key\":\"04\"}", &" ".repeat(2049)] {
        assert!(TrustedKeys::parse(invalid).is_err());
    }
}
