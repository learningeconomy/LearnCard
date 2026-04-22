import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode } from '../types';

import {
    X_SPACING,
    Y_SPACING,
    layoutPathway,
    layoutPathwayNavigate,
} from './layout';

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

describe('layoutPathway (bottom-up)', () => {
    it('places a lone root at level 0 and at the origin', () => {
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

    it('anchors level 0 at the bottom — y decreases as level increases', () => {
        const p = pathway([node('a'), node('b')], [edge('1', 'a', 'b')]);

        const positions = byId(layoutPathway(p));

        // a is the root (level 0) → bottom. b is level 1 → above a (smaller y).
        expect(positions.a.y).toBeGreaterThan(positions.b.y);
        expect(positions.a.y - positions.b.y).toBe(Y_SPACING);
    });

    it('stacks siblings at the same level along the x-axis, centered around 0', () => {
        // a -> b, a -> c  → b and c at level 1, side-by-side.
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'a', 'c')],
        );

        const positions = byId(layoutPathway(p));

        expect(positions.b.level).toBe(positions.c.level);
        expect(positions.b.y).toBe(positions.c.y);
        expect(Math.abs(positions.b.x - positions.c.x)).toBe(X_SPACING);
        // Centered: the midpoint of the two siblings sits at x = 0.
        expect(positions.b.x + positions.c.x).toBe(0);
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

// ---------------------------------------------------------------------------
// layoutPathwayNavigate — linear spine with side-branches
// ---------------------------------------------------------------------------

describe('layoutPathwayNavigate', () => {
    it('falls back to layoutPathway when the route has fewer than two ids', () => {
        const p = pathway(
            [node('a'), node('b')],
            [edge('1', 'a', 'b')],
        );

        const positions = byId(layoutPathwayNavigate(p, []));
        const explore = byId(layoutPathway(p));

        // Same positions as Explore; no onRoute flag on any entry.
        expect(positions.a.x).toBe(explore.a.x);
        expect(positions.a.y).toBe(explore.a.y);
        expect(positions.a.onRoute).toBeUndefined();
    });

    it('places route nodes on a vertical spine at x = 0, step 1 at bottom', () => {
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'c')],
        );

        const positions = byId(layoutPathwayNavigate(p, ['a', 'b', 'c']));

        expect(positions.a.x).toBe(0);
        expect(positions.b.x).toBe(0);
        expect(positions.c.x).toBe(0);

        // Bottom-up: `a` (first) at largest y, `c` (destination) at 0.
        expect(positions.a.y).toBeGreaterThan(positions.b.y);
        expect(positions.b.y).toBeGreaterThan(positions.c.y);
        expect(positions.c.y).toBe(0);
    });

    it('tags route nodes with onRoute=true', () => {
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'c')],
        );

        const positions = byId(layoutPathwayNavigate(p, ['a', 'b', 'c']));

        expect(positions.a.onRoute).toBe(true);
        expect(positions.b.onRoute).toBe(true);
        expect(positions.c.onRoute).toBe(true);
    });

    it('assigns level = route position for on-route nodes', () => {
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'c')],
        );

        const positions = byId(layoutPathwayNavigate(p, ['a', 'b', 'c']));

        expect(positions.a.level).toBe(0);
        expect(positions.b.level).toBe(1);
        expect(positions.c.level).toBe(2);
    });

    // Core invariant for Navigate mode: off-route nodes must not
    // appear in the result. This is what makes the Navigate canvas
    // a *route-only* view — any context about side-branches or
    // orphans is surfaced by MapMode chrome (detour chips, "View
    // full map"), never by the layout itself.

    it('omits off-route nodes entirely (structurally between route nodes)', () => {
        // Route: a → c. Structural graph: a → b → c, so `b` exists
        // in the pathway but isn't on the committed walk.
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'c'), edge('3', 'a', 'c')],
        );

        const positions = byId(layoutPathwayNavigate(p, ['a', 'c']));

        // `b` is present in the pathway but must not appear in the
        // Navigate layout — it's a side-branch.
        expect(positions.a).toBeDefined();
        expect(positions.c).toBeDefined();
        expect(positions.b).toBeUndefined();
        expect(Object.keys(positions)).toHaveLength(2);
    });

    it('omits off-route nodes that are siblings of a route step', () => {
        // Route: a → c. Off-route: b, d, e (all prereqs of a).
        const p = pathway(
            [node('a'), node('b'), node('c'), node('d'), node('e')],
            [
                edge('1', 'b', 'a'),
                edge('2', 'd', 'a'),
                edge('3', 'e', 'a'),
                edge('4', 'a', 'c'),
            ],
        );

        const positions = byId(layoutPathwayNavigate(p, ['a', 'c']));

        // Only the route steps are present.
        expect(Object.keys(positions).sort()).toEqual(['a', 'c']);
    });

    it('omits orphans (unreachable nodes) from the Navigate layout', () => {
        // Route: a → c. Orphan: z (no edges).
        const p = pathway(
            [node('a'), node('c'), node('z')],
            [edge('1', 'a', 'c')],
        );

        const positions = byId(layoutPathwayNavigate(p, ['a', 'c']));

        expect(positions.z).toBeUndefined();
        expect(Object.keys(positions).sort()).toEqual(['a', 'c']);
    });

    it('defensively drops stale route ids that do not exist in the pathway', () => {
        const p = pathway(
            [node('a'), node('b')],
            [edge('1', 'a', 'b')],
        );

        // Route references ghost id; pruning would leave only [a, b]
        // from the valid ones — that's fine, a full route.
        const positions = byId(
            layoutPathwayNavigate(p, ['a', 'ghost', 'b']),
        );

        expect(positions.a.onRoute).toBe(true);
        expect(positions.b.onRoute).toBe(true);
        // No throw; a and b both placed, ghost id is silently dropped.
        expect(Object.keys(positions)).toHaveLength(2);
    });

    it('falls back to layoutPathway when the only valid route ids leave < 2', () => {
        const p = pathway([node('a')], []);

        // All ids except `a` are ghosts; valid route ends up as [a].
        const positions = byId(
            layoutPathwayNavigate(p, ['a', 'ghost-1', 'ghost-2']),
        );

        expect(positions.a.onRoute).toBeUndefined();
    });
});
