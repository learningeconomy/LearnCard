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

        // Re-enqueueing an already-finished job is a no-op so we never
        // rewrite a completed sync back into a queued state.
        if (existing?.status === 'done') return existing;

        const job: PendingContractSyncJob = {
            id,
            ...input,
            status: existing?.status === 'running' ? 'running' : 'queued',
            retryCount: existing?.retryCount ?? 0,
            totalCredentials: existing?.totalCredentials ?? 0,
            completedCredentials: existing?.completedCredentials ?? 0,
            failedCredentials: existing?.failedCredentials ?? 0,
            syncedSharedUrisByCategory: existing?.syncedSharedUrisByCategory ?? {},
            lastError: undefined,
            createdAt: existing?.createdAt ?? timestamp,
            updatedAt: timestamp,
            startedAt: existing?.startedAt,
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
