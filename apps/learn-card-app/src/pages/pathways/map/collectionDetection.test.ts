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
    revision: 0,
    schemaVersion: 1,
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

    it('splits a fan-in into sub-groups when members have different incoming prereq sets', () => {
        // Under the relaxed rule #3: members may have incoming
        // prereqs, but only if *every* member in the group shares
        // the exact same set. Mixed incoming sets → the sub-bucket
        // each member falls into can only collapse if it hits
        // MIN_COLLECTION_SIZE on its own. Here sib[0] has a unique
        // upstream; the other 4 are pure fan-in. The 4 clean
        // siblings still form a group; the gated one is left out.
        resetIds();

        const sibs = Array.from({ length: 5 }, () => makeNode());
        const upstream = makeNode();
        const target = makeNode();

        const edges = [
            // sib[0] has a unique incoming prereq (set = {upstream}).
            edge(upstream.id, sibs[0].id),
            // All 5 siblings feed the target.
            ...sibs.map(s => edge(s.id, target.id)),
        ];

        const pathway = makePathway([upstream, ...sibs, target], edges);

        const groups = detectCollections(pathway);

        expect(groups).toHaveLength(1);
        // 4 siblings with empty incoming-set form one group; sib[0]
        // is alone in its incoming bucket and below threshold.
        expect(groups[0].memberIds).toHaveLength(4);
        expect(groups[0].memberIds).not.toContain(sibs[0].id);
        expect(groups[0].sharedPrereqIds).toEqual([]);
        expect(groups[0].incomingEdgeIds).toEqual([]);
    });

    it('groups members that share the SAME incoming prereq (the new behaviour)', () => {
        // Option 2 in action: 5 siblings that all share a single
        // upstream prereq (`Software Development`) and all fan into
        // one downstream target. Under the old rule they would have
        // been scattered individually; under the new rule they form
        // a clean collection, and the synthetic prereq→collection
        // edge will be emitted by MapMode.
        resetIds();

        const upstream = makeNode({ title: 'Software Development' });
        const sibs = Array.from({ length: 5 }, (_, i) =>
            makeNode({ title: `Badge ${i + 1}` }),
        );
        const target = makeNode({ title: 'Certificate' });

        const incomingEdges = sibs.map(s => edge(upstream.id, s.id));
        const outgoingEdges = sibs.map(s => edge(s.id, target.id));

        const pathway = makePathway(
            [upstream, ...sibs, target],
            [...incomingEdges, ...outgoingEdges],
        );

        const groups = detectCollections(pathway);

        expect(groups).toHaveLength(1);
        expect(groups[0].memberIds).toEqual(sibs.map(s => s.id));
        expect(groups[0].targetNodeId).toBe(target.id);
        expect(groups[0].sharedPrereqIds).toEqual([upstream.id]);

        // N × K = 5 × 1 incoming edges → all collected for collapse.
        expect(groups[0].incomingEdgeIds).toHaveLength(5);
        expect(new Set(groups[0].incomingEdgeIds)).toEqual(
            new Set(incomingEdges.map(e => e.id)),
        );

        // Outgoing edges (member → target) unchanged.
        expect(groups[0].edgeIds).toHaveLength(5);
    });

    it('groups members that share MULTIPLE identical incoming prereqs', () => {
        // Two upstream prereqs, both shared by all 4 members.
        // Still a valid collection: the incoming-set key
        // "{upstreamA, upstreamB}" is identical across members.
        resetIds();

        const upstreamA = makeNode({ title: 'Prereq A' });
        const upstreamB = makeNode({ title: 'Prereq B' });
        const sibs = Array.from({ length: 4 }, () => makeNode());
        const target = makeNode();

        const edges = [
            ...sibs.flatMap(s => [
                edge(upstreamA.id, s.id),
                edge(upstreamB.id, s.id),
            ]),
            ...sibs.map(s => edge(s.id, target.id)),
        ];

        const pathway = makePathway(
            [upstreamA, upstreamB, ...sibs, target],
            edges,
        );

        const groups = detectCollections(pathway);

        expect(groups).toHaveLength(1);
        // Sorted by pathway-order.
        expect(groups[0].sharedPrereqIds).toEqual([upstreamA.id, upstreamB.id]);
        // 4 members × 2 prereqs = 8 incoming edges.
        expect(groups[0].incomingEdgeIds).toHaveLength(8);
    });

    it('refuses to group if a shared prereq is also a member', () => {
        // Rule #8 anti-self-loop: a node can't simultaneously be a
        // member AND a shared prereq of its own group. The detector
        // must refuse rather than emit a degenerate collection.
        resetIds();

        const memberA = makeNode();
        const memberB = makeNode();
        const memberC = makeNode();
        const memberD = makeNode(); // This one will also be "upstream"
        const target = makeNode();

        const edges = [
            // memberD is a prereq of A, B, C…
            edge(memberD.id, memberA.id),
            edge(memberD.id, memberB.id),
            edge(memberD.id, memberC.id),
            // …but memberD itself also feeds the target directly —
            // under the sub-bucket rule, only A/B/C share the
            // incoming set {memberD}, which is only 3 members.
            edge(memberA.id, target.id),
            edge(memberB.id, target.id),
            edge(memberC.id, target.id),
            edge(memberD.id, target.id),
        ];

        const pathway = makePathway(
            [memberA, memberB, memberC, memberD, target],
            edges,
        );

        // A/B/C share incoming {memberD}; D has empty incoming.
        // Neither bucket hits MIN_COLLECTION_SIZE (3 and 1).
        expect(detectCollections(pathway)).toEqual([]);
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
            sharedPrereqIds: [],
            edgeIds: [],
            incomingEdgeIds: [],
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
