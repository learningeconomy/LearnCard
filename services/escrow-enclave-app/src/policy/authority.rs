//! Authoritative policy path. Never imports state or PIN budgets from the parent
//! ledger. Every transition is fenced by an atomic account/operation/hold write.
use super::*;
pub use crate::authority::audit::{AuthorityCommitPayload, AuthorityEvent};
use crate::authority::{
    intent::{verify_intent, EnrollmentAction, IntentContext, PinAction, SignedEnrollmentIntent},
    record::{RecordKind, SignedAuthorityRecord},
    state::{
        ActiveBlob, Binding, Counter, EnrollmentItem, EnrollmentStatus, HoldItem, HoldStatus,
        OperationItem, OperationKind, OperationOutcome, PinState, Revisions,
    },
    store::{AuthorityStore, CommitOutcome, Snapshot, Transition},
};
use std::sync::Arc;

pub struct AuthorityEnrollment {
    tenant: String,
    generation: String,
    store: Arc<dyn AuthorityStore>,
}
impl AuthorityEnrollment {
    /// Scope is measured boot configuration, never a host-selected request value.
    pub fn new(
        tenant: String,
        generation: String,
        store: Arc<dyn AuthorityStore>,
    ) -> Result<Self, ErrorCode> {
        Binding {
            tenant: tenant.clone(),
            generation: generation.clone(),
            did_hash: [0; 32],
        }
        .validate()
        .map_err(|_| ErrorCode::Policy)?;
        Ok(Self {
            tenant,
            generation,
            store,
        })
    }
    fn binding(&self, did: &str) -> Binding {
        Binding {
            tenant: self.tenant.clone(),
            generation: self.generation.clone(),
            did_hash: Sha256::digest(did.as_bytes()).into(),
        }
    }
}
impl EnrollmentSource for AuthorityEnrollment {
    fn current<'a>(&'a self, tenant: &'a str, did: &'a str) -> EnrollmentFuture<'a> {
        Box::pin(async move {
            if tenant != self.tenant {
                return Err(ErrorCode::Policy);
            }
            let snapshot = self
                .store
                .load(&self.binding(did), "current", None)
                .await
                .map_err(|_| ErrorCode::Unavailable)?;
            let state = snapshot.enrollment.ok_or(ErrorCode::Unavailable)?;
            let blob = active(&state)?;
            Ok(CurrentEnrollment {
                epoch: state.epoch.get(),
                share_version: blob.share_version,
                blob_hash: blob.identity,
            })
        })
    }
}

/// Returned only after authenticated commit readback. The encrypted output is
/// already durable in the account row; loss of this response cannot lose it.
pub type AuthorityMutation = crate::wire::v1::AuthorityMutationResponse;

impl<'a> Policy<'a> {
    pub fn authority_enabled(&self) -> bool {
        self.authority.is_some()
    }

    /// Nonce-bound fresh state for constructing owner intent. Never infers an
    /// enrollment from an envelope or Mongo metadata when the authority is empty.
    pub async fn authority_state(
        &self,
        did: &str,
        nonce: &str,
    ) -> Result<(crate::wire::v1::AuthorityState, SignedAuthorityRecord), ErrorCode> {
        if did.len() > 8192
            || nonce.len() != 64
            || !nonce
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        {
            return Err(ErrorCode::Policy);
        }
        let authority = self.authority()?;
        let snapshot = authority
            .store
            .load(&authority.binding(did), "snapshot", None)
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        let current = snapshot.enrollment.as_ref();
        let blob = current.and_then(|s| active(s).ok());
        let state = crate::wire::v1::AuthorityState {
            tenant: self.tenant.clone(),
            authority_generation: authority.generation.clone(),
            did: did.into(),
            enrollment_version: current.map(|s| s.revisions.enrollment.get()).unwrap_or(0),
            enrollment_epoch: current.map(|s| s.epoch.get()).unwrap_or(0),
            status: if blob.is_some() {
                "active"
            } else if current.is_some() {
                "disabled"
            } else {
                "empty"
            }
            .into(),
            envelope: blob.map(|b| b.envelope.clone()),
            share_version: blob.map(|b| b.share_version),
            has_pin: current.is_some_and(|s| s.pin.configured),
            pin_generation: current.map(|s| s.pin.generation.get()).unwrap_or(0),
            attempts_used: current.map(|s| s.pin.attempts_used).unwrap_or(0),
        };
        let proof = self
            .ledger
            .sign_authority_record(
                RecordKind::Snapshot,
                &serde_json::to_vec(&(nonce, &state)).map_err(|_| ErrorCode::Policy)?,
            )
            .map_err(ledger_error)?;
        Ok((state, proof))
    }
    /// This mode is compiled alongside (and unconditionally uses) the owner
    /// verifier. No boolean, RPC flag or missing verifier can select unsigned mode.
    pub fn with_authority(mut self, authority: &'a AuthorityEnrollment) -> Result<Self, ErrorCode> {
        if self.tenant != authority.tenant {
            return Err(ErrorCode::Policy);
        }
        self.enrollments = authority;
        self.authority = Some(authority);
        Ok(self)
    }

