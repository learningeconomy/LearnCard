import { randomBytes } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuid } from 'uuid';

import { neogma } from '@instance';

import { claimCleanupJobs, completeCleanupJob, getCleanupJob } from '../src/accesslayer/share-link';
import { ensureShareLinkConstraints } from '../src/models/share-link-constraints';

/**
 * LC-2187 namespace-scoped cleanup claim/complete against a REAL Neo4j
 * repository.
 *
 * These specs prove the repository-level namespace filter, the post-lock claim
 * fence and the post-lock completion clock. They use injected explicit clocks
 * (never guessed sleeps) so the timing assertions are deterministic.
 */

const NAMESPACE = 'test-namespace';
const OTHER_NAMESPACE = 'other.example';
const BASE = new Date('2026-09-20T12:00:00.000Z');

const iso = (offsetMs = 0): string => new Date(BASE.getTime() + offsetMs).toISOString();

type CreatedJob = {
    objectRef: string;
    operationId: string;
};

const createCleanupJob = async (options: {
    namespace?: string;
    status?: 'queued' | 'claimed';
    nextAttemptAt?: string;
    claimToken?: string | null;
    claimExpiresAt?: string | null;
    attempts?: number;
}): Promise<CreatedJob> => {
    const objectRef = randomBytes(32).toString('base64url');
    const operationId = uuid();

    await neogma.queryRunner.run(
        `CREATE (c:ShareContentCleanupJob {
            objectRef: $objectRef,
            operationId: $operationId,
            namespace: $namespace,
            ownerProfileId: 'owner-1',
            shareId: $shareId,
            contentVersion: 1,
            reason: 'stopped',
            status: $status,
            attempts: $attempts,
            nextAttemptAt: $nextAttemptAt,
            claimToken: $claimToken,
            claimedBy: $claimedBy,
            claimExpiresAt: $claimExpiresAt,
            lastError: null,
            createdAt: $now,
            updatedAt: $now,
            completedAt: null
        })`,
        {
            objectRef,
            operationId,
            namespace: options.namespace ?? NAMESPACE,
            shareId: randomBytes(16).toString('base64url'),
            status: options.status ?? 'queued',
            attempts: options.attempts ?? 0,
            nextAttemptAt: options.nextAttemptAt ?? iso(),
            claimToken: options.claimToken ?? null,
            claimedBy: options.claimToken ? 'cleaner-1' : null,
            claimExpiresAt: options.claimExpiresAt ?? null,
            now: iso(),
        }
    );

    return { objectRef, operationId };
};

const clearCleanupJobs = async (): Promise<void> => {
    await neogma.queryRunner.run('MATCH (c:ShareContentCleanupJob) DETACH DELETE c');
};

describe('namespace-scoped cleanup claim (real Neo4j)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearCleanupJobs();
    });

    afterAll(async () => {
        await clearCleanupJobs();
    });

    it('never claims a foreign namespace job', async () => {
        const own = await createCleanupJob({ namespace: NAMESPACE });
        const foreign = await createCleanupJob({ namespace: OTHER_NAMESPACE });

        const claimed = await claimCleanupJobs({
            namespace: NAMESPACE,
            claimant: 'cleaner-1',
            now: BASE,
        });

        expect(claimed.jobs.map(job => job.objectRef)).toEqual([own.objectRef]);
        expect(claimed.jobs.map(job => job.objectRef)).not.toContain(foreign.objectRef);
        expect((await getCleanupJob(foreign.objectRef))?.status).toBe('queued');
    });

    it('lets exactly one of two concurrent claims win', async () => {
        const created = await createCleanupJob({ namespace: NAMESPACE });

        const claims = await Promise.all([
            claimCleanupJobs({ namespace: NAMESPACE, claimant: 'a', now: BASE }),
            claimCleanupJobs({ namespace: NAMESPACE, claimant: 'b', now: BASE }),
        ]);

        const claimedJobs = claims.flatMap(claim => claim.jobs);
        expect(claimedJobs).toHaveLength(1);
        expect(claimedJobs[0]?.objectRef).toBe(created.objectRef);
    });

    it('computes the claim expiry from the explicit clock', async () => {
        await createCleanupJob({ namespace: NAMESPACE });

        const claimed = await claimCleanupJobs({
            namespace: NAMESPACE,
            claimant: 'cleaner-1',
            claimMs: 5_000,
            now: BASE,
        });

        expect(claimed.jobs[0]?.claimExpiresAt).toBe(iso(5_000));
    });

    it('rejects a missing namespace before touching the graph', async () => {
        await expect(
            claimCleanupJobs({ namespace: '', claimant: 'cleaner-1', now: BASE })
        ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    });
});

