//! One-operation AWS transport: authenticated time, compiled roots, no retries
//! or connection/session reuse across operations. Local deadlines bound work only.
use std::{
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use aws_smithy_runtime_api::client::{
    http::{
        http_client_fn, HttpConnector, HttpConnectorFuture, SharedHttpClient, SharedHttpConnector,
    },
    orchestrator::{HttpRequest, HttpResponse},
    result::ConnectorError,
};
use aws_smithy_types::body::SdkBody;
use http_body_util::{BodyExt, Limited};
use hyper_rustls::{HttpsConnector, HttpsConnectorBuilder};
use hyper_util::{
    client::legacy::{connect::HttpConnector as TcpConnector, Client},
    rt::TokioExecutor,
};
use rustls::{
    client::{
        danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier},
        WebPkiServerVerifier,
    },
    pki_types::{CertificateDer, ServerName, UnixTime},
    ClientConfig, DigitallySignedStruct, Error, RootCertStore, SignatureScheme,
};

use crate::{
    kms::KmsError,
    time::{TimeSource, TrustedInterval},
};

const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);
const MAX_RESPONSE_BYTES: usize = 1024 * 1024;

/// Constructible only by querying the enclave's TimeSource, never a host DTO.
/// The fixed sample is scoped to one operation, not an extrapolated wall clock.
#[derive(Clone, Debug)]
pub(crate) struct RequestTime {
    lower: UnixTime,
    upper: UnixTime,
    signing: SystemTime,
}

impl RequestTime {
    pub(crate) async fn acquire(source: &dyn TimeSource) -> Result<Self, KmsError> {
        let evidence = source.now(None).await.map_err(|_| KmsError::Unavailable)?;
        Self::from_interval(evidence.interval)
    }

    fn from_interval(interval: TrustedInterval) -> Result<Self, KmsError> {
        let width = interval
            .hi_ms
            .checked_sub(interval.lo_ms)
            .filter(|width| *width <= 20_000)
            .ok_or(KmsError::Unavailable)?;
        // Floor the lower endpoint and ceil the upper: never narrow the evidence
        // when converting milliseconds to WebPKI's integer-second granularity.
        let upper_seconds = interval
            .hi_ms
            .checked_add(999)
            .ok_or(KmsError::Unavailable)?
            / 1000;
        let signing = UNIX_EPOCH
            .checked_add(Duration::from_millis(interval.lo_ms + width / 2))
            .ok_or(KmsError::Unavailable)?;
        Ok(Self {
            lower: UnixTime::since_unix_epoch(Duration::from_millis(interval.lo_ms)),
            upper: UnixTime::since_unix_epoch(Duration::from_secs(upper_seconds)),
            signing,
        })
    }

    fn tls_config(&self, roots: RootCertStore) -> Result<ClientConfig, KmsError> {
        let provider = Arc::new(rustls::crypto::aws_lc_rs::default_provider());
        let inner = WebPkiServerVerifier::builder_with_provider(Arc::new(roots), provider.clone())
            .build()
            .map_err(|_| KmsError::Configuration)?;
        let mut config = ClientConfig::builder_with_details(provider, Arc::new(self.clone()))
            .with_safe_default_protocol_versions()
            .map_err(|_| KmsError::Configuration)?
            .dangerous()
            .with_custom_certificate_verifier(Arc::new(IntervalVerifier {
                inner,
                lower: self.lower,
                upper: self.upper,
            }))
            .with_no_client_auth();
        config.resumption = rustls::client::Resumption::disabled();
        config.enable_early_data = false;
        Ok(config)
    }

    pub(crate) fn http_client(&self, endpoint: &str) -> Result<SharedHttpClient, KmsError> {
        let connector = self.connector(endpoint)?;
        Ok(http_client_fn(move |_, _| connector.clone()))
    }

    fn connector(&self, endpoint: &str) -> Result<SharedHttpConnector, KmsError> {
        let roots = RootCertStore {
            roots: webpki_roots::TLS_SERVER_ROOTS.to_vec(),
        };
        let tls = HttpsConnectorBuilder::new()
            .with_tls_config(self.tls_config(roots)?)
            .https_only()
            .enable_http1()
            .build();
        let client = Client::builder(TokioExecutor::new())
            .pool_max_idle_per_host(0)
            .retry_canceled_requests(false)
            .build(tls);
        // This endpoint has already been validated against measured service config.
        let authority = endpoint
            .strip_prefix("https://")
            .filter(|s| !s.is_empty() && !s.contains('/'))
            .ok_or(KmsError::Configuration)?
            .to_owned();
        Ok(SharedHttpConnector::new(AwsConnector { client, authority }))
    }
}

impl aws_smithy_async::time::TimeSource for RequestTime {
    fn now(&self) -> SystemTime {
        self.signing
    }
}

impl rustls::time_provider::TimeProvider for RequestTime {
    fn current_time(&self) -> Option<UnixTime> {
        Some(self.lower)
    }
}

#[derive(Debug)]
struct IntervalVerifier {
    inner: Arc<WebPkiServerVerifier>,
    lower: UnixTime,
    upper: UnixTime,
}

impl ServerCertVerifier for IntervalVerifier {
    fn verify_server_cert(
        &self,
        end_entity: &CertificateDer<'_>,
        intermediates: &[CertificateDer<'_>],
        server_name: &ServerName<'_>,
        ocsp_response: &[u8],
        _now: UnixTime,
    ) -> Result<ServerCertVerified, Error> {
        self.inner.verify_server_cert(
            end_entity,
            intermediates,
            server_name,
            ocsp_response,
            self.lower,
        )?;
        self.inner.verify_server_cert(
            end_entity,
            intermediates,
            server_name,
            ocsp_response,
            self.upper,
        )
    }

    fn verify_tls12_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, Error> {
        self.inner.verify_tls12_signature(message, cert, dss)
    }

    fn verify_tls13_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, Error> {
        self.inner.verify_tls13_signature(message, cert, dss)
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        self.inner.supported_verify_schemes()
    }
}

#[derive(Clone, Debug)]
struct AwsConnector {
    client: Client<HttpsConnector<TcpConnector>, SdkBody>,
    authority: String,
}

fn transport_error() -> ConnectorError {
    // Never retain or log a transport error carrying request/credential details.
    ConnectorError::other(
        std::io::Error::from(std::io::ErrorKind::ConnectionAborted).into(),
        None,
    )
}

impl HttpConnector for AwsConnector {
    fn call(&self, request: HttpRequest) -> HttpConnectorFuture {
        let client = self.client.clone();
        let authority = self.authority.clone();
        HttpConnectorFuture::new(async move {
            let request = request.try_into_http1x().map_err(|_| transport_error())?;
            if request.uri().scheme_str() != Some("https")
                || request.uri().authority().map(|a| a.as_str()) != Some(authority.as_str())
            {
                return Err(transport_error());
            }
            tokio::time::timeout(REQUEST_TIMEOUT, async move {
                let response = client
                    .request(request)
                    .await
                    .map_err(|_| transport_error())?;
                let (parts, body) = response.into_parts();
                let body = Limited::new(body, MAX_RESPONSE_BYTES)
                    .collect()
                    .await
                    .map_err(|_| transport_error())?
                    .to_bytes();
                let response = hyper::Response::from_parts(parts, SdkBody::from(body));
                HttpResponse::try_from(response).map_err(|_| transport_error())
            })
            .await
            .map_err(|_| transport_error())?
        })
    }
}

#[cfg(test)]
mod tests;
