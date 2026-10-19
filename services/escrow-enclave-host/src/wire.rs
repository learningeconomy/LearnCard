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
    HoldState {
        expected_did: String,
        hold: SignedHoldRecord,
        nonce: String,
    },
    EnrollmentState {
        expected_did: String,
        nonce: String,
    },
    ApplyEnrollment {
        signed_intent: serde_json::Value,
        source_envelope: Option<Envelope>,
        target_envelope: Option<Envelope>,
    },
    AuthorityRewrap {
        envelope: Envelope,
        expected_did: String,
        expected_share_version: u32,
        source_enrollment_epoch: u64,
    },
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
    CarryPinVerifier {
        source_envelope: Envelope,
        target_envelope: Envelope,
        expected_did: String,
        source_share_version: u32,
        target_share_version: u32,
        source_enrollment_epoch: u64,
        target_enrollment_epoch: u64,
    },
    RewrapEscrowBlob {
        envelope: Envelope,
        expected_did: String,
        expected_share_version: u32,
        source_enrollment_epoch: u64,
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
    ConfirmHold {
        envelope: Envelope,
        hold: SignedHoldRecord,
        request_id: String,
        client_ephemeral_public_key: String,
        expected_did: String,
        code: String,
    },
    ResendCode {
        envelope: Envelope,
        hold: SignedHoldRecord,
        request_id: String,
        client_ephemeral_public_key: String,
        expected_did: String,
    },
    SendReleaseWarning {
        hold_id: String,
        request_id: String,
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
    CodeMismatch,
    CodeExpired,
    CodeLocked,
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
    HoldState {
        proof: serde_json::Value,
    },
    EnrollmentState {
        state: serde_json::Value,
        proof: serde_json::Value,
    },
    ApplyEnrollment {
        result: serde_json::Value,
    },
    AuthorityRewrap {
        result: serde_json::Value,
    },
    Attest {
        mode: Mode,
        key_id: String,
        previous_key_ids: Vec<String>,
        public_key: String,
        measurements: Measurements,
        document: String,
        issued_at: String,
    },
    CreateHold {
        hold: SignedHoldRecord,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        delivery: Option<serde_json::Value>,
    },
    VerifyBlob {
        ok: bool,
        has_pin: bool,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        reason: Option<String>,
    },
    CarryPinVerifier {
        envelope: Envelope,
    },
    RewrapEscrowBlob {
        envelope: Envelope,
    },
    Release {
        sealed: Envelope,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        receipt: Option<serde_json::Value>,
    },
    Cancel {
        cancelled: bool,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        receipt: Option<serde_json::Value>,
    },
    ConfirmHold {
        confirmed: bool,
        receipt: serde_json::Value,
        /// Authoritative enclave confirmation time; lca-api derives the
        /// release deadline from it, so it must survive reserialization.
        confirmed_hi_ms: u64,
    },
    ResendCode {
        sent: bool,
        receipt: serde_json::Value,
    },
    SendReleaseWarning {
        sent: bool,
        receipt: serde_json::Value,
        /// Authoritative enclave warning-sent time (see `confirmed_hi_ms`).
        release_warning_sent_hi_ms: u64,
    },
    Health {
        ok: bool,
    },
    Error {
        code: ErrorCode,
        message: String,
    },
}
