import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayNode } from '../types';

import { collectFsrsDue, scheduleReview } from './fsrsScheduler';

const NOW = '2026-04-20T12:00:00.000Z';

const reviewNode = (
    id: string,
    dueAt: string | undefined,
    status: PathwayNode['progress']['status'] = 'not-started',
): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title: id,
    stage: {
        initiation: [],
        policy: {
            kind: 'review',
            fsrs: { stability: 3, difficulty: 2, lastReviewAt: NOW, dueAt },
        },
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

const pathway = (nodes: PathwayNode[]): Pathway => ({
    id: 'p1',
    ownerDid: 'did:test:learner',
    title: 'Test',
    goal: 'Test',
    nodes,
    edges: [],
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: NOW,
    updatedAt: NOW,
});

describe('collectFsrsDue', () => {
    it('returns review nodes with a scheduled dueAt', () => {
        const p = pathway([
            reviewNode('a', '2026-04-20T10:00:00.000Z'),
            reviewNode('b', '2026-04-21T00:00:00.000Z'),
        ]);

        expect(collectFsrsDue(p)).toEqual([
            { nodeId: 'a', dueAt: '2026-04-20T10:00:00.000Z' },
            { nodeId: 'b', dueAt: '2026-04-21T00:00:00.000Z' },
        ]);
    });

    it('skips review nodes with no dueAt', () => {
        const p = pathway([reviewNode('a', undefined)]);

        expect(collectFsrsDue(p)).toEqual([]);
    });

    it('excludes completed and skipped nodes', () => {
        const p = pathway([
            reviewNode('a', NOW, 'completed'),
            reviewNode('b', NOW, 'skipped'),
            reviewNode('c', NOW),
        ]);

        expect(collectFsrsDue(p).map(e => e.nodeId)).toEqual(['c']);
    });

    it('ignores non-review policies', () => {
        const nonReview: PathwayNode = {
            ...reviewNode('a', NOW),
            stage: {
                initiation: [],
                policy: { kind: 'artifact', prompt: 'x', expectedArtifact: 'text' },
                termination: { kind: 'self-attest', prompt: 'done' },
            },
        };

        expect(collectFsrsDue(pathway([nonReview]))).toEqual([]);
    });
});

describe('scheduleReview', () => {
    it('resets stability and brings due forward on "again"', () => {
        const outcome = scheduleReview(
            { stability: 5, difficulty: 2 },
            'again',
            NOW,
        );

        expect(outcome.fsrs.stability).toBe(0);
        expect(outcome.fsrs.difficulty).toBe(3);
        expect(outcome.dueAt).toBe(NOW); // 0-day interval
    });

    it('pushes due further out on "easy" than "good" than "hard"', () => {
        const base = { stability: 3, difficulty: 2 };

        const easy = new Date(scheduleReview(base, 'easy', NOW).dueAt).getTime();
        const good = new Date(scheduleReview(base, 'good', NOW).dueAt).getTime();
        const hard = new Date(scheduleReview(base, 'hard', NOW).dueAt).getTime();

        expect(easy).toBeGreaterThan(good);
        expect(good).toBeGreaterThan(hard);
    });

    it('stamps lastReviewAt with the given now', () => {
        const outcome = scheduleReview({ stability: 1, difficulty: 1 }, 'good', NOW);

        expect(outcome.fsrs.lastReviewAt).toBe(NOW);
    });
});
