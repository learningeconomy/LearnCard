import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode, Policy, Termination } from '../types';

import {
    buildRouteIndex,
    computeSuggestedRoute,
    formatEta,
    nodeEffortMinutes,
} from './route';

// ---------------------------------------------------------------------------
// Fixtures — same shape/idiom as collectionDetection.test.ts so the two
// suites read as a family.
// ---------------------------------------------------------------------------

const NOW = '2026-04-21T00:00:00.000Z';

let seq = 0;
const id = () => `id-${++seq}`;
const resetIds = () => {
    seq = 0;
};

const basePolicy = (): Policy => ({
    kind: 'practice',
    cadence: { frequency: 'daily', perPeriod: 1 },
    artifactTypes: ['text'],
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
        policy: overrides.stage?.policy ?? basePolicy(),
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

// ---------------------------------------------------------------------------
// nodeEffortMinutes
// ---------------------------------------------------------------------------

describe('nodeEffortMinutes', () => {
    it('returns the default for each policy kind', () => {
        const practice = makeNode();
        expect(nodeEffortMinutes(practice)).toBe(30);

        const review = makeNode({
            stage: {
                initiation: [],
                policy: { kind: 'review', fsrs: { stability: 0, difficulty: 0 } },
                termination: baseTermination(),
            },
        });
        expect(nodeEffortMinutes(review)).toBe(15);

        const assessment = makeNode({
            stage: {
                initiation: [],
                policy: { kind: 'assessment', rubric: { criteria: [] } },
                termination: baseTermination(),
            },
        });
        expect(nodeEffortMinutes(assessment)).toBe(60);
    });

    it('honors an authored `estimatedMinutes` override on the policy', () => {
        const customPolicy = {
            kind: 'practice',
            cadence: { frequency: 'daily', perPeriod: 1 },
            artifactTypes: ['text'],
            estimatedMinutes: 90,
        } as Policy & { estimatedMinutes: number };

        const node = makeNode({
            stage: {
                initiation: [],
                policy: customPolicy,
                termination: baseTermination(),
            },
        });

        expect(nodeEffortMinutes(node)).toBe(90);
    });
});

// ---------------------------------------------------------------------------
// formatEta
// ---------------------------------------------------------------------------

describe('formatEta', () => {
    it('returns "Done" when no effort remains', () => {
        expect(formatEta(0)).toBe('Done');
        expect(formatEta(-5)).toBe('Done');
    });

    it('uses minutes when under an hour', () => {
        expect(formatEta(30)).toBe('~30m');
        expect(formatEta(59)).toBe('~59m');
    });

    it('uses hours when under a study-day of effort', () => {
        expect(formatEta(60)).toBe('~1h');
        expect(formatEta(180)).toBe('~3h');
        expect(formatEta(239)).toBe('~4h');
    });

    it('uses weeks at 5 hrs/week beyond a study-day', () => {
        // 5 hrs = 300 min = 1 week of study.
        expect(formatEta(300)).toBe('~1 week');
        // 20 hrs = ~4 weeks at 5 hrs/week.
        expect(formatEta(20 * 60)).toBe('~4 weeks');
    });
});

// ---------------------------------------------------------------------------
// computeSuggestedRoute
// ---------------------------------------------------------------------------

describe('computeSuggestedRoute', () => {
    it('returns null when the pathway has no destination', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const p = makePathway([a, b], [edge(a.id, b.id)], undefined);

        expect(computeSuggestedRoute(p, a.id)).toBeNull();
    });

    it('returns null when the focus id is unknown', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const p = makePathway([a, b], [edge(a.id, b.id)], b.id);

        expect(computeSuggestedRoute(p, 'nope')).toBeNull();
    });

    it('handles the trivial focus=destination case', () => {
        resetIds();
        const dest = makeNode();
        const p = makePathway([dest], [], dest.id);

        const route = computeSuggestedRoute(p, dest.id)!;

        expect(route.nodeIds).toEqual([dest.id]);
        expect(route.edgeIds).toEqual([]);
        expect(route.remainingSteps).toBe(1);
        expect(route.etaMinutes).toBeGreaterThan(0);
    });

    it('walks a linear chain from focus to destination', () => {
        resetIds();
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({ title: 'C' });

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;

        expect(route.nodeIds).toEqual([a.id, b.id, c.id]);
        expect(route.edgeIds).toHaveLength(2);
        expect(route.remainingSteps).toBe(3);
        // 3 practice nodes × 30 min default = 90 min.
        expect(route.etaMinutes).toBe(90);
    });

    it('picks a shortest path when multiple routes to the destination exist', () => {
        resetIds();
        const a = makeNode({ title: 'A' });
        const direct = makeNode({ title: 'direct' });
        const longer1 = makeNode({ title: 'longer1' });
        const longer2 = makeNode({ title: 'longer2' });
        const dest = makeNode({ title: 'dest' });

        // Two paths from A to dest:
        //   A → direct → dest                 (length 3)
        //   A → longer1 → longer2 → dest      (length 4)
        const p = makePathway(
            [a, direct, longer1, longer2, dest],
            [
                edge(a.id, direct.id),
                edge(direct.id, dest.id),
                edge(a.id, longer1.id),
                edge(longer1.id, longer2.id),
                edge(longer2.id, dest.id),
            ],
            dest.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;

        expect(route.nodeIds).toEqual([a.id, direct.id, dest.id]);
    });

    it('excludes completed nodes from the remaining count and ETA', () => {
        resetIds();
        const a = makeNode({
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
                completedAt: NOW,
            },
        });
        const b = makeNode();
        const c = makeNode();

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;

        expect(route.remainingSteps).toBe(2);
        // a is done; b + c = 60 min.
        expect(route.etaMinutes).toBe(60);
    });

    it('returns null when the destination is unreachable from the focus', () => {
        resetIds();
        const focus = makeNode();
        const other = makeNode();
        const dest = makeNode();

        // focus and other are siblings; only `other → dest`.
        const p = makePathway([focus, other, dest], [edge(other.id, dest.id)], dest.id);

        expect(computeSuggestedRoute(p, focus.id)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// buildRouteIndex
// ---------------------------------------------------------------------------

describe('buildRouteIndex', () => {
    it('indexes node positions and route edges', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const c = makeNode();

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;
        const idx = buildRouteIndex(route, p);

        expect(idx.nodeIndex.get(a.id)).toBe(0);
        expect(idx.nodeIndex.get(b.id)).toBe(1);
        expect(idx.nodeIndex.get(c.id)).toBe(2);
        expect(idx.edgeOnRoute.size).toBe(2);
    });

    it('sets yourIndex to the first uncompleted node', () => {
        resetIds();
        const a = makeNode({
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
                completedAt: NOW,
            },
        });
        const b = makeNode();
        const c = makeNode();

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;
        const idx = buildRouteIndex(route, p);

        expect(idx.yourIndex).toBe(1); // `a` done, `b` is where you are
    });

    it('sets yourIndex to null when every route node is complete', () => {
        resetIds();
        const completedProgress = {
            status: 'completed' as const,
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            completedAt: NOW,
        };
        const a = makeNode({ progress: completedProgress });
        const b = makeNode({ progress: completedProgress });

        const p = makePathway([a, b], [edge(a.id, b.id)], b.id);

        const route = computeSuggestedRoute(p, a.id)!;
        const idx = buildRouteIndex(route, p);

        expect(idx.yourIndex).toBeNull();
    });
});
