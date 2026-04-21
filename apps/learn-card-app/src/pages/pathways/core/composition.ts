/**
 * composition — pure helpers for nested / composed pathways.
 *
 * **Background.** A node with a `composite` policy represents
 * "completion of another pathway". The referenced pathway is a
 * first-class `Pathway` in the same `pathwayStore`. Two rendering
 * styles share this one primitive:
 *
 *   - `inline-expandable` — *nesting*: the parent's NodeDetail shows a
 *     mini map of the referenced pathway inline.
 *   - `link-out` — *composition*: a "Complete X to unlock" card that
 *     jumps into the referenced pathway's Today.
 *
 * This module owns the *data-layer* consequences of that:
 *
 *   1. **Cycle detection** — you can't have pathway A embed pathway B
 *      embed pathway A. Authoring tools call `wouldCreateCycle` before
 *      committing a composite policy.
 *   2. **Progress rollup** — "3 of 7 done" badges and progress rings
 *      for a composite node need the progress of the nested pathway,
 *      not of the parent node. `computePathwayProgress` returns that.
 *   3. **Composite completion resolution** — `isCompositeSatisfied`
 *      resolves a `pathway-completed` termination against the current
 *      pathway store.
 *
 * All helpers are **pure** and accept a `PathwayMap` (= the `pathways`
 * record from `pathwayStore`). Callers thread live state in; tests
 * pass literals.
 */

import type { Pathway, PathwayNode } from '../types';

// ---------------------------------------------------------------------------
// Shared shape
// ---------------------------------------------------------------------------

/**
 * Minimal surface of `pathwayStore.pathways` that these helpers need.
 * Accepting this plain record keeps the helpers store-agnostic and
 * trivially testable.
 */
export type PathwayMap = Record<string, Pathway>;

// ---------------------------------------------------------------------------
// Reference discovery
// ---------------------------------------------------------------------------

/**
 * Every pathway id referenced by the composite policies of the given
 * pathway's nodes. De-duplicated. Order mirrors node order so output
 * is stable for tests.
 */
export const referencedPathwayIds = (pathway: Pathway): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const node of pathway.nodes) {
        if (node.stage.policy.kind !== 'composite') continue;

        const ref = node.stage.policy.pathwayRef;

        if (seen.has(ref)) continue;

        seen.add(ref);
        out.push(ref);
    }

    return out;
};

// ---------------------------------------------------------------------------
// Cycle detection
// ---------------------------------------------------------------------------

/**
 * Would embedding `candidateChildId` as a composite reference inside
 * `parentPathwayId` create a cycle at the pathway level?
 *
 * Returns `true` if **any** of:
 *
 *   - parent === candidateChild (a pathway can't embed itself)
 *   - candidateChild already transitively references parent via the
 *     existing graph of composite references.
 *
 * Works even when the candidate child isn't yet wired into the parent —
 * we walk from the candidate child outward and stop the moment we see
 * the parent. O(V + E) over the pathway-reference graph.
 */
export const wouldCreateCycle = (
    pathways: PathwayMap,
    parentPathwayId: string,
    candidateChildId: string,
): boolean => {
    if (parentPathwayId === candidateChildId) return true;

    const visited = new Set<string>();
    const stack: string[] = [candidateChildId];

    while (stack.length > 0) {
        const id = stack.pop()!;

        if (visited.has(id)) continue;

        visited.add(id);

        // Reaching parent from the candidate child means adding
        // `parent → candidateChild` would close a cycle.
        if (id === parentPathwayId) return true;

        const next = pathways[id];

        if (!next) continue;

        for (const refId of referencedPathwayIds(next)) {
            if (!visited.has(refId)) stack.push(refId);
        }
    }

    return false;
};

/**
 * Detect any existing cycles in the composite-reference graph.
 * Returns each cycle as the sequence of pathway ids visited,
 * starting and ending with the node that closed the cycle.
 *
 * Intended for import-time diagnostics and for "health of my graph"
 * surfaces, not the hot path.
 */
export const findReferenceCycles = (pathways: PathwayMap): string[][] => {
    const cycles: string[][] = [];
    const color = new Map<string, 'white' | 'gray' | 'black'>();

    for (const id of Object.keys(pathways)) color.set(id, 'white');

    const path: string[] = [];

    const visit = (id: string) => {
        if (color.get(id) === 'gray') {
            const cycleStart = path.indexOf(id);

            if (cycleStart >= 0) {
                cycles.push([...path.slice(cycleStart), id]);
            }

            return;
        }

        if (color.get(id) === 'black') return;

        color.set(id, 'gray');
        path.push(id);

        const p = pathways[id];

        if (p) {
            for (const refId of referencedPathwayIds(p)) visit(refId);
        }

        path.pop();
        color.set(id, 'black');
    };

    for (const id of Object.keys(pathways)) {
        if (color.get(id) === 'white') visit(id);
    }

    return cycles;
};

// ---------------------------------------------------------------------------
// Progress rollup
// ---------------------------------------------------------------------------

