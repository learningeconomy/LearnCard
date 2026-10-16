//! Versioned persistence schema, not an authorization API or a host wire contract.
//!
//! Every write must eventually be fenced by an AuthorityStore transaction. Loading
//! one of these snapshots alone never authorizes comparison, release or enrollment.
//! There is no legacy/Mongo import, default enrollment, TTL or receipt expiry.
use super::AuthorityError as Error;
use crate::{crypto::escrow_blob_identity, ledger::Hash, wire::EscrowEnvelope};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const SCHEMA_VERSION: u32 = 1;
pub const MAX_ITEM_BYTES: usize = 64 * 1024;
pub const MAX_ENVELOPE_BYTES: usize = 24 * 1024;
pub const MAX_EVENT_BYTES: usize = 8192;
pub const MAX_COUNTER: u64 = (1 << 53) - 1;
pub const PIN_BUDGET: u8 = 10;

/// Persisted values remain exactly representable by JavaScript consumers.
#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "u64", into = "u64")]
pub struct Counter(u64);

impl TryFrom<u64> for Counter {
    type Error = Error;
    fn try_from(value: u64) -> Result<Self, Error> {
        if value > MAX_COUNTER {
            return Err(Error::InvalidRequest);
        }
        Ok(Self(value))
    }
}

impl From<Counter> for u64 {
    fn from(value: Counter) -> Self {
        value.0
    }
}

impl Counter {
    pub fn get(self) -> u64 {
        self.0
    }

    pub fn next(self) -> Result<Self, Error> {
        Self::try_from(self.0.checked_add(1).ok_or(Error::InvalidRequest)?)
    }

    fn positive(self) -> Result<(), Error> {
        require(self.0 != 0)
    }
}

/// Operation revision changes on *every* commit. Enrollment version changes only
/// when enrollment changes, so unrelated holds never invalidate owner intent.
#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Revisions {
    pub operation: Counter,
    pub enrollment: Counter,
}

impl Revisions {
    /// Computes a candidate, not a commit. Store conditions must fence the old pair.
    pub fn advance(self, enrollment_changed: bool) -> Result<Self, Error> {
        self.validate()?;
        Ok(Self {
            operation: self.operation.next()?,
            enrollment: if enrollment_changed {
                self.enrollment.next()?
            } else {
                self.enrollment
            },
        })
    }

    fn validate(self) -> Result<(), Error> {
        self.enrollment.positive()?;
        require(self.operation.get() >= self.enrollment.get())
    }
}

/// Tenant/generation come from measured configuration; DID hash from the locally
/// verified account key (enrollment) or authenticated blob (recovery).
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Binding {
    pub tenant: String,
    pub generation: String,
    pub did_hash: Hash,
}

impl Binding {
    pub fn validate(&self) -> Result<(), Error> {
        label(&self.tenant)?;
        label(&self.generation)
    }

    /// Length framing prevents delimiter aliases; no raw DID is placed in keys.
    pub fn partition_key(&self) -> Result<String, Error> {
        self.validate()?;
        let mut hash = Sha256::new();
        hash.update(b"learncard-escrow-authority-partition-v1\0");
        for field in [self.tenant.as_bytes(), self.generation.as_bytes()] {
            hash.update((field.len() as u64).to_be_bytes());
            hash.update(field);
        }
        hash.update(self.did_hash);
        Ok(format!("ACCOUNT#{}", hex::encode(hash.finalize())))
    }
}

/// No verifier or public PIN commitment. A clear action also advances generation
/// and resets attempts; keep/carry/rewrap preserve the entire value.
#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PinState {
    pub generation: Counter,
    pub configured: bool,
    pub attempts_used: u8,
}

impl PinState {
    fn validate(self) -> Result<(), Error> {
        require(self.attempts_used <= PIN_BUDGET)?;
        require(self.configured || self.attempts_used == 0)?;
        require(!self.configured || self.generation.get() > 0)
    }
}

/// Ciphertext and identity are inseparable in the active row. A successful switch
/// must not leave the only copy of a newly randomized envelope in a lost response.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ActiveBlob {
    pub identity: Hash,
    pub envelope: EscrowEnvelope,
    pub share_version: u32,
    pub chain_head: Option<ChainHead>,
    pub rewrap_delegated: bool,
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChainHead {
    pub sequence: Counter,
    pub hash: Hash,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "camelCase", deny_unknown_fields)]
