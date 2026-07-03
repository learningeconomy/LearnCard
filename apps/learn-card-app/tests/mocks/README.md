# Mocked-network E2E tier

Playwright tests that run against the **vite dev server only — no docker backend**.
Fast and deterministic, so they run on every affected PR (`.github/workflows/mock-e2e.yml`)
via the `test-mock` nx target. The real-backend E2E stays on the gated EC2 job.

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
2. **A typed tRPC mock** (`trpc.ts`) layered on top — installed but empty by default; a
   test can register per-procedure overrides on the returned mock (`mock.on(...)`).

On replay, any backend call that isn't in the HAR (and isn't overridden) is **aborted**
(`notFound: 'abort'`) — missing coverage fails loudly instead of hanging.

The replay app is built with the **local** tenant config (`--stage local`) so it points at
`localhost`, matching the recorded HAR. DIDKit signing runs locally (WASM mocked by the
`mocked-test` fixture).

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
            profileId: TEST_USER_PROFILE_ID,
        });
    });

    test('does the thing', async ({ page }) => {
        // ...assertions
    });
});
```

Run it: `pnpm test:e2e:mock` (or `pnpm exec nx run learn-card-app:test-mock`). Stop docker
first to prove it's truly offline.

## Adding coverage for NEW backend calls

If your test hits a query/mutation not already covered, replay will abort it and the
failure's `error-context.md` / network log names the procedure. Two options:

### Reads / boot (input-specific) → re-record the HAR

```bash
pnpm test:e2e:mock:record     # runs @mocked specs against real docker, PWHAR=update
git add tests/mocks/har/issue.har.zip
```

Records to a single `.zip` (never a loose `.har` — that scatters ~hundreds of body files;
the `har/.gitignore` blocks those).

### Deterministic override → typed stub (no docker needed)

`installNetwork` returns the mock; override a procedure with a response anchored to the
**real** router type, so a backend schema change breaks the build:

```ts
import type { BrainOutputs } from './mocks/trpc';

const mock = await installNetwork(page);
mock.on(
    'boost.someNewProc',
    () =>
        ({
            /* ... */
        } satisfies BrainOutputs['boost']['someNewProc'])
);
// return ABORT from a handler to force the retry-able error path.
```

## Files

| File                                     | Role                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `network.ts`                             | `installNetwork()` — HAR replay + optional typed override, record/replay    |
| `trpc.ts`                                | `createTrpcMock` (batch-aware) + `BrainOutputs`/`CloudOutputs` type anchors |
| `har/issue.har.zip`                      | Recorded boot + reads (single-file HAR)                                     |
| `../fixtures/mocked-test.ts`             | WASM mock, no docker cleanup                                                |
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
