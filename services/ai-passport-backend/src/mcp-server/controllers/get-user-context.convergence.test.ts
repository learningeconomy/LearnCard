import { beforeEach, describe, expect, mock, test } from 'bun:test';
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
