import { describe, expect, it } from 'vitest';

import type { ArtifactType, EndorsementRef, Evidence, PathwayNode } from '../types';

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
