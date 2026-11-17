import type { LCR } from '../types/credential-records';
import type { CredentialCategory } from '../types/credentials';
import { createStore } from '@udecode/zustood';
import { getLogger } from '../logging/logger';

export type PendingContractSyncStatus = 'queued' | 'running' | 'done' | 'error';

type PendingContractSyncInput =
    | {
          kind?: 'contract';
          profileDid: string;
          contractUri: string;
          termsUri: string;
          ownerDid: string;
          record?: never;
          category?: never;
      }
    | {
          kind: 'credential';
          profileDid: string;
          /** Retry discovery as well as delivery when the consent lookup itself failed. */
          record: LCR;
          category: CredentialCategory;
          /** Terms mutations acknowledged before a partial failure or reload. */
          syncedTermsUris?: string[];
          /** Destinations that failed in the latest completed discovery pass. */
          failedContractUris?: string[];
          contractUri?: never;
          termsUri?: never;
          ownerDid?: never;
      };

export type PendingContractSyncJob = PendingContractSyncInput & {
    id: string;
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
    processingAttemptId?: string;
    processingLeaseUntil?: number;
};

export type PendingContractSyncState = {
    jobs: Record<string, PendingContractSyncJob>;
};

/** Maximum number of times the worker will retry a failing job before giving up. */
export const MAX_JOB_RETRIES = 3;

/** Base delay between retry attempts; multiplied exponentially per retry. */
export const RETRY_BACKOFF_BASE_MS = 5_000;

/** Upper bound on the exponential retry backoff. */
export const RETRY_BACKOFF_MAX_MS = 60_000;

/** Done jobs older than this are pruned so the persisted store doesn't grow forever. */
export const DONE_JOB_TTL_MS = 24 * 60 * 60 * 1000;

const now = (): number => Date.now();

/**
 * Earliest retry time, including an active worker's lease. A closed tab's running
 * job becomes eligible again when that lease expires.
 */
export const getNextRetryAt = (job: PendingContractSyncJob): number => {
    const delay = Math.min(RETRY_BACKOFF_BASE_MS * 2 ** (job.retryCount - 1), RETRY_BACKOFF_MAX_MS);
    const retryAt = job.retryCount > 0 ? (job.finishedAt ?? job.updatedAt) + delay : 0;
    return Math.max(retryAt, job.status === 'running' ? (job.processingLeaseUntil ?? 0) : 0);
};

/** True when a non-done job is eligible to be (re)processed by the worker right now. */
export const isJobReadyToProcess = (job: PendingContractSyncJob, at: number = now()): boolean =>
    job.status !== 'done' && job.retryCount < MAX_JOB_RETRIES && getNextRetryAt(job) <= at;

/** True when a job has reached a terminal state (succeeded or exhausted its retries). */
export const isJobTerminal = (job: PendingContractSyncJob): boolean =>
    job.status === 'done' || (job.status === 'error' && job.retryCount >= MAX_JOB_RETRIES);

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

const DB_NAME = 'learn-card-pending-contract-sync';
const DB_VERSION = 1;
const JOB_STORE = 'jobs';
const METADATA_STORE = 'metadata';
const log = getLogger('pending-contract-sync-store');
// On platforms without Web Locks, a renewable lease recovers abandoned workers.
// Attempt IDs fence stale writes if a suspended worker resumes after another tab claims the job.
const PROCESSING_LEASE_MS = 60_000;
const createAttemptId = (): string =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const openDatabase = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(JOB_STORE, { keyPath: 'id' });
            request.result.createObjectStore(METADATA_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(request.error ?? new Error('Could not open pending sync database'));
    });

const channel =
    typeof window === 'undefined' || typeof BroadcastChannel === 'undefined'
        ? undefined
        : new BroadcastChannel(`${DB_NAME}:updates`);
