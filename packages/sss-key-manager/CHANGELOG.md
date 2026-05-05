# @learncard/sss-key-manager

## 0.1.7

### Patch Changes

-   Updated dependencies [[`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02), [`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02)]:
    -   @learncard/types@5.14.0

## 0.1.6

### Patch Changes

-   [`98edecaa4348a95b67753b084da91ee38a3813d2`](https://github.com/learningeconomy/LearnCard/commit/98edecaa4348a95b67753b084da91ee38a3813d2) Thanks [@Custard7](https://github.com/Custard7)! - feat: [LC-1749] React-Email + Tenant Branding

    Introduces git-managed, tenant-branded email and SMS templates via the new `@learncard/email-templates` package, and wires tenant-aware email delivery through `lca-api` and `brain-service`.

    ### What's new

    -   **`@learncard/email-templates` (new package)** — React Email templates for every transactional email the platform sends (login OTP, recovery email code, recovery key, inbox claim, endorsement request, guardian approval, account approved, guardian credential approval, etc.). Includes an SMS renderer, a tenant registry with per-tenant branding overrides, and a local preview server (`pnpm --filter @learncard/email-templates dev`).
    -   **`lca-api` + `brain-service`** — PostmarkAdapter now renders templates locally with tenant branding and delivers the result as raw HTML via Postmark's `sendEmail` API. Tenant is resolved from the request in `createContext` via `resolveTenantFromRequest()` and attached as `ctx.tenant` for every route.
    -   **`@learncard/sss-key-manager`** — `createSSSStrategy({ tenantId })` now forwards an `X-Tenant-Id` header on every call to `lca-api` so recovery / OTP emails are branded for the tenant the user is signed into.
    -   **`learn-card-app`** — Resolves the active tenant at SSS factory time and passes it into `createSSSStrategy`, so VetPass (and any future tenant) gets branded recovery emails out of the box.

    ### Behavior changes

    -   **Recovery / OTP emails are always branded.** Previously, emails fell back to unstyled plain-text when the corresponding `POSTMARK_*_TEMPLATE_ALIAS` env var was unset. The server now renders the React Email template with tenant branding on every send; unset env vars are fine.
    -   **New observable request header.** The SSS client sends `X-Tenant-Id: <tenant>` on all requests to `lca-api`. Proxies, WAFs, and log pipelines may surface this.

    ### Deployment notes (self-hosters)

    -   The `POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS` and `POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS` env vars are no longer required — they're pure overrides now. You can remove them from your deployment config.
    -   `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS` and `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS` are likewise optional overrides; the adapter renders locally by default.
    -   An optional `DEFAULT_TENANT_ID` env var is now honored as the fallback when neither `X-Tenant-Id` nor `Origin` resolves to a known tenant.
    -   Existing Postmark template customizations are not used unless the corresponding env var is set. To move your branding into version control, add an entry to `TENANT_EMAIL_BRANDING` in `packages/email-templates/src/tenant-registry.ts`.

    See [Configure Tenant-Branded Emails](../docs/how-to-guides/configure-tenant-branded-emails.md) and [Tenant-Branded Emails (architecture)](../docs/core-concepts/tenant-branded-emails.md) for details.

-   Updated dependencies [[`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f), [`8e408e48f89db234bcb7d357787a0faf3a605488`](https://github.com/learningeconomy/LearnCard/commit/8e408e48f89db234bcb7d357787a0faf3a605488)]:
    -   @learncard/types@5.13.6

## 0.1.5

### Patch Changes

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/types@5.13.5

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
