import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayNode } from '../types';

import {
    computePathwayProgress,
    findReferenceCycles,
    isPathwayCompleted,
    referencedPathwayIds,
    resolveCompositeChild,
    rollupCompositeProgress,
    wouldCreateCycle,
} from './composition';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const NOW = '2026-04-20T12:00:00.000Z';
const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const nodeWithPolicy = (
    id: string,
    pathwayId: string,
    opts: {
        policy?: PathwayNode['stage']['policy'];
        status?: PathwayNode['progress']['status'];
    } = {},
): PathwayNode => ({
    id,
    pathwayId,
    title: `Node ${id.slice(0, 4)}`,
    stage: {
        initiation: [],
        policy: opts.policy ?? { kind: 'self-attest' as never, prompt: '' } as never,
        termination: { kind: 'self-attest', prompt: '' },
    },
    endorsements: [],
    progress: {
        status: opts.status ?? 'not-started',
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
});

const makePathway = (
    id: string,
    opts: {
        nodes: PathwayNode[];
        destinationNodeId?: string;
    },
): Pathway => ({
    id,
    ownerDid: 'did:key:z-owner',
    revision: 0,
    schemaVersion: 1,
    title: `Pathway ${id.slice(0, 4)}`,
    goal: 'test',
    nodes: opts.nodes,
    edges: [],
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    destinationNodeId: opts.destinationNodeId,
    createdAt: NOW,
    updatedAt: NOW,
});

// A composite-policy node that references `refId`.
const compositeNode = (nodeId: string, pathwayId: string, refId: string) =>
    nodeWithPolicy(nodeId, pathwayId, {
        policy: {
            kind: 'composite',
            pathwayRef: refId,
            renderStyle: 'inline-expandable',
        },
    });

// ---------------------------------------------------------------------------
// referencedPathwayIds
// ---------------------------------------------------------------------------

describe('referencedPathwayIds', () => {
    it('returns every pathway ref reachable from composite policies', () => {
        const pw = makePathway(UUID(1), {
            nodes: [
                compositeNode(UUID(10), UUID(1), UUID(2)),
                nodeWithPolicy(UUID(11), UUID(1), {
                    policy: { kind: 'artifact', prompt: '', expectedArtifact: 'text' },
                }),
                compositeNode(UUID(12), UUID(1), UUID(3)),
            ],
        });

        expect(referencedPathwayIds(pw)).toEqual([UUID(2), UUID(3)]);
    });

    it('dedupes when multiple composite nodes point at the same pathway', () => {
        const pw = makePathway(UUID(1), {
            nodes: [
                compositeNode(UUID(10), UUID(1), UUID(2)),
                compositeNode(UUID(11), UUID(1), UUID(2)),
            ],
        });

        expect(referencedPathwayIds(pw)).toEqual([UUID(2)]);
    });

    it('returns [] when no composite policies exist', () => {
        const pw = makePathway(UUID(1), {
            nodes: [
                nodeWithPolicy(UUID(10), UUID(1), {
                    policy: { kind: 'self-attest', prompt: '' } as never,
                }),
            ],
        });

        expect(referencedPathwayIds(pw)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// wouldCreateCycle
// ---------------------------------------------------------------------------

describe('wouldCreateCycle', () => {
    it('flags self-embedding', () => {
        const pw = makePathway(UUID(1), { nodes: [] });

        expect(wouldCreateCycle({ [pw.id]: pw }, pw.id, pw.id)).toBe(true);
    });

    it('permits embedding a pathway that does not reach back', () => {
        const child = makePathway(UUID(2), { nodes: [] });
        const parent = makePathway(UUID(1), { nodes: [] });

        expect(
            wouldCreateCycle(
                { [parent.id]: parent, [child.id]: child },
                parent.id,
                child.id,
            ),
        ).toBe(false);
    });

    it('flags a direct back-reference (child already points at parent)', () => {
        const parent = makePathway(UUID(1), { nodes: [] });

        const child = makePathway(UUID(2), {
            nodes: [compositeNode(UUID(20), UUID(2), UUID(1))],
        });

        expect(
            wouldCreateCycle(
                { [parent.id]: parent, [child.id]: child },
                parent.id,
                child.id,
            ),
        ).toBe(true);
    });

    it('flags a transitive back-reference (A ← B ← C, adding A→C closes the loop)', () => {
        // c points at b; b points at a. If we try to embed c inside a
        // (a → c), the chain closes: a → c → b → a.
        const a = makePathway(UUID(1), { nodes: [] });

        const b = makePathway(UUID(2), {
            nodes: [compositeNode(UUID(20), UUID(2), UUID(1))],
        });

        const c = makePathway(UUID(3), {
            nodes: [compositeNode(UUID(30), UUID(3), UUID(2))],
        });

        expect(
            wouldCreateCycle(
                { [a.id]: a, [b.id]: b, [c.id]: c },
                a.id,
                c.id,
            ),
        ).toBe(true);
    });

    it('returns false when the candidate child is not in the map at all', () => {
        const parent = makePathway(UUID(1), { nodes: [] });

        // Candidate child is unloaded — trivially can't reach anything.
        expect(wouldCreateCycle({ [parent.id]: parent }, parent.id, UUID(99))).toBe(
            false,
        );
    });
});

// ---------------------------------------------------------------------------
// findReferenceCycles
// ---------------------------------------------------------------------------

describe('findReferenceCycles', () => {
    it('returns [] on a cycle-free graph', () => {
        const a = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(2))],
        });

        const b = makePathway(UUID(2), { nodes: [] });

        expect(findReferenceCycles({ [a.id]: a, [b.id]: b })).toEqual([]);
    });

    it('finds a direct self-loop', () => {
        const a = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(1))],
        });

        const cycles = findReferenceCycles({ [a.id]: a });

        expect(cycles).toHaveLength(1);
        expect(cycles[0][0]).toBe(a.id);
    });

    it('finds a two-pathway cycle', () => {
        const a = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(2))],
        });

        const b = makePathway(UUID(2), {
            nodes: [compositeNode(UUID(20), UUID(2), UUID(1))],
        });

        const cycles = findReferenceCycles({ [a.id]: a, [b.id]: b });

        expect(cycles).toHaveLength(1);
        expect(cycles[0].length).toBeGreaterThanOrEqual(2);
    });
});

