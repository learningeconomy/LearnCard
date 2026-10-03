use super::emulate::{Clock, Enrollments};
use super::*;
use crate::{
    crypto::{self, EscrowBlobPlaintext},
    ledger::FakeHeadStore,
    nsm::FakeNsm,
    policy::{CurrentEnrollment, SignedHoldRecord, HOLD_DURATION_MS},
    wire::{EscrowEnvelope, ReleasePolicy},
};
use std::{
    net::SocketAddr,
    sync::atomic::{AtomicU64, Ordering},
};
use tokio::net::TcpStream;

async fn call(address: SocketAddr, request: Request) -> Response {
    let mut stream = TcpStream::connect(address).await.unwrap();
    write_frame(&mut stream, &serde_json::to_vec(&request).unwrap())
        .await
        .unwrap();
    serde_json::from_slice(&read_frame(&mut stream).await.unwrap()).unwrap()
}

async fn http(
    address: SocketAddr,
    path: &str,
    token: &str,
    body: &str,
    length: usize,
) -> (u16, serde_json::Value) {
    let mut stream = TcpStream::connect(address).await.unwrap();
    stream.write_all(format!("POST {path} HTTP/1.1\r\nHost: localhost\r\nAuthorization: Bearer {token}\r\nContent-Length: {length}\r\n\r\n{body}").as_bytes()).await.unwrap();
    let mut bytes = Vec::new();
    while !bytes.ends_with(b"\r\n\r\n") {
        bytes.push(stream.read_u8().await.unwrap());
    }
    let headers = std::str::from_utf8(&bytes).unwrap();
    let response_length: usize = headers
        .split("\r\n")
        .find_map(|line| line.strip_prefix("Content-Length: "))
        .unwrap()
        .parse()
        .unwrap();
    let mut body = vec![0; response_length];
    stream.read_exact(&mut body).await.unwrap();
    (
        headers.split(' ').nth(1).unwrap().parse().unwrap(),
        serde_json::from_slice(&body).unwrap(),
    )
}

struct Fixture {
    envelope: EscrowEnvelope,
    client: crypto::EscrowKeyPair,
    address: SocketAddr,
}
impl Fixture {
    async fn create(&self, id: &str, policy: ReleasePolicy) -> SignedHoldRecord {
        match call(
            self.address,
            Request::CreateHold {
                envelope: self.envelope.clone(),
                hold_id: id.into(),
                request_id: id.into(),
                expected_did: "did:key:test".into(),
                expected_share_version: 1,
                enrollment_epoch: 1,
                release_policy: policy,
                client_ephemeral_public_key: self.client.public_key.clone(),
            },
        )
        .await
        {
            Response::CreateHold { hold } => hold,
            other => panic!("Unexpected response {other:?}"),
        }
    }
    fn release(&self, hold: SignedHoldRecord, id: &str, proof: Option<String>) -> Request {
        Request::Release {
            envelope: self.envelope.clone(),
            hold,
            request_id: id.into(),
            client_ephemeral_public_key: self.client.public_key.clone(),
            expected_did: "did:key:test".into(),
            pin_proof: proof,
        }
    }
}

