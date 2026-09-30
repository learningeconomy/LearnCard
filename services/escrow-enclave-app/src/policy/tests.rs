use super::*;
use crate::{
    crypto::{encrypt_escrow_blob, generate_escrow_key_pair, open_escrow_release},
    ledger::{AppendError, FakeHeadStore, StoreFuture},
    time::{SourceEvidence, TimeError, TimeFuture, TrustedInterval},
};
use p256::elliptic_curve::sec1::ToEncodedPoint;
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
    previous_keys: Vec<(String, EscrowKeyPair)>,
}

#[tokio::test]
async fn carry_audits_source_head_accumulates_and_fails_closed_on_append() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("source", ReleasePolicy::Pin))
        .await
        .unwrap();
    assert_eq!(
        p.release(f.request(&hold, "wrong", Some("cd"))).await,
        Err(ErrorCode::PinMismatch)
    );
    let target = |version| {
        encrypt_escrow_blob(
            &EscrowBlobPlaintext {
                version: 1,
                recovery_share: "cd".repeat(33),
                did: "did:key:test".into(),
                share_version: version,
                pin_verifier: None,
                pin_attempts_floor: None,
            },
            &f.keys.public_key,
            "test",
        )
        .unwrap()
    };
    let next = target(2.0);
    assert_eq!(
        p.carry_pin_verifier(&f.envelope, &next, "did:key:test", 1, 2, (999, 2))
            .await,
        Err(ErrorCode::Ledger)
    );
    let source_records = f.records().await;
    let event = Event::Carried {
        source_chain_id: hex::decode(f.enrollment().chain_id())
            .unwrap()
            .try_into()
            .unwrap(),
        source_head_hash: source_records.last().unwrap().record_hash().unwrap(),
        attempts_carried: 1,
    };
    *f.store.fault.lock().unwrap() = Some(Fault {
        event,
        error: AppendError::Unavailable,
        persist: false,
    });
    assert_eq!(
        p.carry_pin_verifier(&f.envelope, &next, "did:key:test", 1, 2, (1, 2))
            .await,
        Err(ErrorCode::Unavailable)
    );
    *f.store.fault.lock().unwrap() = None;
    let carried = p
        .carry_pin_verifier(&f.envelope, &next, "did:key:test", 1, 2, (1, 2))
        .await
        .unwrap();
    let enrollment = Enrollment::new(
        "tenant".into(),
        "did:key:test",
        2,
        blob_hash(&carried).unwrap(),
    );
    let records = f.store.get_chain(&enrollment.chain_id()).await.unwrap();
    assert_eq!(records.len(), 1);
    assert_eq!(records[0].event, event);
    assert_eq!(records[0].enrollment_epoch, 2);
    assert_eq!(records[0].prev_hash, [0; 32]);
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 2,
        share_version: 2,
        blob_hash: enrollment.blob_hash,
    });
    let mut create = f.create("carried", ReleasePolicy::Pin);
    create.envelope = &carried;
    create.expected_share_version = 2;
    create.enrollment_epoch = 2;
    let hold = p.create_hold(create).await.unwrap();
    let mut release = f.request(&hold, "second-wrong", Some("cd"));
    release.envelope = &carried;
    assert_eq!(p.release(release).await, Err(ErrorCode::PinMismatch));
    let twice = p
        .carry_pin_verifier(&carried, &target(3.0), "did:key:test", 2, 3, (2, 3))
        .await
        .unwrap();
    assert_eq!(p.decrypt(&twice).unwrap().pin_attempts_floor, Some(2));
}

#[tokio::test]
async fn negated_ephemeral_point_twin_cannot_reset_the_attempt_budget() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("source", ReleasePolicy::Pin))
        .await
        .unwrap();
    assert_eq!(
        p.release(f.request(&hold, "wrong", Some("cd"))).await,
        Err(ErrorCode::PinMismatch)
    );

    let mut twin = f.envelope.clone();
    let point = STANDARD.decode(&twin.ephemeral_public_key).unwrap();
    let public = p256::PublicKey::from_sec1_bytes(&point).unwrap();
    let negated = p256::PublicKey::from_affine(-*public.as_affine()).unwrap();
    twin.ephemeral_public_key = STANDARD.encode(negated.to_encoded_point(false).as_bytes());
    assert_ne!(twin.ephemeral_public_key, f.envelope.ephemeral_public_key);
    assert_eq!(blob_hash(&twin).unwrap(), blob_hash(&f.envelope).unwrap());

    let target = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "cd".repeat(33),
            did: "did:key:test".into(),
            share_version: 2.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    let carried = p
        .carry_pin_verifier(&twin, &target, "did:key:test", 1, 2, (1, 2))
        .await
        .unwrap();
    assert_eq!(p.decrypt(&carried).unwrap().pin_attempts_floor, Some(1));
}

