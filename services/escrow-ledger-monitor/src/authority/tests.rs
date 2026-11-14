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
    AuthorityTrust::parse(&json!({"key":{"publicKey":hex::encode(key().verifying_key().to_sec1_point(false).as_bytes()),"measurements":["07".repeat(32)]}}).to_string()).unwrap()
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
    record.signature = STANDARD.encode(sig.normalize_s().to_bytes());
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
    row_as(&binding(), value)
}
fn row_as(binding: &Binding, value: ItemValue) -> Row {
    let item = StoredItem {
        schema_version: 1,
        binding: binding.clone(),
        value,
    };
    Row {
        pk: binding.partition_key().unwrap(),
        sk: item.sort_key().unwrap(),
        payload: item.encode().unwrap(),
    }
}
fn rows(events: &[AuthorityEvent]) -> Vec<Row> {
    rows_as(&binding(), events)
}
/// `rows()` for another account: every event is re-bound (and re-signed) to `binding`.
fn rows_as(binding: &Binding, events: &[AuthorityEvent]) -> Vec<Row> {
    // AuthorityEvent is not Clone; a serde round trip copies it for re-binding.
    let events: Vec<AuthorityEvent> = events
        .iter()
        .map(|event| {
            let mut event: AuthorityEvent =
                serde_json::from_slice(&serde_json::to_vec(event).unwrap()).unwrap();
            event.binding = binding.clone();
            event
        })
        .collect();
    let row = |value| row_as(binding, value);
    let mut result = Vec::new();
    let mut operations = BTreeMap::new();
    for event in &events {
        let revision = event.revisions.operation.get();
        let id = [revision as u8; 16];
        let proposal = signed(event);
        let execution = ExecutionRecord {
            receipt: CommitReceipt {
                schema_version: 1,
                binding: binding.clone(),
                execution_id: id,
                revisions: event.revisions,
                transaction_digest: [9; 32],
            },
            proposed_event: proposal.clone(),
        };
        result.push(Row {
            pk: binding.partition_key().unwrap(),
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
        // P9.1 (attack C): mirrors StoredItem::validate()'s per-status schema
        // exactly (code_hash/code_expires_lo_ms only in AwaitingConfirmation;
        // confirmed_hi_ms only once Pending/Released); Cancelled is unconstrained.
        let (code_hash, code_expires_lo_ms, confirmed_hi_ms) = match status {
            HoldStatus::AwaitingConfirmation => (Some([6; 32]), Some(1), None),
            HoldStatus::Pending | HoldStatus::Released => (None, None, Some(1)),
            HoldStatus::Cancelled => (None, None, None),
        };
        result.push(row(ItemValue::Hold(HoldItem {
            hold_id: "hold".into(),
            enrollment_version: count(1),
            epoch: count(1),
            blob_identity: escrow_blob_identity(&envelope()).unwrap(),
            signed_hold_digest: [3; 32],
            created_revision: count(2),
            updated_revision: last_hold.revisions.operation,
            status,
            code_hash,
            code_expires_lo_ms,
            code_guesses_used: 0,
            confirmed_hi_ms,
            release_warning_sent_hi_ms: None,
        })));
    }
    result
}
fn verify(rows: &[Row]) -> Result<AccountAudit> {
    verify_account(
        "learncard",
        "g1",
        &binding().partition_key().unwrap(),
        rows,
        &trust(),
    )
}

type ConfirmationStep = (
    Kind,
    Outcome,
    u8,
    Option<&'static str>,
    Option<HoldStatus>,
    u64,
    u64,
);
/// Builds a hold_id="hold" chain reusing `rows()`'s hardcoded assumptions
/// (CreateHold is always the second event / revision 2); every caller must
/// include ENROLL_STEP first.
fn confirmation_chain(steps: &[ConfirmationStep]) -> Vec<AuthorityEvent> {
    let blob = escrow_blob_identity(&envelope()).unwrap();
    let pin = PinState {
        generation: count(0),
        configured: false,
        attempts_used: 0,
    };
    steps
        .iter()
        .enumerate()
        .map(
            |(index, &(kind, outcome, digest, hold_id, hold_status, lo_ms, hi_ms))| {
                AuthorityEvent {
                    binding: binding(),
                    request_id: format!("confirmation-request-{digest}"),
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
                    previous_pin: (index > 0).then_some(pin),
                    pin,
                    epoch: count(1),
                    source_identity: (index > 0).then_some(blob),
                    target_identity: Some(blob),
                    share_version: Some(1),
                    rewrap_delegated: true,
                    hold_id: hold_id.map(str::to_owned),
                    hold_status,
                    request_digest: [digest; 32],
                    time: TimeEvidence {
                        interval: TrustedInterval { lo_ms, hi_ms },
                        sources: vec![],
                    },
                }
            },
        )
        .collect()
}
const ENROLL_STEP: ConfirmationStep = (Kind::Enroll, Outcome::Committed, 2, None, None, 1000, 1001);
const CREATE_AWAITING_STEP: ConfirmationStep = (
    Kind::CreateHold,
    Outcome::Committed,
    3,
    Some("hold"),
    Some(HoldStatus::AwaitingConfirmation),
    1000,
    1001,
);
const CONFIRM_MISMATCH_STEP: ConfirmationStep = (
    Kind::ConfirmHold,
    Outcome::Committed,
    4,
    Some("hold"),
    Some(HoldStatus::AwaitingConfirmation),
    1500,
    1501,
);
const CONFIRM_MATCH_STEP: ConfirmationStep = (
    Kind::ConfirmHold,
    Outcome::Committed,
    5,
    Some("hold"),
    Some(HoldStatus::Pending),
    2000,
    2001,
);
/// The warning event's own trusted hi_ms (2001) is the baseline every release
/// gap in these tests is measured from.
const WARNING_STEP: ConfirmationStep = (
    Kind::SendReleaseWarning,
    Outcome::Committed,
    6,
    Some("hold"),
    Some(HoldStatus::Pending),
    3000,
    3001,
);
fn release_step(lo_ms: u64) -> ConfirmationStep {
    (
        Kind::Release,
        Outcome::Committed,
        7,
        Some("hold"),
        Some(HoldStatus::Released),
        lo_ms,
        lo_ms + 1,
    )
}

#[test]
fn release_requires_a_matched_confirmation_and_a_warning_at_least_24h_earlier() {
    let events = confirmation_chain(&[
        ENROLL_STEP,
        CREATE_AWAITING_STEP,
        CONFIRM_MISMATCH_STEP,
        CONFIRM_MATCH_STEP,
        WARNING_STEP,
        release_step(3001 + RELEASE_WARNING_MIN_GAP_MS),
    ]);
    assert!(verify(&rows(&events)).is_ok());
}

#[test]
fn release_fails_when_the_warning_to_release_gap_is_one_millisecond_short() {
    let events = confirmation_chain(&[
        ENROLL_STEP,
        CREATE_AWAITING_STEP,
        CONFIRM_MATCH_STEP,
        WARNING_STEP,
        release_step(3001 + RELEASE_WARNING_MIN_GAP_MS - 1),
    ]);
    assert_eq!(verify(&rows(&events)), Err(Error::Integrity));
}

#[test]
fn release_fails_without_any_recorded_release_warning() {
    // No prior SendReleaseWarning event at all — allowed_prior for Release
    // still only requires Pending, so this reaches the new gate and fails
    // there specifically, not on the earlier status check.
    let events = confirmation_chain(&[
        ENROLL_STEP,
        CREATE_AWAITING_STEP,
        CONFIRM_MATCH_STEP,
        release_step(10_000_000),
    ]);
    assert_eq!(verify(&rows(&events)), Err(Error::Integrity));
}

#[test]
fn cancel_is_valid_directly_from_awaiting_confirmation_before_any_guess() {
    let events = confirmation_chain(&[
        ENROLL_STEP,
        CREATE_AWAITING_STEP,
        (
            Kind::Cancel,
            Outcome::Committed,
            8,
            Some("hold"),
            Some(HoldStatus::Cancelled),
            1500,
            1501,
        ),
    ]);
    assert!(verify(&rows(&events)).is_ok());
}

#[test]
fn resend_code_is_valid_only_while_awaiting_confirmation() {
    let events = confirmation_chain(&[
        ENROLL_STEP,
        CREATE_AWAITING_STEP,
        (
            Kind::ResendCode,
            Outcome::Committed,
            9,
            Some("hold"),
            Some(HoldStatus::AwaitingConfirmation),
            1200,
            1201,
        ),
        CONFIRM_MATCH_STEP,
        WARNING_STEP,
        release_step(3001 + RELEASE_WARNING_MIN_GAP_MS),
    ]);
    assert!(verify(&rows(&events)).is_ok());
}

#[test]
fn resend_code_after_confirmation_is_rejected() {
    let events = confirmation_chain(&[
        ENROLL_STEP,
        CREATE_AWAITING_STEP,
        CONFIRM_MATCH_STEP,
        (
            Kind::ResendCode,
            Outcome::Committed,
            9,
            Some("hold"),
            Some(HoldStatus::AwaitingConfirmation),
            2200,
            2201,
        ),
    ]);
    assert_eq!(verify(&rows(&events)), Err(Error::Integrity));
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
            key().verifying_key().to_sec1_point(false).as_bytes()
        ))
        .is_err()
    );
    assert!(AuthorityTrust::parse("{}").is_err());
}

