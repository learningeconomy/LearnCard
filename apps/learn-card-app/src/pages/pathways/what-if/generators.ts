/**
 * Scenario generators — heuristics that observe a pathway and
 * propose honest alternative shapes.
 *
 * ## Design rules
 *
 *   1. **Observational, never fabricating.** A scenario's
 *      transformation must correspond to nodes that *actually exist*
 *      in the pathway. We don't invent "a faster route" by inserting
 *      novel nodes; we only elide or reweight what's already there.
 *      That's what makes the What-If surface trustworthy.
 *
 *   2. **Non-trivial only.** A scenario that produces no change
 *      against the live pathway is a waste of the learner's
 *      attention, so each generator inspects the pathway first and
 *      returns `null` when its transformation would be a no-op.
 *
 *   3. **Stable ids.** Scenario ids are string constants, not
 *      UUIDs — they're deterministic across runs so the UI can
 *      animate in/out smoothly if a generator starts/stops emitting
 *      one as progress evolves.
 *
 * The generator set is small on purpose. Three scenarios in the
 * v1 tradeoff table is a useful comparison matrix; ten is cognitive
 * load with no added honesty.
 */

import type { Pathway, Policy, Tradeoff } from '../types';

import type { Scenario } from './types';

// -----------------------------------------------------------------
// Pathway observations
// -----------------------------------------------------------------

/**
 * Count uncompleted ancestors of the destination, grouped by policy
 * kind. Generators use this to decide whether their transformation
 * is non-trivial — e.g. `fast-track` needs at least one uncompleted
 * `review` node to skip before it has anything to offer.
 *
 * Completed nodes are excluded because they're already past the
 * what-if frontier; no scenario can "skip" work the learner has
 * already done.
 */
const countUncompletedByKind = (
    pathway: Pathway,
): Record<Policy['kind'], number> => {
    const counts: Record<Policy['kind'], number> = {
        practice: 0,
        review: 0,
        assessment: 0,
        artifact: 0,
        external: 0,
        composite: 0,
    };

    for (const node of pathway.nodes) {
        if (node.progress.status === 'completed') continue;

        counts[node.stage.policy.kind] += 1;
    }

    return counts;
};

// -----------------------------------------------------------------
// Individual generators
// -----------------------------------------------------------------

/**
 * Fast track — elide `review` nodes. Honest version of "can I skip
 * the spaced-repetition reviews and still hit the destination?"
 *
 * Emitted only when at least one uncompleted review node exists.
 * Tradeoffs it authors:
 *   - `difficulty: worse` — fewer reviews means weaker long-term
 *     retention. That's a real cost, not a PR gloss, so we always
 *     surface it regardless of ETA delta.
 *
 * The simulator will append a `time: better` tradeoff derived from
 * the numeric ETA delta.
 */
const fastTrack = (pathway: Pathway): Scenario | null => {
    const counts = countUncompletedByKind(pathway);
    if (counts.review === 0) return null;

    const authoredTradeoffs: Tradeoff[] = [
        {
            dimension: 'difficulty',
            deltaDescription: 'Weaker long-term retention without reviews',
            direction: 'worse',
        },
    ];

    return {
        id: 'whatif-fast-track',
        kind: 'fast-track',
        title: 'Fast track',
        subtitle: `Skip ${counts.review} review step${counts.review === 1 ? '' : 's'} to reach the destination sooner`,
        authoredTradeoffs,
        selector: { skipPolicyKinds: ['review'] },
    };
};

/**
 * Deep practice — double practice effort. Honest version of "what
 * if I put more reps into the practice blocks?"
 *
 * Emitted only when at least one uncompleted practice node exists.
 * Tradeoffs:
 *   - `difficulty: better` — more repetition, more mastery.
 *   - (`time: worse` appended by the simulator.)
 */
const deepPractice = (pathway: Pathway): Scenario | null => {
    const counts = countUncompletedByKind(pathway);
    if (counts.practice === 0) return null;

    const authoredTradeoffs: Tradeoff[] = [
        {
            dimension: 'difficulty',
            deltaDescription: 'Deeper mastery from more reps',
            direction: 'better',
        },
        {
            dimension: 'effort',
            deltaDescription: 'More focused practice time',
            direction: 'worse',
        },
    ];

    return {
        id: 'whatif-deep-practice',
        kind: 'deep-practice',
        title: 'Deep practice',
        subtitle: `Double the practice load across ${counts.practice} session${counts.practice === 1 ? '' : 's'}`,
        authoredTradeoffs,
        selector: { effortMultiplierByKind: { practice: 2 } },
    };
};

/**
 * External-light — elide `external` nodes. Honest version of "what
 * if I don't rely on the outside modules?"
 *
 * Emitted only when at least one uncompleted external node exists.
 * Tradeoffs:
 *   - `external-dependency: better` — fewer third-party hops.
 *   - `difficulty: worse` — less breadth of input, harder to meet
 *     the destination termination alone.
 */
const externalLight = (pathway: Pathway): Scenario | null => {
    const counts = countUncompletedByKind(pathway);
    if (counts.external === 0) return null;

    const authoredTradeoffs: Tradeoff[] = [
        {
            dimension: 'external-dependency',
            deltaDescription: 'Less reliance on outside modules',
            direction: 'better',
        },
        {
            dimension: 'difficulty',
            deltaDescription: 'Harder without the outside scaffolding',
            direction: 'worse',
        },
    ];

    return {
        id: 'whatif-external-light',
        kind: 'external-light',
        title: 'External-light',
        subtitle: `Skip ${counts.external} external module${counts.external === 1 ? '' : 's'} and do the rest yourself`,
        authoredTradeoffs,
        selector: { skipPolicyKinds: ['external'] },
    };
};

// -----------------------------------------------------------------
// Public entry
// -----------------------------------------------------------------

/**
 * The generators the public entry consults, in the order their
 * output should appear in the What-If tradeoff table. Exposed as
 * a constant (not a function) so tests can assert on its shape
 * without duplicating it.
 */
const GENERATORS: ReadonlyArray<(p: Pathway) => Scenario | null> = [
    fastTrack,
    deepPractice,
    externalLight,
];

/**
 * Produce the full list of scenarios relevant to the given pathway.
 * Order-stable and side-effect-free. Scenarios that would be
 * trivial against the pathway are omitted.
 */
export const generateScenarios = (pathway: Pathway): Scenario[] => {
    const scenarios: Scenario[] = [];

    for (const gen of GENERATORS) {
        const s = gen(pathway);
        if (s) scenarios.push(s);
    }

    return scenarios;
};
