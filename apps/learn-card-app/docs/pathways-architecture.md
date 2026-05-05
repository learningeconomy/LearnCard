# Pathways v2 — Architecture & UX Spec

_Greenfield implementation in `apps/learn-card-app`, derived from `.superpowers/LearnCard_Pathways_Synthesis.md`._

This is the first‑pass architecture for the Pathways product inside the LearnCard app. It is explicitly **greenfield alongside** the existing `src/pages/ai-pathways/` feature (skill profile + CareerOneStop/OpenSyllabus exploration, routed at `/ai/pathways`). The existing feature stays shipping while v2 is built at a new route; v2 is intended to eventually absorb and replace it.

The goal is a _foundation_: a data model, state shape, route surface, agent pipeline, and phased roadmap that can carry the product from a cold‑start stub to the full four‑mode vision without being rewritten at each step.

---

## TL;DR for new readers
- Pathways is a learner-owned, agent-orchestrated graph of commitments and evidence,
  with every node projectable to an OB 3.0 credential.
- Atomic unit: PathwayNode with CST stage (Initiation / Policy / Termination).
- Four modes: Today, Map, What-if, Build. One shell.
- Agent proposes, learner commits. Mutations go through ProposalQueue.
- Prime metric: Weekly Committed Learners.
- Audience wedge v1: workforce transitioners (pending product sign-off).
- Biggest risks: Phase 3 (split 3a / 3b with kill criteria).

## Current state (April 2026)

The phase plan below is still the right map. We have moved well past Phase 0.
A quick snapshot — full detail in § 17:

- **Phases 0, 1, 2, 3a complete client-side.** Scaffolding, Today + ranking +
  `chosenRoute`, Map (React Flow) + Build (outline + inspector + policy /
  termination editors + validation), agent infrastructure (swap-ready proxy,
  four-cap budget enforcement, cost ledger, mock agent for five capabilities,
  proposals queue + diff applier, full telemetry taxonomy).
- **What-If is built ahead of schedule.** The Phase 4 simulator, generators,
  tradeoff tables, and `toProposal` path are all in place; What-If is pure
  over graph state so it did not need to wait on the agent wiring.
- **Beyond the original scope:** Credential Engine Registry round-trip
  (`import/` + `projection/toCtdlPathway.ts`), altitude-aware arrival intent
  (see `AltitudeSchema`), and `chosenRoute` as the single source of truth
  shared by Today / Map / What-If.
- **Not done.** Phase 3b — the swap from mock dispatch to a real
  brain-service LLM proxy (the seam exists; the server side does not).
  Neo4j-backed tRPC routes from § 9 are **not yet implemented**. MCP server
  integration is a store stub. VC issuance, endorsement fulfilment, pathway
  sunset, and Playwright E2E coverage are all outstanding.
  `persist.enabled = true` is now **on** for all four Zustand stores
  (`pathwayStore`, `proposalStore`, `offlineQueueStore`,
  `mcpRegistryStore`); fire-and-forget signals on `pathwayStore` still
  need a `partialize` exclusion and `offlineQueueStore.queue` still
  needs a max-size cap before user enablement.

The app-side README at `apps/learn-card-app/src/pages/pathways/README.md`
mirrors this section with folder-level detail and is kept in lockstep.

## 1. North‑star in one paragraph

A learner opens Pathways, sees **one thing to do today** that is obviously connected to who they're becoming. They can zoom out to a **graph** of everything they're working on, run a **"what‑if"** against a proposed alternative path, or **build/edit** a pathway by uploading evidence. Every node they complete can become a Verifiable Credential they own; every significant step can be endorsed by a mentor. The AI proposes, the learner commits. No silent re‑routing, no arbitrary points.

**What Pathways is not:** Pathways is not a course platform. It does not serve content; it organizes commitment. When pressure arrives to add a video player node, a lesson builder, or a marketplace of content to consume, the answer is: Pathways points _at_ content (via MCP-connected tools, external credentials, curated references) but does not _host_ it. The atomic unit is the commitment + the evidence of it, not the material.

---

## 2. The Ten Decisions, mapped to architecture

Each of the ten load‑bearing decisions in the synthesis doc maps to a concrete architectural choice below:

| # | Decision | Where it lives in the architecture |
|---|----------|------------------------------------|
| 1 | FSRS (not SM‑2) for spaced review | `packages/plugins/pathways-fsrs` (new) — pure scheduler, no UI |
| 2 | MCP on both sides | `services/learn-card-mcp-server` already scaffolded; app consumes external MCP servers via a `mcpRegistry` store |
| 3 | CST primitive (Initiation / Policy / Termination) | `PathwayNode.stage` discriminated union — the atomic unit of the whole system |
| 4 | Every node is a potential OB 3.0 claim | `PathwayNode` → `AchievementCredential` via a deterministic projection, not a separate data model |
| 5 | EndorsementCredentials as the social primitive | `PathwayNode.endorsements[]` referencing existing `EndorsementCredential`; endorsement request flow reuses `useAlignments` + endorsement store |
| 6 | Four modes (Today / Map / What‑if / Build) | Four top‑level routes under `/pathways`, one `PathwaysShell` layout, shared graph store |
| 7 | Agent proposes, learner commits | Every agent write goes through a `ProposalQueue` with explicit accept/reject UI; agents cannot mutate the graph directly |
| 8 | First‑mile lights up adjacent opportunities | Cold‑start pipeline runs `PlannerAgent.seedFromCredentials()` against the wallet at first visit, renders **3–5 suggestion cards** with zero required input |
| 9 | Celebrate process, not points | `progress/` primitives: `GraphGrowth`, `Streak` (with grace), `IdentityClaim` — no XP/levels/leaderboards surface |
| 10 | Cloud‑first, offline read / queued write | tRPC via existing `lcnClient` pattern; a `pathwaysOfflineQueue` wraps mutations in IndexedDB; no CRDT in v1 |

---

## 3. Core data model

All types live in a new shared package `packages/pathways-types/` so brain‑service, the MCP server, and the app can share them. Zod validators, not bare interfaces.

### 3.1 `PathwayNode`

```ts
// packages/pathways-types/src/node.ts
export const PathwayNodeSchema = z.object({
    id: z.string().uuid(),
    pathwayId: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),

    // CST primitive — Decision #3
    stage: z.object({
        initiation: z.array(NodeRefSchema),        // prerequisite node ids
        policy: PolicySchema,                      // what the learner does during the stage
        termination: TerminationSchema,            // what evidence ends the stage
    }),

    // Projection to OB 3.0 — Decision #4
    credentialProjection: AchievementProjectionSchema.optional(),

    // Social — Decision #5
    endorsements: z.array(EndorsementRefSchema).default([]),

    // Process metrics — Decision #9
    progress: NodeProgressSchema,                  // { status, artifacts[], reviewsDue, streak }

    // Bookkeeping
    createdBy: z.enum(['learner', 'agent', 'template']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
```

### 3.2 `Policy` — the variable shape

A policy is a discriminated union so a "daily writing for 30 days" node and a "pass an assessment" node share the same primitive without stringly‑typed fields:

```ts
export const PolicySchema = z.discriminatedUnion('kind', [
    z.object({ kind: 'practice',     cadence: CadenceSchema,       artifactTypes: z.array(ArtifactTypeSchema) }),
    z.object({ kind: 'review',       fsrs: FsrsParamsSchema }),                                 // Decision #1
    z.object({ kind: 'assessment',   rubric: RubricSchema }),
    z.object({ kind: 'artifact',     prompt: z.string(),           expectedArtifact: ArtifactTypeSchema }),
    z.object({ kind: 'external',     mcp: McpToolRefSchema }),                                  // Decision #2
]);
```

