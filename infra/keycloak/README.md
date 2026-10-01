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
local stack at a time. Preview uses `http://keycloak:8080/realms/learncard` as its
issuer, reachable only on the per-preview Docker network. The API uses that same
issuer for verification and JWKS discovery, without an override. Preview has no
host-port binding, public Keycloak route, or browser Keycloak login in this groundwork.
Browser integration requires an HTTPS proxy route, matching issuer/client settings,
and preview redirect URIs together; a JWKS override alone does not enable it.

`--import-realm` is bootstrap-only: it skips existing realms. H2 persists in the
`keycloak-data` named volume. To re-import a changed fixture:

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
- `lca-api`: existing confidential service client, placeholder secret `dev-only-secret`.
- `ci-tests`: confidential password-grant client, secret `ci-tests-dev-only-secret`.
  It lets CI obtain real signed tokens without a browser; **never create it in staging/prod**.

## lca-api identity provider

The hidden `lca-api` OIDC provider brokers email-code and native Google/Apple proofs
using a single-use ticket forwarded as `login_hint`. It uses `keycloak-broker` /
`dev-only-broker-secret`, independently of the existing `lca-api` service client.
Browser redirects and `OIDC_ISSUER` use `http://localhost:5100`; backchannel token,
JWKS and userinfo calls use `host.docker.internal` to reach the host from Docker.
The compose/CI host-gateway entry makes that hostname work on Linux too.
The gated integration test checks discovery and the real broker redirect/import,
not the complete ticket-to-Keycloak-session round-trip (TODO: Redis/Mongo-backed CI).

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
Normalization fails without replacing the fixture if either expected client is
missing or duplicated, or any other client contains a secret.
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

JWKS resolvers are reused per issuer and resolved endpoint URL; changing an endpoint
replaces that issuer's resolver. Service environment configuration is parsed at startup,
so changes to `KEYCLOAK_JWKS_URL_OVERRIDES` still require restarting the process
(or deploying a new ECS task definition). Updating an ECS task does not mutate the
environment of already running tasks.

When `KEYCLOAK_ISSUERS` contains an issuer, configure at least one nonblank
`KEYCLOAK_AUDIENCES` entry. The API validates this at startup and reports the
missing configuration directly instead of rejecting every token as invalid.
Leaving the issuer list empty keeps Keycloak verification disabled.
