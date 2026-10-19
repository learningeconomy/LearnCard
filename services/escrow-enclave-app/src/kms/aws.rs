//! Explicit parent-provided temporary credentials; never consult enclave IMDS.
use super::*;
use crate::{aws_transport::RequestTime, time::TimeSource};
use aws_sdk_kms::{
    config::{BehaviorVersion, Region},
    primitives::Blob,
    types::{DataKeySpec, KeyEncryptionMechanism, RecipientInfo},
};
use std::sync::Arc;
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
    credentials: Credentials,
    region: String,
    endpoint: String,
    time: Arc<dyn TimeSource>,
    key_id: String,
}

impl AwsKmsClient {
    /// `key_id` is the KMS CMK ARN, not the logical escrow keyId encryption context.
    /// Map kms.<region>.amazonaws.com to 127.0.0.1 in the enclave's /etc/hosts;
    /// TLS still validates the real AWS hostname through the byte-only forwarder.
    pub fn new(
        credentials: Credentials,
        region: &str,
        key_id: String,
        time: Arc<dyn TimeSource>,
    ) -> Result<Self, KmsError> {
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
        Ok(Self {
            credentials,
            region: region.to_owned(),
            endpoint,
            time,
            key_id,
        })
    }

    /// A fresh sample and TLS connection per operation. No connection, signing
    /// skew correction, or session ticket can survive into the next operation.
    async fn client(&self) -> Result<aws_sdk_kms::Client, KmsError> {
        let time = RequestTime::acquire(self.time.as_ref()).await?;
        Ok(aws_sdk_kms::Client::from_conf(self.config(time)?))
    }

    fn config(&self, time: RequestTime) -> Result<aws_sdk_kms::Config, KmsError> {
        let provider = aws_sdk_kms::config::Credentials::new(
            self.credentials.access_key_id.clone(),
            self.credentials.secret_access_key.clone(),
            Some(self.credentials.session_token.clone()),
            None,
            "enclave-parent-sts",
        );
        Ok(aws_sdk_kms::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .region(Region::new(self.region.clone()))
            .credentials_provider(provider)
            .endpoint_url(&self.endpoint)
            .http_client(time.http_client(&self.endpoint)?)
            .time_source(time)
            .retry_config(aws_smithy_types::retry::RetryConfig::disabled())
            .build())
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
                .client()
                .await?
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

    fn generate_data_key_for_recipient<'a>(
        &'a self,
        context: &'a BTreeMap<String, String>,
        document: &'a [u8],
    ) -> GenerateFuture<'a> {
        Box::pin(async move {
            let output = self
                .client()
                .await?
                .generate_data_key()
                .key_id(&self.key_id)
                .key_spec(DataKeySpec::Aes256)
                .recipient(
                    RecipientInfo::builder()
                        .attestation_document(Blob::new(document))
                        .key_encryption_algorithm(KeyEncryptionMechanism::RsaesOaepSha256)
                        .build(),
                )
                .set_encryption_context(Some(context.clone().into_iter().collect()))
                .send()
                .await
                .map_err(|_| KmsError::Unavailable)?;
            generated_output(output)
        })
    }
}

