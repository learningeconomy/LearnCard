# LearnCard Network lca-api Service

The LearnCard Application API (`lca-api`) is the tRPC service backing client-side authentication, SSS key management, credential signing via signing-authority, recovery flows, and transactional email delivery for the LearnCard app and partner tenants.

## Build & Development Commands

### Backend configuration model

Configuration resolves in layers, lowest to highest precedence:

1. Schema defaults (`src/config/environment.ts` Zod `.default()`s).
2. Checked-in **non-secret** base config `config/config.json`.
3. Checked-in **non-secret** per-stage config `config/config.<stage>.json`.
4. Runtime AWS secrets bundle (Lambda only).
5. Real environment variables (always win). Empty strings are unset.

The stage is `LAMBDA_STAGE` on Lambda, else `CONFIG_STAGE`; an unknown stage uses
the base `config/config.json` only (no per-stage file). The config stage files are
**public by design** — put only non-secret config in them. Credentials,
authorization allowlists (`AUTHORIZED_DIDS`), and internal service endpoints are
**secrets** and belong in the runtime bundle or local env, never the stage files.

For Lambda `trpc`/`api`, set the deploy environment variable `RUNTIME_SECRETS_ID` to
`lca-api/<stage>/runtime-secrets` (or its ARN in the Lambda account/region). Provision
the secret before enabling the variable. Its SecretString is a flat JSON object of
UPPER_SNAKE_CASE environment names to string values, including **all** required
runtime credentials. For example, Firebase is encoded as a string:

```json
{ "GOOGLE_APPLICATION_CREDENTIAL": "{\"type\":\"service_account\",\"...\":\"...\"}" }
```

The Firebase JSON is a **string inside the bundle**, not a nested object. No secret
values belong in checked-in files. `lambda.ts` loads and validates the bundle once
before importing `lambdaApp.ts` and the environment schema. Non-empty explicit env
values win; empty strings are unset. Failed secret loads stop startup with a
sanitized error and can retry; failed application imports remain memoized until
the process is recycled. Redeploy/recycle functions after rotating the bundle.

When the id is absent, no AWS lookup occurs. Deploys retain the GitHub
runtime secrets as environment fallbacks; keep those inputs
until every stage has a bundle. Self-hosters, Docker, local development and CI keep
using plain environment variables — copy `config/config.example.json` to a stage
file (register its static import in `src/config/stageConfig.ts` and rebuild) or
just supply a `.env`. `trpc`, `api`, and `seedMigration` use
`SigningAuthorityExecutionRole`. `didWeb` and `swagger` use the generated default
role, with only a scoped runtime-bundle read grant in addition to Serverless's
execution permissions, not signing-authority KMS access. All five receive the
bundle id and run in the service VPC. Explicit function roles do not inherit the
default role's grants. OIDC has an isolated
`oidcLambda.ts` → `oidcLambdaApp.ts` import path and focused OIDC/cache schemas,
so it never imports the API schema requiring seed and Mongo credentials. Keep that path free of Mongo, models and DIDKit:
a Mongo connect left pending when an idle sandbox freezes crashes the next request after thaw. OIDC gets
its broker settings and keeps its separate signing-key secret and IAM role.
`OIDC_CLIENT_SECRET` stays a GitHub-environment secret on the OIDC function and is
**never** placed in the runtime bundle; that function makes no AWS Secrets Manager
calls for it. Preserve the existing issuer/audience validation.

