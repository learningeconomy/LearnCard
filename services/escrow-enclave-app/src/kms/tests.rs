use super::*;
use crate::nsm::FakeNsm;
use der::{Any, Encode};
use std::sync::OnceLock;

fn recipient() -> &'static RecipientKey {
    static KEY: OnceLock<RecipientKey> = OnceLock::new();
    KEY.get_or_init(|| RecipientKey::generate().unwrap())
}

fn context() -> BTreeMap<String, String> {
    BTreeMap::from([
        ("purpose".into(), "escrow-enclave-key".into()),
        ("keyId".into(), "test".into()),
    ])
}

fn attest(nsm: &FakeNsm, public: Vec<u8>) -> Vec<u8> {
    nsm.attest(AttestationRequest {
        public_key: Some(public),
        user_data: vec![],
        nonce: vec![1; 32],
    })
    .unwrap()
}

#[tokio::test]
async fn first_boot_seals_second_boot_with_new_recipient_unseals() {
    let recipient = recipient();
    let mut kms =
        FakeKmsClient::new(recipient.public_key_der().unwrap(), Some(vec![[1; 48]])).unwrap();
    let nsm = FakeNsm::new(123, [[1; 48]; 3]).unwrap();
    let (first, sealed) = unseal_or_generate_escrow_key(&kms, &nsm, recipient, None, "test")
        .await
        .unwrap();
    assert!(sealed.is_some());
    let next_recipient = RecipientKey::generate().unwrap();
    kms.set_recipient(&next_recipient).unwrap();
    let (second, new_blob) =
        unseal_or_generate_escrow_key(&kms, &nsm, &next_recipient, sealed.clone(), "test")
            .await
            .unwrap();
    assert_eq!(first.public_key, second.public_key);
    assert_eq!(first.private_key, second.private_key);
    assert!(new_blob.is_none());
    let mut tampered = sealed.unwrap();
    tampered[15] ^= 1;
    assert!(
        unseal_or_generate_escrow_key(&kms, &nsm, &next_recipient, Some(tampered), "test")
            .await
            .is_err()
    );
}

#[tokio::test]
async fn fake_rejects_context_malformed_attestation_wrong_key_and_pcr() {
    let recipient = recipient();
    let kms = FakeKmsClient::new(recipient.public_key_der().unwrap(), Some(vec![[1; 48]])).unwrap();
    let nsm = FakeNsm::new(123, [[1; 48]; 3]).unwrap();
    let good = attest(&nsm, recipient.public_key_der().unwrap());
    let sealed = kms.encrypt(b"secret", &context()).await.unwrap();
    let mut wrong = context();
    wrong.insert("keyId".into(), "other".into());
    assert!(kms
        .decrypt_for_recipient(&sealed, &wrong, &good)
        .await
        .is_err());
    wrong.insert("purpose".into(), "other".into());
    assert!(kms.encrypt(b"secret", &wrong).await.is_err());
    for document in [
        vec![1, 2, 3],
        attest(&nsm, vec![1, 2, 3]),
        attest(
            &FakeNsm::new(123, [[2; 48]; 3]).unwrap(),
            recipient.public_key_der().unwrap(),
        ),
    ] {
        assert!(kms
            .decrypt_for_recipient(&sealed, &context(), &document)
            .await
            .is_err());
    }
}

fn mutate(cms: &[u8], edit: impl FnOnce(&mut EnvelopedData)) -> Vec<u8> {
    let mut info = ContentInfo::from_der(cms).unwrap();
    let mut envelope: EnvelopedData = info.content.decode_as().unwrap();
    edit(&mut envelope);
    info.content = Any::encode_from(&envelope).unwrap();
    info.to_der().unwrap()
}

