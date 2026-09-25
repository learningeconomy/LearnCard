use super::{protocol::*, *};
use ed25519_dalek::{Signer, SigningKey};

fn pin(id: &str, protocol: Protocol, seed: u8) -> PinnedServer {
    PinnedServer {
        id: id.into(),
        protocol,
        public_key: SigningKey::from_bytes(&[seed; 32])
            .verifying_key()
            .to_bytes(),
    }
}

fn sign(key: &SigningKey, context: &[u8], bytes: &[u8]) -> Vec<u8> {
    key.sign(&[context, bytes].concat()).to_bytes().to_vec()
}

// Construct actual tag-map wire responses with two-level Merkle paths (index 2:
// first right sibling, then left), not mocked signature-verification outcomes.
fn response(
    protocol: Protocol,
    seed: u8,
    nonce: &[u8],
    mid: u64,
    radius: u32,
    min: u64,
    max: u64,
) -> Vec<u8> {
    let long_term = SigningKey::from_bytes(&[seed; 32]);
    let delegated = SigningKey::from_bytes(&[99; 32]);
    let dele = encode(vec![
        (*b"PUBK", delegated.verifying_key().to_bytes().to_vec()),
        (*b"MINT", min.to_le_bytes().to_vec()),
        (*b"MAXT", max.to_le_bytes().to_vec()),
    ])
    .unwrap();
    let cert = encode(vec![
        (*b"SIG\0", sign(&long_term, DELEGATION_CONTEXT, &dele)),
        (*b"DELE", dele),
    ])
    .unwrap();
    let size = protocol.nonce_size();
    let sibling1 = vec![41; size];
    let sibling2 = vec![42; size];
    let leaf = hash(0, &[nonce], size);
    let node = hash(1, &[&leaf, &sibling1], size);
    let root = hash(1, &[&sibling2, &node], size);
    let srep = encode(vec![
        (*b"ROOT", root),
        (*b"MIDP", mid.to_le_bytes().to_vec()),
        (*b"RADI", radius.to_le_bytes().to_vec()),
    ])
    .unwrap();
    let mut fields = vec![
        (*b"SIG\0", sign(&delegated, RESPONSE_CONTEXT, &srep)),
        (*b"SREP", srep),
        (*b"CERT", cert),
        (*b"INDX", 2u32.to_le_bytes().to_vec()),
        (*b"PATH", [sibling1, sibling2].concat()),
    ];
    if protocol == Protocol::IetfDraft08 {
        fields.push((*b"VER\0", 0x8000_0008u32.to_le_bytes().to_vec()));
        fields.push((*b"NONC", nonce.to_vec()));
    }
    frame(protocol, encode(fields).unwrap())
}

fn replace(packet: &[u8], path: &[[u8; 4]], replacement: &[u8]) -> Vec<u8> {
    let map = Message::parse(packet).unwrap();
    let entries = map
        .0
        .into_iter()
        .map(|(tag, bytes)| {
            let value = if tag == path[0] {
                if path.len() == 1 {
                    replacement.to_vec()
                } else {
                    replace(bytes, &path[1..], replacement)
                }
            } else {
                bytes.to_vec()
            };
            (tag, value)
        })
        .collect();
    encode(entries).unwrap()
}

#[test]
fn signed_formats_and_conservative_rounding() {
    for protocol in [Protocol::GoogleLegacy, Protocol::IetfDraft08] {
        let nonce = vec![7; protocol.nonce_size()];
        let request = request(protocol, &nonce).unwrap();
        assert_eq!(request.len(), 1024);
        assert_eq!(
            Message::parse(unframe(protocol, &request).unwrap())
                .unwrap()
                .get(b"NONC")
                .unwrap(),
            nonce
        );
        let wire = response(protocol, 1, &nonce, 100_001, 2, 0, 200_000);
        let (evidence, interval) = verify(&pin("a", protocol, 1), &nonce, &wire, 10_000).unwrap();
        assert_eq!(evidence.response_hash.len(), 32);
        assert_eq!(
            interval,
            match protocol {
                Protocol::GoogleLegacy => TrustedInterval {
                    lo_ms: 99,
                    hi_ms: 101
                },
                Protocol::IetfDraft08 => TrustedInterval {
                    lo_ms: 99_999_000,
                    hi_ms: 100_003_000
                },
            }
        );
    }
}

#[test]
fn rejects_bad_signatures_nonce_range_radius_and_index() {
    for protocol in [Protocol::GoogleLegacy, Protocol::IetfDraft08] {
        let nonce = vec![7; protocol.nonce_size()];
        let server = pin("a", protocol, 1);
        let wire = response(protocol, 1, &nonce, 100_000, 2, 0, 200_000);
        let raw = unframe(protocol, &wire).unwrap();
        for (path, error) in [
            (vec![*b"CERT", *b"SIG\0"], TimeError::DelegationSignature),
            (vec![*b"SIG\0"], TimeError::ResponseSignature),
        ] {
            let damaged = frame(protocol, replace(raw, &path, &[0; 64]));
            assert_eq!(verify(&server, &nonce, &damaged, 10_000), Err(error));
        }
        assert_eq!(
            verify(&server, &vec![8; nonce.len()], &wire, 10_000),
            Err(TimeError::Nonce)
        );
        let damaged = frame(
            protocol,
            replace(raw, &[*b"PATH"], &vec![0; protocol.nonce_size() * 2]),
        );
        assert_eq!(
            verify(&server, &nonce, &damaged, 10_000),
            Err(TimeError::Nonce)
        );
        let damaged = frame(protocol, replace(raw, &[*b"INDX"], &6u32.to_le_bytes()));
        assert_eq!(
            verify(&server, &nonce, &damaged, 10_000),
            Err(TimeError::Nonce)
        );
        for (min, max) in [(100_001, 200_000), (0, 99_999), (200_000, 0)] {
            let wire = response(protocol, 1, &nonce, 100_000, 2, min, max);
            assert_eq!(
                verify(&server, &nonce, &wire, 10_000),
                Err(TimeError::DelegationRange)
            );
        }
        let wire = response(protocol, 1, &nonce, 20_000_000, 11_000_000, 0, u64::MAX);
        assert_eq!(
            verify(&server, &nonce, &wire, 10_000),
            Err(TimeError::Radius)
        );
    }
}

