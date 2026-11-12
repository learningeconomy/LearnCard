import { beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import type { VC } from '@learncard/types';

process.env.AI_PRIVACY_KEY ||= Buffer.alloc(32, 7).toString('base64');
process.env.MONGO_URI ||= 'mongodb://localhost:27017/test';
process.env.OPENAI_API_KEY ||= 'test-openai-key';
process.env.SEED ||= 'test-seed';

const OWNER = 'did:example:learner';
const VALID_URI = 'lc:cloud:credential:valid-1';
const INVALID_URI = 'lc:cloud:credential:invalid-1';
const CONTRACT_URI =
    process.env.LEARNCARD_CONTRACT_URI ||
    'lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b';

const createTestVc = (id: string): VC => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id,
    type: ['VerifiableCredential', 'AchievementCredential'],
    issuer: 'did:test:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: OWNER, achievement: { name: 'TypeScript Foundations' } },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:test:issuer#key-1',
    },
});

const createActiveRecord = (uris: string[], date = '2026-08-01T00:00:00.000Z') => ({
    contractUri: CONTRACT_URI,
    termsUri: 'lc:network:terms:active',
    status: 'live',
    date,
    expiresAt: '2027-08-01T00:00:00.000Z',
    contractUpdatedAt: '2026-08-01T00:00:00.000Z',
    guardian: { required: false, approved: false },
    credentials: uris.map(uri => ({ category: 'Achievement', uri })),
    terms: {
        read: {
            credentials: {
                sharing: true,
                categories: {
                    Achievement: { sharing: true, shared: uris },
                },
            },
        },
    },
});

let consentReads = 0;
let storeAttempts = 0;
let failFirstStore = false;
let uris = [VALID_URI, INVALID_URI];
const verified: string[] = [];
const events: Array<Record<string, unknown>> = [];
/** Stored ingest-verified text by URI (rows earlier ingestion wrote). */
const storedText = new Map<string, string>();
/** Stored text whose stored verification or projection does not validate. */
const unverifiedText = new Map<string, string>();

const getConsentFlowDataForDid = mock(async () => {
    consentReads += 1;
    const date = new Date(
        Date.parse('2026-08-01T00:00:00.000Z') + consentReads * 1000
    ).toISOString();
    return { records: [createActiveRecord(uris, date)], hasMore: false };
});

