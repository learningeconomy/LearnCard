//! Parent boot/storage protocol, CID 3 port 5002. Parent data is never authority
//! for enrollment freshness or signed ledger contents.
use super::super::*;
use super::{append, boot, boot_failed, get_chain, persist_key};
use crate::{
    authority::{
        aws::{CredentialPurpose, DynamoAuthorityClient},
        config::{AuthorityConfig, EmailConfig},
        credentials::CredentialUnsealer,
        email::SesEmailSender,
    },
    kms::{unseal_or_generate_escrow_key, AwsKmsClient, Credentials, RecipientKey},
    ledger::{AppendError, HeadStore, LedgerRecord, StoreFuture},
    nsm::RealNsm,
    policy::{authority::AuthorityEnrollment, EnrollmentFuture, EnrollmentSource},
    time::{RoughtimeTimeSource, VsockRoughtimeTransport},
};
use std::sync::OnceLock;
use tokio::time::timeout;
use tokio_vsock::{VsockAddr, VsockListener, VsockStream};

async fn connect() -> io::Result<VsockStream> {
    VsockStream::connect(VsockAddr::new(3, 5002)).await
}

struct ParentStore;
impl HeadStore for ParentStore {
    fn get_chain<'a>(&'a self, chain_id: &'a str) -> StoreFuture<'a, Vec<LedgerRecord>> {
        Box::pin(async move {
            timeout(IO_TIMEOUT, async {
                get_chain(&mut connect().await?, chain_id).await
            })
            .await
            .map_err(|_| AppendError::Unavailable)?
            .map_err(|_| AppendError::Unavailable)
        })
    }
    fn append<'a>(&'a self, chain_id: &'a str, record: &'a LedgerRecord) -> StoreFuture<'a, ()> {
        Box::pin(async move {
            timeout(IO_TIMEOUT, async {
                let mut stream = connect().await.map_err(|_| AppendError::Unavailable)?;
                append(&mut stream, chain_id, record).await
            })
            .await
            .map_err(|_| AppendError::Unavailable)?
        })
    }
}
struct UnavailableEnrollment;
impl EnrollmentSource for UnavailableEnrollment {
    fn current<'a>(&'a self, _: &'a str, _: &'a str) -> EnrollmentFuture<'a> {
        Box::pin(async { Err(ErrorCode::Unavailable) })
    }
}

fn configured(name: &str) -> io::Result<String> {
    std::env::var(name)
        .ok()
        .filter(|s| !s.is_empty() && s.len() <= 2048)
        .ok_or_else(unavailable)
}
pub(crate) async fn run(port: u32) -> io::Result<()> {
    let authority = step("policy_init", AuthorityConfig::from_measured_env())?;
    let email = step("policy_init", EmailConfig::from_measured_env())?;
    // Supervision: any forwarder exit also terminates serving.
    let result = tokio::select! {
        result = crate::kms::vsock_forward::run() => step("kms_forwarder", result),
        result = async {
            if let Some(config) = &authority {
                tokio::select! {
                    result = crate::kms::vsock_forward::run_data_plane(config, None) => step("policy_init", result),
                    result = boot_and_serve(port, authority.as_ref(), email.as_ref()) => result,
                }
            } else { boot_and_serve(port, None, None).await }
        } => result,
    };
    if let Some(name) = FAILED_STEP.get() {
        let _ = timeout(Duration::from_secs(2), async {
            boot_failed(&mut connect().await?, name).await
        })
        .await;
    }
    result
}

static FAILED_STEP: OnceLock<&'static str> = OnceLock::new();

/// Logs which startup step failed using a fixed label only (never the error,
/// which may carry host-supplied or secret-derived detail), then fails closed.
/// The first label is also reported to the parent, since production enclaves
/// have no console.
fn step<T, E>(name: &'static str, result: Result<T, E>) -> io::Result<T> {
    result.map_err(|_| {
        tracing::error!(step = name, "enclave startup failed");
        let _ = FAILED_STEP.set(name);
        unavailable()
    })
}

