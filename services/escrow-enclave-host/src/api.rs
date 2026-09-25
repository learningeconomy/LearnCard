use crate::{
    framing::{Enclave, MAX_FRAME},
    wire,
};
use axum::{
    Json, Router,
    body::to_bytes,
    extract::{Request, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{sync::Arc, time::Duration};
use subtle::ConstantTimeEq;
use tokio::sync::Semaphore;

pub struct Api {
    token_hash: [u8; 32],
    enclave: Arc<dyn Enclave>,
    permits: Semaphore,
    timeout: Duration,
}
impl Api {
    pub fn new(
        token: &str,
        enclave: Arc<dyn Enclave>,
        concurrency: usize,
        timeout: Duration,
    ) -> Self {
        Self {
            token_hash: Sha256::digest(token.as_bytes()).into(),
            enclave,
            permits: Semaphore::new(concurrency),
            timeout,
        }
    }
    fn authorized(&self, request: &Request) -> bool {
        let Some(token) = request
            .headers()
            .get("authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
        else {
            return false;
        };
        self.token_hash
            .ct_eq(&Sha256::digest(token.as_bytes()))
            .into()
    }
}
pub fn router(api: Arc<Api>) -> Router {
    Router::new()
        .route("/v1/attest", post(handle))
        .route("/v1/verify-blob", post(handle))
        .route("/v1/release", post(handle))
        .route("/v1/create-hold", post(handle))
        .route("/v1/cancel-hold", post(handle))
        .with_state(api)
}
fn error(status: StatusCode, code: wire::ErrorCode) -> Response {
    (
        status,
        Json(json!({"code": code, "message": "Request refused."})),
    )
        .into_response()
}
async fn handle(State(api): State<Arc<Api>>, request: Request) -> Response {
    if !api.authorized(&request) {
        return error(StatusCode::UNAUTHORIZED, wire::ErrorCode::Policy);
    }
    let Ok(_permit) = api.permits.try_acquire() else {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            wire::ErrorCode::Unavailable,
        );
    };
    match tokio::time::timeout(api.timeout, forward(&api, request)).await {
        Ok(response) => response,
        Err(_) => error(
            StatusCode::SERVICE_UNAVAILABLE,
            wire::ErrorCode::Unavailable,
        ),
    }
}
async fn forward(api: &Api, request: Request) -> Response {
    let method = match request.uri().path() {
        "/v1/attest" => "attest",
        "/v1/verify-blob" => "verifyBlob",
        "/v1/release" => "release",
        "/v1/create-hold" => "createHold",
        "/v1/cancel-hold" => "cancel",
        _ => return error(StatusCode::NOT_FOUND, wire::ErrorCode::Policy),
    };
    let body = match to_bytes(request.into_body(), MAX_FRAME).await {
        Ok(b) => b,
        Err(_) => return error(StatusCode::PAYLOAD_TOO_LARGE, wire::ErrorCode::Blob),
    };
    let Ok(Value::Object(mut value)) = serde_json::from_slice(&body) else {
        return error(StatusCode::BAD_REQUEST, wire::ErrorCode::Blob);
    };
    if value.contains_key("method") {
        return error(StatusCode::BAD_REQUEST, wire::ErrorCode::Blob);
    }
    value.insert("method".into(), json!(method));
    // P4.2 HTTP omits IDs. A fresh random operation ID spends a fresh attempt;
    // never hash a PIN proof into a public ID or retry a mutation automatically.
    if matches!(method, "createHold" | "release" | "cancel") && !value.contains_key("requestId") {
        value.insert("requestId".into(), json!(uuid::Uuid::new_v4().to_string()));
    }
    let Ok(dto) = serde_json::from_value::<wire::Request>(Value::Object(value)) else {
        return error(StatusCode::BAD_REQUEST, wire::ErrorCode::Blob);
    };
    let Ok(bytes) = serde_json::to_vec(&dto) else {
        return error(StatusCode::BAD_REQUEST, wire::ErrorCode::Blob);
    };
    if bytes.len() > MAX_FRAME {
        return error(StatusCode::PAYLOAD_TOO_LARGE, wire::ErrorCode::Blob);
    }
    let Ok(bytes) = api.enclave.exchange(bytes).await else {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            wire::ErrorCode::Unavailable,
        );
    };
    if bytes.len() > MAX_FRAME {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            wire::ErrorCode::Unavailable,
        );
    }
    let Ok(dto) = serde_json::from_slice::<wire::Response>(&bytes) else {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            wire::ErrorCode::Unavailable,
        );
    };
    if let wire::Response::Error { code, .. } = dto {
        let status = match code {
            wire::ErrorCode::Policy => StatusCode::FORBIDDEN,
            wire::ErrorCode::PinMismatch => StatusCode::UNAUTHORIZED,
            wire::ErrorCode::Blob => StatusCode::BAD_REQUEST,
            _ => StatusCode::SERVICE_UNAVAILABLE,
        };
        return error(status, code);
    }
    let Ok(Value::Object(mut value)) = serde_json::to_value(dto) else {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            wire::ErrorCode::Unavailable,
        );
    };
    if value.remove("method") != Some(json!(method)) {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            wire::ErrorCode::Unavailable,
        );
    }
    // Never forward arbitrary diagnostic strings from the untrusted transport.
    if value.contains_key("reason") {
        value.insert("reason".into(), json!("Invalid escrow payload."));
    }
    if method == "createHold" {
        return Json(value.remove("hold").unwrap_or(Value::Null)).into_response();
    }
    if method == "cancel" {
        return if value.get("cancelled") == Some(&json!(true)) {
            Json(json!({"ok":true})).into_response()
        } else {
            error(StatusCode::FORBIDDEN, wire::ErrorCode::Policy)
        };
    }
    Json(value).into_response()
}
