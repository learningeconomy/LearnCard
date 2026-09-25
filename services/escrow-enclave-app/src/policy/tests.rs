use super::*;
use crate::{
    crypto::{encrypt_escrow_blob, generate_escrow_key_pair, open_escrow_release},
    ledger::{AppendError, FakeHeadStore, StoreFuture},
    time::{SourceEvidence, TimeError, TimeFuture, TrustedInterval},
};
use std::sync::Mutex;

struct Clock(Mutex<Result<TimeEvidence, TimeError>>);
impl Clock {
    fn set(&self, lo: u64, hi: u64) {
        *self.0.lock().unwrap() = Ok(TimeEvidence {
            interval: TrustedInterval {
                lo_ms: lo,
                hi_ms: hi,
            },
            sources: ["a", "b"]
                .into_iter()
                .map(|id| SourceEvidence {
                    server_id: id.into(),
                    midpoint_ms: lo,
                    radius_ms: 1,
                    response_hash: [0; 32],
                })
                .collect(),
        });
    }
}
impl TimeSource for Clock {
    fn now(&self, _: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async { self.0.lock().unwrap().clone() })
    }
}

struct Authority(Mutex<Result<CurrentEnrollment, ErrorCode>>);
impl EnrollmentSource for Authority {
    fn current<'a>(&'a self, tenant: &'a str, did: &'a str) -> EnrollmentFuture<'a> {
        Box::pin(async move {
            if tenant != "tenant" || did != "did:key:test" {
                return Err(ErrorCode::Policy);
            }
            self.0.lock().unwrap().clone()
        })
    }
}

#[derive(Clone, Copy)]
struct Fault {
    event: Event,
    error: AppendError,
    persist: bool,
}
#[derive(Default)]
struct Store {
    inner: FakeHeadStore,
    fault: Mutex<Option<Fault>>,
}
impl HeadStore for Store {
    fn get_chain<'a>(&'a self, id: &'a str) -> StoreFuture<'a, Vec<LedgerRecord>> {
        self.inner.get_chain(id)
    }
    fn append<'a>(&'a self, id: &'a str, record: &'a LedgerRecord) -> StoreFuture<'a, ()> {
        Box::pin(async move {
            let fault = *self.fault.lock().unwrap();
            if let Some(fault) = fault.filter(|f| f.event == record.event) {
                if fault.persist {
                    self.inner.append(id, record).await?;
                }
                return Err(fault.error);
            }
            self.inner.append(id, record).await
        })
    }
}

struct Fixture {
    keys: EscrowKeyPair,
    client: EscrowKeyPair,
    envelope: EscrowEnvelope,
    clock: Clock,
    authority: Authority,
    store: Store,
}
impl Fixture {
    fn new(pin: bool) -> Self {
        let keys = generate_escrow_key_pair().unwrap();
        let client = generate_escrow_key_pair().unwrap();
        let envelope = encrypt_escrow_blob(
            &EscrowBlobPlaintext {
                version: 1,
                recovery_share: "ab".repeat(33),
                did: "did:key:test".into(),
                share_version: 1.0,
                pin_verifier: pin.then(|| "ab".repeat(32)),
            },
            &keys.public_key,
            "test",
        )
        .unwrap();
        let current = CurrentEnrollment {
            epoch: 1,
            share_version: 1,
            blob_hash: blob_hash(&envelope).unwrap(),
        };
        let clock = Clock(Mutex::new(Err(TimeError::Unavailable)));
        clock.set(100, 101);
        Self {
            keys,
            client,
            envelope,
            clock,
            authority: Authority(Mutex::new(Ok(current))),
            store: Store::default(),
        }
    }
    fn policy(&self) -> Policy<'_> {
        Policy::new(
            EscrowKeyPair {
                public_key: self.keys.public_key.clone(),
                private_key: self.keys.private_key.clone(),
            },
            "test".into(),
            "tenant".into(),
            [0; 32],
            &self.store,
            &self.clock,
            &self.authority,
        )
        .unwrap()
    }
    fn create<'a>(&'a self, id: &'a str, policy: ReleasePolicy) -> CreateHoldRequest<'a> {
        CreateHoldRequest {
            envelope: &self.envelope,
            hold_id: id,
            request_id: id,
            expected_did: "did:key:test",
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: policy,
            client_ephemeral_public_key: &self.client.public_key,
        }
    }
    fn request<'a>(
        &'a self,
        hold: &'a SignedHoldRecord,
        id: &'a str,
        proof: Option<&'a str>,
    ) -> ReleaseRequest<'a> {
        ReleaseRequest {
            envelope: &self.envelope,
            hold,
            request_id: id,
            expected_did: "did:key:test",
            client_ephemeral_public_key: &self.client.public_key,
            pin_proof: proof,
        }
    }
    fn enrollment(&self) -> Enrollment {
        Enrollment::new(
            "tenant".into(),
            "did:key:test",
            1,
            blob_hash(&self.envelope).unwrap(),
        )
    }
    async fn records(&self) -> Vec<LedgerRecord> {
        self.store
            .get_chain(&self.enrollment().chain_id())
            .await
            .unwrap()
    }
    fn elapsed(&self) {
        self.clock
            .set(101 + HOLD_DURATION_MS, 102 + HOLD_DURATION_MS);
    }
    fn assert_release(&self, sealed: &EscrowEnvelope, id: &str) {
        let release = open_escrow_release(sealed, &self.client.private_key).unwrap();
        assert_eq!(release.blob.version, 1);
        assert_eq!(release.blob.did, "did:key:test");
        assert_eq!(release.blob.share_version, 1.0);
        assert_eq!(release.blob.recovery_share, "ab".repeat(33));
        assert_eq!(release.blob.pin_verifier, None);
        assert_eq!(release.hold_id, id);
    }
}

