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

| Route                               | Purpose                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `POST /keys/auth-share`             | Fetch the encrypted auth share for a user by contact method + provider                                          |
| `PUT /keys/auth-share`              | Store / rotate the auth share; manages `shareVersion` for historical lookup                                     |
| `GET /keys/recovery`                | Fetch an encrypted recovery share (passkey / phrase / backup)                                                   |
| `POST /keys/recovery`               | Register a recovery method (passkey / phrase / backup / email)                                                  |
| `POST /keys/recovery-email`         | Start recovery email verification (sends 6-digit OTP)                                                           |
| `POST /keys/recovery-email/verify`  | Verify the OTP and persist the recovery email on the UserKey                                                    |
| `POST /keys/email-backup`           | Proxy a client-encrypted recovery payload to the isolated email relay. The share is never visible to `lca-api`. |
| `POST /keys/upgrade-contact-method` | Upgrade phone-only users to email + phone                                                                       |
| `POST /keys/migrate`                | Mark a UserKey as migrated from the legacy Web3Auth pathway                                                     |

### Escrow recovery routes

The `escrow` tRPC router is disabled unless `ESCROW_ENCLAVE_MODE` is configured.

| Route                          | Procedure                 | Purpose                                                            |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------ |
| `GET /keys/escrow/attestation` | `escrow.getAttestation`   | Enclave public key and hold duration                               |
| `POST /keys/escrow`            | `escrow.enroll`           | Verify and store automatic recovery material                       |
| `DELETE /keys/escrow`          | `escrow.remove`           | Remove material and optionally opt out                             |
| `POST /keys/escrow/opt-in`     | `escrow.optIn`            | Allow enrollment again                                             |
| `POST /keys/escrow/recover`    | `escrow.startRecovery`    | Start a waiting period without resetting an existing hold          |
| `GET /keys/escrow/status`      | `escrow.getStatus`        | Check status; active devices send provider auth via `X-Auth-Token` |
| `POST /keys/escrow/cancel`     | `escrow.cancelRecovery`   | DID owner cancels a pending hold                                   |
| `POST /keys/escrow/complete`   | `escrow.completeRecovery` | Claim an elapsed hold and release sealed recovery material once    |

### Important Invariants

- **Auth shares are encrypted at rest** with a KEK derived from `SEED`. Losing `SEED` means every stored auth share is permanently unrecoverable.
- **Recovery shares are encrypted client-side** (except the phrase method, which stores only shareVersion metadata).
- **Email share is encrypted before leaving the client.** The `sendEmailBackup` route receives only a relay-key ciphertext envelope and a confirmation code, then waits for isolated relay acceptance before recording pending recovery metadata.
- **`shareVersion` pairs a device share with a matching auth share.** On rotation, previous versions are kept in `previousAuthShares` so users with stale device shares can still recover.

## OIDC identity provider (AD-2)