const onQueueChanged = (): void => {
    void refreshJobs().catch(error => log.error('Failed to refresh pending sync jobs', error));
};
channel?.addEventListener('message', onQueueChanged);
if (typeof window !== 'undefined') {
    window.addEventListener('storage', event => {
        if (event.key === `${DB_NAME}:updates`) onQueueChanged();
    });
    window.addEventListener('focus', onQueueChanged);
}

const notifyQueueChanged = (): void => {
    if (channel) {
        channel.postMessage('updated');
    } else if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(`${DB_NAME}:updates`, createAttemptId());
        } catch (error) {
            // The queue is already committed; notification failure cannot undo the handoff.
            log.warn('Failed to notify other tabs about pending sync jobs', error);
        }
    }
};

const readAllJobs = (database: IDBDatabase): Promise<PendingContractSyncJob[]> =>
    new Promise((resolve, reject) => {
        const transaction = database.transaction(JOB_STORE, 'readonly');
        const request = transaction.objectStore(JOB_STORE).getAll();
        transaction.oncomplete = () => resolve(request.result as PendingContractSyncJob[]);
        transaction.onerror = () =>
            reject(transaction.error ?? new Error('Could not read pending sync jobs'));
        transaction.onabort = () =>
            reject(transaction.error ?? new Error('Pending sync read aborted'));
    });

