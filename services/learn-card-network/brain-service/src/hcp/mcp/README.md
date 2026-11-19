# HCP MCP Binding (Units 2–3)

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

### Manual (free high port; does not restart Roadie)

```bash
cd services/learn-card-network/brain-service
bun --conditions=development src/hcp/mcp/dev-server.ts 18766
# prints baseUrl, subjectDid, grantId, mcp URL, claudeMcpAdd

curl -s http://127.0.0.1:18766/.well-known/hcp-configuration | jq .
curl -s http://127.0.0.1:18766/.well-known/oauth-protected-resource | jq .

# Optional Claude Code (remove after verifying):
# claude mcp add --transport http hcp-local http://127.0.0.1:18766/mcp
# claude mcp list
# /mcp  → should list the six hcp_* tools after OAuth consent
# claude mcp remove hcp-local
```

Consent page still asks for subject DID + grant id (local only). Complete the OAuth
flow Claude opens, then call tools with natural language.

## Decisions (Units 2–3)

| Topic            | Choice                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| Placement        | `src/hcp/mcp/` next to `oauth/`; `@learncard/mcp` for server/tool helpers only        |
| Auth router      | Unit 1 AS/PRM kept; MCP mounts at `/mcp` without `mcpAuthRouter` (would collide)      |
| Token scopes     | Service calls use `withTokenScopedGrant` so `auth.scopes` (token∩live) cannot widen   |
| Q3 reportSharing | Tool registered; returns `{ type: "not-implemented", detail }` (spec silent on code)  |
| Q4 WritePolicy   | LC `canWrite`→active else suggested remains; marked LC extension                      |
| Q7 conformsTo    | **Not claimed.** Suite proves tool-level + AS/PRM; official URIs wait on Core (§18.1) |
| §10.2 discover   | Implemented via MCP `initialize` capabilities.extensions; empty `conformsTo`          |
| §19 discovery    | LC-adapted document; `conformsTo`/`bindings` arrays empty on purpose                  |
| Consent          | Not an MCP tool (Draft 3 §10.1)                                                       |