struct Fake {
    rows: Vec<Row>,
    /// Further accounts' rows, each bound to its own partition (see `rows_as`).
    others: Vec<Vec<Row>>,
    reads: AtomicUsize,
    /// Account-row reads (global count) from which the fence appears changed;
    /// each such read returns a distinct value, modelling continuous writes
    /// (None: stable).
    change_after: Option<usize>,
    /// Exclusive end of the changing window: later reads are stable again.
    change_until: Option<usize>,
    /// A partition whose fence changes on every read, independent of the above.
    unstable: Option<String>,
    unavailable: bool,
    /// A partition whose row read returns a malformed row (Integrity).
    malformed: Option<String>,
    /// A metric whose publication fails (models a CloudWatch/SNS outage).
    failing_metric: Option<Metric>,
    metrics: Mutex<Vec<Metric>>,
    gauges: Mutex<Vec<(Metric, u64)>>,
    diagnostics: Mutex<Vec<Diagnostic>>,
    /// Complete row reads (first Query page) per partition, to prove each
    /// account was (re)read.
    row_reads: Mutex<BTreeMap<String, usize>>,
    /// Simulated latency of every authority read (None: immediate).
    latency: Option<std::time::Duration>,
    /// One partition whose reads take this long instead (deadline abandon).
    slow: Option<(String, std::time::Duration)>,
    /// Keys per partition Scan page (one key per row, like DynamoDB).
    scan_page: usize,
    /// Extra keys appended to the Scan (duplicates of earlier keys).
    extra_scan_keys: Vec<String>,
    scan_requests: AtomicUsize,
    /// Accounts with a Query or GetItem in progress now / at most.
    active: Mutex<BTreeMap<String, usize>>,
    max_active: AtomicUsize,
    /// Last and largest in-flight row bytes / lane holders observed.
    in_flight: Mutex<(usize, usize)>,
    max_in_flight: Mutex<(usize, usize)>,
    /// Simulated latency of every metric publication (None: immediate).
    delivery_latency: Option<std::time::Duration>,
    /// Metric publications in progress now / at most.
    deliveries: AtomicUsize,
    max_deliveries: AtomicUsize,
}
impl Fake {
    fn account_rows(&self, pk: &str) -> &[Row] {
        if pk == binding().partition_key().unwrap() {
            &self.rows
        } else {
            self.others.iter().find(|r| r[0].pk == pk).unwrap()
        }
    }
    /// One key per row, accounts in key order (as DynamoDB returns a
    /// partition's rows together), then `extra_scan_keys`.
    fn scan_keys(&self) -> Vec<String> {
        let mut accounts: Vec<&Vec<Row>> = std::iter::once(&self.rows)
            .chain(self.others.iter())
            .filter(|r| !r.is_empty())
            .collect();
        accounts.sort_by(|a, b| a[0].pk.cmp(&b[0].pk));
        accounts
            .into_iter()
            .flat_map(|rows| rows.iter().map(|r| r.pk.clone()))
            .chain(self.extra_scan_keys.iter().cloned())
            .collect()
    }
    async fn wait(&self, pk: &str) {
        let delay = match &self.slow {
            Some((slow, delay)) if slow == pk => Some(*delay),
            _ => self.latency,
        };
        if let Some(delay) = delay {
            {
                let mut active = self.active.lock().unwrap();
                *active.entry(pk.into()).or_default() += 1;
                self.max_active.fetch_max(active.len(), Ordering::SeqCst);
            }
            tokio::time::sleep(delay).await;
            let mut active = self.active.lock().unwrap();
            let n = active.get_mut(pk).unwrap();
            *n -= 1;
            if *n == 0 {
                active.remove(pk);
            }
        }
    }
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
        if let Some(delay) = self.delivery_latency {
            let now = self.deliveries.fetch_add(1, Ordering::SeqCst) + 1;
            self.max_deliveries.fetch_max(now, Ordering::SeqCst);
            tokio::time::sleep(delay).await;
            self.deliveries.fetch_sub(1, Ordering::SeqCst);
        }
        if self.failing_metric == Some(m) {
            return Err(Error::Unavailable);
        }
        self.metrics.lock().unwrap().push(m);
        Ok(())
    }
    async fn gauge(&self, m: Metric, value: u64) -> Result<()> {
        self.metrics.lock().unwrap().push(m);
        self.gauges.lock().unwrap().push((m, value));
        Ok(())
    }
    async fn notify(&self, _: Metric) -> Result<()> {
        Ok(())
    }
}
/// Mirrors DynamoDB's page stop after 1 MB of data read.
const FAKE_PAGE_BYTES: usize = 1024 * 1024;
#[async_trait::async_trait]
impl AuthorityBackend for Fake {
    type Cursor = usize;
    async fn authority_partition_page(
        &self,
        _: &str,
        cursor: Option<usize>,
    ) -> Result<Page<String, usize>> {
        self.scan_requests.fetch_add(1, Ordering::SeqCst);
        if let Some(delay) = self.latency {
            tokio::time::sleep(delay).await;
        }
        if self.unavailable {
            return Err(Error::Unavailable);
        }
        let keys = self.scan_keys();
        let start = cursor.unwrap_or(0);
        let end = (start + self.scan_page).min(keys.len());
        Ok(Page {
            items: keys[start..end].to_vec(),
            next: (end < keys.len()).then_some(end),
        })
    }
    async fn authority_account(&self, _: &str, pk: &str) -> Result<Option<Vec<u8>>> {
        self.wait(pk).await;
        let mut row = self
            .account_rows(pk)
            .iter()
            .find(|r| r.sk == "ENROLLMENT")
            .map(|r| r.payload.clone());
        let read = self.reads.fetch_add(1, Ordering::SeqCst);
        if self.change_after.is_some_and(|n| read >= n)
            && self.change_until.is_none_or(|n| read < n)
            || self.unstable.as_deref() == Some(pk)
        {
            row = Some(read.to_le_bytes().to_vec());
        }
        Ok(row)
    }
    async fn authority_rows_page(
        &self,
        _: &str,
        pk: &str,
        cursor: Option<usize>,
    ) -> Result<Page<Row, usize>> {
        if cursor.is_none() {
            *self.row_reads.lock().unwrap().entry(pk.into()).or_default() += 1;
        }
        self.wait(pk).await;
        if self.malformed.as_deref() == Some(pk) {
            return Err(Error::Integrity);
        }
        let all = self.account_rows(pk);
        let start = cursor.unwrap_or(0);
        let (mut end, mut bytes) = (start, 0);
        while end < all.len() && end - start < PAGE_ITEMS && bytes < FAKE_PAGE_BYTES {
            bytes += all[end].payload.len();
            end += 1;
        }
        Ok(Page {
            items: all[start..end].to_vec(),
            next: (end < all.len()).then_some(end),
        })
    }
    fn diagnose(&self, diagnostic: Diagnostic) {
        self.diagnostics.lock().unwrap().push(diagnostic);
    }
    fn observe_in_flight(&self, bytes: usize, large_accounts: usize) {
        *self.in_flight.lock().unwrap() = (bytes, large_accounts);
        let mut max = self.max_in_flight.lock().unwrap();
        *max = (max.0.max(bytes), max.1.max(large_accounts));
    }
}
fn monitor(changing: bool, unavailable: bool) -> Monitor<Fake> {
    Monitor {
        tenant: "learncard".into(),
        key: TrustedKeys::Legacy(*key().verifying_key()),
        backend: Fake {
            rows: rows(&events()),
            others: vec![],
            reads: AtomicUsize::new(0),
            change_after: changing.then_some(1),
            change_until: None,
            unstable: None,
            unavailable,
            malformed: None,
            failing_metric: None,
            metrics: Mutex::new(vec![]),
            gauges: Mutex::new(vec![]),
            diagnostics: Mutex::new(vec![]),
            row_reads: Mutex::new(BTreeMap::new()),
            latency: None,
            slow: None,
            scan_page: PAGE_ITEMS,
            extra_scan_keys: vec![],
            scan_requests: AtomicUsize::new(0),
            active: Mutex::new(BTreeMap::new()),
            max_active: AtomicUsize::new(0),
            in_flight: Mutex::new((0, 0)),
            max_in_flight: Mutex::new((0, 0)),
            delivery_latency: None,
            deliveries: AtomicUsize::new(0),
            max_deliveries: AtomicUsize::new(0),
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
    assert!(!metrics.contains(&Metric::AuthorityRepeatedPinClearAccounts));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
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
        vec![
            Metric::AuthorityRepeatedPinClearAccounts,
            Metric::AuthoritySweepCompleted
        ]
    );
    assert_eq!(
        Metric::AuthorityIntegrityFailure.name(),
        "AuthorityIntegrityFailure"
    );
    assert_eq!(Error::Integrity.to_string(), "ledger integrity failure");
}

/// Enroll with a PIN, clear it, set a new one, clear again: every PIN change is
/// an owner-signed Replace. `clears_hi_ms` are the two clears' signed times.
fn pin_clear_chain(clears_hi_ms: [u64; 2]) -> Vec<AuthorityEvent> {
    let blob = escrow_blob_identity(&envelope()).unwrap();
    let steps: [(Kind, bool, [u8; 32], u8, u64); 4] = [
        (Kind::Enroll, true, [0xa1; 32], 10, 1000),
        (Kind::Replace, false, [0xa2; 32], 11, clears_hi_ms[0]),
        (Kind::Replace, true, [0xa3; 32], 12, clears_hi_ms[0]),
        (Kind::Replace, false, blob, 2, clears_hi_ms[1]),
    ];
    let mut events: Vec<AuthorityEvent> = Vec::new();
    for (index, (kind, configured, target, digest, hi_ms)) in steps.into_iter().enumerate() {
        let n = index as u64 + 1;
        let previous = events.last();
        events.push(AuthorityEvent {
            binding: binding(),
            request_id: format!("pin-clear-request-{digest}"),
            kind,
            outcome: Outcome::Committed,
            previous_revisions: previous.map(|e| e.revisions),
            revisions: Revisions {
                operation: count(n),
                enrollment: count(n),
            },
            previous_pin: previous.map(|e| e.pin),
            pin: PinState {
                generation: count(n),
                configured,
                attempts_used: 0,
            },
            epoch: count(n),
            source_identity: previous.and_then(|e| e.target_identity),
            target_identity: Some(target),
            share_version: Some(1),
            rewrap_delegated: true,
            hold_id: None,
            hold_status: None,
            request_digest: [digest; 32],
            time: TimeEvidence {
                interval: TrustedInterval {
                    lo_ms: hi_ms - 1,
                    hi_ms,
                },
                sources: vec![],
            },
        });
    }
    events
}
#[test]
fn verified_history_reports_each_signed_pin_clear() {
    assert_eq!(
        verify(&rows(&pin_clear_chain([5_000, 9_000]))),
        Ok(AccountAudit {
            pin_clears_hi_ms: vec![5_000, 9_000]
        })
    );
    // PIN attempts and holds are not clears.
    assert_eq!(verify(&rows(&events())), Ok(AccountAudit::default()));
}
#[test]
fn repeated_pin_clear_counts_only_clears_inside_the_window() {
    let now = 100 * REPEATED_PIN_CLEAR_WINDOW_MS;
    let audit = |clears: Vec<u64>| AccountAudit {
        pin_clears_hi_ms: clears,
    };
    assert!(audit(vec![now - 10, now - 5]).repeated_pin_clear(now));
    assert!(audit(vec![now - REPEATED_PIN_CLEAR_WINDOW_MS, now]).repeated_pin_clear(now));
    assert!(!audit(vec![now - REPEATED_PIN_CLEAR_WINDOW_MS - 1, now]).repeated_pin_clear(now));
    assert!(!audit(vec![now]).repeated_pin_clear(now));
    assert!(!audit(vec![]).repeated_pin_clear(now));
}
fn other_account(n: u8) -> Binding {
    Binding {
        did_hash: [n; 32],
        ..binding()
    }
}
#[tokio::test]
async fn sweep_reports_repeated_recent_pin_clears_without_an_integrity_alarm() {
    let now = now_ms();
    let mut m = monitor(false, false);
    m.backend.rows = rows(&pin_clear_chain([now - 60_000, now - 1_000]));
    m.sweep_authority(&config()).await.unwrap();
    assert_eq!(
        *m.backend.metrics.lock().unwrap(),
        vec![
            Metric::AuthorityRepeatedPinClear,
            Metric::AuthorityRepeatedPinClearAccounts,
            Metric::AuthoritySweepCompleted
        ]
    );
    assert_eq!(
        *m.backend.gauges.lock().unwrap(),
        vec![(Metric::AuthorityRepeatedPinClearAccounts, 1)]
    );
    // One clear inside the window (the expected post-recovery repair) is quiet,
    // but the completed sweep still reports 0 accounts so the alarm has data.
    let mut m = monitor(false, false);
    m.backend.rows = rows(&pin_clear_chain([
        now - REPEATED_PIN_CLEAR_WINDOW_MS - 60_000,
        now - 1_000,
    ]));
    m.sweep_authority(&config()).await.unwrap();
    assert_eq!(
        *m.backend.metrics.lock().unwrap(),
        vec![
            Metric::AuthorityRepeatedPinClearAccounts,
            Metric::AuthoritySweepCompleted
        ]
    );
    assert_eq!(
        *m.backend.gauges.lock().unwrap(),
        vec![(Metric::AuthorityRepeatedPinClearAccounts, 0)]
    );
    assert_eq!(
        Metric::AuthorityRepeatedPinClear.name(),
        "AuthorityRepeatedPinClear"
    );
    assert_eq!(
        Metric::AuthorityRepeatedPinClearAccounts.name(),
        "AuthorityRepeatedPinClearAccounts"
    );
}
#[tokio::test]
async fn sweep_gauge_counts_accounts_with_repeated_pin_clears() {
    let now = now_ms();
    let repeated = || pin_clear_chain([now - 60_000, now - 1_000]);
    let single = || pin_clear_chain([now - REPEATED_PIN_CLEAR_WINDOW_MS - 60_000, now - 1_000]);
    for (accounts, expected) in [
        // No repeated account among three verified accounts.
        (vec![events(), single(), events()], 0),
        // One repeated account among quiet ones.
        (vec![events(), repeated(), single()], 1),
        // Two repeated accounts: a known episode does not hide a new account.
        (vec![repeated(), single(), repeated()], 2),
    ] {
        let mut m = monitor(false, false);
        let mut accounts = accounts.into_iter();
        m.backend.rows = rows(&accounts.next().unwrap());
        m.backend.others = accounts
            .enumerate()
            .map(|(i, chain)| rows_as(&other_account(i as u8 + 2), &chain))
            .collect();
        m.sweep_authority(&config()).await.unwrap();
        assert_eq!(
            *m.backend.gauges.lock().unwrap(),
            vec![(Metric::AuthorityRepeatedPinClearAccounts, expected)],
            "{expected} accounts"
        );
        let metrics = m.backend.metrics.lock().unwrap();
        assert!(!metrics.contains(&Metric::AuthorityIntegrityFailure));
        // The deprecated per-account datum is still emitted once per account.
        assert_eq!(
            metrics
                .iter()
                .filter(|&&metric| metric == Metric::AuthorityRepeatedPinClear)
                .count() as u64,
            expected
        );
        assert_eq!(metrics.last(), Some(&Metric::AuthoritySweepCompleted));
    }
}
#[tokio::test]
async fn incomplete_sweeps_never_emit_the_repeated_pin_clear_gauge() {
    let now = now_ms();
    // Unreadable partition list.
    let m = monitor(false, true);
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
    // The first account (repeated) verifies, then the second account's fence
    // moves mid-sweep: no partial count (and no misleading 0) is reported.
    let mut m = monitor(false, false);
    m.backend.change_after = Some(3);
    m.backend.rows = rows(&pin_clear_chain([now - 60_000, now - 1_000]));
    m.backend.others = vec![rows_as(
        &other_account(2),
        &pin_clear_chain([now - 60_000, now - 1_000]),
    )];
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    let metrics = m.backend.metrics.lock().unwrap();
    // The first account was audited (deprecated per-account datum) before the failure.
    assert_eq!(metrics[0], Metric::AuthorityRepeatedPinClear);
    assert!(metrics.contains(&Metric::AuthorityCoverageFailure));
    assert!(!metrics.contains(&Metric::AuthorityRepeatedPinClearAccounts));
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
}

/// Six accounts that each verify as repeated-PIN-clear (so every verified
/// account emits one deprecated per-account datum), plus their sorted keys.
fn many_accounts() -> (Monitor<Fake>, Vec<String>) {
    let now = now_ms();
    let chain = || pin_clear_chain([now - 60_000, now - 1_000]);
    let mut m = monitor(false, false);
    m.backend.rows = rows(&chain());
    m.backend.others = (2..=6)
        .map(|n| rows_as(&other_account(n), &chain()))
        .collect();
    let mut pks: Vec<String> = std::iter::once(binding().partition_key().unwrap())
        .chain(m.backend.others.iter().map(|r| r[0].pk.clone()))
        .collect();
    pks.sort();
    (m, pks)
}
fn account_mut<'a>(m: &'a mut Monitor<Fake>, pk: &str) -> &'a mut Vec<Row> {
    if pk == binding().partition_key().unwrap() {
        &mut m.backend.rows
    } else {
        m.backend.others.iter_mut().find(|r| r[0].pk == pk).unwrap()
    }
}
fn verified_accounts(m: &Monitor<Fake>) -> usize {
    m.backend
        .metrics
        .lock()
        .unwrap()
        .iter()
        .filter(|&&metric| metric == Metric::AuthorityRepeatedPinClear)
        .count()
}
/// The first partition in sweep order is padded past a bound by `pad`; the
/// last carries a planted integrity defect that must still be found.
async fn assert_over_capacity_account_is_isolated(pad: impl FnOnce(&mut Vec<Row>)) {
    let (mut m, pks) = many_accounts();
    pad(account_mut(&mut m, &pks[0]));
    account_mut(&mut m, &pks[5]).retain(|r| r.sk != "ENROLLMENT");
    // Permanent and already alarmed: the invocation succeeds (no pointless
    // Lambda retries), but without the completion heartbeat.
    assert_eq!(m.sweep_authority(&config()).await, Ok(()));
    let metrics = m.backend.metrics.lock().unwrap().clone();
    assert_eq!(
        metrics
            .iter()
            .filter(|&&x| x == Metric::AuthorityAccountOverCapacity)
            .count(),
        1
    );
    assert_eq!(metrics[0], Metric::AuthorityAccountOverCapacity);
    assert!(metrics.contains(&Metric::AuthorityIntegrityFailure));
    assert_eq!(metrics.last(), Some(&Metric::AuthorityCoverageFailure));
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
    // The four healthy accounts after the oversized one were all verified.
    assert_eq!(verified_accounts(&m), 4);
    assert_eq!(m.backend.row_reads.lock().unwrap().len(), 6);
    assert_eq!(
        *m.backend.diagnostics.lock().unwrap(),
        vec![
            Diagnostic::AccountOverCapacity,
            Diagnostic::Incomplete {
                partitions: 6,
                over_capacity: 1,
                fence_unstable: 0
            }
        ]
    );
}
#[tokio::test]
async fn an_over_capacity_account_is_isolated_and_every_other_account_is_still_verified() {
    assert_over_capacity_account_is_isolated(|big| {
        let pk = big[0].pk.clone();
        for i in big.len()..=MAX_ACCOUNT_ROWS {
            big.push(Row {
                pk: pk.clone(),
                sk: format!("PAD#{i}"),
                payload: vec![0],
            });
        }
    })
    .await;
}
#[tokio::test]
async fn an_account_over_the_byte_bound_with_few_rows_is_isolated_the_same_way() {
    assert_over_capacity_account_is_isolated(|big| {
        let pk = big[0].pk.clone();
        let rows_before = big.len();
        for i in 0..2 {
            big.push(Row {
                pk: pk.clone(),
                sk: format!("PAD#{i}"),
                payload: vec![0; MAX_ACCOUNT_BYTES / 2],
            });
        }
        assert!(big.len() < MAX_ACCOUNT_ROWS);
        assert!(big.len() == rows_before + 2);
    })
    .await;
}
#[tokio::test]
async fn a_fence_that_changes_once_is_retried_and_the_sweep_completes() {
    let (mut m, pks) = many_accounts();
    // Read 0 is the first account's `before`, read 1 its `after` (changed);
    // the retry (reads 2 and 3) is stable.
    m.backend.change_after = Some(1);
    m.backend.change_until = Some(2);
    m.sweep_authority(&config()).await.unwrap();
    let metrics = m.backend.metrics.lock().unwrap().clone();
    assert!(!metrics.contains(&Metric::AuthorityCoverageFailure));
    assert!(!metrics.contains(&Metric::AuthorityIntegrityFailure));
    assert_eq!(metrics.last(), Some(&Metric::AuthoritySweepCompleted));
    assert_eq!(
        *m.backend.gauges.lock().unwrap(),
        vec![(Metric::AuthorityRepeatedPinClearAccounts, 6)]
    );
    assert_eq!(verified_accounts(&m), 6);
    assert_eq!(m.backend.row_reads.lock().unwrap()[&pks[0]], 2);
    assert_eq!(
        *m.backend.diagnostics.lock().unwrap(),
        vec![Diagnostic::Completed { partitions: 6 }]
    );
}
#[tokio::test]
async fn a_fence_that_keeps_changing_is_bounded_and_other_accounts_are_still_verified() {
    let (mut m, pks) = many_accounts();
    m.backend.unstable = Some(pks[0].clone());
    account_mut(&mut m, &pks[5]).retain(|r| r.sk != "ENROLLMENT");
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    assert_eq!(m.backend.row_reads.lock().unwrap()[&pks[0]], FENCE_ATTEMPTS);
    let metrics = m.backend.metrics.lock().unwrap().clone();
    // A moving fence is never a tamper alarm by itself; the planted defect is.
    assert_eq!(
        metrics
            .iter()
            .filter(|&&x| x == Metric::AuthorityIntegrityFailure)
            .count(),
        1
    );
    assert_eq!(metrics.last(), Some(&Metric::AuthorityCoverageFailure));
    assert!(!metrics.contains(&Metric::AuthorityAccountOverCapacity));
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
    assert_eq!(verified_accounts(&m), 4);
    assert_eq!(
        *m.backend.diagnostics.lock().unwrap(),
        vec![
            Diagnostic::FenceChangedAfterRetries,
            Diagnostic::Incomplete {
                partitions: 6,
                over_capacity: 0,
                fence_unstable: 1
            }
        ]
    );
}
#[test]
fn account_budget_accepts_exactly_the_limits_and_rejects_one_more() {
    let mut budget = AccountBudget::default();
    for _ in 0..MAX_ACCOUNT_ROWS {
        budget.admit(1).unwrap();
    }
    assert_eq!(budget.admit(1), Err(Error::Capacity));
    // A rejected row is not counted.
    assert_eq!(budget.rows, MAX_ACCOUNT_ROWS);
    let mut budget = AccountBudget {
        rows: 0,
        bytes: MAX_ACCOUNT_BYTES - 10,
    };
    budget.admit(10).unwrap();
    assert_eq!(budget.admit(1), Err(Error::Capacity));
    assert_eq!(budget.bytes, MAX_ACCOUNT_BYTES);
    assert_eq!(
        AccountBudget::default().admit(MAX_ACCOUNT_BYTES + 1),
        Err(Error::Capacity)
    );
}
#[test]
fn verify_account_applies_the_same_boundary_before_any_other_check() {
    let pk = binding().partition_key().unwrap();
    let filler = |n: usize| -> Vec<Row> {
        (0..n)
            .map(|i| Row {
                pk: pk.clone(),
                sk: format!("PAD#{i}"),
                payload: vec![0],
            })
            .collect()
    };
    // Exactly at the bound the rows are admitted (and then fail as malformed).
    assert_eq!(verify(&filler(MAX_ACCOUNT_ROWS)), Err(Error::Integrity));
    assert_eq!(verify(&filler(MAX_ACCOUNT_ROWS + 1)), Err(Error::Capacity));
}
#[tokio::test]
async fn sweep_failures_write_only_fixed_reason_lines() {
    let m = monitor(false, true);
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    assert_eq!(
        *m.backend.diagnostics.lock().unwrap(),
        vec![Diagnostic::PartitionScanFailed]
    );
    let pk = binding().partition_key().unwrap();
    let digits = pk.trim_start_matches("ACCOUNT#");
    for diagnostic in [
        Diagnostic::PartitionScanFailed,
        Diagnostic::PartitionScanOverCapacity,
        Diagnostic::AccountReadFailed,
        Diagnostic::AccountReadMalformed,
        Diagnostic::AccountOverCapacity,
        Diagnostic::FenceChangedAfterRetries,
        Diagnostic::DeliveryFailed,
        Diagnostic::Completed { partitions: 85 },
        Diagnostic::Incomplete {
            partitions: 85,
            over_capacity: 1,
            fence_unstable: 2,
        },
        Diagnostic::DeadlineReached {
            partitions: 500_000,
            verified: 499_999,
        },
    ] {
        let line = diagnostic.to_string();
        assert!(line.starts_with("authority sweep: "), "{line}");
        assert!(!line.contains('\n') && !line.contains(digits) && line.len() < 100);
        assert!(
            line.bytes()
                .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b" :=_".contains(&b)),
            "{line}"
        );
    }
    assert_eq!(
        Diagnostic::Incomplete {
            partitions: 85,
            over_capacity: 1,
            fence_unstable: 0
        }
        .to_string(),
        "authority sweep: incomplete partitions=85 over_capacity=1 fence_unstable=0"
    );
    assert_eq!(
        Diagnostic::DeadlineReached {
            partitions: 20_000,
            verified: 12_345
        }
        .to_string(),
        "authority sweep: deadline reached partitions=20000 verified=12345"
    );
    assert_eq!(
        Metric::AuthorityAccountOverCapacity.name(),
        "AuthorityAccountOverCapacity"
    );
    assert_eq!(Error::Capacity.to_string(), "monitor capacity exceeded");
}
#[tokio::test]
async fn a_malformed_account_read_alarms_and_every_other_account_is_still_verified() {
    let (mut m, pks) = many_accounts();
    m.backend.malformed = Some(pks[0].clone());
    // An integrity finding, like a failed history check: alarmed, and the sweep
    // still covers (and completes over) every other account.
    assert_eq!(m.sweep_authority(&config()).await, Ok(()));
    let metrics = m.backend.metrics.lock().unwrap().clone();
    assert_eq!(metrics[0], Metric::AuthorityIntegrityFailure);
    assert_eq!(verified_accounts(&m), 5);
    assert_eq!(metrics.last(), Some(&Metric::AuthoritySweepCompleted));
    assert!(
        m.backend
            .diagnostics
            .lock()
            .unwrap()
            .contains(&Diagnostic::AccountReadMalformed)
    );
}
#[tokio::test]
async fn a_failed_per_account_alarm_does_not_stop_the_rest_of_the_sweep() {
    let (mut m, pks) = many_accounts();
    let pk = pks[0].clone();
    let big = account_mut(&mut m, &pk);
    for i in big.len()..=MAX_ACCOUNT_ROWS {
        big.push(Row {
            pk: pk.clone(),
            sk: format!("PAD#{i}"),
            payload: vec![0],
        });
    }
    account_mut(&mut m, &pks[5]).retain(|r| r.sk != "ENROLLMENT");
    m.backend.failing_metric = Some(Metric::AuthorityAccountOverCapacity);
    // The run still fails (and is retried), but only after every other account
    // was verified and the planted integrity defect was found.
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    let metrics = m.backend.metrics.lock().unwrap().clone();
    assert_eq!(verified_accounts(&m), 4);
    assert!(metrics.contains(&Metric::AuthorityIntegrityFailure));
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
    assert!(
        m.backend
            .diagnostics
            .lock()
            .unwrap()
            .contains(&Diagnostic::DeliveryFailed)
    );
}

