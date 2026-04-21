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
    // Composite nodes point at another pathway. Today mode surfaces
    // them as "Nested" so the chip reads honestly — the work itself
    // lives inside the referenced pathway, not in this node.
    composite: 'Nested',
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
    // Composite fallback CTA — the final copy is resolved in
    // `resolvePolicyCallToAction` from the referenced pathway's
    // title ("Open Algebra I"). This generic stays honest when the
    // nested pathway hasn't loaded yet.
    composite: 'Open nested pathway',
};

/**
 * Verb-first call-to-action used on the Today hero button. Moved out of
 * `NextActionCard` so the same copy stays consistent if the CTA ever
 * appears elsewhere (e.g. a widget).
 */
export const policyCallToAction = (kind: Policy['kind']): string => POLICY_CALLS[kind];

/**
 * Resolve the CTA label for a specific policy, threading in MCP context
 * when the policy is `external`. A generic "Open the external tool" is
 * fine when we don't know the server (still-unresolved registry) but
 * terrible when we do — the learner should see "Open in Figma" /
 * "Open in Notion" / etc so the action sets clear expectations.
 *
 * The `mcpLabel` comes from `mcpRegistryStore.servers[serverId].label`
 * at the call site. We keep this module store-free so it stays
 * unit-testable.
 */
export const resolvePolicyCallToAction = (
    policy: Policy,
    mcpLabel?: string | null,
): string => {
    if (policy.kind === 'external' && mcpLabel) {
        return `Open in ${mcpLabel}`;
    }

    return policyCallToAction(policy.kind);
};

// ---------------------------------------------------------------------------
// Identity framing
// ---------------------------------------------------------------------------

/**
 * Mapping of common goal-verbs to their gerund (-ing) form. Used to turn
 * a goal like "write a novel" into "someone writing a novel" — the
 * past-progressive identity phrasing the architecture calls out as
 * load-bearing (§10, synthesis doc's "habit-identity" research).
 *
 * The list is intentionally small. If a verb isn't here we fall back to
 * rendering the goal verbatim rather than hand-rolling fragile English.
 */
const GERUND_MAP: Record<string, string> = {
    write: 'writing',
    build: 'building',
    ship: 'shipping',
    learn: 'learning',
    get: 'getting',
    become: 'becoming',
    make: 'making',
    create: 'creating',
    master: 'mastering',
    explore: 'exploring',
    practice: 'practicing',
    study: 'studying',
    read: 'reading',
    grow: 'growing',
    design: 'designing',
    teach: 'teaching',
    run: 'running',
    start: 'starting',
    publish: 'publishing',
    finish: 'finishing',
    change: 'changing',
    earn: 'earning',
    land: 'landing',
};

const IDENTITY_PREFIX = /^(a |an |the |someone |the next )/i;

/**
 * Transform a pathway's `goal` into an identity-tense phrase suitable
 * for the "You are becoming __" framing on Today.
 *
 *   "write a novel"          → "someone writing a novel"
 *   "ship one artifact"      → "someone shipping one artifact"
 *   "a better writer"        → "a better writer"          (already identity)
 *   "someone who writes"     → "someone who writes"       (already identity)
 *   "the next CEO"           → "the next CEO"             (already identity)
 *   "foo bar baz"            → "foo bar baz"              (can't transform)
 *   ""                       → ""
 *
 * The goal here is *honesty* over cleverness: if we can't produce a
 * grammatical identity phrase, we render the goal verbatim rather than
 * generating something grating.
 */
export const identityPhrase = (goal: string): string => {
    const trimmed = goal.trim();

    if (!trimmed) return '';

    // Already identity-phrased — leave it alone.
    if (IDENTITY_PREFIX.test(trimmed)) return trimmed;

    const [first, ...rest] = trimmed.split(/\s+/);
    const gerund = GERUND_MAP[first.toLowerCase()];

    if (!gerund) return trimmed;

    const suffix = rest.length > 0 ? ` ${rest.join(' ')}` : '';

    return `someone ${gerund}${suffix}`;
};