`auth.requestLoginTicket` and `auth.requestSocialLoginTicket` prove ownership in-app and issue 60-second single-use tickets. The ticket travels in URLs (`login_hint` on the Keycloak auth URL and again on the `/oidc/authorize` redirect), so it lands in browser history and API Gateway access logs; single-use + the short TTL is what makes that acceptable. Do not lengthen the TTL without revisiting that.
`src/oidc.ts` serves discovery, JWKS, authorize, token and userinfo in Docker and Lambda; no CORS or duplicate tRPC endpoints.
Subjects are random permanent UUIDs in `AuthSubject`, keyed by normalized email or Google/Apple subject.
`requestSocialLoginTicket` is the one exception to "never auto-linked by email": when `verifySocialIdToken`
returns a verified email (Apple's private-relay addresses count), a brand-new `<provider>:<sub>` identity
adopts the existing `email:<address>` identity's `subject` via `getOrCreateAuthSubjectLinkedTo`
(`$setOnInsert`), so a user doesn't hit "Account already exists" switching from email-code to native
social sign-in. It never runs the other direction, and an already-existing `<provider>:<sub>` record
keeps its own `subject` — only a first-time native sign-in can be linked this way.
Require `OIDC_ISSUER`, an exact redirect allowlist, and a token client secret; any deployed stage (`NODE_ENV=production` or `LAMBDA_STAGE` set) additionally requires an RSA private `OIDC_SIGNING_KEY_JWK`.
Login codes, tickets and authorization codes are consumed with `getDel` (`src/cache/getDel.ts`, Redis `GETDEL`, requires Redis >= 6.2).
Rate limiting is two layers, both keyed on `request.ip` (API Gateway `sourceIp` under `serverless-http`; `x-forwarded-for` is attacker-controlled and never trusted). Both fail open if Redis is unreachable. **Layer 1 — failures only** (`src/helpers/rate-limit.helpers.ts`, Redis counters, 10-minute window): the ticket routes use 5 per email plus a 50-per-IP backstop; `/oidc/authorize` (bad client/redirect, invalid ticket) and `/oidc/token` (`invalid_client` only) each use 50 per IP and answer `429 temporarily_unavailable` + `Retry-After` (or an OAuth error redirect once the `redirect_uri` is validated). `invalid_grant` at the token endpoint is deliberately not counted: only the broker (one NAT IP) can reach that branch, and counting the codes it relays would let anyone lock every user out. **Layer 2 — all requests** (`@fastify/rate-limit`, registered in `oidcFastifyPlugin`, Redis-backed when available): 300/min per IP globally so Keycloak's discovery/JWKS polling is never blocked; 60/min per IP on the browser-facing `/oidc/authorize`; a 3000/min sanity ceiling on the server-to-server `/oidc/token` and `/oidc/userinfo` (every legitimate call shares the broker's egress IP, so a tight cap there is a global login ceiling). Layer 2 exists mainly so CodeQL's `js/missing-rate-limiting` recognises the routes; do not remove either layer.
Unit coverage is in `test/oidc.spec.ts` and `test/auth-tickets.spec.ts`; broker import coverage is gated by `KEYCLOAK_INTEGRATION`.
Phone OTP remains deferred. The complete live broker round-trip and Firebase-era mapping proof
are in `test/keycloak-broker-roundtrip.integration.spec.ts` and
`test/keycloak-migration.integration.spec.ts`, gated on both `KEYCLOAK_INTEGRATION=true`
and `KEYCLOAK_ROUNDTRIP=true`. With both flags, `vitest.integration.config.ts` selects
only the live auth suites and aliases Mongo to the explicitly configured API database;
without them, existing temporary-Mongo integration suites retain their setup.
See `infra/keycloak/README.md` at the repository root for the local command.

`bun run provision:keycloak` previews the AD-10 mapping migration; `--apply` writes,
`--email` and `--limit` restrict a batch. Never use this operator-only email join in a
runtime login route. Dry-run performs no resource writes, including no index creation.
Existing AuthSubjects are read, not upserted, so repeat apply does not alter lastLoginAt.
The final global email mapping coverage gate must pass before cutover. Phone-only
accounts remain a separately reported deferred cohort.

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

- Test files using `getClient()` exercise tRPC procedures via `appRouter.createCaller()`, not an HTTP server. Header-context tests inject `providerToken`; they do not verify HTTP header extraction or CORS.
- `IS_E2E_TEST=true` disables Firebase Admin SDK calls and switches email delivery to the log adapter.
- For tenant-aware tests, set `X-Tenant-Id` on the request; `createContext` will pick it up and `ctx.tenant.emailBranding` will be populated from the registry in `@learncard/email-templates`.

## Cross-References

- [Tenant-Branded Emails (architecture)](../../../docs/core-concepts/tenant-branded-emails.md) — end-to-end email flow
- [Configure Tenant-Branded Emails](../../../docs/how-to-guides/configure-tenant-branded-emails.md) — operator-facing setup
- [SSS Key Management Config](../../../docs/how-to-guides/deploy-infrastructure/sss-key-management-config.md) — env var reference for deployers
- [`@learncard/email-templates` README](../../../packages/email-templates/README.md) — template catalog, tenant registry, preview server
- [`@learncard/sss-key-manager`](../../../packages/sss-key-manager/README.md) — client side of SSS key management
