import type { CredentialIngestionPayload, OwnerJobData } from './types';

import { beforeEach, describe, expect, it, mock } from 'bun:test';

const records = new Map<
    string,
    { did: string; queue: string; payload: CredentialIngestionPayload }
>();
type QueuedJob = {
    id: string;
    data: OwnerJobData;
    deduplicationId: string;
    getState: () => Promise<string>;
    updateProgress: (progress: unknown) => Promise<void>;
};
const queued: QueuedJob[] = [];
const redisProgress: unknown[] = [];
let processor: (job: QueuedJob) => Promise<void>;
let beforeAdd: (() => Promise<void>) | undefined;
let erased = false;
let denied = false;
let processed = 0;
let failure: Error | undefined;
let processingLocale: string | undefined;
class ErasureError extends Error {}
class ConsentError extends Error {}
const assertActive = async () => {
    if (erased) throw new ErasureError();
};
const db = {
    storeOwnerJobPayload: async (
        did: string,
        queue: string,
        payload: CredentialIngestionPayload
    ) => {
        await assertActive();
        const referenceId = crypto.randomUUID();
        records.set(referenceId, { did, queue, payload });
        return referenceId;
    },
    getOwnerJobPayload: async (id: string) => records.get(id) ?? null,
    deleteOwnerJobPayload: async (_did: string, id: string) => {
        records.delete(id);
    },
};

mock.module('bullmq', () => ({
    Queue: class {
        async add(
            _name: string,
            data: OwnerJobData,
            options: { jobId: string; deduplication: { id: string } }
        ) {
            await beforeAdd?.();
            const existing = queued.find(job => job.deduplicationId === options.deduplication.id);
            if (existing) return { id: existing.id, data };
            const job = {
                id: options.jobId,
                data,
                deduplicationId: options.deduplication.id,
                getState: async () => 'waiting',
                updateProgress: async (progress: unknown) => {
                    redisProgress.push(progress);
                },
            };
            queued.push(job);
            return job;
        }
        async getJob(id: string) {
            return queued.find(job => job.id === id) ?? null;
        }
    },
    QueueEvents: class {
        on() {}
    },
    Worker: class {
        constructor(_name: string, callback: typeof processor) {
            processor = callback;
        }
        on() {}
    },
    UnrecoverableError: class extends Error {},
}));
mock.module('../db', () => ({ db }));
mock.module('../credentials/service', () => ({
    processCredentials: async (
        _did: string,
        job: { updateProgress: (value: unknown) => Promise<void> }
    ) => {
        processed += 1;
        processingLocale = getCurrentLocale();
        await job.updateProgress({
            progress: 35,
            message: 'private credential lc:private-learner-uri',
        });
        if (failure) throw failure;
        return {
            totalSeen: 7,
            indexed: 2,
            repaired: 0,
            alreadyComplete: 5,
            failed: 0,
            changed: false,
            durationMs: 10,
        };
    },
    warmUpTopicsCache: async () => [],
}));
mock.module('./subscriptions', () => ({ notifyJobUpdate: () => undefined }));
mock.module('../constants/env', () => ({ REDIS_PREFIX: 'test' }));
mock.module('../lib/redis', () => ({ redisConnectionOptions: {} }));
mock.module('../utils/cache', () => ({ default: { redis: undefined } }));
mock.module('../ai/privacy-keys', () => ({
    getPrivacyKeyMaterial: () => ({ reference: Buffer.alloc(32, 1) }),
}));
mock.module('../learncard/consent', () => ({ AiConsentError: ConsentError }));
mock.module('./credentialIngestionState', () => ({
    clearCredentialIngestionState: () => undefined,
    markCredentialIngestionActive: assertActive,
    markCredentialIngestionError: assertActive,
    markCredentialIngestionQueued: assertActive,
    markCredentialIngestionReady: assertActive,
}));
mock.module('../ai/privacy', () => ({
    runWithAiPrivacyContext: (_did: string, fn: () => unknown) => fn(),
    assertCurrentAiConsent: async () => {
        if (denied) throw new ConsentError();
    },
}));
mock.module('../services/dataErasure', () => ({
    PRIVACY_MAINTENANCE_KEY: 'fixture:privacy:maintenance',
    assertOwnerOperationActive: assertActive,
    isDataErasureRequestedError: (error: unknown) => error instanceof ErasureError,
    withOwnerOperation: async (_did: string, fn: () => Promise<unknown>) => {
        await assertActive();
        const result = await fn();
        await assertActive();
        return result;
    },
}));

