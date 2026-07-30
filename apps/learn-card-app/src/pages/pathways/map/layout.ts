/**
 * Layout — assign (x, y) coordinates to pathway nodes for Map mode.
 *
 * Two layout functions live here, one per Map view mode (see the
 * `mapLayout` state on `MapMode`):
 *
 *   - `layoutPathway` — **Explore**. Level-based layered layout, used
 *     when the learner is browsing the full graph. The pathway reads
 *     as a dependency DAG flowing bottom-up from roots to destination.
 *   - `layoutPathwayNavigate` — **Navigate**. Linear spine layout, used
 *     when the learner has committed to a `chosenRoute`. The route
 *     becomes the hero — vertical spine at x = 0, step 1 at the
 *     bottom, destination at the top. Off-route nodes land as
 *     side-branches beside the on-route neighbor that most naturally
 *     anchors them. This mirrors how Google Maps redraws in
 *     Navigation mode: the road you're on is the hero, everything
 *     else recedes.
 *
 * Both functions are pure and produce the same `NodePosition[]`
 * shape so callers can switch between them freely without touching
 * the rest of the render pipeline (edge styling, minimap, viewport
 * panner, etc.).
 *
 * ## Why bottom-up
 *
 * Level 0 (root / starting step) anchors at the bottom of the canvas,
 * and each subsequent level stacks upward. This matches the
 * "pathway = journey toward a destination" metaphor and the native
 * vertical-scroll gesture on phone. Both modes preserve this axis.
 *
 * Good enough for Phase B. If graphs get dense we can swap in dagre
 * or elk later — this module is the seam, callers depend only on the
 * output shape.
 */

import type { Pathway } from '../types';

import { buildAdjacency } from '../core/graphOps';

/** Horizontal gap between siblings within the same level. */
export const X_SPACING = 240;

/** Vertical gap between consecutive levels. */
export const Y_SPACING = 140;
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 80;

export interface NodePosition {
    id: string;
    x: number;
    y: number;
    level: number;
    /**
     * True when the node sits on the committed chosen route. Set only
     * by `layoutPathwayNavigate`; `layoutPathway` leaves this
     * undefined since Explore mode doesn't treat the route as
     * structural. Consumers (MapNode dimming, edge classifier) key off
     * this so the Navigate-mode side-branches render as quieter than
     * the spine.
     */
    onRoute?: boolean;
}

export const layoutPathway = (pathway: Pathway): NodePosition[] => {
    const { prereqs, dependents } = buildAdjacency(pathway);

    // Kahn-style topo ordering so we can compute longest-path levels in
    // linear time.
    const remaining = new Map<string, number>();

    for (const node of pathway.nodes) {
        remaining.set(node.id, prereqs.get(node.id)?.size ?? 0);
    }

    const level = new Map<string, number>();
    const queue: string[] = [];

    for (const [id, deg] of remaining) {
        if (deg === 0) {
            level.set(id, 0);
            queue.push(id);
        }
    }

    while (queue.length > 0) {
        const id = queue.shift()!;
        const current = level.get(id) ?? 0;

        for (const next of dependents.get(id) ?? []) {
            level.set(next, Math.max(level.get(next) ?? 0, current + 1));

            const remainingDeg = (remaining.get(next) ?? 0) - 1;
            remaining.set(next, remainingDeg);

            if (remainingDeg === 0) queue.push(next);
        }
    }

    // Anything with an unresolved level (a cycle or orphaned subgraph)
    // falls back to level 0 so we still lay it out somewhere.
    for (const node of pathway.nodes) {
        if (!level.has(node.id)) level.set(node.id, 0);
    }

    // Group + stable order within each level.
    const byLevel = new Map<number, string[]>();

    for (const node of pathway.nodes) {
        const l = level.get(node.id) ?? 0;
        const bucket = byLevel.get(l) ?? [];
        bucket.push(node.id);
        byLevel.set(l, bucket);
    }

    // `maxLevel` anchors level 0 at the bottom of the canvas (largest y).
    const maxLevel = byLevel.size > 0 ? Math.max(...byLevel.keys()) : 0;

    const positions: NodePosition[] = [];

    for (const [l, ids] of byLevel) {
        // Center siblings horizontally around x = 0 so the visual spine
        // of the pathway runs straight up through the canvas instead of
        // drifting right when a level has many children.
        const offset = ((ids.length - 1) * X_SPACING) / 2;

        ids.forEach((id, i) => {
            positions.push({
                id,
                level: l,
                x: i * X_SPACING - offset,
                y: (maxLevel - l) * Y_SPACING,
            });
        });
    }

    return positions;
};

// ---------------------------------------------------------------------------
// Navigate layout — route-only spine.
// ---------------------------------------------------------------------------

