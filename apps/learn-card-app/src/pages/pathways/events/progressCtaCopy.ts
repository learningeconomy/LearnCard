/**
 * progressCtaCopy — pure helpers that decide what the post-claim
 * pathway-progress CTA should say.
 *
 * Split out from the component + hook so the tier classification
 * and title humanisation can be unit tested without React, and so
 * the hook and component can share one source of truth for copy
 * decisions.
 *
 * ## Tiers, ranked by stakes
 *
 *   `terminal`      — the credential finished at least one pathway
 *                     end-to-end. Biggest moment; warmest copy.
 *   `cross-pathway` — the credential advanced nodes on 2+ pathways.
 *                     Rare, but when it happens the "network effect"
 *                     is the interesting story.
 *   `major`         — single-pathway progress, at least one node
 *                     advanced. The common case; celebratory but
 *                     measured.
 *   `minor`         — outcome bound, no node advanced. Informational.
 *
 * The presenter uses the tier to pick copy, visual weight, and
 * (optional) haptic strength. Keeping it ordinal — more-impactful
 * tiers dominate when a dispatch qualifies for multiple — means the
 * branching in the component is a simple switch.
 */

import type { Pathway } from '../types';

import type {
    AffectedNode,
    AffectedOutcome,
} from './usePathwayProgressForCredential';

// ---------------------------------------------------------------------------
// Tier
// ---------------------------------------------------------------------------

export type ProgressTier =
    | 'terminal'
    | 'cross-pathway'
    | 'major'
    | 'minor'
    | 'none';

export interface ComputeProgressTierInput {
    affectedNodes: readonly AffectedNode[];
    affectedOutcomes: readonly AffectedOutcome[];
    /**
     * The current pathway snapshot keyed by id, AFTER the reactor
     * has applied the completion proposals. Needed to check whether
     * any of the affected pathways are now fully complete (the
     * terminal case).
     */
    pathways: Record<string, Pick<Pathway, 'id' | 'nodes'>>;
}

/**
 * A pathway counts as "finished" when every node's progress status
 * is `completed`. The reactor auto-accepts by default, so by the
 * time this function runs the affected nodes have already been
 * flipped — if the LAST non-complete node was among them, the
 * pathway is terminal.
 *
 * The helper treats zero-node pathways as non-terminal (defensive;
 * a pathway with no nodes shouldn't trigger celebration).
 */
const isPathwayComplete = (pathway: Pick<Pathway, 'nodes'>): boolean => {
    if (pathway.nodes.length === 0) return false;

    return pathway.nodes.every(n => n.progress.status === 'completed');
};

export const computeProgressTier = (
    input: ComputeProgressTierInput,
): ProgressTier => {
    const { affectedNodes, affectedOutcomes, pathways } = input;

    if (affectedNodes.length === 0 && affectedOutcomes.length === 0) {
        return 'none';
    }

    // Terminal beats every other tier — if this credential closed
    // out an entire pathway, that's the headline.
    for (const node of affectedNodes) {
        const pathway = pathways[node.pathwayId];

        if (pathway && isPathwayComplete(pathway)) return 'terminal';
    }

    // Cross-pathway: the single event touched nodes on multiple
    // pathways. Node-level span dominates outcome-level span
    // because node completion is the more meaningful milestone.
    const affectedPathwayIds = new Set(affectedNodes.map(n => n.pathwayId));

    if (affectedPathwayIds.size > 1) return 'cross-pathway';

    // Major: at least one node advanced on a single pathway.
    if (affectedNodes.length > 0) return 'major';

    // Minor: outcome-only match. Informational — the credential
    // supports the pathway but doesn't check off a step.
    return 'minor';
};

// ---------------------------------------------------------------------------
// Node-title humanisation
// ---------------------------------------------------------------------------

/**
 * Strip authoring-convention prefixes from a node title so it reads
 * naturally in learner-facing copy.
 *
 * The AWS demo pathway (and most authored pathways we've seen) use
 * an imperative-verb-prefix pattern:
 *
 *   "Watch: AWS Cloud Essentials"
 *   "Earn: AWS Cloud Practitioner credential"
 *   "AI Tutor: IAM deep dive"
 *
 * That prefix is useful for authors browsing a pathway in Build
 * mode (the verb indicates the node's stage kind) but ungainly
 * when quoted back to a learner in a sentence:
 *
 *   ❌  'Advanced "Earn: AWS Cloud Practitioner credential" on …'
 *   ✅  'Advanced "AWS Cloud Practitioner" on …'
 *
 * ## Heuristic
 *
 * Strip everything up to and including the first colon if:
 *   1. the colon appears within the first 20 characters of the title,
 *   2. the part before the colon contains only letters, digits, and
 *      spaces (looks like a label, not part of a real sentence),
 *   3. the character immediately after the colon is whitespace —
 *      the author-prefix convention is always `Label: Content`,
 *      while URLs and timestamps use `scheme://` / `10:30` without
 *      a space. This is the discriminator that separates them.
 *
 * These bounds are deliberately conservative. Titles that don't
 * match pass through unchanged, so the function is safe to apply
 * unconditionally.
 */
