//! Authority sweep throughput benchmark (README "Capacity note").
//!
//! A fake backend answers every Scan, GetItem and Query page after a fixed
//! latency (default 8 ms, roughly a strongly consistent DynamoDB read from
//! Lambda) for N small, validly signed accounts (one Enroll: three rows), then
//! times full sweeps at concurrency 1 and 16. Verification CPU is real.
//!
//! Ignored by default (the serial run takes minutes). Run in release:
//! `cargo test --release --test sweep_bench -- --ignored --nocapture`
//! Overrides: `SWEEP_BENCH_ACCOUNTS` (default 20000), `SWEEP_BENCH_LATENCY_MS`
//! (default 8), `SWEEP_BENCH_CONCURRENCY` (comma list, default "1,16").
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
    time::{TimeEvidence, TrustedInterval},
    wire::EscrowEnvelope,
};
use escrow_ledger_monitor::{
    Backend, Head, Metric, Monitor, Result, TrustedKeys,
    authority::{AuthorityBackend, AuthorityTrust, Config, Diagnostic, Page, Row, SweepOptions},
};
use p256::ecdsa::{Signature, SigningKey, signature::hazmat::PrehashSigner};
use serde_json::{Value, json};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

fn key() -> SigningKey {
    SigningKey::from_slice(&[42; 32]).unwrap()
}
fn envelope() -> EscrowEnvelope {
    let file: Value = serde_json::from_str(include_str!(
        "../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
    ))
    .unwrap();
    serde_json::from_value(file["blobs"][0]["envelope"].clone()).unwrap()
}
fn binding(n: u32) -> Binding {
    let mut did_hash = [7; 32];
    did_hash[..4].copy_from_slice(&n.to_be_bytes());
    Binding {
        tenant: "learncard".into(),
        generation: "g1".into(),
        did_hash,
    }
}
/// One committed Enroll: execution row, operation row, account row.
fn account(n: u32, envelope: &EscrowEnvelope) -> Vec<Row> {
    let binding = binding(n);
    let pk = binding.partition_key().unwrap();
    let blob = escrow_blob_identity(envelope).unwrap();
    let pin = PinState {
        generation: Counter::try_from(1).unwrap(),
        configured: true,
        attempts_used: 0,
    };
    let revisions = Revisions {
        operation: Counter::try_from(1).unwrap(),
        enrollment: Counter::try_from(1).unwrap(),
    };
    let event = AuthorityEvent {
        binding: binding.clone(),
        request_id: "request-2".into(),
        kind: OperationKind::Enroll,
        outcome: OperationOutcome::Committed,
        previous_revisions: None,
        revisions,
        previous_pin: None,
        pin,
        epoch: Counter::try_from(1).unwrap(),
        source_identity: None,
        target_identity: Some(blob),
        share_version: Some(1),
        rewrap_delegated: true,
        hold_id: None,
        hold_status: None,
        request_digest: [2; 32],
        time: TimeEvidence {
            interval: TrustedInterval {
                lo_ms: 1000,
                hi_ms: 1001,
            },
            sources: vec![],
        },
    };
    let mut record = SignedAuthorityRecord {
        version: 1,
        kind: RecordKind::Proposal,
        key_id: "key".into(),
        measurement: [7; 32],
        payload: STANDARD.encode(serde_json::to_vec(&event).unwrap()),
        signature: String::new(),
    };
    let sig: Signature = key().sign_prehash(&record.signing_hash().unwrap()).unwrap();
    record.signature = STANDARD.encode(sig.normalize_s().to_bytes());
    let proposal = serde_json::to_vec(&record).unwrap();
    let id = [1; 16];
    let stored = |value| {
        let item = StoredItem {
            schema_version: 1,
            binding: binding.clone(),
            value,
        };
        Row {
            pk: pk.clone(),
            sk: item.sort_key().unwrap(),
            payload: item.encode().unwrap(),
        }
    };
    vec![
        Row {
            pk: pk.clone(),
            sk: format!("EXECUTION#{}", hex::encode(id)),
            payload: serde_json::to_vec(&ExecutionRecord {
                receipt: CommitReceipt {
                    schema_version: 1,
                    binding: binding.clone(),
                    execution_id: id,
                    revisions,
                    transaction_digest: [9; 32],
                },
                proposed_event: proposal.clone(),
            })
            .unwrap(),
        },
        stored(ItemValue::Operation(OperationItem {
            request_id: event.request_id.clone(),
            execution_id: id,
            kind: event.kind,
            outcome: event.outcome,
            revisions,
            request_digest: event.request_digest,
            proposed_event: proposal,
        })),
        stored(ItemValue::Enrollment(EnrollmentItem {
            revisions,
            epoch: event.epoch,
            pin,
            intent_digest: [2; 32],
            enrollment: EnrollmentStatus::Active {
                blob: Box::new(ActiveBlob {
                    identity: blob,
                    envelope: envelope.clone(),
                    share_version: 1,
                    chain_head: None,
                    rewrap_delegated: true,
                }),
            },
            email_throttle: None,
        })),
    ]
}