export interface PathwayProgress {
    /** Nodes whose `progress.status === 'completed'`. */
    completed: number;
    /** All nodes in the pathway. */
    total: number;
    /** Convenience: 0–1 fraction. `NaN`-safe; returns `0` when `total` is 0. */
    fraction: number;
    /** Is the destination node (if any) completed? */
    destinationCompleted: boolean;
}

/**
 * Compute high-level progress for an entire pathway. Used by composite
 * nodes to render "3 of 7 steps · destination locked" without the
 * parent NodeDetail having to know anything about the nested pathway's
 * internal shape.
 */
export const computePathwayProgress = (pathway: Pathway): PathwayProgress => {
    const total = pathway.nodes.length;

    const completed = pathway.nodes.filter(
        n => n.progress.status === 'completed',
    ).length;

    const dest = pathway.destinationNodeId
        ? pathway.nodes.find(n => n.id === pathway.destinationNodeId)
        : undefined;

    return {
        completed,
        total,
        fraction: total === 0 ? 0 : completed / total,
        destinationCompleted: dest?.progress.status === 'completed',
    };
};

// ---------------------------------------------------------------------------
// Composite completion
// ---------------------------------------------------------------------------

/**
 * True iff the pathway referenced by `pathwayRef` is "done" — i.e.
 * its destination node is `completed`. Returns `false` when the
 * referenced pathway isn't loaded (learner hasn't subscribed yet) or
 * has no destination.
 *
 * This is the ground-truth for `pathway-completed` termination and for
 * the `done` state of a composite node.
 */
export const isPathwayCompleted = (
    pathways: PathwayMap,
    pathwayRef: string,
): boolean => {
    const p = pathways[pathwayRef];

    if (!p) return false;

    return computePathwayProgress(p).destinationCompleted;
};

/**
 * A composite node's "child" is the referenced pathway. This helper
 * returns it when loaded, otherwise `null`. Centralized so UI code
 * doesn't repeatedly dereference `pathwayStore.pathways[ref]`.
 */
export const resolveCompositeChild = (
    pathways: PathwayMap,
    node: PathwayNode,
): Pathway | null => {
    if (node.stage.policy.kind !== 'composite') return null;

    return pathways[node.stage.policy.pathwayRef] ?? null;
};

// ---------------------------------------------------------------------------
// Progress rollup
// ---------------------------------------------------------------------------

/**
 * Walk every pathway in the map and auto-complete composite nodes whose
 * referenced pathway has hit its destination. Pure; takes a map in,
 * returns a (possibly new) map. If no nodes flip, the identity of the
 * input is preserved so `===` equality can be used by callers as a
 * "nothing changed" signal.
 *
 * ### Why this exists
 *
 * A composite node points at another pathway. The node has no direct
 * evidence, no rubric, and no self-attest — its only completion
 * criterion is that the nested pathway finished. Without this rollup:
 *
 *   - The composite node stays `not-started` forever
 *   - Its dependents never unblock → the parent pathway freezes
 *   - Today keeps offering the composite as a candidate
 *
 * ### Fixed-point iteration
 *
 * Chains of composites (A references B which references C) need
 * transitive propagation. We iterate until a pass makes no changes
 * so the whole forest converges in one call. The pathway-ref graph
 * is a DAG (cycle-rejected at author time), so this terminates in
 * at most `O(depth)` passes — typically 1–3.
 *
 * We cap iterations defensively. If a bad import ever slipped a cycle
 * past the cycle guard, we'd rather stop than loop.
 */
export const rollupCompositeProgress = (pathways: PathwayMap): PathwayMap => {
    const MAX_PASSES = 32;

    let current = pathways;

    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
        let changed = false;
        const next: PathwayMap = {};

        for (const [id, pathway] of Object.entries(current)) {
            // Look for composite nodes that should auto-complete now.
            // We only ever FLIP to completed; we never un-complete a
            // node here. That preserves learner-owned state like
            // manual completions and keeps the rollup monotonic.
            let pathwayChanged = false;

            const nextNodes = pathway.nodes.map(node => {
                if (node.stage.policy.kind !== 'composite') return node;
                if (node.progress.status === 'completed') return node;

                const ref = node.stage.policy.pathwayRef;

                if (!isPathwayCompleted(current, ref)) return node;

                pathwayChanged = true;
                changed = true;

                const now = new Date().toISOString();

                return {
                    ...node,
                    progress: {
                        ...node.progress,
                        status: 'completed' as const,
                        completedAt: now,
                    },
                    updatedAt: now,
                };
            });

            next[id] = pathwayChanged
                ? { ...pathway, nodes: nextNodes, updatedAt: new Date().toISOString() }
                : pathway;
        }

        // Fixed point reached — no flips happened this pass. Return
        // the UNCHANGED input (`current`), not the freshly-allocated
        // `next` object, so callers can use `===` to detect no-ops.
        if (!changed) return current;

        current = next;
    }

    // Safety valve. In practice unreachable because composite cycles
    // are rejected at author time by `wouldCreateCycle`.
    return current;
};
