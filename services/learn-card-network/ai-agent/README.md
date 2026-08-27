# LearnCard AI Agent Service

Production-capable request/response AI agent service for LearnCard Network.

## Run Locally

```bash
cp services/learn-card-network/ai-agent/.env.example services/learn-card-network/ai-agent/.env
bun run --cwd apps/learn-card-app dev
```

Then open `http://localhost:3000`. The agent service is exposed at `http://localhost:4300`
by the LearnCard App compose stack.

The LearnCard App local compose stack starts MongoDB and passes it to the agent. The
agent can also run against a separate MongoDB with `AI_AGENT_MONGO_URI` or `MONGO_URI`.
The service can boot without `OPENAI_API_KEY`, but chat and ConsentFlow contract creation
return 503 until a provider key is configured.

To run the agent outside compose, use `bun run --cwd services/learn-card-network/ai-agent dev`.
The development script runs `src/index.ts` directly with Bun watch mode; it does not rebuild
workspace packages first.

## Environment

| Variable                                      | Default                                                                    | Purpose                                                                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                              | none                                                                       | API key for the first provider adapter.                                                                                                         |
| `AI_AGENT_MODEL`                              | `gpt-5.6-luna`                                                             | Model name passed to the provider. Luna tool calls use Chat Completions with `reasoning_effort: none`, as required by the provider.             |
| `AI_AGENT_WALLET_SEED`                        | `LEARNCARD_AGENT_SEED` or `SEED`                                           | Seed used by LearnCard wallet tools and Mongo persistence encryption through DIDKit DAG-JWE. Required whenever Mongo persistence is configured. |
| `AI_AGENT_CLOUD_URL`                          | `LEARN_CLOUD_URL` or `https://cloud.learncard.com/trpc`                    | LearnCloud tRPC endpoint for the agent wallet.                                                                                                  |
| `AI_AGENT_NETWORK_URL`                        | `LEARNCARD_NETWORK_URL` or `https://network.learncard.com/trpc`            | LearnCard Network tRPC endpoint for the agent wallet.                                                                                           |
| `AI_AGENT_PORT`                               | `PORT` or `3000`                                                           | HTTP port.                                                                                                                                      |
| `AI_AGENT_TRUST_PROXY_HOPS`                   | `0`                                                                        | Number of known reverse-proxy hops trusted when resolving client IPs for baseline and public-endpoint rate limits.                              |
| `AI_AGENT_MAX_TOOL_ROUNDS`                    | `8`                                                                        | Maximum tool-call rounds within one request. Integer from `1` through `20`.                                                                     |
| `AI_AGENT_RUN_TIMEOUT_MS`                     | `120000`                                                                   | Wall-clock limit for one agent request. Allowed range: 5 seconds through 10 minutes.                                                            |
| `AI_AGENT_MAX_OUTPUT_TOKENS`                  | `4096`                                                                     | Maximum output tokens passed to each model call.                                                                                                |
| `AI_AGENT_MAX_RUN_TOKENS`                     | `50000`                                                                    | Maximum measured input + output tokens across a run.                                                                                            |
| `AI_AGENT_MAX_RUN_COST_USD`                   | `1`                                                                        | Maximum estimated model cost across a run.                                                                                                      |
| `AI_AGENT_INPUT_TOKEN_COST_USD_PER_MILLION`   | none                                                                       | Current model input-token price used for cost telemetry and limits. Required in production.                                                     |
| `AI_AGENT_OUTPUT_TOKEN_COST_USD_PER_MILLION`  | none                                                                       | Current model output-token price used for cost telemetry and limits. Required in production.                                                    |
| `AI_AGENT_METRICS_NAMESPACE`                  | `LearnCard/AIAgent`                                                        | Namespace used for direct CloudWatch `PutMetricData` publishing.                                                                                |
| `AI_AGENT_AUTH_DOMAIN`                        | none                                                                       | Expected DID Auth domain. Required in production; local dev falls back to request origin.                                                       |
| `AI_AGENT_AUTH_CHALLENGE_TTL_MS`              | `300000`                                                                   | DID Auth challenge lifetime in milliseconds.                                                                                                    |
| `AI_AGENT_ENCRYPTION_KEY_ID`                  | `agent-learncard-dag-jwe-v1`                                               | Versioned key identifier stored in encrypted Mongo field envelopes.                                                                             |
| `AI_AGENT_DEBUG_ENABLED`                      | `true` outside `NODE_ENV=production`                                       | Enables debug endpoints. Production refuses to start unless this is `false`.                                                                    |
| `AI_AGENT_DEBUG_TOKEN`                        | none                                                                       | Optional in local development. When set, send it as `X-AI-Agent-Debug-Token` for debug endpoints.                                               |
| `AI_AGENT_CONSENT_FLOW_CONTRACT_URI`          | none                                                                       | ConsentFlow contract URI used for user-context data. Required on production network.                                                            |
| `AI_AGENT_CONSENT_FLOW_APP_URL`               | `https://learncard.app`                                                    | Base app URL used to build consent links.                                                                                                       |
| `AI_AGENT_CONSENT_FLOW_DATA_PAGE_SIZE`        | `100`                                                                      | Page size when preloading consented user data.                                                                                                  |
| `AI_AGENT_CONSENT_FLOW_DATA_MAX_PAGES`        | `10`                                                                       | Maximum pages to read for one user-data preload.                                                                                                |
| `AI_AGENT_CONSENT_FLOW_CREDENTIAL_READ_LIMIT` | `50`                                                                       | Maximum consented credential URIs to hydrate with `read.get`.                                                                                   |
| `AI_AGENT_MONGO_URI`                          | `MONGO_URI`; local Mongo only outside production when a wallet seed exists | MongoDB connection URI. Production requires explicit Mongo.                                                                                     |
| `AI_AGENT_MONGO_DB_NAME`                      | `MONGO_DB_NAME` or `learn-card-ai-agent`                                   | MongoDB database name.                                                                                                                          |
| `AI_AGENT_SELF_IMPROVEMENT_ENABLED`           | `true` outside `NODE_ENV=production`                                       | Enables per-DID dynamic docs, trace persistence, and post-response retro updates.                                                               |
| `AI_AGENT_RETRO_MODEL`                        | `AI_AGENT_MODEL`                                                           | Model used by the background retro agent.                                                                                                       |
| `AI_AGENT_RETRO_MAX_TRACE_CHARS`              | `24000`                                                                    | Maximum serialized run-trace size sent to the retro agent.                                                                                      |
| `AI_AGENT_AUTONOMY_DEV_ENABLED`               | `false`                                                                    | Enables the separate development autonomy worker. Rejected outside `NODE_ENV=development`; never starts from the HTTP service.                  |
| `AI_AGENT_AUTONOMY_DEV_DIDS`                  | none                                                                       | Comma-separated exact test DIDs allowed by the local development worker.                                                                        |
| `AI_AGENT_AUTONOMY_DEV_POLL_INTERVAL_MS`      | `30000`                                                                    | Delay after one completed development cycle before the next cycle starts. Minimum `1000`.                                                       |
| `AI_AGENT_AUTONOMY_DEV_MAX_RUNS_PER_CYCLE`    | `3`                                                                        | Maximum due schedules attempted sequentially in one worker cycle. Integer from `1` through `10`.                                                |
| `AI_AGENT_AUTONOMY_DEV_LEASE_MS`              | `900000`                                                                   | Owner/run lease duration. Must exceed the poll interval; active runs renew leases and terminal writes are fenced.                               |
| `AI_AGENT_TRIGGER_ENABLED`                    | `false`                                                                    | Enables Trigger.dev schedule synchronization in local development or staging. Production deployments reject it.                                 |
| `AI_AGENT_TRIGGER_ENVIRONMENT`                | `dev` in development                                                       | Must be `dev` locally or `staging` in the staging deployment; included in schedule deduplication keys.                                          |
| `AI_AGENT_AUTONOMY_LAUNCHDARKLY_FLAG_KEY`     | `ai-agent-autonomy-enabled`                                                | Staging boolean flag evaluated with the authenticated DID as the LaunchDarkly `user` context key.                                               |
| `LAUNCHDARKLY_SDK_KEY`                        | none                                                                       | Server-side SDK key for the LaunchDarkly staging environment. Required for staging schedules.                                                   |
| `TRIGGER_SECRET_KEY`                          | none                                                                       | Environment-specific Trigger.dev secret used by the HTTP service to synchronize schedule CRUD. Required when Trigger integration is enabled.    |
| `AI_AGENT_WEB_SEARCH_PROVIDER`                | `brave` when `BRAVE_SEARCH_API_KEY` exists, otherwise `none`               | Current-info provider. Supported values: `brave`, `none`; `mock` is for tests.                                                                  |
| `BRAVE_SEARCH_API_KEY`                        | none                                                                       | Brave Web Search API key. Never returned in health responses or tool output.                                                                    |
| `AI_AGENT_WEB_SEARCH_DEFAULT_LIMIT`           | `5`                                                                        | Default result count for `webSearch`.                                                                                                           |
| `AI_AGENT_WEB_SEARCH_MAX_LIMIT`               | `10`                                                                       | Maximum result count exposed to the agent, hard-capped at `20`.                                                                                 |
| `AI_AGENT_WEB_SEARCH_COUNTRY`                 | none                                                                       | Optional default 2-letter country code, such as `US`.                                                                                           |
| `AI_AGENT_WEB_SEARCH_LANG`                    | none                                                                       | Optional default search language, such as `en`.                                                                                                 |
| `AI_AGENT_WEB_SEARCH_SAFESEARCH`              | none                                                                       | Optional default SafeSearch level: `off`, `moderate`, or `strict`.                                                                              |
| `AI_AGENT_CLOUDWATCH_METRICS_ENABLED`         | `false`                                                                    | Publishes metrics directly with CloudWatch `PutMetricData`; enabled on ECS only.                                                                |
| `SENTRY_DSN`                                  | none                                                                       | Raw Sentry DSN URL for sanitized operational errors and traces. Required in production.                                                         |
| `SENTRY_ENV`                                  | `NODE_ENV`                                                                 | Sentry environment and CloudWatch metric environment dimension.                                                                                 |
| `SENTRY_RELEASE`                              | `GIT_SHA`                                                                  | Deployed release identifier.                                                                                                                    |
| `SENTRY_TRACES_SAMPLE_RATE`                   | `0.1`                                                                      | Sentry trace sampling rate from `0` through `1`; staging ECS and Trigger tasks use `1`.                                                         |

