//! Conditional persistence, not policy authorization. Only enclave policy may
//! construct transitions; none of these types are deserializable wire requests.
//!
//! Exact prior-row conditions fence all writes. Every transaction writes an
//! immutable execution receipt; neither AWS token expiry nor process restart
//! removes it. Missing receipts alone never establish that a write did not commit.
pub use super::audit::{CommitReceipt, ExecutionRecord};
use super::{state::*, AuthorityError as Error};
use crate::ledger::Hash;
use rand_core::{OsRng, RngCore};
use sha2::{Digest, Sha256};
use std::{collections::BTreeSet, future::Future, pin::Pin};

#[cfg(feature = "kms")]
pub mod dynamo;
#[cfg(any(test, feature = "fake-authority"))]
pub mod fake;
#[cfg(test)]
mod tests;

pub type StoreFuture<'a, T> = Pin<Box<dyn Future<Output = Result<T, Error>> + Send + 'a>>;

/// The implementation fixes tenant/generation at construction from measured
/// configuration. A missing account stays None, never a legacy/default account.
pub trait AuthorityStore: Send + Sync {
    fn load<'a>(
        &'a self,
        binding: &'a Binding,
        request_id: &'a str,
        hold_id: Option<&'a str>,
    ) -> StoreFuture<'a, Snapshot>;
    /// Consumes the enclave-generated execution. A recovered receipt is NOT a
    /// fresh comparison permit. Call reconcile, not commit, after uncertainty.
    fn commit(&self, transition: Transition) -> StoreFuture<'_, CommitOutcome>;
    fn reconcile<'a>(&'a self, ticket: &'a ReconcileTicket) -> StoreFuture<'a, CommitOutcome>;
    /// Historical commit evidence only; never grants a new execution permit.
    fn receipt<'a>(
        &'a self,
        binding: &'a Binding,
        execution_id: [u8; 16],
    ) -> StoreFuture<'a, Option<CommitReceipt>>;
}

#[derive(Clone)]
pub struct Snapshot {
    pub enrollment: Option<EnrollmentItem>,
    pub operation: Option<OperationItem>,
    pub hold: Option<HoldItem>,
}

/// Must originate in measured config, never a request, Mongo or a ledger record.
#[derive(Clone)]
pub struct Scope {
    tenant: String,
    generation: String,
}

impl Scope {
    pub fn new(tenant: String, generation: String) -> Result<Self, Error> {
        Binding {
            tenant: tenant.clone(),
            generation: generation.clone(),
            did_hash: [0; 32],
        }
        .validate()?;
        Ok(Self { tenant, generation })
    }

    fn check(&self, binding: &Binding) -> Result<(), Error> {
        binding.validate()?;
        require(binding.tenant == self.tenant && binding.generation == self.generation)
    }
}

/// Metadata attesting what the authority committed, not a portable signature.
/// Policy signs a distinct post-commit artifact in the next layer.
pub enum CommitOutcome {
    /// Returned only for this consumed execution's successful write + readback.
    Applied(CommitReceipt),
    /// Historical fact only. Never resume a comparison from this outcome.
    Reconciled(CommitReceipt),
    /// Atomic read proves a competing account revision prevents a delayed commit.
    Conflict,
    /// Includes an absent receipt with unchanged/missing account; never refund.
    Unknown,
}

/// Read-only recovery handle. Cloneable, but cannot reconstruct/replay a write.
#[derive(Clone)]
pub struct ReconcileTicket {
    receipt: CommitReceipt,
    proposed_event: Vec<u8>,
    expected_revision: Option<Counter>,
}

pub struct Transition {
    writes: Vec<Write>,
    ticket: ReconcileTicket,
}

