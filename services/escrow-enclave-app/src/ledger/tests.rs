use super::*;
use crate::{
    crypto::generate_escrow_key_pair,
    time::{SourceEvidence, TrustedInterval},
};
use std::sync::atomic::{AtomicBool, Ordering};

fn time(lo_ms: u64) -> TimeEvidence {
    TimeEvidence {
        interval: TrustedInterval {
            lo_ms,
            hi_ms: lo_ms + 1,
        },
        sources: ["a", "b"]
            .into_iter()
            .map(|id| SourceEvidence {
                server_id: id.into(),
                midpoint_ms: lo_ms,
                radius_ms: 1,
                response_hash: [0; 32],
            })
            .collect(),
    }
}

fn op(hold: &str, id: &str) -> Operation {
    Operation {
        hold_id: hold.into(),
        request_id: id.into(),
        time_evidence: time(100),
        payload_hash: [0; 32],
    }
}

fn setup() -> (EscrowKeyPair, Ledger, Enrollment, FakeHeadStore) {
    let keys = generate_escrow_key_pair().unwrap();
    let ledger = Ledger::new(&keys, "key".into(), [0; 32]).unwrap();
    let enrollment = Enrollment::new("tenant".into(), "did:example:alice", 1, [1; 32]);
    (keys, ledger, enrollment, FakeHeadStore::default())
}

fn sign(ledger: &Ledger, record: &mut LedgerRecord) {
    let signature: Signature = ledger
        .signing_key
        .sign_prehash(&record.record_hash().unwrap())
        .unwrap();
    record
        .sig
        .copy_from_slice(&signature.normalize_s().unwrap_or(signature).to_bytes());
}

#[tokio::test]
async fn signatures_bind_every_field_and_chain_position() {
    let (_, mut ledger, enrollment, store) = setup();
    ledger
        .transition(&store, &enrollment, &op("h", "create"), Event::HoldCreated)
        .await
        .unwrap();
    ledger
        .verify_pin(&store, &enrollment, &op("h", "pin"), || false)
        .await
        .unwrap();
    let records = store.get_chain(&enrollment.chain_id()).await.unwrap();
    let verify =
        |records: &[LedgerRecord]| Ledger::verify_chain(records, &enrollment, &ledger.public_key());
    assert!(verify(&records).is_ok());
    let mut bad = records.clone();
    bad[1].sig[0] ^= 1;
    assert!(matches!(verify(&bad), Err(LedgerError::Signature)));
    let mut bad = records.clone();
    bad[1].payload_hash[0] ^= 1;
    assert!(matches!(verify(&bad), Err(LedgerError::Signature)));
    let mut bad = records.clone();
    bad.swap(1, 2);
    assert!(verify(&bad).is_err());
    let mut bad = records.clone();
    bad.remove(1);
    assert!(verify(&bad).is_err());
    for change in 0..4 {
        let mut bad = records.clone();
        match change {
            0 => bad[1].hold_id = "another".into(),
            1 => bad[1].enrollment_epoch += 1,
            2 => bad[1].blob_hash[0] ^= 1,
            _ => bad[1].tenant = "another".into(),
        }
        // Even validly signed transplanted records fail the expected binding/state.
        sign(&ledger, &mut bad[1]);
        assert!(verify(&bad[..2]).is_err());
    }
    let mut expected = enrollment.clone();
    expected.enrollment_id[0] ^= 1;
    assert!(Ledger::verify_chain(&records, &expected, &ledger.public_key()).is_err());
    let (_, wrong, _, _) = setup();
    assert!(Ledger::verify_chain(&records, &enrollment, &wrong.public_key()).is_err());
}

