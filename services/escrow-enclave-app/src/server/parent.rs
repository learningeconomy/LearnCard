//! Parent boot/storage protocol, CID 3 port 5002. Parent data is never authority
//! for enrollment freshness or signed ledger contents.
use super::*;
use crate::{
    kms::{unseal_or_generate_escrow_key, AwsKmsClient, Credentials, RecipientKey},
    ledger::{
        AppendError, HeadStore, LedgerRecord, StoreFuture, MAX_CHAIN_RECORDS, MAX_RECORD_BYTES,
    },
    nsm::RealNsm,
    policy::{EnrollmentFuture, EnrollmentSource},
    time::{RoughtimeTimeSource, VsockRoughtimeTransport},
};
use serde::Deserialize;
use serde_json::json;
use tokio::time::timeout;
use tokio_vsock::{VsockAddr, VsockListener, VsockStream};

async fn connect(request: serde_json::Value) -> io::Result<VsockStream> {
    let mut stream = VsockStream::connect(VsockAddr::new(3, 5002)).await?;
    write_frame(
        &mut stream,
        &serde_json::to_vec(&request).map_err(|_| invalid())?,
    )
    .await?;
    Ok(stream)
}

struct ParentStore;
impl HeadStore for ParentStore {
    fn get_chain<'a>(&'a self, chain_id: &'a str) -> StoreFuture<'a, Vec<LedgerRecord>> {
        Box::pin(async move {
            timeout(IO_TIMEOUT, async {
                let mut stream = connect(json!({"method":"getChain", "chainId":chain_id})).await?;
                let count = stream.read_u32().await? as usize;
                if count > MAX_CHAIN_RECORDS {
                    return Err(invalid());
                }
                let mut records = Vec::with_capacity(count);
                for _ in 0..count {
                    let len = stream.read_u32().await? as usize;
                    if len == 0 || len > MAX_RECORD_BYTES {
                        return Err(invalid());
                    }
                    let mut bytes = vec![0; len];
                    stream.read_exact(&mut bytes).await?;
                    records.push(LedgerRecord::decode(&bytes).map_err(|_| invalid())?);
                }
                Ok::<_, io::Error>(records)
            })
            .await
            .map_err(|_| AppendError::Unavailable)?
            .map_err(|_| AppendError::Unavailable)
        })
    }
    fn append<'a>(&'a self, chain_id: &'a str, record: &'a LedgerRecord) -> StoreFuture<'a, ()> {
        Box::pin(async move {
            let bytes = record
                .canonical_bytes()
                .map_err(|_| AppendError::Unavailable)?;
            timeout(IO_TIMEOUT, async {
                let mut stream = connect(
                    json!({"method":"append", "chainId":chain_id, "record":STANDARD.encode(bytes)}),
                )
                .await
                .map_err(|_| AppendError::Unavailable)?;
                match stream.read_u8().await {
                    Ok(0) => Ok(()),
                    Ok(1) => Err(AppendError::Conflict),
                    _ => Err(AppendError::Unavailable),
                }
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

#[derive(Deserialize, zeroize::Zeroize, zeroize::ZeroizeOnDrop)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Boot {
    sealed: Option<String>,
    access_key_id: String,
    secret_access_key: String,
    session_token: String,
}

fn configured(name: &str) -> io::Result<String> {
    std::env::var(name)
        .ok()
        .filter(|s| !s.is_empty() && s.len() <= 2048)
        .ok_or_else(unavailable)
}
pub(super) async fn run(port: u32) -> io::Result<()> {
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
    let tenant = configured("ESCROW_TENANT")?;
    let region = configured("ESCROW_KMS_REGION")?;
    let arn = configured("ESCROW_KMS_KEY_ARN")?;
    let keys = timeout(Duration::from_secs(60), async {
        let mut stream = connect(json!({"method":"boot", "keyId":key_id})).await?;
        let bytes = read_frame(&mut stream).await?;
        let mut boot: Boot = serde_json::from_slice(&bytes).map_err(|_| invalid())?;
        let sealed = match &boot.sealed {
            Some(blob) if blob.len() <= 24_000 => {
                Some(STANDARD.decode(blob).map_err(|_| invalid())?)
            }
            None if std::env::var("ESCROW_ALLOW_FIRST_BOOT").as_deref() == Ok("true") => None,
            _ => return Err(unavailable()),
        };
        let kms = AwsKmsClient::new(
            Credentials {
                access_key_id: std::mem::take(&mut boot.access_key_id),
                secret_access_key: std::mem::take(&mut boot.secret_access_key),
                session_token: std::mem::take(&mut boot.session_token),
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
            let mut stream = connect(
                json!({"method":"persistKey", "keyId":key_id, "sealed":STANDARD.encode(blob)}),
            )
            .await?;
            if stream.read_u8().await? != 0 {
                return Err(unavailable());
            }
        }
        Ok::<_, io::Error>(keys)
    })
    .await
    .map_err(|_| unavailable())??;
    let public_key = keys.public_key.clone();
    let store = ParentStore;
    let authority = UnavailableEnrollment;
    let policy = Policy::new(
        keys,
        key_id.clone(),
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
