# Tenant Environments

Each subdirectory represents a tenant configuration for the LearnCard app.

```
environments/
├── learncard/          # Default LearnCard production
│   ├── config.json     # Tenant config overrides (merged onto defaults)
│   └── assets/         # Platform assets (icons, splash, branding)
│       ├── ios/
│       ├── android/
│       ├── web/
│       ├── branding/   # In-app branding images
│       └── config/     # Base config templates (capacitor, manifests)
├── vetpass/
│   ├── config.json
│   └── assets/
├── local/              # Local dev (localhost APIs, no analytics)
│   └── config.json
```

## Adding a new tenant

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

4. **Validate all configs (CI):**

   ```bash
   npx tsx scripts/validate-tenant-configs.ts
   ```

## Switching tenants

```bash
# Switch to vetpass
npx tsx scripts/prepare-native-config.ts vetpass

# Switch back to learncard
npx tsx scripts/prepare-native-config.ts learncard

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

See `tenantConfigSchema.ts` for the full schema with defaults.

## npm scripts

| Script                        | Description                        |
| ----------------------------- | ---------------------------------- |
| `pnpm prepare-config`        | Apply default (learncard) config   |
| `pnpm docker-start`          | Apply local config + start dev     |
| `pnpm docker-start:tenant`   | Apply `$TENANT` config + start dev |
| `pnpm generate-assets`       | Generate assets from a logo        |
