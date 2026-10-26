use super::*;
use crate::nsm::{certificate_builder, validity, TestProfile};
use crate::time::{TimeError, TimeEvidence, TimeFuture};
use p384::ecdsa::{DerSignature, SigningKey};
use x509_cert::{
    builder::Builder,
    der::{asn1::Ia5String, Encode},
    ext::pkix::{name::GeneralName, SubjectAltName},
    name::Name,
};

const START: u64 = 1_577_836_800;
const END: u64 = START + 100;

struct Clock(Result<TrustedInterval, TimeError>);
impl TimeSource for Clock {
    fn now(&self, _: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async {
            self.0.map(|interval| TimeEvidence {
                interval,
                sources: vec![],
            })
        })
    }
}

#[tokio::test]
async fn only_available_bounded_evidence_produces_request_time() {
    for interval in [
        Err(TimeError::Unavailable),
        Err(TimeError::InsufficientSources),
        Ok(TrustedInterval { lo_ms: 2, hi_ms: 1 }),
        Ok(TrustedInterval {
            lo_ms: 0,
            hi_ms: 20_001,
        }),
        Ok(TrustedInterval {
            lo_ms: u64::MAX,
            hi_ms: u64::MAX,
        }),
    ] {
        assert!(RequestTime::acquire(&Clock(interval)).await.is_err());
    }
    let time = RequestTime::acquire(&Clock(Ok(TrustedInterval {
        lo_ms: 1001,
        hi_ms: 3001,
    })))
    .await
    .unwrap();
    assert_eq!(time.lower.as_secs(), 1);
    assert_eq!(time.upper.as_secs(), 4);
    assert_eq!(
        aws_smithy_async::time::TimeSource::now(&time),
        UNIX_EPOCH + Duration::from_millis(2001)
    );
    assert_eq!(
        rustls::time_provider::TimeProvider::current_time(&time),
        Some(time.lower)
    );
}

fn certificates() -> (
    RootCertStore,
    CertificateDer<'static>,
    rustls::pki_types::PrivateKeyDer<'static>,
) {
    use p384::pkcs8::EncodePrivateKey;
    // Public deterministic test keys, never production roots.
    let root_key = SigningKey::from_slice(&[1; 48]).unwrap();
    let leaf_key = SigningKey::from_slice(&[2; 48]).unwrap();
    let root_name: Name = "CN=TEST ONLY AWS transport root".parse().unwrap();
    let validity = validity(START, END).unwrap();
    let root = certificate_builder(TestProfile::Root(root_name.clone()), 1, validity, &root_key)
        .unwrap()
        .build::<_, DerSignature>(&root_key)
        .unwrap();
    let mut leaf = certificate_builder(
        TestProfile::Leaf {
            subject: "CN=kms.us-east-1.amazonaws.com".parse().unwrap(),
            issuer: root_name,
        },
        2,
        validity,
        &leaf_key,
    )
    .unwrap();
    leaf.add_extension(&SubjectAltName(vec![
        GeneralName::DnsName(Ia5String::new("kms.us-east-1.amazonaws.com").unwrap()),
        GeneralName::DnsName(Ia5String::new("localhost").unwrap()),
    ]))
    .unwrap();
    let leaf = leaf
        .build::<_, DerSignature>(&root_key)
        .unwrap()
        .to_der()
        .unwrap();
    let mut roots = RootCertStore::empty();
    roots
        .add(CertificateDer::from(root.to_der().unwrap()))
        .unwrap();
    let key = rustls::pki_types::PrivatePkcs8KeyDer::from(
        leaf_key.to_pkcs8_der().unwrap().as_bytes().to_vec(),
    );
    (roots, CertificateDer::from(leaf), key.into())
}

