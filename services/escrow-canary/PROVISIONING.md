# Canary account provisioning

Status: **implemented, never run against AWS or lca-api.** Offline tests only
(`src/provision/*.test.ts`). This replaces the manual account setup in README
"Staging operator setup" steps 3 and 6 and tier 3 step 7: signing up in the app,
reading the seed with DevTools, copying the refresh token out of IndexedDB and
pasting JSON into Secrets Manager. The replacement is one auditable command that
takes the **normal user path**: email-code login, SSS key setup and escrow opt-in
or PIN. No lca-api, brain-service or app code learns about canaries
(`services/escrow-enclave-app/CANARY.md` §13).

All `path:line` references are to this branch. Items marked **UNVERIFIED** must be
checked against staging before the tool is trusted (§11). No knowledge base was
consulted; every claim comes from repo code.

## 1. Decisions (need owner sign-off)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | As implemented                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Tier 1/2 login mail has no inbox receipt rule. Rules exist only for `<local>+1..12` (`infra/escrow-canary/inbox.tf:7,101-112`).                                                                                                                                                                                                                                                                                                                                                                                                                       | Tier 1/2 read the code from a hidden operator prompt (TTY, no echo). Receipt rules for tier 1/2 would be a separate infra change.                                                                                                                                                                                                                                                                                                  |
| D2  | The old README said "Never use a Firebase Admin service account or mint custom tokens".                                                                                                                                                                                                                                                                                                                                                                                                                                                               | The tool holds no Admin credential and mints nothing. It exchanges the custom token that lca-api returns to every email-login user (`lca-api/src/routes/firebase.ts:396-409`), as the app does. README step 3 now says "never holds a Firebase Admin credential".                                                                                                                                                                  |
| D3  | The tool reads the inbox bucket, which the old README called break-glass only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | README tier 3 step 7 now requires a dedicated MFA-protected provisioning permission set (§9), recorded in CloudTrail like break-glass. **Not created by this change.**                                                                                                                                                                                                                                                             |
| D4  | Production's default tenant config is web3auth (`apps/learn-card-app/environments/learncard/config.json:16`) and `escrowRolloutPercent` defaults to 0 (`packages/learn-card-base/src/config/tenantDefaults.ts:112`). The production SSS user path is the pilot overlay: `keyDerivation: "sss"`, nitro, rollout 100 (`apps/learn-card-app/environments/learncard/config.sss-pilot.json:5-11`).                                                                                                                                                         | Canaries follow the pilot overlay's path in production (SSS key, explicit escrow opt-in or PIN). Before first production use, check that the production lca-api tenant accepts SSS auth-share writes and escrow (the escrow gate is global: `lca-api/src/routes/index.ts:233-238`). **UNVERIFIED:** what the production web3auth app does if someone signs in with a canary address that already has an SSS record (do not do it). |
| D5  | Activation. Opt-in alone leaves a record provisional (the app's settings opt-in, `apps/learn-card-app/src/providers/AuthCoordinatorProvider.tsx:1887`); PIN setup activates it (`apps/learn-card-app/src/providers/recoveryPinActions.ts:33` -> `packages/learn-card-base/src/auth-coordinator/recoverySetup.ts:70-73`). `/keys/activate` needs a confirmed method at the current share version (`lca-api/src/routes/keys.ts:1182-1190`). Provisional records are purged only for migrated web3auth keys (`lca-api/src/models/UserKey.ts:1311-1347`). | Tier 2 always activates after the PIN. Tiers 1/3 stay provisional, like a user who only opts in, unless `--activate` is passed. **UNVERIFIED:** that provisional accounts pass every runner slot (§11.5).                                                                                                                                                                                                                          |
| D6  | Tier 1/2 schedule. Staged writes mean the runner never sees a half-written secret.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No schedule guard for tiers 1/2 (stopping it would page). Tier 3 keeps the ledger guard (§3.5).                                                                                                                                                                                                                                                                                                                                    |
| D7  | README step 2's "verify recovery email" (`keys.ts:1214,1287`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Dropped. Escrow does not need it: the contact is sealed in the enrollment. Record as a decision.                                                                                                                                                                                                                                                                                                                                   |

No LCN network profile is created. The keys and escrow routes are DID-and-challenge
routes (`lca-api/src/routes/index.ts:118-140,243-257`); `escrow/recover` checks only
the escrow blob, opt-out, confirmed escrow and PIN (`lca-api/src/routes/escrow.ts:799-822`).
**UNVERIFIED end to end:** the existing manual canaries all have profiles (§11.5).

## 2. CLI

Run the **built** bundle with Node 22 (README requirement). `createSdk` loads
`./didkit.wasm` relative to the module (`src/sdk.ts:29`), which exists only in
`dist/` (`scripts/build.ts:24-27`), so `bun scripts/provision.ts` does not work.

```
bun run --cwd services/escrow-canary build
node services/escrow-canary/dist/provision.mjs \
  --environment <staging|production> \
  --expect-account <12-digit monitoring account id> \
  --tier <1|2|3> \
  ( --labels <hold-01,hold-02|all> --login-sender <address> --login-dkim-domain <domain>
  | --account <read-only|pin-a|pin-b> --email <address> ) \
  [--dry-run] [--check-mail] [--activate] [--init-pool] \
  [--no-require-dmarc] [--firebase-project <id>] [--function <name>]
```

- `--environment` and `--expect-account` are required in every mode. No account id is
  hardcoded in tracked files.
- `--function` defaults to the Terraform name: `escrow-canary-<env>-tier<1|2>` or
  `escrow-canary-<env>-tier3-runner` (`infra/escrow-canary/versions.tf:21`,
  `main.tf:57`, `tier3.tf:143`). Configuration comes from that function's
  environment (`lambda:GetFunctionConfiguration`), parsed with the existing
  `loadConfig` / `loadRunnerConfig` (`src/config.ts:47`, `src/tier3/config.ts:100`).
  There is no second copy of runner configuration.
- Tier 3 targets: `--labels hold-01,...` or `all`. Tier 1/2: one account per run,
  `--account` (`read-only` is tier 1, `pin-a`/`pin-b` tier 2, in `CANARY_ACCOUNTS_JSON`
  order) and `--email`.
- `--login-sender` / `--login-dkim-domain` are **required** for tier 3 and have no
  defaults: the real From address depends on the tenant's branding
  (`lca-api/src/services/delivery/from.ts:37-42`). The plan line prints both. They are
  flags, not runner config: `tier3/config.ts:66-72` requires runner senders to sit
  under the enclave's DKIM domain.
- `--firebase-project` (optional): the ID token's `aud` must equal it. Without it,
  lca-api's `verifyIdToken` still rejects a token from another project at the first
  keys call (`lca-api/src/helpers/auth.helpers.ts:60`).
- There is no `--resume` flag: resume is decided from secret and server state (§6).
- Accounts run sequentially, 2 s apart; the run stops at the first failure.
- Exit codes: 0 = done; 1 = stopped safely, re-run; 2 = guard or usage refusal,
  nothing changed; 3 = needs a human (§6 "stop").

Code (pure modules with injected dependencies; AWS wiring only in the script):

```
src/provision/
  errors.ts        ProvisionError(step, reason, exitCode): fixed strings only
  targets.ts       tier/label -> account id, secret id, address, inbox prefix
  guards.ts        account, environment, secret name, tier 3 ledger, production confirm
  preflight.ts     all guards before any lca-api call; builds the plan
  login.ts         send code, verify code, signInWithCustomToken, ID token check
  login-mail.ts    login trust policy, strict parser, poll loop
  secret-writer.ts staged Secrets Manager writes (PROVISIONING -> AWSCURRENT, CAS)
  flow.ts          classification and per-account orchestration
  output.ts        console containment and crash handlers
  test-world.ts    test-only fakes
scripts/provision.ts  CLI wiring -> dist/provision.mjs (not in canary.zip)
```

New dependencies: `@aws-sdk/client-sts`, `@aws-sdk/client-lambda`;
`@learncard/email-templates` as a devDependency for the template drift test.
`src/boundaries.test.ts` asserts that `handler.ts`'s import graph never reaches
`src/provision/` or test fakes.

## 3. Guards (all before any lca-api call)

1. STS `GetCallerIdentity` must equal `--expect-account`.
2. The Lambda: `CANARY_ENVIRONMENT` must equal `--environment`; `CANARY_TIER` must
   equal `--tier` (tier 3: `CANARY_ROLE=runner`); the configuration must parse (for
   tier 3 this includes the rule that only staging's local part ends in `-staging`,
   `tier3/config.ts:65`); the function ARN's account must equal `--expect-account`.
3. For each target secret, `DescribeSecret` (no value read): the name starts with
   `escrow-canary-<environment>/` (`versions.tf:21`, `main.tf:12`, `tier3.tf:15`), the
   name (tier 3) or ARN (tier 1/2) is the configured one, and the ARN's account equals
   `--expect-account`.
4. Production (not in `--dry-run`) requires a TTY and the operator typing
   `production`.
5. Tier 3: each label's pool item must be absent, or `quarantined`, or META `paused`
   (ledger read only). Login mail in a live hold prefix would count toward the
   runner's candidate cap (`tier3/inbox.ts:12`).

STS, the Lambda ARN and the secret ARNs come from one session, so together they only
confirm the account the operator typed; `CANARY_ENVIRONMENT` and the secret names
are the independent environment signal. (Optional, not implemented: read the
expected account from an untracked operator file and refuse the escrow account.)

`--dry-run` runs §3, then classifies each target **from Secrets Manager only**. It
never sends a code or verifies one (verify creates the Firebase user,
`firebase.ts:399-401`). Server state is reported only for a secret that already
parses (live or staged), through its **stored** refresh token; a fresh label
reports "server state unknown (needs login)".

## 4. Flow per account

`email` = the lowercase canary address. Tier 3 derives `<inbox.localPart>+<n>@<inbox.domain>`
for `hold-0n`, as the runner does (`tier3/runner.ts:157-165`). lca-api calls use
`LCA_API_URL` + REST path with `X-Tenant-Id`, exactly as the app's own REST call
(`apps/learn-card-app/src/providers/AuthCoordinatorProvider.tsx:1536`).

**A. Login** (fresh accounts, or a resume whose stored refresh token fails)

1. `t0 = now`; `POST /send-login-verification-code` `{email, locale:"en"}`
   (`firebase.ts:243-319`). The **body** decides: `success:false` arrives at HTTP 200
   for a rate limit or a Postmark failure (`:265-270,:310-318`), mapped to
   `rate_limited` / `delivery_refused` / `refused`.
2. Code: tier 3 polls `inbox/hold-NN/` every 10 s for up to 4.5 min (codes live 300 s,
   `:65`) with the login policy (§5), mail at or after `t0`, newest trusted wins (each
   send replaces the code, `:279-280`). Tier 1/2: hidden prompt, `^[0-9]{6}$`; blank
   means resend (once; the operator then enters the code from the newest email).
3. No code (possibly silent: with no Postmark token lca-api answers `success:true`
   and sends nothing, `delivery.factory.ts:29-45`): tier 3 stops (exit 1) after its
   **single** send; resending is an explicit re-run. The inbox orders mail by S3
   arrival, not send order, so an in-run resend could let a late copy of the
   replaced first code win "newest trusted" and spend the one verify on it. A late
   mail from an earlier run can still race a re-run; the server rejects the stale
   code (`verify: rejected`, exit 1) and nothing is written, so wait a few minutes
   and re-run. At most 1 send (tier 3) or 2 sends (tier 1/2) per account per run;
   the server allows 6 per fixed 5-minute window (`:67-69,261-271`; the comment at
   `:259` is stale).
4. `POST /verify-login-code` `{email, code}`, **one attempt** per code (server limits
   5 per email, 30 per IP per 10 min, `:72-74`). It creates the Firebase user if
   missing (`:399-401`) and mints a custom token with no claims (`:409`).
5. `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=<FIREBASE_API_KEY>`
   `{token, returnSecureToken:true}` -> `idToken`, `refreshToken`: the REST form of
   the Firebase SDK's `signInWithCustomToken` (endpoint from Google's public docs,
   not repo code). Firebase errors map to an allowlist; bodies are discarded.
