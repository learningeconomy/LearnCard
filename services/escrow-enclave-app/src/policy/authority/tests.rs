use super::*;
use crate::{
    authority::{
        intent::EnrollmentIntent,
        store::{
            fake::{FakeDatabase, WriteFault},
            CommitReceipt, ReconcileTicket, Scope, StoreFuture,
        },
    },
    crypto::{decrypt_escrow_blob, encrypt_escrow_blob, generate_escrow_key_pair},
    ledger::FakeHeadStore,
    time::{TimeFuture, TrustedInterval},
};
use ed25519_dalek::{Signer, SigningKey};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Mutex,
};
use tokio::sync::Notify;

struct Clock(Mutex<u64>);
impl TimeSource for Clock {
    fn now(&self, _: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async {
            let now = *self.0.lock().unwrap();
            Ok(TimeEvidence {
                interval: TrustedInterval {
                    lo_ms: now,
                    hi_ms: now,
                },
                sources: vec![],
            })
        })
    }
}
#[derive(Clone, Copy)]
enum Fault {
    Before,
    After,
    Readback,
}
struct Gate {
    call: usize,
    after_commit: bool,
    entered: Arc<Notify>,
    resume: Arc<Notify>,
}
struct Hooks {
    inner: Arc<dyn AuthorityStore>,
    db: FakeDatabase,
    calls: AtomicUsize,
    fault: Mutex<Option<(usize, Fault)>>,
    gate: Mutex<Option<Gate>>,
    network_time: Mutex<Option<Arc<BudgetTime>>>,
}
impl Hooks {
    async fn aws_round(&self) {
        let time = self.network_time.lock().unwrap().clone();
        if let Some(time) = time {
            time.now(None).await.unwrap();
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    }
}
impl AuthorityStore for Hooks {
    fn load<'a>(
        &'a self,
        b: &'a Binding,
        r: &'a str,
        h: Option<&'a str>,
    ) -> StoreFuture<'a, Snapshot> {
        Box::pin(async move {
            self.aws_round().await;
            let result = self.inner.load(b, r, h).await;
            tokio::task::yield_now().await;
            result
        })
    }
    fn commit(&self, transition: Transition) -> StoreFuture<'_, CommitOutcome> {
        Box::pin(async move {
            self.aws_round().await; // conditional AWS transaction
            let call = self.calls.fetch_add(1, Ordering::SeqCst) + 1;
            let gate = {
                let mut gate = self.gate.lock().unwrap();
                if gate.as_ref().is_some_and(|g| g.call == call) {
                    gate.take()
                } else {
                    None
                }
            };
            if let Some(gate) = gate.as_ref().filter(|g| !g.after_commit) {
                gate.entered.notify_one();
                gate.resume.notified().await;
            }
            let fault = {
                let mut f = self.fault.lock().unwrap();
                if f.as_ref().is_some_and(|f| f.0 == call) {
                    f.take().map(|f| f.1)
                } else {
                    None
                }
            };
            match fault {
                Some(Fault::Before) => self.db.fail_next_write(WriteFault::BeforeCommit)?,
                Some(Fault::After) => self.db.fail_next_write(WriteFault::AfterCommit)?,
                Some(Fault::Readback) => self.db.fail_next_read()?,
                None => {}
            }
            let outcome = self.inner.commit(transition).await;
            self.aws_round().await; // receipt readback
            if let Some(gate) = gate.as_ref().filter(|g| g.after_commit) {
                gate.entered.notify_one();
                gate.resume.notified().await;
            }
            outcome
        })
    }
    fn reconcile<'a>(&'a self, t: &'a ReconcileTicket) -> StoreFuture<'a, CommitOutcome> {
        self.inner.reconcile(t)
    }
    fn receipt<'a>(
        &'a self,
        b: &'a Binding,
        id: [u8; 16],
    ) -> StoreFuture<'a, Option<CommitReceipt>> {
        Box::pin(async move {
            self.aws_round().await;
            self.inner.receipt(b, id).await
        })
    }
}
struct Fixture {
    keys: EscrowKeyPair,
    old: EscrowKeyPair,
    client: EscrowKeyPair,
    signer: SigningKey,
    did: String,
    store: Arc<Hooks>,
    authority: AuthorityEnrollment,
    time: Clock,
    ledger: FakeHeadStore,
    email: crate::authority::email::fake::FakeEmailSender,
}
fn copy(keys: &EscrowKeyPair) -> EscrowKeyPair {
    EscrowKeyPair {
        public_key: keys.public_key.clone(),
        private_key: keys.private_key.clone(),
    }
}
impl Fixture {
    fn new() -> Self {
        let db = FakeDatabase::default();
        let store = Arc::new(Hooks {
            inner: Arc::new(db.store(Scope::new("tenant".into(), "g1".into()).unwrap())),
            db,
            calls: AtomicUsize::new(0),
            fault: Mutex::new(None),
            gate: Mutex::new(None),
            network_time: Mutex::new(None),
        });
        let signer = SigningKey::from_bytes(&[8; 32]);
        let mut key = vec![0xed, 1];
        key.extend(signer.verifying_key().to_bytes());
        Self {
            keys: generate_escrow_key_pair().unwrap(),
            old: generate_escrow_key_pair().unwrap(),
            client: generate_escrow_key_pair().unwrap(),
            did: format!("did:key:z{}", bs58::encode(key).into_string()),
            signer,
            authority: AuthorityEnrollment::new("tenant".into(), "g1".into(), store.clone())
                .unwrap(),
            store,
            time: Clock(Mutex::new(1000)),
            ledger: FakeHeadStore::default(),
            email: crate::authority::email::fake::FakeEmailSender::default(),
        }
    }
    fn policy(&self, old: bool) -> Policy<'_> {
        Policy::new(
            copy(if old { &self.old } else { &self.keys }),
            if old { "old" } else { "current" }.into(),
            if old {
                vec![]
            } else {
                vec![("old".into(), copy(&self.old))]
            },
            "tenant".into(),
            [1; 32],
            &self.ledger,
            &self.time,
            &self.authority,
        )
        .unwrap()
        .with_authority(&self.authority)
        .unwrap()
        .with_email(&self.email)
    }
    fn blob(&self, version: u32, pin: Option<&str>) -> EscrowEnvelope {
        self.blob_with_contact(version, pin, None)
    }
    /// `contact`: `Some((email, language))` for an Enroll/Replace target that must
    /// match the signed intent; `None` for Carry targets (the enclave fills it in
    /// from source) or any blob not exercising the attack-C email binding.
    fn blob_with_contact(
        &self,
        version: u32,
        pin: Option<&str>,
        contact: Option<(&str, &str)>,
    ) -> EscrowEnvelope {
        encrypt_escrow_blob(
            &EscrowBlobPlaintext {
                version: 1,
                recovery_share: "abcdef".into(),
                did: self.did.clone(),
                share_version: version.into(),
                pin_verifier: pin.map(str::to_owned),
                pin_attempts_floor: None,
                recovery_email: contact.map(|(e, _)| e.to_string()),
                recovery_language: contact.map(|(_, l)| l.to_string()),
            },
            &self.old.public_key,
            "old",
        )
        .unwrap()
    }
    async fn state(&self) -> EnrollmentItem {
        self.store
            .load(&self.authority.binding(&self.did), "inspect", None)
            .await
            .unwrap()
            .enrollment
            .unwrap()
    }
    #[allow(clippy::too_many_arguments)]
    async fn intent(
        &self,
        request: &str,
        action: EnrollmentAction,
        pin_action: PinAction,
        source: Option<&EscrowEnvelope>,
        target: Option<&EscrowEnvelope>,
        version: u32,
        allow_rewrap: bool,
    ) -> SignedEnrollmentIntent {
        let state = self
            .store
            .load(&self.authority.binding(&self.did), "inspect", None)
            .await
            .unwrap()
            .enrollment;
        let old_epoch = state.as_ref().map(|s| s.epoch.get()).unwrap_or(0);
        // Mirrors the real required-ness rule: Enroll/Replace bind a fresh
        // recovery contact, Disable/Carry inherit the prior value untouched.
        let (recovery_email, recovery_language) =
            if matches!(action, EnrollmentAction::Enroll | EnrollmentAction::Replace) {
                (
                    Some("owner@example.com".to_string()),
                    Some("en".to_string()),
                )
            } else {
                (None, None)
            };
        let intent = EnrollmentIntent {
            version: 2,
            tenant: "tenant".into(),
            did: self.did.clone(),
            authority_generation: "g1".into(),
            expected_enrollment_version: state
                .as_ref()
                .map(|s| s.revisions.enrollment.get())
                .unwrap_or(0),
            action,
            source_blob_identity: source.map(|s| hex::encode(blob_hash(s).unwrap())),
            target_blob_identity: target.map(|s| hex::encode(blob_hash(s).unwrap())),
            pin_action,
            share_version: version,
            enrollment_epoch: old_epoch + u64::from(action != EnrollmentAction::Disable),
            request_id: request.into(),
            allow_rewrap,
            recovery_email,
            recovery_language,
        };
        let signature = STANDARD.encode(
            self.signer
                .sign(&intent.canonical_bytes().unwrap())
                .to_bytes(),
        );
        SignedEnrollmentIntent { intent, signature }
    }
    async fn enroll(&self, p: &mut Policy<'_>, delegated: bool) -> EscrowEnvelope {
        let target =
            self.blob_with_contact(1, Some(&"11".repeat(32)), Some(("owner@example.com", "en")));
        let signed = self
            .intent(
                "enroll",
                EnrollmentAction::Enroll,
                PinAction::Set,
                None,
                Some(&target),
                1,
                delegated,
            )
            .await;
        p.apply_enrollment_intent(&signed, None, Some(&target))
            .await
            .unwrap()
            .envelope
            .unwrap()
    }
    /// P9.1 (attack C): auto-confirms Hold-policy holds so every *existing*
    /// release/cancel/crash-matrix test below (none of which exercise
    /// confirmation itself) keeps seeing an immediately-releasable hold, same
    /// as before this PR. Tests of confirmation itself call
    /// `create_hold`/`confirm_hold` directly instead of this helper.
    async fn hold(
        &self,
        p: &mut Policy<'_>,
        envelope: &EscrowEnvelope,
        policy: ReleasePolicy,
    ) -> SignedHoldRecord {
        let state = self.state().await;
        let signed = p
            .create_hold(CreateHoldRequest {
                envelope,
                hold_id: "hold",
                request_id: "create",
                expected_did: &self.did,
                expected_share_version: active(&state).unwrap().share_version,
                enrollment_epoch: state.epoch.get(),
                release_policy: policy,
                client_ephemeral_public_key: &self.client.public_key,
            })
            .await
            .unwrap();
        if policy == ReleasePolicy::Hold {
            let code = self
                .email
                .sent
                .lock()
                .unwrap()
                .last()
                .and_then(|sent| sent.code.clone())
                .expect("create_hold must have sent a one-time code");
            // Every test below that calls this helper predates confirmation
            // and counts absolute store-commit calls for fault
            // injection/gating (`f.fault(N, ..)` / `Gate { call: N, .. }`).
            // Confirming here is one more real commit; restore the counter
            // afterward so those pre-existing call numbers still land on the
            // same commits they always did. Tests of confirmation itself
            // don't go through this helper, so they are unaffected.
            let calls_before_confirm = self.store.calls.load(Ordering::SeqCst);
            p.confirm_hold(ConfirmHoldRequest {
                envelope,
                hold: &signed,
                request_id: "confirm",
                expected_did: &self.did,
                client_ephemeral_public_key: &self.client.public_key,
                code: &code,
            })
            .await
            .unwrap();
            // Release is additionally gated on a recorded release-warning
            // (independent of the 7-day-since-confirmation wait); send it
            // now too so every pre-existing "release succeeds" test below
            // keeps working without knowing about either new gate. The
            // enclave itself enforces no minimum delay before a warning may
            // be sent — only lca-api's hourly job schedule does that in
            // production — so sending it immediately here is legitimate, not
            // a bypass.
            p.send_release_warning(SendReleaseWarningRequest {
                hold_id: "hold",
                request_id: "warning",
                expected_did: &self.did,
            })
            .await
            .unwrap();
            self.store
                .calls
                .store(calls_before_confirm, Ordering::SeqCst);
        }
        signed
    }
    fn release<'a>(
        &'a self,
        envelope: &'a EscrowEnvelope,
        hold: &'a SignedHoldRecord,
        request: &'a str,
        proof: Option<&'a str>,
    ) -> ReleaseRequest<'a> {
        ReleaseRequest {
            envelope,
            hold,
            request_id: request,
            expected_did: &self.did,
            client_ephemeral_public_key: &self.client.public_key,
            pin_proof: proof,
        }
    }
    fn fault(&self, call: usize, fault: Fault) {
        *self.store.fault.lock().unwrap() = Some((call, fault));
    }
    fn pause_next(&self) -> (Arc<Notify>, Arc<Notify>) {
        let entered = Arc::new(Notify::new());
        let resume = Arc::new(Notify::new());
        *self.store.gate.lock().unwrap() = Some(Gate {
            after_commit: false,
            call: self.store.calls.load(Ordering::SeqCst) + 1,
            entered: entered.clone(),
            resume: resume.clone(),
        });
        (entered, resume)
    }
    /// Like `hold()` with `ReleasePolicy::Hold`, but stops right after
    /// create_hold — for tests of confirmation itself, which must not go
    /// through `hold()`'s own auto-confirm/auto-warn step.
    async fn awaiting_hold(
        &self,
        p: &mut Policy<'_>,
        envelope: &EscrowEnvelope,
    ) -> SignedHoldRecord {
        let state = self.state().await;
        let signed = p
            .create_hold(CreateHoldRequest {
                envelope,
                hold_id: "hold",
                request_id: "create",
                expected_did: &self.did,
                expected_share_version: active(&state).unwrap().share_version,
                enrollment_epoch: state.epoch.get(),
                release_policy: ReleasePolicy::Hold,
                client_ephemeral_public_key: &self.client.public_key,
            })
            .await
            .unwrap();
        signed
    }
    fn last_sent_code(&self) -> String {
        self.email
            .sent
            .lock()
            .unwrap()
            .last()
            .and_then(|sent| sent.code.clone())
            .expect("a one-time code must have been sent")
    }
    async fn hold_status(&self, request: &str) -> HoldStatus {
        self.store
            .load(&self.authority.binding(&self.did), request, Some("hold"))
            .await
            .unwrap()
            .hold
            .unwrap()
            .status
    }
}