#[tokio::test]
async fn rewrap_and_release_cannot_change_epoch_to_reset_a_blob_chain() {
    let mut f = Fixture::new(true);
    f.envelope = f.previous_envelope("old", 1.0, Some("ab".repeat(32)));
    f.authority.0.lock().unwrap().as_mut().unwrap().blob_hash = blob_hash(&f.envelope).unwrap();
    let mut p = f.policy();
    let mut hold = p
        .create_hold(f.create("source", ReleasePolicy::Pin))
        .await
        .unwrap();
    assert_eq!(
        p.release(f.request(&hold, "wrong", Some("cd"))).await,
        Err(ErrorCode::PinMismatch)
    );
    assert_eq!(
        p.rewrap_escrow_blob(&f.envelope, "did:key:test", 1, 999)
            .await,
        Err(ErrorCode::Ledger)
    );
    f.authority.0.lock().unwrap().as_mut().unwrap().epoch = 999;
    hold.hold.enrollment_epoch = 999;
    assert_eq!(
        p.release(f.request(&hold, "changed", Some("cd"))).await,
        Err(ErrorCode::Ledger)
    );
    assert_eq!(p.comparisons, 1);
}

#[tokio::test]
async fn release_refuses_positive_floor_without_matching_carried_genesis() {
    for recorded in [None, Some(1)] {
        let f = Fixture::new(true);
        let mut p = f.policy();
        let mut hold = p
            .create_hold(f.create("original", ReleasePolicy::Pin))
            .await
            .unwrap();
        let mut blob = p.decrypt(&f.envelope).unwrap();
        blob.pin_attempts_floor = Some(2);
        let envelope = encrypt_escrow_blob(&blob, &f.keys.public_key, "test").unwrap();
        let hash = blob_hash(&envelope).unwrap();
        f.authority.0.lock().unwrap().as_mut().unwrap().blob_hash = hash;
        hold.hold.blob_hash = hex::encode(hash);
        if let Some(attempts_carried) = recorded {
            let enrollment = Enrollment::new("tenant".into(), &blob.did, 1, hash);
            let operation = Operation {
                hold_id: "carry".into(),
                request_id: "carry".into(),
                payload_hash: hash,
                time_evidence: f.clock.0.lock().unwrap().clone().unwrap(),
            };
            p.ledger
                .transition(
                    &f.store,
                    &enrollment,
                    &operation,
                    Event::Carried {
                        source_chain_id: [1; 32],
                        source_head_hash: [2; 32],
                        attempts_carried,
                    },
                )
                .await
                .unwrap();
        }
        let mut req = f.request(&hold, "release", Some("cd"));
        req.envelope = &envelope;
        assert_eq!(p.release(req).await, Err(ErrorCode::Ledger));
        assert_eq!(p.comparisons, 0);
        let mut req = f.create("new", ReleasePolicy::Pin);
        req.envelope = &envelope;
        assert_eq!(p.create_hold(req).await, Err(ErrorCode::Ledger));
    }
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
                pin_attempts_floor: None,
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
            previous_keys: Vec::new(),
        }
    }
    fn policy(&self) -> Policy<'_> {
        Policy::new(
            EscrowKeyPair {
                public_key: self.keys.public_key.clone(),
                private_key: self.keys.private_key.clone(),
            },
            "test".into(),
            self.previous_keys
                .iter()
                .map(|(id, k)| {
                    (
                        id.clone(),
                        EscrowKeyPair {
                            public_key: k.public_key.clone(),
                            private_key: k.private_key.clone(),
                        },
                    )
                })
                .collect(),
            "tenant".into(),
            [0; 32],
            &self.store,
            &self.clock,
            &self.authority,
        )
        .unwrap()
    }
    /// P9.1: registers a decrypt-only previous key `id` and returns an
    /// envelope for `did:key:test` sealed under it (never the current key).
    fn previous_envelope(
        &mut self,
        id: &str,
        share_version: f64,
        pin_verifier: Option<String>,
    ) -> EscrowEnvelope {
        let keys = generate_escrow_key_pair().unwrap();
        let envelope = encrypt_escrow_blob(
            &EscrowBlobPlaintext {
                version: 1,
                recovery_share: "ef".repeat(33),
                did: "did:key:test".into(),
                share_version,
                pin_verifier,
                pin_attempts_floor: None,
            },
            &keys.public_key,
            id,
        )
        .unwrap();
        self.previous_keys.push((id.to_string(), keys));
        envelope
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

#[tokio::test]
async fn carry_and_rewrap_refuse_same_process_truncation_after_spending_attempts() {
    for rewrap in [false, true] {
        for keep in [0, 1] {
            let mut f = Fixture::new(true);
            if rewrap {
                f.envelope = f.previous_envelope("previous", 1.0, Some("ab".repeat(32)));
                *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
                    epoch: 1,
                    share_version: 1,
                    blob_hash: blob_hash(&f.envelope).unwrap(),
                });
            }
            let mut p = f.policy();
            let hold = p
                .create_hold(f.create("hold", ReleasePolicy::Pin))
                .await
                .unwrap();
            for i in 0..3 {
                assert_eq!(
                    p.release(f.request(&hold, &format!("attempt{i}"), Some("cd")))
                        .await,
                    Err(ErrorCode::PinMismatch)
                );
            }
            let records = f.records().await;
            f.store
                .inner
                .replace(&f.enrollment().chain_id(), records[..keep].to_vec())
                .unwrap();
            if rewrap {
                assert_eq!(
                    p.rewrap_escrow_blob(&f.envelope, "did:key:test", 1, 1)
                        .await,
                    Err(ErrorCode::Ledger)
                );
            } else {
                let target = encrypt_escrow_blob(
                    &EscrowBlobPlaintext {
                        version: 1,
                        recovery_share: "cd".repeat(33),
                        did: "did:key:test".into(),
                        share_version: 2.0,
                        pin_verifier: None,
                        pin_attempts_floor: None,
                    },
                    &f.keys.public_key,
                    "test",
                )
                .unwrap();
                assert_eq!(
                    p.carry_pin_verifier(&f.envelope, &target, "did:key:test", 1, 2, (1, 2))
                        .await,
                    Err(ErrorCode::Ledger)
                );
            }
        }
    }
}

