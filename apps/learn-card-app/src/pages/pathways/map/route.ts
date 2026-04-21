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
     * Ordered list of nodes that still need the learner's attention
     * to unlock the destination, starting with the focus (position 0)
     * and ending with the destination. Siblings of the focus that
     * are *also* prerequisites of the destination are included —
     * the route reflects "work remaining," not just "a shortest
     * path."
     *
     * For fan-in patterns (many siblings → one target), every
     * uncompleted sibling shows up because the target's AND-gate
     * can't open until they all finish. Completed nodes are elided
     * from this list so the "Step N of M" count in Navigate mode
     * reflects work left, not history.
     */
    nodeIds: string[];

    /**
     * Edge ids that belong to the *journey zone* — the subgraph
     * containing every ancestor of the destination (plus the
     * destination itself). This is broader than "edges between
     * consecutive nodeIds" so the route ribbon can highlight all
     * fan-in arrows, including those from completed siblings that
     * have already "crossed the finish line" into the target. The
     * four-bucket edge styler in `MapMode` then distinguishes
     * trail-vs-projected within this set via source completion.
     */
    edgeIds: string[];

    /**
     * Sum of `nodeEffortMinutes` across every uncompleted node the
     * learner still has to do. Always excludes completed nodes even
     * if they sneak into `nodeIds` (the focus can be completed in
     * edge cases where the learner manually re-focuses a done node).
     */
    etaMinutes: number;

    /**
     * Count of uncompleted nodes on the route. Used for "3 steps to
     * go" micro-copy and the Navigate mode "Step N of M" position
     * indicator (where M = `nodeIds.length`).
     */
    remainingSteps: number;

    /** The destination node id (echoed from the pathway, for convenience). */
    destinationId: string;
}

