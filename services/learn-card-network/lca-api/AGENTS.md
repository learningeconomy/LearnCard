# LearnCard Network lca-api Service

The LearnCard Application API (`lca-api`) is the tRPC service backing client-side authentication, SSS key management, credential signing via signing-authority, recovery flows, and transactional email delivery for the LearnCard app and partner tenants.

## Build & Development Commands

- Build: `bun run build`
- Dev: `bun run dev` — watches and rebuilds
- Start: `bun run start` — local server (default port from env, typically 5100)
- Test: `bun run test`
- Run tests once (non-watch): `bun run test -- run` (equivalent to `vitest run`)
- Run single test: `bun run test test/credentials.spec.ts`
- Typecheck: `bunx tsc --noEmit`

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

| Route                               | Purpose                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /keys/auth-share`             | Fetch the encrypted auth share for a user by contact method + provider                                                                              |
| `PUT /keys/auth-share`              | Store / rotate the auth share; manages `shareVersion` for historical lookup                                                                         |
| `GET /keys/recovery`                | Fetch an encrypted recovery share (passkey / phrase / backup)                                                                                       |
| `POST /keys/recovery`               | Register a recovery method (passkey / phrase / backup / email)                                                                                      |
| `POST /keys/recovery-email`         | Start recovery email verification (sends 6-digit OTP)                                                                                               |
| `POST /keys/recovery-email/verify`  | Verify the OTP and persist the recovery email on the UserKey                                                                                        |
| `POST /keys/email-backup`           | Relay the emailed recovery share to the user's primary or recovery email. **Share is never persisted** — in-memory for the duration of the request. |
| `POST /keys/upgrade-contact-method` | Upgrade phone-only users to email + phone                                                                                                           |
| `POST /keys/migrate`                | Mark a UserKey as migrated from the legacy Web3Auth pathway                                                                                         |

### Important Invariants

- **Auth shares are encrypted at rest** with a KEK derived from `SEED`. Losing `SEED` means every stored auth share is permanently unrecoverable.
- **Recovery shares are encrypted client-side** (except the phrase method, which stores only shareVersion metadata).
- **Email share is never written to the DB.** The `sendEmailBackup` route holds it in memory only for the duration of the request; Postmark receives it but never stores it.
- **`shareVersion` pairs a device share with a matching auth share.** On rotation, previous versions are kept in `previousAuthShares` so users with stale device shares can still recover.

## OIDC identity provider (AD-2)

`auth.requestLoginTicket` and `auth.requestSocialLoginTicket` prove ownership in-app and issue 60-second single-use tickets.
`src/oidc.ts` serves discovery, JWKS, authorize, token and userinfo in Docker and Lambda; no CORS or duplicate tRPC endpoints.
Subjects are random permanent UUIDs in `AuthSubject`, keyed by normalized email or Google/Apple subject (never auto-linked by email).
Require `OIDC_ISSUER`, an exact redirect allowlist, and a token client secret; any deployed stage (`NODE_ENV=production` or `LAMBDA_STAGE` set) additionally requires an RSA private `OIDC_SIGNING_KEY_JWK`.
Login codes, tickets and authorization codes are consumed with `getDel` (`src/cache/getDel.ts`, Redis `GETDEL`, requires Redis >= 6.2).
Rate limiting is two layers, both keyed on the first `x-forwarded-for` hop (else the socket address). **Layer 1 — failures only** (`src/helpers/rate-limit.helpers.ts`, Redis counters, 10-minute window): the ticket routes use 5 per email plus a 50-per-IP backstop; `/oidc/authorize` (bad client/redirect, invalid ticket) and `/oidc/token` (`invalid_client`, `invalid_grant`) each use 50 per IP and answer `429 temporarily_unavailable` + `Retry-After` (or an OAuth error redirect once the `redirect_uri` is validated). **Layer 2 — all requests** (`@fastify/rate-limit`, registered in `oidcFastifyPlugin`, Redis-backed when available): 300/min per IP globally so Keycloak's discovery/JWKS polling is never blocked, tightened to 60/min per IP on `/oidc/authorize` and `/oidc/token` via the route `config.rateLimit` option. Layer 2 exists mainly so CodeQL's `js/missing-rate-limiting` recognises the routes; do not remove either layer.
Unit coverage is in `test/oidc.spec.ts` and `test/auth-tickets.spec.ts`; broker import coverage is gated by `KEYCLOAK_INTEGRATION`.
Phone OTP and the complete live broker round-trip remain deferred; see the migration plan AD-2/AD-10.

### Keycloak broker gotchas

- **Client secret encoding.** Keycloak's broker sends `client_secret_basic` credentials **raw** (not form-url-encoded, contrary to RFC 6749 §2.3.1). `/oidc/token` therefore compares the raw pair first and only falls back to the URL-decoded pair. Secrets containing `+` or `%` are fine.
- **Phase 2 migration must create the federated identity link.** The realm uses the default `first broker login` flow with `trustEmail: true`. If the migration script pre-creates a Keycloak user by email **without** also creating the `lca-api` federated identity link (`sub` = the `AuthSubject.subject` UUID), the user's first silent hop stops on Keycloak's "Handle Existing Account" web page ("User with email X already exists. How do you want to continue?"), which breaks the no-web-form guarantee. Pre-seed `AuthSubject` and the Keycloak `federatedIdentities` entry together.

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

| Var                         | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `POSTMARK_SERVER_TOKEN`     | Required for delivery; absent → log adapter                       |
| `POSTMARK_FROM_EMAIL`       | Default sender (overridden per-tenant by `getFrom()`)             |
| `DEFAULT_TENANT_ID`         | Fallback tenant when header-based resolution fails                |
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
