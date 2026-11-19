# HCP MCP Binding (Unit 2)

Draft 3 §10.3 tools on Streamable HTTP, authorized by Unit 1 grant-bound bearers
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

Does **not** claim `bindings:["mcp"]` / `conformsTo` (Unit 3).

## How do I test this?

### Automated

```bash
cd services/learn-card-network/brain-service
bunx vitest run --config vitest.config.ts src/hcp
```

### Manual (free high port; does not restart Roadie)

```bash
cd services/learn-card-network/brain-service
bun --conditions=development src/hcp/mcp/dev-server.ts 18766
# prints baseUrl, subjectDid, grantId, mcp URL, claudeMcpAdd

# Optional Claude Code (remove after verifying):
# claude mcp add --transport http hcp-local http://127.0.0.1:18766/mcp
# claude mcp list
# /mcp  → should list the six hcp_* tools after OAuth consent
# claude mcp remove hcp-local
```

Consent page still asks for subject DID + grant id (local only). Complete the OAuth
flow Claude opens, then call tools with natural language.

## Decisions (Unit 2)

| Topic            | Choice                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Placement        | `src/hcp/mcp/` next to `oauth/`; `@learncard/mcp` for server/tool helpers only       |
| Auth router      | Unit 1 AS/PRM kept; MCP mounts at `/mcp` without `mcpAuthRouter` (would collide)     |
| Token scopes     | Service calls use `withTokenScopedGrant` so `auth.scopes` (token∩live) cannot widen  |
| Q3 reportSharing | Tool registered; returns `{ type: "not-implemented", detail }` (spec silent on code) |
| Q4 WritePolicy   | LC `canWrite`→active else suggested remains; marked LC extension                     |
| Q7 conformsTo    | Still deferred to Unit 3                                                             |
| Consent          | Not an MCP tool (Draft 3 §10.1)                                                      |
