# Local Keycloak

`realms/learncard-dev-realm.json` bootstraps realm `learncard` on Keycloak **26.7.4**.
This JSON owns local/CI only; [Terraform](terraform/) separately owns staging/prod.
See [migration plan AD-9](../../.sisyphus/plans/keycloak-auth-provider-migration.md).
All credentials here are public development placeholders, never production secrets.
The fixture is mounted as `learncard-realm.json`: Keycloak requires the import
filename to match the realm name, despite our source file's `-dev` suffix.

## Start and reset

From the repository root:

```bash
docker compose -f apps/learn-card-app/compose-local.yaml up -d keycloak
```

Admin console: <http://localhost:8081/admin>, `admin` / `admin`.
ScoutPass has the same service in `apps/scouts/compose-local.yaml`; run only one
local stack at a time. Preview exposes port 8080 internally only, not on the host;
it does not configure a public Keycloak route.

`--import-realm` is bootstrap-only: it skips existing realms. H2 persists in the
`keycloak-data` named volume, mounted at `/opt/keycloak/data` so a fresh volume
inherits the image's writable directory ownership (mounting the nonexistent
`data/h2` directory created a root-owned volume). To re-import a changed fixture:

```bash
docker compose -f apps/learn-card-app/compose-local.yaml down -v
docker compose -f apps/learn-card-app/compose-local.yaml up -d keycloak
```

**Warning:** `down -v` removes all volumes belonging to that compose project.

## Users and clients

All three users have password `password`:

| User             | Contact                                                   |
| ---------------- | --------------------------------------------------------- |
| `dev-email`      | Verified `dev-email@example.com`                          |
| `dev-phone`      | Verified `+15555550100`, no email                         |
| `dev-unverified` | Unverified `dev-unverified@example.com` (API must reject) |

- `learncard-app`: public authorization-code client with S256 PKCE, no password grant.
  Redirect URIs cover web (`http://localhost:3000/*`) and native
  (`com.learncard.app://login`, plus legacy `capacitor://localhost/*`). Web Origins
  list `capacitor://localhost` (iOS WebView) and `https://localhost` (Android WebView)
  explicitly: the `+` wildcard only derives http(s) origins, and without them the
  token endpoint returns `403` with no CORS header. A production realm needs the
  same three entries with the real bundle ID.
- `lca-api`: existing confidential service client, placeholder secret `dev-only-secret`.
- `ci-tests`: confidential password-grant client, secret `ci-tests-dev-only-secret`.
  It lets CI obtain real signed tokens without a browser; **never create it in staging/prod**.

## Google and Apple (web)

