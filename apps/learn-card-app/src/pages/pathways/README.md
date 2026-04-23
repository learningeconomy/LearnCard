# Pathways v2

Learner-owned, agent-orchestrated graph of commitments and evidence, with every
node projectable to an Open Badges 3.0 credential.

Full architecture: [`apps/learn-card-app/docs/pathways-architecture.md`](../../../docs/pathways-architecture.md).

## Status (April 2026)

The architecture document's phase plan is a useful map, but we have moved well
past the Phase 0 snapshot the earlier README described. Roughly:

| Phase | Scope | Status |
|-------|-------|--------|
| **0** — Scaffolding | Route, shell, types, stores, analytics stubs | **Complete** |
| **1** — Cold start + Today | Onboard flow, Today ranking + chosenRoute, offline queue, FSRS scheduler, OBv3 projection | **Complete client-side** — VC issuance not signed end-to-end |
| **2** — Map + Build | React Flow map, node detail, Build mode (outline + inspector + policy/termination editors), composition (inline + link-out) | **Complete** |
| **3a** — Agent infrastructure | Proxy with swap-ready dispatch, 4-cap budget enforcement, cost ledger, mock agent, proposals UI, full telemetry taxonomy | **Complete with mock dispatch** |
| **3b** — First real capability (Interpretation) | Real brain-service LLM proxy behind `AgentDispatch` seam | **Not started** — no brain-service routes exist yet |
| **4** — Rest + What-If | What-If mode (simulator, generators, tradeoffs, toProposal). Matching / MCP / Routing / Nudging still mock | **What-If done, others pending** |
| **5** — FSRS reviews, social, sunset | Scheduler + review queue UI exist; endorsement fulfilment + sunset scaffolded, not wired | **Partial** |

**Beyond the original spec:** Credential Engine Registry round-trip
(`import/` + `projection/toCtdlPathway.ts`), altitude-aware arrival intent
(`Altitude` enum), and `chosenRoute` as the single source of truth shared by
Today / Map / What-If. All documented inline where they live.

**v0.5 — Action descriptors + outcome signals (April 2026):** Nodes now carry
an optional `ActionDescriptor` (`in-app-route` / `app-listing` / `external-url`
/ `mcp-tool` / `none`) that tells the UI where the learner goes to act, fully
decoupled from `Policy` and `Termination`. Pathways carry optional
`OutcomeSignal[]` — real-world results (score thresholds, enrollment,
employment) measured separately from node termination. A deterministic
credential binder (`agents/credentialBinder.ts`) proposes bindings when wallet
VCs match a signal's predicate and clear its trust tier; the learner still
confirms. See architecture doc § 3.7 / § 3.8.

## What's blocking production

1. **`persist.enabled` is `false`** on `pathwayStore` and `proposalStore`
   (`stores/pathways/pathwayStore.ts`, `proposalStore.ts`). A page refresh
   loses every pathway the learner authored. Three-character fix, gated on a
   schema-migration story.
2. **No brain-service routes.** The spec calls for 11 tRPC procedures
   (§ 9 in the architecture doc); `services/learn-card-network/brain-service/src/routes/pathways.ts`
   does not exist.
3. **Mock agent dispatch** is still the default (`agents/proxy.ts`).
   Swapping to real is a single `setAgentDispatch(brainServiceDispatch)` call.
4. **No Playwright E2E coverage** for the two flows the spec requires
   (cold-start → Today < 10 s, accept-proposal → next-action-changes).

See `docs/pathways-architecture.md` § 17 for the retrospective status column
and recommended sequencing.

## Mount point

- Route: `/pathways` (redirects to `/pathways/today` when an active pathway
  exists, else `/pathways/onboard`).
- Sub-routes: `/today`, `/map`, `/what-if`, `/build`, `/proposals`,
  `/onboard`, `/node/:pathwayId/:nodeId`.
- Gating: tenant-level feature flag (not yet wired to tenant config — route
  is registered unconditionally today).

## Folder layout

