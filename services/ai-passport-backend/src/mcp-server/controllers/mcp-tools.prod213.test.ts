import { describe, expect, mock, test } from 'bun:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { VC } from '@learncard/types';

process.env.AI_PRIVACY_KEY ||= Buffer.alloc(32, 7).toString('base64');
process.env.MONGO_URI ||= 'mongodb://localhost:27017/test';
process.env.OPENAI_API_KEY ||= 'test-openai-key';
process.env.SEED ||= 'test-seed';

/*
 * Both MCP read tools on a 213-credential account, with the prod factors the
 * v33 logs point at (2026-11-10, both tools timed out at 45s):
 * - verify is a synchronous CPU block (DIDKit/WASM) of VERIFY_CPU_MS;
 * - ~40% of credentials are invalid (31 of the first ~38 get_answer touched);
 * - Redis (the owner-operation fence, one script per call) is one connection,
 *   and Mongo is a pool of MONGO_POOL; background store writes hold a Mongo
 *   connection for STORE_MS and begin their own owner operation on Redis;
 * - consent reads CONSENT_MS, a few cold reads COLD_READ_MS, a summary model
 *   call LLM_MS (measured 9.8s), the answer model call ANSWER_MS;
 * - the two calls land on different, freshly restarted machines: in-memory
 *   caches are cleared between them, Mongo is shared.
 * Search is a stub with the old shape: query expansion (a model call) unless
 * expandQueries is false, then an embedding and a vector query.
 */
const OWNER = 'did:example:learner';
const CREDENTIALS = 213;
const CONSENT_MS = 675;
const READ_MS = 150;
const COLD_READ_MS = 2_500;
const VERIFY_CPU_MS = 70;
const FENCE_MS = 15;
const MONGO_POOL = 5;
const STORE_MS = 1_500;
const LLM_MS = 9_800;
const ANSWER_MS = 8_000;
const EXPANSION_MS = 3_000;
const BUDGET_MS = 45_000;
/** The per-call credential cap (MCP_CONTEXT_MAX_CREDENTIALS default). */
const MAX_CREDENTIALS = 20;
const CONTRACT_URI =
    process.env.LEARNCARD_CONTRACT_URI ||
    'lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b';

const isInvalid = (index: number) => index % 5 < 2;
const isCold = (index: number) => index % 25 === 11;
const indexOf = (uri: string) => Number(uri.slice(uri.lastIndexOf('-') + 1));
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const busy = (ms: number) => {
    const until = performance.now() + ms;
    while (performance.now() < until);
};

const pool = (size: number) => {
    let active = 0;
    let maxWaitMs = 0;
    const waiting: Array<() => void> = [];
    return {
        get maxWaitMs() {
            return maxWaitMs;
        },
        use: async (ms: number) => {
            const queuedAt = performance.now();
            if (active < size) active += 1;
            else await new Promise<void>(resolve => waiting.push(resolve));
            maxWaitMs = Math.max(maxWaitMs, performance.now() - queuedAt);
            try {
                await sleep(ms);
            } finally {
                const next = waiting.shift();
                if (next) next();
                else active -= 1;
            }
        },
    };
};
const redis = pool(1);
const mongo = pool(MONGO_POOL);

const uris = Array.from({ length: CREDENTIALS }, (_, index) => `lc:cloud:credential:prod-${index}`);
const createTestVc = (id: string): VC => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id,
    type: ['VerifiableCredential', 'AchievementCredential'],
    issuer: 'did:test:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: OWNER, achievement: { name: `Skill ${indexOf(id)}` } },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:test:issuer#key-1',
    },
});
const activeRecord = () => ({
    contractUri: CONTRACT_URI,
    termsUri: 'lc:network:terms:active',
    status: 'live',
    date: '2026-08-01T00:00:00.000Z',
    expiresAt: '2027-08-01T00:00:00.000Z',
    contractUpdatedAt: '2026-08-01T00:00:00.000Z',
    guardian: { required: false, approved: false },
    credentials: uris.map(uri => ({ category: 'Achievement', uri })),
    terms: {
        read: {
            credentials: {
                sharing: true,
                categories: { Achievement: { sharing: true, shared: uris } },
            },
        },
    },
});

const storedInvalid = new Set<string>();
/** Credential reads during the current call, by URI. */
const reads = new Map<string, number>();
const prompts: string[] = [];

