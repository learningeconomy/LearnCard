/**
 * presentation — pure helpers that shape the TodayMode surface.
 *
 * Kept separate from the React components so the pieces that actually
 * encode a choice (how we name a time of day, what "remaining" means on
 * a DAG, how a policy kind reads to a human) can be unit-tested and
 * replaced without touching any rendering code.
 */

import type { Pathway, Policy } from '../types';

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------

export type Greeting =
    | 'Good morning'
    | 'Good afternoon'
    | 'Good evening'
    | 'Still here';

/**
 * Deterministic greeting keyed off the *local* hour of `now`.
 *
 *   05:00 – 11:59  → "Good morning"
 *   12:00 – 16:59  → "Good afternoon"
 *   17:00 – 21:59  → "Good evening"
 *   22:00 – 04:59  → "Still here"   (a quiet acknowledgement, not a scold)
 *
 * The late-night phrase is intentional — punishing the learner with
 * "it's 2am, go to bed" breaks trust; a neutral phrase keeps the page
 * from feeling absent at that hour.
 */
export const getGreeting = (now: Date): Greeting => {
    const h = now.getHours();

    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 22) return 'Good evening';

    return 'Still here';
};

// ---------------------------------------------------------------------------
// Journey progress
// ---------------------------------------------------------------------------

export interface Journey {
    /** Nodes the learner has finished. */
    completed: number;
    /** Every node in the pathway. */
    total: number;
    /** Nodes still ahead (not completed and not skipped). */
    remaining: number;
}

/**
 * Count-based summary of where the learner is on a pathway.
 *
 * Deliberately avoids saying "Step N of M" — a pathway is a DAG, not a
 * queue, and that phrasing would lie on branching pathways. `completed`
 * and `remaining` are defensible on any shape.
 *
 * `skipped` nodes are not counted as either completed *or* remaining —
 * they're set aside. `total` still reflects the full node count so the
 * learner can read "3 done · 2 to go" on a 7-node pathway where 2 were
 * skipped.
 */
export const buildJourney = (pathway: Pathway): Journey => {
    const total = pathway.nodes.length;

    let completed = 0;
    let remaining = 0;

    for (const node of pathway.nodes) {
        if (node.progress.status === 'completed') {
            completed += 1;
        } else if (node.progress.status !== 'skipped') {
            remaining += 1;
        }
    }

    return { completed, total, remaining };
};

/**
 * Short human description of a journey. The shape of the sentence shifts
 * with the learner's position so Today doesn't always read the same way:
 *
 *   - Fresh start  → "First step"
 *   - Mid-pathway  → "2 done · 5 to go"
 *   - Near the end → "Last one"
 *   - Final step   → "One more"
 *   - Complete     → "All done"
 */
export const journeyLabel = (journey: Journey): string => {
    const { completed, remaining } = journey;

    if (remaining === 0 && completed > 0) return 'All done';
    if (remaining === 1) return 'Last one';
    if (completed === 0) return 'First step';

    return `${completed} done · ${remaining} to go`;
};

// ---------------------------------------------------------------------------
// Policy labels
// ---------------------------------------------------------------------------

const POLICY_LABELS: Record<Policy['kind'], string> = {
    practice: 'Practice',
    review: 'Recall',
    assessment: 'Check',
    artifact: 'Make',
    external: 'External',
};

/**
 * One-word label for the kind of work this node asks of the learner.
 * Used as a small header chip above the title so they know what they
 * are walking into (making vs. reviewing vs. being assessed).
 */
export const policyLabel = (kind: Policy['kind']): string => POLICY_LABELS[kind];

const POLICY_CALLS: Record<Policy['kind'], string> = {
    practice: 'Log a practice session',
    review: 'Start the review',
    assessment: 'Start the assessment',
    artifact: 'Work on the artifact',
    external: 'Open the external tool',
};

/**
 * Verb-first call-to-action used on the Today hero button. Moved out of
 * `NextActionCard` so the same copy stays consistent if the CTA ever
 * appears elsewhere (e.g. a widget).
 */
export const policyCallToAction = (kind: Policy['kind']): string => POLICY_CALLS[kind];
