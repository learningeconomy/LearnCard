use super::*;
use crate::{
    authority::intent::EnrollmentIntent,
    crypto::escrow_blob_identity,
    nsm::{AttestationRequest, FakeNsm, NsmDriver},
    wire::EscrowEnvelope,
};
use p256::ecdsa::{signature::hazmat::PrehashSigner, SigningKey};
use serde_json::{json, Value};

fn sign(
    kind: RecordKind,
    payload: Value,
    key: &SigningKey,
    measurement: Hash,
) -> SignedAuthorityRecord {
    let mut record = SignedAuthorityRecord {
        version: 1,
        kind,
        key_id: "test-key.1".into(),
        measurement,
        payload: STANDARD.encode(serde_json::to_vec(&payload).unwrap()),
        signature: String::new(),
    };
    let signature: Signature = key.sign_prehash(&record.signing_hash().unwrap()).unwrap();
    record.signature = STANDARD.encode(signature.normalize_s().to_bytes());
    record
}

/// Explicit opt-in generation uses public test keys only; normal tests read the
/// committed bytes shared with the SDK and never modify fixtures or contact AWS.
#[test]
fn client_authority_golden_fixture() {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/sss-key-manager/src/__fixtures__/escrow-authority-v1.json");
    if std::env::var("ESCROW_WRITE_AUTHORITY_FIXTURE").as_deref() == Ok("1") {
        let manifest: Value = serde_json::from_str(include_str!("../../../../../packages/sss-key-manager/src/__fixtures__/nitro-attestation/manifest.json")).unwrap();
        let golden: Value = serde_json::from_str(include_str!("../../../../../packages/sss-key-manager/src/__fixtures__/escrow-enrollment-intent-v1.json")).unwrap();
        let envelopes: Value = serde_json::from_str(include_str!(
            "../../../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
        ))
        .unwrap();
        let intent: EnrollmentIntent = serde_json::from_value(golden["intent"].clone()).unwrap();
        let target: EscrowEnvelope =
            serde_json::from_value(envelopes["blobs"][1]["envelope"].clone()).unwrap();
        let key = SigningKey::from_slice(&[42; 32]).unwrap();
        let public = key.verifying_key().to_sec1_point(false).as_bytes().to_vec();
        let measurement: Hash = Sha256::digest([[1; 48], [2; 48], [3; 48]].concat()).into();
        let state = json!({"tenant":"learncard","authorityGeneration":"staging-g2","did":intent.did,"enrollmentVersion":7,"enrollmentEpoch":3,"status":"active","envelope":envelopes["blobs"][0]["envelope"],"shareVersion":1,"hasPin":true,"pinGeneration":2,"attemptsUsed":8});
        let proof = sign(
            RecordKind::Snapshot,
            json!([manifest["nonceHex"], state]),
            &key,
            measurement,
        );
        let receipt = sign(
            RecordKind::Commit,
            json!({
                "commit":{"schemaVersion":1,"binding":{"tenant":intent.tenant,"generation":intent.authority_generation,"didHash":Sha256::digest(intent.did.as_bytes()).to_vec()},"executionId":vec![1;16],"revisions":{"operation":12,"enrollment":8},"transactionDigest":vec![2;32]},
                "eventHash":vec![3;32],"requestDigest":Sha256::digest(intent.canonical_bytes().unwrap()).to_vec(),"resultBlobIdentity":escrow_blob_identity(&target).unwrap(),"enrollmentEpoch":4,
            }),
            &key,
            measurement,
        );
        let nsm = FakeNsm::new(
            manifest["timestamp"].as_u64().unwrap(),
            [[1; 48], [2; 48], [3; 48]],
        )
        .unwrap();
        let user_data = ciborium::value::Value::Map(vec![
            (
                0.into(),
                ciborium::value::Value::Bytes(
                    STANDARD
                        .decode(manifest["userDataBase64"].as_str().unwrap())
                        .unwrap(),
                ),
            ),
            (1.into(), "test-key.1".into()),
            (
                2.into(),
                ciborium::value::Value::Array(vec!["test-key.0".into()]),
            ),
        ]);
        let mut encoded = Vec::new();
        ciborium::ser::into_writer(&user_data, &mut encoded).unwrap();
        let document = nsm
            .attest(AttestationRequest {
                user_data: encoded,
                nonce: hex::decode(manifest["nonceHex"].as_str().unwrap()).unwrap(),
                public_key: Some(public.clone()),
            })
            .unwrap();
        let result = json!({"testOnly":true,"description":"Public fixture key 2a repeated 32 times; NEVER use this key or fake CA in production. Opaque envelope fixtures exercise signature bindings, not decrypted plaintext authorization.",
            "nonce":manifest["nonceHex"],"nowMs":manifest["nowMs"],"rootSha256":manifest["rootSha256"],"pcrs":manifest["pcrs"],"ledgerPublicKey":STANDARD.encode(public),"measurement":hex::encode(measurement),
            "attestation":{"mode":"nitro","keyId":"test-key.1","previousKeyIds":["test-key.0"],"publicKey":manifest["userDataBase64"],"measurements":{},"document":STANDARD.encode(document),"issuedAt":"2026-09-25T00:00:00Z"},
            "snapshot":{"state":state,"proof":proof},"intent":golden["intent"],"committed":{"envelope":target,"receipt":receipt}
        });
        std::fs::write(&path, serde_json::to_string_pretty(&result).unwrap() + "\n").unwrap();
        return;
    }
    let fixture: Value = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
    let key = SigningKey::from_slice(&[42; 32]).unwrap();
    for record in [
        &fixture["snapshot"]["proof"],
        &fixture["committed"]["receipt"],
    ] {
        let record: SignedAuthorityRecord = serde_json::from_value(record.clone()).unwrap();
        record.verify(key.verifying_key()).unwrap();
    }
    let intent: EnrollmentIntent = serde_json::from_value(fixture["intent"].clone()).unwrap();
    let receipt: SignedAuthorityRecord =
        serde_json::from_value(fixture["committed"]["receipt"].clone()).unwrap();
    let payload: Value =
        serde_json::from_slice(&STANDARD.decode(&receipt.payload).unwrap()).unwrap();
    assert_eq!(
        payload["requestDigest"],
        json!(Sha256::digest(intent.canonical_bytes().unwrap()).to_vec())
    );
}
