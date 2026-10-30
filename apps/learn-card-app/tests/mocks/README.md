# Mocked-network E2E tier

Playwright tests that run against the **vite dev server only — no docker backend**.
They run via the `test-mock` Nx target (`.github/workflows/mock-e2e.yml`).
The real-backend E2E tier is hosted separately in `.github/workflows/e2e.yml`.

## CI eligibility and browser reuse (LC-2312 / CI-14)

Before installing dependencies or downloading Firefox, a dependency-free Node
check compares the PR's changes from its Git merge base. Only Markdown under
`docs/`, `.changeset/*.md`, and the root `README.md`, `CONTRIBUTING.md`,
`CODE_OF_CONDUCT.md` or `LICENSE` can skip setup. Documentation code snippets,
assets and all other paths run the **complete** mock suite. This is deliberately
broader than Nx affected selection: a shared-package, lockfile or config change
cannot be skipped because it sits outside the app directory. Unknown/empty or
unavailable comparisons also run; renames consider both old and new paths.
Manual dispatch always runs the complete suite, even for prose-only revisions.

For example, correcting `docs/README.md` skips dependency installation and
Firefox entirely. Changing `packages/learn-card-base` still runs all mocked
browser tests, including when the same PR edits documentation.

Eligible runs cache a job-local Playwright browser directory with an exact key
covering the installed Playwright version, Firefox revision, full browser
manifest (including FFmpeg/revision overrides), OS distribution/release and
architecture. There is no broad fallback key. `playwright install --with-deps
firefox` still runs on cache hits: OS packages are not cached, and Playwright can
install missing browser files. A cache hit never skips tests. GitHub controls
cache scope/eviction; this does not add a default-branch cache producer.

[Playwright cautions](https://playwright.dev/docs/ci#caching-browsers) that browser
cache restore can cost as much as downloading. Treat this as download reuse,
not a guaranteed speedup; compare actual install/cache timings before expanding
it. Neither the browser cache nor eligibility changes retries, workers, browser
choice, HAR fixtures or backend isolation.

Review locally with `node --test scripts/mock-e2e-ci.test.cjs` and
`node .github/tests/test-mock-e2e-workflow.test.cjs` from the repository root.
In Actions, a prose-only PR should show `run_e2e=false` / `reason=prose-only`
and skip setup/browser/test/report steps. For an eligible or manual run, inspect
the exact cache key, the unconditional browser/OS install, and full test results.

## What it covers

The offline UI logic of `/issue`: type-picker gating, the form flow, recipient-mode
tabs, the JSON editor toggle, and the retry-able error path. It does **not** complete a
real issuance — that's a signing + multi-service backend flow that lives in the real
`@e2e` spec (see the bottom of this doc).

## How it works

`installNetwork(page)` sets up:

1. **HAR replay** (`har/issue.har.zip`) — serves the recorded auth/boot handshake and all
   backend reads on `localhost:4000/4100/5100` (tRPC, `/api`, `/keys`, and non-tRPC calls
   like did:web resolution) verbatim. Recorded once against real docker; refreshable.
2. **A typed tRPC mock** (`trpc.ts`) layered on top — serves authentication challenge
   refills for both services; a test can register per-procedure overrides on the
   returned mock (`mock.on(...)`). The clients randomize refill sizes, so exact HAR
   request-body matching cannot cover every bootstrap. The stub returns the requested
   number of unique strings; recording mode still uses the real backend.

On replay, any backend call that isn't in the HAR (and isn't overridden) is **aborted**
(`notFound: 'abort'`) — missing coverage fails loudly instead of hanging.

The replay app is built with the **local** tenant config (`--stage local`) so it points at
`localhost`, matching the recorded HAR. DIDKit signing runs locally (WASM mocked by the
`mocked-test` fixture).

The shared `mocked-test` fixture also intercepts LaunchDarkly evaluation, streaming,
goals and telemetry requests. Flags are deterministic; both `inAppMessages` and
`inAppMessagesV2` default to `{ messages: [] }`, so live announcements cannot cover
controls during an unrelated test.
Set flags explicitly with `test.use({ featureFlags: { flagName: { value: true } } })`.
Existing page-level `mockLaunchDarkly(page, flags)` overrides still take precedence.