### 3.3 `Termination`

```ts
export const TerminationSchema = z.discriminatedUnion('kind', [
    z.object({ kind: 'artifact-count',    count: z.number().int().positive(), artifactType: ArtifactTypeSchema }),
    z.object({ kind: 'endorsement',       minEndorsers: z.number().int().positive(), trustedIssuers: z.array(z.string()).optional() }),
    z.object({ kind: 'self-attest',       prompt: z.string() }),
    z.object({ kind: 'assessment-score',  min: z.number() }),
    z.object({ kind: 'composite',         of: z.array(TerminationSchema), require: z.enum(['all', 'any']) }),
]);
```

### 3.4 `Pathway`

```ts
export const PathwaySchema = z.object({
    id: z.string().uuid(),
    ownerDid: z.string(),
    title: z.string(),
    goal: z.string(),                               // natural-language "why"
    nodes: z.array(PathwayNodeSchema),
    edges: z.array(EdgeSchema),                     // typed: 'prerequisite' | 'sibling' | 'alternative' | 'reinforces' | 'satisfies'
    status: z.enum(['active', 'archived', 'sunset']), // sunset = user-abandoned, retains CVs but stops nudging
    visibility: VisibilitySchema,                   // who can see what — guardian / mentor / public
    source: z.enum(['template', 'generated', 'authored']),
    templateRef: z.string().optional(),
});
```

### 3.5 `Proposal` — sibling collection, not embedded

Proposals have a different lifecycle than the pathway itself (TTL, expiry, per-agent rate limits, cross-pathway proposals from the Matcher), so they live in their own collection keyed by `pathwayId`. This keeps proposals queryable globally ("all open proposals for this user across all pathways") without loading every pathway document, and avoids versioning proposals together with structural graph changes.

```ts
export const ProposalSchema = z.object({
    id: z.string().uuid(),
    pathwayId: z.string().uuid().nullable(),    // null = cross-pathway (e.g. Matcher suggesting a new pathway)
    ownerDid: z.string(),
    agent: z.enum(['planner', 'coach', 'recorder', 'router', 'matcher']),
    reason: z.string(),
    diff: PathwayDiffSchema,
    tradeoffs: z.array(TradeoffSchema).optional(),
    status: z.enum(['open', 'accepted', 'rejected', 'expired', 'superseded']),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
});
```

### 3.6 Projection to VCs — Decision #4

A node does _not_ store a VC; it stores a **projection** describing how to _issue_ one when the learner requests:

```ts
export const AchievementProjectionSchema = z.object({
    achievementType: z.string(),        // OB 3.0 achievementType
    criteria: z.string(),
    image: z.string().url().optional(),
    alignment: z.array(AlignmentRefSchema).optional(),
    // At issuance: merge with pathway goal + learner evidence → sign as AchievementCredential
});
```

This keeps the pathway graph cheap to mutate (no signing on every edit) and defers the cryptographic cost to the moment of credentialing. It also means a node can be **retroactively re‑projected** if the achievement schema evolves (which it will).

### 3.7 `ActionDescriptor` — where the learner goes to act (v0.5)

**Status:** Shipped. See `apps/learn-card-app/src/pages/pathways/types/action.ts`, dispatch in `core/action.ts`.

Policy tells us the *shape* of the work; projection tells us *what credential represents completion*. Neither of them tells the UI **where the learner should go to actually do it**. That was a real gap: Today and NodeDetail both hid one-off branches for "does this node have an earnUrl?", "is `policy.kind === 'external'`?" and defaulted everything else to "open the NodeDetail overlay." With the surface expanding to AI Tutor sessions, App Store listings, and dozens of external providers (Khan, Coursera, ETS, Handshake…), guessing a CTA from policy kind stops being honest.

`ActionDescriptor` is an **optional** discriminated union on `PathwayNode.action`:

```ts
type ActionDescriptor =
    | { kind: 'in-app-route'; to: string; params?: Record<string, string | number | boolean> }
    | { kind: 'app-listing'; listingId: string; deepLinkSection?: string }
    | { kind: 'external-url'; url: string; mobileDeepLink?: string }
    | { kind: 'mcp-tool'; ref: { serverId: string; toolName: string; defaultArgs?: … } }
    | { kind: 'none' };
```

Load-bearing design choices:

- **Orthogonal to Policy / Termination / Projection.** A `practice` policy can launch via any action kind. Authors pick each axis independently — the UI uses all four together to render an honest CTA.
- **App-listing references a registry entry, not a URL.** `AppStoreListingValidator` in brain-service is our provider registry — first-party apps AND external providers with `launch_type: DIRECT_LINK` (Coursera, Khan, Handshake) live there. `launch_type` already tells us how to open them; `providerKind` would be a second axis we don't need.
- **Optional field, graceful fallback.** Nodes authored before the field existed keep working. `resolveNodeAction` in `core/action.ts` synthesises a best-effort `ResolvedAction` from legacy signals:
  1. `node.action` (explicit) — wins when present.
  2. `credentialProjection.earnUrl` + `earnUrlSource` — synthesised `external-url`. `subjectWebpage` flags as `landingPage: true` so surfaces degrade copy ("View landing page" vs. "Go to issuer page").
  3. `policy.external.mcp` — synthesised `mcp-tool`.
  4. Otherwise — `none` (local-only node; NodeDetail overlay is the destination).
- **Telemetry separates signal from source.** `PATHWAYS_ACTION_DISPATCHED` carries `kind` *and* `source: 'explicit' | 'earn-url' | 'mcp-policy' | 'none'` so we can measure how much of the CTA dispatch is driven by authored descriptors vs. legacy fallbacks — a practical proxy for "did authors adopt the new field?".

`NodeDetail` and `Today`'s `NextActionCard` both dispatch through `resolveNodeAction`. `external-url` renders an `<a target="_blank">`; `in-app-route` / `app-listing` use `history.push` through `buildInAppHref` (which substitutes `:slot` params and pushes the rest into the query string). MCP and `none` keep the learner inside the NodeDetail overlay — MCP is agent-driven work, not navigation; `none` means "the overlay *is* the destination."

### 3.8 `OutcomeSignal` — real-world results, not step completion (v0.5)

**Status:** Shipped schema + matcher + binder. UI surfacing (dedicated Outcome panel in Build/Today) is next. See `types/outcome.ts`, `core/outcomeMatcher.ts`, `agents/credentialBinder.ts`.

Termination answers *"did the learner execute the pathway?"*. Outcome signals answer *"did executing it produce the intended result?"*. A pathway with 100% node completion can still fail its outcome; conversely, learners get outcomes without finishing pathways. Collapsing the two into one "green check" hides the iteration loop we need in order to measure pathway *effectiveness* (not just *fidelity*).

Signals live on `Pathway.outcomes?: OutcomeSignal[]` and are a discriminated union keyed on `kind`:

```ts
type OutcomeSignal =
    | { kind: 'credential-received'; expectedCredentialType: string; expectedIssuerDid?: string; … }
    | { kind: 'score-threshold';     expectedCredentialType: string; field: string; op: ComparisonOp; value: number; … }
    | { kind: 'enrollment';          institutionHint?: string; … }
    | { kind: 'employment';          employerHint?: string; … }
    | { kind: 'wage-delta';          minDeltaPercent?: number; … }   // matcher gated — needs trusted payroll roster
    | { kind: 'self-reported';       prompt: string; … };             // human-only
```

Each signal carries common fields: `id`, `label`, `description?`, `minTrustTier`, optional `window`, and an optional `binding: OutcomeBinding` recorded when a wallet credential satisfies the predicate.

