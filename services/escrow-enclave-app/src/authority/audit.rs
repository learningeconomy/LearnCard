//! Public audit schemas usable by a verifier-only monitor. No writer, policy
//! execution, credentials, enclave driver or host freshness dependency here.
use super::state::{
    Binding, Counter, HoldStatus, OperationKind, OperationOutcome, PinState, Revisions,
};
use crate::{ledger::Hash, time::TimeEvidence};
use serde::{Deserialize, Serialize};

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommitReceipt {
    pub schema_version: u32,
    pub binding: Binding,
    pub execution_id: [u8; 16],
    pub revisions: Revisions,
    pub transaction_digest: Hash,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ExecutionRecord {
    pub receipt: CommitReceipt,
    pub proposed_event: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AuthorityEvent {
    pub binding: Binding,
    pub request_id: String,
    pub kind: OperationKind,
    pub outcome: OperationOutcome,
    pub previous_revisions: Option<Revisions>,
    pub revisions: Revisions,
    pub previous_pin: Option<PinState>,
    pub pin: PinState,
    pub epoch: Counter,
    pub source_identity: Option<Hash>,
    pub target_identity: Option<Hash>,
    pub share_version: Option<u32>,
    pub rewrap_delegated: bool,
    pub hold_id: Option<String>,
    pub hold_status: Option<HoldStatus>,
    pub request_digest: Hash,
    pub time: TimeEvidence,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AuthorityCommitPayload {
    pub commit: CommitReceipt,
    pub event_hash: Hash,
    pub request_digest: Hash,
    pub result_blob_identity: Option<Hash>,
    pub enrollment_epoch: u64,
}
