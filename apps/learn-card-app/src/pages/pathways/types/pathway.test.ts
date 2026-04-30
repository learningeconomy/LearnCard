/**
 * Schema-level tests for `types/pathway.ts`.
 *
 * Keeps the invariants declared on the Zod schema honest. Most of
 * the pathway module is shape + type inference (covered transitively
 * by the core matchers and buildOps tests); this file exists to pin
 * the non-obvious constraints that a future refactor might silently
 * regress:
 *
 *   - `BaseTerminationSchema` is a `discriminatedUnion` (error shape
 *     stays tight when a `kind` doesn't match).
 *   - `NodeProgressSchema`'s status/timestamp invariants fire when
 *     violated (reducer-drift canary).
 */

import { describe, expect, it } from 'vitest';

import { NodeProgressSchema, TerminationSchema } from './pathway';

describe('NodeProgressSchema — status/timestamp invariants', () => {
    // Happy-path baselines first so the failure cases aren't just
    // "everything fails".
    it('accepts a not-started progress with no timestamps', () => {
        const result = NodeProgressSchema.safeParse({
            status: 'not-started',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        });

        expect(result.success).toBe(true);
    });

    it('accepts a completed progress with completedAt set', () => {
        const result = NodeProgressSchema.safeParse({
            status: 'completed',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            startedAt: '2026-04-01T00:00:00.000Z',
            completedAt: '2026-04-20T00:00:00.000Z',
        });

        expect(result.success).toBe(true);
    });

    it('accepts an in-progress progress with startedAt set', () => {
        const result = NodeProgressSchema.safeParse({
            status: 'in-progress',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            startedAt: '2026-04-01T00:00:00.000Z',
        });

        expect(result.success).toBe(true);
    });

    // Now the refine'd failure cases.
    it('rejects completed status without completedAt', () => {
        const result = NodeProgressSchema.safeParse({
            status: 'completed',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            // completedAt missing
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues.find(
                i => i.path.join('.') === 'completedAt',
            );
            expect(issue?.message).toMatch(/completedAt is required/i);
        }
    });

    it('rejects in-progress status without startedAt', () => {
        const result = NodeProgressSchema.safeParse({
            status: 'in-progress',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            // startedAt missing
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues.find(
                i => i.path.join('.') === 'startedAt',
            );
            expect(issue?.message).toMatch(/startedAt is required/i);
        }
    });

    it('rejects completedAt on a non-completed status', () => {
        // Reducer drift: an "un-complete" path that fails to clear
        // the timestamp should be loud, not silent.
        const result = NodeProgressSchema.safeParse({
            status: 'in-progress',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            startedAt: '2026-04-01T00:00:00.000Z',
            completedAt: '2026-04-20T00:00:00.000Z',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues.find(
                i =>
                    i.path.join('.') === 'completedAt'
                    && /only valid on a completed/i.test(i.message),
            );
            expect(issue).toBeDefined();
        }
    });

    it('tolerates startedAt on not-started (fixtures seed planned dates)', () => {
        // Explicitly NOT enforced — some fixtures seed a planned
        // start before the learner moves. If this ever gets
        // tightened, this test flips and we remove the line.
        const result = NodeProgressSchema.safeParse({
            status: 'not-started',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            startedAt: '2026-04-01T00:00:00.000Z',
        });

        expect(result.success).toBe(true);
    });
});

describe('TerminationSchema — discriminatedUnion error shape', () => {
    // Pins the BaseTerminationSchema conversion from z.union to
    // z.discriminatedUnion. The discriminated form surfaces an
    // "invalid discriminator" error that includes the list of valid
    // kinds; the plain-union form used to spray one "expected X"
    // error per branch. Either form lets the parse fail; this test
    // just confirms the conversion didn't regress the basic reject.
    it('rejects an unknown termination kind', () => {
        const result = TerminationSchema.safeParse({
            kind: 'not-a-real-kind',
            prompt: 'x',
        });

        expect(result.success).toBe(false);
    });

    it('accepts a valid leaf termination', () => {
        const result = TerminationSchema.safeParse({
            kind: 'self-attest',
            prompt: 'I did the work.',
        });

        expect(result.success).toBe(true);
    });

    it('accepts a valid composite termination', () => {
        const result = TerminationSchema.safeParse({
            kind: 'composite',
            require: 'all',
            of: [
                { kind: 'self-attest', prompt: 'A' },
                { kind: 'self-attest', prompt: 'B' },
            ],
        });

        expect(result.success).toBe(true);
    });

    it('accepts a requirement-satisfied termination with a full credential-type requirement', () => {
        const result = TerminationSchema.safeParse({
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AwsCloudEssentialsCompletion',
            },
            minTrustTier: 'trusted',
        });

        expect(result.success).toBe(true);
    });
});
