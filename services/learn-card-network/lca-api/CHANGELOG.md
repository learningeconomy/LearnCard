# @welibraryos/lca-api-service

## 1.2.5

### Patch Changes

-   [#1149](https://github.com/learningeconomy/LearnCard/pull/1149) [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `requestLearnerContext` support across Partner Connect, the LearnCard host, and the network stack so embedded App Store apps can request learner context for AI flows.

    This also allows `requestConsent()` to resolve the configured contract from the app listing's integration when a contract URI is not passed explicitly, and adds a request-learner-context demo app to exercise the full flow.

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`c38452f9678c17aa13c2f3f6d16056cc8f9c7564`](https://github.com/learningeconomy/LearnCard/commit/c38452f9678c17aa13c2f3f6d16056cc8f9c7564), [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/types@5.13.5
    -   @learncard/core@9.4.15
    -   @learncard/init@2.3.13
    -   @learncard/did-web-plugin@1.1.15
    -   @learncard/didkit-plugin@1.8.5
    -   @learncard/didkit-plugin-node@0.2.11

## 1.2.4

### Patch Changes

-   Updated dependencies [[`c68bed993c5304a667dc75d422a118858848737a`](https://github.com/learningeconomy/LearnCard/commit/c68bed993c5304a667dc75d422a118858848737a)]:
    -   @learncard/types@5.13.4
    -   @learncard/core@9.4.14
    -   @learncard/init@2.3.12
    -   @learncard/did-web-plugin@1.1.14
    -   @learncard/didkit-plugin@1.8.4
    -   @learncard/didkit-plugin-node@0.2.10

## 1.2.3

### Patch Changes

-   Updated dependencies [[`fb6627b7fa3c4a07c83d4186619a937e6a83f369`](https://github.com/learningeconomy/LearnCard/commit/fb6627b7fa3c4a07c83d4186619a937e6a83f369)]:
    -   @learncard/types@5.13.3
    -   @learncard/core@9.4.13
    -   @learncard/init@2.3.11
    -   @learncard/did-web-plugin@1.1.13
    -   @learncard/didkit-plugin@1.8.3
    -   @learncard/didkit-plugin-node@0.2.9

## 1.2.2

### Patch Changes

-   Updated dependencies [[`bba1f735e107d9cc86880e9f869413bc7072bff8`](https://github.com/learningeconomy/LearnCard/commit/bba1f735e107d9cc86880e9f869413bc7072bff8), [`fce9d2fd32898cfc64c59b88ca644dea3b53d1a5`](https://github.com/learningeconomy/LearnCard/commit/fce9d2fd32898cfc64c59b88ca644dea3b53d1a5)]:
    -   @learncard/types@5.13.2
    -   @learncard/core@9.4.12
    -   @learncard/init@2.3.10
    -   @learncard/did-web-plugin@1.1.12
    -   @learncard/didkit-plugin@1.8.2
    -   @learncard/didkit-plugin-node@0.2.8

## 1.2.1

### Patch Changes

-   [#1102](https://github.com/learningeconomy/LearnCard/pull/1102) [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add "Unsubmit" feature for app store listings

    Developers can now withdraw their pending app submissions by clicking "Unsubmit" on listings in PENDING_REVIEW status. The listing returns to DRAFT status and the APP_LISTING_SUBMITTED notification is automatically deleted from admin inboxes (via a new APP_LISTING_WITHDRAWN notification type that triggers notification cleanup in LCA-API).

-   [#1093](https://github.com/learningeconomy/LearnCard/pull/1093) [`6a1e0096ab35d0c98a51c6e06aea347f2a3e89c2`](https://github.com/learningeconomy/LearnCard/commit/6a1e0096ab35d0c98a51c6e06aea347f2a3e89c2) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Small dev change to not use NAPI didkit in local docker containers

-   Updated dependencies [[`c83e3de987c11a6d95deec31c1fdb2401a990db2`](https://github.com/learningeconomy/LearnCard/commit/c83e3de987c11a6d95deec31c1fdb2401a990db2), [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0)]:
    -   @learncard/types@5.13.1
    -   @learncard/core@9.4.11
    -   @learncard/init@2.3.9
    -   @learncard/did-web-plugin@1.1.11
    -   @learncard/didkit-plugin@1.8.1
    -   @learncard/didkit-plugin-node@0.2.7

## 1.2.0

### Minor Changes

-   [#986](https://github.com/learningeconomy/LearnCard/pull/986) [`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c) Thanks [@Custard7](https://github.com/Custard7)! - ### SSS Key Management & AuthCoordinator

    **New packages:**

    -   `@learncard/types` — Added provider-agnostic auth and key derivation interfaces (`src/auth.ts`)
    -   `@learncard/sss-key-manager` — Shamir Secret Sharing key manager replacing Web3Auth SFA

    **LCA API (`@learncard/lca-api-service`):**

    -   Added SSS key management routes (`/keys/*`): store/retrieve encrypted auth shares, add/remove recovery methods (passkey, backup, phrase, email), share versioning
    -   Added recovery email verification flow with 6-digit OTP codes
    -   Added email backup share relay (fire-and-forget, share never persisted)
    -   Added QR-based cross-device login routes (`/qr-login/*`)
    -   Added contact method upgrade route for phone→email transitions
    -   Added provider-agnostic delivery service abstraction (Postmark adapter + log adapter for dev)
    -   Added optional Postmark template support for recovery emails (`POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS`, `POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS`) with plain-text fallback
    -   Renamed `POSTMARK_LOGIN_CODE_TEMPLATE_ID` → `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS` and `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ID` → `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS`
    -   Added Sentry integration for error tracking
    -   Added share encryption helpers (AES-256-GCM with HKDF-derived keys)

    **Brain Service (`@learncard/network-brain-service`):**

    -   Added skill embedding support with Google AI model integration
    -   Added background backfill for skill embeddings on startup
    -   Added Sentry integration for error tracking

    **Apps (learn-card-app, scoutpass-app):**

    -   Integrated AuthCoordinator for unified auth and key lifecycle management
    -   Added account recovery flows (passkey, email backup, recovery phrase)
    -   Added QR-based cross-device login
    -   Replaced Web3Auth key derivation with SSS as default (`VITE_KEY_DERIVATION=sss`)
    -   Added automatic Web3Auth → SSS migration for existing users
    -   Removed deprecated `REACT_APP_ENABLE_SSS_MIGRATION` env var (migration is now automatic)
    -   Removed stale `WEB3AUTH_MAINNET_CLIENT_ID` / `WEB3AUTH_TESTNET_CLIENT_ID` from vite config
    -   Added `.env.example` files documenting all environment variables
    -   Added SSS/auth VITE environment variables to all CI workflows (deploy, capgo, fastlane)

    **CI/CD:**

    -   Propagated `VITE_AUTH_PROVIDER`, `VITE_KEY_DERIVATION`, `VITE_SSS_SERVER_URL`, `VITE_ENABLE_EMAIL_BACKUP_SHARE`, `VITE_ENABLE_AUTH_DEBUG_WIDGET`, `VITE_REQUIRE_EMAIL_FOR_PHONE_USERS` as `vars` across all app build workflows
    -   Fixed Postmark template env var renames in deploy workflow
    -   Added `.env.example` for lca-api service

### Patch Changes

-   [#1084](https://github.com/learningeconomy/LearnCard/pull/1084) [`bb2996d35d13c52c2a3c983b1b521338678bd68d`](https://github.com/learningeconomy/LearnCard/commit/bb2996d35d13c52c2a3c983b1b521338678bd68d) Thanks [@Custard7](https://github.com/Custard7)! - fix: Vitest timeout

-   Updated dependencies [[`50fa611b714ae47fa3d6d56e7751ba59b5b71322`](https://github.com/learningeconomy/LearnCard/commit/50fa611b714ae47fa3d6d56e7751ba59b5b71322), [`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c)]:
    -   @learncard/init@2.3.8
    -   @learncard/types@5.13.0
    -   @learncard/didkit-plugin@1.8.0
    -   @learncard/core@9.4.10
    -   @learncard/did-web-plugin@1.1.10
    -   @learncard/didkit-plugin-node@0.2.6

## 1.1.18

### Patch Changes

-   [#1073](https://github.com/learningeconomy/LearnCard/pull/1073) [`bd25921c5a9c06bab25092ebe9485aa2be452d19`](https://github.com/learningeconomy/LearnCard/commit/bd25921c5a9c06bab25092ebe9485aa2be452d19) Thanks [@Custard7](https://github.com/Custard7)! - fix: Enable remote JSON-LD context resolution across all signing services

## 1.1.17

### Patch Changes

-   Updated dependencies [[`bf4f00306f64e701f3c9acee4c5f7438d3f3b6ee`](https://github.com/learningeconomy/LearnCard/commit/bf4f00306f64e701f3c9acee4c5f7438d3f3b6ee)]:
    -   @learncard/types@5.12.3
    -   @learncard/core@9.4.9
    -   @learncard/init@2.3.7
    -   @learncard/did-web-plugin@1.1.9
    -   @learncard/didkit-plugin@1.7.5
    -   @learncard/didkit-plugin-node@0.2.5

## 1.1.16

### Patch Changes

-   Updated dependencies [[`495f2939cb6e4271cab0a88abea5105fb7e4f9b6`](https://github.com/learningeconomy/LearnCard/commit/495f2939cb6e4271cab0a88abea5105fb7e4f9b6), [`08a1c8a07501c2f426d16239c4b0551e518a7ed5`](https://github.com/learningeconomy/LearnCard/commit/08a1c8a07501c2f426d16239c4b0551e518a7ed5)]:
    -   @learncard/types@5.12.2
    -   @learncard/core@9.4.8
    -   @learncard/init@2.3.6
    -   @learncard/did-web-plugin@1.1.8
    -   @learncard/didkit-plugin@1.7.4
    -   @learncard/didkit-plugin-node@0.2.4

## 1.1.15

### Patch Changes

-   Updated dependencies [[`caf231b53707174ea49f0eb2b65885a36b3e7228`](https://github.com/learningeconomy/LearnCard/commit/caf231b53707174ea49f0eb2b65885a36b3e7228)]:
    -   @learncard/types@5.12.1
    -   @learncard/core@9.4.7
    -   @learncard/init@2.3.5
    -   @learncard/did-web-plugin@1.1.7
    -   @learncard/didkit-plugin@1.7.3
    -   @learncard/didkit-plugin-node@0.2.3

## 1.1.14

### Patch Changes

-   Updated dependencies [[`f05491d71c2499f80ad20d75fccb60fc15eedb91`](https://github.com/learningeconomy/LearnCard/commit/f05491d71c2499f80ad20d75fccb60fc15eedb91)]:
    -   @learncard/init@2.3.4

## 1.1.13

### Patch Changes

-   [#983](https://github.com/learningeconomy/LearnCard/pull/983) [`50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe`](https://github.com/learningeconomy/LearnCard/commit/50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe) Thanks [@Custard7](https://github.com/Custard7)! - feat: Sentry Filtering

-   Updated dependencies []:
    -   @learncard/init@2.3.3

## 1.1.12

### Patch Changes

-   [#980](https://github.com/learningeconomy/LearnCard/pull/980) [`efdfced27681ae5e68818a8a595eb76da59bd842`](https://github.com/learningeconomy/LearnCard/commit/efdfced27681ae5e68818a8a595eb76da59bd842) Thanks [@Custard7](https://github.com/Custard7)! - feat: Upgrade Instrumentation Tracing for Performance Monitoring

-   Updated dependencies [[`32e5cfacf499e9a68700170298040f3d313b38da`](https://github.com/learningeconomy/LearnCard/commit/32e5cfacf499e9a68700170298040f3d313b38da)]:
    -   @learncard/types@5.12.0
    -   @learncard/core@9.4.6
    -   @learncard/init@2.3.2
    -   @learncard/did-web-plugin@1.1.6
    -   @learncard/didkit-plugin@1.7.2
    -   @learncard/didkit-plugin-node@0.2.2

## 1.1.11

### Patch Changes

-   Updated dependencies [[`d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9`](https://github.com/learningeconomy/LearnCard/commit/d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9)]:
    -   @learncard/types@5.11.4
    -   @learncard/core@9.4.5
    -   @learncard/init@2.3.1
    -   @learncard/did-web-plugin@1.1.5
    -   @learncard/didkit-plugin@1.7.1
    -   @learncard/didkit-plugin-node@0.2.1

## 1.1.10

### Patch Changes

-   [#969](https://github.com/learningeconomy/LearnCard/pull/969) [`d2b259d3afabd9509d96d8879c6080fcd707f3d6`](https://github.com/learningeconomy/LearnCard/commit/d2b259d3afabd9509d96d8879c6080fcd707f3d6) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow creating signing authorities for a non-self DID.

    This is used for app issuer DIDs and remains secure because the target DID
    must still publish the signing authority key in its DID document before
    it can be used to issue credentials.

## 1.1.9

### Patch Changes

-   [`175a828f712da5b44eeb3c242e8fd604736df073`](https://github.com/learningeconomy/LearnCard/commit/175a828f712da5b44eeb3c242e8fd604736df073) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add debug logging

## 1.1.8

### Patch Changes

-   [`c04ff8e86677b7f88fb2858be2b9b3f8bb28f427`](https://github.com/learningeconomy/LearnCard/commit/c04ff8e86677b7f88fb2858be2b9b3f8bb28f427) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Deployed Lambda issue

## 1.1.7

### Patch Changes

-   Updated dependencies [[`7e30fc7116411ba19a4889cfbf9fc71dd725c309`](https://github.com/learningeconomy/LearnCard/commit/7e30fc7116411ba19a4889cfbf9fc71dd725c309)]:
    -   @learncard/didkit-plugin-node@0.2.0
    -   @learncard/init@2.3.0
    -   @learncard/didkit-plugin@1.7.0

## 1.1.6

### Patch Changes

-   Updated dependencies [[`016b7edc231273aab962b89b4351a3e229fca025`](https://github.com/learningeconomy/LearnCard/commit/016b7edc231273aab962b89b4351a3e229fca025)]:
    -   @learncard/types@5.11.3
    -   @learncard/core@9.4.4
    -   @learncard/init@2.2.6
    -   @learncard/did-web-plugin@1.1.4
    -   @learncard/didkit-plugin@1.6.4

## 1.1.5

### Patch Changes

-   Updated dependencies [[`73865cc62ea292badb99fe41ca8b0f484a12728f`](https://github.com/learningeconomy/LearnCard/commit/73865cc62ea292badb99fe41ca8b0f484a12728f)]:
    -   @learncard/types@5.11.2
    -   @learncard/core@9.4.3
    -   @learncard/init@2.2.5
    -   @learncard/did-web-plugin@1.1.3
    -   @learncard/didkit-plugin@1.6.3

## 1.1.4

### Patch Changes

-   Updated dependencies [[`f8e50b1e3ceafccde28bef859b2c8b220acb2b7d`](https://github.com/learningeconomy/LearnCard/commit/f8e50b1e3ceafccde28bef859b2c8b220acb2b7d)]:
    -   @learncard/types@5.11.1
    -   @learncard/core@9.4.2
    -   @learncard/init@2.2.4
    -   @learncard/did-web-plugin@1.1.2
    -   @learncard/didkit-plugin@1.6.2

## 1.1.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/init@2.2.3

## 1.1.2

### Patch Changes

-   Updated dependencies [[`3727c732ad54b4a8ccb89c6354291799e953c8ab`](https://github.com/learningeconomy/LearnCard/commit/3727c732ad54b4a8ccb89c6354291799e953c8ab), [`bb6749d4cd123ca1fcee8d6f657861ae77a614a2`](https://github.com/learningeconomy/LearnCard/commit/bb6749d4cd123ca1fcee8d6f657861ae77a614a2)]:
    -   @learncard/types@5.11.0
    -   @learncard/core@9.4.1
    -   @learncard/init@2.2.2
    -   @learncard/did-web-plugin@1.1.1
    -   @learncard/didkit-plugin@1.6.1

## 1.1.1

### Patch Changes

-   [#893](https://github.com/learningeconomy/LearnCard/pull/893) [`4b1d40356ffd974915396fbee05d656f6c16f9c0`](https://github.com/learningeconomy/LearnCard/commit/4b1d40356ffd974915396fbee05d656f6c16f9c0) Thanks [@Custard7](https://github.com/Custard7)! - fix: serverless-prune for lambdas

-   Updated dependencies []:
    -   @learncard/init@2.2.1

## 1.1.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9), [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/did-web-plugin@1.1.0
    -   @learncard/types@5.10.0
    -   @learncard/core@9.4.0
    -   @learncard/init@2.2.0
    -   @learncard/didkit-plugin@1.6.0

## 1.0.5

### Patch Changes

-   [#863](https://github.com/learningeconomy/LearnCard/pull/863) [`f294ed7af55904656f3945cef471f788b64dfbb5`](https://github.com/learningeconomy/LearnCard/commit/f294ed7af55904656f3945cef471f788b64dfbb5) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Dockerfiles