impl Transition {
    /// Structural persistence checks only. Caller must verify user intent,
    /// current blob, action/PIN semantics and trusted time before preparing this.
    pub fn prepare(
        binding: Binding,
        before: Snapshot,
        enrollment: EnrollmentItem,
        mut operation: OperationItem,
        hold: Option<HoldItem>,
    ) -> Result<Self, Error> {
        binding.validate()?;
        let expected_revision = before.enrollment.as_ref().map(|e| e.revisions.operation);
        match &before.enrollment {
            Some(old) => {
                require(enrollment.revisions.operation == old.revisions.operation.next()?)?;
                let same_enrollment = enrollment.revisions.enrollment == old.revisions.enrollment;
                require(
                    same_enrollment
                        || enrollment.revisions.enrollment == old.revisions.enrollment.next()?,
                )?;
                require(enrollment.epoch.get() >= old.epoch.get())?;
                if enrollment.pin.generation == old.pin.generation {
                    require(
                        enrollment.pin.configured == old.pin.configured
                            && enrollment.pin.attempts_used >= old.pin.attempts_used,
                    )?;
                } else {
                    require(
                        enrollment.pin.generation == old.pin.generation.next()?
                            && enrollment.pin.attempts_used == 0
                            && !same_enrollment,
                    )?;
                }
                if operation.kind == OperationKind::PinAttempt {
                    require(
                        same_enrollment
                            && enrollment.pin.generation == old.pin.generation
                            && enrollment.pin.configured,
                    )?;
                    match operation.outcome {
                        OperationOutcome::Reserved => require(
                            enrollment.pin.attempts_used
                                == old
                                    .pin
                                    .attempts_used
                                    .checked_add(1)
                                    .ok_or(Error::InvalidRequest)?,
                        )?,
                        OperationOutcome::Compared { .. } => require(
                            before.operation.is_some()
                                && enrollment.pin.attempts_used == old.pin.attempts_used,
                        )?,
                        OperationOutcome::Committed => return Err(Error::InvalidRequest),
                    }
                }
            }
            None => {
                require(before.operation.is_none() && before.hold.is_none())?;
                require(
                    enrollment.revisions.operation.get() == 1
                        && enrollment.revisions.enrollment.get() == 1,
                )?;
                require(operation.kind == OperationKind::Enroll)?;
            }
        }
        require(operation.revisions == enrollment.revisions)?;
        // A request tombstone can only advance its reserved PIN to one result.
        // It can never be replaced with a fresh reservation or another action.
        if let Some(old) = &before.operation {
            require(
                old.request_id == operation.request_id
                    && old.request_digest == operation.request_digest
                    && old.kind == OperationKind::PinAttempt
                    && operation.kind == OperationKind::PinAttempt
                    && old.outcome == OperationOutcome::Reserved
                    && matches!(operation.outcome, OperationOutcome::Compared { .. })
                    && old.revisions.enrollment == operation.revisions.enrollment,
            )?;
        }
        if let Some(old) = &before.hold {
            let new = hold.as_ref().ok_or(Error::InvalidRequest)?;
            // P9.1 (attack C): a non-terminal hold can still be updated whether
            // it is awaiting its email confirmation or already confirmed and
            // Pending — Released/Cancelled are the only statuses that may
            // never be written over again.
            require(
                old.hold_id == new.hold_id
                    && matches!(
                        old.status,
                        HoldStatus::AwaitingConfirmation | HoldStatus::Pending
                    )
                    && old.enrollment_version == new.enrollment_version
                    && old.epoch == new.epoch
                    && old.blob_identity == new.blob_identity
                    && old.signed_hold_digest == new.signed_hold_digest
                    && old.created_revision == new.created_revision,
            )?;
        }
        if let Some(new) = &hold {
            require(new.updated_revision == enrollment.revisions.operation)?;
        }
        let mut execution_id = [0; 16];
        OsRng
            .try_fill_bytes(&mut execution_id)
            .map_err(|_| Error::Unavailable)?;
        operation.execution_id = execution_id;
        let proposed_event = operation.proposed_event.clone();
        let mut writes = vec![
            typed_write(
                &binding,
                before.enrollment.map(ItemValue::Enrollment),
                ItemValue::Enrollment(enrollment.clone()),
            )?,
            typed_write(
                &binding,
                before.operation.map(ItemValue::Operation),
                ItemValue::Operation(operation),
            )?,
        ];
        if let Some(hold) = hold {
            writes.push(typed_write(
                &binding,
                before.hold.map(ItemValue::Hold),
                ItemValue::Hold(hold),
            )?);
        }
        let receipt = CommitReceipt {
            schema_version: SCHEMA_VERSION,
            binding: binding.clone(),
            execution_id,
            revisions: enrollment.revisions,
            transaction_digest: digest(&writes),
        };
        let ticket = ReconcileTicket {
            receipt,
            proposed_event,
            expected_revision,
        };
        writes.push(Write {
            key: receipt_key(&ticket.receipt)?,
            expected: None,
            value: receipt_bytes(&ticket)?,
        });
        Ok(Self { writes, ticket })
    }

