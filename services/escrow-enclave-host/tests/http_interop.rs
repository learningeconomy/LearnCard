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
