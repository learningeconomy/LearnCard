# Escrow canary tier 3 (7-day recovery) and canary inbox: design

**Status:** implemented on branch `canary/tier3-hold`, **off by default**, not
deployed, applied or live-verified. Items marked **UNVERIFIED** need a staging
check (§11). Items marked **DECISION** record a choice a reviewer should confirm.

Spec: `services/escrow-enclave-app/CANARY.md` §4 (Tier 3), §5 (accounts, pool,
quarantine), §7 (canary inbox), §9 (metrics and alarms), §12 (phase 3), §13, §14.
Builds on the tier 1/2 runner (`README.md`) and `infra/escrow-canary`.

This revision applies every REQUIRED change from the design review (§13 maps each
one to code) and several optional ones.

## 0. Summary

| Topic          | Implementation                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Functions      | Two Lambdas from the existing ZIP: tier-3 **runner** and **deadline evaluator**, both `rate(15 minutes)`, concurrency 1, no retries, 60 s max event age.                                                                             |
| Ledger         | DynamoDB `escrow-canary-<env>-tier3`. Whole-item compare-and-swap on `version` (or create-if-absent) for every write; multi-item changes are transactions. No secrets.                                                               |
| Hold secrets   | `hold = {runId, holdId, resumeToken, clientEphemeralPrivateKey, expectations, requestedAt}` and `lastReleasedRunId` in that account's secret, written before any later I/O.                                                          |
| Inbox          | Shared account-scoped stack `infra/escrow-canary-inbox` owns the zone, SES identity and the single active rule set. Each environment owns only its 12 exact-recipient rules, bucket and key.                                         |
| Email trust    | The first `Authentication-Results` must be SES's and sit above every original header; `spf=pass`, `dmarc=pass` (configurable), DKIM pass in the configured domain **aligned with From**, allowlisted From, SES verdicts, `To` match. |
| Refusals       | Classified from a fresh `getEscrowRecoveryStatus`, because the SDK drops refusal bodies.                                                                                                                                             |
| Metrics        | Namespace `LearnCard/EscrowCanary`, alarm series `{Environment, Tier="3"}`; `Account=hold-NN`, `Kind`, `Step`, `Reason`, `Outcome` are diagnostic.                                                                                   |
| Off by default | `hold_account_ids = []`, `inbox_enabled = false`, `tier3_enabled = false`: no tier-3 or inbox resource exists (asserted by a Terraform test).                                                                                        |
| Bundle         | **Not** a no-op for production: the shared ZIP changes (strict tier parse, new dependencies), so the next production apply after a rebuild redeploys the live tier 1/2 functions. Run the bundle in staging first (README).          |
| api/ and app/  | No change. Only existing SDK calls, made the way the app makes them.                                                                                                                                                                 |

## 1. Components

| File                                           | Responsibility                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/handler.ts`                               | Strict `CANARY_TIER` parse (`1`/`2`/`3`, anything else never runs). Tiers 1/2 unchanged; tier 3 dispatch.                |
| `src/tier3/handler.ts`                         | Wires the runner (ledger, S3 inbox, secrets, SDK) or the evaluator (ledger only).                                        |
| `src/tier3/config.ts`                          | zod config for both roles; 12 distinct hold accounts; senders must sit inside the DKIM domain.                           |
| `src/tier3/ledger.ts`                          | Item schemas (strict; unknown items throw), DynamoDB and in-memory ledgers with identical CAS semantics.                 |
| `src/tier3/runner.ts`                          | Tick orchestration and run state machine.                                                                                |
| `src/tier3/evaluator.ts`                       | Pure `evaluate(items, now, poolSize)` and the emitting wrapper.                                                          |
| `src/tier3/inbox.ts`                           | S3 listing/reading with caps, minimal MIME parser, trust checks, templates, message selection.                           |
| `src/tier3/timing.ts`                          | Pure deadline rules.                                                                                                     |
| `src/tier3/admin.ts`, `scripts/tier3-admin.ts` | Operator CLI: `init-pool`, `ready`, `list`, `close-step`, `unquarantine`, `pause`, `resume`, `inject-overdue`, `replay`. |
| `src/tier3/test-fakes.ts`                      | Test-only synthetic escrow world (never imported by the handler; checked absent from the bundle).                        |

New dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`,
`@aws-sdk/client-s3`. **DECISION (Dep):** no `postal-mime`. The enclave sends one
plain-text UTF-8 part (`escrow-enclave-app/src/authority/aws.rs:588-593`), so a
minimal parser (headers, one `text/plain` part, 7bit/8bit/quoted-printable/base64,
RFC 2047 subjects) is smaller attack surface for sender-controlled input.

