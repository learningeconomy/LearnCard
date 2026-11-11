use super::*;
use crate::{
    kms::{KmsError, KmsFuture},
    nsm::{parse_attestation_document, FakeNsm},
};
use std::sync::Mutex;

fn authority() -> AuthorityConfig {
    AuthorityConfig {
        region: "us-east-1".into(),
        account: "123456789012".into(),
        table: "authority".into(),
        writer: "writer".into(),
        tenant: "learncard".into(),
        environment: "staging".into(),
        generation: "g1".into(),
    }
}
fn email() -> EmailConfig {
    EmailConfig {
        region: "us-east-1".into(),
        account: "123456789012".into(),
        sender: "sender".into(),
        from: "recovery@staging.notify.learncard.com".into(),
        identity: "staging.notify.learncard.com".into(),
        configuration_set: "recovery".into(),
    }
}
fn payload(principal: &str) -> Vec<u8> {
    serde_json::to_vec(&serde_json::json!({"accessKeyId":"AKIA0000000000000000", "secretAccessKey":"a".repeat(40), "principalArn":principal})).unwrap()
}
struct FakeCredentialKms {
    context: BTreeMap<String, String>,
    plaintext: Vec<u8>,
    requests: Mutex<Vec<Vec<u8>>>,
}
impl KmsClient for FakeCredentialKms {
    fn generate_data_key_for_recipient<'a>(
        &'a self,
        _: &'a BTreeMap<String, String>,
        _: &'a [u8],
    ) -> crate::kms::GenerateFuture<'a> {
        Box::pin(async { panic!("credential unsealing must never generate a key") })
    }
    fn decrypt_for_recipient<'a>(
        &'a self,
        ciphertext: &'a [u8],
        context: &'a BTreeMap<String, String>,
        attestation: &'a [u8],
    ) -> KmsFuture<'a> {
        Box::pin(async move {
            if ciphertext != b"opaque-test-ciphertext" || context != &self.context {
                return Err(KmsError::Crypto);
            }
            let claims =
                parse_attestation_document(attestation).map_err(|_| KmsError::Attestation)?;
            assert_eq!(
                claims.user_data.as_ref().map(|v| v.as_slice()),
                Some(Sha256::digest(serde_json::to_vec(context).unwrap()).as_slice())
            );
            let nonce = claims.nonce.unwrap();
            assert_eq!(nonce.len(), 32);
            self.requests.lock().unwrap().push(nonce.to_vec());
            crate::kms::wrap_test_payload(&self.plaintext, claims.public_key.as_ref().unwrap())
        })
    }
}

#[tokio::test]
async fn recipient_unsealing_binds_every_context_dimension_and_uses_fresh_nonces() {
    let authority = authority();
    let email = email();
    let nsm = FakeNsm::new(1_700_000_000, [[1; 48]; 3]).unwrap();
    let recipient = RecipientKey::generate().unwrap();
    for purpose in [
        CredentialPurpose::AuthorityWriter,
        CredentialPurpose::EmailSender,
    ] {
        let context = credential_context(&authority, Some(&email), purpose).unwrap();
        let kms = FakeCredentialKms {
            plaintext: payload(&context["principalArn"]),
            context: context.clone(),
            requests: Mutex::new(Vec::new()),
        };
        for _ in 0..2 {
            let credentials = unseal_with(
                &kms,
                &nsm,
                &recipient,
                b"opaque-test-ciphertext",
                &context,
                purpose,
            )
            .await
            .unwrap();
            match purpose {
                CredentialPurpose::AuthorityWriter => {
                    super::super::aws::DynamoAuthorityClient::new(
                        authority.clone(),
                        credentials,
                        Arc::new(crate::time::FakeTimeSource::interval(1, 1)),
                    )
                    .unwrap();
                }
                CredentialPurpose::EmailSender => {
                    super::super::aws::SesEmailClient::new(
                        email.clone(),
                        credentials,
                        Arc::new(crate::time::FakeTimeSource::interval(1, 1)),
                    )
                    .unwrap();
                }
            }
        }
        {
            let nonces = kms.requests.lock().unwrap();
            assert_ne!(nonces[0], nonces[1]);
        }
        for key in [
            "purpose",
            "tenant",
            "environment",
            "authorityGeneration",
            "principalArn",
        ] {
            let mut wrong = context.clone();
            wrong.insert(key.into(), "wrong".into());
            assert!(unseal_with(
                &kms,
                &nsm,
                &recipient,
                b"opaque-test-ciphertext",
                &wrong,
                purpose
            )
            .await
            .is_err());
        }
        assert!(unseal_with(
            &kms,
            &nsm,
            &recipient,
            b"wrong-ciphertext",
            &context,
            purpose
        )
        .await
        .is_err());
    }
}

