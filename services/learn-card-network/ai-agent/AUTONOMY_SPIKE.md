# Layer 4 Autonomous-Execution Spike Findings

Measured on 2026-07-15 against the local LearnCard development stack. This document describes an internal development spike, not a production-safe autonomy system.

## Result

The spike proved that a user-defined recurring schedule can invoke the same full LearnCard Agent runtime used by authenticated chat, await the post-run retrospective, write a learner-facing Assistant Inbox card, and persist an encrypted, DID-scoped audit record. The development dispatcher remained outside the HTTP service and selected only explicitly allowlisted fixture DIDs.

The spike also confirmed the boundary that prevents this implementation from going to production unchanged: a full agent can call every configured tool, including wallet and outbound-effect tools. Schedule-level deduplication prevents duplicate occurrences, but it cannot make a tool effect idempotent after a partial failure. Production requires capability policy, tool-level idempotency, replay controls, privacy enforcement, observability, cost controls, and an owned delivery policy.

## Capability policy

-   Schedules are absent by default and created by the user.
-   Every schedule has its own name, task prompt, enabled state, minute-precision local time, selected weekdays, and IANA timezone.
-   A user can create up to 10 schedules. Raw cron, seconds, monthly rules, intervals, and one-off jobs are intentionally not user-facing.
-   The global spike worker is separately disabled by default, development-only, and restricted to the exact DIDs in `AI_AGENT_AUTONOMY_DEV_DIDS`.
-   Once an allowed schedule is due, it invokes the full agent. There is no reduced autonomous tool set. The run can use every configured base tool, per-user memory tool and skill, ConsentFlow-approved data, Assistant feed tool, web search provider, and LearnCard wallet method. It can update memory and perform wallet or outbound effects when the model chooses those tools.
-   The post-response retrospective is awaited. A run is not successful until the full response path, card delivery or fallback, trace persistence, and retro pass complete.
-   Delivery in this spike is limited to an in-app Assistant card. It does not send push, email, or SMS notifications and does not implement quiet hours.
-   A due occurrence is advanced before execution and is never retried automatically after `failed` or `abandoned`. This avoids blind replay of possibly irreversible effects, but it does not solve effect-level idempotency.

## Implementation exercised

### Schedule contract and persistence

The app manages schedules through DID-authenticated, matching-owner routes:

-   `GET /api/users/:did/assistant-schedules`
-   `POST /api/users/:did/assistant-schedules`
-   `PATCH /api/users/:did/assistant-schedules/:id`
-   `DELETE /api/users/:did/assistant-schedules/:id`

Croner calculates the next occurrence from the restricted weekday/time/timezone contract. The user does not author cron. `advanceNextRun` conditionally matches the exact prior `nextRunAt`, so one occurrence is claimed once and missed intervals collapse to one catch-up occurrence.

Mongo collections:

-   `agentAutonomySchedules`: queryable owner, schedule, enabled, cron, timezone, and next-run metadata; DAG-JWE-encrypted `name` and `prompt`.
-   `agentAutonomousRuns`: unique owner/schedule/scheduled-for occurrence, lease metadata, status, encrypted success summary, and encrypted sanitized failure text.
-   `agentAutonomousLeases`: one active owner lease across processes. Active runs renew both owner and run leases; terminal writes are fenced by lease ID and unexpired lease time.

### Full-agent execution

`createAgentServiceRuntime()` is shared by HTTP and the worker. A scheduled request receives the same configured provider, base tools, ConsentFlow runtime, memory skills/tools, Assistant feed runtime, profile prompt, model, trace, and awaited `runAfterResponse` callback as an interactive request. Scheduled cards carry `origin: 'autonomous'` and the source agent run ID; interactive cards carry `origin: 'interactive'`.

If a text-only completion creates no card, the runner writes one deterministic fallback message card. The fallback uses an occurrence-derived deduplication key, so it does not create multiple cards for the same run.

### Development worker boundary

The Express process never starts the scheduler and exposes no run-now/admin route. The only worker entrypoints are:

```bash
bun run --cwd services/learn-card-network/ai-agent autonomy:once
bun run --cwd services/learn-card-network/ai-agent autonomy:dev
```

`autonomy:once` executes one bounded manual cycle and exits. `autonomy:dev` executes a startup cycle, schedules the next cycle only after the prior cycle completes, and drains an active cycle on `SIGINT`/`SIGTERM` before closing Mongo.

