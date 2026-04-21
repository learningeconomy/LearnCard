/**
 * route.ts — the "GPS" layer for a pathway.
 *
 * ## Why a dedicated module
 *
 * The original Map view was purely **topological** — it showed which
 * nodes existed and which nodes gated which. That answers *what* but
 * not *where am I* / *how far* / *what's next*. For the Map to feel
 * like Google Maps / Waze rather than a dependency graph, we need
 * three temporally-grounded derivations on top of the topology:
 *
 *   1. A **suggested route** — an ordered list of nodes the learner
 *      would traverse from their current focus to the destination.
 *   2. A **trail** — the set of nodes/edges the learner has already
 *      completed along that route (rendered as a soft emerald line
 *      behind them).
 *   3. An **ETA** — the total remaining effort on the route,
 *      expressed in "~N min / hrs / weeks" language.
 *
 * This module is the pure derivation layer for all three. It takes a
 * Pathway + a focus node id and returns `SuggestedRoute`. The Map
 * layer (`MapMode`) decides how to *render* those outputs as edges,
 * pins, and chrome.
 *
 * ## Design decisions
 *
 *   - **BFS, not Dijkstra.** Every edge is conceptually unit-weight
 *     (one step in the pathway). The cheapest "step count" is what
 *     renders most legibly; per-edge effort lives on the *node*
 *     (`nodeEffortMinutes`), not the edge.
 *   - **Focus-to-destination direction.** We walk dependent edges
 *     (toward the goal) rather than prerequisite edges (backward).
 *     If the focus is somehow downstream of the destination (shouldn't
 *     happen on a well-formed pathway, but defensive) or the graph
 *     has no destination, we return `null` and the Map falls back to
 *     its pre-M7 rendering.
 *   - **One representative path.** A DAG with many prereqs into the
 *     destination has many paths; we pick the shortest as the
 *     "current route." The learner will naturally progress along
 *     other paths too, and `isOnRoute` / trail rendering reflect
 *     actual completion — so the single highlighted path is just a
 *     Wayfinding aid, not a constraint.
 */

import type { Pathway, PathwayNode, Policy } from '../types';

import { buildAdjacency } from '../core/graphOps';

/**
 * Default per-kind effort (minutes) when a node doesn't carry an
 * authored estimate. These numbers are deliberately rough — the
 * goal is a believable ETA, not a billing clock. We'd rather be
 * consistently approximate than conditionally missing.
 *
 * Tuned against the IMA Micro-credential pathway:
 *   - practice sessions ≈ half an hour
 *   - reviews flash by
 *   - assessments take a real hour
 *   - artifacts need focused writing/making time
 *   - externals are short "jump to tool, come back" jobs
 *   - composites roll up a whole sub-pathway — big chunk
 */
const DEFAULT_EFFORT_MINUTES: Record<Policy['kind'], number> = {
    practice: 30,
    review: 15,
    assessment: 60,
    artifact: 120,
    external: 30,
    composite: 240,
};

/**
 * Effort estimate for a single node, in minutes.
 *
 * Looks for an optional `estimatedMinutes` field on the policy (we
 * don't require authors to supply one, but if present we honor it);
 * otherwise falls back to the per-kind default.
 *
 * Exported so the Map chrome and the NavigateMode card can show the
 * same per-node estimate the ETA aggregation uses.
 */
export const nodeEffortMinutes = (node: PathwayNode): number => {
    const policy = node.stage.policy as Policy & { estimatedMinutes?: number };

    if (typeof policy.estimatedMinutes === 'number' && policy.estimatedMinutes > 0) {
        return policy.estimatedMinutes;
    }

    return DEFAULT_EFFORT_MINUTES[node.stage.policy.kind];
};

/**
 * Human-readable ETA. Uses a "time-to-arrival" framing, not an
 * "effort budget" framing — learners think in calendar time
 * ("~4 weeks"), not in clock-hours of focused work.
 *
 * Conversion ladder:
 *   - < 60 min        → "~{N}m"
 *   - < one study day → "~{N}h"  (study day = ~5 hrs of focus)
 *   - else            → weeks at ~5 hrs/week of study
 *
 * The 5-hours-per-week assumption is a published average for adult
 * part-time learners; it's deliberately low enough that the ETA
 * under-promises rather than over-promises. Nothing here depends on
 * clock wall-time — only on the effort roll-up.
 */
export const formatEta = (minutes: number): string => {
    if (minutes <= 0) return 'Done';

    if (minutes < 60) {
        return `~${Math.max(1, Math.round(minutes))}m`;
    }

    const hours = minutes / 60;

    // Under 5 hours of total effort we talk in hours, not weeks —
    // saying "~1 week" for a 2-hour task would feel dishonest.
    if (hours < 5) {
        return `~${Math.round(hours)}h`;
    }

    const HOURS_PER_WEEK = 5;
    const weeks = Math.round(hours / HOURS_PER_WEEK);

    if (weeks <= 1) return '~1 week';

    return `~${weeks} weeks`;
};

export interface SuggestedRoute {
    /**
     * Ordered node ids from focus → destination, inclusive on both
     * ends. Always length ≥ 1 (a route of just [destination] means
     * you're there).
     */
    nodeIds: string[];

    /**
     * Edge ids connecting consecutive pairs in `nodeIds`. Always
     * length `nodeIds.length - 1` when the route is present.
     */
    edgeIds: string[];

