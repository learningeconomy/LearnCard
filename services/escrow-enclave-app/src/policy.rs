//! Release decisions over authenticated enrollment, signed history and trusted time.
//! Keep one Policy per escrow key for its entire lifetime, serialized by the server.
//! There is deliberately no host-backed default for EnrollmentSource; see README.
use std::{future::Future, pin::Pin};

use base64::{engine::general_purpose::STANDARD, Engine};
use p256::{pkcs8::DecodePublicKey, PublicKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;
use zeroize::{Zeroize, Zeroizing};

use crate::{
    crypto::{self, EscrowBlobPlaintext, EscrowKeyPair, EscrowReleasePlaintext},
    ledger::{
        ChainState, Enrollment, Event, Hash, HeadStore, Ledger, LedgerError, LedgerRecord,
        Operation, PinOutcome, MAX_CHAIN_RECORDS, PIN_BUDGET,
    },
    time::{TimeEvidence, TimeSource},
    wire::{ErrorCode, EscrowEnvelope, HoldRecord, ReleasePolicy},
};

#[cfg(test)]
mod tests;

pub const HOLD_DURATION_MS: u64 = 7 * 24 * 60 * 60 * 1000;
pub const POLICY_VERSION: u32 = 1;
const JS_MAX_INTEGER: u64 = (1u64 << 53) - 1;

/// An authenticated CURRENT enrollment, not a claim copied from a request/Mongo.
#[derive(Clone, PartialEq, Eq)]
pub struct CurrentEnrollment {
    pub epoch: u64,
    pub share_version: u32,
    pub blob_hash: Hash,
}

pub type EnrollmentFuture<'a> =
    Pin<Box<dyn Future<Output = Result<CurrentEnrollment, ErrorCode>> + Send + 'a>>;

/// Trusted driver boundary, like TimeSource. Implementations MUST authenticate
/// tenant/DID ownership and freshness independently of the parent. A signed old
/// snapshot is insufficient. Rotation must serialize with policy operations.
/// No production implementation is provided: missing authority fails closed.
pub trait EnrollmentSource: Send + Sync {
    fn current<'a>(&'a self, tenant: &'a str, did: &'a str) -> EnrollmentFuture<'a>;
}

/// Extends the existing wire hold without changing wire.rs. The signature is the
/// base64 low-S signature of the HoldCreated ledger record at ledger_seq, whose
/// payload_hash commits to ALL these fields (excluding signature). Verification
/// requires that exact record in the authenticated current enrollment chain.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SignedHoldRecord {
    pub hold: HoldRecord,
    pub hold_duration_ms: u64,
    pub ledger_seq: u64,
}

pub struct CreateHoldRequest<'a> {
    pub envelope: &'a EscrowEnvelope,
    pub hold_id: &'a str,
    pub request_id: &'a str,
    pub expected_did: &'a str,
    pub expected_share_version: u32,
    pub enrollment_epoch: u64,
    pub release_policy: ReleasePolicy,
    pub client_ephemeral_public_key: &'a str,
}

/// Also used for cancellation; PIN proof is never used by cancellation or hold release.
/// Intentionally no host time, duration, status or attempt-counter inputs.
pub struct ReleaseRequest<'a> {
    pub envelope: &'a EscrowEnvelope,
    pub hold: &'a SignedHoldRecord,
    pub request_id: &'a str,
    pub expected_did: &'a str,
    pub client_ephemeral_public_key: &'a str,
    pub pin_proof: Option<&'a str>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct BlobVerification {
    pub ok: bool,
    pub has_pin: bool,
}

/// Bounded to 3 (P9.1): each entry adds a KMS Decrypt-for-recipient call at
/// boot and a linear scan per blob decrypt; wide enough for one in-flight
/// rotation plus a lost-sealed-key recovery, never a general key history.
pub const MAX_PREVIOUS_KEYS: usize = 3;

pub struct Policy<'a> {
    keys: EscrowKeyPair,
    key_id: String,
    /// Unseal-only (P9.1): `decrypt` accepts an envelope keyed to any of
    /// these, but every seal (`carry_pin_verifier`'s and
    /// `rewrap_escrow_blob`'s reseal; `release`/`cancel` verify a signed
    /// hold, never re-seal a blob) always targets `keys`/`key_id`.
    previous_keys: Vec<(String, EscrowKeyPair)>,
    tenant: String,
    ledger: Ledger,
    store: &'a dyn HeadStore,
    time: &'a dyn TimeSource,
    enrollments: &'a dyn EnrollmentSource,
    #[cfg(test)]
    comparisons: usize,
}

