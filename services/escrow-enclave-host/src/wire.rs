//! Independent host DTOs. These types intentionally do not implement Debug.
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Envelope {
    pub version: u32,
    pub algorithm: String,
    pub key_id: String,
    pub ephemeral_public_key: String,
    pub salt: String,
    pub iv: String,
    pub ciphertext: String,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReleasePolicy {
    Hold,
    Pin,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HoldRecord {
    pub hold_id: String,
    pub did: String,
    pub share_version: u32,
    pub blob_hash: String,
    pub enrollment_epoch: u64,
    pub release_policy: ReleasePolicy,
    pub client_ephemeral_public_key: String,
    pub created_lo: u64,
    pub created_hi: u64,
    pub policy_version: u32,
    pub signature: String,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SignedHoldRecord {
    pub hold: HoldRecord,
    pub hold_duration_ms: u64,
    pub ledger_seq: u64,
}
#[derive(Serialize, Deserialize)]
#[serde(
    tag = "method",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Request {
    Attest {
        nonce: Vec<u8>,
    },
    CreateHold {
        envelope: Envelope,
        hold_id: String,
        request_id: String,
        expected_did: String,
        expected_share_version: u32,
        enrollment_epoch: u64,
        release_policy: ReleasePolicy,
        client_ephemeral_public_key: String,
    },
    VerifyBlob {
        envelope: Envelope,
        expected_did: String,
        expected_share_version: u32,
    },
    Release {
        envelope: Envelope,
        hold: SignedHoldRecord,
        request_id: String,
        client_ephemeral_public_key: String,
        expected_did: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        pin_proof: Option<String>,
    },
    Cancel {
        envelope: Envelope,
        hold: SignedHoldRecord,
        request_id: String,
        client_ephemeral_public_key: String,
        expected_did: String,
    },
    Health,
}
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Measurements {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub image_sha384: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pcr0: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pcr1: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pcr2: Option<String>,
}
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Mode {
    Software,
    Nitro,
}
#[derive(Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorCode {
    Policy,
    PinMismatch,
    Blob,
    Unavailable,
    Ledger,
    Time,
}
#[derive(Serialize, Deserialize)]
#[serde(
    tag = "method",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Response {
    Attest {
        mode: Mode,
        key_id: String,
        public_key: String,
        measurements: Measurements,
        document: String,
        issued_at: String,
    },
    CreateHold {
        hold: SignedHoldRecord,
    },
    VerifyBlob {
        ok: bool,
        has_pin: bool,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        reason: Option<String>,
    },
    Release {
        sealed: Envelope,
    },
    Cancel {
        cancelled: bool,
    },
    Health {
        ok: bool,
    },
    Error {
        code: ErrorCode,
        message: String,
    },
}