#[tokio::test]
async fn high_water_rejects_truncation_empty_and_longer_forks() {
    let (keys, mut ledger, enrollment, store) = setup();
    ledger
        .transition(&store, &enrollment, &op("h", "create"), Event::HoldCreated)
        .await
        .unwrap();
    let prefix = store.get_chain(&enrollment.chain_id()).await.unwrap();
    ledger
        .verify_pin(&store, &enrollment, &op("h", "pin"), || false)
        .await
        .unwrap();
    assert!(matches!(
        ledger.observe(&prefix, &enrollment),
        Err(LedgerError::Rollback)
    ));
    assert!(matches!(
        ledger.observe(&[], &enrollment),
        Err(LedgerError::Rollback)
    ));
    let mut reboot = Ledger::new(&keys, "key".into(), [0; 32]).unwrap();
    // D3: a fresh instance cannot reject an old valid head.
    assert!(reboot.observe(&prefix, &enrollment).is_ok());
    store.replace(&enrollment.chain_id(), prefix).unwrap();
    reboot
        .verify_pin(&store, &enrollment, &op("h", "fork"), || false)
        .await
        .unwrap();
    reboot
        .transition(&store, &enrollment, &op("h", "cancel"), Event::Cancelled)
        .await
        .unwrap();
    let fork = store.get_chain(&enrollment.chain_id()).await.unwrap();
    assert!(matches!(
        ledger.observe(&fork, &enrollment),
        Err(LedgerError::Rollback)
    ));
}

#[tokio::test]
async fn duplicate_requests_never_compare_again_and_bind_payload() {
    let (keys, mut ledger, enrollment, store) = setup();
    let create = op("h", "create");
    let first = ledger
        .transition(&store, &enrollment, &create, Event::HoldCreated)
        .await
        .unwrap();
    assert_eq!(
        first,
        ledger
            .transition(&store, &enrollment, &create, Event::HoldCreated)
            .await
            .unwrap()
    );
    let pin = op("h", "pin");
    assert_eq!(
        ledger
            .verify_pin(&store, &enrollment, &pin, || false)
            .await
            .unwrap(),
        PinOutcome::Compared { matched: false }
    );
    let mut reboot = Ledger::new(&keys, "key".into(), [0; 32]).unwrap();
    assert_eq!(
        reboot
            .verify_pin(&store, &enrollment, &pin, || panic!("duplicate comparison"))
            .await
            .unwrap(),
        PinOutcome::Duplicate {
            result: Some(false)
        }
    );
    let mut changed = pin;
    changed.payload_hash[0] = 1;
    assert!(reboot
        .verify_pin(&store, &enrollment, &changed, || panic!("changed request"))
        .await
        .is_err());
    assert_eq!(
        store.get_chain(&enrollment.chain_id()).await.unwrap().len(),
        3
    );
}

#[tokio::test]
async fn crash_after_reserve_spends_attempt_across_holds_and_restart() {
    let (keys, mut ledger, enrollment, store) = setup();
    ledger
        .transition(&store, &enrollment, &op("h", "create"), Event::HoldCreated)
        .await
        .unwrap();
    let state = ledger.load(&store, &enrollment).await.unwrap();
    let pending = op("h", "aborted");
    ledger
        .append(
            &store,
            &enrollment,
            &state,
            &pending,
            Event::PinAttemptReserved { attempt_no: 1 },
        )
        .await
        .unwrap();
    let mut reboot = Ledger::new(&keys, "key".into(), [0; 32]).unwrap();
    assert_eq!(
        reboot
            .verify_pin(&store, &enrollment, &pending, || panic!(
                "reservation reused"
            ))
            .await
            .unwrap(),
        PinOutcome::Duplicate { result: None }
    );
    reboot
        .transition(
            &store,
            &enrollment,
            &op("other", "create2"),
            Event::HoldCreated,
        )
        .await
        .unwrap();
    for attempt in 2..=10 {
        reboot
            .verify_pin(
                &store,
                &enrollment,
                &op("other", &format!("pin{attempt}")),
                || false,
            )
            .await
            .unwrap();
    }
    let state = reboot.load(&store, &enrollment).await.unwrap();
    assert_eq!(state.attempts_used, 10);
    assert!(state.locked);
    reboot
        .transition(
            &store,
            &enrollment,
            &op("third", "create3"),
            Event::HoldCreated,
        )
        .await
        .unwrap();
    assert!(reboot
        .verify_pin(&store, &enrollment, &op("third", "eleventh"), || panic!(
            "budget bypass"
        ))
        .await
        .is_err());
    reboot
        .transition(
            &store,
            &enrollment,
            &op("third", "locked"),
            Event::PinLocked,
        )
        .await
        .unwrap();
    // Changing blob without a new authenticated epoch is not a budget reset.
    let mut changed = enrollment.clone();
    changed.blob_hash[0] ^= 1;
    assert_eq!(changed.chain_id(), enrollment.chain_id());
    assert!(reboot
        .verify_pin(&store, &changed, &op("third", "changed"), || panic!(
            "blob reset"
        ))
        .await
        .is_err());
}