`google` (built-in) and `apple` ([klausbetz extension](https://github.com/klausbetz/apple-identity-provider-keycloak),
providerId `apple`) broker **browser** sign-in for the `learncard-app` client — separate
from the native ticket-forwarding path described below. Both have `trustEmail: false`
and reuse the stock `first broker login` flow, so an email collision with an existing
account always shows Keycloak's one-time "Confirm Link Existing Account" page rather
than auto-linking; there is currently no opt-in for automatic linking by email, and
enabling one would need `identityProviderMappers`/flow changes reviewed as a separate
change. Review Profile ("Update Account Information") is explicitly configured off via
the `authenticatorConfig` override on that flow — the fixture never shows it, regardless
of missing name/email attributes.

Config placeholders (`${VAR}`, no default — see below): `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `APPLE_SERVICE_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
`APPLE_P8_CONTENT` (raw `.p8` contents, single line). Register redirect URIs at
`https://<keycloak-host>/realms/learncard/broker/google/endpoint` and `/broker/apple/endpoint`.
**Apple requires HTTPS and a Services ID** — a local `http://localhost:8081` Keycloak
cannot complete a real Apple sign-in; use a tunneled HTTPS hostname if you need to test
it end-to-end. Google has no such restriction: `http://localhost:8081/realms/learncard/broker/google/endpoint`
is a valid authorized redirect URI for local testing. Apple only sends `email`/name on
the **first** authorization for a given Services ID + user; Keycloak's federated
identity persists everything after that, so losing the linked Keycloak user loses the
name/email too.

Verified empirically against 26.7.4: `${VAR}` substitution has no default-value syntax
support in practice for this use case — `${VAR:default}` _is_ honored when the variable
is entirely unset, but compose/CI env blocks that pass a defined-but-empty string (the
common case for an optional var) resolve to the empty string, which Keycloak's identity
provider config then treats as absent config **silently drops the key** — not the
default. The fixture therefore has no inline defaults; `apps/learn-card-app/compose-local.yaml`
and `.github/workflows/auth-integration.yml` supply non-empty dev/CI placeholder values
via their own `${VAR:-placeholder}` shell-style defaults instead. A totally unset var
(no default anywhere) leaves the literal `${VAR}` string as the config value — the
realm still imports cleanly either way; only an actual sign-in attempt would fail.

The `authenticationFlows`/`authenticatorConfig` blocks added for the Review Profile
override are **not** preserved by `scripts/export-keycloak-realm.sh` (it deletes both
top-level arrays; see "Export and normalize" below) — if you edit the realm via the
Admin Console and re-run the export script, manually re-apply the Review Profile
`authenticatorConfig` override (`update.profile.on.first.login: "off"` on the
`first broker login` flow's Review Profile execution) before committing.

### Apple provider jar (local, CI, production)

The Apple extension is not built into Keycloak, so its jar must be present everywhere
the fixture is imported or `apple` as a `providerId` fails realm import with an unknown-provider
error: `infra/keycloak/Dockerfile.dev` (local compose + CI, `start-dev` builds automatically)
and the builder stage of `infra/keycloak/Dockerfile` (production, before `kc.sh build`) both
pin it with `ADD --checksum=sha256:<hex> --chown=keycloak:keycloak <release-jar-url> /opt/keycloak/providers/`.
To bump the version: download the new jar once, compute `shasum -a 256`, update the
release URL, filename and checksum in **both** Dockerfiles, and confirm compatibility
against the [compatibility table](https://github.com/klausbetz/apple-identity-provider-keycloak#compatibility)
for the target Keycloak version.

### lca-api native sign-in unification

The `google`/`apple` IdPs above are for the **web** flow only. The native app instead
posts an Apple/Google `id_token` straight to lca-api (`auth.requestSocialLoginTicket`),
which verifies it and forwards a ticket through the hidden `lca-api` broker — see below.
When the verified token asserts a verified email, lca-api links that native sign-in to
an existing `email:<address>` `AuthSubject` (if one already exists) so a user who signed
in by email code first, then natively with Google/Apple, resolves to one Keycloak user
instead of hitting "Account already exists". `GOOGLE_OAUTH_CLIENT_IDS`/`APPLE_OAUTH_CLIENT_IDS`
(lca-api env, CSV) must include the **native** app's OAuth client ID / bundle-backed
Services ID, not just any web client ID, or native token verification fails closed.
Run `bun run lc auth-audiences` (from `apps/learn-card-app/`) to derive the correct
per-tenant values from each tenant's `native.bundleId` and Firebase asset files, and
print the combined CSVs to set on both env vars — see
[`apps/learn-card-app/environments/README.md`](../../apps/learn-card-app/environments/README.md#native-auth-audiences)
("Native auth audiences"). `bun run lc dev` sets both automatically for local Docker.

## lca-api identity provider

The hidden `lca-api` OIDC provider brokers email-code and native Google/Apple proofs
using a single-use ticket forwarded as `login_hint`. It uses `keycloak-broker` /
`dev-only-broker-secret`, independently of the existing `lca-api` service client.
Browser redirects and `OIDC_ISSUER` use `http://localhost:5100`; backchannel token,
JWKS and userinfo calls use `host.docker.internal` to reach the host from Docker.
The compose/CI host-gateway entry makes that hostname work on Linux too.
The gated integration tests exercise the complete ticket-to-Keycloak-session
round-trip against real Redis, MongoDB, lca-api and Keycloak, including the
Firebase-era auth-share migration proof. CI starts Redis 7 and MongoDB 7 as services
and lca-api on the runner; `host.docker.internal:5100` reaches it through the
Keycloak container's `host-gateway` entry on Ubuntu.

> **Phone login is deferred.** The current login-ticket flow covers email codes and
> native Google/Apple only. The `dev-phone` user and the `phone_number*` attributes/mappers
> are wired ahead of time so the phone path lands without a fixture change later.

Keycloak 26's [declarative user profile](https://www.keycloak.org/docs/latest/server_admin/#user-profile)
disables unmanaged attributes by default. Undeclared phone attributes can silently
disappear on import. Leave `unmanagedAttributePolicy` absent: the 26.7.4 image rejects
the literal `DISABLED` value documented in the latest guide. The fixture explicitly
declares both phone attributes, limits
editing to admins, and maps them into ID/access tokens and userinfo. Email and names
are optional so phone-only users can log in; the default `email` scope emits email
verification claims. `basic` supplies the access-token subject; `openid` is a
request scope, not a stored client scope.

The local tenant `auth.keycloak` block is preserved by schema passthrough; its typed
schema field lands with the client provider PR. The active provider is unchanged.

## App email-code round-trip

Use the opt-in `keycloak-local` stage described in
[the app environments guide](../../apps/learn-card-app/environments/README.md#opt-in-local-keycloak).
`learncard-app` permits the optional `phone` scope requested by the client provider;
without that assignment Keycloak rejects the whole request with `invalid_scope`.
The callback uses the existing `/login` route.

Before signing in as an existing Firebase-era account, run the operator migration
below. For **pre-created** `dev-email@example.com`, this requires a Firebase-era
UserKey with that contact email already in the local database. The script deliberately
does not fabricate a UserKey or claim an arbitrary existing account when none exists.
Run from `services/learn-card-network/lca-api` (Mongo and Keycloak must be running):

```bash
MONGO_URI='mongodb://localhost:27017/?directConnection=true' MONGO_DB_NAME=lca-api \
SEED=c KEYCLOAK_ADMIN_USERNAME=admin KEYCLOAK_ADMIN_PASSWORD=admin \
bun run provision:keycloak -- --apply --email dev-email@example.com
```

This provisions a permanent lca-api `AuthSubject`, explicitly links its subject
to the Keycloak user, and appends its ID to the existing UserKey. It is idempotent
and refuses to overwrite a different existing link. Without it, the default first-broker-login
flow correctly shows “Account already exists.” Do **not** disable that protection
or enable automatic account linking by email. New email addresses are created by
the broker without this provisioning step; names are already optional in the
fixture, so no profile-review flow override is needed.

## Firebase-era mapping migration (AD-10)

**Run only against an operator-reviewed Firebase export/database.** This is an offline
administrative join, not a runtime email-trusting fallback. It retains Firebase
provider IDs and never rewrites an auth share, primary DID, or share version.
This requested email-based migration cannot establish immutable ownership by itself:
a recycled address with just one old UserKey can still pass its checks. Before any
production apply, independently join the authoritative Firebase UID export to the
intended Keycloak IDs and confirm that every selected contact is still owned by that
identity. This CLI is not a substitute for that AD-10 import reconciliation.
Duplicate contact emails, conflicting provider mappings, disabled/unverified
Keycloak users and different `lca-api` links are refused for manual review.
Phone-only records are skipped and counted because phone OTP is deferred.
Legacy secondary `phone`/`phoneNumber` strings are copied only for new Keycloak users,
with verification explicitly false; UserKey has no canonical proof for them. Do not
cut those users over until phone ownership is verified: the API rejects unverified
phone claims even if their email is verified.

The default is **dry-run**: Mongo reads and Keycloak Admin GETs only (apart from
admin authentication). No AuthSubject upsert, index creation, user creation, link
or UserKey update occurs. Remove `--apply` from the command above to preview;
omit `--email` to iterate all Firebase-era UserKeys, or use `--limit N` for a batch.
Apply is resumable but is not a distributed transaction: rerun dry-run after any
interruption. Do not run concurrent provisioning jobs or change account identities
during a migration window. Output masks emails and never includes shares or tokens.

Configuration: `KEYCLOAK_ADMIN_URL` (default `http://localhost:8081`),
`KEYCLOAK_ADMIN_REALM` (default `master`), `KEYCLOAK_REALM` (target, default
`learncard`), `KEYCLOAK_ADMIN_CLIENT_ID` (default `admin-cli`). Development may use
`KEYCLOAK_ADMIN_USERNAME/PASSWORD`. **Production must use a least-privilege
service-account client** with `KEYCLOAK_ADMIN_CLIENT_SECRET` instead (client-credentials
grant, user query/view/manage permissions in the target realm), over HTTPS.
Admin tokens expire; use explicit `--email` batches and reauthenticate by rerunning
the CLI. `--limit` caps the first N records in `_id` order, not a pagination cursor;
rerunning the same limit rechecks the same records.

The final global mapping-presence assertion counts **all email UserKeys** without a Keycloak
mapping, regardless of batch filters. `FAIL` means no cohort cutover; a successful
batch alone is not sufficient. Refused records exit 1; an incomplete coverage gate
is reported separately so targeted batches can finish successfully. Presence alone
does not validate existing mappings or their broker links: the CLI explicitly reports
cutover approval as **NOT EVALUATED**, including when the presence assertion passes.
Phone-only
accounts and the Web3Auth-to-SSS prerequisite require separate cutover review.

Without the mapping, a valid Keycloak token resolves to **no UserKey** and the real
`keys.getAuthShare` HTTP route returns `null`: the client may enter new-account
setup and show an empty account. After mapping, that same route returns the original
decrypted share and primary DID. The integration proof checks both cases, unchanged
encrypted storage, one UserKey per fixture email, dry-run snapshots, idempotency,
conflicting links and phone skips. It does not implement the still-required
link-on-first-login ownership-proof UI or change immutable-provider lookup.

Run the live proof from `services/learn-card-network/lca-api` against local compose:

```bash
KEYCLOAK_INTEGRATION=true KEYCLOAK_ROUNDTRIP=true \
KEYCLOAK_ISSUERS=http://localhost:8081/realms/learncard \
KEYCLOAK_AUDIENCES=learncard-app,ci-tests \
KEYCLOAK_ADMIN_USERNAME=admin KEYCLOAK_ADMIN_PASSWORD=admin \
OIDC_ISSUER=http://localhost:5100 OIDC_CLIENT_ID=keycloak-broker \
OIDC_CLIENT_SECRET=dev-only-broker-secret \
MONGO_URI='mongodb://localhost:27017/?directConnection=true' MONGO_DB_NAME=lca-api \
REDIS_HOST=localhost REDIS_PORT=6381 SEED=c IS_E2E_TEST=true \
bunx vitest run -c vitest.integration.config.ts \
  test/keycloak-broker-roundtrip.integration.spec.ts test/keycloak-migration.integration.spec.ts
```

Use a development database only: these tests insert synthetic records, seed expiring
Redis codes and delete only their own Mongo/Keycloak fixtures. The API's `SEED` must
match the test seed. Neither flag alone enables the new tests. Their redirect traces
omit query strings, cookies and tokens; they reject every non-3xx hop, including a
Keycloak account-linking/profile page.

Request codes via `POST /trpc/firebase.sendLoginVerificationCode`, body
`{"email":"dev-email@example.com"}`. This is lca-api's code issuer, not a Firebase
SDK call. With log delivery enabled, read the code in API logs or scan the local
`redis3` service for `login-code:dev-email@example.com:*`. Exchange it via
`POST /trpc/auth.requestLoginTicket`, then pass the returned ticket as `login_hint`
with `kc_idp_hint=lca-api` to Keycloak's S256 PKCE authorization endpoint. Never
persist or print real tickets, codes, or tokens in test reports.

## Export and normalize

After editing the local realm in the console, run from the repository root:

```bash
./scripts/export-keycloak-realm.sh
# Or select another local compose project:
./scripts/export-keycloak-realm.sh apps/scouts/compose-local.yaml
```

Requires Docker Compose and jq. Export requires a stopped server: the script stops
Keycloak, exports via a one-off container using the same H2 volume, then restarts
it (also on export failure). It removes generated IDs/timestamps/flows, resets user
passwords and the two fixture secrets, sorts keys, and replaces the fixture atomically.
Review the diff before committing: use only synthetic local users, and never export
a staging/prod realm or real credentials into this directory.
Only built-in authentication flows are supported by this normalizer; custom flows
and their bindings must not be added to this local fixture.

Compose JWKS overrides use the full `/protocol/openid-connect/certs` endpoint,
not the realm base URL, because the API consumes overrides as literal JWKS URLs.

The `Auth Integration (Keycloak)` workflow boots this same fixture and runs the
opt-in `keycloak-verify.integration.spec.ts` suite. Locally, set
`KEYCLOAK_INTEGRATION=true`, `KEYCLOAK_ISSUERS=http://localhost:8081/realms/learncard`,
and `KEYCLOAK_AUDIENCES=learncard-app,ci-tests` before running that spec with Vitest.
