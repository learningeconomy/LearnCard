//! P1.8 parent protocol: framed JSON requests, operation-specific bounded replies.
use crate::{
    framing::{self, invalid},
    storage::{AppendError, HeadStore, SealedStore},
};
use aws_credential_types::provider::{ProvideCredentials, SharedCredentialsProvider};
use base64::{Engine, engine::general_purpose::STANDARD};
use serde::Deserialize;
use serde_json::json;
use std::{
    io,
    sync::Arc,
    time::{Duration, SystemTime},
};
use tokio::io::{AsyncRead, AsyncWrite, AsyncWriteExt};
use zeroize::Zeroizing;

pub struct Boot {
    pub credentials: SharedCredentialsProvider,
    pub sealed: SealedStore,
    pub key_id: String,
    pub allow_first_boot: bool,
}
impl Boot {
    async fn response(&self, key_id: &str) -> io::Result<Vec<u8>> {
        if key_id != self.key_id {
            return Err(invalid());
        }
        let creds = self
            .credentials
            .provide_credentials()
            .await
            .map_err(|_| invalid())?;
        let expiry = creds.expiry().ok_or_else(invalid)?;
        if expiry
            .duration_since(SystemTime::now())
            .map_err(|_| invalid())?
            < Duration::from_secs(300)
        {
            return Err(invalid());
        }
        let session = creds.session_token().ok_or_else(invalid)?;
        let sealed = self
            .sealed
            .load_for_boot(self.allow_first_boot)
            .await
            .map_err(|_| invalid())?;
        serde_json::to_vec(&json!({"sealed":sealed.map(|b|STANDARD.encode(b)),"accessKeyId":creds.access_key_id(),"secretAccessKey":creds.secret_access_key(),"sessionToken":session})).map_err(|_|invalid())
    }
}
#[derive(Deserialize)]
#[serde(
    tag = "method",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
