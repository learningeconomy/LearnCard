# Credential Refresh: Configuration and Local QA

Operator and engineer notes for managed credential refresh (LC-2117, LC-2135, LC-2136). The public documentation lives in `docs/core-concepts/credential-refresh.md` and `docs/how-to-guides/issue-and-refresh-a-managed-credential.md`.

## Configuration and feature flags

| Setting                                        | Where                    | Default      | Purpose                                                             |
| ---------------------------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------- |
| `CREDENTIAL_REFRESH_ENABLED`                   | brain-service env        | off          | Registers the managed `/refresh/*` holder endpoints                 |
| `CREDENTIAL_REFRESH_DIGEST_SECRET`             | brain-service env        | _(required)_ | Dedicated HMAC secret keying materiality digests; validated at boot |
| `CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS` | brain-service env        | `24`         | Delivery window for collapsing repeat-update notifications          |
| `credentialRefreshForegroundEnabled`           | LaunchDarkly (client)    | off          | Gates automatic foreground scanning in the app                      |
| `CREDENTIAL_REFRESH_CHECK_INTERVAL_MS`         | learn-card-base constant | 24 hours     | Per-credential staleness interval for ordinary checks               |

Issuer tRPC/OpenAPI routes (`/credential-refresh/allocate`, `/credential-refresh/send`, `/credential-refresh/publish`, `/credential-refresh/history`) require the `credentials:write` scope (`credentials:read` for history). When `CREDENTIAL_REFRESH_ENABLED` is off, all four return `NOT_FOUND: Credential refresh is not available`.

The digest secret keys persisted materiality digests. Generate it once with `openssl rand -hex 32` and keep that value across restarts; changing it requires a rotation/backfill strategy. It belongs in the backend env file, never a `VITE_` variable. If using Infisical, the backend folder is `/LearnCard/brain-service`; a later env pull can overwrite local additions.

## Internals worth knowing

