//! Owner-signed enrollment changes. Pure Ed25519 over a domain-separated,
//! length-framed message; no host DID resolution, JSON signing or Ed25519ph.
//! This verifies intent against an authenticated snapshot, NOT commit freshness.
use super::state::{
    Binding, EnrollmentItem, EnrollmentStatus, ItemValue, StoredItem, MAX_COUNTER, SCHEMA_VERSION,
};
use crate::{crypto::escrow_blob_identity, ledger::Hash, wire::EscrowEnvelope};
use base64::{engine::general_purpose::STANDARD, Engine};
use ed25519_dalek::{Signature, VerifyingKey};
use serde::{Deserialize, Deserializer, Serialize};
use sha2::{Digest, Sha256};

pub const INTENT_DOMAIN: &[u8] = b"learncard-escrow-enrollment-intent-v1\0";
pub const MAX_SIGNED_INTENT_BYTES: usize = 4096;

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
#[error("enrollment intent rejected")]
pub struct IntentError;

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EnrollmentAction {
    Enroll,
    Replace,
    Disable,
    Carry,
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PinAction {
    Set,
    Change,
    Clear,
    Keep,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EnrollmentIntent {
    pub version: u32,
    pub tenant: String,
    pub did: String,
    pub authority_generation: String,
    pub expected_enrollment_version: u64,
    pub action: EnrollmentAction,
    // Explicit null is required, not an omitted field with an implicit default.
    #[serde(deserialize_with = "required_optional")]
    pub source_blob_identity: Option<String>,
    #[serde(deserialize_with = "required_optional")]
    pub target_blob_identity: Option<String>,
    pub pin_action: PinAction,
    pub share_version: u32,
    pub enrollment_epoch: u64,
    pub request_id: String,
    pub allow_rewrap: bool,
}

fn required_optional<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<String>, D::Error> {
    Option::<String>::deserialize(deserializer)
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SignedEnrollmentIntent {
    pub intent: EnrollmentIntent,
    /// Canonical padded standard base64 of the raw 64-byte Ed25519 R || S.
    pub signature: String,
}

impl SignedEnrollmentIntent {
    pub fn decode(bytes: &[u8]) -> Result<Self, IntentError> {
        require(!bytes.is_empty() && bytes.len() <= MAX_SIGNED_INTENT_BYTES)?;
        let signed: Self = serde_json::from_slice(bytes).map_err(|_| IntentError)?;
        signed.intent.canonical_bytes()?;
        signed.signature_bytes()?;
        Ok(signed)
    }

    fn signature_bytes(&self) -> Result<Signature, IntentError> {
        require(self.signature.len() == 88)?;
        let bytes = STANDARD.decode(&self.signature).map_err(|_| IntentError)?;
        require(STANDARD.encode(&bytes) == self.signature)?;
        Signature::from_slice(&bytes).map_err(|_| IntentError)
    }
}

impl EnrollmentIntent {
    /// V1: domain, then 13 fields each prefixed by its u32 BE byte length.
    /// Numeric field widths and enum tags are fixed; see the shared golden vector.
    pub fn canonical_bytes(&self) -> Result<Vec<u8>, IntentError> {
        require(
            self.version == 1
                && self.expected_enrollment_version <= MAX_COUNTER
                && self.share_version > 0
                && self.enrollment_epoch > 0
                && self.enrollment_epoch <= MAX_COUNTER,
        )?;
        label(&self.tenant)?;
        label(&self.authority_generation)?;
        require(
            !self.request_id.is_empty()
                && self.request_id.len() <= 112
                && self
                    .request_id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b)),
        )?;
        did_key(&self.did)?;
        let source = optional_hash(self.source_blob_identity.as_deref())?;
        let target = optional_hash(self.target_blob_identity.as_deref())?;
        match self.action {
            EnrollmentAction::Enroll => require(source.is_none() && target.is_some())?,
            EnrollmentAction::Replace | EnrollmentAction::Carry => {
                require(source.is_some() && target.is_some() && source != target)?
            }
            EnrollmentAction::Disable => require(
                source.is_some()
                    && target.is_none()
                    && self.pin_action == PinAction::Keep
                    && !self.allow_rewrap,
            )?,
        }
        if self.action == EnrollmentAction::Carry {
            require(self.pin_action == PinAction::Keep)?;
        }
        let action = [match self.action {
            EnrollmentAction::Enroll => 0,
            EnrollmentAction::Replace => 1,
            EnrollmentAction::Disable => 2,
            EnrollmentAction::Carry => 3,
        }];
        let pin = [match self.pin_action {
            PinAction::Set => 0,
            PinAction::Change => 1,
            PinAction::Clear => 2,
            PinAction::Keep => 3,
        }];
        let mut bytes = INTENT_DOMAIN.to_vec();
        for field in [
            self.version.to_be_bytes().as_slice(),
            self.tenant.as_bytes(),
            self.did.as_bytes(),
            self.authority_generation.as_bytes(),
            self.expected_enrollment_version.to_be_bytes().as_slice(),
            &action,
            source.as_ref().map(Hash::as_slice).unwrap_or_default(),
            target.as_ref().map(Hash::as_slice).unwrap_or_default(),
            &pin,
            self.share_version.to_be_bytes().as_slice(),
            self.enrollment_epoch.to_be_bytes().as_slice(),
            self.request_id.as_bytes(),
            &[u8::from(self.allow_rewrap)],
        ] {
            bytes.extend_from_slice(&(field.len() as u32).to_be_bytes());
            bytes.extend_from_slice(field);
        }
        Ok(bytes)
    }
}

/// Supply only a snapshot read from AuthorityStore. Envelopes are the actual
/// request inputs, not identities claimed by Mongo or copied from signed fields.
pub struct IntentContext<'a> {
    pub binding: &'a Binding,
    pub current: Option<&'a EnrollmentItem>,
    pub source: Option<&'a EscrowEnvelope>,
    pub target: Option<&'a EscrowEnvelope>,
}

