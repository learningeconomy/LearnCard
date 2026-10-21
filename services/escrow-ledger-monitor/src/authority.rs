//! Independent read-only authority audit. A proposal alone never proves commit:
//! execution receipts and current rows come from authenticated DynamoDB reads,
//! bracketed by an unchanged account row. No host API, Mongo, writer credential,
//! escrow key or enclave transition implementation is consulted.
use crate::{Backend, Error, Metric, Monitor, Result};
use base64::{Engine, engine::general_purpose::STANDARD};
use escrow_enclave::authority::{
    audit::{AuthorityEvent, ExecutionRecord},
    record::{RecordKind, SignedAuthorityRecord},
    state::{
        Binding, EnrollmentStatus, HoldStatus, ItemValue, MAX_COUNTER, MAX_EVENT_BYTES,
        MAX_ITEM_BYTES, OperationKind as Kind, OperationOutcome as Outcome, PIN_BUDGET, StoredItem,
    },
};
use p256::ecdsa::VerifyingKey;
use std::collections::{BTreeMap, BTreeSet};

pub const MAX_ACCOUNT_ROWS: usize = 4096;
pub const MAX_ACCOUNT_BYTES: usize = 32 * 1024 * 1024;
pub const MAX_PARTITIONS: usize = 50_000;
/// P9.1 (attack C): must match the enclave's own RELEASE_WARNING_MIN_GAP_MS
/// (policy/authority.rs) — the monitor independently re-derives this gate
/// from signed events rather than trusting the stored HoldItem's own fields.
const RELEASE_WARNING_MIN_GAP_MS: u64 = 24 * 60 * 60 * 1000;

/// Tracks per-hold state derived only from signed ledger events, never from
/// the unauthenticated stored HoldItem row (cross-checked against it below).
struct HoldTrack<'a> {
    created: &'a AuthorityEvent,
    last: &'a AuthorityEvent,
    /// Set from the one ConfirmHold event whose guess matched (hold_status
    /// transitions AwaitingConfirmation -> Pending); None for every mismatch.
    confirmed_hi_ms: Option<u64>,
    /// Set from the earliest SendReleaseWarning event, if any. Using the
    /// earliest (not latest) is the conservative choice if a retried send
    /// ever produced more than one.
    warned_hi_ms: Option<u64>,
}

#[derive(Clone)]
pub struct Row {
    pub pk: String,
    pub sk: String,
    pub payload: Vec<u8>,
}
pub struct AuthorityTrust(BTreeMap<String, (VerifyingKey, BTreeSet<[u8; 32]>)>);
pub struct Config {
    pub table: String,
    pub generation: String,
    pub trust: AuthorityTrust,
}

impl AuthorityTrust {
    /// Security-owned SSM String, not an attestation/key supplied by the parent.
    /// Retain historical key/measurement pairs for the lifetime of audit rows.
    pub fn parse(input: &str) -> Result<Self> {
        if input.len() > 8192 {
            return Err(Error::Configuration);
        }
        let values: BTreeMap<String, serde_json::Value> =
            serde_json::from_str(input).map_err(|_| Error::Configuration)?;
        if values.is_empty() || values.len() > 32 {
            return Err(Error::Configuration);
        }
        let mut keys = BTreeMap::new();
        for (id, value) in values {
            if id.is_empty()
                || id.len() > 128
                || !id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
            {
                return Err(Error::Configuration);
            }
            let object = value
                .as_object()
                .filter(|o| o.len() == 2)
                .ok_or(Error::Configuration)?;
            let public = object
                .get("publicKey")
                .and_then(|v| v.as_str())
                .ok_or(Error::Configuration)?;
            if !public.starts_with("04") || !lower_hex(public, 130) {
                return Err(Error::Configuration);
            }
            let key = VerifyingKey::from_sec1_bytes(
                &hex::decode(public).map_err(|_| Error::Configuration)?,
            )
            .map_err(|_| Error::Configuration)?;
            let values = object
                .get("measurements")
                .and_then(|v| v.as_array())
                .filter(|a| !a.is_empty() && a.len() <= 8)
                .ok_or(Error::Configuration)?;
            let mut measurements = BTreeSet::new();
            for value in values {
                let text = value
                    .as_str()
                    .filter(|s| lower_hex(s, 64))
                    .ok_or(Error::Configuration)?;
                let mut hash = [0; 32];
                hex::decode_to_slice(text, &mut hash).map_err(|_| Error::Configuration)?;
                if !measurements.insert(hash) {
                    return Err(Error::Configuration);
                }
            }
            keys.insert(id, (key, measurements));
        }
        Ok(Self(keys))
    }