#[tokio::test]
async fn rotation_verifies_old_records_and_signs_new_records_with_current_key() {
    let f = Fixture::new(true);
    let mut old = f.policy();
    let old_public = old.ledger_public_key();
    let hold = old
        .create_hold(f.create("rotating", ReleasePolicy::Pin))
        .await
        .unwrap();
    assert_eq!(
        old.release(f.request(&hold, "old-attempt", Some("cd")))
            .await,
        Err(ErrorCode::PinMismatch)
    );
    drop(old);
    let current = generate_escrow_key_pair().unwrap();
    let target = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "cd".repeat(33),
            did: "did:key:test".into(),
            share_version: 2.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &current.public_key,
        "K2",
    )
    .unwrap();
    let previous = EscrowKeyPair {
        public_key: f.keys.public_key.clone(),
        private_key: f.keys.private_key.clone(),
    };
    let mut rotated = Policy::new(
        current,
        "K2".into(),
        vec![("test".into(), previous)],
        "tenant".into(),
        [0; 32],
        &f.store,
        &f.clock,
        &f.authority,
    )
    .unwrap();
    let carried = rotated
        .carry_pin_verifier(&f.envelope, &target, "did:key:test", 1, 2, (1, 2))
        .await
        .unwrap();
    assert_eq!(
        rotated.decrypt(&carried).unwrap().pin_attempts_floor,
        Some(1)
    );
    let rewrapped = rotated
        .rewrap_escrow_blob(&f.envelope, "did:key:test", 1, 1)
        .await
        .unwrap();
    assert_eq!(
        rotated.decrypt(&rewrapped).unwrap().pin_attempts_floor,
        Some(1)
    );
    let released = rotated
        .release(f.request(&hold, "new-attempt", Some(&"ab".repeat(32))))
        .await
        .unwrap();
    f.assert_release(&released, "rotating");
    let records = f.records().await;
    assert!(records.iter().any(|r| r.key_id == "test"));
    assert_eq!(records.last().unwrap().key_id, "K2");
    let mut verifiers = std::collections::BTreeMap::from([
        ("test".into(), old_public),
        ("K2".into(), rotated.ledger_public_key()),
    ]);
    assert!(Ledger::verify_chain_with_keys(&records, &f.enrollment(), &verifiers).is_ok());
    verifiers.remove("test");
    assert!(Ledger::verify_chain_with_keys(&records, &f.enrollment(), &verifiers).is_err());
    // Both floor paths also authenticate a mixed-key chain after new appends.
    let carried = rotated
        .carry_pin_verifier(&f.envelope, &target, "did:key:test", 1, 2, (1, 2))
        .await
        .unwrap();
    assert_eq!(
        rotated.decrypt(&carried).unwrap().pin_attempts_floor,
        Some(2)
    );
    let rewrapped = rotated
        .rewrap_escrow_blob(&f.envelope, "did:key:test", 1, 1)
        .await
        .unwrap();
    assert_eq!(
        rotated.decrypt(&rewrapped).unwrap().pin_attempts_floor,
        Some(2)
    );
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
    assert!(!p.verify_blob(&f.envelope, "did:key:wrong", 1).unwrap().ok);
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