// softwareEnclave.test.ts:16 — software attestation's unsigned JSON is deliberately
// not ported as Nitro evidence. P1.3 tests attestation; here verify the derived key.
#[tokio::test]
async fn derives_the_attestation_key_verifies_enrollment_and_enforces_release_policy() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    assert_eq!(
        p.ledger_public_key(),
        Ledger::new(&f.keys, "test".into(), [0; 32])
            .unwrap()
            .public_key()
    );
    assert_eq!(
        p.verify_blob(&f.envelope, "did:key:test", 1),
        Ok(BlobVerification {
            ok: true,
            has_pin: false
        })
    );
    assert_eq!(
        p.verify_blob(&f.envelope, "did:key:wrong", 1).unwrap().ok,
        false
    );
    assert!(!p.verify_blob(&f.envelope, "did:key:test", 2).unwrap().ok);
    let hold = p
        .create_hold(f.create("test-hold", ReleasePolicy::Hold))
        .await
        .unwrap();
    f.clock.set(100 + HOLD_DURATION_MS, 101 + HOLD_DURATION_MS);
    assert_eq!(
        p.release(f.request(&hold, "early", None)).await,
        Err(ErrorCode::Time)
    );
    f.elapsed();
    for changed in ["version", "did", "expected", "client"] {
        let mut altered = hold.clone();
        match changed {
            "version" => altered.hold.share_version = 2,
            "did" => altered.hold.did = "did:key:wrong".into(),
            _ => (),
        }
        let mut req = f.request(&altered, "changed", None);
        if changed == "expected" {
            req.expected_did = "did:key:wrong";
        }
        if changed == "client" {
            req.client_ephemeral_public_key = &f.keys.public_key;
        }
        assert_eq!(p.release(req).await, Err(ErrorCode::Policy));
    }
    let cancelled = p
        .create_hold(f.create("cancelled", ReleasePolicy::Hold))
        .await
        .unwrap();
    p.cancel_hold(f.request(&cancelled, "cancel", None))
        .await
        .unwrap();
    assert_eq!(
        p.release(f.request(&cancelled, "cancelled-release", None))
            .await,
        Err(ErrorCode::Policy)
    );
    let sealed = p.release(f.request(&hold, "release", None)).await.unwrap();
    f.assert_release(&sealed, "test-hold");
    let mut bad = f.envelope.clone();
    bad.key_id = "unknown".into();
    assert_eq!(p.verify_blob(&bad, "did:key:test", 1), Err(ErrorCode::Blob));
}

