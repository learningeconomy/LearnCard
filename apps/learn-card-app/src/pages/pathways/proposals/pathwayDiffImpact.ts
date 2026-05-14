/**
 * pathwayDiffImpact — predict how a structural `PathwayDiff` would
 * affect a learner's committed walk (`chosenRoute`).
 *
 * ## Why route-impact belongs on the proposal card
 *
 * A pathway-edit proposal (Planner adds a prerequisite, Matcher
 * removes an obsolete node) reads like graph surgery on the surface,
 * but the first question a learner has is almost always
 * *"what does this do to **my walk**?"* Showing structural changes
 * alone — "remove 2 nodes, add 1 edge" — buries that answer.
 *
 * This helper computes the answer up front: which committed route
 * steps would disappear, whether the destination stays reachable in
 * the post-diff walk, and how far the remaining walk shrinks. The
 * UI then shows it as a small "Route impact" read alongside the
 * structural diff.
 *
 * ## Not a simulation
 *
 * We intentionally don't reroute the pathway here. Running a full
 * `computeSuggestedRoute` on the projected post-diff pathway would
 * be more accurate but also slower, harder to reason about, and
 * coupled to the focus-node. The cheap analysis below gets the
 * three questions that matter at card-preview time:
 *
 *   - **Which of my route steps vanish?** Intersect
 *     `removeNodeIds` with `pathway.chosenRoute`.
 *   - **Is the destination still on the walk?** Yes unless the diff
 *     removes it outright.
 *   - **Could the diff add steps to the walk?** Only when the
 *     proposal carries `setChosenRoute`; otherwise the existing
 *     walk just contracts.
 *
 * Callers that need a full simulation can still build one on top
 * using `applyProposal` + `buildRouteFromChosen` — this helper is
 * just the card-level read.
 */

import type { Pathway, PathwayDiff } from '../types';

export interface PathwayDiffRouteImpact {
    /**
     * Route step ids the diff would remove from the committed walk
     * (i.e. removed by `removeNodeIds` and currently on
     * `pathway.chosenRoute`). Empty when the diff is purely
     * additive / edge-only / doesn't touch route steps.
     */
    routeNodesRemoved: string[];
    /**
     * `true` when the diff removes the pathway's destination node
     * outright. The post-diff walk loses its anchor; the card should
     * frame this as a destructive change (destination gone means no
     * route).
     */
    destinationRemoved: boolean;
    /**
     * `true` when the diff has *any* impact on the committed walk —
     * route-step removal, destination removal, or an explicit
     * route swap via `setChosenRoute`. Callers can short-circuit
     * the "Route impact" section when this is false.
     */
    hasImpact: boolean;
    /**
     * Count of remaining route steps after the diff applies,
     * filtered down to ids that survive `removeNodeIds`. When
     * `hasImpact` is false this equals the current route length.
     * Does not account for `setChosenRoute` overrides — the
     * RouteDiffSummary component handles that case on the card.
     */
    remainingRouteSteps: number;
}

/**
 * Compute the route-impact summary for a `PathwayDiff` against a
 * pathway. Pure.
 *
 * Returns an impact with `hasImpact=false` when the pathway has no
 * committed route to worry about, or when the diff's removals don't
 * touch the route. Callers should typically skip rendering the
 * "Route impact" section in that case.
 */
export const computePathwayDiffRouteImpact = (
    diff: PathwayDiff,
    pathway: Pathway,
): PathwayDiffRouteImpact => {
    const chosen = pathway.chosenRoute ?? [];

    // No route → nothing to impact. Callers already suppress the
    // Route impact section on legacy pathways, but being explicit
    // here keeps the return shape uniform.
    if (chosen.length === 0) {
        return {
            routeNodesRemoved: [],
            destinationRemoved: false,
            hasImpact: false,
            remainingRouteSteps: 0,
        };
    }

    const removeSet = new Set(diff.removeNodeIds);

    const routeNodesRemoved = chosen.filter(id => removeSet.has(id));

    const destinationRemoved =
        pathway.destinationNodeId !== undefined &&
        removeSet.has(pathway.destinationNodeId);

    // `setChosenRoute` is an explicit swap — RouteDiffSummary on the
    // card shows the shape of that change. We still flag impact here
    // so the parent can decide to render a combined section when the
    // diff both edits structure *and* swaps routes.
    const hasRouteSwap = diff.setChosenRoute !== undefined;

    const hasImpact =
        routeNodesRemoved.length > 0 ||
        destinationRemoved ||
        hasRouteSwap;

    const remainingRouteSteps = chosen.length - routeNodesRemoved.length;

    return {
        routeNodesRemoved,
        destinationRemoved,
        hasImpact,
        remainingRouteSteps,
    };
};
