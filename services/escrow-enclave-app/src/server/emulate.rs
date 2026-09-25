//! Explicitly host-trusted local drivers; not compiled into production builds.
use super::*;
use crate::{
    kms::{unseal_or_generate_escrow_key, FakeKmsClient, RecipientKey},
    ledger::FakeHeadStore,
    nsm::FakeNsm,
    policy::{CurrentEnrollment, EnrollmentFuture, EnrollmentSource},
    time::{SourceEvidence, TimeError, TimeEvidence, TimeFuture, TimeSource, TrustedInterval},
};
use std::{
    collections::BTreeMap,
    net::SocketAddr,
    sync::atomic::{AtomicU64, Ordering},
    time::SystemTime,
};

pub struct Clock(pub AtomicU64);
impl TimeSource for Clock {
    fn now(&self, floor: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async move {
            let now = self.0.load(Ordering::SeqCst);
            if floor.is_some_and(|floor| floor > now) {
                return Err(TimeError::Rollback);
            }
            Ok(TimeEvidence {
                interval: TrustedInterval {
                    lo_ms: now,
                    hi_ms: now,
                },
                sources: ["fake-a", "fake-b"]
                    .into_iter()
                    .map(|id| SourceEvidence {
                        server_id: id.into(),
                        midpoint_ms: now,
                        radius_ms: 0,
                        response_hash: [1; 32],
                    })
                    .collect(),
            })
        })
    }
}

/// Only explicit test fixtures may register enrollment; never trusts createHold.
#[derive(Default)]
pub struct Enrollments(pub std::sync::Mutex<BTreeMap<String, CurrentEnrollment>>);
impl EnrollmentSource for Enrollments {
    fn current<'a>(&'a self, tenant: &'a str, did: &'a str) -> EnrollmentFuture<'a> {
        Box::pin(async move {
            if tenant != "emulate" {
                return Err(ErrorCode::Policy);
            }
            self.0
                .lock()
                .map_err(|_| ErrorCode::Unavailable)?
                .get(did)
                .cloned()
                .ok_or(ErrorCode::Unavailable)
        })
    }
}

fn wall_time() -> io::Result<u64> {
    u64::try_from(
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .map_err(|_| unavailable())?
            .as_millis(),
    )
    .map_err(|_| unavailable())
}

struct LiveFakeNsm;
impl NsmDriver for LiveFakeNsm {
    fn attest(&self, request: AttestationRequest) -> Result<Vec<u8>, crate::nsm::NsmError> {
        request.validate()?;
        FakeNsm::new(
            wall_time().map_err(|_| crate::nsm::NsmError::Unavailable)?,
            [[1; 48], [2; 48], [3; 48]],
        )?
        .attest(request)
    }
}

// An explicit local fixture file, never supplied via a production request.
// Re-read under the serialized policy actor so developers can rotate test data.
#[derive(serde::Deserialize, Default)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Fixture {
    #[serde(default)]
    now_ms: Option<u64>,
    #[serde(default)]
    enrollments: BTreeMap<String, Entry>,
}
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Entry {
    epoch: u64,
    share_version: u32,
    blob_hash: String,
}
struct FixtureSource(Option<String>);
impl FixtureSource {
    fn load(&self) -> io::Result<Fixture> {
        use std::io::Read;
        let Some(path) = &self.0 else {
            return Ok(Fixture::default());
        };
        let file = std::fs::File::open(path)?;
        if !file.metadata()?.is_file() {
            return Err(invalid());
        }
        let mut bytes = Vec::new();
        file.take(65_537).read_to_end(&mut bytes)?;
        if bytes.len() > 65_536 {
            return Err(invalid());
        }
        serde_json::from_slice(&bytes).map_err(|_| invalid())
    }
}
impl EnrollmentSource for FixtureSource {
    fn current<'a>(&'a self, tenant: &'a str, did: &'a str) -> EnrollmentFuture<'a> {
        Box::pin(async move {
            if tenant != "emulate" {
                return Err(ErrorCode::Policy);
            }
            let fixture = self.load().map_err(|_| ErrorCode::Unavailable)?;
            let entry = fixture.enrollments.get(did).ok_or(ErrorCode::Unavailable)?;
            let mut blob_hash = [0; 32];
            hex::decode_to_slice(&entry.blob_hash, &mut blob_hash)
                .map_err(|_| ErrorCode::Policy)?;
            Ok(CurrentEnrollment {
                epoch: entry.epoch,
                share_version: entry.share_version,
                blob_hash,
            })
        })
    }
}
impl TimeSource for FixtureSource {
    fn now(&self, floor: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async move {
            let fixture = self.load().map_err(|_| TimeError::Unavailable)?;
            let now = match fixture.now_ms {
                Some(now) => now,
                None => wall_time().map_err(|_| TimeError::Unavailable)?,
            };
            Clock(AtomicU64::new(now)).now(floor).await
        })
    }
}

pub(super) async fn run(address: SocketAddr, http_address: Option<SocketAddr>) -> io::Result<()> {
    if !address.ip().is_loopback() || http_address.is_some_and(|a| !a.ip().is_loopback()) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Emulation binds loopback only",
        ));
    }
    let token = if http_address.is_some() {
        std::env::var("ESCROW_ENCLAVE_EMULATE_TOKEN")
            .ok()
            .filter(|s| !s.is_empty() && s.len() <= 1024)
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::InvalidInput,
                    "Set ESCROW_ENCLAVE_EMULATE_TOKEN",
                )
            })?
    } else {
        String::new()
    };
    let nsm = LiveFakeNsm;
    let recipient = RecipientKey::generate().map_err(|_| unavailable())?;
    let kms = FakeKmsClient::new(recipient.public_key_der().map_err(|_| unavailable())?, None)
        .map_err(|_| unavailable())?;
    let (_, sealed) = unseal_or_generate_escrow_key(&kms, &nsm, &recipient, None, "emulate")
        .await
        .map_err(|_| unavailable())?;
    let (keys, _) = unseal_or_generate_escrow_key(&kms, &nsm, &recipient, sealed, "emulate")
        .await
        .map_err(|_| unavailable())?;
    let public_key = keys.public_key.clone();
    let store = FakeHeadStore::default();
    let fixture = FixtureSource(std::env::var("ESCROW_ENCLAVE_EMULATE_FIXTURE").ok());
    fixture.load()?;
    let policy = Policy::new(
        keys,
        "emulate".into(),
        "emulate".into(),
        measurement(&nsm)?,
        &store,
        &fixture,
        &fixture,
    )
    .map_err(|_| unavailable())?;
    let listener = TcpListener::bind(address).await?;
    let http = match http_address {
        Some(address) => Some(TcpListener::bind(address).await?),
        None => None,
    };
    tracing::warn!("Host-trusted emulator ready; no production evidence or enrollment authority");
    serve(
        Service {
            policy,
            nsm: &nsm,
            key_id: "emulate".into(),
            public_key,
            mode: AttestationMode::Software,
        },
        Listener::Tcp(listener),
        http,
        token,
    )
    .await
}
