use super::*;
use base64::{engine::general_purpose::STANDARD, Engine};
use der::{Decode, Encode};
use p384::ecdsa::{signature::Verifier, Signature, VerifyingKey};
use sha2::{Digest, Sha256};
use x509_cert::Certificate;

const TIMESTAMP: u64 = 1_790_294_400_000;
const PCRS: [[u8; 48]; 3] = [[1; 48], [2; 48], [3; 48]];

fn request() -> AttestationRequest {
    AttestationRequest {
        user_data: vec![7; 91],
        nonce: vec![9; 32],
        public_key: None,
    }
}

fn verify(bytes: &[u8]) {
    let doc = parse_attestation_document(bytes).unwrap();
    let Value::Array(parts) = decode::<Value>(bytes).unwrap() else {
        panic!("untagged array required")
    };
    assert_eq!(parts.len(), 4);
    assert_eq!(
        decode::<Value>(parts[0].as_bytes().unwrap()).unwrap(),
        Value::Map(vec![(1.into(), (-35).into())])
    );
    assert_eq!(parts[1], Value::Map(vec![]));
    let cert = Certificate::from_der(&doc.certificate).unwrap();
    let key = VerifyingKey::from_sec1_bytes(
        cert.tbs_certificate
            .subject_public_key_info
            .subject_public_key
            .as_bytes()
            .unwrap(),
    )
    .unwrap();
    key.verify(
        &fake::sig_structure(parts[0].as_bytes().unwrap(), parts[2].as_bytes().unwrap()).unwrap(),
        &Signature::from_slice(parts[3].as_bytes().unwrap()).unwrap(),
    )
    .unwrap();
    // Also verify root self-signature and every issuer link, not just COSE.
    let mut chain: Vec<_> = doc
        .cabundle
        .iter()
        .map(|b| Certificate::from_der(b).unwrap())
        .collect();
    chain.push(cert);
    for (index, cert) in chain.iter().enumerate() {
        let issuer = &chain[index.saturating_sub(1)];
        assert_eq!(cert.tbs_certificate.issuer, issuer.tbs_certificate.subject);
        let key = VerifyingKey::from_sec1_bytes(
            issuer
                .tbs_certificate
                .subject_public_key_info
                .subject_public_key
                .as_bytes()
                .unwrap(),
        )
        .unwrap();
        key.verify(
            &cert.tbs_certificate.to_der().unwrap(),
            &Signature::from_der(cert.signature.as_bytes().unwrap()).unwrap(),
        )
        .unwrap();
    }
}

#[test]
fn fake_roundtrip_structure_signature_chain_and_determinism() {
    let fake = FakeNsm::new(TIMESTAMP, PCRS).unwrap();
    let bytes = fake.attest(request()).unwrap();
    verify(&bytes);
    let parsed = parse_attestation_document(&bytes).unwrap();
    assert_eq!(parsed, fake.document(request()));
    assert_eq!(parsed.pcrs.len(), 16);
    for i in 0..16 {
        assert_eq!(
            parsed.pcrs[&i].as_ref(),
            PCRS.get(i as usize).unwrap_or(&[0; 48])
        );
    }
    assert_eq!(
        bytes,
        FakeNsm::new(TIMESTAMP, PCRS)
            .unwrap()
            .attest(request())
            .unwrap()
    );
    let mut req = request();
    req.public_key = Some(vec![4; 300]);
    assert_eq!(
        parse_attestation_document(&fake.attest(req).unwrap())
            .unwrap()
            .public_key
            .unwrap()
            .len(),
        300
    );
}

#[test]
fn caps_and_malformed_documents() {
    let fake = FakeNsm::new(TIMESTAMP, PCRS).unwrap();
    let boundary = AttestationRequest {
        user_data: vec![0; 1024],
        nonce: vec![0; 512],
        public_key: Some(vec![0; 1024]),
    };
    assert!(fake.attest(boundary.clone()).is_ok());
    for field in ["user_data", "nonce", "public_key"] {
        let mut req = boundary.clone();
        match field {
            "user_data" => req.user_data.push(0),
            "nonce" => req.nonce.push(0),
            _ => req.public_key.as_mut().unwrap().push(0),
        }
        assert!(matches!(fake.attest(req), Err(NsmError::InputTooLarge(f)) if f == field));
    }
    let bytes = fake.attest(request()).unwrap();
    assert!(parse_attestation_document(&bytes[..bytes.len() - 1]).is_err());
    assert!(parse_attestation_document(&[bytes.clone(), vec![0]].concat()).is_err());
    assert!(parse_attestation_document(&vec![0; 0x3001]).is_err());
    let value: Value = decode(&bytes).unwrap();
    assert!(
        parse_attestation_document(&encode(&Value::Tag(18, Box::new(value.clone()))).unwrap())
            .is_ok()
    );
    let Value::Array(parts) = value else { panic!() };
    for (index, bad) in [
        (0, Value::Bytes(vec![0xa1, 1, 0x26])),
        (1, Value::Map(vec![(1.into(), 1.into())])),
        (3, Value::Bytes(vec![0; 95])),
    ] {
        let mut changed = parts.clone();
        changed[index] = bad;
        assert!(parse_attestation_document(&encode(&Value::Array(changed)).unwrap()).is_err());
    }
}

