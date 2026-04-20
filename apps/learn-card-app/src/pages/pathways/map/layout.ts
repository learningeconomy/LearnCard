/**
 * Layout — assign (x, y) coordinates to pathway nodes for Map mode.
 *
 * Pure function. Uses a simple level-based layered layout and renders
 * **bottom-up**: level 0 (root / starting step) anchors at the bottom
 * of the canvas, and each subsequent level stacks upward. This matches
 * the "pathway = journey toward a destination" metaphor and the native
 * vertical-scroll gesture on phone.
 *
 * Algorithm:
 *   1. Compute each node's longest-path distance from the roots — its
 *      "level". O(V + E) on a DAG.
 *   2. Within a level, order by the graph's natural node order.
 *   3. Emit (i * X_SPACING, (maxLevel - level) * Y_SPACING) — so level 0
 *      lands at the largest y (bottom of the canvas) and the final
 *      level lands at y = 0 (top).
 *
 * Good enough for Phase 2. If the graphs get dense we can swap in dagre
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