/// `n` repeated-PIN-clear accounts (so each verified one emits one deprecated
/// datum) whose every read takes 1 ms, plus their sorted keys.
fn concurrent_accounts(n: u8) -> (Monitor<Fake>, Vec<String>) {
    let now = now_ms();
    let chain = pin_clear_chain([now - 60_000, now - 1_000]);
    let mut m = monitor(false, false);
    m.backend.rows = rows(&chain);
    m.backend.others = (2..=n)
        .map(|i| rows_as(&other_account(i), &chain))
        .collect();
    m.backend.latency = Some(std::time::Duration::from_millis(1));
    let mut pks: Vec<String> = std::iter::once(binding().partition_key().unwrap())
        .chain(m.backend.others.iter().map(|r| r[0].pk.clone()))
        .collect();
    pks.sort();
    (m, pks)
}
fn count_metric(m: &Monitor<Fake>, metric: Metric) -> usize {
    m.backend
        .metrics
        .lock()
        .unwrap()
        .iter()
        .filter(|&&x| x == metric)
        .count()
}
/// Every path returned its bytes and the lane.
fn assert_nothing_held(m: &Monitor<Fake>) {
    assert_eq!(*m.backend.in_flight.lock().unwrap(), (0, 0));
}

#[tokio::test(start_paused = true)]
async fn concurrent_sweep_verifies_every_account_exactly_once_and_finds_a_planted_defect() {
    let (mut m, pks) = concurrent_accounts(40);
    account_mut(&mut m, &pks[17]).retain(|r| r.sk != "ENROLLMENT");
    // Small Scan pages split partitions across pages (one key per row), and a
    // non-adjacent duplicate on the last page must not be swept twice.
    m.backend.scan_page = 7;
    m.backend.extra_scan_keys = vec![pks[0].clone(), pks[39].clone()];
    m.sweep_authority(&config()).await.unwrap();
    let reads = m.backend.row_reads.lock().unwrap().clone();
    assert_eq!(reads.len(), 40);
    assert!(reads.values().all(|&n| n == 1), "{reads:?}");
    assert!(m.backend.scan_requests.load(Ordering::SeqCst) > 40);
    assert_eq!(count_metric(&m, Metric::AuthorityIntegrityFailure), 1);
    assert_eq!(verified_accounts(&m), 39);
    assert_eq!(
        *m.backend.gauges.lock().unwrap(),
        vec![(Metric::AuthorityRepeatedPinClearAccounts, 39)]
    );
    let metrics = m.backend.metrics.lock().unwrap().clone();
    assert_eq!(metrics.last(), Some(&Metric::AuthoritySweepCompleted));
    assert!(!metrics.contains(&Metric::AuthorityCoverageFailure));
    assert_eq!(
        *m.backend.diagnostics.lock().unwrap(),
        vec![Diagnostic::Completed { partitions: 40 }]
    );
    // Reads really overlapped, but never beyond the configured concurrency.
    let max = m.backend.max_active.load(Ordering::SeqCst);
    assert!((2..=DEFAULT_SWEEP_CONCURRENCY).contains(&max), "{max}");
    assert_nothing_held(&m);
}