async fn boot_and_serve(
    port: u32,
    authority_config: Option<&AuthorityConfig>,
    email_config: Option<&EmailConfig>,
) -> io::Result<()> {
    let nsm = step("nsm_open", RealNsm::new())?;
    let measurement = step("nsm_measurement", measurement(&nsm))?;
    let time = Arc::new(step(
        "roughtime_config",
        RoughtimeTimeSource::production(Arc::new(VsockRoughtimeTransport)),
    )?);
    let key_id = step("config_key_id", configured("ESCROW_KEY_ID"))?;
    // Comma-separated, bounded (P9.1): read-only decrypt keys accepted alongside
    // the current key, for deliberate rotation or a lost-sealed-key recovery.
    let previous_key_ids: Vec<String> = std::env::var("ESCROW_PREVIOUS_KEY_IDS")
        .unwrap_or_default()
        .split(',')
        .map(str::trim)
        .filter(|id| !id.is_empty())
        .map(String::from)
        .collect();
    if previous_key_ids.len() > crate::policy::MAX_PREVIOUS_KEYS
        || previous_key_ids.contains(&key_id)
        || previous_key_ids
            .iter()
            .enumerate()
            .any(|(i, id)| previous_key_ids[..i].contains(id))
    {
        return step("config_previous_key_ids", Err(()));
    }
    let tenant = step("config_tenant", configured("ESCROW_TENANT"))?;
    let region = step("config_kms_region", configured("ESCROW_KMS_REGION"))?;
    step("install_kms_hosts", install_kms_hosts(&region))?;
    step(
        "install_service_hosts",
        install_service_hosts(authority_config, email_config),
    )?;
    let arn = step("config_kms_key_arn", configured("ESCROW_KMS_KEY_ARN"))?;
    let keys = timeout(Duration::from_secs(60), async {
        let mut boot_material = step(
            "parent_boot",
            boot(&mut step("parent_connect", connect().await)?, &key_id).await,
        )?;
        let unsealer = step(
            "policy_init",
            CredentialUnsealer::from_measured_env(
                Credentials {
                    access_key_id: boot_material.access_key_id.clone(),
                    secret_access_key: boot_material.secret_access_key.clone(),
                    session_token: boot_material.session_token.clone(),
                },
                time.clone(),
            ),
        )?;
        let sealed = match &boot_material.sealed {
            Some(blob) if blob.len() <= 24_000 => {
                Some(step("sealed_decode", STANDARD.decode(blob))?)
            }
            None if std::env::var("ESCROW_ALLOW_FIRST_BOOT").as_deref() == Ok("true") => None,
            Some(_) => return step("sealed_too_large", Err(())),
            None => return step("sealed_missing_first_boot_disabled", Err(())),
        };
        let kms = step(
            "kms_client",
            AwsKmsClient::new(
                Credentials {
                    access_key_id: std::mem::take(&mut boot_material.access_key_id),
                    secret_access_key: std::mem::take(&mut boot_material.secret_access_key),
                    session_token: std::mem::take(&mut boot_material.session_token),
                },
                &region,
                arn,
                time.clone(),
            ),
        )?;
        let recipient = step("recipient_key", RecipientKey::generate())?;
        let (keys, new_blob) = step(
            "kms_unseal_or_generate",
            unseal_or_generate_escrow_key(&kms, &nsm, &recipient, sealed, &key_id).await,
        )?;
        if let Some(blob) = new_blob {
            step(
                "parent_persist_key",
                persist_key(
                    &mut step("parent_connect", connect().await)?,
                    &key_id,
                    &blob,
                )
                .await,
            )?;
        }
        // Deliberate rotation or a lost-sealed-key recovery (P9.1): the host's
        // `boot` handler is already keyId-generic, so each previous keyId reuses
        // the exact same wire call/codec, just against that key's own sealed
        // blob. Unlike the current key, a missing blob is ALWAYS fatal here —
        // ESCROW_ALLOW_FIRST_BOOT never applies to a previous key, since
        // "generating" one would silently fabricate a key with no real history
        // sealed under it. The same recipient/KMS client is reused: KMS's
        // Decrypt authorization is PCR-attestation-based, not keyId-based (see
        // infra/escrow-enclave/kms.tf), so nothing narrows by reusing them.
        let mut previous_keys = Vec::new();
        for previous_id in &previous_key_ids {
            let mut previous_boot = step(
                "parent_boot_previous",
                boot(&mut step("parent_connect", connect().await)?, previous_id).await,
            )?;
            let Some(sealed) = previous_boot.sealed.take() else {
                return step("previous_sealed_missing", Err(()));
            };
            let sealed = step("previous_sealed_decode", STANDARD.decode(sealed))?;
            let (previous, new_blob) = step(
                "kms_unseal_previous",
                unseal_or_generate_escrow_key(&kms, &nsm, &recipient, Some(sealed), previous_id)
                    .await,
            )?;
            if new_blob.is_some() {
                return step("previous_key_regenerated", Err(()));
            }
            previous_keys.push((previous_id.clone(), previous));
        }
        let (authority, email_sender) = match (authority_config, unsealer) {
            (Some(config), Some(unsealer)) => {
                let ciphertext = step(
                    "policy_init",
                    boot_material
                        .authority_credential_ciphertext
                        .as_ref()
                        .ok_or(()),
                )?;
                let ciphertext = step("policy_init", STANDARD.decode(ciphertext))?;
                let credentials = step(
                    "policy_init",
                    unsealer
                        .unseal(CredentialPurpose::AuthorityWriter, &ciphertext, &nsm)
                        .await,
                )?;
                let client = step(
                    "policy_init",
                    DynamoAuthorityClient::new(config.clone(), credentials, time.clone()),
                )?;
                let store = step("policy_init", client.into_store())?;
                let authority = step(
                    "policy_init",
                    AuthorityEnrollment::new(
                        tenant.clone(),
                        config.generation().into(),
                        Arc::new(store),
                    ),
                )?;
                // P9.1 (attack C): email stays optional at the Rust type level
                // even in authority mode, but `authority_create_hold` fails
                // closed without it — an authority deployment that never
                // configures ESCROW_EMAIL_*/provisions its sealed sender
                // simply cannot start holds, not a silent unconfirmed downgrade.
                let email_sender = match email_config {
                    Some(email_config) => {
                        let ciphertext = step(
                            "policy_init",
                            boot_material.email_credential_ciphertext.as_ref().ok_or(()),
                        )?;
                        let ciphertext = step("policy_init", STANDARD.decode(ciphertext))?;
                        let credentials = step(
                            "policy_init",
                            unsealer
                                .unseal(CredentialPurpose::EmailSender, &ciphertext, &nsm)
                                .await,
                        )?;
                        Some(step(
                            "policy_init",
                            SesEmailSender::new(
                                email_config.clone(),
                                credentials,
                                time.clone(),
                                tenant.clone(),
                            ),
                        )?)
                    }
                    None => None,
                };
                (Some(authority), email_sender)
            }
            (None, None) => (None, None),
            _ => return step("policy_init", Err(())),
        };
        Ok::<_, io::Error>((keys, previous_keys, authority, email_sender))
    })
    .await;
    let (keys, previous_keys, authority, email_sender) = step("boot_timeout", keys)??;
    let public_key = keys.public_key.clone();
    let store = ParentStore;
    let unavailable_enrollment = UnavailableEnrollment;
    let policy = step(
        "policy_init",
        Policy::new(
            keys,
            key_id.clone(),
            previous_keys,
            tenant,
            measurement,
            &store,
            time.as_ref(),
            &unavailable_enrollment,
        ),
    )?;
    let policy = match &email_sender {
        Some(email_sender) => policy.with_email(email_sender),
        None => policy,
    };
    let policy = match &authority {
        Some(authority) => step("policy_init", policy.with_authority(authority))?,
        None => policy,
    };
    let listener = step(
        "vsock_bind",
        VsockListener::bind(VsockAddr::new(u32::MAX, port)),
    )?;
    tracing::info!("enclave startup complete");
    serve(
        Service {
            policy,
            nsm: &nsm,
            key_id,
            public_key,
            mode: AttestationMode::Nitro,
        },
        Listener::Vsock(listener),
        None,
        String::new(),
    )
    .await
}

