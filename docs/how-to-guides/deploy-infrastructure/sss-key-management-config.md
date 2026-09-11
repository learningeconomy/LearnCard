---
description: Configure and deploy SSS key management for your LearnCard instance
---

# SSS Key Management Configuration

This guide covers the environment variables and infrastructure needed to deploy LearnCard with the self-hosted Shamir Secret Sharing (SSS) key management system.

## Prerequisites

### Local development: automatic recovery

The LearnCard local tenant overlay pins a software-enclave public key generated with
`generateEscrowKeyPair()` from `@learncard/sss-key-manager`. Set the matching values
on your local lca-api process:

```dotenv
ESCROW_ENCLAVE_MODE=software
ESCROW_ENCLAVE_ACTIVE_KEY_ID=local-dev
ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON={"local-dev":"MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgv1vJWrZWg8ydq4ibGe6/IqEw/BEIcgI+Y3c6hnoeF2ehRANCAAQ08rGhw2reTThF/ecfafLzjphjmqvySHJZwqKfqSn8YPK/1GMWODPWounlJ2MZb/iS/D69K0k9durGsGjaSb0I"}
# Local QA only: shorten the default seven-day wait to one minute.
ESCROW_HOLD_DURATION_MS=60000
```

**This published key is a disposable development fixture, not a secret. Never use it
outside local development or with real accounts.** Production and staging remain
disabled. Software mode does not provide hardware isolation, and notification fan-out
is not implemented in this phase; notification hooks only log events.

To exercise the flow, sign in on a second browser profile, start recovery, then cancel
it from the original signed-in device after reloading. Repeat without cancellation,
wait one minute, and finish recovery on the second device. Keep its browser storage:
the pending request's resume proof is stored in IndexedDB, not sent to application logs.
Use an up-to-date browser on a personal device. Starting a seven-day request is
disabled in public-computer mode and when cross-tab storage locking is unavailable.

Tenant `auth.sss.escrowEnclaveMode` and `escrowEnclavePublicKeys` are authoritative.
For isolated consumers without explicit tenant values, `VITE_ESCROW_ENCLAVE_MODE`
and comma-separated `VITE_ESCROW_ENCLAVE_PUBLIC_KEYS` provide legacy fallbacks.
Nitro mode remains fail-closed until attestation verification is implemented.

To replace this disposable pair, run from `apps/learn-card-app` and update both the
local tenant public key and the server's private-key value together:

```bash
bun -e 'import { generateEscrowKeyPair } from "@learncard/sss-key-manager"; console.log(JSON.stringify(await generateEscrowKeyPair()));'
```

The waiting screen's **Cancel request** button explains how to cancel from a
signed-in device. It does not delete the local recovery proof or claim to cancel
the server request: cancellation requires proof of account ownership.
Use **Check request status** to discover a cancellation before the waiting period ends.

### Required services

- A running **lca-api** server instance
- **Redis** (for OTP codes, QR login sessions, and caching)
- **MongoDB** (for UserKey records)
- A **Firebase** project (or other supported auth provider) with Admin SDK credentials
- **Postmark** account (for email delivery in production) — optional, falls back to logging

---

## LCA API Server Environment Variables

### Required

| Variable                        | Description                                                                                                                                                                          | Example                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `SEED`                          | Server-side encryption seed. Used to derive the KEK for AES-256-GCM auth share encryption at rest. **Critical for security — if lost, all stored auth shares become unrecoverable.** | A long, random, secret string    |
| `REDIS_HOST`                    | Redis hostname. **Must be `REDIS_HOST`**, not `REDIS_URL` — the cache module reads this specific variable.                                                                           | `redis.example.com`              |
| `REDIS_PORT`                    | Redis port.                                                                                                                                                                          | `6379`                           |
| `GOOGLE_APPLICATION_CREDENTIAL` | Firebase Admin SDK service account JSON (stringified). Used for token verification, user management, and custom token generation.                                                    | `{"type":"service_account",...}` |

### Email Delivery (Production)

Emails are rendered locally via [`@learncard/email-templates`](../../core-concepts/tenant-branded-emails.md) and delivered through Postmark as raw HTML. Tenant branding (brand name, logo, colors, from-domain) is applied automatically based on the `X-Tenant-Id` / `Origin` header on each request. See [Configure Tenant-Branded Emails](../configure-tenant-branded-emails.md) for how to register new tenants.

