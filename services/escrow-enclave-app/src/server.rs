//! Single-owner policy actor: concurrent socket IO, serialized policy operations.
use crate::{
    nsm::{parse_attestation_document, AttestationRequest, NsmDriver},
    policy::{CreateHoldRequest, Policy, ReleaseRequest},
    wire::{
        v1::{Request, Response},
        AttestationMode, ErrorCode, Measurements,
    },
    Transport,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use sha2::{Digest, Sha256};
use std::{io, sync::Arc, time::Duration};
use tokio::{
    io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    net::TcpListener,
    task::JoinSet,
};
use zeroize::{Zeroize, Zeroizing};

#[cfg(any(
    test,
    all(
        feature = "fake-nsm",
        feature = "fake-kms",
        feature = "fake-time",
        feature = "fake-ledger"
    )
))]
pub mod emulate;
mod http;
#[cfg(any(
    feature = "fake-ledger",
    all(target_os = "linux", feature = "nitro", feature = "kms")
))]
pub mod parent;
#[cfg(test)]
mod tests;

pub const MAX_FRAME: usize = 256 * 1024;
const CONNECTIONS: usize = 32;
const IO_TIMEOUT: Duration = Duration::from_secs(10);
fn unavailable() -> io::Error {
    io::Error::other("Enclave service unavailable")
}
fn invalid() -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, "Invalid request")
}
fn refusal(code: ErrorCode) -> Response {
    Response::Error {
        code,
        message: "Request refused.".into(),
    }
}

pub async fn run(transport: Transport) -> io::Result<()> {
    match transport {
        Transport::Emulate {
            address,
            http_address,
        } => {
            #[cfg(any(
                test,
                all(
                    feature = "fake-nsm",
                    feature = "fake-kms",
                    feature = "fake-time",
                    feature = "fake-ledger"
                )
            ))]
            {
                emulate::run(address, http_address).await
            }
            #[cfg(not(any(
                test,
                all(
                    feature = "fake-nsm",
                    feature = "fake-kms",
                    feature = "fake-time",
                    feature = "fake-ledger"
                )
            )))]
            {
                let _ = (address, http_address);
                Err(io::Error::new(io::ErrorKind::PermissionDenied,
                    "--emulate is disabled: requires fake-nsm,fake-kms,fake-time,fake-ledger; never enable these in production"))
            }
        }
        Transport::Vsock { port } => {
            #[cfg(all(target_os = "linux", feature = "nitro", feature = "kms"))]
            {
                parent::run(port).await
            }
            #[cfg(not(all(target_os = "linux", feature = "nitro", feature = "kms")))]
            {
                let _ = port;
                Err(io::Error::new(
                    io::ErrorKind::Unsupported,
                    "Production requires Linux and nitro,kms features",
                ))
            }
        }
    }
}

