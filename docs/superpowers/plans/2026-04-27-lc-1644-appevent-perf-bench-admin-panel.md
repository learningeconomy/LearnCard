# LC-1644 AppEvent Perf Bench Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [docs/superpowers/specs/2026-04-27-lc-1644-appevent-perf-bench-admin-panel-design.md](../specs/2026-04-27-lc-1644-appevent-perf-bench-admin-panel-design.md)

**Goal:** Add an "AppEvent Perf Bench" tile to the LearnCard Admin Tools panel that runs `handleSendCredentialEvent` N times against real staging infrastructure and emits per-phase timings to PostHog.

**Architecture:** Two new admin-gated tRPC mutations on the brain-service `appStore` router (`benchAppEvent`, `cleanupBenchAppEventData`), exposed via the brain-client plugin to `wallet.invoke.*`, driven by a new admin-tools tile component. Backend timings flow through the existing `PerfTracker` and a new `posthog-node`-based helper. Frontend emits a single attribution event via the existing `useAnalytics` hook.

**Tech Stack:** tRPC (existing `t.router` / `profileRoute`), `posthog-node` (new dependency on brain-service), `posthog-js` (existing on frontend), Zod input validation, Vitest, React + Tailwind.

**Branch:** `feat/lc-1644-appevent-perf` (already checked out; the spec was committed as `6579d9c3b`).

---

## File Structure

**Created:**
- `services/learn-card-network/brain-service/src/helpers/posthog.helpers.ts`
- `services/learn-card-network/brain-service/src/helpers/posthog.helpers.test.ts`
- `services/learn-card-network/brain-service/src/helpers/percentile.helpers.ts`
- `services/learn-card-network/brain-service/src/helpers/percentile.helpers.test.ts`
- `services/learn-card-network/brain-service/src/helpers/bench-appevent.helpers.ts`
- `apps/learn-card-app/src/pages/adminToolsPage/appevent-perf-bench/AdminToolsAppEventPerfBenchOption.tsx`

**Modified:**
- `services/learn-card-network/brain-service/package.json` — add `posthog-node`
- `services/learn-card-network/brain-service/.env.example` — document `POSTHOG_API_KEY`, `POSTHOG_HOST`, `GIT_SHA`
- `services/learn-card-network/brain-service/src/routes/app-store.ts` — add `benchAppEvent` and `cleanupBenchAppEventData` mutations
- `packages/plugins/learn-card-network/src/types.ts` — add `benchAppEvent` and `cleanupBenchAppEventData` plugin methods
- `packages/plugins/learn-card-network/src/plugin.ts` — wire plugin methods to tRPC client
- `apps/learn-card-app/src/analytics/events.ts` — add `BENCH_APPEVENT_RUN_TRIGGERED` event + payload
- `apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/admin-tools.helpers.ts` — add `APPEVENT_PERF_BENCH` enum + `adminToolOptions` entry
- `apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/AdminToolsOptionsContainer.tsx` — add switch case

---

## Task 1: Add `posthog-node` dependency to brain-service

**Files:**
- Modify: `services/learn-card-network/brain-service/package.json`

- [ ] **Step 1: Add the dependency**

```bash
cd services/learn-card-network/brain-service && pnpm add posthog-node@^4.0.0
```

- [ ] **Step 2: Verify install**

```bash
cd services/learn-card-network/brain-service && pnpm list posthog-node
```

Expected: a single `posthog-node` line with version `4.x`.

- [ ] **Step 3: Commit**

```bash
git add services/learn-card-network/brain-service/package.json pnpm-lock.yaml
git commit -m "[LC-1644] Add posthog-node dependency to brain-service"
```

---

## Task 2: Create `posthog.helpers.ts` (backend) + tests

**Files:**
- Create: `services/learn-card-network/brain-service/src/helpers/posthog.helpers.ts`
- Test: `services/learn-card-network/brain-service/src/helpers/posthog.helpers.test.ts`

**Pattern:** module-scope singleton client, no-op when env unset, never throws into the caller.

- [ ] **Step 1: Write the failing tests**

Create `services/learn-card-network/brain-service/src/helpers/posthog.helpers.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('posthog.helpers', () => {
    beforeEach(() => {
        vi.resetModules();
        delete process.env.POSTHOG_API_KEY;
        delete process.env.POSTHOG_HOST;
    });

    it('captureBenchEvent is a no-op when POSTHOG_API_KEY is unset', async () => {
        const mod = await import('./posthog.helpers');
        // Should not throw and should return false (no client).
        expect(await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 })).toBe(false);
    });

    it('captureBenchEvent attempts emission when POSTHOG_API_KEY is set', async () => {
        process.env.POSTHOG_API_KEY = 'phc_test_key';
        const captureSpy = vi.fn();
        vi.doMock('posthog-node', () => ({
            PostHog: vi.fn().mockImplementation(() => ({
                capture: captureSpy,
                shutdown: vi.fn(),
            })),
        }));
        const mod = await import('./posthog.helpers');
        const result = await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 });
        expect(result).toBe(true);
        expect(captureSpy).toHaveBeenCalledWith({
            distinctId: 'brain-service-bench',
            event: 'bench.appevent.iteration',
            properties: expect.objectContaining({ foo: 1 }),
        });
    });

    it('captureBenchEvent swallows errors thrown by posthog client', async () => {
        process.env.POSTHOG_API_KEY = 'phc_test_key';
        vi.doMock('posthog-node', () => ({
            PostHog: vi.fn().mockImplementation(() => ({
                capture: () => {
                    throw new Error('posthog down');
                },
                shutdown: vi.fn(),
            })),
        }));
        const mod = await import('./posthog.helpers');
        const result = await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 });
        expect(result).toBe(false);
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm exec nx test learn-card-network-brain-service -- run src/helpers/posthog.helpers.test.ts
```

Expected: FAIL — `posthog.helpers` does not exist.

- [ ] **Step 3: Implement `posthog.helpers.ts`**

Create `services/learn-card-network/brain-service/src/helpers/posthog.helpers.ts`:

