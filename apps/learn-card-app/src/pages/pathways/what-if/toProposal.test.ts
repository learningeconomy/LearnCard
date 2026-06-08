import { beforeEach, describe, expect, it } from 'vitest';

import { applyProposal } from '../proposals/applyProposal';
import type {
    Edge,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../types';

import {
    buildProposalFromScenario,
    buildScenarioDiff,
    classifyScenarioForProposal,
    computeTargetRoute,
    resolveSkipIds,
} from './toProposal';
import type { Scenario } from './types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-04-21T00:00:00.000Z';
const OWNER = 'did:example:learner';

let seq = 0;
const id = () => `id-${++seq}`;

beforeEach(() => {
    seq = 0;
});

// Deterministic id factory for the scenario-to-proposal conversion,
// keeping this test isolated from real UUID generation.
const makeIds = () => {
    let n = 0;
    return () => {
        n += 1;
        return `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
    };
};

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
    id: overrides.id ?? `00000000-0000-4000-8000-${id().padStart(12, '0')}`,
    pathwayId: '00000000-0000-4000-8000-00000000aaaa',
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
    id: `00000000-0000-4000-8000-${id().padStart(12, '0')}`,
    from,
    to,
    type: 'prerequisite',
});

const makePathway = (
    nodes: PathwayNode[],
    edges: Edge[],
    destinationNodeId?: string,
    chosenRoute?: string[],
): Pathway => ({
    id: '00000000-0000-4000-8000-00000000aaaa',
    ownerDid: OWNER,
    revision: 0,
    schemaVersion: 1,
    title: 'P',
    goal: 'G',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    destinationNodeId,
    chosenRoute,
    createdAt: NOW,
    updatedAt: NOW,
});

const fastTrackScenario = (): Scenario => ({
    id: 'whatif-fast-track',
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
});

const deepPracticeScenario = (): Scenario => ({
    id: 'whatif-deep-practice',
    kind: 'deep-practice',
    title: 'Deep practice',
    subtitle: 'Double practice',
    authoredTradeoffs: [],
    selector: { effortMultiplierByKind: { practice: 2 } },
});

// ---------------------------------------------------------------------------
// classifyScenarioForProposal
// ---------------------------------------------------------------------------

describe('classifyScenarioForProposal', () => {
    it('classifies an effort-multiplier scenario as unsupported', () => {
        const pathway = makePathway([makeNode()], []);

        expect(
            classifyScenarioForProposal(pathway, deepPracticeScenario()).kind,
        ).toBe('multiplier-unsupported');
    });

    it('classifies an empty selector as empty-scenario', () => {
        const pathway = makePathway([makeNode()], []);
        const empty: Scenario = {
            ...fastTrackScenario(),
            selector: {},
        };

        expect(classifyScenarioForProposal(pathway, empty).kind).toBe(
            'empty-scenario',
        );
    });

    it('classifies a pure-skip scenario with no matching nodes on the route as no-effect', () => {
        // Fast-track skips reviews; this pathway has none on its route.
        const a = makeNode();
        const b = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });
        const pathway = makePathway(
            [a, b],
            [edge(a.id, b.id)],
            b.id,
            [a.id, b.id],
        );

        expect(
            classifyScenarioForProposal(pathway, fastTrackScenario()).kind,
        ).toBe('no-effect');
    });

    it('classifies a pure-skip scenario with matching route nodes as ok', () => {
        // practice → review → assessment, chosenRoute covers all three.
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const a = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [p, r, a],
            [edge(p.id, r.id), edge(r.id, a.id)],
            a.id,
            [p.id, r.id, a.id],
        );

        expect(
            classifyScenarioForProposal(pathway, fastTrackScenario()).kind,
        ).toBe('ok');
    });

    it('classifies a mixed multiplier + skip scenario as unsupported', () => {
        const pathway = makePathway([makeNode()], []);
        const mixed: Scenario = {
            ...fastTrackScenario(),
            selector: {
                skipPolicyKinds: ['review'],
                effortMultiplierByKind: { practice: 2 },
            },
        };

        expect(classifyScenarioForProposal(pathway, mixed).kind).toBe(
            'multiplier-unsupported',
        );
    });
});

// ---------------------------------------------------------------------------
// resolveSkipIds
// ---------------------------------------------------------------------------

describe('resolveSkipIds', () => {
    it('resolves skipPolicyKinds against uncompleted nodes', () => {
        const r1 = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const r2 = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const p = makeNode();

        const pathway = makePathway([r1, r2, p], []);

        const ids = resolveSkipIds(pathway, fastTrackScenario());

        expect(ids.size).toBe(2);
        expect(ids.has(r1.id)).toBe(true);
        expect(ids.has(r2.id)).toBe(true);
    });

    it('never skips completed nodes', () => {
        const r = makeNode({
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([r], []);

        expect(resolveSkipIds(pathway, fastTrackScenario()).size).toBe(0);
    });

    it('unions skipPolicyKinds and skipNodeIds', () => {
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const ext = makeNode({
            stage: {
                initiation: [],
                policy: externalPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([r, ext], []);

        const scenario: Scenario = {
            ...fastTrackScenario(),
            selector: {
                skipPolicyKinds: ['review'],
                skipNodeIds: [ext.id],
            },
        };

        const ids = resolveSkipIds(pathway, scenario);

        expect(ids.size).toBe(2);
        expect(ids.has(r.id)).toBe(true);
        expect(ids.has(ext.id)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// buildScenarioDiff
// ---------------------------------------------------------------------------

describe('computeTargetRoute', () => {
    it('returns null when the pathway has no baseline route and no destination', () => {
        // No chosenRoute; no destination either, so seedChosenRoute
        // returns nothing. Nothing to swap to.
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const pathway = makePathway([r], []);

        expect(computeTargetRoute(pathway, fastTrackScenario())).toBeNull();
    });

    it('filters the pathway chosenRoute against skipIds, preserving order', () => {
        // practice → review → assessment; route covers all three; fast-track
        // drops review.
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const a = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [p, r, a],
            [edge(p.id, r.id), edge(r.id, a.id)],
            a.id,
            [p.id, r.id, a.id],
        );

        expect(computeTargetRoute(pathway, fastTrackScenario())).toEqual([
            p.id,
            a.id,
        ]);
    });

    it('derives a baseline via seedChosenRoute when chosenRoute is absent', () => {
        // No explicit chosenRoute, but a destination is set so seedChosenRoute
        // produces an entry→dest route. Fast-track then drops the review.
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const a = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [p, r, a],
            [edge(p.id, r.id), edge(r.id, a.id)],
            a.id,
        );

        const target = computeTargetRoute(pathway, fastTrackScenario());

        expect(target).not.toBeNull();
        expect(target!.includes(r.id)).toBe(false);
        expect(target![target!.length - 1]).toBe(a.id);
    });

    it('returns null when skipIds do not overlap the route', () => {
        // Review exists in the pathway but is NOT on the chosenRoute —
        // the scenario therefore has no route-level effect.
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const a = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        // Route skips the review.
        const pathway = makePathway(
            [p, r, a],
            [edge(p.id, r.id), edge(r.id, a.id), edge(p.id, a.id)],
            a.id,
            [p.id, a.id],
        );

        expect(computeTargetRoute(pathway, fastTrackScenario())).toBeNull();
    });

    it('returns null when the target would be fewer than two nodes', () => {
        // Route is [p, r]; skipping r leaves only [p] — not a walk.
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [p, r],
            [edge(p.id, r.id)],
            r.id,
            [p.id, r.id],
        );

        expect(computeTargetRoute(pathway, fastTrackScenario())).toBeNull();
    });
});

describe('buildScenarioDiff', () => {
    it('returns null for unsupported scenarios', () => {
        const pathway = makePathway([makeNode()], []);

        expect(
            buildScenarioDiff(pathway, deepPracticeScenario(), makeIds()),
        ).toBeNull();
    });

    it('returns null when no route nodes match the skip filter', () => {
        const a = makeNode();
        const b = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });
        const pathway = makePathway(
            [a, b],
            [edge(a.id, b.id)],
            b.id,
            [a.id, b.id],
        );

        expect(
            buildScenarioDiff(pathway, fastTrackScenario(), makeIds()),
        ).toBeNull();
    });

    it('emits a non-structural diff that only sets chosenRoute', () => {
        // practice → review → assessment (dest), route covers all three.
        // A fast-track acceptance should leave the graph intact and only
        // swap the route.
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const a = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [p, r, a],
            [edge(p.id, r.id), edge(r.id, a.id)],
            a.id,
            [p.id, r.id, a.id],
        );

        const diff = buildScenarioDiff(
            pathway,
            fastTrackScenario(),
            makeIds(),
        )!;

        expect(diff).not.toBeNull();
        // Non-structural: nothing added, nothing removed.
        expect(diff.addNodes).toEqual([]);
        expect(diff.updateNodes).toEqual([]);
        expect(diff.removeNodeIds).toEqual([]);
        expect(diff.addEdges).toEqual([]);
        expect(diff.removeEdgeIds).toEqual([]);
        // The entire change is the route swap.
        expect(diff.setChosenRoute).toEqual([p.id, a.id]);
    });

    it('produces a diff applyProposal consumes into a route swap with intact graph', () => {
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const a = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [p, r, a],
            [edge(p.id, r.id), edge(r.id, a.id)],
            a.id,
            [p.id, r.id, a.id],
        );

        const proposal = buildProposalFromScenario(
            pathway,
            fastTrackScenario(),
            [],
            { ownerDid: OWNER, now: NOW, makeId: makeIds() },
        )!;

        const next = applyProposal(pathway, proposal, NOW);

        // Graph intact — review still a real node, edges untouched.
        expect(next.nodes).toHaveLength(3);
        expect(next.nodes.map(n => n.id).includes(r.id)).toBe(true);
        expect(next.edges).toHaveLength(2);
        // Route swapped — review dropped from the committed walk.
        expect(next.chosenRoute).toEqual([p.id, a.id]);
    });
});

// ---------------------------------------------------------------------------
// buildProposalFromScenario
// ---------------------------------------------------------------------------

describe('buildProposalFromScenario', () => {
    const pathwayWithReview = () => {
        const p = makeNode();
        const r = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const a = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        // Route covers all three nodes so a fast-track scenario
        // (skip reviews) has something to swap.
        return makePathway(
            [p, r, a],
            [edge(p.id, r.id), edge(r.id, a.id)],
            a.id,
            [p.id, r.id, a.id],
        );
    };

    it('returns null for unsupported scenarios', () => {
        const pathway = pathwayWithReview();

        expect(
            buildProposalFromScenario(pathway, deepPracticeScenario(), [], {
                ownerDid: OWNER,
                now: NOW,
                makeId: makeIds(),
            }),
        ).toBeNull();
    });

    it('attributes the proposal to the router agent / routing capability', () => {
        const pathway = pathwayWithReview();

        const proposal = buildProposalFromScenario(
            pathway,
            fastTrackScenario(),
            [],
            { ownerDid: OWNER, now: NOW, makeId: makeIds() },
        )!;

        expect(proposal.agent).toBe('router');
        expect(proposal.capability).toBe('routing');
        expect(proposal.status).toBe('open');
        expect(proposal.pathwayId).toBe(pathway.id);
    });

    it('sets an expiry honoring the ttlDays option', () => {
        const pathway = pathwayWithReview();

        const proposal = buildProposalFromScenario(
            pathway,
            fastTrackScenario(),
            [],
            {
                ownerDid: OWNER,
                now: NOW,
                ttlDays: 3,
                makeId: makeIds(),
            },
        )!;

        const expected = new Date(
            new Date(NOW).getTime() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString();

        expect(proposal.expiresAt).toBe(expected);
    });

    it('carries the scenario authored tradeoffs on the proposal', () => {
        const pathway = pathwayWithReview();

        const proposal = buildProposalFromScenario(
            pathway,
            fastTrackScenario(),
            [],
            { ownerDid: OWNER, now: NOW, makeId: makeIds() },
        )!;

        const difficulty = proposal.tradeoffs?.find(
            t => t.dimension === 'difficulty',
        );

        expect(difficulty).toBeDefined();
        expect(difficulty!.direction).toBe('worse');
    });

    it('prefers caller-passed tradeoffs over authored ones on the same dimension', () => {
        const pathway = pathwayWithReview();

        const proposal = buildProposalFromScenario(
            pathway,
            fastTrackScenario(),
            [
                {
                    dimension: 'difficulty',
                    deltaDescription: 'Live-measured: retention drop is real',
                    direction: 'worse',
                },
                {
                    dimension: 'time',
                    deltaDescription: '15 min less',
                    direction: 'better',
                },
            ],
            { ownerDid: OWNER, now: NOW, makeId: makeIds() },
        )!;

        const difficulty = proposal.tradeoffs?.find(
            t => t.dimension === 'difficulty',
        );

        expect(difficulty?.deltaDescription).toBe(
            'Live-measured: retention drop is real',
        );

        expect(
            proposal.tradeoffs?.some(t => t.dimension === 'time'),
        ).toBe(true);
    });

    it('produces a deterministic proposal id under an injected makeId', () => {
        const pathway = pathwayWithReview();

        const a = buildProposalFromScenario(
            pathway,
            fastTrackScenario(),
            [],
            { ownerDid: OWNER, now: NOW, makeId: makeIds() },
        );
        const b = buildProposalFromScenario(
            pathway,
            fastTrackScenario(),
            [],
            { ownerDid: OWNER, now: NOW, makeId: makeIds() },
        );

        expect(a!.id).toBe(b!.id);
    });
});