6. Decode the ID token locally (never printed): `iss` = `https://securetoken.google.com/<aud>`,
   `aud` = `--firebase-project` if given, `exp` in the future, `email` = `email`.
   Then one `refreshIdentity` (`src/auth.ts:14`) proves the runner's auth path; the
   rotated refresh token, if any, is kept.

**B. Server state**: fresh `memoryStorage` and strategy per account; for a resume the
storage starts from the staged `deviceState`. `fetchServerKeyStatus(T,'firebase')`
(`sss-strategy.ts:2102`) decides fresh / resume / stop (§6).

**C. Key and write-ahead** (fresh only): `generateEd25519PrivateKey()`
(`sss-key-manager/src/crypto.ts:195-198`), `did = sdk.did(key)`, a random 8-digit PIN
that passes `validatePin` (`escrow-pin.ts:30-48`; tiers 1/3 never enroll it,
README "Each secret"). The full secret is validated with `secretSchema` and written
as a **new version labelled only `PROVISIONING`**, before any server change. The
runner keeps reading `AWSCURRENT` (`{}`).

**D. Shares**: `atomicUpdateShares({token, providerType:'firebase', privateKey, did, signDidAuthVp})`,
the call the app's `setupNewKey` makes (`AuthCoordinator.ts:1199-1241`). The server
refuses a different DID (`keys.ts:783`) or a version race (`:789`) and writes a
provisional record (`:797-828`). The staged version is rewritten with the device
snapshot.

