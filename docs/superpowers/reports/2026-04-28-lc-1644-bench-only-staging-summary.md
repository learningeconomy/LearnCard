# LC-1644 Bench-Only Branch — Staging Baseline (Pre-Optimization)

**Branch:** `feat/lc-1644-bench-panel-only`
**Captured:** 2026-04-28
**Companion data file:** [`2026-04-28-lc-1644-bench-only-staging-runs.json`](./2026-04-28-lc-1644-bench-only-staging-runs.json)

## What this is

Baseline performance numbers from `handleSendCredentialEvent` running on staging with the bench panel + telemetry deployed but **without** the LC-1644 backend perf optimizations (Tasks 1-6). Used as the "before" half of the staging A/B comparison against `feat/lc-1644-appevent-perf` (which has the same bench panel + Tasks 1-6 applied).

17 runs (7 × 10 iter + 10 × 20 iter) = **270 measured calls**. 16 of 17 runs used `warmup=0` to capture cold-start cost; 1 run used `warmup=2` for clean warm-path-only data.

Runs 14-17 captured the redeploy transition state: runs 14-15 hit the staging brain shortly after the first redeploy attempt (POSTHOG_API_KEY secret added but not yet plumbed through deploy.yml). Run 16 was the last pre-fix run. Run 17 captures the first run after the second redeploy with the env-var workflow fix in place — and is the first run with backend bench events actually arriving in PostHog.

## Headline numbers

| Metric | Value | Range across 17 runs |
|---|---:|---|
| **Warm-steady total p50** (iter 2+) | **~570ms** | 510-630ms |
| **Cold iter 0 total (typical)** | ~1150ms | 736-1603ms |
| **Cold iter 0 extreme** | **4899ms** | run 14 (1st post-redeploy iter 0) |
| **Cold sa_http (typical)** | ~280ms | 239-390ms |
| **Cold sa_http (max observed)** | **4011ms** | run 14 iter 0 |
| **Warm sa_http p50** | ~50ms | 38-81ms |
| **Cold sa_didauthvp (max)** | **264ms** | run 17 iter 0 (extra-fresh brain) |
| **Lukewarm iter 1 frequency** | 11/17 runs (~65%) | 555-913ms when present |
| **Partial cold sub-instance** | ~1 per 20-iter run | sa_http 150-280ms |
| **Non-SA spike** | ~1 per 30 iterations | up to 1500ms above warm |
| **True mid-run Lambda recycle** | 3 in 270 iterations | sa_http 832-3346ms, 2-3 iter recovery |
| **Decoupled didauthvp stall** | ~3 in 270 iterations | warm sa_http but didauthvp 20-67ms |

## Key observations

1. **Warm-path p50 is rock-solid at ~570ms** across 13 independent runs (n=190 iterations).

2. **The April-era multi-second cold-start tail is gone.** Then, sa_http p95 was 4223ms. Now it's ~280ms even on the cold path. Staging Lambda is much warmer — likely AWS reduced cold-start cost and/or the SA endpoint receives enough background traffic to stay warm.

3. **~510ms of warm total_ms is in non-instrumented phases.** Math: 560ms total - 50ms sa_http - 1ms sa_didauthvp ≈ 510ms unaccounted. That's Neo4j reads + sendBoost + logActivity + certification — exactly what Tasks 4-6 attack.

4. **`sa_didauthvp` on cold paths is highly variable** (1, 2, 43, 76, 80, 89, 102, 217ms across runs). That's the brain-side crypto / DID-Web resolution cache initializing. Warmup absorbs it cleanly.

5. **Run 6 iter 5's 1564ms spike with warm SA call** shows that non-SA tail anomalies exist independently of Lambda cold starts. Possible causes: Neo4j slow query, brain GC pause, sendBoost cert reissue path. Worth diagnosing on the optimized branch where per-phase instrumentation will show which phase blew up.

6. **Inter-run state matters.** Run 5 (which ran shortly after a prior bench) showed iters 2-9 ~30-50ms faster than other runs. The brain-service process keeps Bolt connection pools / DID-Web caches warm via inter-run state.

7. **Mid-run Lambda recycles happen.** Run 10 iter 12 jumped to 1392ms with `sa_http=832ms` — the SA Lambda recycled mid-run, taking 2-3 iterations to fully recover. Implication: p99 in any single run can be lifted by these events even after iter 0's cold-start is past.