/// Only this verifier can construct the proof. Policy must still decrypt and
/// validate plaintext DID/share/PIN semantics, then conditionally commit against
/// this exact enrollment version/source. A signature is not permission to retry.
pub struct VerifiedEnrollmentIntent {
    intent: EnrollmentIntent,
}
impl VerifiedEnrollmentIntent {
    pub fn intent(&self) -> &EnrollmentIntent {
        &self.intent
    }
}

pub fn verify_intent(
    signed: &SignedEnrollmentIntent,
    context: IntentContext<'_>,
) -> Result<VerifiedEnrollmentIntent, IntentError> {
    let intent = &signed.intent;
    let canonical = intent.canonical_bytes()?;
    let key = did_key(&intent.did)?;
    key.verify_strict(&canonical, &signed.signature_bytes()?)
        .map_err(|_| IntentError)?;
    context.binding.validate().map_err(|_| IntentError)?;
    let did_hash: Hash = Sha256::digest(intent.did.as_bytes()).into();
    require(
        intent.tenant == context.binding.tenant
            && intent.authority_generation == context.binding.generation
            && did_hash == context.binding.did_hash,
    )?;
    if let Some(current) = context.current {
        StoredItem {
            schema_version: SCHEMA_VERSION,
            binding: context.binding.clone(),
            value: ItemValue::Enrollment(current.clone()),
        }
        .validate(context.binding)
        .map_err(|_| IntentError)?;
    }
    require(
        intent.expected_enrollment_version
            == context
                .current
                .map(|c| c.revisions.enrollment.get())
                .unwrap_or(0),
    )?;
    let source = context
        .source
        .map(escrow_blob_identity)
        .transpose()
        .map_err(|_| IntentError)?;
    let target = context
        .target
        .map(escrow_blob_identity)
        .transpose()
        .map_err(|_| IntentError)?;
    require(
        source == optional_hash(intent.source_blob_identity.as_deref())?
            && target == optional_hash(intent.target_blob_identity.as_deref())?,
    )?;
    let current_blob = context.current.and_then(|c| match &c.enrollment {
        EnrollmentStatus::Active { blob } => Some(blob.as_ref()),
        EnrollmentStatus::Disabled => None,
    });
    require(source == current_blob.map(|b| b.identity))?;
    let old_epoch = context.current.map(|c| c.epoch.get()).unwrap_or(0);
    let has_pin = context.current.is_some_and(|c| c.pin.configured);
    match intent.action {
        EnrollmentAction::Enroll => require(current_blob.is_none())?,
        EnrollmentAction::Replace => {
            require(intent.share_version >= current_blob.ok_or(IntentError)?.share_version)?
        }
        EnrollmentAction::Carry => require(
            has_pin && intent.share_version > current_blob.ok_or(IntentError)?.share_version,
        )?,
        EnrollmentAction::Disable => {
            require(intent.share_version == current_blob.ok_or(IntentError)?.share_version)?
        }
    }
    let epoch = if intent.action == EnrollmentAction::Disable {
        old_epoch
    } else {
        old_epoch.checked_add(1).ok_or(IntentError)?
    };
    require(intent.enrollment_epoch == epoch)?;
    match intent.pin_action {
        PinAction::Set => require(!has_pin)?,
        PinAction::Change | PinAction::Clear => require(has_pin)?,
        PinAction::Keep => require(!(intent.action == EnrollmentAction::Enroll && has_pin))?,
    }
    Ok(VerifiedEnrollmentIntent {
        intent: intent.clone(),
    })
}

fn did_key(did: &str) -> Result<VerifyingKey, IntentError> {
    let encoded = did.strip_prefix("did:key:z").ok_or(IntentError)?;
    require(encoded.len() == 47)?;
    let mut decoded = [0; 34];
    let length = bs58::decode(encoded)
        .onto(&mut decoded)
        .map_err(|_| IntentError)?;
    require(length == 34 && decoded[..2] == [0xed, 0x01])?;
    require(bs58::encode(decoded).into_string() == encoded)?;
    // Reject noncanonical compressed Edwards y coordinates (ZIP215 aliases).
    let mut y = [0; 32];
    y.copy_from_slice(&decoded[2..]);
    y[31] &= 0x7f;
    let mut prime = [0xff; 32];
    prime[0] = 0xed;
    prime[31] = 0x7f;
    require(y.iter().rev().cmp(prime.iter().rev()).is_lt())?;
    let key = VerifyingKey::from_bytes(decoded[2..].try_into().map_err(|_| IntentError)?)
        .map_err(|_| IntentError)?;
    require(!key.is_weak())?;
    Ok(key)
}
fn optional_hash(value: Option<&str>) -> Result<Option<Hash>, IntentError> {
    value
        .map(|text| {
            require(
                text.len() == 64
                    && text
                        .bytes()
                        .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)),
            )?;
            let mut hash = [0; 32];
            hex::decode_to_slice(text, &mut hash).map_err(|_| IntentError)?;
            Ok(hash)
        })
        .transpose()
}
fn require(value: bool) -> Result<(), IntentError> {
    if value {
        Ok(())
    } else {
        Err(IntentError)
    }
}
fn label(value: &str) -> Result<(), IntentError> {
    require(
        !value.is_empty()
            && value.len() <= 128
            && value
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"_-".contains(&b)),
    )
}

#[cfg(test)]
mod tests;