struct BudgetTime {
    source: crate::time::RoughtimeTimeSource,
    rounds: AtomicUsize,
}
impl TimeSource for BudgetTime {
    fn now(&self, floor: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        self.rounds.fetch_add(1, Ordering::SeqCst);
        self.source.now(floor)
    }
}

#[tokio::test(start_paused = true)]
async fn authority_operations_finish_with_one_time_server_unavailable() {
    use std::time::Duration;
    use tokio::time::{timeout, Instant};

    let f = Fixture::new();
    let time = Arc::new(BudgetTime {
        source: crate::time::tests::one_unavailable_source(),
        rounds: AtomicUsize::new(0),
    });
    let mut p = f.policy(false);
    let envelope = f.enroll(&mut p, true).await;
    p.time = time.as_ref();
    *f.store.network_time.lock().unwrap() = Some(time.clone());
    // Real authority policy and real authenticated Roughtime quorum. The fake
    // store models each AWS call's fresh TLS/signing acquisition plus 100ms I/O.
    let start = Instant::now();
    let hold = timeout(
        crate::server::IO_TIMEOUT / 2,
        p.create_hold(CreateHoldRequest {
            envelope: &envelope,
            hold_id: "hold",
            request_id: "create",
            expected_did: &f.did,
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Pin,
            client_ephemeral_public_key: &f.client.public_key,
        }),
    )
    .await
    .unwrap()
    .unwrap();
    assert_eq!(time.rounds.load(Ordering::SeqCst), 4);
    assert_eq!(start.elapsed(), Duration::from_millis(1100));
    // Previously five sequential rounds each waited 2s for the missing source;
    // even before response writing, 100ms per AWS call exceeded the outer limit.
    assert!(Duration::from_secs(5 * 2) + Duration::from_millis(300) > crate::server::IO_TIMEOUT);

    time.rounds.store(0, Ordering::SeqCst);
    let start = Instant::now();
    let proof = "11".repeat(32);
    timeout(
        crate::server::IO_TIMEOUT / 2,
        p.release(f.release(&envelope, &hold, "pin", Some(&proof))),
    )
    .await
    .unwrap()
    .unwrap();
    let rounds = time.rounds.load(Ordering::SeqCst);
    assert_eq!(
        rounds, 9,
        "reservation/result and readbacks must be modelled"
    );
    assert_eq!(start.elapsed(), Duration::from_millis(2400));
    assert!(start.elapsed() < crate::server::IO_TIMEOUT / 2);
    assert!(Duration::from_secs(2 * rounds as u64) > crate::server::IO_TIMEOUT);
}

