//! NSM attestation. Parsing is NOT verification or authorization.
//! Escrow P-256 SPKI belongs in user_data; the optional RSA KMS key is public_key.

use ciborium::value::Value;
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;
use std::collections::BTreeMap;
use thiserror::Error;

#[derive(Clone)]
pub struct AttestationRequest {
    pub user_data: Vec<u8>,
    pub nonce: Vec<u8>,
    pub public_key: Option<Vec<u8>>,
}

impl AttestationRequest {
    /// Check bounds before either hardware IO or fake signing.
    pub fn validate(&self) -> Result<(), NsmError> {
        for (field, size, cap) in [
            ("user_data", self.user_data.len(), 1024),
            ("nonce", self.nonce.len(), 512),
            (
                "public_key",
                self.public_key.as_ref().map_or(0, Vec::len),
                1024,
            ),
        ] {
            if size > cap {
                return Err(NsmError::InputTooLarge(field));
            }
        }
        Ok(())
    }
}

#[derive(Debug, Error)]
pub enum NsmError {
    #[error("NSM {0} exceeds size limit")]
    InputTooLarge(&'static str),
    #[error("NSM device unavailable")]
    Unavailable,
    #[cfg(feature = "nitro")]
    #[error("NSM rejected request: {0:?}")]
    Device(aws_nitro_enclaves_nsm_api::api::ErrorCode),
    #[error("Unexpected NSM response")]
    UnexpectedResponse,
    #[error("Invalid attestation encoding")]
    Encoding,
    #[error("Test attestation signing failed")]
    Signing,
}

pub trait NsmDriver: Send + Sync {
    fn attest(&self, req: AttestationRequest) -> Result<Vec<u8>, NsmError>;
}

/// Owns one NSM descriptor; serializes calls and closes it exactly once on drop.
#[cfg(feature = "nitro")]
pub struct RealNsm {
    fd: i32,
    lock: std::sync::Mutex<()>,
}

#[cfg(feature = "nitro")]
impl RealNsm {
    pub fn new() -> Result<Self, NsmError> {
        let fd = aws_nitro_enclaves_nsm_api::driver::nsm_init();
        if fd < 0 {
            return Err(NsmError::Unavailable);
        }
        Ok(Self {
            fd,
            lock: std::sync::Mutex::new(()),
        })
    }
}

#[cfg(feature = "nitro")]
impl Drop for RealNsm {
    fn drop(&mut self) {
        aws_nitro_enclaves_nsm_api::driver::nsm_exit(self.fd);
    }
}

#[cfg(feature = "nitro")]
impl NsmDriver for RealNsm {
    fn attest(&self, req: AttestationRequest) -> Result<Vec<u8>, NsmError> {
        use aws_nitro_enclaves_nsm_api::{
            api::{Request, Response},
            driver::nsm_process_request,
        };
        req.validate()?;
        let _guard = self.lock.lock().map_err(|_| NsmError::Unavailable)?;
        match nsm_process_request(
            self.fd,
            Request::Attestation {
                user_data: Some(req.user_data.into()),
                nonce: Some(req.nonce.into()),
                public_key: req.public_key.map(Into::into),
            },
        ) {
            Response::Attestation { document } => Ok(document),
            Response::Error(code) => Err(NsmError::Device(code)),
            _ => Err(NsmError::UnexpectedResponse),
        }
    }
}

/// Untrusted claims only. Never use this type as evidence of a verified attestation.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct ParsedAttestation {
    pub module_id: String,
    pub digest: String,
    pub timestamp: u64,
    pub pcrs: BTreeMap<u8, ByteBuf>,
    pub certificate: ByteBuf,
    /// AWS ordering: root first, nearest issuer last.
    pub cabundle: Vec<ByteBuf>,
    pub public_key: Option<ByteBuf>,
    pub user_data: Option<ByteBuf>,
    pub nonce: Option<ByteBuf>,
}

fn decode<T: serde::de::DeserializeOwned>(bytes: &[u8]) -> Result<T, NsmError> {
    let mut reader = bytes;
    let value = ciborium::from_reader(&mut reader).map_err(|_| NsmError::Encoding)?;
    if !reader.is_empty() {
        return Err(NsmError::Encoding);
    }
    Ok(value)
}

#[cfg(any(test, feature = "fake-nsm"))]
fn encode<T: Serialize>(value: &T) -> Result<Vec<u8>, NsmError> {
    let mut bytes = Vec::new();
    ciborium::into_writer(value, &mut bytes).map_err(|_| NsmError::Encoding)?;
    Ok(bytes)
}

/// Decode an ES384 COSE envelope and its payload, WITHOUT checking its signature,
/// certificate chain, PCRs, nonce or timestamp. Input is capped at the NSM's 12 KiB.
pub fn parse_attestation_document(bytes: &[u8]) -> Result<ParsedAttestation, NsmError> {
    if bytes.len() > 0x3000 {
        return Err(NsmError::Encoding);
    }
    let value: Value = decode(bytes)?;
    let value = match value {
        Value::Tag(18, inner) => *inner,
        other => other,
    };
    let Value::Array(parts) = value else {
        return Err(NsmError::Encoding);
    };
    let [Value::Bytes(protected), Value::Map(unprotected), Value::Bytes(payload), Value::Bytes(signature)] =
        parts.as_slice()
    else {
        return Err(NsmError::Encoding);
    };
    let header: Value = decode(protected)?;
    if header != Value::Map(vec![(1.into(), (-35).into())])
        || !unprotected.is_empty()
        || signature.len() != 96
    {
        return Err(NsmError::Encoding);
    }
    decode(payload)
}

#[cfg(any(test, feature = "fake-nsm"))]
mod fake;
#[cfg(any(test, feature = "fake-nsm"))]
pub use fake::FakeNsm;

#[cfg(test)]
mod tests;
