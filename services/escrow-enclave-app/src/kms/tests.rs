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
    let sealed = kms
        .generate_data_key_for_recipient(&context(), &good)
        .await
        .unwrap()
        .ciphertext_blob;
    let mut wrong = context();
    wrong.insert("keyId".into(), "other".into());
    assert!(kms
        .decrypt_for_recipient(&sealed, &wrong, &good)
        .await
        .is_err());
    wrong.insert("purpose".into(), "other".into());
    assert!(kms
        .generate_data_key_for_recipient(&wrong, &good)
        .await
        .is_err());
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

#[test]
fn seed_length_and_key_id_are_bound() {
    for len in [0, 31, 33, 138] {
        assert!(derive_escrow_key(&vec![7; len], "test").is_err());
    }
    let first = derive_escrow_key(&[7; 32], "first").unwrap();
    let second = derive_escrow_key(&[7; 32], "second").unwrap();
    assert_ne!(first.public_key, second.public_key);
}

#[tokio::test]
async fn boot_rejects_wrong_seed_lengths_on_generate_and_decrypt() {
    struct BadSeed(Vec<u8>);
    impl KmsClient for BadSeed {
        fn decrypt_for_recipient<'a>(
            &'a self,
            _: &'a [u8],
            _: &'a BTreeMap<String, String>,
            _: &'a [u8],
        ) -> KmsFuture<'a> {
            Box::pin(async { Ok(self.0.clone()) })
        }
        fn generate_data_key_for_recipient<'a>(
            &'a self,
            _: &'a BTreeMap<String, String>,
            _: &'a [u8],
        ) -> GenerateFuture<'a> {
            Box::pin(async {
                Ok(GeneratedDataKey {
                    ciphertext_for_recipient: self.0.clone(),
                    ciphertext_blob: vec![1],
                })
            })
        }
    }
    let recipient = recipient();
    let nsm = FakeNsm::new(123, [[1; 48]; 3]).unwrap();
    for len in [0, 31, 33, 138] {
        let kms = BadSeed(fake::wrap(&vec![7; len], &recipient.public_key_der().unwrap()).unwrap());
        for sealed in [None, Some(vec![1])] {
            assert!(matches!(
                unseal_or_generate_escrow_key(&kms, &nsm, recipient, sealed, "test").await,
                Err(KmsError::UnexpectedResponse)
            ));
        }
    }
}

