use super::*;
use crate::authority::state::{ActiveBlob, Counter, PinState, Revisions};
use ed25519_dalek::{Signer, SigningKey};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Vector {
    seed_hex: String,
    public_key_hex: String,
    canonical_hex: String,
    intent: EnrollmentIntent,
    signature: String,
    source_fixture_index: usize,
    target_fixture_index: usize,
}
struct Fixture {
    vector: Vector,
    signed: SignedEnrollmentIntent,
    binding: Binding,
    current: EnrollmentItem,
    source: EscrowEnvelope,
    target: EscrowEnvelope,
}
fn counter(value: u64) -> Counter {
    Counter::try_from(value).unwrap()
}
impl Fixture {
    fn new() -> Self {
        let vector: Vector = serde_json::from_str(include_str!("../../../../../packages/sss-key-manager/src/__fixtures__/escrow-enrollment-intent-v1.json")).unwrap();
        let envelopes: serde_json::Value = serde_json::from_str(include_str!(
            "../../../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
        ))
        .unwrap();
        let source: EscrowEnvelope = serde_json::from_value(
            envelopes["blobs"][vector.source_fixture_index]["envelope"].clone(),
        )
        .unwrap();
        let target = serde_json::from_value(
            envelopes["blobs"][vector.target_fixture_index]["envelope"].clone(),
        )
        .unwrap();
        let current = EnrollmentItem {
            revisions: Revisions {
                operation: counter(19),
                enrollment: counter(7),
            },
            epoch: counter(3),
            pin: PinState {
                generation: counter(2),
                configured: true,
                attempts_used: 8,
            },
            intent_digest: [7; 32],
            enrollment: EnrollmentStatus::Active {
                blob: Box::new(ActiveBlob {
                    identity: escrow_blob_identity(&source).unwrap(),
                    envelope: source.clone(),
                    share_version: 1,
                    chain_head: None,
                    rewrap_delegated: true,
                }),
            },
            email_throttle: None,
        };
        let binding = Binding {
            tenant: vector.intent.tenant.clone(),
            generation: vector.intent.authority_generation.clone(),
            did_hash: Sha256::digest(vector.intent.did.as_bytes()).into(),
        };
        let signed = SignedEnrollmentIntent {
            intent: vector.intent.clone(),
            signature: vector.signature.clone(),
        };
        Self {
            vector,
            signed,
            binding,
            current,
            source,
            target,
        }
    }
    fn context(&self) -> IntentContext<'_> {
        IntentContext {
            binding: &self.binding,
            current: Some(&self.current),
            source: Some(&self.source),
            target: Some(&self.target),
        }
    }
    fn resign(&mut self) {
        let seed: [u8; 32] = hex::decode(&self.vector.seed_hex)
            .unwrap()
            .try_into()
            .unwrap();
        self.signed.signature = STANDARD.encode(
            SigningKey::from_bytes(&seed)
                .sign(&self.signed.intent.canonical_bytes().unwrap())
                .to_bytes(),
        );
    }
}

#[test]
fn rust_and_typescript_match_message_public_key_and_signature_golden_bytes() {
    let mut f = Fixture::new();
    assert_eq!(
        hex::encode(f.signed.intent.canonical_bytes().unwrap()),
        f.vector.canonical_hex
    );
    assert_eq!(
        hex::encode(did_key(&f.signed.intent.did).unwrap().as_bytes()),
        f.vector.public_key_hex
    );
    assert_eq!(
        hex::encode(escrow_blob_identity(&f.source).unwrap()),
        f.signed.intent.source_blob_identity.clone().unwrap()
    );
    assert_eq!(
        hex::encode(escrow_blob_identity(&f.target).unwrap()),
        f.signed.intent.target_blob_identity.clone().unwrap()
    );
    f.resign();
    assert_eq!(f.signed.signature, f.vector.signature);
    let proof = verify_intent(&f.signed, f.context()).unwrap();
    assert!(proof.intent() == &f.vector.intent);
}