Load-bearing design choices:

- **Trust tier gate is separate from predicate.** The matcher answers the data question ("does this VC match?"); the binder answers the trust question ("does the issuer clear the minimum tier?"). `classifyIssuerTrust` is the swap point for a proper issuer registry later; today it promotes DIDs listed in `institutionIssuers` / `trustedIssuers` and defaults anything else to `trusted`.
- **Window is a flag, not a gate.** VCs outside a signal's declared window still produce proposals (learners commonly earn things late); `OutcomeBinding.outOfWindow: true` tags them so cohort analytics can split in-window vs. out-of-window effectiveness rather than hiding tail observations.
- **Bindings go through the proposal pipeline.** The credential binder (`agents/credentialBinder.ts`) is a deterministic local observer — no LLM, no budget burn, no cost ledger. When a wallet VC matches an outcome predicate AND the issuer clears the trust tier, the binder constructs a `Proposal` with `capability: 'interpretation'` and `diff.setOutcomeBindings`. Rationale:
  - The learner *always* confirms a binding. A VC landing in the wallet doesn't auto-commit — it proposes. The core architecture invariant ("agent proposes, learner commits") survives contact with credentials-as-outcomes.
  - `PathwayDiff.setOutcomeBindings` extends the existing `applyProposal` seam. No new write path. Stale patches for unknown outcome ids are silently dropped (cross-device replay safety).
- **Emitted one proposal per matching outcome.** A single VC that satisfies five outcomes across three pathways produces five proposals, not one bundle. The learner can accept / reject each independently, which matches the existing Proposal UX and prevents a wrongly-matched outcome in pathway A from blocking the correct match in pathway B.
- **`wage-delta` schema is declared but matcher returns `pending-implementation`.** Authors can write the signal today so cohort analytics code can be drafted against it; auto-binding lights up when a trusted payroll issuer roster ships.

Two telemetry events accompany the lifecycle: `PATHWAYS_OUTCOME_AUTOBIND_PROPOSED` (binder emitted a proposal, still awaiting commit) and `PATHWAYS_OUTCOME_BOUND` (learner accepted a proposal or manually bound). A `PATHWAYS_OUTCOME_BINDING_CLEARED` event covers revocation / learner dispute.

---

## 4. Routes, modes, layout

Mounted under a single lazy shell. The four modes share **one graph store** and one header; only the viewport changes.

```
/pathways                    → redirects to /pathways/today (or /onboard on cold start)
/pathways/onboard            → first-mile cold-start flow (Section 6)
/pathways/today              → Mode 1: Today (one node, one action, zero distraction)
/pathways/map                → Mode 2: Map (zoomed-out graph + filters)
/pathways/what-if            → Mode 3: What-if (simulate alternative paths, explicit trade-offs)
/pathways/build              → Mode 4: Build (author/edit, upload artifacts)
/pathways/node/:id           → focused node detail (overlays current mode, does not replace it)
/pathways/proposals          → agent proposals queue (Decision #7)
/pathways/endorsements       → incoming/outgoing endorsement requests
```

Route registration lands in `src/Routes.tsx` alongside the existing AiPathways line:

```tsx
const Pathways = lazyWithRetry(() => import('./pages/pathways/PathwaysShell'));
// ...
<PrivateRoute path="/pathways" component={Pathways} />
```

---

## 5. App folder layout (concrete)

```
apps/learn-card-app/src/pages/pathways/
├── PathwaysShell.tsx                 # <Switch> over the four modes, shared header, graph provider
├── PathwaysHeader.tsx                # mode tabs, goal title, proposal count badge
│
├── today/
│   ├── TodayMode.tsx                 # renders the single "next action"
│   ├── NextActionCard.tsx
│   ├── StreakRibbon.tsx              # graceful recovery, Lally framing
│   └── IdentityBanner.tsx            # "You are becoming X" — habit-identity framing
│
├── map/
│   ├── MapMode.tsx                   # graph viewport (react-flow or cytoscape — see Section 10)
│   ├── NodeChip.tsx
│   ├── EdgePath.tsx
│   └── MapFilters.tsx                # by status, by mentor, by credential category
│
├── what-if/
│   ├── WhatIfMode.tsx                # side-by-side current vs proposed
│   ├── TradeoffTable.tsx             # explicit cost/time/effort deltas — no hidden assumptions
│   └── SimulationRunner.tsx
│
├── build/
│   ├── BuildMode.tsx
│   ├── NodeEditor.tsx
│   ├── StageEditor.tsx               # init/policy/termination editor (the CST primitive exposed)
│   ├── ArtifactUploader.tsx          # "Proof of effort" framing
│   └── TemplatePicker.tsx            # curated templates — not the open marketplace (deferred)
│
├── onboard/
│   ├── OnboardRoute.tsx
│   ├── GoalCapture.tsx               # "what are you trying to do?"
│   ├── CredentialScan.tsx            # synthesize existing VCs into suggestions
│   └── SuggestionGrid.tsx            # 3–5 cards, zero-config commit
│
├── proposals/
│   ├── ProposalsRoute.tsx
│   ├── ProposalCard.tsx              # Accept / Reject / Modify
│   └── ProposalDiff.tsx              # shows exactly what the agent wants to change
│
├── node-detail/
│   ├── NodeDetailOverlay.tsx
│   ├── EvidencePanel.tsx             # uploaded artifacts + AI interpretation + learner confirmation
│   ├── EndorsementPanel.tsx
│   └── ReviewsPanel.tsx              # FSRS-scheduled review items
│
├── agents/                           # pure TS — no React — the "proposes" side of Decision #7
│   ├── plannerAgent.ts
│   ├── coachAgent.ts
│   ├── recorderAgent.ts
│   ├── routerAgent.ts
│   ├── matcherAgent.ts
│   ├── proposalBus.ts                # single write-channel into ProposalQueue
│   └── __tests__/
│
├── scheduler/
│   ├── fsrsScheduler.ts              # thin wrapper over ts-fsrs
│   └── reviewQueue.ts
│
├── graph/
│   ├── graphOps.ts                   # pure graph algorithms (reachability, critical path, cycle detection)
│   └── projection.ts                 # PathwayNode → AchievementCredential projection
│
├── hooks/
│   ├── usePathway.ts
│   ├── useNextAction.ts              # what belongs in Today mode right now
│   ├── useProposals.ts
│   ├── useEndorsements.ts
│   └── useMcpTools.ts
│
└── types.ts                          # re-export from @learncard/pathways-types for ergonomic imports
```

Cross‑cutting state lives in `apps/learn-card-app/src/stores/pathways/`:

```
pathwayStore.ts              # Zustand — current pathway, nodes, edges
proposalStore.ts             # agent proposals waiting on the learner
offlineQueueStore.ts         # queued mutations when offline
mcpRegistryStore.ts          # discovered MCP servers + scopes the user granted
```

---

## 6. Cold‑start / first‑mile pipeline (Decision #8)

This is the single most important UX sequence in the product. **Target: under 10 seconds** from first nav to suggestions rendered — a target, not a contract, and worth stress‑testing against real network + cold‑model latency before Phase 1 ships.

```
User lands on /pathways
        │
        ▼
Has existing Pathway? ─yes─► /pathways/today
        │ no
        ▼
/pathways/onboard
        │
        ▼
┌───────────────────────────────┐
│ Step 1: GoalCapture           │
│   free-text goal OR           │
│   pick-from-templates         │
│   OR skip (→ pure inference)  │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 2: CredentialScan        │
│   read wallet VCs via         │
│   existing lcnClient/react-   │
│   query — no new endpoint     │
│   extract skills + alignments │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 3: PlannerAgent.seed()   │
│   (a) vector lookup over a    │
│       small curated corpus    │
│       → sub-second, no LLM    │
│   (b) LLM rerank + summary    │
│       ONLY if confidence low  │
│   → 3–5 candidate pathways    │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ Step 4: SuggestionGrid        │
│   each card shows:            │
│   - title + goal              │
│   - 3 first-nodes preview     │
│   - effort estimate (honest   │
│     range, not a single num)  │
│   - "Start this" single click │
└───────────────────────────────┘
```

