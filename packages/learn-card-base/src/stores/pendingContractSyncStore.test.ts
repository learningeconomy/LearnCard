import { beforeEach, describe, expect, it } from 'vitest';

import { enqueuePendingContractSync, pendingContractSyncStore } from './pendingContractSyncStore';

const JOB_INPUT = {
    profileDid: 'did:web:network.learncard.com:users:learner',
    contractUri: 'lc:network:network.learncard.com/trpc:contract:abc',
    termsUri: 'lc:network:network.learncard.com/trpc:terms:def',
    ownerDid: 'did:web:network.learncard.com:users:owner',
};

describe('pendingContractSyncStore', () => {
    beforeEach(() => {
        pendingContractSyncStore.set.jobs({});
    });

    it('dedupes queued jobs by profile, contract, terms, and owner', () => {
        const first = enqueuePendingContractSync(JOB_INPUT);
        const second = enqueuePendingContractSync(JOB_INPUT);

        expect(first.id).toBe(second.id);
        expect(Object.values(pendingContractSyncStore.get.jobs())).toHaveLength(1);
        expect(second.status).toBe('queued');
    });

    it('tracks progress by unique shared URI per category', () => {
        const job = enqueuePendingContractSync(JOB_INPUT);

        pendingContractSyncStore.set.markRunning(job.id);
        pendingContractSyncStore.set.setTotals(job.id, 2);
        pendingContractSyncStore.set.recordCredentialProcessed(job.id);
        pendingContractSyncStore.set.recordCredentialProcessed(job.id);
        pendingContractSyncStore.set.recordCredentialProcessed(job.id);
        pendingContractSyncStore.set.recordCredentialSynced(job.id, 'Achievement', 'uri:shared:1');
        pendingContractSyncStore.set.recordCredentialSynced(job.id, 'Achievement', 'uri:shared:1');
        pendingContractSyncStore.set.recordCredentialSynced(job.id, 'ID', 'uri:shared:2');

        const updated = pendingContractSyncStore.get.jobs()[job.id];

        expect(updated.processedCredentials).toBe(3);
        expect(updated.completedCredentials).toBe(2);
        expect(updated.syncedSharedUrisByCategory.Achievement).toEqual(['uri:shared:1']);
        expect(updated.syncedSharedUrisByCategory.ID).toEqual(['uri:shared:2']);
    });

    it('resets per-attempt failures when retrying a failed job', () => {
        const job = enqueuePendingContractSync(JOB_INPUT);

        pendingContractSyncStore.set.recordCredentialFailed(job.id, 'network issue');
        pendingContractSyncStore.set.markError(job.id, 'network issue');
        pendingContractSyncStore.set.markRunning(job.id);

        const updated = pendingContractSyncStore.get.jobs()[job.id];

        expect(updated.retryCount).toBe(1);
        expect(updated.processedCredentials).toBe(0);
        expect(updated.failedCredentials).toBe(0);
        expect(updated.status).toBe('running');
    });

    it('removes completed jobs from the store', () => {
        const job = enqueuePendingContractSync(JOB_INPUT);

        pendingContractSyncStore.set.removeJob(job.id);

        expect(pendingContractSyncStore.get.jobs()[job.id]).toBeUndefined();
    });

    it('retains completed jobs until they are explicitly removed', () => {
        const job = enqueuePendingContractSync(JOB_INPUT);

        pendingContractSyncStore.set.markDone(job.id);

        expect(pendingContractSyncStore.get.jobs()[job.id]?.status).toBe('done');
    });

    it('re-enqueues a completed job as a fresh queued job', () => {
        const job = enqueuePendingContractSync(JOB_INPUT);

        pendingContractSyncStore.set.markRunning(job.id);
        pendingContractSyncStore.set.setTotals(job.id, 4);
        pendingContractSyncStore.set.recordCredentialProcessed(job.id);
        pendingContractSyncStore.set.recordCredentialSynced(job.id, 'Achievement', 'uri:shared:1');
        pendingContractSyncStore.set.markDone(job.id);

        const retriedJob = enqueuePendingContractSync(JOB_INPUT);

        expect(retriedJob.id).toBe(job.id);
        expect(retriedJob.status).toBe('queued');
        expect(retriedJob.totalCredentials).toBe(0);
        expect(retriedJob.processedCredentials).toBe(0);
        expect(retriedJob.completedCredentials).toBe(0);
        expect(retriedJob.failedCredentials).toBe(0);
        expect(retriedJob.syncedSharedUrisByCategory).toEqual({});
    });
});
