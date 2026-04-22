/**
 * routeDiff — compare two chosenRoute ids arrays and classify each
 * node as `kept`, `removed`, or `added` relative to the current
 * route.
 *
 * ## Why not just a set diff
 *
 * Order matters. A route is a walk, not a bag of ids. A diff that
 * merely lists "added" and "removed" without preserving sequence
 * can't answer the most common question a learner asks when
 * previewing a route swap: *"where in the walk does this drop
 * off?"* The `steps` array in the return value preserves the
 * union order (current-with-insertions-from-proposed) so the UI
 * can render a single linear strip with annotated status per node.
 *
 * ## Dual ordering
 *
 * `kept` and `removed` are returned in **current-route order** so
 * "what's disappearing from your walk" reads top-to-bottom as the
 * learner walks it today. `added` is returned in **proposed-route
 * order** so "what's new on the alternative walk" reads the same
 * way.
 *
 * This is the minimum surface the Phase A / Phase C route-preview
 * UIs both need. It lives in its own file (not inline in the card)
 * because the What-If scenario card will reuse it.
 */

export interface RouteDiffStep {
    id: string;
    status: 'kept' | 'removed' | 'added';
    /**
     * Position in the *proposed* route for kept/added steps, or the
     * position in the *current* route for removed steps. Useful for
     * "step 4 of 7" labeling when the UI wants to render progress
     * pips alongside the strip.
     */
    index: number;
}

export interface RouteDiffResult {
    /** Current-route ids in original order, with a `kept` / `removed` tag. */
    kept: string[];
    removed: string[];
    /** Proposed-route ids not in the current route, in proposed order. */
    added: string[];
    /**
     * Linearized union for rendering: current route with any proposed-
     * only nodes inserted at their proposed position. Each step
     * carries a `status` and the index it occupies in the target
     * (proposed) route when kept/added, or in the current route when
     * removed.
     */
    steps: RouteDiffStep[];
    /** Convenience booleans for quick branching in the UI. */
    hasChanges: boolean;
}

/**
 * Diff two chosenRoute id arrays. Either may be `undefined` / empty;
 * the result degrades gracefully:
 *
 *   - current undefined / empty → everything in `proposed` is `added`
 *   - proposed undefined / empty → everything in `current` is `removed`
 *   - both undefined / empty → `hasChanges = false`
 */
export const diffRoutes = (
    current: readonly string[] | undefined,
    proposed: readonly string[] | undefined,
): RouteDiffResult => {
    const cur = current ?? [];
    const prop = proposed ?? [];

    const curSet = new Set(cur);
    const propSet = new Set(prop);

    const kept: string[] = [];
    const removed: string[] = [];
    const added: string[] = [];

    for (const id of cur) {
        if (propSet.has(id)) kept.push(id);
        else removed.push(id);
    }

    for (const id of prop) {
        if (!curSet.has(id)) added.push(id);
    }

    // Linearize for rendering. Walk through the proposed route first
    // (that's what the learner will be walking after accepting), then
    // append removed nodes at the end as "dropped from the walk." This
    // reads as "here's your new route, and here's what's falling off."
    // For a purely additive proposal (nothing removed), the trailing
    // section is empty; for a pure skip, the proposed list already
    // shows the kept sequence.
    const steps: RouteDiffStep[] = [];

    prop.forEach((id, index) => {
        steps.push({
            id,
            status: curSet.has(id) ? 'kept' : 'added',
            index,
        });
    });

    cur.forEach((id, index) => {
        if (!propSet.has(id)) {
            steps.push({ id, status: 'removed', index });
        }
    });

    return {
        kept,
        removed,
        added,
        steps,
        hasChanges: removed.length > 0 || added.length > 0,
    };
};
