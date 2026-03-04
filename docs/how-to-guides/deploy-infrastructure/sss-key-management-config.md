---
description: Configure and deploy SSS key management for your LearnCard instance
---

# SSS Key Management Configuration

This guide covers the environment variables and infrastructure needed to deploy LearnCard with the self-hosted Shamir Secret Sharing (SSS) key management system.

## Prerequisites

- A running **lca-api** server instance
- **Redis** (for OTP codes, QR login sessions, and caching)
- **MongoDB** (for UserKey records)
- A **Firebase** project (or other supported auth provider) with Admin SDK credentials
- **Postmark** account (for email delivery in production) — optional, falls back to logging

---

## LCA API Server Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `SEED` | Server-side encryption seed. Used to derive the KEK for AES-256-GCM auth share encryption at rest. **Critical for security — if lost, all stored auth shares become unrecoverable.** | A long, random, secret string |
| `REDIS_HOST` | Redis hostname. **Must be `REDIS_HOST`**, not `REDIS_URL` — the cache module reads this specific variable. | `redis.example.com` |
| `REDIS_PORT` | Redis port. | `6379` |
| `GOOGLE_APPLICATION_CREDENTIAL` | Firebase Admin SDK service account JSON (stringified). Used for token verification, user management, and custom token generation. | `{"type":"service_account",...}` |

### Email Delivery (Production)

| Variable | Description | Example |
|---|---|---|
| `POSTMARK_SERVER_TOKEN` | Postmark API key. If unset, email delivery falls back to console logging. | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `POSTMARK_FROM_EMAIL` | Default "From" email address for all outbound emails. | `noreply@example.com` |
| `POSTMARK_BRAND_NAME` | Brand name used in email templates. | `LearnCard` |
| `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS` | Postmark template alias for login verification OTP emails. | `login-code` |
| `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS` | Postmark template alias for endorsement request emails. | `endorsement-request` |

{% hint style="warning" %}
The template variables changed from numeric IDs to string aliases in this release:
- `POSTMARK_LOGIN_CODE_TEMPLATE_ID` → `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS`
- `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ID` → `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS`

Update your deployment configuration accordingly.
{% endhint %}

### Monitoring (Optional)

| Variable | Description | Example |
|---|---|---|
| `SENTRY_DSN` | Sentry DSN for error tracking. If unset, Sentry is disabled. | `https://xxx@sentry.io/123` |
| `SENTRY_ENV` | Sentry environment label. | `production` |

### Test / Development Modes

| Variable | Description |
|---|---|
| `IS_OFFLINE` | Set to `'true'` to bypass Firebase token verification (parses JWT locally). For local development. |
| `IS_E2E_TEST` | Set to `'true'` to enable E2E test mode: email delivery uses log adapter, Firebase Admin SDK calls are bypassed. |

---

## Frontend Environment Variables (LearnCard App)

The frontend reads environment variables with a dual-prefix fallback: `VITE_*` first, then `REACT_APP_*`.

### SSS Configuration

| Variable (Vite) | Variable (CRA) | Default | Description |
|---|---|---|---|
| `VITE_KEY_DERIVATION` | `REACT_APP_KEY_DERIVATION_PROVIDER` | `'sss'` | Key derivation strategy. Set to `'sss'` for SSS or `'web3auth'` for legacy. |
| `VITE_SSS_SERVER_URL` | `REACT_APP_SSS_SERVER_URL` | `'http://localhost:5100/api'` | LCA API base URL for SSS key operations. |
| `VITE_AUTH_PROVIDER` | `REACT_APP_AUTH_PROVIDER` | `'firebase'` | Auth provider. Currently only `'firebase'` is implemented. |

### Feature Flags

| Variable | Default | Description |
|---|---|---|
| `VITE_ENABLE_EMAIL_BACKUP_SHARE` | `'true'` | Auto-send backup share to user's email during key setup. Set `'false'` to disable. |
| `VITE_REQUIRE_EMAIL_FOR_PHONE_USERS` | `'true'` | Require phone-only users to link an email before proceeding. |
| `REACT_APP_ENABLE_SSS_MIGRATION` | — | Set to `'true'` to enable automatic Web3Auth → SSS migration for existing users. |
| `VITE_ENABLE_AUTH_DEBUG_WIDGET` | `'false'` | Show auth/key debug overlay. Auto-enabled in dev mode. |

### Web3Auth (Migration Period)

These are still read to support the legacy `web3auth` key derivation fallback during migration:

| Variable (Vite) | Variable (CRA) | Description |
|---|---|---|
| `VITE_WEB3AUTH_CLIENT_ID` | `REACT_APP_WEB3AUTH_CLIENT_ID` | Web3Auth dashboard client ID |
| `VITE_WEB3AUTH_NETWORK` | `REACT_APP_WEB3AUTH_NETWORK` | Web3Auth network |
| `VITE_WEB3AUTH_VERIFIER_ID` | `REACT_APP_WEB3AUTH_VERIFIER_ID` | Web3Auth verifier name |
| `VITE_WEB3AUTH_RPC_TARGET` | `REACT_APP_WEB3AUTH_RPC_TARGET` | Ethereum RPC URL |

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

6. **Enable migration** (if upgrading from Web3Auth): set `REACT_APP_ENABLE_SSS_MIGRATION=true`.

7. **Verify** by logging in with a new account and checking that the AuthCoordinator reaches the `ready` state.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| OTP codes not working | lca-api using in-memory Redis mock | Verify `REDIS_HOST` is set (not `REDIS_URL`) |
| "Failed to verify token" errors | Missing or invalid Firebase credentials | Check `GOOGLE_APPLICATION_CREDENTIAL` |
| Auth shares not persisting | MongoDB connection issue | Check `LCA_API_MONGO_URI` and `LCA_API_MONGO_DB_NAME` |
| Emails not sending | Postmark not configured | Set `POSTMARK_SERVER_TOKEN` and `POSTMARK_FROM_EMAIL` |