// ---------------------------------------------------------------------------
// computePathwayProgress + isPathwayCompleted
// ---------------------------------------------------------------------------

describe('computePathwayProgress', () => {
    it('reports 0/0 for an empty pathway', () => {
        const p = makePathway(UUID(1), { nodes: [] });
        const progress = computePathwayProgress(p);

        expect(progress).toMatchObject({
            completed: 0,
            total: 0,
            fraction: 0,
            destinationCompleted: false,
        });
    });

    it('reports correct fraction and destination status', () => {
        const destId = UUID(13);

        const p = makePathway(UUID(1), {
            nodes: [
                nodeWithPolicy(UUID(10), UUID(1), {
                    policy: { kind: 'self-attest', prompt: '' } as never,
                    status: 'completed',
                }),
                nodeWithPolicy(UUID(11), UUID(1), {
                    policy: { kind: 'self-attest', prompt: '' } as never,
                    status: 'completed',
                }),
                nodeWithPolicy(UUID(12), UUID(1), {
                    policy: { kind: 'self-attest', prompt: '' } as never,
                    status: 'in-progress',
                }),
                nodeWithPolicy(destId, UUID(1), {
                    policy: { kind: 'self-attest', prompt: '' } as never,
                    status: 'not-started',
                }),
            ],
            destinationNodeId: destId,
        });

        const progress = computePathwayProgress(p);

        expect(progress.completed).toBe(2);
        expect(progress.total).toBe(4);
        expect(progress.fraction).toBeCloseTo(0.5);
        expect(progress.destinationCompleted).toBe(false);
    });

    it('flags destinationCompleted once the destination node is completed', () => {
        const destId = UUID(13);

        const p = makePathway(UUID(1), {
            nodes: [
                nodeWithPolicy(destId, UUID(1), {
                    policy: { kind: 'self-attest', prompt: '' } as never,
                    status: 'completed',
                }),
            ],
            destinationNodeId: destId,
        });

        expect(computePathwayProgress(p).destinationCompleted).toBe(true);
    });
});