export const humanizeNodeTitle = (title: string): string => {
    const colonIndex = title.indexOf(':');

    if (colonIndex <= 0 || colonIndex > 20) return title;

    const prefix = title.slice(0, colonIndex);
    const afterColon = title.slice(colonIndex + 1);

    // A true author-prefix always has a space after the colon.
    // Blocks URLs (http://…) and timestamps (10:30) regardless of
    // whether their prefix passes the alphabetic check below.
    if (afterColon.length === 0 || !/^\s/.test(afterColon)) return title;

    // Prefix itself must be plain alpha/digit/space. Blocks things
    // like `Q&A:` and `step-1:` that contain punctuation.
    if (!/^[A-Za-z0-9\s]+$/.test(prefix)) return title;

    return afterColon.trim();
};

// ---------------------------------------------------------------------------
// Copy resolvers — pure functions returning { headline, subhead, ctaLabel }
// ---------------------------------------------------------------------------

export interface CtaCopy {
    headline: string;
    /** Secondary line. May be empty when the headline is complete on its own. */
    subhead: string;
    ctaLabel: string;
}

export interface CtaCopyInput {
    tier: ProgressTier;
    affectedNodes: readonly AffectedNode[];
    affectedOutcomes: readonly AffectedOutcome[];
}

/**
 * Resolve the post-claim CTA copy for a given tier. Kept pure so
 * the component's render can call this directly and a future
 * Storybook / screenshot test can cover each tier deterministically.
 */
export const resolveCtaCopy = (input: CtaCopyInput): CtaCopy => {
    const { tier, affectedNodes, affectedOutcomes } = input;

    switch (tier) {
        case 'terminal': {
            const pathwayTitle = affectedNodes[0]?.pathwayTitle
                ?? affectedOutcomes[0]?.pathwayTitle
                ?? 'your pathway';

            return {
                headline: 'You did it.',
                subhead: `You just finished ${pathwayTitle}.`,
                ctaLabel: 'See what you completed',
            };
        }

        case 'cross-pathway': {
            const nodeCount = affectedNodes.length;
            const pathwayTitles = Array.from(
                new Set(affectedNodes.map(n => n.pathwayTitle)),
            );

            const pathwayList = formatPathwayList(pathwayTitles);

            return {
                headline: `This credential advanced ${nodeCount} step${nodeCount === 1 ? '' : 's'}.`,
                subhead: `Across ${pathwayList}.`,
                ctaLabel: 'See progress',
            };
        }

        case 'major': {
            const node = affectedNodes[0];

            if (!node) {
                return {
                    headline: 'Nice — one step closer.',
                    subhead: '',
                    ctaLabel: 'Open pathway',
                };
            }

            const nodeTitle = humanizeNodeTitle(node.nodeTitle);

            return {
                headline: 'Nice — one step closer.',
                // Note: no outer quotes around the node title. We trust
                // the humaniser and keep the sentence conversational.
                subhead: `That checks off ${nodeTitle} on ${node.pathwayTitle}.`,
                ctaLabel: 'Open pathway',
            };
        }

        case 'minor': {
            const pathwayTitle = affectedOutcomes[0]?.pathwayTitle ?? 'your pathway';

            return {
                headline: 'Added to your progress.',
                subhead: `This credential counts toward ${pathwayTitle}.`,
                ctaLabel: 'See progress',
            };
        }

        case 'none':
            return {
                headline: '',
                subhead: '',
                ctaLabel: '',
            };
    }
};

/**
 * "A", "A and B", "A, B, and C", "A, B, and 3 more" — the small
 * English-list renderer for the cross-pathway subhead. Kept here
 * (rather than reusing a generic helper) because the "and N more"
 * suffix policy is specific to this surface.
 */
const formatPathwayList = (titles: readonly string[]): string => {
    if (titles.length === 0) return 'your pathways';
    if (titles.length === 1) return titles[0];
    if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
    if (titles.length === 3) return `${titles[0]}, ${titles[1]}, and ${titles[2]}`;

    // 4+: truncate to keep the subhead from wrapping ungracefully.
    return `${titles[0]}, ${titles[1]}, and ${titles.length - 2} more`;
};