    pub fn ticket(&self) -> ReconcileTicket {
        self.ticket.clone()
    }
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord)]
struct Key {
    pk: String,
    sk: String,
}
#[derive(Clone)]
struct Write {
    key: Key,
    expected: Option<Vec<u8>>,
    value: Vec<u8>,
}

/// Both implementations execute the same bounded exact-row CAS plan. No raw
/// expressions or unconstrained writes are accepted through AuthorityStore.
trait Backend: Send + Sync {
    fn read<'a>(&'a self, keys: &'a [Key]) -> StoreFuture<'a, Vec<Option<Vec<u8>>>>;
    fn write<'a>(&'a self, writes: &'a [Write]) -> StoreFuture<'a, ()>;
}

struct Store<B> {
    scope: Scope,
    backend: B,
}

impl<B: Backend> Store<B> {
    async fn read(&self, keys: &[Key]) -> Result<Vec<Option<Vec<u8>>>, Error> {
        require(!keys.is_empty() && keys.len() <= 4)?;
        require(keys.iter().collect::<BTreeSet<_>>().len() == keys.len())?;
        let values = self.backend.read(keys).await?;
        require(values.len() == keys.len())?;
        require(values.iter().flatten().all(|v| v.len() <= MAX_ITEM_BYTES))?;
        Ok(values)
    }

    async fn resolve(
        &self,
        ticket: &ReconcileTicket,
        acknowledged: bool,
    ) -> Result<CommitOutcome, Error> {
        self.scope.check(&ticket.receipt.binding)?;
        let keys = [
            receipt_key(&ticket.receipt)?,
            key(&ticket.receipt.binding, "ENROLLMENT".into())?,
        ];
        // An unavailable/malformed read cannot clear the execution's uncertainty.
        let values = match self.read(&keys).await {
            Ok(values) => values,
            Err(_) => return Ok(CommitOutcome::Unknown),
        };
        if let Some(bytes) = &values[0] {
            if bytes != &receipt_bytes(ticket)? {
                return Ok(CommitOutcome::Unknown);
            }
            return Ok(if acknowledged {
                CommitOutcome::Applied(ticket.receipt.clone())
            } else {
                CommitOutcome::Reconciled(ticket.receipt.clone())
            });
        }
        if let Some(bytes) = &values[1] {
            let Ok(row) = StoredItem::decode(bytes, &ticket.receipt.binding, "ENROLLMENT") else {
                return Ok(CommitOutcome::Unknown);
            };
            if let ItemValue::Enrollment(current) = row.value {
                if ticket
                    .expected_revision
                    .is_none_or(|old| current.revisions.operation.get() > old.get())
                {
                    return Ok(CommitOutcome::Conflict);
                }
            }
        }
        Ok(CommitOutcome::Unknown)
    }
}

