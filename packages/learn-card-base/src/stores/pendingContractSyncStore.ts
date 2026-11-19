import type { LCR } from '../types/credential-records';
import { createStore } from '@udecode/zustood';
import { getLogger } from '../logging/logger';

export type PendingContractSyncStatus = 'queued' | 'running' | 'done' | 'error';

export type CredentialSyncSource = {
    record: Omit<LCR, 'category'> & { category: string };
    category: string;
};

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
    | (CredentialSyncSource & {
          kind: 'credential';
          profileDid: string;
          /** Terms mutations acknowledged before a partial failure or reload. */
          syncedTermsUris?: string[];
          /** Destinations that failed in the latest completed discovery pass. */
          failedContractUris?: string[];
          contractUri?: never;
          termsUri?: never;
          ownerDid?: never;
      });

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

const hasWindowEvents =
    typeof window !== 'undefined' && typeof window.addEventListener === 'function';
const channel =
    !hasWindowEvents || typeof BroadcastChannel === 'undefined'
        ? undefined
        : new BroadcastChannel(`${DB_NAME}:updates`);
const onQueueChanged = (): void => {
    void refreshJobs().catch(error => log.error('Failed to refresh pending sync jobs', error));
};
const LEGACY_STORE_KEY = 'pendingContractSyncStore';
const importLegacyJobs = async (snapshot?: string | null): Promise<void> => {
    if (typeof window === 'undefined') return;
    let source = snapshot;
    if (source === undefined) {
        try {
            source = window.localStorage.getItem(LEGACY_STORE_KEY);
        } catch (error) {
            log.warn('Could not read legacy pending sync jobs', error);
            return;
        }
    }
    if (!source) return;
    let parsed: { state?: { jobs?: Record<string, PendingContractSyncJob> } };
    try {
        parsed = JSON.parse(source) as typeof parsed;
    } catch (error) {
        log.warn('Could not parse legacy pending sync jobs', error);
        return;
    }
    const database = await openDatabase();
    try {
        let imported = false;
        await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction([JOB_STORE, METADATA_STORE], 'readwrite');
            const jobs = transaction.objectStore(JOB_STORE);
            const metadata = transaction.objectStore(METADATA_STORE);
            for (const job of Object.values(parsed.state?.jobs ?? {})) {
                const tombstone = metadata.get(`legacy-tombstone:${job.id}`);
                tombstone.onsuccess = () => {
                    if (typeof tombstone.result === 'number' && job.updatedAt <= tombstone.result)
                        return;
                    const existing = jobs.get(job.id);
                    existing.onsuccess = () => {
                        const current = existing.result as PendingContractSyncJob | undefined;
                        const isNewDelivery =
                            current?.status === 'done' &&
                            job.status !== 'done' &&
                            job.updatedAt > (current.finishedAt ?? current.updatedAt);
                        if (!current || isNewDelivery) {
                            jobs.put(job);
                            imported = true;
                        }
                    };
                };
            }
            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('Legacy queue import failed'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('Legacy queue import aborted'));
        });
        if (imported) notifyQueueChanged();
        try {
            if (window.localStorage.getItem(LEGACY_STORE_KEY) === source) {
                window.localStorage.removeItem(LEGACY_STORE_KEY);
            }
        } catch (error) {
            // The import is committed; a retained legacy copy must not disable the durable queue.
            log.warn('Could not remove imported legacy pending sync jobs', error);
        }
    } finally {
        database.close();
    }
};

channel?.addEventListener('message', onQueueChanged);
if (hasWindowEvents) {
    window.addEventListener('storage', event => {
        if (event.key === `${DB_NAME}:updates`) onQueueChanged();
        if (event.key === LEGACY_STORE_KEY) {
            void importLegacyJobs(event.newValue)
                .then(refreshJobs)
                .catch(error => log.error('Failed to import legacy pending sync jobs', error));
        }
    });
    window.addEventListener('focus', onQueueChanged);
}