pub struct Service<'a> {
    pub policy: Policy<'a>,
    pub nsm: &'a dyn NsmDriver,
    pub key_id: String,
    pub public_key: String,
    pub mode: AttestationMode,
}
impl Service<'_> {
    pub async fn dispatch(&mut self, request: Request) -> Response {
        match self.handle(request).await {
            Ok(response) => response,
            Err(code) => refusal(code),
        }
    }
    async fn handle(&mut self, request: Request) -> Result<Response, ErrorCode> {
        match request {
            Request::Health => Ok(Response::Health { ok: true }),
            Request::Attest { nonce } => {
                let spki = STANDARD
                    .decode(&self.public_key)
                    .map_err(|_| ErrorCode::Unavailable)?;
                let previous_key_ids = self.policy.previous_key_ids();
                let document = self
                    .nsm
                    .attest(AttestationRequest {
                        user_data: attest_user_data(&spki, &self.key_id, &previous_key_ids),
                        nonce,
                        public_key: Some(
                            self.policy
                                .ledger_public_key()
                                .to_encoded_point(false)
                                .as_bytes()
                                .to_vec(),
                        ),
                    })
                    .map_err(|_| ErrorCode::Unavailable)?;
                // Only decode our own NSM output; clients must validate signatures.
                let claims =
                    parse_attestation_document(&document).map_err(|_| ErrorCode::Unavailable)?;
                let pcr = |index| {
                    claims
                        .pcrs
                        .get(&index)
                        .filter(|v| v.len() == 48)
                        .map(hex::encode)
                        .ok_or(ErrorCode::Unavailable)
                };
                Ok(Response::Attest {
                    mode: self.mode,
                    key_id: self.key_id.clone(),
                    previous_key_ids,
                    public_key: self.public_key.clone(),
                    measurements: Measurements {
                        image_sha384: None,
                        pcr0: Some(pcr(0)?),
                        pcr1: Some(pcr(1)?),
                        pcr2: Some(pcr(2)?),
                    },
                    document: STANDARD.encode(document),
                    issued_at: iso_timestamp(claims.timestamp)?,
                })
            }
            Request::VerifyBlob {
                envelope,
                expected_did,
                expected_share_version,
            } => {
                if expected_share_version == 0 {
                    return Err(ErrorCode::Blob);
                }
                let result =
                    self.policy
                        .verify_blob(&envelope, &expected_did, expected_share_version)?;
                Ok(Response::VerifyBlob {
                    ok: result.ok,
                    has_pin: result.has_pin,
                    reason: (!result.ok).then(|| "Invalid escrow payload.".into()),
                })
            }
            Request::CarryPinVerifier {
                source_envelope,
                target_envelope,
                expected_did,
                source_share_version,
                target_share_version,
                source_enrollment_epoch,
                target_enrollment_epoch,
            } => {
                let envelope = self
                    .policy
                    .carry_pin_verifier(
                        &source_envelope,
                        &target_envelope,
                        &expected_did,
                        source_share_version,
                        target_share_version,
                        (source_enrollment_epoch, target_enrollment_epoch),
                    )
                    .await?;
                Ok(Response::CarryPinVerifier { envelope })
            }
            Request::RewrapEscrowBlob {
                envelope,
                expected_did,
                expected_share_version,
                source_enrollment_epoch,
            } => {
                if expected_share_version == 0 {
                    return Err(ErrorCode::Blob);
                }
                let envelope = self
                    .policy
                    .rewrap_escrow_blob(
                        &envelope,
                        &expected_did,
                        expected_share_version,
                        source_enrollment_epoch,
                    )
                    .await?;
                Ok(Response::RewrapEscrowBlob { envelope })
            }
            Request::CreateHold {
                envelope,
                hold_id,
                request_id,
                expected_did,
                expected_share_version,
                enrollment_epoch,
                release_policy,
                client_ephemeral_public_key,
            } => {
                let hold = self
                    .policy
                    .create_hold(CreateHoldRequest {
                        envelope: &envelope,
                        hold_id: &hold_id,
                        request_id: &request_id,
                        expected_did: &expected_did,
                        expected_share_version,
                        enrollment_epoch,
                        release_policy,
                        client_ephemeral_public_key: &client_ephemeral_public_key,
                    })
                    .await?;
                Ok(Response::CreateHold { hold })
            }
            Request::Release {
                envelope,
                hold,
                request_id,
                client_ephemeral_public_key,
                expected_did,
                pin_proof,
            } => {
                let proof = pin_proof.map(Zeroizing::new);
                let sealed = self
                    .policy
                    .release(ReleaseRequest {
                        envelope: &envelope,
                        hold: &hold,
                        request_id: &request_id,
                        client_ephemeral_public_key: &client_ephemeral_public_key,
                        expected_did: &expected_did,
                        pin_proof: proof.as_ref().map(|p| p.as_str()),
                    })
                    .await?;
                Ok(Response::Release { sealed })
            }
            Request::Cancel {
                envelope,
                hold,
                request_id,
                client_ephemeral_public_key,
                expected_did,
            } => {
                self.policy
                    .cancel_hold(ReleaseRequest {
                        envelope: &envelope,
                        hold: &hold,
                        request_id: &request_id,
                        client_ephemeral_public_key: &client_ephemeral_public_key,
                        expected_did: &expected_did,
                        pin_proof: None,
                    })
                    .await?;
                Ok(Response::Cancel { cancelled: true })
            }
        }
    }
}