The Infisical → AWS sync and per-stage cutover are documented in the repo-root
[environment-variables.md](../../../environment-variables.md#infisical--aws-secrets-sync).
The shared `@learncard/service-config` package owns parsing, merging, runtime
loading, stage application and Lambda bootstrap. Brain-service and LearnCloud
adoption remains a separate task.

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

| Route                           | Procedure                     | Purpose                                                                   |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `GET /keys/escrow/attestation`  | `escrow.getAttestation`       | Enclave public key and hold duration                                      |
| `POST /keys/escrow`             | `escrow.enroll`               | Verify and store automatic recovery material                              |
| `DELETE /keys/escrow`           | `escrow.remove`               | Remove material and optionally opt out                                    |
| `POST /keys/escrow/opt-in`      | `escrow.optIn`                | Allow enrollment again                                                    |
| `POST /keys/escrow/recover`     | `escrow.startRecovery`        | Start a waiting period without resetting an existing hold                 |
| `GET /keys/escrow/status`       | `escrow.getStatus`            | Check status; active devices send provider auth via `X-Auth-Token`        |
| `POST /keys/escrow/cancel`      | `escrow.cancelRecovery`       | DID owner cancels a pending hold                                          |
| `POST /keys/escrow/cancel-link` | `escrow.cancelRecoveryByLink` | Cancels a pending hold via the single-use email cancel link (no DID auth) |
| `POST /keys/escrow/complete`    | `escrow.completeRecovery`     | Claim an elapsed hold and release sealed recovery material once           |

### Recovery sessions, rebind and PIN sign-in

Lost-login recovery issues single-use, 15-minute tokens (`src/cache/recoverySessions.ts`): a `'recover'` token from `/keys/recovery-session/verify`, then a `'rebind'` token from `useRecoverySession` or `/keys/escrow/complete`.

| Route                                     | Procedure                     | Effect                                                                                                                                         |
| ----------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /keys/recovery-session/rebind`      | `keys.completeRecoveryRebind` | Wiping rebind: new login replaces the old, new split, history purged, methods `pending`, escrow cleared                                        |
| `POST /keys/recovery-session/pin-sign-in` | `keys.completePinSignIn`      | Keep mode: adds the new login (old one stays); shares, history, methods, escrow and contact unchanged. Only PIN-release tokens are accepted    |
| `POST /keys/revoke-other-devices`         | `keys.revokeOtherDevices`     | "Secure my account": owner-authenticated security rotation (same wipe as rebind; only the caller's login stays), CAS on `expectedShareVersion` |

- Only `/keys/escrow/complete` for a `releasePolicy:'pin'` hold mints a `'rebind'` token with `origin:'pin-release'` plus the released `primaryDid`/`shareVersion`. Keep mode trusts those server-side fields, never client input. Waiting-period and `useRecoverySession` tokens can only use the wiping rebind.
- Every recovery token records `userKey.securityEpoch` (missing = 0) at mint; a `'rebind'` token from `useRecoverySession` inherits the `'recover'` session's epoch. Wiping rotations (`/rebind`, revoke) `$inc` the epoch in the same update, and `/rebind` and `/pin-sign-in` include the epoch in their update filter, so any token minted before a revoke or wiping rebind gets CONFLICT. `useRecoverySession` and escrow start (with a recovery session) also reject a stale epoch. Non-wiping rotations leave the epoch alone.
- Keep mode never spends the PIN-release token, so `/rebind` also only accepts one while `userKey.shareVersion` still equals the released version. `/pin-sign-in` peeks at the token before consuming it, so a rejected hold/phrase token or a wrong DID does not burn it.
- The revoke re-splits the same key; it does not evict a device that already holds the private key (see `services/escrow-enclave-app/SECURITY.md` D19). After the commit it emails the contact and verified recovery addresses (`account-secured`, awaited within a 3 s budget, fail-open); the copy assumes the reader may not have run it and may have lost their login, says the recovery methods were reset, and sends them to the tenant support address (or the organization, when there is none) rather than to lost-login recovery, which the revoke itself disabled.
- A successful PIN release sends the `escrow-pin-sign-in` notice ("Not you? Secure your account", link to `/account/secure` on the tenant app URL) instead of `escrow-hold-released`. It is sent fail-open within the escrow notification budget.
- `getEscrowPinStatus().wrongAttempts` counts verified wrong entries only and is omitted for legacy records that cannot tell (until a reservation initialises the verified counter to 0; clients therefore also read the status before a release).
- `escrow.enroll` accepts `expectedPinCharges: { attemptsRemaining, wrongAttempts }` with a new `pinSalt` (the keep-mode same-PIN refresh). It is checked against the current PIN, then (software mode) again in the write's filter, or (authority mode) by the lease claim below, so a guess reserved or resolved after the client's check makes it CONFLICT instead of being wiped by the fresh generation. A non-zero `wrongAttempts` is accepted (own-typos rule, D19: the client sends it only when every recorded wrong entry is its own from the same sign-in flow) but must match the stored verified count exactly and can never exceed the charges; lca-api cannot tell whose entries they are, it only guarantees nothing changed since the client's check. Because clients count every "Incorrect PIN." response as their own recorded entry, a PIN mismatch whose failure write matched no record (re-enrolled/rotated/disabled under the compare) returns CONFLICT (`escrowChangedMessage`), never the mismatch text.
- **PIN-operation lease (authority mode).** Every relayed owner-signed intent (`escrow.enroll`, `escrow.disable`/`remove`) runs under `applyEnrollmentIntentUnderLease` (`src/routes/escrow.ts`): `claimEscrowEnrollmentLease` sets `userKey.escrowEnrollmentLease` in one write conditioned on the read blob + PIN record, no other lease and no live `escrowPinCompares` marker; then the authority call; then `commitEscrowEnrollmentLease`, conditioned on the lease id and the replaced `blobHash` (not on charges), which also removes the lease. `reserveEscrowPinAttempt` refuses while any lease exists and pushes a compare marker (`compareId`) that `completeRecovery` pulls once the authority answers (kept until its TTL after a transport failure). `startRecovery` and `completeRecovery` answer 429 `Automatic recovery is being updated…` under a live lease, before creating a hold or charging; `completeRecovery` also refuses (FORBIDDEN, uncharged) a PIN hold whose `holdRecord.hold.blobHash` is not the current blob's. The rewrap job (`src/jobs/escrowBlobRewrap.ts`) claims the same lease (`action: 'rewrap'`) around `rewrapEscrowBlob` in authority mode. Releasing a compare marker is best effort (its TTL covers a miss). TTLs: `ESCROW_ENROLLMENT_LEASE_TTL_MS` / `ESCROW_PIN_COMPARE_TTL_MS` = 120 s (4x the 30 s max `ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS`).
- **Reconciliation.** If the commit write misses or the authority call fails ambiguously, `settleEscrowEnrollmentLease` (`src/services/escrow-enclave/enrollmentLease.ts`) reads the authority state and adopts it when it is exactly the lease's commit (enrollment version +1, epoch, PIN generation, share version, returned envelope identity), using the salt/PIN action recorded in the lease; a definite refusal releases the lease; an unknown outcome keeps it until expiry. `settleExpiredEscrowLease` runs on start/complete/enroll/disable/authority-state, so a crash converges on the next request. A settle that finds the same commit already persisted counts as adopted. A lost response still fails the request even when its commit is adopted (no receipt to return). `/keys/auth-share` reports `escrowBlobIdentity` so authority-mode clients can detect and repair any copy mismatch that is left, and `escrowUpdating` while a lease is held so they do not mistake an in-progress operation for a stale copy. Live-Mongo coverage: `test/keys-pin-lease.spec.ts`.
- Software-mode PIN carry ignores releases completed before `escrowPin.enabledAt`, so a PIN re-set at the same version after a PIN sign-in survives the next rotation.

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
Require `OIDC_ISSUER`, an exact redirect allowlist, and a token client secret. Deployed Lambdas use `OIDC_SIGNING_KEY_SECRET_ID` (name or ARN of `lca-api/<stage>/oidc-signing-jwk`) pointing to a plain-string Secrets Manager SecretString containing the RSA private JWK JSON (`kty=RSA`, `d`, `kid`, `alg=RS256`). The key is fetched and cached per process; failures return 503 and retry on the next request. Redeploy after rotation. `OIDC_SIGNING_KEY_JWK` remains supported for local/Docker/CI and takes precedence. Any deployed stage (`NODE_ENV=production` or `LAMBDA_STAGE` set) fails closed without a configured key.
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

`bun run test:oidc:e2e` also covers the complete email-code broker round-trip in Playwright, with real lca-api and disposable Keycloak/Redis/Mongo. Keep its cleanup contract: exact per-test user/subject deletion, private transient stores, and runner teardown on success/failure/signals. Never point it at shared environments.

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

## ClassLink SSO and state transcript requests

lca-api brokers ClassLink OIDC sign-in on Firebase today and is shaped to carry over to Keycloak. Routes: `src/routes/classlink.ts` (sign-in, data deletion), `src/routes/classlinkPersonalEmail.ts` (personal email, exposed under `classlink.*`), `src/routes/transcripts.ts` (transcript requests). Both routers are registered in `src/app.ts`.

### Sign-in flow

```mermaid
sequenceDiagram
    participant App
    participant API as lca-api
    participant CL as ClassLink
    App->>App: create PKCE verifier, state, nonce
    App->>API: classlink.getAuthorizeUrl(redirectUri, codeChallenge, state, nonce)
    API->>API: redirectUri must exactly match CLASSLINK_REDIRECT_URIS
    API-->>App: authorize URL
    App->>CL: browser redirect (web) or auth session (native)
    CL-->>App: callback with code + state (https web or <bundleId>://auth/classlink/callback)
    App->>App: consume single-use attempt for state
    App->>API: classlink.exchangeCode(code, codeVerifier, redirectUri, nonce)
    API->>CL: token request (client_secret_post, server side)
    API->>API: verify id_token: issuer, RS256 via JWKS, aud, exp, iat skew, nonce
    API->>API: resolve state student ID from api_fields; link identity; find/create Firebase user
    API-->>App: Firebase custom token (in the tRPC response)
    App->>App: signInWithCustomToken
```

- The state student ID is read only on the server, from the verified id_token `api_fields`, using the tenant's `stateStudentIdField`. It is never accepted from a client. A missing ID does not block sign-in.
- Testing only: a district override with `"testStateStudentIds": true` gives each student a stable fake ID (`TEST` + 10 digits, from the tenant and sourcedId) when the district sends none, so the transcript flow can be tested end to end. It works only when `LAMBDA_STAGE` is `dev`, `development`, `staging`, `test` or `local` (or, without a stage, `NODE_ENV` is not `production`); elsewhere it is ignored and `classlink.test_state_ids.ignored` is logged. A real `api_fields` value always wins.
- It is stored encrypted (`src/helpers/classlinkPii.helpers.ts`): AES-256-GCM with `CLASSLINK_PII_KEY`, additional data bound to the identity key, versioned `v1:` payload in `stateStudentIdEnc`. It is kept only for the transcript window: `stateStudentIdExpiresAt` = sign-in time + `CLASSLINK_MAX_AUTH_AGE_SECONDS`. Read it only through `getStateStudentId`, which returns null once expired or unreadable.
- Every write removes the legacy plaintext `stateStudentId`. A sign-in without a valid ID clears any stored one. Without a usable key nothing is stored and `classlink.pii.key_missing` is logged (no values). Expired IDs are removed lazily in `resolveClassLinkContext` (only if unchanged, so a newer sign-in is never cleared) and by the cleanup script. A transcript request does not clear the ID.
- An email (`email`, falling back to `or_email`) is required; without one the exchange fails with a friendly `BAD_REQUEST`.

### Districts

- Any district that signs in through our ClassLink app is accepted: ClassLink signs the id_token for our client ID, so a valid token means the district installed the app. No per-district setup is needed for sign-in.
- `CLASSLINK_TENANTS` only holds **overrides** keyed by ClassLink tenant ID (`getClassLinkTenant`). Districts without one get `DEFAULT_CLASSLINK_TENANT`: no state student ID, never joins an existing email account, and no transcript requests.
- Add an override to enable transcripts (`state`, `stateStudentIdField`, `transcriptEnabled`) or email-account joining (`allowedEmailDomains`) for a district. An invalid `CLASSLINK_TENANTS` value disables ClassLink sign-in entirely (fail closed).

### Linking rules

- Identity key: `classlink:<tenant_id>:<sourcedId>`, stored as an AuthSubject and a `ClassLinkIdentity` record (tenant, sourcedId, sub, role, encrypted state student ID, Firebase uid, subject, last auth time).
- A known ClassLink identity always reuses its Firebase uid. If its email now belongs to a different Firebase user, the exchange fails closed with `CONFLICT`.
- A first-time ClassLink identity links to an existing Firebase email user only when the email domain is in the tenant's `allowedEmailDomains`, the Firebase email is verified, and the id_token does not say `email_verified: false`. Otherwise `CONFLICT`. An empty allowlist never links.
- New users get a deterministic uid: `classlink_` + first 28 hex chars of sha256(identity key).
- Students get `isMinorHint`. The preferences routes force `MINOR_PREFERENCE_VALUES` for them (AI, analytics and bug reports off, each with its `*AutoDisabled` flag, and `isMinor`), whatever the client sends. If the student lookup fails, writes are refused and reads report locked settings without saving them, so a failure never unlocks a student or locks an adult.
- Code exchange failures are rate limited per IP. Never log email, sub, state student ID, codes or tokens.

### Transcript requests

- `transcripts.getStatus` and `transcripts.request({ consent: true })` are DID-auth routes. The caller's DID resolves DID → UserKey → Firebase uid → ClassLink identity (`src/helpers/classlinkContext.helpers.ts`); inputs never carry a DID, profile ID or state ID.
- Eligibility: tenant `transcriptEnabled`, ClassLink sign-in younger than `CLASSLINK_MAX_AUTH_AGE_SECONDS` (else `reauth_required`), and a state student ID present (else `no_state_id`).
- An atomic Redis budget limits requests per DID per hour, and a per-user lock deduplicates requests within 10 minutes. Consent is saved before the outbound call.
- lca-api signs a 5-minute EdDSA JWT with the service `did:web` `#owner` key (`src/helpers/issuerAssertion.helpers.ts`; claims: iss, aud, sub = student DID, state, state_student_id, ClassLink tenant/sourcedId/auth_time, consent_at, jti, iat, exp) and POSTs it to `TRANSCRIPT_ISSUER_ENDPOINT`. The issuer verifies it against `/.well-known/did.json`.
- Delivery is asynchronous: the issuer later sends the credential through the existing send API. Responses map to `requested`, `none_yet` or `failed`; there is no automatic retry, webhook or polling.

### School Connect (connect a school account to an existing account)

- `classlink.getConnection` and `classlink.connect` are DID-auth routes in `src/routes/classlinkConnect.ts`. `connect` runs the same server-side code exchange and id_token checks as sign-in (`src/helpers/classlinkExchange.helpers.ts`), then attaches the ClassLink identity to the caller's account instead of signing in. It never creates a Firebase user or custom token, so the session does not change.
- The caller's account is the one bound to the authenticated DID (UserKey → its Firebase uid). Accounts without a Firebase sign-in get `PRECONDITION_FAILED` for now.
- Refuses with `CONFLICT` when the ClassLink identity already belongs to another account, or when the account is already connected to a different ClassLink identity. Accounts are never merged.
- A new ClassLink AuthSubject adopts the account's `email:<contact>` subject when one exists, so a later Keycloak cutover sees one person.
- Calling `connect` again refreshes the connection: new sign-in time and state student ID (encrypted, 24-hour window). The app uses it for the transcript "Reconnect" step for every ClassLink account, so refreshing never re-runs sign-in.
- Students (`isMinorHint`) get `enforceMinorPreferences` immediately. The app warns before connecting when the account is not already locked.

### Personal email

`classlink.startPersonalEmail` / `verifyPersonalEmail` / `getPersonalEmail` record a verified personal (non-school-domain) email with a single-use 6-digit code (5-minute TTL, attempt and send limits). On success the `email:<addr>` AuthSubject is linked to the ClassLink subject so a later Keycloak email login lands in the same account. It is not a Firebase sign-in method before the Keycloak cutover, and it does not change the Firebase email or `UserKey.contactMethod`.

### Configuration

All optional; without client ID and secret the routes return `PRECONDITION_FAILED`. `CLASSLINK_TENANTS` is optional (overrides only).

| Key                                                                                                                                                                                                                                                                                                                                          | Where                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `CLASSLINK_DISCOVERY_URL`, `CLASSLINK_REDIRECT_URIS` (comma list, exact match, include native `<bundleId>://auth/classlink/callback`), `CLASSLINK_MAX_AUTH_AGE_SECONDS`                                                                                                                                                                      | stage config                                                                                                                            |
| `CLASSLINK_CLIENT_SECRET`, `CLASSLINK_PII_KEY` (base64 of 32 random bytes; `openssl rand -base64 32`), `CLASSLINK_CLIENT_ID`, `CLASSLINK_TENANTS` (optional JSON map of per-district overrides: displayName, state, stateStudentIdField, allowedEmailDomains, transcriptEnabled), `TRANSCRIPT_ISSUER_ENDPOINT`, `TRANSCRIPT_ISSUER_AUDIENCE` | runtime secrets bundle (`PROVIDER_SECRETS`); never in stage files, which would override the bundle and publish district/partner details |

### Operations

- Account deletion: the app calls `classlink.deleteMyData` before deleting keys. `scripts/cleanup-orphan-classlink-data.ts` removes ClassLink and transcript rows whose Firebase uid has no UserKey, and expired or legacy plaintext state student IDs (dry run by default, `--apply` to delete).
- `provision:keycloak` reuses the ClassLink subject for ClassLink-only users; `--report-classlink` only prints how many users resolved that way.
- Keycloak era: ClassLink sign-in becomes another lca-api login ticket (`classlink:<tenant>:<sourcedId>`) brokered by Keycloak's existing `lca-api` identity provider, so provisioned federated links keep the same subject and DID.