async fn proof_case(
    policy: ReleasePolicy,
    verifier: bool,
    proof: Option<&str>,
    error: Option<ErrorCode>,
) {
    let f = Fixture::new(verifier);
    let mut p = f.policy();
    assert_eq!(
        p.verify_blob(&f.envelope, "did:key:test", 1).unwrap(),
        BlobVerification {
            ok: true,
            has_pin: verifier
        }
    );
    let hold = p.create_hold(f.create("pin-hold", policy)).await;
    // Nitro refuses an impossible PIN hold at creation, earlier than software release.
    if !verifier && policy == ReleasePolicy::Pin {
        assert_eq!(hold, Err(ErrorCode::Policy));
        assert_eq!(error, Some(ErrorCode::Policy));
        return;
    }
    let hold = hold.unwrap();
    f.elapsed();
    let result = p.release(f.request(&hold, "attempt", proof)).await;
    if let Some(error) = error {
        assert_eq!(result, Err(error));
    } else {
        f.assert_release(&result.unwrap(), "pin-hold");
    }
}

// softwareEnclave.test.ts:103-171, same parameterized case numbers/names.
#[tokio::test]
async fn checks_policy_proof_case_0_without_exposing_the_verifier() {
    proof_case(ReleasePolicy::Pin, true, Some(&"ab".repeat(32)), None).await;
}
#[tokio::test]
async fn checks_policy_proof_case_1_without_exposing_the_verifier() {
    proof_case(
        ReleasePolicy::Pin,
        true,
        Some(&"cd".repeat(32)),
        Some(ErrorCode::PinMismatch),
    )
    .await;
}
#[tokio::test]
async fn checks_policy_proof_case_2_without_exposing_the_verifier() {
    proof_case(
        ReleasePolicy::Pin,
        true,
        Some("ab"),
        Some(ErrorCode::PinMismatch),
    )
    .await;
}
#[tokio::test]
async fn checks_policy_proof_case_3_without_exposing_the_verifier() {
    proof_case(ReleasePolicy::Pin, true, None, Some(ErrorCode::Policy)).await;
}
#[tokio::test]
async fn checks_policy_proof_case_4_without_exposing_the_verifier() {
    proof_case(
        ReleasePolicy::Pin,
        false,
        Some(&"ab".repeat(32)),
        Some(ErrorCode::Policy),
    )
    .await;
}
#[tokio::test]
async fn checks_policy_proof_case_5_without_exposing_the_verifier() {
    proof_case(ReleasePolicy::Hold, true, Some(&"cd".repeat(32)), None).await;
}

#[tokio::test]
async fn every_bound_hold_field_and_signature_is_authenticated() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("hold", ReleasePolicy::Hold))
        .await
        .unwrap();
    f.elapsed();
    for field in 0..14 {
        let mut bad = hold.clone();
        match field {
            0 => bad.hold.hold_id = "other".into(),
            1 => bad.hold.did = "did:key:other".into(),
            2 => bad.hold.share_version = 2,
            3 => bad.hold.blob_hash = "00".repeat(32),
            4 => bad.hold.enrollment_epoch = 2,
            5 => bad.hold.release_policy = ReleasePolicy::Pin,
            6 => bad.hold.client_ephemeral_public_key = f.keys.public_key.clone(),
            7 => bad.hold.created_lo += 1,
            8 => bad.hold.created_hi += 1,
            9 => bad.hold_duration_ms = 0,
            10 => bad.hold.policy_version = 2,
            11 => bad.ledger_seq = 1,
            12 => bad.hold.signature = STANDARD.encode([0; 64]),
            _ => bad.hold.created_lo = u64::MAX,
        }
        assert!(
            p.release(f.request(&bad, "tampered", Some(&"ab".repeat(32))))
                .await
                .is_err(),
            "field {field}"
        );
    }
    assert_eq!(p.comparisons, 0);
    assert_eq!(f.records().await.len(), 1);
    let sealed = p.release(f.request(&hold, "valid", None)).await.unwrap();
    f.assert_release(&sealed, "hold");
}