## Health, telemetry, and AWS deployment

-   `GET /api/health/live` is a process liveness probe.
-   `GET /api/health/ready` returns 503 until the model provider and MongoDB are ready.
-   `GET /api/health` retains detailed feature/configuration status, including the Sentry deployment-delivery check.
-   Every response includes `X-Request-ID`; agent runs also return a `runId`.
-   Concise logfmt application lines correlate HTTP, model, tool, run, and post-run stages without recording DIDs, prompts, responses, memory, tool payloads, or exception messages. ECS sends metrics directly to CloudWatch instead of mixing EMF JSON records into the log stream.
-   Ordinary application logs go to CloudWatch only. Sentry receives the verified deployment event, sanitized operational exceptions, and sampled performance transactions—not the log stream.

The production ARM64 container, reusable-infrastructure ECS/Fargate CloudFormation stack, deployment workflow, alarms, dashboard, staging smoke test, rollout procedure, key rotation, troubleshooting, and rollback steps are documented in [RUNBOOK.md](./RUNBOOK.md).

## Shape

-   `src/agent/types.ts` defines the provider and tool interfaces.
-   `src/agent/skills.ts` adds native skill-backed tool support with `listSkills` and `readSkill`.
-   `src/agent/openAIProvider.ts` is the first provider adapter.
-   `src/consentFlow.ts` resolves the configured ConsentFlow contract and preloads consented user data.
-   `src/helpers/learnCard.helpers.ts` initializes and caches the configured LearnCard wallet.
-   `src/mongo.ts` provides lazy MongoDB client/database access.
-   `src/selfImprovement/` stores per-DID Markdown docs, sanitized run traces, and retro results.
-   `src/runtime.ts` composes the provider, wallet, tools, ConsentFlow, Assistant, memory, trace, and awaited retro path shared by HTTP and autonomous execution.
-   `src/autonomy/` stores schedules/runs/leases and implements the development-only full-agent dispatcher.
-   `src/tools/index.ts` registers tools for the agent.
-   `src/tools/learnCardWallet/` exposes the configured wallet through one freeform `learnCardWallet` tool and a bundled `SKILL.md`.
-   `src/tools/consentedUserData.ts` exposes request-scoped consented user data when a DID is supplied.
-   `src/tools/webSearch/` defines the provider-neutral current-info search adapter contract, the stable `webSearch` agent tool, and the Brave Web Search provider.

