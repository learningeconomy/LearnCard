import { beforeEach, describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode, Policy, Termination } from '../types';

import {
    BASELINE_SELECTOR,
    inferSimulationFocus,
    simulate,
    simulateAll,
    simulateBaseline,
    simulateScenario,
} from './simulator';
import type { Scenario } from './types';

// ---------------------------------------------------------------------------
// Fixtures — mirrors the style of map/route.test.ts so the two families
// read as a cohesive test suite.
// ---------------------------------------------------------------------------

const NOW = '2026-04-21T00:00:00.000Z';

let seq = 0;
const id = () => `id-${++seq}`;

beforeEach(() => {
    seq = 0;
});

const practicePolicy = (): Policy => ({
    kind: 'practice',
    cadence: { frequency: 'daily', perPeriod: 1 },
    artifactTypes: ['text'],
});

const reviewPolicy = (): Policy => ({
    kind: 'review',
    fsrs: { stability: 0, difficulty: 0 },
});

const assessmentPolicy = (): Policy => ({
    kind: 'assessment',
    rubric: { criteria: [] },
});

const externalPolicy = (): Policy => ({
    kind: 'external',
    mcp: { serverId: 'srv', toolName: 'tool' },
});

const baseTermination = (): Termination => ({
    kind: 'self-attest',
    prompt: 'Done?',
});