| Variable                                      | Description                                                                                                                                                                    | Example                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `POSTMARK_SERVER_TOKEN`                       | Postmark API key. If unset, email delivery falls back to console logging.                                                                                                      | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `POSTMARK_FROM_EMAIL`                         | Default "From" email address. Overridden per-email by `getFrom()` when tenant `fromDomain` is set.                                                                             | `noreply@example.com`                  |
| `POSTMARK_BRAND_NAME`                         | Legacy brand name. Used only when the active tenant has no `brandName` override.                                                                                               | `LearnCard`                            |
| `DEFAULT_TENANT_ID`                           | _(Optional)_ Fallback tenant ID used when neither `X-Tenant-Id` nor `Origin` resolves to a known tenant. Useful for per-tenant deploys and cron jobs. Defaults to `learncard`. | `vetpass`                              |
| `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS`          | _(Optional override)_ Real Postmark template alias for login OTP emails. When set, the adapter still renders locally first; this value is only used if local rendering fails.  | `login-code`                           |
| `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS` | _(Optional override)_ Same as above, for endorsement request emails.                                                                                                           | `endorsement-request`                  |
| `POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS` | _(Optional override)_ Same as above, for recovery email verification codes.                                                                                                    | `recovery-email-code`                  |
| `POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS`        | _(Optional override)_ Same as above, for recovery key backup emails.                                                                                                           | `recovery-key`                         |

{% hint style="info" %}
**Migration from plain-text fallbacks (pre-LC-1749)**

Earlier deployments required `POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS` and `POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS` to avoid falling back to unstyled plain-text emails. These env vars are now pure overrides — the server always renders the React Email template from `@learncard/email-templates` with full tenant branding. You may remove them from your deployment configuration.
{% endhint %}

{% hint style="warning" %}
The template variables changed from numeric IDs to string aliases in an earlier release:

- `POSTMARK_LOGIN_CODE_TEMPLATE_ID` → `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS`
- `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ID` → `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS`

Update your deployment configuration accordingly.
{% endhint %}

### Automatic Escrow Recovery (Optional)

Keep disabled in production until notification delivery and the attested enclave backend are deployed. Software mode is for development and CI only; its clock is host-controlled and notifications currently only log event kinds.

These settings configure the running API process. The current Serverless deployment does not forward them into Lambda; setting them in the deployment shell alone does not enable the deployed backend.

| Variable                                    | Description                                                                                                         | Example                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `ESCROW_ENCLAVE_MODE`                       | Unset disables all escrow routes. `software` enables the development backend; `remote` is reserved and unavailable. | `software`                     |
| `ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON` | Secret JSON map of key IDs to PKCS#8 base64 P-256 private keys; required in software mode.                          | `{"dev-key":"<PKCS8_BASE64>"}` |
| `ESCROW_ENCLAVE_ACTIVE_KEY_ID`              | Active enrollment key ID, required in the software key map.                                                         | `dev-key`                      |
| `ESCROW_HOLD_DURATION_MS`                   | Positive integer waiting period in milliseconds; defaults to seven days. Shorten only for tests.                    | `604800000`                    |

### Monitoring (Optional)

| Variable     | Description                                                  | Example                     |
| ------------ | ------------------------------------------------------------ | --------------------------- |
| `SENTRY_DSN` | Sentry DSN for error tracking. If unset, Sentry is disabled. | `https://xxx@sentry.io/123` |
| `SENTRY_ENV` | Sentry environment label.                                    | `production`                |

### Test / Development Modes

| Variable      | Description                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `IS_OFFLINE`  | Set to `'true'` to bypass Firebase token verification (parses JWT locally). For local development.               |
| `IS_E2E_TEST` | Set to `'true'` to enable E2E test mode: email delivery uses log adapter, Firebase Admin SDK calls are bypassed. |

---

## Frontend Environment Variables (LearnCard App)

The frontend reads environment variables with a dual-prefix fallback: `VITE_*` first, then `REACT_APP_*`.

### SSS Configuration

