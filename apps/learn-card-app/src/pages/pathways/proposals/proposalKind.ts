/**
 * proposalKind — classify a `PathwayDiff` into one of five semantic
 * categories so the UI can frame proposals accurately.
 *
 * ## Why classify at all
 *
 * A `PathwayDiff` is a union of independent change axes (nodes,
 * edges, route, newPathway). In practice, diffs almost always cluster
 * into one of a few semantic shapes:
 *
 *   - **"Take this route instead"** (route-swap) — What-If, Router.
 *     Non-destructive; the map is unchanged.
 *   - **"Revise your pathway"** (pathway-edit) — Planner, Matcher.
 *     The map itself changes; the route (if any) may be pruned as
 *     collateral.
 *   - **"Here's a whole new pathway"** (new-pathway) — Matcher with
 *     an inbound match, Planner drafting from scratch. `pathwayId`
 *     is `null`, the diff carries a `newPathway` hint.
 *
 * Classifying the diff lets the proposal UI land the right framing,
 * copy, action labels, and diff chrome without each card sniffing
 * the fields it cares about in an ad-hoc way.
 *
 * ## Why this lives in the proposals folder, not types/
 *
 * `proposalKind` is a UI-level classification. It informs framing
 * choices — it doesn't affect persistence, schema, or agent logic.
 * Keeping it next to `ProposalCard` means future refinements to the
 * framing don't need to touch the type layer.
 *
 * ## The "mixed" case
 *
 * A single diff *can* legitimately carry both a route swap and
 * structural edits (e.g. "Planner adds a new prerequisite and the
 * route swap incorporates it"). `mixed` exists so the UI treats
 * such diffs with the pathway-edit chrome — they're structurally
 * consequential, so the full structural preview is the right
 * default — rather than silently downgrading to a route framing.
 *
 * ## The "empty" case
 *
 * A well-formed proposal pipeline should never produce empty
 * diffs; `classifyScenarioForProposal` and the agent record-linters
 * both reject empty selections upstream. `empty` here is
 * defense-in-depth: the card renders "nothing to apply" rather
 * than crashing if one ever leaks through.
 */

import type { PathwayDiff } from '../types';

export type ProposalKind =
    | 'route-swap'
    | 'pathway-edit'
    | 'mixed'
    | 'new-pathway'
    | 'empty';

/**
 * Classify a diff. Pure; suitable for memoization.
 *
 * `new-pathway` takes precedence over any other signal because
 * materializing a whole new pathway is a strictly larger change
 * than anything a route swap or structural edit could represent —
 * the UI should frame it that way.
 */
export const proposalKind = (diff: PathwayDiff): ProposalKind => {
    if (diff.newPathway) return 'new-pathway';

    const hasRouteSwap = diff.setChosenRoute !== undefined;

    const hasStructural =
        diff.addNodes.length > 0 ||
        diff.updateNodes.length > 0 ||
        diff.removeNodeIds.length > 0 ||
        diff.addEdges.length > 0 ||
        diff.removeEdgeIds.length > 0;

    if (hasRouteSwap && hasStructural) return 'mixed';
    if (hasRouteSwap) return 'route-swap';
    if (hasStructural) return 'pathway-edit';

    return 'empty';
};

/**
 * Human-readable framing copy per kind. The UI can use these as
 * defaults; individual cards are free to override with more
 * specific language (e.g. a Router proposal might say "Faster
 * route" rather than the generic "Alternate route").
 */
export const PROPOSAL_KIND_FRAMING: Record<
    ProposalKind,
    { eyebrow: string; accept: string; reject: string }
> = {
    'route-swap': {
        eyebrow: 'Alternate route',
        accept: 'Take this route',
        reject: 'Keep current route',
    },
    'pathway-edit': {
        eyebrow: 'Suggested revision',
        accept: 'Apply',
        reject: 'Dismiss',
    },
    mixed: {
        // Mixed leans pathway-edit in language because the
        // structural change is the more consequential piece. The
        // route swap comes along as a detail under the structural
        // diff.
        eyebrow: 'Revision with route update',
        accept: 'Apply',
        reject: 'Dismiss',
    },
    'new-pathway': {
        eyebrow: 'New pathway',
        accept: 'Add to my pathways',
        reject: 'Not now',
    },
    empty: {
        eyebrow: 'No-op',
        accept: 'OK',
        reject: 'Dismiss',
    },
};
