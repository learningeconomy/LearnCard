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
- `lca-api`: confidential service account, placeholder secret `dev-only-secret`.
- `ci-tests`: confidential password-grant client, secret `ci-tests-dev-only-secret`.
  It lets CI obtain real signed tokens without a browser; **never create it in staging/prod**.

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
