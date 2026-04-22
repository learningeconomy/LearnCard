/**
 * chosenRoute — the learner's committed linear walk through a pathway.
 *
 * ## The concept
 *
 * A `Pathway` is a graph: many nodes, many possible orderings, many
 * valid routes from an entry to the destination. A **`chosenRoute`**
 * is one such ordering the learner has (explicitly or by default)
 * committed to walking.
 *
 * The analogy that clinched this concept is Google Maps: a user
 * sees the whole map, but one *route* is drawn in bold. Turn-by-turn
 * follows that route; alternates are offered as swaps, not edits.
 * The map doesn't disappear; the route just prioritizes one walk
 * through it.
 *
 *   - **Today** renders "step N of M on your route" (turn-by-turn).
 *   - **Map** renders the chosenRoute emerald-solid; everything else
 *     stays visible but desaturated.
 *   - **What-If** proposes alternate chosenRoutes (route swaps), not
 *     graph surgery.
 *
 * The three surfaces consult the same field, so they agree on what
 * "next" means.
 *
 * ## Shape
 *
 * `chosenRoute: string[]` — an ordered list of `PathwayNode.id`s.
 * The first entry is typically the learner's entry point; the last
 * is the destination (when one exists). Completed nodes stay in
 * the route — it's a *route*, not a cursor — so the surfaces can
 * render "step 3 of 7" honestly.
 *
 * The field is *optional* on `Pathway` for two reasons:
 *
 *   1. **Backwards compatibility.** Pathways created before
 *      chosenRoute existed still have to behave correctly; Today
 *      falls back to ranking when the route is absent.
 *   2. **Pathways without a destination** (question-altitude,
 *      exploration-altitude) don't have an obvious terminal, so
 *      committing to a route doesn't apply. Those surfaces continue
 *      to use ranking, which is the right primitive for them.
 *
 * ## What this module is
 *
 * A tiny, pure algebra for chosenRoutes:
 *
 *   - `seedChosenRoute(pathway)` — derive an initial route from
 *     the graph (entry → destination via the suggested route).
 *     Called at pathway instantiation.
 *   - `pruneChosenRoute(route, survivingIds)` — after a graph
 *     edit (e.g. a proposal removing nodes), drop vanished ids
 *     while preserving order.
 *   - `pickNextOnRoute(pathway, route)` — Today's entry point: the
 *     first uncompleted, graph-available node on the route, framed
 *     as "step N of M."
 *
 * All three are pure and side-effect-free; no store dependencies,
 * no clocks, no randomness. Today / applyProposal / instantiation
 * each call in and consume the result.
 */

import type { Pathway } from '../types';

import { availableNodes, rootNodes } from './graphOps';

// Imported from the sibling map module — one of the seed-time
// dependencies. Keep the import local so adding / removing chosenRoute
// doesn't drag the map module into surfaces that don't need it.
import { computeSuggestedRoute } from '../map/route';

// -----------------------------------------------------------------
// Seed
// -----------------------------------------------------------------

/**
 * Pick the entry node a fresh pathway should seed its chosenRoute
 * from. Preference order:
 *
 *   1. A non-completed root node (no prerequisites) in author order.
 *      This is the common case for fresh template pathways — all
 *      nodes are `not-started`.
 *   2. Any root node in author order (handles the edge case where
 *      a root was already completed outside template instantiation,
 *      e.g. via a proposal).
 *   3. `null` — no entry candidate.
 *
 * We intentionally don't call into simulator.ts's
 * `inferSimulationFocus` here: that function is a What-If concern
 * and pulls in scoring heuristics we don't want core to depend on.
 * A plain "first root" is all the seeder needs.
 */
const pickEntryNodeId = (pathway: Pathway): string | null => {
    const roots = rootNodes(pathway);

    const freshRoot = roots.find(n => n.progress.status !== 'completed');
    if (freshRoot) return freshRoot.id;

    return roots[0]?.id ?? null;
};

/**
 * Derive an initial chosenRoute for a pathway from its graph. Returns
 * an empty array when a route can't be derived (no destination, no
 * entry, destination unreachable from entry) — callers should treat
 * the empty array the same as an absent route: "no opinion, fall back
 * to ranking."
 *
 * We always route from **entry → destination** (not "from wherever
 * the learner is now"), so seeding at instantiation time and seeding
 * after a proposal that moves the goalposts both produce the same
 * shape: a complete route the learner walks front-to-back.
 *
 * This function is the single source of truth for "what does a
 * reasonable default route look like?" If we ever change the
 * heuristic (e.g. prefer shortest by ETA, weight preferred policy
 * kinds), it happens here.
 */