#[test]
fn cms_roundtrip_and_fail_closed_algorithms_and_parameters() {
    let recipient = recipient();
    let cms = fake::wrap(
        b"sensitive pkcs8 bytes",
        &recipient.public_key_der().unwrap(),
    )
    .unwrap();
    assert_eq!(
        &*open_ciphertext_for_recipient(&cms, recipient).unwrap(),
        b"sensitive pkcs8 bytes"
    );
    let bad_aes = mutate(&cms, |env| env.encrypted_content.content_enc_alg.oid = DATA);
    let bad_oaep = mutate(&cms, |env| {
        let RecipientInfo::Ktri(mut key) = env.recip_infos.0.iter().next().unwrap().clone() else {
            panic!()
        };
        key.key_enc_alg.oid = ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.1");
        env.recip_infos.0 = der::asn1::SetOfVec::try_from(vec![RecipientInfo::Ktri(key)]).unwrap();
    });
    let missing_params = mutate(&cms, |env| {
        let RecipientInfo::Ktri(mut key) = env.recip_infos.0.iter().next().unwrap().clone() else {
            panic!()
        };
        key.key_enc_alg.parameters = None;
        env.recip_infos.0 = der::asn1::SetOfVec::try_from(vec![RecipientInfo::Ktri(key)]).unwrap();
    });
    let bad_iv = mutate(&cms, |env| {
        env.encrypted_content.content_enc_alg.parameters =
            Some(Any::encode_from(&der::asn1::OctetString::new(vec![0; 15]).unwrap()).unwrap())
    });
    let no_recipient = mutate(&cms, |env| env.recip_infos.0 = der::asn1::SetOfVec::new());
    for bad in [
        bad_aes,
        bad_oaep,
        missing_params,
        bad_iv,
        no_recipient,
        vec![],
        vec![0; 16_385],
    ] {
        assert!(open_ciphertext_for_recipient(&bad, recipient).is_err());
    }
    let mut trailing = cms.clone();
    trailing.push(0);
    assert!(open_ciphertext_for_recipient(&trailing, recipient).is_err());
    assert!(open_ciphertext_for_recipient(&cms[..cms.len() - 1], recipient).is_err());
    for case in 0..5 {
        let bad = mutate(&cms, |env| {
            let RecipientInfo::Ktri(mut key) = env.recip_infos.0.iter().next().unwrap().clone()
            else {
                panic!()
            };
            let mut params: OaepParameters = key
                .key_enc_alg
                .parameters
                .as_ref()
                .unwrap()
                .decode_as()
                .unwrap();
            match case {
                0 => params.hash.oid = ObjectIdentifier::new_unwrap("1.3.14.3.2.26"),
                1 => {
                    params.mask.parameters = Some(
                        Any::encode_from(&AlgorithmIdentifierOwned {
                            oid: ObjectIdentifier::new_unwrap("1.3.14.3.2.26"),
                            parameters: Some(Any::null()),
                        })
                        .unwrap(),
                    )
                }
                2 => params.mask.oid = DATA,
                3 => {
                    params.source = Some(AlgorithmIdentifierOwned {
                        oid: P_SPECIFIED,
                        parameters: Some(
                            Any::encode_from(&der::asn1::OctetString::new(vec![1]).unwrap())
                                .unwrap(),
                        ),
                    })
                }
                _ => {
                    params.hash.parameters = Some(
                        Any::encode_from(&der::asn1::OctetString::new(vec![]).unwrap()).unwrap(),
                    )
                }
            }
            key.key_enc_alg.parameters = Some(Any::encode_from(&params).unwrap());
            env.recip_infos.0 =
                der::asn1::SetOfVec::try_from(vec![RecipientInfo::Ktri(key)]).unwrap();
        });
        assert!(matches!(
            open_ciphertext_for_recipient(&bad, recipient),
            Err(KmsError::Encoding)
        ));
    }
    // Two ciphertext blocks: changing byte 15 of the preceding block flips the
    // last padding byte of block two from 12 to 0, deterministically invalid.
    let bad_padding = mutate(&cms, |env| {
        let mut encrypted = env
            .encrypted_content
            .encrypted_content
            .as_ref()
            .unwrap()
            .as_bytes()
            .to_vec();
        encrypted[15] ^= 12;
        env.encrypted_content.encrypted_content =
            Some(der::asn1::OctetString::new(encrypted).unwrap());
    });
    assert!(matches!(
        open_ciphertext_for_recipient(&bad_padding, recipient),
        Err(KmsError::Crypto)
    ));
    let wrong = RecipientKey::generate().unwrap();
    assert!(matches!(
        open_ciphertext_for_recipient(&cms, &wrong),
        Err(KmsError::Crypto)
    ));
}
