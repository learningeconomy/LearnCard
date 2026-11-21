# HCP MCP Binding (Units 2-3)

Draft 3 §10 tools on Streamable HTTP, authorized by Unit 1 grant-bound bearers
(spec pin `b790561830702c067cd7810c96ee78dd3d84741c`).

## What is this?

Six MCP tools under `src/hcp/mcp/`. The access token **is** the grant (`grant_id` in
the JWT). Tool arguments never carry `grantId`.

| Tool                | Core op                                          |
| ------------------- | ------------------------------------------------ |
| `hcp_queryContext`  | §5.2.1                                           |
| `hcp_getEntry`      | §5.2.2                                           |
| `hcp_createEntry`   | §5.2.3                                           |
| `hcp_reviseEntry`   | §5.2.4                                           |
| `hcp_withdrawEntry` | §5.2.5                                           |
| `hcp_reportSharing` | §5.2.8 (not-implemented error until audit lands) |

Unit 3 adds §10.2 `example.hcp/hcp` on MCP initialize, LC-adapted
`/.well-known/hcp-configuration`, and `conformance.test.ts` / `CONFORMANCE.md`.

**Official `bindings:["mcp"]` / `conformsTo` Part URIs are not claimed** (§18.1:
Core + HTTP Binding still incomplete). See CONFORMANCE.md claim table.

## How do I test this?

### Automated

```bash
cd services/learn-card-network/brain-service
bunx vitest run --config vitest.config.ts src/hcp
# includes mcp/conformance.test.ts (Unit 3)
```

### Manual Claude Code with DID-authenticated consent (spare ports)

Consent runs in the LearnCard app: `claude mcp login` opens `/hcp/connect?oauth_request=…`,
you sign in and tap Allow, and the brain issues a grant to Claude's OAuth client DID
(`did:web:<AS host>:hcp:oauth-clients:<client_id>`). See `../oauth/README.md`.
Use ports that are not Roadie's (`4319`, `3319`, `17687`, `18766`).

```bash
# 1. Throwaway Neo4j (from services/learn-card-network/brain-service)
export NEO4J_PASSWORD=$(openssl rand -hex 16)
docker run -d --name hcp-oauth-neo4j -p 127.0.0.1:27688:7687 \
  -e NEO4J_AUTH=neo4j/$NEO4J_PASSWORD neo4j:5
until docker logs hcp-oauth-neo4j 2>&1 | grep -q 'Started.'; do sleep 1; done

# 2. Shared env for the brain and the MCP server
export NODE_ENV=development IS_OFFLINE=true DOMAIN_NAME=localhost%3A4329 \
  NEO4J_URI=bolt://127.0.0.1:27688 NEO4J_USERNAME=neo4j \
  SEED=$(openssl rand -hex 32) \
  HCP_OAUTH_ISSUER_URL=http://127.0.0.1:18797 \
  HCP_OAUTH_TOKEN_SECRET=$(openssl rand -hex 32) \
  HCP_OAUTH_CONSENT_APP_URL=http://localhost:3329

# 3. Brain on :4329
PORT=4329 bun --conditions=development src/docker-entry.ts

# 4. HCP MCP + AS on :18797 over the same Neo4j (another terminal: re-export
#    NEO4J_PASSWORD and everything in step 2; an env file with `set -a; . file; set +a` helps)
# The AS advertises HCP_OAUTH_ISSUER_URL (default http://127.0.0.1:<port>) and still
# listens on 127.0.0.1:<port>. Set the same HCP_OAUTH_ISSUER_URL on the brain and the
# MCP server (step 2 does): if they differ, approve fails with "invalid or expired".
HCP_MCP_DEV_STORE=neo4j bun --conditions=development src/hcp/mcp/dev-server.ts 18797
# Prints baseUrl (the issuer), listen, store: "neo4j" and consent:
# http://localhost:3329/hcp/connect.
# A one-off "An equivalent index already exists" log at start is harmless.

# 5. App on :3329 (from apps/learn-card-app), pointed at the brain, as in ../v1/README.md:
bun scripts/prepare-native-config.ts learncard --stage local
#    public/tenant-config.json: apis.brainService = http://localhost:4329/trpc,
#    apis.brainServiceApi = http://localhost:4329/api
bun run i18n:compile
bun --conditions=development ../../node_modules/vite/bin/vite.js --port 3329 --strictPort --host 127.0.0.1
# Sign in once and set up a LearnCard profile.
```

In another terminal (real TTY - Claude needs it for the OAuth callback listener):