    /// Kind is a required expectation. Commit/Snapshot evidence cannot masquerade
    /// as a proposal (or authorize a state transition in this read-only process).
    pub fn verify_artifact(
        &self,
        record: &SignedAuthorityRecord,
        kind: RecordKind,
    ) -> Result<Vec<u8>> {
        let (key, measurements) = self.0.get(&record.key_id).ok_or(Error::Integrity)?;
        check(record.kind == kind && measurements.contains(&record.measurement))?;
        record.verify(key).map_err(|_| Error::Integrity)?;
        STANDARD
            .decode(&record.payload)
            .map_err(|_| Error::Integrity)
    }
}

#[async_trait::async_trait]
pub trait AuthorityBackend: Backend {
    async fn authority_partitions(&self, table: &str) -> Result<Vec<String>>;
    async fn authority_account(&self, table: &str, pk: &str) -> Result<Option<Vec<u8>>>;
    async fn authority_rows(&self, table: &str, pk: &str) -> Result<Vec<Row>>;
}

impl<B: AuthorityBackend> Monitor<B> {
    pub async fn sweep_authority(&self, config: &Config) -> Result<()> {
        let result = self.sweep_authority_inner(config).await;
        match result {
            Err(Error::Integrity) => {
                self.alarm(Metric::AuthorityIntegrityFailure).await?;
                Err(Error::Unavailable)
            }
            Err(error) => {
                self.alarm(Metric::AuthorityCoverageFailure).await?;
                Err(error)
            }
            Ok(()) => Ok(()),
        }
    }
    async fn sweep_authority_inner(&self, config: &Config) -> Result<()> {
        let partitions = self.backend.authority_partitions(&config.table).await?;
        if partitions.len() > MAX_PARTITIONS {
            return Err(Error::Unavailable);
        }
        for pk in partitions.into_iter().collect::<BTreeSet<_>>() {
            // A Query/Scan is NOT a snapshot. Every legitimate write increments
            // the account revision. A changed fence yields retry, not tampering.
            let before = self.backend.authority_account(&config.table, &pk).await?;
            let rows = self.backend.authority_rows(&config.table, &pk).await?;
            let after = self.backend.authority_account(&config.table, &pk).await?;
            if before != after {
                return Err(Error::Unavailable);
            }
            match verify_account(&self.tenant, &config.generation, &pk, &rows, &config.trust) {
                Err(Error::Integrity) => self.alarm(Metric::AuthorityIntegrityFailure).await?,
                Err(error) => return Err(error),
                Ok(()) => {
                    if rows
                        .iter()
                        .find(|r| r.sk == "ENROLLMENT")
                        .map(|r| &r.payload)
                        != after.as_ref()
                    {
                        self.alarm(Metric::AuthorityIntegrityFailure).await?;
                    }
                }
            }
        }
        self.backend.metric(Metric::AuthoritySweepCompleted).await
    }
}

