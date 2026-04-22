import { beforeEach, describe, expect, it } from 'vitest';

import type {
    Edge,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../types';

import {
    pickNextOnRoute,
    pruneChosenRoute,
    reseedChosenRoute,
    seedChosenRoute,
} from './chosenRoute';

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
): Pathway => ({
    id: '00000000-0000-4000-8000-00000000aaaa',
    ownerDid: 'did:example:learner',
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
// seedChosenRoute
// ---------------------------------------------------------------------------

describe('seedChosenRoute', () => {
    it('returns an empty route when the pathway has no destination', () => {
        const a = makeNode();
        const b = makeNode();
        const pathway = makePathway([a, b], [edge(a.id, b.id)]);

        expect(seedChosenRoute(pathway)).toEqual([]);
    });

    it('returns an empty route when the pathway has no nodes', () => {
        const pathway = makePathway([], []);

        expect(seedChosenRoute(pathway)).toEqual([]);
    });

    it('routes a linear chain from entry to destination', () => {
        // a → b → c (destination)
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({
            title: 'Dest',
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        expect(seedChosenRoute(pathway)).toEqual([a.id, b.id, c.id]);
    });

    it('picks the first root in author order when multiple entries exist', () => {
        // a → dest
        // b → dest
        // Author order is [a, b, dest]; the seeder should enter at a.
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
            [edge(a.id, dest.id), edge(b.id, dest.id)],
            dest.id,
        );

        const seeded = seedChosenRoute(pathway);

        expect(seeded[0]).toBe(a.id);
        expect(seeded[seeded.length - 1]).toBe(dest.id);
        // Both siblings are ancestors of dest — the computed route includes
        // them in topo order (author-order tiebroken).
        expect(seeded).toContain(b.id);
    });

    it('returns an empty route when the destination is unreachable from every root', () => {
        // Isolated dest: no edges into it.
        const a = makeNode();
        const dest = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([a, dest], [], dest.id);

        expect(seedChosenRoute(pathway)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// pruneChosenRoute
// ---------------------------------------------------------------------------

describe('pruneChosenRoute', () => {
    it('returns undefined for an undefined input', () => {
        expect(pruneChosenRoute(undefined, new Set())).toBeUndefined();
    });

    it('drops ids that no longer survive', () => {
        const surviving = new Set(['a', 'c', 'd']);

        expect(pruneChosenRoute(['a', 'b', 'c', 'd'], surviving)).toEqual([
            'a',
            'c',
            'd',
        ]);
    });

    it('preserves order', () => {
        const surviving = new Set(['d', 'b', 'a']);

        // Filtering keeps original order of the input array, not the set.
        expect(pruneChosenRoute(['a', 'b', 'c', 'd'], surviving)).toEqual([
            'a',
            'b',
            'd',
        ]);
    });

    it('returns undefined when pruning would leave fewer than two nodes', () => {
        const surviving = new Set(['a']);

        expect(pruneChosenRoute(['a', 'b', 'c'], surviving)).toBeUndefined();
    });

    it('returns undefined when every id is pruned', () => {
        expect(pruneChosenRoute(['a', 'b'], new Set())).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// reseedChosenRoute
// ---------------------------------------------------------------------------

describe('reseedChosenRoute', () => {
    const destNode = () =>
        makeNode({
            title: 'Dest',
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

    it('is a no-op when the pathway already has a valid route', () => {
        const a = makeNode();
        const b = destNode();
        const pathway: Pathway = {
            ...makePathway([a, b], [edge(a.id, b.id)], b.id),
            chosenRoute: [a.id, b.id],
        };

        const next = reseedChosenRoute(pathway);

        // Returns the *same* reference so callers can short-circuit.
        expect(next).toBe(pathway);
        expect(next.chosenRoute).toEqual([a.id, b.id]);
    });

    it('seeds a fresh route when chosenRoute is missing', () => {
        const a = makeNode();
        const b = destNode();
        const pathway = makePathway([a, b], [edge(a.id, b.id)], b.id);

        const next = reseedChosenRoute(pathway);

        expect(next.chosenRoute).toEqual([a.id, b.id]);
    });

    it('is a no-op when the pathway has no destination (no seed possible)', () => {
        const a = makeNode();
        const b = makeNode();
        const pathway = makePathway([a, b], [edge(a.id, b.id)]);

        const next = reseedChosenRoute(pathway);

        expect(next).toBe(pathway);
        expect(next.chosenRoute).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// pickNextOnRoute
// ---------------------------------------------------------------------------

describe('pickNextOnRoute', () => {
    const makeLinearPathway = () => {
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({
            title: 'Dest',
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        return { pathway, a, b, c };
    };

    it('returns null for an empty route', () => {
        const { pathway } = makeLinearPathway();

        expect(pickNextOnRoute(pathway, [])).toBeNull();
        expect(pickNextOnRoute(pathway, undefined)).toBeNull();
    });

    it('returns the first uncompleted, available node on the route', () => {
        const { pathway, a } = makeLinearPathway();

        const step = pickNextOnRoute(
            pathway,
            pathway.nodes.map(n => n.id),
        );

        expect(step).not.toBeNull();
        expect(step!.nodeId).toBe(a.id);
        expect(step!.position).toBe(1);
        expect(step!.total).toBe(3);
        expect(step!.reason).toBe('Step 1 of 3 on your route');
    });

    it('skips completed nodes at the head of the route', () => {
        const { pathway, a, b } = makeLinearPathway();

        // Mark node A as completed — next step should be B.
        const withCompletedA: Pathway = {
            ...pathway,
            nodes: pathway.nodes.map(n =>
                n.id === a.id
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

        const step = pickNextOnRoute(
            withCompletedA,
            withCompletedA.nodes.map(n => n.id),
        );

        expect(step!.nodeId).toBe(b.id);
        expect(step!.position).toBe(2);
    });

    it('skips route nodes that are blocked by off-route prerequisites', () => {
        // Graph: offroot → b → dest (offroot is NOT on chosenRoute,
        // but b *is*). With offroot uncompleted, b isn't graph-available,
        // so the picker should skip b and look further down the route.
        const offroot = makeNode({ title: 'Offroot' });
        const b = makeNode({ title: 'B' });
        const dest = makeNode({
            title: 'Dest',
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        // Make dest depend only on offroot (not b) so dest is available
        // when offroot is completed but b is not.
        const pathway = makePathway(
            [offroot, b, dest],
            [edge(offroot.id, b.id), edge(offroot.id, dest.id)],
            dest.id,
        );

        // Complete offroot so dest is available; b is still not-started
        // and its prereq (offroot) is done, so b is also available.
        // Craft a case where b is blocked: add another prereq on b that
        // isn't done. Give b a second prereq that's uncompleted.
        const extraBlocker = makeNode({ title: 'Extra blocker' });
        const pathway2: Pathway = {
            ...pathway,
            nodes: [
                ...pathway.nodes,
                extraBlocker,
                // Mark offroot as completed.
            ].map(n =>
                n.id === offroot.id
                    ? {
                          ...n,
                          progress: {
                              ...n.progress,
                              status: 'completed' as const,
                          },
                      }
                    : n,
            ),
            edges: [...pathway.edges, edge(extraBlocker.id, b.id)],
        };

        // chosenRoute includes b and dest, NOT extraBlocker.
        const step = pickNextOnRoute(pathway2, [b.id, dest.id]);

        // b is blocked by extraBlocker (off-route, uncompleted) → picker
        // looks further and picks dest (available because offroot is done).
        expect(step!.nodeId).toBe(dest.id);
    });

    it('returns null when no route node is both uncompleted and available', () => {
        const { pathway, a, b, c } = makeLinearPathway();

        // Complete everything.
        const allDone: Pathway = {
            ...pathway,
            nodes: pathway.nodes.map(n => ({
                ...n,
                progress: {
                    ...n.progress,
                    status: 'completed' as const,
                },
            })),
        };

        expect(
            pickNextOnRoute(allDone, [a.id, b.id, c.id]),
        ).toBeNull();
    });

    it('ignores stale ids that no longer exist in the pathway', () => {
        const { pathway, a, b, c } = makeLinearPathway();

        // Route has a stale id prepended.
        const step = pickNextOnRoute(pathway, [
            '00000000-0000-4000-8000-stalestale',
            a.id,
            b.id,
            c.id,
        ]);

        expect(step!.nodeId).toBe(a.id);
        // position reflects location within the supplied route, including
        // the stale id — this keeps the UI's "Step N of M" honest about
        // the route the learner actually committed to.
        expect(step!.position).toBe(2);
        expect(step!.total).toBe(4);
    });
});
