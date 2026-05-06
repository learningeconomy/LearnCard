# LearnCard Network lca-api Service

The LearnCard Application API (`lca-api`) is the tRPC service backing client-side authentication, SSS key management, credential signing via signing-authority, recovery flows, and transactional email delivery for the LearnCard app and partner tenants.

## Build & Development Commands

- Build: `pnpm build`
- Dev: `pnpm dev` — watches and rebuilds
- Start: `pnpm start` — local server (default port from env, typically 5100)
- Test: `pnpm test`
- Run tests once (non-watch): `pnpm test -- run` (equivalent to `vitest run`)
- Run single test: `pnpm test test/credentials.spec.ts`
- Typecheck: `pnpm exec tsc --noEmit`

## Code Style Guidelines

- **TypeScript**: Strict typing, interfaces in dedicated files under `src/types/`
- **Imports**: Path aliases (`@helpers/*`, `@routes/*`, `@cache/*`)
- **Routes**: tRPC routers under `src/routes/` — one router per resource
- **Error handling**: `TRPCError` with specific codes (`BAD_REQUEST`, `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR`, `NOT_FOUND`)
- **Named exports only** — no one-line default exports
- **Explicit return types** on all exported functions

## Request Lifecycle & Context

Every request goes through `createContext` in `src/routes/index.ts`, which:

1. **Resolves the tenant** via `resolveTenantFromRequest(headers)` from `@learncard/email-templates` and attaches it as `ctx.tenant`. Priority: `X-Tenant-Id` header → `Origin` / `Referer` hostname → `DEFAULT_TENANT_ID` env → `'learncard'`.
2. **Verifies DID auth VP** (when `Authorization: Bearer <jwt>` is present) and attaches `ctx.user = { did, isChallengeValid, authorizedDid }`.
3. **Extracts client IP** for rate limiting from `x-forwarded-for` / AWS source IP.
4. Attaches `domain`, `debug`, and `clientIp` for downstream use.

### Route Procedures

- `openRoute` — unauthenticated, tenant + Sentry tracing attached
- `didRoute` — requires `ctx.user.did` (DID-auth VP verified, challenge may be stale)
- `didAndChallengeRoute` — requires `didRoute` + live challenge
- `authorizedDidRoute` — requires `didRoute` + DID in `AUTHORIZED_DIDS` env allowlist

## SSS Key Management Routes (`src/routes/keys.ts`)

The `keysRouter` implements the server side of Shamir Secret Sharing key management used by `@learncard/sss-key-manager`:

| Route | Purpose |
|-------|---------|
| `POST /keys/auth-share` | Fetch the encrypted auth share for a user by contact method + provider |
| `PUT /keys/auth-share` | Store / rotate the auth share; manages `shareVersion` for historical lookup |
| `GET /keys/recovery` | Fetch an encrypted recovery share (passkey / phrase / backup) |
| `POST /keys/recovery` | Register a recovery method (passkey / phrase / backup / email) |
| `POST /keys/recovery-email` | Start recovery email verification (sends 6-digit OTP) |
| `POST /keys/recovery-email/verify` | Verify the OTP and persist the recovery email on the UserKey |
| `POST /keys/email-backup` | Relay the emailed recovery share to the user's primary or recovery email. **Share is never persisted** — in-memory for the duration of the request. |
| `POST /keys/upgrade-contact-method` | Upgrade phone-only users to email + phone |
| `POST /keys/migrate` | Mark a UserKey as migrated from the legacy Web3Auth pathway |

### Important Invariants

- **Auth shares are encrypted at rest** with a KEK derived from `SEED`. Losing `SEED` means every stored auth share is permanently unrecoverable.
- **Recovery shares are encrypted client-side** (except the phrase method, which stores only shareVersion metadata).
- **Email share is never written to the DB.** The `sendEmailBackup` route holds it in memory only for the duration of the request; Postmark receives it but never stores it.
- **`shareVersion` pairs a device share with a matching auth share.** On rotation, previous versions are kept in `previousAuthShares` so users with stale device shares can still recover.

