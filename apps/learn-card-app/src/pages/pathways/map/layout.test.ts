import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode } from '../types';

import { X_SPACING, Y_SPACING, layoutPathway } from './layout';

const NOW = '2026-04-20T00:00:00.000Z';

const node = (id: string): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title: id,
    stage: {
        initiation: [],
        policy: { kind: 'artifact', prompt: 'x', expectedArtifact: 'text' },
        termination: { kind: 'self-attest', prompt: 'done' },
    },
    endorsements: [],
    progress: {
        status: 'not-started',
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
});

const edge = (id: string, from: string, to: string): Edge => ({
    id,
    from,
    to,
    type: 'prerequisite',
});

const pathway = (nodes: PathwayNode[], edges: Edge[]): Pathway => ({
    id: 'p1',
    ownerDid: 'did:test:learner',
    title: 'Test',
    goal: 'Test',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: NOW,
    updatedAt: NOW,
});

const byId = (positions: ReturnType<typeof layoutPathway>) =>
    Object.fromEntries(positions.map(p => [p.id, p]));

describe('layoutPathway', () => {
    it('places a root at level 0', () => {
        const p = pathway([node('a')], []);

        const positions = byId(layoutPathway(p));

        expect(positions.a.level).toBe(0);
        expect(positions.a.x).toBe(0);
        expect(positions.a.y).toBe(0);
    });

    it('assigns each node its longest-path distance from any root', () => {
        // a -> b -> c   and   a -> c  → c is level 2 (longest wins).
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'c'), edge('3', 'a', 'c')],
        );

        const positions = byId(layoutPathway(p));

        expect(positions.a.level).toBe(0);
        expect(positions.b.level).toBe(1);
        expect(positions.c.level).toBe(2);
    });

    it('spaces levels by X_SPACING on the x-axis', () => {
        const p = pathway(
            [node('a'), node('b')],
            [edge('1', 'a', 'b')],
        );

        const positions = byId(layoutPathway(p));

        expect(positions.a.x).toBe(0);
        expect(positions.b.x).toBe(X_SPACING);
    });

    it('stacks siblings at the same level along the y-axis', () => {
        // a -> b, a -> c  → b and c at level 1, stacked.
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'a', 'c')],
        );

        const positions = byId(layoutPathway(p));

        expect(positions.b.level).toBe(positions.c.level);
        expect(Math.abs(positions.b.y - positions.c.y)).toBe(Y_SPACING);
    });

    it('produces a position for every node even if the graph has cycles or orphans', () => {
        // A 2-cycle a <-> b: neither root, but both should still be
        // laid out somewhere.
        const p = pathway(
            [node('a'), node('b')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'a')],
        );

        const positions = layoutPathway(p);

        expect(positions).toHaveLength(2);
        expect(positions.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    });
});