/**
 * Lay out a pathway in **Navigate mode** — a pure route spine.
 *
 * Design intent:
 *
 * Navigate mode is deliberately *"route only."* When a learner has
 * committed to a walk, off-route nodes aren't helpful — they're
 * distracting:
 *
 *   - Their placement can't be meaningful (graph-siblings get the
 *     same y as their anchor even when one is structurally an
 *     ancestor of the other).
 *   - Side-chains (off-route `B → C → D`) collapse to a single
 *     row beside their nearest on-route neighbor, erasing the chain.
 *   - Orphans stacked above the destination read as "second goals"
 *     even though they're just unreachable terminals.
 *
 * So Navigate returns **only the route**: step 1 at the bottom,
 * destination at the top, `x = 0` all the way. The "there's more
 * here" signal is surfaced by MapMode as a detour chip on spine
 * nodes that have off-route neighbors — tapping the chip (or
 * "View full map" in the chrome) swings the canvas into Explore.
 *
 * This matches the Google Maps / Waze convention: while you're
 * navigating, you see your route. Side streets exist in the world,
 * but they're not part of the route canvas.
 *
 * Algorithm:
 *
 *   1. Take the route ids (filter out stale ones that don't exist
 *      in the pathway).
 *   2. Place them on a vertical spine at `x = 0`, step 1 (index 0)
 *      at the bottom, destination at `y = 0`.
 *   3. Return those positions only — off-route nodes aren't in the
 *      result.
 *
 * If `route` has fewer than two valid ids after filtering, the
 * layout is degenerate and we fall back to `layoutPathway` — there's
 * nothing walk-shaped to spine.
 *
 * ## Why x = 0 still matters
 *
 * Even with no side-branches, centering on x = 0 keeps the
 * FocusPanner / fitView behavior simple (only y scrolls), and if a
 * future revision needs to add anything beside the spine (a "peek"
 * overlay, a tangent branch on the current step), the axis
 * convention is already set.
 */
export const layoutPathwayNavigate = (
    pathway: Pathway,
    route: readonly string[],
    /**
     * Map of route-step id → collapsed collection id. When provided,
     * consecutive route ids belonging to the same collection share
     * a single spine slot (same `y`). This keeps the spine compact
     * when a route traverses a shared-prereq collection — e.g. a
     * route like `[orientation, b1, b2, b3, b4, capstone, cert]`
     * where b1..b4 share a "Earn 4 Badges" collection renders as
     * 4 visible slots (`orientation → collection → capstone → cert`)
     * instead of 7, eliminating the 3 empty spine rows that would
     * correspond to hidden members.
     *
     * Non-consecutive appearances of the same collection in a route
     * (unusual, but possible if the seed interleaves unrelated steps
     * between siblings) each get their own slot — the compression is
     * run-length-style, not a global dedupe — because visually they
     * represent two distinct "pass through this collection" stops.
     *
     * Leaving the map undefined (the default) produces the original
     * one-slot-per-route-id layout, preserving existing test behavior
     * and the no-collections case.
     */
    collapsedMemberToGroup?: ReadonlyMap<string, string>,
): NodePosition[] => {
    if (route.length < 2) return layoutPathway(pathway);

    const nodeIds = new Set(pathway.nodes.map(n => n.id));

    // Filter stale route ids defensively. A route referencing a
    // vanished node would shift the spine; skip those quietly.
    const validRoute = route.filter(id => nodeIds.has(id));
    if (validRoute.length < 2) return layoutPathway(pathway);

    // -----------------------------------------------------------------
    // Slot assignment.
    //
    // Each route id gets a `slot` index. Non-collapsed ids always
    // advance to a new slot. Collapsed ids share the previous slot
    // iff the previous id belonged to the same collection (run-length
    // compression).
    //
    // Example with collapsedMemberToGroup { b1→G, b2→G, b3→G, b4→G }:
    //
    //   route        : orientation  b1  b2  b3  b4  capstone  cert
    //   group        : —            G   G   G   G   —         —
    //   slot         : 0            1   1   1   1   2         3
    //
    // When the map is absent or empty, each id gets its own slot and
    // the behavior reduces to the pre-compression layout exactly.
    // -----------------------------------------------------------------
    const slotByIndex: number[] = [];
    let currentSlot = 0;
    let prevGroup: string | undefined;

    for (let i = 0; i < validRoute.length; i++) {
        const id = validRoute[i]!;
        const group = collapsedMemberToGroup?.get(id);

        const sameCollapsedRun = group !== undefined && group === prevGroup;

        if (i === 0) {
            // First id anchors slot 0 regardless.
            slotByIndex.push(0);
        } else if (sameCollapsedRun) {
            // Still inside the same collapsed-collection run — share
            // the previous slot so hidden members don't claim spine
            // height.
            slotByIndex.push(currentSlot);
        } else {
            currentSlot += 1;
            slotByIndex.push(currentSlot);
        }

        prevGroup = group;
    }

    const maxSlot = currentSlot;

    // Step 1 (index 0) lands at the largest y (bottom); destination
    // (last slot) lands at y = 0 (top). Off-route nodes are not
    // included in the result — Navigate = route only.
    return validRoute.map((id, i) => ({
        id,
        level: i,
        x: 0,
        y: (maxSlot - slotByIndex[i]!) * Y_SPACING,
        onRoute: true,
    }));
};
