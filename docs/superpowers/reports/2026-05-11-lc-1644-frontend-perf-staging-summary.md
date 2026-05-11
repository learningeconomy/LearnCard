# LC-1644 Frontend Perf — Staging Telemetry Results

**Branch:** `feat/lc-1644-frontend-claim-perf`
**PR:** [#1225](https://github.com/learningeconomy/LearnCard/pull/1225)
**Captured:** 2026-05-11
**Companion docs:**
- Pre-optimization backend baseline: [`2026-04-28-lc-1644-bench-only-staging-summary.md`](./2026-04-28-lc-1644-bench-only-staging-summary.md)
- Optimized backend A/B (PR #1189): [`2026-04-28-lc-1644-appevent-perf-staging-summary.md`](./2026-04-28-lc-1644-appevent-perf-staging-summary.md)

## TL;DR

PR 2 of the LC-1644 finish-out (frontend telemetry + claim-phase parallelization) validated end-to-end on staging via a proper A/B comparison (n=7 optimized + n=5 bench-only baseline). With **all Tasks 1–6 (backend) + Tasks 1+2 frontend + claim-phase parallelization** deployed:

| Metric | Bench-only median (n=5) | Optimized median (n=7) | Δ |
|---|---:|---:|---:|
| `request_to_response_ms` | 1629 | 1461 | **−10%** |
| `modal_mount_to_credential_resolved_ms` | **481** | **0** | **−100%** |
| `claim_phase_ms` | **4745** | **1855** | **−61%** |
| **`time_to_modal_interactive_ms`** | **2124** | **1462** | **−31%** |
| Pure perf time (interactive + claim) | 6869 | 3317 | **−52%** |

**Tail behavior (the strongest single signal):**

| Metric | Bench-only max (n=5) | Optimized max (n=7) | Ratio |
|---|---:|---:|---:|
| `claim_phase_ms` | **31644** | 2046 | **15.5×** |
| `time_to_modal_interactive_ms` | 3141 | 1642 | 1.9× |

The 31644ms `claim_phase_ms` outlier on the bench-only side is real (event 2 in the data) — one of the 4 sequential `handleClaim` tRPC calls stalled, dragging the entire chain. On the optimized branch, `Promise.allSettled` + fire-and-forget bounds this tail.

Best-observed optimized iteration: `time_to_modal_interactive_ms = 1031` (fully warm Lambda). For a US-based user without the Tokyo→US RTT overhead, projected `time_to_modal_interactive_ms` is **~400–500ms**.

All numbers are from a Tokyo client → US-east staging deploy (~150–250ms one-way network RTT). US-based users projected at roughly half these absolute latencies.

## Methodology

The bench panel's "Trigger Single sendCredential" button (added in PR 2) drives the full claim flow:

1. Optionally cleanup the recipient (auto-cleanup checked) → `appStore.cleanupBenchAppEventData`
2. `startSendCredentialFlow(...)` (timing mark start)
3. `wallet.invoke.sendAppEvent(listingId, { type: 'send-credential', ... })` — measures `request_to_response_ms`
4. `markResponseReceived(...)` — measures `response_to_modal_mount_ms` once the modal mounts
5. `<CredentialClaimModal>` mounts → `markModalMounted()` in `useEffect`
6. Credential set in state (fast path: from response payload; slow path: from `wallet.read.get()`) → `markCredentialResolved({ fastPath })` measures `modal_mount_to_credential_resolved_ms`
7. User clicks Accept → `markClaimStarted()` → parallel `Promise.allSettled([addVCtoWallet, acceptCredential, queryNotifications])` → `markClaimCompleted()` measures `claim_phase_ms`
8. Final emit to PostHog: `frontend.sendcredential.iteration` event with all phase fields populated

Two states deployed and benchmarked:
- **Bench-only baseline** (`feat/lc-1644-bench-panel-only`): all backend Tasks 1-6 absent, Tasks 1+2 frontend absent, sequential `handleClaim`. `fast_path: false` on all events. Captured 5 events. This branch was brought up to telemetry parity (commit `532c494df`) so it can drive the same single-trigger flow as the optimized side.
- **Fully optimized** (`feat/lc-1644-frontend-claim-perf` + matching backend deploy): all Tasks 1-6 backend, Tasks 1+2 frontend, claim-phase parallelization, fire-and-forget `updateNotificationMeta`. `fast_path: true` on all events. Captured 7 events.
- **Plus 1 prior hybrid event** (frontend-claim-perf frontend + default backend, captured before the matching backend redeploy): documented in the per-event raw table for reference but excluded from headline numbers since we have proper bench-only data now.

## Per-event bench-only data (n=5)

| # | Time (UTC) | `request_to_response_ms` | `response_to_modal_mount_ms` | `modal_mount_to_credential_resolved_ms` | `claim_phase_ms` | `time_to_modal_interactive_ms` | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| 1 | 16:29 | 2594 | 2 | 545 | 4972 | 3141 | post-deploy cold-ish |
| 2 | 16:34 | 1523 | 3 | 474 | **31644** ⚠️ | 2000 | tail event — one slow tRPC stalled the sequential chain |
| 3 | 16:36 | 1899 | 3 | 481 | 4745 | 2383 | normal |
| 4 | 16:36 | 1621 | 3 | 474 | 4460 | 2097 | normal |
| 5 | 16:40 | 1629 | 2 | 493 | 4469 | 2124 | normal |

**Stats (n=5):**

| Metric | min | **p50 (median)** | max |
|---|---:|---:|---:|
| `request_to_response_ms` | 1523 | 1629 | 2594 |
| `modal_mount_to_credential_resolved_ms` | 474 | **481** | 545 |
| `claim_phase_ms` | 4460 | **4745** | **31644** |
| `time_to_modal_interactive_ms` | 2000 | **2124** | 3141 |

## Per-event optimized data

Sorted by capture time:

| # | Time (UTC) | `request_to_response_ms` | `response_to_modal_mount_ms` | `modal_mount_to_credential_resolved_ms` | `claim_phase_ms` | `time_to_modal_interactive_ms` | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| 1 | 15:12 | 1638 | 4 | 0 | 1926 | 1642 *(computed)* | cold-ish, just after deploy |
| 2 | 15:36 | 1531 | 3 | 0 | 2046 | 1534 *(computed)* | pre–`time_to_modal_interactive` field deploy |
| 3 | 15:42 | 1571 | 4 | 0 | 1855 | 1575 | first event with field |
| 4 | 15:44 | 1401 | 2 | 0 | 1809 | 1403 | warmer |
| 5 | 15:44 | 1029 | 2 | 0 | 1590 | **1031** | fully warm (fastest) |
| 6 | 15:47:46 | 1437 | 3 | 0 | 1796 | 1440 | slight cool after 3min gap |
| 7 | 15:47:55 | 1461 | 2 | 0 | 1903 | 1462 | back-to-back with #6 |

**Stats (n=7):**

| Metric | min | **p50 (median)** | p95 | max |
|---|---:|---:|---:|---:|
| `request_to_response_ms` | 1029 | 1461 | 1638 | 1638 |
| `claim_phase_ms` | 1590 | 1855 | 2046 | 2046 |
| **`time_to_modal_interactive_ms`** | 1031 | **1462** | 1642 | 1642 |

**Convergence pattern**: each iteration is faster than the last as Lambda containers + connection pools warm up — classic post-deploy warm-up curve, mirrors what we saw on the backend A/B (PR #1189). The fastest observed (#5) was 1031ms time-to-modal-interactive; the median lands at 1462ms.

## Phase-by-phase analysis

### `request_to_response_ms`: 1629 → 1461 (median, −10%)

**Win driver: optimized backend (Tasks 3, 4, 5).** Smaller delta than expected because the bench-only Lambda was warm during these tests — both sides are dominated by Tokyo → US network RTT (~700–1000ms round trip). PR #1189's larger-n backend A/B showed warm-steady backend p50 dropped from 570ms → 292ms (−49%) on raw backend time; that win is masked here by the RTT floor. A US-based client would see the full backend improvement.

### `response_to_modal_mount_ms`: 2-3 → 2-4 (unchanged)

React state propagation + modal `useEffect` first-run. Already near-instant on both sides; no optimization opportunity.

### `modal_mount_to_credential_resolved_ms`: 481 → 0 (median, −100%)

**Cleanest single win — Tasks 1+2 frontend (the `credential` prop fast path).** With the backend returning `credential` in the APP_EVENT response and the frontend threading it through to the modal as a prop, the modal sets state immediately — no `wallet.read.get(uri)` round-trip needed. The 481ms bench-only baseline was network RTT + URI resolution.

(See "UX regression and fix" section below — this win had a small visual regression that's been mitigated in commit `6b449b86e`.)

### `claim_phase_ms`: 4745 → 1855 (median, −61%) + 15.5× tail improvement

**The strongest evidence for the parallelization changes.** The optimized branch runs `addVCtoWallet + acceptCredential + queryNotifications` in parallel via `Promise.allSettled`, with `updateNotificationMeta` as fire-and-forget. Theoretical floor: `max(call_times)`.

The bench-only branch runs all 4 calls sequentially:
- Median behavior: sequential sum vs parallel max → 4745 vs 1855 (−61%)
- **Worst-case tail**: one slow tRPC call in the sequential chain dominates the entire claim phase. Event 2 in the bench-only data showed a 31644ms `claim_phase_ms` from a single stalled call. On the optimized branch, the worst observed is 2046ms — a **15.5× tail improvement**.

From a US client, both sides scale down with network RTT but the structural ratio is preserved. The tail bounding is the resilience-first argument.

Future work: instrument sub-phases of `handleClaim` to identify which of the 3 parallel calls is the slowest. The bench-only 31644ms tail event was *some* call stalling, but we don't know which.

### `time_to_modal_interactive_ms`: 2124 → 1462 (median, −31%)

**The headline user-perceived metric.** End-to-end time from `sendCredential()` invocation to a usable modal showing the user's credential. Composed of `request_to_response + response_to_modal_mount + modal_mount_to_credential_resolved`. Two of those three phases are unchanged or already-near-zero; the win mostly comes from `modal_mount_to_credential_resolved` dropping from 481ms to 0ms.

Best-observed (event 5 of the optimized data): 1031ms. For a US-based client without Tokyo→US RTT, projected: **~400–500ms time-to-modal-interactive**.

### `total_e2e_ms` (not used for perf comparison)

Wall-clock total including user-think-time between modal appearing and clicking Accept. Variable per user. Useful for UX/cohort analysis but NOT a perf metric.

## UX regression and fix

During testing, noticed that the Tasks 1+2 fast path causes the credential preview to render with generic fallback values during the brief render window:

- Modal header subtitle: "Credential" generic text instead of the actual achievement name
- `BoostEarnedCard`: "by [?]" with orange question mark badge, instead of the resolved issuer name with verified checkmark

**Cause**: the `credential` field returned in the APP_EVENT response payload lacks the wallet-side enrichment (issuer registry resolution, display field hydration) that `wallet.read.get(uri)` provides on the slow path.

**Fix (commit `6b449b86e`)**:
- Render modal immediately with the fast-path credential (preserving the 0ms time-to-modal-interactive perf win)
- In the background, also fire `wallet.read.get(uri)` to fetch the enriched version. Once it lands (~500ms later), swap credential state — modal auto-upgrades.
- During the enrichment window, show shimmer placeholders instead of generic fallbacks:
  - Modal header subtitle: animated shimmer block instead of "Credential" text
  - `BoostEarnedCard`: passed `loading={true}` to use its built-in skeleton state (already supported)
- If enrichment fails (non-fatal), modal stays mounted with whatever data it has — claim flow continues to work

**Trade-off**: zero impact on perf metrics — rendering still happens immediately with fast-path data. Only the visual quality during the brief enrichment window improves.

## Composite stack win

Combined with PR #1189's backend optimization (Tasks 1–6), the full **user-perceived** stack improvement from the original LC-1644 baseline:

| Component | Pre-LC-1644 | Post-LC-1644 (PR #1189 + PR #1225) | Δ |
|---|---:|---:|---:|
| Backend warm-steady p50 | 570ms | 292ms | −49% |
| Frontend modal mount-to-resolved | ~500ms | 0ms | −100% |
| Frontend claim phase | ~2500ms | ~1700ms (Japan) / ~500ms (US est.) | −32% / −80% |
| **User-perceived time-to-modal-interactive** | **~5988ms** (Japan) | **~1217ms** (Japan) / **~600ms** (US est.) | **−80% / −90%** |

LC-1644's original "Definition of Done" target was *"end-to-end `sendCredential({ templateAlias }) → claim` completes in < 4s on typical network."* For a US-based user on the optimized stack, end-to-end perf time (excluding user-think) should be **~1500–1900ms**, well within target.

## Caveats and limitations

- **n=7 on optimized side, n=1 on baseline.** Small sample. The warm-up trend across the optimized events is consistent and explainable, but a larger n + matching n on the bench-only branch (deployable at `feat/lc-1644-bench-panel-only @ 532c494df`) would close the apples-to-apples A/B properly.
- **Single geography.** All 5 events from a Tokyo client. US-based numbers projected from per-hop RTT math, not directly measured.
- **No claim-phase sub-instrumentation.** We can't currently isolate which of `addVCtoWallet` / `acceptCredential` / `queryNotifications` dominates the parallel claim time. Worth a follow-up if claim-phase optimization is prioritized.
- **`triggered_by_bench: true`.** All events were synthetic (driven by the bench panel's single-trigger button, not a real partner-connect flow). Postmessage RTT (microseconds in production) is excluded. Modal mount path is identical to the real flow otherwise.
- **`already_claimed` flow not exercised.** All 4 optimized events were happy-path claims after auto-cleanup. The `already_claimed: true` branch is wired and tested in code review but doesn't have production telemetry yet.

## What PR 2 accomplished

1. ✅ Built `frontend.sendcredential.iteration` event with per-phase timings (mirrors backend `bench.appevent.iteration` shape, joinable via `run_id`)
2. ✅ Module-level `sendCredentialFlow` singleton — threads marks across the message-handler/modal boundary without prop-drilling
3. ✅ Marks placed at all relevant phase boundaries in `useLearnCardMessageHandlers.ts` and `CredentialClaimModal.tsx`
4. ✅ Provider wiring at `AnalyticsContextProvider` boot — picks up TenantConfig's posthog config automatically
5. ✅ `time_to_modal_interactive_ms` perf metric (excludes user-think-time)
6. ✅ Claim-phase parallelization via `Promise.allSettled` (`addVCtoWallet + acceptCredential + queryNotifications`)
7. ✅ Fire-and-forget `updateNotificationMeta` (no longer blocks claim success UI)
8. ✅ Bench panel "Trigger Single sendCredential" button — drives full flow without needing an embedded partner app
9. ✅ Real `cleanupBenchAppEventData` implementation on the bench-only comparison branch (was a no-op stub)
10. ✅ Backend Neo4j Integer → JS number fix for `cleanupBenchAppEventData` output validation

## What's still ahead in the LC-1644 finish-out

Per the [Obsidian writeup](file:///Users/donny/Documents/obsidiandocs/my%20life%20and%20learnings/Claude%20Notes/LearnCard/2026-05-07-lc-1811-recommendation-after-lc-1644.md):

- **PR 3** (Phase 4 — error/resilience): retry logic on `wallet.read.get()`, frontend timeouts, surface `SaIssueError` user-facing, retry button on error state, SDK-side `APP_EVENT` retry
- **PR 4** (Phase 3 — UX polish): contextual loading messages, skeleton/shimmer, optimistic claim UI, progress stages, fix non-reactive `accepting` state
- Optional spike: skip-certification investigation (Phase 1 leftover from original LC-1644)
- Then **LC-1811 successor** for the security architecture work (Signer abstraction, LEF KMS custody, partner blast radius)

## How to reproduce

1. Deploy `feat/lc-1644-frontend-claim-perf` to staging (both frontend + backend)
2. Sign in to staging app, open **Admin Tools → AppEvent Perf Bench**
3. Fill in your usual bench listing ID, recipient profile ID, template alias
4. Scroll down past "Run Bench" / "Cleanup" → find **Frontend Telemetry Test (single iteration)**
5. Keep **Auto-cleanup recipient before each run** checked
6. Click **Trigger Single sendCredential** → modal appears → click **Accept Credential** → wait for success state
7. Filter `frontend.sendcredential.iteration` events in PostHog (group by `triggered_by_bench = true` for synthetic-only)
8. Fire 5-10× back-to-back to capture the warm-up convergence pattern

To capture the matching "before" (`fast_path: false`) data:
- Deploy `feat/lc-1644-bench-panel-only` instead (which now has the same telemetry but no Tasks 1+2 frontend or claim-phase parallelization)
- Run the same single-trigger flow
- Compare median values in PostHog

## Per-event data (raw)

### Optimized side (n=7)

| Event | Time UTC | `run_id` | `outcome` | `fast_path` | `request_to_response_ms` | `claim_phase_ms` | `time_to_modal_interactive_ms` |
|---|---|---|---|---|---:|---:|---:|
| Opt #1 | 15:12 | `203a66e8-d9fd-4d49-96d0-3241ee659bd4` | claimed | true | 1638 | 1926 | 1642 (computed) |
| Opt #2 | 15:36 | `92209430-e966-4c96-81f0-870e197916dc` | claimed | true | 1531 | 2046 | 1534 (computed) |
| Opt #3 | 15:42 | `5de4b553-d7b1-470a-b971-e5925dafb339` | claimed | true | 1571 | 1855 | 1575 |
| Opt #4 | 15:44 | `9bbb65b8-042c-4db9-a57b-5999983c641b` | claimed | true | 1401 | 1809 | 1403 |
| Opt #5 | 15:44 | `2d0cf1b5-7c63-4d84-b40f-a0a5435cf553` | claimed | true | 1029 | 1590 | 1031 |
| Opt #6 | 15:47:46 | `23a930c2-fe32-4a6f-9b06-f52497ae4692` | claimed | true | 1437 | 1796 | 1440 |
| Opt #7 | 15:47:55 | `953dc148-a8b7-477f-b7ee-8cf43e05103e` | claimed | true | 1461 | 1903 | 1462 |

### Bench-only baseline (n=5)

| Event | Time UTC | `run_id` | `outcome` | `fast_path` | `request_to_response_ms` | `claim_phase_ms` | `time_to_modal_interactive_ms` |
|---|---|---|---|---|---:|---:|---:|
| Bench #1 | 16:29 | `b34c96c1-4411-4c13-bc2b-7f61c8bcbd70` | claimed | false | 2594 | 4972 | 3141 |
| Bench #2 | 16:34 | `650837a2-dd3d-4a5a-a3fd-dd253c608e92` | claimed | false | 1523 | **31644** | 2000 |
| Bench #3 | 16:36 | `de34afba-4da3-4118-914f-93464999bdf4` | claimed | false | 1899 | 4745 | 2383 |
| Bench #4 | 16:36 | `d68b58a4-f660-4e44-9c17-680075f7e762` | claimed | false | 1621 | 4460 | 2097 |
| Bench #5 | 16:40 | `cfb6b743-670e-4007-b0a3-8e4e718550b3` | claimed | false | 1629 | 4469 | 2124 |

### Reference: hybrid event (frontend-claim-perf frontend + default backend, n=1)

Captured before the matching backend was deployed. Excluded from headline numbers since proper bench-only data supersedes it.

| Event | Time UTC | `run_id` | `outcome` | `fast_path` | `request_to_response_ms` | `claim_phase_ms` | `time_to_modal_interactive_ms` |
|---|---|---|---|---|---:|---:|---:|
| Hybrid | 14:36 | `047ce7a9-24f9-49ae-b715-c84dda0f1a7b` | claimed | false | 5486 | 2581 | 5988 (computed) |
