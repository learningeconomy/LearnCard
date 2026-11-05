# LC-2320 — proposed follow-ons

Approved cut: this prototype ships **placement + HCP stubs**; **working Recognition is deferred** into follow-ons below. No Jira tickets created from this doc.

---

## S — Dual-resource OAuth harness + CI smoke (after shared core on `main`)

**Size:** S  
**When:** After `#1955` / LC-2313 merges.  
**What:** Wire `createMcpApp` twice (Recognition-shaped vs HCP-shaped `auth`); CI smoke for wrong-audience / wrong-scope → 401/403; distinct RFC 9728 PRM (TEST-PLAN H1–H6). Register stub `hcp_*` tools from `@learncard/hcp` on the HCP mount.

---

## M — Recognition MCP guts (deferred from this cut)

**Size:** M  
**Covers:** LC-2314 / LC-2315 / LC-2316 (ticket Done-when for Recognition).  
**What:**

- Brain grants: `author` vs `issue`; unattended cannot hold `author`; idempotent issue on retry.
- Template authoring tools: draft / update / publish / preview / list + `grant_template_to_agent`.
- Issue tools + claim links: list templates, `draft_recognition`, `issue_recognition` (idempotency key), `create_claim_link`, status / `explain_error`.

**Done-when (when this follow-on ships):**

- Agent with `author` can draft/publish via MCP.
- Agent with `issue` can draft/issue + claim link without double-mint.
- Unattended grant cannot author (verified).

Also adjacent after Recognition lands: LC-2317 cards, LC-2318 packaging (still separate tickets).

---

## L — HCP domain / store + HTTP governance + Agent Interop (LC-2240 body)

**Size:** L  
**What:** Full HCP package beyond stubs (domain + store), HTTP Binding governance plane, Provider/Agent Interop. MCP binding stays A + lean on shared core with isolated OAuth resource.