/**
 * Compute the suggested route from `focusId` → destination.
 *
 * ## Semantics: work remaining, not shortest path
 *
 * A naive BFS shortest-path picks `[focus, destination]` when the
 * focus is one of N siblings all feeding into the destination. But
 * the destination's termination is an AND-gate: every uncompleted
 * sibling must finish before the destination unlocks. From the
 * learner's perspective the *real* route is "finish all the siblings
 * you haven't done, then arrive at the destination."
 *
 * So: we compute the **journey zone** (all ancestors of the
 * destination that reach it via forward edges), then the **work set**
 * = uncompleted nodes in that zone, anchored by the focus and
 * destination. The work set is topologically sorted so siblings
 * without inter-dependencies come out in a predictable order, with
 * the focus pinned to position 0 so the learner's "you are here"
 * pin doesn't jump.
 *
 * ## What this means downstream
 *
 *   - **Edge ribbon** — every fan-in arrow into the destination
 *     highlights as "on route," not just the one from the focus.
 *     The visual picture matches the AND-gate semantics.
 *   - **Step N of M** — Navigate mode shows the true number of
 *     remaining steps (e.g., "Step 1 of 7" when you're on the first
 *     of 6 badges + certificate).
 *   - **ETA** — sums effort across all remaining work, not just a
 *     single chain.
 *
 * ## Returns
 *
 * `null` when:
 *   - The pathway has no `destinationNodeId`.
 *   - The focus doesn't exist (defensive).
 *   - The focus can't reach the destination — it's off the subtree
 *     that feeds in. Rare but possible post-edit; the Map falls back
 *     to its pre-route rendering.
 *
 * ## Complexity
 *
 * O(V + E): one reverse BFS from the destination, plus a Kahn
 * topo-sort over the work set.
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

    const { prereqs, dependents } = buildAdjacency(pathway);

    // -------------------------------------------------------------
    // 1. Reverse BFS from destination to find the journey zone:
    //    every node that can reach the destination by following
    //    forward edges. This is the "ancestor closure" of dest.
    // -------------------------------------------------------------
    const ancestors = new Set<string>();
    const revQueue: string[] = [destinationId];

    while (revQueue.length > 0) {
        const at = revQueue.shift()!;

        for (const p of prereqs.get(at) ?? []) {
            if (ancestors.has(p)) continue;
            ancestors.add(p);
            revQueue.push(p);
        }
    }

    // Reachability check: if focus isn't an ancestor of dest, the
    // destination is unreachable from here — tell the caller to fall
    // back rather than render a misleading route.
    if (!ancestors.has(focusId)) return null;

    // journeyZone = ancestors ∪ {destination}. Used for edge
    // highlighting (keep completed-→-uncompleted arrows visible).
    const journeyZone = new Set<string>(ancestors);
    journeyZone.add(destinationId);

    // -------------------------------------------------------------
    // 2. Work set = uncompleted nodes in the journey zone, plus the
    //    focus (even if completed, it anchors "you are here") and
    //    the destination (it's the end of the line by definition).
    //    Completed non-focus nodes are elided so "Step N of M"
    //    reflects remaining effort rather than history.
    // -------------------------------------------------------------
    const workSet = new Set<string>();
    workSet.add(focusId);
    workSet.add(destinationId);

    for (const a of ancestors) {
        if (a === focusId) continue;
        const status = nodeById.get(a)?.progress.status;
        if (status !== 'completed') workSet.add(a);
    }

    // -------------------------------------------------------------
    // 3. Topological sort of the work set using Kahn's algorithm,
    //    with a stable tiebreaker (pathway.nodes insertion order)
    //    so the learner sees the same sibling ordering every render.
    //    Focus is pulled to the front of the initial ready queue so
    //    position 0 always = "where you are."
    // -------------------------------------------------------------
    const nodeOrder = new Map<string, number>();
    pathway.nodes.forEach((n, i) => nodeOrder.set(n.id, i));

    // In-degree counts only prereqs that are also in the work set;
    // prereqs outside the set are conceptually "already resolved"
    // (they're completed and thus elided) so they don't block.
    const inDegree = new Map<string, number>();
    for (const id of workSet) {
        let count = 0;
        for (const p of prereqs.get(id) ?? []) {
            if (workSet.has(p)) count += 1;
        }
        inDegree.set(id, count);
    }

    const compareByNodeOrder = (a: string, b: string): number =>
        (nodeOrder.get(a) ?? 0) - (nodeOrder.get(b) ?? 0);

    const ready: string[] = [...workSet].filter(id => inDegree.get(id) === 0);
    ready.sort(compareByNodeOrder);

    // Pin focus to position 0 of the ready queue if it's ready.
    const focusReadyIdx = ready.indexOf(focusId);
    if (focusReadyIdx > 0) {
        ready.splice(focusReadyIdx, 1);
        ready.unshift(focusId);
    }

    const nodeIds: string[] = [];

    while (ready.length > 0) {
        const at = ready.shift()!;
        nodeIds.push(at);

        for (const dep of dependents.get(at) ?? []) {
            if (!workSet.has(dep)) continue;

            const next = (inDegree.get(dep) ?? 0) - 1;
            inDegree.set(dep, next);

            if (next === 0) {
                // Insert into ready while keeping pathway-order stable.
                const insertIdx = ready.findIndex(
                    id => compareByNodeOrder(dep, id) < 0,
                );
                if (insertIdx === -1) ready.push(dep);
                else ready.splice(insertIdx, 0, dep);
            }
        }
    }

    // -------------------------------------------------------------
    // 4. Edge set for the ribbon: every pathway edge whose both
    //    endpoints are in the journey zone. This includes edges
    //    from completed ancestors into uncompleted dependents, so
    //    the route ribbon stays visually continuous even when part
    //    of the fan-in is already done (rendered as "trail"). The
    //    four-bucket styler in MapMode picks the exact look.
    // -------------------------------------------------------------
    const edgeIds: string[] = [];
    for (const e of pathway.edges) {
        if (journeyZone.has(e.from) && journeyZone.has(e.to)) {
            edgeIds.push(e.id);
        }
    }

    // -------------------------------------------------------------
    // 5. ETA + remaining step count. Focus may be completed in the
    //    rare case a learner re-focuses a done node; guard here so
    //    "Step 1 of N" never says you have zero work remaining on
    //    a done node.
    // -------------------------------------------------------------
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