#[tokio::test]
async fn cancellation_at_both_pin_pause_points_prevents_disclosure_without_refund_or_proof_oracle()
{
    for (call, after_commit) in [(3, true), (4, false)] {
        for correct in [false, true] {
            let f = Fixture::new();
            let mut release = f.policy(false);
            let mut cancel = f.policy(false);
            let env = f.enroll(&mut release, true).await;
            let hold = f.hold(&mut release, &env, ReleasePolicy::Pin).await;
            let entered = Arc::new(Notify::new());
            let resume = Arc::new(Notify::new());
            *f.store.gate.lock().unwrap() = Some(Gate {
                call,
                after_commit,
                entered: entered.clone(),
                resume: resume.clone(),
            });
            let proof = if correct { "11" } else { "22" }.repeat(32);
            let attempt = release.release(f.release(&env, &hold, "pin", Some(&proof)));
            let cancellation = async {
                entered.notified().await;
                cancel
                    .cancel_hold(f.release(&env, &hold, "cancel", None))
                    .await
                    .unwrap();
                resume.notify_one();
            };
            let (result, ()) = tokio::join!(attempt, cancellation);
            assert!(matches!(result, Err(ErrorCode::Policy)));
            assert_eq!(release.comparisons, 1);
            assert_eq!(f.state().await.pin.attempts_used, 1);
            let mut restarted = f.policy(false);
            assert!(restarted
                .release(f.release(&env, &hold, "pin", Some(&proof)))
                .await
                .is_err());
            assert_eq!(restarted.comparisons, 0);
        }
    }
}

#[tokio::test]
async fn mutation_crash_matrix_keeps_each_committed_active_envelope_and_never_refunds() {
    for fault in [Fault::Before, Fault::After, Fault::Readback] {
        for kind in [
            OperationKind::Carry,
            OperationKind::Replace,
            OperationKind::Disable,
            OperationKind::Rewrap,
        ] {
            let f = Fixture::new();
            let mut initial = f.policy(kind == OperationKind::Rewrap);
            let source = f.enroll(&mut initial, true).await;
            let hold = f.hold(&mut initial, &source, ReleasePolicy::Pin).await;
            assert!(matches!(
                initial
                    .release(f.release(&source, &hold, "spent", Some(&"22".repeat(32))))
                    .await,
                Err(ErrorCode::PinMismatch)
            ));
            let mut p = f.policy(false);
            let target = f.blob_with_contact(
                2,
                if kind == OperationKind::Replace {
                    Some("3333333333333333333333333333333333333333333333333333333333333333")
                } else {
                    None
                },
                (kind == OperationKind::Replace).then_some(("owner@example.com", "en")),
            );
            let action = match kind {
                OperationKind::Carry => EnrollmentAction::Carry,
                OperationKind::Disable => EnrollmentAction::Disable,
                _ => EnrollmentAction::Replace,
            };
            let pin = if kind == OperationKind::Replace {
                PinAction::Change
            } else {
                PinAction::Keep
            };
            let signed = if kind == OperationKind::Rewrap {
                None
            } else {
                Some(
                    f.intent(
                        "mutation",
                        action,
                        pin,
                        Some(&source),
                        if kind == OperationKind::Disable {
                            None
                        } else {
                            Some(&target)
                        },
                        if kind == OperationKind::Disable { 1 } else { 2 },
                        kind != OperationKind::Disable,
                    )
                    .await,
                )
            };
            f.fault(5, fault);
            let result = if let Some(signed) = signed {
                p.apply_enrollment_intent(
                    &signed,
                    Some(&source),
                    if kind == OperationKind::Disable {
                        None
                    } else {
                        Some(&target)
                    },
                )
                .await
            } else {
                p.authority_rewrap(&source, &f.did, 1, 1).await
            };
            let committed = !matches!(fault, Fault::Before);
            let current = f.state().await;
            assert_eq!(
                current.revisions.operation.get(),
                if committed { 5 } else { 4 }
            );
            assert_eq!(
                current.pin.attempts_used,
                u8::from(!(committed && kind == OperationKind::Replace))
            );
            if committed && kind == OperationKind::Disable {
                assert!(matches!(current.enrollment, EnrollmentStatus::Disabled));
            } else {
                let persisted = active(&current).unwrap();
                let key = if persisted.envelope.key_id == "old" {
                    &f.old.private_key
                } else {
                    &f.keys.private_key
                };
                assert!(decrypt_escrow_blob(&persisted.envelope, key).is_ok());
                if let Ok(output) = result {
                    assert!(output.envelope.as_ref() == Some(&persisted.envelope));
                }
            }
        }
    }
}

#[tokio::test]
async fn enrollment_and_delayed_release_crash_matrix_preserves_terminal_order() {
    for fault in [Fault::Before, Fault::After, Fault::Readback] {
        let f = Fixture::new();
        let mut p = f.policy(false);
        let target = f.blob_with_contact(1, None, Some(("owner@example.com", "en")));
        let intent = f
            .intent(
                "initial",
                EnrollmentAction::Enroll,
                PinAction::Keep,
                None,
                Some(&target),
                1,
                true,
            )
            .await;
        f.fault(1, fault);
        let result = p
            .apply_enrollment_intent(&intent, None, Some(&target))
            .await;
        let state = f
            .store
            .load(&f.authority.binding(&f.did), "initial", None)
            .await
            .unwrap();
        assert_eq!(state.enrollment.is_some(), !matches!(fault, Fault::Before));
        if let Some(state) = state.enrollment {
            assert!(
                decrypt_escrow_blob(&active(&state).unwrap().envelope, &f.keys.private_key).is_ok()
            );
        }
        if matches!(fault, Fault::Before | Fault::Readback) {
            assert!(result.is_err());
        }

        let f = Fixture::new();
        let mut p = f.policy(false);
        let env = f.enroll(&mut p, true).await;
        let hold = f.hold(&mut p, &env, ReleasePolicy::Hold).await;
        *f.time.0.lock().unwrap() = HOLD_DURATION_MS + 1000;
        f.fault(3, fault);
        assert!(p
            .release(f.release(&env, &hold, "release", None))
            .await
            .is_err());
        let state = f
            .store
            .load(&f.authority.binding(&f.did), "release", Some("hold"))
            .await
            .unwrap();
        assert!(
            state.hold.unwrap().status
                == if matches!(fault, Fault::Before) {
                    HoldStatus::Pending
                } else {
                    HoldStatus::Released
                }
        );
        if !matches!(fault, Fault::Before) {
            assert!(f
                .policy(false)
                .release(f.release(&env, &hold, "release", None))
                .await
                .is_err());
        }
    }
}