// P8.4: mirrors softwareEnclave.test.ts's "carries the sealed verifier with
// strict binding" cases, plus an enclave-only "undecryptable" case. Every
// rejection shares the identical generic Blob error, so this asserts equality
// against that one code rather than distinguishing scenarios by message/kind.
#[tokio::test]
async fn carry_pin_verifier_rejects_every_invalid_binding() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    let pin_verifier = "ab".repeat(32);
    for scenario in [
        "source did",
        "target did",
        "expected did",
        "equal version",
        "lower version",
        "source version",
        "target version",
        "missing pin",
        "target pin",
        "undecryptable",
    ] {
        let real_target_version = match scenario {
            "equal version" => 2.0,
            "lower version" => 1.0,
            _ => 3.0,
        };
        let source = encrypt_escrow_blob(
            &EscrowBlobPlaintext {
                version: 1,
                recovery_share: "ab".repeat(33),
                did: if scenario == "source did" {
                    "did:key:other".into()
                } else {
                    "did:key:test".into()
                },
                share_version: 2.0,
                pin_verifier: (scenario != "missing pin").then(|| pin_verifier.clone()),
                pin_attempts_floor: None,
            },
            &f.keys.public_key,
            "test",
        )
        .unwrap();
        let mut target = encrypt_escrow_blob(
            &EscrowBlobPlaintext {
                version: 1,
                recovery_share: "cd".repeat(33),
                did: if scenario == "target did" {
                    "did:key:other".into()
                } else {
                    "did:key:test".into()
                },
                share_version: real_target_version,
                pin_verifier: (scenario == "target pin").then(|| pin_verifier.clone()),
                pin_attempts_floor: None,
            },
            &f.keys.public_key,
            "test",
        )
        .unwrap();
        if scenario == "undecryptable" {
            target.key_id = "unknown".into();
        }
        let expected_did = if scenario == "expected did" {
            "did:key:other"
        } else {
            "did:key:test"
        };
        let source_share_version = if scenario == "source version" { 1 } else { 2 };
        let target_share_version = if scenario == "target version" {
            4
        } else {
            real_target_version as u32
        };
        assert_eq!(
            p.carry_pin_verifier(
                &source,
                &target,
                expected_did,
                source_share_version,
                target_share_version,
                (1, 2)
            )
            .await,
            Err(ErrorCode::Blob),
            "scenario: {scenario}"
        );
    }
}