struct VerifiedHold {
    blob: EscrowBlobPlaintext,
    enrollment: Enrollment,
    state: ChainState,
    records: Vec<LedgerRecord>,
}

impl<'a> Policy<'a> {
    /// Tenant and measurement are enclave startup configuration, never request
    /// fields. `previous_keys` are boot-supplied, already-unsealed decrypt-only
    /// keys (P9.1: deliberate rotation or a lost-sealed-key recovery); each
    /// keyId must be distinct from every other previous keyId and from the
    /// current `key_id`, and the list is capped at `MAX_PREVIOUS_KEYS`.
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        keys: EscrowKeyPair,
        key_id: String,
        previous_keys: Vec<(String, EscrowKeyPair)>,
        tenant: String,
        measurement: Hash,
        store: &'a dyn HeadStore,
        time: &'a dyn TimeSource,
        enrollments: &'a dyn EnrollmentSource,
    ) -> Result<Self, ErrorCode> {
        identifier(&tenant)?;
        if previous_keys.len() > MAX_PREVIOUS_KEYS {
            return Err(ErrorCode::Policy);
        }
        let mut seen = std::collections::BTreeSet::new();
        seen.insert(key_id.clone());
        for (id, _) in &previous_keys {
            if !valid_key_id(id) || !seen.insert(id.clone()) {
                return Err(ErrorCode::Policy);
            }
        }
        let mut ledger = Ledger::new(&keys, key_id.clone(), measurement).map_err(ledger_error)?;
        for (id, previous) in &previous_keys {
            ledger
                .add_previous_key(id.clone(), previous)
                .map_err(ledger_error)?;
        }
        Ok(Self {
            keys,
            key_id,
            previous_keys,
            tenant,
            ledger,
            store,
            time,
            enrollments,
            #[cfg(test)]
            comparisons: 0,
        })
    }

    pub fn ledger_public_key(&self) -> p256::ecdsa::VerifyingKey {
        self.ledger.public_key()
    }

    /// Advertised in the attest response and bound into NSM `user_data`
    /// (server::attest_user_data) so both lca-api and the client-side
    /// attestation verifier can learn which retired keys still decrypt.
    pub fn previous_key_ids(&self) -> Vec<String> {
        self.previous_keys
            .iter()
            .map(|(id, _)| id.clone())
            .collect()
    }

    /// Selects decrypt key material by the envelope's own `keyId`: the
    /// current key, or a recognised previous key (P9.1, unseal-only — every
    /// caller that re-seals a blob, i.e. `carry_pin_verifier`/
    /// `rewrap_escrow_blob`, always targets `self.keys`/`self.key_id`, never
    /// a previous key). An unrecognised keyId is indistinguishable from any
    /// other malformed/undecryptable envelope: the generic `Blob` error,
    /// never naming the rejected keyId.
    fn decrypt(&self, envelope: &EscrowEnvelope) -> Result<EscrowBlobPlaintext, ErrorCode> {
        let private_key = if envelope.key_id == self.key_id {
            &self.keys.private_key
        } else if let Some((_, previous)) = self
            .previous_keys
            .iter()
            .find(|(id, _)| *id == envelope.key_id)
        {
            &previous.private_key
        } else {
            return Err(ErrorCode::Blob);
        };
        let blob =
            crypto::decrypt_escrow_blob(envelope, private_key).map_err(|_| ErrorCode::Blob)?;
        if blob.share_version > f64::from(u32::MAX) {
            return Err(ErrorCode::Blob);
        }
        Ok(blob)
    }

    /// Authenticates the blob and checks identity/version; exposes only PIN presence.
    pub fn verify_blob(
        &self,
        envelope: &EscrowEnvelope,
        expected_did: &str,
        expected_share_version: u32,
    ) -> Result<BlobVerification, ErrorCode> {
        let blob = self.decrypt(envelope)?;
        Ok(BlobVerification {
            ok: blob.did == expected_did && blob.share_version == f64::from(expected_share_version),
            has_pin: blob.pin_verifier.is_some(),
        })
    }

    /// P8.1/P8.3: transfers a PIN verifier, AND the lifetime attempt budget
    /// already spent against it, across a share-version rotation. Observes the
    /// source blob chain and appends a trusted-time Carried genesis to the fresh
    /// output chain before returning ciphertext. Epochs bind source/destination
    /// records but never select their chains. EnrollmentSource is not consulted;
    /// choosing an older PIN-bearing source remains BLOCKER-ENROLLMENT.
    ///
    /// Rejects with the single generic `Blob` error for every DID/version/PIN-
    /// presence mismatch — same shape as every other blob failure, no
    /// distinguishing detail — unless ALL hold: both plaintexts' `did ==
    /// expected_did`; `source.share_version == source_share_version` and
    /// `target.share_version == target_share_version`; `target.share_version >
    /// source.share_version`; `source.pin_verifier` present and
    /// `target.pin_verifier` absent; `source_enrollment_epoch` in range.
    ///
    /// `used = source.pin_attempts_floor.unwrap_or(0) + source_chain.attempts_used`
    /// (the source epoch's OWN floor plus however many local reservations its
    /// chain made — never fewer, so a carry-of-a-carry accumulates and a carry
    /// never lowers a floor the source blob already had). A source chain that
    /// exists but fails signature/link/binding verification is a distinct
    /// `Ledger` (or `Unavailable` on storage failure) error, per the existing
    /// `ledger_error` mapping — fail closed rather than silently treating a
    /// tampered chain as empty. `used` becomes the target's `pin_attempts_floor`.
    ///
    /// Reseals `{ ...target, pinVerifier: source.pinVerifier, pinAttemptsFloor:
    /// used }` to the CURRENT key via `encrypt_escrow_blob`, fresh ephemeral
    /// key/salt/IV — never returns, logs, or reuses the target's ciphertext.
    /// Decrypted plaintexts zeroize on drop; `source.pin_verifier` is moved
    /// (not cloned), so it is never duplicated in memory.
    pub async fn carry_pin_verifier(
        &mut self,
        source_envelope: &EscrowEnvelope,
        target_envelope: &EscrowEnvelope,
        expected_did: &str,
        source_share_version: u32,
        target_share_version: u32,
        (source_enrollment_epoch, target_enrollment_epoch): (u64, u64),
    ) -> Result<EscrowEnvelope, ErrorCode> {
        let mut source = self.decrypt(source_envelope)?;
        let mut target = self.decrypt(target_envelope)?;
        if source.did != expected_did
            || target.did != expected_did
            || source.share_version != f64::from(source_share_version)
            || target.share_version != f64::from(target_share_version)
            || target.share_version <= source.share_version
            || source.pin_verifier.is_none()
            || target.pin_verifier.is_some()
            || source_enrollment_epoch == 0
            || source_enrollment_epoch > JS_MAX_INTEGER
            || target_enrollment_epoch == 0
            || target_enrollment_epoch > JS_MAX_INTEGER
        {
            return Err(ErrorCode::Blob);
        }
        let source_hash = blob_hash(source_envelope)?;
        let (floor, event, time) = self
            .carried_attempts_floor(
                &source.did,
                source_enrollment_epoch,
                source_hash,
                source.pin_attempts_floor,
            )
            .await?;
        target.pin_attempts_floor = floor;
        target.pin_verifier = source.pin_verifier.take();
        self.seal_carried(&target, target_enrollment_epoch, event, time)
            .await
    }

    /// Shared by `carry_pin_verifier` (P8.3) and `rewrap_escrow_blob` (P9.3):
    /// loads and authenticates `did`'s ledger chain at `epoch`/`blob_hash`
    /// and returns `min(PIN_BUDGET, floor.unwrap_or(0) + chain.attempts_used)`
    /// as `Some(_)` (or `None` when zero) — the combined PIN-attempt budget
    /// already spent, so a reseal (which changes the blob hash, and
    /// therefore the enrollment chain identity, per D13/README "Identity and
    /// schema") never resets the ten-attempt lifetime budget. A chain that
    /// exists but fails signature/link/binding verification is a distinct
    /// `Ledger`/`Unavailable` error, never silently treated as empty.
    async fn carried_attempts_floor(
        &mut self,
        did: &str,
        epoch: u64,
        blob_hash: Hash,
        floor: Option<u8>,
    ) -> Result<(Option<u8>, Event, TimeEvidence), ErrorCode> {
        let enrollment = Enrollment::new(self.tenant.clone(), did, epoch, blob_hash);
        let records = self
            .store
            .get_chain(&enrollment.chain_id())
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        let state = self
            .ledger
            .observe(&records, &enrollment)
            .map_err(ledger_error)?;
        Self::check_carried_floor(&records, floor)?;
        let used = floor
            .unwrap_or(0)
            .saturating_add(state.attempts_used)
            .min(PIN_BUDGET);
        let event = Event::Carried {
            source_chain_id: hex::decode(enrollment.chain_id())
                .map_err(|_| ErrorCode::Ledger)?
                .try_into()
                .map_err(|_| ErrorCode::Ledger)?,
            source_head_hash: state
                .head()
                .map(LedgerRecord::record_hash)
                .transpose()
                .map_err(ledger_error)?
                .unwrap_or([0; 32]),
            attempts_carried: used,
        };
        Ok(((used > 0).then_some(used), event, self.now(&state).await?))
    }

    fn check_carried_floor(records: &[LedgerRecord], floor: Option<u8>) -> Result<(), ErrorCode> {
        let recorded = records.first().and_then(|record| match record.event {
            Event::Carried {
                attempts_carried, ..
            } => Some(attempts_carried),
            _ => None,
        });
        if recorded.unwrap_or(0) != floor.unwrap_or(0) {
            return Err(ErrorCode::Ledger);
        }
        Ok(())
    }

    async fn seal_carried(
        &mut self,
        blob: &EscrowBlobPlaintext,
        epoch: u64,
        event: Event,
        time_evidence: TimeEvidence,
    ) -> Result<EscrowEnvelope, ErrorCode> {
        let envelope = crypto::encrypt_escrow_blob(blob, &self.keys.public_key, &self.key_id)
            .map_err(|_| ErrorCode::Blob)?;
        let hash = blob_hash(&envelope)?;
        let destination = Enrollment::new(self.tenant.clone(), &blob.did, epoch, hash);
        let operation = Operation {
            hold_id: "carry".into(),
            request_id: format!("carry-{}", hex::encode(hash)),
            time_evidence,
            payload_hash: hash,
        };
        self.ledger
            .transition(self.store, &destination, &operation, event)
            .await
            .map_err(ledger_error)?;
        Ok(envelope)
    }

    /// P9.3: migrates an escrow copy sealed under a recognised PREVIOUS key
    /// onto the CURRENT key, so a previous key can eventually be retired
    /// (README "Previous keys / key rotation"). Same generic-`Blob`-error
    /// shape as `carry_pin_verifier`/`verify_blob` (no distinguishing detail
    /// on any rejection reason), and reuses `carried_attempts_floor` (P8.3)
    /// so re-sealing — which changes `blob_hash`, and therefore the
    /// enrollment chain identity — never resets the PIN attempt budget; see
    /// that method's doc comment for the full rationale.
    ///
    /// Refuses (`Blob`) unless: the envelope's own `keyId` is a recognised
    /// PREVIOUS key (the current key has nothing to migrate; an unknown key
    /// is indistinguishable from any other undecryptable envelope); it
    /// decrypts; `blob.did == expected_did`;
    /// `blob.share_version == expected_share_version`; `source_enrollment_epoch`
    /// is in range (same bound as `carry_pin_verifier`).
    ///
    /// Output: the identical plaintext (did, shareVersion, recoveryShare,
    /// pinVerifier) re-sealed under the CURRENT key with a fresh
    /// ephemeral/salt/IV, and `pinAttemptsFloor` recomputed via
    /// `carried_attempts_floor`. No plaintext ever leaves in an error or
    /// log; the decrypted value zeroizes on drop.
    pub async fn rewrap_escrow_blob(
        &mut self,
        envelope: &EscrowEnvelope,
        expected_did: &str,
        expected_share_version: u32,
        source_enrollment_epoch: u64,
    ) -> Result<EscrowEnvelope, ErrorCode> {
        if envelope.key_id == self.key_id
            || !self
                .previous_keys
                .iter()
                .any(|(id, _)| *id == envelope.key_id)
        {
            return Err(ErrorCode::Blob);
        }
        let mut blob = self.decrypt(envelope)?;
        if blob.did != expected_did
            || blob.share_version != f64::from(expected_share_version)
            || source_enrollment_epoch == 0
            || source_enrollment_epoch > JS_MAX_INTEGER
        {
            return Err(ErrorCode::Blob);
        }
        let hash = blob_hash(envelope)?;
        let (floor, event, time) = self
            .carried_attempts_floor(
                &blob.did,
                source_enrollment_epoch,
                hash,
                blob.pin_attempts_floor,
            )
            .await?;
        blob.pin_attempts_floor = floor;
        self.seal_carried(&blob, source_enrollment_epoch, event, time)
            .await
    }

    async fn enrollment(
        &self,
        envelope: &EscrowEnvelope,
        blob: &EscrowBlobPlaintext,
        epoch: u64,
    ) -> Result<Enrollment, ErrorCode> {
        let current = self.enrollments.current(&self.tenant, &blob.did).await?;
        let hash = blob_hash(envelope)?;
        if epoch == 0
            || epoch > JS_MAX_INTEGER
            || current.epoch != epoch
            || current.share_version == 0
            || f64::from(current.share_version) != blob.share_version
            || current.blob_hash != hash
        {
            return Err(ErrorCode::Policy);
        }
        Ok(Enrollment::new(self.tenant.clone(), &blob.did, epoch, hash))
    }

    async fn load(
        &mut self,
        enrollment: &Enrollment,
    ) -> Result<(Vec<LedgerRecord>, ChainState), ErrorCode> {
        let records = self
            .store
            .get_chain(&enrollment.chain_id())
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        let state = self
            .ledger
            .observe(&records, enrollment)
            .map_err(ledger_error)?;
        Ok((records, state))
    }

    async fn now(&self, state: &ChainState) -> Result<TimeEvidence, ErrorCode> {
        let floor = state.head().map(|r| r.time_evidence.interval.lo_ms);
        let time = self.time.now(floor).await.map_err(|_| ErrorCode::Time)?;
        if time.interval.lo_ms > time.interval.hi_ms
            || time.interval.hi_ms > JS_MAX_INTEGER
            || floor.is_some_and(|floor| time.interval.lo_ms < floor)
        {
            return Err(ErrorCode::Time);
        }
        Ok(time)
    }

    pub async fn create_hold(
        &mut self,
        req: CreateHoldRequest<'_>,
    ) -> Result<SignedHoldRecord, ErrorCode> {
        identifier(req.hold_id)?;
        identifier(req.request_id)?;
        validate_client_key(req.client_ephemeral_public_key)?;
        let blob = self.decrypt(req.envelope)?;
        if blob.did != req.expected_did
            || blob.share_version != f64::from(req.expected_share_version)
            || (req.release_policy == ReleasePolicy::Pin && blob.pin_verifier.is_none())
        {
            return Err(ErrorCode::Policy);
        }
        let enrollment = self
            .enrollment(req.envelope, &blob, req.enrollment_epoch)
            .await?;
        let (records, state) = self.load(&enrollment).await?;
        Self::check_carried_floor(&records, blob.pin_attempts_floor)?;
        if state.holds.contains_key(req.hold_id) || records.len() >= MAX_CHAIN_RECORDS {
            return Err(ErrorCode::Policy);
        }
        let time = self.now(&state).await?;
        deadline(time.interval.hi_ms, HOLD_DURATION_MS)?;
        let mut signed = SignedHoldRecord {
            hold: HoldRecord {
                hold_id: req.hold_id.into(),
                did: blob.did.clone(),
                share_version: req.expected_share_version,
                blob_hash: hex::encode(enrollment.blob_hash),
                enrollment_epoch: enrollment.epoch,
                release_policy: req.release_policy,
                client_ephemeral_public_key: req.client_ephemeral_public_key.into(),
                created_lo: time.interval.lo_ms,
                created_hi: time.interval.hi_ms,
                policy_version: POLICY_VERSION,
                signature: String::new(),
            },
            hold_duration_ms: HOLD_DURATION_MS,
            ledger_seq: records.len() as u64,
        };
        let operation = Operation {
            hold_id: req.hold_id.into(),
            request_id: format!("create-{}", req.request_id),
            time_evidence: time,
            payload_hash: hold_hash(&self.tenant, &signed)?,
        };
        let record = self
            .ledger
            .transition(self.store, &enrollment, &operation, Event::HoldCreated)
            .await
            .map_err(ledger_error)?;
        signed.hold.signature = STANDARD.encode(record.sig);
        Ok(signed)
    }

    async fn verify_hold(&mut self, req: &ReleaseRequest<'_>) -> Result<VerifiedHold, ErrorCode> {
        identifier(req.request_id)?;
        let signed = req.hold;
        let hold = &signed.hold;
        validate_hold(signed)?;
        if hold.did != req.expected_did
            || hold.client_ephemeral_public_key != req.client_ephemeral_public_key
        {
            return Err(ErrorCode::Policy);
        }
        let blob = self.decrypt(req.envelope)?;
        if blob.did != hold.did || blob.share_version != f64::from(hold.share_version) {
            return Err(ErrorCode::Policy);
        }
        let enrollment = self
            .enrollment(req.envelope, &blob, hold.enrollment_epoch)
            .await?;
        if hold.blob_hash != hex::encode(enrollment.blob_hash) {
            return Err(ErrorCode::Policy);
        }
        let (records, state) = self.load(&enrollment).await?;
        Self::check_carried_floor(&records, blob.pin_attempts_floor)?;
        let record = records
            .get(usize::try_from(signed.ledger_seq).map_err(|_| ErrorCode::Policy)?)
            .ok_or(ErrorCode::Policy)?;
        // observe authenticated every signature and chain link. Requiring equality
        // with that entry authenticates the supplied hold without a second key/API.
        if record.event != Event::HoldCreated
            || record.hold_id != hold.hold_id
            || record.payload_hash != hold_hash(&self.tenant, signed)?
            || hold.signature != STANDARD.encode(record.sig)
            || record.time_evidence.interval.lo_ms != hold.created_lo
            || record.time_evidence.interval.hi_ms != hold.created_hi
        {
            return Err(ErrorCode::Policy);
        }
        let status = state.holds.get(&hold.hold_id).ok_or(ErrorCode::Policy)?;
        if status.cancelled || status.released {
            return Err(ErrorCode::Policy);
        }
        Ok(VerifiedHold {
            blob,
            enrollment,
            state,
            records,
        })
    }

    fn operation(
        &self,
        req: &ReleaseRequest<'_>,
        time: TimeEvidence,
        purpose: &str,
        pin: Option<&str>,
    ) -> Result<Operation, ErrorCode> {
        // Hash all public bindings before including the proof; never publish an
        // unkeyed proof hash. The guarded JSON buffer is bounded by validated inputs.
        let bytes = Zeroizing::new(
            serde_json::to_vec(&(
                "learncard-policy-operation-v1",
                purpose,
                hold_hash(&self.tenant, req.hold)?,
                req.request_id,
                pin,
            ))
            .map_err(|_| ErrorCode::Policy)?,
        );
        Ok(Operation {
            hold_id: req.hold.hold.hold_id.clone(),
            request_id: format!("{}-{}", purpose, req.request_id),
            time_evidence: time,
            payload_hash: self.ledger.pin_payload_hash(&bytes).map_err(ledger_error)?,
        })
    }

    /// Dispatches only on the authenticated hold policy, never PIN presence alone.
    pub async fn release(&mut self, req: ReleaseRequest<'_>) -> Result<EscrowEnvelope, ErrorCode> {
        match req.hold.hold.release_policy {
            ReleasePolicy::Hold => self.release_hold(req).await,
            ReleasePolicy::Pin => self.release_pin(req).await,
        }
    }

    pub async fn release_hold(
        &mut self,
        req: ReleaseRequest<'_>,
    ) -> Result<EscrowEnvelope, ErrorCode> {
        if req.hold.hold.release_policy != ReleasePolicy::Hold {
            return Err(ErrorCode::Policy);
        }
        let verified = self.verify_hold(&req).await?;
        let time = self.now(&verified.state).await?;
        if time.interval.lo_ms < deadline(req.hold.hold.created_hi, req.hold.hold_duration_ms)? {
            return Err(ErrorCode::Time);
        }
        self.finish(&req, verified, time).await
    }

    pub async fn release_pin(
        &mut self,
        req: ReleaseRequest<'_>,
    ) -> Result<EscrowEnvelope, ErrorCode> {
        if req.hold.hold.release_policy != ReleasePolicy::Pin {
            return Err(ErrorCode::Policy);
        }
        let verified = self.verify_hold(&req).await?;
        // Do not ask the ledger to compare a proof-dependent commitment on a
        // duplicate. Different duplicate errors/timing would be an unbudgeted
        // equality oracle for the original proof, including a stranded success.
        let pin_id = format!("pin-{}", req.request_id);
        if verified
            .records
            .iter()
            .any(|record| record.request_id == pin_id)
            || verified
                .state
                .holds
                .get(&req.hold.hold.hold_id)
                .is_some_and(|hold| hold.pin_succeeded)
        {
            return Err(ErrorCode::Policy);
        }
        let proof = req.pin_proof.ok_or(ErrorCode::Policy)?;
        // A carried floor lowers this blob's local budget (floor=3 leaves seven
        // reservations). This accounts for the selected lineage/presented history,
        // not attempts against sibling copies; see BLOCKER-ENROLLMENT.
        let floor = verified.blob.pin_attempts_floor.unwrap_or(0);
        let used_before = verified.state.attempts_used.saturating_add(floor);
        // Oversize rejection depends only on public input, never the verifier.
        if proof.len() > 128 || verified.state.locked || used_before >= PIN_BUDGET {
            return Err(ErrorCode::Policy);
        }
        let verifier = verified
            .blob
            .pin_verifier
            .as_deref()
            .ok_or(ErrorCode::Policy)?;
        // Leave space for reservation + result + Released/PinLocked before spending.
        if req.hold.ledger_seq >= MAX_CHAIN_RECORDS as u64
            || verified
                .state
                .head()
                .is_some_and(|head| head.seq > (MAX_CHAIN_RECORDS - 4) as u64)
        {
            return Err(ErrorCode::Unavailable);
        }
        let time = self.now(&verified.state).await?;
        let operation = self.operation(&req, time.clone(), "pin", Some(proof))?;
        #[cfg(test)]
        let comparisons = &mut self.comparisons;
        let outcome = self
            .ledger
            .verify_pin(self.store, &verified.enrollment, &operation, || {
                #[cfg(test)]
                {
                    *comparisons += 1;
                }
                compare_pin(proof, verifier)
            })
            .await
            .map_err(ledger_error)?;
        match outcome {
            PinOutcome::Compared { matched: true } => self.finish(&req, verified, time).await,
            PinOutcome::Compared { matched: false } => {
                // Ledger lock includes the signed inherited floor.
                if used_before == PIN_BUDGET - 1 {
                    let locked = self.operation(&req, time, "lock", Some(proof))?;
                    self.ledger
                        .transition(self.store, &verified.enrollment, &locked, Event::PinLocked)
                        .await
                        .map_err(ledger_error)?;
                }
                Err(ErrorCode::PinMismatch)
            }
            // A reserved or completed attempt is never resumed, even after reboot.
            PinOutcome::Duplicate { .. } => Err(ErrorCode::Policy),
        }
    }

    async fn finish(
        &mut self,
        req: &ReleaseRequest<'_>,
        mut verified: VerifiedHold,
        time: TimeEvidence,
    ) -> Result<EscrowEnvelope, ErrorCode> {
        let operation = self.operation(req, time, "release", None)?;
        self.ledger
            .transition(
                self.store,
                &verified.enrollment,
                &operation,
                Event::Released,
            )
            .await
            .map_err(ledger_error)?;
        // The crypto release type can carry a verifier; policy must NEVER send it.
        if let Some(pin) = verified.blob.pin_verifier.as_mut() {
            pin.zeroize();
        }
        verified.blob.pin_verifier = None;
        // The floor is enclave/ledger bookkeeping, not client-facing data; the
        // client never needs it (a future carry recomputes it from the ledger).
        verified.blob.pin_attempts_floor = None;
        crypto::seal_escrow_release(
            &EscrowReleasePlaintext {
                blob: verified.blob,
                hold_id: req.hold.hold.hold_id.clone(),
            },
            &req.hold.hold.client_ephemeral_public_key,
        )
        .map_err(|_| ErrorCode::Unavailable)
    }

    /// Signed cancellation is irrevocable in the observable chain. Caller must
    /// authenticate user intent before invoking; cancellation never grants release.
    pub async fn cancel_hold(&mut self, req: ReleaseRequest<'_>) -> Result<(), ErrorCode> {
        let verified = self.verify_hold(&req).await?;
        let time = self.now(&verified.state).await?;
        let operation = self.operation(&req, time, "cancel", None)?;
        self.ledger
            .transition(
                self.store,
                &verified.enrollment,
                &operation,
                Event::Cancelled,
            )
            .await
            .map_err(ledger_error)?;
        Ok(())
    }
}