8. **Four distinct anomaly types** emerged from 270 iterations:
   - **Partial cold sub-instance** (~1 per 20-iter run): elevated sa_http (~180-280ms) + sa_didauthvp (~50-70ms). Lambda routing scatter to a less-warm container.
   - **Non-SA spike** (~1 per 30 iterations): elevated total_ms with warm SA call. Time is in Neo4j / sendBoost / logActivity / GC. **The optimized branch's per-phase instrumentation will diagnose which.**
   - **True mid-run Lambda recycle** (3 in 270 observed): sudden sa_http jump from ~50ms to 800ms-4000ms followed by 2-3 iter recovery. Most extreme case was run 14 iter 10 immediately post-redeploy.
   - **Decoupled didauthvp stall** (~3 in 270): warm sa_http but elevated sa_didauthvp (20-67ms). Brain-side DID-Web cache miss / jose key re-derivation. Independent of Lambda state. Not addressed by Tasks 3-6.

9. **Post-redeploy can dramatically amplify the cold-start tail.** Run 14 (first iter after first redeploy) hit 4899ms total / 4011ms sa_http — restoring the April-era multi-second tail temporarily. Subsequent runs returned to the ~1100ms typical cold pattern. **The `undici.Agent` keepAlive on the optimized branch (Task 3) should mitigate exactly this scenario.**

## What to expect on the optimized branch

| Optimization | Expected impact |
|---|---|
| **Task 4** (parallel Neo4j reads + parallel logActivity/sendBoost) | **Biggest visible win.** Should drop ~50-150ms from warm total. |
| **Task 5** (in-memory LRU cache) | **Visible on iter 2+.** Should converge lukewarm iter 1 with warm steady. |
| **Task 3** (undici keepAlive + HTTP/2) | **Smaller than April win.** SA call already fast; cold-start tail isn't visible. |
| **Task 6** (fire-and-forget notification) | **~30ms** small but predictable trim. |

**Realistic warm p50 target on optimized branch: ~350-450ms** (down from ~560ms here). That's a meaningful but less dramatic delta than April's "p95 4547→366ms" story implied. The architectural improvements still matter for resilience even if the visible perf delta is smaller.

## How to reproduce

1. Deploy `feat/lc-1644-bench-panel-only` to staging
2. Sign in to staging app, open **Admin Tools → AppEvent Perf Bench**
3. Fill in your bench listing ID, recipient profile ID, template alias
4. Set `iterations=10`, `warmup=0` for cold-start visibility (or `warmup=2` for warm-only)
5. Click **Run Bench**, copy the JSON results
6. Repeat 5-10× across different times of day to capture cold-start variance

For the post-optimization run, repeat with `feat/lc-1644-appevent-perf` deployed instead.

## Caveats

- **PostHog backend events: only run 17 has them.** Runs 1-13 ran before `POSTHOG_API_KEY` was added to GitHub. Runs 14-16 ran after the secret was added but before `deploy.yml` was updated to inject it into the Lambda env. Run 17 (post-second-redeploy with the workflow fix) is the first run with `bench.appevent.iteration` and `bench.appevent.run` events arriving in PostHog. All earlier runs are JSON-only (frontend `bench_appevent_run_triggered` did arrive throughout).
- **`perIteration` data here only includes meaningful fields** (`total_ms`, `sa_http_ms`, `sa_didauthvp_ms`). Other phase fields are 0 by design on this branch — Task 4's per-phase PerfTracker marks aren't applied to `handleSendCredentialEvent` here.

## Final state of the baseline

This is the canonical pre-optimization baseline for the LC-1644 staging A/B comparison. The optimized branch (`feat/lc-1644-appevent-perf`) will be deployed next; its bench data should be captured in a parallel `2026-04-XX-lc-1644-appevent-perf-staging-runs.json` with the same shape and run conventions as this file.

**For the post-optimization comparison, watch for these specific deltas:**

| Metric | Bench-only (this) | Optimized-branch target |
|---|---:|---|
| Warm-steady total p50 | ~570ms | **~350-450ms** (Tasks 4 + 5 attack the ~520ms unaccounted warm time) |
| Lukewarm iter 1 | 555-913ms | **converges with warm steady** (Task 5 LRU populates on iter 0) |
| Cold iter 0 typical | ~1150ms | **modest improvement** (Lambda cold-start is staging-side) |
| Cold sa_http extreme (post-redeploy) | up to 4011ms | **dramatically better** (Task 3 undici keepAlive avoids fresh TLS) |
| True mid-run Lambda recycle | 832-3346ms tail | **partially mitigated** (keepAlive keeps brain→SA connection warm even when SA recycles) |
| Per-phase visibility | only sa_http / sa_didauthvp | **full breakdown** — `parallel_reads_ms`, `owner_and_sa_reads_ms`, `sa_issue_ms`, `log_activity_and_send_boost_ms` populate |
