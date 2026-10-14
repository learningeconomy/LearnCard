use super::*;
use crate::{Head, TrustedKeys};
use escrow_enclave::{
    authority::{
        audit::CommitReceipt,
        state::{
            ActiveBlob, Counter, EnrollmentItem, HoldItem, OperationItem, PinState, Revisions,
        },
    },
    crypto::escrow_blob_identity,
    time::{TimeEvidence, TrustedInterval},
    wire::EscrowEnvelope,
};
use p256::ecdsa::{Signature, SigningKey, signature::hazmat::PrehashSigner};
use serde_json::{Value, json};
use std::sync::{
    Mutex,
    atomic::{AtomicUsize, Ordering},
};

fn count(n: u64) -> Counter {
    Counter::try_from(n).unwrap()
}
fn binding() -> Binding {
    Binding {
        tenant: "learncard".into(),
        generation: "g1".into(),
        did_hash: [1; 32],
    }
}
fn key() -> SigningKey {
    SigningKey::from_slice(&[42; 32]).unwrap()
}
fn trust() -> AuthorityTrust {
    AuthorityTrust::parse(&json!({"key":{"publicKey":hex::encode(key().verifying_key().to_encoded_point(false).as_bytes()),"measurements":["07".repeat(32)]}}).to_string()).unwrap()
}
fn envelope() -> EscrowEnvelope {
    let file: Value = serde_json::from_str(include_str!(
        "../../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
    ))
    .unwrap();
    serde_json::from_value(file["blobs"][0]["envelope"].clone()).unwrap()
}
fn signed(event: &AuthorityEvent) -> Vec<u8> {
    let mut record = SignedAuthorityRecord {
        version: 1,
        kind: RecordKind::Proposal,
        key_id: "key".into(),
        measurement: [7; 32],
        payload: STANDARD.encode(serde_json::to_vec(event).unwrap()),
        signature: String::new(),
    };
    let sig: Signature = key().sign_prehash(&record.signing_hash().unwrap()).unwrap();
    record.signature = STANDARD.encode(sig.normalize_s().unwrap_or(sig).to_bytes());
    serde_json::to_vec(&record).unwrap()
}
fn events() -> Vec<AuthorityEvent> {
    let blob = escrow_blob_identity(&envelope()).unwrap();
    let pin = PinState {
        generation: count(1),
        configured: true,
        attempts_used: 0,
    };
    let mut events = Vec::new();
    for (index, (kind, outcome, digest, hold_id, hold_status, used)) in [
        (Kind::Enroll, Outcome::Committed, 2, None, None, 0),
        (
            Kind::CreateHold,
            Outcome::Committed,
            3,
            Some("hold"),
            Some(HoldStatus::Pending),
            0,
        ),
        (
            Kind::PinAttempt,
            Outcome::Reserved,
            4,
            Some("hold"),
            Some(HoldStatus::Pending),
            1,
        ),
        (
            Kind::PinAttempt,
            Outcome::Compared { matched: false },
            4,
            Some("hold"),
            Some(HoldStatus::Pending),
            1,
        ),
        (
            Kind::PinAttempt,
            Outcome::Reserved,
            5,
            Some("hold"),
            Some(HoldStatus::Pending),
            2,
        ),
    ]
    .into_iter()
    .enumerate()
    {
        events.push(AuthorityEvent {
            binding: binding(),
            request_id: format!("request-{digest}"),
            kind,
            outcome,
            previous_revisions: (index > 0).then(|| Revisions {
                operation: count(index as u64),
                enrollment: count(1),
            }),
            revisions: Revisions {
                operation: count(index as u64 + 1),
                enrollment: count(1),
            },
            previous_pin: (index > 0).then_some({
                if index <= 2 {
                    pin
                } else {
                    PinState {
                        attempts_used: 1,
                        ..pin
                    }
                }
            }),
            pin: PinState {
                attempts_used: used,
                ..pin
            },
            epoch: count(1),
            source_identity: (index > 0).then_some(blob),
            target_identity: Some(blob),
            share_version: Some(1),
            rewrap_delegated: true,
            hold_id: hold_id.map(str::to_owned),
            hold_status,
            request_digest: [digest; 32],
            time: TimeEvidence {
                interval: TrustedInterval {
                    lo_ms: 1000,
                    hi_ms: 1001,
                },
                sources: vec![],
            },
        });
    }
    events
}
fn row(value: ItemValue) -> Row {
    let item = StoredItem {
        schema_version: 1,
        binding: binding(),
        value,
    };
    Row {
        pk: binding().partition_key().unwrap(),
        sk: item.sort_key().unwrap(),
        payload: item.encode().unwrap(),
    }
}
fn rows(events: &[AuthorityEvent]) -> Vec<Row> {
    let mut result = Vec::new();
    let mut operations = BTreeMap::new();
    for event in events {
        let revision = event.revisions.operation.get();
        let id = [revision as u8; 16];
        let proposal = signed(event);
        let execution = ExecutionRecord {
            receipt: CommitReceipt {
                schema_version: 1,
                binding: binding(),
                execution_id: id,
                revisions: event.revisions,
                transaction_digest: [9; 32],
            },
            proposed_event: proposal.clone(),
        };
        result.push(Row {
            pk: binding().partition_key().unwrap(),
            sk: format!("EXECUTION#{}", hex::encode(id)),
            payload: serde_json::to_vec(&execution).unwrap(),
        });
        operations.insert(
            event.request_digest,
            OperationItem {
                request_id: event.request_id.clone(),
                execution_id: id,
                kind: event.kind,
                outcome: event.outcome,
                revisions: event.revisions,
                request_digest: event.request_digest,
                proposed_event: proposal,
            },
        );
    }
    result.extend(
        operations
            .into_values()
            .map(|op| row(ItemValue::Operation(op))),
    );
    let last = events.last().unwrap();
    result.push(row(ItemValue::Enrollment(EnrollmentItem {
        revisions: last.revisions,
        epoch: last.epoch,
        pin: last.pin,
        intent_digest: [2; 32],
        enrollment: EnrollmentStatus::Active {
            blob: Box::new(ActiveBlob {
                identity: escrow_blob_identity(&envelope()).unwrap(),
                envelope: envelope(),
                share_version: 1,
                chain_head: None,
                rewrap_delegated: true,
            }),
        },
        email_throttle: None,
    })));
    if let Some(last_hold) = events.iter().rev().find(|e| e.hold_id.is_some()) {
        let status = last_hold.hold_status.unwrap();
        // P9.1 (attack C): these audit-reconstruction tests predate
        // confirmation and only ever reach Pending/Released/Cancelled here;
        // fill in whichever new fields that status's schema requires.
        result.push(row(ItemValue::Hold(HoldItem {
            hold_id: "hold".into(),
            enrollment_version: count(1),
            epoch: count(1),
            blob_identity: escrow_blob_identity(&envelope()).unwrap(),
            signed_hold_digest: [3; 32],
            created_revision: count(2),
            updated_revision: last_hold.revisions.operation,
            status,
            code_hash: None,
            code_expires_lo_ms: None,
            code_guesses_used: 0,
            confirmed_hi_ms: (status != HoldStatus::AwaitingConfirmation).then_some(1),
            release_warning_sent_hi_ms: None,
        })));
    }
    result
}
fn verify(rows: &[Row]) -> Result<()> {
    verify_account(
        "learncard",
        "g1",
        &binding().partition_key().unwrap(),
        rows,
        &trust(),
    )
}

