import type { Job, Queue } from 'bullmq';

import { db } from '../db';
import { deleteOwnerVectors, exportOwnerVectors } from '../db/qdrant';
import { getPrivacySubjectRef } from '../ai/privacy-keys';
import cache from '../utils/cache';
import { cleanupExternalArtifacts } from '../learncard/external-artifact-deletion';
import { deleteOwnerAuthenticationEntries, readOwnerAuthenticationEntries } from './ownerAuthIndex';
import { queue as credentialIngestionQueue } from '../workers/credentialIngestion';
import { summaryQueue } from '../workers/conversationSummary';
import { getOwnerJobRecord } from '../workers/ownerJobs';
import { clearCredentialIngestionState } from '../workers/credentialIngestionState';
import { clearVerifiedCredentials } from '../credentials/batch';
import { clearConsentSnapshots } from '../learncard/requestScope';
import {
    closeOwnerSockets,
    completeDataErasure,
    getActiveOwnerOperationCount,
    requestDataErasure,
} from './dataErasure';

const JOB_STATES = [
    'active',
    'completed',
    'delayed',
    'failed',
    'paused',
    'prioritized',
    'waiting',
    'waiting-children',
] as const;

const lifecycleQueues = [
    { name: 'credential-ingestion', queue: credentialIngestionQueue },
    { name: 'conversation-summary', queue: summaryQueue },
];

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;

const parseCacheValue = (value: string) => {
    try {
        return JSON.parse(value) as unknown;
    } catch {
        return value;
    }
};

const strictCacheStore = () => {
    if (!cache.redis) throw new Error('Persistent Redis is required for data lifecycle operations');
    return cache.redis;
};

const strictScanCacheKeys = async (pattern: string) => {
    const store = strictCacheStore();
    const keys: string[] = [];
    let cursor = '0';
    do {
        const [nextCursor, page] = await store.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys.push(...page);
    } while (cursor !== '0');
    return keys;
};

const strictOwnerCacheEntries = async (did: string) => {
    const subjectRef = getPrivacySubjectRef(did);
    const topicsPrefix = `topics:${subjectRef}:`;
    const locksPrefix = `single-flight:${subjectRef}:`;
    const stateKey = `credential-ingestion-state:${subjectRef}`;
    const legacyStateKey = `credential-ingestion-state:${did}`;
    const [topicKeys, lockKeys, authentication] = await Promise.all([
        strictScanCacheKeys(`${topicsPrefix}*`),
        strictScanCacheKeys(`${locksPrefix}*`),
        readOwnerAuthenticationEntries(did),
    ]);
    const keys = new Set([...topicKeys, ...lockKeys]);
    keys.add(stateKey);
    keys.add(legacyStateKey);
    const entries: { key: string; value: unknown }[] = [];
    for (const key of keys) {
        const rawValue = await strictCacheStore().get(key);
        if (rawValue === null) continue;
        const value = parseCacheValue(rawValue);
        if (
            key.startsWith(topicsPrefix) ||
            key.startsWith(locksPrefix) ||
            key === stateKey ||
            key === legacyStateKey
        )
            entries.push({ key, value });
    }
    return entries.concat(authentication);
};

const unlinkCacheEntries = async (entries: { key: string }[]) =>
    entries.length === 0 ? 0 : strictCacheStore().unlink(...entries.map(({ key }) => key));

export const deleteOwnerCacheEntries = async (did: string) =>
    unlinkCacheEntries(await strictOwnerCacheEntries(did));

const safeCacheExport = ({ key, value }: { key: string; value: unknown }) => {
    if (key.startsWith('topics:')) return { type: 'topics', value };
    const record = asRecord(value);
    if (key.startsWith('single-flight:')) return { type: 'owner-operation-lock' };
    if (key.startsWith('credential-ingestion-state:'))
        return {
            type: 'credential-ingestion-state',
            phase: record?.phase,
        };
    if (key.startsWith('oauth:authcode:'))
        return {
            type: 'oauth-authorization-code',
            clientId: record?.clientId,
            redirectUri: record?.redirectUri,
        };
    if (key.startsWith('oauth:refresh:'))
        return { type: 'oauth-refresh-token', clientId: record?.clientId };
    return { type: 'did-auth-state' };
};