struct BadAppend<'a> {
    inner: &'a FakeHeadStore,
    error: Option<AppendError>,
    persist: bool,
}
impl HeadStore for BadAppend<'_> {
    fn get_chain<'a>(&'a self, id: &'a str) -> StoreFuture<'a, Vec<LedgerRecord>> {
        self.inner.get_chain(id)
    }
    fn append<'a>(&'a self, id: &'a str, record: &'a LedgerRecord) -> StoreFuture<'a, ()> {
        Box::pin(async move {
            if self.persist {
                self.inner.append(id, record).await?;
            }
            self.error.map_or(Ok(()), Err)
        })
    }
}

#[tokio::test]
async fn conflict_unavailable_and_lying_append_never_compare_or_fork() {
    for error in [
        Some(AppendError::Conflict),
        Some(AppendError::Unavailable),
        None,
    ] {
        for persist in [false, true] {
            if error.is_none() && persist {
                continue;
            }
            let (_, mut ledger, enrollment, store) = setup();
            ledger
                .transition(&store, &enrollment, &op("h", "create"), Event::HoldCreated)
                .await
                .unwrap();
            let bad = BadAppend {
                inner: &store,
                error,
                persist,
            };
            let compared = AtomicBool::new(false);
            let result = ledger
                .verify_pin(&bad, &enrollment, &op("h", "pin"), || {
                    compared.store(true, Ordering::SeqCst);
                    false
                })
                .await;
            assert!(result.is_err());
            assert!(!compared.load(Ordering::SeqCst));
            if let Some(error) = error {
                assert!(matches!(result, Err(LedgerError::Store(e)) if e == error));
            }
            if persist {
                assert_eq!(
                    ledger
                        .verify_pin(&store, &enrollment, &op("h", "pin"), || panic!(
                            "ambiguous reserve"
                        ))
                        .await
                        .unwrap(),
                    PinOutcome::Duplicate { result: None }
                );
            } else {
                assert!(matches!(
                    ledger
                        .verify_pin(&store, &enrollment, &op("h", "different"), || panic!(
                            "fork"
                        ))
                        .await,
                    Err(LedgerError::Rollback)
                ));
            }
        }
    }
}

#[tokio::test]
async fn time_terminal_and_result_transition_rules() {
    for terminal in [Event::Released, Event::Cancelled] {
        let (_, mut ledger, enrollment, store) = setup();
        ledger
            .transition(&store, &enrollment, &op("h", "create"), Event::HoldCreated)
            .await
            .unwrap();
        let mut old = op("h", "old");
        old.time_evidence = time(99);
        assert!(ledger
            .transition(&store, &enrollment, &old, terminal)
            .await
            .is_err());
        ledger
            .transition(&store, &enrollment, &op("h", "terminal"), terminal)
            .await
            .unwrap();
        assert!(ledger
            .transition(&store, &enrollment, &op("h", "after"), Event::Cancelled)
            .await
            .is_err());
        assert!(ledger
            .verify_pin(&store, &enrollment, &op("h", "afterpin"), || panic!(
                "terminal"
            ))
            .await
            .is_err());
    }
    let (_, mut ledger, enrollment, store) = setup();
    ledger
        .transition(&store, &enrollment, &op("h", "create"), Event::HoldCreated)
        .await
        .unwrap();
    let state = ledger.load(&store, &enrollment).await.unwrap();
    assert!(ledger
        .append(
            &store,
            &enrollment,
            &state,
            &op("h", "fake-result"),
            Event::PinAttemptSucceeded
        )
        .await
        .is_err());
    assert!(ledger
        .transition(&store, &enrollment, &op("h", "lock"), Event::PinLocked)
        .await
        .is_err());
}