Cold‑start without any credentials and a vague goal (a _structural weakness_ the synthesis doc flagged) is handled by **goal templating**: if the wallet is empty _and_ the goal is vague, we don't auto‑generate — we show three hand‑authored template pathways with an explicit "we'll personalize this as you add evidence" note. Honesty over magic.

**Why vector-first, LLM-maybe:** RAG against a small, curated template corpus is indistinguishable in quality from an LLM call at the first‑mile (the corpus is the quality signal), runs in sub‑second time, has zero per‑user cost, and degrades gracefully when the LLM provider is down. The LLM only enters the loop when vector confidence is low or the learner explicitly asks "generate something new."

---

## 7. Agent pipeline (Decision #7, pragmatic)

Agents are pure TS in `pages/pathways/agents/`. **Orchestration runs client‑side** (so the browser holds learner context, UI state, and cancels mid‑stream); **model calls are proxied through brain‑service** (so the server holds API keys, server‑side audit logs of every prompt/response, rate limiting per learner, and a prompt‑injection firewall against MCP tool outputs). This split keeps agents testable and responsive while keeping the trust boundary on the server.

Agents **never** write to `pathwayStore` directly. They write `Proposal` objects to `proposalStore` via a single `proposalBus`.

### 7.1 Reads vs writes — the important distinction

Not every agent output is a Proposal. **Agent‑suggested mutations** go through the ProposalQueue; **agent‑enriched reads** render inline in real time:

| Scenario | Kind | UI treatment |
|----------|------|--------------|
| Recorder interpreting an upload _while the learner is in the upload flow_ | **Read** | Inline interpretation shown alongside upload; learner confirms in the same step |
| Recorder saying "this artifact completes node X" | **Write** | Proposal — learner accepts / rejects separately |
| Coach suggesting a reflection prompt at the top of Today | **Read** | Rendered inline; dismissing costs nothing |
| Coach rescheduling FSRS intervals | **Write** | Proposal |
| Planner showing candidate pathway previews in onboard | **Read** | Rendered as suggestion cards |
| Planner modifying an existing pathway's structure | **Write** | Proposal |

The guiding rule: if accepting the agent's output **changes stored graph state**, it's a proposal. If it only informs what the learner is already doing, it's a read.

```ts
// agents/proposalBus.ts
export interface Proposal {
    id: string;
    agent: 'planner' | 'coach' | 'recorder' | 'router' | 'matcher';
    reason: string;                   // plain-language explanation shown in UI
    diff: PathwayDiff;                // structural diff the learner can preview
    tradeoffs?: Tradeoff[];           // for router/matcher: explicit cost, time, effort
    createdAt: string;
    ttl?: string;                     // some proposals auto-expire (stale recommendations)
}

export async function propose(p: Omit<Proposal, 'id' | 'createdAt'>): Promise<void> { /* ... */ }
```

UI surfaces:
- **Badge on `/pathways/proposals`** — count of open proposals.
- **Inline on the relevant node** — a small "proposed change" chip, not a blocking modal.
- **Accept / Reject / Modify** — Modify opens Build mode pre‑filled with the proposed diff applied, so the learner can counter‑edit.

### 7.2 Agent capabilities (the actual v1 contract)

The architecture commits to a set of **capabilities** — what the agent layer must be able to do for the product to work. Which _named_ agents deliver those capabilities, and how they split the work, is an implementation decision we expect to revise once Phase 3 instrumentation lands. Naming them up front would ossify a boundary we don't yet have evidence for.

**Capabilities in v1:**

| Capability | Input | Output | Typical budget tier |
|------------|-------|--------|---------------------|
| **Planning** | learner goal + wallet VCs + template corpus | draft `Pathway` or subtree (proposal) | medium |
| **Interpretation** | uploaded artifact + active pathway context | (a) inline enrichment during upload (read), (b) "this maps to node X" (proposal) | low per upload |
| **Nudging** | `NodeProgress` history, streak state, FSRS state | reflection prompt (read) or reschedule (proposal) | low |
| **Routing** | stalls, failed terminations, abandoned nodes | alternative path + explicit tradeoffs (proposal) | medium |
| **Matching** | current state + MCP tool outputs | external opportunity — job / course / community (proposal) | medium, daily‑capped |

V1 implementation ships these as five named agents (`PlannerAgent`, `RecorderAgent` for Interpretation, `CoachAgent` for Nudging, `RouterAgent`, `MatcherAgent`) in `pages/pathways/agents/`. That's an implementation detail documented in code, not a contract. Phase 3 telemetry will tell us whether Matching should split by concern (jobs vs courses vs communities have different cost profiles and MCP dependencies) or whether Nudging and Interpretation should share primitives. Either move is allowed so long as the capability contract above still holds.

### 7.3 Cost control

Each capability has a **budget tier** (`low` / `medium` / `high`) and a **trigger policy** (`on-event` / `periodic` / `on-demand`). Nudging runs on‑demand only when the learner opens Today. Matching is periodic (daily max) and budget‑capped.

Budgets are expressed in two tiers, both in `agents/budgets.ts` and enforced on both sides of the proxy (client throttling + server rate limit):

```ts
export const CAPABILITY_BUDGETS = {
    planning:       { perInvocationCents: 10, maxDailyInvocations: 20 },
    interpretation: { perInvocationCents: 2,  maxDailyInvocations: 50 },
    nudging:        { perInvocationCents: 1,  maxDailyInvocations: 30 },
    routing:        { perInvocationCents: 8,  maxDailyInvocations: 10 },
    matching:       { perInvocationCents: 6,  maxDailyInvocations: 4  },
} as const;

export const LEARNER_MONTHLY_CAP_CENTS  = 200;   // hard cap per learner per month
export const TENANT_MONTHLY_CAP_CENTS   = 50_000; // soft cap per tenant, alerts + rate-limits
```

Per‑invocation budgets prevent runaway single calls; **per‑learner monthly caps** prevent a single user from consuming a tenant's entire budget; **per‑tenant caps** surface as alerts + progressively stricter rate limits before the bill becomes a surprise. Exact numbers are placeholders pending product/finance input in Phase 3; the _shape_ (invocation + learner + tenant caps, all in one file) is the commitment.

---

## 8. State management

Zustand (matches the existing pattern in `apps/learn-card-app/src/stores/`). Three stores, each with a narrow responsibility. React Query handles server reads; stores handle optimistic UI, offline queue, and derived state.

```ts
// stores/pathways/pathwayStore.ts
interface PathwayState {
    pathways: Record<string, Pathway>;
    activePathwayId: string | null;

    // mutations — all go through proposalBus first unless learner-initiated
    applyProposal: (proposalId: string) => void;
    rejectProposal: (proposalId: string) => void;
    editNode: (nodeId: string, patch: Partial<PathwayNode>) => void;  // learner-initiated
    completeTermination: (nodeId: string, evidence: Evidence[]) => void;

    // selectors
    getNextAction: () => ScoredCandidate | null;  // drives Today mode — see 8.1
    getBlockedOn: (nodeId: string) => NodeRef[];
    getReviewsDueToday: () => ReviewItem[];
}
```

