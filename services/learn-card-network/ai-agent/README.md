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

## Shape

-   `src/agent/types.ts` defines the provider and tool interfaces.
-   `src/agent/skills.ts` adds native skill-backed tool support with `listSkills` and `readSkill`.
-   `src/agent/openAIProvider.ts` is the first provider adapter.
-   `src/consentFlow.ts` resolves the configured ConsentFlow contract and preloads consented user data.
-   `src/helpers/learnCard.helpers.ts` initializes and caches the configured LearnCard wallet.
-   `src/mongo.ts` provides lazy MongoDB client/database access for future agent storage.
-   `src/tools/index.ts` registers tools for the agent.
-   `src/tools/learnCardWallet/` exposes the configured wallet through one freeform `learnCardWallet` tool and a bundled `SKILL.md`.
-   `src/tools/consentedUserData.ts` exposes request-scoped consented user data when a DID is supplied.
-   `public/index.html` is the debug chat UI served by the same process.

The service is intentionally request/response. It does not run an autonomous background loop yet.

## Skill-Backed Tools

Tools can include a `skill` definition. When at least one tool does this, the agent automatically receives:

-   `listSkills` for the compact index of available skill documents.
-   `readSkill` for loading the full `SKILL.md` only when needed.

This keeps the core loop simple while letting broad tools ship their own usage instructions.

The `learnCardWallet` skill-backed tool uses this pattern for a broad object API. Its `inspect` operation returns function paths, arity, parsed JavaScript parameter names when available, result counts, and truncation hints. Use `query` when inspecting large namespaces.

## ConsentFlow Context

Set `AI_AGENT_CONSENT_FLOW_CONTRACT_URI` to the contract the agent should use. When the configured network is not production and no URI is set, the service lazily creates a development contract the first time `/api/consent-flow/contract` or a DID-backed chat run needs one. If the default OpenAI provider is not configured, these paths return 503 before attempting any ConsentFlow work.

-   `GET /api/consent-flow/contract` resolves the active contract and returns a consent URL.
-   `POST /api/agent/run` accepts an optional `did`. When present, the service starts loading consented data immediately and adds a request-scoped `getConsentedUserData` tool for the agent to call only if needed.
