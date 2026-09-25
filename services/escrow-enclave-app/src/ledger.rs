//! Enrollment-wide signed ledger. Parent persistence is not a freshness oracle.
//! Keep ONE instance per unsealed key for the entire process lifetime. Never evict
//! high-water marks or recreate the instance after an IO failure. See README Ledger.
use std::{collections::BTreeMap, future::Future, pin::Pin};

use base64::{engine::general_purpose::STANDARD, Engine};
use hkdf::Hkdf;
use p256::{
    ecdsa::{
        signature::hazmat::{PrehashSigner, PrehashVerifier},
        Signature, SigningKey, VerifyingKey,
    },
    pkcs8::DecodePrivateKey,
    SecretKey,
};
use sha2::{Digest, Sha256};
use zeroize::Zeroizing;

use crate::{crypto::EscrowKeyPair, time::TimeEvidence};

mod codec;
#[cfg(any(test, feature = "fake-ledger"))]
mod fake;
#[cfg(any(test, feature = "fake-ledger"))]
pub use fake::FakeHeadStore;
#[cfg(test)]
mod tests;

pub const MAX_CHAIN_RECORDS: usize = 64;
pub const MAX_RECORD_BYTES: usize = 8192;
pub const PIN_BUDGET: u8 = 10;
const MAX_TRACKED_CHAINS: usize = 4096;
pub type Hash = [u8; 32];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Event {
    HoldCreated,
    PinAttemptReserved { attempt_no: u8 },
    PinAttemptFailed,
    PinAttemptSucceeded,
    Released,
    Cancelled,
    PinLocked,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LedgerRecord {
    pub version: u64,
    pub tenant: String,
    /// Hash of the decrypted identity, NOT a host-selected hold or blob ID.
    pub enrollment_id: Hash,
    pub hold_id: String,
    pub enrollment_epoch: u64,
    pub blob_hash: Hash,
    pub seq: u64,
    pub prev_hash: Hash,
    pub event: Event,
    pub request_id: String,
    /// SHA-256 of the measured PCR tuple; supplied only by enclave startup.
    pub measurement: Hash,
    pub key_id: String,
    pub time_evidence: TimeEvidence,
    pub payload_hash: Hash,
    pub policy_version: u64,
    /// Fixed-width r || s, low-S ECDSA P-256 (not DER).
    pub sig: [u8; 64],
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Enrollment {
    pub tenant: String,
    pub enrollment_id: Hash,
    pub epoch: u64,
    pub blob_hash: Hash,
}

impl Enrollment {
    /// Policy must pass the authenticated/decrypted identity and current epoch.
    /// Blob hash is deliberately excluded from chain_id: changing blobs cannot
    /// silently reset a budget within an epoch (verification instead fails).
    pub fn new(tenant: String, decrypted_did: &str, epoch: u64, blob_hash: Hash) -> Self {
        Self {
            tenant,
            enrollment_id: Sha256::digest(decrypted_did.as_bytes()).into(),
            epoch,
            blob_hash,
        }
    }

    pub fn chain_id(&self) -> String {
        let mut h = Sha256::new();
        h.update(b"learncard-ledger-chain-v1\0");
        h.update((self.tenant.len() as u64).to_be_bytes());
        h.update(self.tenant.as_bytes());
        h.update(self.enrollment_id);
        h.update(self.epoch.to_be_bytes());
        hex::encode(h.finalize())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum AppendError {
    #[error("Ledger append conflict")]
    Conflict,
    #[error("Ledger store unavailable")]
    Unavailable,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum LedgerError {
    #[error("Invalid ledger encoding or bounds")]
    Encoding,
    #[error("Invalid ledger key or signature")]
    Signature,
    #[error("Invalid ledger chain, binding or transition")]
    Chain,
    #[error("Ledger rollback or fork")]
    Rollback,
    #[error("Ledger capacity exhausted")]
    Capacity,
    #[error(transparent)]
    Store(#[from] AppendError),
}

pub type StoreFuture<'a, T> = Pin<Box<dyn Future<Output = Result<T, AppendError>> + Send + 'a>>;

/// P3.3 adapter: bound the response BEFORE allocation (64 * 8192 bytes maximum),
/// decode each record with LedgerRecord::decode, and perform conditional appends.
/// Success is never sufficient: Ledger reads back and verifies the entire chain.
pub trait HeadStore: Send + Sync {
    fn get_chain<'a>(&'a self, chain_id: &'a str) -> StoreFuture<'a, Vec<LedgerRecord>>;
    fn append<'a>(&'a self, chain_id: &'a str, record: &'a LedgerRecord) -> StoreFuture<'a, ()>;
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct HoldState {
    pub released: bool,
    pub cancelled: bool,
    pub pin_succeeded: bool,
}

#[derive(Debug, Clone, Default)]
pub struct ChainState {
    pub attempts_used: u8,
    pub locked: bool,
    pub holds: BTreeMap<String, HoldState>,
    records: Vec<LedgerRecord>,
}

impl ChainState {
    pub fn head(&self) -> Option<&LedgerRecord> {
        self.records.last()
    }
}

impl LedgerRecord {
    pub fn canonical_bytes(&self) -> Result<Vec<u8>, LedgerError> {
        codec::encode(self, true)
    }

    pub fn decode(bytes: &[u8]) -> Result<Self, LedgerError> {
        codec::decode(bytes)
    }

    pub fn record_hash(&self) -> Result<Hash, LedgerError> {
        Ok(Sha256::digest(codec::encode(self, false)?).into())
    }
}

/// Enclave-authenticated inputs only. Time must come from TimeSource, not DTOs.
/// payload_hash commits to the complete operation (including client recipient).
/// For PINs use Ledger::pin_payload_hash, never an unkeyed hash of a low-entropy PIN.
#[derive(Clone)]
pub struct Operation {
    pub hold_id: String,
    pub request_id: String,
    pub time_evidence: TimeEvidence,
    pub payload_hash: Hash,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PinOutcome {
    Compared {
        matched: bool,
    },
    /// No comparison occurred. A crashed reservation is spent, not resumable.
    Duplicate {
        result: Option<bool>,
    },
}

pub struct Ledger {
    signing_key: SigningKey,
    payload_key: Zeroizing<[u8; 32]>,
    key_id: String,
    measurement: Hash,
    high_water: BTreeMap<String, (u64, Hash)>,
}

impl Ledger {
    /// Derive separate ledger and PIN commitment keys from the escrow scalar.
    /// Attestation/monitor enrollment must bind public_key() to the allowed image.
    pub fn new(
        keys: &EscrowKeyPair,
        key_id: String,
        measurement: Hash,
    ) -> Result<Self, LedgerError> {
        if keys.private_key.len() > 512 {
            return Err(LedgerError::Encoding);
        }
        codec::identifier(&key_id)?;
        let der = Zeroizing::new(
            STANDARD
                .decode(keys.private_key.trim())
                .map_err(|_| LedgerError::Signature)?,
        );
        let secret = SecretKey::from_pkcs8_der(&der).map_err(|_| LedgerError::Signature)?;
        let scalar = Zeroizing::new(secret.to_bytes());
        let hkdf = Hkdf::<Sha256>::new(Some(b"learncard-escrow-ledger-v1"), scalar.as_slice());
        let mut payload_key = Zeroizing::new([0; 32]);
        hkdf.expand(b"pin-payload-commitment", payload_key.as_mut())
            .map_err(|_| LedgerError::Signature)?;
        // Rejection sampling avoids modular bias; deterministic and domain separated.
        for counter in 0u32..1024 {
            let mut info = b"ecdsa-p256-signing-key\0".to_vec();
            info.extend_from_slice(&counter.to_be_bytes());
            let mut candidate = Zeroizing::new([0; 32]);
            hkdf.expand(&info, candidate.as_mut())
                .map_err(|_| LedgerError::Signature)?;
            if let Ok(signing_key) = SigningKey::from_slice(candidate.as_ref()) {
                return Ok(Self {
                    signing_key,
                    payload_key,
                    key_id,
                    measurement,
                    high_water: BTreeMap::new(),
                });
            }
        }
        Err(LedgerError::Signature)
    }

    pub fn public_key(&self) -> VerifyingKey {
        *self.signing_key.verifying_key()
    }

    /// Secret-keyed HKDF commitment prevents the public ledger becoming a PIN
    /// dictionary oracle. Caller includes the full, bounded canonical request.
    pub fn pin_payload_hash(&self, canonical_request: &[u8]) -> Result<Hash, LedgerError> {
        if canonical_request.len() > MAX_RECORD_BYTES {
            return Err(LedgerError::Encoding);
        }
        let mut hash = [0; 32];
        Hkdf::<Sha256>::new(Some(self.payload_key.as_ref()), canonical_request)
            .expand(b"learncard-pin-request-v1", &mut hash)
            .map_err(|_| LedgerError::Signature)?;
        Ok(hash)
    }

    /// Pure verifier for the monitor. expected supplies tenant/identity/epoch/blob;
    /// records may concern different holds, all under that same enrollment.
    pub fn verify_chain(
        records: &[LedgerRecord],
        expected: &Enrollment,
        public_key: &VerifyingKey,
    ) -> Result<ChainState, LedgerError> {
        codec::identifier(&expected.tenant)?;
        if records.len() > MAX_CHAIN_RECORDS {
            return Err(LedgerError::Capacity);
        }
        let mut state = ChainState::default();
        let mut previous = [0; 32];
        let mut floor = 0;
        for (seq, record) in records.iter().enumerate() {
            let hash = record.record_hash()?;
            let signature =
                Signature::from_slice(&record.sig).map_err(|_| LedgerError::Signature)?;
            if signature.normalize_s().is_some() {
                return Err(LedgerError::Signature);
            }
            public_key
                .verify_prehash(&hash, &signature)
                .map_err(|_| LedgerError::Signature)?;
            if record.tenant != expected.tenant
                || record.enrollment_id != expected.enrollment_id
                || record.enrollment_epoch != expected.epoch
                || record.blob_hash != expected.blob_hash
                || record.seq != seq as u64
                || record.prev_hash != previous
                || record.time_evidence.interval.lo_ms < floor
                || records
                    .first()
                    .is_some_and(|first| first.key_id != record.key_id)
            {
                return Err(LedgerError::Chain);
            }
            state.apply(record)?;
            floor = record.time_evidence.interval.lo_ms;
            previous = hash;
            state.records.push(record.clone());
        }
        Ok(state)
    }

    /// Stateful verification rejects truncated histories AND forks at a remembered
    /// sequence, even if the presented fork has a greater sequence number.
    pub fn observe(
        &mut self,
        records: &[LedgerRecord],
        expected: &Enrollment,
    ) -> Result<ChainState, LedgerError> {
        let state = Self::verify_chain(records, expected, &self.public_key())?;
        let id = expected.chain_id();
        if let Some((seq, hash)) = self.high_water.get(&id) {
            if records
                .get(*seq as usize)
                .map(LedgerRecord::record_hash)
                .transpose()?
                != Some(*hash)
            {
                return Err(LedgerError::Rollback);
            }
        }
        if let Some(head) = state.head() {
            self.remember(id, head)?;
        }
        Ok(state)
    }

    fn remember(&mut self, id: String, head: &LedgerRecord) -> Result<(), LedgerError> {
        if !self.high_water.contains_key(&id) && self.high_water.len() >= MAX_TRACKED_CHAINS {
            return Err(LedgerError::Capacity);
        }
        self.high_water.insert(id, (head.seq, head.record_hash()?));
        Ok(())
    }

    async fn load(
        &mut self,
        store: &dyn HeadStore,
        enrollment: &Enrollment,
    ) -> Result<ChainState, LedgerError> {
        let records = store.get_chain(&enrollment.chain_id()).await?;
        self.observe(&records, enrollment)
    }

    async fn append(
        &mut self,
        store: &dyn HeadStore,
        enrollment: &Enrollment,
        state: &ChainState,
        operation: &Operation,
        event: Event,
    ) -> Result<LedgerRecord, LedgerError> {
        let mut record = LedgerRecord {
            version: 1,
            tenant: enrollment.tenant.clone(),
            enrollment_id: enrollment.enrollment_id,
            hold_id: operation.hold_id.clone(),
            enrollment_epoch: enrollment.epoch,
            blob_hash: enrollment.blob_hash,
            seq: state.records.len() as u64,
            prev_hash: state
                .head()
                .map(LedgerRecord::record_hash)
                .transpose()?
                .unwrap_or([0; 32]),
            event,
            request_id: operation.request_id.clone(),
            measurement: self.measurement,
            key_id: self.key_id.clone(),
            time_evidence: operation.time_evidence.clone(),
            payload_hash: operation.payload_hash,
            policy_version: 1,
            sig: [0; 64],
        };
        let signature: Signature = self
            .signing_key
            .sign_prehash(&record.record_hash()?)
            .map_err(|_| LedgerError::Signature)?;
        record
            .sig
            .copy_from_slice(&signature.normalize_s().unwrap_or(signature).to_bytes());
        let mut proposed = state.records.clone();
        proposed.push(record.clone());
        // Remember BEFORE handing signed bytes to an untrusted store. Cancellation,
        // Conflict or Unavailable cannot allow us to sign a conflicting successor.
        self.observe(&proposed, enrollment)?;
        store.append(&enrollment.chain_id(), &record).await?;
        self.load(store, enrollment).await?;
        Ok(record)
    }

    /// Non-PIN events only. P1.7 must authorize releases/cancellations and verify
    /// current enrollment; this module does not decide seven-day release policy.
    pub async fn transition(
        &mut self,
        store: &dyn HeadStore,
        enrollment: &Enrollment,
        operation: &Operation,
        event: Event,
    ) -> Result<LedgerRecord, LedgerError> {
        if !matches!(
            event,
            Event::HoldCreated | Event::Released | Event::Cancelled | Event::PinLocked
        ) {
            return Err(LedgerError::Chain);
        }
        let state = self.load(store, enrollment).await?;
        if let Some(existing) = state
            .records
            .iter()
            .find(|r| r.request_id == operation.request_id)
        {
            if existing.event == event && same_operation(existing, operation) {
                return Ok(existing.clone());
            }
            return Err(LedgerError::Chain);
        }
        self.append(store, enrollment, &state, operation, event)
            .await
    }

    /// Reserve -> authenticated readback -> compare ONCE -> commit/readback.
    /// The synchronous closure must do only a constant-time PIN comparison, no
    /// release/IO. No permission token escapes before persistence verification.
    /// Lost/aborted reservations never run the closure again, including after boot.
    pub async fn verify_pin<F: FnOnce() -> bool>(
        &mut self,
        store: &dyn HeadStore,
        enrollment: &Enrollment,
        operation: &Operation,
        compare: F,
    ) -> Result<PinOutcome, LedgerError> {
        let state = self.load(store, enrollment).await?;
        if let Some(existing) = state
            .records
            .iter()
            .find(|r| r.request_id == operation.request_id)
        {
            if !matches!(existing.event, Event::PinAttemptReserved { .. })
                || !same_operation(existing, operation)
            {
                return Err(LedgerError::Chain);
            }
            let result = state.records.iter().find_map(|r| {
                if r.request_id != operation.request_id {
                    return None;
                }
                match r.event {
                    Event::PinAttemptSucceeded => Some(true),
                    Event::PinAttemptFailed => Some(false),
                    _ => None,
                }
            });
            return Ok(PinOutcome::Duplicate { result });
        }
        // Leave room for the outcome before spending an attempt.
        if state.records.len() + 2 > MAX_CHAIN_RECORDS {
            return Err(LedgerError::Capacity);
        }
        self.append(
            store,
            enrollment,
            &state,
            operation,
            Event::PinAttemptReserved {
                attempt_no: state.attempts_used + 1,
            },
        )
        .await?;
        let reserved = self.load(store, enrollment).await?;
        let matched = compare();
        self.append(
            store,
            enrollment,
            &reserved,
            operation,
            if matched {
                Event::PinAttemptSucceeded
            } else {
                Event::PinAttemptFailed
            },
        )
        .await?;
        Ok(PinOutcome::Compared { matched })
    }
}

fn same_operation(record: &LedgerRecord, operation: &Operation) -> bool {
    record.hold_id == operation.hold_id && record.payload_hash == operation.payload_hash
}

impl ChainState {
    fn apply(&mut self, record: &LedgerRecord) -> Result<(), LedgerError> {
        let prior = self
            .records
            .iter()
            .find(|r| r.request_id == record.request_id);
        let is_result = matches!(
            record.event,
            Event::PinAttemptFailed | Event::PinAttemptSucceeded
        );
        if is_result {
            let reservation = prior.ok_or(LedgerError::Chain)?;
            if !matches!(reservation.event, Event::PinAttemptReserved { .. })
                || reservation.hold_id != record.hold_id
                || reservation.payload_hash != record.payload_hash
                || self.records.iter().any(|r| {
                    r.request_id == record.request_id
                        && matches!(
                            r.event,
                            Event::PinAttemptFailed | Event::PinAttemptSucceeded
                        )
                })
            {
                return Err(LedgerError::Chain);
            }
        } else if prior.is_some() {
            return Err(LedgerError::Chain);
        }
        if record.event == Event::HoldCreated {
            if self.holds.contains_key(&record.hold_id) {
                return Err(LedgerError::Chain);
            }
            self.holds
                .insert(record.hold_id.clone(), HoldState::default());
            return Ok(());
        }
        let hold = self
            .holds
            .get_mut(&record.hold_id)
            .ok_or(LedgerError::Chain)?;
        if hold.released || hold.cancelled {
            return Err(LedgerError::Chain);
        }
        match record.event {
            Event::PinAttemptReserved { attempt_no } => {
                if self.locked || hold.pin_succeeded || attempt_no != self.attempts_used + 1 {
                    return Err(LedgerError::Chain);
                }
                self.attempts_used = attempt_no;
                self.locked = attempt_no == PIN_BUDGET;
            }
            Event::PinAttemptSucceeded => hold.pin_succeeded = true,
            Event::PinAttemptFailed => {}
            Event::Released => hold.released = true,
            Event::Cancelled => hold.cancelled = true,
            Event::PinLocked => {
                if !self.locked {
                    return Err(LedgerError::Chain);
                }
            }
            Event::HoldCreated => return Err(LedgerError::Chain),
        }
        Ok(())
    }
}