// Queue/service dependencies must be mocked before module initialization.
const { getCurrentLocale, runWithLocale } = await import('../ai/locale');
const { startCredentialIngestionJob, startCredentialIngestionWorker } =
    await import('./credentialIngestion');
startCredentialIngestionWorker();

describe('private ingestion jobs', () => {
    beforeEach(() => {
        records.clear();
        queued.length = redisProgress.length = 0;
        erased = denied = false;
        processed = 0;
        failure = undefined;
        processingLocale = undefined;
        beforeAdd = undefined;
    });

    it('deduplicates overlapping ingestion but keeps different owners independent', async () => {
        const first = await startCredentialIngestionJob('did:example:learner', 'app_open');
        const second = await startCredentialIngestionJob('did:example:learner', 'topics');
        const other = await startCredentialIngestionJob('did:example:other', 'topics');
        expect(first.deduplicated).toBe(false);
        expect(second.deduplicated).toBe(true);
        expect(second.job.id).toBe(first.job.id);
        expect(other.job.id).not.toBe(first.job.id);
        expect(records.size).toBe(2);
        await processor(queued[0]!);
        expect(processed).toBe(1);
        expect(JSON.stringify(queued)).not.toContain('did:example:');
    });

    it('preserves locale without publishing private results or credential progress', async () => {
        await runWithLocale('es', () =>
            startCredentialIngestionJob('did:example:learner', 'app_open')
        );
        const result = await processor(queued[0]!);
        expect(processingLocale).toBe('es');
        expect(getCurrentLocale()).toBeUndefined();
        expect(result).toBeUndefined();
        expect(redisProgress).toEqual([35]);
        expect(records.size).toBe(0);
    });

    it('requires current consent when a delayed worker starts', async () => {
        await startCredentialIngestionJob('did:example:learner');
        denied = true;
        await expect(processor(queued[0]!)).rejects.toThrow('active_ai_consent_required');
        expect(processed).toBe(0);
    });

    it('strips raw exceptions and their stacks before BullMQ can persist them', async () => {
        await startCredentialIngestionJob('did:example:learner');
        failure = new Error('wallet token private-secret lc:private-learner-uri');
        const error = await processor(queued[0]!).then(
            () => undefined,
            (value: Error) => value
        );
        expect(error?.message).toBe('owner_job_failed');
        expect(error?.stack).not.toContain('private-secret');
        expect(JSON.stringify(redisProgress)).not.toContain('lc:private-learner-uri');
    });

    it('cannot process an erased reference even if queue.add resumes after cleanup', async () => {
        let resume!: () => void;
        let entered!: () => void;
        const paused = new Promise<void>(resolve => {
            entered = resolve;
        });
        beforeAdd = () => {
            entered();
            return new Promise<void>(resolve => {
                resume = resolve;
            });
        };
        const enqueuing = startCredentialIngestionJob('did:example:learner', 'private-source');
        await paused;
        erased = true;
        records.clear();
        resume();
        await expect(enqueuing).rejects.toBeInstanceOf(ErasureError);
        expect(JSON.stringify(queued)).not.toContain('did:example:learner');
        expect(JSON.stringify(queued)).not.toContain('private-source');
        await expect(processor(queued[0]!)).rejects.toThrow('owner_job_payload_unavailable');
        expect(processed).toBe(0);
        expect(records.size).toBe(0);
    });
});
