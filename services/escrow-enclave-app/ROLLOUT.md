# Escrow Recovery — Staged Rollout Runbook

This runbook governs turning on **automatic** escrow recovery enrollment for real
tenants. **As of 2026-10-31 there are no intermediate stages:** SSS launches only
with escrow at 100%, for LearnCard and VetPass production together (#1875). See
[100% launch](#100-launch-the-switch) for the current plan; the staged sections below
are kept as history. It is operator-facing, not implementation documentation —
see `packages/learn-card-base/src/config/escrowRollout.ts` for the code.

Before production infrastructure bring-up, complete [PRODUCTION.md](./PRODUCTION.md).
The authority Object Lock archiver/outbox is **post-launch hardening**, not a
launch or stage gate: R-AUTHORITY-ROLLBACK is accepted for all stages
(LAUNCH-DECISIONS.md RAR, amended 2026-10-31). Preparing
infrastructure or passing offline Terraform tests does not close any live gate.

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

Per the open launch blockers in [SECURITY.md](SECURITY.md#open-items--launch-blockers), these items remain open:

Decision records (options, risks, recommendations, owner/approver placeholders)
for these and related launch calls live in [LAUNCH-DECISIONS.md](LAUNCH-DECISIONS.md).

1. **Roughtime operational review.** Releases need 2 of 3 agreeing Roughtime
   servers (Cloudflare, int08h, time.txryan.com); all three verify from the staging
   host. All three operators acknowledged LearnCard's use (operator-reported,
   2026-10-30; see LAUNCH-DECISIONS.md RT). Remaining for the 100% switch: the
   owner's sign-off on the proposed 100% amendment. The measured per-operation
   request count and the 100% volume forecast were not provided; the owner deferred
   them (2026-11-05).
2. **Enrollment authority — verified on staging; deployed to production.**
   Without a configured authority the enclave wires in `UnavailableEnrollment`, so
   create hold, release and cancel fail closed with `Unavailable` (carry and rewrap
   do not use it). The design is in [ENROLLMENT-AUTHORITY.md](ENROLLMENT-AUTHORITY.md).
   Staging runs it (generation `staging-g1`); a real 7-day hold released there
   (jackson+pin2, operator-reported), and staging passed the live attack C run on image `v79ea1bd7`
   ([SECURITY.md](SECURITY.md#staging-verification-2026-10-23)). Production
   runs it too (generation `production-g1`): on 2026-10-30 the SSS pilot account
   enrolled, set a PIN and recovered with it on a fresh device, and the production
   canary has run PIN releases (tier 2) since then and started a 7-day hold (tier 3)
   on 2026-11-04 (operator-observed).
3. **Attack C (hold notification) — closed (2026-11-05).**
   Enclave-sent confirmation email (ENROLLMENT-AUTHORITY.md section 9) is live on
   staging: a bearer-only create-hold stays `awaitingConfirmation`, wrong codes are
   refused (`codeMismatch` x4, then `codeLocked`), unconfirmed release is refused and
   cancellation is signed. The 7-day-since-confirmation soak (jackson+wait3) released
   successfully on 2026-10-30 (operator-reported). Inbox confirmation: the tier 3
   canary's inbox read the enclave code email, passed its trust checks (SPF, DKIM
   aligned to the enclave sender, SES verdicts) and confirmed the hold, on production
   on 2026-11-04 22:26Z (staging's first runs failed the confirm step on a canary
   hold-duration misconfiguration, fixed 2026-11-04). Jackson Smith confirmed on
   2026-11-05 that this closes the "operator inbox confirmation" item. The first
   production tier 3 release (~2026-11-11) completes the end-to-end signal.
4. **D10 residual risk: `escrow-kms-admin` can rewrite the KMS key policy.**
   An MFA-authenticated admin session can still add an unattested `kms:Decrypt`
   Allow, fully bypassing the attestation gate. Mitigated (CODEOWNERS
   review, root-only `DenyRootPutKeyPolicyWithoutMFA`, MFA required to assume
   `escrow-kms-admin`, a CloudTrail alarm), not eliminated. Security must
   explicitly accept this residual risk (or adopt the immutable-key-policy
   alternative documented in `infra/escrow-enclave/README.md`) before rollout
   proceeds past internal. Accepted for stage 1 (2026-10-30) and for 100%
   (LAUNCH-DECISIONS.md D10, Jackson Smith, 2026-11-05).

**Stage 1 decisions (2026-10-30, Jackson Smith).** Internal-only escrow (SSS pilot
channel and production canary accounts) proceeds with: item 1 (Roughtime) and
item 4 (D10) accepted for stage 1, see LAUNCH-DECISIONS.md RT and D10; item 2
(enrollment authority) and item 3 (attack C) proceed so that stage 1 itself
provides the production verification (pilot enrollment, PIN and hold
recoveries, hold-confirmation email), with the staging soak and inbox check
still to be recorded. None of these close any item (1-4) for stage 2: D10's
acceptance is stage 1 only and is revisited before stage 2.

**Gate (superseded 2026-10-31 by the 100% launch; kept as history):** stage 1 (internal allowlist) may proceed once all items have an
explicit, documented decision from security/product — even a "we accept this
risk" sign-off counts as resolved for D10. Stages 2+ (1% and above, i.e. any real,
non-internal user) must not start until all are actually fixed or the
Roughtime, enrollment and attack C items specifically are closed (D10 is a residual, security-accepted
risk by design; the enrollment item is a hard functional blocker — recovery
literally cannot complete without it).

## Key Rotation

Before initial launch, apply the escrow-account CloudTrail trail in bootstrap,
update both management-account guardrails, then apply core monitoring. Verify
`get-trail-status` reports logging/delivery, a denied SSO authority-table write
pages, and the next image-roll `PutKeyPolicy` fires `EscrowKmsGovernanceChange`.
See [bootstrap order](PRODUCTION.md#ordered-bootstrap-and-verification) and
[operator drills](STAGING.md#cloudtrail-trail-and-alarm-drills--operator-only).
These governance alarms were previously inert: the account had no enabled trail.
Security must explicitly accept **R-AUTHORITY-ROLLBACK** before any launch without
the archiver. This does not waive the existing functional, soak or D10 gates.

Key rotation must be rehearsed on staging before being performed in production. See [STAGING.md](./STAGING.md#11-key-rotation-rehearsal) and [SECURITY.md](./SECURITY.md#key-rotation-procedure).

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

## 100% launch (the switch)

One change, #1875, moves LearnCard and VetPass production from Web3Auth to SSS with
escrow (`nitro`, `escrowRolloutPercent: 100`) and turns on D21 brand sealing. Every
production host has run the brand-aware image since 2026-11-05 02:36Z (pins
`6dc94e2b…` and `18902a68…`, #1958), so sealing is safe to turn on with the switch.

### Prerequisites (mirror of #1875's checklist)

- [x] D10 100% amendment signed off (2026-11-05); RAR hardening target date
      recorded (2026-12-31); CNL and P-d decided (LAUNCH-DECISIONS.md).
- [x] RT 100% amendment signed off (operator-reported by Jackson Smith,
      2026-11-06; measured count and forecast deferred by the owner, 2026-11-05).
      The 2026-11-06 measurement run could not count Roughtime requests (the
      enclave makes them), so the per-operation count is still the RT-table estimate.
- [x] P-c: the app links the current (2026-10-27) privacy policy
      (https://learncard.com/privacy-policy, in #1875), and the legal approver is
      named: Yas (Legal), 2026-10-26 (LAUNCH-DECISIONS.md P-c).
- [x] P-d fix merged (#1967, 2026-11-05).
- [ ] Rollback guard live before the switch (replaces the native force-update):
      lca-api with #1971 (`isWeb3AuthLogin`) and #1972 (startup retry) deployed to
      production, and the app with #1971's client guard released on web and as the
      native OTA bundle. After that, reverting the switch cannot run Web3Auth
      against an SSS account; migrated accounts keep their Web3Auth login.
- [ ] In-app privacy notice shipped (auto-enrolment is silent; P-c).
- [x] Capacity measurement on staging (replaces the full load test; LC-2364
      plan in Confluence): run 1 on 2026-11-06, 41/41 enrolments, 0 errors, about
      1.4 s of lca-api time per enrolment. Full-scale load testing is deferred until
      growth calls for it; PIN-recovery measurement needs a catch-all inbox first.
- [x] Uptime monitoring: production `GET /api/health-check` and
      `GET /api/keys/escrow/attestation?nonce=…` (expects `"mode":"nitro"`) are
      monitored, alongside the paging escrow canary alarms.
- [x] Production alarm drill: denied-write and unexpected-write authority alarms
      fired and delivered (2026-11-05 ~17:10Z; LAUNCH-DECISIONS.md RAR condition).
- [ ] Production canary clean, including the first production tier 3 release
      (~2026-11-11).
- [x] `escrow-enclave-production-AuthorityRepeatedPinClear` (ALARM since
      2026-10-30) understood: the 2026-10-30 production pilot test on Jackson Smith's
      own account (`ACCOUNT#3ab64432…`, matched from his `did:key`; 13 authority
      writes 21:55–22:14Z). Threshold raised to 4 (#1965) on 2026-11-05; OK since
      16:55Z. Follow-up: deploy the account-count monitor build from #1965, set the
      threshold to 1, then to 0 after ~2026-11-29.
- [x] DMARC for `learncard.com`: `_dmarc` record published (`p=none`, aggregate
      reports to `dmarc@learningeconomy.io`); a login-code email on 2026-11-06 passed
      SPF, DKIM (`learncard.com`) and DMARC at Gmail. The earlier SES spam verdict
      on production login mail came with `dmarc=none` in both environments, so it may
      be sending-pool reputation rather than DMARC; production canary provisioning
      keeps `--allow-login-spam-fail` until a fresh production login mail scores PASS.
- [ ] lca-api production deploy current with `main`.

### Switch

1. Mark #1875 ready, get review, merge.
2. Dispatch the production frontend deploy (LearnCard and VetPass).
3. Verify `https://learncard.app/__tenant-config` (and VetPass's) serves
   `keyDerivation: "sss"`, `escrowEnclaveMode: "nitro"`, `escrowRolloutPercent: 100`,
   both PCR tuples and `escrowSealEmailBrand: true`. Check the served config, not the
   deploy run: queued deploys are replaced by later merges.
4. Sign in with a test account on each app; confirm enrolment and the PIN prompt.

### Watch (first 48 hours, then daily)

- Escrow alarms in the production escrow account (governance, authority writes,
  ledger monitor, NLB healthy hosts) and the go/no-go table below.
- Production canary tiers 1–3 (monitoring account) and the tier 3 dashboard.
- Enrolment rate (authority writes) against the RT forecast, and per-source
  Roughtime failures.
- lca-api escrow errors, including `EnclaveFailure` with
  `Reason=remote_config_missing`.

### Switch rollback

Reverting #1875 is **not** safe for every account, so treat it as a last resort:

- After a revert, current builds select the Web3Auth strategy again, and that
  strategy ignores the server's `keyProvider: sss` record: its
  `fetchServerKeyStatus` always returns `exists: true, primaryDid: null` and derives
  the key from Web3Auth (`packages/learn-card-base/src/key-derivation/createWeb3AuthStrategy.ts`,
  `fetchServerKeyStatus`). Nothing compares the result with the SSS DID.
- **Migrated accounts** (created on Web3Auth, upgraded at the switch) are unaffected:
  Web3Auth re-derives the same key, so they keep the same DID. Their escrow
  enrolments stay valid.
- **Accounts created on SSS after the switch** never had a Web3Auth key. After a
  revert, Web3Auth would derive a different key, so the user would silently land in
  a new, empty account under a different DID (their SSS record and credentials are
  untouched but unreachable until SSS is re-enabled).

Prefer a forward fix. If a revert is unavoidable, it first needs a coordinator guard
that refuses Web3Auth sign-in when the server record is `keyProvider: sss` (verified
in code above; not yet run as a staging revert check). Use the kill switch below only
for a suspected compromise of the release path.

## Stages (superseded 2026-10-31, kept as history)

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

**Archiver (no longer a stage gate).** R-AUTHORITY-ROLLBACK is accepted for all
stages (LAUNCH-DECISIONS.md RAR, amended 2026-10-31), conditional on authority
PITR, the authority write trail and alarms, and a production drill of the
denied-write and unexpected-write alarms before the switch.
[AUTHORITY-ARCHIVER.md](AUTHORITY-ARCHIVER.md), or a lighter tamper-evident
history, is post-launch hardening.

At every stage, require zero unexplained `AuthorityGovernance:unexpected_write`,
`AuthorityGovernance:denied_write` or `EscrowCloudTrailTamper` alerts. Planned
drills must have recorded outcomes. Confirm trail delivery and monitor SNS/DLQ
health; absence of alerts alone is not evidence of coverage.

Tied to the P7.1 `escrow-ledger-monitor` alarms
(`infra/escrow-enclave/monitor.tf`, dashboard `<prefix>-ledger-monitor`,
runbook `services/escrow-ledger-monitor/README.md`). Check CloudWatch (or
wait for the SNS alarm — an operator should be subscribed via
`monitor_alarm_email`) before every stage advance:

| Criterion                      | Alarm / metric                                                                                  | Threshold to ADVANCE                                                                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tamper detection               | `LedgerIntegrityFailure` (namespace `LearnCard/EscrowLedger`)                                   | `0` in the observation window (any nonzero value is a hard stop, not just a "watch it")                                                                                                                                                            |
| Audit consistency              | `AuditMismatch`                                                                                 | `0` — DynamoDB and the S3 Object Lock audit trail must agree                                                                                                                                                                                       |
| Release rate                   | `Released`                                                                                      | Under `monitor_released_hourly_threshold` (default 100/hr) at every hour in the window                                                                                                                                                             |
| PIN-failure rate               | `PinAttemptFailed`                                                                              | Under `monitor_pin_failed_hourly_threshold` (default 100/hr) at every hour in the window                                                                                                                                                           |
| Enclave / monitor availability | `<prefix>-monitor-sweep-missing` (heartbeat), `<prefix>-monitor-errors`, `<prefix>-monitor-dlq` | No heartbeat gaps, no Lambda errors, empty DLQ for the whole window                                                                                                                                                                                |
| KMS governance                 | `EscrowKmsGovernanceChange` (CloudTrail EventBridge rule)                                       | Zero unplanned firings (a firing tied to a reviewed, two-person-approved key-policy or alias change, such as a measurement rotation, is fine; anything else is a hard stop — treat as a security incident, not a rollout blocker to just wait out) |
| PrivateLink governance         | `EscrowPrivateLinkChange`, endpoint connection notifications                                    | Zero unplanned firings (a reviewed acceptance or principal change in the change record is fine; an unexpected connection or principal change is a hard stop)                                                                                       |
| Serving capacity               | `<prefix>-nlb-healthy-hosts`                                                                    | No ALARM outside a reviewed roll or replacement; production must hold the ASG minimum healthy                                                                                                                                                      |

**No-go:** if any hard-stop criterion above is breached, do not advance —
drop back to the previous stage's percent (see Rollback) and open an incident
before considering another advance.

## Rollback

For the 100% launch, see [Switch rollback](#switch-rollback). The steps below
describe lowering the percent, which is still how to stop **new** auto-enrolments.

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
- **VetPass shares LearnCard's enclave and accounts.** VetPass runs on the
  LearnCard enclave with `auth.sss.escrowAuthorityTenant: "learncard"`
  ([SECURITY.md](SECURITY.md) D20). A VetPass user and a LearnCard user with the
  same sign-in are one account: enrollment, PIN and opt-out are shared, and an
  account enrolled from either app is enrolled for both. Keep VetPass on the same
  key derivation, `escrowEnclaveMode` and enclave pins as LearnCard at every stage
  (enforced by `apps/learn-card-app/src/config/escrowTenantParity.test.ts`); an SSS
  client with escrow off can leave the shared escrow copy stale. VetPass staging and
  production deploy separately (#1942): VetPass staging runs SSS with escrow on the
  staging enclave (`escrowAuthorityTenant: "learncard"`, LearnCard staging's pins),
  while VetPass production and the `sss-pilot` overlay stay off until the SSS switch
  (#1875) turns them on together with LearnCard production; that PR must set VetPass's mode,
  pins and `escrowAuthorityTenant` in the same change. Update both
  tenants' pins on every image roll.
- **Sealed email brand (D21).** `auth.sss.escrowSealEmailBrand` makes the client
  seal the app's `branding.name` into the escrow blob so enclave-sent emails carry
  that brand. Keep it off until every live host (staging, then production) runs the
  brand-aware image, because an older image drops the field whenever it re-encrypts
  a blob. Status: staging has sealed since #1951 (2026-11-05, image `00a32cbc…`);
  production hosts run the brand-aware image since 2026-11-05, and #1875 turns sealing
  on with the switch. Turn it on for LearnCard and VetPass in one config PR, which also sets
  LearnCard's `auth.sss.escrowSharedEmailBrands: ["VetPass"]` (parity and the list are
  enforced by `escrowTenantParity.test.ts`). Existing blobs keep the LearnCard brand
  until their next enroll/replace, so the VetPass in-app note stays on, worded as
  "may come from VetPass or from LearnCard". A shared DID last written by VetPass
  sends VetPass-branded emails even when recovery starts in LearnCard, so LearnCard
  shows "If you also use VetPass with this account, your code may come from VetPass". Rolling back the image reverts sealed
  brands to "LearnCard"; it does not break recovery.
- Never put a raw DID or email in a PR, ticket, or this document — only the
  SHA-256 hash described above.