#[tokio::test(start_paused = true)]
async fn concurrency_is_bounded_by_the_option_and_one_is_serial() {
    for concurrency in [1, 3] {
        let (m, _) = concurrent_accounts(12);
        m.sweep_authority_with(&config(), &SweepOptions::new(concurrency, None))
            .await
            .unwrap();
        assert_eq!(m.backend.max_active.load(Ordering::SeqCst), concurrency);
        assert_eq!(verified_accounts(&m), 12);
    }
    assert_eq!(SweepOptions::concurrency_from_env(None), Ok(16));
    assert_eq!(SweepOptions::concurrency_from_env(Some("")), Ok(16));
    assert_eq!(SweepOptions::concurrency_from_env(Some("32")), Ok(32));
    for bad in ["0", "33", "-1", "x", " 4"] {
        assert_eq!(
            SweepOptions::concurrency_from_env(Some(bad)),
            Err(Error::Configuration),
            "{bad}"
        );
    }
}

#[tokio::test(start_paused = true)]
async fn per_account_isolation_holds_under_concurrency() {
    let (mut m, pks) = concurrent_accounts(12);
    let big = account_mut(&mut m, &pks[2]);
    let pk = big[0].pk.clone();
    for i in big.len()..=MAX_ACCOUNT_ROWS {
        big.push(Row {
            pk: pk.clone(),
            sk: format!("PAD#{i}"),
            payload: vec![0],
        });
    }
    m.backend.malformed = Some(pks[5].clone());
    m.backend.unstable = Some(pks[7].clone());
    account_mut(&mut m, &pks[11]).retain(|r| r.sk != "ENROLLMENT");
    // The unstable fence makes the run retryable; nothing else stops it.
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    assert_eq!(count_metric(&m, Metric::AuthorityAccountOverCapacity), 1);
    // The malformed read and the planted defect, never the moving fence.
    assert_eq!(count_metric(&m, Metric::AuthorityIntegrityFailure), 2);
    assert_eq!(verified_accounts(&m), 8);
    assert_eq!(m.backend.row_reads.lock().unwrap()[&pks[7]], FENCE_ATTEMPTS);
    let metrics = m.backend.metrics.lock().unwrap().clone();
    // Every per-account alarm was delivered before the final coverage failure.
    assert_eq!(metrics.last(), Some(&Metric::AuthorityCoverageFailure));
    assert_eq!(count_metric(&m, Metric::AuthorityCoverageFailure), 1);
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
    let diagnostics = m.backend.diagnostics.lock().unwrap().clone();
    assert_eq!(
        diagnostics.last(),
        Some(&Diagnostic::Incomplete {
            partitions: 12,
            over_capacity: 1,
            fence_unstable: 1
        })
    );
    for d in [
        Diagnostic::AccountOverCapacity,
        Diagnostic::AccountReadMalformed,
        Diagnostic::FenceChangedAfterRetries,
    ] {
        assert_eq!(diagnostics.iter().filter(|&&x| x == d).count(), 1, "{d}");
    }
    assert_nothing_held(&m);

    // Over capacity alone: permanent, so the invocation succeeds (no retry).
    let (mut m, pks) = concurrent_accounts(12);
    let big = account_mut(&mut m, &pks[0]);
    let pk = big[0].pk.clone();
    for i in big.len()..=MAX_ACCOUNT_ROWS {
        big.push(Row {
            pk: pk.clone(),
            sk: format!("PAD#{i}"),
            payload: vec![0],
        });
    }
    // A failed per-account alarm does not stop the rest; the run then fails.
    m.backend.failing_metric = Some(Metric::AuthorityAccountOverCapacity);
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    assert_eq!(verified_accounts(&m), 11);
    assert!(
        m.backend
            .diagnostics
            .lock()
            .unwrap()
            .contains(&Diagnostic::DeliveryFailed)
    );
    assert!(count_metric(&m, Metric::AuthoritySweepCompleted) == 0);
    assert_nothing_held(&m);
}