// Mirrors keys-escrow.spec.ts's "safe PIN carry" success path: the carried
// envelope verifies hasPin, and a PIN release with the ORIGINAL proof still
// works. carry_pin_verifier itself touches no ledger state (P8.1); create_hold
// and release below exercise the ordinary ledger-backed path on the result.
#[tokio::test]
async fn carry_pin_verifier_succeeds_and_the_carried_pin_still_releases() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    let pin_verifier = "ab".repeat(32);
    let source = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ab".repeat(33),
            did: "did:key:test".into(),
            share_version: 2.0,
            pin_verifier: Some(pin_verifier.clone()),
            pin_attempts_floor: None,
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    let target = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "cd".repeat(33),
            did: "did:key:test".into(),
            share_version: 3.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    let carried = p
        .carry_pin_verifier(&source, &target, "did:key:test", 2, 3, (1, 1))
        .await
        .unwrap();
    assert_ne!(carried.ciphertext, target.ciphertext);
    assert_eq!(
        p.verify_blob(&carried, "did:key:test", 3).unwrap(),
        BlobVerification {
            ok: true,
            has_pin: true,
        }
    );
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 1,
        share_version: 3,
        blob_hash: blob_hash(&carried).unwrap(),
    });
    let hold = p
        .create_hold(CreateHoldRequest {
            envelope: &carried,
            hold_id: "carry-release",
            request_id: "carry-release",
            expected_did: "did:key:test",
            expected_share_version: 3,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Pin,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    let sealed = p
        .release(ReleaseRequest {
            envelope: &carried,
            hold: &hold,
            request_id: "carry-release-attempt",
            expected_did: "did:key:test",
            client_ephemeral_public_key: &f.client.public_key,
            pin_proof: Some(&pin_verifier),
        })
        .await
        .unwrap();
    let released = open_escrow_release(&sealed, &f.client.private_key).unwrap();
    assert_eq!(released.blob.pin_verifier, None);
    assert_eq!(released.blob.pin_attempts_floor, None);
    assert_eq!(released.blob.recovery_share, "cd".repeat(33));
    assert_eq!(released.blob.share_version, 3.0);
    assert_eq!(released.hold_id, "carry-release");
}

// P8.3: the target's floor is `source blob floor + source chain attempts_used`
// (verified via a real create_hold/release_pin cycle against the source
// enrollment, not a hand-crafted chain), and release against the carried blob
// in its NEW epoch only permits the remaining budget before locking.
#[tokio::test]
async fn carry_accumulates_real_source_attempts_and_new_epoch_gets_only_the_remaining_budget() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("pin", ReleasePolicy::Pin))
        .await
        .unwrap();
    for attempt in 0..3 {
        assert_eq!(
            p.release(f.request(&hold, &format!("wrong{attempt}"), Some("cd")))
                .await,
            Err(ErrorCode::PinMismatch)
        );
    }
    let target = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ef".repeat(33),
            did: "did:key:test".into(),
            share_version: 2.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    let carried = p
        .carry_pin_verifier(&f.envelope, &target, "did:key:test", 1, 2, (1, 2))
        .await
        .unwrap();
    assert_eq!(p.decrypt(&carried).unwrap().pin_attempts_floor, Some(3));
    // A REAL rotation bumps the epoch (UserKey.escrowBlob.enrollmentEpoch);
    // epoch 2 is a fresh chain_id, exercising the exact scenario P8.3 fixes.
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 2,
        share_version: 2,
        blob_hash: blob_hash(&carried).unwrap(),
    });
    let new_hold = p
        .create_hold(CreateHoldRequest {
            envelope: &carried,
            hold_id: "new-epoch",
            request_id: "new-epoch",
            expected_did: "did:key:test",
            expected_share_version: 2,
            enrollment_epoch: 2,
            release_policy: ReleasePolicy::Pin,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    let new_request = |id: String, proof: &'static str| ReleaseRequest {
        envelope: &carried,
        hold: &new_hold,
        request_id: Box::leak(id.into_boxed_str()),
        expected_did: "did:key:test",
        client_ephemeral_public_key: &f.client.public_key,
        pin_proof: Some(proof),
    };
    for attempt in 0..7 {
        assert_eq!(
            p.release(new_request(format!("new{attempt}"), "cd")).await,
            Err(ErrorCode::PinMismatch)
        );
    }
    // Total spent is now 3 (floor) + 7 (local) = 10: the budget is exhausted
    // without ever locally reaching ledger-native attempt_no 10.
    assert_eq!(
        p.release(new_request("new-eighth".into(), "ab")).await,
        Err(ErrorCode::Policy)
    );
}

// P8.3: an empty source chain (this DID never attempted a PIN) never LOWERS a
// floor the source blob already carried from an earlier carry.
#[tokio::test]
async fn carry_never_lowers_a_floor_when_the_source_chain_is_empty() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    let source = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ab".repeat(33),
            did: "did:key:test".into(),
            share_version: 4.0,
            pin_verifier: Some("ab".repeat(32)),
            pin_attempts_floor: Some(5),
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    let target = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "cd".repeat(33),
            did: "did:key:test".into(),
            share_version: 5.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    assert_eq!(
        p.carry_pin_verifier(&source, &target, "did:key:test", 4, 5, (1, 2))
            .await,
        Err(ErrorCode::Ledger)
    );
}

// P8.3: a source chain that fails signature/link verification is rejected
// (fail closed), not silently treated as empty.
#[tokio::test]
async fn carry_rejects_a_tampered_source_chain() {
    let f = Fixture::new(true);
    let mut p = f.policy();
    let hold = p
        .create_hold(f.create("pin", ReleasePolicy::Pin))
        .await
        .unwrap();
    p.release(f.request(&hold, "wrong", Some("cd")))
        .await
        .unwrap_err();
    let mut records = f.records().await;
    records[1].payload_hash[0] ^= 1;
    f.store
        .inner
        .replace(&f.enrollment().chain_id(), records)
        .unwrap();
    let target = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ef".repeat(33),
            did: "did:key:test".into(),
            share_version: 2.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    assert_eq!(
        p.carry_pin_verifier(&f.envelope, &target, "did:key:test", 1, 2, (1, 2))
            .await,
        Err(ErrorCode::Ledger)
    );
}