const makeNode = (
    overrides: Partial<PathwayNode> & { id?: string; title?: string } = {},
): PathwayNode => ({
    id: overrides.id ?? id(),
    pathwayId: 'p1',
    title: overrides.title ?? 'Node',
    stage: {
        initiation: [],
        policy: overrides.stage?.policy ?? practicePolicy(),
        termination: overrides.stage?.termination ?? baseTermination(),
    },
    endorsements: [],
    progress: overrides.progress ?? {
        status: 'not-started',
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

const edge = (from: string, to: string): Edge => ({
    id: id(),
    from,
    to,
    type: 'prerequisite',
});

const makePathway = (
    nodes: PathwayNode[],
    edges: Edge[],
    destinationNodeId?: string,
): Pathway => ({
    id: 'p1',
    ownerDid: 'did:example:1',
    title: 'P',
    goal: 'G',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    destinationNodeId,
    createdAt: NOW,
    updatedAt: NOW,
});

// Canonical pathway for most scenarios: practice → review → assessment (dest),
// with an extra external branch feeding into the assessment as a sibling.
//
//    practice ─┐
//              ├─► assessment (dest)
//    review ──┤
//              │
//    external ┘
const makeMixedPathway = (): Pathway => {
    const n1 = makeNode({
        title: 'Practice',
        stage: {
            initiation: [],
            policy: practicePolicy(),
            termination: baseTermination(),
        },
    });

    const n2 = makeNode({
        title: 'Review',
        stage: {
            initiation: [],
            policy: reviewPolicy(),
            termination: baseTermination(),
        },
    });

    const n3 = makeNode({
        title: 'External',
        stage: {
            initiation: [],
            policy: externalPolicy(),
            termination: baseTermination(),
        },
    });

    const n4 = makeNode({
        title: 'Assessment',
        stage: {
            initiation: [],
            policy: assessmentPolicy(),
            termination: baseTermination(),
        },
    });

    return makePathway(
        [n1, n2, n3, n4],
        [edge(n1.id, n4.id), edge(n2.id, n4.id), edge(n3.id, n4.id)],
        n4.id,
    );
};

// ---------------------------------------------------------------------------
// inferSimulationFocus
// ---------------------------------------------------------------------------

describe('inferSimulationFocus', () => {
    it('returns null on a pathway with no nodes', () => {
        const pathway = makePathway([], []);

        expect(inferSimulationFocus(pathway)).toBeNull();
    });

    it('prefers the first in-progress node', () => {
        const a = makeNode({
            progress: {
                status: 'not-started',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
        });

        const b = makeNode({
            progress: {
                status: 'in-progress',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
        });

        const c = makeNode({
            progress: {
                status: 'in-progress',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
        });

        const pathway = makePathway([a, b, c], []);

        expect(inferSimulationFocus(pathway)).toBe(b.id);
    });

    it('falls back to the first not-started node when nothing is in-progress', () => {
        const a = makeNode({
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
        });

        const b = makeNode();

        const pathway = makePathway([a, b], []);

        expect(inferSimulationFocus(pathway)).toBe(b.id);
    });

    it('falls back to the first node at all when all are completed', () => {
        const completedProgress = {
            status: 'completed' as const,
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        };

        const a = makeNode({ progress: completedProgress });
        const b = makeNode({ progress: completedProgress });

        const pathway = makePathway([a, b], []);

        expect(inferSimulationFocus(pathway)).toBe(a.id);
    });
});

// ---------------------------------------------------------------------------
// simulate — baseline + selectors
// ---------------------------------------------------------------------------

describe('simulate (core)', () => {
    it('returns an unroutable summary when the pathway has no destination', () => {
        const n1 = makeNode();
        const pathway = makePathway([n1], []);

        const result = simulate(pathway, n1.id, BASELINE_SELECTOR);

        expect(result).toEqual({
            remainingSteps: null,
            etaMinutes: null,
            skippedNodeIds: [],
        });
    });

    it('returns an unroutable summary when focus is null or unknown', () => {
        const pathway = makeMixedPathway();

        expect(simulate(pathway, null, BASELINE_SELECTOR).etaMinutes).toBeNull();
        expect(
            simulate(pathway, 'nope', BASELINE_SELECTOR).etaMinutes,
        ).toBeNull();
    });

    it('aggregates baseline effort across all uncompleted ancestors', () => {
        const pathway = makeMixedPathway();
        const focus = pathway.nodes[0]!.id;

        const baseline = simulate(pathway, focus, BASELINE_SELECTOR);

        // practice 30 + review 15 + external 30 + assessment 60 = 135
        expect(baseline.etaMinutes).toBe(135);
        expect(baseline.remainingSteps).toBe(4);
        expect(baseline.skippedNodeIds).toEqual([]);
    });

    it('elides completed nodes from baseline totals', () => {
        const pathway = makeMixedPathway();
        const first = pathway.nodes[0]!;

        const updated: Pathway = {
            ...pathway,
            nodes: pathway.nodes.map(n =>
                n.id === first.id
                    ? {
                          ...n,
                          progress: {
                              ...n.progress,
                              status: 'completed' as const,
                          },
                      }
                    : n,
            ),
        };

        const baseline = simulate(
            updated,
            updated.nodes[1]!.id,
            BASELINE_SELECTOR,
        );

        // Without the 30-minute practice node: 15 + 30 + 60 = 105
        expect(baseline.etaMinutes).toBe(105);
        expect(baseline.remainingSteps).toBe(3);
    });

    it('skips nodes whose policy kind appears in skipPolicyKinds', () => {
        const pathway = makeMixedPathway();
        const focus = pathway.nodes[0]!.id;

        const result = simulate(pathway, focus, {
            skipPolicyKinds: ['review'],
        });

        // review (15) dropped: 30 + 30 + 60 = 120
        expect(result.etaMinutes).toBe(120);
        expect(result.remainingSteps).toBe(3);
        expect(result.skippedNodeIds).toHaveLength(1);
    });

    it('scales effort by effortMultiplierByKind', () => {
        const pathway = makeMixedPathway();
        const focus = pathway.nodes[0]!.id;

        const result = simulate(pathway, focus, {
            effortMultiplierByKind: { practice: 2 },
        });

        // practice 30 * 2 + review 15 + external 30 + assessment 60 = 165
        expect(result.etaMinutes).toBe(165);
        expect(result.remainingSteps).toBe(4);
    });

    it('honors both skip and multiplier in the same selector', () => {
        const pathway = makeMixedPathway();
        const focus = pathway.nodes[0]!.id;

        const result = simulate(pathway, focus, {
            skipPolicyKinds: ['external'],
            effortMultiplierByKind: { practice: 2 },
        });

        // external (30) dropped, practice doubled: 60 + 15 + 60 = 135
        expect(result.etaMinutes).toBe(135);
        expect(result.remainingSteps).toBe(3);
    });

    it('is pure — simulating does not mutate the pathway', () => {
        const pathway = makeMixedPathway();
        const before = JSON.stringify(pathway);

        simulate(pathway, pathway.nodes[0]!.id, {
            skipPolicyKinds: ['review', 'external'],
            effortMultiplierByKind: { practice: 2, assessment: 3 },
        });

        expect(JSON.stringify(pathway)).toBe(before);
    });

    it('produces byte-identical output across runs with the same input', () => {
        const pathway = makeMixedPathway();
        const selector = {
            skipPolicyKinds: ['review' as const, 'external' as const],
        };

        const a = simulate(pathway, pathway.nodes[0]!.id, selector);
        const b = simulate(pathway, pathway.nodes[0]!.id, selector);

        expect(a).toEqual(b);
    });
});

// ---------------------------------------------------------------------------
// simulateScenario — deltas + tradeoffs
// ---------------------------------------------------------------------------

const fastTrackScenario: Scenario = {
    id: 's-fast',
    kind: 'fast-track',
    title: 'Fast track',
    subtitle: 'Skip reviews',
    authoredTradeoffs: [
        {
            dimension: 'difficulty',
            deltaDescription: 'Weaker retention',
            direction: 'worse',
        },
    ],
    selector: { skipPolicyKinds: ['review'] },
};

describe('simulateScenario', () => {
    it('computes eta and step deltas vs baseline', () => {
        const pathway = makeMixedPathway();

        const result = simulateScenario(pathway, fastTrackScenario);

        expect(result.baseline.etaMinutes).toBe(135);
        expect(result.simulation.etaMinutes).toBe(120);
        expect(result.deltas.etaMinutes).toBe(-15);
        expect(result.deltas.steps).toBe(-1);
    });

    it('appends a time tradeoff derived from a significant eta delta', () => {
        const pathway = makeMixedPathway();

        const result = simulateScenario(pathway, fastTrackScenario);

        const time = result.tradeoffs.find(t => t.dimension === 'time');

        expect(time).toBeDefined();
        expect(time!.direction).toBe('better');
        expect(time!.deltaDescription).toMatch(/less/i);
    });

    it('omits the time tradeoff when the delta is below the noise floor', () => {
        const pathway = makeMixedPathway();

        // A scenario that changes nothing should produce no time tradeoff.
        const identity: Scenario = {
            ...fastTrackScenario,
            selector: {},
        };

        const result = simulateScenario(pathway, identity);

        expect(result.deltas.etaMinutes).toBe(0);
        expect(result.tradeoffs.find(t => t.dimension === 'time')).toBeUndefined();
    });

    it('preserves authored tradeoffs verbatim', () => {
        const pathway = makeMixedPathway();

        const result = simulateScenario(pathway, fastTrackScenario);

        const difficulty = result.tradeoffs.find(
            t => t.dimension === 'difficulty',
        );

        expect(difficulty).toEqual({
            dimension: 'difficulty',
            deltaDescription: 'Weaker retention',
            direction: 'worse',
        });
    });

    it('degrades gracefully on an unroutable pathway', () => {
        const n1 = makeNode();
        const pathway = makePathway([n1], []); // no destination

        const result = simulateScenario(pathway, fastTrackScenario);

        expect(result.baseline.etaMinutes).toBeNull();
        expect(result.simulation.etaMinutes).toBeNull();
        expect(result.deltas.etaMinutes).toBeNull();
        expect(result.deltas.steps).toBeNull();
        // Authored tradeoffs still show up.
        expect(
            result.tradeoffs.find(t => t.dimension === 'difficulty'),
        ).toBeDefined();
        // Time tradeoff is not fabricated when no delta exists.
        expect(
            result.tradeoffs.find(t => t.dimension === 'time'),
        ).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// simulateAll + simulateBaseline
// ---------------------------------------------------------------------------

describe('simulateAll', () => {
    it('preserves scenario input order', () => {
        const pathway = makeMixedPathway();

        const a: Scenario = {
            ...fastTrackScenario,
            id: 'a',
            title: 'A',
        };
        const b: Scenario = {
            ...fastTrackScenario,
            id: 'b',
            title: 'B',
        };
        const c: Scenario = {
            ...fastTrackScenario,
            id: 'c',
            title: 'C',
        };

        const results = simulateAll(pathway, [a, b, c]);

        expect(results.map(r => r.scenario.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('simulateBaseline', () => {
    it('matches the scenario result baseline for the same pathway', () => {
        const pathway = makeMixedPathway();

        const baselineOnly = simulateBaseline(pathway);
        const scenarioResult = simulateScenario(pathway, fastTrackScenario);

        expect(baselineOnly).toEqual(scenarioResult.baseline);
    });

    it('returns null metrics when the pathway has no destination', () => {
        const pathway = makePathway([makeNode()], []);

        const baseline = simulateBaseline(pathway);

        expect(baseline.etaMinutes).toBeNull();
        expect(baseline.remainingSteps).toBeNull();
    });
});