pub enum EnrollmentStatus {
    Active {
        blob: Box<ActiveBlob>,
    },
    /// Durable tombstone, never deleted or interpreted as never enrolled.
    Disabled,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EnrollmentItem {
    pub revisions: Revisions,
    pub epoch: Counter,
    pub pin: PinState,
    pub intent_digest: Hash,
    pub enrollment: EnrollmentStatus,
}

impl EnrollmentItem {
    fn validate(&self) -> Result<(), Error> {
        self.revisions.validate()?;
        self.epoch.positive()?;
        require(self.epoch.get() <= self.revisions.enrollment.get())?;
        self.pin.validate()?;
        require(self.pin.generation.get() <= self.revisions.enrollment.get())?;
        if let EnrollmentStatus::Active { blob } = &self.enrollment {
            require(blob.share_version != 0)?;
            // Check sizes before the crypto parser allocates decoded fields.
            let fields = [
                &blob.envelope.algorithm,
                &blob.envelope.key_id,
                &blob.envelope.ephemeral_public_key,
                &blob.envelope.salt,
                &blob.envelope.iv,
                &blob.envelope.ciphertext,
            ];
            require(fields.iter().all(|s| s.len() <= MAX_ENVELOPE_BYTES))?;
            require(
                serde_json::to_vec(&blob.envelope)
                    .map_err(|_| Error::InvalidRequest)?
                    .len()
                    <= MAX_ENVELOPE_BYTES,
            )?;
            require(
                escrow_blob_identity(&blob.envelope).map_err(|_| Error::InvalidRequest)?
                    == blob.identity,
            )?;
            if let Some(head) = blob.chain_head {
                require(head.sequence.get() < crate::ledger::MAX_CHAIN_RECORDS as u64)?;
            }
        }
        Ok(())
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum HoldStatus {
    Pending,
    Released,
    Cancelled,
}

/// One bounded item per hold; terminal rows are retained after rotation. The
/// signed-hold digest binds recipient/policy/time without storing raw identity.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HoldItem {
    pub hold_id: String,
    pub enrollment_version: Counter,
    pub epoch: Counter,
    pub blob_identity: Hash,
    pub signed_hold_digest: Hash,
    pub created_revision: Counter,
    pub updated_revision: Counter,
    pub status: HoldStatus,
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum OperationKind {
    Enroll,
    Replace,
    Disable,
    Carry,
    Rewrap,
    CreateHold,
    PinAttempt,
    Release,
    Cancel,
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "phase", rename_all = "camelCase", deny_unknown_fields)]
pub enum OperationOutcome {
    Committed,
    /// An abandoned reservation remains spent forever. Reading this is NEVER
    /// permission to compare again, even when the enclave execution ID matches.
    Reserved,
    Compared {
        matched: bool,
    },
}

/// Durable operation metadata/receipt, independent of AWS's token retention.
/// `proposed_event` is an audit proposal, NOT proof of commit. A portable enclave
/// signature over a post-commit receipt is a separate policy-layer artifact.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OperationItem {
    pub request_id: String,
    pub execution_id: [u8; 16],
    pub kind: OperationKind,
    pub outcome: OperationOutcome,
    pub revisions: Revisions,
    pub request_digest: Hash,
    pub proposed_event: Vec<u8>,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(
    tag = "kind",
    content = "value",
    rename_all = "camelCase",
    deny_unknown_fields
)]
pub enum ItemValue {
    Enrollment(EnrollmentItem),
    Hold(HoldItem),
    Operation(OperationItem),
}

/// Encode/decode this bounded payload inside the table's item; never deserialize
/// it from an RPC as authority. Binding must equal the expected measured scope.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StoredItem {
    pub schema_version: u32,
    pub binding: Binding,
    pub value: ItemValue,
}

impl StoredItem {
    pub fn validate(&self, expected: &Binding) -> Result<(), Error> {
        require(self.schema_version == SCHEMA_VERSION && &self.binding == expected)?;
        self.binding.validate()?;
        match &self.value {
            ItemValue::Enrollment(item) => item.validate(),
            ItemValue::Hold(item) => {
                identifier(&item.hold_id)?;
                item.epoch.positive()?;
                require(item.epoch.get() <= item.enrollment_version.get())?;
                require(item.enrollment_version.get() <= item.created_revision.get())?;
                require(item.created_revision.get() <= item.updated_revision.get())?;
                require(
                    item.status == HoldStatus::Pending
                        || item.created_revision.get() < item.updated_revision.get(),
                )
            }
            ItemValue::Operation(item) => {
                identifier(&item.request_id)?;
                item.revisions.validate()?;
                require(
                    !item.proposed_event.is_empty() && item.proposed_event.len() <= MAX_EVENT_BYTES,
                )?;
                require(
                    matches!(
                        (item.kind, item.outcome),
                        (
                            OperationKind::PinAttempt,
                            OperationOutcome::Reserved | OperationOutcome::Compared { .. }
                        )
                    ) || (item.kind != OperationKind::PinAttempt
                        && item.outcome == OperationOutcome::Committed),
                )
            }
        }
    }