export const exportOwnerCacheEntries = async (did: string) =>
    (await strictOwnerCacheEntries(did)).map(safeCacheExport);

const ownerQueueJobs = async (did: string) => {
    const jobs: { queue: string; job: Job; payload: unknown }[] = [];
    const references = new Map(
        (await db.getOwnerJobReferences(did)).map(entry => [entry.referenceId, entry.queue])
    );
    for (const { name, queue } of lifecycleQueues) {
        for (const job of await (queue as Queue).getJobs([...JOB_STATES])) {
            const record = await getOwnerJobRecord(job);
            const data = asRecord(job.data);
            // Legacy jobs are explicitly discovered for erasure, never executed as a compatibility path.
            const legacyOwner = data?.did === did;
            const referencedOwner =
                typeof data?.referenceId === 'string' && references.get(data.referenceId) === name;
            if (record?.did === did || legacyOwner || referencedOwner)
                jobs.push({
                    queue: name,
                    job,
                    payload: record?.payload ?? (legacyOwner ? job.data : undefined),
                });
        }
    }
    return jobs;
};

export type DataLifecycleDependencies = {
    exportMongo: (did: string, subjectRef: string) => Promise<unknown>;
    deleteMongo: (did: string, subjectRef: string) => Promise<unknown>;
    fenceOwnerWrites: (did: string) => Promise<void>;
    externalArtifacts: (did: string) => Promise<unknown[]>;
    exportVectors: (did: string) => Promise<unknown>;
    deleteVectors: (did: string) => Promise<string[]>;
    exportCache: (did: string) => Promise<unknown>;
    deleteCache: (did: string) => Promise<number>;
    deleteAuthentication: (did: string) => Promise<number>;
    cleanupArtifacts: (did: string) => Promise<{
        complete: boolean;
        retryable: boolean;
        artifacts: unknown[];
    }>;
    completeErasure: (did: string) => Promise<{ completedAt: string }>;
    exportJobs: (did: string) => Promise<unknown>;
    deleteJobs: (did: string) => Promise<{
        removed: number;
        pending: { queue: string; id: string; state: string }[];
    }>;
    requestErasure: (did: string) => Promise<{ requestedAt: string }>;
    closeOwnerSockets: (did: string) => void;
    activeOwnerOperations: (did: string) => Promise<number>;
    subjectRef: (did: string) => string;
    now: () => Date;
};