async fn local_response(body: Vec<u8>, stall: bool) -> Result<HttpResponse, ConnectorError> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let (roots, cert, key) = certificates();
    let server = rustls::ServerConfig::builder_with_provider(Arc::new(
        rustls::crypto::aws_lc_rs::default_provider(),
    ))
    .with_safe_default_protocol_versions()
    .unwrap()
    .with_no_client_auth()
    .with_single_cert(vec![cert], key)
    .unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!(
        "https://localhost:{}",
        listener.local_addr().unwrap().port()
    );
    let (ready_tx, ready_rx) = tokio::sync::oneshot::channel();
    let task = tokio::spawn(async move {
        let (socket, _) = listener.accept().await.unwrap();
        let mut tls = tokio_rustls::TlsAcceptor::from(Arc::new(server))
            .accept(socket)
            .await
            .unwrap();
        let mut request = Vec::new();
        loop {
            request.push(tls.read_u8().await.unwrap());
            if request.ends_with(b"\r\n\r\n") {
                break;
            }
            assert!(request.len() < 16_384);
        }
        let header = format!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\nX-Test: converted\r\nConnection: close\r\n\r\n", body.len());
        tls.write_all(header.as_bytes()).await.unwrap();
        tls.flush().await.unwrap();
        ready_tx.send(()).unwrap();
        if stall {
            std::future::pending::<()>().await;
        }
        // The client may close immediately at the size limit. Only BrokenPipe /
        // ConnectionReset are expected in that case; do not mask other failures.
        let sent = async {
            tls.write_all(&body).await?;
            tls.shutdown().await
        }
        .await;
        if let Err(error) = sent {
            assert!(body.len() > MAX_RESPONSE_BYTES);
            assert!(matches!(
                error.kind(),
                std::io::ErrorKind::BrokenPipe | std::io::ErrorKind::ConnectionReset
            ));
        }
    });
    let time = RequestTime::from_interval(TrustedInterval {
        lo_ms: (START + 50) * 1000,
        hi_ms: (START + 50) * 1000,
    })
    .unwrap();
    let connector = time
        .connector_with_tls(&endpoint, time.tls_config(roots).unwrap())
        .unwrap();
    let request = hyper::Request::builder()
        .uri(&endpoint)
        .body(SdkBody::empty())
        .unwrap();
    let response = tokio::spawn(async move {
        connector
            .call(HttpRequest::try_from(request).unwrap())
            .await
    });
    ready_rx.await.unwrap();
    if stall {
        tokio::time::pause();
        tokio::time::advance(REQUEST_TIMEOUT + Duration::from_secs(1)).await;
    }
    let result = response.await.unwrap();
    if stall {
        task.abort();
        assert!(task.await.unwrap_err().is_cancelled());
    } else {
        task.await.unwrap();
    }
    result
}

#[tokio::test]
async fn http_response_is_converted_and_body_limit_is_enforced() {
    let response = local_response(b"{\"ok\":true}".to_vec(), false)
        .await
        .unwrap();
    assert_eq!(response.status().as_u16(), 200);
    assert_eq!(response.headers().get("x-test"), Some("converted"));
    assert_eq!(response.body().bytes().unwrap(), b"{\"ok\":true}");
    assert_eq!(
        local_response(vec![b'a'; MAX_RESPONSE_BYTES], false)
            .await
            .unwrap()
            .body()
            .bytes()
            .unwrap()
            .len(),
        MAX_RESPONSE_BYTES
    );
    assert!(local_response(vec![b'a'; MAX_RESPONSE_BYTES + 1], false)
        .await
        .is_err());
}

#[tokio::test]
async fn stalled_response_fails_at_exchange_deadline() {
    assert!(local_response(vec![b'a'; 10], true).await.is_err());
}