The worker fails configuration validation unless all of the following are true: development environment, explicit fixture DID allowlist, Mongo URI, agent wallet seed, OpenAI key, self-improvement enabled, poll interval at least 1 second, run cap from 1 through 10, and a lease duration longer than the poll interval.

## Local setup

The service used the existing local MongoDB at `mongodb://localhost:27017`, local LearnCard network/cloud services, a non-production agent seed, OpenAI `gpt-5.5`, enabled self-improvement, and the Brave web-search adapter. Secret values are intentionally omitted.

```dotenv
NODE_ENV=development
AI_AGENT_AUTONOMY_DEV_ENABLED=true
AI_AGENT_AUTONOMY_DEV_DIDS=did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuLsg7Y5fNnYw5wF3p
AI_AGENT_AUTONOMY_DEV_POLL_INTERVAL_MS=30000
AI_AGENT_AUTONOMY_DEV_MAX_RUNS_PER_CYCLE=3
AI_AGENT_AUTONOMY_DEV_LEASE_MS=900000
AI_AGENT_SELF_IMPROVEMENT_ENABLED=true
AI_AGENT_MONGO_URI=mongodb://localhost:27017
AI_AGENT_WEB_SEARCH_PROVIDER=brave
```

The primary current-information schedule was:

```json
{
    "ownerDid": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuLsg7Y5fNnYw5wF3p",
    "id": "8e20cd35-bcc7-431c-a665-efc4efffd3ba",
    "name": "Graceful Drain Smoke",
    "prompt": "Search the web for two current AI headlines, then create one concise Assistant Inbox card summarizing them.",
    "enabled": true,
    "timeOfDay": "00:00",
    "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
    "timezone": "UTC",
    "cron": "0 0 * * 0,1,2,3,4,5,6",
    "scheduledFor": "2026-07-15T21:09:57.987Z"
}
```

The raw Mongo schedule retained queryable cadence metadata while both `name` and `prompt` were DAG-JWE envelopes.

## Observed autonomous run

The startup worker selected exactly the due fixture schedule and completed one full-agent occurrence:

```json
{
    "triggerSource": "startup",
    "dueCount": 1,
    "ownerDid": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuLsg7Y5fNnYw5wF3p",
    "scheduleId": "8e20cd35-bcc7-431c-a665-efc4efffd3ba",
    "scheduledFor": "2026-07-15T21:09:57.987Z",
    "status": "succeeded",
    "runId": "2243a25f-68d3-4bd6-bad6-a161109e81ba"
}
```

The occurrence started at `2026-07-15T21:09:59.586Z` and completed at `2026-07-15T21:10:28.902Z`. Its persisted summary was encrypted at rest and decrypted to:

```json
{
    "agentRunId": "66a50eee-5b80-4efe-83e6-bca0f0d154c0",
    "cardIds": ["7f803164-e88e-4069-9800-fb790ba64cc2"],
    "retroCompleted": true,
    "toolNames": ["webSearch", "recordLearnCardAssistantCard"]
}
```

The live Brave adapter was used, not the mock. The trace recorded eight bounded Brave searches: four returned normalized results, four returned the bounded provider error `webSearch failed for provider brave.`, and no raw provider body or secret entered the trace. The successful results were enough to produce the Assistant card `AI headlines: Copilot upgrade + chip demand surge` with `origin: 'autonomous'` and `sourceRunId: '66a50eee-5b80-4efe-83e6-bca0f0d154c0'`.

The full agent deliberately did not write durable memory. Its final response said the one-time news summary was not a durable preference or profile fact. The DID-scoped memory manifest remained present with zero active/proposed/archived docs. A run trace was persisted and the awaited retro completed at `2026-07-15T21:10:28.888Z` with `action: 'noop'`, `status: 'noop'`, and the same one-time-information rationale. This is the desired conservative memory behavior.

Focused tests separately prove that all interactive tools are present in the scheduled provider call and that a scheduled memory write and retro persist only for the target DID. The smoke run proves live provider, web search, Assistant card, trace, and retro orchestration; it does not claim that every available tool was invoked.

## Concurrency, isolation, lifecycle, and recovery

### Duplicate occurrence contention

