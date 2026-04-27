# LC-1644 AppEvent Perf Bench Admin Panel — Design

**Ticket:** [LC-1644](https://welibrary.atlassian.net/browse/LC-1644)
**Branch:** `feat/lc-1644-appevent-perf`
**Date:** 2026-04-27
**Companion notes:** [[2026-04-27-lc-1644-baseline-benchmark-findings]] (Obsidian) — context on why this bench exists.

## Goal

Run the `handleSendCredentialEvent` flow N times against staging (real Neo4j, real SA Lambda) from inside the running learn-card-app, with per-phase timing emitted to PostHog. This replaces the current ngrok-based local benchmark for measuring backend perf — those numbers were unreliable because only the SA call hit the real network; Neo4j and `sendBoost` ran against local Docker.

## Non-goals

- Production-wide PostHog telemetry on every credential issuance. Bench-only emission for now; production rollout is a separate ticket.
- The full Partner Connect iframe / claim modal flow ("Option A" from brainstorming). Out of scope for v1; structure leaves room for it later.
- Frontend (claim modal) timing measurement. Backend phases only.
- Automated cleanup. The user manually creates the bench recipient profile and clicks a "Cleanup Bench Data" button between runs.

## Architecture

```
[Admin Tools Panel]                    [brain service]
AppEvent Perf Bench tile               appStore.benchAppEvent
  │  Listing ID                          │  ① isAppStoreAdmin gate
  │  Recipient profile ID                │  ② warmup loop (discarded)
  │  Iterations / Warmup                 │  ③ measured loop:
  │  Run label                           │     PerfTracker.start()
  │  [Run Bench]                         │     → handleSendCredentialEvent
  │  [Cleanup Bench Data]                │     → emit posthog event per iter
  │  [Copy Results JSON]                 │  ④ aggregate p50/p95/p99
  │                                      │  ⑤ emit posthog summary event
  │  results table                  ◀── return { perIteration, summary }
  │  PostHog deep-link
```

### Data flow

1. Admin clicks **Run Bench** → frontend calls `wallet.invoke.benchAppEvent({ iterations, warmup, listingId, recipientProfileId, runLabel })`
2. Brain service validates admin via `isAppStoreAdmin(ctx.user.profile.profileId)`; rejects with `FORBIDDEN` otherwise
3. Brain service runs `warmup` discarded iterations to amortize connection setup, then `iterations` measured iterations
4. Each measured iteration: wrap `handleSendCredentialEvent` in `PerfTracker`, capture timings, emit `bench.appevent.iteration` to PostHog with all phase durations + metadata
5. After loop: aggregate p50/p95/p99 per phase, emit `bench.appevent.run` summary event
6. Return aggregated stats + per-iteration array to the frontend
7. Frontend displays results inline + emits `bench.appevent.run_triggered` from the browser for "who ran this" attribution

## Components

### Frontend

**Files added:**
- `apps/learn-card-app/src/pages/adminToolsPage/appevent-perf-bench/AdminToolsAppEventPerfBenchOption.tsx`

**Files modified:**
- `apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/admin-tools.helpers.ts` — add `APPEVENT_PERF_BENCH` enum value + array entry under `adminToolOptions`
- `apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/AdminToolsOptionsContainer.tsx` — add switch case rendering the new option component
- `apps/learn-card-app/src/analytics/events.ts` (or equivalent) — declare `bench.appevent.run_triggered` event type for typed `analytics.track`

**Pattern:** mirrors `AdminToolsGuardianCredentialTestOption` exactly — local state machine (`idle | running | done | error`), Tailwind classes already used in that component, `useToast` for errors, `wallet.invoke.*` for tRPC calls. No new abstractions.

### Backend

**Files added:**
- `services/learn-card-network/brain-service/src/helpers/posthog.helpers.ts` — `getPostHogClient()` singleton + `capture(event, properties)` helper. No-op if `POSTHOG_API_KEY` unset (so local dev / CI doesn't break).

**Files modified:**
- `services/learn-card-network/brain-service/src/routes/app-store.ts` — add two new tRPC procedures: `benchAppEvent` mutation, `cleanupBenchAppEventData` mutation. Both use the existing `isAppStoreAdmin` gate.
- `services/learn-card-network/brain-service/package.json` — add `posthog-node` dependency.
- `services/learn-card-network/brain-service/.env.example` — document `POSTHOG_API_KEY` and `POSTHOG_HOST` env vars.

**`benchAppEvent` mutation contract:**

```ts
input: {
  listingId: string         // existing AppStoreListing
  recipientProfileId: string // existing Profile (the bench recipient)
  iterations: number         // 1 ≤ N ≤ 100
  warmup: number             // 0 ≤ W ≤ 10
  runLabel?: string          // free-form annotation, defaults to ISO timestamp
}

output: {
  runId: string             // uuid
  perIteration: Array<{ iteration: number; total_ms: number; ...phase fields }>
  summary: {
    iteration_count: number
    errors: number
    total: { p50: number; p95: number; p99: number }
    sa_issue: { p50: number; p95: number; p99: number }
    sa_http: { p50: number; p95: number; p99: number }
    parallel_reads: { p50: number; p95: number; p99: number }
    owner_and_sa_reads: { p50: number; p95: number; p99: number }
    log_activity_and_send_boost: { p50: number; p95: number; p99: number }
  }
  posthogDashboardUrl?: string  // deep-link if POSTHOG_HOST is set
}
```

**`cleanupBenchAppEventData` mutation contract:**

```ts
input: { recipientProfileId: string }

output: {
  credentialsDeleted: number
  notificationsDeleted: number
  activityEntriesDeleted: number
}
```

Implementation reuses existing delete mutations / Cypher queries — no new graph operations.

## PostHog event schemas

Per-iteration event:

```ts
'bench.appevent.iteration': {
  run_id: string
  iteration: number
  total_ms: number
  parallel_reads_ms: number
  owner_and_sa_reads_ms: number
  sa_issue_ms: number
  sa_http_ms: number
  sa_didauthvp_ms: number
  log_activity_and_send_boost_ms: number
  was_first_iteration: boolean
  recipient_profile_id: string
  listing_id: string
  commit_sha: string           // process.env.GIT_SHA
  env: 'staging' | 'production' | 'development'
  run_label: string
}
```

Run-summary event:

```ts
'bench.appevent.run': {
  run_id: string
  iteration_count: number
  errors: number
  total_p50: number
  total_p95: number
  total_p99: number
  sa_issue_p50: number
  sa_issue_p95: number
  sa_issue_p99: number
  // ...same for parallel_reads, owner_and_sa_reads, log_activity_and_send_boost
  commit_sha: string
  env: string
  run_label: string
}
```

Frontend trigger event (for attribution):

```ts
'bench.appevent.run_triggered': {
  run_id: string
  iterations: number
  warmup: number
  listing_id: string
  recipient_profile_id: string
  triggered_by_profile_id: string
}
```

## UI

**Tile in Admin Tools panel:**
- Label: "AppEvent Perf Bench"
- Description: "Run the sendCredential APP_EVENT flow N times against staging and capture per-phase timings in PostHog."
- Action label: "Open Perf Bench"

**Form fields (in panel):**

| Field | Type | Default | Validation |
|---|---|---|---|
| Listing ID | text | empty | required, non-empty string |
| Recipient profile ID | text | empty | required, non-empty string |
| Iterations | number | 10 | 1 ≤ N ≤ 100 |
| Warmup iterations | number | 2 | 0 ≤ W ≤ 10 |
| Run label | text | `bench-<ISO timestamp>` | optional |

**Buttons:**
- **Run Bench** — primary green, disabled while running
- **Cleanup Bench Data** — secondary red, asks `window.confirm` before firing
- **Copy Results JSON** — appears after a successful run, copies the full result object to clipboard

**Results display:** simple table with phase × percentile cells. If `posthogDashboardUrl` is returned, render a "View in PostHog →" link beneath the table.

## Auth

- Backend: both new mutations gated by `isAppStoreAdmin(ctx.user.profile.profileId)` → `TRPCError({ code: 'FORBIDDEN' })` if the caller isn't on `APP_STORE_ADMIN_PROFILE_IDS`.
- Frontend: tile appears for every user (no client-side gate). Non-admins clicking it will get the FORBIDDEN error from the backend, surfaced via `useToast`. This matches existing admin-tools behavior — gating is server-side, not URL-based.

## Configuration

New env vars on the brain service:
- `POSTHOG_API_KEY` (required for emission; if unset, helper is a no-op and bench still works, just doesn't emit)
- `POSTHOG_HOST` (optional, defaults to `https://us.i.posthog.com`)
- `GIT_SHA` (optional, used as `commit_sha` on events; falls back to `'unknown'`)

These need to be set in staging deploy config. Bench works without them but emits nothing.

## Error handling

- Iteration-level errors (one of N iterations throws): caught, logged, counted in `summary.errors`, that iteration's timings are excluded from percentiles. The run continues.
- Whole-run errors (auth, listing not found, recipient not found): thrown as `TRPCError`, frontend catches and toasts.
- PostHog emission failures: caught and logged, never block the response.

## Testing

- Unit test for the percentile aggregation helper (deterministic input → known p50/p95/p99).
- Unit test for `posthog.helpers.ts` no-op behavior when `POSTHOG_API_KEY` is unset.
- Manual integration test on staging: seed a bench profile + listing, run with iterations=10, verify (a) results render, (b) PostHog events arrive, (c) cleanup button removes data.

No e2e Playwright test for v1 — the feature is admin-gated and the integration test above gives sufficient confidence.

## Out-of-scope (intentional)

These were considered and explicitly deferred:

- **Option A — full Partner Connect iframe flow.** Re-measuring perceived UX through the iframe + claim modal. Adds ~2x implementation work and isn't what we need first. Add later as a sibling tile if the backend numbers prove insufficient.
- **Production-wide PostHog telemetry.** Use the same `posthog.helpers.ts` from production code paths to capture real user latency continuously. Separate ticket; needs a sampling story and namespace conventions before turning on.
- **Automated cleanup.** Per-run delete-cascade. YAGNI for v1 — manual button is fine.
- **Provisioned concurrency / EventBridge ping for SA Lambda warm-keeping.** Discussed in [stretch followup](docs/superpowers/followups/2026-04-17-lc-1644-stretch-backend.md). Independent of this bench.

## Open questions

None — all locked during brainstorming.
