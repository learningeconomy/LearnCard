import type { Job } from 'bullmq';
import type { CredentialIngestionJobData, CredentialIngestionPayload } from './types';

import { Queue, Worker, QueueEvents, UnrecoverableError } from 'bullmq';
import { redisConnectionOptions } from '../lib/redis';
import { processCredentials, warmUpTopicsCache } from '../credentials/service';
import { notifyJobUpdate } from './subscriptions';
import { CREDENTIAL_INGESTION_QUEUE } from '../constants/queues';
import { REDIS_PREFIX } from '../constants/env';
import { db } from '../db';
import { getCurrentLocale, runWithLocale } from '../ai/locale';
import {
    clearCredentialIngestionState,
    markCredentialIngestionActive,
    markCredentialIngestionError,
    markCredentialIngestionQueued,
    markCredentialIngestionReady,
} from './credentialIngestionState';
import { assertCurrentAiConsent, runWithAiPrivacyContext } from '../ai/privacy';
import { assertOwnerOperationActive, withOwnerOperation } from '../services/dataErasure';
import { getOwnerJobDeduplicationId, getOwnerJobRecord, sanitizeOwnerJobError } from './ownerJobs';

export const queue = new Queue<CredentialIngestionJobData>(CREDENTIAL_INGESTION_QUEUE, {
    connection: redisConnectionOptions,
    prefix: `${REDIS_PREFIX}:`,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 1000,
    },
});

export const startCredentialIngestionWorker = () => {
    const queueEvents = new QueueEvents(CREDENTIAL_INGESTION_QUEUE, {
        connection: redisConnectionOptions,
        prefix: `${REDIS_PREFIX}:`,
    });
    const worker = new Worker<CredentialIngestionJobData, void>(
        CREDENTIAL_INGESTION_QUEUE,
        async job => {
            try {
                const record = await getOwnerJobRecord(job);
                if (!record) throw new UnrecoverableError('owner_job_payload_unavailable');
                const payload = record.payload as Partial<CredentialIngestionPayload> | null;
                if (
                    record.queue !== CREDENTIAL_INGESTION_QUEUE ||
                    !payload ||
                    typeof payload.source !== 'string' ||
                    (payload.locale != null && typeof payload.locale !== 'string')
                )
                    throw new UnrecoverableError('owner_job_payload_invalid');
                const { did } = record;
                const { source, locale } = payload;
                await withOwnerOperation(did, () =>
                    runWithAiPrivacyContext(did, () =>
                        runWithLocale(locale, async () => {
                            try {
                                await assertCurrentAiConsent('credential-ingestion');
                                await markCredentialIngestionActive(did, source);
                                const result = await processCredentials(did, {
                                    id: job.id,
                                    // Never give ingestion the real Job: its detailed progress
                                    // contains credential URIs and must not enter Redis/events.
                                    updateProgress: async progress => {
                                        await assertOwnerOperationActive(did);
                                        const percentage =
                                            typeof progress === 'number'
                                                ? progress
                                                : typeof progress === 'object' &&
                                                    progress !== null &&
                                                    'progress' in progress
                                                  ? progress.progress
                                                  : 0;
                                        await job.updateProgress(
                                            typeof percentage === 'number' &&
                                                Number.isFinite(percentage)
                                                ? Math.max(0, Math.min(100, percentage))
                                                : 0
                                        );
                                    },
                                });
                                if (result.changed) {
                                    await assertOwnerOperationActive(did);
                                    await warmUpTopicsCache(did);
                                }
                                await markCredentialIngestionReady(did, source, result);
                                await assertOwnerOperationActive(did);
                                await db.deleteOwnerJobPayload(did, job.data.referenceId);
                            } catch (error) {
                                // State failures also propagate through the outer sanitizer.
                                // The fence rejects this write if erasure/lease loss won.
                                await markCredentialIngestionError(did, source);
                                throw error;
                            } finally {
                                clearCredentialIngestionState(did);
                            }
                        })
                    )
                );
            } catch (error) {
                throw sanitizeOwnerJobError(error);
            }
        },
        {
            connection: redisConnectionOptions,
            concurrency: 5,
            prefix: `${REDIS_PREFIX}:`,
        }
    );

    worker.on('progress', (job, progress) => {
        notifyJobUpdate({
            id: job.id!,
            status: 'active',
            progress: typeof progress === 'number' ? progress : 0,
            message: 'Processing credentials',
        });
    });
    worker.on('completed', job => {
        notifyJobUpdate({
            id: job.id!,
            status: 'completed',
            progress: 100,
            message: 'Credentials processed successfully',
        });
    });
    worker.on('failed', job => {
        if (job)
            notifyJobUpdate({
                id: job.id!,
                status: 'failed',
                message: 'Credential processing failed',
            });
    });
    worker.on('error', () => console.error('Credential ingestion worker infrastructure error'));
    queueEvents.on('error', () => console.error('Credential ingestion queue infrastructure error'));
    return { worker, queueEvents };
};

export type CredentialIngestionEnqueueResult = {
    job: Job<CredentialIngestionJobData>;
    deduplicated: boolean;
};

export const startCredentialIngestionJob = async (
    did: string,
    source = 'queue'
): Promise<CredentialIngestionEnqueueResult> =>
    withOwnerOperation(did, async () => {
        try {
            const referenceId = await db.storeOwnerJobPayload(did, CREDENTIAL_INGESTION_QUEUE, {
                source,
                locale: getCurrentLocale() ?? null,
            } satisfies CredentialIngestionPayload);
            const added = await queue.add(
                'credentialIngestion',
                { referenceId },
                {
                    jobId: referenceId,
                    deduplication: {
                        id: getOwnerJobDeduplicationId(CREDENTIAL_INGESTION_QUEUE, did),
                    },
                }
            );
            const job = (await queue.getJob(String(added.id))) ?? added;
            const deduplicated = job.data.referenceId !== referenceId;
            if (deduplicated) await db.deleteOwnerJobPayload(did, referenceId);
            if (!deduplicated && (await job.getState()) === 'waiting')
                await markCredentialIngestionQueued(did, source);
            await assertOwnerOperationActive(did);
            return { job, deduplicated };
        } catch (error) {
            // Keep any possibly-enqueued reference on ambiguous queue failures. Its
            // Mongo owner index remains the erasure authority even if BullMQ is down.
            await markCredentialIngestionError(did, source);
            throw error;
        }
    });