const notifyQueueChanged = (): void => {
    try {
        if (channel) {
            channel.postMessage('updated');
        } else if (typeof window !== 'undefined') {
            window.localStorage.setItem(`${DB_NAME}:updates`, createAttemptId());
        }
    } catch (error) {
        // The queue is already committed; notification failure cannot undo the handoff.
        log.warn('Failed to notify other tabs about pending sync jobs', error);
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

let hydration: Promise<void> | undefined;
let isHydrated = false;
export const isPendingContractSyncHydrated = (): boolean => isHydrated;
const hydrate = (): Promise<void> => {
    if (hydration) return hydration;
    hydration = (async () => {
        await refreshJobs();
        isHydrated = true;
    })().catch(error => {
        hydration = undefined;
        throw error;
    });
    return hydration;
};
export const hydratePendingContractSyncJobs = (): Promise<void> =>
    isHydrated ? refreshJobs() : hydrate();

let refreshQueue = Promise.resolve();
let refreshInFlight: Promise<void> | undefined;
let refreshRequested = false;
let projectionVersion = 0;
const refreshJobs = (): Promise<void> => {
    refreshRequested = true;
    if (refreshInFlight) return refreshInFlight;
    const refresh = refreshQueue.then(async () => {
        do {
            refreshRequested = false;
            await importLegacyJobs();
            const version = projectionVersion;
            const database = await openDatabase();
            try {
                const jobs = await readAllJobs(database);
                if (version !== projectionVersion) {
                    refreshRequested = true;
                    continue;
                }
                const previous = pendingContractSyncStore.get.jobs();
                const next = Object.fromEntries(
                    jobs.map(job => [
                        job.id,
                        JSON.stringify(previous[job.id]) === JSON.stringify(job)
                            ? previous[job.id]
                            : job,
                    ])
                );
                if (
                    Object.keys(previous).length !== jobs.length ||
                    jobs.some(job => next[job.id] !== previous[job.id])
                )
                    pendingContractSyncStore.set.jobs(next);
            } finally {
                database.close();
            }
        } while (refreshRequested);
    });
    // A failed read must not prevent a later explicit refresh from trying again.
    refreshQueue = refresh.catch(() => {});
    refreshInFlight = refresh.finally(() => {
        refreshInFlight = undefined;
    });
    return refreshInFlight;
};

type JobMutation<T> = (job: PendingContractSyncJob | undefined) => {
    job?: PendingContractSyncJob;
    result: T;
    remove?: boolean;
};
const mutateJob = async <T>(id: string, mutation: JobMutation<T>): Promise<T> => {
    await hydrate();
    const database = await openDatabase();
    try {
        let result!: T;
        let changed = false;
        let committed: PendingContractSyncJob | undefined;
        await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction([JOB_STORE, METADATA_STORE], 'readwrite');
            const store = transaction.objectStore(JOB_STORE);
            const request = store.get(id);
            request.onsuccess = () => {
                try {
                    const outcome = mutation(request.result as PendingContractSyncJob | undefined);
                    result = outcome.result;
                    committed = outcome.remove ? undefined : outcome.job;
                    if (outcome.remove) {
                        transaction
                            .objectStore(METADATA_STORE)
                            .put(now(), `legacy-tombstone:${id}`);
                        store.delete(id);
                        changed = true;
                    } else if (outcome.job && outcome.job !== request.result) {
                        store.put(outcome.job);
                        changed = true;
                    }
                } catch (error) {
                    transaction.abort();
                    reject(error);
                }
            };
            request.onerror = () =>
                reject(request.error ?? new Error('Could not read pending sync job'));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('Pending sync write failed'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('Pending sync write aborted'));
        });
        if (changed) {
            projectionVersion += 1;
            const jobs = { ...pendingContractSyncStore.get.jobs() };
            if (committed) jobs[id] = committed;
            else delete jobs[id];
            pendingContractSyncStore.set.jobs(jobs);
            notifyQueueChanged();
        }
        return result;
    } finally {
        database.close();
    }
};