#[test]
fn deterministic_keys_and_secret_pin_commitments() {
    let (keys, a, _, _) = setup();
    let b = Ledger::new(&keys, "key".into(), [1; 32]).unwrap();
    assert_eq!(a.public_key(), b.public_key());
    assert_eq!(
        a.pin_payload_hash(b"request1:1234").unwrap(),
        b.pin_payload_hash(b"request1:1234").unwrap()
    );
    assert_ne!(
        a.pin_payload_hash(b"request1:1234").unwrap(),
        a.pin_payload_hash(b"request2:1234").unwrap()
    );
    let (_, other, _, _) = setup();
    assert_ne!(
        a.pin_payload_hash(b"1234").unwrap(),
        other.pin_payload_hash(b"1234").unwrap()
    );
}

fn golden_record() -> LedgerRecord {
    LedgerRecord {
        version: 1,
        tenant: "t".into(),
        enrollment_id: [0; 32],
        hold_id: "h".into(),
        enrollment_epoch: 1,
        blob_hash: [0; 32],
        seq: 0,
        prev_hash: [0; 32],
        event: Event::HoldCreated,
        request_id: "r".into(),
        measurement: [0; 32],
        key_id: "k".into(),
        time_evidence: time(0),
        payload_hash: [0; 32],
        policy_version: 1,
        sig: [0; 64],
    }
}

#[test]
fn golden_cbor_and_strict_bounded_decode() {
    let record = golden_record();
    // Literal wire bytes; repeated zero strings only abbreviate fixed zero hashes.
    let zero = "00".repeat(32);
    let golden = format!("b000010161740261680301045820{zero}0500065820{zero}078100086172095820{zero}0a616b0b8300018284616100015820{zero}84616200015820{zero}0c5820{zero}0d010e5820{zero}0f5840{}", "00".repeat(64));
    let bytes = hex::decode(golden).unwrap();
    assert_eq!(record.canonical_bytes().unwrap(), bytes);
    assert_eq!(LedgerRecord::decode(&bytes).unwrap(), record);
    let mut unsigned = bytes[..bytes.len() - 67].to_vec();
    unsigned[0] = 0xaf;
    assert_eq!(codec::encode(&record, false).unwrap(), unsigned);
    assert_eq!(
        record.record_hash().unwrap(),
        <Hash>::from(Sha256::digest(&unsigned))
    );
    let mut malformed = vec![
        vec![0; MAX_RECORD_BYTES + 1],
        vec![0xbf],
        vec![0xbb, 255, 255, 255, 255, 255, 255, 255, 255],
    ];
    let mut nonminimal = bytes.clone();
    nonminimal.splice(2..3, [0x18, 1]);
    malformed.push(nonminimal);
    let mut duplicate = bytes.clone();
    duplicate[3] = 0;
    malformed.push(duplicate);
    let mut unordered = bytes.clone();
    unordered[1] = 1;
    malformed.push(unordered);
    let mut trailing = bytes.clone();
    trailing.push(0);
    malformed.push(trailing);
    let mut indefinite = bytes.clone();
    indefinite[4] = 0x7f;
    malformed.push(indefinite);
    let mut float = bytes.clone();
    float.splice(2..3, [0xf9, 0, 0]);
    malformed.push(float);
    let mut nesting = bytes.clone();
    nesting.splice(2..3, [0x81; 100]);
    malformed.push(nesting);
    for bad in malformed {
        assert!(LedgerRecord::decode(&bad).is_err());
    }
    for len in 0..bytes.len() {
        assert!(LedgerRecord::decode(&bytes[..len]).is_err());
    }
    let mut bad = record;
    bad.time_evidence.sources.reverse();
    assert!(bad.canonical_bytes().is_err());
}