#[test]
fn accepts_complete_history_including_abandoned_reservations_and_rejects_any_missing_committed_row()
{
    let rows = rows(&events());
    assert!(verify(&rows).is_ok());
    for missing in 0..rows.len() {
        let mut incomplete = rows.clone();
        incomplete.remove(missing);
        assert_eq!(verify(&incomplete), Err(Error::Integrity));
    }
}

#[test]
fn detects_validly_signed_counter_decrease_and_invalid_result_resets() {
    let mut events = events();
    events[3].pin.attempts_used = 0;
    // Every signature remains valid. This is a semantic check, not a bad-signature test.
    assert_eq!(verify(&rows(&events)), Err(Error::Integrity));
    let mut events = self::events();
    events[4].previous_pin = Some(PinState {
        generation: count(1),
        configured: true,
        attempts_used: 0,
    });
    assert_eq!(verify(&rows(&events)), Err(Error::Integrity));
}

#[test]
fn detects_account_revision_and_attempt_regression_against_immutable_history() {
    for revision in [true, false] {
        let mut rows = rows(&events());
        let current = rows.iter_mut().find(|r| r.sk == "ENROLLMENT").unwrap();
        let mut item: StoredItem = serde_json::from_slice(&current.payload).unwrap();
        let ItemValue::Enrollment(state) = &mut item.value else {
            panic!()
        };
        if revision {
            state.revisions.operation = count(4);
        } else {
            state.pin.attempts_used = 1;
        }
        current.payload = item.encode().unwrap();
        assert_eq!(verify(&rows), Err(Error::Integrity));
    }
}

