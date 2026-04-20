import { describe, expect, it } from 'vitest';

import type {
    Edge,
    Pathway,
    PathwayDiff,
    PathwayNode,
    Proposal,
} from '../types';

import {
    ProposalApplyError,
    applyProposal,
    materializeNewPathway,
} from './applyProposal';

const NOW = '2026-04-20T12:00:00.000Z';
const LATER = '2026-04-21T12:00:00.000Z';

const node = (id: string, overrides: Partial<PathwayNode> = {}): PathwayNode => ({
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
    ...overrides,
});

const edge = (id: string, from: string, to: string): Edge => ({
    id,
    from,
    to,
    type: 'prerequisite',
});

const pathway = (
    nodes: PathwayNode[] = [],
    edges: Edge[] = [],
    overrides: Partial<Pathway> = {},
): Pathway => ({
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
    ...overrides,
});

const emptyDiff = (overrides: Partial<PathwayDiff> = {}): PathwayDiff => ({
    addNodes: [],
    updateNodes: [],
    removeNodeIds: [],
    addEdges: [],
    removeEdgeIds: [],
    ...overrides,
});

const proposal = (
    diff: PathwayDiff,
    overrides: Partial<Proposal> = {},
): Proposal => ({
    id: 'prop-1',
    pathwayId: 'p1',
    ownerDid: 'did:test:learner',
    agent: 'planner',
    capability: 'planning',
    reason: 'test',
    diff,
    status: 'open',
    createdAt: NOW,
    ...overrides,
});

describe('applyProposal — in-pathway diffs', () => {
    it('adds new nodes and stamps pathwayId on them', () => {
        const before = pathway([node('a')]);
        const addition = node('b', { pathwayId: 'stale' });
        const after = applyProposal(
            before,
            proposal(emptyDiff({ addNodes: [addition] })),
            LATER,
        );

        expect(after.nodes.map(n => n.id)).toEqual(['a', 'b']);
        expect(after.nodes[1].pathwayId).toBe('p1');
        expect(after.updatedAt).toBe(LATER);
    });

    it('patches titles/descriptions without rewriting identity or progress', () => {
        const a = node('a', {
            progress: {
                status: 'in-progress',
                artifacts: [{ id: 'ev-1', artifactType: 'text', submittedAt: NOW }],
                reviewsDue: 0,
                streak: { current: 2, longest: 2, lastActiveAt: NOW },
            },
        });

        const before = pathway([a]);
        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    updateNodes: [{ id: 'a', title: 'A (renamed)' }],
                }),
            ),
            LATER,
        );

        expect(after.nodes[0].title).toBe('A (renamed)');
        expect(after.nodes[0].pathwayId).toBe('p1');
        expect(after.nodes[0].createdBy).toBe('learner');
        expect(after.nodes[0].progress.status).toBe('in-progress');
        expect(after.nodes[0].progress.artifacts).toHaveLength(1);
    });

    it('removes nodes and prunes any edge referencing them', () => {
        const before = pathway(
            [node('a'), node('b'), node('c')],
            [edge('e1', 'a', 'b'), edge('e2', 'b', 'c')],
        );

        const after = applyProposal(
            before,
            proposal(emptyDiff({ removeNodeIds: ['b'] })),
            LATER,
        );

        expect(after.nodes.map(n => n.id)).toEqual(['a', 'c']);
        expect(after.edges).toEqual([]);
    });

    it('adds new edges when both endpoints exist in the result', () => {
        const before = pathway([node('a'), node('b')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'b')] })),
            LATER,
        );

        expect(after.edges).toHaveLength(1);
        expect(after.edges[0].from).toBe('a');
    });

    it('deduplicates edges by id on reapply', () => {
        const before = pathway([node('a'), node('b')], [edge('e1', 'a', 'b')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'b')] })),
            LATER,
        );

        expect(after.edges).toHaveLength(1);
    });

    it('rejects updates against unknown node ids', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(
                    emptyDiff({
                        updateNodes: [{ id: 'ghost', title: 'nope' }],
                    }),
                ),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('rejects additions whose id collides with an existing node', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(emptyDiff({ addNodes: [node('a')] })),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('rejects new edges whose endpoints do not exist in the result', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'ghost')] })),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('refuses to apply a proposal that targets a different pathway', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(emptyDiff(), { pathwayId: 'other-pathway' }),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('accepts a cross-pathway proposal when applied to a concrete pathway (edge-add surface only)', () => {
        const before = pathway([node('a'), node('b')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'b')] }), {
                pathwayId: null,
            }),
            LATER,
        );

        expect(after.edges).toHaveLength(1);
    });

    it('is pure — original pathway is not mutated', () => {
        const before = pathway([node('a')]);
        const snapshot = JSON.parse(JSON.stringify(before));

        applyProposal(
            before,
            proposal(emptyDiff({ addNodes: [node('b')] })),
            LATER,
        );

        expect(before).toEqual(snapshot);
    });
});

describe('materializeNewPathway — cross-pathway proposals', () => {
    const OWNER = 'did:test:learner';

    it('creates a fresh pathway from the newPathway hint', () => {
        let i = 0;
        const makeId = () => `mk-${++i}`;

        const result = materializeNewPathway(
            proposal(
                emptyDiff({
                    addNodes: [node('n1', { pathwayId: 'stale' })],
                    newPathway: { title: 'Ship an essay', goal: 'Write 1 essay' },
                }),
                { pathwayId: null, agent: 'matcher', capability: 'matching' },
            ),
            { ownerDid: OWNER, now: LATER, makeId },
        );

        expect(result.title).toBe('Ship an essay');
        expect(result.source).toBe('generated');
        expect(result.ownerDid).toBe(OWNER);
        expect(result.createdAt).toBe(LATER);
        expect(result.nodes[0].pathwayId).toBe(result.id);
    });

    it('throws when called on an in-pathway proposal', () => {
        expect(() =>
            materializeNewPathway(proposal(emptyDiff()), {
                ownerDid: OWNER,
                now: LATER,
            }),
        ).toThrow(ProposalApplyError);
    });

    it('throws when the proposal is cross-pathway but lacks a newPathway hint', () => {
        expect(() =>
            materializeNewPathway(
                proposal(emptyDiff(), { pathwayId: null }),
                { ownerDid: OWNER, now: LATER },
            ),
        ).toThrow(ProposalApplyError);
    });
});
