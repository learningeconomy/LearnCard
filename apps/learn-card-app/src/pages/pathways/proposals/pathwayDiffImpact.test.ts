import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayDiff, PathwayNode } from '../types';

import { computePathwayDiffRouteImpact } from './pathwayDiffImpact';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-04-22T00:00:00.000Z';

const node = (id: string): PathwayNode =>
    ({
        id,
        pathwayId: 'p1',
        title: id,
        stage: {
            initiation: [],
            policy: { kind: 'practice' },
            termination: { kind: 'self-attest', prompt: 'ok' },
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
    }) as unknown as PathwayNode;

const pathway = (
    nodes: PathwayNode[],
    opts: {
        destinationNodeId?: string;
        chosenRoute?: string[];
    } = {},
): Pathway =>
    ({
        id: 'p1',
        ownerDid: 'did:test',
        revision: 0,
        schemaVersion: 1,
        title: 'Test',
        goal: 'test',
        nodes,
        edges: [],
        status: 'active',
        visibility: {
            self: true,
            mentors: false,
            guardians: false,
            publicProfile: false,
        },
        source: 'authored',
        destinationNodeId: opts.destinationNodeId,
        chosenRoute: opts.chosenRoute,
        createdAt: NOW,
        updatedAt: NOW,
    }) as unknown as Pathway;

const diff = (overrides: Partial<PathwayDiff> = {}): PathwayDiff => ({
    addNodes: [],
    updateNodes: [],
    removeNodeIds: [],
    addEdges: [],
    removeEdgeIds: [],
    ...overrides,
});

// ---------------------------------------------------------------------------
// computePathwayDiffRouteImpact
// ---------------------------------------------------------------------------

describe('computePathwayDiffRouteImpact', () => {
    it('reports no impact when the pathway has no committed route', () => {
        const p = pathway([node('a'), node('b')]);

        const impact = computePathwayDiffRouteImpact(
            diff({ removeNodeIds: ['a'] }),
            p,
        );

        expect(impact.hasImpact).toBe(false);
        expect(impact.routeNodesRemoved).toEqual([]);
        expect(impact.remainingRouteSteps).toBe(0);
    });

    it('reports no impact when the diff does not touch route steps', () => {
        // Remove `c` from the pathway — not on the committed route.
        const p = pathway([node('a'), node('b'), node('c')], {
            chosenRoute: ['a', 'b'],
            destinationNodeId: 'b',
        });

        const impact = computePathwayDiffRouteImpact(
            diff({ removeNodeIds: ['c'] }),
            p,
        );

        expect(impact.hasImpact).toBe(false);
        expect(impact.routeNodesRemoved).toEqual([]);
        expect(impact.remainingRouteSteps).toBe(2);
    });

    it('reports route-node removals in committed-route order', () => {
        const p = pathway([node('a'), node('b'), node('c')], {
            chosenRoute: ['a', 'b', 'c'],
            destinationNodeId: 'c',
        });

        const impact = computePathwayDiffRouteImpact(
            // Pass ids in reverse order — the result should preserve
            // the route's order, not the diff's removal order.
            diff({ removeNodeIds: ['b'] }),
            p,
        );

        expect(impact.hasImpact).toBe(true);
        expect(impact.routeNodesRemoved).toEqual(['b']);
        expect(impact.remainingRouteSteps).toBe(2);
        expect(impact.destinationRemoved).toBe(false);
    });

    it('flags destinationRemoved when the diff removes the pathway destination', () => {
        const p = pathway([node('a'), node('b')], {
            chosenRoute: ['a', 'b'],
            destinationNodeId: 'b',
        });

        const impact = computePathwayDiffRouteImpact(
            diff({ removeNodeIds: ['b'] }),
            p,
        );

        expect(impact.destinationRemoved).toBe(true);
        expect(impact.hasImpact).toBe(true);
    });

    it('flags impact when the diff carries a route swap even without structural removals', () => {
        const p = pathway([node('a'), node('b')], {
            chosenRoute: ['a', 'b'],
            destinationNodeId: 'b',
        });

        const impact = computePathwayDiffRouteImpact(
            diff({ setChosenRoute: ['a'] }),
            p,
        );

        expect(impact.hasImpact).toBe(true);
        // No structural removals, so the current-route view is
        // unchanged at the node level.
        expect(impact.routeNodesRemoved).toEqual([]);
    });

    it('counts remaining route steps as route length minus removed route steps', () => {
        const p = pathway([node('a'), node('b'), node('c'), node('d')], {
            chosenRoute: ['a', 'b', 'c', 'd'],
            destinationNodeId: 'd',
        });

        const impact = computePathwayDiffRouteImpact(
            diff({ removeNodeIds: ['b', 'c', 'e-ghost'] }),
            p,
        );

        // `b` and `c` were on the route; `e-ghost` isn't.
        expect(impact.routeNodesRemoved).toEqual(['b', 'c']);
        expect(impact.remainingRouteSteps).toBe(2);
    });
});