- **Refresh aggregate**: one Neo4j record per refreshable credential owning the unguessable `refreshId`, issuer (publication authority), holder (read authority), stable credential ID, an immutable version chain, a mutable head pointer, and lifecycle state `awaiting_claim → active → revoked`.
- **Publication validation**: proof, same normalized issuer, same credential ID, same subject-ID fingerprint (captured at first send), `refreshService` matches the allocation, and no back-dating relative to the current head.
- **Materiality**: when `notifyHolder` is unset, the service compares a canonical projection of user-visible content (subject claims, titles, evidence, results, expiration), ignoring proofs, identifiers, timestamps, and the refresh machinery. Digests are HMAC-keyed with `CREDENTIAL_REFRESH_DIGEST_SECRET`.
- **Notification windows** are fixed wall-clock buckets (`floor(now / window)`), not sliding rate limits. Updates across a bucket boundary notify separately even when minutes apart.
- **Storage**: every version is a JWE encrypted to the holder only. The brain DID is not a recipient. Plaintext exists transiently in memory during publication for proof verification and materiality.
- **Holder history** currently retains every prior URI on the encrypted LearnCloud index record. Bounding or moving that index is follow-up work; pruning must preserve access to retained versions, including after revocation.
- **Subject fingerprint migration**: refreshes created before the fingerprint existed must be reissued before publishing further versions; their encrypted contents cannot be reconstructed server-side for backfill.
- **Legacy QA credentials** that advertised `1EdTechCredentialRefresh` for an encrypted managed endpoint must be reissued. Do not reinterpret that standard type as a managed protocol.
- **Standard-service adapter** accepts signed JSON credentials only; `text/plain` compact VC-JWT responses fail closed. Full JWT verification is tracked in [LC-2195](https://welibrary.atlassian.net/browse/LC-2195).

## Local browser QA (no source edits)

This flow uses the local app and Docker backend. It does not clear existing databases or run the destructive E2E harness.

### 1. Configure the backend and app

In `services/learn-card-network/brain-service/.env`, set:

```dotenv
CREDENTIAL_REFRESH_ENABLED=true
CREDENTIAL_REFRESH_DIGEST_SECRET=<your-generated-secret>
```

In `apps/learn-card-app/.env`, set:

```dotenv
VITE_CREDENTIAL_REFRESH_LOCAL_QA=true
```

The app opt-in works only under the Vite dev server, with both the app and the configured brain-service URL on `localhost`, `127.0.0.1`, or `[::1]`. Only managed `/refresh/` URLs on that exact backend origin receive the SDK's HTTP/private-address exceptions, with zero redirects. Production/staging builds ignore this flag. Use only synthetic credentials from your local test issuer while it is enabled.

In LaunchDarkly, create the boolean key `credentialRefreshForegroundEnabled`, make it available to client-side SDKs, and serve `true` in Local Dev (or the environment selected by your tenant's client ID). This controls foreground scanning; the backend env flag independently enables the APIs. Notification taps force a targeted check.

### 2. Start the stack and sign in

From the repository root:

```bash
bun install --frozen-lockfile
bun run --cwd packages/learn-card-types build
bun run --cwd packages/learn-card-helpers build
bun run --cwd apps/learn-card-app dev
```

Open `http://localhost:3000`, sign in, and note your profile ID. Default local services: brain `4000`, LearnCloud `4100`, notification API `5100`. If host Redis already uses `6379`, remove that Redis port mapping with a local Compose override.

After backend env edits, recreate the container to reload `env_file`:

```bash
docker compose -f apps/learn-card-app/compose-local.yaml up -d --force-recreate brain
```

After app env edits, recreate the app container (or restart Vite if running on the host):

```bash
docker compose -f apps/learn-card-app/compose-local.yaml up -d --force-recreate app
```

### 3. Send, claim, and publish

In a second terminal at the repository root, replace `billygates` with your local profile ID:

```bash
bun --conditions=development tests/e2e/scripts/credential-refresh-qa.ts send billygates
```

In the app, open **Alerts → Claim**, then **Passport → Studies**. Confirm the provisional transcript has a valid proof and its BIO 150 result is in progress. Then publish:

```bash
bun --conditions=development tests/e2e/scripts/credential-refresh-qa.ts publish billygates
bun --conditions=development tests/e2e/scripts/credential-refresh-qa.ts status billygates
```

The CLI creates a random local registrar and stores its key and signed retry state in the gitignored `.credential-refresh-qa/` directory. Run commands sequentially. Repeating `send` reuses the original delivery; repeating `publish` uses the same signed payload and idempotency key. `status` shows issuer version metadata without printing the key. The CLI is fixed to localhost.

### 4. Check the result

- Tap the update notification. Expect **Final Official Transcript**, with BIO 150 **Completed / A**.
- Confirm Studies still has one record, with an Updated indicator until viewed.
- Open **View Previous Versions** from the earned credential menu and confirm the provisional transcript remains readable.
- For foreground-only testing, reload the page to start a new session; ordinary checks have a 24-hour staleness interval. Notification taps bypass it.

One initial `401` is expected: it supplies `WWW-Authenticate: LearnCardDIDAuth`; the SDK signs the challenge and retries. The route exposes `WWW-Authenticate` and `ETag` through CORS. A lone `401` followed by `UNAUTHORIZED` is a failed handshake. `UNSAFE_ENDPOINT` usually means the local QA opt-in, app origin, or configured backend origin does not match.

This CLI covers the provisional-to-final path. Notification-collapse and Boost-recipient revocation scenarios live in `tests/e2e/tests/credential-refresh.spec.ts`. After testing, unset the app's local QA flag and restart it. Preserve the backend secret while retaining its database.

## Automated coverage

- `tests/e2e/tests/credential-refresh.spec.ts`: allocate/send/claim/publish/refresh, notification collapse, revocation.
- `tests/e2e/tests/docs-refresh.spec.ts`: runs the three public how-to snippets in `docs/snippets/refresh/` verbatim against the local network.
- The e2e compose file enables refresh with a fixed digest secret and a 0.005-hour (18 s) notification window.