#[tokio::test]
async fn consecutive_operations_open_new_tls_sessions_and_recheck_validity() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let (roots, cert, key) = certificates();
    let server = rustls::ServerConfig::builder_with_provider(Arc::new(
        rustls::crypto::aws_lc_rs::default_provider(),
    ))
    .with_safe_default_protocol_versions()
    .unwrap()
    .with_no_client_auth()
    .with_single_cert(vec![cert], key)
    .unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!(
        "https://localhost:{}",
        listener.local_addr().unwrap().port()
    );
    let server = tokio::spawn(async move {
        let acceptor = tokio_rustls::TlsAcceptor::from(Arc::new(server));
        for i in 0..2 {
            let (socket, _) = listener.accept().await.unwrap();
            let tls = acceptor.accept(socket).await;
            if i == 1 {
                assert!(tls.is_err());
                break;
            }
            let mut tls = tls.unwrap();
            let mut request = Vec::new();
            loop {
                request.push(tls.read_u8().await.unwrap());
                if request.ends_with(b"\r\n\r\n") {
                    break;
                }
                assert!(request.len() < 16_384);
            }
            // Deliberately offer keep-alive. A reused connection would bypass
            // the next operation's certificate expiry check and hang this test.
            tls.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\n{}")
                .await
                .unwrap();
            tls.flush().await.unwrap();
            assert_eq!(
                tls.read_u8().await.unwrap_err().kind(),
                std::io::ErrorKind::UnexpectedEof
            );
        }
    });
    for (seconds, succeeds) in [(START + 50, true), (END + 1, false)] {
        let time = RequestTime::acquire(&Clock(Ok(TrustedInterval {
            lo_ms: seconds * 1000,
            hi_ms: seconds * 1000,
        })))
        .await
        .unwrap();
        let connector = time
            .connector_with_tls(&endpoint, time.tls_config(roots.clone()).unwrap())
            .unwrap();
        let request = hyper::Request::builder()
            .uri(&endpoint)
            .body(SdkBody::empty())
            .unwrap();
        assert_eq!(
            connector
                .call(HttpRequest::try_from(request).unwrap())
                .await
                .is_ok(),
            succeeds
        );
    }
    tokio::time::timeout(Duration::from_secs(2), server)
        .await
        .unwrap()
        .unwrap();
}

fn verifier(roots: RootCertStore, lo_ms: u64, hi_ms: u64) -> IntervalVerifier {
    let time = RequestTime::from_interval(TrustedInterval { lo_ms, hi_ms }).unwrap();
    IntervalVerifier {
        inner: WebPkiServerVerifier::builder_with_provider(
            Arc::new(roots),
            Arc::new(rustls::crypto::aws_lc_rs::default_provider()),
        )
        .build()
        .unwrap(),
        lower: time.lower,
        upper: time.upper,
    }
}

#[test]
fn certificate_checks_use_both_evidence_bounds_not_wall_clock() {
    let (roots, cert, _) = certificates();
    let name = ServerName::try_from("kms.us-east-1.amazonaws.com").unwrap();
    let valid = verifier(roots.clone(), (START + 40) * 1000, (START + 60) * 1000);
    for untrusted_now in [0, START - 1, END + 1, 4_000_000_000] {
        assert!(valid
            .verify_server_cert(
                &cert,
                &[],
                &name,
                &[],
                UnixTime::since_unix_epoch(Duration::from_secs(untrusted_now))
            )
            .is_ok());
    }
    for (lo, hi) in [
        (START - 2, START - 1),  // Not yet valid.
        (END + 1, END + 2),      // Expired.
        (START - 1, START + 10), // Midpoint valid, lower bound invalid.
        (END - 10, END + 1),     // Midpoint valid, upper bound invalid.
    ] {
        let invalid = verifier(roots.clone(), lo * 1000, hi * 1000);
        assert!(invalid
            .verify_server_cert(
                &cert,
                &[],
                &name,
                &[],
                UnixTime::since_unix_epoch(Duration::from_secs(START + 50))
            )
            .is_err());
    }
    // Millisecond rounding must not let a just-expired certificate through.
    let invalid = verifier(roots, (END - 1) * 1000, END * 1000 + 1);
    assert!(invalid
        .verify_server_cert(&cert, &[], &name, &[], valid.lower)
        .is_err());
}

