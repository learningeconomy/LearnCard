# Environment Variables from Infisical

This monorepo uses [Infisical](https://infisical.com) to manage shared environment variables. A script generates `.env` files for each service/app from the Infisical "LearnCard" project.

## Backend configuration model

lca-api uses the shared `@learncard/service-config` package. Brain and LearnCloud
adoption is a separate follow-up. Precedence, lowest to highest:

| Priority | Source                             | Purpose                                   |
| -------- | ---------------------------------- | ----------------------------------------- |
| 1        | Zod schema defaults                | Safe defaults                             |
| 2        | `config/config.json`               | Checked-in service defaults               |
| 3        | `config/config.<stage>.json`       | Checked-in `dev` / `production` overrides |
| 4        | AWS Secrets Manager runtime bundle | Private values; Lambda only               |
| 5        | Real environment variables         | Explicit deployment or local overrides    |

Stage files and bundles are flat JSON objects of `ENV_NAME` → string. JSON files
are imported statically into the build; configuration is merged into `process.env`
before the validating environment module or application is imported.

Empty strings count as **unset** and do not override a lower layer; only
non-empty values take effect.

### Stage selection

The active stage is chosen in order:

1. On Lambda, `LAMBDA_STAGE`.
2. Otherwise, `CONFIG_STAGE`.
3. If neither is set, the stage is **unknown** and only the base
   `config/config.json` plus schema defaults apply (no per-stage file is loaded).

An unknown or unrecognized stage never falls back to another stage's file — it
uses the base config only.

### What belongs where

| Kind                              | Lives in                                                  |
| --------------------------------- | --------------------------------------------------------- |
| Non-secret per-stage config       | `config/config.json` / `config.<stage>.json` (checked in) |
| Credentials, tokens, signing keys | Runtime AWS secrets bundle (Lambda) or local env          |
| Authorization allowlists          | Runtime AWS secrets bundle (not stage files)              |
| Internal service endpoints        | Runtime AWS secrets bundle (not stage files)              |

Stage files are committed and world-readable in the repo. Treat anything you
would not publish as a secret and keep it out of them.

## Quick Start

### Lambda runtime bundles (lca-api only)

The optional AWS Secrets Manager bundle is named
`lca-api/<stage>/runtime-secrets`. Set the deploy environment's GitHub variable
`RUNTIME_SECRETS_ID` to its name or ARN after provisioning it. SecretString must
be a flat JSON object of UPPER_SNAKE_CASE env names to strings, including all
required credentials (`GOOGLE_APPLICATION_CREDENTIAL` is Firebase JSON serialized
as a string, not a nested object).
The API functions load it before configuration validation; non-empty explicit
environment values win and empty strings count as unset. Failed loads stop startup
without exposing values. Rotation requires recycling the functions.

Without the id, Lambda uses the existing GitHub secret fallbacks; keep
those secrets until all stages opt in. Local, Docker, CI and self-hosters keep using
plain env vars. This layer sits above the checked-in
[config stage files](#backend-configuration-model) and below real environment
variables. For how the bundles are kept in sync and the per-stage cutover, see
[Infisical → AWS secrets sync](#infisical--aws-secrets-sync). Remaining work:
brain-service and learn-cloud adoption. See
[lca-api guidance](services/learn-card-network/lca-api/AGENTS.md#backend-configuration-model).

```bash
# 1. Install the Infisical CLI (one-time)
#    macOS:
brew install infisical/get-cli/infisical
#    Linux:
curl -1sLf 'https://artifacts.infisical.com/repos/setup.deb.sh' | sudo -E bash && sudo apt-get install infisical
#    Arch Linux (AUR, e.g. with yay):
yay -S infisical-bin

# 2. Log in (one-time, opens browser)
infisical login

# 3. Initialize the project link (one-time, from repo root)
infisical init
#    → Select the "LearnCard" project when prompted
#    → This creates .infisical.json (safe to commit)

# 4. Optionally back up your current .env files
bun run env:backup

# 5. Pull all .env files
bun run env:pull

# 6. Optionally compare the new .env files against the backup
bun run env:compare-backup

# 7. Optionally compare your local .env files against Infisical
bun run env:compare-infisical
```

## Usage

```bash
# Pull dev environment for all services (default)
bun run env:pull

# Pull a specific environment
bun run env:pull --env=staging
bun run env:pull --env=prod

# Pull only one service
bun run env:pull --only=brain
bun run env:pull --only=app

# List available service targets
bun run env:pull --list

# Combine flags
bun run env:pull --env=staging --only=lca-api

# Backup the current .env files before regenerating them
bun run env:backup

# Compare the current .env files against their .env.backup copies
bun run env:compare-backup

# Compare the current .env files against Infisical exports
bun run env:compare-infisical
```

### Backup and Compare Workflow

Use the backup command when you want a quick snapshot of the current generated
environment files before pulling from Infisical again.

```bash
# Copy each current .env to a matching .env.backup file
bun run env:backup

# Show which keys differ between .env and .env.backup
bun run env:compare-backup
```

The compare-backup command reports keys that were added, removed, or changed
between the current `.env` and `.env.backup` for each service.

The compare-infisical command reports keys that are missing from Infisical,
only present in Infisical, or have changed values compared to the current
local `.env` file. It does not print full secret values.

## Service Targets

| Key       | Service            | Infisical Path(s)          | Dev file                                               | Staging file                                                   |
| --------- | ------------------ | -------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| `brain`   | Brain Service      | `/LearnCard/brain-service` | `services/learn-card-network/brain-service/.env`       | `services/learn-card-network/brain-service/.env.staging`       |
| `cloud`   | LearnCloud Service | `/LearnCard/cloud-service` | `services/learn-card-network/learn-cloud-service/.env` | `services/learn-card-network/learn-cloud-service/.env.staging` |
| `app`     | LearnCard App      | `/learn-card-app`          | `apps/learn-card-app/.env`                             | `apps/learn-card-app/.env.staging`                             |
| `lca-api` | LCA API            | `/LearnCard/lca-api`       | `services/learn-card-network/lca-api/.env`             | `services/learn-card-network/lca-api/.env.staging`             |

Each target pulls secrets from its specific Infisical folder path. To enable root-level (`/`) variable merging, add pipe-separated paths (e.g., `/|/LearnCard/brain-service`) to the INFISICAL_PATHS array in `scripts/pull-env.sh`.

## How It Works

1. The script (`scripts/pull-env.sh`) iterates over the service targets
2. For each target, it calls `infisical export --path=<path> --env=<env>` for each Infisical folder
3. Secrets from all paths are merged (later paths win on duplicate keys)
4. The result is written to the local `.env` file for `--env=dev` and to a
   matching overlay file such as `.env.staging` for non-dev environments

Generated `.env` files are gitignored and should **never** be committed.

### Validation and access

Each deployable owns a Zod contract in its config directory. Services validate
`process.env` once before initializing databases or clients and expose a typed
`environment` object. Browser applications validate Vite build inputs in
`vite.config` and resolve all runtime behavior through `TenantConfig`.

Direct `process.env` and `import.meta.env` reads outside those config modules are
rejected by ESLint. `bun run verify:lc-1984` also requires every schema key to be
documented in the matching `.env.example`, rejects unknown example keys, and
checks actual source access. Validation errors name the project, source, invalid
key, and example file without printing secret values.

Booleans accept only `true`, `false`, `1`, or `0`. Invalid explicit config stops
startup; unavailable remote tenant config may use only a previously validated
baked or cached value.

## Adding a New Service

Edit `scripts/pull-env.sh` and add entries to the three parallel arrays:

```bash
SERVICE_KEYS=(
  ...
  my-service        # short key for --only flag
)

INFISICAL_PATHS=(
  ...
  "/|/my-folder"    # "|"-separated Infisical paths to merge
)

LOCAL_ENV_FILES=(
  ...
  "path/to/my-service/.env"   # relative to repo root
)

SERVICE_LABELS=(
  ...
  "My Service"      # human-readable name
)
```

## Notes on the Current Infisical Structure

The "LearnCard" Infisical project has this folder layout:

```
/                           ← shared root vars (NEO4J_*, METABASE_*, POSTMARK_*, etc.)
├── LearnCard/
│   ├── brain-service/      ← SEED, SKILL_EMBEDDING_*, SMART_RESUME_*
│   ├── cloud-service/      ← JWT_SIGNING_KEY, LEARN_CLOUD_*, RSA_PRIVATE_KEY, XAPI_*
│   ├── lca-api/            ← GOOGLE_APPLICATION_CREDENTIAL, OPENAI_API_KEY, SEED
├── learn-card-app/         ← build controls only; runtime values live in TenantConfig
│   └── fastlane/           ← CI/CD keys, not pulled by default
```

### Known Gaps

- **ScoutPass app** (`apps/scouts/`) uses a separate Infisical project ("ScoutPass") — not yet wired into this script.
- **Example apps** (`examples/app-store-apps/`) are developer-specific and not pulled from Infisical.
- `.env.example` files are contract-checked; update the schema and example together.

## Infisical → AWS secrets sync

Deployed Lambda stages read secrets from an AWS Secrets Manager runtime bundle
instead of Lambda environment variables. Infisical's native **AWS Secrets
Manager** integration keeps those bundles in sync with the source of truth in
Infisical.

### One-time AWS access setup

Infisical authenticates to AWS with an **Assume Role** connection:

1. Have an administrator apply [infra/aws/infisical-sync](infra/aws/infisical-sync/README.md)
   in account `206533012615`, region `us-east-1`, supplying `infisical_project_id`.
2. The role trusts the Infisical US principal `arn:aws:iam::381492033652:root`
   with **External ID equal to the Infisical project ID**.
3. In Infisical, create an AWS connection using **Assume Role**, the Terraform
   role ARN output, and that same project ID as the External ID.

The Terraform policy grants only the required list/batch-read actions and scoped
read/create/update/tag actions for the three runtime-secret namespaces. It grants
no `DeleteSecret`; do not replace it with `secretsmanager:*`.

### Create the six sync integrations

Create **six** Many-To-One auto-sync integrations — one per `(service, stage)`
pair — each mapping an Infisical source folder to a single AWS secret. Use these
settings on every integration:

- **Sync behavior**: Many-To-One (all keys in the source folder → one JSON
  SecretString).
- **Auto-sync**: enabled (pushes on every Infisical change).
- **Disable Secret Deletion**: enabled (the role cannot delete AWS secrets).

Infisical environment → stage mapping:

| Infisical environment | Stage        |
| --------------------- | ------------ |
| `staging`             | `dev`        |
| `prod`                | `production` |

Folder → AWS secret mapping:

| Infisical source folder  | AWS Secrets Manager secret                    |
| ------------------------ | --------------------------------------------- |
| `/lca-api/runtime`       | `lca-api/<stage>/runtime-secrets`             |
| `/brain-service/runtime` | `brain-service/<stage>/runtime-secrets`       |
| `/cloud-service/runtime` | `learn-cloud-service/<stage>/runtime-secrets` |

With `staging` and `prod` each covering all three services, that is the full set
of six integrations.

These `/runtime` folders are dedicated sync sources to create, not the existing
CLI export folders. `scripts/pull-env.sh` currently exports
`/LearnCard/lca-api`, `/LearnCard/brain-service`, and `/LearnCard/cloud-service`;
it does not export `/runtime`. Populate the sync sources with private runtime
keys without disrupting those existing `.env` exports. In particular, the
Infisical service name is `cloud-service`, while the AWS name is
`learn-cloud-service`.

### Per-environment cutover

Cut over lca-api one stage at a time (`dev`, then `production`). Prepare the other
four syncs now, but do not enable their bundle IDs until Part B adds consumers:

1. Provision the AWS runtime bundle and wire its Infisical sync integration.
2. Confirm the synced SecretString includes every required private runtime key
   as a string, and no `OIDC_CLIENT_SECRET`. A Firebase-only step-1 bundle is no
   longer sufficient when all secret environment fallbacks are omitted.
3. Set the deploy environment's `RUNTIME_SECRETS_ID` GitHub variable to the
   bundle's name or ARN, then redeploy so the functions load it.
4. Verify the stage boots and reads values from the bundle.
5. Recycle functions after rotation; warm processes cache the bundle. To roll
   back, unset `RUNTIME_SECRETS_ID` and redeploy with the retained GitHub secrets.
   Retiring legacy GitHub secrets is a later operator action, not part of this change.

Until a stage's `RUNTIME_SECRETS_ID` is configured, the existing GitHub secret
**fallback is retained** — keep those secrets until every stage has opted in.

**`OIDC_CLIENT_SECRET` is the exception.** It is the confidential broker client
secret for the OIDC Lambda only. Keep it as a GitHub-environment secret on the
OIDC function and **never** place it in the runtime bundle. The OIDC function
makes no AWS Secrets Manager calls for it.

Only functions using `SigningAuthorityExecutionRole` receive the bundle ID
(`trpc`, `api`, `didWeb`, `swagger`, and `seedMigration`). OIDC uses a separate
entrypoint and focused configuration so it needs no API seed or Mongo credentials
in bundle mode. Its independent signing-key secret remains on `OidcExecutionRole`.

## Self-hosting

Self-hosters do not use Infisical or AWS secrets at all. Copy
`config/config.example.json` to `config/config.<stage>.json` (or just provide a
plain `.env`) and fill in the public values for your deployment. For a new stage
name, register a static JSON import in `src/config/stageConfig.ts` and rebuild.
Set `CONFIG_STAGE` to select that stage; keep credentials in `.env`. Real
environment variables always win.

## Troubleshooting

**"infisical CLI not found"** — Install it per the instructions above.

**"failed to export path"** — You may not have access to that Infisical folder, or the path doesn't exist for the selected environment. Check `infisical secrets --path=<path> --env=<env>` to debug.

**Missing variables** — Compare the generated `.env` against the `.env.example` in the same directory. Any vars not in Infisical need to be added there or filled in manually.

**Authentication expired** — Run `infisical login` again.

## Local multi-credential sharing (LC-2187)

`apps/learn-card-app/compose-local.yaml` supplies a matching local Brain/LearnCloud
trust configuration, including LearnCloud's Redis replay store. Rebuild/recreate
that local stack and enable the client-side LaunchDarkly flag
`share-multiple-enabled` to exercise the sharing flow. No additional untracked
service `.env` entries are needed for this Compose setup. These Compose values
explicitly override the corresponding entries in service `env_file` files.

For services running directly on the host, add these settings to the existing
service `.env` files (keep the normal database, seed, and Redis configuration):

**Brain** (local port 4000, `IS_OFFLINE=true`):

```dotenv
SHARE_LINK_MAINTENANCE_NAMESPACE=learncard-local
SHARE_LINK_MAINTENANCE_ORIGIN=http://localhost:4100
SHARE_LINK_MAINTENANCE_AUDIENCE=did:web:localhost%3A4100
SHARE_LINK_MAINTENANCE_ALLOW_INSECURE_LOOPBACK=true
SHARE_LINK_OWNER_API_NAMESPACE=learncard-local
```

LC-2189 also requires host-run Brain to set `SHARE_LINK_REQUEST_HASH_SECRET` to a
stable value of at least 32 bytes (generate one with `openssl rand -hex 32`).
The tracked local Compose stack supplies a clearly labeled development-only
fallback instead; never use that fallback in a deployed environment.

**LearnCloud** (local port 4100):

```dotenv
SHARE_CONTENT_AUDIENCE=did:web:localhost%3A4100
SHARE_CONTENT_SERVICE_DIDS=did:web:localhost%3A4000
SHARE_CONTENT_VERIFICATION_METHODS=did:web:localhost%3A4000#owner
SHARE_CONTENT_NAMESPACE_BINDINGS='{"did:web:localhost%3A4000":["learncard-local"]}'
```

LearnCloud also requires `REDIS_HOST` and `REDIS_PORT` pointing to its running
Redis replay store. Brain publishes its service signing method as `#owner` in
`http://localhost:4000/.well-known/did.json`. If you change the ports or identities,
update both sides together. Restart both services after changing their environment.
A coworker whose existing `.env` files already provide matching values can simply
rebuild/restart and test. Missing trust configuration leaves the share-content
routes disabled; enabling the UI flag alone does not enable the backend.

These are public, local-development identities, not production credentials.
Deployed environments must explicitly provision their own HTTPS LearnCloud origin,
audience, allowed Brain identity, exact signing method, namespace binding, and
Redis replay store. Do not enable the insecure-loopback option there.

### GitHub deployment configuration

The `.github/workflows/deploy.yml` deployment steps pass the following GitHub
**environment variables** to Serverless, which installs them as Lambda runtime
environment variables. They are public configuration, not new secrets. Existing
`SEED` / `LEARN_CLOUD_SEED` secrets remain unchanged; LearnCloud's Serverless stack
already supplies its Redis endpoint.

LC-2189 separately requires a private, stable 32+ byte GitHub Actions secret named
`SHARE_LINK_REQUEST_HASH_SECRET` for Brain. Generate it once with
`openssl rand -hex 32`; the Brain deployment workflow forwards it to Lambda.
Do not put it in the public variables below or use the local Compose fallback.

Configure each matching pair of GitHub environments independently:

| Stage                | Brain environment                    | LearnCloud environment               |
| -------------------- | ------------------------------------ | ------------------------------------ |
| LearnCard staging    | `learn-cloud-network-api-staging`    | `learn-cloud-storage-api-staging`    |
| LearnCard production | `learn-cloud-network-api-production` | `learn-cloud-storage-api-production` |
| ScoutPass staging    | `scout-network-api-staging`          | `scout-storage-api-staging`          |
| ScoutPass production | `scout-network-api-production`       | `scout-storage-api-production`       |

In the Brain environment, add:

| Variable                           | Value                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `SHARE_LINK_MAINTENANCE_NAMESPACE` | A stable namespace, e.g. `learncard` (or `scouts` for ScoutPass)                   |
| `SHARE_LINK_MAINTENANCE_ORIGIN`    | That stage's HTTPS LearnCloud origin, e.g. `https://<cloud-host>`; no `/trpc` path |
| `SHARE_LINK_MAINTENANCE_AUDIENCE`  | `did:web:<cloud-host>`                                                             |

In the matching LearnCloud environment, add:

| Variable                             | Value                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `SHARE_CONTENT_AUDIENCE`             | Same value as Brain's audience                                                                                           |
| `SHARE_CONTENT_SERVICE_DIDS`         | `did:web:<brain-host>` (the deployed Brain service identity)                                                             |
| `SHARE_CONTENT_VERIFICATION_METHODS` | The exact signing method from Brain's `https://<brain-host>/.well-known/did.json`, normally `did:web:<brain-host>#owner` |
| `SHARE_CONTENT_NAMESPACE_BINDINGS`   | JSON mapping that Brain DID to its namespace, e.g. `{"did:web:<brain-host>":["learncard"]}`                              |

Replace the host placeholders with the deployed domains; do not paste placeholders
or local identities into GitHub. Store the JSON as raw JSON without surrounding
shell quotes. Keep the namespace stable after creating links. The deploy workflow
forces insecure loopback off. The owner API inherits the maintenance namespace,
so no separate owner namespace variable is required.

Redeploy both services after setting the variables (rebuilding the frontend alone
will not update Lambda configuration), then enable `share-multiple-enabled` in
LaunchDarkly. Check create/open/revoke in the target environment, including opening
a copied link in a signed-out browser. Missing values keep sharing disabled.