#[tokio::test]
async fn enroll_requires_owner_signature_persists_output_and_signs_only_post_commit() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let target = f.blob_with_contact(1, Some(&"11".repeat(32)), Some(("owner@example.com", "en")));
    let signed = f
        .intent(
            "enroll",
            EnrollmentAction::Enroll,
            PinAction::Set,
            None,
            Some(&target),
            1,
            true,
        )
        .await;
    let mut bad = signed.clone();
    bad.signature = STANDARD.encode([0; 64]);
    assert!(p
        .apply_enrollment_intent(&bad, None, Some(&target))
        .await
        .is_err());
    assert_eq!(f.store.calls.load(Ordering::SeqCst), 0);
    let result = p
        .apply_enrollment_intent(&signed, None, Some(&target))
        .await
        .unwrap();
    let output = result.envelope.unwrap();
    assert!(output != target);
    assert!(active(&f.state().await).unwrap().envelope == output);
    result.receipt.verify(&p.ledger_public_key()).unwrap();
    assert!(result.receipt.kind == RecordKind::Commit);
    let op = f
        .store
        .load(&f.authority.binding(&f.did), "enroll", None)
        .await
        .unwrap()
        .operation
        .unwrap();
    let mut proposal: SignedAuthorityRecord = serde_json::from_slice(&op.proposed_event).unwrap();
    proposal.verify(&p.ledger_public_key()).unwrap();
    proposal.kind = RecordKind::Commit;
    assert!(proposal.verify(&p.ledger_public_key()).is_err());
    assert!(p
        .apply_enrollment_intent(&signed, None, Some(&target))
        .await
        .is_err());
    assert!(p
        .carry_pin_verifier(&output, &target, &f.did, 1, 2, (1, 2))
        .await
        .is_err());
}

#[tokio::test]
async fn two_policies_share_one_per_pin_set_budget_without_parent_ledger() {
    let f = Fixture::new();
    let mut a = f.policy(false);
    let mut b = f.policy(false);
    let env = f.enroll(&mut a, true).await;
    let hold = f.hold(&mut a, &env, ReleasePolicy::Pin).await;
    let bad = "22".repeat(32);
    let first = async {
        for i in 0..24 {
            let request = format!("a-{i}");
            let _ = a
                .release(f.release(&env, &hold, &request, Some(&bad)))
                .await;
        }
    };
    let second = async {
        for i in 0..24 {
            let request = format!("b-{i}");
            let _ = b
                .release(f.release(&env, &hold, &request, Some(&bad)))
                .await;
        }
    };
    tokio::join!(first, second);
    assert_eq!(f.state().await.pin.attempts_used, 10);
    assert_eq!(a.comparisons + b.comparisons, 10);
    let mut restarted = f.policy(false);
    assert!(restarted
        .release(f.release(&env, &hold, "restart", Some(&"11".repeat(32))))
        .await
        .is_err());
    assert_eq!(restarted.comparisons, 0);
}

#[tokio::test]
async fn pin_success_releases_atomically_and_never_exports_the_verifier() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.hold(&mut p, &env, ReleasePolicy::Pin).await;
    let output = p
        .release(f.release(&env, &hold, "pin", Some(&"11".repeat(32))))
        .await
        .unwrap();
    let plain = crypto::open_escrow_release(&output, &f.client.private_key).unwrap();
    assert!(plain.blob.pin_verifier.is_none());
    assert!(plain.blob.pin_attempts_floor.is_none());
    assert_eq!(f.state().await.pin.attempts_used, 1);
    assert!(p
        .cancel_hold(f.release(&env, &hold, "cancel", None))
        .await
        .is_err());
    assert!(p
        .release(f.release(&env, &hold, "pin", Some(&"22".repeat(32))))
        .await
        .is_err());
    assert_eq!(p.comparisons, 1);
}

#[tokio::test]
async fn reservation_ambiguity_never_compares_or_refunds_and_restart_cannot_resume() {
    for fault in [Fault::Before, Fault::After, Fault::Readback] {
        let f = Fixture::new();
        let mut p = f.policy(false);
        let env = f.enroll(&mut p, true).await;
        let hold = f.hold(&mut p, &env, ReleasePolicy::Pin).await;
        f.fault(3, fault);
        assert!(p
            .release(f.release(&env, &hold, "pin", Some(&"11".repeat(32))))
            .await
            .is_err());
        assert_eq!(p.comparisons, 0);
        let before = f.state().await.pin.attempts_used;
        if before != 0 {
            let mut restarted = f.policy(false);
            assert!(restarted
                .release(f.release(&env, &hold, "pin", Some(&"22".repeat(32))))
                .await
                .is_err());
            assert_eq!(restarted.comparisons, 0);
            assert_eq!(f.state().await.pin.attempts_used, 1);
        }
    }
}

#[tokio::test]
async fn result_ambiguity_burns_reservation_without_disclosure_or_duplicate_compare() {
    for fault in [Fault::Before, Fault::After, Fault::Readback] {
        let f = Fixture::new();
        let mut p = f.policy(false);
        let env = f.enroll(&mut p, true).await;
        let hold = f.hold(&mut p, &env, ReleasePolicy::Pin).await;
        f.fault(4, fault);
        assert!(p
            .release(f.release(&env, &hold, "pin", Some(&"11".repeat(32))))
            .await
            .is_err());
        assert_eq!(p.comparisons, 1);
        assert_eq!(f.state().await.pin.attempts_used, 1);
        let mut restarted = f.policy(false);
        assert!(restarted
            .release(f.release(&env, &hold, "pin", Some(&"22".repeat(32))))
            .await
            .is_err());
        assert_eq!(restarted.comparisons, 0);
    }
}

#[tokio::test]
async fn cancel_committed_first_blocks_paused_release_and_retry_confirms_after_restart() {
    let f = Fixture::new();
    let mut a = f.policy(false);
    let mut b = f.policy(false);
    let env = f.enroll(&mut a, true).await;
    let hold = f.hold(&mut a, &env, ReleasePolicy::Hold).await;
    *f.time.0.lock().unwrap() = HOLD_DURATION_MS + 1000;
    let (entered, resume) = f.pause_next();
    let release = a.release(f.release(&env, &hold, "release", None));
    let cancel = async {
        entered.notified().await;
        b.cancel_hold(f.release(&env, &hold, "cancel", None))
            .await
            .unwrap();
        resume.notify_one();
    };
    let (result, _) = tokio::join!(release, cancel);
    assert!(result.is_err());
    f.policy(false)
        .cancel_hold(f.release(&env, &hold, "different-retry-id", None))
        .await
        .unwrap();
}