```
src/pages/pathways/
├── PathwaysShell.tsx           # router + IonPage wrapper
├── PathwaysHeader.tsx          # mode tabs + proposal count + switcher
├── PathwaySwitcher.tsx         # active-pathway dropdown (tree view over roots + composite children)
│
├── types/                      # Zod schemas + inferred TS types
│   ├── pathway.ts              # Stage, Policy, Termination, Pathway, Edge, Altitude
│   ├── action.ts               # ActionDescriptor (in-app-route | app-listing | external-url | mcp-tool | none)
│   ├── outcome.ts              # OutcomeSignal union + OutcomeBinding + trust tiers
│   ├── proposal.ts             # Proposal, PathwayDiff (incl. setOutcomeBindings), Tradeoff
│   └── ranking.ts              # ScoredCandidate, RankingContext, RankingWeights
│
├── core/                       # Pure algebra — no React, no store access
│   ├── chosenRoute.ts          # seed / prune / pickNextOnRoute
│   ├── composition.ts          # findParentPathway, rollupCompositeProgress
│   ├── graphOps.ts             # adjacency, availability, reachability
│   ├── action.ts               # resolveNodeAction (+ legacy-field fallback), buildInAppHref
│   └── outcomeMatcher.ts       # matchVcAgainstOutcome, checkWindow, classifyIssuerTrust
│
├── today/                      # Mode 1
│   ├── TodayMode.tsx, NextActionCard, IdentityBanner, StreakRibbon, CompletionMoment
│   ├── selectNextAction.ts     # route-first, ranking-fallback picker with source discriminant
│   ├── ranking.ts              # scoreCandidate + getNextAction
│   ├── rankingWeights.ts       # versioned, A/B-able
│   └── presentation.ts         # derives banner copy / CTA / hint from a ScoredCandidate
│
├── map/                        # Mode 2 (React Flow)
│   ├── MapMode.tsx             # viewport + controls
│   ├── MapNode.tsx, CollectionMapNode.tsx, FocusActionBar.tsx, NavigateMode.tsx
│   ├── layout.ts, route.ts, collectionDetection.ts    # pure layout + collection fan-in
│   └── NestedPathwayContext.tsx
│
├── what-if/                    # Mode 3
│   ├── WhatIfMode.tsx
│   ├── simulator.ts, generators.ts, toProposal.ts
│   └── types.ts
│
├── build/                      # Mode 4
│   ├── BuildMode.tsx, PolicyEditor.tsx, TerminationEditor.tsx
│   ├── buildOps.ts             # pure diff-applying operations
│   ├── outline/, inspector/, policy/, termination/, validate/, summarize/, templates/, history/, preview/
│
├── node/                       # Focused node detail (overlays current mode)
│   ├── NodeDetail.tsx, CompositeNodeBody, EvidencePanel, EvidenceUploader
│   ├── EndorsementPanel, ReviewsPanel, TerminationProgress, CredentialPreview
│   └── termination.ts          # progress computation
│
├── onboard/                    # Cold-start
│   ├── OnboardRoute.tsx, GoalCapture, CredentialScan, SuggestionGrid
│   ├── classifyAltitude.ts     # heuristic; no LLM
│   ├── suggestPathways.ts      # vector lookup over templates
│   ├── templates.ts            # hand-authored templates
│   └── instantiateTemplate.ts
│
├── proposals/                  # Agent proposal queue
│   ├── ProposalsRoute, ProposalCard, ProposalDiff, RouteDiffSummary
│   ├── applyProposal.ts        # structural diff applier (the ONE write path)
│   ├── proposalActions.ts, proposalKind.ts, pathwayDiffImpact.ts, routeDiff.ts
│
├── agents/                     # Client-side agent layer
│   ├── proxy.ts                # swap-ready AgentDispatch; currentDispatch = mock today
│   ├── budgets.ts              # 4-cap enforcement, pure decideBudget
│   ├── costAccounting.ts, costStore.ts
│   ├── mockAgent.ts            # deterministic proposals for 5 capabilities
│   └── credentialBinder.ts     # VC → OutcomeSignal binder (deterministic, no LLM)
│
├── projection/                 # Pathway → external formats (read-only projections)
│   ├── toAchievementCredential.ts    # OBv3 AchievementCredential, unsigned
│   └── toCtdlPathway.ts              # Credential Engine Registry JSON-LD
│
├── import/                     # CTDL ingestion
│   ├── ImportCtdlModal.tsx, fetchCtdlPathway.ts, fromCtdlPathway.ts
│   ├── ctdlTypes.ts, fixtures.ts, makeCorsProxiedFetch.ts
│   ├── catalog/                # curated CTDL pathway catalog UI
│   └── showcase/               # derived showcase builder
│
├── scheduler/                  # FSRS spaced-review scheduler
│   └── fsrsScheduler.ts
│
├── offline/                    # Offline queue reconciliation
│   └── reconcileOnReconnect.ts # pure; returns a replay/discard/prompt plan
│
├── hooks/                      # React-facing hooks (see file names inside)
└── dev/                        # Dev-only seed panel
```

Cross-cutting state: [`src/stores/pathways/`](../../stores/pathways/) —
`pathwayStore` (active graphs), `proposalStore` (agent proposals), `offlineQueueStore`
(queued mutations, persist **enabled**), `mcpRegistryStore` (stub).

## Design invariants (load-bearing; do not casually violate)

- **Agent proposes, learner commits.** Agents never call `pathwayStore.upsertPathway`
  or `editNode` directly. The only path from agent output to structural state is
  `agents/proxy.ts` → `proposalStore.addProposal` → learner tap → `applyProposal`.
- **Four surfaces, one data source.** Today / Map / What-If / Build all read
  the same `pathwayStore` and agree on "what's next" via `chosenRoute` +
  `selectNextAction`. Switching modes is a `history.push`, never a data fetch.
- **Projection, not mutation.** A node never stores a VC; it stores an
  `AchievementProjection`. A pathway never stores its CTDL form. Crypto +
  serialization happen at the moment of issuance / export.
- **Composition = nesting.** `policy.kind === 'composite'` + a
  `pathway-completed` termination + a `renderStyle` flag covers both
  "substeps inside this node" and "complete Pathway X first". One primitive.
- **Degradation without agents.** Today / Map / Build / What-If must render
  with `agentSignals: null`. Nothing blocks on an LLM call.

## Testing

```bash
# All pathways Vitest suites (703 tests across 41 files as of this writing)
pnpm exec vitest run src/pages/pathways

# A single suite
pnpm exec vitest run src/pages/pathways/core/chosenRoute.test.ts
```

Playwright E2E coverage is **not yet written** — two flows are required by the
architecture doc § 16 before v1 merges. See "What's blocking production" above.

## What Pathways is not

Pathways is not a course platform. It does not serve content; it organizes
commitment. When pressure arrives to add a video player node or a lesson
builder, the answer is: Pathways points _at_ content (via MCP tools, external
credentials, curated references) but does not _host_ it.