The authenticated HTTP service is request/response. `POST /api/agent/heartbeat` is a manually
invoked proactive HTTP request; it is not the recurring scheduler. The separate, default-disabled
development autonomy worker can run full-agent user schedules and await their retrospective pass.
It never starts from the production HTTP service and is not a production deployment design.

## Skill-Backed Tools

Tools can include a `skill` definition. When at least one tool does this, the agent automatically receives:

-   `listSkills` for the compact index of available skill documents.
-   `readSkill` for loading the full `SKILL.md` only when needed.

This keeps the core loop simple while letting broad tools ship their own usage instructions.
When a DID-backed request has active Mongo docs, those docs are merged into the same compact
`listSkills` index and loaded through `readSkill`. Static file-backed skills remain read-only.

The `learnCardWallet` skill-backed tool uses this pattern for a broad object API. Its `inspect` operation returns function paths, arity, parsed JavaScript parameter names when available, result counts, and truncation hints. Use `query` when inspecting large namespaces.

## Web Search / Current Information

`webSearch` is registered only when a provider is configured. If `AI_AGENT_WEB_SEARCH_PROVIDER` is unset and `BRAVE_SEARCH_API_KEY` exists, the service enables Brave automatically. Set `AI_AGENT_WEB_SEARCH_PROVIDER=none` to keep the tool out of the agent tool list.