export const seedChosenRoute = (pathway: Pathway): string[] => {
    if (!pathway.destinationNodeId) return [];
    if (pathway.nodes.length === 0) return [];

    const entryId = pickEntryNodeId(pathway);
    if (!entryId) return [];

    const route = computeSuggestedRoute(pathway, entryId);
    if (!route) return [];

    return [...route.nodeIds];
};

/**
 * Re-seed a pathway's chosenRoute in-place (returning a new Pathway
 * with the updated field). Used by the proposals commit seam when a
 * structural diff prunes the route down to nothing — rather than
 * leave the learner stranded without a committed walk, we compute a
 * fresh one from the post-edit graph.
 *
 * No-op when the derived seed would be shorter than two nodes; the
 * caller gets back the pathway unchanged and Today falls back to
 * ranking. Never touches pathways that already have a valid route
 * (the whole point of reseeding is recovery from pruning, not
 * overriding a learner's committed walk).
 */
export const reseedChosenRoute = (pathway: Pathway): Pathway => {
    if (pathway.chosenRoute && pathway.chosenRoute.length >= 2) {
        return pathway;
    }

    const seeded = seedChosenRoute(pathway);
    if (seeded.length < 2) return pathway;

    return { ...pathway, chosenRoute: seeded };
};

// -----------------------------------------------------------------
// Prune
// -----------------------------------------------------------------

/**
 * Filter a chosenRoute down to ids that still exist in the pathway,
 * preserving order. Used by `applyProposal` after a diff removes
 * nodes, and anywhere else a graph edit could leave stale ids in
 * the route.
 *
 * Returns `undefined` when:
 *   - the input is `undefined` (no route to prune)
 *   - pruning would leave fewer than two nodes (a route of one node
 *     isn't a walk; better to drop it and let Today fall back to
 *     ranking than to render "step 1 of 1 — done" into a committed
 *     route the learner never agreed to)
 *
 * Callers can detect the drop and re-seed via `seedChosenRoute` if
 * they want — we deliberately don't re-seed here so the function
 * stays pure and composable.
 */
export const pruneChosenRoute = (
    route: readonly string[] | undefined,
    survivingIds: ReadonlySet<string>,
): string[] | undefined => {
    if (!route || route.length === 0) return undefined;

    const pruned = route.filter(id => survivingIds.has(id));

    if (pruned.length < 2) return undefined;

    return pruned;
};

// -----------------------------------------------------------------
// Pick next
// -----------------------------------------------------------------

/**
 * The first uncompleted, graph-available node on the route, framed
 * for Today. "Graph-available" means all graph prerequisites
 * (including prereqs that aren't themselves on the chosenRoute) are
 * completed — we will never tell a learner to work on step 5 when
 * an off-route step 2 is still blocking it.
 *
 * When the first uncompleted node isn't available yet (its off-route
 * prereqs aren't done), we look further down the route. This is
 * deliberate: if the learner somehow completed a later step out of
 * order, we shouldn't nag them about an earlier step that got
 * unblocked by something off-route. If *no* route node is both
 * uncompleted and available, we return `null` and the caller falls
 * back to ranking.
 *
 * Returns a `position` + `total` pair so the UI can render "step
 * N of M" without re-doing the search.
 */
export interface RouteStep {
    /** The node id Today should surface as the next action. */
    nodeId: string;
    /** 1-indexed position of this node on the chosenRoute. */
    position: number;
    /** Total number of nodes on the chosenRoute. */
    total: number;
    /** Pre-rendered human reason string, e.g. "Step 3 of 7 on your route." */
    reason: string;
}

export const pickNextOnRoute = (
    pathway: Pathway,
    route: readonly string[] | undefined,
): RouteStep | null => {
    if (!route || route.length === 0) return null;

    const nodeById = new Map(pathway.nodes.map(n => [n.id, n]));
    const availableIds = new Set(availableNodes(pathway).map(n => n.id));

    for (let i = 0; i < route.length; i++) {
        const id = route[i]!;
        const node = nodeById.get(id);

        if (!node) continue;
        if (node.progress.status === 'completed') continue;
        if (!availableIds.has(id)) continue;

        const position = i + 1;
        const total = route.length;

        return {
            nodeId: id,
            position,
            total,
            reason: `Step ${position} of ${total} on your route`,
        };
    }

    return null;
};