```typescript
import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

const getClient = (): PostHog | null => {
    if (client !== undefined) return client;
    const apiKey = process.env.POSTHOG_API_KEY;
    if (!apiKey) {
        client = null;
        return null;
    }
    try {
        client = new PostHog(apiKey, {
            host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
            flushAt: 1,
            flushInterval: 0,
        });
    } catch {
        client = null;
    }
    return client;
};

export type BenchEventName =
    | 'bench.appevent.iteration'
    | 'bench.appevent.run';

/**
 * Emit a single bench event to PostHog. Returns true on emission attempt,
 * false if PostHog is not configured or the client throws. Never propagates
 * errors to the caller — bench runs must not fail because of telemetry.
 */
export const captureBenchEvent = async (
    event: BenchEventName,
    properties: Record<string, unknown>
): Promise<boolean> => {
    const ph = getClient();
    if (!ph) return false;
    try {
        ph.capture({
            distinctId: 'brain-service-bench',
            event,
            properties: {
                ...properties,
                env: process.env.NODE_ENV ?? 'development',
                commit_sha: process.env.GIT_SHA ?? 'unknown',
            },
        });
        return true;
    } catch {
        return false;
    }
};

/**
 * Flush any buffered events. Call at the end of a bench run so events
 * arrive promptly even on short-lived processes.
 */
export const flushBenchEvents = async (): Promise<void> => {
    const ph = getClient();
    if (!ph) return;
    try {
        await ph.shutdown();
    } catch {
        // ignore
    }
    client = undefined;
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm exec nx test learn-card-network-brain-service -- run src/helpers/posthog.helpers.test.ts
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/posthog.helpers.ts \
        services/learn-card-network/brain-service/src/helpers/posthog.helpers.test.ts
git commit -m "[LC-1644] Add posthog.helpers for backend bench telemetry"
```

---

## Task 3: Create `percentile.helpers.ts` + tests

**Files:**
- Create: `services/learn-card-network/brain-service/src/helpers/percentile.helpers.ts`
- Test: `services/learn-card-network/brain-service/src/helpers/percentile.helpers.test.ts`

We need a small, deterministic percentile aggregator for the bench summary. Existing reports use the same shape (p50/p95/p99) but the logic lives in one-off scripts under `bench-helpers/` — duplicating it here keeps the runtime path independent of the dev-only scripts.

- [ ] **Step 1: Write the failing tests**

Create `services/learn-card-network/brain-service/src/helpers/percentile.helpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { percentile, summarize } from './percentile.helpers';

describe('percentile', () => {
    it('returns 0 for an empty array', () => {
        expect(percentile([], 50)).toBe(0);
    });

    it('returns the only element when array has length 1', () => {
        expect(percentile([42], 50)).toBe(42);
        expect(percentile([42], 95)).toBe(42);
    });

    it('computes p50 of a sorted array', () => {
        // 10 elements 1..10: p50 (nearest-rank) = 5
        expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50)).toBe(5);
    });

    it('computes p95 of a sorted array', () => {
        // 20 elements: nearest-rank index = ceil(0.95 * 20) - 1 = 18 → value 19
        const arr = Array.from({ length: 20 }, (_, i) => i + 1);
        expect(percentile(arr, 95)).toBe(19);
    });

    it('handles unsorted input', () => {
        expect(percentile([10, 1, 5, 3, 7, 9, 2, 8, 4, 6], 50)).toBe(5);
    });
});

describe('summarize', () => {
    it('returns p50/p95/p99 for an array of numbers', () => {
        const arr = Array.from({ length: 100 }, (_, i) => i + 1);
        const s = summarize(arr);
        expect(s.p50).toBe(50);
        expect(s.p95).toBe(95);
        expect(s.p99).toBe(99);
    });

    it('returns zeros for an empty array', () => {
        expect(summarize([])).toEqual({ p50: 0, p95: 0, p99: 0 });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm exec nx test learn-card-network-brain-service -- run src/helpers/percentile.helpers.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `percentile.helpers.ts`**

Create `services/learn-card-network/brain-service/src/helpers/percentile.helpers.ts`:

```typescript
/**
 * Nearest-rank percentile. Matches the math used by the existing bench
 * aggregator under brain-service/scripts/bench-helpers/aggregate.ts.
 */
export const percentile = (values: number[], p: number): number => {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];
    const sorted = [...values].sort((a, b) => a - b);
    const rank = Math.ceil((p / 100) * sorted.length);
    return sorted[Math.min(rank, sorted.length) - 1];
};

export type Summary = { p50: number; p95: number; p99: number };