impl<B: Backend> AuthorityStore for Store<B> {
    fn receipt<'a>(
        &'a self,
        binding: &'a Binding,
        execution_id: [u8; 16],
    ) -> StoreFuture<'a, Option<CommitReceipt>> {
        Box::pin(async move {
            self.scope.check(binding)?;
            let keys = [key(
                binding,
                format!("EXECUTION#{}", hex::encode(execution_id)),
            )?];
            let rows = self.read(&keys).await?;
            rows[0]
                .as_ref()
                .map(|bytes| {
                    let execution: ExecutionRecord =
                        serde_json::from_slice(bytes).map_err(|_| Error::Unavailable)?;
                    require(
                        !execution.proposed_event.is_empty()
                            && execution.proposed_event.len() <= MAX_EVENT_BYTES,
                    )?;
                    let receipt = execution.receipt;
                    require(
                        receipt.schema_version == SCHEMA_VERSION
                            && &receipt.binding == binding
                            && receipt.execution_id == execution_id
                            && receipt.revisions.enrollment.get() > 0
                            && receipt.revisions.operation.get()
                                >= receipt.revisions.enrollment.get(),
                    )?;
                    Ok(receipt)
                })
                .transpose()
        })
    }
    fn load<'a>(
        &'a self,
        binding: &'a Binding,
        request_id: &'a str,
        hold_id: Option<&'a str>,
    ) -> StoreFuture<'a, Snapshot> {
        Box::pin(async move {
            self.scope.check(binding)?;
            identifier(request_id)?;
            let mut keys = vec![
                key(binding, "ENROLLMENT".into())?,
                key(binding, format!("OPERATION#{request_id}"))?,
            ];
            if let Some(id) = hold_id {
                identifier(id)?;
                keys.push(key(binding, format!("HOLD#{id}"))?);
            }
            let values = self.read(&keys).await?;
            let mut snapshot = Snapshot {
                enrollment: None,
                operation: None,
                hold: None,
            };
            for (key, bytes) in keys.iter().zip(values) {
                if let Some(bytes) = bytes {
                    match StoredItem::decode(&bytes, binding, &key.sk)?.value {
                        ItemValue::Enrollment(value) => snapshot.enrollment = Some(value),
                        ItemValue::Operation(value) => snapshot.operation = Some(value),
                        ItemValue::Hold(value) => snapshot.hold = Some(value),
                    }
                }
            }
            if snapshot.enrollment.is_none()
                && (snapshot.operation.is_some() || snapshot.hold.is_some())
            {
                return Err(Error::Unavailable);
            }
            Ok(snapshot)
        })
    }

    fn commit(&self, transition: Transition) -> StoreFuture<'_, CommitOutcome> {
        Box::pin(async move {
            self.scope.check(&transition.ticket.receipt.binding)?;
            let acknowledged = self.backend.write(&transition.writes).await.is_ok();
            self.resolve(&transition.ticket, acknowledged).await
        })
    }

    fn reconcile<'a>(&'a self, ticket: &'a ReconcileTicket) -> StoreFuture<'a, CommitOutcome> {
        Box::pin(self.resolve(ticket, false))
    }
}

fn typed_write(
    binding: &Binding,
    before: Option<ItemValue>,
    after: ItemValue,
) -> Result<Write, Error> {
    let row = StoredItem {
        schema_version: SCHEMA_VERSION,
        binding: binding.clone(),
        value: after,
    };
    let sk = row.sort_key()?;
    let expected = before
        .map(|value| {
            let row = StoredItem {
                schema_version: SCHEMA_VERSION,
                binding: binding.clone(),
                value,
            };
            require(row.sort_key()? == sk)?;
            row.encode()
        })
        .transpose()?;
    Ok(Write {
        key: key(binding, sk)?,
        expected,
        value: row.encode()?,
    })
}

fn key(binding: &Binding, sk: String) -> Result<Key, Error> {
    Ok(Key {
        pk: binding.partition_key()?,
        sk,
    })
}
fn receipt_key(receipt: &CommitReceipt) -> Result<Key, Error> {
    key(
        &receipt.binding,
        format!("EXECUTION#{}", hex::encode(receipt.execution_id)),
    )
}
fn receipt_bytes(ticket: &ReconcileTicket) -> Result<Vec<u8>, Error> {
    serde_json::to_vec(&ExecutionRecord {
        receipt: ticket.receipt.clone(),
        proposed_event: ticket.proposed_event.clone(),
    })
    .map_err(|_| Error::InvalidRequest)
}
fn digest(writes: &[Write]) -> Hash {
    let mut hash = Sha256::new();
    hash.update(b"learncard-escrow-authority-transaction-v1\0");
    for write in writes {
        hash.update([u8::from(write.expected.is_some())]);
        for bytes in [
            write.key.pk.as_bytes(),
            write.key.sk.as_bytes(),
            write.expected.as_deref().unwrap_or_default(),
            &write.value,
        ] {
            hash.update((bytes.len() as u64).to_be_bytes());
            hash.update(bytes);
        }
    }
    hash.finalize().into()
}
fn require(value: bool) -> Result<(), Error> {
    if value {
        Ok(())
    } else {
        Err(Error::InvalidRequest)
    }
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
