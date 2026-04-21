import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode, Policy, Termination } from '../types';

import {
    MIN_COLLECTION_SIZE,
    buildCollectionIndex,
    computeCollectionProgress,
    detectCollections,
} from './collectionDetection';

// ---------------------------------------------------------------------------
// Fixtures — small, readable, typed.
// ---------------------------------------------------------------------------

const NOW = '2026-04-21T00:00:00.000Z';

let seq = 0;
const id = () => `id-${++seq}`;
const resetIds = () => {
    seq = 0;
};

const basePolicy = (): Policy => ({
    kind: 'practice',
    cadence: { frequency: 'daily', perPeriod: 1 },
    artifactTypes: ['text'],
});

const baseTermination = (): Termination => ({
    kind: 'self-attest',
    prompt: 'Done?',
});

const makeNode = (
    overrides: Partial<PathwayNode> & { id?: string; title?: string } = {},
): PathwayNode => ({
    id: overrides.id ?? id(),
    pathwayId: 'p1',
    title: overrides.title ?? 'Node',
    stage: {
        initiation: [],
        policy: overrides.stage?.policy ?? basePolicy(),
        termination: overrides.stage?.termination ?? baseTermination(),
    },
    endorsements: [],
    progress: overrides.progress ?? {
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

const edge = (from: string, to: string): Edge => ({
    id: id(),
    from,
    to,
    type: 'prerequisite',
});

const makePathway = (
    nodes: PathwayNode[],
    edges: Edge[],
    destinationNodeId?: string,
): Pathway => ({
    id: 'p1',
    ownerDid: 'did:example:1',
    title: 'P',
    goal: 'G',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    destinationNodeId,
    createdAt: NOW,
    updatedAt: NOW,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectCollections', () => {
    it('detects a clean fan-in group of 4 identical siblings', () => {
        resetIds();

        const siblings = Array.from({ length: 4 }, (_, i) =>
            makeNode({ title: `Badge ${i + 1}` }),
        );
        const target = makeNode({ title: 'Certificate' });
        const edges = siblings.map(s => edge(s.id, target.id));

        const pathway = makePathway([...siblings, target], edges);

        const groups = detectCollections(pathway);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({
            id: `collection-${target.id}`,
            memberIds: siblings.map(s => s.id),
            targetNodeId: target.id,
            policyKind: 'practice',
        });
        expect(groups[0].edgeIds).toHaveLength(4);
    });

    it('does not detect when there are fewer than MIN_COLLECTION_SIZE siblings', () => {
        resetIds();

        const siblings = Array.from({ length: MIN_COLLECTION_SIZE - 1 }, () =>
            makeNode(),
        );
        const target = makeNode();
        const edges = siblings.map(s => edge(s.id, target.id));

        const pathway = makePathway([...siblings, target], edges);

        expect(detectCollections(pathway)).toEqual([]);
    });

    it('rejects mixed-kind groups (shape parity guard)', () => {
        resetIds();

        const practiceSibs = Array.from({ length: 3 }, () =>
            makeNode({
                stage: {
                    initiation: [],
                    policy: basePolicy(),
                    termination: baseTermination(),
                },
            }),
        );

        // One sibling with a different policy kind — pollutes parity.
        const mismatch = makeNode({
            stage: {
                initiation: [],
                policy: {
                    kind: 'assessment',
                    rubric: { criteria: [{ id: 'c', description: 'd', weight: 1 }] },
                },
                termination: { kind: 'assessment-score', min: 70 },
            },
        });

        const target = makeNode();
        const all = [...practiceSibs, mismatch];
        const edges = all.map(s => edge(s.id, target.id));

        const pathway = makePathway([...all, target], edges);

        expect(detectCollections(pathway)).toEqual([]);
    });

    it('rejects a member that has its own incoming prerequisite', () => {
        // Having 5 siblings but one has an upstream prereq — the rewrite
        // would strand that upstream edge. Detector must exclude the
        // gated member; with only 4 clean siblings left we still have a
        // valid group. With 5 siblings and ONE gated, we drop below 5
        // but the threshold is 4 → should still detect the remaining 4.
        resetIds();

        const sibs = Array.from({ length: 5 }, () => makeNode());
        const upstream = makeNode();
        const target = makeNode();

        const edges = [
            // sib[0] is gated by `upstream`: must be excluded from group.
            edge(upstream.id, sibs[0].id),
            ...sibs.map(s => edge(s.id, target.id)),
        ];

        const pathway = makePathway([upstream, ...sibs, target], edges);

        const groups = detectCollections(pathway);

        expect(groups).toHaveLength(1);
        // 5 - 1 gated = 4 remaining, still hitting MIN_COLLECTION_SIZE.
        expect(groups[0].memberIds).toHaveLength(4);
        expect(groups[0].memberIds).not.toContain(sibs[0].id);
    });

    it('excludes the destination node from being a member', () => {
        resetIds();

        // 4 siblings one of which is declared the destination. The
        // destination must always render individually so the learner
        // sees the goal — so we expect the group to drop below the
        // threshold and not form.
        const sibs = Array.from({ length: 4 }, () => makeNode());
        const target = makeNode();
        const edges = sibs.map(s => edge(s.id, target.id));

        const pathway = makePathway([...sibs, target], edges, sibs[0].id);

        const groups = detectCollections(pathway);

        // Dropping the destination leaves 3 members — below threshold.
        expect(groups).toEqual([]);
    });

    it('does not fold a group whose target is inside the group', () => {
        // Wouldn't normally arise (each node has ≤1 outgoing in our
        // candidate scan), but guard anyway: the target must not be a
        // member. Here sib[3] targets itself via a cycle — validation
        // rejects this at author time but the Map shouldn't crash if
        // it ever slips through.
        resetIds();

        const sibs = Array.from({ length: 4 }, () => makeNode());
        const edges = sibs.slice(0, 3).map(s => edge(s.id, sibs[3].id));

        const pathway = makePathway(sibs, edges);

        const groups = detectCollections(pathway);

        // 3 feeders + 1 target, only 3 feeders — below threshold, no
        // group forms. The detector shouldn't include sib[3] as its own
        // member.
        expect(groups).toEqual([]);
    });

    it('detects two independent groups in the same pathway', () => {
        resetIds();

        const badges = Array.from({ length: 4 }, (_, i) =>
            makeNode({ title: `Badge ${i}` }),
        );
        const courses = Array.from({ length: 5 }, (_, i) =>
            makeNode({ title: `Course ${i}` }),
        );

        const certificate = makeNode({ title: 'Certificate' });
        const degree = makeNode({ title: 'Degree' });

        const edges = [
            ...badges.map(b => edge(b.id, certificate.id)),
            ...courses.map(c => edge(c.id, degree.id)),
        ];

        const pathway = makePathway(
            [...badges, ...courses, certificate, degree],
            edges,
        );

        const groups = detectCollections(pathway);

        expect(groups).toHaveLength(2);

        const byTarget = new Map(groups.map(g => [g.targetNodeId, g]));

        expect(byTarget.get(certificate.id)?.memberIds).toHaveLength(4);
        expect(byTarget.get(degree.id)?.memberIds).toHaveLength(5);
    });

    it('returns stable output across calls (ordering is deterministic)', () => {
        resetIds();

        const siblings = Array.from({ length: 4 }, () => makeNode());
        const target = makeNode();
        const edges = siblings.map(s => edge(s.id, target.id));

        const pathway = makePathway([...siblings, target], edges);

        const a = detectCollections(pathway);
        const b = detectCollections(pathway);

        expect(a).toEqual(b);
        expect(a[0].memberIds).toEqual(b[0].memberIds);
        expect(a[0].edgeIds).toEqual(b[0].edgeIds);
    });
});

describe('buildCollectionIndex', () => {
    it('derives per-member and per-edge lookups', () => {
        resetIds();

        const siblings = Array.from({ length: 4 }, () => makeNode());
        const target = makeNode();
        const edges = siblings.map(s => edge(s.id, target.id));

        const pathway = makePathway([...siblings, target], edges);
        const groups = detectCollections(pathway);
        const index = buildCollectionIndex(groups);

        // Each member is folded under exactly this collection.
        for (const sib of siblings) {
            expect(index.memberToGroupId.get(sib.id)).toBe(groups[0].id);
        }

        // Each edge is marked for replacement.
        for (const e of edges) {
            expect(index.edgeToGroupId.get(e.id)).toBe(groups[0].id);
        }

        // Target is not a member — it still renders as itself.
        expect(index.memberToGroupId.get(target.id)).toBeUndefined();
    });
});

describe('computeCollectionProgress', () => {
    it('counts completed members', () => {
        resetIds();

        // Two of four completed.
        const siblings = Array.from({ length: 4 }, (_, i) =>
            makeNode({
                progress: {
                    status: i < 2 ? 'completed' : 'not-started',
                    artifacts: [],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
            }),
        );
        const target = makeNode();
        const edges = siblings.map(s => edge(s.id, target.id));

        const pathway = makePathway([...siblings, target], edges);
        const [group] = detectCollections(pathway);

        const progress = computeCollectionProgress(group, pathway);

        expect(progress).toEqual({ completed: 2, total: 4, fraction: 0.5 });
    });

    it('returns zero-safe fractions when total is 0', () => {
        const empty = {
            id: 'collection-x',
            memberIds: [],
            targetNodeId: 'x',
            edgeIds: [],
            policyKind: 'practice' as const,
        };

        const pathway = makePathway([], []);

        expect(computeCollectionProgress(empty, pathway)).toEqual({
            completed: 0,
            total: 0,
            fraction: 0,
        });
    });
});