#[tokio::test]
async fn rotation_and_blob_substitution_cannot_reset_enrollment_or_reuse_old_holds() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("hold", ReleasePolicy::Hold))
        .await
        .unwrap();
    f.elapsed();
    let original = f.authority.0.lock().unwrap().clone().unwrap();
    let mut current = original.clone();
    current.epoch = 2;
    *f.authority.0.lock().unwrap() = Ok(current);
    assert_eq!(
        p.release(f.request(&hold, "old", None)).await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(
        p.create_hold(f.create("old-create", ReleasePolicy::Hold))
            .await,
        Err(ErrorCode::Policy)
    );
    *f.authority.0.lock().unwrap() = Ok(original.clone());
    let mut req = f.create("host-epoch", ReleasePolicy::Pin);
    req.enrollment_epoch = 999;
    assert_eq!(p.create_hold(req).await, Err(ErrorCode::Policy));
    let mut plaintext = p.decrypt(&f.envelope).unwrap();
    plaintext.recovery_share = "cd".repeat(33);
    let other = encrypt_escrow_blob(&plaintext, &f.keys.public_key, "test").unwrap();
    let mut req = f.request(&hold, "substitute", None);
    req.envelope = &other;
    assert_eq!(p.release(req).await, Err(ErrorCode::Policy));
    // Even a broken authority accepting a changed blob in the SAME epoch cannot
    // make an observed ledger history reset its budget or change blob binding.
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        blob_hash: blob_hash(&other).unwrap(),
        ..original
    });
    let mut req = f.create("new-blob", ReleasePolicy::Pin);
    req.envelope = &other;
    assert_eq!(p.create_hold(req).await, Err(ErrorCode::Ledger));
}

#[tokio::test]
async fn released_replays_are_explicitly_refused_including_after_reboot() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("hold", ReleasePolicy::Hold))
        .await
        .unwrap();
    f.elapsed();
    p.release(f.request(&hold, "release", None)).await.unwrap();
    for id in ["release", "different"] {
        assert_eq!(
            p.release(f.request(&hold, id, None)).await,
            Err(ErrorCode::Policy)
        );
    }
    drop(p);
    assert_eq!(
        f.policy().release(f.request(&hold, "release", None)).await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(f.records().await.len(), 2);
}

#[tokio::test]
async fn ten_wrong_pins_lock_shared_budget_eleventh_never_compares_but_hold_still_works() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let first = p
        .create_hold(f.create("first", ReleasePolicy::Pin))
        .await
        .unwrap();
    let second = p
        .create_hold(f.create("second", ReleasePolicy::Pin))
        .await
        .unwrap();
    let delayed = p
        .create_hold(f.create("delayed", ReleasePolicy::Hold))
        .await
        .unwrap();
    for attempt in 1..=10 {
        let hold = if attempt % 2 == 0 { &second } else { &first };
        assert_eq!(
            p.release(f.request(hold, &format!("attempt{attempt}"), Some("ab")))
                .await,
            Err(ErrorCode::PinMismatch)
        );
    }
    assert_eq!(p.comparisons, 10);
    assert_eq!(f.records().await.last().unwrap().event, Event::PinLocked);
    let third = p
        .create_hold(f.create("third", ReleasePolicy::Pin))
        .await
        .unwrap();
    assert_eq!(
        p.release(f.request(&third, "eleventh", Some(&"ab".repeat(32))))
            .await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(p.comparisons, 10);
    f.elapsed();
    f.assert_release(
        &p.release(f.request(&delayed, "delayed-release", None))
            .await
            .unwrap(),
        "delayed",
    );
}

#[tokio::test]
async fn tenth_attempt_can_succeed_and_pin_release_does_not_reset_budget() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("pin", ReleasePolicy::Pin))
        .await
        .unwrap();
    for attempt in 1..10 {
        assert_eq!(
            p.release(f.request(&hold, &format!("a{attempt}"), Some("cd")))
                .await,
            Err(ErrorCode::PinMismatch)
        );
    }
    f.assert_release(
        &p.release(f.request(&hold, "tenth", Some(&"AB".repeat(32))))
            .await
            .unwrap(),
        "pin",
    );
    let records = f.records().await;
    assert_eq!(records[records.len() - 2].event, Event::PinAttemptSucceeded);
    assert_eq!(records.last().unwrap().event, Event::Released);
    let next = p
        .create_hold(f.create("next", ReleasePolicy::Pin))
        .await
        .unwrap();
    assert_eq!(
        p.release(f.request(&next, "eleventh", Some(&"ab".repeat(32))))
            .await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(p.comparisons, 10);
}

