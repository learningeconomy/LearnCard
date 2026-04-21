import { describe, expect, it } from 'vitest';

import type { ArtifactType, EndorsementRef, Evidence, Pathway, PathwayNode } from '../types';

import { computeTerminationView, terminationDone } from './termination';

const NOW = '2026-04-20T12:00:00.000Z';

const artifact = (
    id: string,
    artifactType: ArtifactType = 'text',
    note = 'wrote something',
): Evidence => ({
    id,
    artifactType,
    note,
    submittedAt: NOW,
});

const endorsement = (id: string, pending = false): EndorsementRef => ({
    endorsementId: pending ? `pending-${id}` : id,
    endorserDid: `did:test:${id}`,
    endorserRelationship: 'mentor',
    trustTier: 'trusted',
});

const node = (
    overrides: Partial<Pick<PathwayNode, 'progress' | 'endorsements'>> = {},
): PathwayNode => ({
    id: 'n1',
    pathwayId: 'p1',
    title: 'n1',
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

// ---------------------------------------------------------------------------
// artifact-count
// ---------------------------------------------------------------------------

describe('computeTerminationView — artifact-count', () => {
    const req = { kind: 'artifact-count', count: 2, artifactType: 'text' as const } as const;

    it('reports 0/2 on a fresh node, not done, with a hint to attach more', () => {
        const view = computeTerminationView(req, node());

        expect(view).toMatchObject({
            kind: 'count',
            current: 0,
            total: 2,
            done: false,
            requirement: '2 notes',
        });

        if (view.kind !== 'count') throw new Error('unreachable');
        expect(view.unmetHint).toMatch(/Attach 2 notes/);
    });

    it('reports 1/2 after one matching artifact is attached', () => {
        const view = computeTerminationView(
            req,
            node({
                progress: {
                    status: 'in-progress',
                    artifacts: [artifact('a1')],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
            }),
        );

        expect(view).toMatchObject({ current: 1, total: 2, done: false });
    });

    it('reports done once the count is reached', () => {
        const view = computeTerminationView(
            req,
            node({
                progress: {
                    status: 'in-progress',
                    artifacts: [artifact('a1'), artifact('a2')],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
            }),
        );

        expect(view).toMatchObject({ current: 2, total: 2, done: true });
        expect(terminationDone(view)).toBe(true);
    });

    it("caps `current` at `total` so a learner who over-attaches doesn't see 3/2", () => {
        const view = computeTerminationView(
            req,
            node({
                progress: {
                    status: 'in-progress',
                    artifacts: [artifact('a1'), artifact('a2'), artifact('a3')],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
            }),
        );

        expect(view).toMatchObject({ current: 2, total: 2, done: true });
    });

    it("only counts artifacts whose type matches the requested one", () => {
        // Termination asks for text; an image attachment doesn't count.
        const view = computeTerminationView(
            req,
            node({
                progress: {
                    status: 'in-progress',
                    artifacts: [artifact('a1', 'image', '')],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
            }),
        );

        expect(view).toMatchObject({ current: 0, total: 2, done: false });
    });

    it('uses singular units when count is 1', () => {
        const view = computeTerminationView(
            { kind: 'artifact-count', count: 1, artifactType: 'text' },
            node(),
        );

        expect(view).toMatchObject({ requirement: '1 note' });
    });
});

// ---------------------------------------------------------------------------
// endorsement
// ---------------------------------------------------------------------------

describe('computeTerminationView — endorsement', () => {
    const req = { kind: 'endorsement', minEndorsers: 2 } as const;

    it("doesn't count pending-* endorsement ids toward done", () => {
        const view = computeTerminationView(
            req,
            node({ endorsements: [endorsement('e1', true), endorsement('e2', true)] }),
        );

        expect(view).toMatchObject({ current: 0, total: 2, done: false });
    });

    it('counts arrived endorsements', () => {
        const view = computeTerminationView(
            req,
            node({
                endorsements: [endorsement('e1'), endorsement('e2', true), endorsement('e3')],
            }),
        );

        expect(view).toMatchObject({ current: 2, total: 2, done: true });
    });
});

// ---------------------------------------------------------------------------
// self-attest & unsupported
// ---------------------------------------------------------------------------

describe('computeTerminationView — self-attest', () => {
    it('is always "ready" — no ring, commit available immediately', () => {
        const view = computeTerminationView(
            { kind: 'self-attest', prompt: 'done' },
            node(),
        );

        expect(view.kind).toBe('ready');
        expect(terminationDone(view)).toBe(true);
    });
});

describe('computeTerminationView — unsupported kinds', () => {
    it('assessment-score reports unsupported with a forward-looking hint', () => {
        const view = computeTerminationView(
            { kind: 'assessment-score', min: 0.8 },
            node(),
        );

        expect(view.kind).toBe('unsupported');
        expect(terminationDone(view)).toBe(false);
    });

    it('composite reports unsupported with a forward-looking hint', () => {
        const view = computeTerminationView(
            {
                kind: 'composite',
                of: [{ kind: 'self-attest', prompt: 'x' }],
                require: 'all',
            },
            node(),
        );

        expect(view.kind).toBe('unsupported');
        expect(terminationDone(view)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// pathway-completed — the partner of a composite policy
// ---------------------------------------------------------------------------

const NESTED_ID = '11111111-1111-4111-8111-111111111111';
const DEST_ID = '22222222-2222-4222-8222-222222222222';

const nestedPathway = (
    opts: {
        destinationCompleted?: boolean;
        totalNodes?: number;
        completedNonDestination?: number;
    } = {},
): Pathway => {
    const destStatus: PathwayNode['progress']['status'] = opts.destinationCompleted
        ? 'completed'
        : 'not-started';

    const total = opts.totalNodes ?? 3;
    const completedNonDest = opts.completedNonDestination ?? 0;

    const nodes: PathwayNode[] = [];

    // Synthesize (total - 1) non-destination nodes.
    for (let i = 0; i < total - 1; i++) {
        nodes.push({
            id: `child-${i}`.padEnd(36, '0'),
            pathwayId: NESTED_ID,
            title: `Child ${i}`,
            stage: {
                initiation: [],
                policy: { kind: 'artifact', prompt: 'x', expectedArtifact: 'text' },
                termination: { kind: 'self-attest', prompt: 'done' },
            },
            endorsements: [],
            progress: {
                status: i < completedNonDest ? 'completed' : 'not-started',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
            createdBy: 'learner',
            createdAt: NOW,
            updatedAt: NOW,
        });
    }

    if (total > 0) {
        nodes.push({
            id: DEST_ID,
            pathwayId: NESTED_ID,
            title: 'AI in Finance Certificate',
            stage: {
                initiation: [],
                policy: { kind: 'self-attest', prompt: 'earn it' } as never,
                termination: { kind: 'self-attest', prompt: 'earn it' },
            },
            endorsements: [],
            progress: {
                status: destStatus,
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
            createdBy: 'learner',
            createdAt: NOW,
            updatedAt: NOW,
        });
    }

    return {
        id: NESTED_ID,
        ownerDid: 'did:key:z-owner',
        title: 'AI in Finance',
        goal: 'master AI',
        nodes,
        edges: [],
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'authored',
        destinationNodeId: total > 0 ? DEST_ID : undefined,
        createdAt: NOW,
        updatedAt: NOW,
    };
};

describe('computeTerminationView — pathway-completed', () => {
    const req = { kind: 'pathway-completed', pathwayRef: NESTED_ID } as const;

    it('returns unsupported with a relinking hint when the referenced pathway is missing', () => {
        const view = computeTerminationView(req, node(), { pathways: {} });

        expect(view.kind).toBe('unsupported');
        expect(terminationDone(view)).toBe(false);

        if (view.kind !== 'unsupported') throw new Error('unreachable');
        expect(view.unmetHint).toMatch(/relink/);
    });

    it("also falls back to unsupported when no ctx is provided (legacy callers)", () => {
        const view = computeTerminationView(req, node());

        expect(view.kind).toBe('unsupported');
    });

    it('reports a count-view with destination-unlocks-done semantics', () => {
        const pw = nestedPathway({
            totalNodes: 4,
            completedNonDestination: 2,
            destinationCompleted: false,
        });

        const view = computeTerminationView(req, node(), {
            pathways: { [pw.id]: pw },
        });

        expect(view.kind).toBe('count');

        if (view.kind !== 'count') throw new Error('unreachable');

        // Not done even though 2/4 generic nodes are complete — the
        // rule is "destination completed", not "50% of steps".
        expect(view.done).toBe(false);
        expect(view.total).toBe(4);
        expect(view.current).toBe(2);
        expect(view.requirement).toMatch(/AI in Finance/);
    });

    it('flips to done the moment the destination is completed', () => {
        const pw = nestedPathway({
            totalNodes: 4,
            completedNonDestination: 1,
            destinationCompleted: true,
        });

        const view = computeTerminationView(req, node(), {
            pathways: { [pw.id]: pw },
        });

        if (view.kind !== 'count') throw new Error('unreachable');

        expect(view.done).toBe(true);
        expect(view.current).toBe(view.total);
        expect(terminationDone(view)).toBe(true);
    });

    it('gives a friendly "no steps yet" hint when the nested pathway is empty', () => {
        const empty = nestedPathway({ totalNodes: 0 });

        const view = computeTerminationView(req, node(), {
            pathways: { [empty.id]: empty },
        });

        if (view.kind !== 'count') throw new Error('unreachable');

        expect(view.done).toBe(false);
        expect(view.unmetHint).toMatch(/no steps yet/);
    });
});