#[test]
fn rejects_relocated_request_tombstones_even_with_unchanged_valid_signatures() {
    let mut rows = rows(&events());
    let index = rows
        .iter()
        .position(|r| r.sk.starts_with("OPERATION#"))
        .unwrap();
    let item: StoredItem = serde_json::from_slice(&rows[index].payload).unwrap();
    let ItemValue::Operation(mut op) = item.value else {
        panic!()
    };
    op.request_id = "renamed-request".into();
    rows[index] = row(ItemValue::Operation(op));
    assert_eq!(verify(&rows), Err(Error::Integrity));
}

#[test]
fn rejects_corrupt_signatures_measurements_receipts_and_operation_transplants() {
    let original = rows(&events());
    for mutation in 0..5 {
        let mut rows = original.clone();
        let execution = rows
            .iter_mut()
            .find(|r| r.sk.starts_with("EXECUTION#"))
            .unwrap();
        let mut value: ExecutionRecord = serde_json::from_slice(&execution.payload).unwrap();
        let mut proposal: SignedAuthorityRecord =
            serde_json::from_slice(&value.proposed_event).unwrap();
        match mutation {
            0 => proposal.signature = STANDARD.encode([0; 64]),
            1 => proposal.measurement = [8; 32],
            2 => value.receipt.revisions.enrollment = count(2),
            3 => value.receipt.execution_id = [99; 16],
            _ => proposal.kind = RecordKind::Snapshot,
        }
        value.proposed_event = serde_json::to_vec(&proposal).unwrap();
        execution.payload = serde_json::to_vec(&value).unwrap();
        assert_eq!(verify(&rows), Err(Error::Integrity));
    }
    assert_eq!(
        verify_account("learncard", "g2", &original[0].pk, &original, &trust()),
        Err(Error::Integrity)
    );
    assert_eq!(
        verify_account("other", "g1", &original[0].pk, &original, &trust()),
        Err(Error::Integrity)
    );
}

#[test]
fn rejects_duplicate_executions_replayed_results_and_budget_above_ten() {
    let mut rows = rows(&events());
    rows.push(rows[0].clone());
    assert_eq!(verify(&rows), Err(Error::Integrity));
    let mut events = events();
    events[4].request_digest = [4; 32];
    events[4].request_id = "request-4".into();
    assert_eq!(verify(&self::rows(&events)), Err(Error::Integrity));
    let mut events = self::events();
    events[4].pin.attempts_used = 11;
    assert_eq!(
        transition(Some(&events[3]), &events[4]),
        Err(Error::Integrity)
    );
}

#[test]
fn budgets_can_reset_only_with_owner_changes_and_rewrap_requires_delegation() {
    let events = events();
    let old = &events[4];
    let mut next: AuthorityEvent =
        serde_json::from_value(serde_json::to_value(old).unwrap()).unwrap();
    next.previous_revisions = Some(old.revisions);
    next.previous_pin = Some(old.pin);
    next.revisions = old.revisions.advance(true).unwrap();
    next.kind = Kind::Replace;
    next.outcome = Outcome::Committed;
    next.epoch = old.epoch.next().unwrap();
    next.target_identity = Some([8; 32]);
    next.pin.generation = count(2);
    next.pin.attempts_used = 0;
    next.hold_id = None;
    next.hold_status = None;
    assert!(transition(Some(old), &next).is_ok());
    next.kind = Kind::Carry;
    assert_eq!(transition(Some(old), &next), Err(Error::Integrity));
    next.kind = Kind::Rewrap;
    next.epoch = old.epoch;
    next.pin = old.pin;
    assert!(transition(Some(old), &next).is_ok());
    let mut prior: AuthorityEvent =
        serde_json::from_value(serde_json::to_value(old).unwrap()).unwrap();
    prior.rewrap_delegated = false;
    assert_eq!(transition(Some(&prior), &next), Err(Error::Integrity));
}

