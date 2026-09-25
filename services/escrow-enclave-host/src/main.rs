use axum::{Json, Router, http::StatusCode, routing::get};
use escrow_enclave_host::{
    Event, api,
    framing::{VsockEnclave, invalid},
    relay,
    services::{self, Boot, Services},
    storage::{AwsStore, SealedStore},
    supervisor::{self, NitroCli, Supervisor},
};
use serde_json::json;
use std::{
    env, io,
    sync::{Arc, atomic::Ordering},
    time::Duration,
};
use zeroize::Zeroizing;

fn required(key: &str) -> io::Result<String> {
    env::var(key)
        .ok()
        .filter(|v| !v.is_empty())
        .ok_or_else(invalid)
}
fn number(key: &str, default: u32) -> io::Result<u32> {
    env::var(key).map_or(Ok(default), |v| v.parse().map_err(|_| invalid()))
}
#[tokio::main]
async fn main() {
    // Do not install an SDK tracing subscriber: request/response diagnostics can contain secrets.
    if start().await.is_err() {
        Event::StartupFailed.log();
        std::process::exit(1);
    }
}
async fn start() -> io::Result<()> {
    if !cfg!(target_os = "linux") {
        return Err(invalid());
    }
    let cid = number("ESCROW_ENCLAVE_CID", 16)?;
    let cpus = number("ESCROW_ENCLAVE_CPU_COUNT", 2)?;
    let memory = number("ESCROW_ENCLAVE_MEMORY_MIB", 2048)?;
    if cid < 4 || cid == u32::MAX || cpus < 2 || memory < 512 {
        return Err(invalid());
    }
    let token = Zeroizing::new(if let Ok(path) = env::var("ESCROW_ENCLAVE_TOKEN_FILE") {
        tokio::fs::read_to_string(path).await?.trim().to_owned()
    } else {
        required("ESCROW_ENCLAVE_REMOTE_TOKEN")?
    });
    if token.len() < 32 || token.len() > 4096 {
        return Err(invalid());
    }
    let tls = axum_server::tls_rustls::RustlsConfig::from_pem_file(
        required("ESCROW_ENCLAVE_TLS_CERT")?,
        required("ESCROW_ENCLAVE_TLS_KEY")?,
    )
    .await?;
    let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .retry_config(aws_config::retry::RetryConfig::standard().with_max_attempts(1))
        .load()
        .await;
    let s3 = aws_sdk_s3::Client::new(&config);
    let boot = Arc::new(Boot {
        credentials: config.credentials_provider().ok_or_else(invalid)?,
        sealed: SealedStore {
            s3: s3.clone(),
            bucket: required("ESCROW_ARTIFACTS_BUCKET")?,
            key: required("ESCROW_SEALED_KEY_OBJECT")?,
        },
        key_id: required("ESCROW_KEY_ID")?,
        allow_first_boot: env::var("ESCROW_ALLOW_FIRST_BOOT").as_deref() == Ok("true"),
    });
    let store = Arc::new(AwsStore {
        db: aws_sdk_dynamodb::Client::new(&config),
        s3,
        records: required("ESCROW_LEDGER_RECORDS_TABLE")?,
        heads: required("ESCROW_LEDGER_HEADS_TABLE")?,
        audit_bucket: required("ESCROW_AUDIT_BUCKET")?,
    });
    let enclave = Arc::new(VsockEnclave { cid });
    let supervisor = Supervisor::new(
        Arc::new(NitroCli),
        enclave.clone(),
        cid,
        required("ESCROW_ENCLAVE_EIF_PATH")?,
        cpus,
        memory,
    );
    let ready = supervisor.ready.clone();
    let app = api::router(Arc::new(api::Api::new(
        &token,
        enclave,
        32,
        Duration::from_secs(10),
    )));
    let health = Router::new().route(
        "/health",
        get(move || {
            let ready = ready.clone();
            async move {
                let ok = ready.load(Ordering::Acquire);
                (
                    if ok {
                        StatusCode::OK
                    } else {
                        StatusCode::SERVICE_UNAVAILABLE
                    },
                    Json(json!({"ok":ok})),
                )
            }
        }),
    );
    let health_port =
        u16::try_from(number("ESCROW_ENCLAVE_HEALTH_PORT", 8444)?).map_err(|_| invalid())?;
    let tls_acceptor = axum_server::tls_rustls::RustlsAcceptor::new(tls)
        .acceptor(escrow_enclave_host::connections::BoundedAccept::new(128));
    let https =
        axum_server::bind(std::net::SocketAddr::from(([0, 0, 0, 0], 8443))).acceptor(tls_acceptor);
    let health_server = axum_server::bind(std::net::SocketAddr::from(([0, 0, 0, 0], health_port)))
        .acceptor(escrow_enclave_host::connections::BoundedAccept::new(16));
    let relay = if let Ok(config) = env::var("ESCROW_ROUGHTIME_ALLOWLIST_JSON") {
        relay::Relay::configured(serde_json::from_str(&config).map_err(|_| invalid())?)?
    } else {
        relay::Relay::default()
    };
    let services = Arc::new(Services {
        store,
        boot: boot.clone(),
    });
    tokio::select! {
        result=https.serve(app.into_make_service()) => result,
        result=health_server.serve(health.into_make_service()) => result,
        result=relay::listen(Arc::new(relay),cid) => result,
        result=services::listen(services,cid) => result,
        result=supervisor::run(supervisor) => result,
        _=tokio::signal::ctrl_c() => Ok(()),
    }
}