The fixture also serves the tracked `public/connectivity.txt` marker locally. This
keeps intentionally aborted backend calls and slow Vite startup from turning an
online mocked flow into an offline sign-in remount. Offline-specific tests can
override this route. Use `nextPath` in `waitForAuthenticatedState` to return directly
to the tested route through developer sign-in, avoiding a second full app load.
When `profileId` is supplied, developer sign-in creates the profile and resets its
queries before returning. The helper does not wait for the legacy profile-setup
modal, which is absent in this flow. Tests still assert their authenticated page
content. Keep explicit reloads when persistence or recovery is the behavior under test.

For mocked sign-in and persistence reloads, use `waitUntil: 'commit'` and then wait
for the feature's visible authenticated content. The document's `load` event also
waits for unrelated resources and frames, so it is not an app-readiness signal.
`navigation.mocked.spec.ts` exercises sign-in while a document resource stays pending.

For a complete Linux run before opening a PR, push the branch and run
`gh workflow run mock-e2e.yml --ref <branch>`. Manual runs execute the full suite even
when Nx finds no affected changes. Each manual run has its own concurrency group,
so repeated runs can complete independently; PR updates still cancel superseded runs.

## Writing a mocked test

Create `tests/<name>.mocked.spec.ts` (the `.mocked.spec.ts` suffix + a `@mocked` tag in
the describe title are how the mock config discovers it):

```ts
import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

test.describe('My feature @mocked', () => {
    test.beforeEach(async ({ page }) => {
        // MUST run before any navigation so boot calls are served.
        await installNetwork(page);
        await waitForAuthenticatedState(page, {
            path: '/my-page',
            nextPath: '/my-page',
            profileId: TEST_USER_PROFILE_ID,
        });
    });

    test('does the thing', async ({ page }) => {
        // ...assertions
    });
});
```

Run it: `bun run test-mock` (or `bunx nx run learn-card-app:test-mock`). Stop docker
first to prove it's truly offline.

## Adding coverage for NEW backend calls

If your test hits a query/mutation not already covered, replay will abort it and the
failure's `error-context.md` / network log names the procedure. Two options:

### Reads / boot (input-specific) → re-record the HAR

```bash
bun run test:e2e:mock:record  # runs @mocked specs against real docker, PWHAR=update
bun tests/mocks/normalize-har-cors.ts # allow replay on any PW_MOCK_PORT
git add tests/mocks/har/issue.har.zip
```

Normalize recorded response origins after recording: real-backend captures use port 3000, while replay defaults to 3010. These test fixtures use bearer headers rather than browser cookies, so replay responses use `Access-Control-Allow-Origin: *`. Wait for app readiness assertions with `waitUntil: 'domcontentloaded'` when external assets are irrelevant.

Records to a single `.zip` (never a loose `.har` — that scatters ~hundreds of body files;
the `har/.gitignore` blocks those).

### Deterministic override → typed stub (no docker needed)

`installNetwork` returns the mock; override a procedure with a response anchored to the
**real** router type, so a backend schema change breaks the build:

```ts
import type { BrainOutputs } from './mocks/trpc';

const mock = await installNetwork(page);
mock.on('boost.someNewProc', () => ({/* ... */}) satisfies BrainOutputs['boost']['someNewProc']);
// return ABORT from a handler to force the retry-able error path.
```

## Files

| File                                     | Role                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `network.ts`                             | `installNetwork()` — HAR replay + optional typed override, record/replay    |
| `trpc.ts`                                | `createTrpcMock` (batch-aware) + `BrainOutputs`/`CloudOutputs` type anchors |
| `har/issue.har.zip`                      | Recorded boot + reads (single-file HAR)                                     |
| `../fixtures/mocked-test.ts`             | WASM, connectivity and feature-flag mocks, no docker cleanup                |
| `../../playwright.mock.config.ts`        | Replay config (vite, local stage, `@mocked` only)                           |
| `../../playwright.mock-record.config.ts` | Record config (real docker)                                                 |

## Not in this tier (use the real `@e2e` spec)

Anything that **completes an issuance** — issue-to-self, issue-to-a-person, and link mode.
These are real signing + multi-service flows; faithfully mocking them offline is brittle
and low-value, so they live in `tests/issue-credential-page.spec.ts` (the real-backend
semantic net, run on the gated job).

> **Anti-drift:** the type anchor catches structural drift at compile time; the HAR can be
> re-recorded to catch behavioral drift; and the real `@e2e` smoke is the backstop.
> The `har/issue.har.zip` contains **test-user** auth tokens/DIDs (seed `'a'*64`), not real PII.