fn install_kms_hosts(region: &str) -> io::Result<()> {
    if region.is_empty()
        || region.len() > 64
        || !region
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
    {
        return Err(unavailable());
    }
    // Docker's build-time hosts file does not survive EIF construction.
    // This process owns the enclave network namespace; no parent DNS is trusted.
    use std::io::Write;
    // Preserve data-plane host entries regardless of supervised future ordering.
    std::fs::OpenOptions::new()
        .append(true)
        .open("/etc/hosts")
        .and_then(|mut hosts| {
            hosts
                .write_all(format!("\n127.0.0.1 localhost kms.{region}.amazonaws.com\n").as_bytes())
        })
        .map_err(|_| unavailable())
}

/// P9.1 (attack C) / P2 (authority): the authority/email vsock-proxy relays
/// (terraform's `proxies` map, ports 8001/8002) are exactly as unreachable
/// without a loopback mapping as KMS is without its own — `AuthorityConfig`/
/// `EmailConfig`'s HTTPS client performs ordinary OS hostname resolution, and
/// the enclave has no real DNS. Written only when that config is present, so
/// a measured image with neither feature enabled gains no extra hosts entries.
/// Region is already validated by `AuthorityConfig`/`EmailConfig::load()`
/// (`region_account()`), so no further validation is needed here.
fn install_service_hosts(
    authority: Option<&AuthorityConfig>,
    email: Option<&EmailConfig>,
) -> io::Result<()> {
    let mut entries = String::new();
    if let Some(authority) = authority {
        entries.push_str(&format!(
            "\n127.0.0.1 dynamodb.{}.amazonaws.com",
            authority.region
        ));
    }
    if let Some(email) = email {
        entries.push_str(&format!("\n127.0.0.1 email.{}.amazonaws.com", email.region));
    }
    if entries.is_empty() {
        return Ok(());
    }
    use std::io::Write;
    entries.push('\n');
    std::fs::OpenOptions::new()
        .append(true)
        .open("/etc/hosts")
        .and_then(|mut hosts| hosts.write_all(entries.as_bytes()))
        .map_err(|_| unavailable())
}
