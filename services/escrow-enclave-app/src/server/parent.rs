//! Parent protocol codec shared by production vsock and local interop tests.
use super::{invalid, read_frame, unavailable, write_frame};
use crate::ledger::{AppendError, LedgerRecord, MAX_CHAIN_RECORDS, MAX_RECORD_BYTES};
use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Deserialize;
use serde_json::json;
use std::io;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite};

#[cfg(all(target_os = "linux", feature = "nitro", feature = "kms"))]
mod nitro;
#[cfg(all(target_os = "linux", feature = "nitro", feature = "kms"))]
pub(crate) use nitro::run;

#[derive(Deserialize, zeroize::Zeroize, zeroize::ZeroizeOnDrop)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Boot {
    pub sealed: Option<String>,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub session_token: String,
    #[serde(default)]
    pub authority_credential_ciphertext: Option<String>,
    #[serde(default)]
    pub email_credential_ciphertext: Option<String>,
}

async fn request<S: AsyncWrite + Unpin>(
    stream: &mut S,
    value: serde_json::Value,
) -> io::Result<()> {
    write_frame(stream, &serde_json::to_vec(&value).map_err(|_| invalid())?).await
}

pub async fn boot<S: AsyncRead + AsyncWrite + Unpin>(
    stream: &mut S,
    key_id: &str,
) -> io::Result<Boot> {
    request(stream, json!({"method":"boot", "keyId":key_id})).await?;
    let bytes = zeroize::Zeroizing::new(read_frame(stream).await?);
    let boot: Boot = serde_json::from_slice(&bytes).map_err(|_| invalid())?;
    for ciphertext in [
        &boot.authority_credential_ciphertext,
        &boot.email_credential_ciphertext,
    ]
    .into_iter()
    .flatten()
    {
        if ciphertext.is_empty() || ciphertext.len() > 8192 {
            return Err(invalid());
        }
        let decoded = STANDARD.decode(ciphertext).map_err(|_| invalid())?;
        if decoded.is_empty() || decoded.len() > 6144 {
            return Err(invalid());
        }
    }
    Ok(boot)
}

pub async fn persist_key<S: AsyncRead + AsyncWrite + Unpin>(
    stream: &mut S,
    key_id: &str,
    sealed: &[u8],
) -> io::Result<()> {
    request(
        stream,
        json!({"method":"persistKey", "keyId":key_id, "sealed":STANDARD.encode(sealed)}),
    )
    .await?;
    if stream.read_u8().await? == 0 {
        Ok(())
    } else {
        Err(unavailable())
    }
}

/// Best-effort: tells the parent which fixed startup step failed. No response.
#[cfg(all(target_os = "linux", feature = "nitro", feature = "kms"))]
pub async fn boot_failed<S: AsyncWrite + Unpin>(
    stream: &mut S,
    step: &'static str,
) -> io::Result<()> {
    request(stream, json!({"method":"bootFailed", "step":step})).await
}

pub async fn get_chain<S: AsyncRead + AsyncWrite + Unpin>(
    stream: &mut S,
    chain_id: &str,
) -> io::Result<Vec<LedgerRecord>> {
    request(stream, json!({"method":"getChain", "chainId":chain_id})).await?;
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
    Ok(records)
}

pub async fn append<S: AsyncRead + AsyncWrite + Unpin>(
    stream: &mut S,
    chain_id: &str,
    record: &LedgerRecord,
) -> Result<(), AppendError> {
    let bytes = record
        .canonical_bytes()
        .map_err(|_| AppendError::Unavailable)?;
    request(
        stream,
        json!({"method":"append", "chainId":chain_id, "record":STANDARD.encode(bytes)}),
    )
    .await
    .map_err(|_| AppendError::Unavailable)?;
    match stream.read_u8().await {
        Ok(0) => Ok(()),
        Ok(1) => Err(AppendError::Conflict),
        _ => Err(AppendError::Unavailable),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn boot_rejects_invalid_credential_ciphertexts_and_plaintext_fields() {
        for value in [
            json!(""),
            json!("not-base64!"),
            json!("a".repeat(8193)),
            json!({"accessKeyId":"plaintext"}),
        ] {
            let (mut host, mut enclave) = tokio::io::duplex(32768);
            let response = json!({"sealed":null,"accessKeyId":"test","secretAccessKey":"test","sessionToken":"test","authorityCredentialCiphertext":value});
            let task = tokio::spawn(async move {
                read_frame(&mut host).await.unwrap();
                write_frame(&mut host, &serde_json::to_vec(&response).unwrap())
                    .await
                    .unwrap();
            });
            assert!(boot(&mut enclave, "key").await.is_err());
            task.await.unwrap();
        }
    }
}
