# HCP MCP Binding - Unit 3 Conformance

Spec pin: `b790561830702c067cd7810c96ee78dd3d84741c` (Draft 3).

Suite: `conformance.test.ts`. Run:

```bash
bunx vitest run --config vitest.config.ts src/hcp
```

## Claim status (honesty)

| Claim                                                 | Status          | Why                                                                                                               |
| ----------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `https://hcp.example/spec/bindings/mcp/2.0`           | **Not claimed** | §18.1: a Part is claimed whole. Core gaps remain (see v1 README Not in v1).                                       |
| `https://hcp.example/spec/core/2.0`                   | **Not claimed** | Same; standing rules, directives, hard delete, HTTP binding paths, etc.                                           |
| `https://hcp.example/spec/profiles/oauth-interop/2.0` | **Not claimed** | AS+PRM+grant-bound bearer proven; full §13 (authorization_details, refresh lifetimes, RFC 9700 sweep) not proven. |
| Agent Interop package (§18.2)                         | **Not claimed** | Needs Provider Interop (HTTP Binding + OAuth Interop) + MCP.                                                      |
| Tool-level MCP + grant-bound bearer + PRM (LC status) | **Proven**      | See matrix below. Advertised under `learncard_status` and empty `conformsTo` arrays.                              |

`hcp.v1.meta` (tRPC) still has no `conformsTo` / `bindings` fields. Do not add official URIs until the table above flips.

## Requirement matrix

| Spec                     | Requirement                                         | Test / evidence                       | Result                                     |
| ------------------------ | --------------------------------------------------- | ------------------------------------- | ------------------------------------------ |
| §10.3                    | Six tools in `tools/list`                           | `§10.3 tools/list…`                   | Pass                                       |
| §10.1                    | Request carries authorization (Streamable HTTP)     | `§10.1 rejects unauthenticated…`      | Pass                                       |
| §10.3                    | Grant authorizes the tool call                      | `§10.3 grant-bound token succeeds…`   | Pass                                       |
| §10.3                    | Out-of-scope denied                                 | `§10.3 out-of-scope write fails…`     | Pass                                       |
| §13.5                    | PRM + AS metadata                                   | `§13.5 PRM and AS metadata…`          | Pass                                       |
| §10.3.6                  | `hcp_reportSharing` present; error if unimplemented | `§10.3.6 hcp_reportSharing…`          | Pass (not-implemented)                     |
| §10.2                    | `example.hcp/hcp` on discover/initialize            | `§10.2 initialize advertises…`        | Pass (empty `conformsTo`)                  |
| §19                      | Discovery document                                  | `§19 /.well-known/hcp-configuration…` | Pass (LC-adapted; empty claims)            |
| §18.1                    | Do not list Part URI unless whole                   | `§18.1 tRPC hcp.v1.meta…`             | Pass (unclaimed)                           |
| §10.2 schemas            | inputSchema/outputSchema reference Core Appendix A  | Deferred                              | Partial (Zod shapes; not Appendix A $refs) |
| §19 HTTP Binding members | `entries_endpoint` etc.                             | Deferred                              | tRPC, not §9 HTTP                          |
| §13 full OAuth Interop   | authorization_details, refresh, etc.                | Deferred                              | Unit 1 subset only                         |

## Follow-ups (do not block tool-level proof)

1. Real `context.shared` audit so `hcp_reportSharing` succeeds.
2. Draft 3 HTTP Binding (or honest first-party-only package) before Core/`bindings/mcp` URIs.
3. Full OAuth Interop Profile checklist before listing that profile URI.
4. Claude Code end-to-end OAuth recipe against local AS (Unit 4).