Two `autonomy:once` processes were started concurrently against one due owner/schedule occurrence. Exactly one process reported `dueCount: 1` and `status: 'succeeded'`; the other reported `dueCount: 0` with no results because the first process atomically advanced the schedule before the second global selection. Mongo contained one unique occurrence and one Assistant card. Repository and scheduler race tests also exercised the owner-lease `contended` path directly.

### Owner isolation

One manual cycle selected due schedules for two explicitly configured fixture DIDs. It reported `dueCount: 2`, one successful result per owner:

-   owner one run `315c9f97-07f6-4faa-8990-fb6c0d68b199`, card `Owner One Isolation Confirmed`;
-   owner two run `f6d6340a-fd50-43e1-9a75-c2758cc0959c`, card `Owner two isolation confirmed`.

Each card, trace, retro, schedule, and run record remained under its own owner DID.

### Active-cycle drain

A worker started an intentionally slower live-search schedule at `2026-07-15T22:18:16.667Z`. `SIGTERM` arrived while that cycle was in flight. The worker logged `received SIGTERM; draining active work`, allowed the occurrence to finish successfully at `2026-07-15T22:18:42.654Z`, logged the completed startup summary, then logged `worker stopped`. No second interval cycle began. The process supervisor reported exit 143 because termination originated from `SIGTERM`; the application lifecycle nevertheless reached its explicit drained/stopped log path.

### Expired lease recovery

A scripted running record had its owner and run leases moved into the past. The next `autonomy:once` recovered one expired run and 13 stale lease fixtures. Run `6101126e-70e8-4379-98dd-820c0db61f4a` became `abandoned` with no success summary or error payload. Its schedule had already advanced to `2026-07-16T00:00:00.000Z`, so the abandoned occurrence was not replayed.

Lease-renewal and terminal-fencing tests additionally prove:

-   only the current lease holder can renew;
-   run and owner leases must both renew before expiry;
-   loss of either renewal aborts the full agent and fails the occurrence;
-   a late success/failure write after lease expiry is rejected;
-   active leases are removed after terminal completion.

## Assistant schedule UI

The actual `AssistantSchedulesCard` component was mounted in the running LearnCard App Vite bundle with authenticated API calls intercepted by a stateful fixture. Chromium verified create, refresh-equivalent list rendering, edit, disable, delete confirmation, and empty state. The desktop run used a 1440 by 1000 viewport. The mobile form used a 390 by 844 viewport, rendered all controls without horizontal overflow (`scrollWidth === innerWidth === 390`), and retained the focused schedule task/profile copy separation.

The full local app build passed. A real signed-in route was not used for the UI mutation check because the local browser fixture account did not have a reusable authenticated app session; DID-auth schedule routes are covered by server route tests and API client tests.

## Verification

Observed commands and results:

-   `bun vitest run` in `services/learn-card-network/ai-agent`: 19 files, 113 tests passed.
-   Focused cancellation/fencing suite: 6 files, 37 tests passed.
-   Final expiry-fencing subset: 2 files, 12 tests passed.
-   `bun run build` in `services/learn-card-network/ai-agent`: passed.
-   LearnCard Assistant API/helper unit suite: 2 files, 16 tests passed. The existing unrelated missing `@tsconfig/svelte/tsconfig.json` warning remained.
-   `bun run build` in `apps/learn-card-app`: passed; existing large-chunk warnings remained.
-   Live Mongo/OpenAI/Brave smoke: scheduled run, autonomous card, trace, retro, encryption, duplicate suppression, two-owner isolation, signal drain, and abandonment observed as described above.
-   Trigger.dev follow-up on 2026-07-17: `bun vitest run` passed 20 files/122 tests,
    `bunx tsc --noEmit -p tsconfig.build.json` passed, and `bun run build` passed.
-   Live Trigger.dev DEV schedule CRUD and execution passed: create/update synchronized one imperative
    schedule, the final Node `medium-1x` occurrence completed in 9.2 seconds, the encrypted Mongo run
    reached `succeeded` with `trigger` provenance, one autonomous Assistant card was linked to the
    agent run, trace plus one `noop` retro result persisted, and `nextRunAt` advanced one day.
    Schedule/provider and Mongo smoke artifacts were deleted afterward.

## Trigger.dev development integration and production evaluation

