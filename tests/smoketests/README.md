# LearnCard Read-Only Smoketests

Read-only smoke tests for deployed LearnCard environments. These verify that services are healthy, the frontend loads, and no critical errors occur — **without creating or modifying any data**.

## Rules (MUST follow)

1. **Strictly read-only** — no POST, PUT, DELETE, or PATCH requests to any service
2. **No authentication** — no wallet creation, no profile creation, no credential issuance
3. **No `@learncard/init` imports** — no LearnCard SDK usage that writes data
4. **No state mutation** — tests must be safe to run against production at any time

## Running Locally

```bash
cd tests/smoketests && pnpm install
pnpm exec playwright install chromium

# Pick the target environment — URLs are resolved automatically.
SMOKETEST_ENV=staging    pnpm test   # defaults to staging if unset
SMOKETEST_ENV=production pnpm test
SMOKETEST_ENV=scouts     pnpm test   # production ScoutPass (no staging for scouts)

# API-only / browser-only
SMOKETEST_ENV=staging pnpm test:api
SMOKETEST_ENV=staging pnpm test:browser

# HTML report
pnpm report
```

### URL resolution

Target URLs come from repo config — no duplicated env vars:

- **staging / production** → `apps/learn-card-app/environments/learncard/config.json`
  (merged with `config.staging.json` for staging)
- **scouts** → URLs mirror `packages/learn-card-base/src/constants/Networks.ts`
  with the frontend at `pass.scout.org`

Override individual URLs for ad-hoc debugging via `SMOKETEST_APP_URL`,
`SMOKETEST_API_URL`, `SMOKETEST_CLOUD_URL`, `SMOKETEST_LCA_API_URL`.

## CI Integration

The smoketest workflow (`.github/workflows/smoketest.yml`) is triggered:

1. **Automatically** after deploys in `deploy.yml`:
   - `smoketest-staging` — after staging deploys (push to `main`)
   - `smoketest-production` — after production deploys (release commit or manual `production` dispatch)
   - `smoketest-scouts` — after manual `scouts` dispatch
2. **Manually** — via `workflow_dispatch` on `smoketest.yml` with environment selection (staging/production/scouts)

No GitHub environment variables are required — the workflow passes
`SMOKETEST_ENV` and the URL resolver reads from in-repo config.

## Test Tiers

| Tier | File Pattern | Description | Example |
|------|-------------|-------------|---------|
| 1 | `api-*.spec.ts` | API health checks (GET only) | `api-health.spec.ts` |
| 2 | `app-*.spec.ts` | Browser page loads, asset checks | `app-loads.spec.ts` |

## Adding New Tests

1. **Tier 1 (API)** — Create `tests/api-<name>.spec.ts`. Only use `request.get()`. Verify status codes and response structure.
2. **Tier 2 (Browser)** — Create `tests/app-<name>.spec.ts`. Use `page.goto()` to load pages. Check rendering, assets, and console output. Never log in or fill forms that submit data.

### Naming Convention

- `api-health.spec.ts` — service health endpoints
- `api-<service>-<feature>.spec.ts` — specific API checks
- `app-loads.spec.ts` — frontend rendering
- `app-<feature>.spec.ts` — specific page/feature checks
