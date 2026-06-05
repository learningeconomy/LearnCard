# LearnCard AI Agent Service

Prototype request/response AI agent service for LearnCard Network.

## Run Locally

```bash
cp services/learn-card-network/ai-agent/.env.example services/learn-card-network/ai-agent/.env
pnpm --dir apps/learn-card-app dev
```

Then open `http://localhost:3000`. The agent service is exposed at `http://localhost:4300`
by the LearnCard App compose stack.

The LearnCard App local compose stack starts MongoDB and passes it to the agent. The
agent can also run against a separate MongoDB with `AI_AGENT_MONGO_URI` or `MONGO_URI`.
The service can boot without `OPENAI_API_KEY`, but chat and ConsentFlow contract creation
return 503 until a provider key is configured.

## Environment

| Variable                                      | Default                                                         | Purpose                                                                              |
| --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`                              | none                                                            | API key for the first provider adapter.                                              |
| `AI_AGENT_MODEL`                              | `gpt-5.5`                                                       | Model name passed to the provider.                                                   |
| `AI_AGENT_WALLET_SEED`                        | `LEARNCARD_AGENT_SEED` or `SEED`                                | Seed used by LearnCard wallet tools.                                                 |
| `AI_AGENT_CLOUD_URL`                          | `LEARN_CLOUD_URL` or `https://cloud.learncard.com/trpc`         | LearnCloud tRPC endpoint for the agent wallet.                                       |
| `AI_AGENT_NETWORK_URL`                        | `LEARNCARD_NETWORK_URL` or `https://network.learncard.com/trpc` | LearnCard Network tRPC endpoint for the agent wallet.                                |
| `AI_AGENT_PORT`                               | `PORT` or `3000`                                                | HTTP port.                                                                           |
| `AI_AGENT_MAX_TOOL_ROUNDS`                    | `100`                                                           | Maximum tool-call rounds within one request.                                         |
| `AI_AGENT_CONSENT_FLOW_CONTRACT_URI`          | none                                                            | ConsentFlow contract URI used for user-context data. Required on production network. |
| `AI_AGENT_CONSENT_FLOW_APP_URL`               | `https://learncard.app`                                         | Base app URL used to build consent links.                                            |
| `AI_AGENT_CONSENT_FLOW_DATA_PAGE_SIZE`        | `100`                                                           | Page size when preloading consented user data.                                       |
| `AI_AGENT_CONSENT_FLOW_DATA_MAX_PAGES`        | `10`                                                            | Maximum pages to read for one user-data preload.                                     |
| `AI_AGENT_CONSENT_FLOW_CREDENTIAL_READ_LIMIT` | `50`                                                            | Maximum consented credential URIs to hydrate with `read.get`.                        |
| `AI_AGENT_MONGO_URI`                          | `MONGO_URI` or `mongodb://localhost:27017`                      | MongoDB connection URI.                                                              |
| `AI_AGENT_MONGO_DB_NAME`                      | `MONGO_DB_NAME` or `learn-card-ai-agent`                        | MongoDB database name.                                                               |
| `AI_AGENT_SELF_IMPROVEMENT_ENABLED`           | `true` outside `NODE_ENV=production`                            | Enables per-DID dynamic docs, trace persistence, and post-response retro updates.    |
| `AI_AGENT_RETRO_MODEL`                        | `AI_AGENT_MODEL`                                                | Model used by the background retro agent.                                            |
| `AI_AGENT_RETRO_MAX_TRACE_CHARS`              | `24000`                                                         | Maximum serialized run-trace size sent to the retro agent.                           |
| `AI_AGENT_WEB_SEARCH_PROVIDER`                | `brave` when `BRAVE_SEARCH_API_KEY` exists, otherwise `none`    | Current-info provider. Supported values: `brave`, `none`; `mock` is for tests.       |
| `BRAVE_SEARCH_API_KEY`                        | none                                                            | Brave Web Search API key. Never returned in health responses or tool output.         |
| `AI_AGENT_WEB_SEARCH_DEFAULT_LIMIT`           | `5`                                                             | Default result count for `webSearch`.                                                |
| `AI_AGENT_WEB_SEARCH_MAX_LIMIT`               | `10`                                                            | Maximum result count exposed to the agent, hard-capped at `20`.                      |
| `AI_AGENT_WEB_SEARCH_COUNTRY`                 | none                                                            | Optional default 2-letter country code, such as `US`.                                |
| `AI_AGENT_WEB_SEARCH_LANG`                    | none                                                            | Optional default search language, such as `en`.                                      |
| `AI_AGENT_WEB_SEARCH_SAFESEARCH`              | none                                                            | Optional default SafeSearch level: `off`, `moderate`, or `strict`.                   |

## Shape

-   `src/agent/types.ts` defines the provider and tool interfaces.
-   `src/agent/skills.ts` adds native skill-backed tool support with `listSkills` and `readSkill`.
-   `src/agent/openAIProvider.ts` is the first provider adapter.
-   `src/consentFlow.ts` resolves the configured ConsentFlow contract and preloads consented user data.
-   `src/helpers/learnCard.helpers.ts` initializes and caches the configured LearnCard wallet.
-   `src/mongo.ts` provides lazy MongoDB client/database access.
-   `src/selfImprovement/` stores per-DID Markdown docs, sanitized run traces, and retro results.
-   `src/tools/index.ts` registers tools for the agent.
-   `src/tools/learnCardWallet/` exposes the configured wallet through one freeform `learnCardWallet` tool and a bundled `SKILL.md`.
-   `src/tools/consentedUserData.ts` exposes request-scoped consented user data when a DID is supplied.
-   `src/tools/webSearch/` defines the provider-neutral current-info search adapter contract, the stable `webSearch` agent tool, and the Brave Web Search provider.
-   `public/index.html` is the debug chat UI served by the same process.

The service is intentionally request/response. Its only background work is a post-response
retrospective pass that can update Mongo-backed per-user docs when self-improvement is enabled.

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