## 2. Ledger

Items (all carry `pk`, `sk`, `type`, `env`, `version`, `updatedAt`):

| pk / sk                                                           | Purpose                                                                                                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `META` / `META`                                                   | `enabledAt`, `paused`, `pausedAt?`. Written by the runner's first tick, never by `init-pool`.                                                                            |
| `POOL#hold-NN` / `POOL`                                           | `state` (`idle`, `busy`, `orphaned`, `cooling`, `quarantined`), `runId?`, `stateSince`, `lastReturnedAt`, `availableAt?`, `quarantineReason?`, `orphanCleanupAttempted`. |
| `SLOT#daily#YYYY-MM-DD` / `SLOT`, `SLOT#cancel#YYYY-Www` / `SLOT` | One daily start, one weekly cancel run.                                                                                                                                  |
| `RUN#<runId>` / `RUN`                                             | `kind`, `label`, `state`, timestamps, `codeObjectKey` (S3 key, never the code), `confirmRetried`, `releaseAfter`, `closeReason`, `expiresAt`.                            |
| `RUN#<runId>` / `STEP#<name>`                                     | `dueAt`, `observedAt?`, `outcome?` (`1`, `0`, `abandoned`, `operator_closed`), `reason?`.                                                                                |

`runId = <kind>-<slot>-<label>` is deterministic. A step item exists only once it
is expected (CANARY.md:163-170). Closed runs and steps get a 35-day TTL. The
ledger holds no tokens, keys, codes, emails, DIDs or configured account ids;
`holdId` alone authorizes nothing (`lca-api/src/routes/escrow.ts:1073-1092`).

Writes are whole-item `PutItem` with `attribute_not_exists(pk)` or
`version = :v` (multi-item: `TransactWriteItems`). A failed condition is
`LedgerConflictError`: another invocation owns the transition and the tick skips it.

## 3. Runner

### 3.1 Tick

1. Stale-event guard (±5 min), as tiers 1/2.
2. Read or create `META`. If paused, do nothing at all.
3. Read the 12 `POOL` items; fewer is a configuration error (`init-pool` is a
   precondition, checked by `tier3-admin ready`).
4. Advance every open run, in the order `releasing`, `warned`, `waiting`,
   `cancelling`, `confirming`, `awaiting_code`, `starting`. Each run is isolated:
   an error becomes a `Step.Failure` diagnostic and the tick continues.
5. At most one orphan cleanup.
6. At most **one** code-sending start: the daily start once `hour >= tier3_start_hour_utc`
   and the day's slot is unclaimed; otherwise the weekly cancel run (Mondays from
   start hour + 1).

Every refresh-token exchange persists a rotated token before any other I/O
(`runner.ts` `session`, matching `src/runner.ts:68-84`).

### 3.2 Start (`startRun`)

1. Select the idle (or cooled) account with the oldest `lastReturnedAt`.
2. One transaction: create SLOT and RUN (`starting`), POOL to `busy`, create steps
   `CodeEmail` (+5 min) and `Confirmed` (+10 min).