#[tokio::test]
async fn release_committed_first_is_final_and_paused_cancel_cannot_revoke_it() {
    let f = Fixture::new();
    let mut a = f.policy(false);
    let mut b = f.policy(false);
    let env = f.enroll(&mut a, true).await;
    let hold = f.hold(&mut a, &env, ReleasePolicy::Hold).await;
    *f.time.0.lock().unwrap() = HOLD_DURATION_MS + 1000;
    let (entered, resume) = f.pause_next();
    let cancel = a.cancel_hold(f.release(&env, &hold, "cancel", None));
    let release = async {
        entered.notified().await;
        let output = b
            .release(f.release(&env, &hold, "release", None))
            .await
            .unwrap();
        resume.notify_one();
        output
    };
    let (result, _) = tokio::join!(cancel, release);
    assert!(result.is_err());
    assert!(f
        .policy(false)
        .release(f.release(&env, &hold, "retry", None))
        .await
        .is_err());
}

#[tokio::test]
async fn ambiguous_cancel_is_confirmed_from_durable_receipt_after_restart() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.hold(&mut p, &env, ReleasePolicy::Hold).await;
    f.fault(3, Fault::Readback);
    assert!(p
        .cancel_hold(f.release(&env, &hold, "cancel", None))
        .await
        .is_err());
    let before = f.store.calls.load(Ordering::SeqCst);
    f.policy(false)
        .cancel_hold(f.release(&env, &hold, "retry", None))
        .await
        .unwrap();
    assert_eq!(f.store.calls.load(Ordering::SeqCst), before);
}

#[tokio::test]
async fn pin_change_and_clear_reset_only_when_signed_and_old_blobs_cannot_release() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.hold(&mut p, &env, ReleasePolicy::Pin).await;
    let _ = p
        .release(f.release(&env, &hold, "bad", Some(&"22".repeat(32))))
        .await;
    let target = f.blob_with_contact(2, Some(&"33".repeat(32)), Some(("owner@example.com", "en")));
    let keep = f
        .intent(
            "keep",
            EnrollmentAction::Replace,
            PinAction::Keep,
            Some(&env),
            Some(&target),
            2,
            true,
        )
        .await;
    assert!(p
        .apply_enrollment_intent(&keep, Some(&env), Some(&target))
        .await
        .is_err());
    let change = f
        .intent(
            "change",
            EnrollmentAction::Replace,
            PinAction::Change,
            Some(&env),
            Some(&target),
            2,
            true,
        )
        .await;
    let output = p
        .apply_enrollment_intent(&change, Some(&env), Some(&target))
        .await
        .unwrap()
        .envelope
        .unwrap();
    assert_eq!(f.state().await.pin.attempts_used, 0);
    assert_eq!(f.state().await.pin.generation.get(), 2);
    assert!(p
        .release(f.release(&env, &hold, "old", Some(&"11".repeat(32))))
        .await
        .is_err());
    let target = f.blob_with_contact(3, None, Some(("owner@example.com", "en")));
    let clear = f
        .intent(
            "clear",
            EnrollmentAction::Replace,
            PinAction::Clear,
            Some(&output),
            Some(&target),
            3,
            true,
        )
        .await;
    let output = p
        .apply_enrollment_intent(&clear, Some(&output), Some(&target))
        .await
        .unwrap()
        .envelope
        .unwrap();
    assert!(!f.state().await.pin.configured);
    assert_eq!(f.state().await.pin.generation.get(), 3);
    let disable = f
        .intent(
            "disable",
            EnrollmentAction::Disable,
            PinAction::Keep,
            Some(&output),
            None,
            3,
            false,
        )
        .await;
    p.apply_enrollment_intent(&disable, Some(&output), None)
        .await
        .unwrap();
    assert!(f.authority.current("tenant", &f.did).await.is_err());
    assert_eq!(f.state().await.pin.generation.get(), 3);
}

#[tokio::test]
async fn carry_persists_randomized_winner_preserves_budget_and_losing_signer_cannot_overwrite() {
    let f = Fixture::new();
    let mut a = f.policy(false);
    let mut b = f.policy(false);
    let env = f.enroll(&mut a, true).await;
    let hold = f.hold(&mut a, &env, ReleasePolicy::Pin).await;
    let _ = a
        .release(f.release(&env, &hold, "bad", Some(&"22".repeat(32))))
        .await;
    let target = f.blob(2, None);
    let first = f
        .intent(
            "carry-a",
            EnrollmentAction::Carry,
            PinAction::Keep,
            Some(&env),
            Some(&target),
            2,
            true,
        )
        .await;
    let second = f
        .intent(
            "carry-b",
            EnrollmentAction::Carry,
            PinAction::Keep,
            Some(&env),
            Some(&target),
            2,
            true,
        )
        .await;
    let (entered, resume) = f.pause_next();
    let loser = a.apply_enrollment_intent(&first, Some(&env), Some(&target));
    let winner = async {
        entered.notified().await;
        let output = b
            .apply_enrollment_intent(&second, Some(&env), Some(&target))
            .await
            .unwrap();
        resume.notify_one();
        output
    };
    let (loser, winner) = tokio::join!(loser, winner);
    assert!(loser.is_err());
    let output = winner.envelope.unwrap();
    assert!(active(&f.state().await).unwrap().envelope == output);
    let plain = decrypt_escrow_blob(&output, &f.keys.private_key).unwrap();
    assert!(plain.pin_verifier.is_some());
    assert_eq!(plain.pin_attempts_floor, Some(1));
    assert_eq!(f.state().await.pin.attempts_used, 1);
    assert_eq!(f.state().await.pin.generation.get(), 1);
}

// P2-d (cross-language contract): a Carry target blob's PLAINTEXT must never
// carry recoveryEmail/recoveryLanguage — the enclave always fills them in
// from the source — regardless of what the signed intent claims. The client
// contract test in sss-strategy.test.ts exercises the same invariant from
// the TypeScript side (`enrollEscrow` must omit these fields from the blob
// it encrypts whenever the operation resolves to carry), so a regression on
// either side is caught independently.
#[tokio::test]
async fn carry_rejects_a_target_blob_whose_plaintext_already_carries_contact_fields() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let target = f.blob_with_contact(2, None, Some(("attacker@example.com", "en")));
    let signed = f
        .intent(
            "carry-with-contact",
            EnrollmentAction::Carry,
            PinAction::Keep,
            Some(&env),
            Some(&target),
            2,
            true,
        )
        .await;
    assert!(p
        .apply_enrollment_intent(&signed, Some(&env), Some(&target))
        .await
        .is_err());
    // Unaffected: the state still reflects the original enrollment, not a
    // partially-applied carry.
    assert!(active(&f.state().await).unwrap().envelope == env);
}

#[tokio::test]
async fn rewrap_needs_delegation_preserves_plaintext_epoch_and_budget_and_invalidates_old_holds() {
    for delegated in [false, true] {
        let f = Fixture::new();
        let mut old = f.policy(true);
        let mut new = f.policy(false);
        let env = f.enroll(&mut old, delegated).await;
        let hold = f.hold(&mut old, &env, ReleasePolicy::Pin).await;
        let _ = old
            .release(f.release(&env, &hold, "bad", Some(&"22".repeat(32))))
            .await;
        let result = new.authority_rewrap(&env, &f.did, 1, 1).await;
        if !delegated {
            assert!(result.is_err());
            continue;
        }
        let output = result.unwrap().envelope.unwrap();
        let a = decrypt_escrow_blob(&env, &f.old.private_key).unwrap();
        let b = decrypt_escrow_blob(&output, &f.keys.private_key).unwrap();
        assert!(
            a.did == b.did
                && a.share_version == b.share_version
                && a.pin_verifier == b.pin_verifier
                && a.recovery_share == b.recovery_share
                && a.pin_attempts_floor == b.pin_attempts_floor
        );
        assert_eq!(f.state().await.pin.attempts_used, 1);
        assert_eq!(f.state().await.epoch.get(), 1);
        assert!(active(&f.state().await).unwrap().envelope == output);
        assert!(old
            .release(f.release(&env, &hold, "old", Some(&"11".repeat(32))))
            .await
            .is_err());
    }
}