#[test]
fn every_signed_field_is_bound_and_json_property_order_is_irrelevant() {
    let f = Fixture::new();
    let mutations: Vec<(&str, serde_json::Value)> = vec![
        ("version", 3.into()),
        ("tenant", "other".into()),
        ("did", "did:web:attacker.test".into()),
        ("authorityGeneration", "g3".into()),
        ("expectedEnrollmentVersion", 8.into()),
        ("action", "replace".into()),
        ("sourceBlobIdentity", "11".repeat(32).into()),
        ("targetBlobIdentity", "22".repeat(32).into()),
        ("pinAction", "clear".into()),
        ("shareVersion", 43.into()),
        ("enrollmentEpoch", 5.into()),
        ("requestId", "other-request".into()),
        ("allowRewrap", false.into()),
        // P9.1: the fixture's action (carry) requires both null; any non-null
        // value must fail closed just like every other signed field.
        ("recoveryEmail", "attacker@example.com".into()),
        ("recoveryLanguage", "fr".into()),
    ];
    for (field, value) in mutations {
        let mut json = serde_json::to_value(&f.signed).unwrap();
        json["intent"][field] = value;
        let signed: SignedEnrollmentIntent = serde_json::from_value(json).unwrap();
        assert!(verify_intent(&signed, f.context()).is_err());
    }
    let sorted = serde_json::to_vec_pretty(&serde_json::to_value(&f.signed).unwrap()).unwrap();
    let decoded = SignedEnrollmentIntent::decode(&sorted).unwrap();
    assert!(verify_intent(&decoded, f.context()).is_ok());
}

#[test]
fn owner_signed_wrong_scope_replay_and_empty_state_fail_closed_but_hold_activity_does_not() {
    for field in ["tenant", "generation", "version", "did"] {
        let mut f = Fixture::new();
        match field {
            "tenant" => f.binding.tenant = "other".into(),
            "generation" => f.binding.generation = "g3".into(),
            "version" => f.current.revisions.enrollment = counter(8),
            "did" => f.binding.did_hash = [8; 32],
            _ => unreachable!(),
        }
        assert!(verify_intent(&f.signed, f.context()).is_err());
    }
    let mut f = Fixture::new();
    f.current.revisions.operation = counter(20);
    assert!(verify_intent(&f.signed, f.context()).is_ok());
    assert!(verify_intent(
        &f.signed,
        IntentContext {
            current: None,
            ..f.context()
        }
    )
    .is_err());
}

#[test]
fn attack_b_signed_fabricated_lower_version_source_cannot_carry_onto_genuine_target() {
    let mut f = Fixture::new();
    f.current.enrollment = EnrollmentStatus::Active {
        blob: Box::new(ActiveBlob {
            identity: escrow_blob_identity(&f.target).unwrap(),
            envelope: f.target.clone(),
            share_version: 42,
            chain_head: None,
            rewrap_delegated: true,
        }),
    };
    f.signed.intent.share_version = 43;
    f.resign(); // Even a valid owner signature cannot designate a noncurrent source.
    assert!(verify_intent(&f.signed, f.context()).is_err());
}

#[test]
fn substituted_source_or_target_and_altered_pin_semantics_are_rejected() {
    let mut f = Fixture::new();
    assert!(verify_intent(
        &f.signed,
        IntentContext {
            source: Some(&f.target),
            ..f.context()
        }
    )
    .is_err());
    assert!(verify_intent(
        &f.signed,
        IntentContext {
            target: Some(&f.source),
            ..f.context()
        }
    )
    .is_err());
    f.signed.intent.action = EnrollmentAction::Replace;
    f.signed.intent.pin_action = PinAction::Set;
    f.signed.intent.recovery_email = Some("owner@example.com".into());
    f.signed.intent.recovery_language = Some("en".into());
    f.resign();
    assert!(verify_intent(&f.signed, f.context()).is_err()); // Existing PIN requires change.
    f.signed.intent.pin_action = PinAction::Change;
    f.resign();
    assert!(verify_intent(&f.signed, f.context()).is_ok());
    f.signed.intent.pin_action = PinAction::Clear;
    f.resign();
    assert!(verify_intent(&f.signed, f.context()).is_ok());
}