// P9.1: a blob still sealed under a retired ("previous") keyId is neither
// stuck nor silently trusted — it decrypts, creates a hold and releases
// exactly like a current-key blob, restoring release for pre-rotation blobs.
#[tokio::test]
async fn previous_key_blob_verifies_creates_hold_and_releases() {
    let mut f = Fixture::new(false);
    let previous = f.previous_envelope("previous-1", 1.0, None);
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 1,
        share_version: 1,
        blob_hash: blob_hash(&previous).unwrap(),
    });
    let mut p = f.policy();
    assert_eq!(
        p.verify_blob(&previous, "did:key:test", 1).unwrap(),
        BlobVerification {
            ok: true,
            has_pin: false,
        }
    );
    let hold = p
        .create_hold(CreateHoldRequest {
            envelope: &previous,
            hold_id: "previous-hold",
            request_id: "previous-hold",
            expected_did: "did:key:test",
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Hold,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    f.elapsed();
    let sealed = p
        .release(ReleaseRequest {
            envelope: &previous,
            hold: &hold,
            request_id: "previous-release",
            expected_did: "did:key:test",
            client_ephemeral_public_key: &f.client.public_key,
            pin_proof: None,
        })
        .await
        .unwrap();
    let release = open_escrow_release(&sealed, &f.client.private_key).unwrap();
    assert_eq!(release.blob.did, "did:key:test");
    assert_eq!(release.blob.recovery_share, "ef".repeat(33));
    assert_eq!(release.hold_id, "previous-hold");
}

// P9.1: an unrecognised keyId (neither current nor a configured previous key)
// is indistinguishable from any other malformed/undecryptable envelope: the
// existing generic Blob error, across every operation that opens an envelope,
// never naming or otherwise leaking which keyId was rejected.
#[tokio::test]
async fn unknown_key_id_is_the_generic_blob_error() {
    let f = Fixture::new(false);
    let mut p = f.policy();
    let mut unknown = f.envelope.clone();
    unknown.key_id = "retired-and-removed".into();
    assert_eq!(
        p.verify_blob(&unknown, "did:key:test", 1),
        Err(ErrorCode::Blob)
    );
    assert_eq!(
        p.create_hold(CreateHoldRequest {
            envelope: &unknown,
            hold_id: "unknown",
            request_id: "unknown",
            expected_did: "did:key:test",
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Hold,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await,
        Err(ErrorCode::Blob)
    );
    assert_eq!(
        p.carry_pin_verifier(&unknown, &f.envelope, "did:key:test", 1, 2, (1, 2))
            .await,
        Err(ErrorCode::Blob)
    );
    let mut unknown_target = f.envelope.clone();
    unknown_target.key_id = "retired-and-removed".into();
    assert_eq!(
        p.carry_pin_verifier(&f.envelope, &unknown_target, "did:key:test", 1, 2, (1, 2))
            .await,
        Err(ErrorCode::Blob)
    );
}

// P9.2: the ledger enrollment chain is keyed by (tenant, did, epoch, blobHash)
// never by which key encrypted the blob, so P8.3's accumulated-attempts
// accounting applies identically when the SOURCE of a carry is a previous
// key. The carried result is always resealed under the CURRENT key/keyId,
// and the original PIN proof still releases it in the new epoch.
#[tokio::test]
async fn carry_pin_verifier_from_a_previous_key_reseals_under_the_current_key_and_preserves_pin_and_attempts(
) {
    let mut f = Fixture::new(false);
    let pin_verifier = "ab".repeat(32);
    let source = f.previous_envelope("previous-1", 2.0, Some(pin_verifier.clone()));
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 1,
        share_version: 2,
        blob_hash: blob_hash(&source).unwrap(),
    });
    let mut p = f.policy();
    let hold = p
        .create_hold(CreateHoldRequest {
            envelope: &source,
            hold_id: "pin",
            request_id: "pin",
            expected_did: "did:key:test",
            expected_share_version: 2,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Pin,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    for attempt in 0..3 {
        assert_eq!(
            p.release(ReleaseRequest {
                envelope: &source,
                hold: &hold,
                request_id: Box::leak(format!("wrong{attempt}").into_boxed_str()),
                expected_did: "did:key:test",
                client_ephemeral_public_key: &f.client.public_key,
                pin_proof: Some("cd"),
            })
            .await,
            Err(ErrorCode::PinMismatch)
        );
    }
    let target = encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "cd".repeat(33),
            did: "did:key:test".into(),
            share_version: 3.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &f.keys.public_key,
        "test",
    )
    .unwrap();
    let carried = p
        .carry_pin_verifier(&source, &target, "did:key:test", 2, 3, (1, 2))
        .await
        .unwrap();
    assert_eq!(carried.key_id, "test");
    let decrypted = p.decrypt(&carried).unwrap();
    assert_eq!(
        decrypted.pin_verifier.as_deref(),
        Some(pin_verifier.as_str())
    );
    assert_eq!(decrypted.pin_attempts_floor, Some(3));
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 2,
        share_version: 3,
        blob_hash: blob_hash(&carried).unwrap(),
    });
    let new_hold = p
        .create_hold(CreateHoldRequest {
            envelope: &carried,
            hold_id: "carried-pin",
            request_id: "carried-pin",
            expected_did: "did:key:test",
            expected_share_version: 3,
            enrollment_epoch: 2,
            release_policy: ReleasePolicy::Pin,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    let sealed = p
        .release(ReleaseRequest {
            envelope: &carried,
            hold: &new_hold,
            request_id: "carried-release",
            expected_did: "did:key:test",
            client_ephemeral_public_key: &f.client.public_key,
            pin_proof: Some(&pin_verifier),
        })
        .await
        .unwrap();
    let release = open_escrow_release(&sealed, &f.client.private_key).unwrap();
    assert_eq!(release.blob.pin_verifier, None);
    assert_eq!(release.blob.pin_attempts_floor, None);
    assert_eq!(release.blob.recovery_share, "cd".repeat(33));
    assert_eq!(release.hold_id, "carried-pin");
}

// P9.3: a previous-key copy migrates onto the current key, keeps its share
// version, and the PIN still releases with the original proof afterward.
#[tokio::test]
async fn rewrap_escrow_blob_succeeds_and_the_pin_still_releases() {
    let mut f = Fixture::new(false);
    let pin_verifier = "ab".repeat(32);
    let source = f.previous_envelope("previous-1", 1.0, Some(pin_verifier.clone()));
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 1,
        share_version: 1,
        blob_hash: blob_hash(&source).unwrap(),
    });
    let mut p = f.policy();
    let rewrapped = p
        .rewrap_escrow_blob(&source, "did:key:test", 1, 1)
        .await
        .unwrap();
    assert_ne!(rewrapped.ciphertext, source.ciphertext);
    assert_eq!(rewrapped.key_id, "test");
    let decrypted = p.decrypt(&rewrapped).unwrap();
    assert_eq!(decrypted.did, "did:key:test");
    assert_eq!(decrypted.share_version, 1.0);
    assert_eq!(
        decrypted.pin_verifier.as_deref(),
        Some(pin_verifier.as_str())
    );
    assert_eq!(decrypted.pin_attempts_floor, None);
    // Same epoch/version as the source, but a NEW blob_hash (fresh ciphertext):
    // the lca-api model write bumps enrollmentEpoch on every rewrap (see
    // UserKey.rewrapEscrowBlobByAuthProvider); the enclave itself only cares
    // that the presented envelope's hash matches whatever the authenticated
    // EnrollmentSource currently reports, so this test simulates exactly that
    // real production write before authenticating a hold against the result.
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 1,
        share_version: 1,
        blob_hash: blob_hash(&rewrapped).unwrap(),
    });
    let hold = p
        .create_hold(CreateHoldRequest {
            envelope: &rewrapped,
            hold_id: "rewrap-pin",
            request_id: "rewrap-pin",
            expected_did: "did:key:test",
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Pin,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    let sealed = p
        .release(ReleaseRequest {
            envelope: &rewrapped,
            hold: &hold,
            request_id: "rewrap-release",
            expected_did: "did:key:test",
            client_ephemeral_public_key: &f.client.public_key,
            pin_proof: Some(&pin_verifier),
        })
        .await
        .unwrap();
    let release = open_escrow_release(&sealed, &f.client.private_key).unwrap();
    assert_eq!(release.blob.recovery_share, "ef".repeat(33));
    assert_eq!(release.hold_id, "rewrap-pin");
}

// P9.3: floor = prior attempts against the SAME (tenant, did, epoch) chain,
// exactly like carry_pin_verifier's P8.3 accounting — re-sealing changes the
// blob hash (and so, per D13, nothing about chain identity) but must not
// reset the ten-attempt lifetime budget.
#[tokio::test]
async fn rewrap_escrow_blob_carries_the_accumulated_attempts_floor() {
    let mut f = Fixture::new(true);
    let source = f.previous_envelope("previous-2", 1.0, Some("ab".repeat(32)));
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        epoch: 1,
        share_version: 1,
        blob_hash: blob_hash(&source).unwrap(),
    });
    let mut p = f.policy();
    let hold = p
        .create_hold(CreateHoldRequest {
            envelope: &source,
            hold_id: "pre-rewrap",
            request_id: "pre-rewrap",
            expected_did: "did:key:test",
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Pin,
            client_ephemeral_public_key: &f.client.public_key,
        })
        .await
        .unwrap();
    for attempt in 0..3 {
        assert_eq!(
            p.release(ReleaseRequest {
                envelope: &source,
                hold: &hold,
                request_id: Box::leak(format!("wrong{attempt}").into_boxed_str()),
                expected_did: "did:key:test",
                client_ephemeral_public_key: &f.client.public_key,
                pin_proof: Some("cd"),
            })
            .await,
            Err(ErrorCode::PinMismatch)
        );
    }
    let rewrapped = p
        .rewrap_escrow_blob(&source, "did:key:test", 1, 1)
        .await
        .unwrap();
    assert_eq!(p.decrypt(&rewrapped).unwrap().pin_attempts_floor, Some(3));
}

