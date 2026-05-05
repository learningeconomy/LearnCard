/**
 * buildCompletionReceipt — pure helper that distills a completed
 * pathway (and its sub-pathways, if any) into the four numbers
 * the ceremony's "receipt strip" reads as the dignified summary
 * line.
 *
 * Called by both Tier 1 (sub-pathway) and Tier 2 (top-level
 * pathway) ceremonies. Pure / dependency-free / no React so it
 * can be unit-tested in isolation.
 *
 *   - **steps** — completed nodes on the pathway *itself*. For
 *     Tier 2 the caller may also pass `subPathways` and the
 *     helper rolls their completed-step counts into a single
 *     "X steps across the journey" total. Composite nodes that
 *     reference a sub-pathway are *not* double-counted: the
 *     composite is one step on the parent; its child's nodes
 *     are counted separately under the sub-pathway's own roll-up.
 *   - **vouches** — endorsements that arrived (excludes any
 *     `pending-*` ids, mirroring `termination.ts`'s
 *     `countArrivedEndorsements`).
 *   - **days** — calendar days from `pathway.createdAt` to the
 *     completion timestamp. Floors to whole days; minimum 1
 *     ("today"). A pathway completed inside its first day reads
 *     "1 day" rather than "0 days" or a fractional figure.
 *   - **subPathwayCount** — number of sub-pathways under the
 *     root. Drives the optional "X chapters" beat. Always 0 for
 *     Tier 1 (the `completedPathway` IS the sub-pathway).
 */

import type { Pathway } from '../types';

export interface CompletionReceipt {
    /** Completed-node count summed across pathway + subPathways. */
    steps: number;
    /** Total node count summed across pathway + subPathways. */
    totalSteps: number;
    /** Arrived (non-pending) endorsements summed across pathway + subPathways. */
    vouches: number;
    /** Whole-day calendar span from `createdAt` to `completedAt`. Min 1. */
    days: number;
    /** Number of sub-pathways rolled into this receipt. */
    subPathwayCount: number;
}

interface BuildReceiptInput {
    completedPathway: Pathway;
    /**
     * Sub-pathways embedded under `completedPathway` via composite
     * refs. Caller resolves these from the pathway map. May be
     * empty (Tier 1, or a Tier 2 pathway with no nested journeys).
     */
    subPathways: readonly Pathway[];
    /**
     * The ceremony's completion timestamp — typically
     * `recentCelebration.completedAt`. Falling back to "now" is
     * intentional for replay scenarios where the snapshot has
     * been re-emitted with a fresh timestamp.
     */
    completedAt: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Count arrived endorsements on a single pathway. Mirrors the
 * `termination.ts` predicate so receipt math agrees with what
 * the learner saw on each node.
 */
const countArrivedEndorsements = (pathway: Pathway): number => {
    let count = 0;

    for (const node of pathway.nodes) {
        for (const e of node.endorsements) {
            if (e.endorsementId.startsWith('pending-')) continue;
            count += 1;
        }
    }

    return count;
};

/**
 * Count completed nodes on a single pathway.
 */
const countCompletedNodes = (pathway: Pathway): number =>
    pathway.nodes.filter(n => n.progress.status === 'completed').length;

export const buildCompletionReceipt = (
    input: BuildReceiptInput,
): CompletionReceipt => {
    const { completedPathway, subPathways, completedAt } = input;

    let steps = countCompletedNodes(completedPathway);
    let totalSteps = completedPathway.nodes.length;
    let vouches = countArrivedEndorsements(completedPathway);

    for (const sub of subPathways) {
        steps += countCompletedNodes(sub);
        totalSteps += sub.nodes.length;
        vouches += countArrivedEndorsements(sub);
    }

    const start = Date.parse(completedPathway.createdAt);
    const end = Date.parse(completedAt);

    // `Number.isFinite` covers both NaN (bad ISO) and ±Infinity
    // (no createdAt on legacy pathway). Falling back to 1 is
    // honest: "today" is the minimum span we'd report and avoids
    // claiming 0 or negative days from clock skew.
    const days =
        Number.isFinite(start) && Number.isFinite(end) && end >= start
            ? Math.max(1, Math.floor((end - start) / MS_PER_DAY) || 1)
            : 1;

    return {
        steps,
        totalSteps,
        vouches,
        days,
        subPathwayCount: subPathways.length,
    };
};