#[tokio::test]
async fn rotation_before_paused_release_wins_and_lost_enrollment_response_keeps_envelope() {
    let f = Fixture::new();
    let mut a = f.policy(false);
    let mut b = f.policy(false);
    let env = f.enroll(&mut a, true).await;
    let hold = f.hold(&mut a, &env, ReleasePolicy::Hold).await;
    *f.time.0.lock().unwrap() = HOLD_DURATION_MS + 1000;
    let target = f.blob_with_contact(2, Some(&"11".repeat(32)), Some(("owner@example.com", "en")));
    let signed = f
        .intent(
            "rotate",
            EnrollmentAction::Replace,
            PinAction::Keep,
            Some(&env),
            Some(&target),
            2,
            true,
        )
        .await;
    let (entered, resume) = f.pause_next();
    let release = a.release(f.release(&env, &hold, "release", None));
    let rotate = async {
        entered.notified().await;
        f.fault(4, Fault::Readback);
        assert!(b
            .apply_enrollment_intent(&signed, Some(&env), Some(&target))
            .await
            .is_err());
        resume.notify_one();
    };
    let (release, _) = tokio::join!(release, rotate);
    assert!(release.is_err());
    let state = f.state().await;
    assert_eq!(active(&state).unwrap().share_version, 2);
    assert!(decrypt_escrow_blob(&active(&state).unwrap().envelope, &f.keys.private_key).is_ok());
}

#[tokio::test]
async fn empty_authority_never_uses_valid_old_envelopes_as_enrollment() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.blob(1, None);
    assert!(p
        .create_hold(CreateHoldRequest {
            envelope: &env,
            hold_id: "hold",
            request_id: "create",
            expected_did: &f.did,
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Hold,
            client_ephemeral_public_key: &f.client.public_key
        })
        .await
        .is_err());
    assert_eq!(f.store.calls.load(Ordering::SeqCst), 0);
}

#[tokio::test]
async fn disable_and_release_are_ordered_by_commit_not_reply_delivery() {
    for release_first in [false, true] {
        let f = Fixture::new();
        let mut releasing = f.policy(false);
        let mut disabling = f.policy(false);
        let env = f.enroll(&mut releasing, true).await;
        let hold = f.hold(&mut releasing, &env, ReleasePolicy::Hold).await;
        *f.time.0.lock().unwrap() = HOLD_DURATION_MS + 1000;
        let intent = f
            .intent(
                "disable",
                EnrollmentAction::Disable,
                PinAction::Keep,
                Some(&env),
                None,
                1,
                false,
            )
            .await;
        let entered = Arc::new(Notify::new());
        let resume = Arc::new(Notify::new());
        *f.store.gate.lock().unwrap() = Some(Gate {
            call: 3,
            after_commit: release_first,
            entered: entered.clone(),
            resume: resume.clone(),
        });
        let release = releasing.release(f.release(&env, &hold, "release", None));
        let disable = async {
            entered.notified().await;
            disabling
                .apply_enrollment_intent(&intent, Some(&env), None)
                .await
                .unwrap();
            resume.notify_one();
        };
        let (result, ()) = tokio::join!(release, disable);
        assert_eq!(result.is_ok(), release_first);
        assert!(matches!(
            f.state().await.enrollment,
            EnrollmentStatus::Disabled
        ));
        assert!(f
            .policy(false)
            .release(f.release(&env, &hold, "retry", None))
            .await
            .is_err());
    }
}

#[tokio::test]
async fn reservation_racing_carry_or_rewrap_never_loses_spent_budget() {
    for rewrap in [false, true] {
        for reservation_first in [false, true] {
            let f = Fixture::new();
            let mut guessing = f.policy(rewrap);
            let mut rotating = f.policy(false);
            let env = f.enroll(&mut guessing, true).await;
            let hold = f.hold(&mut guessing, &env, ReleasePolicy::Pin).await;
            let target = f.blob(2, None);
            let intent = f
                .intent(
                    "carry",
                    EnrollmentAction::Carry,
                    PinAction::Keep,
                    Some(&env),
                    Some(&target),
                    2,
                    true,
                )
                .await;
            let entered = Arc::new(Notify::new());
            let resume = Arc::new(Notify::new());
            *f.store.gate.lock().unwrap() = Some(Gate {
                call: 3,
                after_commit: reservation_first,
                entered: entered.clone(),
                resume: resume.clone(),
            });
            let proof = "11".repeat(32);
            let guess = guessing.release(f.release(&env, &hold, "pin", Some(&proof)));
            let rotation = async {
                entered.notified().await;
                let result = if rewrap {
                    rotating.authority_rewrap(&env, &f.did, 1, 1).await
                } else {
                    rotating
                        .apply_enrollment_intent(&intent, Some(&env), Some(&target))
                        .await
                }
                .unwrap();
                resume.notify_one();
                result
            };
            let (guess, output) = tokio::join!(guess, rotation);
            assert!(guess.is_err());
            assert_eq!(guessing.comparisons, usize::from(reservation_first));
            let state = f.state().await;
            assert_eq!(state.pin.attempts_used, u8::from(reservation_first));
            assert_eq!(state.pin.generation.get(), 1);
            assert!(output.envelope.as_ref() == Some(&active(&state).unwrap().envelope));
            assert!(f
                .policy(false)
                .release(f.release(&env, &hold, "old", Some(&proof)))
                .await
                .is_err());
        }
    }
}

#[tokio::test]
async fn snapshot_is_nonce_bound_and_pending_old_holds_cancel_after_disable() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let nonce = "00".repeat(32);
    let (state, proof) = p.authority_state(&f.did, &nonce).await.unwrap();
    assert_eq!(state.status, "empty");
    assert_eq!(state.enrollment_version, 0);
    proof.verify(&p.ledger_public_key()).unwrap();
    assert!(proof.kind == RecordKind::Snapshot);
    let payload: serde_json::Value =
        serde_json::from_slice(&STANDARD.decode(&proof.payload).unwrap()).unwrap();
    assert_eq!(payload[0], nonce);
    let mut altered = proof.clone();
    altered.kind = RecordKind::Commit;
    assert!(altered.verify(&p.ledger_public_key()).is_err());
    let env = f.enroll(&mut p, true).await;
    let hold = f.hold(&mut p, &env, ReleasePolicy::Hold).await;
    let disable = f
        .intent(
            "disable",
            EnrollmentAction::Disable,
            PinAction::Keep,
            Some(&env),
            None,
            1,
            false,
        )
        .await;
    p.apply_enrollment_intent(&disable, Some(&env), None)
        .await
        .unwrap();
    p.cancel_hold(f.release(&env, &hold, "cancel", None))
        .await
        .unwrap();
    f.policy(false)
        .cancel_hold(f.release(&env, &hold, "retry", None))
        .await
        .unwrap();
}

#[tokio::test]
async fn confirm_hold_rejects_a_wrong_guess_and_succeeds_with_the_correct_code() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let code = f.last_sent_code();
    let wrong = if code.starts_with('0') {
        "19999999"
    } else {
        "09999999"
    }
    .to_string();
    assert!(p
        .confirm_hold(ConfirmHoldRequest {
            envelope: &env,
            hold: &hold,
            request_id: "guess-wrong",
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
            code: &wrong,
        })
        .await
        .is_err());
    assert!(f.hold_status("check-after-wrong").await == HoldStatus::AwaitingConfirmation);
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "guess-right",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: &code,
    })
    .await
    .unwrap();
    assert!(f.hold_status("check-after-right").await == HoldStatus::Pending);
}

