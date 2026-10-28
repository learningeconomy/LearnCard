import type { ConversationSummaryPayload, OwnerJobData } from './types';

import { beforeEach, describe, expect, it, mock } from 'bun:test';

const records = new Map<
    string,
    { did: string; queue: string; payload: ConversationSummaryPayload }
>();
const queued = new Map<string, { data: OwnerJobData }>();
let processSummary: (job: { data: OwnerJobData }) => Promise<void>;
let beforeAdd: (() => Promise<void>) | undefined;
let erased = false;
let denied = false;
let ended = false;
let summaries = 0;
let summaryLocale: string | undefined;

class ErasureError extends Error {}
class ConsentError extends Error {}
const assertActive = async () => {
    if (erased) throw new ErasureError();
};
const sendConversationSummary = mock(async () => {
    summaries += 1;
    summaryLocale = getCurrentLocale();
});
const db = {
    isThreadEnded: async () => ended,
    getModelMessages: async () => [{ role: 'user', content: 'Question' }],
    getThreadTopicCredential: async () => 'lc:topic:1',
    storeOwnerJobPayload: async (
        did: string,
        queue: string,
        payload: ConversationSummaryPayload
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
        async add(_name: string, data: OwnerJobData, options: { jobId: string }) {
            await beforeAdd?.();
            if (!queued.has(options.jobId)) queued.set(options.jobId, { data });
            return { data };
        }
        async getJob(id: string) {
            return queued.get(id) ?? null;
        }
    },
    Worker: class {
        constructor(_name: string, processor: typeof processSummary) {
            processSummary = processor;
        }
        on() {}
    },
    UnrecoverableError: class extends Error {},
}));
mock.module('../lib/redis', () => ({ redisConnectionOptions: {} }));
mock.module('../constants/env', () => ({ REDIS_PREFIX: 'test' }));
mock.module('../utils/cache', () => ({ default: { redis: undefined } }));
mock.module('../ai/privacy-keys', () => ({
    getPrivacyKeyMaterial: () => ({ reference: Buffer.alloc(32, 1) }),
}));
mock.module('../learncard/consent', () => ({ AiConsentError: ConsentError }));
mock.module('../db', () => ({ db }));
mock.module('../services/awarding', () => ({ sendConversationSummary }));
mock.module('../ai/privacy', () => ({
    runWithAiPrivacyContext: (_did: string, fn: () => unknown) => fn(),
    assertCurrentAiConsent: async () => {
        if (denied) throw new ConsentError();
    },
}));
mock.module('../services/dataErasure', () => ({
    PRIVACY_MAINTENANCE_KEY: 'fixture:privacy:maintenance',
    assertOwnerOperationActive: assertActive,
    isDataErasureRequested: async () => erased,
    isDataErasureRequestedError: (error: unknown) => error instanceof ErasureError,
    withOwnerOperation: async (_did: string, fn: () => Promise<unknown>) => {
        await assertActive();
        const result = await fn();
        await assertActive();
        return result;
    },
}));

// Install dependency mocks before the worker module captures its processor.
const { getCurrentLocale, runWithLocale } = await import('../ai/locale');
const { enqueueConversationSummary, startConversationSummaryWorker } =
    await import('./conversationSummary');
startConversationSummaryWorker();

const scheduledJob = () => queued.values().next().value!;

describe('private summary jobs', () => {
    beforeEach(() => {
        records.clear();
        queued.clear();
        erased = denied = ended = false;
        summaries = 0;
        summaryLocale = undefined;
        beforeAdd = undefined;
    });

    it('does not schedule ended or erased conversations', async () => {
        ended = true;
        expect(await enqueueConversationSummary('did:example:learner', 'thread')).toBe(false);
        ended = false;
        erased = true;
        expect(await enqueueConversationSummary('did:example:learner', 'thread')).toBe(false);
        expect(queued.size).toBe(0);
        expect(records.size).toBe(0);
    });

    it("deduplicates a thread and preserves the original delayed job's locale", async () => {
        await runWithLocale('fr', () =>
            enqueueConversationSummary('did:example:learner', 'thread')
        );
        await runWithLocale('es', () =>
            enqueueConversationSummary('did:example:learner', 'thread')
        );
        expect(queued.size).toBe(1);
        expect(records.size).toBe(1);
        await processSummary(scheduledJob());
        expect(summaries).toBe(1);
        expect(summaryLocale).toBe('fr');
        expect(getCurrentLocale()).toBeUndefined();
    });

    it('does not summarize a thread that ended while delayed', async () => {
        await enqueueConversationSummary('did:example:learner', 'thread');
        ended = true;
        await processSummary(scheduledJob());
        expect(summaries).toBe(0);
    });

    it('requires current consent rather than the enqueue-time grant', async () => {
        await enqueueConversationSummary('did:example:learner', 'thread');
        denied = true;
        await expect(processSummary(scheduledJob())).rejects.toThrow('active_ai_consent_required');
        expect(summaries).toBe(0);
    });

    it('leaves a late enqueue inert after the private payload was erased', async () => {
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
        const enqueuing = enqueueConversationSummary('did:example:learner', 'private-thread');
        await paused;
        erased = true;
        records.clear();
        resume();
        expect(await enqueuing).toBe(false);
        const serialized = JSON.stringify([...queued]);
        expect(serialized).not.toContain('did:example:learner');
        expect(serialized).not.toContain('private-thread');
        await expect(processSummary(scheduledJob())).rejects.toThrow(
            'owner_job_payload_unavailable'
        );
        expect(summaries).toBe(0);
        expect(records.size).toBe(0);
    });
});
