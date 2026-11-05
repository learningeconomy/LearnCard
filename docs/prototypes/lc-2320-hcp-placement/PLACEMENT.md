# LC-2320 — HCP placement decision (Draft2)

**Prep + placement decision.** Does **not** claim Recognition Done-when complete (Recognition working path is deferred — see [`FOLLOW-ONS.md`](./FOLLOW-ONS.md)).

**Spec pin:** HCP v2 **Draft2** only  
https://docs.google.com/document/d/1ThAt_Y1hCstO1W4tlgp7HueY_WBCXtfB/edit

**Shared-core note (do not import yet):** On `#1955`, `createMcpApp` takes one `auth` block (`issuerUrl`, `baseUrl`, `scopesSupported`, `requiredScopes`, `protectedResourceMetadataPath`) — one protected resource per app instance. Co-hosting Recognition + HCP ⇒ **two mounts**.

---

## Recommendation: **A + lean**

Host the HCP **MCP binding** on the shared LearnCard MCP core (`@learncard/mcp`, after `#1955` merges) as a **separate OAuth protected resource**. Keep the HCP **domain/store** in its own package (`@learncard/hcp` starts as stub tools here). Still ship **HTTP Binding + OAuth Interop** for governance and Provider/Agent Interop.

### Reject / defer **B** (fully separate MCP process)

Defer a dedicated HCP MCP process unless measured later that:

- dual-mount audience isolation cannot be proven in CI, or
- process-level blast-radius / release cadence forces a hard split.

No Draft2 requirement forces a separate process for the MCP binding; Agent Interop is Streamable HTTP + OAuth Interop (§10.1 / §13), which the shared core already targets.

---

## Why (Draft2 + audience isolation)

1. **§10 MCP Binding is context-ops only.** Tools are `hcp_queryContext`, `hcp_getEntry`, `hcp_createEntry`, `hcp_reviseEntry`, `hcp_withdrawEntry`. Governance (grants, audit, export, hard delete, confirmation, category changes) is **HTTP Binding §9 only** — "the MCP Binding carries none of them."
2. **§10.1 + §13 force HTTP OAuth shape for Agent Interop.** Streamable HTTP is required for Agent Interop; MCP auth maps onto OAuth Interop Profile §13. stdio = **First-Party package only**. HCP Provider is an OAuth RS; RFC 8707 `resource`; audience-restricted access tokens; RFC 9728 Protected Resource Metadata required.
3. **Audience isolation from Recognition.** Taylor lean (ticket): HCP is its own package/domain; LearnCard MCP may host the MCP _binding_; never share Recognition `author` / `issue` audience or scopes with the HCP resource. One `auth` block per `createMcpApp` ⇒ two mounts when co-hosted.

---

## Draft2 assumptions (isolated)

**Pinned from Draft2:**

- MCP tools list above; no governance over MCP.
- Streamable HTTP required for Agent Interop; stdio = First-Party only.
- HCP Provider = OAuth RS; RFC 8707 `resource`; audience-restricted tokens; RFC 9728 PRM required.
- Governance plane remains HTTP-only for Management Client operations.

**Might change in a future Draft3 (unknown — flag only):**

- Tool names / schemas / annotations.
- Extension identifier under `server/discover` (Draft2 uses placeholder `example.hcp/hcp`).
- Conformance package naming (First-Party / Provider Interop / Agent Interop).
- Exact scope-string vs `authorization_details` (RFC 9396) client UX.

---

## Risks / open questions

- Dual-resource mount harness waits on `#1955`; stubs can land now without importing `@learncard/mcp`.
- Co-host confusion: one process, two mounts, two PRM documents — CI must prove wrong-audience / wrong-scope rejection.
- HTTP governance still required for Provider/Agent Interop regardless of MCP binding placement.
- Draft3 drift: re-check §10 / §13 before productionizing stubs.

---

## Out of scope (this prototype cut)

- Working Recognition MCP (author / issue / unattended) — **deferred follow-on** (approved)
- LC-2240 full HCP domain / store / UI
- LC-2317 app cards
- LC-2318 skills + plugin packaging
- Directory submissions
- Claiming Recognition Done-when complete
