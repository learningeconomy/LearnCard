//! Explicit parent-provided temporary credentials; never consult enclave IMDS.
use super::*;
use aws_sdk_kms::{
    config::{BehaviorVersion, Region},
    primitives::Blob,
    types::{KeyEncryptionMechanism, RecipientInfo},
};
use zeroize::{Zeroize, ZeroizeOnDrop};

/// Parent wire integration supplies a fresh set for each boot/request (P1.8/P3.3).
/// Deliberately not Debug, Clone, or automatically deserializable/loggable.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct Credentials {
    pub access_key_id: String,
    pub secret_access_key: String,
    pub session_token: String,
}

pub struct AwsKmsClient {
    client: aws_sdk_kms::Client,
    key_id: String,
}

impl AwsKmsClient {
    /// `key_id` is the KMS CMK ARN, not the logical escrow keyId encryption context.
    /// Map kms.<region>.amazonaws.com to 127.0.0.1 in the enclave's /etc/hosts;
    /// TLS still validates the real AWS hostname through the byte-only forwarder.
    pub fn new(credentials: Credentials, region: &str, key_id: String) -> Result<Self, KmsError> {
        if region.is_empty()
            || !region
                .bytes()
                .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
            || key_id.is_empty()
            || credentials.access_key_id.is_empty()
            || credentials.secret_access_key.is_empty()
            || credentials.session_token.is_empty()
        {
            return Err(KmsError::Configuration);
        }
        let endpoint = kms_endpoint(region, std::env::var("ESCROW_KMS_ENDPOINT").ok().as_deref())?;
        let provider = aws_sdk_kms::config::Credentials::new(
            credentials.access_key_id.clone(),
            credentials.secret_access_key.clone(),
            Some(credentials.session_token.clone()),
            None,
            "enclave-parent-sts",
        );
        let config = aws_sdk_kms::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .region(Region::new(region.to_owned()))
            .credentials_provider(provider)
            .endpoint_url(endpoint)
            .build();
        Ok(Self {
            client: aws_sdk_kms::Client::from_conf(config),
            key_id,
        })
    }
}

fn kms_endpoint(region: &str, endpoint: Option<&str>) -> Result<String, KmsError> {
    let forwarded = format!("https://kms.{region}.amazonaws.com:8000");
    let endpoint = endpoint.unwrap_or(&forwarded);
    // DNS (/etc/hosts) changes only the TCP destination, never the TLS identity.
    // An arbitrary endpoint would receive first-boot plaintext; require AWS SNI.
    if ![
        forwarded.as_str(),
        &format!("https://kms.{region}.amazonaws.com"),
        &format!("https://kms.{region}.amazonaws.com:443"),
    ]
    .contains(&endpoint)
    {
        return Err(KmsError::Configuration);
    }
    Ok(endpoint.to_owned())
}

fn recipient_output(
    mut output: aws_sdk_kms::operation::decrypt::DecryptOutput,
) -> Result<Vec<u8>, KmsError> {
    if let Some(plaintext) = output.plaintext.take() {
        // SDK HTTP/parser copies cannot be wiped here; our owned copy is wiped.
        let _wipe = Zeroizing::new(plaintext.into_inner());
        return Err(KmsError::UnexpectedResponse);
    }
    output
        .ciphertext_for_recipient
        .filter(|b| !b.as_ref().is_empty())
        .map(Blob::into_inner)
        .ok_or(KmsError::UnexpectedResponse)
}

impl KmsClient for AwsKmsClient {
    fn decrypt_for_recipient<'a>(
        &'a self,
        ciphertext: &'a [u8],
        context: &'a BTreeMap<String, String>,
        document: &'a [u8],
    ) -> KmsFuture<'a> {
        Box::pin(async move {
            let output = self
                .client
                .decrypt()
                .key_id(&self.key_id)
                .ciphertext_blob(Blob::new(ciphertext))
                .set_encryption_context(Some(context.clone().into_iter().collect()))
                .recipient(
                    RecipientInfo::builder()
                        .attestation_document(Blob::new(document))
                        .key_encryption_algorithm(KeyEncryptionMechanism::RsaesOaepSha256)
                        .build(),
                )
                .send()
                .await
                .map_err(|_| KmsError::Unavailable)?;
            recipient_output(output)
        })
    }

    fn encrypt<'a>(
        &'a self,
        plaintext: &'a [u8],
        context: &'a BTreeMap<String, String>,
    ) -> KmsFuture<'a> {
        Box::pin(async move {
            // AWS SDK owns request/HTTP buffers and does not promise zeroization.
            // Our caller retains plaintext in Zeroizing, but SDK copies are a limitation.
            let output = self
                .client
                .encrypt()
                .key_id(&self.key_id)
                .plaintext(Blob::new(plaintext))
                .set_encryption_context(Some(context.clone().into_iter().collect()))
                .send()
                .await
                .map_err(|_| KmsError::Unavailable)?;
            output
                .ciphertext_blob
                .filter(|b| !b.as_ref().is_empty())
                .map(Blob::into_inner)
                .ok_or(KmsError::UnexpectedResponse)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aws_sdk_kms::operation::decrypt::DecryptOutput;

    #[test]
    fn endpoint_preserves_regional_tls_identity() {
        assert_eq!(
            kms_endpoint("us-east-1", None).unwrap(),
            "https://kms.us-east-1.amazonaws.com:8000"
        );
        for port in ["", ":443", ":8000"] {
            let endpoint = format!("https://kms.us-east-1.amazonaws.com{port}");
            assert_eq!(
                kms_endpoint("us-east-1", Some(&endpoint)).unwrap(),
                endpoint
            );
        }
        for endpoint in [
            "https://127.0.0.1:8000",
            "https://localhost:8000",
            "http://kms.us-east-1.amazonaws.com:8000",
            "https://kms.us-west-2.amazonaws.com:8000",
            "https://kms.us-east-1.amazonaws.com.attacker.test:8000",
            "https://kms.us-east-1.amazonaws.com@127.0.0.1:8000",
            "https://kms.us-east-1.amazonaws.com:8001",
        ] {
            assert!(matches!(
                kms_endpoint("us-east-1", Some(endpoint)),
                Err(KmsError::Configuration)
            ));
        }
    }

    #[test]
    fn plaintext_response_is_never_accepted() {
        for plaintext in [vec![], vec![1, 2, 3]] {
            let output = DecryptOutput::builder()
                .plaintext(Blob::new(plaintext))
                .ciphertext_for_recipient(Blob::new(vec![4]))
                .build();
            assert!(matches!(
                recipient_output(output),
                Err(KmsError::UnexpectedResponse)
            ));
        }
        assert!(recipient_output(DecryptOutput::builder().build()).is_err());
        assert!(recipient_output(
            DecryptOutput::builder()
                .ciphertext_for_recipient(Blob::new(vec![]))
                .build()
        )
        .is_err());
        assert_eq!(
            recipient_output(
                DecryptOutput::builder()
                    .ciphertext_for_recipient(Blob::new(vec![4]))
                    .build()
            )
            .unwrap(),
            vec![4]
        );
    }
}