The agent-facing schema is provider-neutral: `query`, optional `limit`, `freshness`, `country`, `searchLang`, and `safeSearch`. Tool results always return `{ query, provider, retrievedAt, results }`, where every result has `title`, `url`, `snippet`, `rank`, optional `score`, and `retrievedAt`. Raw provider payloads and provider error bodies are never returned.

Use web search for current, time-sensitive, or source-attributed facts: recent events, current market/work information, live policy references, and URLs the answer should cite. Use memory tools for durable user context. Use ConsentFlow tools for user-approved personal data.

To add another provider, implement `WebSearchProvider` in `src/tools/webSearch/`, add config selection in `src/tools/index.ts`, and keep the `webSearch` tool schema/result shape unchanged. Provider-specific response fields should be normalized inside the adapter.

## ConsentFlow Context

Set `AI_AGENT_CONSENT_FLOW_CONTRACT_URI` to the contract the agent should use. When the configured network is not production and no URI is set, the service lazily creates a development contract the first time `/api/consent-flow/contract` or a DID-backed chat run needs one. If the default OpenAI provider is not configured, these paths return 503 before attempting any ConsentFlow work.

-   `GET /api/consent-flow/contract` resolves the active contract and returns a consent URL.
-   `POST /api/agent/run` accepts an optional `did`. When present, the service starts loading consented data immediately and adds a request-scoped `getConsentedUserData` tool for the agent to call only if needed.