**E. Enroll** with contact = login address, language `en` (as `AuthCoordinator.ts:768-775`):

- Tiers 1/3: `enableEscrowRecovery` (the app's opt-in, `AuthCoordinator.ts:629-646`
  -> `sss-strategy.ts:2348-2385`). The client-side rollout gate does not apply to an
  explicit opt-in. A result other than `enrolled === true` (`{enrolled:false, reason}`
  is returned without throwing, `sss-strategy.ts:2350-2351,2378-2384`) stops with
  exit 3.
- Tier 2: `setEscrowPin` alone, as the app does (`sss-strategy.ts:2388-2410`; opt-in
  only clears an opt-out).

The staged version is rewritten with the new snapshot.

**F. Activate**: tier 2 always, tiers 1/3 with `--activate`, skipped if already
active: `activate(T,'firebase', getFreshDidAuthVp(key, did, sign))`
(`keys.ts:1165-1207`).

**G. Verify and promote** (§7), then compare-and-swap promotion (§6.3).

## 5. Login-code mail: trust policy and parser

`parseMessage` and `isTrusted` are reused unchanged, with a separate policy
`{expectedSenders:[--login-sender], expectedDkimDomain:--login-dkim-domain, requireDmarc, recoveryEmail:email}`.
All checks apply: one SES `Authentication-Results`, SPF pass, DMARC pass (unless
`--no-require-dmarc`), every DKIM result pass with one aligned inside the DKIM
domain, spam and virus PASS, exactly one To equal to `email`, no Cc or Bcc.

