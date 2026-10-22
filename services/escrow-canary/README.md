# Escrow canary — staging first

Implements tiers 1–2 of [CANARY.md](../escrow-enclave-app/CANARY.md). No AWS
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

| Variable                   | Value                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `CANARY_ENVIRONMENT`       | `staging` initially; `production` only after separate approval                                                |
| `CANARY_TIER`              | `1` or `2`, set by Terraform per Lambda; authoritative even if an event is malformed                          |
| `LCA_API_URL`              | Staging **REST base**, including `/api` when applicable; not `/trpc`                                          |
| `TENANT_ID`                | Registered staging tenant; sent as `X-Tenant-Id`, just like the app                                           |
| `FIREBASE_API_KEY`         | That tenant's Firebase web API key (public identifier, not Admin credentials)                                 |
| `ESCROW_KEY_ID`            | Reviewed current logical escrow key ID                                                                        |
| `AUTHORITY_GENERATION`     | Reviewed measured authority generation                                                                        |
| `ESCROW_MEASUREMENTS_JSON` | Array of complete `{pcr0,pcr1,pcr2}` tuples copied from resolved staging `auth.sss.escrowEnclaveMeasurements` |
| `CANARY_ACCOUNTS_JSON`     | Exactly three `{id,secretArn}` objects, ordered read-only, PIN A, PIN B                                       |

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
   project/API. Finish the existing escrow staging prerequisites first. Register
   three **ordinary** accounts through normal sign-up, e.g. the placeholder pattern
   `jackson+canary<n>@learningeconomy.io` with `<n>` replaced locally. Do not add
   these addresses or actual account identifiers to tracked files. Verify recovery
   email normally; enroll automatic recovery for all three; set distinct random
   nontrivial PINs for PIN A/B. Keep the read-only account enrolled without a PIN.
3. On a trusted, isolated workstation/browser with tracing, screen recording and
   shell history disabled, sign each account in normally. Obtain the current user's
   Firebase `User.refreshToken` from that signed-in session (not the short-lived ID
   token), and the account's existing seed from the app's authorized key-export /
   developer tooling. If using DevTools, inspect only that disposable account's
   Firebase session and private-key store; do not print/copy an entire storage dump.
   Cross-check the seed-derived `did:key` against the account before upload. Never
   use a Firebase Admin service account or mint custom tokens. Never paste secrets
   in shell arguments, tickets, PRs, Terraform inputs, logs or screenshots.
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

6. Populate each secret using the monitoring-account Secrets Manager console's
   plaintext JSON editor in the isolated session, or a trusted SDK process reading
   the JSON via private stdin. Avoid CLI `--secret-string '<value>'` and files on
   persistent disks. Close the editor/browser, clear the clipboard and remove any
   temporary private material after confirming the secret's version metadata
   (do not log its value). Only the tier's runner role has normal read/write access
   to its exact secret ARNs; KMS use is restricted through Secrets Manager with
   the exact secret encryption context. Revoke temporary operator grants.
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

## Supporting signals and remaining phases

`lca-api` now emits `LearnCard/Escrow / EnclaveFailure` EMF counts by its existing
allowlisted `Reason` alongside `logEscrowFailure`. No dependency was added. This
helper has no route context, so **per-route labels/spike alarms remain follow-up**;
do not infer a route from error strings. Ensure the API's log transport extracts
EMF in its own account; the canary account does not read those logs.

Escrow-account DynamoDB UserErrors (account aggregate), authority-table SystemErrors,
SES delivery correlation, KMS decrypt alarms and host Roughtime probes are untouched
and still require the owning escrow stack/operator. Ledger monitoring is unchanged.
Tier 3/inbox, release gates/CI pin consistency, production account provisioning and
two-week observation are not implemented. Offline tests do not replace the real
staging drills, Linux owned-stack `lc verify`, or Lambda/CloudWatch delivery proof.

## Local verification (no AWS)

```sh
bun run --cwd services/escrow-canary typecheck
bun run --cwd services/escrow-canary test
bun run --cwd services/escrow-canary build
export TF_DATA_DIR=/var/folders/vx/brx5cr1d36q01_wx9xh194ch0000gn/T/opencode/escrow-canary-tf
terraform -chdir=infra/escrow-canary init -backend=false -input=false
terraform -chdir=infra/escrow-canary fmt -check -recursive
terraform -chdir=infra/escrow-canary validate
terraform -chdir=infra/escrow-canary test
```

The native Terraform test uses a fully mocked provider; its `command = apply`
does not call AWS. No standalone `terraform plan` or `terraform apply` is part of
local verification. Dependency-build artifacts and ZIPs are ignored.