fn generated_output(
    mut output: aws_sdk_kms::operation::generate_data_key::GenerateDataKeyOutput,
) -> Result<GeneratedDataKey, KmsError> {
    if let Some(plaintext) = output.plaintext.take() {
        let _wipe = Zeroizing::new(plaintext.into_inner());
        return Err(KmsError::UnexpectedResponse);
    }
    let ciphertext_blob = output
        .ciphertext_blob
        .filter(|b| !b.as_ref().is_empty())
        .ok_or(KmsError::UnexpectedResponse)?;
    let ciphertext_for_recipient = output
        .ciphertext_for_recipient
        .filter(|b| !b.as_ref().is_empty())
        .ok_or(KmsError::UnexpectedResponse)?;
    Ok(GeneratedDataKey {
        ciphertext_blob: ciphertext_blob.into_inner(),
        ciphertext_for_recipient: ciphertext_for_recipient.into_inner(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::time::{TimeError, TimeEvidence, TimeFuture, TrustedInterval};
    use aws_sdk_kms::operation::decrypt::DecryptOutput;

    struct Clock(bool);
    impl TimeSource for Clock {
        fn now(&self, _: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
            Box::pin(async {
                if !self.0 {
                    return Err(TimeError::Unavailable);
                }
                Ok(TimeEvidence {
                    interval: TrustedInterval {
                        lo_ms: 1_577_836_800_000,
                        hi_ms: 1_577_836_800_000,
                    },
                    sources: vec![],
                })
            })
        }
    }

    fn client(available: bool) -> AwsKmsClient {
        AwsKmsClient::new(
            Credentials {
                access_key_id: "TEST-ONLY-ACCESS-KEY".into(),
                secret_access_key: "TEST-ONLY-SECRET-KEY".into(),
                session_token: "TEST-ONLY-SESSION".into(),
            },
            "us-east-1",
            "test-key".into(),
            Arc::new(Clock(available)),
        )
        .unwrap()
    }

    #[tokio::test]
    async fn missing_trusted_time_stops_both_kms_operations_before_network() {
        let client = client(false);
        let context = BTreeMap::new();
        assert!(matches!(
            client.decrypt_for_recipient(&[1], &context, &[2]).await,
            Err(KmsError::Unavailable)
        ));
        assert!(matches!(
            client.generate_data_key_for_recipient(&context, &[2]).await,
            Err(KmsError::Unavailable)
        ));
    }

    #[tokio::test]
    async fn sdk_signs_with_evidence_time_and_does_not_retry_mutations() {
        use aws_smithy_runtime_api::client::{
            http::{http_client_fn, HttpConnector, HttpConnectorFuture, SharedHttpConnector},
            orchestrator::{HttpRequest, HttpResponse},
        };
        use aws_smithy_types::body::SdkBody;
        use std::sync::atomic::{AtomicUsize, Ordering};

        #[derive(Debug)]
        struct Capture(Arc<AtomicUsize>);
        impl HttpConnector for Capture {
            fn call(&self, request: HttpRequest) -> HttpConnectorFuture {
                self.0.fetch_add(1, Ordering::SeqCst);
                assert_eq!(
                    request.headers().get("x-amz-date"),
                    Some("20200101T000000Z")
                );
                let authorization = request.headers().get("authorization").unwrap();
                assert!(authorization.contains("/20200101/us-east-1/kms/aws4_request"));
                assert_eq!(
                    request.headers().get("x-amz-security-token"),
                    Some("TEST-ONLY-SESSION")
                );
                let response = hyper::Response::builder()
                    .status(503)
                    .header("date", "Tue, 01 Jan 2030 00:00:00 GMT")
                    .body(SdkBody::from(
                        "{\"__type\":\"ServiceUnavailableException\"}",
                    ))
                    .unwrap();
                HttpConnectorFuture::ready(Ok(HttpResponse::try_from(response).unwrap()))
            }
        }
        let client = client(true);
        let count = Arc::new(AtomicUsize::new(0));
        let connector = SharedHttpConnector::new(Capture(count.clone()));
        let time = RequestTime::acquire(client.time.as_ref()).await.unwrap();
        let config = client
            .config(time)
            .unwrap()
            .to_builder()
            .http_client(http_client_fn(move |_, _| connector.clone()))
            .build();
        assert_eq!(config.retry_config().unwrap().max_attempts(), 1);
        let sdk = aws_sdk_kms::Client::from_conf(config);
        assert!(sdk
            .generate_data_key()
            .key_id("test-key")
            .key_spec(DataKeySpec::Aes256)
            .send()
            .await
            .is_err());
        assert_eq!(count.load(Ordering::SeqCst), 1);
    }

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
            let generated =
                aws_sdk_kms::operation::generate_data_key::GenerateDataKeyOutput::builder()
                    .plaintext(Blob::new(plaintext.clone()))
                    .ciphertext_for_recipient(Blob::new(vec![4]))
                    .ciphertext_blob(Blob::new(vec![5]))
                    .build();
            assert!(matches!(
                generated_output(generated),
                Err(KmsError::UnexpectedResponse)
            ));
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
