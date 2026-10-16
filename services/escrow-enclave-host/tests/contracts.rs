use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode},
};
use base64::{Engine, engine::general_purpose::STANDARD};
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
mod authority {
    pub use escrow_enclave::authority::{intent, record};
}

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
    let vector: Value = serde_json::from_str(include_str!(
        "../../../packages/sss-key-manager/src/__fixtures__/escrow-enrollment-intent-v1.json"
    ))
    .unwrap();
    let record = json!({"version":1,"kind":"commit","keyId":"key-1","measurement":vec![0;32],"payload":"AQ==","signature":"AA=="});
    let mutation = json!({"envelope":envelope(),"receipt":record,"authorityGeneration":"g1","enrollmentVersion":8,"enrollmentEpoch":4});
    let mut snapshot_record = record.clone();
    snapshot_record["kind"] = json!("snapshot");
    let hold_snapshot = |warning: Option<u64>| {
        let mut receipt = snapshot_record.clone();
        receipt["payload"] = json!(
            STANDARD.encode(
                serde_json::to_vec(&json!([
                    "learncard-authority-hold-snapshot-v2",
                    "hold-1",
                    vec![7; 32],
                    "pending",
                    1_700_000_500_000u64,
                    warning,
                    "g1"
                ]))
                .unwrap()
            )
        );
        receipt["signature"] = json!(STANDARD.encode([0u8; 64]));
        receipt
    };
    let confirm_hold_request = json!({"envelope":envelope(),"hold":hold(),"requestId":"request-4","clientEphemeralPublicKey":"AA==","expectedDid":"did:example:alice","code":"123456"});
    let send_release_warning_request =
        json!({"holdId":"hold-1","requestId":"request-5","expectedDid":"did:example:alice"});
    let resend_code_request = json!({"envelope":envelope(),"hold":hold(),"requestId":"request-6","clientEphemeralPublicKey":"AA==","expectedDid":"did:example:alice"});
    vec![
        (
            "applyEnrollment",
            json!({"signedIntent":{"intent":vector["intent"],"signature":vector["signature"]},"sourceEnvelope":envelope(),"targetEnvelope":envelope()}),
            json!({"result":mutation}),
        ),
        (
            "authorityRewrap",
            json!({"envelope":envelope(),"expectedDid":"did:key:test","expectedShareVersion":1,"sourceEnrollmentEpoch":4}),
            json!({"result":mutation}),
        ),
        (
            "enrollmentState",
            json!({"expectedDid":"did:key:test","nonce":"00".repeat(32)}),
            json!({"state":{"tenant":"tenant","authorityGeneration":"g1","did":"did:key:test","enrollmentVersion":0,"enrollmentEpoch":0,"status":"empty","envelope":null,"shareVersion":null,"hasPin":false,"pinGeneration":0,"attemptsUsed":0},"proof":snapshot_record}),
        ),
        (
            "attest",
            json!({"nonce":[0,1,255]}),
            json!({"mode":"nitro","keyId":"key-1","previousKeyIds":[],"publicKey":"AA==","measurements":{},"document":"AA==","issuedAt":"2026-09-25T00:00:00Z"}),
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
        (
            "carryPinVerifier",
            json!({"sourceEnvelope":envelope(),"targetEnvelope":envelope(),"expectedDid":"did:example:alice","sourceShareVersion":1,"targetShareVersion":2,"sourceEnrollmentEpoch":1,"targetEnrollmentEpoch":2}),
            json!({"envelope":envelope()}),
        ),
        (
            "rewrapEscrowBlob",
            json!({"envelope":envelope(),"expectedDid":"did:example:alice","expectedShareVersion":1,"sourceEnrollmentEpoch":1}),
            json!({"envelope":envelope()}),
        ),
        // P9.1 (attack C): both carry an authoritative enclave timestamp that
        // the host DTO must preserve across reserialization, on both a fresh
        // commit and an idempotent retry snapshot (see wire.rs doc comments).
        (
            "confirmHold",
            confirm_hold_request.clone(),
            json!({"confirmed":true,"receipt":record,"confirmedHiMs":1_700_000_500_000u64}),
        ),
        (
            "confirmHold",
            confirm_hold_request,
            json!({"confirmed":true,"receipt":hold_snapshot(None),"confirmedHiMs":1_700_000_500_000u64}),
        ),
        (
            "sendReleaseWarning",
            send_release_warning_request.clone(),
            json!({"sent":true,"receipt":record,"releaseWarningSentHiMs":1_700_604_800_100u64}),
        ),
        (
            "sendReleaseWarning",
            send_release_warning_request,
            json!({"sent":true,"receipt":hold_snapshot(Some(1_700_604_800_100)),"releaseWarningSentHiMs":1_700_604_800_100u64}),
        ),
        (
            "resendCode",
            resend_code_request,
            json!({"sent":true,"receipt":record}),
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
        "applyEnrollment" => "/v1/apply-enrollment",
        "authorityRewrap" => "/v1/authority-rewrap",
        "enrollmentState" => "/v1/enrollment-state",
        "attest" => "/v1/attest",
        "verifyBlob" => "/v1/verify-blob",
        "carryPinVerifier" => "/v1/carry-pin-verifier",
        "rewrapEscrowBlob" => "/v1/rewrap-escrow-blob",
        "createHold" => "/v1/create-hold",
        "release" => "/v1/release",
        "confirmHold" => "/v1/confirm-hold",
        "resendCode" => "/v1/resend-code",
        "sendReleaseWarning" => "/v1/send-release-warning",
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
    let (_, mut body, response) = fixtures()
        .into_iter()
        .find(|(method, _, _)| *method == "createHold")
        .unwrap();
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

// Builds the real enclave `wire::v1::Response` variants directly (not JSON
// literals), so a future field change on the enclave side fails to compile
// here rather than silently drifting from the host DTO. Covers both the
// fresh-commit and idempotent-retry-snapshot receipt shapes for both
// endpoints, and asserts the HTTP JSON body preserves the authoritative
// timestamp, returns 200, and never leaks the `method` discriminator.
#[tokio::test]
async fn confirm_hold_and_send_release_warning_preserve_authoritative_timestamps() {
    use authority::record::{RecordKind, SignedAuthorityRecord};

    fn receipt(kind: RecordKind) -> SignedAuthorityRecord {
        SignedAuthorityRecord {
            version: 1,
            kind,
            key_id: "key-1".into(),
            measurement: [0; 32],
            payload: "AQ==".into(),
            signature: "AA==".into(),
        }
    }

    let confirm_hold_body = json!({"envelope":envelope(),"hold":hold(),"requestId":"request-4","clientEphemeralPublicKey":"AA==","expectedDid":"did:example:alice","code":"123456"});
    for (kind, confirmed_hi_ms) in [
        (RecordKind::Commit, 1_700_000_500_000u64),
        (RecordKind::Snapshot, 1_700_000_500_000u64),
    ] {
        let reply = serde_json::to_value(enclave_wire::v1::Response::ConfirmHold {
            confirmed: true,
            receipt: receipt(kind),
            confirmed_hi_ms,
        })
        .unwrap();
        let fake = Arc::new(Fake {
            reply,
            seen: Default::default(),
        });
        let (status, body) = call(
            fake,
            "/v1/confirm-hold",
            serde_json::to_vec(&confirm_hold_body).unwrap(),
            Some(&format!("Bearer {TOKEN}")),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{body}");
        assert_eq!(body["confirmed"], json!(true));
        assert_eq!(body["confirmedHiMs"], json!(confirmed_hi_ms));
        assert!(!body.as_object().unwrap().contains_key("method"));
    }

    let send_release_warning_body =
        json!({"holdId":"hold-1","requestId":"request-5","expectedDid":"did:example:alice"});
    for (kind, release_warning_sent_hi_ms) in [
        (RecordKind::Commit, 1_700_604_800_100u64),
        (RecordKind::Snapshot, 1_700_604_800_100u64),
    ] {
        let reply = serde_json::to_value(enclave_wire::v1::Response::SendReleaseWarning {
            sent: true,
            receipt: receipt(kind),
            release_warning_sent_hi_ms,
        })
        .unwrap();
        let fake = Arc::new(Fake {
            reply,
            seen: Default::default(),
        });
        let (status, body) = call(
            fake,
            "/v1/send-release-warning",
            serde_json::to_vec(&send_release_warning_body).unwrap(),
            Some(&format!("Bearer {TOKEN}")),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{body}");
        assert_eq!(body["sent"], json!(true));
        assert_eq!(
            body["releaseWarningSentHiMs"],
            json!(release_warning_sent_hi_ms)
        );
        assert!(!body.as_object().unwrap().contains_key("method"));
    }
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