## LearnCard Assistant

The LearnCard Assistant stores proactive learner-facing inbox cards in MongoDB collection
`learnCardAssistantFeedItems`. DID-backed chat and heartbeat runs receive the
`recordLearnCardAssistantCard` tool, which creates or updates one card for the current learner.
Use a stable `dedupeKey` when refreshing the same recommendation across runs.

Assistant card types are `message`, `job-suggestion`, `pathway-update`, and `action-item`.
Priorities are `normal` and `high`.

The assistant profile is stored in `learnCardAssistantProfiles` and can customize the assistant
name and personality used in the system prompt. Missing profiles fall back to `My Assistant`.

Endpoints:

-   `GET /api/users/:did/assistant-feed` returns latest cards for one DID. Optional `limit` clamps to `1..50`.
-   `POST /api/users/:did/assistant-feed/:id/read` marks one card read.
-   `POST /api/users/:did/assistant-feed/:id/feedback` records `{ type: 'thumbs-down' }`.
-   `POST /api/agent/heartbeat` accepts `{ did, consentFlowContractUri?, maxItems? }` and runs a cron-invokable proactive pass. `maxItems` clamps to `1..5`.
-   `POST /api/debug/users/:did/assistant-feed` writes one validated card for local QA and seeded UI demos.
-   `GET /api/users/:did/assistant-profile` returns the assistant profile.
-   `PATCH /api/users/:did/assistant-profile` updates `{ name?, personality? }`.
-   `GET /api/users/:did/assistant-memories` returns the memory manifest and safe memory docs.
-   `POST /api/users/:did/assistant-memories/:name/approve` approves a proposed memory.
-   `POST /api/users/:did/assistant-memories/:name/archive` removes an active or proposed memory.

## Assistant Schedules and Development Autonomy

User schedules are default-absent, independently enabled, and limited to 10 per DID. The
user-facing cadence is a name, task prompt, local `HH:mm` time, selected weekdays, and IANA
timezone. Croner converts that restricted contract into the next DST-aware occurrence; users do
not author raw cron.

DID-authenticated matching-owner endpoints:

-   `GET /api/users/:did/assistant-schedules` lists schedules.
-   `POST /api/users/:did/assistant-schedules` creates one schedule.
-   `PATCH /api/users/:did/assistant-schedules/:id` updates cadence, prompt, name, or enabled state.
-   `DELETE /api/users/:did/assistant-schedules/:id` permanently deletes one schedule.

Mongo collections:

-   `agentAutonomySchedules` stores queryable cadence/next-run metadata and DAG-JWE-encrypted
    schedule names/prompts.
-   `agentAutonomousRuns` stores one unique owner/schedule/occurrence with lease-fenced status and
    encrypted success summary or sanitized error.
-   `agentAutonomousLeases` serializes full-agent execution per owner across worker processes.

Run one deliberately gated development cycle:

```bash
bun run --cwd services/learn-card-network/ai-agent autonomy:once
```

Run the non-overlapping development poller:

```bash
bun run --cwd services/learn-card-network/ai-agent autonomy:dev
```

Both commands require `AI_AGENT_AUTONOMY_DEV_ENABLED=true`, development mode, explicit fixture
DIDs, Mongo, an agent wallet seed, an OpenAI key, and self-improvement. The poller handles
`SIGINT`/`SIGTERM` by stopping future cycles, draining the active cycle, and closing Mongo.
Scheduled runs use the same full tool/memory/ConsentFlow/wallet runtime as interactive chat, may
perform irreversible effects, and are not production-safe without tool-level idempotency and
capability policy.

### Trigger.dev development and staging scheduler