Derived state like `getNextAction` is the only place we encode "what should the learner do now?" logic, which keeps Today mode **reactive to everything** — new endorsements, FSRS reviews coming due, accepted proposals, fresh stalls — flowing through the same code path.

### 8.1 `getNextAction` is a scoring function, not a selector

The inputs `getNextAction` has to balance — FSRS reviews due, streak preservation, stalled nodes flagged by the Router, newly accepted proposals, time-of-day, a fresh endorsement arriving — do not reduce to a single conditional tree without becoming a god function no one wants to touch. Instead, model it as a **pure scoring function over a set of candidate `NodeRef`s** with explicit, testable, tunable weights:

```ts
// pages/pathways/today/ranking.ts
export interface ScoredCandidate {
    node: NodeRef;
    score: number;
    reasons: string[];   // plain-language — doubles as UI copy and debug trail
}

export function scoreCandidate(
    candidate: NodeRef,
    context: RankingContext,   // { now, fsrsDue, stalls, streakState, recentEndorsements, ... }
    weights: RankingWeights,   // tuned constants, exported for A/B
): ScoredCandidate { /* ... */ }

export function getNextAction(ctx: RankingContext, weights: RankingWeights): ScoredCandidate | null {
    return candidateNodes(ctx)
        .map(n => scoreCandidate(n, ctx, weights))
        .sort((a, b) => b.score - a.score)[0] ?? null;
}
```

Two wins from this shape:
- **Testability.** Every input is a pure value. Fixture a `RankingContext`, assert the ranked output. Regressions don't sneak in.
- **"Why am I seeing this?"** The `reasons` array _is_ the UI copy for the hint line under the NextActionCard ("FSRS review due · Active streak · Endorsed yesterday") and the debug trail when a learner disagrees. No extra work to produce it.

Weights live in `today/rankingWeights.ts` and are versioned — shipping a weights update is a product change, not an implementation detail hidden in a selector.

---

## 9. Server surface (brain‑service)

Minimal new surface. All additions are tRPC procedures in `services/learn-card-network/brain-service/src/routes/pathways.ts` (new file, matching the existing route pattern).

```
pathways.list                                    → Pathway[]
pathways.get({ id })                             → Pathway
pathways.create({ draft })                       → Pathway
pathways.updateNode({ pathwayId, nodeId, patch })→ PathwayNode
pathways.submitEvidence({ nodeId, artifacts })   → NodeProgress
pathways.issueFromNode({ nodeId })               → AchievementCredential  (projection → sign)
pathways.requestEndorsement({ nodeId, toDid })   → EndorsementRequest
pathways.listProposals({ pathwayId })            → Proposal[]
pathways.commitProposal({ proposalId })          → Pathway
pathways.rejectProposal({ proposalId })          → void
pathways.archive({ pathwayId, reason })          → Pathway   // "sunset" states, addresses pathway decay
```

Storage: Neo4j (already present). `Pathway`, `PathwayNode`, `Edge` map naturally to labeled nodes + relationships, which lets us query "what am I blocked on" / "what credentials satisfy this node" as graph queries instead of N+1 joins.

---

## 10. UX decisions worth committing to now

These are the ones where the default is easy to get wrong:

**Four modes, one shell.** The shell is a persistent header (goal title, mode tabs, proposal badge) and a single `GraphProvider` context. Switching modes is a viewport change, never a data fetch. This is what makes Map → What‑if feel instant.

**Map viewport technology: React Flow (with a Phase 2 spike).** React Flow is the right default for Build mode, where the learner is editing nodes and edges. For Map mode the primary interaction is reading and filtering, and React Flow's complexity cost may be overkill. Phase 2 includes a **two‑hour spike** comparing React Flow against a custom SVG layout specifically for Map‑mode read/filter ergonomics before we commit. Build mode commits to React Flow unconditionally.

**Progressive disclosure, literally:** the Map defaults to **depth‑2 around the current focus node**. Zooming out reveals more. This is the "circle → path → graph" the synthesis doc calls for, and it prevents the first‑visit overwhelm that kills engagement in graph‑heavy UIs.

**Honest loading states.** Agent responses are slow (LLM proxy round‑trip + MCP tool calls). Never block the UI. Show the proposal appearing with a subtle fade; pre‑render skeleton cards with the reason string streamed first, diff second. Aligns with the existing AGENTS.md UX guidance on loading.