`src/tier3/inbox.ts` now exports `findParsed(store, prefix, since, policy, parse)`;
`findMessage` and `readKnownMessage` are thin wrappers with unchanged behaviour (all
existing runner tests pass).

The parser (`provision/login-mail.ts`) fails closed (`malformed`):

- subject `^Your (.{1,64}) login code$` (`email-templates/src/templates/verification-code.tsx:53`);
- exactly one standalone 6-digit run in the text part;
- that run is alone on its line, and the previous non-empty line is `Verification code`.

The text part starts with a whitespace-only line, so nothing is anchored to line 1.
A drift test renders the real template with `renderEmail` and parses it. The
Postmark-hosted fallback template (`postmark.adapter.ts:133-140`) fails the parser;
enclave mail fails the sender allowlist and is skipped.

**UNVERIFIED (blocking for tier 3):** Postmark's DKIM `d=` (a second `pm.mtasv.net`
signature that does not pass would fail `isTrusted`), SPF and DMARC results, and
whether the MIME shape is one `parseMessage` handles. `--check-mail` sends one code,
runs trust and parse, prints only `trusted_and_parsed=yes|no untrusted=N malformed=N`,
and **never verifies** (no Firebase user is created). It does not name the failing
check; capture a redacted header fixture by hand (header names and synthetic values
only, never the raw message) if it fails. A `delivery_refused` send result usually
means a Postmark inactive recipient or suppression.

## 6. Classification, idempotency and resume

### 6.1 Secrets Manager first (also the whole of `--dry-run`)

1. `AWSCURRENT` parses with `secretSchema`: **live**. Never modified. Another
   `accountId` -> refuse (exit 2). A stale `PROVISIONING` label is reported, not
   deleted. The tool runs the read-only checks (§7) with the stored refresh token;
   it never sends a login code. (If Firebase rotates the token during this check,
   the tool warns and does not write; the runner persists rotations.)
2. `AWSCURRENT` is exactly `{}`: placeholder. Anything else (malformed, a hand-pasted
   partial value, `[]`) -> stop (exit 3).