Trigger.dev can replace the local polling loop while preserving the same Mongo occurrence, owner
lease, full-agent runtime, Assistant card, trace, and retro lifecycle. It is restricted to local
development and an explicit staging deployment. Local Trigger development uses
`AI_AGENT_AUTONOMY_DEV_DIDS`; staging evaluates the `ai-agent-autonomy-enabled` LaunchDarkly
boolean flag with the authenticated DID as the `user` context key. Production remains disabled
until privacy, consent, and effect-idempotency prerequisites are implemented.

The Trigger task runtime is Node even though repository commands use Bun. A live Bun task run
failed in `@learncard/init` while loading DidKit, so the native
`@learncard/didkit-plugin-node` package is externalized from the Trigger bundle. The full-agent
execution task uses `medium-1x`: Trigger.dev's default 0.5 GB worker exhausted its V8 heap while
initializing the LearnCard runtime.

For local development:

1. Copy the project's DEV secret from Trigger.dev **API Keys** into the service `.env`.
2. Set `AI_AGENT_TRIGGER_ENABLED=true`, `AI_AGENT_TRIGGER_ENVIRONMENT=dev`,
   `AI_AGENT_AUTONOMY_DEV_DIDS` to dedicated test profiles, and keep
   `AI_AGENT_AUTONOMY_DEV_ENABLED=false`.
3. Restart the AI Agent HTTP service so schedule create/update/delete calls synchronize with
   Trigger.dev.
4. Start the task worker from the service directory:

```bash
cd services/learn-card-network/ai-agent
bun run trigger:dev
```

If Bun is installed outside `~/.bun/bin`, expose its directory to the Trigger CLI:

```bash
cd services/learn-card-network/ai-agent
BUN_INSTALL_BIN="$(dirname "$(command -v bun)")" bun run trigger:dev
```

`learncard-autonomous-schedule-dispatch` receives imperative schedules. It enqueues
`learncard-autonomous-agent-execution` with a global occurrence idempotency key and a per-owner
concurrency key. Queued deliveries re-check that the Mongo schedule still exists, remains enabled,
and still points at the same occurrence before invoking the agent.

See [AUTONOMY_SPIKE.md](./AUTONOMY_SPIKE.md) for measured runs, security/capability boundaries,
Trigger.dev evaluation, and production ticket drafts.

## Per-User Self-Improvement

When enabled and MongoDB is reachable, DID-backed chat runs can use active user docs from
`agentUserDocs`. Docs are Markdown records keyed by `ownerDid` and `name`, with `kind` set to
`skill`, `user-profile`, `memory`, or `wiki`. Docs also carry `status`, `sourceType`,
`confidence`, `sensitivity`, optional expiry, and provenance metadata. Only `active`,
non-expired docs are exposed through `listSkills` and `readSkill`; `proposed` and `archived` docs
stay in the debug/user-management layer until approved or restored.

DID-backed runs also receive a compact memory manifest that separates durable memory from
ConsentFlow data and credentials. The manifest tells the agent which docs are visible, which are
proposed, and how to treat source precedence. The request-scoped memory tools are:

-   `getUserMemoryManifest` for current memory state.
-   `rememberUserMemory` for explicit user-approved saves and updates.
-   `proposeUserMemory` for inferred, ambiguous, or sensitive memories that need approval.
-   `forgetUserMemory` for user-requested memory removal.

After a successful response is sent, the service stores a bounded run trace in `agentRunTraces`.
ConsentFlow results are summarized so raw personal values and credential payloads are not written
to traces. If an OpenAI key is configured, a retro agent reviews the trace plus current docs and can
request a validated `noop`, `create`, `update`, or `propose`. Writes go through the doc service,
which validates names, frontmatter, content size, prompt-injection-like text, provenance, approval
state, expiry, and version history.

Debug endpoints:

-   `GET /api/debug/users/:did/docs` returns docs for one DID.
-   `GET /api/debug/users/:did/memory` returns a manifest plus docs for one DID.
-   `POST /api/debug/users/:did/memory` creates, updates, approves, or archives a memory.
-   `GET /api/debug/runs/:runId` returns a stored trace and retro results.
