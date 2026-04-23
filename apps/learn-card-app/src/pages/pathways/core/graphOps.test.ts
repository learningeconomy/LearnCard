import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode } from '../types';

import {
    ancestors,
    availableNodes,
    buildAdjacency,
    canReach,
    descendants,
    neighborhood,
    prereqProgress,
    rootNodes,
    validatePathway,
} from './graphOps';

// -----------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------

const NOW = '2026-04-20T00:00:00.000Z';

const node = (id: string, status: PathwayNode['progress']['status'] = 'not-started'): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title: id,
    stage: {
        initiation: [],
        policy: { kind: 'artifact', prompt: 'stub', expectedArtifact: 'text' },
        termination: { kind: 'self-attest', prompt: 'done' },
    },
    endorsements: [],
    progress: {
        status,
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
});

const edge = (id: string, from: string, to: string, type: Edge['type'] = 'prerequisite'): Edge => ({
    id,
    from,
    to,
    type,
});

const pathway = (nodes: PathwayNode[], edges: Edge[]): Pathway => ({
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

// -----------------------------------------------------------------

describe('buildAdjacency', () => {
    it('populates empty sets for every node even when no edges touch it', () => {
        const p = pathway([node('a'), node('b')], []);
        const adj = buildAdjacency(p);

        expect(adj.prereqs.get('a')?.size).toBe(0);
        expect(adj.dependents.get('b')?.size).toBe(0);
    });

    it('separates prerequisite edges from related edges', () => {
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('e1', 'a', 'b'), edge('e2', 'b', 'c', 'alternative')],
        );
        const adj = buildAdjacency(p);

        expect(adj.prereqs.get('b')?.has('a')).toBe(true);
        expect(adj.dependents.get('a')?.has('b')).toBe(true);
        expect(adj.related.get('b')?.has('c')).toBe(true);
        expect(adj.prereqs.get('c')?.has('b')).toBe(false);
    });
});

describe('ancestors / descendants / canReach', () => {
    // a -> b -> c -> d,  e -> c
    const p = pathway(
        [node('a'), node('b'), node('c'), node('d'), node('e')],
        [
            edge('1', 'a', 'b'),
            edge('2', 'b', 'c'),
            edge('3', 'c', 'd'),
            edge('4', 'e', 'c'),
        ],
    );

    it('ancestors follows prerequisite edges transitively', () => {
        expect(ancestors(p, 'd')).toEqual(new Set(['c', 'b', 'e', 'a']));
    });

    it('descendants follows prerequisite edges transitively', () => {
        expect(descendants(p, 'a')).toEqual(new Set(['b', 'c', 'd']));
    });

    it('canReach is a simple containment check on descendants', () => {
        expect(canReach(p, 'a', 'd')).toBe(true);
        expect(canReach(p, 'd', 'a')).toBe(false);
        expect(canReach(p, 'a', 'e')).toBe(false);
    });
});

describe('validatePathway', () => {
    it('accepts a well-formed DAG', () => {
        const p = pathway(
            [node('a'), node('b')],
            [edge('1', 'a', 'b')],
        );

        expect(validatePathway(p)).toEqual([]);
    });

    it('flags cycles', () => {
        const p = pathway(
            [node('a'), node('b')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'a')],
        );

        const issues = validatePathway(p);

        expect(issues.some(i => i.kind === 'cycle')).toBe(true);
    });

    it('flags self-loops', () => {
        const p = pathway([node('a')], [edge('1', 'a', 'a')]);

        const issues = validatePathway(p);

        expect(issues.some(i => i.kind === 'self-loop')).toBe(true);
    });

    it('flags unknown node references', () => {
        const p = pathway([node('a')], [edge('1', 'a', 'ghost')]);

        const issues = validatePathway(p);

        expect(issues.some(i => i.kind === 'unknown-node-reference')).toBe(true);
    });

    it('flags duplicate node ids', () => {
        const p = pathway([node('a'), node('a')], []);

        const issues = validatePathway(p);

        expect(issues.some(i => i.kind === 'duplicate-node-id')).toBe(true);
    });
});

describe('availableNodes', () => {
    it('returns only nodes whose prereqs are completed and which are not themselves completed', () => {
        // a(completed) -> b, a -> c, b -> d
        const p = pathway(
            [node('a', 'completed'), node('b'), node('c'), node('d')],
            [edge('1', 'a', 'b'), edge('2', 'a', 'c'), edge('3', 'b', 'd')],
        );

        const avail = availableNodes(p).map(n => n.id).sort();

        expect(avail).toEqual(['b', 'c']);
    });

    it('excludes skipped nodes', () => {
        const p = pathway(
            [node('a', 'completed'), node('b', 'skipped'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'a', 'c')],
        );

        const avail = availableNodes(p).map(n => n.id);

        expect(avail).toEqual(['c']);
    });
});

describe('rootNodes', () => {
    it('returns nodes with no prerequisite edges pointing at them', () => {
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'a', 'c')],
        );

        expect(rootNodes(p).map(n => n.id)).toEqual(['a']);
    });
});

// ---------------------------------------------------------------------------
// prereqProgress — per-node gating for Map card affordances
// ---------------------------------------------------------------------------

