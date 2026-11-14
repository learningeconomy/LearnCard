//! Capacity probe for the per-account bounds (README "Capacity note").
//!
//! Builds one synthetic account at whichever bound binds first, with rows at
//! least the measured staging mean (~7.3 KB; the padding step lands near 8 KB:
//! a ~2 KB signed proposal serialized as a JSON byte array, as the enclave
//! stores it) and measures peak heap while holding the rows and running
//! `verify_account`. Every proposal is validly signed and parsed; the synthetic
//! history then fails the transition check, which runs after all rows are parsed,
//! so the measured peak covers the full parse phase.
//!
//! Ignored by default (thousands of ECDSA signatures). Run in release:
//! `cargo test --release --test capacity -- --ignored --nocapture`
use base64::{Engine, engine::general_purpose::STANDARD};
use escrow_enclave::{
    authority::{
        audit::{AuthorityEvent, CommitReceipt, ExecutionRecord},
        record::{RecordKind, SignedAuthorityRecord},
        state::{
            ActiveBlob, Binding, Counter, EnrollmentItem, EnrollmentStatus, ItemValue,
            OperationItem, OperationKind, OperationOutcome, PinState, Revisions, StoredItem,
        },
    },
    crypto::escrow_blob_identity,
    time::{SourceEvidence, TimeEvidence, TrustedInterval},
    wire::EscrowEnvelope,
};
use escrow_ledger_monitor::{
    Error,
    authority::{AuthorityTrust, MAX_ACCOUNT_BYTES, MAX_ACCOUNT_ROWS, Row, verify_account},
};
use p256::ecdsa::{Signature, SigningKey, signature::hazmat::PrehashSigner};
use serde_json::{Value, json};
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering::SeqCst};

struct Counting;
static CURRENT: AtomicUsize = AtomicUsize::new(0);
static PEAK: AtomicUsize = AtomicUsize::new(0);
unsafe impl GlobalAlloc for Counting {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let ptr = unsafe { System.alloc(layout) };
        if !ptr.is_null() {
            let now = CURRENT.fetch_add(layout.size(), SeqCst) + layout.size();
            PEAK.fetch_max(now, SeqCst);
        }
        ptr
    }
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        unsafe { System.dealloc(ptr, layout) };
        CURRENT.fetch_sub(layout.size(), SeqCst);
    }
}
#[global_allocator]
static ALLOCATOR: Counting = Counting;

/// Mean measured staging row size (bytes).
const TARGET_ROW_BYTES: usize = 7_300;
const MIB: f64 = 1024.0 * 1024.0;