const operations = new AsyncLocalStorage<{ did: string; token: string; signal: AbortSignal }>();
class MockDataErasureRequestedError extends Error {
    readonly code = 'data_erasure_requested';
}
mock.module('../../services/dataErasure', () => ({
    DataErasureRequestedError: MockDataErasureRequestedError,
    isDataErasureRequestedError: (error: unknown) => error instanceof MockDataErasureRequestedError,
    PRIVACY_MAINTENANCE_KEY: 'test:privacy:maintenance',
    PENDING_ERASURES_KEY: 'test:privacy:pending-erasures',
    OWNER_OPERATION_FENCE_SCRIPT: '',
    assertPrivacyRuntimeReady: async () => undefined,
    requestDataErasure: async () => ({ requestedAt: new Date().toISOString() }),
    completeDataErasure: async () => ({ completedAt: new Date().toISOString() }),
    readPendingDataErasurePage: async () => ({ items: [], cursor: '' }),
    // The fence: one Redis script per call on the one connection.
    assertOwnerOperationActive: async () => redis.use(FENCE_MS),
    assertNoDataErasureRequested: async () => undefined,
    isDataErasureRequested: async () => false,
    getCurrentOwnerOperation: () => operations.getStore(),
    runOutsideOwnerOperation: <T>(callback: () => T): T => operations.exit(callback),
    getOwnerOperationFence: () => undefined,
    getActiveOwnerOperationCount: async () => 0,
    registerOwnerSocket: () => undefined,
    unregisterOwnerSocket: () => undefined,
    closeOwnerSockets: () => undefined,
    withOwnerOperation: async (did: string, operation: () => Promise<unknown>) => {
        await redis.use(FENCE_MS);
        return operations.run(
            { did, token: randomUUID(), signal: new AbortController().signal },
            async () => {
                const result = await operation();
                await redis.use(FENCE_MS);
                return result;
            }
        );
    },
}));
mock.module('../../learncard', () => ({
    getLearnCard: async () => ({
        invoke: {
            getConsentFlowDataForDid: async () => {
                await sleep(CONSENT_MS);
                return { records: [activeRecord()], hasMore: false };
            },
            verifyCredential: async (credential?: VC) => {
                busy(VERIFY_CPU_MS);
                const index = indexOf(typeof credential?.id === 'string' ? credential.id : '');
                return isInvalid(index)
                    ? { checks: [], errors: ['Invalid signature'], warnings: [] }
                    : { checks: ['proof'], errors: [], warnings: [] };
            },
        },
        read: {
            get: async (uri: string) => {
                reads.set(uri, (reads.get(uri) ?? 0) + 1);
                await sleep(isCold(indexOf(uri)) ? COLD_READ_MS : READ_MS);
                return createTestVc(uri);
            },
        },
    }),
}));
const aiCall = mock(async (request: { message?: string; userPrompt?: string }) => {
    prompts.push(JSON.stringify(request));
    await sleep(LLM_MS);
    return { prompt: 'Synthesized learner context', summary: 'Cluster summary' };
});
const streamingAiCall = mock(async (request: { message?: string }) => {
    prompts.push(request.message ?? '');
    await sleep(ANSWER_MS);
    return 'Answer grounded in the learner evidence';
});
const aiStubs = {
    aiCall,
    streamingAiCall,
    streamingStructuredAiCall: mock(async () => ({})),
    generateTopics: mock(async () => []),
    getSuggestedTopics: mock(async () => []),
    warmUpTopicsCache: mock(async () => undefined),
    generateCredentialEmbeddingTexts: mock(async () => ({})),
    generateCredentialTitle: mock(async () => 'title'),
    generateAndStoreCredentialEmbeddings: mock(async () => undefined),
};
mock.module('../../ai', () => aiStubs);
mock.module(new URL('../../ai/index.ts', import.meta.url).href, () => aiStubs);
mock.module('../../ai/client', () => ({
    ...aiStubs,
    embeddingAiCall: mock(async () => []),
}));
mock.module('../../ai/pseudonymization', () => ({
    decryptIdentifierMapping: () => undefined,
    createIdentifierMappingService: () => ({}),
    measureProviderInputSize: () => 0,
    pseudonymizeProviderInput: async (text: string) => text,
    restoreProviderOutput: async (text: string) => text,
    deleteIdentifierMappingsForSubject: async () => undefined,
}));
mock.module('../../services/credentialSearch', () => ({
    searchCredentialsByTopic: async (
        _topic: string,
        _did: string,
        options: { expandQueries?: boolean; signal?: AbortSignal } = {}
    ) => {
        if (options.expandQueries !== false) await sleep(EXPANSION_MS);
        await sleep(400);
        options.signal?.throwIfAborted();
        await mongo.use(100);
        return [{ title: 'Skill 7', type: 'Achievement', score: 0.91, context: 'Skill 7 detail' }];
    },
}));
mock.module('../../db', () => ({
    db: {
        deleteVCsByUris: async () => mongo.use(300),
        removeThreadCredentialsByUris: async () => mongo.use(300),
        storeCredentialVerification: async (
            _did: string,
            verification: { credentialUri: string; status: string }
        ) => {
            await mongo.use(STORE_MS);
            if (verification.status === 'invalid') storedInvalid.add(verification.credentialUri);
        },
        storeRawCredential: async () => mongo.use(STORE_MS),
        getInvalidCredentialUris: async (_did: string, candidates: string[]) => {
            await mongo.use(50);
            return candidates.filter(uri => storedInvalid.has(uri));
        },
        getLearnerContextPromptByHash: async () => {
            await mongo.use(30);
            return undefined;
        },
        upsertLearnerContextPromptByHash: async () => mongo.use(STORE_MS),
        getCredentialSummaryByHash: async () => {
            await mongo.use(30);
            return undefined;
        },
        upsertCredentialSummaryByHash: async () => mongo.use(STORE_MS),
    },
}));