/// Reconstruct visible history independently, then correlate all committed rows.
/// Snapshot RPCs are not persisted in this table and are never commit evidence.
pub fn verify_account(
    tenant: &str,
    generation: &str,
    pk: &str,
    rows: &[Row],
    trust: &AuthorityTrust,
) -> Result<()> {
    if rows.len() > MAX_ACCOUNT_ROWS
        || rows.iter().map(|r| r.payload.len()).sum::<usize>() > MAX_ACCOUNT_BYTES
    {
        return Err(Error::Unavailable);
    }
    check(
        !rows.is_empty()
            && rows
                .iter()
                .all(|r| r.pk == pk && !r.payload.is_empty() && r.payload.len() <= MAX_ITEM_BYTES),
    )?;
    check(rows.iter().map(|r| &r.sk).collect::<BTreeSet<_>>().len() == rows.len())?;
    let account = rows
        .iter()
        .find(|r| r.sk == "ENROLLMENT")
        .ok_or(Error::Integrity)?;
    let parsed: StoredItem =
        serde_json::from_slice(&account.payload).map_err(|_| Error::Integrity)?;
    let binding = Binding {
        tenant: tenant.into(),
        generation: generation.into(),
        did_hash: parsed.binding.did_hash,
    };
    check(binding.partition_key().map_err(|_| Error::Integrity)? == pk)?;
    let ItemValue::Enrollment(current) =
        StoredItem::decode(&account.payload, &binding, "ENROLLMENT")
            .map_err(|_| Error::Integrity)?
            .value
    else {
        return Err(Error::Integrity);
    };
    let mut executions = BTreeMap::new();
    let mut items = Vec::new();
    for row in rows {
        if row.sk == "ENROLLMENT" {
            continue;
        }
        if row.sk.starts_with("EXECUTION#") {
            let execution: ExecutionRecord =
                serde_json::from_slice(&row.payload).map_err(|_| Error::Integrity)?;
            check(
                row.sk == format!("EXECUTION#{}", hex::encode(execution.receipt.execution_id))
                    && execution.receipt.schema_version == 1
                    && execution.receipt.binding == binding
                    && !execution.proposed_event.is_empty()
                    && execution.proposed_event.len() <= MAX_EVENT_BYTES,
            )?;
            let record: SignedAuthorityRecord =
                serde_json::from_slice(&execution.proposed_event).map_err(|_| Error::Integrity)?;
            let event: AuthorityEvent =
                serde_json::from_slice(&trust.verify_artifact(&record, RecordKind::Proposal)?)
                    .map_err(|_| Error::Integrity)?;
            check(
                event.binding == binding
                    && event.revisions == execution.receipt.revisions
                    && event.revisions.operation.get() > 0
                    && event.revisions.operation.get() <= current.revisions.operation.get(),
            )?;
            let revision = event.revisions.operation.get();
            check(executions.insert(revision, (execution, event)).is_none())?;
        } else {
            items.push(
                StoredItem::decode(&row.payload, &binding, &row.sk)
                    .map_err(|_| Error::Integrity)?
                    .value,
            );
        }
    }
    check(executions.len() as u64 == current.revisions.operation.get())?;
    let mut previous: Option<&AuthorityEvent> = None;
    let mut latest_requests = BTreeMap::new();
    let mut holds: BTreeMap<&str, HoldTrack> = BTreeMap::new();
    let mut intent_digest = None;
    for (offset, (execution, event)) in executions.values().enumerate() {
        check(event.revisions.operation.get() == offset as u64 + 1)?;
        transition(previous, event)?;
        if matches!(
            event.kind,
            Kind::Enroll | Kind::Replace | Kind::Carry | Kind::Disable
        ) {
            intent_digest = Some(event.request_digest);
        }
        if let Some((_, prior)) =
            latest_requests.insert(event.request_id.as_str(), (execution, event))
        {
            check(
                prior.kind == Kind::PinAttempt
                    && prior.outcome == Outcome::Reserved
                    && event.kind == Kind::PinAttempt
                    && matches!(event.outcome, Outcome::Compared { .. })
                    && prior.request_digest == event.request_digest
                    && prior.revisions.enrollment == event.revisions.enrollment
                    && prior.hold_id == event.hold_id,
            )?;
        } else {
            check(!matches!(event.outcome, Outcome::Compared { .. }))?;
        }
        if let Some(id) = event.hold_id.as_deref() {
            if event.kind == Kind::CreateHold {
                check(
                    holds
                        .insert(
                            id,
                            HoldTrack {
                                created: event,
                                last: event,
                                confirmed_hi_ms: None,
                                warned_hi_ms: None,
                            },
                        )
                        .is_none(),
                )?;
            } else {
                let track = holds.get_mut(id).ok_or(Error::Integrity)?;
                // P9.1 (attack C): ConfirmHold/ResendCode require the hold to
                // still be awaiting confirmation; Cancel accepts either
                // non-terminal status (matching authority_cancel); every
                // other kind (SendReleaseWarning, Release, PinAttempt)
                // requires the hold to already be confirmed (Pending).
                let allowed_prior: &[HoldStatus] = match event.kind {
                    Kind::ConfirmHold | Kind::ResendCode => &[HoldStatus::AwaitingConfirmation],
                    Kind::Cancel => &[HoldStatus::AwaitingConfirmation, HoldStatus::Pending],
                    _ => &[HoldStatus::Pending],
                };
                check(
                    track
                        .last
                        .hold_status
                        .is_some_and(|status| allowed_prior.contains(&status)),
                )?;
                if event.kind != Kind::Cancel {
                    check(track.created.revisions.enrollment == event.revisions.enrollment)?;
                }
                if event.kind == Kind::ConfirmHold && event.hold_status == Some(HoldStatus::Pending)
                {
                    check(track.confirmed_hi_ms.is_none())?;
                    track.confirmed_hi_ms = Some(event.time.interval.hi_ms);
                }
                if event.kind == Kind::SendReleaseWarning {
                    track.warned_hi_ms.get_or_insert(event.time.interval.hi_ms);
                }
                // P9.1 (attack C): the independent release gate. A hold that
                // started AwaitingConfirmation must show a matched ConfirmHold
                // and a SendReleaseWarning at least 24h before this release's
                // own trusted-time lower bound, mirroring (and independently
                // re-checking, not trusting) the enclave's own release policy.
                if track.created.hold_status == Some(HoldStatus::AwaitingConfirmation)
                    && (event.kind == Kind::Release
                        || (event.kind == Kind::PinAttempt
                            && event.hold_status == Some(HoldStatus::Released)))
                {
                    check(
                        track.confirmed_hi_ms.is_some()
                            && track.warned_hi_ms.is_some_and(|warned| {
                                event.time.interval.lo_ms
                                    >= warned.saturating_add(RELEASE_WARNING_MIN_GAP_MS)
                            }),
                    )?;
                }
                track.last = event;
            }
        }
        previous = Some(event);
    }
    let last = previous.ok_or(Error::Integrity)?;
    check(
        last.revisions == current.revisions
            && last.epoch == current.epoch
            && last.pin == current.pin
            && intent_digest == Some(current.intent_digest),
    )?;
    match &current.enrollment {
        EnrollmentStatus::Disabled => check(
            last.target_identity.is_none()
                && last.share_version.is_none()
                && !last.rewrap_delegated,
        )?,
        EnrollmentStatus::Active { blob } => check(
            last.target_identity == Some(blob.identity)
                && last.share_version == Some(blob.share_version)
                && last.rewrap_delegated == blob.rewrap_delegated,
        )?,
    }
    for item in items {
        match item {
            ItemValue::Operation(op) => {
                let (execution, event) = latest_requests
                    .remove(op.request_id.as_str())
                    .ok_or(Error::Integrity)?;
                check(
                    op.execution_id == execution.receipt.execution_id
                        && op.revisions == event.revisions
                        && op.kind == event.kind
                        && op.outcome == event.outcome
                        && op.request_digest == event.request_digest
                        && op.proposed_event == execution.proposed_event,
                )?;
            }
            ItemValue::Hold(hold) => {
                let track = holds
                    .remove(hold.hold_id.as_str())
                    .ok_or(Error::Integrity)?;
                check(
                    hold.created_revision == track.created.revisions.operation
                        && hold.updated_revision == track.last.revisions.operation
                        && Some(hold.status) == track.last.hold_status
                        && hold.enrollment_version == track.created.revisions.enrollment
                        && hold.epoch == track.created.epoch
                        && Some(hold.blob_identity) == track.created.target_identity
                        && hold.signed_hold_digest == track.created.request_digest,
                )?;
            }
            ItemValue::Enrollment(_) => return Err(Error::Integrity),
        }
    }
    check(latest_requests.is_empty() && holds.is_empty())
}