// P9.3: refuses a current-key envelope (nothing to migrate), an unknown/
// retired keyId, a wrong DID and a wrong share version — every rejection
// shares the identical generic Blob error, matching carry_pin_verifier.
#[tokio::test]
async fn rewrap_escrow_blob_refuses_current_unknown_wrong_did_and_wrong_version() {
    let mut f = Fixture::new(false);
    let source = f.previous_envelope("previous-3", 1.0, None);
    let mut unknown = f.envelope.clone();
    unknown.key_id = "retired-and-removed".into();
    let mut p = f.policy();
    assert_eq!(
        p.rewrap_escrow_blob(&f.envelope, "did:key:test", 1, 1)
            .await,
        Err(ErrorCode::Blob)
    );
    assert_eq!(
        p.rewrap_escrow_blob(&unknown, "did:key:test", 1, 1).await,
        Err(ErrorCode::Blob)
    );
    assert_eq!(
        p.rewrap_escrow_blob(&source, "did:key:wrong", 1, 1).await,
        Err(ErrorCode::Blob)
    );
    assert_eq!(
        p.rewrap_escrow_blob(&source, "did:key:test", 2, 1).await,
        Err(ErrorCode::Blob)
    );
    assert_eq!(
        p.rewrap_escrow_blob(&source, "did:key:test", 1, 0).await,
        Err(ErrorCode::Blob)
    );
}

