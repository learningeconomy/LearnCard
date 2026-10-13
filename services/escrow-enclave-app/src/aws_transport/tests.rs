use super::*;
use crate::time::{TimeError, TimeEvidence, TimeFuture};
use der::{asn1::Ia5String, Encode};
use p384::ecdsa::{DerSignature, SigningKey};
use x509_cert::{
    builder::{Builder, CertificateBuilder, Profile},
    ext::pkix::{name::GeneralName, SubjectAltName},
    name::Name,
    spki::SubjectPublicKeyInfoOwned,
    time::{Time, Validity},
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
    let validity = Validity {
        not_before: Time::try_from(UNIX_EPOCH + Duration::from_secs(START)).unwrap(),
        not_after: Time::try_from(UNIX_EPOCH + Duration::from_secs(END)).unwrap(),
    };
    let root = CertificateBuilder::new(
        Profile::Root,
        1u32.into(),
        validity,
        root_name.clone(),
        SubjectPublicKeyInfoOwned::from_key(*root_key.verifying_key()).unwrap(),
        &root_key,
    )
    .unwrap()
    .build::<DerSignature>()
    .unwrap();
    let mut leaf = CertificateBuilder::new(
        Profile::Leaf {
            issuer: root_name,
            enable_key_agreement: false,
            enable_key_encipherment: false,
        },
        2u32.into(),
        validity,
        "CN=kms.us-east-1.amazonaws.com".parse().unwrap(),
        SubjectPublicKeyInfoOwned::from_key(*leaf_key.verifying_key()).unwrap(),
        &root_key,
    )
    .unwrap();
    leaf.add_extension(&SubjectAltName(vec![GeneralName::DnsName(
        Ia5String::new("kms.us-east-1.amazonaws.com").unwrap(),
    )]))
    .unwrap();
    let leaf = leaf.build::<DerSignature>().unwrap().to_der().unwrap();
    let mut roots = RootCertStore::empty();
    roots
        .add(CertificateDer::from(root.to_der().unwrap()))
        .unwrap();
    let key = rustls::pki_types::PrivatePkcs8KeyDer::from(
        leaf_key.to_pkcs8_der().unwrap().as_bytes().to_vec(),
    );
    (roots, CertificateDer::from(leaf), key.into())
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
