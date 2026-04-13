# @learncard/sss-key-manager

## 0.1.4

### Patch Changes

-   Updated dependencies [[`c68bed993c5304a667dc75d422a118858848737a`](https://github.com/learningeconomy/LearnCard/commit/c68bed993c5304a667dc75d422a118858848737a)]:
    -   @learncard/types@5.13.4

## 0.1.3

### Patch Changes

-   Updated dependencies [[`fb6627b7fa3c4a07c83d4186619a937e6a83f369`](https://github.com/learningeconomy/LearnCard/commit/fb6627b7fa3c4a07c83d4186619a937e6a83f369)]:
    -   @learncard/types@5.13.3

## 0.1.2

### Patch Changes

-   Updated dependencies [[`bba1f735e107d9cc86880e9f869413bc7072bff8`](https://github.com/learningeconomy/LearnCard/commit/bba1f735e107d9cc86880e9f869413bc7072bff8), [`fce9d2fd32898cfc64c59b88ca644dea3b53d1a5`](https://github.com/learningeconomy/LearnCard/commit/fce9d2fd32898cfc64c59b88ca644dea3b53d1a5)]:
    -   @learncard/types@5.13.2

## 0.1.1

### Patch Changes

-   Updated dependencies [[`c83e3de987c11a6d95deec31c1fdb2401a990db2`](https://github.com/learningeconomy/LearnCard/commit/c83e3de987c11a6d95deec31c1fdb2401a990db2), [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0)]:
    -   @learncard/types@5.13.1

## 0.1.0

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

-   Updated dependencies [[`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c)]:
    -   @learncard/types@5.13.0