| Variable (Vite)       | Variable (CRA)                      | Default                       | Description                                                                 |
| --------------------- | ----------------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `VITE_KEY_DERIVATION` | `REACT_APP_KEY_DERIVATION_PROVIDER` | `'sss'`                       | Key derivation strategy. Set to `'sss'` for SSS or `'web3auth'` for legacy. |
| `VITE_SSS_SERVER_URL` | `REACT_APP_SSS_SERVER_URL`          | `'http://localhost:5100/api'` | LCA API base URL for SSS key operations.                                    |
| `VITE_AUTH_PROVIDER`  | `REACT_APP_AUTH_PROVIDER`           | `'firebase'`                  | Auth provider. Currently only `'firebase'` is implemented.                  |

### Feature Flags

| Variable                             | Default   | Description                                                                        |
| ------------------------------------ | --------- | ---------------------------------------------------------------------------------- |
| `VITE_ENABLE_EMAIL_BACKUP_SHARE`     | `'true'`  | Auto-send backup share to user's email during key setup. Set `'false'` to disable. |
| `VITE_REQUIRE_EMAIL_FOR_PHONE_USERS` | `'true'`  | Require phone-only users to link an email before proceeding.                       |
| `VITE_ENABLE_AUTH_DEBUG_WIDGET`      | `'false'` | Show auth/key debug overlay. Auto-enabled in dev mode.                             |

### Web3Auth (Migration Period)

These are still read to support the legacy `web3auth` key derivation fallback during migration:

| Variable (Vite)             | Variable (CRA)                   | Description                  |
| --------------------------- | -------------------------------- | ---------------------------- |
| `VITE_WEB3AUTH_CLIENT_ID`   | `REACT_APP_WEB3AUTH_CLIENT_ID`   | Web3Auth dashboard client ID |
| `VITE_WEB3AUTH_NETWORK`     | `REACT_APP_WEB3AUTH_NETWORK`     | Web3Auth network             |
| `VITE_WEB3AUTH_VERIFIER_ID` | `REACT_APP_WEB3AUTH_VERIFIER_ID` | Web3Auth verifier name       |
| `VITE_WEB3AUTH_RPC_TARGET`  | `REACT_APP_WEB3AUTH_RPC_TARGET`  | Ethereum RPC URL             |

Once all users are migrated, these can be removed.

---

## Infrastructure Requirements

### Redis

Redis is required for:

- **OTP codes** for login and recovery email verification (stored with short TTLs)
- **QR login sessions** (ephemeral, auto-evicted)
- **General caching**

A single Redis instance is sufficient. The lca-api connects via `REDIS_HOST` + `REDIS_PORT`.

### MongoDB

MongoDB stores the `UserKey` collection, which contains:

- The user's encrypted auth share
- Previous auth share versions (for share versioning)
- Recovery method metadata
- Contact method and DID associations

### Firebase Admin SDK

The Firebase Admin SDK is used for:

- **Token verification** — validating Firebase ID tokens from the frontend
- **User management** — updating user email/phone during contact method upgrades
- **Custom tokens** — issuing new Firebase auth tokens after contact method changes

The service account JSON is provided via `GOOGLE_APPLICATION_CREDENTIAL`.

---

## Deployment Checklist

1. **Set `SEED`** on the lca-api server. This is the most critical secret — back it up securely. If lost, all stored auth shares become permanently unrecoverable.

2. **Set `REDIS_HOST`** (not `REDIS_URL`) and `REDIS_PORT` on the lca-api server.

3. **Set `GOOGLE_APPLICATION_CREDENTIAL`** with the Firebase Admin SDK service account JSON.

4. **Configure Postmark** (production only): set `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL`, `POSTMARK_BRAND_NAME`, and the template alias variables.

5. **Set frontend env vars**: `VITE_KEY_DERIVATION=sss` and `VITE_SSS_SERVER_URL` pointing to your lca-api instance.

6. **Verify** by logging in with a new account and checking that the AuthCoordinator reaches the `ready` state.

---

## Troubleshooting

| Symptom                         | Likely Cause                            | Fix                                                   |
| ------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| OTP codes not working           | lca-api using in-memory Redis mock      | Verify `REDIS_HOST` is set (not `REDIS_URL`)          |
| "Failed to verify token" errors | Missing or invalid Firebase credentials | Check `GOOGLE_APPLICATION_CREDENTIAL`                 |
| Auth shares not persisting      | MongoDB connection issue                | Check `LCA_API_MONGO_URI` and `LCA_API_MONGO_DB_NAME` |
| Emails not sending              | Postmark not configured                 | Set `POSTMARK_SERVER_TOKEN` and `POSTMARK_FROM_EMAIL` |