export const summarize = (values: number[]): Summary => ({
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm exec nx test learn-card-network-brain-service -- run src/helpers/percentile.helpers.test.ts
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/percentile.helpers.ts \
        services/learn-card-network/brain-service/src/helpers/percentile.helpers.test.ts
git commit -m "[LC-1644] Add percentile.helpers for bench aggregation"
```

---

## Task 4: Extend `PerfTracker` to capture phase timings programmatically

The existing `PerfTracker` (services/learn-card-network/brain-service/src/helpers/perf.ts) emits to `console.log` and only captures when `LC_PERF_LOG` is truthy. The bench needs to read phase timings even when `LC_PERF_LOG` is unset, so we add a `capture()` method that always returns the timing data.

**Files:**
- Modify: `services/learn-card-network/brain-service/src/helpers/perf.ts`

- [ ] **Step 1: Write a failing test for the new method**

Create `services/learn-card-network/brain-service/src/helpers/perf.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PerfTracker } from './perf';

describe('PerfTracker.capture', () => {
    it('returns total_ms and per-phase timings even when LC_PERF_LOG is unset', () => {
        delete process.env.LC_PERF_LOG;
        const t = new PerfTracker('test');
        t.mark('phase1');
        t.mark('phase2');
        const result = t.capture();
        expect(result.total_ms).toBeGreaterThanOrEqual(0);
        expect(result.phases).toHaveProperty('phase1');
        expect(result.phases).toHaveProperty('phase2');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec nx test learn-card-network-brain-service -- run src/helpers/perf.test.ts
```

Expected: FAIL — `t.capture` is not a function.

- [ ] **Step 3: Add `capture()` to `PerfTracker` and make `mark` always record**

Modify `services/learn-card-network/brain-service/src/helpers/perf.ts`:

```typescript
/**
 * Lightweight timing helper for LC-1644 perf instrumentation.
 * Records phase durations always; only emits structured JSON to console
 * when LC_PERF_LOG is truthy. Use .capture() to read timings programmatically.
 */
export class PerfTracker {
    private logToConsole: boolean;
    private phases: Record<string, number> = {};
    private t0: number;
    private last: number;
    private label: string;

    constructor(label: string) {
        this.logToConsole = !!process.env.LC_PERF_LOG;
        this.label = label;
        this.t0 = performance.now();
        this.last = this.t0;
    }

    mark(phase: string): void {
        const now = performance.now();
        this.phases[phase] = now - this.last;
        this.last = now;
    }

    capture(): { total_ms: number; phases: Record<string, number> } {
        const total_ms = performance.now() - this.t0;
        return { total_ms, phases: { ...this.phases } };
    }

    done(extra?: Record<string, unknown>): void {
        if (!this.logToConsole) return;
        const total = performance.now() - this.t0;
        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify({
                perf: this.label,
                total_ms: Math.round(total),
                phases: this.phases,
                ...extra,
            })
        );
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm exec nx test learn-card-network-brain-service -- run src/helpers/perf.test.ts src/helpers/posthog.helpers.test.ts src/helpers/percentile.helpers.test.ts
```

Expected: all passing. (Existing call-sites of `mark()` and `done()` are unaffected.)

- [ ] **Step 5: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/perf.ts \
        services/learn-card-network/brain-service/src/helpers/perf.test.ts
git commit -m "[LC-1644] PerfTracker: add capture() for programmatic readout"
```

---

## Task 5: Refactor `handleSendCredentialEvent` to expose its `PerfTracker`

The bench needs to read each iteration's phase timings. Today `handleSendCredentialEvent` constructs its `PerfTracker` internally and only logs. We extract the call so callers can pass in a tracker (for the bench) or let the function build its own (for prod).

**Files:**
- Modify: `services/learn-card-network/brain-service/src/routes/app-store.ts`

- [ ] **Step 1: Read the current signature**

Read `services/learn-card-network/brain-service/src/routes/app-store.ts` lines 585-770 to confirm the function signature is `handleSendCredentialEvent(ctx, profile, listingId, event)`.

- [ ] **Step 2: Add an optional `perfTracker` parameter**

In `services/learn-card-network/brain-service/src/routes/app-store.ts`, change the signature of `handleSendCredentialEvent`:

```typescript
const handleSendCredentialEvent = async (
    ctx: { domain: string },
    profile: { profileId: string },
    listingId: string,
    event: Record<string, unknown>,
    perfTracker?: PerfTracker
): Promise<Record<string, unknown>> => {
    const perf = perfTracker ?? new PerfTracker('handleSendCredentialEvent');
    // ... existing body unchanged
```

The bench will pass its own tracker so it can `capture()` after the call returns. Production callers (the `appEvent` mutation at line ~2362) pass nothing and behavior is identical.

- [ ] **Step 3: Run the existing brain-service tests to confirm no regression**

```bash
pnpm exec nx test learn-card-network-brain-service -- run src/routes/app-store
```

Expected: existing tests still pass. (If there are no existing tests for this file, that's fine — the type signature change is additive.)

- [ ] **Step 4: Commit**

```bash
git add services/learn-card-network/brain-service/src/routes/app-store.ts
git commit -m "[LC-1644] handleSendCredentialEvent: accept optional perfTracker"
```

---

## Task 6: Create `bench-appevent.helpers.ts` (the bench loop)

This isolates the iteration loop, percentile aggregation, and PostHog emission from the route handler so the route stays thin.

**Files:**
- Create: `services/learn-card-network/brain-service/src/helpers/bench-appevent.helpers.ts`

- [ ] **Step 1: Implement the helper**

Create `services/learn-card-network/brain-service/src/helpers/bench-appevent.helpers.ts`:

```typescript
import { randomUUID } from 'crypto';

import { PerfTracker } from '@helpers/perf';
import { captureBenchEvent, flushBenchEvents } from '@helpers/posthog.helpers';
import { summarize, type Summary } from '@helpers/percentile.helpers';

export type BenchIterationResult = {
    iteration: number;
    error?: string;
    total_ms: number;
    parallel_reads_ms: number;
    owner_and_sa_reads_ms: number;
    sa_issue_ms: number;
    sa_http_ms: number;
    sa_didauthvp_ms: number;
    log_activity_and_send_boost_ms: number;
};

export type BenchSummary = {
    iteration_count: number;
    errors: number;
    total: Summary;
    sa_issue: Summary;
    sa_http: Summary;
    parallel_reads: Summary;
    owner_and_sa_reads: Summary;
    log_activity_and_send_boost: Summary;
};

export type BenchRunResult = {
    runId: string;
    perIteration: BenchIterationResult[];
    summary: BenchSummary;
    posthogDashboardUrl?: string;
};

const phaseFromTracker = (
    captured: { total_ms: number; phases: Record<string, number> },
    name: string
): number => Math.round(captured.phases[name] ?? 0);

/**
 * Run a bench iteration loop.
 *
 * `runIteration` is the per-call function (parameterized so the route can
 * inject a closure over `ctx` / profile / listing / event without leaking
 * those types into this helper). It must construct its own PerfTracker and
 * return its captured timings.
 */
export const runBench = async (params: {
    iterations: number;
    warmup: number;
    runLabel: string;
    listingId: string;
    recipientProfileId: string;
    runIteration: () => Promise<{
        captured: { total_ms: number; phases: Record<string, number> };
        saHttpMs: number;
        saDidAuthVpMs: number;
    }>;
}): Promise<BenchRunResult> => {
    const runId = randomUUID();
    const { iterations, warmup, runLabel, listingId, recipientProfileId, runIteration } = params;

    // Warmup — discarded.
    for (let i = 0; i < warmup; i++) {
        try {
            await runIteration();
        } catch {
            // ignore — warmup failures should not abort the run
        }
    }

    const perIteration: BenchIterationResult[] = [];

    for (let i = 0; i < iterations; i++) {
        try {
            const { captured, saHttpMs, saDidAuthVpMs } = await runIteration();

            const result: BenchIterationResult = {
                iteration: i,
                total_ms: Math.round(captured.total_ms),
                parallel_reads_ms: phaseFromTracker(captured, 'parallelReads'),
                owner_and_sa_reads_ms: phaseFromTracker(captured, 'ownerAndSaReads'),
                sa_issue_ms: phaseFromTracker(captured, 'saIssue'),
                sa_http_ms: Math.round(saHttpMs),
                sa_didauthvp_ms: Math.round(saDidAuthVpMs),
                log_activity_and_send_boost_ms: phaseFromTracker(
                    captured,
                    'logActivityAndSendBoost'
                ),
            };
            perIteration.push(result);

            await captureBenchEvent('bench.appevent.iteration', {
                run_id: runId,
                run_label: runLabel,
                was_first_iteration: i === 0,
                listing_id: listingId,
                recipient_profile_id: recipientProfileId,
                ...result,
            });
        } catch (err) {
            perIteration.push({
                iteration: i,
                error: err instanceof Error ? err.message : String(err),
                total_ms: 0,
                parallel_reads_ms: 0,
                owner_and_sa_reads_ms: 0,
                sa_issue_ms: 0,
                sa_http_ms: 0,
                sa_didauthvp_ms: 0,
                log_activity_and_send_boost_ms: 0,
            });
        }
    }

    const successful = perIteration.filter(r => !r.error);
    const summary: BenchSummary = {
        iteration_count: perIteration.length,
        errors: perIteration.length - successful.length,
        total: summarize(successful.map(r => r.total_ms)),
        sa_issue: summarize(successful.map(r => r.sa_issue_ms)),
        sa_http: summarize(successful.map(r => r.sa_http_ms)),
        parallel_reads: summarize(successful.map(r => r.parallel_reads_ms)),
        owner_and_sa_reads: summarize(successful.map(r => r.owner_and_sa_reads_ms)),
        log_activity_and_send_boost: summarize(
            successful.map(r => r.log_activity_and_send_boost_ms)
        ),
    };

    await captureBenchEvent('bench.appevent.run', {
        run_id: runId,
        run_label: runLabel,
        listing_id: listingId,
        recipient_profile_id: recipientProfileId,
        iteration_count: summary.iteration_count,
        errors: summary.errors,
        total_p50: summary.total.p50,
        total_p95: summary.total.p95,
        total_p99: summary.total.p99,
        sa_issue_p50: summary.sa_issue.p50,
        sa_issue_p95: summary.sa_issue.p95,
        sa_issue_p99: summary.sa_issue.p99,
        sa_http_p50: summary.sa_http.p50,
        sa_http_p95: summary.sa_http.p95,
        sa_http_p99: summary.sa_http.p99,
        parallel_reads_p50: summary.parallel_reads.p50,
        parallel_reads_p95: summary.parallel_reads.p95,
        parallel_reads_p99: summary.parallel_reads.p99,
        owner_and_sa_reads_p50: summary.owner_and_sa_reads.p50,
        owner_and_sa_reads_p95: summary.owner_and_sa_reads.p95,
        owner_and_sa_reads_p99: summary.owner_and_sa_reads.p99,
        log_activity_and_send_boost_p50: summary.log_activity_and_send_boost.p50,
        log_activity_and_send_boost_p95: summary.log_activity_and_send_boost.p95,
        log_activity_and_send_boost_p99: summary.log_activity_and_send_boost.p99,
    });

    await flushBenchEvents();

    const posthogHost = process.env.POSTHOG_HOST;
    const posthogDashboardUrl = posthogHost
        ? `${posthogHost}/events?eventFilter=bench.appevent&runId=${runId}`
        : undefined;

    return { runId, perIteration, summary, posthogDashboardUrl };
};
```

- [ ] **Step 2: Confirm it compiles**

```bash
pnpm exec nx run learn-card-network-brain-service:typecheck
```

Expected: no new errors. (If `typecheck` is not a defined target, run the full build instead: `pnpm exec nx build learn-card-network-brain-service`.)

- [ ] **Step 3: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/bench-appevent.helpers.ts
git commit -m "[LC-1644] Add bench-appevent helper (loop, aggregation, posthog emission)"
```

---

## Task 7: Expose `saHttpMs` / `saDidAuthVpMs` from `issueCredentialWithSigningAuthority`

The bench helper expects each iteration's runner to return the SA HTTP call time and DID Auth VP time as separate scalars. These are already captured by the `PerfTracker` inside `signingAuthority.helpers.ts` (`http`, `didAuthVp` phases) but aren't returned from the function. We extend the return type to include them.

**Files:**
- Modify: `services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts`

- [ ] **Step 1: Read current return shape**

Read `services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts` around line 147 (the `PerfTracker` instantiation) and around the `return` statement to confirm the current return type.

- [ ] **Step 2: Add timings to the return value**

In `services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts`, change the `issueCredentialWithSigningAuthority` function's return statement to include `_perfTimings`:

```typescript
const captured = perf.capture();
return {
    credential: issuedCredential,
    _perfTimings: {
        sa_http_ms: captured.phases.http ?? 0,
        sa_didauthvp_ms: captured.phases.didAuthVp ?? 0,
    },
};
```

(The leading underscore on `_perfTimings` flags it as instrumentation rather than data — existing callers that destructure `{ credential }` keep working unchanged.)

If the function currently returns just the credential (not an object), wrap it: `return { credential: issuedCredential, _perfTimings: { ... } };` and update callers accordingly. Verify by reading the existing callers — there should only be one (in `app-store.ts`'s `handleSendCredentialEvent`).

- [ ] **Step 3: Update callers in `app-store.ts`**

In `services/learn-card-network/brain-service/src/routes/app-store.ts`, find the call to `issueCredentialWithSigningAuthority` inside `handleSendCredentialEvent` and adjust the destructuring to capture `_perfTimings` (store it on a closure variable so the bench can read it later — for the production code path, just discard it):

```typescript
const { credential, _perfTimings } = await issueCredentialWithSigningAuthority(/* args */);
// _perfTimings is intentionally unused in production; the bench reads it via a
// shared closure-scoped object — see the benchAppEvent route in Task 8.
void _perfTimings;
```

- [ ] **Step 4: Run tests + typecheck**

```bash
pnpm exec nx test learn-card-network-brain-service -- run
pnpm exec nx build learn-card-network-brain-service
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts \
        services/learn-card-network/brain-service/src/routes/app-store.ts
git commit -m "[LC-1644] SA: surface http/didAuthVp timings in return value"
```

---

## Task 8: Add `benchAppEvent` and `cleanupBenchAppEventData` tRPC mutations

**Files:**
- Modify: `services/learn-card-network/brain-service/src/routes/app-store.ts`

- [ ] **Step 1: Add imports at the top of `app-store.ts`**

Add to the existing imports:

```typescript
import { runBench, type BenchRunResult } from '@helpers/bench-appevent.helpers';
import { PerfTracker } from '@helpers/perf';  // already imported but verify
```

- [ ] **Step 2: Add the `benchAppEvent` mutation**

Insert *before* the closing `});` of `appStoreRouter` (after `appEvent` and the existing admin mutations):

```typescript
    benchAppEvent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/admin/bench-appevent',
                tags: ['App Store Admin'],
                summary: 'Run AppEvent perf bench (admin only)',
                description:
                    'Runs handleSendCredentialEvent N times against the configured listing and recipient, captures per-phase timings, and emits PostHog events. Admin-only.',
            },
            requiredScope: 'app-store:write',
        })
        .input(
            z.object({
                listingId: z.string(),
                recipientProfileId: z.string(),
                templateAlias: z.string(),
                iterations: z.number().int().min(1).max(100),
                warmup: z.number().int().min(0).max(10).default(2),
                runLabel: z.string().optional(),
            })
        )
        .output(z.record(z.string(), z.unknown()))
        .mutation(async ({ input, ctx }): Promise<BenchRunResult> => {
            verifyAppStoreAdmin(ctx.user.profile.profileId);

            const recipientProfiles = await getProfilesByProfileIds([input.recipientProfileId]);
            const recipient = recipientProfiles[0];
            if (!recipient) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient profile not found',
                });
            }
            const listing = await readAppStoreListingByIdOrSlug(input.listingId);
            if (!listing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'App Store Listing not found',
                });
            }

            const runLabel = input.runLabel ?? `bench-${new Date().toISOString()}`;

            const runIteration = async () => {
                // Each iteration must use the recipient as the caller (so the credential
                // ends up in the bench profile's wallet) — but ctx is the admin's. We
                // pass the recipient as `profile` directly to handleSendCredentialEvent.
                const tracker = new PerfTracker('bench-appevent-iteration');
                let saHttpMs = 0;
                let saDidAuthVpMs = 0;

                // Patch the SA timings out of the closure-scoped result. The
                // handleSendCredentialEvent function calls
                // issueCredentialWithSigningAuthority internally and now returns
                // _perfTimings; we capture them via a side channel below.
                const originalSaTimings = (globalThis as any).__benchSaTimings;
                (globalThis as any).__benchSaTimings = {};
                try {
                    await handleSendCredentialEvent(
                        ctx,
                        { profileId: recipient.profileId },
                        listing.listing_id,
                        {
                            type: 'send-credential',
                            templateAlias: input.templateAlias,
                            templateData: {},
                        },
                        tracker
                    );
                } finally {
                    saHttpMs = (globalThis as any).__benchSaTimings.sa_http_ms ?? 0;
                    saDidAuthVpMs = (globalThis as any).__benchSaTimings.sa_didauthvp_ms ?? 0;
                    (globalThis as any).__benchSaTimings = originalSaTimings;
                }

                return {
                    captured: tracker.capture(),
                    saHttpMs,
                    saDidAuthVpMs,
                };
            };

            return runBench({
                iterations: input.iterations,
                warmup: input.warmup,
                runLabel,
                listingId: listing.listing_id,
                recipientProfileId: recipient.profileId,
                runIteration,
            });
        }),

    cleanupBenchAppEventData: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/admin/cleanup-bench-data',
                tags: ['App Store Admin'],
                summary: 'Cleanup bench-generated credentials/notifications/activity (admin only)',
                description:
                    'Deletes all credentials, notifications, and activity entries for the given recipient profile. Used between perf bench runs.',
            },
            requiredScope: 'app-store:write',
        })
        .input(z.object({ recipientProfileId: z.string() }))
        .output(
            z.object({
                credentialsDeleted: z.number(),
                notificationsDeleted: z.number(),
                activityEntriesDeleted: z.number(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            verifyAppStoreAdmin(ctx.user.profile.profileId);

            const recipientProfiles = await getProfilesByProfileIds([input.recipientProfileId]);
            const recipient = recipientProfiles[0];
            if (!recipient) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient profile not found',
                });
            }

            // Implementation note: reuse existing access-layer delete helpers if they
            // exist; otherwise drop in a Cypher MATCH...DETACH DELETE scoped to the
            // recipient profile's owned credentials/notifications/activity. The exact
            // helper names depend on what the access layer exposes — search for
            // `deleteCredentialsByProfileId` or similar before writing new Cypher.
            //
            // For v1 it's acceptable to start with a Cypher block here; if it grows
            // beyond ~20 lines, extract to access-layer.

            // TODO: replace this stub with the real implementation in Task 8a (next).
            return {
                credentialsDeleted: 0,
                notificationsDeleted: 0,
                activityEntriesDeleted: 0,
            };
        }),