const readGet = mock(async (uri?: string) => createTestVc(uri ?? VALID_URI));
const verifyCredential = mock(async (credential?: VC) => {
    const id = typeof credential?.id === 'string' ? credential.id : '';
    verified.push(id);
    if (id === INVALID_URI) {
        return { checks: [], errors: ['Invalid signature'], warnings: [] };
    }
    return { checks: ['proof'], errors: [], warnings: [] };
});

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
    assertOwnerOperationActive: async () => undefined,
    assertNoDataErasureRequested: async () => undefined,
    isDataErasureRequested: async () => false,
    getCurrentOwnerOperation: () => undefined,
    getOwnerOperationFence: () => undefined,
    getActiveOwnerOperationCount: async () => 0,
    registerOwnerSocket: () => undefined,
    unregisterOwnerSocket: () => undefined,
    closeOwnerSockets: () => undefined,
    withOwnerOperation: async (_did: string, operation: () => Promise<unknown>) => operation(),
}));
mock.module('../../learncard', () => ({
    getLearnCard: async () => ({
        invoke: { getConsentFlowDataForDid, verifyCredential },
        read: { get: readGet },
    }),
}));
const aiStubs = {
    aiCall: mock(async () => ({ prompt: 'Sibling learner context', summary: 'Sibling summary' })),
    streamingAiCall: mock(async () => 'stream'),
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
mock.module('../../ai/pseudonymization', () => ({
    decryptIdentifierMapping: () => undefined,
    createIdentifierMappingService: () => ({}),
    measureProviderInputSize: () => 0,
    pseudonymizeProviderInput: async (text: string) => text,
    restoreProviderOutput: async (text: string) => text,
    deleteIdentifierMappingsForSubject: async () => undefined,
}));
mock.module('../../db', () => ({
    db: {
        deleteVCsByUris: mock(async () => 0),
        removeThreadCredentialsByUris: mock(async () => 0),
        storeCredentialVerification: mock(async () => {
            storeAttempts += 1;
            if (failFirstStore && storeAttempts === 1) {
                throw new Error('Cleanup scope changed; retry');
            }
        }),
        storeRawCredential: mock(async () => undefined),
        getLearnerContextPromptByHash: mock(async () => undefined),
        upsertLearnerContextPromptByHash: mock(async () => undefined),
        getCredentialSummaryByHash: mock(async () => undefined),
        upsertCredentialSummaryByHash: mock(async () => undefined),
        // Every stored row, whatever was asked: a stale row must still be
        // filtered by the request's consent.
        getCredentialAiContexts: mock(
            async (): Promise<
                { uri: string; aiContext?: string; category?: string; verified?: true }[]
            > => [
                ...[...storedText].map(([uri, aiContext]) => ({
                    uri,
                    aiContext,
                    category: 'Achievement',
                    verified: true as const,
                })),
                ...[...unverifiedText].map(([uri, aiContext]) => ({ uri, aiContext })),
            ]
        ),
    },
}));

const { getLatestUserSummary } = await import('./get-user-context');
const { generateLearnerContextPrompt, parseLearnerContextPromptRequest } =
    await import('../../services/learnerContextPrompt');
const { credentialBatchConcurrency } = await import('../../credentials/batch');
const { runWithAiPrivacyContext } = await import('../../ai/privacy');
const { runWithLearnCardRequestScope, resetConsentSnapshots } =
    await import('../../learncard/requestScope');
const { clearKnownBadCredentials, clearVerifiedCredentials } =
    await import('../../credentials/batch');
const { logSafeEvent } = await import('../../logging');
const { resetPostBatchEstimates } = await import('../../diagnostics/post-batch-reserve');

const originalInfo = console.info;
const originalWarn = console.warn;
const capture = (...data: unknown[]) => {
    for (const item of data) {
        if (item && typeof item === 'object' && 'event' in item) {
            events.push(item as Record<string, unknown>);
        }
    }
};

const runTool = () =>
    runWithAiPrivacyContext(OWNER, () =>
        runWithLearnCardRequestScope({}, () => getLatestUserSummary(OWNER))
    );

beforeEach(() => {
    resetConsentSnapshots();
    resetPostBatchEstimates();
    clearKnownBadCredentials();
    clearVerifiedCredentials();
    consentReads = 0;
    storeAttempts = 0;
    failFirstStore = false;
    uris = [VALID_URI, INVALID_URI];
    verified.length = 0;
    events.length = 0;
    storedText.clear();
    unverifiedText.clear();
    getConsentFlowDataForDid.mockClear();
    readGet.mockClear();
    verifyCredential.mockClear();
    console.info = ((...data: unknown[]) => {
        capture(...data);
        return undefined;
    }) as typeof console.info;
    console.warn = ((...data: unknown[]) => {
        capture(...data);
        return undefined;
    }) as typeof console.warn;
});

describe('MCP get_user_context projection convergence', () => {
    test('skips an invalid credential and returns sibling context without a second resolve pass', async () => {
        try {
            const context = await runTool();
            expect(context).toBe('Sibling learner context');
            expect(verified.filter(id => id === INVALID_URI)).toEqual([INVALID_URI]);
            expect(verified.filter(id => id === VALID_URI)).toEqual([VALID_URI]);
            expect(events.some(event => event.event === 'credential_skipped')).toBe(true);
            expect(
                events
                    .filter(event => event.event === 'credential_skipped')
                    .some(event => event.failureCode === 'credential_invalid')
            ).toBe(true);
        } finally {
            console.info = originalInfo;
            console.warn = originalWarn;
        }
    });

    test('retries a cleanup-scope change a bounded number of times then returns context', async () => {
        uris = [VALID_URI];
        failFirstStore = true;
        try {
            const context = await runTool();
            expect(context).toBe('Sibling learner context');
            // One restart: the failed store, then the one that lands.
            expect(storeAttempts).toBe(2);
        } finally {
            console.info = originalInfo;
            console.warn = originalWarn;
        }
    });
});

describe('/ai/learner-context/format credential fan-out', () => {
    test('direct prompt generation over 50 URIs never resolves more than the batch limit at once', async () => {
        uris = Array.from({ length: 50 }, (_, index) => `lc:cloud:credential:fanout-${index}`);
        let active = 0;
        let maxActive = 0;
        readGet.mockImplementation(async (uri?: string) => {
            active += 1;
            maxActive = Math.max(maxActive, active);
            // Deferred: hold each read until the event loop has had a chance to
            // start every other resolution an unbounded batch would start.
            await new Promise<void>(resolve => setTimeout(resolve, 5));
            return createTestVc(uri ?? VALID_URI);
        });
        verifyCredential.mockImplementation(async (credential?: VC) => {
            verified.push(typeof credential?.id === 'string' ? credential.id : '');
            await new Promise(resolve => setTimeout(resolve, 1));
            active -= 1;
            return { checks: ['proof'], errors: [], warnings: [] };
        });
        try {
            const result = await runWithAiPrivacyContext(OWNER, () =>
                runWithLearnCardRequestScope({}, () =>
                    generateLearnerContextPrompt(
                        parseLearnerContextPromptRequest({
                            credentialUris: uris,
                            maxCredentials: 1,
                        })
                    )
                )
            );
            expect(result.prompt).toBe('Sibling learner context');
            expect(verified).toHaveLength(50);
            expect(credentialBatchConcurrency()).toBe(4);
            expect(maxActive).toBeGreaterThan(0);
            expect(maxActive).toBeLessThanOrEqual(credentialBatchConcurrency());
            console.log(`fan-out max concurrent resolutions: ${maxActive}`);
        } finally {
            readGet.mockImplementation(async (uri?: string) => createTestVc(uri ?? VALID_URI));
            verifyCredential.mockImplementation(async (credential?: VC) => {
                const id = typeof credential?.id === 'string' ? credential.id : '';
                verified.push(id);
                if (id === INVALID_URI)
                    return { checks: [], errors: ['Invalid signature'], warnings: [] };
                return { checks: ['proof'], errors: [], warnings: [] };
            });
            console.info = originalInfo;
            console.warn = originalWarn;
        }
    });
});

describe('MCP get_user_context credential read budget', () => {
    const HUNG_URI = 'lc:cloud:credential:hung-read-private';
    const FAILING_URI = 'lc:cloud:credential:failing-read-private';
    const SIBLING_URI = 'lc:cloud:credential:sibling-2';
    const BUDGET_MS = 3_000;

    const restore = () => {
        readGet.mockImplementation(async (uri?: string) => createTestVc(uri ?? VALID_URI));
        delete process.env.MCP_TOOL_TIMEOUT_MS;
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
    };
    const originalError = console.error;

    const runMcpTool = async () => {
        process.env.MCP_TOOL_TIMEOUT_MS = String(BUDGET_MS);
        console.error = ((...data: unknown[]) => {
            capture(...data);
            return undefined;
        }) as typeof console.error;
        const { runMcpOwnerOperation } = await import('../ownerOperation');
        const startedAt = performance.now();
        const context = await runMcpOwnerOperation(
            OWNER,
            () => getLatestUserSummary(OWNER),
            'get_user_context'
        );
        return { context, elapsedMs: performance.now() - startedAt };
    };

    const skippedCodes = () =>
        events
            .filter(event => event.event === 'credential_skipped' && 'index' in event)
            .map(event => event.failureCode);

    const expectNoRawUri = (...privateUris: string[]) => {
        const logged = JSON.stringify(events);
        for (const uri of privateUris) expect(logged).not.toContain(uri);
    };

    test('a never-resolving read is skipped and siblings return inside the tool budget', async () => {
        uris = [HUNG_URI, VALID_URI, SIBLING_URI];
        readGet.mockImplementation(async (uri?: string) =>
            uri === HUNG_URI ? new Promise<VC>(() => undefined) : createTestVc(uri ?? VALID_URI)
        );
        try {
            const { context, elapsedMs } = await runMcpTool();
            expect(context).toBe('Sibling learner context');
            expect(elapsedMs).toBeLessThan(BUDGET_MS);
            expect(skippedCodes()).toEqual(['credential_read_timeout']);
            expectNoRawUri(HUNG_URI, VALID_URI, SIBLING_URI);
            console.log(`hung-read tool returned in ${Math.round(elapsedMs)}ms`);
        } finally {
            restore();
        }
    });

    test('an always-failing read is skipped once, never restarted', async () => {
        uris = [FAILING_URI, VALID_URI];
        // A read error whose message matches a retryable cleanup message must
        // still not restart the projection: reads are never retried.
        readGet.mockImplementation(async (uri?: string) => {
            if (uri === FAILING_URI) throw new Error('Cleanup scope changed; retry');
            return createTestVc(uri ?? VALID_URI);
        });
        try {
            const { context } = await runMcpTool();
            expect(context).toBe('Sibling learner context');
            expect(readGet.mock.calls.filter(([uri]) => uri === FAILING_URI)).toHaveLength(1);
            expect(skippedCodes()).toEqual(['credential_read_failed']);
            expectNoRawUri(FAILING_URI, VALID_URI);
        } finally {
            restore();
        }
    });

    test('a store still queued when sharing consent is withdrawn writes no raw or verification row', async () => {
        const { db } = await import('../../db');
        const { beginCredentialContextRead } = await import('../../credentials/batch');
        const { drainCredentialStores, pendingCredentialStores } =
            await import('../../credentials/store-queue');
        const storeVerification = db.storeCredentialVerification as ReturnType<typeof mock>;
        const storeRaw = db.storeRawCredential as ReturnType<typeof mock>;
        storeVerification.mockClear();
        storeRaw.mockClear();
        uris = [VALID_URI];
        // Another context read for the owner keeps the background store queued.
        const releaseQueue = beginCredentialContextRead(OWNER);
        try {
            const { context } = await runMcpTool();
            expect(context).toBe('Sibling learner context');
            expect(pendingCredentialStores()).toBeGreaterThan(0);
            getConsentFlowDataForDid.mockImplementation(async () => ({
                records: [{ ...createActiveRecord(uris), status: 'withdrawn' }],
                hasMore: false,
            }));
            releaseQueue();
            await drainCredentialStores();
            expect(storeVerification).not.toHaveBeenCalled();
            expect(storeRaw).not.toHaveBeenCalled();
        } finally {
            releaseQueue();
            getConsentFlowDataForDid.mockImplementation(async () => {
                consentReads += 1;
                const date = new Date(
                    Date.parse('2026-08-01T00:00:00.000Z') + consentReads * 1000
                ).toISOString();
                return { records: [createActiveRecord(uris, date)], hasMore: false };
            });
            restore();
        }
    });

    test('when every read fails, the tool fails after one read per credential', async () => {
        uris = [FAILING_URI];
        readGet.mockImplementation(async () => {
            throw new Error(`storage fetch failed for ${FAILING_URI}`);
        });
        try {
            await expect(runMcpTool()).rejects.toBeDefined();
            expect(readGet).toHaveBeenCalledTimes(1);
            expectNoRawUri(FAILING_URI);
        } finally {
            restore();
        }
    });
});

describe('MCP get_user_context resolves each credential once per request', () => {
    const CREDENTIALS = 30;
    const READ_MS = 125;
    const VERIFY_MS = 8;
    const originalError = console.error;

    const runMcp = async () => {
        const { runMcpOwnerOperation } = await import('../ownerOperation');
        const startedAt = performance.now();
        const outcome = await runMcpOwnerOperation(
            OWNER,
            () => getLatestUserSummary(OWNER),
            'get_user_context'
        ).then(
            context => ({ context, error: undefined }),
            (error: unknown) => ({ context: undefined, error })
        );
        return { ...outcome, elapsedMs: performance.now() - startedAt };
    };

    const realisticStore = () => {
        let active = 0;
        let maxActive = 0;
        const reads = new Map<string, number>();
        const verifies = new Map<string, number>();
        readGet.mockImplementation(async (uri?: string) => {
            const key = uri ?? '';
            reads.set(key, (reads.get(key) ?? 0) + 1);
            active += 1;
            maxActive = Math.max(maxActive, active);
            await new Promise(resolve => setTimeout(resolve, READ_MS));
            return createTestVc(key);
        });
        verifyCredential.mockImplementation(async (credential?: VC) => {
            const id = typeof credential?.id === 'string' ? credential.id : '';
            verifies.set(id, (verifies.get(id) ?? 0) + 1);
            await new Promise(resolve => setTimeout(resolve, VERIFY_MS));
            active -= 1;
            return { checks: ['proof'], errors: [], warnings: [] };
        });
        return { reads, verifies, maxActive: () => maxActive };
    };

    const restore = () => {
        readGet.mockImplementation(async (uri?: string) => createTestVc(uri ?? VALID_URI));
        verifyCredential.mockImplementation(async (credential?: VC) => {
            const id = typeof credential?.id === 'string' ? credential.id : '';
            verified.push(id);
            if (id === INVALID_URI)
                return { checks: [], errors: ['Invalid signature'], warnings: [] };
            return { checks: ['proof'], errors: [], warnings: [] };
        });
        aiStubs.aiCall.mockImplementation(async () => ({
            prompt: 'Sibling learner context',
            summary: 'Sibling summary',
        }));
        delete process.env.MCP_TOOL_TIMEOUT_MS;
        delete process.env.MCP_POST_BATCH_RESERVE_MS;
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
    };

    test('30 credentials: each read and verified once, consent read once plus fresh reads after the batch and at publication, at most 4 at a time', async () => {
        uris = Array.from(
            { length: CREDENTIALS },
            (_, index) => `lc:cloud:credential:acct-${index}`
        );
        const store = realisticStore();
        const { getLearnCardRequestSignal } = await import('../../learncard/requestScope');
        // Background store jobs run outside the request and read on their own.
        let requestConsentReads = 0;
        getConsentFlowDataForDid.mockImplementation(async () => {
            consentReads += 1;
            if (getLearnCardRequestSignal()) requestConsentReads += 1;
            const date = new Date(
                Date.parse('2026-08-01T00:00:00.000Z') + consentReads * 1000
            ).toISOString();
            return { records: [createActiveRecord(uris, date)], hasMore: false };
        });
        try {
            const { context, error, elapsedMs } = await runMcp();
            expect(error).toBeUndefined();
            expect(context).toBe('Sibling learner context');
            expect(store.reads.size).toBe(CREDENTIALS);
            expect([...store.reads.values()].every(count => count === 1)).toBe(true);
            expect(store.verifies.size).toBe(CREDENTIALS);
            expect([...store.verifies.values()].every(count => count === 1)).toBe(true);
            expect(store.maxActive()).toBeGreaterThan(1);
            expect(store.maxActive()).toBeLessThanOrEqual(4);
            // 30 x ~133ms in 4 workers is ~1s; serial would be ~4s.
            expect(elapsedMs).toBeLessThan(2_500);

            expect(JSON.stringify(events)).not.toContain('lc:cloud:credential');
            // The request reads consent three times: the tool's read, one fresh
            // read after the batch and one live read at publication. Nothing per
            // credential on the request path.
            const storeConsentReads = requestConsentReads;
            expect(storeConsentReads).toBeLessThanOrEqual(3);

            console.log(
                `30-credential tool: ${Math.round(elapsedMs)}ms, max ${store.maxActive()} in flight, ` +
                    `store consent reads ${storeConsentReads}`
            );
        } finally {
            restore();
        }
    });

    test('a second resolve of the same credential in one request shares the first', async () => {
        uris = [VALID_URI];
        const store = realisticStore();
        const { resolveVerifiedCredentialProjection } = await import('../../credentials/service');
        const { loadActiveAiConsentData } = await import('../../learncard/consent');
        try {
            await runWithAiPrivacyContext(OWNER, () =>
                runWithLearnCardRequestScope({}, async () => {
                    const { getLearnCard } = await import('../../learncard');
                    const { receipt } = await loadActiveAiConsentData(
                        await getLearnCard(),
                        OWNER,
                        'model-inference'
                    );
                    clearVerifiedCredentials();
                    await Promise.all([
                        resolveVerifiedCredentialProjection(OWNER, VALID_URI, receipt),
                        resolveVerifiedCredentialProjection(OWNER, VALID_URI, receipt),
                    ]);
                    clearVerifiedCredentials();
                    await resolveVerifiedCredentialProjection(OWNER, VALID_URI, receipt);
                })
            );
            expect(store.reads.get(VALID_URI)).toBe(1);
            expect(store.verifies.get(VALID_URI)).toBe(1);
        } finally {
            restore();
        }
    });

    test('an account too large for the budget returns context from what loaded, rest deferred', async () => {
        uris = Array.from({ length: 80 }, (_, index) => `lc:cloud:credential:big-${index}`);
        const store = realisticStore();
        process.env.MCP_TOOL_TIMEOUT_MS = '3000';
        try {
            const { context, error, elapsedMs } = await runMcp();
            expect(error).toBeUndefined();
            expect(context).toBe('Sibling learner context');
            expect(elapsedMs).toBeLessThan(3_000);
            const completed = events.find(event => event.event === 'credential_batch_completed') as
                { loadedCount?: number; skippedCount?: number } | undefined;
            const loaded = completed?.loadedCount ?? 0;
            const deferred = 80 - loaded - (completed?.skippedCount ?? 0);
            expect(loaded).toBeGreaterThan(0);
            expect(deferred).toBeGreaterThan(0);
            // Reads in flight at the stop are abandoned and counted as deferred.
            expect(store.reads.size).toBeGreaterThanOrEqual(loaded);
            expect(store.reads.size).toBeLessThanOrEqual(loaded + credentialBatchConcurrency());
            console.log(
                `80-credential tool under 3s: ${Math.round(elapsedMs)}ms, loaded ${loaded}, deferred ${deferred}`
            );
        } finally {
            restore();
        }
    });

    test('a hung model call times out inside the tool budget', async () => {
        uris = Array.from({ length: 6 }, (_, index) => `lc:cloud:credential:slow-${index}`);
        const store = realisticStore();
        process.env.MCP_TOOL_TIMEOUT_MS = '1500';
        // A small post-batch reserve so all 6 credentials start before the hang.
        process.env.MCP_POST_BATCH_RESERVE_MS = '400';
        console.error = ((...data: unknown[]) => {
            capture(...data);
            return undefined;
        }) as typeof console.error;
        aiStubs.aiCall.mockImplementation(() => new Promise(() => undefined));
        try {
            const { error, elapsedMs } = await runMcp();
            expect((error as Error | undefined)?.name).toBe('TimeoutError');
            expect(elapsedMs).toBeLessThan(2_500);
            expect(store.reads.size).toBe(6);
        } finally {
            restore();
        }
    });
});

describe('MCP get_user_context on a 213-credential account at prod latencies', () => {
    // Measured on prod (v32 logs): consent read ~675ms, credential read ~130ms,
    // verify ~330ms, store ~2s, model call 2-3.5s.
    const CREDENTIALS = 213;
    const CONSENT_MS = 675;
    const READ_MS = 130;
    const VERIFY_MS = 330;
    const STORE_MS = 2_000;
    const LLM_MS = [2_000, 3_500, 2_700];
    const isInvalid = (index: number) => index % 8 === 3;
    const isUnverifiable = (index: number) => index % 30 === 7;
    const originalError = console.error;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runAtBudget = async (budgetMs: number) => {
        const { runMcpOwnerOperation } = await import('../ownerOperation');
        const { pendingCredentialStores, drainCredentialStores } =
            await import('../../credentials/store-queue');
        const { db } = await import('../../db');
        const indexOf = (uri: string) => Number(uri.slice(uri.lastIndexOf('-') + 1));
        uris = Array.from(
            { length: CREDENTIALS },
            (_, index) => `lc:cloud:credential:prod-${index}`
        );
        process.env.MCP_TOOL_TIMEOUT_MS = String(budgetMs);

        let releaseStores!: () => void;
        const storesReleased = new Promise<void>(resolve => {
            releaseStores = resolve;
        });
        const { getLearnCardRequestSignal } = await import('../../learncard/requestScope');
        // Live consent reads made by the request (background store jobs run
        // outside it and read on their own).
        const consentReadsAt: number[] = [];
        let backgroundConsentReads = 0;
        let batchCompletedAt: number | undefined;
        let storesStarted = 0;
        let storesFinished = 0;
        let llmCalls = 0;
        const watch = (...data: unknown[]) => {
            for (const item of data)
                if (
                    item &&
                    typeof item === 'object' &&
                    (item as { event?: string }).event === 'credential_batch_completed'
                )
                    batchCompletedAt = performance.now();
            capture(...data);
            return undefined;
        };
        console.info = watch as typeof console.info;
        console.warn = watch as typeof console.warn;
        console.error = ((...data: unknown[]) => {
            capture(...data);
            return undefined;
        }) as typeof console.error;
        getConsentFlowDataForDid.mockImplementation(async () => {
            consentReads += 1;
            if (getLearnCardRequestSignal()) consentReadsAt.push(performance.now());
            else backgroundConsentReads += 1;
            await sleep(CONSENT_MS);
            return { records: [createActiveRecord(uris)], hasMore: false };
        });
        readGet.mockImplementation(async (uri?: string) => {
            await sleep(READ_MS);
            return createTestVc(uri ?? VALID_URI);
        });
        verifyCredential.mockImplementation(async (credential?: VC) => {
            const index = indexOf(typeof credential?.id === 'string' ? credential.id : '');
            await sleep(VERIFY_MS);
            if (isUnverifiable(index)) throw new Error('verifier unreachable');
            if (isInvalid(index))
                return { checks: [], errors: ['Invalid signature'], warnings: [] };
            return { checks: ['proof'], errors: [], warnings: [] };
        });
        const slowStore = async () => {
            storesStarted += 1;
            await Promise.race([sleep(STORE_MS), storesReleased]);
            storesFinished += 1;
        };
        (db.storeCredentialVerification as ReturnType<typeof mock>).mockImplementation(slowStore);
        (db.storeRawCredential as ReturnType<typeof mock>).mockImplementation(slowStore);
        aiStubs.aiCall.mockImplementation(async () => {
            const ms = LLM_MS[llmCalls % LLM_MS.length]!;
            llmCalls += 1;
            await sleep(ms);
            return { prompt: 'Prod-latency learner context', summary: 'Cluster summary' };
        });

        const startedAt = performance.now();
        const outcome = await runMcpOwnerOperation(
            OWNER,
            () => getLatestUserSummary(OWNER),
            'get_user_context'
        ).then(
            context => ({ context, error: undefined as unknown }),
            (error: unknown) => ({ context: undefined, error })
        );
        const returnedAt = performance.now();
        const pendingStoresAtReturn = pendingCredentialStores();
        const storesAtReturn = { started: storesStarted, finished: storesFinished };
        const readsBeforeReturn = consentReadsAt.filter(at => at < returnedAt);
        const freshReads = readsBeforeReturn.filter(
            at => batchCompletedAt !== undefined && at >= batchCompletedAt
        ).length;
        // Let the background queue finish quickly so nothing leaks into later tests.
        releaseStores();
        await drainCredentialStores();
        const completed = events.find(event => event.event === 'credential_batch_completed') as
            | {
                  loadedCount?: number;
                  skippedCount?: number;
              }
            | undefined;
        return {
            ...outcome,
            elapsedMs: returnedAt - startedAt,
            batchMs: batchCompletedAt === undefined ? undefined : batchCompletedAt - startedAt,
            liveConsentReads: readsBeforeReturn.length,
            backgroundConsentReads,
            freshReads,
            pendingStoresAtReturn,
            storesAtReturn,
            completed,
            llmCalls,
        };
    };

    const restore = async () => {
        const { db } = await import('../../db');
        getConsentFlowDataForDid.mockImplementation(async () => {
            consentReads += 1;
            const date = new Date(
                Date.parse('2026-08-01T00:00:00.000Z') + consentReads * 1000
            ).toISOString();
            return { records: [createActiveRecord(uris, date)], hasMore: false };
        });
        readGet.mockImplementation(async (uri?: string) => createTestVc(uri ?? VALID_URI));
        verifyCredential.mockImplementation(async (credential?: VC) => {
            const id = typeof credential?.id === 'string' ? credential.id : '';
            verified.push(id);
            if (id === INVALID_URI)
                return { checks: [], errors: ['Invalid signature'], warnings: [] };
            return { checks: ['proof'], errors: [], warnings: [] };
        });
        (db.storeCredentialVerification as ReturnType<typeof mock>).mockImplementation(async () => {
            storeAttempts += 1;
            if (failFirstStore && storeAttempts === 1) {
                throw new Error('Cleanup scope changed; retry');
            }
        });
        (db.storeRawCredential as ReturnType<typeof mock>).mockImplementation(
            async () => undefined
        );
        aiStubs.aiCall.mockImplementation(async () => ({
            prompt: 'Sibling learner context',
            summary: 'Sibling summary',
        }));
        delete process.env.MCP_TOOL_TIMEOUT_MS;
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
    };

    const expectProdShape = (result: Awaited<ReturnType<typeof runAtBudget>>, budgetMs: number) => {
        expect(result.error).toBeUndefined();
        expect(result.context).toBe('Prod-latency learner context');
        expect(result.elapsedMs).toBeLessThan(budgetMs);
        // One plain read at the start, one fresh read after the batch and one
        // live read at publication; the prompt checks in between reuse the
        // newest. (Model calls are stubbed here; their own checks read live.)
        expect(result.freshReads).toBe(2);
        expect(result.liveConsentReads).toBeLessThanOrEqual(3);
        // The tool never waits on store: writes were still queued when it returned.
        expect(result.pendingStoresAtReturn).toBeGreaterThan(0);
        expect(result.storesAtReturn.finished).toBeLessThan(result.storesAtReturn.started + 1);
        const completed = result.completed;
        const loaded = completed?.loadedCount ?? 0;
        const deferred = CREDENTIALS - loaded - (completed?.skippedCount ?? 0);
        // No per-call credential cap: the batch loads until its stop time.
        expect(loaded).toBeGreaterThan(20);
        if (budgetMs < 45_000) expect(deferred).toBeGreaterThan(0);
        expect(JSON.stringify(events)).not.toContain('lc:cloud:credential');
        console.log(
            `213 credentials at ${budgetMs / 1000}s: returned in ${Math.round(result.elapsedMs)}ms ` +
                `(batch ${Math.round(result.batchMs ?? -1)}ms), loaded ${completed?.loadedCount}, ` +
                `skipped ${completed?.skippedCount}, deferred ${deferred}, ` +
                `live consent reads ${result.liveConsentReads} (fresh ${result.freshReads}; background store jobs ${result.backgroundConsentReads}), ` +
                `model calls ${result.llmCalls}, store writes pending at return ${result.pendingStoresAtReturn} ` +
                `(started ${result.storesAtReturn.started}, finished ${result.storesAtReturn.finished})`
        );
    };

    test(
        'returns context inside the 20s default budget',
        async () => {
            try {
                expectProdShape(await runAtBudget(20_000), 20_000);
            } finally {
                await restore();
            }
        },
        { timeout: 30_000 }
    );

    test(
        'returns context inside a 45s budget',
        async () => {
            try {
                expectProdShape(await runAtBudget(45_000), 45_000);
            } finally {
                await restore();
            }
        },
        // The tool returns inside 45s; the rest drains its queued store writes.
        { timeout: 180_000 }
    );
});

describe('MCP get_user_context stored ingest-verified evidence', () => {
    const SHARED_URIS = Array.from(
        { length: 30 },
        (_, index) => `lc:cloud:credential:stored-${index}`
    );
    const WITHDRAWN_URI = 'lc:cloud:credential:withdrawn-1';
    const text = (label: string) =>
        JSON.stringify({
            schemaVersion: '1',
            category: 'Achievement',
            credentialTypes: ['AchievementCredential'],
            facts: [{ label: 'Achievement', value: label }],
        });
    const runMcpTool = async () => {
        process.env.MCP_TOOL_TIMEOUT_MS = '10000';
        const { runMcpOwnerOperation } = await import('../ownerOperation');
        return runMcpOwnerOperation(OWNER, () => getLatestUserSummary(OWNER), 'get_user_context');
    };
    const restore = () => {
        aiStubs.aiCall.mockImplementation(async () => ({
            prompt: 'Sibling learner context',
            summary: 'Sibling summary',
        }));
        delete process.env.MCP_TOOL_TIMEOUT_MS;
        console.info = originalInfo;
        console.warn = originalWarn;
    };

    test('every shared credential with stored text is represented, none read live; a withdrawn one with a stored row never is', async () => {
        uris = SHARED_URIS;
        SHARED_URIS.forEach((uri, index) => storedText.set(uri, text(`Stored skill ${index}`)));
        storedText.set(WITHDRAWN_URI, text('WITHDRAWN_PRIVATE_SENTINEL'));
        aiStubs.aiCall.mockClear();
        try {
            expect(await runMcpTool()).toBe('Sibling learner context');
            const messages = (aiStubs.aiCall.mock.calls as unknown as [{ message?: string }][]).map(
                ([request]) => request.message ?? ''
            );
            // One model call over the evidence: no per-credential summaries.
            expect(messages).toHaveLength(1);
            const represented = new Set(
                [...messages[0]!.matchAll(/Stored skill (\d+)/g)].map(match => match[1])
            );
            expect(represented.size).toBe(SHARED_URIS.length);
            expect(messages[0]).not.toContain('WITHDRAWN_PRIVATE_SENTINEL');
            expect(readGet).not.toHaveBeenCalled();
        } finally {
            restore();
        }
    });

    test('a withdrawal during the synthesis call publishes nothing from stored text', async () => {
        uris = [...SHARED_URIS];
        SHARED_URIS.forEach((uri, index) => storedText.set(uri, text(`Stored skill ${index}`)));
        aiStubs.aiCall.mockImplementation(async () => {
            // Sharing is withdrawn for one credential while the model runs.
            uris = SHARED_URIS.slice(1);
            return { prompt: 'Sibling learner context', summary: 'Sibling summary' };
        });
        const { db } = await import('../../db');
        const upsert = db.upsertLearnerContextPromptByHash as ReturnType<typeof mock>;
        upsert.mockClear();
        try {
            const error = await runMcpTool().then(
                () => undefined,
                (caught: unknown) => caught
            );
            expect((error as Error | undefined)?.name).toBe('AiConsentError');
            const { drainCredentialStores } = await import('../../credentials/store-queue');
            await drainCredentialStores();
            expect(upsert).not.toHaveBeenCalled();
        } finally {
            restore();
        }
    });
    test('stored text without validated provenance never reaches synthesis; live verify decides', async () => {
        const LEGACY_OK = 'lc:cloud:credential:legacy-ok';
        const LEGACY_BAD = 'lc:cloud:credential:legacy-bad';
        const FAILED_OK = 'lc:cloud:credential:failed-ok';
        const FAILED_BAD = 'lc:cloud:credential:failed-bad';
        uris = [LEGACY_OK, LEGACY_BAD, FAILED_OK, FAILED_BAD];
        // Legacy rows (no verification metadata) and rows whose stored
        // verification or projection fails both come back without `verified`.
        for (const uri of uris) unverifiedText.set(uri, text(`UNVERIFIED_STORED_${uri}`));
        readGet.mockImplementation(async (uri?: string) => {
            const vc = createTestVc(uri ?? VALID_URI);
            return {
                ...vc,
                credentialSubject: { id: OWNER, achievement: { name: `Live ${uri}` } },
            };
        });
        verifyCredential.mockImplementation(async (credential?: VC) => {
            const id = typeof credential?.id === 'string' ? credential.id : '';
            return id.endsWith('-bad')
                ? { checks: [], errors: ['Invalid signature'], warnings: [] }
                : { checks: ['proof'], errors: [], warnings: [] };
        });
        aiStubs.aiCall.mockClear();
        try {
            expect(await runMcpTool()).toBe('Sibling learner context');
            const message =
                (aiStubs.aiCall.mock.calls as unknown as [{ message?: string }][])[0]?.[0]
                    .message ?? '';
            expect(message).not.toContain('UNVERIFIED_STORED_');
            // Each went to live verification: verified ones in, failed ones out.
            expect(new Set(readGet.mock.calls.map(([uri]) => uri))).toEqual(new Set(uris));
            expect(message).toContain(`Live ${LEGACY_OK}`);
            expect(message).toContain(`Live ${FAILED_OK}`);
            expect(message).not.toContain(`Live ${LEGACY_BAD}`);
            expect(message).not.toContain(`Live ${FAILED_BAD}`);
        } finally {
            readGet.mockImplementation(async (uri?: string) => createTestVc(uri ?? VALID_URI));
            verifyCredential.mockImplementation(async (credential?: VC) => {
                const id = typeof credential?.id === 'string' ? credential.id : '';
                verified.push(id);
                if (id === INVALID_URI)
                    return { checks: [], errors: ['Invalid signature'], warnings: [] };
                return { checks: ['proof'], errors: [], warnings: [] };
            });
            restore();
        }
    });

    test('a failed or hung provenance lookup trusts no stored text', async () => {
        const { db } = await import('../../db');
        const lookup = db.getCredentialAiContexts as ReturnType<typeof mock>;
        const original = lookup.getMockImplementation();
        uris = SHARED_URIS.slice(0, 3);
        uris.forEach(uri => storedText.set(uri, text('STORED_SENTINEL')));
        try {
            for (const failure of [
                async () => {
                    throw new Error('lookup failed');
                },
                () => new Promise<never>(() => undefined),
            ]) {
                lookup.mockImplementation(failure);
                readGet.mockClear();
                aiStubs.aiCall.mockClear();
                expect(await runMcpTool()).toBe('Sibling learner context');
                const message =
                    (aiStubs.aiCall.mock.calls as unknown as [{ message?: string }][])[0]?.[0]
                        .message ?? '';
                expect(message).not.toContain('STORED_SENTINEL');
                expect(new Set(readGet.mock.calls.map(([uri]) => uri))).toEqual(new Set(uris));
                resetConsentSnapshots();
                clearVerifiedCredentials();
            }
        } finally {
            if (original) lookup.mockImplementation(original);
            restore();
        }
    });
});
