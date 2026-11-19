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

### Manual Claude Code (free high port; does not restart Roadie)

Measured on FrenchFry against this branch (Claude Code 2.1.326). The sidecar is an
**in-memory** harness (seeded subject/grant/entry). It does **not** write into the
Roadie Neo4j behind `:4319` / app `:3319`. Check results in Claude tool output (or
`curl` against the sidecar). Use `./hcp-try.sh agent …` against Roadie when you want
My info / Activity UI.

```bash
cd services/learn-card-network/brain-service
bun --conditions=development src/hcp/mcp/dev-server.ts 18766
# Prints JSON: baseUrl, subjectDid, grantId, claudeMcpAdd, consentHint.
# Seed grant covers every PRM scope Claude requests on login.
# Keep this process running.
```

In another terminal (real TTY - Claude needs it for the OAuth callback listener):

```bash
claude mcp add --transport http hcp-local http://127.0.0.1:18766/mcp
claude mcp list
# Expect: hcp-local … ! Needs authentication

claude mcp login hcp-local
# Opens (or prints) authorize URL against http://127.0.0.1:18766/oauth/authorize
# with redirect_uri=http://localhost:<ephemeral>/callback and all PRM scopes.
# Browser shows local consent HTML - paste subjectDid + grantId from server stdout.
# After redirect, Claude stores the token.

claude mcp list
# Expect: hcp-local … ✔ Connected
# In a Claude Code session, /mcp lists:
#   hcp_queryContext, hcp_getEntry, hcp_createEntry,
#   hcp_reviseEntry, hcp_withdrawEntry, hcp_reportSharing

# Cleanup when done (restore blender-only list if that was your baseline):
claude mcp remove hcp-local -s local
```

Headless note (measured): `claude mcp login --no-browser` prints the authorize URL but
will not finish without an interactive TTY to receive the redirect. You can still prove
token → `tools/list` → `hcp_queryContext` with the same consent form via curl (see
`mcp.test.ts` / Unit 2 HTTP tests). The human click that remains is the consent HTML
(and Claude's callback) in a real terminal.

### Natural-language prompts (once Connected)

`purpose` tool args must be URLs (schema). Claude usually invents one; if a call fails
validation, ask it to use `https://purpose.example/assist`.

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

| Demo-agent / Roadie                         | Claude + local MCP sidecar                           |
| ------------------------------------------- | ---------------------------------------------------- |
| Hits brain `:4319` + Neo4j; My info updates | In-memory only; no `:3319` UI                        |
| Consent via app Allow link (`suggest-link`) | Local OAuth HTML (subject DID + grant id)            |
| Agent wrapper picks grant/demo identity     | Token=grant after Claude OAuth; no `grantId` in args |
| `canWrite` grants can active-write          | Seeded grant suggests only (`suggested: true`)       |
| Purpose strings in CLI                      | MCP schema requires purpose **URL**                  |

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
