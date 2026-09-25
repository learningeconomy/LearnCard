# Escrow Recovery — Staged Rollout Runbook

This runbook governs turning on **automatic** escrow recovery enrollment for real
tenants, stage by stage. It is operator-facing, not implementation documentation —
see `packages/learn-card-base/src/config/escrowRollout.ts` for the code and
`.sisyphus/plans/nitro-escrow-enclave.md` for the full project plan.

## What this controls (and what it doesn't)

Two independent tenant-config switches gate escrow:

| Switch                            | Location                   | Controls                                                                          |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `auth.sss.escrowEnclaveMode`      | tenant config (`auth.sss`) | Whether escrow **exists at all** for the tenant (`off` / `software` / `nitro`).   |
| `features.escrowRolloutPercent`   | tenant config (`features`) | Of the users for whom escrow exists, what percent get **silently auto-enrolled**. |
| `features.escrowRolloutAllowlist` | tenant config (`features`) | Internal testers auto-enrolled regardless of `escrowRolloutPercent` (see below).  |

This runbook is about the **second and third** switches. Flipping
`escrowRolloutPercent` up:

- Does **not** touch users who are already enrolled (they keep working — see
  "Rollback" below).
- Does **not** force enrollment on anyone — it only allows the client's
  background `AuthCoordinator.refreshEscrow` step to auto-enroll a user the
  next time they're active, if they land in the bucket.
- Does **not** disable a user's ability to _manually_ opt in via
  `enableEscrowRecovery()` — that path is never gated by this rollout; a
  user outside the bucket who explicitly asks for escrow recovery still
  gets it.

Setting `escrowRolloutPercent: 0` and `escrowRolloutAllowlist: []` (the
defaults) means escrow can be fully built out and attested for a tenant
without a single real user being auto-enrolled — this is the intended
"internal-only" state.

## Launch blockers — DO NOT roll out beyond internal until these are resolved

Per `.sisyphus/notepads/nitro-escrow-enclave/problems.md`, two items remain open:

1. **No second production-grade Roughtime time source.** The enclave's 7-day
   hold timer requires ≥2 independent signed time sources; today only one
   (Cloudflare) is realistically usable and it's explicitly marked
   "DO NOT USE IN PRODUCTION" upstream. Every production release would
   currently fail closed with `InsufficientSources`. Needs a product/security
   decision (add more Roughtime operators, run LearnCard-operated servers in
   separate accounts, or accept a documented weaker model) before any real
   user can complete a hold-based release in production.
2. **D10 residual risk: `escrow-kms-admin` can rewrite the KMS key policy.**
   An MFA-authenticated admin session can still add an unattested `kms:Decrypt`
   Allow, fully bypassing the attestation gate. Mitigated (CODEOWNERS
   two-person review, `DenyPutKeyPolicyWithoutMFA`, a CloudTrail alarm — see
   below), not eliminated. Security must explicitly accept this residual risk
   (or adopt the immutable-key-policy alternative documented in
   `infra/escrow-enclave/README.md`) before rollout proceeds past internal.

**Gate:** stage 1 (internal allowlist) may proceed once both items have an
explicit, documented decision from security/product — even a "we accept this
risk" sign-off counts as resolved. Stages 2+ (1% and above, i.e. any real,
non-internal user) must not start until both are actually fixed or the
Roughtime item specifically is closed (D10 is a residual, security-accepted
risk by design; the Roughtime item is a hard functional blocker — recovery
literally cannot complete without it).

## Computing an allowlist hash for an internal tester

Allowlist entries are lowercase hex SHA-256 hashes of the tester's **primary
DID** (never a raw DID, email, or other PII). The hash is _not_ tenant-scoped,
so one hash works across every tenant config the tester needs:

```bash
printf '%s' 'did:key:zTheTestersActualDid' | shasum -a 256 | cut -d' ' -f1
```

Add the result to `features.escrowRolloutAllowlist` in the tenant's
`environments/<tenant>.json` overlay. An allowlisted user is auto-enrolled
even at `escrowRolloutPercent: 0`.

To find a tester's own DID for this purpose, use the in-app debug tooling
(`AuthDebugTab`) or have them run `wallet.id.did()` — never ask them to send
you the DID over an insecure channel if avoidable, and never paste a raw DID
into this runbook, a ticket, or a Slack message. Hash it locally first.

## Stages

Advance one stage at a time. Each stage should run for at least 48 hours
(long enough to observe at least one full 7-day-hold cohort's _start_ events,
plus same-day PIN-release activity) before advancing, and longer if any
metric is trending toward a threshold without breaching it.

| Stage | `escrowRolloutPercent` | Who                                                                   |
| ----- | ---------------------- | --------------------------------------------------------------------- |
| 1     | `0`                    | Internal allowlist only                                               |
| 2     | `1`                    | ~1% of eligible users                                                 |
| 3     | `10`                   | ~10% of eligible users                                                |
| 4     | `50`                   | ~50% of eligible users                                                |
| 5     | `100`                  | Everybody (still per-tenant — `escrowEnclaveMode` still has to be on) |

