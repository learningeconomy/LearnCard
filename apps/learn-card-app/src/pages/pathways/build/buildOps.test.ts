import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayNode } from '../types';

import {
    DEFAULT_POLICY,
    DEFAULT_TERMINATION,
    addEdge,
    addNode,
    addPathwayRefNode,
    makeCompositeStage,
    removeEdge,
    removeNode,
    setCompositePolicy,
    setDestinationNode,
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

// ---------------------------------------------------------------------------
// Composite ops — nesting + composition via pathway refs
// ---------------------------------------------------------------------------

const uuidFor = (suffix: string) =>
    `${suffix.padEnd(8, '0').slice(0, 8)}-0000-4000-8000-000000000000`;

const makeChildPathway = (id: string, title = 'Child'): Pathway => ({
    id,
    ownerDid: 'did:test:learner',
    title,
    goal: 'child goal',
    nodes: [],
    edges: [],
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: NOW,
    updatedAt: NOW,
});

describe('makeCompositeStage', () => {
    it('pairs a composite policy with a matching pathway-completed termination', () => {
        const ref = uuidFor('ref');
        const stage = makeCompositeStage(ref);

        expect(stage.policy.kind).toBe('composite');

        if (stage.policy.kind !== 'composite') throw new Error('unreachable');
        expect(stage.policy.pathwayRef).toBe(ref);
        expect(stage.policy.renderStyle).toBe('inline-expandable');

        expect(stage.termination).toEqual({ kind: 'pathway-completed', pathwayRef: ref });
    });

    it('honors an explicit renderStyle override', () => {
        const ref = uuidFor('ref');
        const stage = makeCompositeStage(ref, 'link-out');

        if (stage.policy.kind !== 'composite') throw new Error('unreachable');
        expect(stage.policy.renderStyle).toBe('link-out');
    });
});

describe('setCompositePolicy', () => {
    it('flips a node to composite + pathway-completed in one atomic operation', () => {
        const childId = uuidFor('child');
        const child = makeChildPathway(childId);

        const before = pathway([node('a')]);
        const result = setCompositePolicy(
            before,
            'a',
            childId,
            { [before.id]: before, [childId]: child },
            'inline-expandable',
            opts,
        );

        expect(result.ok).toBe(true);

        if (!result.ok) throw new Error('unreachable');

        const n = result.pathway.nodes[0];

        expect(n.stage.policy.kind).toBe('composite');
        expect(n.stage.termination.kind).toBe('pathway-completed');

        if (n.stage.policy.kind !== 'composite') throw new Error('unreachable');
        expect(n.stage.policy.pathwayRef).toBe(childId);

        if (n.stage.termination.kind !== 'pathway-completed') throw new Error('unreachable');
        expect(n.stage.termination.pathwayRef).toBe(childId);
    });

    it('refuses to embed the parent pathway in itself', () => {
        const before = pathway([node('a')]);
        const result = setCompositePolicy(
            before,
            'a',
            before.id,
            { [before.id]: before },
            'inline-expandable',
            opts,
        );

        expect(result).toEqual({ ok: false, reason: 'self' });
    });

    it('refuses to embed a pathway that is not loaded', () => {
        const before = pathway([node('a')]);
        const result = setCompositePolicy(
            before,
            'a',
            uuidFor('ghost'),
            { [before.id]: before },
            'inline-expandable',
            opts,
        );

        expect(result).toEqual({ ok: false, reason: 'missing-target' });
    });

    it('refuses to create a cycle across pathway refs', () => {
        const parentId = uuidFor('par');
        const childId = uuidFor('chi');

        const parent: Pathway = {
            ...pathway([node('a')]),
            id: parentId,
        };

        const child: Pathway = {
            ...makeChildPathway(childId),
            nodes: [
                {
                    ...node('b'),
                    pathwayId: childId,
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'composite',
                            pathwayRef: parentId,
                            renderStyle: 'inline-expandable',
                        },
                        termination: { kind: 'pathway-completed', pathwayRef: parentId },
                    },
                },
            ],
        };

        const result = setCompositePolicy(
            parent,
            'a',
            childId,
            { [parent.id]: parent, [child.id]: child },
            'inline-expandable',
            opts,
        );

        expect(result).toEqual({ ok: false, reason: 'cycle' });
    });
});

describe('addPathwayRefNode', () => {
    it('creates a new node and wires it as a composite reference in one call', () => {
        resetIds();

        const childId = uuidFor('child');
        const child = makeChildPathway(childId, 'AI in Finance');
        const before = pathway();

        const result = addPathwayRefNode(
            before,
            {
                title: 'Earn AI in Finance',
                pathwayRef: childId,
                renderStyle: 'link-out',
            },
            { [before.id]: before, [childId]: child },
            opts,
        );

        expect(result.ok).toBe(true);

        if (!result.ok) throw new Error('unreachable');

        expect(result.pathway.nodes).toHaveLength(1);

        const n = result.pathway.nodes[0];

        expect(n.title).toBe('Earn AI in Finance');
        expect(n.stage.policy.kind).toBe('composite');

        if (n.stage.policy.kind !== 'composite') throw new Error('unreachable');
        expect(n.stage.policy.renderStyle).toBe('link-out');
    });

    it('propagates the cycle-detection refusal from setCompositePolicy', () => {
        const before = pathway();

        const result = addPathwayRefNode(
            before,
            { title: 'Self', pathwayRef: before.id },
            { [before.id]: before },
            opts,
        );

        expect(result).toEqual({ ok: false, reason: 'self' });
    });
});

describe('setDestinationNode', () => {
    it('sets destinationNodeId and bumps updatedAt', () => {
        const before = pathway([node('a'), node('b')]);
        const after = setDestinationNode(before, 'a', opts);

        expect(after.destinationNodeId).toBe('a');
        expect(after.updatedAt).toBe(LATER);
        expect(after).not.toBe(before);
    });

    it('replaces an existing destination atomically (no "unset" needed on the prior node)', () => {
        const before = {
            ...pathway([node('a'), node('b')]),
            destinationNodeId: 'a' as string | undefined,
        };
        const after = setDestinationNode(before, 'b', opts);

        expect(after.destinationNodeId).toBe('b');
    });

    it('clears the destination when passed null', () => {
        const before = {
            ...pathway([node('a')]),
            destinationNodeId: 'a' as string | undefined,
        };
        const after = setDestinationNode(before, null, opts);

        expect(after.destinationNodeId).toBeUndefined();
    });

    it('is a no-op (same object identity) when the id is already the destination', () => {
        // Preserving identity lets callers use `===` to detect real
        // change events — important for history/offline-queue which
        // should not record phantom transactions.
        const before = {
            ...pathway([node('a')]),
            destinationNodeId: 'a' as string | undefined,
        };
        const after = setDestinationNode(before, 'a', opts);

        expect(after).toBe(before);
    });

    it('is a no-op when the id does not belong to the pathway', () => {
        const before = pathway([node('a')]);
        const after = setDestinationNode(before, 'ghost', opts);

        expect(after).toBe(before);
    });
});