#[tokio::test]
async fn malformed_plaintext_and_wrong_principal_never_become_credentials() {
    let authority = authority();
    let context = credential_context(&authority, None, CredentialPurpose::AuthorityWriter).unwrap();
    let nsm = FakeNsm::new(1_700_000_000, [[1; 48]; 3]).unwrap();
    let recipient = RecipientKey::generate().unwrap();
    let mut session =
        serde_json::from_slice::<serde_json::Value>(&payload(&authority.writer_arn())).unwrap();
    session["sessionToken"] = serde_json::json!("host-session-not-allowed");
    for plaintext in [
        Vec::new(),
        b"not-json".to_vec(),
        vec![b' '; 4097],
        payload("arn:aws:iam::123456789012:user/other"),
        serde_json::to_vec(&session).unwrap(),
    ] {
        let kms = FakeCredentialKms {
            context: context.clone(),
            plaintext,
            requests: Mutex::new(Vec::new()),
        };
        assert!(unseal_with(
            &kms,
            &nsm,
            &recipient,
            b"opaque-test-ciphertext",
            &context,
            CredentialPurpose::AuthorityWriter
        )
        .await
        .is_err());
    }
    assert!(credential_context(&authority, None, CredentialPurpose::EmailSender).is_err());
}

#[test]
fn credential_cmk_must_be_distinct_and_in_measured_account_region_and_tenant() {
    let authority = authority();
    let key = "arn:aws:kms:us-east-1:123456789012:key/00000000-1111-2222-3333-444444444444";
    assert!(validate_key(&authority, key, "other-cmk", "us-east-1", "learncard").is_ok());
    assert!(validate_key(&authority, key, key, "us-east-1", "learncard").is_err());
    assert!(validate_key(&authority, key, "other", "us-west-2", "learncard").is_err());
    assert!(validate_key(&authority, key, "other", "us-east-1", "other").is_err());
    assert!(validate_key(
        &authority,
        &key.replace("123456789012", "999999999999"),
        "other",
        "us-east-1",
        "learncard"
    )
    .is_err());
    assert!(check_ciphertext(&[]).is_err());
    assert!(check_ciphertext(&vec![0; 6145]).is_err());
    assert!(check_ciphertext(&vec![0; 6144]).is_ok());
}

#[test]
fn plaintext_parser_rejects_escapes_duplicates_and_trailing_data_before_ownership() {
    let arn = authority().writer_arn();
    let purpose = CredentialPurpose::AuthorityWriter;
    let valid = payload(&arn);
    let mut at_limit = valid.clone();
    at_limit.resize(4096, b' ');
    assert!(parse_credentials(&at_limit, &arn, purpose).is_ok());
    at_limit.push(b' ');
    assert!(parse_credentials(&at_limit, &arn, purpose).is_err());
    let text = String::from_utf8(valid).unwrap();
    let escaped = text.replace(&"a".repeat(40), &"\\u0061".repeat(40));
    assert!(escaped.as_bytes().contains(&b'\\'));
    assert!(parse_credentials(escaped.as_bytes(), &arn, purpose).is_err());
    let duplicate = text.replacen('{', "{\"accessKeyId\":\"AKIA0000000000000000\",", 1);
    assert!(parse_credentials(duplicate.as_bytes(), &arn, purpose).is_err());
    assert!(parse_credentials(format!("{text}{{}}").as_bytes(), &arn, purpose).is_err());
}
