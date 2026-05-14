import { beforeEach, describe, expect, it } from 'vitest';

import type {
    Edge,
    NodeRef,
    Pathway,
    PathwayNode,
    Policy,
    RankingContext,
    Termination,
} from '../types';

import { selectNextAction } from './selectNextAction';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-04-22T00:00:00.000Z';

let seq = 0;
const id = () => {
    seq += 1;
    return `00000000-0000-4000-8000-${seq.toString(16).padStart(12, '0')}`;
};

beforeEach(() => {
    seq = 0;
});

const practicePolicy = (): Policy => ({
    kind: 'practice',
    cadence: { frequency: 'daily', perPeriod: 1 },
    artifactTypes: ['text'],
});

const assessmentPolicy = (): Policy => ({
    kind: 'assessment',
    rubric: { criteria: [] },
});

const baseTermination = (): Termination => ({
    kind: 'self-attest',
    prompt: 'Done?',
});

const makeNode = (
    overrides: Partial<PathwayNode> & { id?: string; title?: string } = {},
): PathwayNode => ({
    id: overrides.id ?? id(),
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
    id: id(),
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
    ownerDid: 'did:example:learner',
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

const emptyContext = (): RankingContext => ({
    now: NOW,
    fsrsDue: [],
    stalls: [],
    streakState: null,
    recentEndorsements: [],
    agentSignals: null,
});

const toRefs = (pathway: Pathway): NodeRef[] =>
    pathway.nodes.map(n => ({ pathwayId: pathway.id, nodeId: n.id }));

// ---------------------------------------------------------------------------
// selectNextAction
// ---------------------------------------------------------------------------

describe('selectNextAction', () => {
    it('prefers the first uncompleted chosenRoute step when present', () => {
        // Linear pathway a → b → dest, with chosenRoute [a, b, dest].
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const dest = makeNode({
            title: 'Dest',
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [a, b, dest],
            [edge(a.id, b.id), edge(b.id, dest.id)],
            dest.id,
            [a.id, b.id, dest.id],
        );

        const pick = selectNextAction({
            pathway,
            candidates: toRefs(pathway),
            context: emptyContext(),
        });

        expect(pick).not.toBeNull();
        expect(pick!.source).toBe('route');
        expect(pick!.scored.node.nodeId).toBe(a.id);
        expect(pick!.routeStep).toEqual({ position: 1, total: 3 });
        expect(pick!.scored.reasons).toEqual(['Step 1 of 3 on your route']);
    });

    it('falls back to ranking when chosenRoute is absent', () => {
        const a = makeNode({ title: 'A' });
        const pathway = makePathway([a], []);

        const pick = selectNextAction({
            pathway,
            candidates: toRefs(pathway),
            context: emptyContext(),
        });

        expect(pick).not.toBeNull();
        expect(pick!.source).toBe('ranking');
        expect(pick!.scored.node.nodeId).toBe(a.id);
        expect(pick!.routeStep).toBeUndefined();
    });

    it('falls back to ranking when every chosenRoute step is completed', () => {
        // All nodes completed; no route-picked step is available.
        const a = makeNode({
            title: 'A',
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
        });
        const b = makeNode({
            title: 'B',
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
        });

        const pathway = makePathway(
            [a, b],
            [edge(a.id, b.id)],
            b.id,
            [a.id, b.id],
        );

        const pick = selectNextAction({
            pathway,
            // Ranking's candidate pool is typically `availableNodes` which
            // excludes completed nodes; with no uncompleted candidates
            // ranking returns null → the whole selector returns null.
            candidates: [],
            context: emptyContext(),
        });

        expect(pick).toBeNull();
    });

    it('classifies an off-route prereq of a blocked route step as a detour', () => {
        // a (off-route, uncompleted) → b (on-route). Route = [b];
        // b is blocked because its prereq a isn't complete.
        // Ranking picks a as the unblocker. selectNextAction should
        // surface this as source='detour' with the blocked route
        // step named, not as a plain ranking pick.
        const a = makeNode({ title: 'Off-route' });
        const b = makeNode({ title: 'B (blocked)' });

        const pathway = makePathway(
            [a, b],
            [edge(a.id, b.id)],
            b.id,
            [b.id],
        );

        const pick = selectNextAction({
            pathway,
            candidates: [{ pathwayId: pathway.id, nodeId: a.id }],
            context: emptyContext(),
        });

        expect(pick).not.toBeNull();
        expect(pick!.source).toBe('detour');
        expect(pick!.scored.node.nodeId).toBe(a.id);
        expect(pick!.detour).toEqual({
            unblocksNodeId: b.id,
            unblocksRoutePosition: 1,
            unblocksTotal: 1,
        });
    });

    it('detects detours via transitive prereqs (grandparent chain)', () => {
        // Chain a → b → c, with route = [c]. Both a and b are
        // off-route and uncompleted; c is blocked transitively.
        // Ranking picks a (the root of the blocking chain); it's
        // a detour for c even though a is c's grandparent, not its
        // immediate prereq.
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({ title: 'C (blocked)' });

        const pathway = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
            [c.id],
        );

        const pick = selectNextAction({
            pathway,
            candidates: [{ pathwayId: pathway.id, nodeId: a.id }],
            context: emptyContext(),
        });

        expect(pick!.source).toBe('detour');
        expect(pick!.detour?.unblocksNodeId).toBe(c.id);
    });

    it('names the EARLIEST blocked route step the detour unblocks', () => {
        // a (off-route) is a prereq of BOTH b and c (both on-route).
        // Route = [b, c]. Both are blocked. The pick (a) unblocks
        // both — we should name b (the earlier one) because that's
        // the step the learner returns to first.
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({ title: 'C' });

        const pathway = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(a.id, c.id), edge(b.id, c.id)],
            c.id,
            [b.id, c.id],
        );

        const pick = selectNextAction({
            pathway,
            candidates: [{ pathwayId: pathway.id, nodeId: a.id }],
            context: emptyContext(),
        });

        expect(pick!.source).toBe('detour');
        expect(pick!.detour?.unblocksNodeId).toBe(b.id);
        expect(pick!.detour?.unblocksRoutePosition).toBe(1);
        expect(pick!.detour?.unblocksTotal).toBe(2);
    });

    it('classifies as ranking (not detour) when the pick is unrelated to any route step', () => {
        // a (off-route) is the ranking pick but unconnected to the
        // route. Route = [b, c]. b and c are both blocked by some
        // OTHER off-route prereq (not shown). Since a doesn't
        // unblock b or c, the pick is plain ranking.
        const a = makeNode({ title: 'Unrelated off-route' });
        const prereqOfB = makeNode({ title: 'Actual blocker' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({ title: 'C' });

        const pathway = makePathway(
            [a, prereqOfB, b, c],
            [edge(prereqOfB.id, b.id), edge(b.id, c.id)],
            c.id,
            [b.id, c.id],
        );

        const pick = selectNextAction({
            pathway,
            candidates: [{ pathwayId: pathway.id, nodeId: a.id }],
            context: emptyContext(),
        });

        // `a` doesn't unblock b or c — plain ranking pick.
        expect(pick!.source).toBe('ranking');
        expect(pick!.detour).toBeUndefined();
    });

    it('returns null when both chosenRoute and ranking produce nothing', () => {
        const a = makeNode();
        const pathway = makePathway([a], [], undefined, []);

        const pick = selectNextAction({
            pathway,
            candidates: [],
            context: emptyContext(),
        });

        expect(pick).toBeNull();
    });

    it('synthesizes a ScoredCandidate for route picks so the card renders uniformly', () => {
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

        const pick = selectNextAction({
            pathway,
            candidates: toRefs(pathway),
            context: emptyContext(),
        });

        // The ScoredCandidate shape downstream code consumes is intact:
        // node ref, numeric score, reason strings. The route source is
        // surfaced via the discriminant, not by changing the card's
        // data contract.
        expect(pick!.scored.node.pathwayId).toBe(pathway.id);
        expect(pick!.scored.node.nodeId).toBe(a.id);
        expect(typeof pick!.scored.score).toBe('number');
        expect(Array.isArray(pick!.scored.reasons)).toBe(true);
        expect(pick!.scored.reasons.length).toBeGreaterThan(0);
    });
});