enum Request {
    GetChain { chain_id: String },
    Append { chain_id: String, record: String },
    Boot { key_id: String },
    PersistKey { key_id: String, sealed: String },
}
pub struct Services {
    pub store: Arc<dyn HeadStore>,
    pub boot: Arc<Boot>,
}
/// Binary chain response: count first, then individually length-prefixed CBOR.
pub async fn write_chain<S: AsyncWrite + Unpin>(
    stream: &mut S,
    records: &[Vec<u8>],
) -> io::Result<()> {
    if records.len() > 64 || records.iter().any(|b| b.is_empty() || b.len() > 8192) {
        return Err(invalid());
    }
    stream.write_u32(records.len() as u32).await?;
    for record in records {
        framing::write(stream, record, 8192).await?;
    }
    stream.flush().await
}
impl Services {
    pub async fn serve<S: AsyncRead + AsyncWrite + Unpin>(&self, stream: &mut S) -> io::Result<()> {
        tokio::time::timeout(Duration::from_secs(10), async {
            let bytes = framing::read(stream, 32768).await?;
            let request: Request = serde_json::from_slice(&bytes).map_err(|_| invalid())?;
            match request {
                Request::GetChain { chain_id } => {
                    let records = self
                        .store
                        .get_chain(&chain_id)
                        .await
                        .map_err(|_| invalid())?;
                    write_chain(stream, &records).await
                }
                Request::Append { chain_id, record } => {
                    if record.len() > 10924 {
                        return Err(invalid());
                    }
                    let bytes = STANDARD.decode(record).map_err(|_| invalid())?;
                    let status = match self.store.append(&chain_id, &bytes).await {
                        Ok(()) => 0,
                        Err(AppendError::Conflict) => 1,
                        Err(AppendError::Unavailable) => 2,
                    };
                    stream.write_u8(status).await?;
                    stream.flush().await
                }
                Request::Boot { key_id } => {
                    let bytes = Zeroizing::new(self.boot.response(&key_id).await?);
                    framing::write(stream, &bytes, framing::MAX_FRAME).await
                }
                Request::PersistKey { key_id, sealed } => {
                    if key_id != self.boot.key_id
                        || !self.boot.allow_first_boot
                        || sealed.len() > 21848
                    {
                        return Err(invalid());
                    }
                    let bytes = STANDARD.decode(sealed).map_err(|_| invalid())?;
                    let status = if self.boot.sealed.save_new(bytes).await.is_ok() {
                        0
                    } else {
                        2
                    };
                    stream.write_u8(status).await?;
                    stream.flush().await
                }
            }
        })
        .await
        .map_err(|_| invalid())?
    }
}
pub async fn listen(services: Arc<Services>, cid: u32) -> io::Result<()> {
    #[cfg(target_os = "linux")]
    {
        let listener = tokio_vsock::VsockListener::bind(tokio_vsock::VsockAddr::new(3, 5002))?;
        let permits = Arc::new(tokio::sync::Semaphore::new(32));
        let mut tasks = tokio::task::JoinSet::new();
        loop {
            tokio::select! {
                connection=listener.accept()=>{
                    let (mut stream,peer)=connection?;
                    if peer.cid()!=cid {continue;}
                    let Ok(permit)=permits.clone().try_acquire_owned() else {continue;};
                    let services=services.clone();
                    tasks.spawn(async move {let _permit=permit;let _=services.serve(&mut stream).await;});
                }
                _=tasks.join_next(),if !tasks.is_empty()=>{}
            }
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (services, cid);
        Err(invalid())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::tests::{FakeStore, record};
    use tokio::io::AsyncReadExt;
    fn services() -> Services {
        let credentials = SharedCredentialsProvider::new(aws_credential_types::Credentials::new(
            "test",
            "test",
            Some("test".into()),
            Some(SystemTime::now() + Duration::from_secs(600)),
            "test",
        ));
        let config = aws_sdk_s3::Config::builder()
            .behavior_version_latest()
            .region(aws_sdk_s3::config::Region::new("us-east-1"))
            .credentials_provider(credentials.clone())
            .build();
        Services {
            store: Arc::new(FakeStore::default()),
            boot: Arc::new(Boot {
                credentials,
                sealed: SealedStore {
                    s3: aws_sdk_s3::Client::from_conf(config),
                    bucket: "test".into(),
                    key: "key".into(),
                },
                key_id: "key".into(),
                allow_first_boot: false,
            }),
        }
    }
    #[tokio::test]
    async fn parent_binary_protocol_matches_enclave_decoder() {
        let services = Arc::new(services());
        let chain = "a".repeat(64);
        let bytes = record(0, [0; 32]);
        for status in [0, 1] {
            let (mut parent, mut enclave) = tokio::io::duplex(32768);
            let service = services.clone();
            let task = tokio::spawn(async move { service.serve(&mut parent).await });
            framing::write(
                &mut enclave,
                &serde_json::to_vec(
                    &json!({"method":"append","chainId":chain,"record":STANDARD.encode(&bytes)}),
                )
                .unwrap(),
                32768,
            )
            .await
            .unwrap();
            assert_eq!(enclave.read_u8().await.unwrap(), status);
            task.await.unwrap().unwrap();
        }
        let (mut parent, mut enclave) = tokio::io::duplex(32768);
        let service = services.clone();
        let task = tokio::spawn(async move { service.serve(&mut parent).await });
        framing::write(
            &mut enclave,
            &serde_json::to_vec(&json!({"method":"getChain","chainId":chain})).unwrap(),
            32768,
        )
        .await
        .unwrap();
        assert_eq!(enclave.read_u32().await.unwrap(), 1);
        assert_eq!(framing::read(&mut enclave, 8192).await.unwrap(), bytes);
        task.await.unwrap().unwrap();
    }
    #[tokio::test]
    async fn oversized_chain_rejected_before_output() {
        let (mut writer, mut reader) = tokio::io::duplex(4);
        assert!(write_chain(&mut writer, &vec![vec![1]; 65]).await.is_err());
        drop(writer);
        let mut bytes = Vec::new();
        reader.read_to_end(&mut bytes).await.unwrap();
        assert!(bytes.is_empty());
    }
}