3. No `PROVISIONING` version: **fresh**. `PROVISIONING` parses and matches the target
   (account id, address, `en`, no runner-only fields): **resume**. Otherwise stop
   (exit 3).

### 6.2 Server state (after login or stored-token refresh)

| Classification | Server record (`fetchServerKeyStatus`) | Action                                                        |
| -------------- | -------------------------------------- | ------------------------------------------------------------- |
| fresh          | none                                   | C -> G                                                        |
| fresh          | exists                                 | **stop, exit 3**: a key with no secret (orphaned, §6.4)       |
| resume         | none                                   | D -> G with the **stored** key and PIN                        |
| resume         | `primaryDid` = staged DID              | E -> G (opt-in returns `changed:false` when already enrolled) |
| resume         | any other DID                          | **stop, exit 3**                                              |
| live           | n/a                                    | report only                                                   |

A resume reuses the stored key **and the stored PIN**; neither is regenerated. It
tries the stored refresh token first, so a crash after the write-ahead usually needs
no new login code. Empty or stale device state is safe: enrollment re-splits from
the private key (`sss-strategy.ts:1660-1675`), as the runner's crash repair does
(`runner.ts:107-111`).

### 6.3 Staged writes with compare-and-swap

- Before every `PutSecretValue` the tool checks (`DescribeSecret`) that
  `PROVISIONING` is still on this run's last version (or absent before the first
  write); after it, that the label is on the new version. Otherwise exit 3: another
  run is working on the label.
- Promotion: `UpdateSecretVersionStage(AWSCURRENT, MoveToVersionId=own, RemoveFromVersionId=<placeholder version seen at classification>)`,
  which fails if `AWSCURRENT` moved meanwhile (exit 3). Then the `PROVISIONING`
  label is detached.

### 6.4 Orphaned hold addresses (tier 3)

Hold addresses are positional: receipt rules exist only for `+1..12`
(`infra/escrow-canary/inbox.tf:7,105`), the runner derives the address from the
label (`tier3/runner.ts:159-164`) and the pool must be exactly 12
(`tier3/config.ts:29,41`). An address cannot be retired. If a server key exists with
no matching secret, the recovery paths are:

1. the normal lost-key user flow for that address (lca-api `keys.ts:288-560`:
   recovery-session start / verify / recover / rebind), then re-provision; or
2. an infra change to the inbox local part (new addresses for all 12).

**Nobody may sign in to the app with a canary address.** A key the app creates for
it orphans the label.

## 7. Verification (what the runner checks)

1. `sdk.did(key) === secret.did === status.primaryDid`.
2. `getEscrowEnrollmentState` is `enrolled`; `escrowPin.state` is `enabled` for tier 2
   and `none` for tiers 1/3 (`sss-strategy.ts:2240-2275`).
3. Activation is `active` when F ran (tier 2, or `--activate`).
4. `sdk.authority(secret, T, sdk.attest())` is `active` at the configured generation
   (`src/sdk.ts:105-131`); `hasPin === (tier === 2)`; `shareVersion` equals the
   server's.
5. `refreshIdentity` with the stored refresh token succeeds; a rotated token is
   written before promotion.
6. The staged version is read back by version id, parsed with `secretSchema`, and
   must equal what was written and match the target (account id, address, `en`, no
   `hold` / `lastReleasedRunId`). A mismatch stops with exit 3 before promotion.

## 8. Pool registration (tier 3)

`--init-pool` runs after the targets: all 12 hold secrets must classify as live,
match their targets and pass §7 (read-only); then `initPool` (`src/tier3/admin.ts:28-51`,
idempotent). `ready` stays a manual `tier3-admin` step so a human anchors META.
`tier3-admin` stays ledger-only (`scripts/tier3-admin.ts:17-18`).

## 9. Least-privilege AWS (proposed permission set, not created here)

- `sts:GetCallerIdentity`; `lambda:GetFunctionConfiguration` on the canary functions.
- `secretsmanager:DescribeSecret`, `GetSecretValue`, `PutSecretValue`,
  `UpdateSecretVersionStage` on `escrow-canary-<env>/*`; `kms:Decrypt` /
  `kms:GenerateDataKey` with `kms:ViaService = secretsmanager.<region>.amazonaws.com`
  and a `kms:EncryptionContext:SecretARN` condition, as the runner role has
  (`infra/escrow-canary/main.tf:50`).