```bash
claude mcp add --transport http hcp-local http://127.0.0.1:18797/mcp
claude mcp list            # hcp-local … ! Needs authentication
claude mcp login hcp-local
# The browser opens http://localhost:3329/hcp/connect?oauth_request=… (log in first if
# asked; you come back to the same screen). It shows "Claude Code would like to see some
# of your info", the categories, "1 hour", the App ID (did:web:127.0.0.1%3A18797:hcp:
# oauth-clients:hcp_oauth_…) and the exact scopes. Allow -> the browser goes to
# 127.0.0.1:18797/oauth/consent/complete -> Claude's callback; login succeeds.
claude mcp list            # hcp-local … ✔ Connected
# The app's Apps with access now lists Claude Code; Activity shows the grant.
# Stop sharing there: the MCP endpoint now answers 401 with WWW-Authenticate
# error="invalid_token", error_description="revoked_grant", and `claude mcp list`
# shows "! Needs authentication".
# Don't Allow instead: the browser goes back to Claude's callback with
# error=access_denied and the original state, and `claude mcp login` exits at once
# with an error instead of waiting for its timeout.
claude mcp logout hcp-local && claude mcp remove hcp-local -s local
docker rm -f hcp-oauth-neo4j
```

Running `claude mcp login` again with the same scopes issues a fresh 1-hour grant and
revokes the earlier one as superseded (Activity shows both), so a re-login always gets
a full hour and the old token stops working.

Without a TTY or browser, use `claude mcp login --no-browser` (or set `BROWSER` to a
script that saves the URL). A set `ANTHROPIC_API_KEY` overrides the claude.ai login for
`claude -p`; unset it if that key has no credit.

#### In-memory sidecar with the dev typed form (no app, no DID auth)

```bash
HCP_OAUTH_DEV_TYPED_CONSENT=1 bun --conditions=development src/hcp/mcp/dev-server.ts 18798
# Seeds an in-memory subject/grant/entry and prints subjectDid + grantId. The login
# browser shows the dev typed form: paste them. Never available in production.
```

### Natural-language prompts (once Connected)

`purpose` tool args must be URLs (schema), and reads only see categories granted for
that purpose. Grants from app consent use `https://learncard.com/hcp/purposes/app-access`;
the in-memory seed uses `https://purpose.example/assist`. If Claude invents another URL,
reads come back empty or `scope-denied`: tell it which purpose to use.

1. **Read** - "Using HCP, what preferences do you know about me for helping plan my day?"
    - Expect `hcp_queryContext` → seeded entry ("Prefers concise answers and dark mode").
2. **Get one** - "Fetch that HCP entry by ref and summarize it."
    - Expect `hcp_getEntry` with the ref from (1).
3. **Suggest** - "Remember that I like spicy food (as an HCP entry)."
    - Expect `hcp_createEntry` with `suggested: true` (LC WritePolicy; grant has no `canWrite`).
    - Sidecar only - will **not** appear in Roadie My info.
4. **Revise suggestion** - "Update that spicy-food suggestion to say 'mild spice only'."
    - Expect `hcp_reviseEntry` on the suggested ref (client may revise its own suggestions).
5. **Denied / negative** - "Withdraw my active preference about dark mode."
    - Often `scope-denied` or refused: clients without subject authority cannot withdraw
      person-declared active entries the way the subject UI can. Or ask Claude to call
      `hcp_reportSharing` → `not-implemented`.
6. **Report sharing** - "Report that you shared my preferences with school.example."
    - Expect `hcp_reportSharing` → `{ type: "not-implemented", detail: … }`.

### Gaps vs `./hcp-try.sh agent` / Roadie demo-agent

| Demo-agent / Roadie                         | Claude + local MCP sidecar                               |
| ------------------------------------------- | -------------------------------------------------------- |
| Hits brain `:4319` + Neo4j; My info updates | `HCP_MCP_DEV_STORE=neo4j`: your local brain's Neo4j      |
| Consent via app Allow link (`suggest-link`) | App `/hcp/connect` Allow with DID auth (dev form opt-in) |
| Agent wrapper picks grant/demo identity     | Token=grant after Claude OAuth; no `grantId` in args     |
| `canWrite` grants can active-write          | Seeded grant suggests only (`suggested: true`)           |
| Purpose strings in CLI                      | MCP schema requires purpose **URL**                      |

## Decisions (Units 2-3)

| Topic            | Choice                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| Placement        | `src/hcp/mcp/` next to `oauth/`; `@learncard/mcp` for server/tool helpers only        |
| Auth router      | Unit 1 AS/PRM kept; MCP mounts at `/mcp` without `mcpAuthRouter` (would collide)      |
| Token scopes     | Service calls use `withTokenScopedGrant` so `auth.scopes` (token∩live) cannot widen   |
| Dev seed         | Grant categories = all PRM scopes Claude requests; one preferences entry for query    |
| Q3 reportSharing | Tool registered; returns `{ type: "not-implemented", detail }` (spec silent on code)  |
| Q4 WritePolicy   | LC `canWrite`→active else suggested remains; marked LC extension                      |
| Q7 conformsTo    | **Not claimed.** Suite proves tool-level + AS/PRM; official URIs wait on Core (§18.1) |
| §10.2 discover   | Implemented via MCP `initialize` capabilities.extensions; empty `conformsTo`          |
| §19 discovery    | LC-adapted document; `conformsTo`/`bindings` arrays empty on purpose                  |
| Consent          | Not an MCP tool (Draft 3 §10.1)                                                       |