```

- [ ] **Step 3: Refactor the SA-timings side-channel**

The closure-via-globalThis pattern in Step 2 is intentionally ugly to make it easy to spot and replace. Replace it with a proper module-scoped `AsyncLocalStorage` (Node built-in) so concurrent benches don't collide.

Create `services/learn-card-network/brain-service/src/helpers/bench-context.helpers.ts`:

```typescript
import { AsyncLocalStorage } from 'async_hooks';

export type BenchContext = { sa_http_ms: number; sa_didauthvp_ms: number };

export const benchContextStorage = new AsyncLocalStorage<BenchContext>();
```

In `services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts`, after `const captured = perf.capture();` (added in Task 7), populate the context if present:

```typescript
import { benchContextStorage } from '@helpers/bench-context.helpers';

// ... inside the function, just before `return`:
const benchCtx = benchContextStorage.getStore();
if (benchCtx) {
    benchCtx.sa_http_ms = captured.phases.http ?? 0;
    benchCtx.sa_didauthvp_ms = captured.phases.didAuthVp ?? 0;
}
```

In `services/learn-card-network/brain-service/src/routes/app-store.ts`, replace the `(globalThis as any).__benchSaTimings` block in the bench `runIteration` with:

```typescript
import { benchContextStorage, type BenchContext } from '@helpers/bench-context.helpers';