#[test]
fn normal_hostname_chain_and_measured_root_checks_are_preserved() {
    let (roots, cert, _) = certificates();
    let valid = verifier(roots, (START + 40) * 1000, (START + 60) * 1000);
    for wrong_name in [
        "attacker.test",
        "kms.us-west-2.amazonaws.com",
        "dynamodb.us-east-1.amazonaws.com",
    ] {
        let name = ServerName::try_from(wrong_name).unwrap();
        assert!(valid
            .verify_server_cert(&cert, &[], &name, &[], valid.lower)
            .is_err());
    }
    let compiled = verifier(
        RootCertStore {
            roots: webpki_roots::TLS_SERVER_ROOTS.to_vec(),
        },
        (START + 40) * 1000,
        (START + 60) * 1000,
    );
    assert!(compiled
        .verify_server_cert(
            &cert,
            &[],
            &ServerName::try_from("kms.us-east-1.amazonaws.com").unwrap(),
            &[],
            valid.lower
        )
        .is_err());
    let malformed = CertificateDer::from(vec![0; 50]);
    assert!(valid
        .verify_server_cert(
            &malformed,
            &[],
            &ServerName::try_from("kms.us-east-1.amazonaws.com").unwrap(),
            &[],
            valid.lower
        )
        .is_err());
    assert!(!valid.supported_verify_schemes().is_empty());
}

#[tokio::test]
async fn connector_refuses_plaintext_and_other_authorities_before_network() {
    let time = RequestTime::from_interval(TrustedInterval {
        lo_ms: START * 1000,
        hi_ms: START * 1000,
    })
    .unwrap();
    let connector = time
        .connector("https://kms.us-east-1.amazonaws.com:8000")
        .unwrap();
    for endpoint in [
        "http://kms.us-east-1.amazonaws.com:8000",
        "https://attacker.test",
        "https://kms.us-west-2.amazonaws.com:8000",
    ] {
        let request = hyper::Request::builder()
            .uri(endpoint)
            .body(SdkBody::empty())
            .unwrap();
        assert!(connector
            .call(HttpRequest::try_from(request).unwrap())
            .await
            .is_err());
    }
}

#[test]
fn real_tls_handshakes_use_trusted_time_and_verify_signatures() {
    use rustls::{ClientConnection, ServerConfig, ServerConnection};
    fn handshake(
        client: &mut ClientConnection,
        server: &mut ServerConnection,
    ) -> Result<(), Error> {
        for _ in 0..16 {
            let mut bytes = Vec::new();
            client.write_tls(&mut bytes).unwrap();
            server.read_tls(&mut bytes.as_slice()).unwrap();
            server.process_new_packets()?;
            let mut bytes = Vec::new();
            server.write_tls(&mut bytes).unwrap();
            client.read_tls(&mut bytes.as_slice()).unwrap();
            client.process_new_packets()?;
            if !client.is_handshaking() && !server.is_handshaking() {
                return Ok(());
            }
        }
        panic!("in-memory TLS handshake did not finish");
    }
    // The certificate expired in 2020 by real wall time. Valid evidence succeeds
    // for both TLS versions; evidence outside validity must fail at handshake.
    for version in [&rustls::version::TLS12, &rustls::version::TLS13] {
        for (seconds, succeeds) in [(START + 50, true), (START - 1, false), (END + 1, false)] {
            let (roots, cert, key) = certificates();
            let server = ServerConfig::builder_with_provider(Arc::new(
                rustls::crypto::aws_lc_rs::default_provider(),
            ))
            .with_protocol_versions(&[version])
            .unwrap()
            .with_no_client_auth()
            .with_single_cert(vec![cert], key)
            .unwrap();
            let time = RequestTime::from_interval(TrustedInterval {
                lo_ms: seconds * 1000,
                hi_ms: seconds * 1000,
            })
            .unwrap();
            let tls = time.tls_config(roots).unwrap();
            assert!(!tls.enable_early_data);
            let mut client = ClientConnection::new(
                Arc::new(tls),
                ServerName::try_from("kms.us-east-1.amazonaws.com").unwrap(),
            )
            .unwrap();
            let mut server = ServerConnection::new(Arc::new(server)).unwrap();
            assert_eq!(handshake(&mut client, &mut server).is_ok(), succeeds);
        }
    }
}