type JobsMutation<T = void> = (jobs: Record<string, PendingContractSyncJob>) => T;
const mutateJobs = async <T = void>(mutation: JobsMutation<T>): Promise<T> => {
    await hydrate();
    const database = await openDatabase();
    try {
        let result!: T;
        let changed = false;
        await new Promise<T>((resolve, reject) => {
            const transaction = database.transaction([JOB_STORE, METADATA_STORE], 'readwrite');
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
                            transaction
                                .objectStore(METADATA_STORE)
                                .put(now(), `legacy-tombstone:${id}`);
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
            projectionVersion += 1;
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
        mutateJob(id, job => ({
            result: undefined,
            job:
                job?.kind === 'credential' && canUpdateAttempt(job, attemptId)
                    ? {
                          ...job,
                          syncedTermsUris: [...new Set([...(job.syncedTermsUris ?? []), termsUri])],
                          updatedAt: now(),
                      }
                    : job,
        })),
    claimJob: (id: string) =>
        mutateJob<PendingContractSyncJob | undefined>(id, job => {
            if (!job || !isJobReadyToProcess(job)) return { result: undefined, job };
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
            return { result: claimed, job: claimed };
        }),
    renewProcessingLease: (id: string, attemptId: string) =>
        mutateJob(id, job => {
            if (job?.processingAttemptId !== attemptId || job.status !== 'running')
                return { result: false, job };
            const timestamp = now();
            return {
                result: true,
                job: {
                    ...job,
                    processingLeaseUntil: timestamp + PROCESSING_LEASE_MS,
                    updatedAt: timestamp,
                },
            };
        }),
    setFailedContractUris: (id: string, uris: string[], attemptId?: string) =>
        mutateJob(id, job => ({
            result: undefined,
            job:
                job?.kind === 'credential' && canUpdateAttempt(job, attemptId)
                    ? { ...job, failedContractUris: [...new Set(uris)], updatedAt: now() }
                    : job,
        })),
    setTotals: (id: string, totalCredentials: number, attemptId?: string) =>
        mutateJob(id, job => ({
            result: undefined,
            job:
                job && canUpdateAttempt(job, attemptId)
                    ? { ...job, totalCredentials, updatedAt: now() }
                    : job,
        })),
    recordCredentialProcessed: (id: string, attemptId?: string) =>
        mutateJob(id, job => ({
            result: undefined,
            job:
                job && canUpdateAttempt(job, attemptId)
                    ? {
                          ...job,
                          processedCredentials: job.processedCredentials + 1,
                          updatedAt: now(),
                      }
                    : job,
        })),
    recordCredentialSynced: (id: string, category: string, sharedUri: string, attemptId?: string) =>
        mutateJob(id, job => {
            if (!job || !canUpdateAttempt(job, attemptId)) return { result: undefined, job };
            const syncedSharedUrisByCategory = {
                ...job.syncedSharedUrisByCategory,
                [category]: [
                    ...new Set([...(job.syncedSharedUrisByCategory[category] ?? []), sharedUri]),
                ],
            };
            return {
                result: undefined,
                job: {
                    ...job,
                    syncedSharedUrisByCategory,
                    completedCredentials: Object.values(syncedSharedUrisByCategory).reduce(
                        (total, uris) => total + uris.length,
                        0
                    ),
                    updatedAt: now(),
                },
            };
        }),
    recordCredentialFailed: (id: string, error: string, attemptId?: string) =>
        mutateJob(id, job => ({
            result: undefined,
            job:
                job && canUpdateAttempt(job, attemptId)
                    ? {
                          ...job,
                          failedCredentials: job.failedCredentials + 1,
                          lastError: error,
                          updatedAt: now(),
                      }
                    : job,
        })),
    markDone: (id: string, attemptId?: string) =>
        mutateJob(id, job => ({
            result: undefined,
            job:
                job && canUpdateAttempt(job, attemptId)
                    ? {
                          ...job,
                          status: 'done',
                          finishedAt: now(),
                          updatedAt: now(),
                          lastError: undefined,
                          processingAttemptId: undefined,
                          processingLeaseUntil: undefined,
                      }
                    : job,
        })),
    removeJob: (id: string) => mutateJob(id, () => ({ result: undefined, remove: true })),
    pruneDoneJobs: (ttlMs: number = DONE_JOB_TTL_MS) =>
        mutateJobs(jobs => {
            const cutoff = now() - ttlMs;
            Object.entries(jobs).forEach(([id, job]) => {
                if (job.status === 'done' && (job.finishedAt ?? job.updatedAt) < cutoff)
                    delete jobs[id];
            });
        }),
    markError: (id: string, error: string, attemptId?: string) =>
        mutateJob(id, job => ({
            result: undefined,
            job:
                job && canUpdateAttempt(job, attemptId)
                    ? {
                          ...job,
                          status: 'error',
                          retryCount: job.retryCount + 1,
                          lastError: error,
                          finishedAt: now(),
                          updatedAt: now(),
                          processingAttemptId: undefined,
                          processingLeaseUntil: undefined,
                      }
                    : job,
        })),
}));

if (typeof indexedDB !== 'undefined') {
    void hydrate().catch(error => log.error('Failed to hydrate pending sync jobs', error));
}
export const enqueuePendingContractSync = pendingContractSyncStore.set.enqueueContractSyncJob;

/** Await the retry handoff without failing an already-committed save or consent. */
export const enqueuePendingContractSyncSafely = async (
    input: PendingContractSyncInput
): Promise<PendingContractSyncJob | undefined> => {
    try {
        return await pendingContractSyncStore.set.enqueueContractSyncJob(input);
    } catch (error) {
        log.error(
            'Failed to persist background delivery after the primary operation committed',
            error
        );
        return undefined;
    }
};
export const usePendingContractSyncJobs = pendingContractSyncStore.use.jobs;
export const clearPendingContractSyncJob = pendingContractSyncStore.set.removeJob;