#[tokio::test]
async fn host_minted_ciphertext_is_refused_at_boot() {
    let recipient = recipient();
    let kms = FakeKmsClient::new(recipient.public_key_der().unwrap(), None).unwrap();
    let nsm = FakeNsm::new(123, [[1; 48]; 3]).unwrap();
    // A parent-controlled byte string has no attested GenerateDataKey provenance.
    assert!(
        unseal_or_generate_escrow_key(&kms, &nsm, recipient, Some(vec![7; 60]), "test")
            .await
            .is_err()
    );
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

/// Real KMS `CiphertextForRecipient` (BER, indefinite lengths, chunked
/// encryptedContent) from edgebitio/nitro-enclaves-sdk-go crypto/cms/cms_test.go.
const KMS_BER_SAMPLE: &str = "MIAGCSqGSIb3DQEHA6CAMIACAQIxggFrMIIBZwIBAoAgljGgxlmRCtWqvB/s/Aw+ZNTDlc6Uka86SLVmlNmFGAMwPAYJKoZIhvcNAQEHMC+gDzANBglghkgBZQMEAgEFAKEcMBoGCSqGSIb3DQEBCDANBglghkgBZQMEAgEFAASCAQAXmjTiHpg+OcYaf2ISaDNpQcEOq61Sm3re3v+5z2hZPe8eoUGhmMS6pCuC+BRW7RpkjwDaXQzzR/jExnraEET3lj9oyAMMwKIahhHHIZ33qOTq1c/9NtMVZmm/j4UfyCpP8WMAFb2hvwIJbjnAGO9Xbw+NzWaQdvEyNDGUX+bPIuSDc75jjGH5KtdFLopk5k6nsTdU26qLkVE6Mg9Y//s0OJCvmYFgfw15IXDb50xJupWxCwbqGXWmfTBEo9M9AhelVbOXkitZR7hbnT6BZnsfpS2acZRNL4XxC+gg4Ml9fOiYsGWqSK8Lkwlp22rtL70CIHnggbb+oIE4ObR4TV8qMIAGCSqGSIb3DQEHATAdBglghkgBZQMEASoEEEMr/6uiZK+CzgfJvr61JTGggAQwfp0W0Q/QPYmg6AoC3DkE5+beNswVOX9ct5IIgIsvaAhTF9IiHdbX7yLa8YS2WQ/FAAAAAAAAAAAAAA==";

/// Re-encodes DER as KMS-style BER: every constructed element indefinite, and
/// the primitive `encryptedContent` split into a constructed `[0]` of chunks.
fn to_kms_ber(node: &ber::Node, out: &mut Vec<u8>) {
    match node {
        ber::Node::Primitive(0x80, content) if content.len() > 16 => {
            out.extend_from_slice(&[0xa0, 0x80]);
            for chunk in content.chunks(16) {
                ber::encode(&ber::Node::Primitive(0x04, chunk.to_vec()), out);
            }
            out.extend_from_slice(&[0, 0]);
        }
        ber::Node::Primitive(..) => ber::encode(node, out),
        ber::Node::Constructed(tag, children) => {
            out.extend_from_slice(&[*tag, 0x80]);
            for child in children {
                to_kms_ber(child, out);
            }
            out.extend_from_slice(&[0, 0]);
        }
    }
}

#[test]
fn real_kms_ber_sample_parses_to_the_expected_envelope() {
    let sample = STANDARD.decode(KMS_BER_SAMPLE).unwrap();
    assert_eq!(&sample[..4], &[0x30, 0x80, 0x06, 0x09]);
    assert!(ContentInfo::from_der(&sample).is_err());
    let envelope = parse_ciphertext_for_recipient(&sample).unwrap();
    assert_eq!(envelope.encrypted_key.len(), 256);
    assert_eq!(envelope.iv.len(), 16);
    assert_eq!(envelope.ciphertext.len(), 48);
    assert!(matches!(
        open_ciphertext_for_recipient(&sample, recipient()),
        Err(KmsError::Crypto)
    ));
}

#[test]
fn der_input_normalizes_to_itself() {
    let cms = fake::wrap(b"seed", &recipient().public_key_der().unwrap()).unwrap();
    assert_eq!(ber::normalize_kms_cms(&cms).unwrap(), cms);
}

#[test]
fn kms_style_ber_with_chunked_content_roundtrips() {
    let plaintext = [7u8; 32];
    let cms = fake::wrap(&plaintext, &recipient().public_key_der().unwrap()).unwrap();
    let mut indefinite = Vec::new();
    to_kms_ber(&ber::parse(&cms).unwrap(), &mut indefinite);
    assert!(indefinite.windows(4).any(|w| w == [0xa0, 0x80, 0x04, 0x10]));
    assert_eq!(ber::normalize_kms_cms(&indefinite).unwrap(), cms);
    assert_eq!(
        &*open_ciphertext_for_recipient(&indefinite, recipient()).unwrap(),
        &plaintext
    );
    let mut trailing = indefinite.clone();
    trailing.push(0);
    assert!(open_ciphertext_for_recipient(&trailing, recipient()).is_err());
    assert!(
        open_ciphertext_for_recipient(&indefinite[..indefinite.len() - 2], recipient()).is_err()
    );
}

#[test]
fn malformed_ber_is_rejected() {
    let nested = |depth: usize| {
        let mut bytes = Vec::new();
        for _ in 0..depth {
            bytes.extend_from_slice(&[0x30, 0x80]);
        }
        bytes.extend(std::iter::repeat_n(0u8, depth * 2));
        bytes
    };
    assert!(ber::parse(&nested(16)).is_ok());
    let wide: Vec<u8> = [&[0x30u8, 0x80][..], &[0x05, 0x00].repeat(300), &[0, 0]].concat();
    for bad in [
        nested(18),
        wide,
        vec![0x1f, 0x01, 0x00],
        vec![0x04, 0x80, 0x00, 0x00],
        vec![0x30, 0x83, 0x00, 0x00, 0x01],
        vec![0x30, 0x05, 0x05, 0x00],
        vec![0x30, 0x80, 0x05, 0x00],
        vec![0x24, 0x80, 0x02, 0x01, 0x00, 0x00, 0x00],
        vec![0x30, 0x03, 0x05, 0x00, 0x00, 0x00],
        vec![0x00, 0x00],
    ] {
        assert!(ber::parse(&bad).is_err(), "{bad:02x?}");
    }
    assert_eq!(
        ber::parse(&[0x24, 0x80, 0x04, 0x01, 0xaa, 0x04, 0x01, 0xbb, 0x00, 0x00]).unwrap(),
        ber::Node::Primitive(0x04, vec![0xaa, 0xbb])
    );
}