The spike now includes a development-only Trigger.dev v4 path alongside the local poller.
Authenticated schedule CRUD synchronizes imperative schedules using project-scoped,
environment-prefixed deduplication keys. A thin scheduled dispatch task creates a globally
idempotent occurrence and enqueues the full-agent execution task with per-owner concurrency 1.
The execution task retains the Mongo occurrence and renewable lease fences, re-checks schedule
existence/enabled state, and records `trigger` provenance. Configuration rejects this integration
outside `NODE_ENV=development`; it is not a production enablement.

Live development verification selected Node plus `medium-1x` for the execution task. The first Bun
worker could not load `@learncard/didkit-plugin-node`; the default 0.5 GB Node worker then exhausted
its V8 heap. Externalizing the native DidKit package and sizing the full agent at `medium-1x`
resolved both failures. The live run also exposed a missing `await` before Mongo cleanup; the task
now awaits the scheduler result before closing its client and throws when that result is `failed`
so Trigger's terminal status matches the encrypted Mongo audit record.

Official documentation confirms:

-   one scheduled task can have many imperative schedules, each with IANA timezone/DST handling, enable/disable/edit/delete operations, an optional `externalId`, and a project-scoped `deduplicationKey`;
-   dynamic per-user schedules can share `externalId: ownerDid`;
-   a `concurrencyKey` creates a per-key queue, and `concurrencyLimit: 1` serializes actively executing runs for that owner;
-   task idempotency keys return the existing run for duplicates, default to a 30-day TTL, and are scoped to task and environment; v4.3.1 raw strings default to run scope inside tasks, so production code should create explicit global keys where needed;
-   deployed tasks can execute on Bun 1.3.3, but the Trigger.dev CLI still requires Node and some OpenTelemetry instrumentation does not work under Bun;
-   self-hosting requires ownership of the webapp, Redis, Postgres, workers, updates, security, scaling, uptime, and data integrity. It lacks Cloud warm starts, autoscaling, checkpoints, and dedicated support.

Remaining production proof:

-   one Trigger scheduled task with many imperative schedules;
-   `externalId: ownerDid`;
-   immutable schedule deduplication key `${environment}:${ownerDid}:${scheduleId}` because schedule dedupe keys are project-scoped rather than environment-scoped;
-   `concurrencyKey: ownerDid` and `concurrencyLimit: 1`;
-   an explicit occurrence idempotency key derived from environment, owner DID, schedule ID, and scheduled timestamp, plus the existing Mongo unique occurrence record as a second fence;
-   explicit retry/dead-letter/manual-replay policy only after tool-level effect idempotency exists;
-   a Cloud versus self-hosted/platform-owned decision covering credentials, deployment lifecycle, data residency, worker scaling, Redis/Postgres ownership, Bun/Node operational split, retention, and incident response.

Primary sources:

