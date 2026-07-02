# Mocked-network E2E tier

Playwright tests that run against the **vite dev server only — no docker backend**.
Fast and deterministic, so they run on every affected PR (`.github/workflows/mock-e2e.yml`)
via the `test-mock` nx target. The real-backend E2E stays on the gated EC2 job.

## How it works

`installNetwork(page)` composes two layers (see `network.ts`):

1. **HAR replay** (`har/issue.har.zip`) — serves the recorded auth/boot handshake and
   all input-specific **reads** (`index.get`, `getProfile`, `getChallenges`, …) verbatim.
   Recorded once against real docker; refreshable on demand.
2. **Typed tRPC stubs** (`trpc.ts` + `issuance-stubs.json`) — serve the **mutations**
   (`boost.createBoost`, `boost.send`, `credential.acceptCredential`, `storage.store`, …)
   by **procedure name**, because tRPC batches mutations into timing-dependent URLs that
   don't reliably match on HAR replay. Registered last, so they shadow the HAR baseline.

On replay, any backend call that is **neither recorded nor stubbed is aborted**
(`notFound: 'abort'`) — missing coverage fails loudly instead of hanging.

DIDKit signing runs locally (WASM mocked by the `mocked-test` fixture), so credentials
are really signed offline.

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

### Mutations → add a typed stub (no docker needed)

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

For a stable default across tests, capture the real response into `issuance-stubs.json`
(it's registered automatically for every mocked test).

## Files

| File                                     | Role                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `network.ts`                             | `installNetwork()` — HAR + stub composition, record/replay switch           |
| `trpc.ts`                                | `createTrpcMock` (batch-aware) + `BrainOutputs`/`CloudOutputs` type anchors |
| `issuance-stubs.json`                    | Recorded mutation responses, served by procedure name                       |
| `har/issue.har.zip`                      | Recorded boot + reads (single-file HAR)                                     |
| `../fixtures/mocked-test.ts`             | WASM mock, no docker cleanup                                                |
| `../../playwright.mock.config.ts`        | Replay config (vite, `@mocked` only)                                        |
| `../../playwright.mock-record.config.ts` | Record config (real docker)                                                 |

## Not in this tier (use the real `@e2e` spec)

Flows whose backend surface isn't recorded/stubbed — currently **link mode**
(`generateClaimLink` + signing authority) and **issue-to-a-person** (recipient search).
These live in `tests/issue-credential-page.spec.ts` as the real-backend semantic net.

> **Anti-drift:** the type anchor catches structural drift at compile time; the HAR can
> be re-recorded to catch behavioral drift; and the real `@e2e` smoke is the backstop.
> The `har/issue.har.zip` contains **test-user** auth tokens/DIDs (seed `'a'*64`), not real PII.
