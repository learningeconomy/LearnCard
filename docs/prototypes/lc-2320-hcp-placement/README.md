# LC-2320 — HCP placement + stub prototype (Recognition deferred)

**Status:** placement decision + stub `hcp_*` package skeleton. **Working Recognition MCP is deferred** (approved cut). This does **not** claim LC-2320 Recognition Done-when complete.

**Ticket:** [LC-2320](https://welibrary.atlassian.net/browse/LC-2320)

**Gates before dual-resource mount / real `createMcpApp` wiring:**

1. `#1955` / LC-2313 (`@learncard/mcp`) merges to `main`.
2. Then wire two mounts (Recognition-shaped resource + HCP-shaped resource) per [`TEST-PLAN.md`](./TEST-PLAN.md).

**Hard holds on this branch:**

- No import of `@learncard/mcp` (package is not on `main` yet).
- Branch cut from current `main`, **not** stacked on `lc-2313-mcp-core`.
- Stub tools live in `packages/learn-card-hcp` and mirror the shared-core annotation shape locally.

| Doc / code                         | Purpose                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| [`PLACEMENT.md`](./PLACEMENT.md)   | A + lean decision; Draft2 assumptions; risks               |
| [`TEST-PLAN.md`](./TEST-PLAN.md)   | Dual-resource + stub `hcp_*` acceptance; Loom checklist    |
| [`FOLLOW-ONS.md`](./FOLLOW-ONS.md) | S/M/L including **Recognition guts** as deferred follow-on |
| [`HOW-TO-RUN.md`](./HOW-TO-RUN.md) | How to exercise stubs now; mount steps after `#1955`       |
| `packages/learn-card-hcp`          | Annotated Draft2 §10 stub tools (no shared-core dep)       |

HCP v2 source of truth: [Draft2](https://docs.google.com/document/d/1ThAt_Y1hCstO1W4tlgp7HueY_WBCXtfB/edit). Draft3 not published — do not invent it.