-   [Trigger.dev scheduled tasks](https://trigger.dev/docs/tasks/scheduled)
-   [Trigger.dev queues and concurrency](https://trigger.dev/docs/queue-concurrency)
-   [Trigger.dev idempotency](https://trigger.dev/docs/idempotency)
-   [Trigger.dev Bun support](https://trigger.dev/docs/guides/frameworks/bun)
-   [Trigger.dev self-hosting overview](https://trigger.dev/docs/self-hosting/overview)

## Production follow-up ticket drafts

Remote Jira creation was unavailable during the spike: no Jira/Atlassian CLI or API credentials were present, and the Atlassian browser session required interactive login. The following drafts are intentionally unassigned; no Jira keys are fabricated.

### Production autonomous scheduler and schedule registry

**Problem**

The dev-only Mongo polling worker has no production deployment owner, durable orchestration backlog, schedule-provider synchronization, migration plan, or support policy. Production needs a decision between Trigger.dev Cloud, self-hosted Trigger.dev, and an internally owned platform scheduler.

**Acceptance criteria**

-   Record an architecture decision comparing Trigger.dev Cloud, self-hosted Trigger.dev, and the platform scheduler across credentials, data residency, cost, uptime, deployment lifecycle, Redis/Postgres ownership, worker scaling, and incident response.
-   Prove dynamic per-user schedule create/update/disable/delete and reconciliation using immutable `${environment}:${ownerDid}:${scheduleId}` deduplication keys.
-   Preserve IANA timezone and daylight-saving behavior, missed-run policy, pause/resume, max backlog, and one occurrence per owner/schedule/timestamp.
-   Prove `externalId: ownerDid`, owner concurrency limit 1, and explicit occurrence idempotency against duplicate delivery.
-   Define migration and rollback for `agentAutonomySchedules` and `agentAutonomousRuns` spike records.
-   Assign service, deployment, on-call, and data-retention ownership.

**Dependencies**

Effect-safety ticket, privacy enforcement ticket, observability/cost ticket, infrastructure/security review. Link LC-1880 for current-information search and LC-1883 for specialized job/work tools.

### Autonomous effect safety and idempotency

**Problem**

A full agent may complete a wallet or outbound effect before its process fails. Schedule/run deduplication prevents duplicate occurrences but cannot prove that each tool effect happened once.

**Acceptance criteria**

-   Inventory autonomous tools and classify read-only, reversible, approval-required, and irreversible effects.
-   Add per-tool capability and consent policy with explicit user UX for autonomous wallet/outbound actions.
-   Add stable effect idempotency keys and persisted effect receipts for wallet writes, credential sends, feed writes, and external calls.
-   Define lease renewal/fencing, cancellation, timeout, retry, dead-letter, manual replay, and operator override semantics.
-   Prove replay after every partial-failure boundary without duplicating irreversible effects.
-   Complete threat modeling and security review, including LC-1882 controls.

**Dependencies**

LC-1882, production scheduler decision, ConsentFlow/privacy enforcement, tool-owner participation.

### Autonomous observability and cost controls

**Problem**

The spike emits bounded CLI summaries and encrypted Mongo traces but has no production metrics, alerts, budgets, retention controls, or concurrency/load evidence.

**Acceptance criteria**

-   Emit metrics for due lag, queue delay, run duration/status, contention, abandonment, lease renewal failure, tool/provider latency/failure, cards, retros, and effect receipts.
-   Correlate scheduler occurrence, agent run, tool calls, Assistant card, and retro with owner-safe identifiers.
-   Add alerts and dashboards for stuck queues, failure/abandonment rates, lease loss, provider limits, budget exhaustion, and delivery failures.
-   Enforce per-run, per-user/day, provider, tenant, and global token/tool/cost limits with visible user/operator outcomes.
-   Define encrypted trace/run/card retention, deletion, and audit-access policy.
-   Add real Mongo multi-process contention, recovery, and load integration tests.

**Dependencies**

Production scheduler architecture, logging/privacy review, finance/provider budgets, Mongo capacity planning.

### Proactive delivery and anti-noise policy

**Problem**

The spike guarantees only an in-app card. It has no push/email/SMS policy, quiet hours, frequency caps, duplicate-story suppression, or user-visible run history.

**Acceptance criteria**

-   Define per-schedule delivery channels and defaults, including in-app-only behavior when no external channel is approved.
-   Add timezone-aware quiet hours, per-user/channel caps, priority rules, and digest behavior.
-   Prevent duplicate cards and already-seen news/recommendations across retries, schedules, and delivery channels.
-   Feed read/dismiss/thumbs-down behavior into suppression without hiding audit history.
-   Add user-visible schedule run history, delivery status, failure reason, and pause/delete controls.
-   Prove channel retries and provider failures do not duplicate notifications.

**Dependencies**

Product/design policy, notification platform ownership, privacy/consent enforcement, observability and idempotency tickets.

### Server-side proactive consent/privacy enforcement

**Problem**

The dev worker is restricted by a fixture allowlist, but production non-interactive execution needs server-authoritative AI eligibility, minor/privacy controls, fresh ConsentFlow authorization, revocation handling, and operator access policy.

**Acceptance criteria**

-   Enforce AI enablement, minor status, tenant policy, and account eligibility on the server before every non-interactive occurrence.
-   Validate ConsentFlow contract freshness, granted scopes, revocation, credential availability, and least-privilege tool access at run time.
-   Stop or constrain a run when consent/privacy state changes while queued or executing.
-   Provide user export/delete for schedules, run history, cards, traces, retros, memories, and effect receipts.
-   Define audited operator authorization for inspection, pause, replay, and deletion without exposing decrypted user content broadly.
-   Complete privacy, child-safety, data-retention, and security review.

**Dependencies**

Privacy Preferences/Age-Gate owners, ConsentFlow owners, production scheduler, effect safety, observability, legal/security review. Link LC-1880 and LC-1883 rather than duplicating search/tool scope.
