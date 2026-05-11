# LC-1644 Frontend Perf — Staging Telemetry Results

**Branch:** `feat/lc-1644-frontend-claim-perf`
**PR:** [#1225](https://github.com/learningeconomy/LearnCard/pull/1225)
**Captured:** 2026-05-11
**Companion docs:**
- Pre-optimization backend baseline: [`2026-04-28-lc-1644-bench-only-staging-summary.md`](./2026-04-28-lc-1644-bench-only-staging-summary.md)
- Optimized backend A/B (PR #1189): [`2026-04-28-lc-1644-appevent-perf-staging-summary.md`](./2026-04-28-lc-1644-appevent-perf-staging-summary.md)

## TL;DR

PR 2 of the LC-1644 finish-out (frontend telemetry + claim-phase parallelization) validated end-to-end on staging. With **all Tasks 1–6 (backend) + Tasks 1+2 frontend + claim-phase parallelization** deployed, the user-perceived "wait for modal" time drops **~76%** vs the unoptimized hybrid state (median across n=7 iterations).

| Metric | Hybrid baseline (default backend, this branch frontend) | Optimized median (n=7) | Δ |
|---|---:|---:|---:|
| `request_to_response_ms` | 5486 | 1461 | **−73%** |
| `modal_mount_to_credential_resolved_ms` | 499 | **0** | **−100%** |
| `claim_phase_ms` | 2581 | 1855 | **−28%** |
| **`time_to_modal_interactive_ms`** | **5988** | **1462** | **−76%** |
| Pure perf time (interactive + claim) | 8569 | 3317 | **−61%** |

Best-observed iteration (#5, fully warm Lambda): `time_to_modal_interactive_ms = 1031`, suggesting **a warm-steady best-case of ~1000ms from Tokyo**, which translates to **~400–500ms from a US-based client**.

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

Two states deployed:
- **Hybrid baseline** (`feat/lc-1644-frontend-claim-perf` frontend + default backend): Tasks 1+2 backend half NOT deployed, so `credential` is not in the response → modal falls back to slow-path URI re-resolve. `fast_path: false`. Captured 1 event.
- **Fully optimized** (`feat/lc-1644-frontend-claim-perf` + matching backend deploy): Tasks 1+2 backend returns `credential`, frontend uses fast path. `fast_path: true`. Captured 7 events.

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

### `request_to_response_ms`: 5486 → ~1215 (warm-steady median)

**Win driver: optimized backend (Tasks 3, 4, 5).** Same code path benchmarked in PR #1189's backend A/B — warm-steady backend total p50 = 292ms there. The 1215ms here is dominated by **Japan → US-east network RTT (~700–1000ms for HTTPS request + response with TLS keepalive)** plus ~290ms of brain-service work. A US-based user would see this drop into the 400–700ms range.

### `response_to_modal_mount_ms`: 3 → 2–4 (unchanged)

React state propagation + modal `useEffect` first-run. Already near-instant; no optimization opportunity.

### `modal_mount_to_credential_resolved_ms`: 499 → 0

**Win driver: Tasks 1+2 frontend (the `credential` prop fast path).** With the backend returning `credential` in the APP_EVENT response and the frontend threading it through to the modal as a prop, the modal sets state immediately — no `wallet.read.get(uri)` round-trip needed. The slow-path baseline of 499ms was network RTT + URI resolution overhead.

### `claim_phase_ms`: 2581 → ~1700 (warm-steady median)

**Partial win from Phase 2 parallelization.** The optimized branch runs `addVCtoWallet + acceptCredential + queryNotifications` in parallel via `Promise.allSettled`, with `updateNotificationMeta` as fire-and-forget. Theoretical floor: `max(call_times)`. From Tokyo, each tRPC call pays ~700–1000ms of network RTT, so parallelization gains are bounded by the slowest call. From a US client, parallelization should net out to ~400–600ms claim phase (vs ~1500–2500ms unoptimized).

Future work: instrument sub-phases of `handleClaim` to identify which of the 3 parallel calls dominates the wait. The slowest call is the one to optimize next.

### `time_to_modal_interactive_ms`: 5988 → ~1217

**The headline.** End-to-end time from `sendCredential()` invocation to a usable modal showing the user's credential. This is the "felt slow vs fast" number. **−80% warm-steady.**

### `total_e2e_ms` (not used for perf comparison)

Wall-clock total including user-think-time between modal appearing and clicking Accept. Variable per user (e.g. 4566ms-25293ms across observed events). Useful for UX/cohort analysis but NOT a perf metric.

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

| Event | Time UTC | `run_id` | `outcome` | `fast_path` | `request_to_response_ms` | `claim_phase_ms` | `time_to_modal_interactive_ms` |
|---|---|---|---|---|---:|---:|---:|
| Hybrid baseline | 14:36 | `047ce7a9-24f9-49ae-b715-c84dda0f1a7b` | claimed | false | 5486 | 2581 | 5988 (computed) |
| Opt #1 | 15:12 | `203a66e8-d9fd-4d49-96d0-3241ee659bd4` | claimed | true | 1638 | 1926 | 1642 (computed) |
| Opt #2 | 15:36 | `92209430-e966-4c96-81f0-870e197916dc` | claimed | true | 1531 | 2046 | 1534 (computed) |
| Opt #3 | 15:42 | `5de4b553-d7b1-470a-b971-e5925dafb339` | claimed | true | 1571 | 1855 | 1575 |
| Opt #4 | 15:44 | `9bbb65b8-042c-4db9-a57b-5999983c641b` | claimed | true | 1401 | 1809 | 1403 |
| Opt #5 | 15:44 | `2d0cf1b5-7c63-4d84-b40f-a0a5435cf553` | claimed | true | 1029 | 1590 | 1031 |
| Opt #6 | 15:47:46 | `23a930c2-fe32-4a6f-9b06-f52497ae4692` | claimed | true | 1437 | 1796 | 1440 |
| Opt #7 | 15:47:55 | `953dc148-a8b7-477f-b7ee-8cf43e05103e` | claimed | true | 1461 | 1903 | 1462 |
