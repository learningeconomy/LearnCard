//! Portable audit artifacts. A valid Proposal signature is never commit evidence.
use crate::ledger::{Hash, LedgerError};
use base64::{engine::general_purpose::STANDARD, Engine};
use p256::ecdsa::{signature::hazmat::PrehashVerifier, Signature, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecordKind {
    Proposal,
    Commit,
    Snapshot,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SignedAuthorityRecord {
    pub version: u32,
    pub kind: RecordKind,
    pub key_id: String,
    pub measurement: Hash,
    pub payload: String,
    pub signature: String,
}

impl SignedAuthorityRecord {
    pub fn signing_hash(&self) -> Result<Hash, LedgerError> {
        if self.version != 1
            || self.key_id.is_empty()
            || self.key_id.len() > 128
            || !self
                .key_id
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
            || self.payload.len()
                > if self.kind == RecordKind::Snapshot {
                    49_152
                } else {
                    8192
                }
        {
            return Err(LedgerError::Encoding);
        }
        let payload = STANDARD
            .decode(&self.payload)
            .map_err(|_| LedgerError::Encoding)?;
        if payload.is_empty() || STANDARD.encode(&payload) != self.payload {
            return Err(LedgerError::Encoding);
        }
        let mut hash = Sha256::new();
        hash.update(b"learncard-authority-signed-record-v1\0");
        hash.update([match self.kind {
            RecordKind::Proposal => 0,
            RecordKind::Commit => 1,
            RecordKind::Snapshot => 2,
        }]);
        hash.update((self.key_id.len() as u32).to_be_bytes());
        hash.update(self.key_id.as_bytes());
        hash.update(self.measurement);
        hash.update((payload.len() as u32).to_be_bytes());
        hash.update(payload);
        Ok(hash.finalize().into())
    }

    /// The caller pins this key independently; neither artifact kind supplies trust.
    pub fn verify(&self, key: &VerifyingKey) -> Result<(), LedgerError> {
        if self.signature.len() != 88 {
            return Err(LedgerError::Signature);
        }
        let bytes = STANDARD
            .decode(&self.signature)
            .map_err(|_| LedgerError::Signature)?;
        if STANDARD.encode(&bytes) != self.signature {
            return Err(LedgerError::Signature);
        }
        let signature = Signature::from_slice(&bytes).map_err(|_| LedgerError::Signature)?;
        if signature.normalize_s() != signature {
            return Err(LedgerError::Signature);
        }
        key.verify_prehash(&self.signing_hash()?, &signature)
            .map_err(|_| LedgerError::Signature)
    }
}

impl std::fmt::Debug for SignedAuthorityRecord {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("SignedAuthorityRecord")
    }
}

#[cfg(test)]
mod tests;