const migrateLegacyJobs = (database: IDBDatabase): Promise<void> =>
    new Promise((resolve, reject) => {
        const transaction = database.transaction([JOB_STORE, METADATA_STORE], 'readwrite');
        const jobs = transaction.objectStore(JOB_STORE);
        const metadata = transaction.objectStore(METADATA_STORE);
        const migrated = metadata.get('legacy-migrated');
        migrated.onsuccess = () => {
            if (migrated.result) return;
            try {
                const legacy =
                    typeof window === 'undefined'
                        ? null
                        : window.localStorage.getItem('pendingContractSyncStore');
                const parsed = legacy
                    ? (JSON.parse(legacy) as {
                          state?: { jobs?: Record<string, PendingContractSyncJob> };
                      })
                    : undefined;
                for (const job of Object.values(parsed?.state?.jobs ?? {})) {
                    const existing = jobs.get(job.id);
                    existing.onsuccess = () => {
                        if (!existing.result) jobs.put(job);
                    };
                }
                metadata.put(true, 'legacy-migrated');
            } catch (error) {
                transaction.abort();
                reject(error);
            }
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
            reject(transaction.error ?? new Error('Legacy queue migration failed'));
        transaction.onabort = () =>
            reject(transaction.error ?? new Error('Legacy queue migration aborted'));
    });

let hydration: Promise<void> | undefined;
let isHydrated = false;
export const isPendingContractSyncHydrated = (): boolean => isHydrated;
const hydrate = (): Promise<void> => {
    if (hydration) return hydration;
    hydration = (async () => {
        const database = await openDatabase();
        try {
            await migrateLegacyJobs(database);
            await refreshJobs();
            isHydrated = true;
        } finally {
            database.close();
        }
    })().catch(error => {
        hydration = undefined;
        throw error;
    });
    return hydration;
};
export const hydratePendingContractSyncJobs = (): Promise<void> =>
    isHydrated ? refreshJobs() : hydrate();

let refreshQueue = Promise.resolve();
const refreshJobs = (): Promise<void> => {
    const refresh = refreshQueue.then(async () => {
        const database = await openDatabase();
        try {
            const jobs = await readAllJobs(database);
            pendingContractSyncStore.set.jobs(Object.fromEntries(jobs.map(job => [job.id, job])));
        } finally {
            database.close();
        }
    });
    // A failed read must not prevent a later explicit refresh from trying again.
    refreshQueue = refresh.catch(() => {});
    return refresh;
};

type JobsMutation<T = void> = (jobs: Record<string, PendingContractSyncJob>) => T;
const mutateJobs = async <T = void>(mutation: JobsMutation<T>): Promise<T> => {
    await hydrate();
    const database = await openDatabase();
    try {
        let result!: T;
        let changed = false;
        await new Promise<T>((resolve, reject) => {
            const transaction = database.transaction(JOB_STORE, 'readwrite');
            const store = transaction.objectStore(JOB_STORE);
            const request = store.getAll();
            request.onsuccess = () => {
                const previous = Object.fromEntries(
                    (request.result as PendingContractSyncJob[]).map(job => [job.id, job])
                );
                const jobs = { ...previous };
                try {
                    result = mutation(jobs);
                    for (const [id, job] of Object.entries(jobs)) {
                        if (job !== previous[id]) {
                            store.put(job);
                            changed = true;
                        }
                    }
                    for (const id of Object.keys(previous)) {
                        if (!(id in jobs)) {
                            store.delete(id);
                            changed = true;
                        }
                    }
                } catch (error) {
                    transaction.abort();
                    reject(error);
                }
            };
            request.onerror = () =>
                reject(request.error ?? new Error('Could not read pending sync jobs'));
            transaction.oncomplete = () => resolve(result);
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('Pending sync write failed'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('Pending sync write aborted'));
        });
        if (changed) {
            await refreshJobs();
            notifyQueueChanged();
        }
        return result;
    } finally {
        database.close();
    }
};

const canUpdateAttempt = (job: PendingContractSyncJob, attemptId?: string): boolean =>
    !attemptId || job.processingAttemptId === attemptId;

export const pendingContractSyncStore = createStore(
    'pendingContractSyncStore'
)<PendingContractSyncState>({ jobs: {} }).extendActions(() => ({
    enqueueContractSyncJob: async (
        input: PendingContractSyncInput
    ): Promise<PendingContractSyncJob> => {
        let result!: PendingContractSyncJob;
        await mutateJobs(jobs => {
            const id =
                input.kind === 'credential'
                    ? ['credential', input.profileDid, input.category, input.record.uri].join('::')
                    : getPendingContractSyncJobId(input);
            const existing = jobs[id];
            const timestamp = now();
            result = {
                id,
                ...(input.kind === 'credential'
                    ? {
                          ...input,
                          syncedTermsUris: [
                              ...new Set([
                                  ...(existing?.kind === 'credential' && existing.status !== 'done'
                                      ? (existing.syncedTermsUris ?? [])
                                      : []),
                                  ...(input.syncedTermsUris ?? []),
                              ]),
                          ],
                          failedContractUris:
                              input.failedContractUris ??
                              (existing?.kind === 'credential' && existing.status !== 'done'
                                  ? existing.failedContractUris
                                  : undefined),
                      }
                    : input),
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
                processingAttemptId:
                    existing?.status === 'running' ? existing.processingAttemptId : undefined,
                processingLeaseUntil:
                    existing?.status === 'running' ? existing.processingLeaseUntil : undefined,
            };
            Object.entries(jobs).forEach(([jobId, job]) => {
                if (
                    jobId !== id &&
                    job.status === 'done' &&
                    timestamp - (job.finishedAt ?? job.updatedAt) >= DONE_JOB_TTL_MS
                )
                    delete jobs[jobId];
            });
            jobs[id] = result;
        });
        return result;
    },
    recordTermsSynced: (id: string, termsUri: string, attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (job?.kind === 'credential' && canUpdateAttempt(job, attemptId)) {
                jobs[id] = {
                    ...job,
                    syncedTermsUris: [...new Set([...(job.syncedTermsUris ?? []), termsUri])],
                    updatedAt: now(),
                };
            }
        }),
    claimJob: (id: string) =>
        mutateJobs<PendingContractSyncJob | undefined>(jobs => {
            const job = jobs[id];
            if (!job || !isJobReadyToProcess(job)) return undefined;
            const timestamp = now();
            const claimed: PendingContractSyncJob = {
                ...job,
                status: 'running',
                processingAttemptId: createAttemptId(),
                processingLeaseUntil: timestamp + PROCESSING_LEASE_MS,
                processedCredentials: 0,
                failedCredentials: 0,
                startedAt: job.startedAt ?? timestamp,
                updatedAt: timestamp,
                lastError: undefined,
            };
            jobs[id] = claimed;
            return claimed;
        }),
    renewProcessingLease: (id: string, attemptId: string) =>
        mutateJobs<boolean>(jobs => {
            const job = jobs[id];
            if (job?.processingAttemptId !== attemptId || job.status !== 'running') return false;
            const timestamp = now();
            jobs[id] = {
                ...job,
                processingLeaseUntil: timestamp + PROCESSING_LEASE_MS,
                updatedAt: timestamp,
            };
            return true;
        }),
    setFailedContractUris: (id: string, uris: string[], attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (job?.kind === 'credential' && canUpdateAttempt(job, attemptId)) {
                jobs[id] = {
                    ...job,
                    failedContractUris: [...new Set(uris)],
                    updatedAt: now(),
                };
            }
        }),
    setTotals: (id: string, totalCredentials: number, attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (job && canUpdateAttempt(job, attemptId)) {
                jobs[id] = { ...job, totalCredentials, updatedAt: now() };
            }
        }),
    recordCredentialProcessed: (id: string, attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (job && canUpdateAttempt(job, attemptId)) {
                jobs[id] = {
                    ...job,
                    processedCredentials: job.processedCredentials + 1,
                    updatedAt: now(),
                };
            }
        }),
    recordCredentialSynced: (id: string, category: string, sharedUri: string, attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (!job || !canUpdateAttempt(job, attemptId)) return;
            const syncedSharedUrisByCategory = {
                ...job.syncedSharedUrisByCategory,
                [category]: [
                    ...new Set([...(job.syncedSharedUrisByCategory[category] ?? []), sharedUri]),
                ],
            };
            jobs[id] = {
                ...job,
                syncedSharedUrisByCategory,
                completedCredentials: Object.values(syncedSharedUrisByCategory).reduce(
                    (total, uris) => total + uris.length,
                    0
                ),
                updatedAt: now(),
            };
        }),
    recordCredentialFailed: (id: string, error: string, attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (job && canUpdateAttempt(job, attemptId)) {
                jobs[id] = {
                    ...job,
                    failedCredentials: job.failedCredentials + 1,
                    lastError: error,
                    updatedAt: now(),
                };
            }
        }),
    markDone: (id: string, attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (job && canUpdateAttempt(job, attemptId)) {
                jobs[id] = {
                    ...job,
                    status: 'done',
                    finishedAt: now(),
                    updatedAt: now(),
                    lastError: undefined,
                    processingAttemptId: undefined,
                    processingLeaseUntil: undefined,
                };
            }
        }),
    removeJob: (id: string) =>
        mutateJobs(jobs => {
            delete jobs[id];
        }),
    pruneDoneJobs: (ttlMs: number = DONE_JOB_TTL_MS) =>
        mutateJobs(jobs => {
            const cutoff = now() - ttlMs;
            Object.entries(jobs).forEach(([id, job]) => {
                if (job.status === 'done' && (job.finishedAt ?? job.updatedAt) < cutoff)
                    delete jobs[id];
            });
        }),
    markError: (id: string, error: string, attemptId?: string) =>
        mutateJobs(jobs => {
            const job = jobs[id];
            if (job && canUpdateAttempt(job, attemptId)) {
                jobs[id] = {
                    ...job,
                    status: 'error',
                    retryCount: job.retryCount + 1,
                    lastError: error,
                    finishedAt: now(),
                    updatedAt: now(),
                    processingAttemptId: undefined,
                    processingLeaseUntil: undefined,
                };
            }
        }),
}));

if (typeof indexedDB !== 'undefined') {
    void hydrate().catch(error => log.error('Failed to hydrate pending sync jobs', error));
}
export const enqueuePendingContractSync = pendingContractSyncStore.set.enqueueContractSyncJob;
export const usePendingContractSyncJobs = pendingContractSyncStore.use.jobs;
export const clearPendingContractSyncJob = pendingContractSyncStore.set.removeJob;
