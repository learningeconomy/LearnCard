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

import { buildAdjacency } from '../core/graphOps';
import type { Pathway, Policy, Tradeoff } from '../types';

import { inferSimulationFocus } from './simulator';
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

/**
 * Composite bypass — elide `composite` nodes (and, implicitly, the
 * whole sub-pathway's work). Honest version of "what if I don't lean
 * on this nested track and focus on the main pathway?"
 *
 * Emitted only when at least one uncompleted composite node exists.
 * Composite nodes carry the default 240-minute per-kind effort (they
 * represent an entire sub-pathway), so skipping one typically
 * produces a large time delta — the kind of move that only makes
 * sense when the learner has a specific reason to pull the
 * sub-pathway out of scope.
 *
 * Tradeoffs:
 *   - `difficulty: worse` — the destination's termination becomes
 *     harder to satisfy without the scaffolding a composite
 *     sub-pathway provides.
 *   - `external-dependency: better` — one fewer inter-pathway
 *     dependency to reconcile with (close in spirit to
 *     `external-light`, but specifically for nested pathways).
 */
const compositeBypass = (pathway: Pathway): Scenario | null => {
    const counts = countUncompletedByKind(pathway);
    if (counts.composite === 0) return null;

    const authoredTradeoffs: Tradeoff[] = [
        {
            dimension: 'difficulty',
            deltaDescription:
                'Harder to reach the destination without the nested pathway\u2019s scaffolding',
            direction: 'worse',
        },
        {
            dimension: 'external-dependency',
            deltaDescription: 'One fewer nested pathway to coordinate with',
            direction: 'better',
        },
    ];

    return {
        id: 'whatif-composite-bypass',
        kind: 'composite-bypass',
        title: 'Skip the nested pathway',
        subtitle: `Bypass ${counts.composite} nested sub-pathway${counts.composite === 1 ? '' : 's'} and stay on the main track`,
        authoredTradeoffs,
        selector: { skipPolicyKinds: ['composite'] },
    };
};

// -----------------------------------------------------------------
// Destination-only — shortest-path focus
// -----------------------------------------------------------------

/**
 * BFS from `focusId` forward along prerequisite edges to produce the
 * shortest ordered chain `[focusId, ..., destinationId]`. Returns
 * `null` when the destination isn't reachable from the focus.
 *
 * Private to this module — destination-only is the only generator
 * that needs path-finding, and keeping the helper local avoids
 * growing the What-If public surface for a single caller.
 *
 * Tie-breaking: honors pathway.nodes insertion order across siblings
 * at equal depth, so the chosen path is deterministic across runs.
 */
const shortestPath = (
    pathway: Pathway,
    focusId: string,
    destinationId: string,
): string[] | null => {
    if (focusId === destinationId) return [focusId];

    const { dependents } = buildAdjacency(pathway);

    const nodeOrder = new Map<string, number>();
    pathway.nodes.forEach((n, i) => nodeOrder.set(n.id, i));

    // Stable neighbor ordering so repeated calls pick the same
    // path when multiple paths of equal length exist.
    const stableNeighbors = (id: string): string[] =>
        [...(dependents.get(id) ?? [])].sort(
            (a, b) => (nodeOrder.get(a) ?? 0) - (nodeOrder.get(b) ?? 0),
        );

    const parent = new Map<string, string>();
    const visited = new Set<string>([focusId]);
    const queue: string[] = [focusId];

    while (queue.length > 0) {
        const at = queue.shift()!;

        for (const next of stableNeighbors(at)) {
            if (visited.has(next)) continue;
            visited.add(next);
            parent.set(next, at);

            if (next === destinationId) {
                // Reconstruct in reverse, then flip.
                const path: string[] = [destinationId];
                let cursor = destinationId;
                while (parent.has(cursor)) {
                    cursor = parent.get(cursor)!;
                    path.push(cursor);
                }

                return path.reverse();
            }

            queue.push(next);
        }
    }

    return null;
};

/**
 * Destination-only — skip every non-focus, non-destination node
 * outside the shortest path from focus → destination. Honest version
 * of "what if I just ran straight for the finish line and ignored
 * the side branches?"
 *
 * Only emits when the shortest path leaves at least one other
 * uncompleted ancestor on the table — otherwise the transformation
 * is a no-op (the baseline *is* the shortest path).
 *
 * Tradeoffs:
 *   - `effort: better` — fewer steps, less cognitive spread.
 *   - `difficulty: worse` — siblings often contribute independent
 *     evidence toward an AND-gated destination. Skipping them may
 *     leave the destination's termination half-met.
 */
const destinationOnly = (pathway: Pathway): Scenario | null => {
    const destinationId = pathway.destinationNodeId;
    if (!destinationId) return null;

    const focusId = inferSimulationFocus(pathway);
    if (!focusId) return null;

    const nodeById = new Map(pathway.nodes.map(n => [n.id, n]));
    const path = shortestPath(pathway, focusId, destinationId);
    if (!path) return null;

    // Collect uncompleted ancestors of destination that are not on
    // the chosen path. If none exist the transformation is trivial
    // against the baseline and we emit nothing.
    const onPath = new Set(path);
    const { prereqs } = buildAdjacency(pathway);

    const zone = new Set<string>([destinationId]);
    const frontier = [destinationId];
    while (frontier.length > 0) {
        const at = frontier.shift()!;
        for (const p of prereqs.get(at) ?? []) {
            if (zone.has(p)) continue;
            zone.add(p);
            frontier.push(p);
        }
    }

    const skipIds: string[] = [];
    for (const id of zone) {
        if (onPath.has(id)) continue;

        const node = nodeById.get(id);
        if (!node) continue;
        if (node.progress.status === 'completed') continue;

        skipIds.push(id);
    }

    if (skipIds.length === 0) return null;

    const authoredTradeoffs: Tradeoff[] = [
        {
            dimension: 'effort',
            deltaDescription: 'Fewer parallel tracks to juggle',
            direction: 'better',
        },
        {
            dimension: 'difficulty',
            deltaDescription:
                'Destination may be harder to fully satisfy without the sibling evidence',
            direction: 'worse',
        },
    ];

    return {
        id: 'whatif-destination-only',
        kind: 'destination-only',
        title: 'Straight to the finish',
        subtitle: `Run the shortest path to the destination and set ${skipIds.length} sibling step${skipIds.length === 1 ? '' : 's'} aside`,
        authoredTradeoffs,
        selector: { skipNodeIds: skipIds },
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
 *
 * Order is curated: scenarios that tend to reduce ETA (fast-track,
 * external-light, composite-bypass, destination-only) surface
 * before the scenarios that tend to add ETA (deep-practice). This
 * matches the learner's reading order — "can I get there faster?"
 * is a more common question than "can I get there better?" at the
 * moment they open this surface.
 */
const GENERATORS: ReadonlyArray<(p: Pathway) => Scenario | null> = [
    fastTrack,
    externalLight,
    compositeBypass,
    destinationOnly,
    deepPractice,
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