#[tokio::test]
async fn policy_suite_through_loopback_and_http() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let http_listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let http_address = http_listener.local_addr().unwrap();
    let clock = Arc::new(Clock(AtomicU64::new(1_700_000_000_000)));
    let keys = crypto::generate_escrow_key_pair().unwrap();
    let public_key = keys.public_key.clone();
    let envelope = crypto::encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ab".repeat(33),
            did: "did:key:test".into(),
            share_version: 1.0,
            pin_verifier: Some("ab".repeat(32)),
            pin_attempts_floor: None,
        },
        &public_key,
        "emulate",
    )
    .unwrap();
    let authority = Enrollments::default();
    authority.0.lock().unwrap().insert(
        "did:key:test".into(),
        CurrentEnrollment {
            epoch: 1,
            share_version: 1,
            blob_hash: crate::crypto::escrow_blob_identity(&envelope).unwrap(),
        },
    );
    let server_clock = clock.clone();
    let task = tokio::spawn(async move {
        let nsm = FakeNsm::new(1_700_000_000_000, [[1; 48], [2; 48], [3; 48]]).unwrap();
        let store = FakeHeadStore::default();
        let policy = Policy::new(
            keys,
            "emulate".into(),
            Vec::new(),
            "emulate".into(),
            measurement(&nsm).unwrap(),
            &store,
            &*server_clock,
            &authority,
        )
        .unwrap();
        serve(
            Service {
                policy,
                nsm: &nsm,
                key_id: "emulate".into(),
                public_key,
                mode: AttestationMode::Software,
            },
            Listener::Tcp(listener),
            Some(http_listener),
            "test-token".into(),
        )
        .await
        .unwrap();
    });
    let fixture = Fixture {
        envelope,
        client: crypto::generate_escrow_key_pair().unwrap(),
        address,
    };
    let attestation = call(address, Request::Attest { nonce: vec![7; 32] }).await;
    let attestation_public_key = match attestation {
        Response::Attest {
            public_key,
            previous_key_ids,
            document,
            mode,
            issued_at,
            ..
        } => {
            assert_eq!(mode, AttestationMode::Software);
            assert_eq!(issued_at, "2023-11-14T22:13:20.000Z");
            assert!(previous_key_ids.is_empty());
            let claims = parse_attestation_document(&STANDARD.decode(document).unwrap()).unwrap();
            assert_eq!(claims.nonce.unwrap().as_ref(), &[7; 32]);
            assert_eq!(
                claims.user_data.unwrap().as_ref(),
                attest_user_data(&STANDARD.decode(&public_key).unwrap(), "emulate", &[])
            );
            assert_eq!(claims.public_key.unwrap().len(), 65);
            public_key
        }
        other => panic!("{other:?}"),
    };
    let verify = Request::VerifyBlob {
        envelope: fixture.envelope.clone(),
        expected_did: "did:key:test".into(),
        expected_share_version: 1,
    };
    assert!(matches!(
        call(address, verify.clone()).await,
        Response::VerifyBlob {
            ok: true,
            has_pin: true,
            ..
        }
    ));
    // P8.2 wiring: carry_pin_verifier touches no ledger/PIN-budget state, so this
    // is safe to run here without disturbing the budget assertions below.
    let carry_request = Request::CarryPinVerifier {
        source_envelope: fixture.envelope.clone(),
        target_envelope: crypto::encrypt_escrow_blob(
            &EscrowBlobPlaintext {
                version: 1,
                recovery_share: "cd".repeat(33),
                did: "did:key:test".into(),
                share_version: 2.0,
                pin_verifier: None,
                pin_attempts_floor: None,
            },
            &attestation_public_key,
            "emulate",
        )
        .unwrap(),
        expected_did: "did:key:test".into(),
        source_share_version: 1,
        target_share_version: 2,
        target_enrollment_epoch: 1,
        source_enrollment_epoch: 1,
    };
    let carried_envelope = match call(address, carry_request.clone()).await {
        Response::CarryPinVerifier { envelope } => envelope,
        other => panic!("{other:?}"),
    };
    assert!(matches!(
        call(
            address,
            Request::VerifyBlob {
                envelope: carried_envelope,
                expected_did: "did:key:test".into(),
                expected_share_version: 2,
            }
        )
        .await,
        Response::VerifyBlob {
            ok: true,
            has_pin: true,
            ..
        }
    ));
    let mut mismatched = carry_request.clone();
    if let Request::CarryPinVerifier { expected_did, .. } = &mut mismatched {
        *expected_did = "did:key:wrong".into();
    }
    assert!(matches!(
        call(address, mismatched).await,
        Response::Error {
            code: ErrorCode::Blob,
            ..
        }
    ));
    let mut value = serde_json::to_value(&carry_request).unwrap();
    value.as_object_mut().unwrap().remove("method");
    let body = value.to_string();
    let (status, result) = http(
        http_address,
        "/v1/carry-pin-verifier",
        "test-token",
        &body,
        body.len(),
    )
    .await;
    assert_eq!(status, 200);
    assert!(result.get("envelope").is_some());
    assert!(result.get("method").is_none());

    let hold = fixture.create("delay", ReleasePolicy::Hold).await;
    let mut tampered = hold.clone();
    tampered.hold.created_hi = 0;
    assert!(matches!(
        call(address, fixture.release(tampered, "tamper", None)).await,
        Response::Error { .. }
    ));
    assert!(matches!(
        call(address, fixture.release(hold.clone(), "early", None)).await,
        Response::Error {
            code: ErrorCode::Time,
            ..
        }
    ));
    clock.0.fetch_add(HOLD_DURATION_MS, Ordering::SeqCst);
    let response = call(address, fixture.release(hold.clone(), "ready", None)).await;
    match response {
        Response::Release { sealed } => {
            let opened = crypto::open_escrow_release(&sealed, &fixture.client.private_key).unwrap();
            assert_eq!(opened.blob.recovery_share, "ab".repeat(33));
            assert!(opened.blob.pin_verifier.is_none());
        }
        other => panic!("{other:?}"),
    }
    assert!(matches!(
        call(address, fixture.release(hold, "ready", None)).await,
        Response::Error {
            code: ErrorCode::Policy,
            ..
        }
    ));
    let pin = fixture.create("pin", ReleasePolicy::Pin).await;
    assert!(matches!(
        call(
            address,
            fixture.release(pin.clone(), "wrong", Some("cd".repeat(32)))
        )
        .await,
        Response::Error {
            code: ErrorCode::PinMismatch,
            ..
        }
    ));
    assert!(matches!(
        call(
            address,
            fixture.release(pin, "right", Some("ab".repeat(32)))
        )
        .await,
        Response::Release { .. }
    ));
    let cancelled = fixture.create("cancelled", ReleasePolicy::Hold).await;
    assert!(matches!(
        call(
            address,
            Request::Cancel {
                envelope: fixture.envelope.clone(),
                hold: cancelled.clone(),
                request_id: "cancel".into(),
                client_ephemeral_public_key: fixture.client.public_key.clone(),
                expected_did: "did:key:test".into()
            }
        )
        .await,
        Response::Cancel { cancelled: true }
    ));
    clock.0.fetch_add(HOLD_DURATION_MS, Ordering::SeqCst);
    assert!(matches!(
        call(address, fixture.release(cancelled, "cancel-release", None)).await,
        Response::Error {
            code: ErrorCode::Policy,
            ..
        }
    ));

    for length in [0, MAX_FRAME as u32 + 1, u32::MAX] {
        let mut stream = TcpStream::connect(address).await.unwrap();
        stream.write_u32(length).await.unwrap();
        let mut byte = [0];
        assert_eq!(stream.read(&mut byte).await.unwrap(), 0);
    }
    let mut stream = TcpStream::connect(address).await.unwrap();
    write_frame(&mut stream, b"{broken").await.unwrap();
    assert!(read_frame(&mut stream).await.is_err());
    let mut concurrent = JoinSet::new();
    for _ in 0..40 {
        concurrent.spawn(async move { call(address, Request::Health).await });
    }
    while let Some(result) = concurrent.join_next().await {
        assert!(matches!(result.unwrap(), Response::Health { ok: true }));
    }

    let (status, _) = http(http_address, "/v1/attest", "", "{}", 2).await;
    assert_eq!(status, 401);
    assert_eq!(
        http(http_address, "/v1/attest", "wrong-token", "{}", 2)
            .await
            .0,
        401
    );
    let (status, _) = http(http_address, "/missing", "test-token", "{}", 2).await;
    assert_eq!(status, 404);
    let (status, _) = http(http_address, "/v1/attest", "test-token", "", MAX_FRAME + 1).await;
    assert_eq!(status, 413);
    let body = r#"{"nonce":[1,2,3]}"#;
    let (status, value) = http(http_address, "/v1/attest", "test-token", body, body.len()).await;
    assert_eq!(status, 200);
    assert_eq!(value["mode"], "software");
    assert!(value.get("method").is_none());
    let mut value = serde_json::to_value(verify).unwrap();
    value.as_object_mut().unwrap().remove("method");
    let body = value.to_string();
    let (status, result) = http(
        http_address,
        "/v1/verify-blob",
        "test-token",
        &body,
        body.len(),
    )
    .await;
    assert_eq!(status, 200);
    assert_eq!(result, serde_json::json!({"ok":true,"hasPin":true}));
    let pin = fixture.create("http-pin", ReleasePolicy::Pin).await;
    let mut value =
        serde_json::to_value(fixture.release(pin, "http-release", Some("ab".repeat(32)))).unwrap();
    value.as_object_mut().unwrap().remove("method");
    let body = value.to_string();
    let (status, value) = http(http_address, "/v1/release", "test-token", &body, body.len()).await;
    assert_eq!(status, 200);
    assert!(value.get("sealed").is_some());
    let sealed: EscrowEnvelope = serde_json::from_value(value["sealed"].clone()).unwrap();
    assert!(
        crypto::open_escrow_release(&sealed, &fixture.client.private_key)
            .unwrap()
            .blob
            .pin_verifier
            .is_none()
    );

    // Three reservations above (wrong/right/http-right); new holds share the
    // remaining seven, not fresh per-hold counters. Success never resets them.
    let budget = fixture.create("budget", ReleasePolicy::Pin).await;
    for index in 0..7 {
        assert!(matches!(
            call(
                address,
                fixture.release(
                    budget.clone(),
                    &format!("budget-{index}"),
                    Some("cd".repeat(32))
                )
            )
            .await,
            Response::Error {
                code: ErrorCode::PinMismatch,
                ..
            }
        ));
    }
    let another = fixture.create("no-reset", ReleasePolicy::Pin).await;
    assert!(matches!(
        call(
            address,
            fixture.release(another, "eleventh", Some("ab".repeat(32)))
        )
        .await,
        Response::Error {
            code: ErrorCode::Policy,
            ..
        }
    ));

    let racing = fixture.create("race", ReleasePolicy::Hold).await;
    clock.0.fetch_add(HOLD_DURATION_MS, Ordering::SeqCst);
    let (first, second) = tokio::join!(
        call(address, fixture.release(racing.clone(), "race-a", None)),
        call(address, fixture.release(racing, "race-b", None))
    );
    assert_eq!(
        usize::from(matches!(first, Response::Release { .. }))
            + usize::from(matches!(second, Response::Release { .. })),
        1
    );
    let duplicate = r#"{"nonce":[],"nonce":[1]}"#;
    assert_eq!(
        http(
            http_address,
            "/v1/attest",
            "test-token",
            duplicate,
            duplicate.len()
        )
        .await
        .0,
        400
    );
    task.abort();
    assert!(task.await.unwrap_err().is_cancelled());
}