struct Fake {
    accounts: HashMap<String, Vec<Row>>,
    /// One key per row, in partition order, like a `pk` projection Scan.
    scan: Vec<String>,
    latency: Duration,
    metrics: Mutex<Vec<Metric>>,
    diagnostics: Mutex<Vec<Diagnostic>>,
}
#[async_trait::async_trait]
impl Backend for Fake {
    async fn head(&self, _: &str) -> Result<Option<Head>> {
        unreachable!()
    }
    async fn chain(&self, _: &str) -> Result<Vec<Vec<u8>>> {
        unreachable!()
    }
    async fn audit(&self, _: &str) -> Result<Option<Vec<u8>>> {
        unreachable!()
    }
    async fn metric(&self, m: Metric) -> Result<()> {
        self.metrics.lock().unwrap().push(m);
        Ok(())
    }
    async fn gauge(&self, m: Metric, _: u64) -> Result<()> {
        self.metrics.lock().unwrap().push(m);
        Ok(())
    }
    async fn notify(&self, _: Metric) -> Result<()> {
        Ok(())
    }
}
#[async_trait::async_trait]
impl AuthorityBackend for Fake {
    type Cursor = usize;
    async fn authority_partition_page(
        &self,
        _: &str,
        cursor: Option<usize>,
    ) -> Result<Page<String, usize>> {
        tokio::time::sleep(self.latency).await;
        let start = cursor.unwrap_or(0);
        let end = (start + 100).min(self.scan.len());
        Ok(Page {
            items: self.scan[start..end].to_vec(),
            next: (end < self.scan.len()).then_some(end),
        })
    }
    async fn authority_account(&self, _: &str, pk: &str) -> Result<Option<Vec<u8>>> {
        tokio::time::sleep(self.latency).await;
        Ok(self.accounts[pk]
            .iter()
            .find(|r| r.sk == "ENROLLMENT")
            .map(|r| r.payload.clone()))
    }
    async fn authority_rows_page(
        &self,
        _: &str,
        pk: &str,
        _: Option<usize>,
    ) -> Result<Page<Row, usize>> {
        tokio::time::sleep(self.latency).await;
        Ok(Page {
            items: self.accounts[pk].clone(),
            next: None,
        })
    }
    fn diagnose(&self, diagnostic: Diagnostic) {
        self.diagnostics.lock().unwrap().push(diagnostic);
    }
}

fn env<T: std::str::FromStr>(name: &str, default: T) -> T {
    std::env::var(name)
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}

#[tokio::test(flavor = "multi_thread")]
#[ignore = "sweep benchmark: run in release with --ignored --nocapture"]
async fn sweep_wall_time_at_concurrency_1_and_16() {
    let n: u32 = env("SWEEP_BENCH_ACCOUNTS", 20_000);
    let latency = Duration::from_millis(env("SWEEP_BENCH_LATENCY_MS", 8));
    let levels: Vec<usize> = std::env::var("SWEEP_BENCH_CONCURRENCY")
        .unwrap_or_else(|_| "1,16".into())
        .split(',')
        .map(|v| v.trim().parse().unwrap())
        .collect();
    let built = Instant::now();
    let envelope = envelope();
    let mut accounts: Vec<Vec<Row>> = (0..n).map(|i| account(i, &envelope)).collect();
    accounts.sort_by(|a, b| a[0].pk.cmp(&b[0].pk));
    let scan = accounts
        .iter()
        .flat_map(|rows| rows.iter().map(|r| r.pk.clone()))
        .collect();
    let accounts = accounts.into_iter().map(|r| (r[0].pk.clone(), r)).collect();
    println!("built {n} accounts in {:.1?}", built.elapsed());
    let config = Config {
        table: "authority".into(),
        generation: "g1".into(),
        trust: AuthorityTrust::parse(
            &json!({"key":{"publicKey":hex::encode(key().verifying_key().to_sec1_point(false).as_bytes()),"measurements":["07".repeat(32)]}}).to_string(),
        )
        .unwrap(),
    };
    let monitor = Monitor {
        tenant: "learncard".into(),
        key: TrustedKeys::Legacy(*key().verifying_key()),
        backend: Fake {
            accounts,
            scan,
            latency,
            metrics: Mutex::new(vec![]),
            diagnostics: Mutex::new(vec![]),
        },
    };
    for concurrency in levels {
        monitor.backend.metrics.lock().unwrap().clear();
        monitor.backend.diagnostics.lock().unwrap().clear();
        let started = Instant::now();
        monitor
            .sweep_authority_with(&config, &SweepOptions::new(concurrency, None))
            .await
            .unwrap();
        let elapsed = started.elapsed();
        assert_eq!(
            *monitor.backend.diagnostics.lock().unwrap(),
            vec![Diagnostic::Completed {
                partitions: n as usize
            }]
        );
        assert!(
            !monitor
                .backend
                .metrics
                .lock()
                .unwrap()
                .contains(&Metric::AuthorityIntegrityFailure)
        );
        println!(
            "concurrency={concurrency} accounts={n} latency={latency:?} wall={elapsed:.1?} \
             per_account={:.2} ms accounts_per_840s={:.0}",
            elapsed.as_secs_f64() * 1000.0 / f64::from(n),
            840.0 * f64::from(n) / elapsed.as_secs_f64(),
        );
    }
}
