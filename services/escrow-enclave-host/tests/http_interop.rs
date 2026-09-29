use axum::{
    Router,
    body::{Body, to_bytes},
    http::{Request, StatusCode},
};
use escrow_enclave::{
    crypto::{self, EscrowBlobPlaintext},
    ledger::FakeHeadStore,
    nsm::FakeNsm,
    policy::{CurrentEnrollment, HOLD_DURATION_MS, Policy},
    server::{
        self, Listener, Service,
        emulate::{Clock, Enrollments},
    },
    wire::{AttestationMode, EscrowEnvelope},
};
use escrow_enclave_host::{
    api::{self, Api},
    framing::{self, Enclave, MAX_FRAME},
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{
    io,
    net::SocketAddr,
    sync::{
        Arc,
        atomic::{AtomicU64, Ordering},
    },
    time::Duration,
};
use tokio::net::{TcpListener, TcpStream};
use tower::ServiceExt;

struct TcpEnclave(SocketAddr);
#[async_trait::async_trait]
impl Enclave for TcpEnclave {
    async fn exchange(&self, request: Vec<u8>) -> io::Result<Vec<u8>> {
        let mut stream = TcpStream::connect(self.0).await?;
        framing::write(&mut stream, &request, MAX_FRAME).await?;
        framing::read(&mut stream, MAX_FRAME).await
    }
}
async fn call(router: &Router, path: &str, body: Value) -> (StatusCode, Value) {
    let response = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(path)
                .header("authorization", "Bearer interop-test-token-00000000000000")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let body = to_bytes(response.into_body(), MAX_FRAME).await.unwrap();
    (status, serde_json::from_slice(&body).unwrap())
}
// Abort on assertion failure too: never leave the enclave actor running.
struct Running(tokio::task::JoinHandle<()>);
impl Drop for Running {
    fn drop(&mut self) {
        self.0.abort();
    }
}

#[tokio::test]
async fn host_http_to_real_enclave_framed_lifecycle() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
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
            blob_hash: Sha256::digest(serde_json::to_vec(&envelope).unwrap()).into(),
        },
    );
    let server_clock = clock.clone();
    let _running = Running(tokio::spawn(async move {
        let nsm = FakeNsm::new(1_700_000_000_000, [[1; 48], [2; 48], [3; 48]]).unwrap();
        let store = FakeHeadStore::default();
        let policy = Policy::new(
            keys,
            "emulate".into(),
            Vec::new(),
            "emulate".into(),
            server::measurement(&nsm).unwrap(),
            &store,
            &*server_clock,
            &authority,
        )
        .unwrap();
        server::serve(
            Service {
                policy,
                nsm: &nsm,
                key_id: "emulate".into(),
                public_key,
                mode: AttestationMode::Software,
            },
            Listener::Tcp(listener),
            None,
            String::new(),
        )
        .await
        .unwrap();
    }));
    let router = api::router(Arc::new(Api::new(
        "interop-test-token-00000000000000",
        Arc::new(TcpEnclave(address)),
        32,
        Duration::from_secs(10),
    )));
    let (status, attestation) = call(&router, "/v1/attest", json!({"nonce":[1,2,3]})).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(attestation["mode"], "software");
    let (status, verify) = call(
        &router,
        "/v1/verify-blob",
        json!({"envelope":envelope,"expectedDid":"did:key:test","expectedShareVersion":1}),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(verify, json!({"ok":true,"hasPin":true}));
    let (status, err) = call(
        &router,
        "/v1/verify-blob",
        json!({"envelope":envelope,"expectedDid":"did:key:test","expectedShareVersion":0}),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(err["code"], "blob");

    // P8.2/P8.3: carry_pin_verifier through the real HTTP router -> framed
    // vsock -> real enclave policy. It needs no `EnrollmentSource`/trusted
    // time (unlike every other mutation above/below), but P8.3 does read the
    // source epoch's ledger chain (empty here: this DID never made a PIN
    // attempt), so `sourceEnrollmentEpoch` must be a valid, bounded epoch.
    let carry_public_key = attestation["publicKey"].as_str().unwrap();
    let carry_key_id = attestation["keyId"].as_str().unwrap();
    let carry_source = crypto::encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ab".repeat(33),
            did: "did:key:carry".into(),
            share_version: 5.0,
            pin_verifier: Some("ef".repeat(32)),
            pin_attempts_floor: None,
        },
        carry_public_key,
        carry_key_id,
    )
    .unwrap();
    let carry_target = crypto::encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "cd".repeat(33),
            did: "did:key:carry".into(),
            share_version: 6.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        carry_public_key,
        carry_key_id,
    )
    .unwrap();
    let (status, carried) = call(
        &router,
        "/v1/carry-pin-verifier",
        json!({
            "sourceEnvelope": carry_source,
            "targetEnvelope": carry_target,
            "expectedDid": "did:key:carry",
            "sourceShareVersion": 5,
            "targetShareVersion": 6,
            "sourceEnrollmentEpoch": 1,
        }),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let carried_envelope: EscrowEnvelope =
        serde_json::from_value(carried["envelope"].clone()).unwrap();
    assert_ne!(carried_envelope.ciphertext, carry_target.ciphertext);
    let (status, verified) = call(
        &router,
        "/v1/verify-blob",
        json!({"envelope":carried_envelope,"expectedDid":"did:key:carry","expectedShareVersion":6}),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(verified, json!({"ok":true,"hasPin":true}));
    let (status, rejected) = call(
        &router,
        "/v1/carry-pin-verifier",
        json!({
            "sourceEnvelope": carry_source,
            "targetEnvelope": carry_target,
            "expectedDid": "did:key:wrong",
            "sourceShareVersion": 5,
            "targetShareVersion": 6,
            "sourceEnrollmentEpoch": 1,
        }),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(rejected["code"], "blob");

    let client = crypto::generate_escrow_key_pair().unwrap();
    for (id, policy) in [("pin", "pin"), ("cancel", "pin"), ("delay", "hold")] {
        let (status,hold) = call(&router,"/v1/create-hold",json!({"envelope":envelope,"holdId":id,"expectedDid":"did:key:test","expectedShareVersion":1,"enrollmentEpoch":1,"releasePolicy":policy,"clientEphemeralPublicKey":client.public_key})).await;
        assert_eq!(status, StatusCode::OK, "{hold}");
        assert_eq!(hold["holdDurationMs"], HOLD_DURATION_MS);
        assert!(hold["hold"]["signature"].is_string());
        let mut release = json!({"envelope":envelope,"hold":hold,"expectedDid":"did:key:test","clientEphemeralPublicKey":client.public_key});
        if id == "cancel" {
            let (status, result) = call(&router, "/v1/cancel-hold", release.clone()).await;
            assert_eq!(status, StatusCode::OK);
            assert_eq!(result, json!({"ok":true}));
            release["pinProof"] = json!("ab".repeat(32));
        } else if policy == "pin" {
            release["pinProof"] = json!("cd".repeat(32));
            let (status, error) = call(&router, "/v1/release", release.clone()).await;
            assert_eq!(status, StatusCode::UNAUTHORIZED);
            assert_eq!(error["code"], "pinMismatch");
            release["pinProof"] = json!("ab".repeat(32));
        } else {
            let (status, error) = call(&router, "/v1/release", release.clone()).await;
            assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
            assert_eq!(error["code"], "time");
            clock.0.fetch_add(HOLD_DURATION_MS, Ordering::SeqCst);
        }
        let (status, result) = call(&router, "/v1/release", release.clone()).await;
        if id == "cancel" {
            assert_eq!(status, StatusCode::FORBIDDEN);
            assert_eq!(result["code"], "policy");
        } else {
            assert_eq!(status, StatusCode::OK, "{result}");
            let sealed: EscrowEnvelope = serde_json::from_value(result["sealed"].clone()).unwrap();
            let opened = crypto::open_escrow_release(&sealed, &client.private_key).unwrap();
            assert_eq!(opened.blob.recovery_share, "ab".repeat(33));
            assert!(opened.blob.pin_verifier.is_none());
            let (status, error) = call(&router, "/v1/release", release).await;
            assert_eq!(status, StatusCode::FORBIDDEN);
            assert_eq!(error["code"], "policy");
        }
    }
}

// P9.3: rewrap_escrow_blob through the real HTTP router -> framed vsock ->
// real enclave policy, with an actual previous key configured (unlike the
// lifecycle test above, which boots with none). Migrates a previous-key
// blob onto the current key, the result still verifies under the current
// key, and a second rewrap of the (now current-key) result is refused.
#[tokio::test]
async fn host_http_rewrap_escrow_blob_through_real_enclave() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let clock = Arc::new(Clock(AtomicU64::new(1_700_000_000_000)));
    let keys = crypto::generate_escrow_key_pair().unwrap();
    let previous = crypto::generate_escrow_key_pair().unwrap();
    let previous_public_key = previous.public_key.clone();
    let envelope = crypto::encrypt_escrow_blob(
        &EscrowBlobPlaintext {
            version: 1,
            recovery_share: "ab".repeat(33),
            did: "did:key:rewrap".into(),
            share_version: 1.0,
            pin_verifier: None,
            pin_attempts_floor: None,
        },
        &previous_public_key,
        "previous-1",
    )
    .unwrap();
    let authority = Enrollments::default();
    authority.0.lock().unwrap().insert(
        "did:key:rewrap".into(),
        CurrentEnrollment {
            epoch: 1,
            share_version: 1,
            blob_hash: Sha256::digest(serde_json::to_vec(&envelope).unwrap()).into(),
        },
    );
    let server_clock = clock.clone();
    let _running = Running(tokio::spawn(async move {
        let nsm = FakeNsm::new(1_700_000_000_000, [[1; 48], [2; 48], [3; 48]]).unwrap();
        let store = FakeHeadStore::default();
        let policy = Policy::new(
            keys,
            "emulate".into(),
            vec![("previous-1".into(), previous)],
            "emulate".into(),
            server::measurement(&nsm).unwrap(),
            &store,
            &*server_clock,
            &authority,
        )
        .unwrap();
        server::serve(
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
    }));
    let router = api::router(Arc::new(Api::new(
        "interop-test-token-00000000000000",
        Arc::new(TcpEnclave(address)),
        32,
        Duration::from_secs(10),
    )));
    let (status, rewrapped) = call(
        &router,
        "/v1/rewrap-escrow-blob",
        json!({
            "envelope": envelope,
            "expectedDid": "did:key:rewrap",
            "expectedShareVersion": 1,
            "sourceEnrollmentEpoch": 1,
        }),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{rewrapped}");
    let rewrapped_envelope: EscrowEnvelope =
        serde_json::from_value(rewrapped["envelope"].clone()).unwrap();
    assert_eq!(rewrapped_envelope.key_id, "emulate");
    assert_ne!(rewrapped_envelope.ciphertext, envelope.ciphertext);
    let (status, verified) = call(
        &router,
        "/v1/verify-blob",
        json!({"envelope":rewrapped_envelope,"expectedDid":"did:key:rewrap","expectedShareVersion":1}),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(verified, json!({"ok":true,"hasPin":false}));
    let (status, refused) = call(
        &router,
        "/v1/rewrap-escrow-blob",
        json!({
            "envelope": rewrapped_envelope,
            "expectedDid": "did:key:rewrap",
            "expectedShareVersion": 1,
            "sourceEnrollmentEpoch": 1,
        }),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(refused["code"], "blob");
}
