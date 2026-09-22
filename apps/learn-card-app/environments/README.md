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
bun run create-tenant
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
    bun scripts/generate-tenant-assets.ts <tenant> <logo-path> --bg "#hex" --name "Display Name"
    ```

    This creates `environments/<tenant>/assets/` with all iOS, Android, web,
    and branding images.

3. **Apply the tenant config:**

    ```bash
    bun scripts/prepare-native-config.ts <tenant>
    ```

    This copies assets into the platform directories, patches Capacitor
    configs, and writes `public/tenant-config.json`.

4. **Register the hostname** in `tenant-registry.json`:

    ```jsonc
    // environments/tenant-registry.json
    {
        "hostnames": {
            "mytenant.app": { "tenantId": "mytenant", "domain": "mytenant.app" },
        },
    }
    ```

    The `create-tenant` script does this automatically.

5. **Validate all configs (CI):**

    ```bash
    bun scripts/validate-tenant-configs.ts
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

### Opt-in local Keycloak

From the repository root, run
`STAGE=keycloak-local docker compose -f apps/learn-card-app/compose-local.yaml up -d`.
This selects `learncard/config.keycloak-local.json`; the shared `local` stage and
all production defaults remain Firebase. For a host-run frontend, use
`bun scripts/prepare-native-config.ts learncard --stage keycloak-local` from the app directory.
Stage overlays merge onto `config.json`, not onto `config.local.json`, so this
opt-in overlay explicitly includes the local API endpoints.

The callback is `http://localhost:3000/login` (an existing route, allowed by the
realm fixture). The app completes the callback at router boot, then uses its
normal signed-in/onboarding routing. Ticket exchanges use the unauthenticated
lca-api tRPC routes with tenant headers; they do not initialize a dummy wallet.
Email code issuance still uses `firebase.sendLoginVerificationCode`: despite its
namespace it writes lca-api's `login-code:<email>:<code>` Redis store. Do not use
Firebase's custom-token verification to consume a Keycloak login code.

### Native (Capacitor)

Native sign-in opens the Keycloak authorize URL in a system auth sheet instead
of redirecting the webview: iOS uses an ephemeral `ASWebAuthenticationSession`
(local plugin `WebAuthSessionPlugin.swift` / `WebAuthSession` in JS); Android
(and iOS as a fallback) opens `@capacitor/browser` (Chrome Custom Tabs /
`SFSafariViewController`) and listens for the callback via `appUrlOpen`.

- **Redirect URI**: `<bundleId>://login` (e.g. `com.learncard.app://login`),
  read from the tenant config's `native.bundleId`. The Keycloak client's
  **Valid Redirect URIs** must include it, and `prepare-native-config.ts`
  always registers the bundle ID as a URL scheme / intent-filter (see
  `native.customSchemes` handling) so the OS routes the callback back to the
  app.
- **`prompt=login` on every native authorize request**: Android Custom Tabs
  and iOS's shared system browser both carry Keycloak's SSO cookie. Without
  forcing a fresh login prompt, a second account's sign-in (or a reauth ticket
  hop) could silently resolve against whichever session the browser already
  holds.
