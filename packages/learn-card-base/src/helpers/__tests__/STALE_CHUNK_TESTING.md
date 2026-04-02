# Testing Stale Chunk Recovery

The app uses `lazyWithRetry` for all code-split pages. When a deployment (or Capgo OTA update) replaces JS chunk files, users with stale HTML may try to load chunks that no longer exist. The recovery system handles this automatically.

## How it works

```
Dynamic import fails ("Importing a module script failed")
  → lazyWithRetry: retry the import once
    → Still fails: reload page (up to 2× in 30 seconds), show loading screen
      → Reloads exhausted: ChunkBoundary catches error, tries one more reload
        → GenericErrorBoundary: final safety net reload
          → All exhausted: "Something went wrong" error UI
```

## Unit tests

```bash
# Run just the lazyWithRetry tests
pnpm --filter learn-card-base test -- --run src/helpers/__tests__/lazyWithRetry.test.ts

# Run all learn-card-base tests
pnpm --filter learn-card-base test
```

The unit tests cover: first-try success, non-chunk error passthrough, retry success, reload on double failure, sessionStorage reload guard, TTL expiry reset, and mixed error types.

## Manual smoke test (dev server)

### 1. Simulate a permanent stale chunk

In `apps/learn-card-app/src/Routes.tsx`, temporarily change one lazy import:

```ts
// Replace this:
const SkillsPage = lazyWithRetry(() => import('./pages/skills/SkillsPage'));

// With this:
const SkillsPage = lazyWithRetry(
    () => Promise.reject(new TypeError('Importing a module script failed.'))
);
```

Start the dev server (`pnpm nx run learn-card-app:serve`), log in, and navigate to `/skills`.

**Expected behavior:**
1. Page reloads automatically (up to 2 times within 30 seconds)
2. After reloads are exhausted, shows the "Something went wrong" error UI
3. `sessionStorage.__chunk_reload__` contains `{"count":2,"ts":...}`

### 2. Simulate a transient stale chunk (retry succeeds)

```ts
let callCount = 0;
const SkillsPage = lazyWithRetry(() => {
    callCount++;
    if (callCount === 1) {
        return Promise.reject(new TypeError('Importing a module script failed.'));
    }
    return import('./pages/skills/SkillsPage');
});
```

Navigate to `/skills`.

**Expected behavior:** The page loads normally on the retry — no reload, no error UI.

### 3. Verify the reload guard resets

1. Run test #1 (the page will reload twice, then show the error)
2. Wait 30 seconds
3. Navigate to `/skills` again
4. The page should reload again (guard has reset because TTL expired)

### 4. Check sessionStorage

Open the browser console and inspect the reload counter:

```js
JSON.parse(sessionStorage.getItem('__chunk_reload__'));
// → { count: <number>, ts: <timestamp> }

// Clear it to reset the guard:
sessionStorage.removeItem('__chunk_reload__');
```

## Capacitor / iOS testing

1. Build: `pnpm nx run learn-card-app:build`
2. Sync: `npx cap sync ios`
3. Open in Xcode: `npx cap open ios`
4. In the built `build/assets/` folder, rename or delete one chunk file (e.g., `SkillsPage-xxxxx.js`)
5. Run in the simulator
6. Navigate to the page whose chunk you deleted
7. The app should reload and recover (since the build dir still has the correct `index.html` pointing to valid chunks after reload)

## Key files

| File | Role |
|------|------|
| `packages/learn-card-base/src/helpers/lazyWithRetry.ts` | Retry + reload + sessionStorage guard |
| `packages/learn-card-base/src/components/ErrorBoundary/index.tsx` | `ChunkBoundary` — second line of defense |
| `apps/learn-card-app/src/components/generic/GenericErrorBoundary.tsx` | Final safety net — auto-reloads on stale chunk |
| `apps/learn-card-app/src/Routes.tsx` | Where `lazyWithRetry` and `ChunkBoundary` are used |

## Sentry issue

This fix addresses [LEARN-CARD-APP-26](https://welibrary-llc.sentry.io/issues/LEARN-CARD-APP-26) — `TypeError: Importing a module script failed.`