fn count(n: u64) -> Counter {
    Counter::try_from(n).unwrap()
}
fn key() -> SigningKey {
    SigningKey::from_slice(&[42; 32]).unwrap()
}
fn binding() -> Binding {
    Binding {
        tenant: "learncard".into(),
        generation: "g1".into(),
        did_hash: [1; 32],
    }
}
fn envelope() -> EscrowEnvelope {
    let file: Value = serde_json::from_str(include_str!(
        "../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
    ))
    .unwrap();
    serde_json::from_value(file["blobs"][0]["envelope"].clone()).unwrap()
}
fn event(revision: u64, sources: usize) -> AuthorityEvent {
    let pin = PinState {
        generation: count(1),
        configured: true,
        attempts_used: 0,
    };
    let blob = escrow_blob_identity(&envelope()).unwrap();
    AuthorityEvent {
        binding: binding(),
        request_id: format!("request-{revision}"),
        kind: OperationKind::Enroll,
        outcome: OperationOutcome::Committed,
        previous_revisions: (revision > 1).then(|| Revisions {
            operation: count(revision - 1),
            enrollment: count(1),
        }),
        revisions: Revisions {
            operation: count(revision),
            enrollment: count(1),
        },
        previous_pin: (revision > 1).then_some(pin),
        pin,
        epoch: count(1),
        source_identity: (revision > 1).then_some(blob),
        target_identity: Some(blob),
        share_version: Some(1),
        rewrap_delegated: true,
        hold_id: None,
        hold_status: None,
        request_digest: [3; 32],
        time: TimeEvidence {
            interval: TrustedInterval {
                lo_ms: 1000,
                hi_ms: 1001,
            },
            // Padding to a realistic proposal size (real rows carry Roughtime evidence).
            sources: (0..sources)
                .map(|i| SourceEvidence {
                    server_id: format!("roughtime-{i}"),
                    midpoint_ms: 1000,
                    radius_ms: 1,
                    response_hash: [i as u8; 32],
                })
                .collect(),
        },
    }
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
fn execution_id(revision: u64) -> [u8; 16] {
    let mut id = [0; 16];
    id[..8].copy_from_slice(&revision.to_be_bytes());
    id
}
fn stored(value: ItemValue) -> Row {
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
/// One execution row and one operation row per revision, plus the account row.
fn account(rows: usize, sources: usize) -> Vec<Row> {
    let revisions = (rows - 1) / 2;
    let mut result = Vec::with_capacity(rows);
    for revision in 1..=revisions as u64 {
        let event = event(revision, sources);
        let proposal = signed(&event);
        let id = execution_id(revision);
        result.push(Row {
            pk: binding().partition_key().unwrap(),
            sk: format!("EXECUTION#{}", hex::encode(id)),
            payload: serde_json::to_vec(&ExecutionRecord {
                receipt: CommitReceipt {
                    schema_version: 1,
                    binding: binding(),
                    execution_id: id,
                    revisions: event.revisions,
                    transaction_digest: [9; 32],
                },
                proposed_event: proposal.clone(),
            })
            .unwrap(),
        });
        result.push(stored(ItemValue::Operation(OperationItem {
            request_id: event.request_id.clone(),
            execution_id: id,
            kind: event.kind,
            outcome: event.outcome,
            revisions: event.revisions,
            request_digest: event.request_digest,
            proposed_event: proposal,
        })));
    }
    let last = event(revisions as u64, 0);
    result.push(stored(ItemValue::Enrollment(EnrollmentItem {
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
    result
}

#[test]
#[ignore = "capacity probe: run in release with --ignored --nocapture"]
fn peak_heap_for_a_full_account_fits_the_lambda() {
    // Smallest Roughtime padding that reaches the measured staging row size
    // (sampled at revision 2, which carries the previous-state fields).
    let sources = (0..64)
        .find(|&n| {
            let sample = account(5, n);
            (sample[2].payload.len() + sample[3].payload.len()) / 2 >= TARGET_ROW_BYTES
        })
        .unwrap();
    // Whichever bound binds first at this row size (rows grow slightly with
    // the revision number, so leave 2% slack under the byte bound).
    let sample = account(5, sources);
    let mean = (sample[2].payload.len() + sample[3].payload.len()) / 2;
    let rows = account(
        MAX_ACCOUNT_ROWS.min(MAX_ACCOUNT_BYTES / 102 * 100 / mean),
        sources,
    );
    let bytes: usize = rows.iter().map(|r| r.payload.len()).sum();
    assert!(bytes <= MAX_ACCOUNT_BYTES, "probe exceeds the byte bound");
    let trust = AuthorityTrust::parse(
        &json!({"key":{"publicKey":hex::encode(key().verifying_key().to_sec1_point(false).as_bytes()),"measurements":["07".repeat(32)]}}).to_string(),
    )
    .unwrap();
    let pk = binding().partition_key().unwrap();
    let held = CURRENT.load(SeqCst);
    PEAK.store(held, SeqCst);
    let started = std::time::Instant::now();
    let result = verify_account("learncard", "g1", &pk, &rows, &trust);
    let elapsed = started.elapsed();
    let peak = PEAK.load(SeqCst);
    // Every proposal parsed and verified; the synthetic history fails later.
    assert_eq!(result, Err(Error::Integrity));
    println!(
        "rows={} payload={:.1} MiB mean_row={} B heap_held={:.1} MiB \
         verify_peak={:.1} MiB verify_extra={:.1} MiB verify_time={:.2?}",
        rows.len(),
        bytes as f64 / MIB,
        bytes / rows.len(),
        held as f64 / MIB,
        peak as f64 / MIB,
        (peak - held) as f64 / MIB,
        elapsed,
    );
    // Worst case scales to the byte bound, not the row bound (payloads up to
    // 64 KiB). Peak must stay well inside the 1024 MiB Lambda at that bound.
    let projected = peak as f64 * MAX_ACCOUNT_BYTES as f64 / bytes as f64;
    println!("projected_peak_at_byte_bound={:.1} MiB", projected / MIB);
    assert!(projected < 512.0 * MIB);
}