describe('prereqProgress', () => {
    it('returns zero/zero/un-gated for a root node (no incoming prereq edges)', () => {
        const p = pathway([node('a')], []);

        expect(prereqProgress(p, 'a')).toEqual({ total: 0, met: 0, gated: false });
    });

    it('counts every direct prerequisite edge, regardless of completion', () => {
        // Fan-in: a, b, c → d. With nothing completed, all three are
        // unmet, and d is gated.
        const p = pathway(
            [node('a'), node('b'), node('c'), node('d')],
            [edge('1', 'a', 'd'), edge('2', 'b', 'd'), edge('3', 'c', 'd')],
        );

        expect(prereqProgress(p, 'd')).toEqual({ total: 3, met: 0, gated: true });
    });

    it('reports partial progress accurately — this is the IMA destination case', () => {
        // Mirrors the IMA AI in Finance fan-in: 6 children into a
        // certificate destination, two completed. This is the exact
        // state the Map card should render as "2/6 · Locked".
        const p = pathway(
            [
                node('c1', 'completed'),
                node('c2', 'completed'),
                node('c3'),
                node('c4'),
                node('c5'),
                node('c6'),
                node('cert'),
            ],
            [
                edge('1', 'c1', 'cert'),
                edge('2', 'c2', 'cert'),
                edge('3', 'c3', 'cert'),
                edge('4', 'c4', 'cert'),
                edge('5', 'c5', 'cert'),
                edge('6', 'c6', 'cert'),
            ],
        );

        expect(prereqProgress(p, 'cert')).toEqual({ total: 6, met: 2, gated: true });
    });

    it('is un-gated the moment every direct prerequisite is completed', () => {
        const p = pathway(
            [node('a', 'completed'), node('b', 'completed'), node('c')],
            [edge('1', 'a', 'c'), edge('2', 'b', 'c')],
        );

        expect(prereqProgress(p, 'c')).toEqual({ total: 2, met: 2, gated: false });
    });

    it('ignores non-prerequisite edges (alternative/related edges do not gate)', () => {
        // c has one prerequisite (a) and one alternative (b). Only
        // the prerequisite counts for gating.
        const p = pathway(
            [node('a', 'completed'), node('b'), node('c')],
            [edge('1', 'a', 'c'), edge('2', 'b', 'c', 'alternative')],
        );

        expect(prereqProgress(p, 'c')).toEqual({ total: 1, met: 1, gated: false });
    });

    it('tolerates lookups against unknown node ids without throwing', () => {
        const p = pathway([node('a')], []);

        expect(prereqProgress(p, 'ghost')).toEqual({ total: 0, met: 0, gated: false });
    });

    it('only counts *direct* prerequisites, not transitive ones', () => {
        // a → b → c. From c's perspective, only b is a direct
        // prereq; a is transitive and does not gate c directly.
        // Even though a is not complete, c is un-gated because b is.
        const p = pathway(
            [node('a'), node('b', 'completed'), node('c')],
            [edge('1', 'a', 'b'), edge('2', 'b', 'c')],
        );

        expect(prereqProgress(p, 'c')).toEqual({ total: 1, met: 1, gated: false });
    });
});

describe('neighborhood', () => {
    // Line graph: a -> b -> c -> d -> e
    const line = pathway(
        [node('a'), node('b'), node('c'), node('d'), node('e')],
        [
            edge('1', 'a', 'b'),
            edge('2', 'b', 'c'),
            edge('3', 'c', 'd'),
            edge('4', 'd', 'e'),
        ],
    );

    it('returns focus alone at radius 0', () => {
        const nb = neighborhood(line, 'c', 0);

        expect(nb.nodeIds).toEqual(new Set(['c']));
        expect(nb.depthByNode.get('c')).toBe(0);
        expect(nb.edgeIds.size).toBe(0);
    });

    it('expands in both directions on the undirected graph', () => {
        const nb = neighborhood(line, 'c', 1);

        expect(nb.nodeIds).toEqual(new Set(['b', 'c', 'd']));
        expect(nb.depthByNode.get('b')).toBe(1);
        expect(nb.depthByNode.get('d')).toBe(1);
    });

    it('depth-2 covers the canonical progressive-disclosure window', () => {
        const nb = neighborhood(line, 'c', 2);

        expect(nb.nodeIds).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
        expect(nb.depthByNode.get('a')).toBe(2);
        expect(nb.depthByNode.get('e')).toBe(2);
    });

    it('only includes edges whose endpoints are both inside the neighborhood', () => {
        const nb = neighborhood(line, 'c', 1);

        // Edges b-c and c-d are both inside; a-b and d-e are not.
        expect(nb.edgeIds.size).toBe(2);
    });

    it('returns an empty neighborhood if the focus node does not exist', () => {
        const nb = neighborhood(line, 'ghost', 2);

        expect(nb.nodeIds.size).toBe(0);
        expect(nb.edgeIds.size).toBe(0);
    });

    it('follows related (non-prerequisite) edges as well as prerequisites', () => {
        const p = pathway(
            [node('a'), node('b'), node('c')],
            [edge('1', 'a', 'b', 'alternative'), edge('2', 'b', 'c')],
        );

        const nb = neighborhood(p, 'a', 2);

        expect(nb.nodeIds).toEqual(new Set(['a', 'b', 'c']));
    });
});
