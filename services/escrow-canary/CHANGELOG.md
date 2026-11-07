# @learncard/escrow-canary

## 0.3.2

### Patch Changes

- [#1949](https://github.com/learningeconomy/LearnCard/pull/1949) [`cb50b8124f9fa772d45fd957228fa51d277e43b4`](https://github.com/learningeconomy/LearnCard/commit/cb50b8124f9fa772d45fd957228fa51d277e43b4) Thanks [@Custard7](https://github.com/Custard7)! - Provisioning: `--allow-login-spam-fail` accepts an SES spam verdict of `FAIL` on login-code mail only (production login mail from some Postmark pools is scored as spam). All other trust checks still apply; the tier 3 runner is unchanged.

- [#1980](https://github.com/learningeconomy/LearnCard/pull/1980) [`deefc0595f990cf2a600faed7be829500ad9512d`](https://github.com/learningeconomy/LearnCard/commit/deefc0595f990cf2a600faed7be829500ad9512d) Thanks [@Custard7](https://github.com/Custard7)! - Add a staging-only escrow load-test script (`scripts/load.ts`) that runs the app's automatic escrow enrolment and PIN recovery at a controlled rate, with fail-closed guards (staging host, test email domain, shared-Firebase opt-in, user/email caps) and manifest-only cleanup.

- [#1952](https://github.com/learningeconomy/LearnCard/pull/1952) [`6404c1106a5b9b35c3f6ee34d021b0b596f334fd`](https://github.com/learningeconomy/LearnCard/commit/6404c1106a5b9b35c3f6ee34d021b0b596f334fd) Thanks [@Custard7](https://github.com/Custard7)! - lca-api: when `ESCROW_ENCLAVE_MODE=remote` but `ESCROW_ENCLAVE_REMOTE_URL`/`ESCROW_ENCLAVE_REMOTE_TOKEN` is missing, log a distinctive error once per container (cold start included, values never logged) and emit `LearnCard/Escrow EnclaveFailure` with `Reason=remote_config_missing`. Smoketests probe `/api/keys/escrow/attestation` on staging and production. Canary docs: both environments use the 7-day hold (`tier3_hold_duration_ms` now validated), observed drill timings, rollout record.

- [#1925](https://github.com/learningeconomy/LearnCard/pull/1925) [`13e0809239cd73c5153a3ff82b268afb21b665b2`](https://github.com/learningeconomy/LearnCard/commit/13e0809239cd73c5153a3ff82b268afb21b665b2) Thanks [@Custard7](https://github.com/Custard7)! - Prepare VetPass to use escrow recovery on LearnCard's escrow enclave. The enclave serves one tenant: it signs and checks its own authority tenant label (`learncard`). Before this change VetPass sent its app tenant (`vetpass`) instead, so its first authority-state read failed.

    - **sss-key-manager:** new optional `escrow.authorityTenant`, used for everything the enclave signs or checks (intent tenant, authority state, hold and code-delivery records, persisted recovery expectations). `tenantId` is still sent as `X-Tenant-Id` and used for branding. It defaults to `tenantId`, so LearnCard and ScoutPass behave as before. If signed evidence carries another label, the client throws the new `EscrowAuthorityTenantMismatchError` (a subclass of `EscrowEvidenceError` that names both labels) before rotating shares or taking any recovery step. A malformed label throws in `createSSSStrategy`.
    - **learn-card-base:** new tenant config field `auth.sss.escrowAuthorityTenant` (validated), forwarded with the escrow trust policy by `getEscrowStrategyConfig`. Also adds the helpers `getEscrowAuthorityTenant`, `escrowAuthorityBrandName`, `getEscrowEmailSenderBrand` and `getEscrowEmailSender` (compares the app's `branding.name` with the enclave brand).
    - **lca-api:** checks escrow intents and authority state against the new `ESCROW_AUTHORITY_TENANT` setting (default `learncard`, so no infrastructure change), not the client-supplied `X-Tenant-Id`. It also refuses an enroll when the authority state it reads carries a different tenant. Holds, emails and links still use the app tenant. The default is global, so the ScoutPass deployment (escrow off) must set its own value before it turns escrow on.
    - **learn-card-app:** no VetPass config change: VetPass escrow stays off at every stage until the SSS switch turns it on together with LearnCard production. A new test keeps it off until then, and afterwards fails if VetPass and LearnCard differ in key derivation, escrow mode, pins or authority tenant at any deployed stage. When the enclave's email brand differs from the app's, the recovery screens explain that the code and some other emails come from LearnCard (4 locales).
    - **escrow-canary:** tier 3 reports any `EscrowEvidenceError` subclass, including the new tenant mismatch, as `evidence` rather than `unexpected`.

- Updated dependencies [[`13e0809239cd73c5153a3ff82b268afb21b665b2`](https://github.com/learningeconomy/LearnCard/commit/13e0809239cd73c5153a3ff82b268afb21b665b2), [`13e0809239cd73c5153a3ff82b268afb21b665b2`](https://github.com/learningeconomy/LearnCard/commit/13e0809239cd73c5153a3ff82b268afb21b665b2)]:
    - @learncard/sss-key-manager@0.3.0
    - @learncard/init@2.5.10

## 0.3.1

### Patch Changes

- [#1926](https://github.com/learningeconomy/LearnCard/pull/1926) [`367460fc1a2c9ad4ca858c9a2bac39c7f6d0064e`](https://github.com/learningeconomy/LearnCard/commit/367460fc1a2c9ad4ca858c9a2bac39c7f6d0064e) Thanks [@Custard7](https://github.com/Custard7)! - Provisioning no longer mistakes `DescribeSecret` lag for a takeover. `VersionIdsToStages` is eventually consistent, so right after a label move it can still show `PROVISIONING` absent, on the run's previous version, or where it was before the run started. The precheck, the fence, the failed-claim re-read and the check after a failed detach now re-read with a bounded backoff (4 s total) until they see the expected version. If the reads never settle, another run's version stops with `provisioning_label_moved` (exit 3), and a label still absent or on the run's own version stops with the retryable `secret: provisioning_label_lag` (exit 1).

- Updated dependencies [[`27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6`](https://github.com/learningeconomy/LearnCard/commit/27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6)]:
    - @learncard/sss-key-manager@0.2.7
    - @learncard/init@2.5.9

## 0.3.0

### Minor Changes

- [#1878](https://github.com/learningeconomy/LearnCard/pull/1878) [`4c3f904c1c3727461d14f52ece2cf7b0543329b1`](https://github.com/learningeconomy/LearnCard/commit/4c3f904c1c3727461d14f52ece2cf7b0543329b1) Thanks [@Custard7](https://github.com/Custard7)! - Add an operator provisioning tool (`dist/provision.mjs`) that creates canary accounts through the normal user path (email-code login, new SSS key, escrow opt-in or PIN) and writes their secrets with staged, compare-and-swap Secrets Manager updates. Not part of the Lambda bundle.

### Patch Changes

- Updated dependencies [[`372c1431e78a9708454f9c4c2f2c99dd5486b8e9`](https://github.com/learningeconomy/LearnCard/commit/372c1431e78a9708454f9c4c2f2c99dd5486b8e9), [`c20460f6fef685272227f506f536b6811f90b8a0`](https://github.com/learningeconomy/LearnCard/commit/c20460f6fef685272227f506f536b6811f90b8a0)]:
    - @learncard/sss-key-manager@0.2.6
    - @learncard/init@2.5.8

## 0.2.0

### Minor Changes

- [#1877](https://github.com/learningeconomy/LearnCard/pull/1877) [`6b0385d43e1efa06a69267af2a4bcc78be4ce31e`](https://github.com/learningeconomy/LearnCard/commit/6b0385d43e1efa06a69267af2a4bcc78be4ce31e) Thanks [@Custard7](https://github.com/Custard7)! - Add the tier 3 (7-day recovery) canary runner, deadline evaluator and canary inbox reader, off by default. Tiers 1/2 keep their behaviour; `CANARY_TIER` is now parsed strictly (`1`, `2` or `3`).

### Patch Changes

- Updated dependencies [[`b0c7891371fa621a1c2c4a419a1d4f330ed2993a`](https://github.com/learningeconomy/LearnCard/commit/b0c7891371fa621a1c2c4a419a1d4f330ed2993a)]:
    - @learncard/sss-key-manager@0.2.5
    - @learncard/init@2.5.7

## 0.1.1

### Patch Changes

- Updated dependencies []:
    - @learncard/init@2.5.6
    - @learncard/sss-key-manager@0.2.4