## Email Delivery & Tenant Branding

All transactional emails (login OTP, recovery email OTP, recovery key, endorsement request) are rendered locally via [`@learncard/email-templates`](../../../packages/email-templates/README.md) and delivered as raw HTML through Postmark.

### Architecture

```
route handler → getDeliveryService().send({ templateAlias, templateModel, branding, from })
                    │
                    ▼
           PostmarkAdapter.send()
                    │
                    ├─ LOCAL_TEMPLATE_ALIASES[alias] → local TemplateId?
                    │     │ yes
                    │     ▼
                    │  renderEmail(id, branding, data) → { html, text, subject }
                    │     │
                    │     ▼
                    │  Postmark.sendEmail (raw HTML)
                    │
                    ├─ no, but `inferLocalTemplateId()` heuristic matches model shape
                    │     └─ same as above
                    │
                    └─ no match → Postmark.sendEmailWithTemplate (legacy, real alias only)
```

The adapter additionally re-throws when local rendering fails for a **sentinel alias** (e.g. `'recovery-key'`, `'recovery-email-code'`) — the fallback to `sendEmailWithTemplate` is skipped because no Postmark template matches the sentinel.

### Rules for Route Authors

- **Always pass `branding: ctx.tenant?.emailBranding`** to `getDeliveryService().send()`. Calls without branding render with LearnCard defaults regardless of the caller's tenant.
- **Use `getFrom({ mailbox, branding: ctx.tenant?.emailBranding })`** for the `from` field so the domain matches the tenant (e.g. `recovery@vetpass.app`).
- **Use the local template ID as the `templateAlias`** — e.g. `'recovery-key'`, `'recovery-email-code'`, `'login-verification-code'`, `'endorsement-request'`. These are pre-registered as sentinels in `LOCAL_TEMPLATE_ALIASES`. Env-var overrides (`POSTMARK_*_TEMPLATE_ALIAS`) are optional; `templateAlias: RECOVERY_KEY_TEMPLATE_ALIAS || 'recovery-key'` is the canonical pattern.
- **Do not write plain-text fallbacks.** The adapter renders the React Email template regardless; plain-text branches are dead code and should be deleted on sight.

### Env Vars

See [`docs/how-to-guides/deploy-infrastructure/sss-key-management-config.md`](../../../docs/how-to-guides/deploy-infrastructure/sss-key-management-config.md) for the full list. Key ones:

| Var | Purpose |
|-----|---------|
| `POSTMARK_SERVER_TOKEN` | Required for delivery; absent → log adapter |
| `POSTMARK_FROM_EMAIL` | Default sender (overridden per-tenant by `getFrom()`) |
| `DEFAULT_TENANT_ID` | Fallback tenant when header-based resolution fails |
| `POSTMARK_*_TEMPLATE_ALIAS` | **Optional overrides** — adapter renders locally first regardless |

## Testing Notes

- Test files in `test/` spin up a Fastify server via `getClient()` and exercise routes with `fetch`.
- `IS_E2E_TEST=true` disables Firebase Admin SDK calls and switches email delivery to the log adapter.
- For tenant-aware tests, set `X-Tenant-Id` on the request; `createContext` will pick it up and `ctx.tenant.emailBranding` will be populated from the registry in `@learncard/email-templates`.

## Cross-References

- [Tenant-Branded Emails (architecture)](../../../docs/core-concepts/tenant-branded-emails.md) — end-to-end email flow
- [Configure Tenant-Branded Emails](../../../docs/how-to-guides/configure-tenant-branded-emails.md) — operator-facing setup
- [SSS Key Management Config](../../../docs/how-to-guides/deploy-infrastructure/sss-key-management-config.md) — env var reference for deployers
- [`@learncard/email-templates` README](../../../packages/email-templates/README.md) — template catalog, tenant registry, preview server
- [`@learncard/sss-key-manager`](../../../packages/sss-key-manager/README.md) — client side of SSS key management
