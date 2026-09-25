use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode},
};
use escrow_enclave_host::{
    Event,
    api::{self, Api},
    framing::{self, Enclave, MAX_FRAME},
    wire,
};
use serde_json::{Value, json};
use std::{io, sync::Arc, time::Duration};
use tower::ServiceExt;

// Test-only source inclusion, NOT a Cargo path dependency or a production linkage.
#[allow(dead_code)]
#[rustfmt::skip]
#[path = "../../escrow-enclave-app/src/wire.rs"]
mod enclave_wire;

// wire::v1 references this policy wrapper; production policy is not linked.
mod policy {
    #[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
    #[serde(rename_all = "camelCase", deny_unknown_fields)]
    pub struct SignedHoldRecord {
        pub hold: super::enclave_wire::HoldRecord,
        pub hold_duration_ms: u64,
        pub ledger_seq: u64,
    }
}

const TOKEN: &str = "test-only-bearer-token-000000000000";
fn envelope() -> Value {
    json!({"version":1,"algorithm":"P-256-HKDF-SHA256-AES-256-GCM","keyId":"key-1","ephemeralPublicKey":"BA==","salt":"AA==","iv":"AA==","ciphertext":"AA=="})
}
fn hold() -> Value {
    json!({"hold":{"holdId":"hold-1","did":"did:example:alice","shareVersion":1,"blobHash":"00","enrollmentEpoch":1,"releasePolicy":"hold","clientEphemeralPublicKey":"AA==","createdLo":1700000000000u64,"createdHi":1700000000100u64,"policyVersion":1,"signature":"AA=="},"holdDurationMs":604800000,"ledgerSeq":0})
}
fn fixtures() -> Vec<(&'static str, Value, Value)> {
    vec![
        (
            "attest",
            json!({"nonce":[0,1,255]}),
            json!({"mode":"nitro","keyId":"key-1","publicKey":"AA==","measurements":{},"document":"AA==","issuedAt":"2026-09-25T00:00:00Z"}),
        ),
        (
            "verifyBlob",
            json!({"envelope":envelope(),"expectedDid":"did:example:alice","expectedShareVersion":1}),
            json!({"ok":true,"hasPin":false}),
        ),
        (
            "createHold",
            json!({"envelope":envelope(),"holdId":"hold-1","requestId":"request-1","expectedDid":"did:example:alice","expectedShareVersion":1,"enrollmentEpoch":1,"releasePolicy":"pin","clientEphemeralPublicKey":"AA=="}),
            json!({"hold":hold()}),
        ),
        (
            "release",
            json!({"envelope":envelope(),"hold":hold(),"requestId":"request-2","clientEphemeralPublicKey":"AA==","expectedDid":"did:example:alice","pinProof":"00"}),
            json!({"sealed":envelope()}),
        ),
        (
            "cancel",
            json!({"envelope":envelope(),"hold":hold(),"requestId":"request-3","clientEphemeralPublicKey":"AA==","expectedDid":"did:example:alice"}),
            json!({"cancelled":true}),
        ),
    ]
}
#[test]
fn json_golden_fixtures_match_enclave_dtos() {
    for (method, mut request, mut response) in fixtures() {
        request["method"] = json!(method);
        response["method"] = json!(method);
        let host: wire::Request = serde_json::from_value(request.clone()).unwrap();
        let enclave: enclave_wire::v1::Request = serde_json::from_value(request.clone()).unwrap();
        assert_eq!(serde_json::to_value(host).unwrap(), request);
        assert_eq!(serde_json::to_value(enclave).unwrap(), request);
        let host: wire::Response = serde_json::from_value(response.clone()).unwrap();
        let enclave: enclave_wire::v1::Response = serde_json::from_value(response.clone()).unwrap();
        assert_eq!(serde_json::to_value(host).unwrap(), response);
        assert_eq!(serde_json::to_value(enclave).unwrap(), response);
    }
}
struct Fake {
    reply: Value,
    seen: tokio::sync::Mutex<Vec<Value>>,
}
#[async_trait::async_trait]
impl Enclave for Fake {
    async fn exchange(&self, bytes: Vec<u8>) -> io::Result<Vec<u8>> {
        // Exercise the actual framing in both directions, not just a JSON-only fake.
        let (mut host, mut enclave) = tokio::io::duplex(MAX_FRAME * 2);
        framing::write(&mut host, &bytes, MAX_FRAME).await?;
        let bytes = framing::read(&mut enclave, MAX_FRAME).await?;
        self.seen
            .lock()
            .await
            .push(serde_json::from_slice(&bytes).unwrap());
        framing::write(
            &mut enclave,
            &serde_json::to_vec(&self.reply).unwrap(),
            MAX_FRAME,
        )
        .await?;
        framing::read(&mut host, MAX_FRAME).await
    }
}
fn path(method: &str) -> &str {
    match method {
        "attest" => "/v1/attest",
        "verifyBlob" => "/v1/verify-blob",
        "createHold" => "/v1/create-hold",
        "release" => "/v1/release",
        _ => "/v1/cancel-hold",
    }
}
async fn call(
    fake: Arc<Fake>,
    path: &str,
    body: Vec<u8>,
    token: Option<&str>,
) -> (StatusCode, Value) {
    let router = api::router(Arc::new(Api::new(TOKEN, fake, 2, Duration::from_secs(1))));
    let mut req = Request::builder()
        .method("POST")
        .uri(path)
        .header("content-type", "application/json");
    if let Some(token) = token {
        req = req.header("authorization", token);
    }
    let response = router
        .oneshot(req.body(Body::from(body)).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let bytes = to_bytes(response.into_body(), MAX_FRAME).await.unwrap();
    (status, serde_json::from_slice(&bytes).unwrap())
}
#[tokio::test]
async fn auth_and_every_endpoint_translate_exactly_once() {
    for (method, body, response) in fixtures() {
        let mut tagged = response.clone();
        tagged["method"] = json!(method);
        let fake = Arc::new(Fake {
            reply: tagged,
            seen: Default::default(),
        });
        for token in [None, Some("Bearer wrong")] {
            let (status, _) = call(
                fake.clone(),
                path(method),
                serde_json::to_vec(&body).unwrap(),
                token,
            )
            .await;
            assert_eq!(status, StatusCode::UNAUTHORIZED);
        }
        assert!(fake.seen.lock().await.is_empty());
        let (status, reply) = call(
            fake.clone(),
            path(method),
            serde_json::to_vec(&body).unwrap(),
            Some(&format!("Bearer {TOKEN}")),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        let http_response = match method {
            "createHold" => response["hold"].clone(),
            "cancel" => json!({"ok":true}),
            _ => response,
        };
        assert_eq!(reply, http_response);
        let mut expected = body;
        expected["method"] = json!(method);
        assert_eq!(*fake.seen.lock().await, vec![expected]);
    }
}
#[tokio::test]
async fn errors_are_sanitized_and_oversized_bodies_never_forward() {
    for code in [
        "policy",
        "pinMismatch",
        "blob",
        "unavailable",
        "ledger",
        "time",
    ] {
        let fake = Arc::new(Fake {
            reply: json!({"method":"error","code":code,"message":"did:example:secret PIN proof token sealed blob"}),
            seen: Default::default(),
        });
        let (status, body) = call(
            fake.clone(),
            "/v1/attest",
            br#"{"nonce":[]}"#.to_vec(),
            Some(&format!("Bearer {TOKEN}")),
        )
        .await;
        assert!(!status.is_success());
        assert_eq!(body, json!({"code":code,"message":"Request refused."}));
        let (status, _) = call(
            fake.clone(),
            "/v1/attest",
            vec![b' '; MAX_FRAME + 1],
            Some(&format!("Bearer {TOKEN}")),
        )
        .await;
        assert_eq!(status, StatusCode::PAYLOAD_TOO_LARGE);
        assert_eq!(fake.seen.lock().await.len(), 1);
    }
}
#[tokio::test]
async fn rejects_frame_lengths_before_allocating() {
    use tokio::io::AsyncWriteExt;
    for len in [0, u32::MAX, MAX_FRAME as u32 + 1] {
        let (mut writer, mut reader) = tokio::io::duplex(4);
        writer.write_u32(len).await.unwrap();
        assert!(framing::read(&mut reader, MAX_FRAME).await.is_err());
    }
}
#[test]
fn no_pii_logging_surface() {
    for event in [
        Event::AuditUnavailable,
        Event::SupervisorUnavailable,
        Event::StartupFailed,
    ] {
        assert!(
            event
                .message()
                .bytes()
                .all(|b| b.is_ascii_lowercase() || b == b'_')
        );
    }
    // Single log sink, statically typed event; no SDK tracing subscriber or DTO Debug impls.
    for source in [
        include_str!("../src/api.rs"),
        include_str!("../src/storage.rs"),
        include_str!("../src/services.rs"),
        include_str!("../src/supervisor.rs"),
        include_str!("../src/relay.rs"),
    ] {
        for forbidden in ["println!", "dbg!", "tracing::", "log::"] {
            assert!(!source.contains(forbidden));
        }
    }
}

#[tokio::test]
async fn p42_missing_id_is_randomized_without_losing_signed_fields() {
    let (_, mut body, response) = fixtures().remove(2);
    body.as_object_mut().unwrap().remove("requestId");
    let mut tagged = response;
    tagged["method"] = json!("createHold");
    let fake = Arc::new(Fake {
        reply: tagged,
        seen: Default::default(),
    });
    for _ in 0..2 {
        let (status, hold) = call(
            fake.clone(),
            "/v1/create-hold",
            serde_json::to_vec(&body).unwrap(),
            Some(&format!("Bearer {TOKEN}")),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(hold["holdDurationMs"], 604800000);
    }
    let seen = fake.seen.lock().await;
    let first = seen[0]["requestId"].as_str().unwrap();
    let second = seen[1]["requestId"].as_str().unwrap();
    assert!(uuid::Uuid::parse_str(first).is_ok());
    assert_ne!(first, second);
}

struct Blocked {
    entered: tokio::sync::Notify,
}
#[async_trait::async_trait]
impl Enclave for Blocked {
    async fn exchange(&self, _: Vec<u8>) -> io::Result<Vec<u8>> {
        self.entered.notify_one();
        std::future::pending().await
    }
}
#[tokio::test]
async fn saturation_and_timeout_fail_closed_without_retries() {
    let fake = Arc::new(Blocked {
        entered: tokio::sync::Notify::new(),
    });
    let router = api::router(Arc::new(Api::new(
        TOKEN,
        fake.clone(),
        1,
        Duration::from_millis(100),
    )));
    let request = || {
        Request::builder()
            .method("POST")
            .uri("/v1/attest")
            .header("authorization", format!("Bearer {TOKEN}"))
            .body(Body::from(r#"{"nonce":[]}"#))
            .unwrap()
    };
    let first = tokio::spawn(router.clone().oneshot(request()));
    fake.entered.notified().await;
    assert_eq!(
        router.oneshot(request()).await.unwrap().status(),
        StatusCode::SERVICE_UNAVAILABLE
    );
    assert_eq!(
        first.await.unwrap().unwrap().status(),
        StatusCode::SERVICE_UNAVAILABLE
    );
}