    /// P9.1 (attack C): wires PR1's dormant SES client in. Boot must call this
    /// only when `ESCROW_EMAIL_*` is fully configured and its sealed sender
    /// credential unsealed; `authority_create_hold` fails closed without it.
    pub fn with_email(mut self, email: &'a dyn crate::authority::email::EmailSender) -> Self {
        self.email = Some(email);
        self
    }

    fn authority(&self) -> Result<&'a AuthorityEnrollment, ErrorCode> {
        self.authority.ok_or(ErrorCode::Unavailable)
    }

    /// Owner-signed enroll/replace/disable/carry. Actual plaintext semantics are
    /// checked here, not inferred from a signature over attacker-supplied metadata.
    pub async fn apply_enrollment_intent(
        &mut self,
        signed: &SignedEnrollmentIntent,
        source: Option<&EscrowEnvelope>,
        target: Option<&EscrowEnvelope>,
    ) -> Result<AuthorityMutation, ErrorCode> {
        let authority = self.authority()?;
        // Bound malformed intent before hashing its DID or using its request ID.
        signed
            .intent
            .canonical_bytes()
            .map_err(|_| ErrorCode::Policy)?;
        let binding = authority.binding(&signed.intent.did);
        let before = authority
            .store
            .load(&binding, &signed.intent.request_id, None)
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        if before.operation.is_some() {
            return Err(ErrorCode::Policy);
        }
        let verified = verify_intent(
            signed,
            IntentContext {
                binding: &binding,
                current: before.enrollment.as_ref(),
                source,
                target,
            },
        )
        .map_err(|_| ErrorCode::Policy)?;
        let intent = verified.intent();
        let mut source_blob = source.map(|e| self.decrypt(e)).transpose()?;
        if let Some(blob) = &source_blob {
            check_blob(
                blob,
                &intent.did,
                before.enrollment.as_ref().ok_or(ErrorCode::Policy)?,
            )?;
        }
        let old_pin = before
            .enrollment
            .as_ref()
            .map(|e| e.pin)
            .unwrap_or(PinState {
                generation: count(0)?,
                configured: false,
                attempts_used: 0,
            });
        let pin = match intent.pin_action {
            PinAction::Keep => old_pin,
            PinAction::Set | PinAction::Change | PinAction::Clear => PinState {
                generation: old_pin.generation.next().map_err(|_| ErrorCode::Policy)?,
                configured: intent.pin_action != PinAction::Clear,
                attempts_used: 0,
            },
        };
        let envelope = if let Some(target) = target {
            let mut blob = self.decrypt(target)?;
            if blob.did != intent.did
                || blob.share_version != f64::from(intent.share_version)
                || blob.pin_attempts_floor.unwrap_or(0) != 0
            {
                return Err(ErrorCode::Policy);
            }
            // P9.1 (attack C): Enroll/Replace bind the owner-signed email/language
            // to this exact blob; Carry must arrive with neither and inherits the
            // source's values verbatim, exactly like the PIN verifier just below.
            if intent.action == EnrollmentAction::Carry {
                if blob.recovery_email.is_some() || blob.recovery_language.is_some() {
                    return Err(ErrorCode::Policy);
                }
                let source_blob = source_blob.as_mut().ok_or(ErrorCode::Policy)?;
                blob.recovery_email = source_blob.recovery_email.take();
                blob.recovery_language = source_blob.recovery_language.take();
            } else if blob.recovery_email != intent.recovery_email
                || blob.recovery_language != intent.recovery_language
            {
                return Err(ErrorCode::Policy);
            }
            if intent.action == EnrollmentAction::Carry {
                if blob.pin_verifier.is_some() {
                    return Err(ErrorCode::Policy);
                }
                blob.pin_verifier = source_blob
                    .as_mut()
                    .ok_or(ErrorCode::Policy)?
                    .pin_verifier
                    .take();
            } else {
                match intent.pin_action {
                    PinAction::Set | PinAction::Change if blob.pin_verifier.is_none() => {
                        return Err(ErrorCode::Policy)
                    }
                    PinAction::Clear if blob.pin_verifier.is_some() => {
                        return Err(ErrorCode::Policy)
                    }
                    PinAction::Keep => {
                        let prior = source_blob.as_ref().and_then(|b| b.pin_verifier.as_deref());
                        if !same_pin(prior, blob.pin_verifier.as_deref()) {
                            return Err(ErrorCode::Policy);
                        }
                    }
                    _ => {}
                }
            }
            if blob.pin_verifier.is_some() != pin.configured {
                return Err(ErrorCode::Policy);
            }
            blob.pin_attempts_floor = (pin.attempts_used > 0).then_some(pin.attempts_used);
            // Always persist the actual enclave-produced envelope, never a proposed
            // target hash without ciphertext (including PIN resets and replacements).
            Some(
                crypto::encrypt_escrow_blob(&blob, &self.keys.public_key, &self.key_id)
                    .map_err(|_| ErrorCode::Blob)?,
            )
        } else {
            None
        };
        let revisions = match &before.enrollment {
            Some(old) => old.revisions.advance(true).map_err(|_| ErrorCode::Policy)?,
            None => Revisions {
                operation: count(1)?,
                enrollment: count(1)?,
            },
        };
        let request_digest =
            Sha256::digest(intent.canonical_bytes().map_err(|_| ErrorCode::Policy)?).into();
        let enrollment = match &envelope {
            Some(envelope) => EnrollmentStatus::Active {
                blob: Box::new(ActiveBlob {
                    identity: blob_hash(envelope)?,
                    envelope: envelope.clone(),
                    share_version: intent.share_version,
                    chain_head: None,
                    rewrap_delegated: intent.allow_rewrap,
                }),
            },
            None => EnrollmentStatus::Disabled,
        };
        let after = EnrollmentItem {
            revisions,
            epoch: count(intent.enrollment_epoch)?,
            pin,
            intent_digest: request_digest,
            enrollment,
        };
        let kind = match intent.action {
            EnrollmentAction::Enroll => OperationKind::Enroll,
            EnrollmentAction::Replace => OperationKind::Replace,
            EnrollmentAction::Disable => OperationKind::Disable,
            EnrollmentAction::Carry => OperationKind::Carry,
        };
        let (receipt, _) = self
            .authority_commit(
                binding,
                before,
                after,
                &intent.request_id,
                kind,
                OperationOutcome::Committed,
                request_digest,
                None,
            )
            .await?;
        Ok(AuthorityMutation {
            envelope,
            receipt,
            authority_generation: authority.generation.clone(),
            enrollment_version: revisions.enrollment.get(),
            enrollment_epoch: intent.enrollment_epoch,
        })
    }

    /// Delegated background rewrap changes only the ciphertext/key identity and
    /// enrollment version. DID/share/epoch/verifier/attempt count are preserved.
    pub async fn authority_rewrap(
        &mut self,
        envelope: &EscrowEnvelope,
        did: &str,
        share_version: u32,
        epoch: u64,
    ) -> Result<AuthorityMutation, ErrorCode> {
        if envelope.key_id == self.key_id {
            return Err(ErrorCode::Policy);
        }
        let authority = self.authority()?;
        let blob = self.decrypt(envelope)?;
        let source = blob_hash(envelope)?;
        let request = format!("rewrap-{}", hex::encode(source));
        let binding = authority.binding(did);
        let before = authority
            .store
            .load(&binding, &request, None)
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        let mut after = before.enrollment.clone().ok_or(ErrorCode::Unavailable)?;
        let current = active(&after)?;
        if before.operation.is_some()
            || !current.rewrap_delegated
            || current.identity != source
            || current.share_version != share_version
            || after.epoch.get() != epoch
        {
            return Err(ErrorCode::Policy);
        }
        check_blob(&blob, did, &after)?;
        // Preserve plaintext exactly, including any embedded floor. The authoritative
        // counter (not that floor or a parent chain) remains the only PIN budget.
        let output = crypto::encrypt_escrow_blob(&blob, &self.keys.public_key, &self.key_id)
            .map_err(|_| ErrorCode::Blob)?;
        after.revisions = after
            .revisions
            .advance(true)
            .map_err(|_| ErrorCode::Policy)?;
        let enrollment_version = after.revisions.enrollment.get();
        let EnrollmentStatus::Active { blob } = &mut after.enrollment else {
            return Err(ErrorCode::Policy);
        };
        blob.identity = blob_hash(&output)?;
        blob.envelope = output.clone();
        let (receipt, _) = self
            .authority_commit(
                binding,
                before,
                after,
                &request,
                OperationKind::Rewrap,
                OperationOutcome::Committed,
                source,
                None,
            )
            .await?;
        Ok(AuthorityMutation {
            envelope: Some(output),
            receipt,
            authority_generation: authority.generation.clone(),
            enrollment_version,
            enrollment_epoch: epoch,
        })
    }

    pub(crate) async fn authority_create_hold(
        &mut self,
        req: CreateHoldRequest<'_>,
    ) -> Result<SignedHoldRecord, ErrorCode> {
        identifier(req.hold_id)?;
        identifier(req.request_id)?;
        validate_client_key(req.client_ephemeral_public_key)?;
        let authority = self.authority()?;
        let blob = self.decrypt(req.envelope)?;
        let binding = authority.binding(req.expected_did);
        let before = authority
            .store
            .load(&binding, req.request_id, Some(req.hold_id))
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        let mut after = before.enrollment.clone().ok_or(ErrorCode::Unavailable)?;
        check_blob(&blob, req.expected_did, &after)?;
        let current = active(&after)?;
        if before.operation.is_some()
            || before.hold.is_some()
            || current.identity != blob_hash(req.envelope)?
            || current.share_version != req.expected_share_version
            || after.epoch.get() != req.enrollment_epoch
            || (req.release_policy == ReleasePolicy::Pin && !after.pin.configured)
            // P9.1 (attack C): an enrollment bound before PR3, or carried forward
            // without ever completing an Enroll/Replace, has no recovery contact.
            // Fail closed rather than start a hold nobody confirmed receiving mail for.
            || blob.recovery_email.is_none()
            // P9.1: no sender wired (ESCROW_EMAIL_* unconfigured, or its sealed
            // credential failed to unseal at boot) ⇒ no hold can start at all,
            // even for an enrollment that does carry a recovery email.
            || self.email.is_none()
        {
            return Err(ErrorCode::Policy);
        }
        let time = self.authority_time().await?;
        deadline(time.interval.hi_ms, HOLD_DURATION_MS)?;
        after.revisions = after
            .revisions
            .advance(false)
            .map_err(|_| ErrorCode::Policy)?;
        let mut signed = SignedHoldRecord {
            hold: HoldRecord {
                hold_id: req.hold_id.into(),
                did: req.expected_did.into(),
                share_version: req.expected_share_version,
                blob_hash: hex::encode(blob_hash(req.envelope)?),
                enrollment_epoch: req.enrollment_epoch,
                release_policy: req.release_policy,
                client_ephemeral_public_key: req.client_ephemeral_public_key.into(),
                created_lo: time.interval.lo_ms,
                created_hi: time.interval.hi_ms,
                policy_version: 2,
                signature: String::new(),
            },
            hold_duration_ms: HOLD_DURATION_MS,
            ledger_seq: after.revisions.operation.get(),
        };
        let hash = hold_hash(&self.tenant, &signed)?;
        let hold = HoldItem {
            hold_id: req.hold_id.into(),
            enrollment_version: after.revisions.enrollment,
            epoch: after.epoch,
            blob_identity: blob_hash(req.envelope)?,
            signed_hold_digest: hash,
            created_revision: after.revisions.operation,
            updated_revision: after.revisions.operation,
            status: HoldStatus::Pending,
        };
        let (receipt, _) = self
            .authority_commit_at(
                binding,
                before,
                after,
                req.request_id,
                OperationKind::CreateHold,
                OperationOutcome::Committed,
                hash,
                Some(hold),
                time,
            )
            .await?;
        signed.hold.signature =
            STANDARD.encode(serde_json::to_vec(&receipt).map_err(|_| ErrorCode::Policy)?);
        Ok(signed)
    }

    async fn authority_verified_hold(
        &self,
        req: &ReleaseRequest<'_>,
        require_active: bool,
    ) -> Result<(Binding, Snapshot), ErrorCode> {
        identifier(req.request_id)?;
        identifier(&req.hold.hold.hold_id)?;
        let hold = &req.hold.hold;
        validate_client_key(&hold.client_ephemeral_public_key)?;
        if hold.policy_version != 2
            || hold.signature.len() > 8192
            || req.hold.hold_duration_ms != HOLD_DURATION_MS
            || hold.created_lo > hold.created_hi
            || hold.created_hi > JS_MAX_INTEGER
            || hold.did != req.expected_did
            || hold.client_ephemeral_public_key != req.client_ephemeral_public_key
        {
            return Err(ErrorCode::Policy);
        }
        deadline(hold.created_hi, HOLD_DURATION_MS)?;
        let authority = self.authority()?;
        let binding = authority.binding(&hold.did);
        let before = authority
            .store
            .load(&binding, req.request_id, Some(&hold.hold_id))
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        let state = before.enrollment.as_ref().ok_or(ErrorCode::Unavailable)?;
        let item = before.hold.as_ref().ok_or(ErrorCode::Policy)?;
        if item.status != HoldStatus::Pending
            || hold.blob_hash != hex::encode(item.blob_identity)
            || hold.enrollment_epoch != item.epoch.get()
            || req.hold.ledger_seq != item.created_revision.get()
            || item.signed_hold_digest != hold_hash(&self.tenant, req.hold)?
        {
            return Err(ErrorCode::Policy);
        }
        if require_active {
            let current = active(state)?;
            if item.enrollment_version != state.revisions.enrollment
                || item.epoch != state.epoch
                || item.blob_identity != current.identity
                || current.identity != blob_hash(req.envelope)?
                || hold.share_version != current.share_version
            {
                return Err(ErrorCode::Policy);
            }
        }
        // Cancellation grants no disclosure. The authenticated authority item's
        // exact hold commitment is sufficient even after its signing key retires.
        if !require_active {
            return Ok((binding, before));
        }
        let record: SignedAuthorityRecord = serde_json::from_slice(
            &STANDARD
                .decode(&hold.signature)
                .map_err(|_| ErrorCode::Policy)?,
        )
        .map_err(|_| ErrorCode::Policy)?;
        if record.kind != RecordKind::Commit {
            return Err(ErrorCode::Policy);
        }
        self.ledger
            .verify_authority_record(&record)
            .map_err(ledger_error)?;
        let payload: AuthorityCommitPayload = serde_json::from_slice(
            &STANDARD
                .decode(&record.payload)
                .map_err(|_| ErrorCode::Policy)?,
        )
        .map_err(|_| ErrorCode::Policy)?;
        if payload.commit.binding != binding
            || payload.commit.revisions.operation != item.created_revision
            || payload.commit.revisions.enrollment != item.enrollment_version
            || payload.request_digest != item.signed_hold_digest
        {
            return Err(ErrorCode::Policy);
        }
        Ok((binding, before))
    }

    pub(crate) async fn authority_release(
        &mut self,
        req: ReleaseRequest<'_>,
        policy: ReleasePolicy,
    ) -> Result<EscrowEnvelope, ErrorCode> {
        self.authority_release_with_receipt(req, policy)
            .await
            .map(|(sealed, _)| sealed)
    }

    pub(crate) async fn authority_release_with_receipt(
        &mut self,
        req: ReleaseRequest<'_>,
        policy: ReleasePolicy,
    ) -> Result<(EscrowEnvelope, SignedAuthorityRecord), ErrorCode> {
        if req.hold.hold.release_policy != policy {
            return Err(ErrorCode::Policy);
        }
        let (binding, mut before) = self.authority_verified_hold(&req, true).await?;
        let mut blob = self.decrypt(req.envelope)?;
        check_blob(
            &blob,
            req.expected_did,
            before.enrollment.as_ref().ok_or(ErrorCode::Unavailable)?,
        )?;
        // Never compare a proof or proof-derived commitment on duplicate requests.
        if before.operation.is_some() {
            return Err(ErrorCode::Policy);
        }
        let time = self.authority_time().await?;
        let mut after = before.enrollment.clone().ok_or(ErrorCode::Unavailable)?;
        let mut hold = before.hold.clone().ok_or(ErrorCode::Policy)?;
        let receipt = if policy == ReleasePolicy::Hold {
            if time.interval.lo_ms < deadline(req.hold.hold.created_hi, HOLD_DURATION_MS)? {
                return Err(ErrorCode::Time);
            }
            after.revisions = after
                .revisions
                .advance(false)
                .map_err(|_| ErrorCode::Policy)?;
            hold.status = HoldStatus::Released;
            hold.updated_revision = after.revisions.operation;
            let digest = self.operation(&req, time, "release", None)?.payload_hash;
            let (receipt, fresh) = self
                .authority_commit(
                    binding,
                    before,
                    after,
                    req.request_id,
                    OperationKind::Release,
                    OperationOutcome::Committed,
                    digest,
                    Some(hold),
                )
                .await?;
            if !fresh {
                return Err(ErrorCode::Unavailable);
            }
            receipt
        } else {
            let proof = req.pin_proof.ok_or(ErrorCode::Policy)?;
            if proof.len() > 128 || !after.pin.configured || after.pin.attempts_used >= PIN_BUDGET {
                return Err(ErrorCode::Policy);
            }
            let digest = self.operation(&req, time, "pin", Some(proof))?.payload_hash;
            after.pin.attempts_used += 1;
            after.revisions = after
                .revisions
                .advance(false)
                .map_err(|_| ErrorCode::Policy)?;
            hold.updated_revision = after.revisions.operation;
            let (reservation, fresh) = self
                .authority_commit(
                    binding.clone(),
                    before,
                    after.clone(),
                    req.request_id,
                    OperationKind::PinAttempt,
                    OperationOutcome::Reserved,
                    digest,
                    Some(hold),
                )
                .await?;
            if !fresh {
                return Err(ErrorCode::Unavailable);
            }
            let verifier = blob.pin_verifier.as_deref().ok_or(ErrorCode::Policy)?;
            #[cfg(test)]
            {
                self.comparisons += 1;
            }
            let matched = compare_pin(proof, verifier);
            // Refresh for other operations but never recompare. A rotation/cancel
            // or another result wins over this execution, without refunding it.
            before = self
                .authority()?
                .store
                .load(&binding, req.request_id, Some(&req.hold.hold.hold_id))
                .await
                .map_err(|_| ErrorCode::Unavailable)?;
            let current = before.enrollment.as_ref().ok_or(ErrorCode::Unavailable)?;
            let item = before.hold.as_ref().ok_or(ErrorCode::Policy)?;
            let own: AuthorityCommitPayload = serde_json::from_slice(
                &STANDARD
                    .decode(reservation.payload)
                    .map_err(|_| ErrorCode::Unavailable)?,
            )
            .map_err(|_| ErrorCode::Unavailable)?;
            if current.revisions.enrollment != after.revisions.enrollment
                || item.status != HoldStatus::Pending
                || !before.operation.as_ref().is_some_and(|op| {
                    op.execution_id == own.commit.execution_id
                        && op.outcome == OperationOutcome::Reserved
                })
            {
                return Err(ErrorCode::Policy);
            }
            after = current.clone();
            after.revisions = after
                .revisions
                .advance(false)
                .map_err(|_| ErrorCode::Policy)?;
            let mut hold = item.clone();
            hold.updated_revision = after.revisions.operation;
            if matched {
                hold.status = HoldStatus::Released;
            }
            let (receipt, fresh) = self
                .authority_commit(
                    binding,
                    before,
                    after,
                    req.request_id,
                    OperationKind::PinAttempt,
                    OperationOutcome::Compared { matched },
                    digest,
                    Some(hold),
                )
                .await?;
            if !fresh {
                return Err(ErrorCode::Unavailable);
            }
            if !matched {
                return Err(ErrorCode::PinMismatch);
            }
            receipt
        };
        if let Some(pin) = blob.pin_verifier.as_mut() {
            pin.zeroize();
        }
        blob.pin_verifier = None;
        blob.pin_attempts_floor = None;
        let sealed = crypto::seal_escrow_release(
            &EscrowReleasePlaintext {
                blob,
                hold_id: req.hold.hold.hold_id.clone(),
            },
            req.client_ephemeral_public_key,
        )
        .map_err(|_| ErrorCode::Unavailable)?;
        Ok((sealed, receipt))
    }

    pub async fn authority_cancel(
        &mut self,
        req: ReleaseRequest<'_>,
    ) -> Result<SignedAuthorityRecord, ErrorCode> {
        identifier(&req.hold.hold.hold_id)?;
        validate_client_key(req.client_ephemeral_public_key)?;
        if req.expected_did.len() > 8192
            || req.hold.hold.did != req.expected_did
            || req.hold.hold.client_ephemeral_public_key != req.client_ephemeral_public_key
        {
            return Err(ErrorCode::Policy);
        }
        let digest = hold_hash(&self.tenant, req.hold)?;
        let request_id = format!("cancel-{}", hex::encode(digest));
        let req = ReleaseRequest {
            request_id: &request_id,
            ..req
        };
        let authority = self.authority()?;
        let binding = authority.binding(req.expected_did);
        let existing = authority
            .store
            .load(&binding, &request_id, Some(&req.hold.hold.hold_id))
            .await
            .map_err(|_| ErrorCode::Unavailable)?;
        if existing
            .hold
            .as_ref()
            .is_some_and(|h| h.status == HoldStatus::Cancelled && h.signed_hold_digest == digest)
        {
            let op = existing.operation.ok_or(ErrorCode::Unavailable)?;
            if op.kind != OperationKind::Cancel || op.outcome != OperationOutcome::Committed {
                return Err(ErrorCode::Policy);
            }
            let commit = authority
                .store
                .receipt(&binding, op.execution_id)
                .await
                .map_err(|_| ErrorCode::Unavailable)?
                .ok_or(ErrorCode::Unavailable)?;
            if commit.revisions != op.revisions {
                return Err(ErrorCode::Policy);
            }
            let event_hash = Sha256::digest(&op.proposed_event).into();
            let proposal: SignedAuthorityRecord =
                serde_json::from_slice(&op.proposed_event).map_err(|_| ErrorCode::Unavailable)?;
            self.ledger
                .verify_authority_record(&proposal)
                .map_err(ledger_error)?;
            if proposal.kind != RecordKind::Proposal {
                return Err(ErrorCode::Policy);
            }
            let event: AuthorityEvent = serde_json::from_slice(
                &STANDARD
                    .decode(&proposal.payload)
                    .map_err(|_| ErrorCode::Unavailable)?,
            )
            .map_err(|_| ErrorCode::Unavailable)?;
            let receipt = self
                .ledger
                .sign_authority_record(
                    RecordKind::Commit,
                    &serde_json::to_vec(&AuthorityCommitPayload {
                        commit,
                        event_hash,
                        request_digest: op.request_digest,
                        result_blob_identity: event.target_identity,
                        enrollment_epoch: event.epoch.get(),
                    })
                    .map_err(|_| ErrorCode::Policy)?,
                )
                .map_err(ledger_error)?;
            return Ok(receipt);
        }
        let (binding, before) = self.authority_verified_hold(&req, false).await?;
        if before.operation.is_some() {
            return Err(ErrorCode::Policy);
        }
        let mut after = before.enrollment.clone().ok_or(ErrorCode::Unavailable)?;
        after.revisions = after
            .revisions
            .advance(false)
            .map_err(|_| ErrorCode::Policy)?;
        let mut hold = before.hold.clone().ok_or(ErrorCode::Policy)?;
        hold.status = HoldStatus::Cancelled;
        hold.updated_revision = after.revisions.operation;
        let digest = self
            .operation(&req, self.authority_time().await?, "cancel", None)?
            .payload_hash;
        self.authority_commit(
            binding,
            before,
            after,
            req.request_id,
            OperationKind::Cancel,
            OperationOutcome::Committed,
            digest,
            Some(hold),
        )
        .await
        .map(|(receipt, _)| receipt)
    }

    async fn authority_time(&self) -> Result<TimeEvidence, ErrorCode> {
        let time = self.time.now(None).await.map_err(|_| ErrorCode::Time)?;
        if time.interval.lo_ms > time.interval.hi_ms || time.interval.hi_ms > JS_MAX_INTEGER {
            return Err(ErrorCode::Time);
        }
        Ok(time)
    }

    #[allow(clippy::too_many_arguments)]
    async fn authority_commit(
        &self,
        binding: Binding,
        before: Snapshot,
        after: EnrollmentItem,
        request: &str,
        kind: OperationKind,
        outcome: OperationOutcome,
        request_digest: Hash,
        hold: Option<HoldItem>,
    ) -> Result<(SignedAuthorityRecord, bool), ErrorCode> {
        let time = self.authority_time().await?;
        self.authority_commit_at(
            binding,
            before,
            after,
            request,
            kind,
            outcome,
            request_digest,
            hold,
            time,
        )
        .await
    }

    // Only create-hold supplies an already acquired sample: no await separates
    // its policy timestamp from this event. Other callers acquire fresh evidence.
    #[allow(clippy::too_many_arguments)]
    async fn authority_commit_at(
        &self,
        binding: Binding,
        before: Snapshot,
        after: EnrollmentItem,
        request: &str,
        kind: OperationKind,
        outcome: OperationOutcome,
        request_digest: Hash,
        hold: Option<HoldItem>,
        time: TimeEvidence,
    ) -> Result<(SignedAuthorityRecord, bool), ErrorCode> {
        let event = AuthorityEvent {
            binding: binding.clone(),
            request_id: request.into(),
            kind,
            outcome,
            previous_revisions: before.enrollment.as_ref().map(|e| e.revisions),
            revisions: after.revisions,
            previous_pin: before.enrollment.as_ref().map(|e| e.pin),
            pin: after.pin,
            epoch: after.epoch,
            source_identity: before
                .enrollment
                .as_ref()
                .and_then(|e| active(e).ok())
                .map(|b| b.identity),
            target_identity: active(&after).ok().map(|b| b.identity),
            share_version: active(&after).ok().map(|b| b.share_version),
            rewrap_delegated: active(&after).is_ok_and(|b| b.rewrap_delegated),
            hold_id: hold.as_ref().map(|h| h.hold_id.clone()),
            hold_status: hold.as_ref().map(|h| h.status),
            request_digest,
            time,
        };
        let proposal = self
            .ledger
            .sign_authority_record(
                RecordKind::Proposal,
                &serde_json::to_vec(&event).map_err(|_| ErrorCode::Policy)?,
            )
            .map_err(ledger_error)?;
        let proposed_event = serde_json::to_vec(&proposal).map_err(|_| ErrorCode::Policy)?;
        let result_blob_identity = event.target_identity;
        let enrollment_epoch = after.epoch.get();
        let event_hash = Sha256::digest(&proposed_event).into();
        let operation = OperationItem {
            request_id: request.into(),
            execution_id: [0; 16],
            kind,
            outcome,
            revisions: after.revisions,
            request_digest,
            proposed_event,
        };
        let transition = Transition::prepare(binding, before, after, operation, hold)
            .map_err(|_| ErrorCode::Policy)?;
        let (commit, fresh) = match self
            .authority()?
            .store
            .commit(transition)
            .await
            .map_err(|_| ErrorCode::Unavailable)?
        {
            CommitOutcome::Applied(commit) => (commit, true),
            CommitOutcome::Reconciled(commit) => (commit, false),
            CommitOutcome::Conflict => return Err(ErrorCode::Policy),
            CommitOutcome::Unknown => return Err(ErrorCode::Unavailable),
        };
        let receipt = self
            .ledger
            .sign_authority_record(
                RecordKind::Commit,
                &serde_json::to_vec(&AuthorityCommitPayload {
                    commit,
                    event_hash,
                    request_digest,
                    result_blob_identity,
                    enrollment_epoch,
                })
                .map_err(|_| ErrorCode::Policy)?,
            )
            .map_err(ledger_error)?;
        Ok((receipt, fresh))
    }
}

fn count(value: u64) -> Result<Counter, ErrorCode> {
    Counter::try_from(value).map_err(|_| ErrorCode::Policy)
}
fn active(state: &EnrollmentItem) -> Result<&ActiveBlob, ErrorCode> {
    match &state.enrollment {
        EnrollmentStatus::Active { blob } => Ok(blob),
        EnrollmentStatus::Disabled => Err(ErrorCode::Policy),
    }
}
fn check_blob(
    blob: &EscrowBlobPlaintext,
    did: &str,
    state: &EnrollmentItem,
) -> Result<(), ErrorCode> {
    if blob.did != did
        || blob.share_version != f64::from(active(state)?.share_version)
        || blob.pin_verifier.is_some() != state.pin.configured
        || blob.pin_attempts_floor.unwrap_or(0) > state.pin.attempts_used
    {
        return Err(ErrorCode::Policy);
    }
    Ok(())
}
fn same_pin(a: Option<&str>, b: Option<&str>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(a), Some(b)) => bool::from(a.as_bytes().ct_eq(b.as_bytes())),
        _ => false,
    }
}

#[cfg(test)]
mod tests;
