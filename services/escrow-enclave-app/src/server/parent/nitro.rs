//! Parent boot/storage protocol, CID 3 port 5002. Parent data is never authority
//! for enrollment freshness or signed ledger contents.
use super::super::*;
use super::{append, boot, get_chain, persist_key};
use crate::{
    kms::{unseal_or_generate_escrow_key, AwsKmsClient, Credentials, RecipientKey},
    ledger::{AppendError, HeadStore, LedgerRecord, StoreFuture},
    nsm::RealNsm,
    policy::{EnrollmentFuture, EnrollmentSource},
    time::{RoughtimeTimeSource, VsockRoughtimeTransport},
};
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
    // Supervision: any forwarder exit also terminates serving.
    tokio::select! {
        result = crate::kms::vsock_forward::run() => result,
        result = boot_and_serve(port) => result,
    }
}
async fn boot_and_serve(port: u32) -> io::Result<()> {
    let nsm = RealNsm::new().map_err(|_| unavailable())?;
    let measurement = measurement(&nsm)?;
    let time = RoughtimeTimeSource::production(Arc::new(VsockRoughtimeTransport))
        .map_err(|_| unavailable())?;
    let key_id = configured("ESCROW_KEY_ID")?;
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
        return Err(unavailable());
    }
    let tenant = configured("ESCROW_TENANT")?;
    let region = configured("ESCROW_KMS_REGION")?;
    install_kms_hosts(&region)?;
    let arn = configured("ESCROW_KMS_KEY_ARN")?;
    let keys = timeout(Duration::from_secs(60), async {
        let mut boot_material = boot(&mut connect().await?, &key_id).await?;
        let sealed = match &boot_material.sealed {
            Some(blob) if blob.len() <= 24_000 => {
                Some(STANDARD.decode(blob).map_err(|_| invalid())?)
            }
            None if std::env::var("ESCROW_ALLOW_FIRST_BOOT").as_deref() == Ok("true") => None,
            _ => return Err(unavailable()),
        };
        let kms = AwsKmsClient::new(
            Credentials {
                access_key_id: std::mem::take(&mut boot_material.access_key_id),
                secret_access_key: std::mem::take(&mut boot_material.secret_access_key),
                session_token: std::mem::take(&mut boot_material.session_token),
            },
            &region,
            arn,
        )
        .map_err(|_| unavailable())?;
        let recipient = RecipientKey::generate().map_err(|_| unavailable())?;
        let (keys, new_blob) =
            unseal_or_generate_escrow_key(&kms, &nsm, &recipient, sealed, &key_id)
                .await
                .map_err(|_| unavailable())?;
        if let Some(blob) = new_blob {
            persist_key(&mut connect().await?, &key_id, &blob).await?;
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
            let mut previous_boot = boot(&mut connect().await?, previous_id).await?;
            let Some(sealed) = previous_boot.sealed.take() else {
                return Err(unavailable());
            };
            let sealed = STANDARD.decode(sealed).map_err(|_| invalid())?;
            let (previous, new_blob) =
                unseal_or_generate_escrow_key(&kms, &nsm, &recipient, Some(sealed), previous_id)
                    .await
                    .map_err(|_| unavailable())?;
            if new_blob.is_some() {
                return Err(unavailable());
            }
            previous_keys.push((previous_id.clone(), previous));
        }
        Ok::<_, io::Error>((keys, previous_keys))
    })
    .await
    .map_err(|_| unavailable())??;
    let (keys, previous_keys) = keys;
    let public_key = keys.public_key.clone();
    let store = ParentStore;
    let authority = UnavailableEnrollment;
    let policy = Policy::new(
        keys,
        key_id.clone(),
        previous_keys,
        tenant,
        measurement,
        &store,
        &time,
        &authority,
    )
    .map_err(|_| unavailable())?;
    let listener = VsockListener::bind(VsockAddr::new(u32::MAX, port))?;
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
    std::fs::write(
        "/etc/hosts",
        format!("127.0.0.1 localhost kms.{region}.amazonaws.com\n"),
    )
    .map_err(|_| unavailable())
}