export const createDataLifecycleService = (dependencies: DataLifecycleDependencies) => ({
    exportData: async (did: string) => ({
        subjectRef: dependencies.subjectRef(did),
        generatedAt: dependencies.now().toISOString(),
        mongo: await dependencies.exportMongo(did, dependencies.subjectRef(did)),
        vectors: await dependencies.exportVectors(did),
        cache: await dependencies.exportCache(did),
        jobs: await dependencies.exportJobs(did),
        externalArtifacts: await dependencies.externalArtifacts(did),
    }),

    // Authorized by the HTTP caller, deliberately outside an owner operation lease.
    deleteData: async (did: string) => {
        const subjectRef = dependencies.subjectRef(did);
        const erasure = await dependencies.requestErasure(did);
        await dependencies.fenceOwnerWrites(did);
        dependencies.closeOwnerSockets(did);
        let stage = 'jobs';
        try {
            const jobs = await dependencies.deleteJobs(did);
            const activeOwnerOperations = await dependencies.activeOwnerOperations(did);
            const externalArtifacts = await dependencies.externalArtifacts(did);
            if (jobs.pending.length > 0 || activeOwnerOperations > 0)
                return {
                    status: 'incomplete' as const,
                    requestedAt: erasure.requestedAt,
                    retryable: true,
                    activeOwnerOperations,
                    jobs,
                    externalArtifacts,
                };
            // Fence vectors while the durable references still exist. Never delete these fences.
            stage = 'vectors';
            const vectors = await dependencies.deleteVectors(did);
            stage = 'cache';
            const cacheEntries = await dependencies.deleteCache(did);
            stage = 'mongo';
            const mongo = await dependencies.deleteMongo(did, subjectRef);
            stage = 'external-artifacts';
            const remote = await dependencies.cleanupArtifacts(did);
            if (!remote.complete)
                return {
                    status: 'incomplete' as const,
                    requestedAt: erasure.requestedAt,
                    retryable: remote.retryable,
                    failedStage: stage,
                    externalArtifacts: remote.artifacts,
                };
            // Keep credentials usable for retries until every dependent cleanup succeeded.
            stage = 'authentication';
            const authenticationEntries = await dependencies.deleteAuthentication(did);
            stage = 'completion';
            const { completedAt } = await dependencies.completeErasure(did);
            return {
                status: 'complete' as const,
                requestedAt: erasure.requestedAt,
                completedAt,
                mongo,
                vectors,
                cacheEntries: cacheEntries + authenticationEntries,
                jobs,
                externalArtifacts: remote.artifacts,
            };
        } catch {
            // Do not leak infrastructure errors, and never label partial erasure complete.
            // If this authoritative ledger read also fails, propagate the failure.
            return {
                status: 'incomplete' as const,
                requestedAt: erasure.requestedAt,
                retryable: true,
                failedStage: stage,
                externalArtifacts: await dependencies.externalArtifacts(did),
            };
        }
    },
});

const exportJobs = async (did: string) =>
    Promise.all(
        (await ownerQueueJobs(did)).map(async ({ queue, job, payload }) => {
            const data = asRecord(payload);
            return {
                queue,
                state: await job.getState(),
                // Do not export legacy progress/errors/results or unvalidated payload secrets.
                data: {
                    threadId: data?.threadId,
                    source: data?.source,
                    locale: data?.locale,
                },
            };
        })
    );

const deleteJobs = async (did: string) => {
    const jobs = await ownerQueueJobs(did);
    const pending: { queue: string; id: string; state: string }[] = [];
    let removed = 0;
    for (const { queue, job } of jobs) {
        const state = await job.getState();
        if (state === 'active') {
            pending.push({ queue, id: String(job.id), state });
            continue;
        }
        try {
            await job.remove();
            removed += 1;
        } catch {
            pending.push({ queue, id: String(job.id), state: await job.getState() });
        }
    }
    return { removed, pending };
};

/** Erasure's in-process caches: ingestion state, verified credentials, consent snapshot. */
export const clearOwnerProcessState = (did: string): void => {
    clearCredentialIngestionState(did);
    clearVerifiedCredentials(did);
    clearConsentSnapshots(did);
};

export const dataLifecycleService = createDataLifecycleService({
    exportMongo: (did, subjectRef) => db.exportOwnerData(did, subjectRef),
    deleteMongo: (did, subjectRef) => db.deleteOwnerData(did, subjectRef),
    fenceOwnerWrites: did => db.fenceOwnerWrites(did),
    externalArtifacts: did => db.getExternalArtifacts(did),
    cleanupArtifacts: cleanupExternalArtifacts,
    completeErasure: completeDataErasure,
    exportVectors: exportOwnerVectors,
    deleteVectors: deleteOwnerVectors,
    exportCache: exportOwnerCacheEntries,
    deleteCache: async did => {
        const entries = (await strictOwnerCacheEntries(did)).filter(
            ({ key }) =>
                key.startsWith('topics:') ||
                key.startsWith('credential-ingestion-state:') ||
                key.startsWith('single-flight:')
        );
        const removed = await unlinkCacheEntries(entries);
        clearOwnerProcessState(did);
        return removed;
    },
    deleteAuthentication: deleteOwnerAuthenticationEntries,
    exportJobs,
    deleteJobs,
    subjectRef: getPrivacySubjectRef,
    requestErasure: requestDataErasure,
    closeOwnerSockets,
    activeOwnerOperations: getActiveOwnerOperationCount,
    now: () => new Date(),
});
