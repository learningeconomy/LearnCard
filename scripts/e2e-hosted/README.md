# Hosted E2E execution

The `E2E` workflow runs the browser job and three service-test shards concurrently.
Each job owns its Docker stack. Within the browser job, functional tests run before
accessibility tests so legacy database resets cannot interrupt another suite.

## Browser workers

The default three specs use `playwright.parallel.config.ts`: two Firefox workers,
parallel tests within files, and no shared authentication setup. The
`tests/fixtures/isolated-test.ts` fixture provides fresh `learner`, `recipient`, and
`issuer` actors per test attempt. Pass the same actor to browser authentication and
SDK helpers. Every actor has its own seed and profile ID, including on retries.
Tests start with empty browser storage and leave backend data until stack teardown.

```ts
import { test, expect } from './fixtures/isolated-test';
import { waitForAuthenticatedState } from './test.helpers';

test('my independent flow', async ({ page, actors }) => {
    await waitForAuthenticatedState(page, actors.learner);
    // Assert only on this test's data.
});
```

App listings are globally visible, so they also need unique names and IDs and
assertions scoped to the created listing. Do not assert global record counts or
rely on another test running first. Never call `/delete-all` in a parallel test.

`run-browser.sh` selects the parallel config only when every requested filename
is one of `consent-flow-race.spec.ts`, `app-store.spec.ts`, or
`wallet-credentials.spec.ts`. Other selections use the original serial config;
this preserves manual runs of legacy specs with global database cleanup.
Accessibility remains a separate serial invocation. Add a suite to both the
parallel config's `testMatch` and the launcher's allowlist only after auditing its
identities, resources, hooks, and cleanup.

The mocked tier also uses two workers and parallel tests. Its HAR is read-only
and its mocks belong to each browser context. Recording remains serial through
`playwright.mock-record.config.ts` so workers never write the same HAR.

## Build cache

`Dockerfile.monorepo` exposes a `dependencies` stage containing only workspace
manifests, patches, and installed dependencies. BuildKit reads the source through
a temporary bind mount to collect manifests without creating a source image layer.

The Bake groups export this stage through a cache-only target using `mode=min`.
Browser and service base images import that shared dependency cache. Source and
app image layers are loaded into Docker but never exported to the remote cache.
This avoids uploading source layers that change on each commit. The new cache
scope starts cold on its first CI run. Keep dependency versions aligned across
stages when upgrading Bun.

## Browser runtime

The hosted launcher derives the official Playwright `-noble` image tag from the
installed package version. Browsers and OS dependencies are already in that image;
there is no per-run apt installation. Tests mount the installed workspace at its
original absolute path and run as the runner user, preserving workspace links and
artifact ownership. Linux host networking preserves the existing localhost URLs.
Both functional tests and accessibility/global setup run inside this image.

The app Dockerfile builds with the monorepo image, then copies only the generated
`build/` directory into Nginx. The runtime listens on port 3000, serves SPA routes
through index.html, and returns 404 for missing assets. Backend containers continue
to use the monorepo image.

## Measuring changes

Artifacts contain `timings.tsv`, capacity snapshots, Docker build logs, and
Playwright JSON reports. Compare the slowest required job across multiple runs,
including cold and warm caches. Compare the actual functional test and accessibility
durations separately from image builds, image loading, setup, and cleanup.

Baseline browser stage durations on September 30, 2026:

| Run         | Docker preparation | Functional suite | Accessibility |
| ----------- | -----------------: | ---------------: | ------------: |
| 36670842853 |             12m48s |            5m55s |         3m53s |
| 36673410610 |             11m03s |            6m07s |         4m01s |
| 36686252727 |             22m57s |            6m03s |         3m58s |

The last run spent 7m56s exporting the old base cache. These are observations,
not a promised speedup: remote cache behavior and runner capacity must be verified
with the new workflow. Increasing browser shards repeats stack preparation and
should be considered only after measuring this version.

## Local checks

```sh
bash .github/tests/test-hosted-e2e-script-contract.test.sh
bash .github/tests/test-hosted-e2e-playwright.test.sh
bash .github/tests/test-hosted-e2e-concurrency.test.sh
bash .github/tests/test-hosted-e2e-browser-runtime.test.sh
bash .github/tests/test-hosted-e2e-readiness.test.sh

cd apps/learn-card-app
bunx playwright test --config=playwright.mock.config.ts --repeat-each=2
# With the real stack already running:
E2E_EXTERNAL_STACK=true bunx playwright test --config=playwright.parallel.config.ts
```