// P9.1: boot with 2 previous keys — the attest response and the NSM-signed
// user_data both advertise them, and a blob sealed under one of them still
// verifies/creates a hold/releases through the real wire dispatch, not just
// the policy layer directly (server::tests's other test already covers 0
// previous keys, the default configuration every other test in this file
// exercises unchanged).
#[tokio::test]
async fn boot_with_two_previous_keys_advertises_them_and_releases_a_previous_key_blob() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let clock = Arc::new(Clock(AtomicU64::new(1_700_000_000_000)));
    let keys = crypto::generate_escrow_key_pair().unwrap();
    let previous_a = crypto::generate_escrow_key_pair().unwrap();
    let previous_b = crypto::generate_escrow_key_pair().unwrap();
    let client = crypto::generate_escrow_key_pair().unwrap();
    let previous_envelope = crypto::encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ab".repeat(33),
            did: "did:key:test".into(),
            share_version: 1.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &previous_a.public_key,
        "previous-a",
    )
    .unwrap();
    let authority = Enrollments::default();
    authority.0.lock().unwrap().insert(
        "did:key:test".into(),
        CurrentEnrollment {
            epoch: 1,
            share_version: 1,
            blob_hash: crate::crypto::escrow_blob_identity(&previous_envelope).unwrap(),
        },
    );
    let server_clock = clock.clone();
    let task = tokio::spawn(async move {
        let nsm = FakeNsm::new(1_700_000_000_000, [[1; 48], [2; 48], [3; 48]]).unwrap();
        let store = FakeHeadStore::default();
        let policy = Policy::new(
            keys,
            "emulate".into(),
            vec![
                ("previous-a".into(), previous_a),
                ("previous-b".into(), previous_b),
            ],
            "emulate".into(),
            measurement(&nsm).unwrap(),
            &store,
            &*server_clock,
            &authority,
        )
        .unwrap();
        serve(
            Service {
                policy,
                nsm: &nsm,
                key_id: "emulate".into(),
                public_key: String::new(),
                mode: AttestationMode::Software,
            },
            Listener::Tcp(listener),
            None,
            String::new(),
        )
        .await
        .unwrap();
    });
    match call(address, Request::Attest { nonce: vec![9; 32] }).await {
        Response::Attest {
            public_key,
            previous_key_ids,
            document,
            ..
        } => {
            assert_eq!(previous_key_ids, vec!["previous-a", "previous-b"]);
            let claims = parse_attestation_document(&STANDARD.decode(&document).unwrap()).unwrap();
            assert_eq!(
                claims.user_data.unwrap().as_ref(),
                attest_user_data(
                    &STANDARD.decode(&public_key).unwrap(),
                    "emulate",
                    &previous_key_ids
                )
            );
        }
        other => panic!("{other:?}"),
    }
    assert!(matches!(
        call(
            address,
            Request::VerifyBlob {
                envelope: previous_envelope.clone(),
                expected_did: "did:key:test".into(),
                expected_share_version: 1,
            },
        )
        .await,
        Response::VerifyBlob {
            ok: true,
            has_pin: false,
            ..
        }
    ));
    let hold = match call(
        address,
        Request::CreateHold {
            envelope: previous_envelope.clone(),
            hold_id: "previous-hold".into(),
            request_id: "previous-hold".into(),
            expected_did: "did:key:test".into(),
            expected_share_version: 1,
            enrollment_epoch: 1,
            release_policy: ReleasePolicy::Hold,
            client_ephemeral_public_key: client.public_key.clone(),
        },
    )
    .await
    {
        Response::CreateHold { hold } => hold,
        other => panic!("{other:?}"),
    };
    clock.0.fetch_add(HOLD_DURATION_MS, Ordering::SeqCst);
    let sealed = match call(
        address,
        Request::Release {
            envelope: previous_envelope.clone(),
            hold,
            request_id: "previous-release".into(),
            client_ephemeral_public_key: client.public_key.clone(),
            expected_did: "did:key:test".into(),
            pin_proof: None,
        },
    )
    .await
    {
        Response::Release { sealed } => sealed,
        other => panic!("{other:?}"),
    };
    let release = crypto::open_escrow_release(&sealed, &client.private_key).unwrap();
    assert_eq!(release.blob.did, "did:key:test");
    assert_eq!(release.hold_id, "previous-hold");
    // P9.3: the same previous-key blob migrates onto the current key through
    // the real wire dispatch (not just the policy layer). Refuses a second
    // attempt against the already-current-key result (nothing left to migrate).
    let rewrapped = match call(
        address,
        Request::RewrapEscrowBlob {
            envelope: previous_envelope,
            expected_did: "did:key:test".into(),
            expected_share_version: 1,
            source_enrollment_epoch: 1,
        },
    )
    .await
    {
        Response::RewrapEscrowBlob { envelope } => envelope,
        other => panic!("{other:?}"),
    };
    assert_eq!(rewrapped.key_id, "emulate");
    assert!(matches!(
        call(
            address,
            Request::VerifyBlob {
                envelope: rewrapped.clone(),
                expected_did: "did:key:test".into(),
                expected_share_version: 1,
            },
        )
        .await,
        Response::VerifyBlob {
            ok: true,
            has_pin: false,
            ..
        }
    ));
    assert!(matches!(
        call(
            address,
            Request::RewrapEscrowBlob {
                envelope: rewrapped,
                expected_did: "did:key:test".into(),
                expected_share_version: 1,
                source_enrollment_epoch: 1,
            },
        )
        .await,
        Response::Error {
            code: ErrorCode::Blob,
            ..
        }
    ));
    task.abort();
}

#[test]
fn timestamp_bounds() {
    assert_eq!(iso_timestamp(0).unwrap(), "1970-01-01T00:00:00.000Z");
    assert_eq!(
        iso_timestamp(951782400000).unwrap(),
        "2000-02-29T00:00:00.000Z"
    );
    assert!(iso_timestamp(u64::MAX).is_err());
}