fn ledger_error(error: LedgerError) -> ErrorCode {
    match error {
        LedgerError::Store(_) | LedgerError::Capacity => ErrorCode::Unavailable,
        _ => ErrorCode::Ledger,
    }
}

fn identifier(value: &str) -> Result<(), ErrorCode> {
    // Reserve space for internal operation prefixes within ledger's 128-byte cap.
    if value.is_empty()
        || value.len() > 112
        || !value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
    {
        return Err(ErrorCode::Policy);
    }
    Ok(())
}

/// Mirrors kms.rs's boot-time keyId format check; duplicated rather than
/// shared because `policy` (unlike `kms`) compiles without `enclave-runtime`.
fn valid_key_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
}

fn validate_client_key(key: &str) -> Result<(), ErrorCode> {
    if key.len() > 512 {
        return Err(ErrorCode::Policy);
    }
    let der = STANDARD.decode(key).map_err(|_| ErrorCode::Policy)?;
    PublicKey::from_public_key_der(&der).map_err(|_| ErrorCode::Policy)?;
    Ok(())
}

fn validate_hold(signed: &SignedHoldRecord) -> Result<(), ErrorCode> {
    let hold = &signed.hold;
    identifier(&hold.hold_id)?;
    validate_client_key(&hold.client_ephemeral_public_key)?;
    if hold.did.len() > 8192
        || hold.blob_hash.len() != 64
        || hold.signature.len() != 88
        || hold.policy_version != POLICY_VERSION
        || signed.hold_duration_ms != HOLD_DURATION_MS
        || hold.created_lo > hold.created_hi
        || hold.created_hi > JS_MAX_INTEGER
        || signed.ledger_seq >= MAX_CHAIN_RECORDS as u64
    {
        return Err(ErrorCode::Policy);
    }
    deadline(hold.created_hi, signed.hold_duration_ms)?;
    Ok(())
}

