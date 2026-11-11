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
    clearKnownBadCredentials();
    clearVerifiedCredentials();
    consentReads = 0;
    storeAttempts = 0;
    failFirstStore = false;
    uris = [VALID_URI, INVALID_URI];
    verified.length = 0;
    events.length = 0;
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
            expect(storeAttempts).toBeGreaterThan(1);
            expect(events).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        event: 'projection_restart',
                        restartReason: 'source_cleanup_scope_changed',
                        attempt: 1,
                    }),
                ])
            );
            expect(events.filter(event => event.event === 'projection_restart')).toHaveLength(1);
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
    const sentryPayloads: unknown[] = [];

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
        const Sentry = await import('@sentry/node');
        const captureSpy = spyOn(Sentry, 'captureMessage').mockImplementation(((
            message: string,
            context: unknown
        ) => {
            sentryPayloads.push({ message, context });
            return 'event';
        }) as never);
        const { runMcpOwnerOperation } = await import('../ownerOperation');
        const { runWithMcpProgress } = await import('../../diagnostics/mcp-progress');
        const { reportToolFailure } = await import('../tools');
        const startedAt = performance.now();
        try {
            const context = await runWithMcpProgress(
                { tool: 'get_user_context', requestId: 'req_readbudget01' },
                () => runMcpOwnerOperation(OWNER, () => getLatestUserSummary(OWNER))
            ).catch(error => {
                reportToolFailure('get_user_context', error);
                throw error;
            });
            return { context, elapsedMs: performance.now() - startedAt };
        } finally {
            captureSpy.mockRestore();
        }
    };

    const expectNoRawUri = (...privateUris: string[]) => {
        const logged = JSON.stringify(events);
        const sentry = JSON.stringify(sentryPayloads);
        for (const uri of privateUris) {
            expect(logged).not.toContain(uri);
            expect(sentry).not.toContain(uri);
        }
        expect(sentry).not.toContain('uriHash');
    };

    test('a never-resolving read is skipped and siblings return inside the tool budget', async () => {
        uris = [HUNG_URI, VALID_URI, SIBLING_URI];
        sentryPayloads.length = 0;
        readGet.mockImplementation(async (uri?: string) =>
            uri === HUNG_URI ? new Promise<VC>(() => undefined) : createTestVc(uri ?? VALID_URI)
        );
        try {
            const { context, elapsedMs } = await runMcpTool();
            expect(context).toBe('Sibling learner context');
            expect(elapsedMs).toBeLessThan(BUDGET_MS);
            // Per-credential skips; the batch also logs one aggregate count line.
            const skipped = events.filter(
                event => event.event === 'credential_skipped' && 'index' in event
            );
            expect(skipped).toEqual([
                expect.objectContaining({
                    failureCode: 'credential_read_timeout',
                    readStage: 'fetch',
                    credentialBatch: 'context',
                }),
            ]);
            expect(skipped[0]?.uriHash).toMatch(/^[0-9a-f]{12}$/);
            expect(events).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        event: 'credential_read_slow',
                        readStage: 'fetch',
                        uriHash: skipped[0]?.uriHash,
                        mcpRequestId: 'req_readbudget01',
                    }),
                    expect.objectContaining({
                        event: 'mcp_tool_progress',
                        mcpCauseStep: 'projection',
                        readStage: 'fetch',
                    }),
                ])
            );
            expect(events.some(event => event.event === 'request_failed')).toBe(false);
            expect(events.some(event => event.event === 'projection_restart')).toBe(false);
            expect(sentryPayloads).toHaveLength(0);
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
            expect(events.some(event => event.event === 'projection_restart')).toBe(false);
            // Per-credential skips; the batch also logs one aggregate count line.
            const skipped = events.filter(
                event => event.event === 'credential_skipped' && 'index' in event
            );
            expect(skipped).toEqual([
                expect.objectContaining({
                    failureCode: 'credential_read_failed',
                    readStage: 'fetch',
                }),
            ]);
            expect(skipped[0]?.uriHash).toMatch(/^[0-9a-f]{12}$/);
            expectNoRawUri(FAILING_URI, VALID_URI);
        } finally {
            restore();
        }
    });

    test('when every read fails, Sentry gets allowlisted tags only, no URI or uriHash', async () => {
        uris = [FAILING_URI];
        sentryPayloads.length = 0;
        readGet.mockImplementation(async () => {
            throw new Error(`storage fetch failed for ${FAILING_URI}`);
        });
        try {
            await expect(runMcpTool()).rejects.toBeDefined();
            expect(readGet).toHaveBeenCalledTimes(1);
            expect(sentryPayloads).toHaveLength(1);
            expect(events.find(event => event.event === 'credential_skipped')?.uriHash).toMatch(
                /^[0-9a-f]{12}$/
            );
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

    const runMcp = async (requestId: string) => {
        const { runMcpOwnerOperation } = await import('../ownerOperation');
        const { runWithMcpProgress } = await import('../../diagnostics/mcp-progress');
        const startedAt = performance.now();
        const outcome = await runWithMcpProgress({ tool: 'get_user_context', requestId }, () =>
            runMcpOwnerOperation(OWNER, () => getLatestUserSummary(OWNER))
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
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
    };

    test('30 credentials: each read and verified once, consent and URI list once, at most 4 at a time', async () => {
        uris = Array.from(
            { length: CREDENTIALS },
            (_, index) => `lc:cloud:credential:acct-${index}`
        );
        const store = realisticStore();
        try {
            const { context, error, elapsedMs } = await runMcp('req_onceperreq01');
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

            const timing = events.find(event => event.event === 'mcp_tool_timing') as
                | {
                      mcpOutcome?: string;
                      credentialCount?: number;
                      stageTimings?: Record<string, { count: number; ms: number }>;
                  }
                | undefined;
            expect(timing).toBeDefined();
            expect(timing?.mcpOutcome).toBe('success');
            expect(timing?.credentialCount).toBe(CREDENTIALS);
            const stages = timing?.stageTimings ?? {};
            expect(
                events.filter(
                    event =>
                        event.event === 'mcp_tool_progress' && event.mcpCauseStep === 'consent_read'
                )
            ).toHaveLength(0);
            expect(JSON.stringify(events)).not.toContain('lc:cloud:credential');
            expect(stages.scope?.count).toBe(1);
            expect(stages.uri_list?.count).toBe(1);
            expect(stages.read?.count).toBe(CREDENTIALS);
            expect(stages.verify?.count).toBe(CREDENTIALS);
            expect(stages.projection?.count).toBe(CREDENTIALS);
            expect(stages.learnercontext?.count).toBe(1);
            expect(stages.pseudonymize?.count).toBe(1);
            // The tool's consent read, the prompt's (shared) read, the prompt's
            // four fresh checks (cache lookup, before the model, before and after
            // the cache write) and the tool's final fresh check: 7, whatever the
            // credential count. Nothing per credential.
            const storeConsentReads = getConsentFlowDataForDid.mock.calls.length;
            expect(stages.consent_read?.count).toBeLessThanOrEqual(7);
            expect(storeConsentReads).toBeLessThanOrEqual(7);

            console.log(
                `30-credential tool: ${Math.round(elapsedMs)}ms, max ${store.maxActive()} in flight, ` +
                    `store consent reads ${storeConsentReads}, ` +
                    `timing ${JSON.stringify(stages)}`
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
            const { context, error, elapsedMs } = await runMcp('req_budgetdefer01');
            expect(error).toBeUndefined();
            expect(context).toBe('Sibling learner context');
            expect(elapsedMs).toBeLessThan(3_000);
            const completed = events.find(event => event.event === 'credential_batch_completed') as
                { loadedCount?: number; deferredCount?: number; count?: number } | undefined;
            expect(completed?.count).toBe(80);
            expect(completed?.deferredCount).toBeGreaterThan(0);
            expect((completed?.loadedCount ?? 0) + (completed?.deferredCount ?? 0)).toBe(80);
            expect(store.reads.size).toBe(completed?.loadedCount ?? -1);
            console.log(
                `80-credential tool under 3s: ${Math.round(elapsedMs)}ms, loaded ${completed?.loadedCount}, deferred ${completed?.deferredCount}`
            );
        } finally {
            restore();
        }
    });

    test('mcp_tool_timing is logged on a timeout too', async () => {
        uris = Array.from({ length: 6 }, (_, index) => `lc:cloud:credential:slow-${index}`);
        realisticStore();
        process.env.MCP_TOOL_TIMEOUT_MS = '1500';
        console.error = ((...data: unknown[]) => {
            capture(...data);
            return undefined;
        }) as typeof console.error;
        aiStubs.aiCall.mockImplementation(() => new Promise(() => undefined));
        try {
            const { error, elapsedMs } = await runMcp('req_timingtimeout1');
            expect((error as Error | undefined)?.name).toBe('TimeoutError');
            expect(elapsedMs).toBeLessThan(2_500);
            expect(events).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        event: 'mcp_tool_timing',
                        mcpTool: 'get_user_context',
                        mcpRequestId: 'req_timingtimeout1',
                        mcpOutcome: 'timeout',
                        credentialCount: 6,
                        stageTimings: expect.objectContaining({
                            read: expect.objectContaining({ count: 6 }),
                            learnercontext: expect.objectContaining({ count: 1 }),
                        }),
                    }),
                ])
            );
        } finally {
            restore();
        }
    });
});