#[test]
fn malformed_bounds_version_and_overflow() {
    for data in [
        vec![],
        vec![0; 4],
        vec![255; 1024],
        vec![0; 1025],
        vec![1; 13],
    ] {
        assert!(Message::parse(&data).is_err());
    }
    let protocol = Protocol::IetfDraft08;
    let nonce = vec![7; 32];
    let server = pin("a", protocol, 1);
    let wire = response(protocol, 1, &nonce, 100_000, 2, 0, u64::MAX);
    for len in 0..wire.len() {
        assert!(verify(&server, &nonce, &wire[..len], 10_000).is_err());
    }
    let raw = unframe(protocol, &wire).unwrap();
    let wrong_version = frame(
        protocol,
        replace(raw, &[*b"VER\0"], &0x8000_000cu32.to_le_bytes()),
    );
    assert_eq!(
        verify(&server, &nonce, &wrong_version, 10_000),
        Err(TimeError::Encoding)
    );
    for mid in [0, u64::MAX, u64::MAX / 1000] {
        let wire = response(protocol, 1, &nonce, mid, 2, 0, u64::MAX);
        assert!(verify(&server, &nonce, &wire, 10_000).is_err());
    }
}

fn source(second_mid: Option<u64>, delay: Duration) -> RoughtimeTimeSource {
    let mut transport = FakeRoughtimeTransport::new(move |id, request| {
        let protocol = Protocol::IetfDraft08;
        let msg = Message::parse(unframe(protocol, &request)?)?;
        let (seed, mid) = if id == "a" {
            (1, 100)
        } else {
            (2, second_mid.ok_or(TimeError::Unavailable)?)
        };
        Ok(response(protocol, seed, msg.get(b"NONC")?, mid, 2, 0, 1000))
    });
    transport.delay = delay;
    RoughtimeTimeSource::new(
        vec![
            pin("a", Protocol::IetfDraft08, 1),
            pin("b", Protocol::IetfDraft08, 2),
        ],
        Arc::new(transport),
        2,
        10_000,
    )
    .unwrap()
}

#[tokio::test]
async fn intersection_disagreement_insufficient_and_rollback() {
    let source = source(Some(101), Duration::ZERO);
    let evidence = source.now(None).await.unwrap();
    assert_eq!(
        evidence.interval,
        TrustedInterval {
            lo_ms: 99_000,
            hi_ms: 102_000
        }
    );
    assert_eq!(evidence.sources.len(), 2);
    assert_eq!(source.now(Some(102_001)).await, Err(TimeError::Rollback));
    assert!(source.now(Some(102_000)).await.is_ok());
    assert_eq!(
        super::tests::source(Some(110), Duration::ZERO)
            .now(None)
            .await,
        Err(TimeError::Disagreement)
    );
    assert_eq!(
        super::tests::source(None, Duration::ZERO).now(None).await,
        Err(TimeError::InsufficientSources)
    );
}

#[tokio::test]
async fn timeout_counts_as_missing_and_queries_run_concurrently() {
    let start = tokio::time::Instant::now();
    assert_eq!(
        source(Some(100), Duration::from_secs(3)).now(None).await,
        Err(TimeError::InsufficientSources)
    );
    assert!(start.elapsed() < Duration::from_secs(3));
}

#[tokio::test]
async fn fake_and_configuration_guards() {
    assert_eq!(
        FakeTimeSource::interval(1, 2).now(Some(3)).await,
        Err(TimeError::Rollback)
    );
    assert_eq!(
        FakeTimeSource {
            result: Err(TimeError::Unavailable)
        }
        .now(None)
        .await,
        Err(TimeError::Unavailable)
    );
    let transport: Arc<dyn RoughtimeTransport> = Arc::new(FakeRoughtimeTransport::new(|_, _| {
        Err(TimeError::Unavailable)
    }));
    let a = pin("a", Protocol::GoogleLegacy, 1);
    let b = pin("b", Protocol::IetfDraft08, 2);
    assert!(
        RoughtimeTimeSource::new(vec![a.clone(), b.clone()], transport.clone(), 1, 10_000).is_err()
    );
    assert!(RoughtimeTimeSource::new(vec![a.clone(), a], transport.clone(), 2, 10_000).is_err());
    assert!(RoughtimeTimeSource::new(vec![b], transport.clone(), 2, 10_000).is_err());
    assert_eq!(servers::published().unwrap().len(), 2);
    assert_eq!(
        RoughtimeTimeSource::production(transport).is_ok(),
        cfg!(feature = "verified-roughtime-keys")
    );
}
