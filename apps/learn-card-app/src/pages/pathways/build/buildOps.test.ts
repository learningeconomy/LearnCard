import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayNode } from '../types';

import {
    DEFAULT_POLICY,
    DEFAULT_TERMINATION,
    PathwayOwnershipError,
    addEdge,
    addNode,
    addPathwayRefNode,
    assertOwnerDidMatches,
    createNestedPathway,
    makeCompositeStage,
    removeEdge,
    removeNode,
    reorderNodes,
    setAction,
    setCompositePolicy,
    setDestinationNode,
    setNodeOrder,
    setPolicy,
    setTermination,
    stampRevision,
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
    revision: 0,
    schemaVersion: 1,
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

describe('setAction', () => {
    it('sets an ActionDescriptor on the target node and bumps updatedAt', () => {
        const before = pathway([node('a')]);
        const after = setAction(
            before,
            'a',
            { kind: 'app-listing', listingId: 'listing-xyz' },
            opts,
        );

        expect(after).not.toBe(before);
        expect(after.nodes[0].action).toEqual({
            kind: 'app-listing',
            listingId: 'listing-xyz',
        });
        expect(after.nodes[0].updatedAt).toBe(LATER);
        expect(after.updatedAt).toBe(LATER);
    });

    it('replaces an existing action with a new kind', () => {
        const initial = pathway([node('a')]);
        const step1 = setAction(
            initial,
            'a',
            { kind: 'external-url', url: 'https://example.com' },
            opts,
        );
        const step2 = setAction(
            step1,
            'a',
            { kind: 'in-app-route', to: '/wallet' },
            opts,
        );

        expect(step2.nodes[0].action).toEqual({ kind: 'in-app-route', to: '/wallet' });
    });

    it('clears the action when passed null — and removes the key entirely', () => {
        // Build a node that already carries an action by layering the field
        // onto the fixture. `node()` doesn't accept overrides, and we want
        // the fixture helper to stay minimal, so spreading here keeps the
        // test local without widening the helper's signature.
        const nodeWithAction: PathwayNode = {
            ...node('a'),
            action: { kind: 'external-url', url: 'https://example.com' },
        };

        const initial = pathway([nodeWithAction]);
        const cleared = setAction(initial, 'a', null, opts);

        expect('action' in cleared.nodes[0]).toBe(false);
        expect(cleared.nodes[0].updatedAt).toBe(LATER);
    });

    it('is a no-op for unknown node ids (returns the same reference)', () => {
        const before = pathway([node('a')]);
        const after = setAction(
            before,
            'ghost',
            { kind: 'none' },
            opts,
        );

        expect(after).toBe(before);
    });

    it('preserves other fields on the node (stage, progress, createdBy)', () => {
        const before = pathway([node('a')]);
        const after = setAction(before, 'a', { kind: 'none' }, opts);

        expect(after.nodes[0].stage).toEqual(before.nodes[0].stage);
        expect(after.nodes[0].progress).toEqual(before.nodes[0].progress);
        expect(after.nodes[0].createdBy).toEqual(before.nodes[0].createdBy);
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
    revision: 0,
    schemaVersion: 1,
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

describe('reorderNodes', () => {
    it('moves a node to the target index, preserving the others', () => {
        const before = pathway([node('a'), node('b'), node('c'), node('d')]);
        const after = reorderNodes(before, 'c', 0, opts);

        expect(after.nodes.map(n => n.id)).toEqual(['c', 'a', 'b', 'd']);
        expect(after.updatedAt).toBe(LATER);
    });

    it('clamps indices past the end to the last slot', () => {
        const before = pathway([node('a'), node('b'), node('c')]);
        const after = reorderNodes(before, 'a', 99, opts);

        expect(after.nodes.map(n => n.id)).toEqual(['b', 'c', 'a']);
    });

    it('is a no-op when the node is already at the target index', () => {
        const before = pathway([node('a'), node('b'), node('c')]);
        const after = reorderNodes(before, 'b', 1, opts);

        // Identity-preserving no-op so useHistory's skip fires.
        expect(after).toBe(before);
    });

    it('is a no-op when the node id is unknown', () => {
        const before = pathway([node('a'), node('b')]);
        const after = reorderNodes(before, 'ghost', 0, opts);

        expect(after).toBe(before);
    });
});

describe('setNodeOrder', () => {
    it('replaces the nodes array with the supplied ordering', () => {
        const before = pathway([node('a'), node('b'), node('c')]);
        const after = setNodeOrder(before, ['c', 'a', 'b'], opts);

        expect(after.nodes.map(n => n.id)).toEqual(['c', 'a', 'b']);
        expect(after.updatedAt).toBe(LATER);
    });

    it('preserves node object identity for unchanged positions', () => {
        const before = pathway([node('a'), node('b'), node('c')]);
        const after = setNodeOrder(before, ['a', 'c', 'b'], opts);

        // Node `a` didn't move — same reference; `b` and `c` moved
        // but their object references are preserved (we only reordered).
        expect(after.nodes[0]).toBe(before.nodes[0]);
        expect(after.nodes[1]).toBe(before.nodes[2]);
        expect(after.nodes[2]).toBe(before.nodes[1]);
    });

    it('is a no-op (identity-preserving) when the ordering is unchanged', () => {
        const before = pathway([node('a'), node('b'), node('c')]);
        const after = setNodeOrder(before, ['a', 'b', 'c'], opts);

        expect(after).toBe(before);
    });

    it('rejects an ordering with the wrong length (returns input unchanged)', () => {
        const before = pathway([node('a'), node('b'), node('c')]);
        const after = setNodeOrder(before, ['a', 'b'], opts);

        expect(after).toBe(before);
    });

    it('rejects an ordering with an unknown id (returns input unchanged)', () => {
        const before = pathway([node('a'), node('b'), node('c')]);
        const after = setNodeOrder(before, ['a', 'b', 'ghost'], opts);

        expect(after).toBe(before);
    });
});

describe('createNestedPathway', () => {
    it('creates a fresh empty pathway and wires the parent node as composite', () => {
        resetIds();

        const before = pathway([node('a'), node('b')]);
        const result = createNestedPathway(
            before,
            'a',
            { title: 'New nested pathway' },
            opts,
        );

        expect(result).not.toBeNull();
        if (!result) return;

        const { parent, nested } = result;

        // Nested pathway: empty, authored, ownerDid inherited.
        expect(nested.nodes).toEqual([]);
        expect(nested.edges).toEqual([]);
        expect(nested.source).toBe('authored');
        expect(nested.ownerDid).toBe(before.ownerDid);
        expect(nested.title).toBe('New nested pathway');
        expect(nested.status).toBe('active');
        expect(nested.createdAt).toBe(LATER);

        // Parent node `a` now composite-points at the new nested id.
        const composite = parent.nodes.find(n => n.id === 'a');
        expect(composite?.stage.policy).toEqual({
            kind: 'composite',
            pathwayRef: nested.id,
            renderStyle: 'inline-expandable',
        });
        expect(composite?.stage.termination).toEqual({
            kind: 'pathway-completed',
            pathwayRef: nested.id,
        });

        // Unrelated node `b` untouched.
        expect(parent.nodes.find(n => n.id === 'b')).toEqual(
            before.nodes.find(n => n.id === 'b'),
        );
    });

    it('honours an explicit renderStyle', () => {
        resetIds();

        const before = pathway([node('a')]);
        const result = createNestedPathway(
            before,
            'a',
            { title: 'X', renderStyle: 'link-out' },
            opts,
        );

        expect(result).not.toBeNull();
        if (!result) return;

        expect(result.parent.nodes[0].stage.policy).toMatchObject({
            kind: 'composite',
            renderStyle: 'link-out',
        });
    });

    it('returns null when the parent node does not exist', () => {
        // Defensive guard: an orphan nested pathway would be stored
        // forever without any composite ref resolving to it.
        const before = pathway([node('a')]);
        const result = createNestedPathway(before, 'ghost', { title: 'X' }, opts);

        expect(result).toBeNull();
    });

    it('seeds nested pathway at revision 0 with the current schemaVersion', () => {
        // Fresh pathways start at revision 0 — not 1 — so a subsequent
        // mutation (e.g. addNode on the nested pathway) produces a
        // discernible revision bump even for brand-new documents.
        const before = pathway([node('a')]);
        const result = createNestedPathway(
            before,
            'a',
            { title: 'Nested' },
            opts,
        );

        expect(result).not.toBeNull();
        if (!result) return;

        expect(result.nested.revision).toBe(0);
        expect(result.nested.schemaVersion).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Revision bumping — the CAS hinge every mutation must participate in
// ---------------------------------------------------------------------------

describe('stampRevision + per-op revision bumping', () => {
    it('stampRevision increments revision and sets updatedAt together', () => {
        // The helper exists precisely so the two fields can't drift.
        // A mutation that bumps revision without updatedAt (or vice
        // versa) would silently decouple the CAS hinge from what
        // users see.
        const before = pathway();
        const after = stampRevision(before, LATER);

        expect(after.revision).toBe(before.revision + 1);
        expect(after.updatedAt).toBe(LATER);
    });

    it('stampRevision tolerates legacy pathways missing a revision field', () => {
        // Documents persisted before the field shipped lack revision
        // entirely. Treating absence as 0 means the first mutation
        // after upgrade produces revision 1 rather than NaN.
        const legacy = { ...pathway() } as Partial<Pathway> as Pathway;
        delete (legacy as Partial<Pathway>).revision;

        const after = stampRevision(legacy, LATER);

        expect(after.revision).toBe(1);
    });

    it('addNode bumps revision exactly once per call', () => {
        const before = pathway();
        const after = addNode(before, { title: 'a' }, opts);

        expect(after.revision).toBe(before.revision + 1);
    });

    it('removeNode bumps revision on hit, skips on miss (identity-preserving)', () => {
        const before = pathway([node('a')]);

        const hit = removeNode(before, 'a', opts);
        expect(hit.revision).toBe(before.revision + 1);

        const miss = removeNode(before, 'ghost', opts);
        expect(miss).toBe(before); // no-op — same identity, same revision
    });

    it('updateNode bumps revision on hit, skips on miss', () => {
        const before = pathway([node('a')]);

        const hit = updateNode(before, 'a', { title: 'A' }, opts);
        expect(hit.revision).toBe(before.revision + 1);

        const miss = updateNode(before, 'ghost', { title: 'X' }, opts);
        expect(miss).toBe(before);
    });

    it('setPolicy + setTermination each bump revision once', () => {
        const before = pathway([node('a')]);

        const afterPolicy = setPolicy(
            before,
            'a',
            { kind: 'review', fsrs: { stability: 0, difficulty: 0 } },
            opts,
        );
        expect(afterPolicy.revision).toBe(before.revision + 1);

        const afterBoth = setTermination(
            afterPolicy,
            'a',
            { kind: 'artifact-count', count: 1, artifactType: 'text' },
            opts,
        );
        expect(afterBoth.revision).toBe(afterPolicy.revision + 1);
    });

    it('setAction bumps revision on hit, skips on miss', () => {
        const before = pathway([node('a')]);

        const hit = setAction(before, 'a', { kind: 'none' }, opts);
        expect(hit.revision).toBe(before.revision + 1);

        const miss = setAction(before, 'ghost', { kind: 'none' }, opts);
        expect(miss).toBe(before);
    });

    it('setAction preserves an inline `snapshot` payload on the action', () => {
        // The snapshot is the "agents don't need to re-fetch" field; a
        // setter that silently dropped it would defeat the whole point.
        const before = pathway([node('a')]);
        const after = setAction(
            before,
            'a',
            {
                kind: 'app-listing',
                listingId: 'listing-xyz',
                snapshot: {
                    displayName: 'Coursera',
                    category: 'Learning',
                    launchType: 'DIRECT_LINK',
                    tagline: 'Learn AWS basics',
                    iconUrl: 'https://example.com/icon.png',
                    snapshottedAt: LATER,
                },
            },
            opts,
        );

        const action = after.nodes[0].action;
        expect(action?.kind).toBe('app-listing');
        if (action?.kind !== 'app-listing') throw new Error('unreachable');
        expect(action.snapshot?.displayName).toBe('Coursera');
        expect(action.snapshot?.iconUrl).toBe('https://example.com/icon.png');
    });

    it('setDestinationNode bumps revision on change, skips when already set to the same value', () => {
        const before = {
            ...pathway([node('a'), node('b')]),
            destinationNodeId: 'a' as string | undefined,
        };

        const changed = setDestinationNode(before, 'b', opts);
        expect(changed.revision).toBe(before.revision + 1);

        const noop = setDestinationNode(before, 'a', opts);
        expect(noop).toBe(before);
    });

    it('reorderNodes bumps revision on real move, skips on identity-preserving cases', () => {
        const before = pathway([node('a'), node('b'), node('c')]);

        const moved = reorderNodes(before, 'a', 2, opts);
        expect(moved.revision).toBe(before.revision + 1);

        const noop = reorderNodes(before, 'b', 1, opts);
        expect(noop).toBe(before);
    });

    it('setNodeOrder bumps revision on reorder, skips on no-op and on rejection', () => {
        const before = pathway([node('a'), node('b'), node('c')]);

        const reordered = setNodeOrder(before, ['c', 'b', 'a'], opts);
        expect(reordered.revision).toBe(before.revision + 1);

        const sameOrder = setNodeOrder(before, ['a', 'b', 'c'], opts);
        expect(sameOrder).toBe(before);

        const wrongLength = setNodeOrder(before, ['a', 'b'], opts);
        expect(wrongLength).toBe(before);
    });

    it('addEdge bumps revision on insert, skips on dedup / self-loop', () => {
        const before = pathway([node('a'), node('b')]);

        const added = addEdge(before, 'a', 'b', 'prerequisite', opts);
        expect(added.revision).toBe(before.revision + 1);

        const dup = addEdge(added, 'a', 'b', 'prerequisite', opts);
        expect(dup).toBe(added);

        const selfLoop = addEdge(before, 'a', 'a', 'prerequisite', opts);
        expect(selfLoop).toBe(before);
    });

    it('removeEdge bumps revision on hit, skips on miss', () => {
        const before = pathway(
            [node('a'), node('b')],
            [{ id: 'e1', from: 'a', to: 'b', type: 'prerequisite' }],
        );

        const removed = removeEdge(before, 'e1', opts);
        expect(removed.revision).toBe(before.revision + 1);

        const miss = removeEdge(before, 'nonexistent', opts);
        expect(miss).toBe(before);
    });

    it('chained mutations produce a strictly monotonic revision sequence', () => {
        // Integration test for the whole story: every mutation the
        // module exposes bumps revision by exactly one. Any regression
        // where a mutation forgets to stamp will show up here as a
        // non-monotonic sequence.
        let p = pathway();

        p = addNode(p, { title: 'a' }, opts);
        const v1 = p.revision;

        p = addNode(p, { title: 'b' }, opts);
        const v2 = p.revision;

        p = updateNode(p, p.nodes[0].id, { title: 'A' }, opts);
        const v3 = p.revision;

        p = addEdge(p, p.nodes[0].id, p.nodes[1].id, 'prerequisite', opts);
        const v4 = p.revision;

        expect(v1).toBe(1);
        expect(v2).toBe(2);
        expect(v3).toBe(3);
        expect(v4).toBe(4);
    });
});

// ---------------------------------------------------------------------------
// Owner invariants
// ---------------------------------------------------------------------------

describe('assertOwnerDidMatches', () => {
    it('is a no-op when the DID matches', () => {
        const p = pathway();
        expect(() => assertOwnerDidMatches(p, p.ownerDid)).not.toThrow();
    });

    it('throws PathwayOwnershipError when the DID does not match', () => {
        const p = pathway();
        expect(() => assertOwnerDidMatches(p, 'did:test:someone-else')).toThrow(
            PathwayOwnershipError,
        );
    });

    it('is an exact string compare — no case folding', () => {
        // DID equality is byte-exact. Normalizing here would silently
        // accept authz mismatches upstream callers are trying to
        // catch; keep it strict.
        const p = pathway();
        const upper = p.ownerDid.toUpperCase();

        expect(() => assertOwnerDidMatches(p, upper)).toThrow(PathwayOwnershipError);
    });
});