#[test]
fn client_fixtures() {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/sss-key-manager/src/__fixtures__/nitro-attestation");
    let fake = FakeNsm::new(TIMESTAMP, PCRS).unwrap();
    if std::env::var("ESCROW_WRITE_NITRO_FIXTURES").as_deref() == Ok("1") {
        std::fs::create_dir_all(&path).unwrap();
        // Generate once through the real crypto API, then reuse the PUBLIC SPKI
        // from the manifest so regeneration stays byte-for-byte stable. No private key persisted.
        let spki = if path.join("manifest.json").exists() {
            let old: serde_json::Value =
                serde_json::from_slice(&std::fs::read(path.join("manifest.json")).unwrap())
                    .unwrap();
            old["userDataBase64"].as_str().unwrap().to_owned()
        } else {
            crate::crypto::generate_escrow_key_pair()
                .unwrap()
                .public_key
                .clone()
        };
        let req = AttestationRequest {
            user_data: STANDARD.decode(&spki).unwrap(),
            ..request()
        };
        let valid = fake.attest(req.clone()).unwrap();
        let mut bad_signature = valid.clone();
        *bad_signature.last_mut().unwrap() ^= 1;
        let mut wrong_pcr = fake.document(req.clone());
        wrong_pcr.pcrs.insert(0, vec![8; 48].into());
        let mut stale = fake.document(req.clone());
        stale.timestamp -= 600_000;
        let mut truncated = fake.document(req.clone());
        truncated.cabundle.pop();
        let variants = [
            ("valid", valid.clone()),
            ("bad-signature", bad_signature),
            ("wrong-pcr0", fake.sign_document(&wrong_pcr).unwrap()),
            ("nonce-mismatch", valid),
            ("stale-timestamp", fake.sign_document(&stale).unwrap()),
            (
                "wrong-root",
                FakeNsm::from_seed([43; 32], TIMESTAMP, PCRS)
                    .unwrap()
                    .attest(req.clone())
                    .unwrap(),
            ),
            ("truncated-chain", fake.sign_document(&truncated).unwrap()),
            (
                "debug-zero-pcrs",
                FakeNsm::new(TIMESTAMP, [[0; 48]; 3])
                    .unwrap()
                    .attest(req)
                    .unwrap(),
            ),
        ];
        for (name, bytes) in variants {
            std::fs::write(
                path.join(format!("{name}.cbor.b64")),
                STANDARD.encode(bytes) + "\n",
            )
            .unwrap();
        }
        std::fs::write(path.join("root.pem"), fake.root_pem().unwrap()).unwrap();
        let manifest = serde_json::json!({
            "testOnly": true, "description": "Public fake CA, never trust in production. Freeze verifier clock to nowMs. Certificates valid 2020-2050. userDataBase64 was generated once by crypto::generate_escrow_key_pair; regeneration reuses it.",
            "timestamp": TIMESTAMP, "nowMs": TIMESTAMP + 1000, "maxAgeMs": 300_000,
            "nonceHex": hex::encode(request().nonce), "pcrs": {"0": hex::encode(PCRS[0]), "1": hex::encode(PCRS[1]), "2": hex::encode(PCRS[2])},
            "userDataBase64": spki, "publicKeyBase64": null,
            "rootSha256": hex::encode(Sha256::digest(&fake.document(request()).cabundle[0])),
            "cases": {
                "valid": {"accept": true}, "bad-signature": {"accept": false, "reason": "signature"},
                "wrong-pcr0": {"accept": false, "reason": "pcr"},
                "nonce-mismatch": {"accept": false, "reason": "nonce", "nonceHex": hex::encode([10; 32])},
                "stale-timestamp": {"accept": false, "reason": "freshness"},
                "wrong-root": {"accept": false, "reason": "root pin"},
                "truncated-chain": {"accept": false, "reason": "missing intermediate"},
                "debug-zero-pcrs": {"accept": false, "reason": "debug PCRs"}
            }
        });
        std::fs::write(
            path.join("manifest.json"),
            serde_json::to_string_pretty(&manifest).unwrap() + "\n",
        )
        .unwrap();
    }
    let manifest: serde_json::Value =
        serde_json::from_slice(&std::fs::read(path.join("manifest.json")).unwrap()).unwrap();
    let bytes = STANDARD
        .decode(
            std::fs::read_to_string(path.join("valid.cbor.b64"))
                .unwrap()
                .trim(),
        )
        .unwrap();
    verify(&bytes);
    let doc = parse_attestation_document(&bytes).unwrap();
    assert_eq!(doc.timestamp, TIMESTAMP);
    assert_eq!(
        STANDARD.encode(doc.user_data.as_ref().unwrap()),
        manifest["userDataBase64"]
    );
    use p256::pkcs8::DecodePublicKey;
    p256::PublicKey::from_public_key_der(doc.user_data.as_ref().unwrap()).unwrap();
    assert_eq!(
        hex::encode(Sha256::digest(&doc.cabundle[0])),
        manifest["rootSha256"]
    );
    assert_eq!(
        std::fs::read_to_string(path.join("root.pem")).unwrap(),
        fake.root_pem().unwrap()
    );
    assert_eq!(
        bytes,
        fake.attest(AttestationRequest {
            user_data: doc.user_data.unwrap().into_vec(),
            ..request()
        })
        .unwrap()
    );
    for name in manifest["cases"].as_object().unwrap().keys() {
        let bytes = STANDARD
            .decode(
                std::fs::read_to_string(path.join(format!("{name}.cbor.b64")))
                    .unwrap()
                    .trim(),
            )
            .unwrap();
        assert_eq!(parse_attestation_document(&bytes).unwrap().pcrs.len(), 16);
    }
}