    pub fn sort_key(&self) -> Result<String, Error> {
        self.validate(&self.binding)?;
        Ok(match &self.value {
            ItemValue::Enrollment(_) => "ENROLLMENT".to_owned(),
            ItemValue::Hold(item) => format!("HOLD#{}", item.hold_id),
            ItemValue::Operation(item) => format!("OPERATION#{}", item.request_id),
        })
    }

    /// Storage encoding only, deliberately NOT the signed-intent canonical form.
    pub fn encode(&self) -> Result<Vec<u8>, Error> {
        self.validate(&self.binding)?;
        let bytes = serde_json::to_vec(self).map_err(|_| Error::InvalidRequest)?;
        require(bytes.len() <= MAX_ITEM_BYTES)?;
        Ok(bytes)
    }

    /// Bounds input before parsing. Unknown/duplicate fields and absent mandatory
    /// fields fail; a missing row must be handled separately, never defaulted here.
    pub fn decode(bytes: &[u8], expected: &Binding, sort_key: &str) -> Result<Self, Error> {
        require(!bytes.is_empty() && bytes.len() <= MAX_ITEM_BYTES)?;
        let item: Self = serde_json::from_slice(bytes).map_err(|_| Error::InvalidRequest)?;
        item.validate(expected)?;
        require(item.sort_key()? == sort_key)?;
        Ok(item)
    }
}

fn require(condition: bool) -> Result<(), Error> {
    if condition {
        Ok(())
    } else {
        Err(Error::InvalidRequest)
    }
}

fn label(value: &str) -> Result<(), Error> {
    require(
        !value.is_empty()
            && value.len() <= 128
            && value
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"_-".contains(&b)),
    )
}

