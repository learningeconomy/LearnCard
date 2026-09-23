# LC-2182 — Verified Connectivity & Advisory Quality: QA Handoff

**Date:** 2026-09-23 · **Branch:** `codex/lc-2182-connectivity-task-3` · **Task:** 3 of 3 (review, regressions, QA handoff)

Scope of this document: what Task 3 changed and why, every check that was actually executed (with exact results), the manual QA matrix for release validation, and honest statements about what was NOT run.

---

## 1. Task 3 review outcome

Full-diff review of `62967ba0a..b251608c5` (Tasks 1–2) against the behavioral contract found the implementation sound on the critical axes:

-   **No false offline on HTTP errors** — `probeConnectivity` classifies non-2xx / unexpected-body / invalid-URL / unsafe-origin as `inconclusive`; the monitor drops to permissive `unknown` and never sets `offline` from an application-level result.
-   **Race cancellation** — monitor generations supersede stale probe results (background-spanning, post-hint, post-stop); retry timers are cleared on every supersede path; verified-online clears all timers (no idle polling).
-   **Native remote URL** — the adapter probes `https://<tenant domain>/connectivity.txt` on native (development included), never the bundled origin; `disallowOrigins` belt-and-braces; plain HTTP restricted to loopback by the shared validator.
-   **Advisory-only quality** — `quality`/`qualityReason` are read by no gating code (onlineManager bridge reads `status` only; AuthCoordinator reads `status` only).
-   **No duplicate auth logic** — banner retry only requests a wallet upgrade on a _verified_ `online` result; BootGate always re-runs `initialize` (cached-key path preserved).
-   **Cleanup** — adapter removes only self-owned handles; late listener/snapshot resolutions after dispose are dropped; ref-counted attach survives StrictMode double-mount.
-   **Netlify** — `/connectivity.txt` ships with `no-store` + CORS `*`; the SPA `/*` rewrite does not shadow the static file (Netlify serves existing files first). Deploy-ordering caveat documented in `netlify.toml`.

### Regressions fixed in Task 3

| #   | File                                                                    | Issue                                                                                                                                                                                                                                                                   | Fix                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `apps/learn-card-app/src/components/network-listener/connectivity.ts`   | The initial `Network.getStatus()` snapshot was reported **even if a transport listener event had already arrived** while the snapshot was in flight — a stale snapshot could override a newer event, violating "no stale initial getStatus may override a newer event". | Track `receivedListenerHint`; skip the snapshot report when any hint arrived first (listener is registered before the snapshot, so such a hint is newer by definition). |
| 2   | `packages/learn-card-base/src/connectivity/connectivityMonitor.ts`      | `backoffIndex` was not reset on `start()`: a monitor restarted after backing off (stop→start) retried its first failure at 40 s instead of 5 s.                                                                                                                         | Reset `backoffIndex = 0` in `start()` — a fresh lifecycle starts a fresh retry schedule.                                                                                |
| 3   | `packages/learn-card-base/src/connectivity/connectivityMonitor.test.ts` | `timersPendingZero` helper defined after first use (lint `no-use-before-define`).                                                                                                                                                                                       | Moved helper above the describe block.                                                                                                                                  |

