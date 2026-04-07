# LearnCard Read-Only Smoketests

Read-only smoke tests for deployed LearnCard environments. These verify that services are healthy, the frontend loads, and no critical errors occur — **without creating or modifying any data**.

## Rules (MUST follow)

1. **Strictly read-only** — no POST, PUT, DELETE, or PATCH requests to any service
2. **No authentication** — no wallet creation, no profile creation, no credential issuance
3. **No `@learncard/init` imports** — no LearnCard SDK usage that writes data
4. **No state mutation** — tests must be safe to run against production at any time

## Running Locally

```bash
# Set target URLs (defaults to localhost)
export SMOKETEST_APP_URL=https://staging--learncard.netlify.app
export SMOKETEST_API_URL=https://network-api-staging.learncard.com
export SMOKETEST_CLOUD_URL=https://storage-api-staging.learncard.com
export SMOKETEST_LCA_API_URL=https://app-api-staging.learncard.com

# Install dependencies
cd tests/smoketests && pnpm install

# Install Playwright browser
pnpm exec playwright install chromium

# Run API health checks only
pnpm test:api

# Run browser smoke checks only
pnpm test:browser

# Run all tests
pnpm test

# View HTML report
pnpm report
```

## CI Integration

The smoketest workflow (`.github/workflows/smoketest.yml`) is triggered:

1. **Automatically** — after staging deploys succeed (`smoketest-staging` job in `deploy.yml`)
2. **Manually** — via `workflow_dispatch` with environment selection (staging/production)

URLs are configured as GitHub environment variables (`SMOKETEST_APP_URL`, etc.) in the `staging-smoketest` / `production-smoketest` environments.

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