#[tokio::test(start_paused = true)]
async fn large_accounts_take_one_lane_so_in_flight_row_bytes_stay_bounded() {
    let (mut m, pks) = concurrent_accounts(20);
    // Eight accounts of ~3 MiB of well-formed junk (several 1 MB pages each):
    // they must each take the single lane, and each fails verification.
    for pk in &pks[..8] {
        let rows = account_mut(&mut m, pk);
        for i in 0..48 {
            rows.push(Row {
                pk: pk.clone(),
                sk: format!("PAD#{i}"),
                payload: vec![0; 64 * 1024],
            });
        }
    }
    m.sweep_authority(&config()).await.unwrap();
    assert_eq!(count_metric(&m, Metric::AuthorityIntegrityFailure), 8);
    assert_eq!(verified_accounts(&m), 12);
    assert_eq!(m.backend.row_reads.lock().unwrap().len(), 20);
    assert_eq!(
        count_metric(&m, Metric::AuthoritySweepCompleted),
        1,
        "integrity findings do not block completion"
    );
    let (max_bytes, max_large) = *m.backend.max_in_flight.lock().unwrap();
    // The lane was used, by one account at a time.
    assert_eq!(max_large, 1);
    assert!(max_bytes > LARGE_ACCOUNT_BYTES, "{max_bytes}");
    // At most one account is past the threshold with all its rows; every
    // other in-flight account holds at most the threshold plus one page.
    let full: usize = account_mut(&mut m, &pks[0])
        .iter()
        .map(|r| r.payload.len())
        .sum();
    assert!(full > 3 * 1024 * 1024);
    assert!(
        max_bytes
            <= full + (DEFAULT_SWEEP_CONCURRENCY - 1) * (LARGE_ACCOUNT_BYTES + MAX_PAGE_BYTES),
        "{max_bytes}"
    );
    // Holding every large account at once would need 8 x `full`.
    assert!(max_bytes < 4 * full, "{max_bytes}");
    assert!(max_bytes <= in_flight_bound(DEFAULT_SWEEP_CONCURRENCY));
    assert_nothing_held(&m);
    // The configured bound fits the 1024 MiB Lambda with room for parsing
    // (README capacity note).
    assert!(in_flight_bound(MAX_SWEEP_CONCURRENCY) < 256 * 1024 * 1024);
}