fn transition(old: Option<&AuthorityEvent>, new: &AuthorityEvent) -> Result<()> {
    check(
        new.revisions.enrollment.get() > 0
            && new.revisions.enrollment.get() <= new.revisions.operation.get()
            && new.epoch.get() > 0
            && new.epoch.get() <= new.revisions.enrollment.get()
            && new.pin.generation.get() <= new.revisions.enrollment.get()
            && new.pin.attempts_used <= PIN_BUDGET
            && (new.pin.configured || new.pin.attempts_used == 0)
            && (!new.pin.configured || new.pin.generation.get() > 0)
            && new.time.interval.lo_ms <= new.time.interval.hi_ms
            && new.time.interval.hi_ms <= MAX_COUNTER
            && new.target_identity.is_some() == new.share_version.is_some()
            && new.share_version != Some(0),
    )?;
    let owner_change = matches!(
        new.kind,
        Kind::Enroll | Kind::Replace | Kind::Carry | Kind::Disable
    );
    let enrollment_change = owner_change || new.kind == Kind::Rewrap;
    if let Some(old) = old {
        check(
            new.previous_revisions == Some(old.revisions)
                && new.previous_pin == Some(old.pin)
                && new.source_identity == old.target_identity
                && new.revisions.enrollment.get()
                    == old.revisions.enrollment.get() + u64::from(enrollment_change)
                && new.epoch.get()
                    == old.epoch.get()
                        + u64::from(matches!(
                            new.kind,
                            Kind::Enroll | Kind::Replace | Kind::Carry
                        )),
        )?;
        if new.pin.generation == old.pin.generation {
            check(new.pin.configured == old.pin.configured)?;
            let increment =
                u8::from(new.kind == Kind::PinAttempt && new.outcome == Outcome::Reserved);
            check(
                new.pin.attempts_used
                    == old
                        .pin
                        .attempts_used
                        .checked_add(increment)
                        .ok_or(Error::Integrity)?,
            )?;
        } else {
            check(
                owner_change
                    && new.kind != Kind::Disable
                    && new.pin.generation.get() == old.pin.generation.get() + 1
                    && new.pin.attempts_used == 0,
            )?;
        }
        if matches!(new.kind, Kind::Carry | Kind::Rewrap | Kind::Disable) {
            check(new.pin == old.pin)?;
        }
        if !enrollment_change {
            check(
                new.target_identity == old.target_identity
                    && new.share_version == old.share_version
                    && new.rewrap_delegated == old.rewrap_delegated,
            )?;
        }
        match new.kind {
            Kind::Enroll => check(old.target_identity.is_none() && new.target_identity.is_some())?,
            Kind::Replace => check(
                old.target_identity.is_some()
                    && new.target_identity.is_some()
                    && new.target_identity != old.target_identity
                    && new.share_version >= old.share_version,
            )?,
            Kind::Carry => check(
                old.pin.configured
                    && old.target_identity.is_some()
                    && new.target_identity.is_some()
                    && new.target_identity != old.target_identity
                    && new.share_version > old.share_version,
            )?,
            Kind::Rewrap => check(
                old.rewrap_delegated
                    && new.rewrap_delegated
                    && old.target_identity.is_some()
                    && new.target_identity.is_some()
                    && new.target_identity != old.target_identity
                    && new.share_version == old.share_version,
            )?,
            Kind::Disable => check(
                old.target_identity.is_some()
                    && new.target_identity.is_none()
                    && !new.rewrap_delegated,
            )?,
            Kind::Cancel => {} // Obsolete holds can be cancelled after rotation/disable.
            _ => check(new.target_identity.is_some())?,
        }
    } else {
        check(
            new.kind == Kind::Enroll
                && new.previous_revisions.is_none()
                && new.previous_pin.is_none()
                && new.source_identity.is_none()
                && new.revisions.enrollment.get() == 1
                && new.epoch.get() == 1
                && new.target_identity.is_some()
                && new.pin.attempts_used == 0
                && new.pin.generation.get() == u64::from(new.pin.configured),
        )?;
    }
    match (new.kind, new.outcome) {
        (Kind::PinAttempt, Outcome::Reserved | Outcome::Compared { .. }) => {
            check(new.pin.configured)?
        }
        (Kind::PinAttempt, _) => return Err(Error::Integrity),
        (_, Outcome::Committed) => {}
        _ => return Err(Error::Integrity),
    }
    match new.kind {
        // P9.1 (attack C): a Hold-policy create always starts AwaitingConfirmation
        // (the enclave fails the whole request closed rather than falling back to
        // Pending when a blob/sender is missing); Pin-policy starts Pending.
        Kind::CreateHold => check(
            new.hold_id.is_some()
                && matches!(
                    new.hold_status,
                    Some(HoldStatus::Pending) | Some(HoldStatus::AwaitingConfirmation)
                ),
        )?,
        Kind::Release => {
            check(new.hold_id.is_some() && new.hold_status == Some(HoldStatus::Released))?
        }
        Kind::Cancel => {
            check(new.hold_id.is_some() && new.hold_status == Some(HoldStatus::Cancelled))?
        }
        Kind::PinAttempt => check(
            new.hold_id.is_some()
                && new.hold_status
                    == Some(if new.outcome == (Outcome::Compared { matched: true }) {
                        HoldStatus::Released
                    } else {
                        HoldStatus::Pending
                    }),
        )?,
        // P9.1 (attack C): committed regardless of guess match (a mismatch never
        // transitions status); the matching guess moves AwaitingConfirmation ->
        // Pending, so both resulting statuses are valid for this kind alone.
        Kind::ConfirmHold => check(
            new.hold_id.is_some()
                && matches!(
                    new.hold_status,
                    Some(HoldStatus::AwaitingConfirmation) | Some(HoldStatus::Pending)
                ),
        )?,
        // P9.1 (attack C): system-initiated, never transitions status (requires
        // Pending on entry and leaves it Pending — see authority_send_release_warning).
        Kind::SendReleaseWarning => {
            check(new.hold_id.is_some() && new.hold_status == Some(HoldStatus::Pending))?
        }
        // P9.1 (attack C): only valid pre-confirmation; never transitions status.
        Kind::ResendCode => check(
            new.hold_id.is_some() && new.hold_status == Some(HoldStatus::AwaitingConfirmation),
        )?,
        _ => check(new.hold_id.is_none() && new.hold_status.is_none())?,
    }
    Ok(())
}
fn check(ok: bool) -> Result<()> {
    if ok { Ok(()) } else { Err(Error::Integrity) }
}
fn lower_hex(value: &str, length: usize) -> bool {
    value.len() == length
        && value
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

#[cfg(test)]
mod tests;