#[tokio::test]
async fn crash_after_reserve_consumes_attempt_and_duplicates_never_compare() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("pin", ReleasePolicy::Pin))
        .await
        .unwrap();
    *f.store.fault.lock().unwrap() = Some(Fault {
        event: Event::PinAttemptReserved { attempt_no: 1 },
        error: AppendError::Unavailable,
        persist: true,
    });
    assert_eq!(
        p.release(f.request(&hold, "lost", Some(&"ab".repeat(32))))
            .await,
        Err(ErrorCode::Unavailable)
    );
    assert_eq!(p.comparisons, 0);
    drop(p);
    *f.store.fault.lock().unwrap() = None;
    let mut p = f.policy();
    assert_eq!(
        p.release(f.request(&hold, "lost", Some(&"ab".repeat(32))))
            .await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(p.comparisons, 0);
    assert_eq!(
        p.release(f.request(&hold, "new", Some("cd"))).await,
        Err(ErrorCode::PinMismatch)
    );
    assert_eq!(
        p.release(f.request(&hold, "new", Some("cd"))).await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(
        p.release(f.request(&hold, "new", Some(&"ab".repeat(32))))
            .await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(p.comparisons, 1);
    let state = p
        .ledger
        .observe(&f.records().await, &f.enrollment())
        .unwrap();
    assert_eq!(state.attempts_used, 2);
}

#[tokio::test]
async fn tampered_pin_state_and_truncated_cancelled_or_released_history_are_rejected() {
    for terminal in [false, true] {
        let f = Fixture::new(true);
        let mut p = f.policy();
        let hold = p
            .create_hold(f.create("pin", ReleasePolicy::Pin))
            .await
            .unwrap();
        let prefix = f.records().await;
        assert_eq!(
            p.release(f.request(&hold, "bad", Some("cd"))).await,
            Err(ErrorCode::PinMismatch)
        );
        let saved = f.records().await;
        for field in 0..3 {
            let mut bad = saved.clone();
            match field {
                0 => bad[1].event = Event::PinAttemptReserved { attempt_no: 2 },
                1 => bad[2].event = Event::PinAttemptSucceeded,
                _ => bad[1].payload_hash[0] ^= 1,
            }
            f.store
                .inner
                .replace(&f.enrollment().chain_id(), bad)
                .unwrap();
            assert_eq!(
                p.release(f.request(&hold, "attack", Some(&"ab".repeat(32))))
                    .await,
                Err(ErrorCode::Ledger)
            );
        }
        f.store
            .inner
            .replace(&f.enrollment().chain_id(), saved)
            .unwrap();
        if terminal {
            p.release(f.request(&hold, "good", Some(&"ab".repeat(32))))
                .await
                .unwrap();
        } else {
            p.cancel_hold(f.request(&hold, "cancel", None))
                .await
                .unwrap();
        }
        let comparisons = p.comparisons;
        f.store
            .inner
            .replace(&f.enrollment().chain_id(), prefix)
            .unwrap();
        assert_eq!(
            p.release(f.request(&hold, "replay", Some(&"ab".repeat(32))))
                .await,
            Err(ErrorCode::Ledger)
        );
        assert_eq!(p.comparisons, comparisons);
    }
}

#[tokio::test]
async fn conflict_unavailable_at_each_pin_stage_never_returns_a_seal() {
    for event in [
        Event::PinAttemptReserved { attempt_no: 1 },
        Event::PinAttemptSucceeded,
        Event::Released,
    ] {
        for error in [AppendError::Conflict, AppendError::Unavailable] {
            for persist in [false, true] {
                let f = Fixture::new(true);
                let mut p = f.policy();
                let hold = p
                    .create_hold(f.create("pin", ReleasePolicy::Pin))
                    .await
                    .unwrap();
                *f.store.fault.lock().unwrap() = Some(Fault {
                    event,
                    error,
                    persist,
                });
                assert_eq!(
                    p.release(f.request(&hold, "attempt", Some(&"ab".repeat(32))))
                        .await,
                    Err(ErrorCode::Unavailable)
                );
                assert_eq!(
                    p.comparisons,
                    usize::from(event != Event::PinAttemptReserved { attempt_no: 1 })
                );
                *f.store.fault.lock().unwrap() = None;
                assert!(p
                    .release(f.request(&hold, "attempt", Some(&"ab".repeat(32))))
                    .await
                    .is_err());
            }
        }
    }
}

#[tokio::test]
async fn crash_after_released_append_burns_hold_even_when_response_is_lost() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("hold", ReleasePolicy::Hold))
        .await
        .unwrap();
    f.elapsed();
    *f.store.fault.lock().unwrap() = Some(Fault {
        event: Event::Released,
        error: AppendError::Unavailable,
        persist: true,
    });
    assert_eq!(
        p.release(f.request(&hold, "release", None)).await,
        Err(ErrorCode::Unavailable)
    );
    drop(p);
    *f.store.fault.lock().unwrap() = None;
    assert_eq!(
        f.policy().release(f.request(&hold, "release", None)).await,
        Err(ErrorCode::Policy)
    );
    assert_eq!(f.records().await.len(), 2);
}