#[tokio::test(start_paused = true)]
async fn a_deadline_already_inside_the_margin_starts_nothing_and_reports_coverage_failure() {
    let (m, _) = concurrent_accounts(3);
    let deadline = Instant::now() + DEADLINE_MARGIN - std::time::Duration::from_secs(1);
    let options = SweepOptions::new(16, Some(deadline));
    // Not retried: a retry would hit the same deadline.
    assert_eq!(m.sweep_authority_with(&config(), &options).await, Ok(()));
    assert_eq!(m.backend.scan_requests.load(Ordering::SeqCst), 0);
    assert_eq!(
        *m.backend.metrics.lock().unwrap(),
        vec![Metric::AuthorityCoverageFailure]
    );
    assert_eq!(
        *m.backend.diagnostics.lock().unwrap(),
        vec![Diagnostic::DeadlineReached {
            partitions: 0,
            verified: 0
        }]
    );
}

#[tokio::test(start_paused = true)]
async fn the_deadline_stops_new_accounts_and_in_flight_ones_finish_without_a_heartbeat() {
    let (mut m, pks) = concurrent_accounts(40);
    account_mut(&mut m, &pks[0]).retain(|r| r.sk != "ENROLLMENT");
    m.backend.latency = Some(std::time::Duration::from_millis(10));
    let start = Instant::now();
    let deadline = start + DEADLINE_MARGIN + std::time::Duration::from_millis(45);
    let options = SweepOptions::new(4, Some(deadline));
    assert_eq!(m.sweep_authority_with(&config(), &options).await, Ok(()));
    // Stopped at the margin, long before the deadline itself.
    assert!(Instant::now() < deadline - DEADLINE_ABANDON);
    let diagnostics = m.backend.diagnostics.lock().unwrap().clone();
    let [
        Diagnostic::DeadlineReached {
            partitions,
            verified,
        },
    ] = diagnostics[..]
    else {
        panic!("{diagnostics:?}");
    };
    let started = m.backend.row_reads.lock().unwrap().len();
    // Every started account finished (none abandoned), and not all started.
    assert_eq!(verified, started);
    assert!((1..40).contains(&verified), "{verified}");
    assert!(partitions >= verified);
    // The planted defect in the first account was still alarmed.
    assert_eq!(count_metric(&m, Metric::AuthorityIntegrityFailure), 1);
    let metrics = m.backend.metrics.lock().unwrap().clone();
    assert_eq!(metrics.last(), Some(&Metric::AuthorityCoverageFailure));
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
    assert!(m.backend.gauges.lock().unwrap().is_empty());
    assert_nothing_held(&m);
}