#[test]
fn rpc_artifacts_are_verified_by_kind_but_never_substitute_for_execution_receipts() {
    let golden: Value = serde_json::from_str(include_str!(
        "../../../../packages/sss-key-manager/src/__fixtures__/escrow-authority-v1.json"
    ))
    .unwrap();
    let trust=AuthorityTrust::parse(&json!({"test-key.1":{"publicKey":hex::encode(STANDARD.decode(golden["ledgerPublicKey"].as_str().unwrap()).unwrap()),"measurements":[golden["measurement"]]}}).to_string()).unwrap();
    for (record, kind) in [
        (&golden["snapshot"]["proof"], RecordKind::Snapshot),
        (&golden["committed"]["receipt"], RecordKind::Commit),
    ] {
        let record: SignedAuthorityRecord = serde_json::from_value(record.clone()).unwrap();
        assert!(trust.verify_artifact(&record, kind).is_ok());
        assert!(
            trust
                .verify_artifact(&record, RecordKind::Proposal)
                .is_err()
        );
    }
    assert!(
        AuthorityTrust::parse(&hex::encode(
            key().verifying_key().to_encoded_point(false).as_bytes()
        ))
        .is_err()
    );
    assert!(AuthorityTrust::parse("{}").is_err());
}

struct Fake {
    rows: Vec<Row>,
    reads: AtomicUsize,
    changing: bool,
    unavailable: bool,
    metrics: Mutex<Vec<Metric>>,
}
#[async_trait::async_trait]
impl Backend for Fake {
    async fn head(&self, _: &str) -> Result<Option<Head>> {
        Err(Error::Unavailable)
    }
    async fn chain(&self, _: &str) -> Result<Vec<Vec<u8>>> {
        Err(Error::Unavailable)
    }
    async fn audit(&self, _: &str) -> Result<Option<Vec<u8>>> {
        Err(Error::Unavailable)
    }
    async fn metric(&self, m: Metric) -> Result<()> {
        self.metrics.lock().unwrap().push(m);
        Ok(())
    }
    async fn notify(&self, _: Metric) -> Result<()> {
        Ok(())
    }
}
#[async_trait::async_trait]
impl AuthorityBackend for Fake {
    async fn authority_partitions(&self, _: &str) -> Result<Vec<String>> {
        if self.unavailable {
            Err(Error::Unavailable)
        } else {
            Ok(vec![binding().partition_key().unwrap()])
        }
    }
    async fn authority_account(&self, _: &str, _: &str) -> Result<Option<Vec<u8>>> {
        let mut row = self
            .rows
            .iter()
            .find(|r| r.sk == "ENROLLMENT")
            .map(|r| r.payload.clone());
        if self.changing && self.reads.fetch_add(1, Ordering::SeqCst) > 0 {
            row = Some(vec![1]);
        }
        Ok(row)
    }
    async fn authority_rows(&self, _: &str, _: &str) -> Result<Vec<Row>> {
        Ok(self.rows.clone())
    }
}
fn monitor(changing: bool, unavailable: bool) -> Monitor<Fake> {
    Monitor {
        tenant: "learncard".into(),
        key: TrustedKeys::Legacy(*key().verifying_key()),
        backend: Fake {
            rows: rows(&events()),
            reads: AtomicUsize::new(0),
            changing,
            unavailable,
            metrics: Mutex::new(vec![]),
        },
    }
}
fn config() -> Config {
    Config {
        table: "authority".into(),
        generation: "g1".into(),
        trust: trust(),
    }
}
#[tokio::test]
async fn concurrent_writes_are_coverage_retries_not_false_tamper_alarms() {
    let m = monitor(true, false);
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    let metrics = m.backend.metrics.lock().unwrap();
    assert!(metrics.contains(&Metric::AuthorityCoverageFailure));
    assert!(!metrics.contains(&Metric::AuthorityIntegrityFailure));
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
}
#[tokio::test]
async fn unavailable_reads_never_report_success_and_integrity_alarms_are_fixed_labels() {
    let m = monitor(false, true);
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    assert!(
        m.backend
            .metrics
            .lock()
            .unwrap()
            .contains(&Metric::AuthorityCoverageFailure)
    );
    let mut m = monitor(false, false);
    m.backend.rows.retain(|r| r.sk != "ENROLLMENT");
    m.sweep_authority(&config()).await.unwrap();
    assert!(
        m.backend
            .metrics
            .lock()
            .unwrap()
            .contains(&Metric::AuthorityIntegrityFailure)
    );
    let m = monitor(false, false);
    m.sweep_authority(&config()).await.unwrap();
    assert_eq!(
        *m.backend.metrics.lock().unwrap(),
        vec![Metric::AuthoritySweepCompleted]
    );
    assert_eq!(
        Metric::AuthorityIntegrityFailure.name(),
        "AuthorityIntegrityFailure"
    );
    assert_eq!(Error::Integrity.to_string(), "ledger integrity failure");
}