- Tier 3: `s3:ListBucket` (prefix `inbox/hold-*`), `s3:GetObject` on `inbox/hold-*`,
  `kms:Decrypt` via S3 on the inbox key (`inbox.tf:22` delegates to IAM); no put or
  delete. `dynamodb:GetItem` on the ledger; `PutItem` only with `--init-pool`.
- MFA, named operators only, CloudTrail data events on the bucket and secrets.
  Production uses the production monitoring account, never the escrow account
  (`infra/escrow-canary/variables.tf:17`).

## 10. Logging rules

- Never printed or written: private key, PIN, login code, custom/ID/refresh tokens,
  device shares, raw email, secret values, the canary address.
- Output: label, environment, tier, secret name, version id, `did:key`, step
  results, the login sender/DKIM domain in the plan, fixed error strings.
- For the whole run every `console.*` method is replaced by a counting sink (SDK code
  logs raw errors, e.g. `sss-strategy.ts:2150,3352`); the tool writes its own lines
  directly. `uncaughtException` and `unhandledRejection` print one fixed line and
  exit 1. AWS errors print the error name only.
- Secrets travel only in memory. Nothing comes from argv or env.

## 11. Must verify on staging before first real use

1. Staging lca-api sends real mail through Postmark (not the log adapter).
2. `--check-mail --labels hold-01` passes (DKIM `d=`, SPF, DMARC, MIME shape).
3. `FIREBASE_API_KEY` allows `identitytoolkit` server-side and matches lca-api's
   Firebase project (pass `--firebase-project`).
4. The ID token from custom-token sign-in carries `email` (lca-api reads it,
   `auth.helpers.ts:64`; app email-login users already enroll this way).
5. One profile-less, provisional tier 1 account passes a full runner slot: provision
   `read-only` first, then one manual invocation.
6. Secret names start with `escrow-canary-<env>/` (the tool refuses otherwise).
7. Before production: the production tenant accepts SSS auth-share writes and escrow
   (D4).

## 12. Tests (offline, no network)

`fetch` is stubbed to throw in the flow tests.

- `login-mail.test.ts`: valid mail (7bit, QP, base64); non-allowlisted sender skipped;
  enclave mail skipped; forged second From, unaligned DKIM, second failing DKIM,
  DMARC fail, To mismatch, Cc, spam verdict -> untrusted; two codes, code not alone,
  missing label, hosted fallback, no code -> malformed; older than the send ignored;
  newest wins; poll deadline; drift test against the real template.
- `login.test.ts`: request shape; `success:false` at HTTP 200 (rate limit, delivery,
  other); HTTP 400/429/503; verify once and code format; Firebase error allowlist;
  transport errors; ID token email, issuer, project, expiry, malformed.
- `preflight.test.ts`: every guard refusal (caller, function and secret account,
  environment, tier, role, config, staging local part in production, labels, tier 1
  with `pin-a`, secret name), tier 3 ledger states, production TTY/confirmation.
- `flow.test.ts`: tier 1/2/3 happy paths; write-ahead before shares and promotion
  last; tier 2 PIN then activate; `--activate`; untrusted mail and silent send (two
  sends, no verify, no write); rate limit; one verify per code; orphaned server key;
  live secret untouched with no login; live secret for another account; malformed
  `AWSCURRENT` / `PROVISIONING`; resume reuses key and PIN without a new code; stored
  token fallback; resume after shares; server DID mismatch; readback mismatch; CAS on
  promotion; moved `PROVISIONING` label; rotated refresh token; dry-run makes no
  mutating call; `--init-pool`; `--check-mail`; sentinel secrets never in output when
  the fake SDK logs raw values.
- `boundaries.test.ts`: the Lambda's import graph never reaches `src/provision/`.

## 13. Open items

- D1-D7 need owner sign-off; the provisioning permission set (§9) is not created.
- §11 items are unverified; the tool has never run against AWS or lca-api.
- Tier 2 PINs are random 8-digit values; distinctness from the other PIN account is
  not checked (reading it would mean reading another live secret).
- `--check-mail` reports counts, not which trust check failed.
- Pre-existing, not caused by this change (needs verification): Terraform's
  placeholder versions (`main.tf:18-25`, `tier3.tf:20-27`) lose their labels after
  real writes; if Terraform ever recreated one, `{}` could become `AWSCURRENT`.
  Check before relying on `ignore_changes`.