// P9.1: boot-time bounds on previous keys are enforced, not silently ignored —
// too many, a duplicate id, or an id colliding with the current key all
// refuse construction; exactly `MAX_PREVIOUS_KEYS` distinct ids succeeds.
#[tokio::test]
async fn policy_new_rejects_too_many_duplicate_or_overlapping_previous_keys() {
    let f = Fixture::new(false);
    let current = || EscrowKeyPair {
        public_key: f.keys.public_key.clone(),
        private_key: f.keys.private_key.clone(),
    };
    let build = |previous: Vec<(String, EscrowKeyPair)>| {
        Policy::new(
            current(),
            "test".into(),
            previous,
            "tenant".into(),
            [0; 32],
            &f.store,
            &f.clock,
            &f.authority,
        )
    };
    let too_many = (0..4)
        .map(|i| (format!("previous-{i}"), generate_escrow_key_pair().unwrap()))
        .collect();
    assert_eq!(build(too_many).err(), Some(ErrorCode::Policy));
    let duplicate = vec![
        ("previous-a".into(), generate_escrow_key_pair().unwrap()),
        ("previous-a".into(), generate_escrow_key_pair().unwrap()),
    ];
    assert_eq!(build(duplicate).err(), Some(ErrorCode::Policy));
    let overlaps_current = vec![("test".into(), generate_escrow_key_pair().unwrap())];
    assert_eq!(build(overlaps_current).err(), Some(ErrorCode::Policy));
    let exactly_max = (0..MAX_PREVIOUS_KEYS)
        .map(|i| (format!("previous-{i}"), generate_escrow_key_pair().unwrap()))
        .collect();
    assert!(build(exactly_max).is_ok());
}

// P9.1: boot with 2 previous keys — each decrypts only its OWN blob. A
// keyId/ciphertext mismatch fails exactly like any other undecryptable
// envelope, proving real per-key isolation, not just a recognised-id
// short-circuit that would trust any envelope claiming a known keyId.
#[tokio::test]
async fn two_previous_keys_each_decrypt_only_their_own_blob() {
    let mut f = Fixture::new(false);
    let envelope_a = f.previous_envelope("previous-a", 1.0, None);
    let envelope_b = f.previous_envelope("previous-b", 1.0, None);
    let p = f.policy();
    assert_eq!(
        p.verify_blob(&envelope_a, "did:key:test", 1).unwrap(),
        BlobVerification {
            ok: true,
            has_pin: false,
        }
    );
    assert_eq!(
        p.verify_blob(&envelope_b, "did:key:test", 1).unwrap(),
        BlobVerification {
            ok: true,
            has_pin: false,
        }
    );
    let mut swapped = envelope_a.clone();
    swapped.key_id = "previous-b".into();
    assert_eq!(
        p.verify_blob(&swapped, "did:key:test", 1),
        Err(ErrorCode::Blob)
    );
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
    // A genuinely new client blob has its own budget. The authenticated authority
    // must decide whether it is current; old holds still cannot be transplanted.
    *f.authority.0.lock().unwrap() = Ok(CurrentEnrollment {
        blob_hash: blob_hash(&other).unwrap(),
        ..original
    });
    let mut req = f.create("new-blob", ReleasePolicy::Pin);
    req.envelope = &other;
    assert!(p.create_hold(req).await.is_ok());
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
