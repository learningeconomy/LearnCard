# Escrow canary — staging first

Implements tiers 1–3 of [CANARY.md](../escrow-enclave-app/CANARY.md). Tier 3 and
the canary inbox are implemented but **off by default and not deployed**; see
[Tier 3](#tier-3-7-day-recovery-and-canary-inbox) and [TIER3-DESIGN.md](TIER3-DESIGN.md). No AWS
resources or canary accounts are created by building or testing this package.
Deployment is **operator-only**, to a dedicated monitoring **member** account,
never the escrow or Organizations management account. Production activation is
not implied by passing offline tests.

## What runs

- **Tier 1**, every minute: refresh Firebase identity, derive the known DID,
  fetch the real REST `GET /keys/escrow/attestation?nonce=<32 fresh random bytes as hex>`,
  call `verifyEnclaveAttestation` with the AWS-default root and full PCR tuples,
  and check the configured key ID. Use the SDK's fresh DID challenge/VP helper to
  call `POST /keys/escrow/authority-state`, then `verifyEscrowAuthorityState` for
  the nonce, attested ledger key, measurement, tenant and DID. Require active
  enrollment and the configured authority generation. **Both steps exist**;
  no not-implemented metric or new API route is needed. `/v1/hold-state` is a
  host protocol endpoint, not the appropriate read-only enrollment probe.
- **Tier 2**, every 30 minutes: select PIN A/B by the scheduled UTC half-hour
  slot modulo two. Both accounts run once per hour. Start with empty memory
  storage and call `executeRecovery({ input: { method: 'escrow-pin', ... } })`.
  The SDK creates/verifies a fresh PIN hold, releases and reconstructs the key,
  then calls `completeIdentityRecovery` for authenticated atomic rebind/rotation.
  Independently derive the recovered DID. Save device state **before** calling
  `setEscrowPin`, and save again afterward because setting a PIN also rotates shares.
- The first run for each account in each UTC Monday-based week prepends one
  incorrect PIN. Only `EscrowPinMismatchError` with nine attempts left is accepted;
  transport errors and accidental acceptance fail. The next SDK recovery call
  creates a new hold (never retry `/complete`). A durable weekly claim prevents
  crashes from repeatedly spending guesses. A crash may skip that week's variant;
  it must not turn into repeated guessing.

### Crash safety, retries and limits

Each tier has its own Lambda and reserved concurrency **1**. EventBridge and Lambda
automatic retries are disabled. The event's `time` is required, must be within five
minutes of execution, and chooses the account deterministically. Tier 2 stores a
slot claim and `needsPinReset=true` before mutations. Duplicate/older claimed slots
skip mutations and replay a terminal metric: only an exactly matching slot with
`needsPinReset=false` is successful; an interrupted/unknown claim remains failed.
The metric has `Outcome=duplicate` and the original event timestamp, so it cannot
fill a later period. Minimum aggregation preserves any real failure in the same
period. No auth result is invented for a skipped exchange. Only these functions may write their
secrets; **do not manually invoke while schedules are enabled** or run another
deployment against the same accounts. Secrets Manager is not a compare-and-swap lock.

A signed state with no PIN, or an interrupted-run marker, causes the next slot to
call the normal `setEscrowPin` using the stored known seed **before** recovery.
This repairs a crash after remote rotation but before the new device state was
saved, without depending on stale local shares. It is an owner-authorized repair,
not a canary bypass. The marker clears only after successful recovery, reset and
secret persistence. The seed is never substituted for the returned recovered key.
Disabled/empty authority state is a failure, not an automatic opt-in.

Writes are batched (normally three per account per hourly run: claim/rotated token,
recovered device state, reset device state). Do not checkpoint each SDK storage
callback: Secrets Manager retains recent versions for 24 hours and has version
quotas. Repeated crash repair adds writes; monitor quotas if an account remains
broken. Tier 1 writes only when Google actually changes its refresh token. If
Google rotates it every minute, arrange a quota/storage design review before
continuous use; never drop rotated tokens. Token rotation cannot be transactional
with Google; a crash between exchange and persistence can require operator sign-in.

Memory storage implements all seven `SSSStorageFunctions`, preserving arbitrary
SDK storage IDs, versions and pending candidates. It never accesses IndexedDB.
Node 22 provides WebCrypto, `fetch`, `atob`/`btoa`; the PIN path uses no passkey or
browser UI. The ZIP bundles JS and DIDKit WASM, not the native addon or a CDN URL.
`bun run build` includes an offline **Node** smoke for DID/VP signing and SSS
split/reconstruction with fetch forbidden. That does not prove real Nitro,
Firebase, API rate limits, Lambda arm64 execution, or recovery against staging.
The SDK's best-effort automatic post-rebind escrow enrollment does not receive a
recovery contact on this path; the explicit final `setEscrowPin` supplies the
verified recovery email/language and must succeed before the canary is green.

## Configuration and secrets

Environment variables (all non-secret deployment configuration):

| Variable                   | Value                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `CANARY_ENVIRONMENT`       | `staging` initially; `production` only after separate approval                                                       |
| `CANARY_TIER`              | `1`, `2` or `3`, set by Terraform per Lambda; authoritative even if an event is malformed (anything else never runs) |
| `LCA_API_URL`              | Staging **REST base**, including `/api` when applicable; not `/trpc`                                                 |
| `TENANT_ID`                | Registered staging tenant; sent as `X-Tenant-Id`, just like the app                                                  |
| `FIREBASE_API_KEY`         | That tenant's Firebase web API key (public identifier, not Admin credentials)                                        |
| `ESCROW_KEY_ID`            | Reviewed current logical escrow key ID                                                                               |
| `AUTHORITY_GENERATION`     | Reviewed measured authority generation                                                                               |
| `ESCROW_MEASUREMENTS_JSON` | Array of complete `{pcr0,pcr1,pcr2}` tuples copied from resolved staging `auth.sss.escrowEnclaveMeasurements`        |
| `CANARY_ACCOUNTS_JSON`     | Exactly three `{id,secretArn}` objects, ordered read-only, PIN A, PIN B                                              |

Tier 3 adds `CANARY_ROLE` (`runner`/`evaluator`), `CANARY_HOLD_ACCOUNTS_JSON`
(12 ids; secrets are addressed by name `TIER3_HOLD_SECRET_PREFIX` + id),
`TIER3_*` (ledger table, pool size, start hour, hold duration, cancel cooldown)
and `INBOX_*` (bucket, prefix, domain, local part, expected senders, DKIM domain,
DMARC requirement); see [TIER3-DESIGN.md](TIER3-DESIGN.md) §9.
The evaluator receives only the environment, ledger table and pool size.

The explicit tenant header takes priority over Origin/Referer in lca-api; a domain
header is not required. Trust pins are never downloaded from the probed server.
There is no configurable root override or software-mode fallback.

Each secret is a JSON object with this shape (illustrative placeholders only):

```json
{
    "accountId": "pin-a",
    "privateKey": "<64 hex character Ed25519 seed from this account>",
    "did": "did:key:<known account DID>",
    "pin": "<enrolled 6–12 digit nontrivial PIN>",
    "refreshToken": "<Firebase refresh token from normal sign-in>",
    "recoveryEmail": "<verified canary recovery email>",
    "recoveryLanguage": "en",
    "deviceState": { "shares": {}, "versions": {} }
}
```

`accountId` is an opaque operator label, **not** a Firebase UID or email. The runner
checks it against configuration, verifies the seed-derived DID, and lca-api verifies
the provider identity/DID binding. Tier 1 uses the same secret schema; its unused
PIN can be a random valid placeholder, not enrolled. Device state may start empty:
the probe deliberately does not depend on an operator-exported IndexedDB encryption
key. Runner-only optional fields `lastSlot`, `wrongPinWeek`, `needsPinReset` must
not be manually reset to force retries.

## Staging operator setup (not performed by this change)

1. Create a separate monitoring member account through the organization's normal
   security process. Establish MFA-protected deployment access, restricted break-glass
   secret access, an independently controlled CloudTrail trail, and an encrypted,
   versioned Terraform state bucket with locking **in that account**. Confirm it
   differs from both escrow and management accounts. There are no cross-account
   roles, vault tokens, host access, SES or DynamoDB grants in this stack.
2. Verify the staging app resolves to SSS + Nitro and the correct staging Firebase
   project/API. Finish the existing escrow staging prerequisites first. Choose three
   addresses you control for the read-only, PIN A and PIN B accounts, e.g. the
   placeholder pattern `jackson+canary<n>@learningeconomy.io` with `<n>` replaced
   locally. Do not add these addresses or actual account identifiers to tracked
   files. **Nobody signs in to the app with a canary address**: a key the app
   creates for it is unknown to the canary secret and blocks provisioning (exit 3).
3. Accounts are created in step 6 by the provisioning tool
   ([PROVISIONING.md](PROVISIONING.md)), through the normal user path: email-code
   login, a new SSS key, then escrow opt-in or PIN setup. The tool never holds a
   Firebase Admin credential; it exchanges the custom token lca-api returns to
   every email-code login, exactly as the app does. Never paste secrets in shell
   arguments, tickets, PRs, Terraform inputs, logs or screenshots.
4. From the repo root, install dependencies and build the workspace SDK dependencies:

    ```sh
    bun install --frozen-lockfile
    NX_DAEMON=false bunx nx run-many -t build -p init sss-key-manager --parallel=3
    bun run --cwd services/escrow-canary build
    ```

    Inspect the ZIP, retain its hash/build commit in the operator record. Use Node 22
    for the smoke and Lambda. Copy `staging.tfvars.example` to an ignored local
    `staging.tfvars`; replace placeholders using reviewed staging values. Copy the
    backend template to a local file and set the monitoring state bucket.

5. **Operator only**, with monitoring credentials and schedules/actions still false:

    ```sh
    terraform -chdir=infra/escrow-canary init -backend-config=backend-staging.hcl
    terraform -chdir=infra/escrow-canary apply -var-file=staging.tfvars
    terraform -chdir=infra/escrow-canary output secret_arns
    ```

    Terraform creates three KMS-encrypted secrets with **only `{}` placeholders**;
    real values are out-of-band and `ignore_changes` prevents reconciliation of
    secret values/stages. Do not import current real secret versions into Terraform.

6. **Provision** each account from an operator SSO session in the monitoring
   account, with Node 22 and the built bundle (it loads `didkit.wasm` from `dist/`).
   Dry-run first; it reads Secrets Manager only and sends nothing:

    ```sh
    node services/escrow-canary/dist/provision.mjs --environment staging \
      --expect-account <monitoring account id> --tier 1 --account read-only \
      --email <read-only address> --dry-run
    # then without --dry-run; repeat with --tier 2 --account pin-a / pin-b
    ```

    The tool sends a login code (type it at the hidden prompt), creates the key,
    writes the secret to a `PROVISIONING`-labelled version **before** any server
    change, enrolls escrow (tier 2: sets a random PIN and activates, as the app
    does), runs the runner's checks and only then promotes the version to
    `AWSCURRENT` with a compare-and-swap. It prints only labels, secret names,
    version ids, `did:key`s and step results. Re-running resumes safely from the
    staged version (exit 1 = re-run; 2 = refused, nothing changed; 3 = needs a
    human). See [PROVISIONING.md](PROVISIONING.md) for the guards and resume rules.

    **Manual fallback** (only if the tool cannot be used): sign each account in
    on an isolated workstation with tracing, recording and shell history off; read
    the seed from the app's authorized key-export tooling and the Firebase
    `User.refreshToken` from that session (never a whole storage dump); cross-check
    the `did:key`; then paste the JSON above in the Secrets Manager console's
    plaintext editor (never CLI `--secret-string`, never a file on a persistent
    disk), clear the clipboard and revoke temporary grants.

7. Confirm the SNS email subscription. With schedules still disabled, invoke tier 1
   with `{"tier":1,"time":"<current UTC ISO timestamp>"}` and tier 2 similarly.
   Supply current timestamps, never replay old events. To exercise both PIN accounts,
   run in adjacent half-hour slots (or enable the schedule and observe both), not
   concurrent manual calls. Require success metrics, authority checks, persisted
   state and the PIN reset. Inspect **sanitized** step metrics only.
8. Enable `enabled=true` and apply. Observe tier 1 every minute and both tier 2
   accounts for at least two half-hour runs. Then enable `alarm_actions_enabled=true`
   and apply. Do not silently reuse this configuration for production.

### Alarm drills and incident handling

- Namespace `LearnCard/EscrowCanary`; base dimensions `Tier="1"|"2"` and
  `Environment="staging"`. Tier 2 adds `Account="pin-a"|"pin-b"`: fixed positional
  labels, never actual account identifiers. Success/auth metrics explicitly roll
  up to the account alarm series and tier dashboard series; `Reason`/`Outcome`
  diagnostics never fragment those alarm series. `Step.Latency` adds `Step`; `Step.Failure` adds `Step`
  and allowlisted `Reason`. Logging projects only those fields: no error bodies,
  IDs, email addresses, tokens, private keys, PINs or device shares.
- Tier 1: Minimum Success < 1, 2 of 3 × 60s. Tier 2: **per-account** 2 of 2 ×
  3600s, matching each account's hourly cadence. Success alarms retain
  missing=breaching; a healthy alternating account cannot clear a broken account.
  Every handled failure emits Success=0, including configuration/initialization,
  secret reads/validation, stale events and auth (allowlisted `Reason` values
  `config`, `secret_read`, `stale_event`, `auth`). Hard process termination/timeouts
  cannot execute finally blocks and remain covered by missing-data alarms.
  `Runner.AuthFailure` emits zero after successful exchange, one for credential
  rejection (HTTP 400/401/403), with independent per-account alarms at the same
  cadence using Maximum and **missing=notBreaching**. Network/timeout, malformed
  JSON/schema, rate limiting and upstream 5xx failures fail the tier, not auth.
  A separate SampleCount alarm detects five missing tier-1 periods. The 30-day
  dashboard shows observed result ratios (including replayed duplicate outcomes);
  silence is **not** counted as uptime.
- In staging, temporarily replace a PCR with a syntactically valid incorrect pin
  and verify failure + notification, then restore. Disable the tier-1 schedule
  and confirm missing-data alarms, then restore. Revoke only one canary Firebase
  refresh token and observe two hourly runs of that account: its success/auth
  alarms must fire while the other PIN account stays healthy. Simulate a secret
  read/config failure and confirm only success alarms fire, not auth. Replay a
  completed current slot with schedules disabled and confirm a duplicate datapoint
  without another recovery; replay an interrupted claim and confirm it stays red.
  After the drill sign in normally again and replace its refresh token.
  Do not publish fake green metrics to clear alarms; require real successful runs.
- To rotate credentials, disable schedules and wait for executions to finish,
  sign in the affected account normally, update **only** that account's refresh
  token while preserving device state/markers, then re-enable and observe. Never
  restore an old secret version wholesale: it can undo slot/weekly markers and
  resurrect obsolete device state. If a PIN becomes locked or authority is disabled,
  pause that tier and repair through the ordinary owner/app flow; never edit escrow
  tables, shorten waits or reset enclave counters.
- Review monitoring-account CloudTrail for secret access outside the scheduled
  runner roles. Automated off-schedule secret-access detection is not provisioned
  here; security operations owns the independent trail and alert policy.

## Tier 3: 7-day recovery and canary inbox

Design and rationale: [TIER3-DESIGN.md](TIER3-DESIGN.md). Summary:

- Two more Lambdas from the **same ZIP**: `escrow-canary-<env>-tier3-runner` and
  `-tier3-evaluator`, both `rate(15 minutes)`, reserved concurrency 1, no retries.
  The runner makes at most one daily start (from `tier3_start_hour_utc`, default
  15:00 UTC) and one weekly cancel run (Mondays, one hour later), never two
  code-sending calls in one tick. The evaluator only reads the ledger.
- A DynamoDB run ledger (`escrow-canary-<env>-tier3`) records every expected step
  and its due time. It holds no secrets. Every transition is a compare-and-swap
  claimed **before** its side effect; `executeRecovery`, `confirmEscrowRecovery`
  and start are never repeated blindly after a crash.
- Resume material (`resumeToken`, ephemeral key, expectations) lives only in that
  hold account's secret (`hold`), written before any later I/O. Runner-only fields
  `hold` and `lastReleasedRunId` must **never** be edited by hand.
- The user path only: `startEscrowRecovery` (no restart, no release policy, with
  `expectedDid`), `confirmEscrowRecovery`, `getEscrowRecoveryStatus`,
  `executeRecovery` (escrow input, recovery contact options) and the
  DID-authenticated `cancelEscrowRecovery`. No `api/` or `app/` change.
- The SDK drops refusal bodies, so a refused completion is classified from a
  fresh status read: `pending` and before `releaseAfter` = waiting period;
  `cancelled` = refused as cancelled; a 412 with the hold still `pending` =
  retryable enclave Unavailable/Time refusal until the Released deadline.

### Canary inbox

`infra/escrow-canary-inbox` (account-scoped, its own state) owns the inbox
zone, the SES domain identity and the account's **single active receipt rule
set** (`prevent_destroy`). Each environment's `infra/escrow-canary` adds only its
own 12 rules (`<local>+<n>@<domain>`, exact recipients, `inbox/hold-NN/` prefix),
its bucket (SSE-KMS, 7-day expiry, TLS-only) and key. Staging's local part must end
in `-staging`, so the two environments never match each other's mail. Each rule
has a precondition that the shared set is active.

The runner reads only its environment's prefix. It accepts a message only if the
first `Authentication-Results` is SES's own (above any original header),
`spf=pass`, `dmarc=pass` (unless `inbox_require_dmarc=false`), a `dkim=pass` in
`inbox_expected_dkim_domain` **aligned with the From domain**, exactly one `From`
in `inbox_expected_senders`, SES spam/virus `PASS`, and `To` = the account's
recovery email. Mail from other senders is ignored; enclave-looking mail that
fails is a `Step.Failure` diagnostic (`email_untrusted`) and never satisfies a
step. Objects over 256 KiB and more than 10 candidates per poll are not read. The
code is never logged, persisted or used twice.

### Metrics and alarms (tier 3)

Alarm series: `{Environment, Tier="3"}`. `Account=hold-NN` and `Kind` are
diagnostic only (`Tier3.EmailLatency` also rolls up by `Kind`).

| Alarm                      | Rule                                                                      | Missing      | Route  |
| -------------------------- | ------------------------------------------------------------------------- | ------------ | ------ |
| `tier3-overdue`            | `Tier3.Overdue` Max > 0, 1 × 900 s                                        | notBreaching | page   |
| `tier3-evaluator-silent`   | `Tier3.EvaluatorHeartbeat` SampleCount < 1, 3 × 900 s                     | breaching    | page   |
| `tier3-<step>-failed` (×6) | Started/Confirmed/Warned/Released/Reenrolled/Cancelled Min < 1, 1 × 300 s | notBreaching | page   |
| `tier3-start-silent`       | `Tier3.StartAgeMinutes` Max > 1560 (26 h), 2 of 2 × 1800 s                | breaching    | page   |
| `tier3-runner-auth`        | `Runner.AuthFailure` (Tier 3) Max > 0, 1 × 900 s                          | notBreaching | page   |
| `tier3-pool-low`           | `Tier3.PoolAvailable` Min < 2, 2 of 2 × 1800 s                            | breaching    | ticket |
| `tier3-email-slow`         | `Tier3.EmailLatency` (Kind=code) Max > `tier3_email_slow_ms`              | ignore       | ticket |

Tickets go to the new `${name}-tickets` topic (`ticket_email`, default
`alarm_email`). Tier-3 alarm actions require both `alarm_actions_enabled` and
`tier3_enabled`. A separate `${name}-tier3` dashboard leaves the tier 1/2 one
untouched.

### Tier 3 operator steps (not performed by this change)

> **Bundle note.** Tiers 1–3 share one ZIP. This change alters the handler
> (strict `CANARY_TIER` parse) and adds dependencies, so the next production
> apply after a rebuild **redeploys the live tier 1/2 functions** even with tier 3
> off. Run the new bundle for tiers 1/2 in staging first, then apply production
> with tier-3 variables still at their defaults and confirm the plan only updates
> the two existing functions' code.

1. **Preflight**, monitoring account, us-east-1:
   `aws ses describe-active-receipt-rule-set`. If any rule set is already active,
   stop and review; the shared stack would replace it.
2. **Shared stack** with `delegation_complete=false` (its own backend key, see
   `infra/escrow-canary-inbox/backend.hcl.example`):
   `terraform -chdir=infra/escrow-canary-inbox apply -var monitoring_account_id=… -var inbox_domain=…`.
3. **Delegate** the inbox domain from its parent zone to the output
   `name_servers` (NS record in the parent's account). Check with `dig NS`.
4. Re-apply the shared stack with `delegation_complete=true`; confirm the SES
   identity shows as verified.
5. **Sender settings**: copy `ESCROW_EMAIL_FROM` and `ESCROW_EMAIL_IDENTITY` from
   that environment's escrow output `enclave_email_configuration` into
   `inbox_expected_senders` / `inbox_expected_dkim_domain`. Never hardcode them.
   If staging escrow SES is in the sandbox, it can only send to verified
   recipients: verify the inbox domain in the escrow account or obtain production
   access first.
6. **Apply the environment** with the 12 `hold_account_ids` (at most 32
   characters each), `inbox_enabled=true` and `tier3_enabled=false`. Then
   `terraform output hold_secret_arns`, `inbox_recipients`, `ledger_table_name`,
   `ticket_topic_arn`. **Confirm the new `${name}-tickets` email subscription**
   (click the link in the confirmation mail). It is a separate subscription from
   the tier 1/2 alarm topic even when `ticket_email` equals `alarm_email`; until it
   is confirmed, `tier3-pool-low` and `tier3-email-slow` notifications are dropped.
   Check that
   `aws sns list-subscriptions-by-topic --topic-arn <ticket_topic_arn>` shows a real
   `SubscriptionArn`, not `PendingConfirmation`, before step 9.
7. **Provision the 12 hold accounts** with the tool (addresses are positional:
   `hold-0n` = `<inbox_local_part>+<n>@<inbox_domain>`, English, escrow opted in,
   **no PIN**). The login code is read from the account's own inbox prefix under
   the full trust checks, with the **login** sender policy (lca-api's tenant
   `login@` mailbox, not the enclave sender). Pass both values explicitly; they
   have no defaults and the dry-run prints them:

    ```sh
    node services/escrow-canary/dist/provision.mjs --environment staging \
      --expect-account <monitoring account id> --tier 3 --labels hold-01 \
      --login-sender <lca-api login From address> --login-dkim-domain <its DKIM domain> \
      --check-mail          # one code, trust + parse only, never verifies
    # then --labels all --dry-run, then --labels all
    ```

    Reading the inbox is an operator action: use a dedicated, MFA-protected
    provisioning permission set limited to the actions in
    [PROVISIONING.md](PROVISIONING.md) §9 (not created by this change), recorded in
    CloudTrail like break-glass. A label may only be provisioned while its pool item
    is absent or quarantined, or the pool is paused. Manual fallback as in
    "Staging operator setup" step 6 (`pin` may be a random valid placeholder;
    `recoveryLanguage` must be `en`; `recoveryEmail` must be exactly the label's
    address, or the runner refuses the account with `config`).

8. **Seed the ledger**: `--init-pool` on the provisioning tool (runs only once all
   12 hold secrets are live and pass the runner's checks), or
   `bun scripts/tier3-admin.ts <env> <ledger_table_name> init-pool`.
   Then, **within the hour before** the apply that sets `tier3_enabled=true`, run
   `… ready`. It validates the pool and writes META (`enabledAt = now`; re-run it
   to re-anchor while no run exists). StartAge is measured from it, so a runner
   that fails every tick still pages after 26 h. Without `ready` the evaluator
   throws (no META), no heartbeat is emitted and the silent alarm pages.
9. **Staging drills** (below), then set `tier3_enabled=true` in staging. Production
   follows only after the drills and a 7-day observation; the first release
   signal comes 7 days after the first start.

`tier3-admin` commands (ledger only; never secrets or escrow state; record each use):
`list`, `close-step <runId> <Step>` (close a step left open by a crash),
`close-run <runId> <orphaned|quarantined>` (close a run stuck in any open state,
mark its open steps `operator_closed` and free the account),
`unquarantine <hold-NN>` (after an owner-path repair), `pause` / `resume`,
`inject-overdue` (refused in code unless the ledger is staging),
`replay <snapshot.json> <ISO time>` (offline evaluator over an exported scan).

**Pausing** (for example to rotate a hold account's refresh token): `pause`,
wait one tick (15 min) for in-flight executions, rotate, `resume`. While paused
the runner touches nothing and the evaluator reports `Overdue=0`, `StartAge=0`,
`Paused=1`. `resume` re-anchors start age and gives open steps one hour to catch
up. Disabling only the schedules instead would page through Overdue/StartAge.

A daily run whose **warning email never arrives** pages through Overdue at
confirm + max(0, hold − 24 h) + 2 h (6 d 2 h for the production 7-day hold, 2 h for
staging's 10-minute hold); a day later the runner closes it `Warned=0`
`warning_missing` and orphans the account (cleanup below).

**Quarantine** happens on release failure, DID mismatch, failed re-enrolment,
an interrupted release, an early release, or a failed orphan cleanup. Repair
through the ordinary owner/app flow, then `unquarantine`. Start/confirm failures
leave the account `orphaned`; after 24 h the runner cancels the pending hold once
through the user's DID-authenticated cancel and puts the account in a 48 h
cooldown (UNVERIFIED: how long an unconfirmed enclave cancel blocks a new start).

The warning job processes holds in batches (`escrowHoldReminders.ts`), so a
backlog of real holds can legitimately delay a warning past its due time and page.

### Tier 3 staging drills

1. Warm-up and cancel gap: 8+ days enabled with no false page.
2. `inject-overdue` pages within one evaluation; `close-step` clears it.
3. Disable only the evaluator schedule: the heartbeat alarm pages after ~45 min.
4. Point `TIER3_LEDGER_TABLE` at a missing table: no heartbeat, pages.
5. Send mail from a non-allowlisted sender to a pool address: ignored.
6. Resolve every UNVERIFIED item in TIER3-DESIGN.md §11: capture a redacted
   real code email (header order, `Authentication-Results` position, DKIM
   `header.i`/`header.d`), the SES setup-notification object, SSE-KMS writes
   (fallback: `AES256`), plus-address exact matching, the rules-per-set quota,
   cancel cooldown, and that `apply production → apply staging → plan production`
   shows no changes to either environment's receipt rules.

## Supporting signals and remaining phases

`lca-api` now emits `LearnCard/Escrow / EnclaveFailure` EMF counts by its existing
allowlisted `Reason` alongside `logEscrowFailure`. No dependency was added. This
helper has no route context, so **per-route labels/spike alarms remain follow-up**;
do not infer a route from error strings. Ensure the API's log transport extracts
EMF in its own account; the canary account does not read those logs.

Escrow-account DynamoDB UserErrors (account aggregate), authority-table SystemErrors,
SES delivery correlation, KMS decrypt alarms and host Roughtime probes are untouched
and still require the owning escrow stack/operator. Ledger monitoring is unchanged.
Release gates/CI pin consistency and two-week production observation are not
implemented. Tier 3 and the inbox are implemented but not deployed or
live-verified. Offline tests do not replace the real staging drills, Linux
owned-stack `lc verify`, or Lambda/CloudWatch delivery proof.

## Local verification (no AWS)

```sh
bun run --cwd services/escrow-canary typecheck
bun run --cwd services/escrow-canary test
bun run --cwd services/escrow-canary build
export TF_DATA_DIR="$(mktemp -d)"  # keep provider caches out of the repo
terraform -chdir=infra/escrow-canary init -backend=false -input=false
terraform -chdir=infra/escrow-canary fmt -check -recursive
terraform -chdir=infra/escrow-canary validate
terraform -chdir=infra/escrow-canary test
export TF_DATA_DIR="$(mktemp -d)"
terraform -chdir=infra/escrow-canary-inbox init -backend=false -input=false
terraform -chdir=infra/escrow-canary-inbox validate
terraform -chdir=infra/escrow-canary-inbox test
```

The native Terraform test uses a fully mocked provider; its `command = apply`
does not call AWS. No standalone `terraform plan` or `terraform apply` is part of
local verification. Dependency-build artifacts and ZIPs are ignored.