fn deadline(created_hi: u64, duration: u64) -> Result<u64, ErrorCode> {
    created_hi
        .checked_add(duration)
        .filter(|v| *v <= JS_MAX_INTEGER)
        .ok_or(ErrorCode::Time)
}

/// Identity is invariant under equivalent ECDH points and serialization aliases.
fn blob_hash(envelope: &EscrowEnvelope) -> Result<Hash, ErrorCode> {
    crypto::escrow_blob_identity(envelope).map_err(|_| ErrorCode::Blob)
}

fn hold_hash(tenant: &str, signed: &SignedHoldRecord) -> Result<Hash, ErrorCode> {
    let h = &signed.hold;
    let identity = hex::encode(Sha256::digest(h.did.as_bytes()));
    let bytes = serde_json::to_vec(&(
        "learncard-hold-v1",
        tenant,
        &h.hold_id,
        identity,
        h.share_version,
        &h.blob_hash,
        h.enrollment_epoch,
        h.release_policy,
        &h.client_ephemeral_public_key,
        h.created_lo,
        h.created_hi,
        signed.hold_duration_ms,
        h.policy_version,
        signed.ledger_seq,
    ))
    .map_err(|_| ErrorCode::Policy)?;
    Ok(Sha256::digest(bytes).into())
}

fn compare_pin(proof: &str, verifier: &str) -> bool {
    let mut supplied = Zeroizing::new([0u8; 32]);
    let mut expected = Zeroizing::new([0u8; 32]);
    let supplied_valid = hex::decode_to_slice(proof, supplied.as_mut()).is_ok();
    let expected_valid = hex::decode_to_slice(verifier, expected.as_mut()).is_ok();
    // Always compare fixed-size bytes, even for malformed proofs. Parsing only
    // branches on attacker-known proof syntax; normalized verifier is valid hex.
    bool::from(supplied.as_ref().ct_eq(expected.as_ref())) & supplied_valid & expected_valid
}
