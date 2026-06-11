import { createStore } from '@udecode/zustood';

export type PendingContractSyncStatus = 'queued' | 'running' | 'done' | 'error';

export type PendingContractSyncJob = {
    id: string;
    profileDid: string;
    contractUri: string;
    termsUri: string;
    ownerDid: string;
    status: PendingContractSyncStatus;
    retryCount: number;
    totalCredentials: number;
    processedCredentials: number;
    completedCredentials: number;
    failedCredentials: number;
    syncedSharedUrisByCategory: Record<string, string[]>;
    lastError?: string;
    createdAt: number;
    updatedAt: number;
    startedAt?: number;
    finishedAt?: number;
};

export type PendingContractSyncState = {
    jobs: Record<string, PendingContractSyncJob>;
};

const now = (): number => Date.now();

// Example output:
// did:web:network.learncard.com:users:learner::lc:network:network.learncard.com/trpc:contract:abc::lc:network:network.learncard.com/trpc:terms:def::did:web:network.learncard.com:users:owner
export const getPendingContractSyncJobId = ({
    profileDid,
    contractUri,
    termsUri,
    ownerDid,
}: {
    profileDid: string;
    contractUri: string;
    termsUri: string;
    ownerDid: string;
}): string => [profileDid, contractUri, termsUri, ownerDid].join('::');

export const pendingContractSyncStore = createStore(
    'pendingContractSyncStore'
)<PendingContractSyncState>(
    { jobs: {} },
    { persist: { name: 'pendingContractSyncStore', enabled: true } }
).extendActions((set, get) => ({
    enqueueContractSyncJob: (input: {
        profileDid: string;
        contractUri: string;
        termsUri: string;
        ownerDid: string;
    }) => {
        const id = getPendingContractSyncJobId(input); // get id

        const jobs = get.jobs(); // get existing jobs
        const existing = jobs[id]; // look up existing job

        const timestamp = now(); // set current timestamp

        const job: PendingContractSyncJob = {
            id,
            ...input,
            status: existing?.status === 'running' ? 'running' : 'queued',
            retryCount: existing?.status === 'running' ? existing.retryCount : 0,
            totalCredentials: existing?.status === 'running' ? existing.totalCredentials : 0,
            processedCredentials:
                existing?.status === 'running' ? existing.processedCredentials : 0,
            completedCredentials:
                existing?.status === 'running' ? existing.completedCredentials : 0,
            failedCredentials: existing?.status === 'running' ? existing.failedCredentials : 0,
            syncedSharedUrisByCategory:
                existing?.status === 'running' ? existing.syncedSharedUrisByCategory : {},
            lastError: existing?.status === 'running' ? existing.lastError : undefined,
            createdAt: existing?.createdAt ?? timestamp,
            updatedAt: timestamp,
            startedAt: existing?.status === 'running' ? existing.startedAt : undefined,
            finishedAt: undefined,
        };

        // Persist the latest job snapshot so the worker can resume after reload.
        set.jobs({ ...jobs, [id]: job });
        return job;
    },
    markRunning: (id: string) => {
        const jobs = get.jobs();
        const job = jobs[id];

        if (!job) return;

        // Starting a fresh attempt clears attempt-local errors, but preserves
        // already-synced shared URIs so retry runs stay idempotent.
        set.jobs({
            ...jobs,
            [id]: {
                ...job,
                status: 'running',
                processedCredentials: 0,
                failedCredentials: 0,
                startedAt: job.startedAt ?? now(),
                updatedAt: now(),
                lastError: undefined,
            },
        });
    },
    setTotals: (id: string, totalCredentials: number) => {
        const jobs = get.jobs();
        const job = jobs[id];

        if (!job) return;

        set.jobs({
            ...jobs,
            [id]: { ...job, totalCredentials, updatedAt: now() },
        });
    },
    recordCredentialProcessed: (id: string) => {
        const jobs = get.jobs();
        const job = jobs[id];

        if (!job) return;

        set.jobs({
            ...jobs,
            [id]: {
                ...job,
                processedCredentials: job.processedCredentials + 1,
                updatedAt: now(),
            },
        });
    },
    recordCredentialSynced: (id: string, category: string, sharedUri: string) => {
        const jobs = get.jobs();
        const job = jobs[id];

        if (!job) return;

        // Track unique shared URIs per category; duplicates are ignored.
        const previousCategoryUris = job.syncedSharedUrisByCategory[category] ?? [];
        const nextCategoryUris = [...new Set([...previousCategoryUris, sharedUri])];
        const nextSyncedSharedUrisByCategory = {
            ...job.syncedSharedUrisByCategory,
            [category]: nextCategoryUris,
        };
        const completedCredentials = Object.values(nextSyncedSharedUrisByCategory).reduce(
            (total, uris) => total + uris.length,
            0
        );

        set.jobs({
            ...jobs,
            [id]: {
                ...job,
                completedCredentials,
                syncedSharedUrisByCategory: nextSyncedSharedUrisByCategory,
                updatedAt: now(),
            },
        });
    },
    recordCredentialFailed: (id: string, error: string) => {
        const jobs = get.jobs();
        const job = jobs[id];

        if (!job) return;

        set.jobs({
            ...jobs,
            [id]: {
                ...job,
                failedCredentials: job.failedCredentials + 1,
                lastError: error,
                updatedAt: now(),
            },
        });
    },
    markDone: (id: string) => {
        const jobs = get.jobs();
        const job = jobs[id];

        if (!job) return;

        set.jobs({
            ...jobs,
            [id]: {
                ...job,
                status: 'done',
                finishedAt: now(),
                updatedAt: now(),
                lastError: undefined,
            },
        });
    },
    removeJob: (id: string) => {
        const jobs = get.jobs();
        if (!jobs[id]) return;

        const nextJobs = { ...jobs };
        delete nextJobs[id];
        set.jobs(nextJobs);
    },
    markError: (id: string, error: string) => {
        const jobs = get.jobs();
        const job = jobs[id];

        if (!job) return;

        // Errors are counted as retries so the worker can stop after repeated
        // failures instead of looping forever on a bad credential or contract.
        set.jobs({
            ...jobs,
            [id]: {
                ...job,
                status: 'error',
                retryCount: job.retryCount + 1,
                lastError: error,
                finishedAt: now(),
                updatedAt: now(),
            },
        });
    },
}));

export const enqueuePendingContractSync = pendingContractSyncStore.set.enqueueContractSyncJob;
export const usePendingContractSyncJobs = pendingContractSyncStore.use.jobs;
export const clearPendingContractSyncJob = pendingContractSyncStore.set.removeJob;