/// Presentation only: the NSM timestamp is never used for release decisions.
fn iso_timestamp(ms: u64) -> Result<String, ErrorCode> {
    if ms > 253_402_300_799_999 {
        return Err(ErrorCode::Unavailable);
    }
    let days = (ms / 86_400_000) as i64 + 719468;
    let era = days / 146097;
    let doe = days - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let mut year = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = mp + if mp < 10 { 3 } else { -9 };
    year += i64::from(month <= 2);
    let seconds = ms / 1000;
    Ok(format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{:03}Z",
        seconds / 3600 % 24,
        seconds / 60 % 60,
        seconds % 60,
        ms % 1000
    ))
}

pub fn measurement(nsm: &dyn NsmDriver) -> io::Result<[u8; 32]> {
    let document = nsm
        .attest(AttestationRequest {
            user_data: vec![],
            nonce: vec![],
            public_key: None,
        })
        .map_err(|_| unavailable())?;
    let claims = parse_attestation_document(&document).map_err(|_| unavailable())?;
    let mut hash = Sha256::new();
    for index in 0..3 {
        let pcr = claims
            .pcrs
            .get(&index)
            .filter(|p| p.len() == 48)
            .ok_or_else(unavailable)?;
        if pcr.iter().all(|b| *b == 0) {
            return Err(unavailable());
        }
        hash.update(pcr);
    }
    Ok(hash.finalize().into())
}

/// Canonical CBOR `{0: spki bytes, 1: keyId text, 2: previousKeyIds array<text>}`
/// replacing the legacy raw-SPKI `user_data` (P9.1), so an updated client
/// verifier can extract the accepted previous keyIds from the SAME NSM-signed
/// material as the escrow key, not an unsigned side channel. Byte-distinguishable
/// from the legacy format: real P-256 SPKI DER always starts with the SEQUENCE
/// tag 0x30, which CBOR decodes as a bare negative integer (major type 1), never
/// a map — so a verifier that requires "valid CBOR AND a 3-key map" before
/// trusting this shape safely falls back to treating legacy bytes as raw SPKI.
/// All three field lengths here are always under 256 bytes (128-byte keyId cap,
/// <=3 previous keys, ~100-byte SPKI), so only the one/two-byte-argument cases
/// of canonical CBOR are needed; hand-rolled to match ledger/codec.rs's style
/// rather than adding a CBOR crate dependency to this always-compiled module.
fn attest_user_data(spki: &[u8], key_id: &str, previous_key_ids: &[String]) -> Vec<u8> {
    fn arg(out: &mut Vec<u8>, major: u8, value: usize) {
        let prefix = major << 5;
        match u8::try_from(value) {
            Ok(value @ 0..=23) => out.push(prefix | value),
            Ok(value) => out.extend_from_slice(&[prefix | 24, value]),
            Err(_) => {
                out.push(prefix | 25);
                out.extend_from_slice(&(value as u16).to_be_bytes());
            }
        }
    }
    let mut out = Vec::new();
    arg(&mut out, 5, 3);
    arg(&mut out, 0, 0);
    arg(&mut out, 2, spki.len());
    out.extend_from_slice(spki);
    arg(&mut out, 0, 1);
    arg(&mut out, 3, key_id.len());
    out.extend_from_slice(key_id.as_bytes());
    arg(&mut out, 0, 2);
    arg(&mut out, 4, previous_key_ids.len());
    for id in previous_key_ids {
        arg(&mut out, 3, id.len());
        out.extend_from_slice(id.as_bytes());
    }
    out
}

