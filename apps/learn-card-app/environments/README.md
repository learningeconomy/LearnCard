# Tenant Environments

Each subdirectory represents a tenant configuration for the LearnCard app.

```
environments/
├── tenant-registry.json      # Shared hostname → tenant mapping (edge function + scripts)
├── learncard/                # Default LearnCard tenant
│   ├── config.json           # Production config (merged onto defaults)
│   ├── config.local.json     # Local dev overrides (localhost APIs, no analytics)
│   ├── config.staging.json   # Staging overrides (optional)
│   └── assets/               # Platform assets (icons, splash, branding)
│       ├── ios/
│       ├── android/
│       ├── web/
│       ├── branding/         # In-app branding images
│       └── config/           # Base config templates (capacitor, manifests)
├── vetpass/
│   ├── config.json           # Production config
│   ├── config.local.json     # Local dev overrides
│   └── assets/
```

## Adding a new tenant

The easiest way is the interactive scaffolding script:

```bash
pnpm create-tenant
```

This guides you through naming, domains, features, and optionally creates
a custom theme — all with sensible defaults.

### Manual setup

1. **Create the directory and config:**

   ```bash
   mkdir -p environments/<tenant>
   ```

   Create `environments/<tenant>/config.json` with overrides. Only include
   fields that differ from the LearnCard defaults in `tenantDefaults.ts`.
   The config is deep-merged onto defaults at build time.

2. **Generate assets from a logo:**

   ```bash
   npx tsx scripts/generate-tenant-assets.ts <tenant> <logo-path> --bg "#hex" --name "Display Name"
   ```

   This creates `environments/<tenant>/assets/` with all iOS, Android, web,
   and branding images.

3. **Apply the tenant config:**

   ```bash
   npx tsx scripts/prepare-native-config.ts <tenant>
   ```

   This copies assets into the platform directories, patches Capacitor
   configs, and writes `public/tenant-config.json`.

4. **Register the hostname** in `tenant-registry.json`:

   ```jsonc
   // environments/tenant-registry.json
   {
       "hostnames": {
           "mytenant.app": { "tenantId": "mytenant", "domain": "mytenant.app" }
       }
   }
   ```

   The `create-tenant` script does this automatically.

5. **Validate all configs (CI):**

   ```bash
   npx tsx scripts/validate-tenant-configs.ts
   ```

## Stage overlays

Each tenant can have stage-specific overlay files that are deep-merged on top
of the base `config.json`. Only include fields that differ per stage.

```
config.json              ← production (complete config)
config.local.json        ← local dev overrides (sparse — just API URLs, dev flags)
config.staging.json      ← staging overrides (sparse — just staging URLs)
```

**Merge order:** `tenantDefaults → config.json → config.<stage>.json → final`

Example `config.local.json` — only the diffs:

```json
{
    "apis": {
        "brainService": "http://localhost:4000/trpc",
        "brainServiceApi": "http://localhost:4000/api",
        "cloudService": "http://localhost:4100/trpc",
        "lcaApi": "http://localhost:5100/trpc",
        "xapi": "http://localhost:4100/xapi"
    },
    "features": { "analytics": false },
    "observability": { "sentryEnv": "development" }
}
```

If no `--stage` is specified, **production** is assumed (no overlay applied).

## Switching tenants

```bash
# Production vetpass
npx tsx scripts/prepare-native-config.ts vetpass

# Local dev vetpass
npx tsx scripts/prepare-native-config.ts vetpass --stage local

# Staging learncard
npx tsx scripts/prepare-native-config.ts learncard --stage staging

# Clean all generated files
npx tsx scripts/prepare-native-config.ts --reset
```

Switching is git-clean — platform output files are gitignored. Only the
`environments/` source directories are tracked.

## config.json format

The config is a partial `TenantConfig` object. Fields are deep-merged onto
`DEFAULT_LEARNCARD_TENANT_CONFIG`. Common override sections:

| Section        | Purpose                                      |
| -------------- | -------------------------------------------- |
| `tenantId`     | Unique tenant identifier                     |
| `domain`       | Production domain (e.g. `vetpass.app`)        |
| `apis`         | API endpoint URLs                            |
| `auth`         | Firebase project, SSS server, sign-in methods |
| `branding`     | App name, colors, category labels            |
| `features`     | Feature toggles                              |
| `native`       | Bundle ID, deep link domains, Capgo channel  |

The config supports an optional `schemaVersion` field (defaults to the current
version). When the schema version changes, stale localStorage caches are
automatically invalidated.

See `tenantConfigSchema.ts` for the full schema with defaults.

## Config precedence

The app has two config input paths. **Tenant config JSON is canonical.**

```
┌─────────────────────────────────────────────────────────────────┐
│  Highest priority                                               │
│                                                                 │
│  1. TenantConfig (config.json + stage overlay)                  │
│     → setAuthConfigFromTenant() bridges into authConfig          │
│     → initNetworkStoreFromTenant() sets API endpoints            │
│     → initSentryFromTenant() reads observability config          │
│                                                                 │
│  2. .env vars (VITE_* / REACT_APP_*)                            │
│     → Legacy fallback for auth config (getAuthConfig())          │
│     → Per-developer overrides (e.g. personal Google Maps key)    │
│                                                                 │
│  3. vite.config.ts `define` globals                             │
│     → DEPRECATED for values now in TenantConfig                  │
│     → Still used: __PACKAGE_VERSION__, IS_PRODUCTION             │
│                                                                 │
│  4. Hardcoded defaults (tenantDefaults.ts, authConfig.ts)       │
│                                                                 │
│  Lowest priority                                                │
└─────────────────────────────────────────────────────────────────┘
```

**Rule of thumb:**
- Tenant-specific values → `config.json`
- Personal developer keys → `.env` (gitignored)
- Everything else uses defaults

## Quick start

```bash
pnpm lc                       # Interactive menu — pick tenant, stage, launch mode
pnpm lc dev                   # Full stack with tenant + stage picker
pnpm lc dev vetpass            # Full stack vetpass (picks stage interactively)
pnpm lc dev vetpass local      # Full stack vetpass, local stage
pnpm lc start                  # App only, default tenant
pnpm lc start vetpass local    # App only, vetpass local
pnpm lc validate               # Run all config + theme validators
pnpm lc create                 # Scaffold a new tenant
pnpm lc tenants                # List tenants, stages, and themes
```

If you don't need multi-tenant features, **`pnpm dev` still works exactly as before**.

## npm scripts

| Script                        | Description                          |
| ----------------------------- | ------------------------------------ |
| **`pnpm lc`**                | **Interactive dev launcher** (start here) |
| `pnpm dev`                   | Docker compose — full stack (unchanged) |
| `pnpm dev:services`          | Docker services only (no app)        |
| `pnpm start`                 | Vite dev server only                 |
| `pnpm prepare-config`        | Apply default (learncard) config     |
| `pnpm docker-start`          | Apply local config + start dev       |
| `pnpm docker-start:tenant`   | Apply `$TENANT` config + start dev   |
| `pnpm generate-assets`       | Generate assets from a logo          |
| `pnpm validate-configs`      | Validate all tenant configs (CI)     |
| `pnpm validate-themes`       | Validate all theme.json files (CI)   |
| `pnpm create-tenant`         | Interactive tenant scaffolding       |
| `pnpm config-editor`         | Launch visual config editor (:4400)  |
