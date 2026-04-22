import { describe, expect, it } from 'vitest';

import type { Edge, PathwayDiff, PathwayNode } from '../types';

import { PROPOSAL_KIND_FRAMING, proposalKind } from './proposalKind';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const emptyDiff = (overrides: Partial<PathwayDiff> = {}): PathwayDiff => ({
    addNodes: [],
    updateNodes: [],
    removeNodeIds: [],
    addEdges: [],
    removeEdgeIds: [],
    ...overrides,
});

const fakeNode = (): PathwayNode =>
    ({
        id: '00000000-0000-4000-8000-000000000001',
    } as unknown as PathwayNode);

const fakeEdge = (): Edge => ({
    id: '00000000-0000-4000-8000-000000000002',
    from: '00000000-0000-4000-8000-000000000003',
    to: '00000000-0000-4000-8000-000000000004',
    type: 'prerequisite',
});

// ---------------------------------------------------------------------------
// proposalKind
// ---------------------------------------------------------------------------

describe('proposalKind', () => {
    it('classifies an empty diff as empty', () => {
        expect(proposalKind(emptyDiff())).toBe('empty');
    });

    it('classifies a diff with only setChosenRoute as route-swap', () => {
        expect(
            proposalKind(emptyDiff({ setChosenRoute: ['a', 'b'] })),
        ).toBe('route-swap');
    });

    it('classifies a diff with an empty setChosenRoute (clearing route) as route-swap', () => {
        // An empty array is a deliberate "clear my chosenRoute" intent,
        // not a no-op. Treat it as a route-swap kind so the UI frames
        // it as a route decision.
        expect(proposalKind(emptyDiff({ setChosenRoute: [] }))).toBe(
            'route-swap',
        );
    });

    it('classifies a diff with added nodes as pathway-edit', () => {
        expect(
            proposalKind(emptyDiff({ addNodes: [fakeNode()] })),
        ).toBe('pathway-edit');
    });

    it('classifies a diff with removed nodes as pathway-edit', () => {
        expect(
            proposalKind(emptyDiff({ removeNodeIds: ['x'] })),
        ).toBe('pathway-edit');
    });

    it('classifies a diff with updated nodes as pathway-edit', () => {
        expect(
            proposalKind(
                emptyDiff({
                    updateNodes: [
                        { id: '00000000-0000-4000-8000-000000000005', title: 'new' },
                    ],
                }),
            ),
        ).toBe('pathway-edit');
    });

    it('classifies a diff with edge changes as pathway-edit', () => {
        expect(
            proposalKind(emptyDiff({ addEdges: [fakeEdge()] })),
        ).toBe('pathway-edit');

        expect(
            proposalKind(emptyDiff({ removeEdgeIds: ['e1'] })),
        ).toBe('pathway-edit');
    });

    it('classifies a diff with both a route swap and structural edits as mixed', () => {
        expect(
            proposalKind(
                emptyDiff({
                    addNodes: [fakeNode()],
                    setChosenRoute: ['a', 'b'],
                }),
            ),
        ).toBe('mixed');
    });

    it('classifies a diff with newPathway as new-pathway regardless of other fields', () => {
        expect(
            proposalKind(
                emptyDiff({
                    newPathway: {
                        title: 'New',
                        goal: 'Ship it',
                    },
                }),
            ),
        ).toBe('new-pathway');

        // newPathway precedence over route swap / structural edits:
        // the materialization creates a whole new pathway, so the
        // other fields are supporting context, not the primary
        // framing.
        expect(
            proposalKind(
                emptyDiff({
                    newPathway: { title: 'New', goal: 'Ship it' },
                    setChosenRoute: ['a'],
                    addNodes: [fakeNode()],
                }),
            ),
        ).toBe('new-pathway');
    });
});

// ---------------------------------------------------------------------------
// PROPOSAL_KIND_FRAMING
// ---------------------------------------------------------------------------

describe('PROPOSAL_KIND_FRAMING', () => {
    it('provides framing copy for every ProposalKind', () => {
        const kinds = [
            'route-swap',
            'pathway-edit',
            'mixed',
            'new-pathway',
            'empty',
        ] as const;

        for (const kind of kinds) {
            const framing = PROPOSAL_KIND_FRAMING[kind];

            expect(framing).toBeDefined();
            expect(framing.eyebrow.length).toBeGreaterThan(0);
            expect(framing.accept.length).toBeGreaterThan(0);
            expect(framing.reject.length).toBeGreaterThan(0);
        }
    });

    it('uses route-focused language for route-swap', () => {
        const { accept, reject } = PROPOSAL_KIND_FRAMING['route-swap'];
        expect(accept.toLowerCase()).toContain('route');
        expect(reject.toLowerCase()).toContain('route');
    });

    it('uses revision-focused language for pathway-edit', () => {
        const { eyebrow } = PROPOSAL_KIND_FRAMING['pathway-edit'];
        expect(eyebrow.toLowerCase()).toContain('revision');
    });
});