fn identifier(value: &str) -> Result<(), Error> {
    require(
        !value.is_empty()
            && value.len() <= 112
            && value
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b)),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn counter(value: u64) -> Counter {
        Counter::try_from(value).unwrap()
    }
    fn binding() -> Binding {
        Binding {
            tenant: "learncard".into(),
            generation: "g1".into(),
            did_hash: [1; 32],
        }
    }
    fn enrollment() -> StoredItem {
        StoredItem {
            schema_version: SCHEMA_VERSION,
            binding: binding(),
            value: ItemValue::Enrollment(EnrollmentItem {
                revisions: Revisions {
                    operation: counter(7),
                    enrollment: counter(3),
                },
                epoch: counter(2),
                pin: PinState {
                    generation: counter(1),
                    configured: true,
                    attempts_used: 10,
                },
                intent_digest: [2; 32],
                enrollment: EnrollmentStatus::Disabled,
            }),
        }
    }
    fn roundtrip(item: &StoredItem) {
        let decoded = StoredItem::decode(
            &item.encode().unwrap(),
            &item.binding,
            &item.sort_key().unwrap(),
        )
        .unwrap();
        assert!(decoded == *item);
    }

    #[test]
    fn hold_activity_does_not_invalidate_enrollment_version() {
        let initial = Revisions {
            operation: counter(5),
            enrollment: counter(3),
        };
        let hold = initial.advance(false).unwrap();
        assert_eq!(hold.operation.get(), 6);
        assert_eq!(hold.enrollment.get(), 3);
        let replacement = hold.advance(true).unwrap();
        assert_eq!(replacement.operation.get(), 7);
        assert_eq!(replacement.enrollment.get(), 4);
        assert!(counter(MAX_COUNTER).next().is_err());
        assert!(Counter::try_from(MAX_COUNTER + 1).is_err());
        assert!(Revisions {
            operation: counter(1),
            enrollment: counter(2)
        }
        .advance(false)
        .is_err());
    }

    #[test]
    fn disabled_tombstone_retains_budget_and_versions_without_ttl() {
        let item = enrollment();
        roundtrip(&item);
        let bytes = item.encode().unwrap();
        let text = std::str::from_utf8(&bytes).unwrap();
        assert!(text.contains("\"attemptsUsed\":10"));
        assert!(!text.contains("ttl"));
        assert!(StoredItem::decode(b"{}", &binding(), "ENROLLMENT").is_err());
    }

    #[test]
    fn active_identity_requires_the_persisted_output_envelope() {
        let vector: serde_json::Value = serde_json::from_str(include_str!(
            "../../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
        ))
        .unwrap();
        let envelope: EscrowEnvelope =
            serde_json::from_value(vector["blobs"][1]["envelope"].clone()).unwrap();
        let mut item = enrollment();
        let ItemValue::Enrollment(state) = &mut item.value else {
            unreachable!()
        };
        state.enrollment = EnrollmentStatus::Active {
            blob: Box::new(ActiveBlob {
                identity: escrow_blob_identity(&envelope).unwrap(),
                envelope,
                share_version: 42,
                chain_head: None,
                rewrap_delegated: true,
            }),
        };
        roundtrip(&item);
        let ItemValue::Enrollment(state) = &mut item.value else {
            unreachable!()
        };
        let EnrollmentStatus::Active { blob } = &mut state.enrollment else {
            unreachable!()
        };
        blob.identity[0] ^= 1;
        assert!(item.encode().is_err());
    }

    #[test]
    fn scope_and_item_keys_cannot_be_transplanted() {
        let item = enrollment();
        let bytes = item.encode().unwrap();
        for wrong in [
            Binding {
                tenant: "other".into(),
                ..binding()
            },
            Binding {
                generation: "g2".into(),
                ..binding()
            },
            Binding {
                did_hash: [9; 32],
                ..binding()
            },
        ] {
            assert!(wrong.partition_key().unwrap() != binding().partition_key().unwrap());
            assert!(StoredItem::decode(&bytes, &wrong, "ENROLLMENT").is_err());
        }
        assert!(StoredItem::decode(&bytes, &binding(), "HOLD#x").is_err());
        assert!(Binding {
            generation: "g#1".into(),
            ..binding()
        }
        .partition_key()
        .is_err());
    }

    #[test]
    fn malformed_and_oversized_state_fails_closed() {
        let item = enrollment();
        let bytes = item.encode().unwrap();
        let text = std::str::from_utf8(&bytes).unwrap();
        for bad in [
            text.replace("\"schemaVersion\":1", "\"schemaVersion\":2"),
            text.replace(
                "\"schemaVersion\":1",
                "\"schemaVersion\":1,\"schemaVersion\":1",
            ),
            text.replace("\"schemaVersion\":1", "\"unknown\":0,\"schemaVersion\":1"),
            text.replace("\"attemptsUsed\":10", "\"attemptsUsed\":11"),
            text.replace("\"configured\":true", "\"configured\":false"),
            text.replace("\"epoch\":2", "\"epoch\":0"),
            text.replace("\"operation\":7", "\"operation\":9007199254740992"),
        ] {
            assert!(StoredItem::decode(bad.as_bytes(), &binding(), "ENROLLMENT").is_err());
        }
        assert!(
            StoredItem::decode(&vec![b' '; MAX_ITEM_BYTES + 1], &binding(), "ENROLLMENT").is_err()
        );
    }

    #[test]
    fn holds_are_separate_bounded_terminal_items() {
        for status in [
            HoldStatus::Pending,
            HoldStatus::Released,
            HoldStatus::Cancelled,
        ] {
            let mut item = enrollment();
            item.value = ItemValue::Hold(HoldItem {
                hold_id: "hold-1".into(),
                enrollment_version: counter(3),
                epoch: counter(2),
                blob_identity: [3; 32],
                signed_hold_digest: [4; 32],
                created_revision: counter(7),
                updated_revision: counter(if status == HoldStatus::Pending { 7 } else { 8 }),
                status,
            });
            assert_eq!(item.sort_key().unwrap(), "HOLD#hold-1");
            roundtrip(&item);
            let ItemValue::Hold(hold) = &mut item.value else {
                unreachable!()
            };
            hold.hold_id = "a".repeat(113);
            assert!(item.encode().is_err());
        }
    }

    #[test]
    fn durable_operation_phases_are_not_interchangeable() {
        for outcome in [
            OperationOutcome::Reserved,
            OperationOutcome::Compared { matched: false },
            OperationOutcome::Compared { matched: true },
        ] {
            let mut item = enrollment();
            item.value = ItemValue::Operation(OperationItem {
                request_id: "request-1".into(),
                execution_id: [5; 16],
                kind: OperationKind::PinAttempt,
                outcome,
                revisions: Revisions {
                    operation: counter(8),
                    enrollment: counter(3),
                },
                request_digest: [6; 32],
                proposed_event: vec![7; MAX_EVENT_BYTES],
            });
            assert_eq!(item.sort_key().unwrap(), "OPERATION#request-1");
            roundtrip(&item);
            let ItemValue::Operation(op) = &mut item.value else {
                unreachable!()
            };
            op.kind = OperationKind::Release;
            assert!(item.encode().is_err());
            let ItemValue::Operation(op) = &mut item.value else {
                unreachable!()
            };
            op.outcome = OperationOutcome::Committed;
            roundtrip(&item);
            let ItemValue::Operation(op) = &mut item.value else {
                unreachable!()
            };
            op.proposed_event.push(0);
            assert!(item.encode().is_err());
        }
    }
}