    /**
     * Sum of `nodeEffortMinutes` across every *uncompleted* node in
     * `nodeIds` (including the focus if it isn't yet complete).
     * Completed nodes don't add to the ETA since there's no
     * remaining work there.
     */
    etaMinutes: number;

    /**
     * Count of nodes on the route that still need completion.
     * Useful for "3 steps to go" micro-copy.
     */
    remainingSteps: number;

    /** The destination node id (echoed from the pathway, for convenience). */
    destinationId: string;
}

/**
 * Compute the suggested route from `focusId` → destination.
 *
 * Returns `null` when:
 *   - The pathway has no `destinationNodeId`.
 *   - The focus node doesn't exist (defensive).
 *   - The destination is unreachable from the focus (focus is off the
 *     subtree that leads to the destination — rare but possible after
 *     a pathway edit).
 *
 * Algorithm: breadth-first search over the `dependents` adjacency
 * (the direction that "points toward the goal"), tracking the
 * previous hop per visited node so we can reconstruct the path. O(V + E).
 */
export const computeSuggestedRoute = (
    pathway: Pathway,
    focusId: string,
): SuggestedRoute | null => {
    const destinationId = pathway.destinationNodeId;
    if (!destinationId) return null;

    const nodeById = new Map(pathway.nodes.map(n => [n.id, n]));
    if (!nodeById.has(focusId) || !nodeById.has(destinationId)) return null;

    // Trivial route: already at destination.
    if (focusId === destinationId) {
        const node = nodeById.get(destinationId)!;
        const remaining = node.progress.status === 'completed' ? 0 : 1;
        const eta =
            node.progress.status === 'completed' ? 0 : nodeEffortMinutes(node);

        return {
            nodeIds: [destinationId],
            edgeIds: [],
            etaMinutes: eta,
            remainingSteps: remaining,
            destinationId,
        };
    }

    const { dependents } = buildAdjacency(pathway);

    // `prev[n]` records the hop we came from to reach n. `null`
    // marks the BFS origin (the focus).
    const prev = new Map<string, string | null>();
    prev.set(focusId, null);

    const queue: string[] = [focusId];
    let found = false;

    while (queue.length > 0) {
        const current = queue.shift()!;

        if (current === destinationId) {
            found = true;
            break;
        }

        for (const next of dependents.get(current) ?? []) {
            if (prev.has(next)) continue;

            prev.set(next, current);
            queue.push(next);
        }
    }

    if (!found) return null;

    // Reconstruct the path focus → ... → destination.
    const nodeIds: string[] = [];
    let at: string | null = destinationId;

    while (at !== null) {
        nodeIds.unshift(at);
        at = prev.get(at) ?? null;
    }

    // Find the specific edge ids connecting consecutive pairs.
    // Multi-edges between the same two nodes are forbidden by the
    // Pathway schema, so `find` is unambiguous.
    const edgeIds: string[] = [];
    for (let i = 0; i < nodeIds.length - 1; i++) {
        const fromId = nodeIds[i]!;
        const toId = nodeIds[i + 1]!;
        const edge = pathway.edges.find(e => e.from === fromId && e.to === toId);
        if (edge) edgeIds.push(edge.id);
    }

    // Tally remaining ETA + remaining step count, skipping nodes the
    // learner has already completed along this route.
    let etaMinutes = 0;
    let remainingSteps = 0;
    for (const nid of nodeIds) {
        const node = nodeById.get(nid);
        if (!node) continue;
        if (node.progress.status === 'completed') continue;

        etaMinutes += nodeEffortMinutes(node);
        remainingSteps += 1;
    }

    return {
        nodeIds,
        edgeIds,
        etaMinutes,
        remainingSteps,
        destinationId,
    };
};

/**
 * Quick index for the Map's edge/node renderers. The Map consults
 * this per-node/per-edge during render; doing linear scans on the
 * `SuggestedRoute` arrays would be O(N) per lookup and we render many
 * times per frame.
 */
export interface RouteIndex {
    /** `nodeId -> index-in-route (0 = focus, length-1 = destination)`. */
    nodeIndex: Map<string, number>;

    /** `edgeId -> true` when the edge is part of the route. */
    edgeOnRoute: Set<string>;

    /**
     * The index of the *next uncompleted* node on the route, or
     * `null` if the whole route is complete. The "you are here" pin
     * anchors to this node; trail edges (index < yourIndex) render
     * as solid emerald, projected edges (index ≥ yourIndex) render
     * dashed.
     */
    yourIndex: number | null;
}

export const buildRouteIndex = (
    route: SuggestedRoute,
    pathway: Pathway,
): RouteIndex => {
    const nodeIndex = new Map<string, number>();
    route.nodeIds.forEach((id, i) => nodeIndex.set(id, i));

    const edgeOnRoute = new Set(route.edgeIds);

    const nodeById = new Map(pathway.nodes.map(n => [n.id, n]));
    let yourIndex: number | null = null;
    for (let i = 0; i < route.nodeIds.length; i++) {
        const node = nodeById.get(route.nodeIds[i]!);
        if (!node) continue;
        if (node.progress.status !== 'completed') {
            yourIndex = i;
            break;
        }
    }

    return { nodeIndex, edgeOnRoute, yourIndex };
};
