import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayNode } from '../types';

import {
    DEFAULT_POLICY,
    DEFAULT_TERMINATION,
    addEdge,
    addNode,
    removeEdge,
    removeNode,
    setPolicy,
    setTermination,
    updateNode,
} from './buildOps';

const NOW = '2026-04-20T12:00:00.000Z';
const LATER = '2026-04-21T12:00:00.000Z';

let idCounter = 0;
const makeId = () => `id-${++idCounter}`;

const opts = { now: LATER, makeId };

const resetIds = () => {
    idCounter = 0;
};

const node = (id: string, title = id): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title,
    stage: {
        initiation: [],
        policy: DEFAULT_POLICY,
        termination: DEFAULT_TERMINATION,
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

const pathway = (nodes: PathwayNode[] = [], edges: Pathway['edges'] = []): Pathway => ({
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

describe('addNode', () => {
    it('appends a new node with default stage and returns a new pathway', () => {
        resetIds();

        const before = pathway();
        const after = addNode(before, { title: 'New step' }, opts);

        expect(after).not.toBe(before);
        expect(after.nodes).toHaveLength(1);
        expect(after.nodes[0].title).toBe('New step');
        expect(after.nodes[0].stage.policy).toEqual(DEFAULT_POLICY);
        expect(after.nodes[0].stage.termination).toEqual(DEFAULT_TERMINATION);
        expect(after.nodes[0].createdAt).toBe(LATER);
        expect(after.updatedAt).toBe(LATER);
    });

    it('preserves the existing node order when appending', () => {
        resetIds();

        const before = pathway([node('a'), node('b')]);
        const after = addNode(before, { title: 'c' }, opts);

        expect(after.nodes.map(n => n.title)).toEqual(['a', 'b', 'c']);
    });
});

describe('removeNode', () => {
    it('removes the target node and drops any edge that referenced it', () => {
        const before = pathway(
            [node('a'), node('b'), node('c')],
            [
                { id: 'e1', from: 'a', to: 'b', type: 'prerequisite' },
                { id: 'e2', from: 'b', to: 'c', type: 'prerequisite' },
                { id: 'e3', from: 'a', to: 'c', type: 'prerequisite' },
            ],
        );

        const after = removeNode(before, 'b', opts);

        expect(after.nodes.map(n => n.id)).toEqual(['a', 'c']);
        expect(after.edges.map(e => e.id)).toEqual(['e3']);
    });

    it('is a no-op when the node does not exist', () => {
        const before = pathway([node('a')]);
        const after = removeNode(before, 'ghost', opts);

        expect(after.nodes).toEqual(before.nodes);
        expect(after.edges).toEqual(before.edges);
    });
});

describe('updateNode', () => {
    it('patches title and description and bumps updatedAt', () => {
        const before = pathway([node('a', 'old title')]);
        const after = updateNode(before, 'a', { title: 'new title', description: 'd' }, opts);

        expect(after.nodes[0].title).toBe('new title');
        expect(after.nodes[0].description).toBe('d');
        expect(after.nodes[0].updatedAt).toBe(LATER);
    });

    it('leaves other nodes untouched', () => {
        const before = pathway([node('a'), node('b')]);
        const after = updateNode(before, 'a', { title: 'A' }, opts);

        expect(after.nodes[1]).toEqual(before.nodes[1]);
    });
});

describe('setPolicy / setTermination', () => {
    it('replaces the policy in-place', () => {
        const before = pathway([node('a')]);
        const after = setPolicy(
            before,
            'a',
            { kind: 'review', fsrs: { stability: 0, difficulty: 0 } },
            opts,
        );

        expect(after.nodes[0].stage.policy.kind).toBe('review');
        expect(after.nodes[0].updatedAt).toBe(LATER);
    });

    it('replaces the termination in-place', () => {
        const before = pathway([node('a')]);
        const after = setTermination(
            before,
            'a',
            { kind: 'artifact-count', count: 3, artifactType: 'text' },
            opts,
        );

        expect(after.nodes[0].stage.termination.kind).toBe('artifact-count');
    });
});

describe('addEdge / removeEdge', () => {
    it('adds an edge and returns a new pathway', () => {
        resetIds();

        const before = pathway([node('a'), node('b')]);
        const after = addEdge(before, 'a', 'b', 'prerequisite', opts);

        expect(after.edges).toHaveLength(1);
        expect(after.edges[0]).toMatchObject({ from: 'a', to: 'b', type: 'prerequisite' });
    });

    it('refuses self-loops', () => {
        const before = pathway([node('a')]);
        const after = addEdge(before, 'a', 'a', 'prerequisite', opts);

        expect(after.edges).toEqual([]);
    });

    it('deduplicates identical edges', () => {
        const before = pathway(
            [node('a'), node('b')],
            [{ id: 'e1', from: 'a', to: 'b', type: 'prerequisite' }],
        );

        const after = addEdge(before, 'a', 'b', 'prerequisite', opts);

        expect(after.edges).toHaveLength(1);
    });

    it('removes an edge by id', () => {
        const before = pathway(
            [node('a'), node('b')],
            [{ id: 'e1', from: 'a', to: 'b', type: 'prerequisite' }],
        );

        const after = removeEdge(before, 'e1', opts);

        expect(after.edges).toEqual([]);
    });
});