#[tokio::test(start_paused = true)]
async fn an_account_still_reading_near_the_deadline_is_abandoned_and_the_failure_still_reported() {
    let (mut m, pks) = concurrent_accounts(6);
    m.backend.slow = Some((pks[3].clone(), std::time::Duration::from_secs(600)));
    let deadline = Instant::now() + std::time::Duration::from_secs(120);
    let options = SweepOptions::new(16, Some(deadline));
    assert_eq!(m.sweep_authority_with(&config(), &options).await, Ok(()));
    // Reported at the abandon point, before Lambda would kill the invocation.
    let now = Instant::now();
    assert!(now >= deadline - DEADLINE_ABANDON && now < deadline);
    assert_eq!(
        *m.backend.diagnostics.lock().unwrap(),
        vec![Diagnostic::DeadlineReached {
            partitions: 6,
            verified: 5
        }]
    );
    assert_eq!(verified_accounts(&m), 5);
    let metrics = m.backend.metrics.lock().unwrap().clone();
    assert_eq!(metrics.last(), Some(&Metric::AuthorityCoverageFailure));
    assert!(!metrics.contains(&Metric::AuthoritySweepCompleted));
    assert_nothing_held(&m);
}

#[tokio::test(start_paused = true)]
async fn a_last_account_finishing_after_the_stop_point_still_completes_the_sweep() {
    // Every account is started before `stop_at`; one finishes between `stop_at`
    // and the abandon point. Nothing was skipped, so the sweep completed.
    let (mut m, pks) = concurrent_accounts(6);
    let deadline = Instant::now() + std::time::Duration::from_secs(120);
    let finishes_after_stop = deadline - DEADLINE_MARGIN + std::time::Duration::from_secs(10);
    assert!(finishes_after_stop < deadline - DEADLINE_ABANDON);
    // The fake applies the delay to each of the account's three reads.
    m.backend.slow = Some((pks[3].clone(), (finishes_after_stop - Instant::now()) / 3));
    let options = SweepOptions::new(16, Some(deadline));
    assert_eq!(m.sweep_authority_with(&config(), &options).await, Ok(()));
    assert!(Instant::now() >= deadline - DEADLINE_MARGIN);
    assert_eq!(verified_accounts(&m), 6);
    assert_eq!(count_metric(&m, Metric::AuthoritySweepCompleted), 1);
    assert_eq!(count_metric(&m, Metric::AuthorityCoverageFailure), 0);
    assert!(
        !m.backend
            .diagnostics
            .lock()
            .unwrap()
            .iter()
            .any(|d| matches!(d, Diagnostic::DeadlineReached { .. }))
    );
    assert_nothing_held(&m);
}