#[tokio::test]
async fn time_disagreement_rollback_and_authority_unavailable_fail_without_seal_or_comparison() {
    for policy in [ReleasePolicy::Hold, ReleasePolicy::Pin] {
        let f = Fixture::new(true);
        let mut p = f.policy();
        let hold = p.create_hold(f.create("hold", policy)).await.unwrap();
        for error in [
            TimeError::Disagreement,
            TimeError::Rollback,
            TimeError::Unavailable,
        ] {
            *f.clock.0.lock().unwrap() = Err(error);
            assert_eq!(
                p.release(f.request(&hold, "failure", Some(&"ab".repeat(32))))
                    .await,
                Err(ErrorCode::Time)
            );
        }
        // Even an overlapping interval must not move the ledger lower bound back.
        f.clock.set(99, 101);
        assert_eq!(
            p.release(f.request(&hold, "rollback", Some(&"ab".repeat(32))))
                .await,
            Err(ErrorCode::Time)
        );
        f.elapsed();
        *f.authority.0.lock().unwrap() = Err(ErrorCode::Unavailable);
        assert_eq!(
            p.release(f.request(&hold, "no-authority", Some(&"ab".repeat(32))))
                .await,
            Err(ErrorCode::Unavailable)
        );
        assert_eq!(p.comparisons, 0);
        assert_eq!(f.records().await.len(), 1);
    }
}

#[tokio::test]
async fn host_now_duration_and_pin_counter_are_not_inputs_and_overflow_fails_closed() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("hold", ReleasePolicy::Hold))
        .await
        .unwrap();
    assert_eq!(hold.hold_duration_ms, 604_800_000);
    assert_eq!(deadline(u64::MAX, 1), Err(ErrorCode::Time));
    assert_eq!(
        deadline(JS_MAX_INTEGER, HOLD_DURATION_MS),
        Err(ErrorCode::Time)
    );
    for field in ["now", "holdDurationMs", "failedAttempts", "status"] {
        let mut value = serde_json::json!({
            "method": "createHold", "envelope": f.envelope, "holdId": "host",
            "expectedDid": "did:key:test", "expectedShareVersion": 1, "enrollmentEpoch": 1,
            "releasePolicy": "hold", "clientEphemeralPublicKey": f.client.public_key,
        });
        value[field] = serde_json::json!(0);
        assert!(serde_json::from_value::<crate::wire::Request>(value).is_err());
    }
    assert_eq!(
        p.release(f.request(&hold, "early", None)).await,
        Err(ErrorCode::Time)
    );
    for time in [
        u64::MAX,
        JS_MAX_INTEGER,
        JS_MAX_INTEGER - HOLD_DURATION_MS + 1,
    ] {
        f.clock.set(time, time);
        assert_eq!(
            p.create_hold(f.create("overflow", ReleasePolicy::Hold))
                .await,
            Err(ErrorCode::Time)
        );
    }
    assert_eq!(f.records().await.len(), 1);
}