#[tokio::test]
async fn confirm_hold_fails_closed_after_the_fifth_wrong_guess_even_with_the_right_code() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let code = f.last_sent_code();
    let wrong = if code.starts_with('0') {
        "19999999"
    } else {
        "09999999"
    }
    .to_string();
    for i in 0..crate::authority::state::MAX_CODE_GUESSES {
        assert!(p
            .confirm_hold(ConfirmHoldRequest {
                envelope: &env,
                hold: &hold,
                request_id: &format!("guess-{i}"),
                expected_did: &f.did,
                client_ephemeral_public_key: &f.client.public_key,
                code: &wrong,
            })
            .await
            .is_err());
    }
    // The budget is exhausted; even the correct code must now fail closed.
    assert!(p
        .confirm_hold(ConfirmHoldRequest {
            envelope: &env,
            hold: &hold,
            request_id: "guess-right-too-late",
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
            code: &code,
        })
        .await
        .is_err());
    assert!(f.hold_status("check-exhausted").await == HoldStatus::AwaitingConfirmation);
}

#[tokio::test]
async fn confirm_hold_fails_closed_once_the_code_has_expired() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let code = f.last_sent_code();
    *f.time.0.lock().unwrap() += crate::policy::authority::CODE_TTL_MS + 1;
    assert!(p
        .confirm_hold(ConfirmHoldRequest {
            envelope: &env,
            hold: &hold,
            request_id: "guess-after-expiry",
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
            code: &code,
        })
        .await
        .is_err());
    assert!(f.hold_status("check-expired").await == HoldStatus::AwaitingConfirmation);
}

#[tokio::test]
async fn confirm_hold_rejects_a_key_that_does_not_match_the_signed_hold_record() {
    // P9.1 (attack C): an attacker who only controls the recipient (ephemeral)
    // key associated with a *different* client session must not be able to
    // confirm this hold even with the correct code — the signed hold record's
    // own client_ephemeral_public_key must match the caller-supplied one.
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let code = f.last_sent_code();
    let attacker = generate_escrow_key_pair().unwrap();
    assert!(p
        .confirm_hold(ConfirmHoldRequest {
            envelope: &env,
            hold: &hold,
            request_id: "guess-attacker-key",
            expected_did: &f.did,
            client_ephemeral_public_key: &attacker.public_key,
            code: &code,
        })
        .await
        .is_err());
    assert!(f.hold_status("check-attacker-key").await == HoldStatus::AwaitingConfirmation);
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "guess-legit-key",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: &code,
    })
    .await
    .unwrap();
    assert!(f.hold_status("check-legit-key").await == HoldStatus::Pending);
}

#[tokio::test]
async fn resend_code_issues_a_fresh_code_invalidates_the_old_one_and_resets_guesses() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let original = f.last_sent_code();
    // Burn a guess against the original code before resending.
    let wrong = if original.starts_with('0') {
        "19999999"
    } else {
        "09999999"
    }
    .to_string();
    assert!(p
        .confirm_hold(ConfirmHoldRequest {
            envelope: &env,
            hold: &hold,
            request_id: "guess-before-resend",
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
            code: &wrong,
        })
        .await
        .is_err());
    *f.time.0.lock().unwrap() += crate::policy::authority::MIN_SEND_GAP_MS + 1;
    p.resend_code(ResendCodeRequest {
        envelope: &env,
        hold: &hold,
        request_id: "resend",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
    })
    .await
    .unwrap();
    let fresh = f.last_sent_code();
    assert_ne!(original, fresh);
    // The old code must no longer match, even with a fresh guess budget.
    assert!(p
        .confirm_hold(ConfirmHoldRequest {
            envelope: &env,
            hold: &hold,
            request_id: "guess-old-after-resend",
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
            code: &original,
        })
        .await
        .is_err());
    // The fresh code works, proving the guess counter was reset (only one
    // guess was spent above, well under the budget either way, but this
    // confirms resend didn't leave the hold permanently unconfirmable).
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "guess-fresh-after-resend",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: &fresh,
    })
    .await
    .unwrap();
    assert!(f.hold_status("check-resend-confirmed").await == HoldStatus::Pending);
}

#[tokio::test]
async fn resend_code_is_throttled_per_window_and_per_minimum_gap() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    // One send already happened at create_hold; MAX_SENDS_PER_WINDOW total
    // sends are allowed per rolling window, so exactly one more resend must
    // succeed before the window is exhausted (advancing time past
    // MIN_SEND_GAP_MS each time so only the window budget is under test).
    for i in 0..(crate::policy::authority::MAX_SENDS_PER_WINDOW - 1) {
        *f.time.0.lock().unwrap() += crate::policy::authority::MIN_SEND_GAP_MS + 1;
        p.resend_code(ResendCodeRequest {
            envelope: &env,
            hold: &hold,
            request_id: &format!("resend-ok-{i}"),
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    }
    *f.time.0.lock().unwrap() += crate::policy::authority::MIN_SEND_GAP_MS + 1;
    assert!(p
        .resend_code(ResendCodeRequest {
            envelope: &env,
            hold: &hold,
            request_id: "resend-over-window-budget",
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .is_err());
}

#[tokio::test]
async fn resend_code_rejects_a_second_send_within_the_minimum_gap() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    *f.time.0.lock().unwrap() += crate::policy::authority::MIN_SEND_GAP_MS - 1;
    assert!(p
        .resend_code(ResendCodeRequest {
            envelope: &env,
            hold: &hold,
            request_id: "resend-too-soon",
            expected_did: &f.did,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .is_err());
}

#[tokio::test]
async fn send_release_warning_requires_pending_and_release_requires_both_gates() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    // Not yet confirmed: neither a warning nor a release may proceed.
    assert!(p
        .send_release_warning(SendReleaseWarningRequest {
            hold_id: "hold",
            request_id: "warn-too-early",
            expected_did: &f.did,
        })
        .await
        .is_err());
    assert!(p
        .release(f.release(&env, &hold, "release-unconfirmed", None))
        .await
        .is_err());
    // Confirm while the code is still fresh; the 7-day wait is measured from
    // this moment, not hold creation, so time must not be advanced before it.
    let code = f.last_sent_code();
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "confirm",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: &code,
    })
    .await
    .unwrap();
    let confirmed_at = *f.time.0.lock().unwrap();
    assert!(p
        .release(f.release(&env, &hold, "release-confirmed-but-unwarned", None))
        .await
        .is_err());
    p.send_release_warning(SendReleaseWarningRequest {
        hold_id: "hold",
        request_id: "warn",
        expected_did: &f.did,
    })
    .await
    .unwrap();
    // Warned, but the 7-day wait since confirmation has not elapsed yet.
    assert!(p
        .release(f.release(&env, &hold, "release-warned-but-too-early", None))
        .await
        .is_err());
    *f.time.0.lock().unwrap() = confirmed_at + HOLD_DURATION_MS + 1000;
    p.release(f.release(&env, &hold, "release-ok", None))
        .await
        .unwrap();
    assert!(f.hold_status("check-released").await == HoldStatus::Released);
}

// P2-a: consecutive hourly-job-style retries (lca-api retrying after losing
// its own acknowledgment, or simply running again before it learns the hold
// was already warned) must send at most one email and never move the
// timestamp release is gated on.
#[tokio::test]
async fn send_release_warning_is_idempotent_never_resends_and_never_moves_the_timestamp() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let code = f.last_sent_code();
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "confirm",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: &code,
    })
    .await
    .unwrap();
    p.send_release_warning(SendReleaseWarningRequest {
        hold_id: "hold",
        request_id: "warn-1",
        expected_did: &f.did,
    })
    .await
    .unwrap();
    let sent_after_first = f.email.sent.lock().unwrap().len();
    async fn item(f: &Fixture, label: &str) -> HoldItem {
        f.store
            .load(&f.authority.binding(&f.did), label, Some("hold"))
            .await
            .unwrap()
            .hold
            .unwrap()
    }
    let warned_at_first = item(&f, "inspect-warning-1")
        .await
        .release_warning_sent_hi_ms
        .unwrap();
    // Advance time, then retry under a DIFFERENT request id (the realistic
    // shape of an hourly job's next run) and also under the SAME one.
    *f.time.0.lock().unwrap() += HOLD_DURATION_MS;
    for (n, request_id) in ["warn-2", "warn-1"].into_iter().enumerate() {
        p.send_release_warning(SendReleaseWarningRequest {
            hold_id: "hold",
            request_id,
            expected_did: &f.did,
        })
        .await
        .unwrap();
        assert_eq!(f.email.sent.lock().unwrap().len(), sent_after_first);
        assert_eq!(
            item(&f, &format!("inspect-warning-check-{n}"))
                .await
                .release_warning_sent_hi_ms
                .unwrap(),
            warned_at_first
        );
    }
}