**Streaks without dark patterns.** A streak has a **grace window** (Lally: missing a day doesn't reset). Missed days render as _light_ segments in the ribbon, not _broken_ ones. The learner gets a single truthful line: _"Consistency isn't about perfect streaks — it's about coming back."_

**Identity framing.** One line above Today: _"You are becoming a better writer."_ Pulled from `pathway.goal`, past‑progressive tense. This is the habit‑identity research the synthesis doc correctly flags as real.

**No points, no levels, no leaderboards.** Full stop. Progress is visible growth of the graph, endorsements on nodes, and credentials issued. Anyone who asks for XP gets pointed at this doc.

---

## 11. Offline conflict policy

Section 2 / Decision #10 commits to "cloud‑first with offline read / queued write" and explicitly defers CRDT to v2. That's the right scope, but queued mutations against a graph have real conflict semantics that need a default policy, not a TODO.

**Default policy (v1):**

| Mutation type | Conflict strategy | Rationale |
|---------------|-------------------|-----------|
| Evidence uploads (artifact → node) | **Client wins**; server appends | Evidence is additive; we don't want to lose a learner's submitted artifact |
| `completeTermination` | **Client wins** if the node wasn't archived server‑side; otherwise surface a reconciliation prompt | Learner finished the work; respect it unless the node is structurally gone |
| Learner-initiated structural edits (rename, add node, reorder) | **Last-write-wins**, with server timestamp tiebreak | Rare enough across devices to tolerate |
| Agent proposals committed offline | **Server wins** (re-fetch, re-check proposal still exists / not expired, then re-apply) | Proposals have lifecycle state the client can't authoritatively know |
| Cross-device stale proposal cache | **Server wins**; stale entries invalidated on reconnect; UI shows "this suggestion was already acted on elsewhere" dismiss-only banner | Device B can't authoritatively accept a proposal Device A already accepted / superseded |
| Node archival / sunset | **Server wins** | Avoids "ghost revived nodes" after a delete |

The offline queue in `offlineQueueStore.ts` tags each mutation with its conflict strategy at enqueue time, and `reconcileOnReconnect()` applies the right resolution per entry. Conflicts that need learner input (only the "archived node completion" case above) render as a small banner, not a modal.

This is deliberately simple. If it's wrong in a way that shows up in telemetry (Section 13), we revisit before adding CRDTs.

---

## 12. Theming & multi‑tenant

Register a new `CredentialCategoryEnum.pathway` (or reuse `aiPathway` if the tenant config team prefers — decide before shipping v1). Add category colors to each theme's JSON in `src/theme/schemas/<name>/theme.json`. Never import generic Tailwind colors; follow the AGENTS.md palette.

Tenant config gains an optional `pathways?: { enabled: boolean; curatedTemplateSet?: string }` section in `packages/learn-card-base/src/config/tenantConfigSchema.ts`. Tenants that don't want Pathways can simply disable it; the route registers behind a feature flag.

---

## 13. Telemetry

### 13.0 Prime metric

Everything else in this section is diagnostic. This is the number the product is built to move:

> **Weekly Committed Learners (WCL)** — unique learners who, in a given ISO week, either accepted at least one proposal _or_ completed at least one termination. A learner is "committed" when they took an action that moved the graph forward; we don't count passive opens.

_Rationale:_ WCL captures both sides of the product thesis simultaneously. It rewards agent utility (proposals are only useful if they get accepted) _and_ learner agency (terminations are learner‑initiated). It's resilient to seasonality the way DAU isn't, and unlike "time in app" it doesn't reward the wrong thing. Two alternative candidates (time‑to‑first‑credential, endorsement density) are valuable lagging / quality indicators and appear below as secondary metrics; they shouldn't replace WCL as the north star.

**Status: product sign‑off required before Phase 1 ships.** Naming this metric is a product decision; the architecture commits to the _shape_ (a single prime metric, visible at the top of telemetry, that governs ranking‑weight tuning and Phase 3 kill criteria).

**Secondary metrics:**
- **Time‑to‑first‑credential** — account creation → first `AchievementCredential` issued. Captures first‑mile value.
- **Endorsement density** — average endorsements per completed node. Captures whether the social trust layer is forming.
- **Proposal acceptance rate, by capability** — diagnostic for agent utility.

### 13.1 Event taxonomy

Observability is designed alongside the agent boundary, not bolted on. One event taxonomy, scoped to Pathways, emitted from both the client (learner actions) and brain‑service (agent invocations, proposal lifecycle).

**Core events:**

| Event | Surface | Fields |
|-------|---------|--------|
| `pathways.onboard.started` | client | `hasWallet`, `goalMode` (`free‑text` / `template` / `skipped`) |
| `pathways.onboard.suggestionsRendered` | client | `latencyMs`, `vectorOnly: boolean`, `suggestionCount` |
| `pathways.onboard.suggestionAccepted` | client | `suggestionId`, `position` |
| `pathways.today.nextActionShown` | client | `nodeId`, `reasons[]`, `topScore`, `runnerUpScores[]` |
| `pathways.today.nextActionDismissed` | client | `nodeId`, `reasons[]` |
| `pathways.node.terminationCompleted` | client | `nodeId`, `terminationKind`, `evidenceCount`, `offlineQueued: boolean` |
| `pathways.proposal.created` | brain‑service | `agent`, `pathwayId`, `tokensIn`, `tokensOut`, `latencyMs`, `costCents` |
| `pathways.proposal.accepted` | client | `proposalId`, `agent`, `ageMs` |
| `pathways.proposal.rejected` | client | `proposalId`, `agent`, `ageMs` |
| `pathways.proposal.expired` | brain‑service | `proposalId`, `agent` |
| `pathways.agent.budgetExceeded` | brain‑service | `agent`, `tier`, `cappedAt` |
| `pathways.learnerCost.snapshot` | brain‑service | `learnerDid`, `monthToDateCents`, `byCapability: Record<Capability, cents>` — emitted daily or per session |
| `pathways.endorsement.requested` | client | `nodeId`, `endorserRelationship` (`mentor` / `peer` / `guardian` / `institution`) |
| `pathways.endorsement.received` | brain‑service | `nodeId`, `endorserTrustTier`, `latencyMs` |
| `pathways.endorsement.declined` | client | `nodeId`, `reason?` |
| `pathways.offline.conflict` | client | `mutationType`, `resolution` |

**Questions the taxonomy has to answer in Phase 3+:**
- Is WCL growing, flat, or declining? (the prime metric)
- Which Planner proposals get accepted vs rejected, by subtopic?
- Which nodes stall most often (Router's input signal)?
- What is our proposal‑to‑commit latency distribution? (Long tail = trust erosion.)
- What is **cost per active learner per month**, by capability — and is it within the `LEARNER_MONTHLY_CAP_CENTS` at p99?
- Is the endorsement graph forming? (endorsement density trending up or stagnant?)
- How often does offline conflict resolution actually surface to the learner?

Events ride on the app's existing analytics transport (`src/analytics/`), namespaced with a `pathways.*` prefix.

---

## 14. Graceful degradation (agents‑offline mode)

If the LLM proxy is down, a tenant has exhausted its budget cap, or the learner is offline, **Today mode still works**. `getNextAction` depends only on stored graph state and locally‑computable signals (FSRS due dates, streak state, recent endorsements) — no agent input required. The ranking function includes agent‑origin signals (Router‑flagged stalls, fresh Matcher opportunities) but treats their absence as zero contribution, not a blocker.

**Degraded‑mode guarantees:**
- Today mode renders a next action.
- Map mode renders the current graph.
- Build mode allows learner edits; they queue offline if needed.
- What‑if mode shows cached simulations; new simulations gate behind "needs connection."
- The proposal queue renders what's already there; no new proposals arrive.
- A subtle ribbon in the header indicates `Offline · Today and saved progress still work` — never a blocking toast.

This is enforced by a single code contract: **any function whose return value is shown in Today mode must be callable with `agentSignals: null`** and produce a sensible output. Tested with a dedicated test suite that runs `today/*` with agent signals stripped.

---

## 15. Package vs in-app — what ships where

Reviewer's question, worth a dedicated answer. The options are (a) build everything inside `apps/learn-card-app`, (b) build everything as a standalone `@learncard/pathways` package, or (c) a hybrid split. I recommend **(c) hybrid** — splitting core from UI along the lines of testability and reusability, not along an arbitrary package boundary.

**What lives in packages (reusable, independently testable, no app coupling):**

| Package | Contents | Reusability story |
|---------|----------|-------------------|
| `@learncard/pathways-types` | Zod schemas, TS types | Consumed by app, brain‑service, MCP server |
| `@learncard/pathways-core` | Graph ops, CST primitives, projection to OB 3.0, ranking function (`scoreCandidate`), conflict resolution policy | Pure TS, runs anywhere (CLI, tests, embedded tools) |
| `@learncard/pathways-fsrs` | FSRS scheduler wrapper (Decision #1) | Could be used outside Pathways entirely |
| `@learncard/pathways-agents` | Agent interfaces + proposal bus contract; **not** model-specific implementations | Agent logic can be swapped per tenant/provider |

**What stays in `apps/learn-card-app/src/pages/pathways/` (app-coupled UI):**

- React/Ionic components for all four modes
- Zustand stores (they wrap `pathways-core` selectors but live with the app's other stores)
- Route registration, theming, tenant-config wiring
- Playwright flows

**Why hybrid, not monolith or mono‑package:**
- **Against monolith‑in‑app:** the ranking function, FSRS scheduler, and graph ops have real reuse value (MCP server exposing `nextAction` to external agents, CLI tools for pathway authoring, future packages like a `@learncard/pathways-cli` authoring tool). Trapping them inside `apps/learn-card-app/src/` guarantees they get tangled with Ionic imports and become un‑reusable within six months.
- **Against full standalone package:** building Pathways UI in a separate package would force us to invent abstractions for Ionic components, tenant theming, and the existing app's auth/identity layer — all of which are _already_ handled beautifully by living inside the app. It would also fragment the E2E testing story.
- **For hybrid:** the split mirrors what's _already_ testable in isolation (graph algorithms, scheduling, ranking) versus what's inherently app‑shaped (modes, navigation, theming, auth). This is the same pattern the repo already uses for `packages/plugins/*` + consuming apps.

**Overhead cost:** maintaining 4 new packages in the pnpm workspace. Real but small — the repo already manages 80+. The Nx build graph handles caching. The alternative (building everything in‑app first and "extracting later") is the classic over‑confident refactor that never happens.

**One caveat:** do not build the packages until Phase 1 end, when the shapes have been load‑bearing long enough to trust. Phase 0 scaffolding can live inside the app as plain files, then get promoted to packages when Phase 1 stabilizes them.

**Promotion criteria (all three must hold):**
1. **External consumer exists or is concretely planned.** Another app, service, or package either imports the module today or has a written plan to in the next quarter. No speculative promotions.
2. **≥2 weeks of API stability.** No breaking changes to the public surface for two weeks. Measured by scanning `git log` against the module's exports.
3. **Tests pass without app‑layer mocks.** The module's test suite runs green using only the candidate package's own dependencies. If a test needs to mock an Ionic component or the app's auth store, the module isn't ready.

Promotion happens in a single PR per package that (a) moves the files, (b) updates imports in the app, (c) adds the package's `project.json` + `package.json`, (d) adds the package's README with reuse story. If any of the three gates fails, the work stays in‑app and is revisited next phase.

---

## 16. Testing strategy

| Layer | Test type | Location |
|-------|-----------|----------|
| Graph ops, FSRS scheduler, projection, agent reducers | Vitest unit | `pages/pathways/**/__tests__/*.spec.ts` |
| Zustand stores + selectors (getNextAction, etc.) | Vitest with fake timers | `stores/pathways/*.spec.ts` |
| Agent boundary (proposal shape, no direct writes) | Vitest with a mock LLM client | `pages/pathways/agents/__tests__/*.spec.ts` |
| Route-level flows (onboard → today → accept proposal) | Playwright | `tests/pathways/*.spec.ts` |
| tRPC routes | Vitest + Neo4j test container (existing e2e infra) | `services/learn-card-network/brain-service/src/routes/pathways.spec.ts` |

Two flows must exist before merging v1:
1. **Cold start with empty wallet** → lands on onboard → template pick → Today renders within 10s.
2. **Accept a Planner proposal** → pathway updates → Today's next action changes accordingly.

---

## 17. Phased roadmap

Each phase ships end‑to‑end user value. No "foundation‑only" phases that don't render anything.

> **Status (April 2026).** Original phase scope is preserved below for
> historical clarity. Completion status is annotated per phase. The summary:
> 0 / 1 / 2 / 3a done (mock-only for 3a); What-If (scheduled in Phase 4)
> shipped early; 3b + backend work + the rest of Phase 4 + 5 remain. See
> "Current state" at the top of this document for the one-paragraph version.

### Audience wedge (required product decision before Phase 1)

The architecture supports multiple learner audiences, but v1 should be aimed at one. The three hand‑authored templates, the ranking weights in `today/rankingWeights.ts`, the MCP tool priorities in Matching, and which capability we instrument most aggressively all tune to a chosen audience.

**Candidates:**
- **Workforce transitioners** — learners moving between careers, building evidence of transferable skills. High endorsement value, clear external‑opportunity matcher targets (jobs, certifications).
- **Alternative‑credential learners** — learners pursuing non‑traditional credentials outside or alongside formal education. Strong fit for OBv3 projection, endorsement graph is load‑bearing for credential trust.
- **Self‑directed learners** — autonomous learners pursuing personal goals without a specific credential endpoint. Thinnest matcher surface, highest demand on Planning and Nudging.

**Recommended default:** workforce transitioners, because (a) the matcher surface is best‑developed in existing MCP tooling, (b) endorsement relationships map cleanly to mentors/institutions, and (c) time‑to‑first‑credential is a crisp and measurable first‑mile outcome.

**Status: product sign‑off required before Phase 1 templates are authored.** The architecture doesn't care which is picked; the content of the templates, the copy in onboarding, and the ranking weights all do.

**Phase 0 — Scaffolding (1 sprint)** — **Status: complete.**
- Pathways types + Zod validators (in‑app first; promoted to `packages/pathways-types` at end of Phase 1 — see Section 15)
- Route registration, `PathwaysShell`, four empty mode screens with consistent header
- Zustand stores with mock data
- Feature flag in tenant config (default off) — *done: `features.pathways` (tenant config, default off) AND `enableJourneys` LaunchDarkly flag (default off) gate route mount and side-menu link via the centralised `usePathwaysEnabled` hook*
- Analytics event stubs for the core taxonomy — *full taxonomy emitting, not just stubs*

**Phase 1 — Cold start + Today (2 sprints)** — **Status: complete client-side; VC signing + Playwright outstanding.**
- Onboarding flow (goal capture + wallet scan + 3 hand‑authored templates; vector lookup, no LLM yet) — *done, plus an altitude classifier for non-aspirational arrivals*
- Today mode with `scoreCandidate` / `getNextAction` ranking (explicit weights + reasons) — *done, extended with a `chosenRoute`-first selector (`today/selectNextAction.ts`)*
- Streak ribbon + identity banner — *done*
- Evidence upload → termination completion → VC issuance (projection path) — **partial:** evidence + termination + projection (`projection/toAchievementCredential.ts`) done; **VC signing + wallet write not wired**
- Offline queue with conflict policy from Section 11 — *queue store persisted; pure reconciler in `offline/reconcileOnReconnect.ts`; server to drain against does not exist yet*
- Graceful degradation test suite (agents‑offline mode) — **not written**
- Playwright coverage of both required flows — **not written**
- **End of Phase 1:** promote stable types/core/scheduler to packages per Section 15 — **deferred** pending an external consumer (criterion #1)

**Phase 2 — Map + Build (2 sprints)** — **Status: complete; endorsement fulfilment pending a server.**
- React Flow viewport, depth‑2 progressive disclosure — *done, plus collection fan-in detection, `chosenRoute` ribbon, navigate/explore layouts*
- Node detail overlay with evidence + endorsement panels — *done*
- Build mode: node editor, stage editor, artifact uploader — *done, expanded into outline + inspector + policy/termination editors + validate + summarize + templates + history + preview (`build/`)*
- Endorsement request flow wired to existing endorsement store — *UI + store wired; fulfilment requires server-side routing to an endorser, not yet implemented*

**Phase 3 is split because it's the riskiest phase.** Three sprints trying to stand up the proxy, audit logs, rate limits, three agents, the proposals route, diff renderer, budget enforcement, and full telemetry at once is how one phase becomes five. Split it:

**Phase 3a — Agent infrastructure, no agents yet (1.5 sprints)** — **Status: complete client-side; server half of the proxy not yet built.**
- Brain‑service LLM proxy endpoint (one provider, one endpoint) — **not started server-side;** client-side `AgentDispatch` seam in `agents/proxy.ts` is swap-ready
- Server‑side audit log of every prompt/response with learner DID + capability tag — **not started**
- Rate limits: per‑invocation, per‑learner monthly cap, per‑tenant monthly cap — *client-side enforced via pure `decideBudget` in `agents/budgets.ts`; server-side mirror pending*
- Budget enforcement on both sides (client throttle + server rate limit) — *client done; server pending*
- `/pathways/proposals` route with diff renderer, accept / reject / modify UX — *done (`proposals/`); diff applier in `applyProposal.ts`*
- Full Phase 13 telemetry taxonomy emitting — including `pathways.learnerCost.snapshot` — *done*
- Mock agent that generates scripted proposals, to prove the whole pipeline end‑to‑end without an LLM in the loop — *done (`agents/mockAgent.ts`); all five capabilities produce deterministic proposals*

**Phase 3b — First real capability: Interpretation only (1.5 sprints)** — **Status: not started.**

Gated on the brain-service LLM proxy (Phase 3a server half) existing. Once it does, flipping `setAgentDispatch(brainServiceDispatch)` at app boot swaps the whole app from mocks to real Interpretation in one call site.

- RecorderAgent implementation (Interpretation capability) behind the proxy
- Read/write split enforced (Section 7.1): inline enrichment during upload (read) vs "maps to node X" (proposal)
- Dogfood internally for one full sprint before any learners see it
- Reason to start here: Interpretation has the tightest evidence loop (artifact in, mapping out) and the shortest trust trajectory. Wrong mappings are correctable in one click. Wrong Planning output is a much harder recovery.

**Phase 3 kill criteria (do not ship Planner/Coach/Router/Matcher if any holds after two weeks of 3b):**
- \> 30 % proposal rejection rate — means the agent isn't proposing useful things; fix the model/prompt before widening surface.
- \< 5 % proposal acceptance rate — means the ProposalQueue UX itself is broken; fix UX before adding more proposal sources.
- p99 cost per learner month exceeds `LEARNER_MONTHLY_CAP_CENTS` on even the Interpretation capability — unit economics are off before we've added the expensive capabilities.
- Proposal‑to‑commit p50 latency > 10s — trust erodes; fix before layering more agents.

These are hard to write post‑hoc and trivial to write now.

**Phase 4 — Remaining capabilities + What‑if (2 sprints)** — **Status: What-If shipped early; the rest pending 3b.**
- Planning, Nudging, Routing, Matching capabilities enabled (pending Phase 3 kill criteria passing) — **not started** (mock only)
- Simulation runner — *done (`what-if/simulator.ts`)*
- Tradeoff tables with honest cost/time/effort ranges — *done (`WhatIfMode.tsx`)*
- MCP tool discovery — **not started** (`mcpRegistryStore` is a stub)
- External opportunity surfacing (jobs, courses, communities) — **not started** (requires Matching + MCP)

What-If was pulled ahead because it is pure over graph state (`what-if/generators.ts`, `simulator.ts`, `toProposal.ts`) and did not need to wait on the agent wiring. Simulating alternative routes does not require an LLM — it reshuffles `chosenRoute` and asks the ranker what changes.

**Phase 5 — FSRS reviews, social, sunset (2 sprints)** — **Status: scheduler + review UI in place; social + sunset scaffolded but not wired.**
- `scheduler/fsrsScheduler.ts` integration, review queue in Today mode — *scheduler + `ReviewsPanel.tsx` exist; surfacing reviews in Today’s ranker is wired via the `review` policy kind*
- Mentor/guardian sharing surfaces — **not started** (visibility schema exists; no share UI)
- Pathway sunset flow (addresses pathway decay open question) — **not started** (`status: 'sunset'` exists on the schema; no UX)
- Full Playwright regression — **not started**

Beyond v1: TEE‑backed unstructured ingestion, true local‑first CRDT sync, open pathway marketplace/Designer, automated curriculum pruning — all explicitly deferred per the synthesis doc.

---

## 18. Open questions carried forward

These are surfaced from the synthesis doc's Part 4 and remain _decisions we have to make_, not _problems the architecture silently solves_. I'm noting them here so they aren't forgotten; each should get a focused doc before the phase that first exposes them.

- **Credential inflation / reputation weighting** — arrives in Phase 3 when RecorderAgent starts proposing VCs from arbitrary artifacts. We likely need an issuer‑trust tier the UI can render honestly ("self‑issued" vs "endorsed by trusted issuer").
- **Cold‑start with nothing** — partially addressed by hand‑authored templates; needs a product decision on how much we try to generate vs how much we require the learner to scaffold.
- **Unit economics** — agent budget tiers (Section 7) are the scaffolding; actual cost targets per user per month need product/finance input before Phase 3.
- **Pathway decay** — Phase 5 adds `status: 'sunset'`; the UX for "this path has gone quiet, do you still want it?" needs design work.
- **Assessment authenticity for high‑stakes credentials** — likely an integration question (verified assessors via MCP) rather than a UI one, but flagged.
- **AI disagreement resolution** — default is "learner wins." Worth instrumenting disagreements (learner rejects an agent proposal) so the system can weaken or retire bad proposal patterns over time.

---

## 19. What this architecture deliberately does _not_ do

- It does not introduce a new rendering framework, styling system, or state library. Ionic + React + Zustand + React Query + Tailwind tokens — all existing.
- It does not build a pathway marketplace. Curated templates only in v1.
- It does not try to make agents autonomous. Every mutation goes through the learner.
- It does not commit to local‑first. Cloud‑first with offline read / queued write; CRDT is a 2.0 conversation.
- It does not promise the AI is "10 steps ahead." Proposals show their work, including when they're uncertain.

---

_End of v0.3. This document is meant to be edited in place as Phase 0 lands and assumptions meet reality._

---

## Changelog

- **v0.5** — Action descriptors + outcome signals. Added § 3.7 (`ActionDescriptor`) and § 3.8 (`OutcomeSignal`) covering the two new node/pathway primitives shipped in this release, plus the deterministic credential binder (`agents/credentialBinder.ts`) that turns wallet VCs into outcome-binding proposals without LLM cost or budget burn. Extended `PathwayDiff` with `setOutcomeBindings` so `applyProposal` stays the one commit seam. Added four telemetry events (`PATHWAYS_ACTION_DISPATCHED`, `PATHWAYS_OUTCOME_AUTOBIND_PROPOSED`, `PATHWAYS_OUTCOME_BOUND`, `PATHWAYS_OUTCOME_BINDING_CLEARED`). Wired `NodeDetail` and Today's `NextActionCard` to dispatch primary CTAs through `resolveNodeAction` (kind-aware anchor / `history.push` / MCP / overlay fallback), with source-aware copy degradation for CTDL `subjectWebpage` landing pages. No breaking changes — both new fields are optional, legacy `earnUrl` + `policy.external.mcp` paths still work via the resolver's fallback. 54 new Vitest cases (757 total in pathways, all passing).
- **v0.4** — Retrospective + current-state pass. Added the "Current state (April 2026)" callout near the top summarizing that phases 0 / 1 / 2 / 3a are complete client-side (with VC signing, graceful-degradation + Playwright tests, and tenant gating as the Phase 1 gaps), that What-If shipped ahead of schedule because it is pure over graph state, and that Phase 3b is gated on a brain-service LLM proxy whose seam (`agents/proxy.ts:setAgentDispatch`) already exists. Annotated every phase in § 17 with per-bullet completion status. Called out three additions beyond the original scope that are now load-bearing: Credential Engine Registry round-trip (`import/` + `projection/toCtdlPathway.ts`), `intentAltitude` for non-aspirational arrivals, and `chosenRoute` as the single source of truth shared by Today / Map / What-If. No changes to architectural commitments; this release is purely reconciling the document with the code.
- **v0.3** — Incorporated second review round. Added prime metric (WCL) at top of telemetry with product sign‑off callout (Section 13.0). Added endorsement lifecycle events + daily cost snapshot event (Section 13.1). Strengthened cost control with per‑learner and per‑tenant monthly caps (Section 7.3). Added cross‑device stale‑proposal row to offline conflict table (Section 11). Reframed Section 7.2 as **capabilities** (contracts) rather than named agents (implementations). Added three‑gate package promotion criteria (Section 15). Split Phase 3 into 3a (infrastructure, mock agent) + 3b (Interpretation only) with explicit kill criteria. Added audience wedge as a required product decision at the top of the roadmap.
- **v0.2** — Incorporated first review round. Added "what Pathways is not" (Section 1). Moved `Proposal` out of `Pathway` into a sibling collection (Section 3.5). Committed to LLM-proxy-through-brain-service and added read/write distinction for agents (Section 7.1), plus an explicit "boundaries not final" note (Section 7.2). Reframed `getNextAction` as a scoring function with `reasons[]` (Section 8.1). Made cold-start vector-first, LLM-maybe (Section 6). Added a React Flow spike to Phase 2 (Section 10). New sections: Offline conflict policy (11), Telemetry (13), Graceful degradation (14), Package vs in-app decision (15). Roadmap updated accordingly.
- **v0.1** — Initial draft.
