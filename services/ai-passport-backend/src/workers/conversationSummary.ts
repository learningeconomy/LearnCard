import type { OwnerJobData, ConversationSummaryPayload } from './types';

import { Queue, UnrecoverableError, Worker } from 'bullmq';
import { redisConnectionOptions } from '../lib/redis';
import { CONVERSATION_SUMMARY_QUEUE } from '../constants/queues';
import { sendConversationSummary } from '../services/awarding';
import { db } from '../db';
import { REDIS_PREFIX } from '../constants/env';
import { getCurrentLocale, runWithLocale } from '../ai/locale';
import { assertCurrentAiConsent, runWithAiPrivacyContext } from '../ai/privacy';
import {
    assertOwnerOperationActive,
    isDataErasureRequested,
    isDataErasureRequestedError,
    withOwnerOperation,
} from '../services/dataErasure';
import { getOwnerJobDeduplicationId, getOwnerJobRecord, sanitizeOwnerJobError } from './ownerJobs';

export const summaryQueue = new Queue<OwnerJobData>(CONVERSATION_SUMMARY_QUEUE, {
    connection: redisConnectionOptions,
    prefix: `${REDIS_PREFIX}:`,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
    },
});

export const enqueueConversationSummary = async (
    did: string,
    threadId: string
): Promise<boolean> => {
    if (await isDataErasureRequested(did)) return false;
    try {
        return await withOwnerOperation(did, async () => {
            if (await db.isThreadEnded(threadId, did)) return false;
            const referenceId = await db.storeOwnerJobPayload(did, CONVERSATION_SUMMARY_QUEUE, {
                threadId,
                locale: getCurrentLocale() ?? null,
            } satisfies ConversationSummaryPayload);
            const jobId = getOwnerJobDeduplicationId(CONVERSATION_SUMMARY_QUEUE, did, threadId);
            const added = await summaryQueue.add(
                'generate-summary',
                { referenceId },
                { jobId, delay: 15 * 60 * 1000 }
            );
            const canonical = (await summaryQueue.getJob(jobId)) ?? added;
            if (canonical.data.referenceId !== referenceId)
                await db.deleteOwnerJobPayload(did, referenceId);
            await assertOwnerOperationActive(did);
            return true;
        });
    } catch (error) {
        if (isDataErasureRequestedError(error)) return false;
        throw error;
    }
};

export const cancelConversationSummary = async (did: string, threadId: string): Promise<void> => {
    await withOwnerOperation(did, async () => {
        const job = await summaryQueue.getJob(
            getOwnerJobDeduplicationId(CONVERSATION_SUMMARY_QUEUE, did, threadId)
        );
        if (!job) return;
        const record = await getOwnerJobRecord(job);
        if (!record || record.did !== did || record.queue !== CONVERSATION_SUMMARY_QUEUE) return;
        await job.remove();
        await db.deleteOwnerJobPayload(did, job.data.referenceId);
    });
};

export const startConversationSummaryWorker = () => {
    const worker = new Worker<OwnerJobData, void>(
        CONVERSATION_SUMMARY_QUEUE,
        async job => {
            try {
                const record = await getOwnerJobRecord(job);
                if (!record) throw new UnrecoverableError('owner_job_payload_unavailable');
                const payload = record.payload as Partial<ConversationSummaryPayload> | null;
                if (
                    record.queue !== CONVERSATION_SUMMARY_QUEUE ||
                    !payload ||
                    typeof payload.threadId !== 'string' ||
                    (payload.locale != null && typeof payload.locale !== 'string')
                )
                    throw new UnrecoverableError('owner_job_payload_invalid');
                const { did } = record;
                const { threadId, locale } = payload;
                await withOwnerOperation(did, () =>
                    runWithAiPrivacyContext(did, () =>
                        runWithLocale(locale, async () => {
                            await assertCurrentAiConsent('model-inference');
                            if (!(await db.isThreadEnded(threadId, did))) {
                                const messages = await db.getModelMessages(did, threadId);
                                const topicCredentialUri = await db.getThreadTopicCredential(
                                    did,
                                    threadId
                                );
                                await assertOwnerOperationActive(did);
                                await sendConversationSummary(
                                    { send: () => 0 },
                                    did,
                                    messages,
                                    threadId,
                                    topicCredentialUri
                                );
                            }
                            await assertOwnerOperationActive(did);
                            await db.deleteOwnerJobPayload(did, job.data.referenceId);
                        })
                    )
                );
            } catch (error) {
                throw sanitizeOwnerJobError(error);
            }
        },
        {
            connection: redisConnectionOptions,
            concurrency: 1,
            prefix: `${REDIS_PREFIX}:`,
        }
    );
    worker.on('error', () => console.error('Summary worker infrastructure error'));
    return worker;
};