describe('post-lock cleanup completion fence (real Neo4j)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearCleanupJobs();
    });

    afterAll(async () => {
        await clearCleanupJobs();
    });

    it('refuses completion for a stale claim token', async () => {
        const created = await createCleanupJob({
            namespace: NAMESPACE,
            status: 'claimed',
            claimToken: 'token-1',
            claimExpiresAt: iso(5_000),
        });

        const result = await completeCleanupJob({
            objectRef: created.objectRef,
            claimToken: 'not-the-token',
            outcome: 'completed',
            now: BASE,
        });

        expect(result).toEqual({ outcome: 'claim_lost' });
        expect((await getCleanupJob(created.objectRef))?.status).toBe('claimed');
    });

    it('refuses completion once the claim has expired, even while the job lock was held', async () => {
        const created = await createCleanupJob({
            namespace: NAMESPACE,
            status: 'claimed',
            claimToken: 'token-1',
            claimExpiresAt: iso(1_000),
        });

        const driver = neogma.queryRunner.getDriver();
        const holderSession = driver.session();

        let releaseLock!: () => void;
        const lockGate = new Promise<void>(resolve => {
            releaseLock = resolve;
        });
        let signalLocked!: () => void;
        const lockHeld = new Promise<void>(resolve => {
            signalLocked = resolve;
        });

        const holder = holderSession
            .writeTransaction(async tx => {
                await tx.run(
                    `MATCH (c:ShareContentCleanupJob {objectRef: $objectRef})
                     SET c.lockTick = coalesce(c.lockTick, 0) + 1 RETURN c`,
                    { objectRef: created.objectRef }
                );
                signalLocked();
                await lockGate;
            })
            .finally(() => holderSession.close());

        await lockHeld;

        // The completion transaction must wait for the held write lock, then read
        // the (already lapsed) lease with the injectable post-lock clock.
        const completion = completeCleanupJob({
            objectRef: created.objectRef,
            claimToken: 'token-1',
            outcome: 'completed',
            now: new Date(BASE.getTime() + 5_000),
        });

        releaseLock();

        const [result] = await Promise.all([completion, holder]);

        expect(result).toEqual({ outcome: 'claim_lost' });
        expect((await getCleanupJob(created.objectRef))?.status).toBe('claimed');
    });

    it('bounds a maintenance completion under a held lock without an inline retry', async () => {
        const created = await createCleanupJob({
            namespace: NAMESPACE,
            status: 'claimed',
            claimToken: 'token-1',
            claimExpiresAt: iso(60_000),
        });

        const driver = neogma.queryRunner.getDriver();
        const holderSession = driver.session();

        let releaseLock!: () => void;
        const lockGate = new Promise<void>(resolve => {
            releaseLock = resolve;
        });
        let signalLocked!: () => void;
        const lockHeld = new Promise<void>(resolve => {
            signalLocked = resolve;
        });

        const holder = holderSession
            .writeTransaction(async tx => {
                await tx.run(
                    `MATCH (c:ShareContentCleanupJob {objectRef: $objectRef})
                     SET c.lockTick = coalesce(c.lockTick, 0) + 1 RETURN c`,
                    { objectRef: created.objectRef }
                );
                signalLocked();
                await lockGate;
            })
            .finally(() => holderSession.close());

        await lockHeld;

        // Guard so the test can never hang even if the driver ignored the bound.
        const releaseTimer = setTimeout(() => releaseLock(), 5_000);

        try {
            const startedAt = Date.now();
            const completion = completeCleanupJob({
                objectRef: created.objectRef,
                claimToken: 'token-1',
                outcome: 'completed',
                transactionTimeoutMs: 250,
                noInlineRetry: true,
                now: BASE,
            });

            await expect(completion).rejects.toBeTruthy();

            // A bounded attempt fails fast rather than waiting out the lock.
            expect(Date.now() - startedAt).toBeLessThan(3_000);
        } finally {
            clearTimeout(releaseTimer);
            releaseLock();
            await holder;
        }

        // The aborted attempt must not have completed the job.
        expect((await getCleanupJob(created.objectRef))?.status).toBe('claimed');

        // Ordinary managed completion (no maintenance bound) still succeeds.
        const after = await completeCleanupJob({
            objectRef: created.objectRef,
            claimToken: 'token-1',
            outcome: 'completed',
            now: BASE,
        });

        expect(after.outcome).toBe('completed');
    });

    it('returns a transient failure to the queue with backoff and preserves identity', async () => {
        const created = await createCleanupJob({
            namespace: NAMESPACE,
            status: 'claimed',
            claimToken: 'token-1',
            claimExpiresAt: iso(5_000),
        });

        const result = await completeCleanupJob({
            objectRef: created.objectRef,
            claimToken: 'token-1',
            outcome: 'retry',
            errorMessage: 'throttled',
            now: BASE,
        });

        expect(result.outcome).toBe('retry');
        if (result.outcome === 'retry') {
            expect(result.job.status).toBe('queued');
            expect(result.job.attempts).toBe(1);
            expect(Date.parse(result.job.nextAttemptAt)).toBeGreaterThan(BASE.getTime());
            expect(result.job.operationId).toBe(created.operationId);
        }

        const stored = await getCleanupJob(created.objectRef);
        expect(stored?.operationId).toBe(created.operationId);
        expect(stored?.status).toBe('queued');
    });

    it('reclaims after lease expiry and fences the old claim token', async () => {
        const created = await createCleanupJob({
            namespace: NAMESPACE,
            status: 'claimed',
            claimToken: 'old-token',
            claimExpiresAt: iso(1_000),
        });

        const reclaimed = await claimCleanupJobs({
            namespace: NAMESPACE,
            claimant: 'cleaner-2',
            now: new Date(BASE.getTime() + 2_000),
        });

        expect(reclaimed.jobs.map(job => job.objectRef)).toEqual([created.objectRef]);
        expect(reclaimed.claimToken).not.toBe('old-token');

        const stale = await completeCleanupJob({
            objectRef: created.objectRef,
            claimToken: 'old-token',
            outcome: 'completed',
            now: new Date(BASE.getTime() + 2_000),
        });

        expect(stale).toEqual({ outcome: 'claim_lost' });
    });
});
