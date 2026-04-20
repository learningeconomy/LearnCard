# Pathways v2

Greenfield implementation of the Pathways product. See
[`apps/learn-card-app/docs/pathways-architecture.md`](../../docs/pathways-architecture.md)
for the full architecture and phased roadmap.

## Status

**Phase 0 — Scaffolding.** Route, shell, four mode stubs, types, stores, and
analytics event stubs are in place. Nothing is wired to real data yet.

## Mount point

- Route: `/pathways` (redirects to `/pathways/today` if there's an active
  pathway, else `/pathways/onboard`).
- Gating: `features.pathways` in the tenant config (default `false`). Enable
  per-tenant in `environments/<tenant>/config.json`.

## Folder layout

```
src/pages/pathways/
├── PathwaysShell.tsx         # router + IonPage wrapper, owns all /pathways/* routes
├── PathwaysHeader.tsx        # mode tabs + proposal count badge
├── types/                    # Zod schemas + inferred TS types (Pathway, Proposal, Ranking)
├── today/                    # Mode 1 — one node, one action, zero distraction
├── map/                      # Mode 2 — zoomed-out graph (React Flow, Phase 2)
├── what-if/                  # Mode 3 — simulate alternatives (Phase 4)
├── build/                    # Mode 4 — author/edit, upload artifacts (Phase 2)
├── onboard/                  # cold-start / first-mile (Phase 1)
└── proposals/                # agent-origin change queue (Phase 3a)
```

Cross-cutting state lives in `src/stores/pathways/`.

## Phase 0 → Phase 1 promotion

At the end of Phase 1, stable shapes (`types/`, graph ops, FSRS scheduler,
ranking function) get promoted to workspace packages per the three gates in
`docs/pathways-architecture.md § 15`:

1. External consumer exists or is concretely planned.
2. ≥ 2 weeks of API stability.
3. Tests pass without app-layer mocks.

Until then, everything lives in-app to keep the churn cost low.

## What Pathways is not

Pathways is not a course platform. It does not serve content; it organizes
commitment. When pressure arrives to add a video player node or a lesson
builder, the answer is: Pathways points _at_ content (via MCP tools, external
credentials, curated references) but does not _host_ it.
