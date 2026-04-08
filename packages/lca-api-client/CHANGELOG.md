# @welibraryos/lca-api-client

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

## 1.1.13

### Patch Changes

-   Updated dependencies [[`50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe`](https://github.com/learningeconomy/LearnCard/commit/50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe)]:
    -   @learncard/lca-api-service@1.1.13

## 1.1.12

### Patch Changes

-   Updated dependencies [[`efdfced27681ae5e68818a8a595eb76da59bd842`](https://github.com/learningeconomy/LearnCard/commit/efdfced27681ae5e68818a8a595eb76da59bd842)]:
    -   @learncard/lca-api-service@1.1.12

## 1.1.11

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-service@1.1.11

## 1.1.10

### Patch Changes

-   Updated dependencies [[`d2b259d3afabd9509d96d8879c6080fcd707f3d6`](https://github.com/learningeconomy/LearnCard/commit/d2b259d3afabd9509d96d8879c6080fcd707f3d6)]:
    -   @learncard/lca-api-service@1.1.10

## 1.1.9

### Patch Changes

-   Updated dependencies [[`175a828f712da5b44eeb3c242e8fd604736df073`](https://github.com/learningeconomy/LearnCard/commit/175a828f712da5b44eeb3c242e8fd604736df073)]:
    -   @learncard/lca-api-service@1.1.9

## 1.1.8

### Patch Changes

-   Updated dependencies [[`c04ff8e86677b7f88fb2858be2b9b3f8bb28f427`](https://github.com/learningeconomy/LearnCard/commit/c04ff8e86677b7f88fb2858be2b9b3f8bb28f427)]:
    -   @learncard/lca-api-service@1.1.8

## 1.1.7

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-service@1.1.7

## 1.1.6

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-service@1.1.6

## 1.1.5

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-service@1.1.5

## 1.1.4

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-service@1.1.4

## 1.1.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-service@1.1.3

## 1.1.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-service@1.1.2

## 1.1.1

### Patch Changes

-   Updated dependencies [[`4b1d40356ffd974915396fbee05d656f6c16f9c0`](https://github.com/learningeconomy/LearnCard/commit/4b1d40356ffd974915396fbee05d656f6c16f9c0)]:
    -   @learncard/lca-api-service@1.1.1

## 1.1.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/lca-api-service@1.1.0

## 1.0.1

### Patch Changes

-   Updated dependencies [[`f294ed7af55904656f3945cef471f788b64dfbb5`](https://github.com/learningeconomy/LearnCard/commit/f294ed7af55904656f3945cef471f788b64dfbb5)]:
    -   @learncard/lca-api-service@1.0.5