#[test]
fn enroll_and_disable_require_their_exact_input_shapes_and_epochs() {
    let mut f = Fixture::new();
    f.signed.intent.action = EnrollmentAction::Enroll;
    f.signed.intent.source_blob_identity = None;
    f.signed.intent.expected_enrollment_version = 0;
    f.signed.intent.enrollment_epoch = 1;
    f.signed.intent.pin_action = PinAction::Set;
    f.signed.intent.recovery_email = Some("owner@example.com".into());
    f.signed.intent.recovery_language = Some("en".into());
    f.resign();
    let initial = IntentContext {
        current: None,
        source: None,
        ..f.context()
    };
    assert!(verify_intent(&f.signed, initial).is_ok());
    assert!(verify_intent(&f.signed, f.context()).is_err());
    let mut f = Fixture::new();
    f.signed.intent.action = EnrollmentAction::Disable;
    f.signed.intent.target_blob_identity = None;
    f.signed.intent.allow_rewrap = false;
    f.signed.intent.enrollment_epoch = 3;
    f.signed.intent.share_version = 1;
    f.resign();
    assert!(verify_intent(
        &f.signed,
        IntentContext {
            target: None,
            ..f.context()
        }
    )
    .is_ok());
    assert!(verify_intent(&f.signed, f.context()).is_err());
}

#[test]
fn nonowner_noncanonical_and_cross_domain_signatures_are_rejected() {
    let mut f = Fixture::new();
    f.signed.signature = STANDARD.encode(
        SigningKey::from_bytes(&[9; 32])
            .sign(&f.signed.intent.canonical_bytes().unwrap())
            .to_bytes(),
    );
    assert!(verify_intent(&f.signed, f.context()).is_err());
    let seed: [u8; 32] = hex::decode(&f.vector.seed_hex).unwrap().try_into().unwrap();
    let bytes = f.signed.intent.canonical_bytes().unwrap();
    f.signed.signature = STANDARD.encode(
        SigningKey::from_bytes(&seed)
            .sign(&bytes[INTENT_DOMAIN.len()..])
            .to_bytes(),
    );
    assert!(verify_intent(&f.signed, f.context()).is_err());
    f.resign();
    let mut sig = STANDARD.decode(&f.signed.signature).unwrap();
    sig[63] |= 0x80;
    f.signed.signature = STANDARD.encode(sig);
    assert!(verify_intent(&f.signed, f.context()).is_err());
    f.resign();
    f.signed.signature.pop();
    assert!(verify_intent(&f.signed, f.context()).is_err());
}

#[test]
fn only_canonical_nonweak_ed25519_did_keys_are_accepted_without_resolution() {
    let f = Fixture::new();
    for did in [
        format!("{}#key", f.signed.intent.did),
        f.signed.intent.did.replace("did:key:z", "did:web:z"),
        "did:key:uZm9v".into(),
    ] {
        assert!(did_key(&did).is_err());
    }
    for bytes in [
        [0; 32],
        {
            let mut p = [0; 32];
            p[0] = 1;
            p
        },
        [0xff; 32],
    ] {
        let mut key = vec![0xed, 1];
        key.extend(bytes);
        assert!(did_key(&format!("did:key:z{}", bs58::encode(key).into_string())).is_err());
    }
    let mut key = vec![0xec, 1];
    key.extend([7; 32]);
    assert!(did_key(&format!("did:key:z{}", bs58::encode(key).into_string())).is_err());
}

#[test]
fn strict_json_bounds_missing_null_and_integer_limits_fail_closed() {
    let f = Fixture::new();
    let raw = serde_json::to_string(&f.signed).unwrap();
    for bad in [
        raw.replace("\"version\":2", "\"version\":2,\"version\":2"),
        raw.replace("\"version\":2", "\"extra\":0,\"version\":2"),
        raw.replace(
            "\"expectedEnrollmentVersion\":7",
            "\"expectedEnrollmentVersion\":9007199254740992",
        ),
        raw.replace("\"enrollmentEpoch\":4", "\"enrollmentEpoch\":-1"),
        raw.replace("\"shareVersion\":42", "\"shareVersion\":1.5"),
    ] {
        assert!(SignedEnrollmentIntent::decode(bad.as_bytes()).is_err());
    }
    let mut value = serde_json::to_value(&f.signed).unwrap();
    value["intent"]
        .as_object_mut()
        .unwrap()
        .remove("sourceBlobIdentity");
    assert!(SignedEnrollmentIntent::decode(&serde_json::to_vec(&value).unwrap()).is_err());
    assert!(SignedEnrollmentIntent::decode(&vec![b' '; MAX_SIGNED_INTENT_BYTES + 1]).is_err());
    let mut boundary = f.signed.intent;
    boundary.expected_enrollment_version = MAX_COUNTER;
    boundary.enrollment_epoch = MAX_COUNTER;
    boundary.share_version = u32::MAX;
    assert!(boundary.canonical_bytes().is_ok());
}