describe('isPathwayCompleted', () => {
    it('returns true iff the referenced pathway has its destination completed', () => {
        const destId = UUID(20);

        const finished = makePathway(UUID(2), {
            nodes: [
                nodeWithPolicy(destId, UUID(2), {
                    policy: { kind: 'self-attest', prompt: '' } as never,
                    status: 'completed',
                }),
            ],
            destinationNodeId: destId,
        });

        expect(isPathwayCompleted({ [finished.id]: finished }, finished.id)).toBe(true);
    });

    it('returns false when the referenced pathway is not loaded', () => {
        expect(isPathwayCompleted({}, UUID(99))).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// resolveCompositeChild
// ---------------------------------------------------------------------------

describe('resolveCompositeChild', () => {
    it('returns the referenced pathway when loaded', () => {
        const child = makePathway(UUID(2), { nodes: [] });
        const parentNode = compositeNode(UUID(10), UUID(1), UUID(2));

        expect(resolveCompositeChild({ [child.id]: child }, parentNode)).toBe(child);
    });

    it('returns null when the node is not composite', () => {
        const node = nodeWithPolicy(UUID(10), UUID(1), {
            policy: { kind: 'self-attest', prompt: '' } as never,
        });

        expect(resolveCompositeChild({}, node)).toBeNull();
    });

    it('returns null when the referenced pathway is not loaded', () => {
        const node = compositeNode(UUID(10), UUID(1), UUID(99));

        expect(resolveCompositeChild({}, node)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// rollupCompositeProgress
// ---------------------------------------------------------------------------

describe('rollupCompositeProgress', () => {
    it('returns identity when no composite nodes exist', () => {
        const p = makePathway(UUID(1), { nodes: [nodeWithPolicy(UUID(10), UUID(1))] });
        const map = { [p.id]: p };

        const next = rollupCompositeProgress(map);

        // Strict identity — no work was needed, no allocation was made.
        expect(next).toBe(map);
    });

    it('returns identity when composite ref is not yet complete', () => {
        const child = makePathway(UUID(2), {
            nodes: [nodeWithPolicy(UUID(20), UUID(2))],
            destinationNodeId: UUID(20),
        });

        const parent = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(2))],
        });

        const map = { [parent.id]: parent, [child.id]: child };
        const next = rollupCompositeProgress(map);

        expect(next).toBe(map);
    });

    it('auto-completes a composite node when its nested destination is done', () => {
        const destId = UUID(20);

        const child = makePathway(UUID(2), {
            nodes: [nodeWithPolicy(destId, UUID(2), { status: 'completed' })],
            destinationNodeId: destId,
        });

        const parent = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(2))],
        });

        const next = rollupCompositeProgress({
            [parent.id]: parent,
            [child.id]: child,
        });

        expect(next[parent.id].nodes[0].progress.status).toBe('completed');
        expect(next[parent.id].nodes[0].progress.completedAt).toBeTruthy();
        // Child pathway is untouched — its own nodes were already correct.
        expect(next[child.id]).toBe(child);
    });

    it('never un-completes a previously-completed composite node', () => {
        // Child has an INCOMPLETE destination; parent composite was
        // already marked completed (e.g. manually, or by an earlier
        // rollup against a since-changed child). Rollup must NOT flip
        // it back.
        const child = makePathway(UUID(2), {
            nodes: [nodeWithPolicy(UUID(20), UUID(2), { status: 'not-started' })],
            destinationNodeId: UUID(20),
        });

        const parentCompositeNode = {
            ...compositeNode(UUID(10), UUID(1), UUID(2)),
            progress: {
                status: 'completed' as const,
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
                completedAt: '2026-04-01T00:00:00.000Z',
            },
        };

        const parent = makePathway(UUID(1), { nodes: [parentCompositeNode] });

        const next = rollupCompositeProgress({
            [parent.id]: parent,
            [child.id]: child,
        });

        expect(next[parent.id].nodes[0].progress.status).toBe('completed');
    });

    it('propagates transitively through a chain (A→B→C)', () => {
        // C has its destination done → rollup should cascade up:
        //   composite in B → completed → B's destination done
        //   composite in A → completed
        const cDest = UUID(30);

        const c = makePathway(UUID(3), {
            nodes: [nodeWithPolicy(cDest, UUID(3), { status: 'completed' })],
            destinationNodeId: cDest,
        });

        const bCompositeId = UUID(20);
        const b = makePathway(UUID(2), {
            nodes: [compositeNode(bCompositeId, UUID(2), UUID(3))],
            destinationNodeId: bCompositeId,
        });

        const a = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(2))],
        });

        const next = rollupCompositeProgress({
            [a.id]: a,
            [b.id]: b,
            [c.id]: c,
        });

        expect(next[b.id].nodes[0].progress.status).toBe('completed');
        expect(next[a.id].nodes[0].progress.status).toBe('completed');
    });

    it('leaves a composite alone when the ref points nowhere', () => {
        const parent = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(99))],
        });

        const next = rollupCompositeProgress({ [parent.id]: parent });

        expect(next[parent.id].nodes[0].progress.status).toBe('not-started');
    });

    it('is idempotent: running twice yields the same result', () => {
        const child = makePathway(UUID(2), {
            nodes: [nodeWithPolicy(UUID(20), UUID(2), { status: 'completed' })],
            destinationNodeId: UUID(20),
        });

        const parent = makePathway(UUID(1), {
            nodes: [compositeNode(UUID(10), UUID(1), UUID(2))],
        });

        const once = rollupCompositeProgress({
            [parent.id]: parent,
            [child.id]: child,
        });

        const twice = rollupCompositeProgress(once);

        // Second call is a no-op, so identity is preserved.
        expect(twice).toBe(once);
    });
});
