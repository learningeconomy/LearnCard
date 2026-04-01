# Environment Variables from Infisical

This monorepo uses [Infisical](https://infisical.com) to manage shared environment variables. A script generates `.env` files for each service/app from the Infisical "LearnCard" project.

## Quick Start

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
pnpm env:backup

# 5. Pull all .env files
pnpm env:pull

# 6. Optionally compare the new .env files against the backup
pnpm env:compare-backup

# 7. Optionally compare your local .env files against Infisical
pnpm env:compare-infisical
```

## Usage

```bash
# Pull dev environment for all services (default)
pnpm env:pull

# Pull a specific environment
pnpm env:pull -- --env=staging
pnpm env:pull -- --env=prod

# Pull only one service
pnpm env:pull -- --only=brain
pnpm env:pull -- --only=app

# List available service targets
pnpm env:pull -- --list

# Combine flags
pnpm env:pull -- --env=staging --only=lca-api

# Backup the current .env files before regenerating them
pnpm env:backup

# Compare the current .env files against their .env.backup copies
pnpm env:compare-backup

# Compare the current .env files against Infisical exports
pnpm env:compare-infisical
```

### Backup and Compare Workflow

Use the backup command when you want a quick snapshot of the current generated
environment files before pulling from Infisical again.

```bash
# Copy each current .env to a matching .env.backup file
pnpm env:backup

# Show which keys differ between .env and .env.backup
pnpm env:compare-backup
```

The compare-backup command reports keys that were added, removed, or changed
between the current `.env` and `.env.backup` for each service.

The compare-infisical command reports keys that are missing from Infisical,
only present in Infisical, or have changed values compared to the current
local `.env` file. It does not print full secret values.

## Service Targets

| Key       | Service                | Infisical Path(s)                    | Local .env File                                           |
| --------- | ---------------------- | ------------------------------------ | --------------------------------------------------------- |
| `brain`   | Brain Service          | `/LearnCard/brain-service`           | `services/learn-card-network/brain-service/.env`          |
| `cloud`   | LearnCloud Service     | `/LearnCard/cloud-service`           | `services/learn-card-network/learn-cloud-service/.env`    |
| `app`     | LearnCard App          | `/learn-card-app`                    | `apps/learn-card-app/.env`                                |
| `lca-api` | LCA API                | `/LearnCard/lca-api`                 | `services/learn-card-network/lca-api/.env`                |
| `signing` | Simple Signing Service | `/LearnCard/simple-signing-service`  | `services/learn-card-network/simple-signing-service/.env` |

Each target pulls secrets from its specific Infisical folder path. To enable root-level (`/`) variable merging, add pipe-separated paths (e.g., `/|/LearnCard/brain-service`) to the INFISICAL_PATHS array in `scripts/pull-env.sh`.

## How It Works

1. The script (`scripts/pull-env.sh`) iterates over the service targets
2. For each target, it calls `infisical export --path=<path> --env=<env>` for each Infisical folder
3. Secrets from all paths are merged (later paths win on duplicate keys)
4. The result is written to the local `.env` file with a header comment

Generated `.env` files are gitignored and should **never** be committed.

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
│   └── cloud-service/      ← JWT_SIGNING_KEY, LEARN_CLOUD_*, RSA_PRIVATE_KEY, XAPI_*
├── learn-card-app/         ← VITE_*, CORS_PROXY_API_KEY, WEB3AUTH_*
│   ├── lca-api/            ← GOOGLE_APPLICATION_CREDENTIAL, OPENAI_API_KEY, SEED
│   └── fastlane/           ← (CI/CD keys, not pulled by default)
```

### Known Gaps

-   **ScoutPass app** (`apps/scouts/`) uses a separate Infisical project ("ScoutPass") — not yet wired into this script.
-   **Example apps** (`examples/app-store-apps/`) are developer-specific and not pulled from Infisical.
-   Some vars in `.env.example` files may not yet exist in Infisical. Compare your generated `.env` against the `.env.example` and add any missing vars to Infisical or fill them in manually.

## Troubleshooting

**"infisical CLI not found"** — Install it per the instructions above.

**"failed to export path"** — You may not have access to that Infisical folder, or the path doesn't exist for the selected environment. Check `infisical secrets --path=<path> --env=<env>` to debug.

**Missing variables** — Compare the generated `.env` against the `.env.example` in the same directory. Any vars not in Infisical need to be added there or filled in manually.

**Authentication expired** — Run `infisical login` again.
