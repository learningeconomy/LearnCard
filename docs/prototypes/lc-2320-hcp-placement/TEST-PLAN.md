# LC-2320 — acceptance test plan (placement + stubs)

**Cut:** placement-and-stub prototype; **working Recognition deferred**. Recognition Done-when is **not** claimed here.

HCP tool/auth shapes measured from **Draft2** only.

---

## A. Stub package (runnable now)

Package: `packages/learn-card-hcp` (`@learncard/hcp`).

| #   | Action                                                | Expected                                                                                             |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| S1  | `bunx nx run hcp:test` (or `bun run test` in package) | Passes; asserts five Draft2 tool names + all four annotation hints                                   |
| S2  | Inspect exported `hcpTools`                           | Names: `hcp_queryContext`, `hcp_getEntry`, `hcp_createEntry`, `hcp_reviseEntry`, `hcp_withdrawEntry` |
| S3  | Scan tool names / exports                             | **No** governance tool names (grants, audit, export, hard delete, confirm, standing rules)           |
| S4  | Package `package.json`                                | **No** dependency on `@learncard/mcp`                                                                |

---

## B. Dual-resource OAuth (after `#1955` mount)

Wire two `createMcpApp` instances (one Recognition-shaped `auth`, one HCP-shaped). See `packages/learn-card-hcp/src/mount-after-1955.stub.ts`.

| #   | Setup                                                                                      | Action                              | Expected                                                                               |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------- |
| H1  | Recognition-shaped token (audience = Recognition resource; scopes e.g. `author` / `issue`) | Call Recognition MCP                | Allowed per scope                                                                      |
| H2  | Same Recognition token                                                                     | Call HCP mount / `hcp_*`            | **401/403** (wrong audience)                                                           |
| H3  | HCP-shaped token (audience = HCP Provider resource)                                        | Call `hcp_*` under grant            | Allowed per grant                                                                      |
| H4  | Same HCP token                                                                             | Call Recognition author/issue tools | **401/403** (wrong audience)                                                           |
| H5  | Correct audience, missing required scope / purpose                                         | Tool call                           | **403** (or typed insufficient_scope)                                                  |
| H6  | Fetch each mount's RFC 9728 PRM                                                            | Compare `resource` / scopes         | Two distinct resources; HCP PRM does not advertise Recognition `author`/`issue` scopes |

### Stub tools + annotations (once mounted)

| Tool                | Core op        | Annotations (stub)                                                  |
| ------------------- | -------------- | ------------------------------------------------------------------- |
| `hcp_queryContext`  | Query 5.2.1    | readOnly=true, destructive=false, idempotent=true, openWorld=true   |
| `hcp_getEntry`      | Get 5.2.2      | readOnly=true, destructive=false, idempotent=true, openWorld=true   |
| `hcp_createEntry`   | Create 5.2.3   | readOnly=false, destructive=false, idempotent=false, openWorld=true |
| `hcp_reviseEntry`   | Revise 5.2.4   | readOnly=false, destructive=false, idempotent=false, openWorld=true |
| `hcp_withdrawEntry` | Withdraw 5.2.5 | readOnly=false, destructive=true, idempotent=true, openWorld=true   |

| #   | Action                          | Expected                                                               |
| --- | ------------------------------- | ---------------------------------------------------------------------- |
| H7  | `tools/list` on HCP mount       | Five `hcp_*` tools (or grant-filtered subset); each has all four hints |
| H8  | Attempt governance ops over MCP | Absent / rejected — governance stays on HTTP Binding §9                |

### How-to-run outline once mount exists (≤5 steps)

1. Ensure `#1955` is on `main`; install workspace deps.
2. Replace `mount-after-1955.stub.ts` with a real dual `createMcpApp` harness (distinct `auth.baseUrl` / PRM / audiences).
3. Obtain Recognition-scoped and HCP-scoped tokens (RFC 8707 `resource` set per mount).
4. Run H1–H8 (script or MCP Inspector).
5. Record Loom per checklist.

Until then: [`HOW-TO-RUN.md`](./HOW-TO-RUN.md).

---

## Loom checklist (later acceptance recording)

- Say clearly: **Recognition working path deferred**; this prototype is placement + stubs.
- Show branch off `main` (not stacked on `#1955`); no `@learncard/mcp` import on this tip.
- Demo stub tests (S1–S4) and point at Draft2 tool list.
- Speak **A + lean**; B deferred unless measured; Draft2 assumptions called out.
- Dual-resource H1–H6: either live after `#1955` or walk the stub mount plan.
- Follow-ons: Recognition guts (M), dual-resource CI (S), LC-2240 body (L).
