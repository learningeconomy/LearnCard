# @welibraryos/lca-api-service

## 1.8.1

### Patch Changes

- [#2039](https://github.com/learningeconomy/LearnCard/pull/2039) [`4c980dd2eeac86a00dc58603f1076de2d92df4c4`](https://github.com/learningeconomy/LearnCard/commit/4c980dd2eeac86a00dc58603f1076de2d92df4c4) Thanks [@gerardopar](https://github.com/gerardopar)! - fix(scouts): enable production signing-authority seed encryption

## 1.8.0

### Minor Changes

- [#2025](https://github.com/learningeconomy/LearnCard/pull/2025) [`7f430656d7ff8c780b375f109e870dd07b5b9bf2`](https://github.com/learningeconomy/LearnCard/commit/7f430656d7ff8c780b375f109e870dd07b5b9bf2) Thanks [@Custard7](https://github.com/Custard7)! - Transcript issuers can say how long delivery will take. An accepted transcript request response may include `expectedInSeconds` or an ISO 8601 `expectedBy`; lca-api stores it and returns it as an additive `expectedBy` field from `transcripts.request` and `transcripts.getStatus` (and the plugin's `transcriptsRequest` / `transcriptsGetStatus` types). Malformed, past or more than 30-day estimates are ignored. The app keeps its live steps for estimates of 30 seconds or less, shows a progress bar with the time left for estimates up to 5 minutes, and for longer ones confirms the request and when to expect it. The School Connect card shows the same estimate and only offers manual recovery once the estimate has passed.

### Patch Changes

- Updated dependencies [[`c245cba6fc162e6896c4f9439a8a8da42d4189c9`](https://github.com/learningeconomy/LearnCard/commit/c245cba6fc162e6896c4f9439a8a8da42d4189c9), [`7641006bae66bf2cd52666eb937f2e22154e301c`](https://github.com/learningeconomy/LearnCard/commit/7641006bae66bf2cd52666eb937f2e22154e301c), [`6568ef03ecbaf3e29ca91ffabb9ef509e5cc0480`](https://github.com/learningeconomy/LearnCard/commit/6568ef03ecbaf3e29ca91ffabb9ef509e5cc0480), [`f086c95870f57896331b2bbbdd97a94f6ddc3339`](https://github.com/learningeconomy/LearnCard/commit/f086c95870f57896331b2bbbdd97a94f6ddc3339), [`7641006bae66bf2cd52666eb937f2e22154e301c`](https://github.com/learningeconomy/LearnCard/commit/7641006bae66bf2cd52666eb937f2e22154e301c)]:
    - @learncard/didkit-plugin@1.10.11
    - @learncard/types@6.1.0
    - @learncard/init@2.5.11
    - @learncard/didkit-plugin-node@0.3.11
    - @learncard/core@9.4.45
    - @learncard/helpers@1.8.1
    - @learncard/did-web-plugin@1.1.45
    - @learncard/sss-key-manager@0.3.1

## 1.7.0

### Minor Changes

- [#1819](https://github.com/learningeconomy/LearnCard/pull/1819) [`784f0c9b346a5f7e4e2c618a9b976dcaa90fafe3`](https://github.com/learningeconomy/LearnCard/commit/784f0c9b346a5f7e4e2c618a9b976dcaa90fafe3) Thanks [@smurflo2](https://github.com/smurflo2)! - feat: [LC-2194] Support versioned ConsentFlow updates and user review.

    Keep a connection's URI and history while publishing immutable access updates. New optional read/write choices stay off; required additions pause writes until the user reviews the changes. Add explicit update acceptance, review notifications, deadlines, once-only AutoBoost delivery, and safe retirement. Unsaved request previews no longer require a URI.

    Preserve existing grants in partial scope updates, gate Lambda startup on legacy snapshots, and retain once-only delivery during explicit one-time updates. Localize review and history content, recover from cancelled guardian checks and concurrent updates, and keep handled notifications safe to reopen.

    Retry transient Lambda migration failures without poisoning warm application imports. Record completed migrations for fast cold starts, report malformed request IDs without credential data, and identify retained ambiguous AutoBoost claims for reconciliation. Load runtime secrets before importing the scheduled deadline worker, including secrets-only Lambda deployments. Keep inbox maintenance coverage behavioral rather than pinning Lambda wrapper source text.

    Recover valid, unversioned contracts created after the migration marker through scoped version-1 initialization. Atomically backfill only their existing connections, preserve global migration completion, and keep missing history on already-versioned or malformed contracts fail-closed.

    Settle guardian PIN actions on external dismissal or unmount without cancelling valid submissions. Cover reapproval, signing failures and referral cancellation with the current PIN modal contract. Clear stacked overlays before opening a contract-update review. Cancel delayed modal-removal timers when their provider unmounts while preserving closing animations. Use stable localization keys independent of English labels and stop proposing optional defaults after their window expires.

    Route pending and suspended connections from ordinary consent entry to explicit update review. Recover the same way when the latest-approval error arrives during an open consent dialog, without treating the connection as approved or bypassing guardian checks.

    Reject overlapping top-level and nested SDK scope patches instead of silently dropping changes. Restore strict type-only imports, declare the runnable update snippet's SDK contract, and narrow unsuccessful notification reads in end-to-end consumers without raising the typecheck allowance.

    Include cumulative changes in consent records so users can approve all required additions across multiple unreviewed versions. Clear the pending optional-choice marker only when the holder successfully saves their choices.

    Resolve built-in request categories and personal fields to localized labels and descriptions in English, Spanish, French, and Arabic, including learning history and career/AI categories. Recognize the legitimate French cognates “Image” and “Qualifications” in the existing untranslated-value guard.

    Dismiss Alerts when opening a contract-update review without waiting for read-status writes. Give unread indicators their own layout space so they cannot overlap notification dates.

    Use one shared request form with the original creation controls for creating and editing requests, without per-item purpose fields or added default-enabled checkboxes. Keep the overall update explanation separate. Replace JSON authoring with readable changes and Preview Update / Publish Update actions in the Contracts tab. Show an accessible help icon and meaningful existing-access/defaults disclosures.

    Start new optional review controls from their Opt-in/Opt-out settings without silently granting access. Use the edited request's defaults in previews, refresh saved choices when reopening without overwriting active edits, and reduce the extra spacing below the current version.

    Separate Advanced Options from changes, published feedback, and actions. Add space below the current version while keeping the image's remove control in its original outside corner.

    Show a clear unavailable state for networks that omit contract version metadata, including cached responses. Keep publishing disabled until a versioned response is available, and never assume an unversioned response is version 1.

    Use direct Mongo connections for the local Docker APIs so the single-node replica's localhost address does not prevent them from starting. Gate Mongo-dependent services on a writable primary so they do not exit during replica initialization or election.

    Pre-bundle the remaining workspace crypto and cloud-client dependencies before serving the local app, avoiding dependency-discovery reloads during browser startup.

    Open an on-demand Update contract modal from each configured request in the Contracts tab, rather than the Testing tab. Reveal the update explanation only after edits, separate it from grouped current/next values, and keep user-review previews in the shared modal stack for correct focus and Escape behavior.

    Breaking SDK/API changes: use `updateContract` instead of the removed `addAutoBoostsToContract` and `removeAutoBoostsFromContract` SDK methods. One-time consent status is now `consumed`, not `stale`. The deprecated HTTP AutoBoost routes remain available for one compatibility release and use the versioned update path. Legacy AutoBoost additions also pause writes and synchronization pending explicit holder review; coordinate partner upgrades and support `getConsentStatus` / `reviewUrl` before rollout.

    Reject stale editor drafts with their original expected version, treat equivalent updates as no-ops, require future reconsent deadlines, and restrict legacy AutoBoost publications to contract owners. Paginate tied consent-data timestamps with stable opaque cursors and preserve all unreviewed optional additions across later updates.

    Track each holder's last explicit review, backfill that baseline from transaction history, and timestamp legacy snapshots at the revision actually captured. Require notification and approval when an existing item's reason changes; keep redirect-only changes quiet. Retain ambiguous initial AutoBoost claims and reject mismatched concurrent initial credential deliveries.

    Show material metadata, writer, and automatic-delivery changes alongside scope updates. Refresh holder terms before enabling review edits, populate newly enabled personal fields from the holder profile, and use a structured approval-required reason instead of matching error text.

    Regenerate the Python API client from the current router graph, including all consent lifecycle states, versioned updates, and review metadata. Omit `None` for ordinary non-nullable optional inputs, preserve nullable values, and retain the allocation holder's explicit-null rejection instead of silently treating it as an omission.

    Preserve existing delegated AutoBoost issuers when owners publish unchanged configurations, while keeping new configurations owner-issued and rejecting changes to an existing delegated signer. Defer new cross-account setup until an explicit issuer-authorization flow is available. Use pre-upgrade persisted fixtures for legacy-delegation regressions without reopening writer publication, and fix the signer mock's recursive self-call in consent regressions.

    Keep saves from already handled reviews in ordinary sharing-update history, and preserve the saved one-time setting when update or reconsent inputs omit it.

    Use opaque timestamp-and-ID cursors for holder consent lists, between-profile data, transaction history, and holder exports as well as owner data pages. Preserve legacy timestamp fallbacks and reject malformed or pre-upgrade date-only cursors with `BAD_REQUEST`; restart pagination without a cursor after upgrading.

    Pin owned verification review links to the allocated app origin so real consent review URLs never escape to an unrelated localhost development server.

    Explain approval notifications above Publish Update without changing checked-by-default Opt-out selections. Synchronize the CLI method catalog with the versioned contract SDK, removing obsolete AutoBoost commands and exposing update, history, status, and acceptance methods.

    Use neutral changed-request summaries and Updated badges for existing-scope edits, including reason-only reviews. Reserve new-access headlines and new-item counts for pure scope additions without material request-detail edits, and retain existing optional choices during approval.

### Patch Changes

- [#1872](https://github.com/learningeconomy/LearnCard/pull/1872) [`3505f004376543ff4c723921868e17c400142884`](https://github.com/learningeconomy/LearnCard/commit/3505f004376543ff4c723921868e17c400142884) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Install python3, make, and g++ during `bun install` in the shared monorepo Docker image so linux/arm64 builds can compile native addons (utf-8-validate) via node-gyp.

- [#1839](https://github.com/learningeconomy/LearnCard/pull/1839) [`0caa0e478bce246793893e488f37ee90c9b00a1a`](https://github.com/learningeconomy/LearnCard/commit/0caa0e478bce246793893e488f37ee90c9b00a1a) Thanks [@gerardopar](https://github.com/gerardopar)! - Add campaign test-to-me and paced audience notification dispatch, ANNOUNCEMENT metadata, delivery acknowledgement bookkeeping, and retry-safe inbox deduplication.

    Deploy lca-api's enum and campaign deduplication support before enabling brain-service dispatch. Push retains the existing best-effort delivery behavior.

- [#1952](https://github.com/learningeconomy/LearnCard/pull/1952) [`6404c1106a5b9b35c3f6ee34d021b0b596f334fd`](https://github.com/learningeconomy/LearnCard/commit/6404c1106a5b9b35c3f6ee34d021b0b596f334fd) Thanks [@Custard7](https://github.com/Custard7)! - lca-api: when `ESCROW_ENCLAVE_MODE=remote` but `ESCROW_ENCLAVE_REMOTE_URL`/`ESCROW_ENCLAVE_REMOTE_TOKEN` is missing, log a distinctive error once per container (cold start included, values never logged) and emit `LearnCard/Escrow EnclaveFailure` with `Reason=remote_config_missing`. Smoketests probe `/api/keys/escrow/attestation` on staging and production. Canary docs: both environments use the 7-day hold (`tier3_hold_duration_ms` now validated), observed drill timings, rollout record.

- [#1925](https://github.com/learningeconomy/LearnCard/pull/1925) [`13e0809239cd73c5153a3ff82b268afb21b665b2`](https://github.com/learningeconomy/LearnCard/commit/13e0809239cd73c5153a3ff82b268afb21b665b2) Thanks [@Custard7](https://github.com/Custard7)! - Let the escrow enclave's own recovery emails (code, recovery started, release warning) carry the app's brand. The owner's device seals a display name into the escrow blob at enrollment (`recoveryBrand`), the same way it seals the recovery email and language. This needs the brand-aware enclave image, and stays off until a tenant turns it on (SECURITY.md D21).

    - **sss-key-manager:** new optional `escrow.emailBrand`. It is sealed as `recoveryBrand` only when the recovery contact is sealed (nitro enroll/replace), never on a carry. `createSSSStrategy` throws if the value is invalid. New export `canonicalEscrowEmailBrand` (ASCII letters, digits, space, `-`, `'`, `&`; 1-32 characters, starting with a letter; at most 3 digits in total and no `http`/`www`), plus `MAX_ESCROW_EMAIL_BRAND_LENGTH` and `MAX_ESCROW_EMAIL_BRAND_DIGITS`. `EscrowBlobPlaintext` gains `recoveryBrand?`. The blob and release parsers keep a valid brand and drop an invalid one without failing; before this change they dropped the field entirely. `violatesCarryContactRule` also flags a target that claims a brand.
    - **learn-card-base:** new tenant config flag `auth.sss.escrowSealEmailBrand` (default false). When it is on, `getEscrowStrategyConfig(sss, { appBrandName })` forwards the canonical app name as `emailBrand`. An invalid name is logged and omitted, and escrow stays enabled. `getEscrowEmailSender` now returns `mixed`, which is true when this app seals its brand. New optional `auth.sss.escrowSharedEmailBrands` (the other apps sharing this app's DIDs): with sealing on, an app whose fallback brand is its own (LearnCard) gets a `shared` note naming them, since a shared DID's brand is "last writer wins". New `getTenantEscrowStrategyConfig(sss, tenant)`, used by both apps' `sss` factories, forwards `branding.name`.
    - **learn-card-app:** passes `branding.name` through `getTenantEscrowStrategyConfig`. While sealing is on, the recovery screens say the code and updates may come from either brand, or, in LearnCard, from VetPass if the user also uses it (4 new keys in each of the 4 locales).
    - **lca-api:** no code change. The software enclave now keeps the sealed brand through carry and rewrap because it uses the updated parser (covered by a test).

- [#1945](https://github.com/learningeconomy/LearnCard/pull/1945) [`fea9c25ec76f230944a1713500a280c80e2a9cc0`](https://github.com/learningeconomy/LearnCard/commit/fea9c25ec76f230944a1713500a280c80e2a9cc0) Thanks [@smurflo2](https://github.com/smurflo2)! - Enforce current profile age rules in analytics preferences and keep optional telemetry off until account and tenant permission resolve. Retire SDK sessions on opt-out without replaying queued data, while preserving necessary security error reporting.

    Keep ordinary preferences available during profile-authority outages without erasing saved analytics consent. Share session-bound preference reads, preserve legacy ISO birth-date formats and avoid initializing web Firebase merely to disable collection.

    Report unavailable analytics opt-in instead of silently accepting it, keep age-enforced reads available when a repair cannot be saved, and ensure preference writes target the newly selected account.

    Use checked-in Lambda stage configuration for the profile authority URL instead of forwarding stale deployment-environment values as secrets.

    Normalize the shared Brain URL for login-email locale lookups and preserve onboarding AI and bug-report choices when analytics authority is unavailable. Keep the Firebase logger import independent of the wallet barrel.

- [#1972](https://github.com/learningeconomy/LearnCard/pull/1972) [`bccffa77515a9c9d17225b7296d252bd144b3b51`](https://github.com/learningeconomy/LearnCard/commit/bccffa77515a9c9d17225b7296d252bd144b3b51) Thanks [@Custard7](https://github.com/Custard7)! - lca-api Lambdas no longer cache a failed cold start. If startup work (WASM load, Mongo index setup) fails, only the requests waiting on it fail and the next request retries, instead of the container returning errors until it is recycled.

- [#1973](https://github.com/learningeconomy/LearnCard/pull/1973) [`15931126d1cae3ff52684f3b16b5c6b6336f62ac`](https://github.com/learningeconomy/LearnCard/commit/15931126d1cae3ff52684f3b16b5c6b6336f62ac) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Isolate escrow index migration failures from unrelated API startup, retain fail-closed escrow writes, and log operation-specific Mongo diagnostics without duplicate-key identity values.

- [#1925](https://github.com/learningeconomy/LearnCard/pull/1925) [`13e0809239cd73c5153a3ff82b268afb21b665b2`](https://github.com/learningeconomy/LearnCard/commit/13e0809239cd73c5153a3ff82b268afb21b665b2) Thanks [@Custard7](https://github.com/Custard7)! - Prepare VetPass to use escrow recovery on LearnCard's escrow enclave. The enclave serves one tenant: it signs and checks its own authority tenant label (`learncard`). Before this change VetPass sent its app tenant (`vetpass`) instead, so its first authority-state read failed.

    - **sss-key-manager:** new optional `escrow.authorityTenant`, used for everything the enclave signs or checks (intent tenant, authority state, hold and code-delivery records, persisted recovery expectations). `tenantId` is still sent as `X-Tenant-Id` and used for branding. It defaults to `tenantId`, so LearnCard and ScoutPass behave as before. If signed evidence carries another label, the client throws the new `EscrowAuthorityTenantMismatchError` (a subclass of `EscrowEvidenceError` that names both labels) before rotating shares or taking any recovery step. A malformed label throws in `createSSSStrategy`.
    - **learn-card-base:** new tenant config field `auth.sss.escrowAuthorityTenant` (validated), forwarded with the escrow trust policy by `getEscrowStrategyConfig`. Also adds the helpers `getEscrowAuthorityTenant`, `escrowAuthorityBrandName`, `getEscrowEmailSenderBrand` and `getEscrowEmailSender` (compares the app's `branding.name` with the enclave brand).
    - **lca-api:** checks escrow intents and authority state against the new `ESCROW_AUTHORITY_TENANT` setting (default `learncard`, so no infrastructure change), not the client-supplied `X-Tenant-Id`. It also refuses an enroll when the authority state it reads carries a different tenant. Holds, emails and links still use the app tenant. The default is global, so the ScoutPass deployment (escrow off) must set its own value before it turns escrow on.
    - **learn-card-app:** no VetPass config change: VetPass escrow stays off at every stage until the SSS switch turns it on together with LearnCard production. A new test keeps it off until then, and afterwards fails if VetPass and LearnCard differ in key derivation, escrow mode, pins or authority tenant at any deployed stage. When the enclave's email brand differs from the app's, the recovery screens explain that the code and some other emails come from LearnCard (4 locales).
    - **escrow-canary:** tier 3 reports any `EscrowEvidenceError` subclass, including the new tenant mismatch, as `evidence` rather than `unexpected`.

- [#1971](https://github.com/learningeconomy/LearnCard/pull/1971) [`03e81d9908d3ba9eae473103ead4fff6099b7f02`](https://github.com/learningeconomy/LearnCard/commit/03e81d9908d3ba9eae473103ead4fff6099b7f02) Thanks [@Custard7](https://github.com/Custard7)! - Web3Auth sign-in now checks which method the account signs in with before deriving a key. If the account uses SSS and this login would derive a different key, sign-in stops and asks the user to update the app instead of creating a different, empty identity. Accounts migrated from Web3Auth keep signing in with Web3Auth through the login they migrated with: lca-api records that login at `/keys/migrate` (`web3AuthLogin`, only when it is the account's sole login) and reports `isWeb3AuthLogin` from `/keys/auth-share`. Migrations from before this change have no recorded login and are stopped on Web3Auth builds.

- Updated dependencies [[`e9d738eea3b477dbd82bde171d3c5f8ffa2efbc5`](https://github.com/learningeconomy/LearnCard/commit/e9d738eea3b477dbd82bde171d3c5f8ffa2efbc5), [`69b80366c48e0f458b3bb50f25166c90ecaa2d6d`](https://github.com/learningeconomy/LearnCard/commit/69b80366c48e0f458b3bb50f25166c90ecaa2d6d), [`69b80366c48e0f458b3bb50f25166c90ecaa2d6d`](https://github.com/learningeconomy/LearnCard/commit/69b80366c48e0f458b3bb50f25166c90ecaa2d6d), [`0caa0e478bce246793893e488f37ee90c9b00a1a`](https://github.com/learningeconomy/LearnCard/commit/0caa0e478bce246793893e488f37ee90c9b00a1a), [`13e0809239cd73c5153a3ff82b268afb21b665b2`](https://github.com/learningeconomy/LearnCard/commit/13e0809239cd73c5153a3ff82b268afb21b665b2), [`fea9c25ec76f230944a1713500a280c80e2a9cc0`](https://github.com/learningeconomy/LearnCard/commit/fea9c25ec76f230944a1713500a280c80e2a9cc0), [`bde3fe0f15a780d9fafc699096a9a0307502f529`](https://github.com/learningeconomy/LearnCard/commit/bde3fe0f15a780d9fafc699096a9a0307502f529), [`784f0c9b346a5f7e4e2c618a9b976dcaa90fafe3`](https://github.com/learningeconomy/LearnCard/commit/784f0c9b346a5f7e4e2c618a9b976dcaa90fafe3), [`751579d9c14116dbf6d0e7f7d62f489c81c39db2`](https://github.com/learningeconomy/LearnCard/commit/751579d9c14116dbf6d0e7f7d62f489c81c39db2), [`2c60b1a760958cbfe2525bc951d2381332e1aa48`](https://github.com/learningeconomy/LearnCard/commit/2c60b1a760958cbfe2525bc951d2381332e1aa48), [`4caf6a99c7a204d7f211737190d85eeebe736eb0`](https://github.com/learningeconomy/LearnCard/commit/4caf6a99c7a204d7f211737190d85eeebe736eb0), [`13e0809239cd73c5153a3ff82b268afb21b665b2`](https://github.com/learningeconomy/LearnCard/commit/13e0809239cd73c5153a3ff82b268afb21b665b2)]:
    - @learncard/types@6.0.0
    - @learncard/email-templates@1.3.0
    - @learncard/sss-key-manager@0.3.0
    - @learncard/helpers@1.8.0
    - @learncard/core@9.4.44
    - @learncard/init@2.5.10
    - @learncard/did-web-plugin@1.1.44
    - @learncard/didkit-plugin@1.10.10
    - @learncard/didkit-plugin-node@0.3.10

## 1.6.3

### Patch Changes

- [#1923](https://github.com/learningeconomy/LearnCard/pull/1923) [`27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6`](https://github.com/learningeconomy/LearnCard/commit/27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6) Thanks [@Custard7](https://github.com/Custard7)! - PIN sign-in: wrong PIN entries made during the same sign-in on the same device are now treated as the user's own typos (own-typos rule, approved). They no longer trigger the "someone may have tried your PIN" warning, and they no longer block the same-PIN budget refresh. Only wrong entries recorded before the sign-in started, or entries from anywhere else during it, still count. The coordinator records the PIN status when the flow starts, counts its own mismatch responses, and passes both to the strategy (`input.pinAttempts`). The strategy refreshes the PIN only when nothing was recorded before the flow and every status read shows exactly the flow's own entries. lca-api now accepts a non-zero `expectedPinCharges.wrongAttempts`, but still writes only while the PIN shows exactly those charges, so a foreign entry that lands at any point still blocks the refresh. A flow is bound to one PIN generation and ends at any sign-in, and lca-api answers "Incorrect PIN." only for a wrong entry it actually recorded (otherwise CONFLICT). Sign-up now requires a recovery PIN ("Create your PIN": "You'll use it to sign in on new devices."), but it fails open. The step is skipped when escrow is not confirmed available in time. A save that errors or hangs (30s deadline) shows the error and allows a retry, and "Skip for now" appears from the second failed save (the announced error then says so, and focus returns to the PIN boxes); that skip writes no prompt flag, so the first-time PIN prompt asks again on a later start.

    App copy and layout: the new-device PIN screen is now "Confirm it's you" ("Enter your 6-digit PIN to finish signing in."), without the tinted panel behind the PIN boxes, with "Other ways to confirm", "Approve from another device", "Show N more", and one quiet "Trouble signing in?" link to the 7-day path (accounts without a PIN keep their existing screen). The post-PIN-sign-in sheet replaces its yes/no question with "You're signed in" / "Done" plus a quiet "Lost a device? Secure your account" link, or, when wrong entries other than the user's own typos are recorded, an amber "Someone may have tried your PIN" warning leading with "Choose a new PIN" (with "Not now"). Account Recovery settings replace the boxed "Signed in somewhere you don't recognize?" card with a quiet "Sign out of other devices" row under "Security" at the end, marked with an amber dot while wrong PIN entries other than the user's excused own typos are recorded against the current PIN (`ready.escrowPinAttention`); the secure flow's confirm screen keeps the full explanation, now uses a red destructive button, and focuses Cancel first. Translated into es, fr and ar.

- Updated dependencies [[`27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6`](https://github.com/learningeconomy/LearnCard/commit/27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6)]:
    - @learncard/sss-key-manager@0.2.7
    - @learncard/types@5.24.2
    - @learncard/core@9.4.43
    - @learncard/helpers@1.7.3
    - @learncard/init@2.5.9
    - @learncard/did-web-plugin@1.1.43
    - @learncard/didkit-plugin@1.10.9
    - @learncard/didkit-plugin-node@0.3.9

## 1.6.2

### Patch Changes

- [#1905](https://github.com/learningeconomy/LearnCard/pull/1905) [`c20460f6fef685272227f506f536b6811f90b8a0`](https://github.com/learningeconomy/LearnCard/commit/c20460f6fef685272227f506f536b6811f90b8a0) Thanks [@Custard7](https://github.com/Custard7)! - Make the recovery PIN the main way to sign in on a new device, without resetting the account. A PIN sign-in now keeps the account's shares, history, recovery methods and escrow: the device stores the released recovery piece at the current version and re-sets the same PIN for a fresh attempt budget only when no wrong entry is recorded against it; otherwise the PIN keeps its reduced budget and the app asks for a new, different PIN (refusing the PIN just used, also after a restart on that device, via a tag keyed by the account key), asking again on each app start until one is chosen; the same-PIN refresh is skipped when another charge landed during the release, and lca-api writes it only while the PIN still shows the charges the client saw (`expectedPinCharges`) (a lost login is linked with the new `POST /keys/recovery-session/pin-sign-in`, accepted only after a PIN release). The server emails the account's verified addresses on every PIN sign-in ("New device signed in with your PIN. Not you? Secure your account."), and the PIN status reports earlier wrong entries. The app leads its recovery screen with PIN entry (no sign-out warnings on that path; the 7-day hold keeps them), asks once after signing in whether a device was lost or the PIN is known to someone else (warning about earlier wrong entries), and adds "Secure my account" / "Sign out of all other devices" (`POST /keys/revoke-other-devices`), reachable from that question, Account Recovery settings and the email link `/account/secure`. That action re-splits the key, purges older versions and unlinks every login except the current one; it does not change the key itself, so a device that is already signed in may keep working until it signs out (the app says so). The revoke emails the account's contact and verified recovery addresses (new `account-secured` template, written for an owner who did not do it and may have lost their login: it says the recovery methods were reset and points to the tenant's support address, or to the organization when there is none). Every recovery token (recovery-email code, phrase, passkey, backup, waiting-period hold and PIN) is now bound to an account security epoch that every revoke and wiping rebind advances, so no token minted before one can rebind or re-link after it. Recovery is one-at-a-time: the coordinator rejects a second recovery while one is pending (`RecoveryInProgressError`; after a cancel, a new recovery-email code can be requested at once) and the app disables switching methods while a PIN sign-in is in flight. `@learncard/email-templates` omits an absent `locale` rather than passing `undefined` (`exactOptionalPropertyTypes`-safe) and exports each template from one declaration.

- Updated dependencies [[`372c1431e78a9708454f9c4c2f2c99dd5486b8e9`](https://github.com/learningeconomy/LearnCard/commit/372c1431e78a9708454f9c4c2f2c99dd5486b8e9), [`c20460f6fef685272227f506f536b6811f90b8a0`](https://github.com/learningeconomy/LearnCard/commit/c20460f6fef685272227f506f536b6811f90b8a0)]:
    - @learncard/sss-key-manager@0.2.6
    - @learncard/types@5.24.1
    - @learncard/email-templates@1.2.2
    - @learncard/core@9.4.42
    - @learncard/helpers@1.7.2
    - @learncard/init@2.5.8
    - @learncard/did-web-plugin@1.1.42
    - @learncard/didkit-plugin@1.10.8
    - @learncard/didkit-plugin-node@0.3.8

## 1.6.1

### Patch Changes

- [#1850](https://github.com/learningeconomy/LearnCard/pull/1850) [`578e831f41bc762ff12e5ad9be6ba765f2bed33d`](https://github.com/learningeconomy/LearnCard/commit/578e831f41bc762ff12e5ad9be6ba765f2bed33d) Thanks [@Custard7](https://github.com/Custard7)! - Keep provisional Web3Auth migrations that have a confirmed escrow enrollment out of the 30-day purge of abandoned migrations, so users who skip the recovery PIN don't lose escrow.

- [#1859](https://github.com/learningeconomy/LearnCard/pull/1859) [`b20b375870032c22ea9109d2b102ddbc4a4f3248`](https://github.com/learningeconomy/LearnCard/commit/b20b375870032c22ea9109d2b102ddbc4a4f3248) Thanks [@goblincore](https://github.com/goblincore)! - Use a unique final sort key for escrow reminder, start-notification and cancellation queues so equal-priority records form predictable batches.

- Updated dependencies [[`b0c7891371fa621a1c2c4a419a1d4f330ed2993a`](https://github.com/learningeconomy/LearnCard/commit/b0c7891371fa621a1c2c4a419a1d4f330ed2993a), [`4ec92c41442b56341c1205e6ddd6ae784aecc990`](https://github.com/learningeconomy/LearnCard/commit/4ec92c41442b56341c1205e6ddd6ae784aecc990)]:
    - @learncard/sss-key-manager@0.2.5
    - @learncard/didkit-plugin@1.10.7
    - @learncard/init@2.5.7
    - @learncard/didkit-plugin-node@0.3.7

## 1.6.0

### Minor Changes

- [#1684](https://github.com/learningeconomy/LearnCard/pull/1684) [`c836310bafa663a4b18db3525b03c720f5b60117`](https://github.com/learningeconomy/LearnCard/commit/c836310bafa663a4b18db3525b03c720f5b60117) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Move LCA boost and skill generation to Bedrock through the OpenAI Responses SDK, using GPT-6.1 Sol for boost copy and skills and GPT-6 Luna for icon mapping. Deployment requires Bedrock access for the Lambda execution role; text generation no longer uses OPENAI_API_KEY. Image generation also moves to Bedrock (Stable Image Core `stability.stable-image-core-v1:1` in us-west-2) by default, with DALL-E only as an explicit `IMAGE_PROVIDER=openai` fallback.

### Patch Changes

- [#1829](https://github.com/learningeconomy/LearnCard/pull/1829) [`1a9678c68da326853c3a3baccbd90f3a8c342bb1`](https://github.com/learningeconomy/LearnCard/commit/1a9678c68da326853c3a3baccbd90f3a8c342bb1) Thanks [@Custard7](https://github.com/Custard7)! - Pin the production escrow enclave CA for `escrow-enclave.production.internal`, so the remote enclave transport can reach production over PrivateLink once escrow is enabled there. Escrow stays off in production until `ESCROW_ENCLAVE_MODE` is set.

- [#1684](https://github.com/learningeconomy/LearnCard/pull/1684) [`c836310bafa663a4b18db3525b03c720f5b60117`](https://github.com/learningeconomy/LearnCard/commit/c836310bafa663a4b18db3525b03c720f5b60117) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Generate images with Amazon Bedrock Stable Image Core by default, preserving the image URL API. DALL-E remains available as an explicit IMAGE_PROVIDER=openai fallback, which is now the only use of OPENAI_API_KEY.

    Image failures now log a sanitized `image_generation_failure` record (no prompt, provider message or credentials), map Bedrock throttling/quota errors (including HTTP 400 ServiceQuotaExceededException) to 429, unavailable and timeouts to 503 and content-filter rejections to 400, and retry throttling at most twice with jitter inside the deadline.

- [#1827](https://github.com/learningeconomy/LearnCard/pull/1827) [`11f18bde5808075df401e17d2b3cc40a0cdbdac7`](https://github.com/learningeconomy/LearnCard/commit/11f18bde5808075df401e17d2b3cc40a0cdbdac7) Thanks [@leif-squeak](https://github.com/apps/leif-squeak)! - Upgrade the pinned `zod` dependency to 4.6.6 to pick up the upstream security fix.

- Updated dependencies [[`4fae096473fd0824be1dd6aefb4a783062377104`](https://github.com/learningeconomy/LearnCard/commit/4fae096473fd0824be1dd6aefb4a783062377104), [`4fae096473fd0824be1dd6aefb4a783062377104`](https://github.com/learningeconomy/LearnCard/commit/4fae096473fd0824be1dd6aefb4a783062377104), [`d93c1b15856f341b4bd36415bf39052de9b6b198`](https://github.com/learningeconomy/LearnCard/commit/d93c1b15856f341b4bd36415bf39052de9b6b198), [`d1708a1ce43f052862fedda2cf0d922a71ad1762`](https://github.com/learningeconomy/LearnCard/commit/d1708a1ce43f052862fedda2cf0d922a71ad1762), [`11f18bde5808075df401e17d2b3cc40a0cdbdac7`](https://github.com/learningeconomy/LearnCard/commit/11f18bde5808075df401e17d2b3cc40a0cdbdac7)]:
    - @learncard/types@5.24.0
    - @learncard/didkit-plugin@1.10.6
    - @learncard/helpers@1.7.1
    - @learncard/core@9.4.41
    - @learncard/init@2.5.6
    - @learncard/did-web-plugin@1.1.41
    - @learncard/didkit-plugin-node@0.3.6
    - @learncard/sss-key-manager@0.2.4

## 1.5.3

### Patch Changes

- [#1727](https://github.com/learningeconomy/LearnCard/pull/1727) [`bf329d9fb188f32fa715bfc7200397030ec9b385`](https://github.com/learningeconomy/LearnCard/commit/bf329d9fb188f32fa715bfc7200397030ec9b385) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Batch skill icon generation to fit request limits. `ai.generateSkillIcons` now rejects requests over 100 names or 2,500 total characters with BAD_REQUEST, and clients split large skill frameworks into batches under those limits.

    `@learncard/lca-api-client` now caps batched GET URLs at 8,192 characters (`maxURLLength`), so concurrent queries like those icon batches are sent as separate requests instead of being merged into one URL that API Gateway rejects with HTTP 431.

- Updated dependencies [[`bf329d9fb188f32fa715bfc7200397030ec9b385`](https://github.com/learningeconomy/LearnCard/commit/bf329d9fb188f32fa715bfc7200397030ec9b385), [`3231ed0b37d9af8c8e49c17f89b62778aec34f5c`](https://github.com/learningeconomy/LearnCard/commit/3231ed0b37d9af8c8e49c17f89b62778aec34f5c)]:
    - @learncard/types@5.23.2
    - @learncard/helpers@1.7.0
    - @learncard/core@9.4.40
    - @learncard/init@2.5.5
    - @learncard/did-web-plugin@1.1.40
    - @learncard/didkit-plugin@1.10.5
    - @learncard/didkit-plugin-node@0.3.5
    - @learncard/sss-key-manager@0.2.3

## 1.5.2

### Patch Changes

- Updated dependencies [[`9018e3173393f2ec9645286edd99bb80aa3b2c6c`](https://github.com/learningeconomy/LearnCard/commit/9018e3173393f2ec9645286edd99bb80aa3b2c6c)]:
    - @learncard/types@5.23.1
    - @learncard/core@9.4.39
    - @learncard/helpers@1.6.3
    - @learncard/init@2.5.4
    - @learncard/did-web-plugin@1.1.39
    - @learncard/didkit-plugin@1.10.4
    - @learncard/didkit-plugin-node@0.3.4
    - @learncard/sss-key-manager@0.2.2

## 1.5.1

### Patch Changes

- [#1711](https://github.com/learningeconomy/LearnCard/pull/1711) [`63ded61d2b1b81ce1c8ad7b9415510da5e4c24ae`](https://github.com/learningeconomy/LearnCard/commit/63ded61d2b1b81ce1c8ad7b9415510da5e4c24ae) Thanks [@goblincore](https://github.com/goblincore)! - Exclude bundled service configuration from published service dependencies so public packages do not require the private service-config workspace package during installation. Keep runtime workspace dependencies for source-based service deployments.

- Updated dependencies []:
    - @learncard/init@2.5.3

## 1.5.0

### Minor Changes

- [#1589](https://github.com/learningeconomy/LearnCard/pull/1589) [`599f048b082d2ee64775f7a0ef972e171b8c2a8a`](https://github.com/learningeconomy/LearnCard/commit/599f048b082d2ee64775f7a0ef972e171b8c2a8a) Thanks [@Custard7](https://github.com/Custard7)! - Add Keycloak token verification (`verifyKeycloakToken`) using `jose`: exact issuer allowlist, `aud`/`azp` client allowlist, ID/Bearer token-type check, and required `email_verified` / `phone_number_verified` claims. Configured with `KEYCLOAK_ISSUERS`, `KEYCLOAK_AUDIENCES`, and optional `KEYCLOAK_JWKS_URL_OVERRIDES`. Disabled (rejects all tokens) until issuers are configured.

- [#1429](https://github.com/learningeconomy/LearnCard/pull/1429) [`1387cd0a08fa6b0a706c86a5a0376b6c7d706856`](https://github.com/learningeconomy/LearnCard/commit/1387cd0a08fa6b0a706c86a5a0376b6c7d706856) Thanks [@Custard7](https://github.com/Custard7)! - Add a trusted-service `ensureManagedSigningAuthority` route (`POST /signing-authority/managed`) that returns or creates a named signing authority for an owner DID through the standard encrypted-seed path. Brain service now provisions app signing authorities through this route instead of writing plaintext seeds to the LCA API database.

- [#1592](https://github.com/learningeconomy/LearnCard/pull/1592) [`1f1ff54118a5d08c97f57696ca45671f0ee982b8`](https://github.com/learningeconomy/LearnCard/commit/1f1ff54118a5d08c97f57696ca45671f0ee982b8) Thanks [@Custard7](https://github.com/Custard7)! - Add the lca-api OIDC identity provider with RS256 signing, permanent UUID subjects,
  single-use login tickets, authorization codes and opaque access tokens. The
  `auth.requestLoginTicket` and `auth.requestSocialLoginTicket` routes verify email
  codes or native Google/Apple proofs. Keycloak brokers the redirect flow without
  an additional login form. Includes Docker/Lambda wiring, a development broker
  fixture and protocol tests. Phone OTP and full live broker round-trip CI remain deferred.

### Patch Changes

- [#1621](https://github.com/learningeconomy/LearnCard/pull/1621) [`d7ca528898d988c65f0dc7084cfdcd41767648c5`](https://github.com/learningeconomy/LearnCard/commit/d7ca528898d988c65f0dc7084cfdcd41767648c5) Thanks [@Custard7](https://github.com/Custard7)! - Add remote enclave backend, hold notifications, cancel links, reminders, and kill switch for escrow recovery.

- [#1679](https://github.com/learningeconomy/LearnCard/pull/1679) [`77e5b0681f5567caa446da57a1746d148ffde27a`](https://github.com/learningeconomy/LearnCard/commit/77e5b0681f5567caa446da57a1746d148ffde27a) Thanks [@Custard7](https://github.com/Custard7)! - Catch module-load index creation failures so a Mongo connect that outlives a frozen Lambda invocation no longer crashes the next request (seen as a 500 on `/oidc/authorize` during Keycloak sign-in).

- [#1670](https://github.com/learningeconomy/LearnCard/pull/1670) [`7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2`](https://github.com/learningeconomy/LearnCard/commit/7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2) Thanks [@Custard7](https://github.com/Custard7)! - Honor CONFIG_STAGE in serverless-offline without implicitly applying a deployed stage's configuration during local startup.

- [#1662](https://github.com/learningeconomy/LearnCard/pull/1662) [`aef0f8cfdef94170104d2179fb04759c8dae7162`](https://github.com/learningeconomy/LearnCard/commit/aef0f8cfdef94170104d2179fb04759c8dae7162) Thanks [@Custard7](https://github.com/Custard7)! - Load deployed OIDC signing keys from Secrets Manager with retryable per-process caching instead of storing private JWKs in Lambda environment variables.

- [#1670](https://github.com/learningeconomy/LearnCard/pull/1670) [`7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2`](https://github.com/learningeconomy/LearnCard/commit/7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2) Thanks [@Custard7](https://github.com/Custard7)! - Document the layered backend configuration model: schema defaults, checked-in non-secret per-stage config files, the Lambda runtime AWS secrets bundle, and real environment variables, plus the Infisical → AWS sync and per-stage cutover.

- [#1670](https://github.com/learningeconomy/LearnCard/pull/1670) [`7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2`](https://github.com/learningeconomy/LearnCard/commit/7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2) Thanks [@Custard7](https://github.com/Custard7)! - Select backend stage files by tenant as well as stage. `CONFIG_TENANT=scouts` loads `config.scouts.<stage>.json` (generated from the live ScoutPass Lambdas), so ScoutPass deployments no longer inherit LearnCard domains, trust settings or seed-encryption flags; a named tenant without a stage file fails closed. `ESCROW_ENCLAVE_MODE` is now forwarded in runtime-secrets bundle mode too.

- [#1664](https://github.com/learningeconomy/LearnCard/pull/1664) [`4a237f41ea4ab0d3bd69f2066039518fdec20984`](https://github.com/learningeconomy/LearnCard/commit/4a237f41ea4ab0d3bd69f2066039518fdec20984) Thanks [@Custard7](https://github.com/Custard7)! - Load optional per-stage runtime secrets before Lambda initialization and scope authentication environment settings by function to avoid Lambda's 4KB limit. Preserve the Firebase environment fallback for stages without a bundle.

- Updated dependencies [[`6209da80c52ac056a7644dab14669192740c9dad`](https://github.com/learningeconomy/LearnCard/commit/6209da80c52ac056a7644dab14669192740c9dad), [`5890451789b18afee45dc5ecbab3fa30aa90f085`](https://github.com/learningeconomy/LearnCard/commit/5890451789b18afee45dc5ecbab3fa30aa90f085), [`1387cd0a08fa6b0a706c86a5a0376b6c7d706856`](https://github.com/learningeconomy/LearnCard/commit/1387cd0a08fa6b0a706c86a5a0376b6c7d706856), [`d7ca528898d988c65f0dc7084cfdcd41767648c5`](https://github.com/learningeconomy/LearnCard/commit/d7ca528898d988c65f0dc7084cfdcd41767648c5), [`d7ca528898d988c65f0dc7084cfdcd41767648c5`](https://github.com/learningeconomy/LearnCard/commit/d7ca528898d988c65f0dc7084cfdcd41767648c5), [`d7ca528898d988c65f0dc7084cfdcd41767648c5`](https://github.com/learningeconomy/LearnCard/commit/d7ca528898d988c65f0dc7084cfdcd41767648c5), [`8f3bc66ab3d3e5e1edb3fbf5f362025875a914ba`](https://github.com/learningeconomy/LearnCard/commit/8f3bc66ab3d3e5e1edb3fbf5f362025875a914ba), [`1387cd0a08fa6b0a706c86a5a0376b6c7d706856`](https://github.com/learningeconomy/LearnCard/commit/1387cd0a08fa6b0a706c86a5a0376b6c7d706856), [`267cf40291b3a63caf178857be0e57feaf5e0948`](https://github.com/learningeconomy/LearnCard/commit/267cf40291b3a63caf178857be0e57feaf5e0948), [`7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2`](https://github.com/learningeconomy/LearnCard/commit/7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2), [`c78c982f9f4911f1ca2973380f19d80db775e012`](https://github.com/learningeconomy/LearnCard/commit/c78c982f9f4911f1ca2973380f19d80db775e012), [`590adf48867d6c6fd504e66a11c9827d5102122d`](https://github.com/learningeconomy/LearnCard/commit/590adf48867d6c6fd504e66a11c9827d5102122d)]:
    - @learncard/types@5.23.0
    - @learncard/email-templates@1.2.1
    - @learncard/sss-key-manager@0.2.1
    - @learncard/service-config@0.1.1
    - @learncard/didkit-plugin@1.10.3
    - @learncard/core@9.4.38
    - @learncard/helpers@1.6.2
    - @learncard/init@2.5.2
    - @learncard/did-web-plugin@1.1.38
    - @learncard/didkit-plugin-node@0.3.3

## 1.4.0

### Minor Changes

- [#1565](https://github.com/learningeconomy/LearnCard/pull/1565) [`4b83aa9ee802f0d7a54adc5f053a7376fa103cdd`](https://github.com/learningeconomy/LearnCard/commit/4b83aa9ee802f0d7a54adc5f053a7376fa103cdd) Thanks [@Custard7](https://github.com/Custard7)! - Escrow PIN fast release: an optional PIN release policy on the existing escrow-recovery substrate.

    - The escrow recovery share now supports a second release policy alongside the 7-day hold: `pin`. A user who sets an optional 6-12 digit PIN can recover immediately by presenting it, instead of waiting for the hold. Custodianship is unchanged — this adds a release policy on the already-sealed blob, not a second custodial share.
    - PIN verifier lives inside the enclave-sealed envelope (`EscrowBlobPlaintext.pinVerifier`); a leaked DB alone yields nothing to brute force. Client derives the proof with Argon2id and the enclave constant-time compares.
    - 10 lifetime failed attempts locks the PIN (`EscrowPinLockedError`); the 7-day hold path is always available as a fallback. Setting/changing a PIN rotates the escrow share.
    - Carry the sealed PIN verifier across share rotations while preserving its salt and attempt counters; explicit removal and unavailable carry still enroll without a PIN.
    - New app UI: recovery PIN setup overlay after first setup (skippable), a Recovery PIN row in recovery settings (set/change/remove), and a PIN-first step in the recovery flow with fallback to the existing hold.

- [#1529](https://github.com/learningeconomy/LearnCard/pull/1529) [`0e262737aafb8248e88e05039c83a3f30be6750f`](https://github.com/learningeconomy/LearnCard/commit/0e262737aafb8248e88e05039c83a3f30be6750f) Thanks [@Custard7](https://github.com/Custard7)! - SSS prod hardening: confirmed recovery enrollment, lost-login identity rebind, and an isolated email relay.

    - Recovery methods now carry `confirmedAt` and must be proven before they count (email confirmation code, phrase challenge words, backup re-decrypt, passkey round trip). New SSS accounts are `active` immediately; web3auth migrations stay `provisional` until a method is confirmed.
    - New recovery-session flow lets a user whose sign-in identity is gone recover via a verified personal email and bind a new sign-in.
    - Email recovery shares are encrypted on the client to an isolated relay's public key; `lca-api` never sees plaintext. Provider tokens move from query strings to the `X-Auth-Token` header.
    - Sensitive key routes require a single-use DID challenge; key records are keyed by immutable provider ID.
    - `recovery-key` email template now requires `confirmationCode`.
    - Auth-share initialization requires the provider uniqueness index before inserting, preventing competing first writes from creating duplicate accounts. Existing records with missing or BSON-null auth material retain atomic update protection.
    - Automatic stale-key cleanup preserves unresolved pending shares for delayed commits; explicit device forgetting still removes them. Custom SSS storage adapters now implement `deleteDeviceShare(id?)` to remove only the selected share and its version.

### Patch Changes

- [#1601](https://github.com/learningeconomy/LearnCard/pull/1601) [`3850da277fe17d421bc055cef3cac65616b7626d`](https://github.com/learningeconomy/LearnCard/commit/3850da277fe17d421bc055cef3cac65616b7626d) Thanks [@rhen92](https://github.com/rhen92)! - fix: [LC-2207] Limit wrong code attempts on email login verification

- [#1636](https://github.com/learningeconomy/LearnCard/pull/1636) [`dab95a1313b10f0339a4284cb5dcdc2f459dcdd5`](https://github.com/learningeconomy/LearnCard/commit/dab95a1313b10f0339a4284cb5dcdc2f459dcdd5) Thanks [@Custard7](https://github.com/Custard7)! - Fix lca-api deploys failing on Lambda's 4KB environment limit: escrow variables are now attached only to the trpc/api functions, omitted when unset, and enclave settings are gated on `ESCROW_ENCLAVE_MODE`. SSS client errors now include the HTTP status code (HTTP/2 responses have an empty `statusText`).

- [#1619](https://github.com/learningeconomy/LearnCard/pull/1619) [`5639d80a9d111f8156469e6692c37ffb354d2ec7`](https://github.com/learningeconomy/LearnCard/commit/5639d80a9d111f8156469e6692c37ffb354d2ec7) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-2161] - Encrypt hosted signing-authority seeds with AWS KMS

- Updated dependencies [[`4b83aa9ee802f0d7a54adc5f053a7376fa103cdd`](https://github.com/learningeconomy/LearnCard/commit/4b83aa9ee802f0d7a54adc5f053a7376fa103cdd), [`f7b54c45cf495e14cc7b2824653c8f0a63b61660`](https://github.com/learningeconomy/LearnCard/commit/f7b54c45cf495e14cc7b2824653c8f0a63b61660), [`dab95a1313b10f0339a4284cb5dcdc2f459dcdd5`](https://github.com/learningeconomy/LearnCard/commit/dab95a1313b10f0339a4284cb5dcdc2f459dcdd5), [`b184f5552abf37a11468d435e5cea07fc35e1993`](https://github.com/learningeconomy/LearnCard/commit/b184f5552abf37a11468d435e5cea07fc35e1993), [`0e262737aafb8248e88e05039c83a3f30be6750f`](https://github.com/learningeconomy/LearnCard/commit/0e262737aafb8248e88e05039c83a3f30be6750f), [`d436c39e00994e6d8c77e7b94985a51fe1f42adb`](https://github.com/learningeconomy/LearnCard/commit/d436c39e00994e6d8c77e7b94985a51fe1f42adb)]:
    - @learncard/sss-key-manager@0.2.0
    - @learncard/types@5.22.0
    - @learncard/email-templates@1.2.0
    - @learncard/helpers@1.6.1
    - @learncard/core@9.4.37
    - @learncard/init@2.5.1
    - @learncard/did-web-plugin@1.1.37
    - @learncard/didkit-plugin@1.10.2
    - @learncard/didkit-plugin-node@0.3.2

## 1.3.2

### Patch Changes

- [#1588](https://github.com/learningeconomy/LearnCard/pull/1588) [`02ed52ec7d86b51cc45de29b4f741e596e8d7c0a`](https://github.com/learningeconomy/LearnCard/commit/02ed52ec7d86b51cc45de29b4f741e596e8d7c0a) Thanks [@goblincore](https://github.com/goblincore)! - Fix automatic email verification in local dev stacks

- Updated dependencies [[`2991bd32b03e26736239dd8e586e2f720d9bcd45`](https://github.com/learningeconomy/LearnCard/commit/2991bd32b03e26736239dd8e586e2f720d9bcd45), [`0c1bf9a8a33e6392d5fd279479d9ab4fb0449b5e`](https://github.com/learningeconomy/LearnCard/commit/0c1bf9a8a33e6392d5fd279479d9ab4fb0449b5e), [`0c1bf9a8a33e6392d5fd279479d9ab4fb0449b5e`](https://github.com/learningeconomy/LearnCard/commit/0c1bf9a8a33e6392d5fd279479d9ab4fb0449b5e), [`3174c09b97fde6f7b5251390245038cf6b7ea9ba`](https://github.com/learningeconomy/LearnCard/commit/3174c09b97fde6f7b5251390245038cf6b7ea9ba), [`928e587378b3674766cf58a8bbe1cbd4d66d3a9f`](https://github.com/learningeconomy/LearnCard/commit/928e587378b3674766cf58a8bbe1cbd4d66d3a9f), [`928e587378b3674766cf58a8bbe1cbd4d66d3a9f`](https://github.com/learningeconomy/LearnCard/commit/928e587378b3674766cf58a8bbe1cbd4d66d3a9f)]:
    - @learncard/types@5.21.0
    - @learncard/init@2.5.0
    - @learncard/helpers@1.6.0
    - @learncard/email-templates@1.1.0
    - @learncard/core@9.4.36
    - @learncard/did-web-plugin@1.1.36
    - @learncard/didkit-plugin@1.10.1
    - @learncard/didkit-plugin-node@0.3.1

## 1.3.1

### Patch Changes

- [#1566](https://github.com/learningeconomy/LearnCard/pull/1566) [`e46c302eaed8b98686d21e2f3b5d11b189567304`](https://github.com/learningeconomy/LearnCard/commit/e46c302eaed8b98686d21e2f3b5d11b189567304) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: [LC-2155] - Eliminate CertifiedBoostCredential wrapper

    Direct credentials use their signed Boost network URI for the trusted-network check.
    Plaintext sends reject mismatched Boost IDs. Encrypted signing-authority issuance
    includes all subjects and, for delegated consent AutoBoosts, the contract owner.

    Compatibility limitation: pre-signed `signedCredential` payloads (both plaintext and
    client-encrypted) are stored unchanged, without a server-generated wrapper or status
    entries. This includes plaintext credentials from older SDKs or third-party issuers
    that omit `credentialStatus`. Without embedded status entries or server-retained status
    coordinates, network revocation changes the recipient relationship only and is not
    reflected by a holder's `verifyCredential` call. Such integrations must publish their
    own signed status-list updates or use server-managed signing-authority issuance with
    a VC v2 template. Storage now warns for both plaintext and encrypted credentials when
    status metadata is missing or empty, including VC v1 issuance results.

- [#1566](https://github.com/learningeconomy/LearnCard/pull/1566) [`e46c302eaed8b98686d21e2f3b5d11b189567304`](https://github.com/learningeconomy/LearnCard/commit/e46c302eaed8b98686d21e2f3b5d11b189567304) Thanks [@gerardopar](https://github.com/gerardopar)! - Encrypt signing-authority credentials using a single snapshot of each recipient's
  X25519 keys. Keep DAG-JWE compatibility while eliminating repeated DID resolution
  and post-encryption key-ID matching.

    Carry status entries explicitly in serializable internal issuance results so copied
    or cached credentials retain revocation metadata. Reject missing internal metadata,
    and return false when persisted status JSON is malformed or fails validation.

    Report an explicit Boost-authenticity warning when credential verification fails.

- Updated dependencies [[`20b3844ddb7e649c9964308214ec4c395e9fc8db`](https://github.com/learningeconomy/LearnCard/commit/20b3844ddb7e649c9964308214ec4c395e9fc8db), [`b4f94f5a5ffbd52bad6cd26dc3dd627df8d5e6fb`](https://github.com/learningeconomy/LearnCard/commit/b4f94f5a5ffbd52bad6cd26dc3dd627df8d5e6fb), [`19bb79b1355dd9de7f71554fdb608f38b78ed6bb`](https://github.com/learningeconomy/LearnCard/commit/19bb79b1355dd9de7f71554fdb608f38b78ed6bb)]:
    - @learncard/didkit-plugin@1.10.0
    - @learncard/didkit-plugin-node@0.3.0
    - @learncard/types@5.20.0
    - @learncard/init@2.4.16
    - @learncard/core@9.4.35
    - @learncard/helpers@1.5.1
    - @learncard/did-web-plugin@1.1.35

## 1.3.0

### Minor Changes

- [#1533](https://github.com/learningeconomy/LearnCard/pull/1533) [`80d2ebf54bb5a643808f8f7d908cf68758903dce`](https://github.com/learningeconomy/LearnCard/commit/80d2ebf54bb5a643808f8f7d908cf68758903dce) Thanks [@goblincore](https://github.com/goblincore)! - Managed credential refresh (LC-2117, LC-2135, LC-2136)

    - Holder refresh through the W3C `refreshService` extension point: standard `1EdTechCredentialRefresh` signed JSON responses and a separate `LearnCardCredentialRefresh2026` encrypted, DID-authenticated managed protocol. Includes SSRF guards, proof/issuer/subject/ID/freshness validation, and typed failures. Compact VC-JWT support is deferred to LC-2195; full 1EdTech protocol conformance is not claimed. Previously issued managed QA credentials must be reissued with the new signed service type.
    - Managed issuer refresh service in brain-service: allocate-before-signing, issuer-signed and signing-authority publication, immutable holder-encrypted (JWE-only) version chain, holder-authenticated `/refresh/:refreshId` endpoint with ETag/304, history, and revocation gating.
    - In-place holder wallet replacement with encrypted previous-version history, foreground-only staleness scanning (24h default, configurable), and per-record concurrency safety.
    - Privacy-safe `CREDENTIAL_REFRESHED` notifications with materiality detection, issuer overrides, and one collapsed record per configurable delivery window.
    - App surfaces: refresh listener, Updated indicator, notification card, and previous-versions history UI; provisional-to-final CLR demo in the credential viewer.

### Patch Changes

- Updated dependencies [[`6315fa3346cf75df2c6cbabe78962a9faa408781`](https://github.com/learningeconomy/LearnCard/commit/6315fa3346cf75df2c6cbabe78962a9faa408781), [`80d2ebf54bb5a643808f8f7d908cf68758903dce`](https://github.com/learningeconomy/LearnCard/commit/80d2ebf54bb5a643808f8f7d908cf68758903dce), [`75d1816d5bbbd17772ef4c1c6b4932deacb9ccb5`](https://github.com/learningeconomy/LearnCard/commit/75d1816d5bbbd17772ef4c1c6b4932deacb9ccb5)]:
    - @learncard/types@5.19.0
    - @learncard/helpers@1.5.0
    - @learncard/init@2.4.15
    - @learncard/core@9.4.34
    - @learncard/did-web-plugin@1.1.34
    - @learncard/didkit-plugin@1.9.14
    - @learncard/didkit-plugin-node@0.2.32

## 1.2.27

### Patch Changes

- [#1534](https://github.com/learningeconomy/LearnCard/pull/1534) [`50f8d26c271d1a16240c5024402d0ea75c475a3d`](https://github.com/learningeconomy/LearnCard/commit/50f8d26c271d1a16240c5024402d0ea75c475a3d) Thanks [@goblincore](https://github.com/goblincore)! - fix: [LC-2137] Surface the original request error when auth refresh fails instead of hanging; allow `deleteProfile` with API tokens that lack `profiles:read`; retry did:web signing on `Key mismatch` after refreshing the DID document.

- [#1549](https://github.com/learningeconomy/LearnCard/pull/1549) [`9cc246bd0571b5b29c60b9dcff287c1b69e012cf`](https://github.com/learningeconomy/LearnCard/commit/9cc246bd0571b5b29c60b9dcff287c1b69e012cf) Thanks [@rhen92](https://github.com/rhen92)! - chore: [LC-2175] & [LC-2176] Fixing CodeQL alerts

    **Breaking change in @learncard/openid4vc-plugin**: `defaultMakeId` now throws if
    `crypto.getRandomValues` is unavailable (no `Math.random()` fallback). This affects
    legacy environments without Web Crypto API — modern browsers and Node.js are unaffected.

- Updated dependencies [[`55284a9b1613d46491a03d2d527b192eb2db64c9`](https://github.com/learningeconomy/LearnCard/commit/55284a9b1613d46491a03d2d527b192eb2db64c9), [`9cc246bd0571b5b29c60b9dcff287c1b69e012cf`](https://github.com/learningeconomy/LearnCard/commit/9cc246bd0571b5b29c60b9dcff287c1b69e012cf), [`55284a9b1613d46491a03d2d527b192eb2db64c9`](https://github.com/learningeconomy/LearnCard/commit/55284a9b1613d46491a03d2d527b192eb2db64c9)]:
    - @learncard/didkit-plugin@1.9.13
    - @learncard/didkit-plugin-node@0.2.31
    - @learncard/helpers@1.4.1
    - @learncard/init@2.4.14
    - @learncard/core@9.4.33
    - @learncard/did-web-plugin@1.1.33

## 1.2.26

### Patch Changes

- [#1505](https://github.com/learningeconomy/LearnCard/pull/1505) [`c7bbf6e9e5ec001d8ec2708d76295c15bc04e0cd`](https://github.com/learningeconomy/LearnCard/commit/c7bbf6e9e5ec001d8ec2708d76295c15bc04e0cd) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Standardize the Node and Bun toolchain and validate app and service environment configuration before startup.

- Updated dependencies [[`127eec62c5756b6f737028fa2e6a5e2277dc647a`](https://github.com/learningeconomy/LearnCard/commit/127eec62c5756b6f737028fa2e6a5e2277dc647a), [`c7bbf6e9e5ec001d8ec2708d76295c15bc04e0cd`](https://github.com/learningeconomy/LearnCard/commit/c7bbf6e9e5ec001d8ec2708d76295c15bc04e0cd), [`cb7aef7dfc028824e5093230c7e46d0376481e36`](https://github.com/learningeconomy/LearnCard/commit/cb7aef7dfc028824e5093230c7e46d0376481e36)]:
    - @learncard/types@5.18.3
    - @learncard/helpers@1.4.0
    - @learncard/email-templates@1.0.6
    - @learncard/didkit-plugin@1.9.12
    - @learncard/didkit-plugin-node@0.2.30
    - @learncard/core@9.4.32
    - @learncard/init@2.4.13
    - @learncard/did-web-plugin@1.1.32

## 1.2.25

### Patch Changes

- [#1501](https://github.com/learningeconomy/LearnCard/pull/1501) [`059d0869c2831deafa03244b1800aa65b46f3561`](https://github.com/learningeconomy/LearnCard/commit/059d0869c2831deafa03244b1800aa65b46f3561) Thanks [@Custard7](https://github.com/Custard7)! - fix: bump axios to ^0.33.0 to resolve Dependabot alerts (formToJSON DoS, NO_PROXY bypass, prototype pollution)

- [#1491](https://github.com/learningeconomy/LearnCard/pull/1491) [`69102b041690d8d161379ce9343c50a3dec0c50e`](https://github.com/learningeconomy/LearnCard/commit/69102b041690d8d161379ce9343c50a3dec0c50e) Thanks [@goblincore](https://github.com/goblincore)! - Prompt credential claimers and senders to create an explicit LearnCard connection, with durable and idempotent actionable notification delivery.

- [#1496](https://github.com/learningeconomy/LearnCard/pull/1496) [`93ad0e53137d9bd86d7154d68a259d6424e60d79`](https://github.com/learningeconomy/LearnCard/commit/93ad0e53137d9bd86d7154d68a259d6424e60d79) Thanks [@Custard7](https://github.com/Custard7)! - fix: move serverless-offline + @sentry/esbuild-plugin to devDependencies

- Updated dependencies [[`69102b041690d8d161379ce9343c50a3dec0c50e`](https://github.com/learningeconomy/LearnCard/commit/69102b041690d8d161379ce9343c50a3dec0c50e)]:
    - @learncard/types@5.18.2
    - @learncard/core@9.4.31
    - @learncard/init@2.4.12
    - @learncard/did-web-plugin@1.1.31
    - @learncard/didkit-plugin@1.9.11
    - @learncard/didkit-plugin-node@0.2.29

## 1.2.24

### Patch Changes

- [#1453](https://github.com/learningeconomy/LearnCard/pull/1453) [`7427cf62082e753eeeaa815f392b6fac39315575`](https://github.com/learningeconomy/LearnCard/commit/7427cf62082e753eeeaa815f392b6fac39315575) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Retire the legacy CHAPI example, MetaMask Snap projects, Discord bot, and Simple Signing service, client, and plugin.

    Managed signing authority consumers now use `@learncard/lca-api-plugin`. Replace `getSimpleSigningPlugin(learnCard, endpoint)` with `getLCAPlugin(learnCard, endpoint)`. Historical implementations remain available through Git history.

- [#1473](https://github.com/learningeconomy/LearnCard/pull/1473) [`80bce3e745d8e3dcca0e1c07337d97ec13c4b417`](https://github.com/learningeconomy/LearnCard/commit/80bce3e745d8e3dcca0e1c07337d97ec13c4b417) Thanks [@Custard7](https://github.com/Custard7)! - fix: bump @trpc/server, fastify, @fastify/static (7 high Dependabot alerts)

- Updated dependencies []:
    - @learncard/core@9.4.30
    - @learncard/init@2.4.11
    - @learncard/did-web-plugin@1.1.30
    - @learncard/didkit-plugin@1.9.10
    - @learncard/didkit-plugin-node@0.2.28

## 1.2.23

### Patch Changes

- [#1460](https://github.com/learningeconomy/LearnCard/pull/1460) [`36cc19241aa3bbe6c82a1664f967992d09176d4a`](https://github.com/learningeconomy/LearnCard/commit/36cc19241aa3bbe6c82a1664f967992d09176d4a) Thanks [@goblincore](https://github.com/goblincore)! - [LC-2073] fix(e2e): fix failing E2E tests, reduce LearnCard App Docker build memory, fix OOM error for e2e test runner

- [#1448](https://github.com/learningeconomy/LearnCard/pull/1448) [`540434989e3b0e15b9d3ca76388ca4de6730a56b`](https://github.com/learningeconomy/LearnCard/commit/540434989e3b0e15b9d3ca76388ca4de6730a56b) Thanks [@Custard7](https://github.com/Custard7)! - fix: OpenAPI base URL

- Updated dependencies [[`5489866631ce3b19709a3685c56ff68e2d817af4`](https://github.com/learningeconomy/LearnCard/commit/5489866631ce3b19709a3685c56ff68e2d817af4), [`6796b321354ca870e4dfa3606719f9882221bc1b`](https://github.com/learningeconomy/LearnCard/commit/6796b321354ca870e4dfa3606719f9882221bc1b)]:
    - @learncard/didkit-plugin@1.9.9
    - @learncard/didkit-plugin-node@0.2.27
    - @learncard/types@5.18.1
    - @learncard/init@2.4.10
    - @learncard/core@9.4.29
    - @learncard/did-web-plugin@1.1.29

## 1.2.22

### Patch Changes

- [#1312](https://github.com/learningeconomy/LearnCard/pull/1312) [`0f93889aeebd38203ec57c44ed888d25f8d75f4f`](https://github.com/learningeconomy/LearnCard/commit/0f93889aeebd38203ec57c44ed888d25f8d75f4f) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1902] Localize transactional emails + SMS (en/es/fr/ar)

- Updated dependencies [[`0f93889aeebd38203ec57c44ed888d25f8d75f4f`](https://github.com/learningeconomy/LearnCard/commit/0f93889aeebd38203ec57c44ed888d25f8d75f4f), [`660778e73161c9c185e1f6592a5ac90dd9309a0a`](https://github.com/learningeconomy/LearnCard/commit/660778e73161c9c185e1f6592a5ac90dd9309a0a), [`acf13250d6ffd39798b44f0c5b9331b3769ebd24`](https://github.com/learningeconomy/LearnCard/commit/acf13250d6ffd39798b44f0c5b9331b3769ebd24), [`f504c57823d2a978f9cec569a00c9478ea8b3158`](https://github.com/learningeconomy/LearnCard/commit/f504c57823d2a978f9cec569a00c9478ea8b3158), [`0f93889aeebd38203ec57c44ed888d25f8d75f4f`](https://github.com/learningeconomy/LearnCard/commit/0f93889aeebd38203ec57c44ed888d25f8d75f4f)]:
    - @learncard/email-templates@1.0.5
    - @learncard/types@5.18.0
    - @learncard/core@9.4.28
    - @learncard/init@2.4.9
    - @learncard/did-web-plugin@1.1.28
    - @learncard/didkit-plugin@1.9.8
    - @learncard/didkit-plugin-node@0.2.26

## 1.2.21

### Patch Changes

- Updated dependencies []:
    - @learncard/init@2.4.8

## 1.2.20

### Patch Changes

- Updated dependencies []:
    - @learncard/init@2.4.7

## 1.2.19

### Patch Changes

- [#1367](https://github.com/learningeconomy/LearnCard/pull/1367) [`f1e7b459a4650cf2fb9236369950efcaea935c3f`](https://github.com/learningeconomy/LearnCard/commit/f1e7b459a4650cf2fb9236369950efcaea935c3f) Thanks [@smurflo2](https://github.com/smurflo2)! - Revive Scouts, fix various bugs

- Updated dependencies [[`f1e7b459a4650cf2fb9236369950efcaea935c3f`](https://github.com/learningeconomy/LearnCard/commit/f1e7b459a4650cf2fb9236369950efcaea935c3f), [`c0b5edb671ba3704b44547f9d0ef99f6f0e090ba`](https://github.com/learningeconomy/LearnCard/commit/c0b5edb671ba3704b44547f9d0ef99f6f0e090ba)]:
    - @learncard/email-templates@1.0.4
    - @learncard/types@5.17.6
    - @learncard/core@9.4.27
    - @learncard/init@2.4.6
    - @learncard/did-web-plugin@1.1.27
    - @learncard/didkit-plugin@1.9.7
    - @learncard/didkit-plugin-node@0.2.25

## 1.2.18

### Patch Changes

- [`9b1f8352946f78f382f85d95c5e983d86449ea68`](https://github.com/learningeconomy/LearnCard/commit/9b1f8352946f78f382f85d95c5e983d86449ea68) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Republish package metadata with concrete internal dependency versions instead of workspace protocol ranges.

- Updated dependencies [[`9b1f8352946f78f382f85d95c5e983d86449ea68`](https://github.com/learningeconomy/LearnCard/commit/9b1f8352946f78f382f85d95c5e983d86449ea68)]:
    - @learncard/core@9.4.26
    - @learncard/init@2.4.5
    - @learncard/did-web-plugin@1.1.26
    - @learncard/didkit-plugin@1.9.6
    - @learncard/didkit-plugin-node@0.2.24

## 1.2.17

### Patch Changes

- [#1347](https://github.com/learningeconomy/LearnCard/pull/1347) [`e24c3e69e4550529d1957189ae8a4a7e0edc0b17`](https://github.com/learningeconomy/LearnCard/commit/e24c3e69e4550529d1957189ae8a4a7e0edc0b17) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add /health-check/deep: issues and verifies a test credential + presentation in-process, proving the full DIDKit crypto path (plugin load, signing, and the native plugin runtime delegation) works, and reports which DIDKit engine (native/wasm) loaded. Shallow health checks stayed green through two DIDKit outages on 2026-07-02; this endpoint makes those failure modes observable from a plain HTTP probe.

- [#1341](https://github.com/learningeconomy/LearnCard/pull/1341) [`69ef21bda3e003e83f4d842c52e037acf528af09`](https://github.com/learningeconomy/LearnCard/commit/69ef21bda3e003e83f4d842c52e037acf528af09) Thanks [@goblincore](https://github.com/goblincore)! - 🐛 Bundle DIDKit WASM into Lambda artifacts (fix staging 500s)

- [#1343](https://github.com/learningeconomy/LearnCard/pull/1343) [`8a5cd1fa2b4996ea6e3e0fafab3cec64a704b99b`](https://github.com/learningeconomy/LearnCard/commit/8a5cd1fa2b4996ea6e3e0fafab3cec64a704b99b) Thanks [@goblincore](https://github.com/goblincore)! - ✨ Ship native DIDKit to Lambda via a Layer, include its runtime DIDKit dependency, and surface DID auth VPs in service health checks.

- Updated dependencies [[`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299), [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930), [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930), [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930)]:
    - @learncard/email-templates@1.0.3
    - @learncard/core@9.4.25
    - @learncard/init@2.4.4
    - @learncard/types@5.17.5
    - @learncard/did-web-plugin@1.1.25
    - @learncard/didkit-plugin@1.9.5
    - @learncard/didkit-plugin-node@0.2.23

## 1.2.16

### Patch Changes

- Updated dependencies [[`7a60dec7c32d19b2a3120b949eadc5770926f354`](https://github.com/learningeconomy/LearnCard/commit/7a60dec7c32d19b2a3120b949eadc5770926f354), [`6bebc466925987b23008b0de2229db554035a87e`](https://github.com/learningeconomy/LearnCard/commit/6bebc466925987b23008b0de2229db554035a87e)]:
    - @learncard/types@5.17.4
    - @learncard/core@9.4.24
    - @learncard/init@2.4.3
    - @learncard/did-web-plugin@1.1.24
    - @learncard/didkit-plugin@1.9.4
    - @learncard/didkit-plugin-node@0.2.22

## 1.2.15

### Patch Changes

- Updated dependencies [[`05fc8f650d9e3348232ddc5517a5c39e94b4f52f`](https://github.com/learningeconomy/LearnCard/commit/05fc8f650d9e3348232ddc5517a5c39e94b4f52f)]:
    - @learncard/types@5.17.3
    - @learncard/core@9.4.23
    - @learncard/init@2.4.2
    - @learncard/did-web-plugin@1.1.23
    - @learncard/didkit-plugin@1.9.3
    - @learncard/didkit-plugin-node@0.2.21

## 1.2.14

### Patch Changes

- [#1317](https://github.com/learningeconomy/LearnCard/pull/1317) [`49c3f178b72adc423f10d5362af4d74dbe04f521`](https://github.com/learningeconomy/LearnCard/commit/49c3f178b72adc423f10d5362af4d74dbe04f521) Thanks [@goblincore](https://github.com/goblincore)! - fix(lca-api): bundle @learncard/init from its ESM build in Lambda esbuild (staging 500s)

- [#1310](https://github.com/learningeconomy/LearnCard/pull/1310) [`d4d0a9e8a188a64c3d9e1ebbf63cbb698888813d`](https://github.com/learningeconomy/LearnCard/commit/d4d0a9e8a188a64c3d9e1ebbf63cbb698888813d) Thanks [@smurflo2](https://github.com/smurflo2)! - New LearnCard AI contract that includes goals, skills, professional title, and work experience. Also seperate network consent contract from LearnCard AI contract

- Updated dependencies [[`ee40d1ed82a153c30425c2c2e836c56da781b1c6`](https://github.com/learningeconomy/LearnCard/commit/ee40d1ed82a153c30425c2c2e836c56da781b1c6), [`49c3f178b72adc423f10d5362af4d74dbe04f521`](https://github.com/learningeconomy/LearnCard/commit/49c3f178b72adc423f10d5362af4d74dbe04f521)]:
    - @learncard/init@2.4.1

## 1.2.13

### Patch Changes

- Updated dependencies [[`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`c749d55bec0fed881c3e488ffd90744e2eee021e`](https://github.com/learningeconomy/LearnCard/commit/c749d55bec0fed881c3e488ffd90744e2eee021e), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083)]:
    - @learncard/types@5.17.2
    - @learncard/init@2.4.0
    - @learncard/core@9.4.22
    - @learncard/did-web-plugin@1.1.22
    - @learncard/didkit-plugin@1.9.2
    - @learncard/didkit-plugin-node@0.2.20

## 1.2.12

### Patch Changes

- Updated dependencies [[`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2), [`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2)]:
    - @learncard/init@2.3.21
    - @learncard/did-web-plugin@1.1.21
    - @learncard/didkit-plugin@1.9.1
    - @learncard/types@5.17.1
    - @learncard/didkit-plugin-node@0.2.19
    - @learncard/core@9.4.21

## 1.2.11

### Patch Changes

- Updated dependencies [[`7e90089f517908562becf72eb3831e9208232278`](https://github.com/learningeconomy/LearnCard/commit/7e90089f517908562becf72eb3831e9208232278), [`406f5f64ff49aaecbf8cb499a7f6b294c7105cc3`](https://github.com/learningeconomy/LearnCard/commit/406f5f64ff49aaecbf8cb499a7f6b294c7105cc3), [`7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b`](https://github.com/learningeconomy/LearnCard/commit/7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b)]:
    - @learncard/types@5.17.0
    - @learncard/didkit-plugin@1.9.0
    - @learncard/core@9.4.20
    - @learncard/init@2.3.20
    - @learncard/did-web-plugin@1.1.20
    - @learncard/didkit-plugin-node@0.2.18

## 1.2.10

### Patch Changes

- Updated dependencies [[`3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b`](https://github.com/learningeconomy/LearnCard/commit/3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b), [`37439411ac68618fc27898ac4c0f48dbef4e424b`](https://github.com/learningeconomy/LearnCard/commit/37439411ac68618fc27898ac4c0f48dbef4e424b), [`37439411ac68618fc27898ac4c0f48dbef4e424b`](https://github.com/learningeconomy/LearnCard/commit/37439411ac68618fc27898ac4c0f48dbef4e424b)]:
    - @learncard/types@5.16.0
    - @learncard/init@2.3.19
    - @learncard/core@9.4.19
    - @learncard/did-web-plugin@1.1.19
    - @learncard/didkit-plugin@1.8.10
    - @learncard/didkit-plugin-node@0.2.17

## 1.2.9

### Patch Changes

- Updated dependencies [[`b7ac1ec2432501b112748f5285fd83a2de1de344`](https://github.com/learningeconomy/LearnCard/commit/b7ac1ec2432501b112748f5285fd83a2de1de344), [`b61cfb80e80f382b22d673e7e826fc60528161e7`](https://github.com/learningeconomy/LearnCard/commit/b61cfb80e80f382b22d673e7e826fc60528161e7), [`53b315f16688fbe74f9f01f771cb3fe6263f33b6`](https://github.com/learningeconomy/LearnCard/commit/53b315f16688fbe74f9f01f771cb3fe6263f33b6)]:
    - @learncard/init@2.3.18
    - @learncard/types@5.15.0
    - @learncard/email-templates@1.0.2
    - @learncard/core@9.4.18
    - @learncard/did-web-plugin@1.1.18
    - @learncard/didkit-plugin@1.8.9
    - @learncard/didkit-plugin-node@0.2.16

## 1.2.8

### Patch Changes

- Updated dependencies [[`81482ce6a60c9c8c8218ee51016671488a2bfeae`](https://github.com/learningeconomy/LearnCard/commit/81482ce6a60c9c8c8218ee51016671488a2bfeae)]:
    - @learncard/didkit-plugin@1.8.8
    - @learncard/init@2.3.16
    - @learncard/didkit-plugin-node@0.2.14

## 1.2.7

### Patch Changes

- [#1150](https://github.com/learningeconomy/LearnCard/pull/1150) [`66979075bf3a39fe76435f31bdc582f7f25009c0`](https://github.com/learningeconomy/LearnCard/commit/66979075bf3a39fe76435f31bdc582f7f25009c0) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps): bump the npm_and_yarn group across 3 directories with 6 updates

- Updated dependencies [[`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02), [`0327b6c9870b0c2ca359f54629df019547eb118a`](https://github.com/learningeconomy/LearnCard/commit/0327b6c9870b0c2ca359f54629df019547eb118a), [`1e35f73c3a81f1517703d673823616cfcbb5798d`](https://github.com/learningeconomy/LearnCard/commit/1e35f73c3a81f1517703d673823616cfcbb5798d), [`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02)]:
    - @learncard/types@5.14.0
    - @learncard/didkit-plugin-node@0.2.13
    - @learncard/didkit-plugin@1.8.7
    - @learncard/core@9.4.17
    - @learncard/init@2.3.15
    - @learncard/did-web-plugin@1.1.17

## 1.2.6

### Patch Changes

- [#1161](https://github.com/learningeconomy/LearnCard/pull/1161) [`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `sendAiSessionCredential` to Partner Connect SDK for recording AI tutoring sessions.

    This enables App Store embedded apps to send AI Session credentials that are automatically organized under AI Topics. The feature includes:

    - **Partner Connect SDK**: New `sendAiSessionCredential()` method with structured summary data support
    - **Backend Support**: App event handler for `send-ai-session-credential` with listing-owned boost creation
    - **AI Topic Hierarchy**: Sessions are automatically organized under a parent AI Topic per app
    - **Client-Side Storage**: Credentials are immediately stored in the user's LearnCloud wallet
    - **Example App**: Updated with working AI Session creation flow

    Apps can now record structured learning sessions with key takeaways, skills demonstrated, learning outcomes, and recommended next steps that appear in the user's AI Topics page.

- [`98edecaa4348a95b67753b084da91ee38a3813d2`](https://github.com/learningeconomy/LearnCard/commit/98edecaa4348a95b67753b084da91ee38a3813d2) Thanks [@Custard7](https://github.com/Custard7)! - feat: [LC-1749] React-Email + Tenant Branding

    Introduces git-managed, tenant-branded email and SMS templates via the new `@learncard/email-templates` package, and wires tenant-aware email delivery through `lca-api` and `brain-service`.

    ### What's new
    - **`@learncard/email-templates` (new package)** — React Email templates for every transactional email the platform sends (login OTP, recovery email code, recovery key, inbox claim, endorsement request, guardian approval, account approved, guardian credential approval, etc.). Includes an SMS renderer, a tenant registry with per-tenant branding overrides, and a local preview server (`bun --filter @learncard/email-templates run dev`).
    - **`lca-api` + `brain-service`** — PostmarkAdapter now renders templates locally with tenant branding and delivers the result as raw HTML via Postmark's `sendEmail` API. Tenant is resolved from the request in `createContext` via `resolveTenantFromRequest()` and attached as `ctx.tenant` for every route.
    - **`@learncard/sss-key-manager`** — `createSSSStrategy({ tenantId })` now forwards an `X-Tenant-Id` header on every call to `lca-api` so recovery / OTP emails are branded for the tenant the user is signed into.
    - **`learn-card-app`** — Resolves the active tenant at SSS factory time and passes it into `createSSSStrategy`, so VetPass (and any future tenant) gets branded recovery emails out of the box.

    ### Behavior changes
    - **Recovery / OTP emails are always branded.** Previously, emails fell back to unstyled plain-text when the corresponding `POSTMARK_*_TEMPLATE_ALIAS` env var was unset. The server now renders the React Email template with tenant branding on every send; unset env vars are fine.
    - **New observable request header.** The SSS client sends `X-Tenant-Id: <tenant>` on all requests to `lca-api`. Proxies, WAFs, and log pipelines may surface this.

    ### Deployment notes (self-hosters)
    - The `POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS` and `POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS` env vars are no longer required — they're pure overrides now. You can remove them from your deployment config.
    - `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS` and `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS` are likewise optional overrides; the adapter renders locally by default.
    - An optional `DEFAULT_TENANT_ID` env var is now honored as the fallback when neither `X-Tenant-Id` nor `Origin` resolves to a known tenant.
    - Existing Postmark template customizations are not used unless the corresponding env var is set. To move your branding into version control, add an entry to `TENANT_EMAIL_BRANDING` in `packages/email-templates/src/tenant-registry.ts`.

    See [Configure Tenant-Branded Emails](../docs/how-to-guides/configure-tenant-branded-emails.md) and [Tenant-Branded Emails (architecture)](../docs/core-concepts/tenant-branded-emails.md) for details.

- Updated dependencies [[`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f), [`98edecaa4348a95b67753b084da91ee38a3813d2`](https://github.com/learningeconomy/LearnCard/commit/98edecaa4348a95b67753b084da91ee38a3813d2), [`8e408e48f89db234bcb7d357787a0faf3a605488`](https://github.com/learningeconomy/LearnCard/commit/8e408e48f89db234bcb7d357787a0faf3a605488)]:
    - @learncard/types@5.13.6
    - @learncard/email-templates@1.0.1
    - @learncard/core@9.4.16
    - @learncard/init@2.3.14
    - @learncard/did-web-plugin@1.1.16
    - @learncard/didkit-plugin@1.8.6
    - @learncard/didkit-plugin-node@0.2.12

## 1.2.5

### Patch Changes

- [#1149](https://github.com/learningeconomy/LearnCard/pull/1149) [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `requestLearnerContext` support across Partner Connect, the LearnCard host, and the network stack so embedded App Store apps can request learner context for AI flows.

    This also allows `requestConsent()` to resolve the configured contract from the app listing's integration when a contract URI is not passed explicitly, and adds a request-learner-context demo app to exercise the full flow.

- Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`c38452f9678c17aa13c2f3f6d16056cc8f9c7564`](https://github.com/learningeconomy/LearnCard/commit/c38452f9678c17aa13c2f3f6d16056cc8f9c7564), [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    - @learncard/types@5.13.5
    - @learncard/core@9.4.15
    - @learncard/init@2.3.13
    - @learncard/did-web-plugin@1.1.15
    - @learncard/didkit-plugin@1.8.5
    - @learncard/didkit-plugin-node@0.2.11

## 1.2.4

### Patch Changes

- Updated dependencies [[`c68bed993c5304a667dc75d422a118858848737a`](https://github.com/learningeconomy/LearnCard/commit/c68bed993c5304a667dc75d422a118858848737a)]:
    - @learncard/types@5.13.4
    - @learncard/core@9.4.14
    - @learncard/init@2.3.12
    - @learncard/did-web-plugin@1.1.14
    - @learncard/didkit-plugin@1.8.4
    - @learncard/didkit-plugin-node@0.2.10

## 1.2.3

### Patch Changes

- Updated dependencies [[`fb6627b7fa3c4a07c83d4186619a937e6a83f369`](https://github.com/learningeconomy/LearnCard/commit/fb6627b7fa3c4a07c83d4186619a937e6a83f369)]:
    - @learncard/types@5.13.3
    - @learncard/core@9.4.13
    - @learncard/init@2.3.11
    - @learncard/did-web-plugin@1.1.13
    - @learncard/didkit-plugin@1.8.3
    - @learncard/didkit-plugin-node@0.2.9

## 1.2.2

### Patch Changes

- Updated dependencies [[`bba1f735e107d9cc86880e9f869413bc7072bff8`](https://github.com/learningeconomy/LearnCard/commit/bba1f735e107d9cc86880e9f869413bc7072bff8), [`fce9d2fd32898cfc64c59b88ca644dea3b53d1a5`](https://github.com/learningeconomy/LearnCard/commit/fce9d2fd32898cfc64c59b88ca644dea3b53d1a5)]:
    - @learncard/types@5.13.2
    - @learncard/core@9.4.12
    - @learncard/init@2.3.10
    - @learncard/did-web-plugin@1.1.12
    - @learncard/didkit-plugin@1.8.2
    - @learncard/didkit-plugin-node@0.2.8

## 1.2.1

### Patch Changes

- [#1102](https://github.com/learningeconomy/LearnCard/pull/1102) [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add "Unsubmit" feature for app store listings

    Developers can now withdraw their pending app submissions by clicking "Unsubmit" on listings in PENDING_REVIEW status. The listing returns to DRAFT status and the APP_LISTING_SUBMITTED notification is automatically deleted from admin inboxes (via a new APP_LISTING_WITHDRAWN notification type that triggers notification cleanup in LCA-API).

- [#1093](https://github.com/learningeconomy/LearnCard/pull/1093) [`6a1e0096ab35d0c98a51c6e06aea347f2a3e89c2`](https://github.com/learningeconomy/LearnCard/commit/6a1e0096ab35d0c98a51c6e06aea347f2a3e89c2) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Small dev change to not use NAPI didkit in local docker containers

- Updated dependencies [[`c83e3de987c11a6d95deec31c1fdb2401a990db2`](https://github.com/learningeconomy/LearnCard/commit/c83e3de987c11a6d95deec31c1fdb2401a990db2), [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0)]:
    - @learncard/types@5.13.1
    - @learncard/core@9.4.11
    - @learncard/init@2.3.9
    - @learncard/did-web-plugin@1.1.11
    - @learncard/didkit-plugin@1.8.1
    - @learncard/didkit-plugin-node@0.2.7

## 1.2.0

### Minor Changes

- [#986](https://github.com/learningeconomy/LearnCard/pull/986) [`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c) Thanks [@Custard7](https://github.com/Custard7)! - ### SSS Key Management & AuthCoordinator

    **New packages:**

    - `@learncard/types` — Added provider-agnostic auth and key derivation interfaces (`src/auth.ts`)
    - `@learncard/sss-key-manager` — Shamir Secret Sharing key manager replacing Web3Auth SFA

    **LCA API (`@learncard/lca-api-service`):**

    - Added SSS key management routes (`/keys/*`): store/retrieve encrypted auth shares, add/remove recovery methods (passkey, backup, phrase, email), share versioning
    - Added recovery email verification flow with 6-digit OTP codes
    - Added email backup share relay (fire-and-forget, share never persisted)
    - Added QR-based cross-device login routes (`/qr-login/*`)
    - Added contact method upgrade route for phone→email transitions
    - Added provider-agnostic delivery service abstraction (Postmark adapter + log adapter for dev)
    - Added optional Postmark template support for recovery emails (`POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS`, `POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS`) with plain-text fallback
    - Renamed `POSTMARK_LOGIN_CODE_TEMPLATE_ID` → `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS` and `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ID` → `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS`
    - Added Sentry integration for error tracking
    - Added share encryption helpers (AES-256-GCM with HKDF-derived keys)

    **Brain Service (`@learncard/network-brain-service`):**

    - Added skill embedding support with Google AI model integration
    - Added background backfill for skill embeddings on startup
    - Added Sentry integration for error tracking

    **Apps (learn-card-app, scoutpass-app):**

    - Integrated AuthCoordinator for unified auth and key lifecycle management
    - Added account recovery flows (passkey, email backup, recovery phrase)
    - Added QR-based cross-device login
    - Replaced Web3Auth key derivation with SSS as default (`VITE_KEY_DERIVATION=sss`)
    - Added automatic Web3Auth → SSS migration for existing users
    - Removed deprecated `REACT_APP_ENABLE_SSS_MIGRATION` env var (migration is now automatic)
    - Removed stale `WEB3AUTH_MAINNET_CLIENT_ID` / `WEB3AUTH_TESTNET_CLIENT_ID` from vite config
    - Added `.env.example` files documenting all environment variables
    - Added SSS/auth VITE environment variables to all CI workflows (deploy, capgo, fastlane)

    **CI/CD:**

    - Propagated `VITE_AUTH_PROVIDER`, `VITE_KEY_DERIVATION`, `VITE_SSS_SERVER_URL`, `VITE_ENABLE_EMAIL_BACKUP_SHARE`, `VITE_ENABLE_AUTH_DEBUG_WIDGET`, `VITE_REQUIRE_EMAIL_FOR_PHONE_USERS` as `vars` across all app build workflows
    - Fixed Postmark template env var renames in deploy workflow
    - Added `.env.example` for lca-api service

### Patch Changes

- [#1084](https://github.com/learningeconomy/LearnCard/pull/1084) [`bb2996d35d13c52c2a3c983b1b521338678bd68d`](https://github.com/learningeconomy/LearnCard/commit/bb2996d35d13c52c2a3c983b1b521338678bd68d) Thanks [@Custard7](https://github.com/Custard7)! - fix: Vitest timeout

- Updated dependencies [[`50fa611b714ae47fa3d6d56e7751ba59b5b71322`](https://github.com/learningeconomy/LearnCard/commit/50fa611b714ae47fa3d6d56e7751ba59b5b71322), [`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c)]:
    - @learncard/init@2.3.8
    - @learncard/types@5.13.0
    - @learncard/didkit-plugin@1.8.0
    - @learncard/core@9.4.10
    - @learncard/did-web-plugin@1.1.10
    - @learncard/didkit-plugin-node@0.2.6

## 1.1.18

### Patch Changes

- [#1073](https://github.com/learningeconomy/LearnCard/pull/1073) [`bd25921c5a9c06bab25092ebe9485aa2be452d19`](https://github.com/learningeconomy/LearnCard/commit/bd25921c5a9c06bab25092ebe9485aa2be452d19) Thanks [@Custard7](https://github.com/Custard7)! - fix: Enable remote JSON-LD context resolution across all signing services

## 1.1.17

### Patch Changes

- Updated dependencies [[`bf4f00306f64e701f3c9acee4c5f7438d3f3b6ee`](https://github.com/learningeconomy/LearnCard/commit/bf4f00306f64e701f3c9acee4c5f7438d3f3b6ee)]:
    - @learncard/types@5.12.3
    - @learncard/core@9.4.9
    - @learncard/init@2.3.7
    - @learncard/did-web-plugin@1.1.9
    - @learncard/didkit-plugin@1.7.5
    - @learncard/didkit-plugin-node@0.2.5

## 1.1.16

### Patch Changes

- Updated dependencies [[`495f2939cb6e4271cab0a88abea5105fb7e4f9b6`](https://github.com/learningeconomy/LearnCard/commit/495f2939cb6e4271cab0a88abea5105fb7e4f9b6), [`08a1c8a07501c2f426d16239c4b0551e518a7ed5`](https://github.com/learningeconomy/LearnCard/commit/08a1c8a07501c2f426d16239c4b0551e518a7ed5)]:
    - @learncard/types@5.12.2
    - @learncard/core@9.4.8
    - @learncard/init@2.3.6
    - @learncard/did-web-plugin@1.1.8
    - @learncard/didkit-plugin@1.7.4
    - @learncard/didkit-plugin-node@0.2.4

## 1.1.15

### Patch Changes

- Updated dependencies [[`caf231b53707174ea49f0eb2b65885a36b3e7228`](https://github.com/learningeconomy/LearnCard/commit/caf231b53707174ea49f0eb2b65885a36b3e7228)]:
    - @learncard/types@5.12.1
    - @learncard/core@9.4.7
    - @learncard/init@2.3.5
    - @learncard/did-web-plugin@1.1.7
    - @learncard/didkit-plugin@1.7.3
    - @learncard/didkit-plugin-node@0.2.3

## 1.1.14

### Patch Changes

- Updated dependencies [[`f05491d71c2499f80ad20d75fccb60fc15eedb91`](https://github.com/learningeconomy/LearnCard/commit/f05491d71c2499f80ad20d75fccb60fc15eedb91)]:
    - @learncard/init@2.3.4

## 1.1.13

### Patch Changes

- [#983](https://github.com/learningeconomy/LearnCard/pull/983) [`50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe`](https://github.com/learningeconomy/LearnCard/commit/50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe) Thanks [@Custard7](https://github.com/Custard7)! - feat: Sentry Filtering

- Updated dependencies []:
    - @learncard/init@2.3.3

## 1.1.12

### Patch Changes

- [#980](https://github.com/learningeconomy/LearnCard/pull/980) [`efdfced27681ae5e68818a8a595eb76da59bd842`](https://github.com/learningeconomy/LearnCard/commit/efdfced27681ae5e68818a8a595eb76da59bd842) Thanks [@Custard7](https://github.com/Custard7)! - feat: Upgrade Instrumentation Tracing for Performance Monitoring

- Updated dependencies [[`32e5cfacf499e9a68700170298040f3d313b38da`](https://github.com/learningeconomy/LearnCard/commit/32e5cfacf499e9a68700170298040f3d313b38da)]:
    - @learncard/types@5.12.0
    - @learncard/core@9.4.6
    - @learncard/init@2.3.2
    - @learncard/did-web-plugin@1.1.6
    - @learncard/didkit-plugin@1.7.2
    - @learncard/didkit-plugin-node@0.2.2

## 1.1.11

### Patch Changes

- Updated dependencies [[`d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9`](https://github.com/learningeconomy/LearnCard/commit/d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9)]:
    - @learncard/types@5.11.4
    - @learncard/core@9.4.5
    - @learncard/init@2.3.1
    - @learncard/did-web-plugin@1.1.5
    - @learncard/didkit-plugin@1.7.1
    - @learncard/didkit-plugin-node@0.2.1

## 1.1.10

### Patch Changes

- [#969](https://github.com/learningeconomy/LearnCard/pull/969) [`d2b259d3afabd9509d96d8879c6080fcd707f3d6`](https://github.com/learningeconomy/LearnCard/commit/d2b259d3afabd9509d96d8879c6080fcd707f3d6) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow creating signing authorities for a non-self DID.

    This is used for app issuer DIDs and remains secure because the target DID
    must still publish the signing authority key in its DID document before
    it can be used to issue credentials.

## 1.1.9

### Patch Changes

- [`175a828f712da5b44eeb3c242e8fd604736df073`](https://github.com/learningeconomy/LearnCard/commit/175a828f712da5b44eeb3c242e8fd604736df073) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add debug logging

## 1.1.8

### Patch Changes

- [`c04ff8e86677b7f88fb2858be2b9b3f8bb28f427`](https://github.com/learningeconomy/LearnCard/commit/c04ff8e86677b7f88fb2858be2b9b3f8bb28f427) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Deployed Lambda issue

## 1.1.7

### Patch Changes

- Updated dependencies [[`7e30fc7116411ba19a4889cfbf9fc71dd725c309`](https://github.com/learningeconomy/LearnCard/commit/7e30fc7116411ba19a4889cfbf9fc71dd725c309)]:
    - @learncard/didkit-plugin-node@0.2.0
    - @learncard/init@2.3.0
    - @learncard/didkit-plugin@1.7.0

## 1.1.6

### Patch Changes

- Updated dependencies [[`016b7edc231273aab962b89b4351a3e229fca025`](https://github.com/learningeconomy/LearnCard/commit/016b7edc231273aab962b89b4351a3e229fca025)]:
    - @learncard/types@5.11.3
    - @learncard/core@9.4.4
    - @learncard/init@2.2.6
    - @learncard/did-web-plugin@1.1.4
    - @learncard/didkit-plugin@1.6.4

## 1.1.5

### Patch Changes

- Updated dependencies [[`73865cc62ea292badb99fe41ca8b0f484a12728f`](https://github.com/learningeconomy/LearnCard/commit/73865cc62ea292badb99fe41ca8b0f484a12728f)]:
    - @learncard/types@5.11.2
    - @learncard/core@9.4.3
    - @learncard/init@2.2.5
    - @learncard/did-web-plugin@1.1.3
    - @learncard/didkit-plugin@1.6.3

## 1.1.4

### Patch Changes

- Updated dependencies [[`f8e50b1e3ceafccde28bef859b2c8b220acb2b7d`](https://github.com/learningeconomy/LearnCard/commit/f8e50b1e3ceafccde28bef859b2c8b220acb2b7d)]:
    - @learncard/types@5.11.1
    - @learncard/core@9.4.2
    - @learncard/init@2.2.4
    - @learncard/did-web-plugin@1.1.2
    - @learncard/didkit-plugin@1.6.2

## 1.1.3

### Patch Changes

- Updated dependencies []:
    - @learncard/init@2.2.3

## 1.1.2

### Patch Changes

- Updated dependencies [[`3727c732ad54b4a8ccb89c6354291799e953c8ab`](https://github.com/learningeconomy/LearnCard/commit/3727c732ad54b4a8ccb89c6354291799e953c8ab), [`bb6749d4cd123ca1fcee8d6f657861ae77a614a2`](https://github.com/learningeconomy/LearnCard/commit/bb6749d4cd123ca1fcee8d6f657861ae77a614a2)]:
    - @learncard/types@5.11.0
    - @learncard/core@9.4.1
    - @learncard/init@2.2.2
    - @learncard/did-web-plugin@1.1.1
    - @learncard/didkit-plugin@1.6.1

## 1.1.1

### Patch Changes

- [#893](https://github.com/learningeconomy/LearnCard/pull/893) [`4b1d40356ffd974915396fbee05d656f6c16f9c0`](https://github.com/learningeconomy/LearnCard/commit/4b1d40356ffd974915396fbee05d656f6c16f9c0) Thanks [@Custard7](https://github.com/Custard7)! - fix: serverless-prune for lambdas

- Updated dependencies []:
    - @learncard/init@2.2.1

## 1.1.0

### Minor Changes

- [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    - Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    - Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    - Allow `Infinity` for generational query inputs in brain-service routes.
    - Document running Vitest in non-watch mode (`bun run test -- run`).

### Patch Changes

- Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9), [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    - @learncard/did-web-plugin@1.1.0
    - @learncard/types@5.10.0
    - @learncard/core@9.4.0
    - @learncard/init@2.2.0
    - @learncard/didkit-plugin@1.6.0

## 1.0.5

### Patch Changes

- [#863](https://github.com/learningeconomy/LearnCard/pull/863) [`f294ed7af55904656f3945cef471f788b64dfbb5`](https://github.com/learningeconomy/LearnCard/commit/f294ed7af55904656f3945cef471f788b64dfbb5) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Dockerfiles