#[tokio::test]
async fn malformed_and_oversized_inputs_do_not_append_or_panic() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    for key in ["".into(), "!".into(), "A".repeat(513)] {
        let mut req = f.create("hold", ReleasePolicy::Pin);
        req.client_ephemeral_public_key = &key;
        assert_eq!(p.create_hold(req).await, Err(ErrorCode::Policy));
    }
    let long = "a".repeat(113);
    let req = f.create(&long, ReleasePolicy::Pin);
    assert_eq!(p.create_hold(req).await, Err(ErrorCode::Policy));
    assert!(f.records().await.is_empty());
    let hold = p
        .create_hold(f.create("hold", ReleasePolicy::Pin))
        .await
        .unwrap();
    for (i, proof) in ["", "ab", "gg", &"!".repeat(64)].into_iter().enumerate() {
        assert_eq!(
            p.release(f.request(&hold, &format!("bad{i}"), Some(proof)))
                .await,
            Err(ErrorCode::PinMismatch)
        );
    }
    assert_eq!(
        p.release(f.request(&hold, "oversized", Some(&"a".repeat(129))))
            .await,
        Err(ErrorCode::Policy)
    );
}

#[tokio::test]
async fn capacity_boundary_leaves_room_for_pin_result_and_release() {
    for count in [61, 62] {
        let f = Fixture::new(true);
        let mut p = f.policy();
        let hold = p
            .create_hold(f.create("pin", ReleasePolicy::Pin))
            .await
            .unwrap();
        for i in 1..count {
            p.create_hold(f.create(&format!("filler{i}"), ReleasePolicy::Hold))
                .await
                .unwrap();
        }
        let result = p
            .release(f.request(&hold, "attempt", Some(&"ab".repeat(32))))
            .await;
        if count == 61 {
            f.assert_release(&result.unwrap(), "pin");
            assert_eq!(f.records().await.len(), MAX_CHAIN_RECORDS);
            assert_eq!(p.comparisons, 1);
        } else {
            assert_eq!(result, Err(ErrorCode::Unavailable));
            assert_eq!(f.records().await.len(), 62);
            assert_eq!(p.comparisons, 0);
        }
    }
}

struct LyingStore<'a>(&'a Store);
impl HeadStore for LyingStore<'_> {
    fn get_chain<'a>(&'a self, id: &'a str) -> StoreFuture<'a, Vec<LedgerRecord>> {
        self.0.get_chain(id)
    }
    fn append<'a>(&'a self, _: &'a str, _: &'a LedgerRecord) -> StoreFuture<'a, ()> {
        Box::pin(async { Ok(()) })
    }
}

#[tokio::test]
async fn successful_append_acknowledgement_without_readback_never_seals() {
    for policy in [ReleasePolicy::Hold, ReleasePolicy::Pin] {
        let f = Fixture::new(true);
        let mut p = f.policy();
        let hold = p.create_hold(f.create("hold", policy)).await.unwrap();
        f.elapsed();
        let lying = LyingStore(&f.store);
        p.store = &lying;
        assert_eq!(
            p.release(f.request(&hold, "lost-write", Some(&"ab".repeat(32))))
                .await,
            Err(ErrorCode::Ledger)
        );
        assert_eq!(p.comparisons, 0);
        assert_eq!(f.records().await.len(), 1);
    }
}

#[tokio::test]
async fn abandoned_and_successful_attempt_retries_are_not_proof_equality_oracles() {
    for event in [
        Event::PinAttemptReserved { attempt_no: 1 },
        Event::PinAttemptSucceeded,
    ] {
        let f = Fixture::new(true);
        let mut p = f.policy();
        let hold = p
            .create_hold(f.create("pin", ReleasePolicy::Pin))
            .await
            .unwrap();
        *f.store.fault.lock().unwrap() = Some(Fault {
            event,
            error: AppendError::Unavailable,
            persist: true,
        });
        assert_eq!(
            p.release(f.request(&hold, "attempt", Some(&"ab".repeat(32))))
                .await,
            Err(ErrorCode::Unavailable)
        );
        drop(p);
        *f.store.fault.lock().unwrap() = None;
        let before = f.records().await;
        let mut p = f.policy();
        for proof in ["ab".repeat(32), "cd".repeat(32), "".into(), "gg".repeat(32)] {
            assert_eq!(
                p.release(f.request(&hold, "attempt", Some(&proof))).await,
                Err(ErrorCode::Policy)
            );
        }
        assert_eq!(p.comparisons, 0);
        assert_eq!(f.records().await, before);
        if event == Event::PinAttemptSucceeded {
            assert_eq!(
                p.release(f.request(&hold, "different-id", Some(&"ab".repeat(32))))
                    .await,
                Err(ErrorCode::Policy)
            );
            assert_eq!(p.comparisons, 0);
        }
    }
}