3. Refresh identity. Failure: `Started=0`, close, account `idle` (no call made).
4. Record `startCallAt`, then `startEscrowRecovery({token, providerType, expectedDid})`:
   no `restart`, no `releasePolicy`, exactly as the app
   (`learn-card-base/src/auth-coordinator/AuthCoordinatorProvider.tsx:518`).
5. `resumeToken === null` (an existing hold, `escrow.ts:840-845`) → `Started=0`
   `existing_hold`, `orphaned`. Missing expectations, or `expectations.did`/`holdId`
   not matching → `Started=0` `evidence`, `orphaned`.
6. Persist `hold` to the secret. Then `codeSent !== true` → `Started=0`
   `code_not_sent`, `orphaned`. Otherwise RUN → `awaiting_code`, `Started=1`.
7. Poll the inbox every 10 s for up to `TIER3_CODE_POLL_MS` (6 min).

### 3.3 Code and confirmation

- The first trusted code email at or after `startRequestedAt − 2 s` is used. Before
  confirming, RUN → `confirming` with `codeObjectKey`, `codeObservedAt` (S3
  `LastModified`) and `confirmCallStartedAt` **only if absent**; `CodeEmail` is
  observed at `LastModified`. `Tier3.EmailLatency` = `LastModified − startRequestedAt`.
- Each parsed code is submitted **once**. Any confirm error (including
  `codeMismatch`, `codeExpired`, `codeLocked`) → `Confirmed=0`, close, `orphaned`.
  The 5-guess budget (`escrow-enclave-app/src/authority/state.rs:258`) is never spent twice.
- Never confirm at or after `startRequestedAt + 30 min − 2 min`; the code then
  expires as `Confirmed=0` `codeExpired`, `orphaned`.
- Crash in `confirming`: re-read the same object and resubmit once
  (`confirmRetried` claimed first; the enclave's idempotent branch answers,
  `policy/authority.rs:1023-1034`). A second crash → `Confirmed=0` `interrupted`.
- After confirm: status must be `pending`, `confirmed === true`,
  `holdRecord.holdDurationMs === TIER3_HOLD_DURATION_MS`, and `releaseAfter` within
  `[confirmCallStartedAt + hold + 60 s − 120 s, confirmedAt + hold + 60 s + 120 s]`.
  Else `Confirmed=0` `deadline_mismatch`. Success: RUN → `waiting`, and for daily
  runs create `Warning` due `confirmedAt + 6 d + 2 h`.

### 3.4 Warning (daily runs)

From `confirmedAt + 6 d`, each tick looks for a trusted warning email after
`confirmedAt`. Its body is `about {hours} hours` (`authority/email.rs:150-152`);
the parser captures the number and the runner requires 24.

