import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    clearPendingContractSyncJob,
    enqueuePendingContractSync,
    hydratePendingContractSyncJobs,
    pendingContractSyncStore,
} from './pendingContractSyncStore';

afterEach(() => vi.useRealTimers());

const JOB_INPUT = {
    profileDid: 'did:web:network.learncard.com:users:learner',
    contractUri: 'lc:network:network.learncard.com/trpc:contract:abc',
    termsUri: 'lc:network:network.learncard.com/trpc:terms:def',
    ownerDid: 'did:web:network.learncard.com:users:owner',
};

describe('pendingContractSyncStore', () => {
    beforeEach(async () => {
        await hydratePendingContractSyncJobs();
        await Promise.all(
            Object.keys(pendingContractSyncStore.get.jobs()).map(clearPendingContractSyncJob)
        );
    });

    it('persists concurrent distinct enqueues and same-job updates without losing either job', async () => {
        const [first, second] = await Promise.all([
            enqueuePendingContractSync({
                kind: 'credential',
                profileDid: JOB_INPUT.profileDid,
                record: { id: 'a', uri: 'credential:a', category: 'Achievement' },
                category: 'Achievement',
            }),
            enqueuePendingContractSync({
                kind: 'credential',
                profileDid: JOB_INPUT.profileDid,
                record: { id: 'b', uri: 'credential:b', category: 'Achievement' },
                category: 'Achievement',
            }),
        ]);

        await Promise.all([
            pendingContractSyncStore.set.recordTermsSynced(first.id, 'terms:acknowledged'),
            pendingContractSyncStore.set.setFailedContractUris(second.id, ['contract:failed']),
            pendingContractSyncStore.set.setTotals(first.id, 1),
            pendingContractSyncStore.set.recordCredentialProcessed(first.id),
            pendingContractSyncStore.set.recordCredentialSynced(
                first.id,
                'Achievement',
                'shared:a'
            ),
        ]);
        await hydratePendingContractSyncJobs();

        const jobs = pendingContractSyncStore.get.jobs();
        expect(jobs[first.id]).toMatchObject({
            kind: 'credential',
            syncedTermsUris: ['terms:acknowledged'],
            totalCredentials: 1,
            processedCredentials: 1,
            completedCredentials: 1,
        });
        expect(jobs[second.id]).toMatchObject({
            kind: 'credential',
            failedContractUris: ['contract:failed'],
        });
        expect(Object.keys(jobs)).toEqual(expect.arrayContaining([first.id, second.id]));
    });

    it('dedupes concurrent queued jobs by profile, contract, terms, and owner', async () => {
        const [first, second] = await Promise.all([
            enqueuePendingContractSync(JOB_INPUT),
            enqueuePendingContractSync(JOB_INPUT),
        ]);

        expect(first.id).toBe(second.id);
        expect(Object.keys(pendingContractSyncStore.get.jobs())).toEqual([first.id]);
        expect(second.status).toBe('queued');
    });

    it('tracks progress by unique shared URI and completed credential count', async () => {
        const job = await enqueuePendingContractSync(JOB_INPUT);
        await pendingContractSyncStore.set.claimJob(job.id);
        await pendingContractSyncStore.set.setTotals(job.id, 2);
        await Promise.all([
            pendingContractSyncStore.set.recordCredentialProcessed(job.id),
            pendingContractSyncStore.set.recordCredentialProcessed(job.id),
            pendingContractSyncStore.set.recordCredentialProcessed(job.id),
            pendingContractSyncStore.set.recordCredentialSynced(
                job.id,
                'Achievement',
                'uri:shared:1'
            ),
            pendingContractSyncStore.set.recordCredentialSynced(
                job.id,
                'Achievement',
                'uri:shared:1'
            ),
            pendingContractSyncStore.set.recordCredentialSynced(job.id, 'ID', 'uri:shared:2'),
        ]);

        const updated = pendingContractSyncStore.get.jobs()[job.id];
        expect(updated.processedCredentials).toBe(3);
        expect(updated.completedCredentials).toBe(2);
        expect(updated.syncedSharedUrisByCategory.Achievement).toEqual(['uri:shared:1']);
        expect(updated.syncedSharedUrisByCategory.ID).toEqual(['uri:shared:2']);
    });

    it('re-enqueues completed jobs as fresh jobs but preserves unfinished acknowledgments', async () => {
        const input = {
            kind: 'credential' as const,
            profileDid: JOB_INPUT.profileDid,
            record: { id: 'saved', uri: 'credential', category: 'Achievement' as const },
            category: 'Achievement' as const,
        };
        const job = await enqueuePendingContractSync(input);
        await pendingContractSyncStore.set.recordTermsSynced(job.id, 'terms:a');
        await pendingContractSyncStore.set.setFailedContractUris(job.id, ['contract:a']);
        await pendingContractSyncStore.set.markError(job.id, 'offline');
        const retry = await enqueuePendingContractSync({ ...input, syncedTermsUris: ['terms:b'] });

        expect(retry.kind === 'credential' && retry.syncedTermsUris).toEqual([
            'terms:a',
            'terms:b',
        ]);
        expect(retry.kind === 'credential' && retry.failedContractUris).toEqual(['contract:a']);

        await pendingContractSyncStore.set.markDone(job.id);
        const fresh = await enqueuePendingContractSync(input);
        expect(fresh.status).toBe('queued');
        expect(fresh.kind === 'credential' && fresh.syncedTermsUris).toEqual([]);
        expect(fresh.kind === 'credential' && fresh.failedContractUris).toBeUndefined();
    });

    it('reclaims an expired attempt from durable state and fences its late updates', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        const job = await enqueuePendingContractSync({
            kind: 'credential',
            profileDid: JOB_INPUT.profileDid,
            record: { id: 'saved', uri: 'credential', category: 'Achievement' },
            category: 'Achievement',
        });
        const first = (await pendingContractSyncStore.set.claimJob(job.id))!;
        await pendingContractSyncStore.set.recordTermsSynced(
            job.id,
            'terms:acknowledged',
            first.processingAttemptId
        );
        expect(await pendingContractSyncStore.set.claimJob(job.id)).toBeUndefined();
        vi.setSystemTime(first.processingLeaseUntil!);
        // A stale tab must resume from the durable acknowledgment, not this old projection.
        pendingContractSyncStore.set.jobs({ [job.id]: job });
        const second = (await pendingContractSyncStore.set.claimJob(job.id))!;
        expect(second.processingAttemptId).not.toBe(first.processingAttemptId);
        expect(second.kind === 'credential' && second.syncedTermsUris).toEqual([
            'terms:acknowledged',
        ]);
        await Promise.all([
            pendingContractSyncStore.set.recordCredentialSynced(
                job.id,
                'Achievement',
                'stale-copy',
                first.processingAttemptId
            ),
            pendingContractSyncStore.set.markError(
                job.id,
                'stale failure',
                first.processingAttemptId
            ),
            pendingContractSyncStore.set.recordCredentialSynced(
                job.id,
                'Achievement',
                'current-copy',
                second.processingAttemptId
            ),
        ]);
        await pendingContractSyncStore.set.markDone(job.id, second.processingAttemptId);
        expect(pendingContractSyncStore.get.jobs()[job.id]).toMatchObject({
            status: 'done',
            retryCount: 0,
            completedCredentials: 1,
            syncedSharedUrisByCategory: { Achievement: ['current-copy'] },
        });
    });
});