- **Sign-out**: native never redirects to Keycloak's `end_session` endpoint
  (there's no page to redirect), so `signOut()` best-effort revokes the
  refresh token via the token-revocation endpoint before clearing local state.
- **Native Google/Apple audiences**: native social sign-in acquires a Google
  or Apple ID token directly through `@capacitor-firebase/authentication`
  (`skipNativeAuth: true`, no Firebase session created) and exchanges it for
  an lca-api login ticket exactly like the web OIDC-credential path. The
  backend's audience allowlists must include the native client IDs:
  `GOOGLE_OAUTH_CLIENT_IDS` needs the iOS and Android OAuth client IDs (in
  addition to the web one), and `APPLE_OAUTH_CLIENT_IDS` needs the app's
  bundle ID (Sign in with Apple uses the bundle ID as the audience for native
  clients).
- **Known limitation**: if the OS kills the app process while the auth sheet
  is open (cold start), the in-flight sign-in is not resumed — the user
  returns to a logged-out app and simply retries.

```bash
# Production vetpass
bun scripts/prepare-native-config.ts vetpass

# Local dev vetpass
bun scripts/prepare-native-config.ts vetpass --stage local

# Staging learncard
bun scripts/prepare-native-config.ts learncard --stage staging

# Clean all generated files
bun scripts/prepare-native-config.ts --reset
```

Switching is git-clean — platform output files are gitignored. Only the
`environments/` source directories are tracked.

### Template files

Some platform files (Vite's `index.html`, iOS entitlements) need to exist but
are patched per-tenant. These use a **template pattern**:

| Template (tracked)                             | Generated (gitignored)                |
| ---------------------------------------------- | ------------------------------------- |
| `index.template.html`                          | `index.html`                          |
| `ios/App/App/App.entitlements.template`        | `ios/App/App/App.entitlements`        |
| `ios/App/App/AppRelease.entitlements.template` | `ios/App/App/AppRelease.entitlements` |

`prepare-native-config.ts` copies the template → generated file, then patches
it with tenant-specific values (title, deep link domains, etc.). On a fresh
clone the generated files won't exist until you run the script (e.g. via
`bun run lc dev`).

Firebase configs (`google-services.json`, `GoogleService-Info.plist`) are
copied directly from tenant assets and are also gitignored.

## config.json format

The config is a partial `TenantConfig` object. Fields are deep-merged onto
`DEFAULT_LEARNCARD_TENANT_CONFIG`. Common override sections:

| Section    | Purpose                                                 |
| ---------- | ------------------------------------------------------- |
| `tenantId` | Unique tenant identifier                                |
| `domain`   | Production domain (e.g. `vetpass.app`)                  |
| `apis`     | API endpoint URLs                                       |
| `auth`     | Firebase project, SSS server, sign-in methods           |
| `storage`  | Image upload provider and CDN settings                  |
| `branding` | App name, colors, category labels                       |
| `features` | Feature toggles                                         |
| `native`   | Bundle ID, deep link domains, Capgo channel             |
| `email`    | Email branding for recovery / OTP / notification emails |

The config supports an optional `schemaVersion` field (defaults to the current
version). When the schema version changes, stale localStorage caches are
automatically invalidated.

See `tenantConfigSchema.ts` for the full schema with defaults.

### Image storage

Omitting `storage` keeps the LearnCard default Filestack provider.

```json
{
    "storage": {
        "provider": "filestack",
        "apiKey": "...",
        "cdnDomain": "cdn.filestackcontent.com"
    }
}
```

```json
{
    "storage": {
        "provider": "s3",
        "uploadEndpoint": "https://uploads.example.com/images",
        "cdnDomain": "cdn.mytenant.app",
        "bucket": "mytenant-images"
    }
}
```

### Email branding

The `auth.keyDerivation: 'sss'` client forwards `X-Tenant-Id` on every request
to `lca-api`. Server-side, the active tenant is resolved and used to brand
recovery / OTP / notification emails (subject, from-address, logo, colors,
copy). See [Configure Tenant-Branded Emails](../../../docs/how-to-guides/configure-tenant-branded-emails.md)
for the end-to-end setup, and the `tenantEmailConfigSchema` in
`packages/learn-card-base/src/config/tenantConfigSchema.ts` for the field list.

{% hint style="info" %}
**Backend registration required.** The `email` section of `config.json` is
validated by the schema but is **not yet read by `lca-api` / `brain-service`**.
To brand emails for a new tenant today, add an entry to
`TENANT_EMAIL_BRANDING` and `ORIGIN_MAP` in
`packages/email-templates/src/tenant-registry.ts` and open a PR. The
`config.json` `email` section is reserved for future work that will let
tenants override branding without a package change.
{% endhint %}

## Config ownership and failure policy

`TenantConfig` is the only runtime configuration source for browser applications.
API endpoints, auth selection and provider settings, branding, observability,
Google Maps, analytics, and CORS proxy settings belong in `config.json` plus its
selected stage overlay.

Vite environment variables are limited to build controls such as source mode,
file watching, bundle analysis, and the debug panel. ScoutPass additionally
accepts its public Web3Auth client ID and Google Maps key at build time; the
validated build contract merges those values into the single resolved
`TenantConfig` before application startup.

Resolution behavior is intentionally strict:

1. Explicit static, baked, fetched, and cached values are validated before use.
2. Invalid JSON or an invalid explicit config stops startup with an actionable
   configuration error.
3. A transiently unavailable remote endpoint may fall back to a previously
   validated baked or cached config.
4. The built-in LearnCard default is used only when a caller explicitly opts
   into it, primarily in isolated tests.
5. No application subsystem reads `process.env`, `import.meta.env`, legacy Vite
   globals, or `window.__ENV__` directly.

Service deployments follow the same rule: each service parses its environment
once in `src/config/environment.ts`, then consumers import the typed
`environment` object. Unsupported booleans, malformed URLs, missing required
keys, and invalid conditional combinations fail before database or client
initialization.

## Quick start

```bash
bun run lc                       # Interactive menu — pick tenant, stage, launch mode
bun run lc dev                   # Full stack with tenant + stage picker
bun run lc dev vetpass            # Full stack vetpass (picks stage interactively)
bun run lc dev vetpass local      # Full stack vetpass, local stage
bun run lc start                  # App only, default tenant
bun run lc start vetpass local    # App only, vetpass local
bun run lc validate               # Run all config + theme validators
bun run lc create                 # Scaffold a new tenant
bun run lc tenants                # List tenants, stages, and themes
```

If you don't need multi-tenant features, **`bun run dev` still works exactly as before**.

## npm scripts

| Script                        | Description                               |
| ----------------------------- | ----------------------------------------- |
| **`bun run lc`**              | **Interactive dev launcher** (start here) |
| `bun run dev`                 | Docker compose — full stack (unchanged)   |
| `bun run dev:services`        | Docker services only (no app)             |
| `bun run start`               | Vite dev server only                      |
| `bun run prepare-config`      | Apply default (learncard) config          |
| `bun run docker-start`        | Apply local config + start dev            |
| `bun run docker-start:tenant` | Apply `$TENANT` config + start dev        |
| `bun run generate-assets`     | Generate assets from a logo               |
| `bun run validate-configs`    | Validate all tenant configs (CI)          |
| `bun run validate-themes`     | Validate all theme.json files (CI)        |
| `bun run create-tenant`       | Interactive tenant scaffolding            |
| `bun run config-editor`       | Launch visual config editor (:4400)       |