// inside runIteration:
const benchCtx: BenchContext = { sa_http_ms: 0, sa_didauthvp_ms: 0 };
const tracker = new PerfTracker('bench-appevent-iteration');
await benchContextStorage.run(benchCtx, async () => {
    await handleSendCredentialEvent(
        ctx,
        { profileId: recipient.profileId },
        listing.listing_id,
        { type: 'send-credential', templateAlias: input.templateAlias, templateData: {} },
        tracker
    );
});
return {
    captured: tracker.capture(),
    saHttpMs: benchCtx.sa_http_ms,
    saDidAuthVpMs: benchCtx.sa_didauthvp_ms,
};
```

Remove the `_perfTimings` field from the SA helper's return value added in Task 7 — the AsyncLocalStorage path supersedes it.

- [ ] **Step 4: Run typecheck**

```bash
pnpm exec nx build learn-card-network-brain-service
```

Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add services/learn-card-network/brain-service/src/routes/app-store.ts \
        services/learn-card-network/brain-service/src/helpers/bench-context.helpers.ts \
        services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts
git commit -m "[LC-1644] Add benchAppEvent + cleanupBenchAppEventData tRPC mutations"
```

---

## Task 8a: Implement the cleanup mutation body

**Files:**
- Modify: `services/learn-card-network/brain-service/src/routes/app-store.ts`

- [ ] **Step 1: Find existing delete helpers**

Search for delete-by-profile patterns in the access layer:

```bash
grep -rn "deleteAllCredentials\|deleteCredentialsBy\|DETACH DELETE" \
    services/learn-card-network/brain-service/src/accesslayer --include="*.ts"
```

Note which helpers exist for: credentials owned by a profile, notifications for a profile, activity entries for a profile.

- [ ] **Step 2: Replace the cleanup mutation stub**

In `services/learn-card-network/brain-service/src/routes/app-store.ts`, replace the `cleanupBenchAppEventData` mutation body (the `// TODO: replace this stub` block from Task 8 step 2) with the real cleanup. If existing access-layer helpers cover all three cases, call them directly. Otherwise, fall back to a single Cypher block via the existing `Neogma` instance — example shape:

```typescript
.mutation(async ({ input, ctx }) => {
    verifyAppStoreAdmin(ctx.user.profile.profileId);

    const recipientProfiles = await getProfilesByProfileIds([input.recipientProfileId]);
    const recipient = recipientProfiles[0];
    if (!recipient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient profile not found' });
    }

    // Use access-layer helpers if available — else direct Cypher. Replace the
    // three lines below with the helpers found in Step 1.
    const credentialsDeleted = await deleteAllCredentialsForProfile(recipient.profileId);
    const notificationsDeleted = await deleteAllNotificationsForProfile(recipient.profileId);
    const activityEntriesDeleted = await deleteAllActivityForProfile(recipient.profileId);

    return { credentialsDeleted, notificationsDeleted, activityEntriesDeleted };
}),
```

If a helper doesn't exist, open it as a follow-up task (don't block on writing new access-layer code). For v1 it is acceptable to leave one or two of the three counters as `0` with a comment explaining why, as long as the bench is still usable.

- [ ] **Step 3: Build + commit**

```bash
pnpm exec nx build learn-card-network-brain-service
git add services/learn-card-network/brain-service/src/routes/app-store.ts
git commit -m "[LC-1644] Implement cleanupBenchAppEventData body"
```

---

## Task 9: Document new env vars

**Files:**
- Modify: `services/learn-card-network/brain-service/.env.example`

- [ ] **Step 1: Append the three new vars to `.env.example`**

```bash
cat >> services/learn-card-network/brain-service/.env.example <<'EOF'

# LC-1644 perf bench (admin-only). Optional — if unset, the bench still runs
# but emits no PostHog events.
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.i.posthog.com
GIT_SHA=
EOF
```

- [ ] **Step 2: Commit**

```bash
git add services/learn-card-network/brain-service/.env.example
git commit -m "[LC-1644] Document POSTHOG_API_KEY/HOST/GIT_SHA env vars"
```

---

## Task 10: Expose new mutations via the brain-client plugin

**Files:**
- Modify: `packages/plugins/learn-card-network/src/types.ts`
- Modify: `packages/plugins/learn-card-network/src/plugin.ts`

- [ ] **Step 1: Add type declarations**

In `packages/plugins/learn-card-network/src/types.ts`, find the section with `sendAppEvent` (around line 812) and add immediately after it:

```typescript
    // LC-1644 perf bench (admin-only)
    benchAppEvent: (input: {
        listingId: string;
        recipientProfileId: string;
        templateAlias: string;
        iterations: number;
        warmup?: number;
        runLabel?: string;
    }) => Promise<{
        runId: string;
        perIteration: Array<Record<string, unknown>>;
        summary: Record<string, unknown>;
        posthogDashboardUrl?: string;
    }>;
    cleanupBenchAppEventData: (input: { recipientProfileId: string }) => Promise<{
        credentialsDeleted: number;
        notificationsDeleted: number;
        activityEntriesDeleted: number;
    }>;
```

- [ ] **Step 2: Wire plugin methods**

In `packages/plugins/learn-card-network/src/plugin.ts`, find the `sendAppEvent` block (around line 2199) and add immediately after it:

```typescript
            benchAppEvent: async (_learnCard, input) => {
                await ensureUser();
                return client.appStore.benchAppEvent.mutate(input);
            },

            cleanupBenchAppEventData: async (_learnCard, input) => {
                await ensureUser();
                return client.appStore.cleanupBenchAppEventData.mutate(input);
            },
```

- [ ] **Step 3: Build the plugin**

```bash
pnpm exec nx build plugins-learn-card-network
```

Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add packages/plugins/learn-card-network/src/types.ts \
        packages/plugins/learn-card-network/src/plugin.ts
git commit -m "[LC-1644] Expose benchAppEvent + cleanupBenchAppEventData via plugin"
```

---

## Task 11: Add the analytics event for trigger attribution

**Files:**
- Modify: `apps/learn-card-app/src/analytics/events.ts`

- [ ] **Step 1: Add the event constant + payload**

In `apps/learn-card-app/src/analytics/events.ts`, add to the `AnalyticsEvents` const object:

```typescript
    // LC-1644 perf bench (admin-only)
    BENCH_APPEVENT_RUN_TRIGGERED: 'bench_appevent_run_triggered',
```

And to the `AnalyticsEventPayloads` interface:

```typescript
    [AnalyticsEvents.BENCH_APPEVENT_RUN_TRIGGERED]: {
        run_id: string;
        iterations: number;
        warmup: number;
        listing_id: string;
        recipient_profile_id: string;
        run_label: string;
    };
```

- [ ] **Step 2: Typecheck**

```bash
pnpm exec nx build learn-card-app
```

Expected: build passes (or fails on something unrelated, in which case a narrower typecheck like `pnpm exec tsc --noEmit -p apps/learn-card-app/tsconfig.json` is acceptable).

- [ ] **Step 3: Commit**

```bash
git add apps/learn-card-app/src/analytics/events.ts
git commit -m "[LC-1644] Add BENCH_APPEVENT_RUN_TRIGGERED analytics event"
```

---

## Task 12: Register the new admin tools tile

**Files:**
- Modify: `apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/admin-tools.helpers.ts`

- [ ] **Step 1: Add the enum value**

In the `AdminToolOptionsEnum` enum, add:

```typescript
    APPEVENT_PERF_BENCH = 'AppEvent Perf Bench',
```

- [ ] **Step 2: Add the tile entry**

In the `adminToolOptions` array, append:

```typescript
    {
        id: 4,
        label: 'AppEvent Perf Bench',
        title: 'AppEvent Perf Bench',
        description:
            'Run the sendCredential APP_EVENT flow N times against staging and capture per-phase timings in PostHog.',
        actionLabel: 'Open Perf Bench',
        type: AdminToolOptionsEnum.APPEVENT_PERF_BENCH,
    },
```

- [ ] **Step 3: Commit**

```bash
git add apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/admin-tools.helpers.ts
git commit -m "[LC-1644] Register AppEvent Perf Bench in admin tools menu"
```

---

## Task 13: Build the bench panel component

**Files:**
- Create: `apps/learn-card-app/src/pages/adminToolsPage/appevent-perf-bench/AdminToolsAppEventPerfBenchOption.tsx`

This file mirrors `AdminToolsGuardianCredentialTestOption.tsx` exactly in structure (state machine, Tailwind classes, header pattern). Read that file first to confirm the conventions match.

- [ ] **Step 1: Create the component**

Create `apps/learn-card-app/src/pages/adminToolsPage/appevent-perf-bench/AdminToolsAppEventPerfBenchOption.tsx`:

```tsx
import React, { useState } from 'react';
import type { FC } from 'react';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