const { getLatestUserSummary } = await import('./get-user-context');
const { getAnswerAboutUser } = await import('./get-answer-about-user');
const { runWithAiPrivacyContext } = await import('../../ai/privacy');
const { resetConsentSnapshots } = await import('../../learncard/requestScope');
const { clearKnownBadCredentials, clearVerifiedCredentials } =
    await import('../../credentials/batch');
const { resetPostBatchEstimates } = await import('../../diagnostics/post-batch-reserve');
const { runMcpOwnerOperation } = await import('../ownerOperation');
const { drainCredentialStores } = await import('../../credentials/store-queue');

const events: Array<Record<string, unknown>> = [];
const capture = (...data: unknown[]) => {
    for (const item of data)
        if (item && typeof item === 'object' && 'event' in item)
            events.push(item as Record<string, unknown>);
    return undefined;
};

/** A fresh machine: no in-memory caches, no request state; Mongo is shared. */
const freshMachine = () => {
    resetConsentSnapshots();
    resetPostBatchEstimates();
    clearKnownBadCredentials();
    clearVerifiedCredentials();
};

const call = async <T>(
    tool: 'get_user_context' | 'get_answer_about_user',
    operation: () => Promise<T>
) => {
    reads.clear();
    const startedAt = performance.now();
    const outcome = await runWithAiPrivacyContext(OWNER, () =>
        runMcpOwnerOperation(OWNER, operation, tool)
    ).then(
        value => ({ value, error: undefined as unknown }),
        (error: unknown) => ({ value: undefined, error })
    );
    const elapsedMs = performance.now() - startedAt;
    const readUris = [...reads.keys()];
    const readOnce = [...reads.values()].every(count => count === 1);
    console.log(
        `${tool}: ${outcome.error ? `failed (${(outcome.error as Error).name})` : 'ok'} in ` +
            `${Math.round(elapsedMs)}ms, read ${readUris.length} of ${CREDENTIALS} credentials`
    );
    return { ...outcome, elapsedMs, readUris, readOnce };
};

describe('MCP read tools on a 213-credential account under prod factors', () => {
    test(
        'get_user_context then get_answer_about_user both return real context inside 45s',
        async () => {
            const originals = [console.info, console.warn, console.error] as const;
            console.info = capture as typeof console.info;
            console.warn = capture as typeof console.warn;
            console.error = capture as typeof console.error;
            process.env.MCP_TOOL_TIMEOUT_MS = String(BUDGET_MS);
            try {
                freshMachine();
                const context = await call('get_user_context', () => getLatestUserSummary(OWNER));
                // The gap between the calls in prod was ~11s; background writes finish.
                await Promise.race([drainCredentialStores(), sleep(30_000)]);
                freshMachine();
                prompts.length = 0;
                const knownInvalid = new Set(storedInvalid);
                const answer = await call('get_answer_about_user', () =>
                    getAnswerAboutUser(OWNER, 'What has this learner achieved?')
                );
                await Promise.race([drainCredentialStores(), sleep(30_000)]);

                console.log(
                    `redis max wait ${Math.round(redis.maxWaitMs)}ms, mongo max wait ${Math.round(mongo.maxWaitMs)}ms`
                );

                expect(context.error).toBeUndefined();
                expect(context.value).toBe('Synthesized learner context');
                expect(context.elapsedMs).toBeLessThan(BUDGET_MS);
                // Each credential read at most once; the rest deferred to a later call.
                expect(context.readUris.length).toBeGreaterThan(0);
                expect(context.readUris.length).toBeLessThan(CREDENTIALS);
                expect(context.readOnce).toBe(true);

                expect(answer.error).toBeUndefined();
                expect(answer.value).toBe('Answer grounded in the learner evidence');
                expect(answer.elapsedMs).toBeLessThan(BUDGET_MS);
                expect(answer.readUris.length).toBeGreaterThan(0);
                expect(answer.readUris.length).toBeLessThan(CREDENTIALS);
                expect(answer.readOnce).toBe(true);
                // The answer saw real, verified credential evidence and no invalid one.
                const answerPrompt = prompts.at(-1) ?? '';
                const evidence = [...answerPrompt.matchAll(/"value":"Skill (\d+)"/g)].map(match =>
                    Number(match[1])
                );
                expect(evidence.length).toBeGreaterThan(0);
                expect(evidence.length).toBeLessThanOrEqual(MAX_CREDENTIALS);
                expect(evidence.filter(isInvalid)).toEqual([]);
                // The second machine never read what the first stored as invalid.
                expect(knownInvalid.size).toBeGreaterThan(0);
                expect(answer.readUris.filter(uri => knownInvalid.has(uri))).toEqual([]);
                expect(JSON.stringify(events)).not.toContain('lc:cloud:credential');
            } finally {
                [console.info, console.warn, console.error] = originals;
                delete process.env.MCP_TOOL_TIMEOUT_MS;
            }
        },
        { timeout: 240_000 }
    );
});