Each fix (#1, #2) has a regression test that was verified to **fail without the fix** (bug-injection for #2; ordering assertion for #1) and pass with it.

---

## 2. Executed checks (all actually run in this worktree)

> Invocation gotchas discovered while running these are in §5 — several "failures" observed during Task 3 were invocation artifacts, not product bugs.

| Check                                        | Command (cwd)                                                                                      | Result                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base connectivity suite                      | `bunx vitest run src/connectivity` (in `packages/learn-card-base`)                                 | **82/82 passed** (includes 2 new Task 3 regression tests)                                                                                                                                                                                                                                                           |
| App network-listener suite                   | `bunx vitest run src/components/network-listener` (in `apps/learn-card-app`)                       | **33/33 passed** (includes new stale-snapshot regression test)                                                                                                                                                                                                                                                      |
| Auth-gate + stores + connectivity (base pkg) | `bunx vitest run src/auth-coordinator src/stores src/connectivity` (in `packages/learn-card-base`) | **187/187 passed** (9 files)                                                                                                                                                                                                                                                                                        |
| Prettier (changed files)                     | `bunx prettier --check <4 changed files>`                                                          | Clean                                                                                                                                                                                                                                                                                                               |
| ESLint (changed files)                       | `bunx eslint <4 changed files>`                                                                    | **1 pre-existing baseline error remains** (`connectivityMonitor.ts:178` `no-use-before-define` on `startCycle` — present at baseline; the three cycle helpers reference each other circularly so no const-arrow ordering satisfies the rule; left untouched to avoid behavior risk in a review pass). 0 new errors. |
| Safe-area gate                               | `node scripts/check-safe-area.mjs` (repo root)                                                     | ✅ clean (64 legacy allowlist files, unchanged)                                                                                                                                                                                                                                                                     |
| i18n keys / untranslated / imports / markers | `scripts/check-i18n-{keys,untranslated,imports,markers}.mjs` (in `apps/learn-card-app`)            | ✅ all 4 green (en/es/fr/ar; `connectivity.slowUnstable` copy matches contract exactly in all locales)                                                                                                                                                                                                              |
| Typecheck                                    | `bunx tsc --noEmit -p tsconfig.json` (in `apps/learn-card-app`)                                    | **2491 errors at baseline, 2491 after** — identical sets; all pre-existing (unbuilt cross-package deps, e.g. `@learncard/types` missing dist). **0 errors in task-touched files** (`src/connectivity/`, `network-listener/`, `FullApp.tsx`, `hooks/useConnectivity`).                                               |

### Honest statements

-   **`FullApp.connectionPrompt.test.tsx` does not exist** — not at baseline, not on this branch, anywhere. The ticket-named test's concerns are covered by its de-facto equivalent: `OfflineBanner.test.tsx` (8 tests: retry funnel + double-tap guard, upgrade only on verified online, inconclusive retry does not upgrade, limited-vs-offline copy, quality warning priority, back-online toast), `OfflineBootGate.test.tsx` (3 tests: check-then-initialize order, initialize even when offline, verified-online handoff), and `connectivity.test.ts` (22 tests). A FullApp-level test was not added: FullApp mounts the entire auth/router stack and has no existing lighter test harness on this branch; the subscription logic it owns (transport-error → sample/probe) is thin glue over `isLikelyTransportError` (unit-tested with 400 lines of cases in `observeConnectionQuality.test.ts`) and the monitor API (unit-tested).
-   **Full `learn-card-base` suite not re-run end-to-end this pass** beyond the scoped suites above; Task 1's known pre-existing failure (`dateHelpers calculateAge`, unrelated) still exists at baseline.
-   Nothing was deployed, pushed, merged, or posted to Jira.

---

## 3. Manual QA matrix

Legend: ✅ covered by automated tests in this repo · 🖥️ requires desktop browser · 📱 requires real device (native build) · ⏳ **pending — not executed** (no devices/environment available in this session)

| #   | Scenario                                                                                            | Platform         | Expected behavior                                                                                                                                                                                                                                    | Status                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Chrome/Brave `navigator.onLine` falsely `false` (e.g. after sleep/wake, or DevTools override stuck) | 🖥️ Web           | App does NOT lock out: status stays `unknown`/`online`; queries run; probe verifies reachability independent of `navigator.onLine`                                                                                                                   | ⏳ pending (logic covered: onlineManager never reads `navigator.onLine`; grep confirms 0 prod usages)                                                                                   |
| 2   | DevTools → Network → Offline, then restore                                                          | 🖥️ Web           | Transport failures verify → `offline` banner with Reconnect; on restore, negative→positive hint + probe → banner clears, back-online toast ≤2.5 s, queries refetch via onlineManager bridge                                                          | ⏳ pending                                                                                                                                                                              |
| 3   | No `online` event fires on recovery (webview quirk)                                                 | 🖥️/📱            | Recovery still works: focus/visibility/manual tap triggers coalesced check; offline retry backoff (5/10/20/40/60 capped) recovers UI with no hint at all                                                                                             | ✅ monitor tests (backoff recovery with no event) · ⏳ manual confirm                                                                                                                   |
| 4   | Airplane mode ON at cold start; OFF after                                                           | 📱 Native        | Boot gate (offline) but cached-key users still initialize into local fallback; after OFF: positive hint → optimistic online → one verification → full wallet upgrade requested on verified result only                                               | ⏳ pending (banner/boot-gate unit tests pass; on-device transitions unverified)                                                                                                         |
| 5   | Wi-Fi connected without WAN / captive portal                                                        | 📱/🖥️            | Captive redirect or unreachable probe → `offline`/`unknown` per classification; captive portal redirect surfaces as transport failure (documented ambiguity) — banner shows offline, retry cadence bounded; **never** a crash or infinite spinner    | ⏳ pending — **documented ambiguity:** captive-portal redirect page cannot be distinguished from DNS failure (`redirect: 'error'` → TypeError); classified `unreachable` conservatively |
| 6   | `/connectivity.txt` missing / 404 / wrong marker (deploy-order race)                                | 🖥️               | Probe → `inconclusive` → status `unknown` (permissive), diagnostic reason retained, bounded retry; **no offline lockout**; SPA-fallback HTML body = `unexpected-body`, never offline                                                                 | ✅ probe+monitor tests (http-error & unexpected-body cases)                                                                                                                             |
| 7   | VPN false negative (OS reports disconnected, traffic actually flows)                                | 🖥️/📱            | Negative hint does NOT flip verified online → offline; probe decides; if probe succeeds user never sees a banner                                                                                                                                     | ✅ monitor test (hint vs proof) · ⏳ manual confirm                                                                                                                                     |
| 8   | Wi-Fi → cellular handoff mid-use                                                                    | 📱               | Transient negative hint → probe; brief `unknown`/`offline` window only if transport truly fails; positive hint on cell → optimistic recovery + single verification; no probe storm (repeat hints coalesced)                                          | ⏳ pending                                                                                                                                                                              |
| 9   | Background the app during in-flight probe/retry; resume                                             | 📱               | Background pauses automatic retries; stale results superseded; resume checks immediately then resumes backoff                                                                                                                                        | ✅ monitor tests (foreground/background suite) · ⏳ on-device confirm                                                                                                                   |
| 10  | Repeated slow first-party requests (>2.5 s ×3 of last 5 in 60 s)                                    | 🖥️/📱            | Amber advisory "Connection seems slow or unstable. Some actions may take longer." — `role=status`, never a modal; offline display takes precedence; 3 consecutive healthy (<1.5 s) clear it; stale evidence expires after 60 s                       | ✅ quality + observer + banner tests · ⏳ visual confirm                                                                                                                                |
| 11  | Isolated slow request (single >2.5 s response)                                                      | 🖥️               | **No warning** (≥3 slow samples of ≥3 live required); isolated slow response never resurrects expired evidence                                                                                                                                       | ✅ quality tests                                                                                                                                                                        |
| 12  | Brain service returns 500s repeatedly                                                               | 🖥️               | **No global offline**: HTTP errors are excluded from quality evidence (Resource Timing `responseStatus ≥ 400` dropped; classified errors carry `status`/`response` → not transport) and never set offline; probe target is static asset, not the API | ✅ observer + classifier tests                                                                                                                                                          |
| 13  | Probe request dedupe/cache                                                                          | 🖥️               | Every probe hits network: unique `lc=` query param + `cache: no-store` + CDN `no-store` header                                                                                                                                                       | ✅ probe tests + netlify.toml header                                                                                                                                                    |
| 14  | Unsupported Resource Timing / PerformanceObserver (old webview)                                     | 📱 (old devices) | Observer is a safe no-op (`null`); app fully functional, only advisory warning absent                                                                                                                                                                | ✅ observer test (no ctor → null) · ⏳ verify on lowest supported device                                                                                                                |
| 15  | Native WKWebView `PerformanceObserver` + Resource Timing support                                    | 📱 iOS           | **Must be manually verified** — iOS WebKit support for `responseStatus`/`deliveryType` fields is partial; observer degrades gracefully but evidence may be thinner on iOS                                                                            | ⏳ pending — explicit manual validation item                                                                                                                                            |
| 16  | Android WebView Resource Timing `responseStatus`                                                    | 📱 Android       | **Must be manually verified** on device                                                                                                                                                                                                              | ⏳ pending                                                                                                                                                                              |
| 17  | Battery/idle sanity: 10 min foreground online, no activity                                          | 🖥️/📱            | Zero probe traffic after verified online (no idle polling); no timers owned                                                                                                                                                                          | ✅ monitor test asserts 0 pending timers + no probes over 10 min virtual · ⏳ real-network confirm                                                                                      |
| 18  | Scouts app                                                                                          | —                | Out of scope this pass (ticket-optional); shared API in `learn-card-base` enables later adoption unchanged                                                                                                                                           | N/A (unchanged, by design)                                                                                                                                                              |

### Known heuristic limits (documented, by design)

-   A **slow server** looks like a slow network; copy is qualified ("seems slow or unstable").
-   A **successful probe proves static-host reachability only** — never brain-service health; a transport-error-triggered probe failing while the API is fine (e.g. DNS hijack on the static domain) would show offline conservatively until probe succeeds.
-   Cross-origin timing entries without `Timing-Allow-Origin` still expose `duration` but `responseStatus` reads `0`, so HTTP-error filtering cannot apply there — acceptable for advisory evidence; first-party origins are configured so this is rare.
-   Query-error classification is intentionally narrow; unrecognized error shapes are conservatively ignored (never treated as disconnection).

---

## 4. Remaining manual native validation (blockers for release, not for merge)

1. 📱 On-device probe transitions end-to-end (airplane mode, Wi-Fi-no-WAN, handoff) — items 4, 5, 8.
2. 📱 iOS WKWebView `PerformanceObserver` / Resource Timing support — item 15.
3. 📱 Android `responseStatus` behavior — item 16.
4. ⚠️ **Deploy `/connectivity.txt` to all tenant domains before any native build that probes ships** — until then native probes classify as `inconclusive` (permissive, no false offline, but no verified-online proof / no optimistic-recovery confirmation).

---

## 5. Environment / invocation notes for the next runner

-   **Component tests need paraglide artifacts**: `src/paraglide/messages.js` is gitignored — generate with `bunx paraglide-js compile --project ./project.inlang --outdir ./src/paraglide` (in `apps/learn-card-app`) or banner/boot-gate suites fail to resolve imports.
-   **Run package tests from the package dir** (`packages/learn-card-base`): its `vitest.config.ts` sets `globals: true`, which enables testing-library auto-cleanup. Running `AuthCoordinatorProvider.test.tsx` from the repo root bypasses it and produces a spurious "Found multiple elements by data-testid=status" failure (observed and diagnosed in Task 3 — **not** a product bug).
-   **App-side `.tsx` tests must run from `apps/learn-card-app`** (its `vitest.config.ts` sets `environment: jsdom`); from the repo root they fail with `document is not defined`.
-   **Stale nested worktrees**: this worktree contained leftover `.claude/worktrees/*` snapshots from other dispatcher runs; repo-root vitest runs sweep them up as broken suites (13 "failed files" that are not part of this repo's source). Ignore or prune; do not commit them (they are gitignored).
-   App typecheck requires built cross-package dists (`@learncard/types`, `@learncard/core`, …); the 2491 baseline errors are missing-dist artifacts, identical before and after this task.

---

## 6. File inventory (this branch, connectivity feature)

```
packages/learn-card-base/src/connectivity/
├── connectionQuality.ts          — advisory slow/unstable policy (named thresholds, pure)
├── connectionQuality.test.ts
├── connectivityMonitor.ts        — single owner of verified reachability (generations, backoff, hints)
├── connectivityMonitor.test.ts
├── observeConnectionQuality.ts   — Resource Timing observer + narrow transport-error classifier
├── observeConnectionQuality.test.ts
├── probeConnectivity.ts          — bounded /connectivity.txt probe (injectable fetch/clock)
└── probeConnectivity.test.ts
packages/learn-card-base/src/hooks/useConnectivity.ts — reactive hooks (status/quality/reconnect)
packages/learn-card-base/src/stores/connectivityStore.ts — extended with quality + diagnostics fields
apps/learn-card-app/src/components/network-listener/
├── connectivity.ts               — app adapter: probe target, Capacitor wiring, ref-counted lifecycle
├── connectivity.test.ts
├── NetworkListener.tsx           — mounts adapter + banners
├── OfflineBanner.tsx             — offline/limited/back-online/advisory states
├── OfflineBanner.test.tsx
├── OfflineBootGate.tsx           — Try Again → coalesced check → initialize
├── OfflineBootGate.test.tsx
└── useNetworkStatus.ts
apps/learn-card-app/src/FullApp.tsx — onlineManager bridge (pre-existing), query-cache transport evidence, first-party observer
apps/learn-card-app/public/connectivity.txt + netlify.toml + locales/{en,es,fr,ar}
```