1. Record `warningObservedAt` (the email's `LastModified`), then read status.
2. The deadline must satisfy `releaseAfter ≥ confirmedAt − 120 s + hold + 60 s` and
   `≥ warningArrival + 24 h + 60 s − 10 min`. lca-api saves the recomputed value only
   after the enclave sends the warning (`jobs/escrowHoldReminders.ts:174-202`), so a
   failing check is **retried on later ticks** and only fails (`deadline_mismatch`)
   at `max(Warning dueAt, warningArrival + 2 h)`.
3. Once per run (`earlyRefusalCheckedAt` claimed first), call `executeRecovery`
   and require a refusal classified as the waiting period (§3.6). This proves only
   lca-api's refusal (`escrow.ts:1194-1199`), not the enclave's time gate.
    - Unexpected success: `Warned=0` `early_release`; the recovered device state is
      persisted; the account is `idle` if re-enrolment checks pass, else quarantined.
    - Any other refusal: `Warned=0`, `orphaned`.
    - If the runner is already within 2 min of `releaseAfter` (for example after a
      pause), the early check is skipped. A crash during the check gives
      `Warned=0` `interrupted` but the run still proceeds to release.
4. RUN → `warned` with `releaseAfter`; create `Released` and `Reenrolled` due
   `releaseAfter + 2 h`; `Warned=1`.

### 3.5 Release and re-enrolment

- From `releaseAfter + 120 s`: RUN → `releasing` **before** `executeRecovery`
  (escrow input from the secret, fresh in-memory storage, recovery contact options
  so the next start does not fail with Policy, `policy/authority.rs:499`).
- Refusal classified `waiting` or `retry` (412 with the hold still `pending`; lca-api
  reopens the claim, `escrow.ts:1320-1332`) before `Released.dueAt`: back to
  `warned`, diagnostic, retry next tick. Otherwise `Released=0`, quarantined.
- Success: recovered DID must equal the secret DID and re-derive independently
  (`sdk.did`). Mismatch → `Released=0` `did_mismatch`, quarantined.
- Persist new device state, remove `hold`, set `lastReleasedRunId`; then check
  `escrowEnrolled === true` and a fresh verified authority state (active, configured
  generation). One transaction closes the run, observes `Released` (and
  `Reenrolled` if ok) and returns the account to `idle` or quarantines it
  (`not_enrolled`). `Released=1`, `Reenrolled=1|0`.
- Crash in `releasing`: if `lastReleasedRunId === runId`, finish the ledger work and
  replay with `Outcome=duplicate`. Otherwise `Released=0` `release_interrupted`,
  quarantined. `executeRecovery` is never called again for that run.

### 3.6 Refusal classification

The SDK returns only `EscrowRequestError(status)` for `/complete`
(`packages/sss-key-manager/src/sss-strategy.ts:1150-1230`). After a 403 or 412 the
runner reads status:

| Error | Status                          | Class       |
| ----- | ------------------------------- | ----------- |
| 403   | `cancelled`                     | `cancelled` |
| 403   | `pending`, `now < releaseAfter` | `waiting`   |
| 412   | `pending`                       | `retry`     |
| other |                                 | failure     |

### 3.7 Weekly cancel run

After confirmation the cancel run creates `Cancelled` (+10 min), moves to
`cancelling`, calls `cancelEscrowRecovery` and requires `cancelled === true`, then
attempts completion and requires class `cancelled` (`verifyPendingHold` does not
check status, so the SDK reaches `/complete`). Success: `Cancelled=1`, hold removed
from the secret, account `cooling` for `tier3_cancel_cooldown_hours` (48). A
completion that succeeds or is refused for another reason → `Cancelled=0`
`cancel_not_refused`. Crash in `cancelling`: status `cancelled` → finish the
refusal check; otherwise `Cancelled=0` `interrupted`, `orphaned`.

### 3.8 Pool states and orphan cleanup

`orphaned`: a hold may be pending (start/confirm failures, lost start response,
expired code). After `TIER3_ORPHAN_CLEANUP_DELAY_MS` (24 h), once
(`orphanCleanupAttempted` claimed first): `cancelEscrowRecovery` via the user's DID
path (`escrow.ts:1094-1114`), clear `hold`, then `cooling` (a hold was cancelled) or
`idle`. Any failure → `quarantined` `cleanup_failed`.

**DECISION (B8): direct cancel adopted** instead of supersede-then-cancel: no
24 h restart gate, no code send from the 3-per-24 h budget, no second hold.
CANARY.md §5 wording was updated to match.

`quarantined` only clears through `tier3-admin unquarantine` after an owner-path
repair. A crash before the start call (`startCallAt` absent) closes the run with
the account `idle`. A `starting` run whose secret already holds `hold.runId`
advances to `awaiting_code` (`Started=1`, `Outcome=duplicate`).

### 3.9 Capacity

A daily run lasts about 7 d + 1–2 h, so up to 8 daily runs overlap, plus one
cooling account: minimum `PoolAvailable` ≈ 3 with 12 accounts. **DECISION (Pool):**
12 (spec).

## 4. Evaluator

`evaluate()` scans every item (strongly consistent, paginated) and throws on any
malformed or unknown item, a pool count other than 12, duplicate META or a step
without its run. Otherwise:

- `Overdue`: steps with `dueAt ≤ now`, no `observedAt` and no `outcome`.
- `PoolAvailable`: `idle` or `cooling`, and `availableAt` absent or past.
- `StartAgeMinutes`: from the newest run `startedAt`, or `META.enabledAt`.
- No META yet (before the runner's first tick): warm-up, `StartAge=0`.
- Paused: `Overdue=0`, `StartAge=0`, `Paused=1`.

The wrapper emits `Overdue`, `PoolAvailable`, `StartAgeMinutes`, `Paused`, then
`EvaluatorHeartbeat=1` **last**. On any error it emits nothing, so the heartbeat
alarm pages. The evaluator role cannot read secrets, S3, or write anything.

`resume` re-anchors `enabledAt` and moves open steps due within the next hour to
`now + 1 h`, so a pause cannot page on resume.

## 5. Inbox

### 5.1 Layout

One receipt rule per pool address with an exact recipient
`<local>+<n>@<domain>` and S3 prefix `inbox/hold-NN/`, so the prefix identifies the
recipient. Mail to any other address matches no rule. Staging's local part must end
in `-staging` (Terraform validation). 7-day lifecycle. The SES setup-notification
object name is skipped (UNVERIFIED).

### 5.2 Selection

List the account's prefix, keep objects with `LastModified ≥ requestTime − 2 s`,
newest first, at most 10 candidates, skip objects over 256 KiB (counted as
untrusted). Mail from non-allowlisted senders is skipped silently (Postmark mail,
the `RecoveryStarted` email is recognised and ignored, **DECISION (B6)**).
Enclave-looking mail that fails trust (including a second `From` claiming the
expected sender) counts as `email_untrusted` and never satisfies a step.

### 5.3 Trust (`isTrusted`, fail closed)

1. The SES block is every header above the first original header (`DKIM-Signature`,
   `From`, `To`, `Subject`, `Message-ID`, `Date`, `MIME-Version`) or non-SES
   `Received`. The **first** `Authentication-Results` in the message must be inside
   it, and the block must contain exactly one. Authserv-id `amazonses.com`.
   **UNVERIFIED:** SES's header order; capture a redacted real message in staging
   before production.
2. `spf=pass`; `dmarc=pass` unless `inbox_require_dmarc=false` (the escrow stack
   publishes DMARC only with `create_sending_zone`, `infra/escrow-enclave/email.tf:54-81`).
3. A `dkim=pass` whose `header.d` (or `header.i` domain) is the configured DKIM
   domain or a subdomain **and** aligned (relaxed) with the From domain.
4. Exactly one `From` header with one address, in `inbox_expected_senders`.
5. `X-SES-Spam-Verdict` and `X-SES-Virus-Verdict` exactly `PASS` in the SES block.
6. `To` contains the account's `recoveryEmail`.

Senders and DKIM domain are Terraform inputs copied from the escrow output
`enclave_email_configuration` (`ESCROW_EMAIL_FROM`, `ESCROW_EMAIL_IDENTITY`;
`infra/escrow-enclave/authority-outputs.tf:14-22`, built as
`recovery@${sending_domain}` in `infra/escrow-enclave/email.tf:3-4`).

### 5.4 Templates (English)

| Kind    | Subject                                         | Body first line                                                                                      |
| ------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Code    | `^Your (.{1,64}) recovery code$`                | `^Your (.{1,64}) recovery code is: ([0-9]{8})$`, same brand, exactly one 8-digit run                 |
| Warning | `^Your (.{1,64}) recovery completes soon$`      | `^Your (.{1,64}) account recovery will complete in about ([0-9]{1,3}) hours unless you cancel it\.$` |
| Started | `^Your (.{1,64}) account recovery has started$` | ignored                                                                                              |

Hold accounts must have `recoveryLanguage = en` and a `recoveryEmail` on the inbox
domain; the runner refuses other secrets.

## 6. Metrics

| Metric                                                                              | When                                                                                     |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Tier3.Started` 0/1                                                                 | Start returned or failed (`existing_hold`, `evidence`, `code_not_sent`, `start_lost`, …) |
| `Tier3.Confirmed` 0/1                                                               | Confirm and status window checked                                                        |
| `Tier3.Warned` 0/1                                                                  | Trusted warning, sane deadline, early refusal                                            |
| `Tier3.Released` 0/1                                                                | Release and DID checks                                                                   |
| `Tier3.Reenrolled` 0/1                                                              | `escrowEnrolled === true` and verified active authority state                            |
| `Tier3.Cancelled` 0/1                                                               | Cancelled and completion refused as cancelled                                            |
| `Tier3.EmailLatency` ms                                                             | Code email, `Kind=code` (rolled up to `{Environment, Tier, Kind}`)                       |
| `Runner.AuthFailure`                                                                | Tier 3 refresh outcome                                                                   |
| `Tier3.Overdue`, `PoolAvailable`, `StartAgeMinutes`, `Paused`, `EvaluatorHeartbeat` | Evaluator, every 15 min                                                                  |

New allowlisted reasons: `email_untrusted`, `email_missing`, `early_release`,
`start_lost`, `release_interrupted`, `cleanup_failed`, `cancel_not_refused`,
`did_mismatch`, `not_enrolled`, `deadline_mismatch`, `code_not_sent`,
`existing_hold`, `interrupted`, `evidence`. Codes, tokens, keys, emails, DIDs and
hold ids never reach output (leak-checked in tests).

## 7. Alarms

Breaching-missing alarms use periods of at least twice the 15-minute emission
interval, or N-of-N, so a late invocation cannot page alone.

| Alarm              | Rule                                                        | Missing      | Route  |
| ------------------ | ----------------------------------------------------------- | ------------ | ------ |
| overdue            | Overdue Max > 0, 1 × 900 s                                  | notBreaching | page   |
| evaluator-silent   | Heartbeat SampleCount < 1, 3 of 3 × 900 s                   | breaching    | page   |
| `<step>`-failed ×6 | Min < 1, 1 × 300 s                                          | notBreaching | page   |
| start-silent       | StartAgeMinutes Max > 1560, 2 of 2 × 1800 s                 | breaching    | page   |
| runner-auth        | Runner.AuthFailure (Tier 3) Max > 0, 1 × 900 s              | notBreaching | page   |
| pool-low           | PoolAvailable Min < 2, 2 of 2 × 1800 s                      | breaching    | ticket |
| email-slow         | EmailLatency (Kind=code) Max > `tier3_email_slow_ms`, 900 s | ignore       | ticket |

Actions require `alarm_actions_enabled && tier3_enabled`. Tickets use the new
`${name}-tickets` topic. A separate `${name}-tier3` dashboard keeps the tier 1/2
dashboard (and its Logs Insights query, `monitoring.tf:84`) unchanged.

## 8. Terraform

### 8.1 Shared stack: `infra/escrow-canary-inbox`

Only one receipt rule set can be active per account and region, and both
environments' states live in the same monitoring account. This root (its own
state key, `backend.hcl.example`) owns the Route 53 zone (MX to
`inbound-smtp.<region>.amazonaws.com`, `v=spf1 -all`, `_dmarc p=reject`), the SES
domain identity (verification gated by `delegation_complete`), the rule set and the
active rule set (both `prevent_destroy`). It has no rules and no buckets.
**DECISION (B16):** one domain, `-staging` local part for staging, state in the
production state bucket.

### 8.2 Per environment: `infra/escrow-canary`

- `tier3.tf` (gated by `hold_account_ids`): 12 hold secrets (`{}` placeholder,
  `ignore_changes`), ledger (PITR, TTL `expiresAt`, deletion protection in
  production), log groups, roles, Lambdas (runner 840 s/1024 MB, evaluator
  60 s/256 MB), invoke configs, schedules (`ENABLED` only if `enabled && tier3_enabled`).
- `tier3-monitoring.tf`: ticket topic, alarms, dashboard.
- `inbox.tf` (gated by `inbox_enabled`): KMS key (rotation; SES allowed with
  `aws:SourceAccount` and `aws:SourceArn` = this environment's rule names; account
  root delegation for IAM), bucket (public access block, `BucketOwnerEnforced`,
  SSE-KMS with bucket key, 7-day expiry, TLS-only policy, SES `PutObject` on
  `inbox/*` with the same conditions), and 12 `aws_ses_receipt_rule` with
  `tls_policy=Require`, `scan_enabled`, no `kms_key_arn`, a precondition that the
  shared set is active, and `ignore_changes = [after]` so the two environments
  never reorder each other's rules (UNVERIFIED: provider read-back of `after`).
- `local.tiers` and every tier 1/2 address are unchanged.

### 8.3 IAM

Runner: Get/Put on exactly the 12 hold secrets; KMS via Secrets Manager with that
encryption context; own logs; namespaced metrics; DynamoDB `GetItem`,
`BatchGetItem`, `Query`, `PutItem`, `ConditionCheckItem` (no `Scan`, no
`DeleteItem`); `s3:ListBucket` with prefix `inbox/*`, `s3:GetObject` on `inbox/*`,
KMS decrypt via S3. Evaluator: `Scan`/`Query`/`GetItem` on the ledger, logs,
metrics. Tier 1/2 roles unchanged. No escrow-account grants.

## 9. Configuration

Lambda environment (runner): base tier 1/2 variables plus `CANARY_ROLE`,
`CANARY_HOLD_ACCOUNTS_JSON`, `TIER3_LEDGER_TABLE`, `TIER3_POOL_SIZE`,
`TIER3_START_HOUR_UTC`, `TIER3_HOLD_DURATION_MS`, `TIER3_CANCEL_COOLDOWN_HOURS`,
`INBOX_BUCKET`, `INBOX_PREFIX`, `INBOX_DOMAIN`, `INBOX_EXPECTED_SENDERS_JSON`,
`INBOX_EXPECTED_DKIM_DOMAIN`, `INBOX_REQUIRE_DMARC`. Optional:
`TIER3_ORPHAN_CLEANUP_DELAY_MS`, `TIER3_CODE_POLL_MS`. Evaluator: environment,
table and pool size only.

Terraform variables (defaults off): `hold_account_ids` (0 or 12, distinct, disjoint
from `account_ids`), `tier3_enabled` (requires inbox and 12 ids), `inbox_enabled`
(requires 12 ids and all `inbox_*`), `inbox_domain`, `inbox_local_part` (staging
must end `-staging`, production must not), `inbox_rule_set_name`,
`inbox_expected_senders` (≤ 3, inside the DKIM domain),
`inbox_expected_dkim_domain`, `inbox_require_dmarc`, `tier3_start_hour_utc` (0–22),
`tier3_hold_duration_ms`, `tier3_cancel_cooldown_hours`, `tier3_email_slow_ms`,
`ticket_email`.

## 10. Operator steps

See `README.md` "Tier 3 operator steps" and "Tier 3 staging drills".

## 11. UNVERIFIED (staging checks before production)

1. SES stored-message header order and `Authentication-Results` format/position,
   DKIM `header.i`/`header.d` (replace the synthetic fixtures with a redacted capture).
2. SES setup-notification object name/location.
3. SES writing through the customer-managed key (fallback `AES256`).
4. Receiving without SES production access in the monitoring account; staging
   escrow SES sandbox sending to the inbox domain.
5. Plus-address exact matching (`+1` vs `+10`).
6. Rules-per-rule-set quota with 24 rules.
7. Whether an unconfirmed enclave cancel blocks new starts and for how long
   (`models/EscrowHold.ts:265-275`); 48 h cooldown is a guess.
8. Provider read-back of `aws_ses_receipt_rule.after`: apply production, apply
   staging, plan production → no changes.
9. Tiers 1/2 on the new bundle in staging before any production apply.

## 12. Deferred

Alarm on secret access outside the schedule; paging destination (CANARY.md §14
item 4); lca-api Postmark mail assertions; proving the enclave's own time gate;
Keycloak tenants and non-English templates; CI wiring; phases 4–5; a production
`tfvars` example (the staging example shows the tier-3 block).

## 13. Review changes applied

| Review item (REQUIRED)                      | Where                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1 Refusal reasons from status, not the SDK  | `runner.ts` `classifyRefusal`; tests for waiting, cancelled, 412 retry              |
| 2 Null resume token / expectations / DID    | `startRun`; `existing_hold`, `evidence`; `expectedDid` always passed                |
| 3 Code budget                               | One submit per code, close on any confirm error, TTL cut-off, single crash resubmit |
| 4 `confirmCallStartedAt` only if absent     | `awaitCode`; test "keeps the first confirm-call time"                               |
| 5 Deadline race                             | `deadlineSane` retried until `warningDeadlineExpired`                               |
| 6 Warning hours variable                    | `parseTemplate` captures hours; runner requires 24                                  |
| 7 Warm-up, `init-pool`, pause               | Evaluator warm-up, `tier3-admin ready`, `pause`/`resume`                            |
| 8 Jitter-tolerant breaching alarms; periods | §7                                                                                  |
| 9 Persist rotated refresh token immediately | `session`                                                                           |
| 10 Bundle is not a production no-op         | §0, README bundle note, handler tests for tiers 1/2                                 |
| 11 Missing reconciliation cases             | `handleStarting`, `startCallAt`, 412 retry in `handleWarned`                        |
| 12 Header position, DKIM alignment, caps    | `isTrusted`, `MAX_MESSAGE_BYTES`, `MAX_CANDIDATES`                                  |
| 13 Receipt-rule ordering churn              | `ignore_changes = [after]` plus staging check 8                                     |

Optional items taken: direct cancel for cleanup (1), independent DID re-derivation
and authority check after re-enrolment (2), `cancelled === true` (3), KMS root
delegation and no bucket-policy reference to the runner role (4), production
refusal for `inject-overdue` in code (5), `CodeEmail` observed at S3
`LastModified` (6), optional DMARC (7), explicit `Kind` rollup (8). Not taken:
gating cooling on a start check (9); the fixed cooldown stays UNVERIFIED.

## 14. Tests

- `src/tier3/runner.test.ts`: fake clock over 9 days (scenarios a and b, full
  daily path, weekly cancel), scenario c (suppressed warning pages on the first
  evaluation after `confirm + 6 d + 2 h`), scenario d (runner alone emits no
  heartbeat), deadline lag and mismatch, early release, waiting/412 retries,
  quarantines, start failures, orphan cleanup, code expiry and mismatch,
  untrusted mail, email latency, refresh rotation ordering, LRU/cooling, empty
  pool, pause, stale event, concurrent claims, every crash boundary, leak checks.
- `src/tier3/evaluator.test.ts`: scenario e (unreadable or malformed ledger emits
  nothing), counting rules, start age, pool count, heartbeat last, pause/resume,
  overdue drill.
- `src/tier3/inbox.test.ts`, `ledger.test.ts`, `config.test.ts`, `handler.test.ts`,
  and tier-3 rollups in `src/boundaries.test.ts`.
- `infra/escrow-canary/tests/canary.tftest.hcl`: defaults create nothing,
  off-by-default, the tier-3 contract, isolation guards (inactive rule set,
  staging suffix, overlap, tier 3 without inbox, sender domain) and a static check
  that no environment file declares a rule set or active rule set.
- `infra/escrow-canary-inbox/tests/inbox.tftest.hcl`.
- `bun run build` includes an offline tier-3 smoke.