Bucketing is deterministic per `(tenantId, userKey)` (SHA-256-based), so
raising the percent only ever _adds_ users to the enrolled set — nobody who
was previously in the bucket falls out of it just because the percent went
up.

## Go/no-go criteria per stage

Tied to the P7.1 `escrow-ledger-monitor` alarms
(`infra/escrow-enclave/monitor.tf`, dashboard `<prefix>-ledger-monitor`,
runbook `services/escrow-ledger-monitor/README.md`). Check CloudWatch (or
wait for the SNS alarm — an operator should be subscribed via
`monitor_alarm_email`) before every stage advance:

| Criterion                      | Alarm / metric                                                                                  | Threshold to ADVANCE                                                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tamper detection               | `LedgerIntegrityFailure` (namespace `LearnCard/EscrowLedger`)                                   | `0` in the observation window (any nonzero value is a hard stop, not just a "watch it")                                                                                                                     |
| Audit consistency              | `AuditMismatch`                                                                                 | `0` — DynamoDB and the S3 Object Lock audit trail must agree                                                                                                                                                |
| Release rate                   | `Released`                                                                                      | Under `monitor_released_hourly_threshold` (default 100/hr) at every hour in the window                                                                                                                      |
| PIN-failure rate               | `PinAttemptFailed`                                                                              | Under `monitor_pin_failed_hourly_threshold` (default 100/hr) at every hour in the window                                                                                                                    |
| Enclave / monitor availability | `<prefix>-monitor-sweep-missing` (heartbeat), `<prefix>-monitor-errors`, `<prefix>-monitor-dlq` | No heartbeat gaps, no Lambda errors, empty DLQ for the whole window                                                                                                                                         |
| KMS governance                 | `EscrowKmsGovernanceChange` (CloudTrail EventBridge rule)                                       | Zero unplanned firings (a firing tied to a reviewed, two-person-approved measurement rotation is fine; anything else is a hard stop — treat as a security incident, not a rollout blocker to just wait out) |

**No-go:** if any hard-stop criterion above is breached, do not advance —
drop back to the previous stage's percent (see Rollback) and open an incident
before considering another advance.

## Rollback

**Lowering the percent (the normal path):**

1. Set `features.escrowRolloutPercent` back to the previous stage's value (or
   `0`) in the tenant's environment overlay and redeploy the tenant config.
2. Lowering the percent stops **new** automatic enrollments only — it does
   not un-enroll anyone, disable anyone's recovery, or clear any escrow
   blob. Precisely: on every `refreshEscrow` cycle, the client first reads
   the account's own current enrollment status (`getEscrowEnrollmentState`).
   The rollout percent is consulted **only** when that status comes back
   `not-enrolled` — deciding whether this account may be auto-enrolled for
   the first time. Any account that is already `enrolled` (or `stale`, the
   P6.1 software→Nitro migration state) bypasses the percent entirely and
   `ensureEscrowEnrollment` keeps being called every cycle regardless of
   bucket, because that same call is also the account's ongoing
   maintenance path: it re-seals the escrow blob after a share-version
   rotation (otherwise the sealed blob would silently stop matching the
   live auth share) and repairs a `stale` blob during migration. So an
   existing enrollee who happens to fall outside a lowered percentage
   keeps being fully maintained, not just readable. Reads
   (`getEscrowEnrollmentState`, hold-status polling) and explicit recovery
   actions were never gated by the rollout percent in the first place.
3. No server-side action is required for a percent-only rollback.

**Kill switch (`ESCROW_RELEASE_KILL_SWITCH`) — security incidents only:**

This is a **separate, more severe control** than the rollout percent. It is
an lca-api environment variable (`services/learn-card-network/lca-api`,
read live from `process.env` on every request — no redeploy needed to flip
it) that refuses **every** hold and PIN release outright, for **every**
tenant, including users who are already enrolled and mid-recovery. Use it
only when you suspect the release path itself is compromised (e.g. a KMS
governance alarm you can't immediately explain, a ledger tamper alarm, or
active exploitation) — not as a way to pause a rollout, which the percent
switch already does without disrupting existing users.

1. Set `ESCROW_RELEASE_KILL_SWITCH=true` in the lca-api environment.
2. Confirm in logs/metrics that `escrow.startRecovery` / `escrow.completeRecovery`
   now refuse with the kill-switch error for new requests.
3. Investigate. The `escrow-ledger-monitor` must never set or clear this
   itself (see `services/escrow-ledger-monitor/README.md`) — it is a manual,
   human-triggered control by design, so a compromised or buggy monitor
   can't toggle production availability on its own.
4. Clear the flag only after the incident is understood and closed out.

## Notes for the operator making the percent change

- The percent and allowlist live in `features.escrowRolloutPercent` /
  `features.escrowRolloutAllowlist` in the tenant's `environments/<tenant>.json`
  overlay (see the root `AGENTS.md` "TenantConfig System" section for the
  build/deploy pipeline). There is no runtime admin toggle — a config change
  and redeploy is required for every stage advance or rollback.
- Bucketing hashes `${tenantId}:${userDid}`, so the same user can be in the
  rollout for one tenant and not another — stage each tenant independently.
- Never put a raw DID or email in a PR, ticket, or this document — only the
  SHA-256 hash described above.
