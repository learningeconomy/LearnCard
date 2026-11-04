import type { OwnerJobData } from './types';

import { createHmac } from 'node:crypto';
import { Queue, UnrecoverableError } from 'bullmq';
import { db } from '../db';
import { getPrivacyKeyMaterial } from '../ai/privacy-keys';
import { AI_ERROR_CODES, isAiProviderError } from '../ai/errors';
import { AiConsentError } from '../learncard/consent';
import { isDataErasureRequestedError, PRIVACY_MAINTENANCE_KEY } from '../services/dataErasure';
import cache from '../utils/cache';
import { redisConnectionOptions } from '../lib/redis';
import { REDIS_PREFIX } from '../constants/env';
import { CONVERSATION_SUMMARY_QUEUE, CREDENTIAL_INGESTION_QUEUE } from '../constants/queues';

export const isOwnerJobData = (data: unknown): data is OwnerJobData => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const record = data as Record<string, unknown>;
    return (
        Object.keys(record).length === 1 &&
        typeof record.referenceId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            record.referenceId
        )
    );
};

export const getOwnerJobRecord = async (job: {
    data: unknown;
}): Promise<{
    did: string;
    queue: string;
    payload: unknown;
} | null> => {
    if (!isOwnerJobData(job.data)) return null;
    return db.getOwnerJobPayload(job.data.referenceId);
};

// Domain separation prevents queue deduplication tokens being joined to other
// privacy references. Neither a DID nor a thread identifier reaches BullMQ.
export const getOwnerJobDeduplicationId = (queue: string, did: string, threadId?: string): string =>
    createHmac('sha256', getPrivacyKeyMaterial().reference)
        .update(JSON.stringify(['owner-job:v1', queue, did, threadId ?? null]))
        .digest('hex');

export const sanitizeOwnerJobError = (error: unknown): Error => {
    let code = 'owner_job_failed';
    let unrecoverable = error instanceof UnrecoverableError;
    if (isDataErasureRequestedError(error)) {
        code = 'data_erasure_requested';
        unrecoverable = true;
    } else if (error instanceof AiConsentError) {
        code = 'active_ai_consent_required';
        unrecoverable = true;
    } else if (isAiProviderError(error)) {
        if (AI_ERROR_CODES.includes(error.code)) code = error.code;
        unrecoverable = !error.retryable;
    } else if (
        error instanceof UnrecoverableError &&
        ['owner_job_payload_unavailable', 'owner_job_payload_invalid'].includes(error.message)
    ) {
        code = error.message;
    }
    // Do not attach a cause: BullMQ persists both messages and stacks.
    const sanitized = unrecoverable ? new UnrecoverableError(code) : new Error(code);
    sanitized.stack = `${sanitized.name}: ${code}`;
    return sanitized;
};

/** Explicit maintenance cleanup, never a runtime decoder for legacy payloads. */
export const migrateLegacyOwnerJobs = async ({ apply }: { apply: boolean }) => {
    if (apply && (!cache.redis || !(await cache.redis.exists(PRIVACY_MAINTENANCE_KEY))))
        throw new Error('Persistent privacy maintenance is required for queue migration');
    const report: {
        apply: boolean;
        queues: { queue: string; legacyJobs: number; removed: number }[];
    } = {
        apply,
        queues: [],
    };
    for (const name of [CREDENTIAL_INGESTION_QUEUE, CONVERSATION_SUMMARY_QUEUE]) {
        const queue = new Queue(name, {
            connection: redisConnectionOptions,
            prefix: `${REDIS_PREFIX}:`,
            skipMetasUpdate: true,
        });
        try {
            // The CLI holds the persistent maintenance fence and drains workers first.
            // Refuse cleanup with active work rather than destroying lock evidence.
            if (await queue.getActiveCount())
                throw new Error('Legacy queue cleanup requires drained workers');
            const jobs = await queue.getJobs([
                'active',
                'completed',
                'delayed',
                'failed',
                'paused',
                'prioritized',
                'waiting',
                'waiting-children',
            ]);
            const legacy = jobs.filter(job => !isOwnerJobData(job.data));
            const entry = { queue: name, legacyJobs: legacy.length, removed: 0 };
            report.queues.push(entry);
            if (apply) {
                for (const job of legacy) {
                    await job.remove();
                    entry.removed += 1;
                }
                // Old stream events may retain raw progress, results, and failures even
                // after the corresponding jobs have been removed.
                await queue.trimEvents(0);
            }
        } finally {
            await queue.close();
        }
    }
    return report;
};