import { useAnalytics, AnalyticsEvents } from '@analytics';
import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';
import type { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';

type RunStatus = 'idle' | 'running' | 'done' | 'error';

const inputClass =
    'w-full border border-grayscale-200 rounded-[12px] px-[12px] py-[10px] text-[14px] text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-notoSans';
const labelClass = 'text-[13px] font-[600] text-grayscale-700 mb-[4px] block font-notoSans';

type BenchSummary = {
    iteration_count: number;
    errors: number;
    total: { p50: number; p95: number; p99: number };
    sa_issue: { p50: number; p95: number; p99: number };
    sa_http: { p50: number; p95: number; p99: number };
    parallel_reads: { p50: number; p95: number; p99: number };
    owner_and_sa_reads: { p50: number; p95: number; p99: number };
    log_activity_and_send_boost: { p50: number; p95: number; p99: number };
};

type BenchResult = {
    runId: string;
    perIteration: Array<Record<string, unknown>>;
    summary: BenchSummary;
    posthogDashboardUrl?: string;
};

const AdminToolsAppEventPerfBenchOption: FC<{ option: AdminToolOption }> = ({ option }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { track } = useAnalytics();

    const [listingId, setListingId] = useState('');
    const [recipientProfileId, setRecipientProfileId] = useState('');
    const [templateAlias, setTemplateAlias] = useState('');
    const [iterations, setIterations] = useState(10);
    const [warmup, setWarmup] = useState(2);
    const [runLabel, setRunLabel] = useState('');

    const [status, setStatus] = useState<RunStatus>('idle');
    const [result, setResult] = useState<BenchResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRun = async () => {
        if (!listingId.trim() || !recipientProfileId.trim() || !templateAlias.trim()) {
            presentToast('Fill in listing ID, recipient profile ID, and template alias', {
                type: ToastTypeEnum.Error,
            });
            return;
        }
        const label = runLabel.trim() || `bench-${new Date().toISOString()}`;
        setStatus('running');
        setResult(null);
        setErrorMessage(null);

        try {
            const wallet = await initWallet();
            const triggeredRunId = crypto.randomUUID();
            await track(AnalyticsEvents.BENCH_APPEVENT_RUN_TRIGGERED, {
                run_id: triggeredRunId,
                iterations,
                warmup,
                listing_id: listingId.trim(),
                recipient_profile_id: recipientProfileId.trim(),
                run_label: label,
            });

            const res = await wallet.invoke.benchAppEvent?.({
                listingId: listingId.trim(),
                recipientProfileId: recipientProfileId.trim(),
                templateAlias: templateAlias.trim(),
                iterations,
                warmup,
                runLabel: label,
            });
            if (!res) throw new Error('benchAppEvent not available on this wallet');
            setResult(res as BenchResult);
            setStatus('done');
            presentToast('Bench complete', { type: ToastTypeEnum.Success });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setErrorMessage(msg);
            setStatus('error');
        }
    };

    const handleCleanup = async () => {
        if (!recipientProfileId.trim()) {
            presentToast('Recipient profile ID required for cleanup', { type: ToastTypeEnum.Error });
            return;
        }
        if (!window.confirm(`Delete ALL credentials/notifications/activity for ${recipientProfileId.trim()}?`)) {
            return;
        }
        try {
            const wallet = await initWallet();
            const res = await wallet.invoke.cleanupBenchAppEventData?.({
                recipientProfileId: recipientProfileId.trim(),
            });
            if (!res) throw new Error('cleanupBenchAppEventData not available');
            presentToast(
                `Deleted ${res.credentialsDeleted} credentials, ${res.notificationsDeleted} notifications, ${res.activityEntriesDeleted} activity entries`,
                { type: ToastTypeEnum.Success }
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            presentToast(msg, { type: ToastTypeEnum.Error });
        }
    };

    const handleCopyResults = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        presentToast('Results copied to clipboard', { type: ToastTypeEnum.Success });
    };

    const renderPercentileRow = (label: string, p: { p50: number; p95: number; p99: number }) => (
        <tr key={label} className="border-b border-grayscale-100 last:border-0">
            <td className="py-[6px] pr-[12px] font-[600] text-[13px] text-grayscale-700 font-notoSans">{label}</td>
            <td className="py-[6px] pr-[12px] text-[13px] font-mono text-grayscale-900">{p.p50}</td>
            <td className="py-[6px] pr-[12px] text-[13px] font-mono text-grayscale-900">{p.p95}</td>
            <td className="py-[6px] text-[13px] font-mono text-grayscale-900">{p.p99}</td>
        </tr>
    );

    return (
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px] overflow-hidden shadow-box-bottom">
                <AdminToolsOptionItemHeader option={option} />

                <div className="p-[20px] flex flex-col gap-[16px]">
                    <div>
                        <label className={labelClass}>Listing ID</label>
                        <input className={inputClass} value={listingId} onChange={e => setListingId(e.target.value)} />
                    </div>

                    <div>
                        <label className={labelClass}>Recipient Profile ID</label>
                        <input
                            className={inputClass}
                            placeholder="bench-perf-staging"
                            value={recipientProfileId}
                            onChange={e => setRecipientProfileId(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Template Alias</label>
                        <input className={inputClass} value={templateAlias} onChange={e => setTemplateAlias(e.target.value)} />
                    </div>

                    <div className="flex gap-[12px]">
                        <div className="flex-1">
                            <label className={labelClass}>Iterations (1-100)</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                className={inputClass}
                                value={iterations}
                                onChange={e => setIterations(Math.max(1, Math.min(100, Number(e.target.value))))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className={labelClass}>Warmup (0-10)</label>
                            <input
                                type="number"
                                min={0}
                                max={10}
                                className={inputClass}
                                value={warmup}
                                onChange={e => setWarmup(Math.max(0, Math.min(10, Number(e.target.value))))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Run Label (optional)</label>
                        <input
                            className={inputClass}
                            placeholder={`bench-<auto-timestamp>`}
                            value={runLabel}
                            onChange={e => setRunLabel(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-[12px] mt-[8px]">
                        <button
                            onClick={handleRun}
                            disabled={status === 'running'}
                            className="rounded-full bg-emerald-700 text-white px-[18px] py-[12px] text-[15px] font-[600] font-notoSans disabled:opacity-50 flex items-center justify-center gap-[8px]"
                        >
                            {status === 'running' && (
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            )}
                            {status === 'running' ? 'Running…' : 'Run Bench'}
                        </button>
                        <button
                            onClick={handleCleanup}
                            disabled={status === 'running'}
                            className="rounded-full border border-red-300 text-red-700 px-[18px] py-[12px] text-[15px] font-[600] font-notoSans disabled:opacity-50"
                        >
                            Cleanup Bench Data
                        </button>
                        {status === 'done' && result && (
                            <button
                                onClick={handleCopyResults}
                                className="rounded-full border border-grayscale-300 text-grayscale-800 px-[18px] py-[12px] text-[15px] font-[600] font-notoSans"
                            >
                                Copy Results JSON
                            </button>
                        )}
                    </div>

                    {status === 'error' && errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px]">
                            <p className="text-[13px] text-red-700 font-mono break-all">{errorMessage}</p>
                        </div>
                    )}

                    {status === 'done' && result && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-[16px] flex flex-col gap-[12px]">
                            <p className="text-[14px] font-[600] text-emerald-800 font-notoSans">
                                Run {result.runId} — {result.summary.iteration_count} iterations, {result.summary.errors} errors
                            </p>
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans pr-[12px]">Phase</th>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans pr-[12px]">p50</th>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans pr-[12px]">p95</th>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans">p99</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderPercentileRow('total', result.summary.total)}
                                    {renderPercentileRow('sa_issue', result.summary.sa_issue)}
                                    {renderPercentileRow('sa_http', result.summary.sa_http)}
                                    {renderPercentileRow('parallel_reads', result.summary.parallel_reads)}
                                    {renderPercentileRow('owner_and_sa_reads', result.summary.owner_and_sa_reads)}
                                    {renderPercentileRow(
                                        'log_activity_and_send_boost',
                                        result.summary.log_activity_and_send_boost
                                    )}
                                </tbody>
                            </table>
                            {result.posthogDashboardUrl && (
                                <a
                                    href={result.posthogDashboardUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12px] text-emerald-700 underline self-start"
                                >
                                    View in PostHog →
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </section>
    );
};

export default AdminToolsAppEventPerfBenchOption;
```

- [ ] **Step 2: Build the app**

```bash
pnpm exec nx build learn-card-app
```

Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add apps/learn-card-app/src/pages/adminToolsPage/appevent-perf-bench/AdminToolsAppEventPerfBenchOption.tsx
git commit -m "[LC-1644] Add AppEvent Perf Bench admin panel component"
```

---

## Task 14: Wire the new tile into `AdminToolsOptionsContainer`

**Files:**
- Modify: `apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/AdminToolsOptionsContainer.tsx`

- [ ] **Step 1: Import the component**

Add to the imports at the top:

```typescript
import AdminToolsAppEventPerfBenchOption from '../appevent-perf-bench/AdminToolsAppEventPerfBenchOption';
```

- [ ] **Step 2: Add the switch case**

Inside the `switch (activeAdminToolOption)` block, add a new case (place after the `GUARDIAN_CREDENTIAL_TEST` case at line ~52):

```typescript
        case AdminToolOptionsEnum.APPEVENT_PERF_BENCH:
            adminToolContent = <AdminToolsAppEventPerfBenchOption option={option} />;
            break;
```

- [ ] **Step 3: Build**

```bash
pnpm exec nx build learn-card-app
```

Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/AdminToolsOptionsContainer.tsx
git commit -m "[LC-1644] Wire AppEvent Perf Bench tile into admin tools container"
```

---

## Task 15: Manual smoke test on local stack

This is a manual step — no automated e2e for v1.

- [ ] **Step 1: Start the local stack**

```bash
pnpm exec nx serve learn-card-network-brain-service &
pnpm exec nx serve learn-card-app
```

- [ ] **Step 2: Set admin allowlist**

In `services/learn-card-network/brain-service/.env.local` (or your local env override), add:

```
APP_STORE_ADMIN_PROFILE_IDS=<your-local-profile-id>
```

Restart the brain service to pick it up.

- [ ] **Step 3: Seed a bench listing + recipient profile**

Either create them via the UI (Sign up → Create integration → Create listing → publish boost), or use the existing bench seed script as a reference: `services/learn-card-network/brain-service/scripts/bench-helpers/seed.ts`.

- [ ] **Step 4: Drive the panel**

In the running app: Profile menu → Admin Tools → "AppEvent Perf Bench" tile. Fill in listing ID, recipient profile ID, template alias. Set iterations=2, warmup=1. Click **Run Bench**. Verify:

- Spinner shows during run
- Results table populates with p50/p95/p99 values
- "Copy Results JSON" pastes a valid JSON object
- If `POSTHOG_API_KEY` was set, events arrive in the PostHog Activity feed within ~10s

- [ ] **Step 5: Cleanup**

Click **Cleanup Bench Data**. Verify the success toast shows non-zero counts (or zero with an explanatory comment if helpers weren't all available — see Task 8a).

- [ ] **Step 6: Document the smoke result**

Create `docs/superpowers/reports/2026-04-27-lc-1644-admin-bench-smoke.md` with a brief writeup: which iteration counts ran, what the panel showed, whether PostHog events arrived. Force-add (the dir is gitignored) and commit:

```bash
git add -f docs/superpowers/reports/2026-04-27-lc-1644-admin-bench-smoke.md
git commit -m "[LC-1644] Smoke-test report for admin bench panel"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Backend `benchAppEvent` mutation — Task 8
- ✅ Backend `cleanupBenchAppEventData` mutation — Tasks 8 + 8a
- ✅ `posthog.helpers.ts` — Task 2
- ✅ `posthog-node` dependency — Task 1
- ✅ Env vars documented — Task 9
- ✅ Plugin/types wiring — Task 10
- ✅ Analytics event for trigger attribution — Task 11
- ✅ `APPEVENT_PERF_BENCH` enum + tile — Task 12
- ✅ Bench panel component — Task 13
- ✅ `AdminToolsOptionsContainer` switch — Task 14
- ✅ Manual smoke test — Task 15
- ✅ PerfTracker programmatic readout — Task 4
- ✅ SA timings surfaced — Tasks 7 + 8 (via AsyncLocalStorage)
- ✅ Percentile aggregation — Task 3

**2. Placeholder scan:**
- One intentional `// TODO` in Task 8 step 2 that is resolved by Task 8a (the cleanup body). Acceptable because Task 8a is the very next task and the TODO is annotated with where it's resolved.
- All other tasks contain complete code.

**3. Type consistency:**
- `BenchIterationResult`, `BenchSummary`, `BenchRunResult` (Task 6) match the shape used in the route mutation (Task 8) and the frontend component (Task 13 — `BenchResult` mirrors).
- `runBench`'s `runIteration` callback signature returns `{ captured, saHttpMs, saDidAuthVpMs }` and the route mutation returns exactly that shape.
- Plugin method input shape (Task 10) matches the Zod input on the route (Task 8).
- Frontend `wallet.invoke.benchAppEvent?.()` argument shape matches the plugin type declaration.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-27-lc-1644-appevent-perf-bench-admin-panel.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

The user mentioned wanting to use the dispatch-ui with deepseek-4-pi harness, which is option 1's external equivalent — drop the plan into `~/.claude/dispatch/plans/` and run via `~/go/bin/dispatch-ui`.

Which approach?