trait Socket: AsyncRead + AsyncWrite + Unpin + Send {}
impl<T: AsyncRead + AsyncWrite + Unpin + Send> Socket for T {}
type Stream = Box<dyn Socket>;
pub enum Listener {
    Tcp(TcpListener),
    #[cfg(target_os = "linux")]
    Vsock(tokio_vsock::VsockListener),
}
impl Listener {
    async fn accept(&self) -> io::Result<Stream> {
        match self {
            Self::Tcp(listener) => Ok(Box::new(listener.accept().await?.0)),
            #[cfg(target_os = "linux")]
            Self::Vsock(listener) => Ok(Box::new(listener.accept().await?.0)),
        }
    }
}
pub async fn read_frame<S: AsyncRead + Unpin + ?Sized>(
    stream: &mut S,
) -> io::Result<Zeroizing<Vec<u8>>> {
    let len = stream.read_u32().await? as usize;
    if len == 0 || len > MAX_FRAME {
        return Err(invalid());
    }
    let mut bytes = Zeroizing::new(vec![0; len]);
    stream.read_exact(&mut bytes).await?;
    Ok(bytes)
}
pub async fn write_frame<S: AsyncWrite + Unpin + ?Sized>(
    stream: &mut S,
    bytes: &[u8],
) -> io::Result<()> {
    if bytes.is_empty() || bytes.len() > MAX_FRAME {
        return Err(invalid());
    }
    stream.write_u32(bytes.len() as u32).await?;
    stream.write_all(bytes).await
}
struct QueuedRequest(Option<Request>);
impl Drop for QueuedRequest {
    fn drop(&mut self) {
        if let Some(Request::Release {
            pin_proof: Some(proof),
            ..
        }) = &mut self.0
        {
            proof.zeroize();
        }
    }
}
enum Completed {
    Request(Stream, Box<QueuedRequest>, bool, tokio::time::Instant),
    Done,
}

/// One request per connection. Both listeners share a 32-task admission budget.
/// Dropping the server aborts socket tasks; timeouts never reset Policy state.
pub async fn serve(
    mut service: Service<'_>,
    listener: Listener,
    http_listener: Option<TcpListener>,
    token: String,
) -> io::Result<()> {
    let token = Arc::new(Zeroizing::new(token));
    let mut tasks = JoinSet::new();
    loop {
        tokio::select! {
            accepted = listener.accept(), if tasks.len() < CONNECTIONS => {
                spawn_reader(&mut tasks, accepted?, false, token.clone());
            }
            accepted = async {
                match &http_listener {
                    Some(listener) => listener.accept().await.map(|(stream, _)| Box::new(stream) as Stream),
                    None => std::future::pending().await,
                }
            }, if tasks.len() < CONNECTIONS => {
                spawn_reader(&mut tasks, accepted?, true, token.clone());
            }
            completed = tasks.join_next(), if !tasks.is_empty() => {
                if let Some(Ok(Completed::Request(mut stream, mut queued, http, deadline))) = completed {
                    if tokio::time::Instant::now() >= deadline { continue; }
                    let Some(request) = queued.0.take() else { continue; };
                    let response = tokio::time::timeout_at(deadline, service.dispatch(request)).await
                        .unwrap_or_else(|_| refusal(ErrorCode::Unavailable));
                    tasks.spawn(async move {
                        let _ = tokio::time::timeout_at(deadline, async {
                            if http { http::respond(&mut *stream, response).await }
                            else { write_frame(&mut *stream, &serde_json::to_vec(&response).map_err(|_| invalid())?).await }
                        }).await;
                        Completed::Done
                    });
                }
            }
        }
    }
}
fn spawn_reader(
    tasks: &mut JoinSet<Completed>,
    mut stream: Stream,
    http: bool,
    token: Arc<Zeroizing<String>>,
) {
    let deadline = tokio::time::Instant::now() + IO_TIMEOUT;
    tasks.spawn(async move {
        let request = tokio::time::timeout_at(deadline, async {
            if http {
                http::read(&mut *stream, &token).await
            } else {
                serde_json::from_slice(&read_frame(&mut *stream).await?).map_err(|_| invalid())
            }
        })
        .await;
        match request {
            Ok(Ok(request)) => Completed::Request(
                stream,
                Box::new(QueuedRequest(Some(request))),
                http,
                deadline,
            ),
            _ => Completed::Done,
        }
    });
}