// P2-c: a lost response (or a retry under a fresh request id after a process
// restart) must not be treated as an error once the hold was already
// confirmed by an earlier, genuinely code-verified call. It must never move
// `confirmed_hi_ms` or consume another guess.
#[tokio::test]
async fn confirm_hold_is_idempotent_after_a_lost_response_and_never_regrants_a_guess() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let code = f.last_sent_code();
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "confirm-1",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: &code,
    })
    .await
    .unwrap();
    async fn confirm_item(f: &Fixture, label: &str) -> HoldItem {
        f.store
            .load(&f.authority.binding(&f.did), label, Some("hold"))
            .await
            .unwrap()
            .hold
            .unwrap()
    }
    let confirmed_at_first = confirm_item(&f, "inspect-confirm-1")
        .await
        .confirmed_hi_ms
        .unwrap();
    let guesses_after_first = confirm_item(&f, "inspect-confirm-2")
        .await
        .code_guesses_used;
    *f.time.0.lock().unwrap() += 1000;
    // A retry under a fresh request id (lost response / process restart),
    // presenting a DIFFERENT, wrong-shaped code (it is never checked once
    // already confirmed) must still succeed and must not move state.
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "confirm-2",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: "00000000",
    })
    .await
    .unwrap();
    assert_eq!(
        confirm_item(&f, "inspect-confirm-3")
            .await
            .confirmed_hi_ms
            .unwrap(),
        confirmed_at_first
    );
    assert_eq!(
        confirm_item(&f, "inspect-confirm-4")
            .await
            .code_guesses_used,
        guesses_after_first
    );
    assert!(f.hold_status("inspect-status").await == HoldStatus::Pending);
    // A hold that was NEVER confirmed still rejects a wrong guess normally
    // (the idempotent branch must not short-circuit the real check).
    let f2 = Fixture::new();
    let mut p2 = f2.policy(false);
    let env2 = f2.enroll(&mut p2, true).await;
    let hold2 = f2.awaiting_hold(&mut p2, &env2).await;
    assert!(p2
        .confirm_hold(ConfirmHoldRequest {
            envelope: &env2,
            hold: &hold2,
            request_id: "wrong-guess",
            expected_did: &f2.did,
            client_ephemeral_public_key: &f2.client.public_key,
            code: "00000000",
        })
        .await
        .is_err());
}

#[tokio::test]
async fn cancel_succeeds_from_awaiting_confirmation_and_from_pending_but_not_once_released() {
    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    assert!(f.hold_status("check-awaiting").await == HoldStatus::AwaitingConfirmation);
    p.cancel_hold(f.release(&env, &hold, "cancel-awaiting", None))
        .await
        .unwrap();
    assert!(f.hold_status("check-cancelled-1").await == HoldStatus::Cancelled);
    // cancel_hold derives its own request id from the hold's digest (not the
    // caller-supplied one), so retrying on an already-cancelled hold is a
    // success, not an error — matching the receipt already recorded.
    p.cancel_hold(f.release(&env, &hold, "cancel-again", None))
        .await
        .unwrap();

    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.awaiting_hold(&mut p, &env).await;
    let code = f.last_sent_code();
    p.confirm_hold(ConfirmHoldRequest {
        envelope: &env,
        hold: &hold,
        request_id: "confirm",
        expected_did: &f.did,
        client_ephemeral_public_key: &f.client.public_key,
        code: &code,
    })
    .await
    .unwrap();
    assert!(f.hold_status("check-pending").await == HoldStatus::Pending);
    p.cancel_hold(f.release(&env, &hold, "cancel-pending", None))
        .await
        .unwrap();
    assert!(f.hold_status("check-cancelled-2").await == HoldStatus::Cancelled);

    let f = Fixture::new();
    let mut p = f.policy(false);
    let env = f.enroll(&mut p, true).await;
    let hold = f.hold(&mut p, &env, ReleasePolicy::Hold).await;
    *f.time.0.lock().unwrap() += HOLD_DURATION_MS + 1000;
    p.release(f.release(&env, &hold, "release", None))
        .await
        .unwrap();
    assert!(p
        .cancel_hold(f.release(&env, &hold, "cancel-released", None))
        .await
        .is_err());
}

#[cfg(feature = "enclave-runtime")]
mod wire_tests {
    use super::*;
    #[tokio::test]
    async fn signed_enrollment_and_snapshot_dispatch_through_wire() {
        use crate::{
            nsm::FakeNsm,
            server::Service,
            wire::{
                v1::{Request, Response},
                AttestationMode,
            },
        };
        let f = Fixture::new();
        let nsm = FakeNsm::new(1000, [[1; 48], [2; 48], [3; 48]]).unwrap();
        let mut service = Service {
            policy: f.policy(false),
            nsm: &nsm,
            key_id: "current".into(),
            public_key: f.keys.public_key.clone(),
            mode: AttestationMode::Software,
        };
        let target = f.blob_with_contact(1, None, Some(("owner@example.com", "en")));
        let signed = f
            .intent(
                "enroll",
                EnrollmentAction::Enroll,
                PinAction::Keep,
                None,
                Some(&target),
                1,
                true,
            )
            .await;
        let request = Request::ApplyEnrollment {
            signed_intent: Box::new(signed),
            source_envelope: None,
            target_envelope: Some(target.clone()),
        };
        let request = serde_json::from_slice(&serde_json::to_vec(&request).unwrap()).unwrap();
        let Response::ApplyEnrollment { result } = service.dispatch(request).await else {
            panic!("enrollment response")
        };
        assert!(result.envelope.as_ref().unwrap() != &target);
        result
            .receipt
            .verify(&service.policy.ledger_public_key())
            .unwrap();
        let committed: AuthorityCommitPayload =
            serde_json::from_slice(&STANDARD.decode(&result.receipt.payload).unwrap()).unwrap();
        assert!(
            committed.result_blob_identity
                == Some(blob_hash(result.envelope.as_ref().unwrap()).unwrap())
        );
        let Response::EnrollmentState { state, proof } = service
            .dispatch(Request::EnrollmentState {
                expected_did: f.did.clone(),
                nonce: "11".repeat(32),
            })
            .await
        else {
            panic!("state response")
        };
        assert!(state.envelope == result.envelope);
        assert_eq!(state.enrollment_version, 1);
        proof.verify(&service.policy.ledger_public_key()).unwrap();
    }
}