#[tokio::test]
async fn partition_scan_bounds_and_malformed_keys_never_report_partial_success() {
    // More distinct partitions than the sanity bound.
    let (m, _) = concurrent_accounts(5);
    let options = SweepOptions {
        max_partitions: 4,
        ..SweepOptions::default()
    };
    assert_eq!(m.sweep_authority_with(&config(), &options).await, Ok(()));
    assert!(
        m.backend
            .diagnostics
            .lock()
            .unwrap()
            .contains(&Diagnostic::PartitionScanOverCapacity)
    );
    assert_eq!(count_metric(&m, Metric::AuthorityCoverageFailure), 1);
    assert_eq!(count_metric(&m, Metric::AuthoritySweepCompleted), 0);
    // More Scan pages than the sanity bound.
    let (mut m, _) = concurrent_accounts(5);
    m.backend.scan_page = 3;
    let options = SweepOptions {
        max_scan_pages: 4,
        ..SweepOptions::default()
    };
    assert_eq!(m.sweep_authority_with(&config(), &options).await, Ok(()));
    assert_eq!(m.backend.scan_requests.load(Ordering::SeqCst), 4);
    assert_eq!(count_metric(&m, Metric::AuthorityCoverageFailure), 1);
    assert_eq!(count_metric(&m, Metric::AuthoritySweepCompleted), 0);
    // A malformed key is an integrity finding (never downgraded), not coverage.
    let (mut m, _) = concurrent_accounts(5);
    m.backend.extra_scan_keys = vec!["ACCOUNT#NOT-HEX".into()];
    assert_eq!(m.sweep_authority(&config()).await, Err(Error::Unavailable));
    assert_eq!(count_metric(&m, Metric::AuthorityIntegrityFailure), 1);
    assert_eq!(count_metric(&m, Metric::AuthoritySweepCompleted), 0);
    assert!(
        m.backend
            .diagnostics
            .lock()
            .unwrap()
            .contains(&Diagnostic::PartitionScanFailed)
    );
}

#[tokio::test(start_paused = true)]
async fn a_lost_alarm_is_retried_even_when_a_scan_bound_stops_the_sweep_later() {
    // Accounts are checked while the Scan still streams, so a per-account
    // alarm can fail before a Scan sanity bound (Capacity, normally not
    // retried) is hit. The lost alarm must still make the run fail and retry.
    let (mut m, pks) = concurrent_accounts(6);
    account_mut(&mut m, &pks[0]).retain(|r| r.sk != "ENROLLMENT");
    m.backend.scan_page = 1;
    m.backend.failing_metric = Some(Metric::AuthorityIntegrityFailure);
    let options = SweepOptions {
        max_partitions: 4,
        ..SweepOptions::default()
    };
    assert_eq!(
        m.sweep_authority_with(&config(), &options).await,
        Err(Error::Unavailable)
    );
    let diagnostics = m.backend.diagnostics.lock().unwrap().clone();
    let failed = diagnostics
        .iter()
        .position(|&d| d == Diagnostic::DeliveryFailed)
        .unwrap();
    let bound = diagnostics
        .iter()
        .position(|&d| d == Diagnostic::PartitionScanOverCapacity)
        .unwrap();
    assert!(failed < bound, "{diagnostics:?}");
    assert_eq!(count_metric(&m, Metric::AuthorityCoverageFailure), 1);
    assert_eq!(count_metric(&m, Metric::AuthoritySweepCompleted), 0);
    assert_nothing_held(&m);
}

#[tokio::test(start_paused = true)]
async fn alarm_deliveries_in_flight_hold_back_new_accounts() {
    // Every account raises an integrity alarm and each delivery is slow: the
    // concurrent sweep must not fire them all at CloudWatch/SNS at once.
    let (mut m, pks) = concurrent_accounts(40);
    for pk in &pks {
        account_mut(&mut m, pk).retain(|r| r.sk != "ENROLLMENT");
    }
    m.backend.delivery_latency = Some(std::time::Duration::from_millis(100));
    let concurrency = 4;
    m.sweep_authority_with(&config(), &SweepOptions::new(concurrency, None))
        .await
        .unwrap();
    // Every alarm was delivered, and integrity findings do not block completion.
    assert_eq!(count_metric(&m, Metric::AuthorityIntegrityFailure), 40);
    assert_eq!(count_metric(&m, Metric::AuthoritySweepCompleted), 1);
    let max = m.backend.max_deliveries.load(Ordering::SeqCst);
    // Admission waits while `concurrency` deliveries are pending; accounts
    // already in flight may each add one more.
    assert!((2..2 * concurrency).contains(&max), "{max}");
    assert_nothing_held(&m);
}

#[tokio::test(start_paused = true)]
async fn skipped_account_counts_are_logged_even_when_the_deadline_ends_the_sweep() {
    let (mut m, pks) = concurrent_accounts(6);
    m.backend.unstable = Some(pks[0].clone());
    m.backend.slow = Some((pks[5].clone(), std::time::Duration::from_secs(600)));
    let deadline = Instant::now() + std::time::Duration::from_secs(120);
    let options = SweepOptions::new(16, Some(deadline));
    assert_eq!(m.sweep_authority_with(&config(), &options).await, Ok(()));
    let diagnostics = m.backend.diagnostics.lock().unwrap().clone();
    assert_eq!(
        diagnostics[diagnostics.len() - 2..],
        [
            Diagnostic::DeadlineReached {
                partitions: 6,
                verified: 4
            },
            Diagnostic::Incomplete {
                partitions: 6,
                over_capacity: 0,
                fence_unstable: 1
            }
        ]
    );
    assert_eq!(count_metric(&m, Metric::AuthorityCoverageFailure), 1);
    assert_eq!(count_metric(&m, Metric::AuthoritySweepCompleted), 0);
}

#[test]
fn deadline_from_the_lambda_context_is_relative_to_now() {
    let in_ten_minutes = deadline_from_epoch_ms(now_ms() + 600_000);
    let remaining = in_ten_minutes - Instant::now();
    assert!(
        remaining > std::time::Duration::from_secs(590),
        "{remaining:?}"
    );
    // A deadline in the past (or a missing 0) stops at once, loudly.
    assert!(deadline_from_epoch_ms(0) <= Instant::now());
}
