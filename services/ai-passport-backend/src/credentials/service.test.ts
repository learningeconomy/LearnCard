import { AiConsentError } from '../learncard/consent';
import { FileUploadTypesEnum } from '../ai/generation-schemas';
import { beforeEach, expect, jest, mock, spyOn, test } from 'bun:test';
import * as projectionModule from './projection';
import type { Job } from 'bullmq';
import { UnrecoverableError } from 'bullmq';
import type { CredentialIngestionJobData } from '../workers/types';
import type { VC, CredentialVerificationMetadata } from '@learncard/types';
import {
    CredentialVerificationUnavailableError,
    fingerprintCredential,
    verifyCredentialForIngestion,
} from './verification';
import { projectCredential, serializeModelSafeCredentialProjection } from './projection';
import { runWithAiPrivacyContext } from '../ai/privacy';

const createTestVc = (
    id: string,
    credentialType = 'TestCredential',
    credentialSubject: Record<string, unknown> = { id: 'did:example:learner' }
): VC => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id,
    type: ['VerifiableCredential', credentialType],
    issuer: 'did:test:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject,
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:test:issuer#key-1',
    },
});

const deleteCredentialEmbeddings = mock(async () => 0);
const getCredentialVectorCoverage = mock(async () => new Map());
const generateAndStoreCredentialEmbeddings = mock(async () => {});
const generateCredentialEmbeddingTexts = mock(async (_credential: string) => ({
    fullText: 'full',
    domainSummary: 'domain',
    keyClaims: 'claims',
    technicalMetadata: 'technical',
    comparisonContext: 'comparison',
}));
const streamingAiCall = mock(async () => 'Generated credential context');
const aiCall = mock(async (): Promise<Record<string, unknown>> => ({}));
const classifyFileContent = mock(async () => ({
    fileType: 'transcript',
    confidence: 0.99,
    reason: 'Academic record with courses and grades',
}));
const generateAIInsightCredential = mock(async () => ({
    vc: null,
    compaction: null,
}));
const getTopicSuggestions = mock(async (_did: string, credentials: Array<{ aiContext: string }>) =>
    credentials.map(credential => credential.aiContext)
);
mock.module('../ai/topics', () => ({
    getSuggestedTopics: getTopicSuggestions,
    warmUpTopicsCache: getTopicSuggestions,
}));

const dbMock = {
    recoverSourceVectorCleanup: mock(async () => ({
        pendingTasks: 0,
        pendingPoints: 0,
    })),
    getCredentialRecords: mock(async (): Promise<Array<Record<string, unknown>>> => []),
    storeVC: mock(async () => {}),
    removeThreadCredentialsByUris: mock(async () => 0),
    deleteVCsByUris: mock(async () => 0),
    storeCredentialVerification: mock(async () => {}),
    storeRawCredential: mock(async () => {}),
};

const activeConsentFlowResponse: any = {
    records: [
        {
            contractUri: 'test-contract-uri',
            termsUri: 'test:terms',
            status: 'live',
            contractUpdatedAt: '2026-01-01T00:00:00.000Z',
            guardian: { required: false, approved: false },
            terms: {
                read: {
                    credentials: {
                        sharing: true,
                        categories: {
                            TestCredential: { sharing: true, shareAll: true },
                        },
                    },
                },
            },
            date: '2026-01-01T00:00:00.000Z',
            credentials: [
                {
                    uri: 'vc:test:1',
                    category: 'TestCredential',
                },
            ],
        },
    ],
    hasMore: false,
    cursor: null,
};

let consentFlowResponse: any = activeConsentFlowResponse;

const learnCardMocks = {
    getConsentFlowDataForDid: mock(async () => consentFlowResponse),
    readGet: mock(async (uri?: string) => createTestVc(uri ?? 'vc:test:1')),
    verifyCredential: mock(async (_credential?: VC): Promise<unknown> => ({
        checks: ['proof'],
        errors: [],
        warnings: [],
    })),
};

mock.module('../constants/env', () => ({
    AI_LOCAL_DEBUG_LOGGING: false,
    NODE_ENV: 'test',
    DOMAIN: 'http://localhost',
    OPENAI_API_KEY: 'test-openai-key',
    ANTHROPIC_API_KEY: '',
    GOOGLE_AI_API_KEY: '',
    SEED: 'test-seed',
    LEARNCARD_CONTRACT_URI: 'test-contract-uri',
    LEARNCARD_DID_WEB: 'did:web:test:issuer',
    PORT: 3001,
    CORS_ORIGINS: ['*'],
    JWT_SECRET: 'test-jwt-secret',
    CREDENTIAL_PRELOAD_CONCURRENCY: 4,
    REDIS_HOST: '',
    REDIS_PASSWORD: '',
    REDIS_PORT: 6379,
    REDIS_PREFIX: 'test',
    QDRANT_HOST: 'localhost',
    QDRANT_PORT: 6333,
    QDRANT_HTTPS: false,
    QDRANT_API_KEY: undefined,
    CHAT_MODEL: 'test-chat-model',
    FORMATTING_MODEL: 'gpt-6-luna-none',
    PLANNING_MODEL: 'test-planning-model',
    TITLE_MODEL: 'test-title-model',
    EMBEDDING_MODEL: 'test-embedding-model',
    OPENAI_REASONING_EFFORT: 'none',
    AI_PROVIDER_QUOTA_COOLDOWN_SECONDS: 300,
    MONGO_URI: 'mongodb://localhost:27017',
    MONGO_DB: 'test-db',
    QDRANT_PREFIX: 'test',
    OPEN_SYLLABUS_ANALYTICS_BASE_URL: 'https://example.test',
    OPEN_SYLLABUS_API_KEY: '',
    CAREER_ONE_STOP_CONFIG: '',
}));
class MockDataErasureRequestedError extends Error {
    readonly code = 'data_erasure_requested';
}
mock.module('../services/dataErasure', () => ({
    DataErasureRequestedError: MockDataErasureRequestedError,
    assertOwnerOperationActive: async () => undefined,
    isDataErasureRequested: async () => false,
}));
mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => `fixture:${did}`,
    getPrivacyKeyMaterial: () => ({
        reference: Buffer.alloc(32, 1),
        encryption: Buffer.alloc(32, 2),
    }),
}));
mock.module('../db', () => ({ db: dbMock }));
mock.module('../ai', () => ({
    aiCall,
    generateCredentialEmbeddingTexts,
    generateCredentialTitle: mock(async () => ''),
    streamingAiCall,
}));
mock.module('../ai/embeddings', () => ({
    generateAndStoreCredentialEmbeddings,
}));
mock.module('../learncard', () => ({
    getLearnCard: mock(async () => ({
        invoke: {
            getConsentFlowDataForDid: learnCardMocks.getConsentFlowDataForDid,
            verifyCredential: learnCardMocks.verifyCredential,
        },
        read: {
            get: learnCardMocks.readGet,
        },
        id: { did: () => 'did:web:test:issuer' },
    })),
}));
mock.module(new URL('../learncard/index.ts', import.meta.url).href, () => ({
    getLearnCard: mock(async () => ({
        invoke: {
            getConsentFlowDataForDid: learnCardMocks.getConsentFlowDataForDid,
            verifyCredential: learnCardMocks.verifyCredential,
        },
        read: {
            get: learnCardMocks.readGet,
        },
        id: { did: () => 'did:web:test:issuer' },
    })),
}));
mock.module('../learncard/constants', () => ({
    contractId: 'test-contract',
    contractUri: 'test-contract-uri',
}));
mock.module(new URL('../learncard/constants.ts', import.meta.url).href, () => ({
    contractId: 'test-contract',
    contractUri: 'test-contract-uri',
}));
mock.module('../db/qdrant', () => ({
    CREDENTIAL_VECTOR_COLLECTION_COUNT: 5,
    deleteCredentialEmbeddings,
    getCredentialVectorCoverage,
}));
mock.module('../workers/credentialIngestion', () => ({
    queue: { add: mock(async () => ({ id: 'test-job' })) },
}));
mock.module('../services/awarding', () => ({
    generateAIInsightCredential,
}));
const extractFileText = mock(async () => ({ text: 'Transcript text' }));
mock.module('../helpers/file.helpers', () => ({
    classifyFileContent,
    extractTextFromBase64File: extractFileText,
    getAiPromptForFile: mock(() => ({ systemPrompt: '', output: {} })),
}));
mock.module('../services/openSyllabus/openSyllabus', () => ({
    fetchSyllabi: mock(async () => ({ syllabi: [] })),
    fetchTitles: mock(async () => ({ titles: [] })),
}));
mock.module('../helpers/openSyllabus.helpers', () => ({
    getMappedOpenSyllabusData: mock(() => ({})),
}));
mock.module('../helpers/credential.helpers', () => ({
    Source: {},
    Alignment: {},
    Evidence: {},
}));
mock.module('./helpers', () => ({
    BoostCategoryOptionsEnum: { learningHistory: 'Learning History' },
    constructCustomType: mock(() => 'TestCustomType'),
}));

// Dynamic import intentionally verifies that Bun's mocks are installed before service evaluation.
const service = await import(new URL('./service.ts', import.meta.url).href);
const { parseFile, resolveVerifiedCredentialProjection } = service;
const { getActiveAiConsentReceipt } = await import('../learncard/consent');
const { beginCredentialContextRead, clearVerifiedCredentials } = await import('./batch');
const currentReceipt = () =>
    getActiveAiConsentReceipt(consentFlowResponse.records[0], 'credential-ingestion')!;
const fetchCredentials = (did: string) =>
    runWithAiPrivacyContext(did, () => service.fetchCredentials(did));
const processCredentials = (did: string, job: Job<CredentialIngestionJobData>) =>
    runWithAiPrivacyContext(did, () => service.processCredentials(did, job));

const createVerification = (credential: VC): CredentialVerificationMetadata => ({
    credentialUri: credential.id ?? 'vc:test:1',
    contentHash: fingerprintCredential(credential),
    status: 'valid',
    checkedAt: '2026-01-01T00:00:00.000Z',
    verifier: {
        name: 'LearnCard credential verifier',
        version: '@learncard/init-2.3.7',
    },
    verifiedPayload: 'credential',
    checks: ['proof'],
    errors: [],
    warnings: [],
    provenance: { source: 'wallet', retrievedAt: '2026-01-01T00:00:00.000Z' },
    consent: currentReceipt(),
});
const createStoredCredential = (credential = createTestVc('vc:test:1')) => {
    const verification = createVerification(credential);
    const projection = projectCredential(credential, 'TestCredential', verification);
    return {
        id: credential.id ?? 'vc:test:1',
        uri: credential.id ?? 'vc:test:1',
        category: 'TestCredential',
        credential,
        rawCredentialJson: JSON.stringify(credential),
        aiContext: serializeModelSafeCredentialProjection(projection),
        createdAt: '2026-01-01T00:00:00.000Z',
        source: 'wallet' as const,
        projection,
        verification,
    };
};
test('verification accepts the LearnCard verifier result contract', async () => {
    const result = await verifyCredentialForIngestion({
        credential: createTestVc('vc:test:1'),
        credentialUri: 'vc:test:1',
        subjectDid: 'did:example:learner',
        consent: currentReceipt(),
        verify: async () => ({
            checks: ['proof'],
            errors: [],
            warnings: [],
        }),
    });

    expect(result).toMatchObject({
        status: 'valid',
        checks: ['proof'],
        errors: [],
    });
});

test('verification rejects credentials bound to another subject', async () => {
    const result = await verifyCredentialForIngestion({
        credential: createTestVc('vc:test:other', 'TestCredential', {
            id: 'did:example:other',
        }),
        credentialUri: 'vc:test:other',
        subjectDid: 'did:example:learner',
        consent: currentReceipt(),
        verify: async () => ({
            checks: ['proof'],
            errors: [],
            warnings: [],
        }),
    });

    expect(result.status).toBe('invalid');
    expect(result.errors).toContain('credential_subject_mismatch');
});

test('verification checks the complete boost wrapper', async () => {
    const boostCredential = {
        ...createTestVc('vc:test:inner'),
        boostId: 'boost:test:1',
    } as VC;
    const wrapper = {
        ...createTestVc('vc:test:wrapper', 'CertifiedBoostCredential', {
            id: 'did:test:issuer',
        }),
        boostId: 'boost:test:1',
        boostCredential,
    } as VC;
    let verifiedCredential: VC | undefined;

    const result = await verifyCredentialForIngestion({
        credential: wrapper,
        credentialUri: 'vc:test:wrapper',
        subjectDid: 'did:example:learner',
        consent: currentReceipt(),
        verify: async credential => {
            verifiedCredential = credential;
            return { checks: ['proof'], errors: [], warnings: [] };
        },
    });

    expect(verifiedCredential).toBe(wrapper);
    expect(result).toMatchObject({
        status: 'valid',
        verifiedPayload: 'boostCredential',
    });
});

const { resetConsentSnapshots } = await import('../learncard/requestScope');
beforeEach(() => {
    resetConsentSnapshots();
    clearVerifiedCredentials();
    consentFlowResponse = activeConsentFlowResponse;
    dbMock.getCredentialRecords.mockReset();
    dbMock.getCredentialRecords.mockResolvedValue([]);
    dbMock.storeVC.mockClear();
    dbMock.removeThreadCredentialsByUris.mockClear();
    dbMock.deleteVCsByUris.mockClear();
    dbMock.storeCredentialVerification.mockClear();
    dbMock.storeRawCredential.mockClear();
    deleteCredentialEmbeddings.mockClear();
    getCredentialVectorCoverage.mockReset();
    getCredentialVectorCoverage.mockResolvedValue(new Map());
    generateAndStoreCredentialEmbeddings.mockClear();
    generateCredentialEmbeddingTexts.mockClear();
    streamingAiCall.mockClear();
    aiCall.mockReset();
    aiCall.mockResolvedValue({});
    classifyFileContent.mockReset();
    classifyFileContent.mockResolvedValue({
        fileType: 'transcript',
        confidence: 0.99,
        reason: 'Academic record with courses and grades',
    });
    generateAIInsightCredential.mockClear();
    getTopicSuggestions.mockClear();
    learnCardMocks.getConsentFlowDataForDid.mockReset();
    learnCardMocks.getConsentFlowDataForDid.mockImplementation(async () => consentFlowResponse);
    learnCardMocks.readGet.mockReset();
    learnCardMocks.readGet.mockImplementation(async (uri?: string) =>
        createTestVc(uri ?? 'vc:test:1')
    );
    learnCardMocks.verifyCredential.mockReset();
    learnCardMocks.verifyCredential.mockResolvedValue({
        checks: ['proof'],
        errors: [],
        warnings: [],
    });
});

test('parseFile returns one unsigned CLR in vcs for transcripts', async () => {
    aiCall.mockResolvedValueOnce({
        institution: 'Westbridge University',
        courses: [
            {
                courseCode: 'DS 101',
                courseName: 'Introduction to Data Science',
                grade: 'A',
                credits: 3,
            },
            {
                courseCode: 'MATH 151',
                courseName: 'Calculus I',
                grade: 'A-',
                credits: 4,
            },
        ],
    });

    const response = await parseFile(
        'data:text/plain;base64,VHJhbnNjcmlwdA==',
        'did:key:z6Mktest-holder',
        'transcript' as any
    );

    expect(response.vcs).toHaveLength(1);
    const transcriptClr = response.vcs[0]?.vc;
    if (!transcriptClr) throw new Error('Expected transcript CLR');
    expect(transcriptClr.type).toContain('ClrCredential');
    expect((transcriptClr.credentialSubject as any).verifiableCredential).toHaveLength(2);
    expect(transcriptClr.issuer).toBe('did:key:z6Mktest-holder');
    expect(response.vcs[0]?.metadata).toEqual({
        name: 'Westbridge University Transcript',
        category: 'Learning History',
    });
    expect(response.classification).toEqual({
        requestedFileType: 'transcript',
        detectedFileType: 'transcript',
        confidence: 0.99,
        corrected: false,
        reason: 'Academic record with courses and grades',
    });
});

test('parseFile returns correlated processing metadata without empty ambiguity', async () => {
    aiCall.mockResolvedValueOnce({
        institution: 'Westbridge University',
        courses: [{ courseCode: 'DS 101', courseName: 'Data Science' }],
    });
    const response = await parseFile(
        'data:text/plain;base64,VHJhbnNjcmlwdA==',
        'did:key:z6Mktest-holder',
        'transcript' as any
    );
    expect(response.processing).toMatchObject({
        version: 1,
        stage: 'complete',
        outcome: 'success',
        code: 'OK',
        credentialCount: 1,
        pipelineVersion: 'file-extraction-v1',
    });
    expect(response.processing.operationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(response.processing.attemptId).toMatch(/^[0-9a-f-]{36}$/i);
});

test('parseFile classifies textless documents as NO_READABLE_TEXT', async () => {
    extractFileText.mockResolvedValueOnce({ text: '   ' });
    await expect(
        parseFile(
            'data:text/plain;base64,VHJhbnNjcmlwdA==',
            'did:key:z6Mktest-holder',
            'transcript' as any
        )
    ).rejects.toMatchObject({
        processing: { code: 'NO_READABLE_TEXT', stage: 'read', outcome: 'failed' },
    });
    expect(classifyFileContent).not.toHaveBeenCalled();
});

test('parseFile preserves consent denial through the read boundary', async () => {
    extractFileText.mockRejectedValueOnce(new AiConsentError());
    await expect(
        parseFile(
            'data:text/plain;base64,VHJhbnNjcmlwdA==',
            'did:key:z6Mktest-holder',
            'transcript' as any
        )
    ).rejects.toMatchObject({
        message: 'Active LearnCard AI consent is required',
        status: 403,
        processing: { code: 'CONSENT_DENIED', stage: 'read', outcome: 'failed' },
    });
});

test('parseFile preserves data-erasure denial through the read boundary', async () => {
    extractFileText.mockRejectedValueOnce(new MockDataErasureRequestedError());
    await expect(
        parseFile(
            'data:text/plain;base64,VHJhbnNjcmlwdA==',
            'did:key:z6Mktest-holder',
            'transcript' as any
        )
    ).rejects.toMatchObject({
        status: 410,
        processing: {
            code: 'OWNER_OPERATION_UNAVAILABLE',
            stage: 'read',
            outcome: 'failed',
        },
    });
});

test('parseFile returns a fixed correlated model failure without provider text', async () => {
    aiCall.mockRejectedValueOnce(new Error('PRIVATE_PROVIDER_PAYLOAD'));
    await expect(
        parseFile(
            'data:text/plain;base64,VHJhbnNjcmlwdA==',
            'did:key:z6Mktest-holder',
            'transcript' as any
        )
    ).rejects.toMatchObject({
        message: "We couldn't process this document. Please try again.",
        processing: { code: 'MODEL_FAILED', stage: 'extract', outcome: 'failed' },
    });
});

test('parseFile separates successful zero items from rejected processing and correlates retry', async () => {
    const operationId = crypto.randomUUID();
    const firstAttemptId = crypto.randomUUID();
    const retryAttemptId = crypto.randomUUID();
    classifyFileContent.mockResolvedValueOnce({
        fileType: 'resume',
        confidence: 0.99,
        reason: 'PRIVATE_CLASSIFICATION_TEXT',
    });
    aiCall.mockResolvedValueOnce({ work: [], education: [] });
    const empty = await parseFile(
        'data:text/plain;base64,U3ludGhldGlj',
        'did:example:synthetic',
        FileUploadTypesEnum.Resume,
        { operationId, attemptId: firstAttemptId, attempt: 1 }
    );
    expect(empty.vcs).toEqual([]);
    expect(empty.processing).toMatchObject({
        operationId,
        attemptId: firstAttemptId,
        attempt: 1,
        stage: 'complete',
        outcome: 'empty',
        code: 'ZERO_STRUCTURED_ITEMS',
        credentialCount: 0,
    });
    aiCall.mockRejectedValueOnce(new Error('PRIVATE_PROVIDER_PAYLOAD'));
    await expect(
        parseFile(
            'data:text/plain;base64,U3ludGhldGlj',
            'did:example:synthetic',
            FileUploadTypesEnum.Resume,
            { operationId, attemptId: retryAttemptId, attempt: 2 }
        )
    ).rejects.toMatchObject({
        processing: {
            operationId,
            attemptId: retryAttemptId,
            attempt: 2,
            stage: 'extract',
            outcome: 'failed',
            code: 'MODEL_FAILED',
        },
    });
});

test('parseFile emits only safe terminal metadata after explicit diagnostic opt-in', async () => {
    const events: unknown[] = [];
    const originalInfo = console.info;
    console.info = event => {
        events.push(event);
    };
    try {
        for (const enabled of [false, true]) {
            classifyFileContent.mockResolvedValueOnce({
                fileType: 'resume',
                confidence: 0.99,
                reason: 'PRIVATE_CLASSIFICATION_TEXT',
            });
            aiCall.mockResolvedValueOnce({ work: [], education: [] });
            await parseFile(
                'data:text/plain;base64,U3ludGhldGlj',
                'did:example:private-owner',
                FileUploadTypesEnum.Resume,
                {
                    enabled,
                    operationId: '00000000-0000-4000-8000-000000000001',
                    attemptId: '00000000-0000-4000-8000-000000000002',
                    attempt: 1,
                }
            );
            if (!enabled) expect(events).toEqual([]);
        }
        expect(events).toEqual([
            expect.objectContaining({
                event: 'file_processing_completed',
                outcome: 'empty',
                failureCode: 'ZERO_STRUCTURED_ITEMS',
                operationId: '00000000-0000-4000-8000-000000000001',
                count: 0,
                pipelineVersion: 'file-extraction-v1',
            }),
        ]);
        expect(JSON.stringify(events)).not.toContain('PRIVATE');
        expect(JSON.stringify(events)).not.toContain('private-owner');
        expect(JSON.stringify(events)).not.toContain('base64');
    } finally {
        console.info = originalInfo;
    }
});

test('parseFile rejects malformed and oversized files before reader or model execution', async () => {
    extractFileText.mockClear();
    await expect(
        parseFile('', 'did:example:synthetic', FileUploadTypesEnum.Resume)
    ).rejects.toMatchObject({
        status: 400,
        processing: { stage: 'input', code: 'INPUT_INVALID', outcome: 'failed' },
    });
    await expect(
        parseFile(
            `data:text/plain;base64,${'A'.repeat(6 * 1024 * 1024)}`,
            'did:example:synthetic',
            FileUploadTypesEnum.Resume
        )
    ).rejects.toMatchObject({
        status: 400,
        processing: { stage: 'input', code: 'FILE_TOO_LARGE', outcome: 'failed' },
    });
    expect(extractFileText).not.toHaveBeenCalled();
    expect(aiCall).not.toHaveBeenCalled();
});

test('parseFile routes a mislabeled upload through the detected parser', async () => {
    classifyFileContent.mockResolvedValueOnce({
        fileType: 'transcript',
        confidence: 0.97,
        reason: 'Contains courses, credits, and grades',
    });
    aiCall.mockResolvedValueOnce({
        institution: 'Westbridge University',
        courses: [{ courseCode: 'DS 101', courseName: 'Data Science' }],
    });

    const response = await parseFile(
        'data:text/plain;base64,VHJhbnNjcmlwdA==',
        'did:key:z6Mktest-holder',
        'certificate' as any
    );

    expect(response.vcs).toHaveLength(1);
    expect(response.vcs[0]?.vc.type).toContain('ClrCredential');
    expect(response.classification).toEqual({
        requestedFileType: 'certificate',
        detectedFileType: 'transcript',
        confidence: 0.97,
        corrected: true,
        reason: 'Contains courses, credits, and grades',
    });
});

test('parseFile rejects unsupported classifications before extraction', async () => {
    classifyFileContent.mockResolvedValueOnce({
        fileType: 'unsupported',
        confidence: 0.98,
        reason: 'This appears to be a news article',
    });

    await expect(
        parseFile(
            'data:text/plain;base64,TmV3cyBhcnRpY2xl',
            'did:key:z6Mktest-holder',
            'resume' as any
        )
    ).rejects.toMatchObject({
        message: "We couldn't process this document. Please try again.",
        processing: {
            code: 'CONTENT_REJECTED',
            stage: 'classify',
            outcome: 'failed',
        },
    });
    expect(aiCall).not.toHaveBeenCalled();
});

test('a preload request reads consent once and caps credential fan-out', async () => {
    const uris = Array.from(
        { length: 8 },
        (_, index) => `lc:cloud:cloud.learncard.com/trpc:credential:goal-${index}`
    );
    const previousResponse = consentFlowResponse;
    consentFlowResponse = {
        records: [
            {
                credentials: uris.map(uri => ({ category: 'Goals', uri })),
                date: '2026-07-06T17:39:24.602Z',
                contractUri: 'test-contract-uri',
                termsUri: 'test:terms',
                status: 'live',
                contractUpdatedAt: '2026-01-01T00:00:00.000Z',
                guardian: { required: false, approved: false },
                terms: {
                    read: {
                        credentials: {
                            sharing: true,
                            categories: { Goals: { sharing: true, shareAll: true } },
                        },
                    },
                },
            },
        ],
        hasMore: false,
    };
    let active = 0;
    let peak = 0;
    learnCardMocks.readGet.mockImplementation(async (uri?: string) => {
        active += 1;
        peak = Math.max(peak, active);
        await Bun.sleep(2);
        active -= 1;
        return createTestVc(uri ?? '', 'Goals', {
            id: 'did:web:network.learncard.com:users:fresh-kai-14',
            dataPayload: { goals: ['Become a manager'] },
        });
    });
    const { runWithLearnCardRequestScope } = await import('../learncard/requestScope');
    const did = 'did:web:network.learncard.com:users:fresh-kai-14';
    try {
        learnCardMocks.getConsentFlowDataForDid.mockClear();
        await fetchCredentials(did);
        const unscopedReads = learnCardMocks.getConsentFlowDataForDid.mock.calls.length;

        learnCardMocks.getConsentFlowDataForDid.mockClear();
        peak = 0;
        // The unscoped reads refreshed the learner's consent snapshot; start cold.
        resetConsentSnapshots();
        const credentials = await runWithLearnCardRequestScope({}, () => fetchCredentials(did));

        expect(credentials).toHaveLength(uris.length);
        // Several consent reads per credential without a request scope...
        expect(unscopedReads).toBeGreaterThan(uris.length);
        // ...and exactly one with it.
        expect(learnCardMocks.getConsentFlowDataForDid).toHaveBeenCalledTimes(1);
        expect(peak).toBeLessThanOrEqual(4);
        expect(peak).toBeGreaterThan(1);
    } finally {
        consentFlowResponse = previousResponse;
        learnCardMocks.readGet.mockImplementation(async (uri?: string) =>
            createTestVc(uri ?? 'vc:test:1')
        );
    }
});

test('fetchCredentials hydrates flat consent-flow credentials arrays', async () => {
    consentFlowResponse = {
        credentials: [
            {
                category: 'Goals',
                uri: 'lc:cloud:cloud.learncard.com/trpc:credential:goal-1',
            },
            {
                category: 'Professional Title',
                uri: 'lc:cloud:cloud.learncard.com/trpc:credential:title-1',
            },
        ],
        date: '2026-07-06T17:39:24.602Z',
        contractUri: 'test-contract-uri',
        termsUri: 'test:terms',
        status: 'live',
        contractUpdatedAt: '2026-01-01T00:00:00.000Z',
        guardian: { required: false, approved: false },
        terms: {
            read: {
                credentials: {
                    sharing: true,
                    categories: {
                        Goals: { sharing: true, shareAll: true },
                        'Professional Title': { sharing: true, shareAll: true },
                    },
                },
            },
        },
        hasMore: false,
        cursor: null,
    } as any;
    consentFlowResponse = { records: [consentFlowResponse], hasMore: false };

    learnCardMocks.readGet.mockImplementation(async (uri?: string) => {
        const id = uri ?? '';

        return createTestVc(id, id.includes('goal') ? 'Goals' : 'Professional Title', {
            id: 'did:web:network.learncard.com:users:fresh-kai-14',
            dataPayload: id.includes('goal')
                ? { goals: ['Become a manager'] }
                : { professionalTitle: 'Team Lead' },
        });
    });

    const credentials = await fetchCredentials('did:web:network.learncard.com:users:fresh-kai-14');

    expect(credentials).toHaveLength(2);
    expect(credentials.map((vc: { uri: string }) => vc.uri)).toEqual([
        'lc:cloud:cloud.learncard.com/trpc:credential:goal-1',
        'lc:cloud:cloud.learncard.com/trpc:credential:title-1',
    ]);
});
test('fetchCredentials re-verifies credentials instead of trusting cached metadata', async () => {
    dbMock.getCredentialRecords.mockResolvedValue([createStoredCredential()]);
    learnCardMocks.verifyCredential.mockResolvedValueOnce({
        checks: [],
        errors: ['Credential is revoked.'],
        warnings: [],
    });

    await expect(fetchCredentials('did:example:learner')).rejects.toThrow();
    expect(learnCardMocks.readGet).toHaveBeenCalledWith('vc:test:1');
});

test('fetchCredentials blocks revoked consent before credential or provider access', async () => {
    consentFlowResponse = {
        ...activeConsentFlowResponse,
        records: [
            {
                ...activeConsentFlowResponse.records[0],
                status: 'withdrawn',
            },
        ],
    };

    await expect(fetchCredentials('did:example:learner')).rejects.toThrow(
        'Active LearnCard AI consent is required'
    );

    expect(learnCardMocks.readGet).not.toHaveBeenCalled();
    expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
    expect(generateAndStoreCredentialEmbeddings).not.toHaveBeenCalled();
});

test('processCredentials skips credentials with complete vector coverage', async () => {
    const existingCredential = createStoredCredential();
    dbMock.getCredentialRecords.mockResolvedValue([existingCredential]);
    getCredentialVectorCoverage.mockResolvedValue(
        new Map([['vc:test:1', new Set(['a', 'b', 'c', 'd', 'e'])]])
    );
    const job = {
        id: 'complete-vectors',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>;

    const metrics = await processCredentials('did:example:learner', job);

    expect(metrics).toMatchObject({
        totalSeen: 1,
        indexed: 0,
        repaired: 0,
        alreadyComplete: 1,
        failed: 0,
    });
    expect(generateAndStoreCredentialEmbeddings).not.toHaveBeenCalled();
    expect(streamingAiCall).not.toHaveBeenCalled();
    expect(dbMock.storeVC).toHaveBeenCalledWith(
        'did:example:learner',
        expect.objectContaining({
            uri: 'vc:test:1',
            verification: expect.objectContaining({ status: 'valid' }),
        })
    );
});

test('processCredentials never reconciles generated credentials as deleted wallet data', async () => {
    const walletCredential = createStoredCredential();
    const generatedCredential = {
        ...walletCredential,
        id: 'aiinsight:did:example:learner:fingerprint',
        uri: 'aiinsight:did:example:learner:fingerprint',
        category: 'AIInsightCredential',
        source: 'generated' as const,
        sourceFingerprint: 'fingerprint',
    };
    dbMock.getCredentialRecords.mockResolvedValue([walletCredential, generatedCredential]);
    getCredentialVectorCoverage.mockResolvedValue(
        new Map([['vc:test:1', new Set(['a', 'b', 'c', 'd', 'e'])]])
    );
    const job = {
        id: 'generated-provenance',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>;

    await processCredentials('did:example:learner', job);

    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

test('processCredentials waits for sibling operations before retrying a failed credential', async () => {
    consentFlowResponse = {
        ...activeConsentFlowResponse,
        records: [
            {
                ...activeConsentFlowResponse.records[0],
                credentials: [
                    { uri: 'vc:test:failed', category: 'TestCredential' },
                    { uri: 'vc:test:completed', category: 'TestCredential' },
                ],
            },
        ],
    };
    let siblingCompleted = false;
    learnCardMocks.readGet.mockImplementation(async (uri?: string) => {
        if (uri === 'vc:test:failed') throw new Error('temporary read failure');

        await Bun.sleep(10);
        siblingCompleted = true;
        return createTestVc(uri ?? 'vc:test:completed');
    });
    const job = {
        id: 'partial-failure',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>;

    await expect(processCredentials('did:example:learner', job)).rejects.toThrow(
        'temporary read failure'
    );
    expect(siblingCompleted).toBe(true);
    /* The readable sibling is still indexed; the job fails so the read retries. */
    expect(dbMock.storeVC).toHaveBeenCalledTimes(1);
    expect((dbMock.storeVC.mock.calls as unknown[][])[0]?.[1]).toMatchObject({
        uri: 'vc:test:completed',
    });
    expect(dbMock.storeRawCredential).toHaveBeenCalledTimes(1);
    expect(generateAndStoreCredentialEmbeddings).toHaveBeenCalledTimes(1);
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

test('processCredentials repairs incomplete vectors for stored credentials', async () => {
    const existingCredential = createStoredCredential();
    dbMock.getCredentialRecords.mockResolvedValue([existingCredential]);
    getCredentialVectorCoverage.mockResolvedValue(
        new Map([['vc:test:1', new Set(['a', 'b', 'c', 'd'])]])
    );
    const job = {
        id: 'missing-vector',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>;

    const metrics = await processCredentials('did:example:learner', job);

    expect(metrics).toMatchObject({
        totalSeen: 1,
        indexed: 1,
        repaired: 1,
        alreadyComplete: 0,
        failed: 0,
    });
    expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
    expect(generateAndStoreCredentialEmbeddings).toHaveBeenCalledTimes(1);
    expect(dbMock.storeVC).toHaveBeenCalledWith(
        'did:example:learner',
        expect.objectContaining({
            uri: 'vc:test:1',
            aiContext: existingCredential.aiContext,
            verification: expect.objectContaining({ status: 'valid' }),
        })
    );
});

test('processCredentials persists sanitized verification provenance', async () => {
    learnCardMocks.verifyCredential.mockResolvedValueOnce({
        checks: ['proof'],
        errors: [],
        warnings: ['Issuer did:test:issuer requires review at https://private.example/path'],
    });
    const job = {
        id: 'valid-verification',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>;

    const metrics = await processCredentials('did:example:learner', job);

    expect(metrics).toMatchObject({ totalSeen: 1, indexed: 1, failed: 0 });
    expect(dbMock.storeCredentialVerification).toHaveBeenCalledWith(
        'did:example:learner',
        expect.objectContaining({
            credentialUri: 'vc:test:1',
            status: 'valid',
            contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
            checks: ['proof'],
            warnings: ['verification_warning'],
            consent: currentReceipt(),
        }),
        expect.any(Function)
    );
    expect(dbMock.storeRawCredential).toHaveBeenCalledWith(
        'did:example:learner',
        expect.objectContaining({
            uri: 'vc:test:1',
            contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        expect.any(Function)
    );
});

test('processCredentials excludes invalid credentials before model calls', async () => {
    dbMock.getCredentialRecords.mockResolvedValue([createStoredCredential()]);
    learnCardMocks.verifyCredential.mockResolvedValueOnce({
        checks: [],
        errors: ['Invalid signature'],
        warnings: [],
    });
    const job = {
        id: 'invalid-verification',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>;

    const metrics = await processCredentials('did:example:learner', job);

    expect(metrics).toMatchObject({
        totalSeen: 1,
        indexed: 0,
        alreadyComplete: 0,
        failed: 0,
        excludedVerification: 1,
    });
    expect(streamingAiCall).not.toHaveBeenCalled();
    expect(generateAndStoreCredentialEmbeddings).not.toHaveBeenCalled();
    expect(dbMock.storeVC).not.toHaveBeenCalled();
    expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
    expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(dbMock.removeThreadCredentialsByUris).not.toHaveBeenCalled();
    expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

for (const { name, errors, subjectDid } of [
    { name: 'proof mismatch', errors: ['No applicable proof'] },
    {
        name: 'expired credential',
        errors: ['expiration error: Credential is expired'],
    },
    {
        name: 'invalid signed boost payload',
        errors: ['Invalid signature', 'Boost Credential could not be verified.'],
    },
    {
        name: 'wrong signed subject',
        errors: [],
        subjectDid: 'did:example:other',
    },
]) {
    test(`confirmed ${name} excludes without deleting retained data`, async () => {
        dbMock.getCredentialRecords.mockResolvedValue([createStoredCredential()]);
        learnCardMocks.readGet.mockResolvedValue(
            createTestVc('vc:test:1', 'TestCredential', {
                id: subjectDid ?? 'did:example:learner',
            })
        );
        learnCardMocks.verifyCredential.mockResolvedValue({
            checks: errors.length ? [] : ['proof'],
            errors,
            warnings: [],
        });
        const metrics = await processCredentials('did:example:learner', {
            id: 'confirmed-invalid',
            updateProgress: mock(async () => undefined),
        } as unknown as Job<CredentialIngestionJobData>);

        expect(metrics).toMatchObject({
            failed: 0,
            indexed: 0,
            excludedVerification: 1,
        });
        expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
        expect(dbMock.removeThreadCredentialsByUris).not.toHaveBeenCalled();
        expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
        expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
        expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
        expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
        await expect(fetchCredentials('did:example:learner')).rejects.toBeInstanceOf(
            UnrecoverableError
        );
    });
}

const unavailableVerificationCases: Array<{
    name: string;
    verify: () => Promise<unknown>;
}> = [
    {
        name: 'did:web HTTP outage',
        verify: async () => ({
            checks: [],
            errors: [
                'Unable to resolve: Error sending HTTP request for https://private.example/issuer',
            ],
            warnings: [],
        }),
    },
    {
        name: 'JSON-LD dependency outage',
        verify: async () => ({
            checks: [],
            errors: ['Loading remote context failed: https://private.example/context'],
            warnings: [],
        }),
    },
    {
        name: 'revocation-list outage despite proof success',
        verify: async () => ({
            checks: ['proof'],
            errors: ['Could not retrieve revocation list'],
            warnings: [],
        }),
    },
    {
        name: 'thrown verifier error',
        verify: async () => {
            throw new Error(
                'private SDK payload: data did not match any variant of untagged enum OneOrMany'
            );
        },
    },
    {
        name: 'malformed verifier result',
        verify: async () => ({ checks: ['proof'], errors: [42], warnings: [] }),
    },
    {
        name: 'missing verifier result',
        verify: async () => undefined,
    },
    {
        name: 'unknown error containing invalidity wording',
        verify: async () => ({
            checks: ['proof'],
            errors: ['Invalid signature: dependency response was unavailable'],
            warnings: [],
        }),
    },
    {
        name: 'mixed invalidity and dependency failure',
        verify: async () => ({
            checks: [],
            errors: ['Invalid signature', 'Could not retrieve revocation list'],
            warnings: [],
        }),
    },
    {
        name: 'ambiguous boost wrapper failure',
        verify: async () => ({
            checks: ['proof'],
            errors: ['Boost Credential could not be verified.'],
            warnings: [],
        }),
    },
    {
        name: 'incomplete verification without proof success',
        verify: async () => ({ checks: [], errors: [], warnings: [] }),
    },
];

for (const { name, verify } of unavailableVerificationCases) {
    test(`unverifiable ${name} excludes locally, preserves retained data, and can recover`, async () => {
        const stored = createStoredCredential();
        const original = structuredClone(stored);
        dbMock.getCredentialRecords.mockResolvedValue([stored]);
        getCredentialVectorCoverage.mockResolvedValue(
            new Map([['vc:test:1', new Set(['a', 'b', 'c', 'd', 'e'])]])
        );
        learnCardMocks.verifyCredential.mockImplementation(verify);
        const job = {
            id: 'retryable-verification',
            updateProgress: mock(async () => undefined),
        } as unknown as Job<CredentialIngestionJobData>;

        const excluded = await processCredentials('did:example:learner', job);
        expect(excluded).toMatchObject({
            excludedVerification: 1,
            indexed: 0,
            failed: 0,
        });
        await expect(
            runWithAiPrivacyContext('did:example:learner', () =>
                resolveVerifiedCredentialProjection(
                    'did:example:learner',
                    'vc:test:1',
                    currentReceipt()
                )
            )
        ).rejects.toBeInstanceOf(CredentialVerificationUnavailableError);
        await expect(
            runWithAiPrivacyContext('did:example:learner', () =>
                service.getSuggestedTopics('did:example:learner')
            )
        ).rejects.toBeInstanceOf(CredentialVerificationUnavailableError);

        expect(stored).toEqual(original);
        expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
        expect(dbMock.removeThreadCredentialsByUris).not.toHaveBeenCalled();
        expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
        expect(dbMock.storeVC).not.toHaveBeenCalled();
        expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
        expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
        expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
        expect(generateAndStoreCredentialEmbeddings).not.toHaveBeenCalled();
        expect(generateAIInsightCredential).not.toHaveBeenCalled();
        expect(getTopicSuggestions).not.toHaveBeenCalled();

        learnCardMocks.verifyCredential.mockResolvedValue({
            checks: ['proof'],
            errors: [],
            warnings: [],
        });
        const recovered = await processCredentials('did:example:learner', job);
        expect(recovered).toMatchObject({
            alreadyComplete: 1,
            indexed: 0,
            failed: 0,
        });
        const projection = await runWithAiPrivacyContext('did:example:learner', () =>
            resolveVerifiedCredentialProjection(
                'did:example:learner',
                'vc:test:1',
                currentReceipt()
            )
        );
        expect(projection).toEqual(stored.projection);
        await runWithAiPrivacyContext('did:example:learner', () =>
            service.getSuggestedTopics('did:example:learner')
        );
        expect(getTopicSuggestions).toHaveBeenCalledTimes(1);
        expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
        expect(dbMock.removeThreadCredentialsByUris).not.toHaveBeenCalled();
        expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
    });
}

test('processCredentials re-verifies and re-indexes changed content', async () => {
    const originalCredential = createTestVc('vc:test:1', 'TestCredential', {
        id: 'did:example:learner',
        achievement: 'Original',
    });
    const changedCredential = createTestVc('vc:test:1', 'TestCredential', {
        id: 'did:example:learner',
        achievement: {
            name: 'Changed',
            recipientName: 'Private Learner',
            accountNumber: 'private-account-42',
        },
    });

    dbMock.getCredentialRecords.mockResolvedValue([createStoredCredential(originalCredential)]);
    learnCardMocks.readGet.mockResolvedValue(changedCredential);
    getCredentialVectorCoverage.mockResolvedValue(
        new Map([['vc:test:1', new Set(['a', 'b', 'c', 'd', 'e'])]])
    );
    const job = {
        id: 'changed-content',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>;

    const metrics = await processCredentials('did:example:learner', job);

    expect(metrics).toMatchObject({
        totalSeen: 1,
        indexed: 1,
        repaired: 1,
        alreadyComplete: 0,
        failed: 0,
        changed: true,
    });
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(1);
    expect(streamingAiCall).not.toHaveBeenCalled();
    expect(generateAndStoreCredentialEmbeddings).toHaveBeenCalledTimes(1);
    const embeddingPayload = String(generateCredentialEmbeddingTexts.mock.calls[0]?.[0]);
    expect(embeddingPayload).toContain('Changed');
    expect(embeddingPayload).not.toContain('did:');
    expect(embeddingPayload).not.toContain('proof');
    expect(embeddingPayload).not.toContain('Private Learner');
    expect(embeddingPayload).not.toContain('private-account-42');
    expect(dbMock.storeRawCredential).toHaveBeenCalledWith(
        'did:example:learner',
        expect.objectContaining({
            uri: 'vc:test:1',
            contentHash: fingerprintCredential(changedCredential),
        }),
        expect.any(Function)
    );
});

test('verification requires proof success without retaining raw SDK text', async () => {
    const secret = 'Learner Private Name and account 12345';
    for (const verify of [
        async () => ({ checks: [secret], errors: [], warnings: [secret] }),
        async () => {
            throw new Error(secret);
        },
    ]) {
        const error = await verifyCredentialForIngestion({
            credential: createTestVc('vc:test:1'),
            credentialUri: 'vc:test:1',
            subjectDid: 'did:example:learner',
            consent: currentReceipt(),
            verify,
        }).catch((error: unknown) => error);
        expect(error).toBeInstanceOf(CredentialVerificationUnavailableError);
        expect(String(error)).not.toContain(secret);
        expect(JSON.stringify(error)).not.toContain(secret);
        expect(error).not.toHaveProperty('cause');
    }
});

test('formatter resolution requires matching ALS owner and shared URI', async () => {
    const receipt = currentReceipt();
    await expect(
        resolveVerifiedCredentialProjection('did:example:learner', 'vc:test:1', receipt)
    ).rejects.toThrow();
    await expect(
        runWithAiPrivacyContext('did:example:other', () =>
            resolveVerifiedCredentialProjection('did:example:learner', 'vc:test:1', receipt)
        )
    ).rejects.toThrow();
    await expect(
        runWithAiPrivacyContext('did:example:learner', () =>
            resolveVerifiedCredentialProjection('did:example:learner', 'vc:test:unshared', receipt)
        )
    ).rejects.toThrow();
    expect(learnCardMocks.readGet).not.toHaveBeenCalled();
    expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
});

test('formatter verifies the exact signed original before returning only learning facts', async () => {
    const original = createTestVc('vc:test:1', 'TestCredential', {
        id: 'did:example:learner',
        achievement: { name: 'Algebra' },
        name: 'Private Learner',
    });
    learnCardMocks.readGet.mockResolvedValue(original);
    learnCardMocks.verifyCredential.mockImplementation(async (value?: VC) => {
        expect(value).toBe(original);
        expect(value?.proof).toBe(original.proof);
        return { checks: ['proof'], errors: [], warnings: [] };
    });
    const projection = await runWithAiPrivacyContext('did:example:learner', () =>
        resolveVerifiedCredentialProjection('did:example:learner', 'vc:test:1', currentReceipt())
    );
    expect(projection.facts).toContainEqual({
        kind: 'achievement',
        label: 'name',
        value: 'Algebra',
    });
    expect(JSON.stringify(projection)).not.toContain('Private Learner');
    expect(JSON.stringify(projection)).not.toContain('proof');
});

test('consent changing during original verification prevents persistence and projection return', async () => {
    const receipt = currentReceipt();
    learnCardMocks.verifyCredential.mockImplementation(async () => {
        consentFlowResponse = {
            ...activeConsentFlowResponse,
            records: [
                {
                    ...activeConsentFlowResponse.records[0],
                    date: '2026-02-01T00:00:00.000Z',
                },
            ],
        };
        return { checks: ['proof'], errors: [], warnings: [] };
    });
    await expect(
        runWithAiPrivacyContext('did:example:learner', () =>
            resolveVerifiedCredentialProjection('did:example:learner', 'vc:test:1', receipt)
        )
    ).rejects.toThrow();
    expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
    expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
    expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
});

test('unchanged content with changed consent rebuilds context and vectors', async () => {
    const cached = createStoredCredential();
    dbMock.getCredentialRecords.mockResolvedValue([
        { ...cached, aiContext: 'Unauthorized old context' },
    ]);
    consentFlowResponse = {
        ...activeConsentFlowResponse,
        records: [
            {
                ...activeConsentFlowResponse.records[0],
                date: '2026-02-01T00:00:00.000Z',
            },
        ],
    };
    getCredentialVectorCoverage.mockResolvedValue(
        new Map([['vc:test:1', new Set(['a', 'b', 'c', 'd', 'e'])]])
    );
    const metrics = await processCredentials('did:example:learner', {
        id: 'changed-consent',
        updateProgress: mock(async () => undefined),
    } as unknown as Job<CredentialIngestionJobData>);
    expect(metrics).toMatchObject({
        indexed: 1,
        alreadyComplete: 0,
        changed: true,
    });
    expect(JSON.stringify(generateCredentialEmbeddingTexts.mock.calls)).not.toContain(
        'Unauthorized old context'
    );
    expect(dbMock.storeVC).toHaveBeenCalledWith(
        'did:example:learner',
        expect.objectContaining({
            aiContext: cached.aiContext,
            verification: expect.objectContaining({ consent: currentReceipt() }),
        })
    );
});

test('embedding rejects absent projection instead of transforming the raw original', async () => {
    const credential = createStoredCredential();
    await expect(
        runWithAiPrivacyContext('did:example:learner', () =>
            service.storeCredentialEmbeddings(
                { ...credential, projection: undefined },
                'did:example:learner'
            )
        )
    ).rejects.toThrow();
    expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
});

test('suggested topics use freshly verified shared claims rather than stale database context', async () => {
    dbMock.getCredentialRecords.mockResolvedValue([
        {
            ...createStoredCredential(),
            aiContext: 'Revoked private learning context',
        },
    ]);
    learnCardMocks.readGet.mockResolvedValue(
        createTestVc('vc:test:1', 'TestCredential', {
            id: 'did:example:learner',
            skills: ['Current authorized skill'],
        })
    );
    const topics = await runWithAiPrivacyContext('did:example:learner', () =>
        service.getSuggestedTopics('did:example:learner')
    );
    expect(JSON.stringify(topics)).toContain('Current authorized skill');
    expect(JSON.stringify(topics)).not.toContain('Revoked private learning context');
    expect(learnCardMocks.verifyCredential).toHaveBeenCalled();
});

test('insight diagnostics attribute revoked consent and unavailable verification before providers', async () => {
    const { runAiInsightDiagnostics } = await import('../diagnostics/ai-insight');
    const events: unknown[] = [];
    const original = console.error;
    console.error = mock(event => events.push(event));
    try {
        consentFlowResponse = {
            ...activeConsentFlowResponse,
            records: [{ ...activeConsentFlowResponse.records[0], status: 'withdrawn' }],
        };
        await expect(
            runAiInsightDiagnostics(() => fetchCredentials('did:example:learner'))
        ).rejects.toThrow();
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            stage: 'consent',
            failureCode: 'consent_denied',
        });
        expect(learnCardMocks.readGet).not.toHaveBeenCalled();
        consentFlowResponse = structuredClone(activeConsentFlowResponse);
        learnCardMocks.verifyCredential.mockImplementation(async () => {
            throw new Error('private learner credential token');
        });
        await expect(
            runAiInsightDiagnostics(() => fetchCredentials('did:example:learner'))
        ).rejects.toBeInstanceOf(CredentialVerificationUnavailableError);
        expect(events.at(-1)).toMatchObject({
            stage: 'credential_verification',
            failureCode: 'credential_verification_unavailable',
            verificationOrigin: 'source',
            verificationSubreason: 'sdk_exception',
        });
        expect(aiCall).not.toHaveBeenCalled();
        expect(streamingAiCall).not.toHaveBeenCalled();
        expect(JSON.stringify(events)).not.toContain('private learner');
        expect(JSON.stringify(events)).not.toContain('did:example');
    } finally {
        console.error = original;
    }
});

const fetchInsightCredentials = () =>
    runWithAiPrivacyContext('did:example:learner', () =>
        service.fetchInsightCredentials('did:example:learner')
    );
const unsupportedInput = (uri: string): VC => ({
    ...createTestVc(uri),
    credentialSubject: {
        id: 'did:example:learner',
        name: 'EXCLUDED_PRIVATE_SENTINEL',
    },
    proof: {
        ...(createTestVc(uri).proof as any),
        type: 'DataIntegrityProof',
        cryptosuite: 'ecdsa-sd-2023',
    },
});
const shareInputs = (...uris: string[]) => {
    consentFlowResponse = structuredClone(activeConsentFlowResponse);
    consentFlowResponse.records[0].credentials = uris.map(uri => ({
        uri,
        category: 'TestCredential',
    }));
};

test('insights exclude whole known unsupported inputs without touching their records or projections', async () => {
    shareInputs('vc:excluded', 'vc:eligible');
    const excluded = unsupportedInput('vc:excluded');
    const original = JSON.stringify(excluded);
    learnCardMocks.readGet.mockImplementation(async uri =>
        uri === 'vc:excluded' ? excluded : createTestVc(uri!)
    );
    dbMock.getCredentialRecords.mockResolvedValue([
        { uri: 'vc:excluded', aiContext: 'EXCLUDED_PRIVATE_SENTINEL' },
    ]);
    const batch = await fetchInsightCredentials();
    expect(batch.coverage).toEqual({
        verifiedCount: 1,
        excludedCount: 1,
        exclusions: [{ reason: 'unsupported_cryptosuite', count: 1 }],
    });
    expect(batch.credentials.map((vc: { uri: string }) => vc.uri)).toEqual(['vc:eligible']);
    expect(JSON.stringify(batch)).not.toContain('EXCLUDED_PRIVATE_SENTINEL');
    expect(JSON.stringify(excluded)).toBe(original);
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(1);
    expect(dbMock.getCredentialRecords).not.toHaveBeenCalled();
    expect(dbMock.storeRawCredential).toHaveBeenCalledTimes(1);
    expect(dbMock.storeCredentialVerification).toHaveBeenCalledTimes(1);
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
    expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
});

for (const location of ['outer', 'inner', 'chain'] as const) {
    test(`insights exclude unsupported ${location} Boost/chain proof without verifying a subset`, async () => {
        shareInputs('vc:excluded');
        const credential =
            location === 'inner'
                ? {
                      ...createTestVc('vc:excluded'),
                      boostCredential: unsupportedInput('vc:inner'),
                  }
                : unsupportedInput('vc:excluded');
        if (location === 'chain')
            credential.proof = [
                createTestVc('vc:excluded').proof,
                { ...(credential.proof as any), previousProof: 'urn:proof:previous' },
            ] as any;
        const original = JSON.stringify(credential);
        learnCardMocks.readGet.mockResolvedValue(credential);
        const batch = await fetchInsightCredentials();
        expect(batch.credentials).toEqual([]);
        expect(batch.coverage.excludedCount).toBe(1);
        expect(JSON.stringify(credential)).toBe(original);
        expect(learnCardMocks.verifyCredential).not.toHaveBeenCalled();
        expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
        expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
        expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    });
}

for (const failure of ['unknown-suite', 'timeout', 'schema', 'unrecognized'] as const) {
    test(`insights exclude per-credential ${failure}`, async () => {
        shareInputs('vc:unknown');
        if (failure === 'unknown-suite') {
            const input = unsupportedInput('vc:unknown');
            (input.proof as any).cryptosuite = 'unknown-suite';
            learnCardMocks.readGet.mockResolvedValue(input);
        }
        if (failure === 'schema') learnCardMocks.verifyCredential.mockResolvedValue({ checks: [] });
        else if (failure === 'unrecognized')
            learnCardMocks.verifyCredential.mockResolvedValue({
                checks: [],
                errors: ['private resolver failure'],
                warnings: [],
            });
        else learnCardMocks.verifyCredential.mockRejectedValue(new Error('private token timeout'));
        const batch = await fetchInsightCredentials();
        expect(batch.credentials).toEqual([]);
        expect(batch.coverage).toEqual({
            verifiedCount: 0,
            excludedCount: 1,
            exclusions: [{ reason: 'verification_unavailable', count: 1 }],
        });
        expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
        expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    });
}

test('unsupported exclusion cannot bypass changed consent', async () => {
    shareInputs('vc:excluded');
    learnCardMocks.readGet.mockImplementation(async () => {
        consentFlowResponse = structuredClone(consentFlowResponse);
        consentFlowResponse.records[0].status = 'revoked';
        return unsupportedInput('vc:excluded');
    });
    await expect(fetchInsightCredentials()).rejects.toThrow();
    expect(learnCardMocks.verifyCredential).not.toHaveBeenCalled();
    expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
});

test('subject-mismatching credentials are excluded without weakening the subject check', async () => {
    shareInputs('vc:other');
    learnCardMocks.readGet.mockResolvedValue(
        createTestVc('vc:other', 'TestCredential', { id: 'did:example:other' })
    );
    const batch = await fetchInsightCredentials();
    expect(batch.credentials).toEqual([]);
    expect(batch.coverage.exclusions).toEqual([{ reason: 'subject_mismatch', count: 1 }]);
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(1);
});

test('ordinary wallet fetch does not adopt insight exclusion policy', async () => {
    learnCardMocks.readGet.mockResolvedValue(unsupportedInput('vc:test:1'));
    learnCardMocks.verifyCredential.mockRejectedValue(new Error('SDK parser failure'));
    await expect(fetchCredentials('did:example:learner')).rejects.toBeInstanceOf(
        CredentialVerificationUnavailableError
    );
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(1);
});

for (const background of [false, true]) {
    for (const inner of [false, true]) {
        test(`unsupported without created preserves retained records (background=${background}, inner=${inner})`, async () => {
            shareInputs('vc:test:1');
            const unsupported = unsupportedInput('vc:test:1');
            delete (unsupported.proof as any).created;
            const credential = inner
                ? { ...createTestVc('vc:test:1'), boostCredential: unsupported }
                : unsupported;
            const original = JSON.stringify(credential);
            const stored = createStoredCredential();
            const storedOriginal = JSON.stringify(stored);
            dbMock.getCredentialRecords.mockResolvedValue([stored]);
            getCredentialVectorCoverage.mockResolvedValue(
                new Map([['vc:test:1', new Set(['a', 'b', 'c', 'd', 'e'])]])
            );
            learnCardMocks.readGet.mockResolvedValue(credential);
            if (background) {
                const result = await processCredentials('did:example:learner', {
                    id: 'unsupported-only',
                    updateProgress: mock(async () => undefined),
                } as any);
                expect(result).toMatchObject({
                    totalSeen: 1,
                    failed: 0,
                    indexed: 0,
                    excludedUnsupported: 1,
                });
                expect(generateAIInsightCredential).not.toHaveBeenCalled();
            } else {
                expect((await fetchInsightCredentials()).coverage.excludedCount).toBe(1);
            }
            expect(JSON.stringify(credential)).toBe(original);
            expect(JSON.stringify(stored)).toBe(storedOriginal);
            expect(learnCardMocks.verifyCredential).not.toHaveBeenCalled();
            expect(dbMock.storeVC).not.toHaveBeenCalled();
            expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
            expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
            expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
            expect(dbMock.removeThreadCredentialsByUris).not.toHaveBeenCalled();
            expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
            expect(generateAndStoreCredentialEmbeddings).not.toHaveBeenCalled();
        });
    }
}

test('background mixed unsupported inputs do not retry or block eligible insight generation', async () => {
    shareInputs('vc:excluded', 'vc:eligible');
    const unsupported = unsupportedInput('vc:excluded');
    delete (unsupported.proof as any).created;
    learnCardMocks.readGet.mockImplementation(async uri =>
        uri === 'vc:excluded' ? unsupported : createTestVc(uri!)
    );
    const result = await processCredentials('did:example:learner', {
        id: 'mixed',
        updateProgress: mock(async () => undefined),
    } as any);
    expect(result).toMatchObject({
        totalSeen: 2,
        failed: 0,
        indexed: 1,
        excludedUnsupported: 1,
    });
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(1);
    expect(generateAIInsightCredential).toHaveBeenCalledTimes(1);
    expect(
        (dbMock.storeVC.mock.calls as unknown[][]).every(
            call => (call[1] as any)?.uri !== 'vc:excluded'
        )
    ).toBe(true);
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(
        (deleteCredentialEmbeddings.mock.calls as unknown[][]).every(
            call => !(call[1] as any)?.includes('vc:excluded')
        )
    ).toBe(true);
});

test('background unsupported exclusion cannot bypass consent changes', async () => {
    shareInputs('vc:excluded');
    learnCardMocks.readGet.mockImplementation(async () => {
        consentFlowResponse = structuredClone(consentFlowResponse);
        consentFlowResponse.records[0].status = 'revoked';
        return unsupportedInput('vc:excluded');
    });
    await expect(
        processCredentials('did:example:learner', {
            id: 'revoked',
            updateProgress: mock(async () => undefined),
        } as any)
    ).rejects.toThrow();
    expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

test('unknown read/parser errors still fail closed in background instead of broad skipping', async () => {
    learnCardMocks.readGet.mockRejectedValue(
        'data did not match any variant of untagged enum OneOrMany'
    );
    await expect(
        processCredentials('did:example:learner', {
            id: 'unknown-parser',
            updateProgress: mock(async () => undefined),
        } as any)
    ).rejects.toBe('data did not match any variant of untagged enum OneOrMany');
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

for (const background of [false, true]) {
    test(`SDK-hidden validation/read failure preserves records (background=${background})`, async () => {
        const stored = createStoredCredential();
        dbMock.getCredentialRecords.mockResolvedValue([stored]);
        learnCardMocks.readGet.mockResolvedValue(undefined as any);
        const operation = background
            ? processCredentials('did:example:learner', {
                  id: 'unreadable',
                  updateProgress: mock(async () => undefined),
              } as any)
            : fetchInsightCredentials();
        const result = await operation;
        if (background) expect(result).toMatchObject({ excludedVerification: 1, indexed: 0 });
        else
            expect(result).toMatchObject({
                credentials: [],
                coverage: {
                    excludedCount: 1,
                    exclusions: [{ reason: 'unreadable_input', count: 1 }],
                },
            });
        expect(learnCardMocks.verifyCredential).not.toHaveBeenCalled();
        expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
        expect(dbMock.removeThreadCredentialsByUris).not.toHaveBeenCalled();
        expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
        expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
        expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
        expect(generateAIInsightCredential).not.toHaveBeenCalled();
    });
}

const perInputCases = [
    'sdk_throw',
    'returned_error',
    'jsonld',
    'unsupported',
    'malformed',
    'unreadable',
    'subject_mismatch',
    'proof_missing',
    'result_schema',
] as const;
for (const background of [false, true]) {
    for (const failure of perInputCases) {
        test(`mixed batch excludes only ${failure}, retaining payload/history (background=${background})`, async () => {
            shareInputs('vc:excluded', 'vc:eligible');
            const excluded = createTestVc('vc:excluded', 'TestCredential', {
                id: failure === 'subject_mismatch' ? 'did:example:other' : 'did:example:learner',
                name: 'EXCLUDED_PRIVATE_SENTINEL',
            });
            if (failure === 'unsupported') excluded.proof = unsupportedInput('vc:excluded').proof;
            if (failure === 'malformed') delete (excluded as any).issuer;
            const original = JSON.stringify(excluded);
            const retained = {
                ...createStoredCredential(),
                uri: 'vc:excluded',
                aiContext: 'EXCLUDED_PRIVATE_SENTINEL',
            };
            const retainedOriginal = JSON.stringify(retained);
            dbMock.getCredentialRecords.mockResolvedValue([retained]);
            learnCardMocks.readGet.mockImplementation(async uri =>
                uri === 'vc:excluded'
                    ? failure === 'unreadable'
                        ? (undefined as any)
                        : excluded
                    : createTestVc(uri!)
            );
            learnCardMocks.verifyCredential.mockImplementation(async credential => {
                if ((credential as any).id === 'vc:excluded') {
                    if (failure === 'sdk_throw') throw new Error('EXCLUDED_PRIVATE_SENTINEL token');
                    if (failure === 'result_schema') return { checks: [] } as any;
                    if (failure === 'returned_error' || failure === 'jsonld')
                        return {
                            checks: [],
                            errors: [
                                failure === 'jsonld'
                                    ? 'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term'
                                    : 'EXCLUDED_PRIVATE_SENTINEL verifier error',
                            ],
                            warnings: [],
                        };
                    if (failure === 'proof_missing')
                        return { checks: [], errors: [], warnings: [] };
                }
                return { checks: ['proof'], errors: [], warnings: [] };
            });
            const result = background
                ? await processCredentials('did:example:learner', {
                      id: 'mixed-verification',
                      updateProgress: mock(async () => undefined),
                  } as any)
                : await fetchInsightCredentials();
            if (background) {
                expect(result).toMatchObject({ totalSeen: 2, indexed: 1, failed: 0 });
                expect(generateAIInsightCredential).toHaveBeenCalledTimes(1);
            } else {
                expect(result).toMatchObject({
                    coverage: { verifiedCount: 1, excludedCount: 1 },
                });
                expect((result as any).credentials.map((input: any) => input.uri)).toEqual([
                    'vc:eligible',
                ]);
                expect(JSON.stringify(result)).not.toContain('EXCLUDED_PRIVATE_SENTINEL');
                expect(dbMock.getCredentialRecords).not.toHaveBeenCalled();
            }
            expect(JSON.stringify(excluded)).toBe(original);
            expect(JSON.stringify(retained)).toBe(retainedOriginal);
            for (const writer of [
                dbMock.storeVC,
                dbMock.storeRawCredential,
                dbMock.storeCredentialVerification,
            ])
                expect(
                    writer.mock.calls.every(
                        (call: any[]) =>
                            call[1]?.uri !== 'vc:excluded' &&
                            call[1]?.credentialUri !== 'vc:excluded'
                    )
                ).toBe(true);
            expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
            expect(dbMock.removeThreadCredentialsByUris).not.toHaveBeenCalled();
            expect(
                deleteCredentialEmbeddings.mock.calls.every(
                    (call: any[]) => !call[1]?.includes('vc:excluded')
                )
            ).toBe(true);
            expect(JSON.stringify(generateCredentialEmbeddingTexts.mock.calls)).not.toContain(
                'EXCLUDED_PRIVATE_SENTINEL'
            );
        });
    }
    test(`one credential that cannot be projected is dropped, not the batch (background=${background})`, async () => {
        shareInputs('vc:unprojectable', 'vc:eligible');
        learnCardMocks.readGet.mockImplementation(async uri => createTestVc(uri!));
        learnCardMocks.verifyCredential.mockImplementation(async () => ({
            checks: ['proof'],
            errors: [],
            warnings: [],
        }));
        const realProject = projectionModule.projectCredential;
        const spy = spyOn(projectionModule, 'projectCredential').mockImplementation(
            (credential, ...rest) => {
                if ((credential as any).id === 'vc:unprojectable')
                    throw new Error('UNPROJECTABLE_PRIVATE_SENTINEL');
                return realProject(credential, ...rest);
            }
        );
        try {
            const result = background
                ? await processCredentials('did:example:learner', {
                      id: 'mixed-projection',
                      updateProgress: mock(async () => undefined),
                  } as any)
                : await fetchInsightCredentials();
            if (background) expect(result).toMatchObject({ totalSeen: 2, indexed: 1 });
            else
                expect((result as any).credentials.map((input: any) => input.uri)).toEqual([
                    'vc:eligible',
                ]);
            expect(JSON.stringify(result)).not.toContain('UNPROJECTABLE_PRIVATE_SENTINEL');
            expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
        } finally {
            spy.mockRestore();
        }
    });
    for (const boundary of [
        'consent',
        'sdk_init',
        'read_auth',
        'read_transport',
        'storage',
    ] as const) {
        test(`request-wide ${boundary} is not converted to input exclusion (background=${background})`, async () => {
            const blocker = new Error(`synthetic ${boundary} infrastructure failure`);
            if (boundary === 'sdk_init') {
                const { getLearnCard } = await import('../learncard');
                (getLearnCard as any).mockRejectedValueOnce(blocker);
            }
            if (boundary === 'consent')
                learnCardMocks.getConsentFlowDataForDid.mockRejectedValue(blocker);
            if (boundary === 'read_auth' || boundary === 'read_transport')
                learnCardMocks.readGet.mockRejectedValue(blocker);
            if (boundary === 'storage') dbMock.storeRawCredential.mockRejectedValueOnce(blocker);
            const operation = background
                ? processCredentials('did:example:learner', {
                      id: 'boundary',
                      updateProgress: mock(async () => undefined),
                  } as any)
                : fetchInsightCredentials();
            await expect(operation).rejects.toThrow();
            expect(generateAIInsightCredential).not.toHaveBeenCalled();
            expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
        });
    }
}

test('background embedding outage stops instead of reporting credential exclusion', async () => {
    generateAndStoreCredentialEmbeddings.mockRejectedValueOnce(
        new Error('synthetic embedding outage')
    );
    await expect(
        processCredentials('did:example:learner', {
            id: 'embedding-boundary',
            updateProgress: mock(async () => undefined),
        } as any)
    ).rejects.toThrow('synthetic embedding outage');
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

test('insight exclusion cannot bypass authenticated owner binding', async () => {
    await expect(
        runWithAiPrivacyContext('did:example:other', () =>
            service.fetchInsightCredentials('did:example:learner')
        )
    ).rejects.toThrow('Authenticated AI subject mismatch');
    expect(learnCardMocks.readGet).not.toHaveBeenCalled();
});

test('per-input verifier exclusion still aborts if consent changes during verification', async () => {
    learnCardMocks.verifyCredential.mockImplementation(async () => {
        consentFlowResponse = structuredClone(activeConsentFlowResponse);
        consentFlowResponse.records[0].status = 'revoked';
        throw new Error('synthetic SDK failure');
    });
    await expect(fetchInsightCredentials()).rejects.toThrow();
    expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
});

test('individual eligibility exclusions do not emit a failed request diagnostic', async () => {
    const { runAiInsightDiagnostics } = await import('../diagnostics/ai-insight');
    const original = console.error;
    const errors: unknown[] = [];
    console.error = (...args) => {
        errors.push(...args);
    };
    try {
        learnCardMocks.verifyCredential.mockRejectedValue(new Error('EXCLUDED_PRIVATE_SENTINEL'));
        const batch = await runAiInsightDiagnostics(() => fetchInsightCredentials());
        expect(
            (batch as Awaited<ReturnType<typeof service.fetchInsightCredentials>>).coverage
                .excludedCount
        ).toBe(1);
        expect(errors).toEqual([]);
    } finally {
        console.error = original;
    }
});

test('queued insight persistence uses the approved snapshot and revocation rejects the final batch', async () => {
    dbMock.storeCredentialVerification.mockImplementationOnce(async (...args: any[]) => {
        consentFlowResponse = structuredClone(activeConsentFlowResponse);
        consentFlowResponse.records[0].status = 'revoked';
        await args[2]();
    });
    await expect(fetchInsightCredentials()).rejects.toThrow();
    expect(dbMock.storeRawCredential).toHaveBeenCalledTimes(1);
    expect(learnCardMocks.getConsentFlowDataForDid).toHaveBeenCalledTimes(2);
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

for (const operation of ['sdk_init', 'read', 'store_verification', 'store_raw'] as const) {
    test(`actual resolution ${operation} emits only the safe failing boundary`, async () => {
        const { runAiInsightDiagnostics } = await import('../diagnostics/ai-insight');
        const failure = new TypeError('PRIVATE_PAYLOAD_URL_TOKEN_SENTINEL');
        if (operation === 'sdk_init') {
            const { getLearnCard } = await import('../learncard');
            (getLearnCard as any).mockRejectedValueOnce(failure);
        } else if (operation === 'read') learnCardMocks.readGet.mockRejectedValueOnce(failure);
        else if (operation === 'store_verification')
            dbMock.storeCredentialVerification.mockRejectedValueOnce(failure);
        else dbMock.storeRawCredential.mockRejectedValueOnce(failure);
        const original = console.error;
        const events: any[] = [];
        console.error = (...args) => {
            events.push(...args);
        };
        try {
            await expect(runAiInsightDiagnostics(() => fetchInsightCredentials())).rejects.toBe(
                failure
            );
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                event: 'ai_insight_failed',
                stage: 'credential_resolution',
                resolutionOperation: operation,
                errorClass: 'TypeError',
                failureCode: 'unknown',
            });
            expect(JSON.stringify(events)).not.toContain('PRIVATE_PAYLOAD_URL_TOKEN_SENTINEL');
            expect(JSON.stringify(events)).not.toContain('did:');
            expect(generateAIInsightCredential).not.toHaveBeenCalled();
        } finally {
            console.error = original;
        }
    });
}

for (const background of [false, true]) {
    for (const count of [1, 196]) {
        test(`one final shared receipt check replaces per-input network checks (background=${background}, inputs=${count})`, async () => {
            const uris = Array.from({ length: count }, (_, index) => `vc:batch:${index}`);
            shareInputs(...uris);
            const preflight = async (...args: any[]) => {
                expect(learnCardMocks.getConsentFlowDataForDid).toHaveBeenCalledTimes(1);
                await args[2]();
                expect(learnCardMocks.getConsentFlowDataForDid).toHaveBeenCalledTimes(1);
            };
            dbMock.storeCredentialVerification.mockImplementation(preflight);
            dbMock.storeRawCredential.mockImplementation(preflight);
            try {
                const result = background
                    ? await processCredentials('did:example:learner', {
                          id: 'batch-policy',
                          updateProgress: mock(async () => undefined),
                      } as any)
                    : await fetchInsightCredentials();
                expect(learnCardMocks.getConsentFlowDataForDid).toHaveBeenCalledTimes(2);
                expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(count);
                expect(dbMock.storeRawCredential).toHaveBeenCalledTimes(count);
                if (background) expect(result).toMatchObject({ indexed: count, failed: 0 });
                else
                    expect(result).toMatchObject({
                        coverage: { verifiedCount: count, excludedCount: 0 },
                    });
            } finally {
                dbMock.storeCredentialVerification.mockImplementation(async () => undefined);
                dbMock.storeRawCredential.mockImplementation(async () => undefined);
            }
        });
    }
    for (const change of ['revoked', 'revision', 'membership', 'contract']) {
        test(`final batch consent rejects ${change} including excluded inputs (background=${background})`, async () => {
            shareInputs('vc:eligible', 'vc:excluded');
            const original = structuredClone(consentFlowResponse);
            learnCardMocks.readGet.mockImplementation(async uri =>
                uri === 'vc:excluded' ? unsupportedInput(uri) : createTestVc(uri!)
            );
            let reads = 0;
            learnCardMocks.getConsentFlowDataForDid.mockImplementation(async () => {
                reads += 1;
                if (reads === 1) return original;
                const changed = structuredClone(original);
                if (change === 'revoked') changed.records[0].status = 'revoked';
                if (change === 'revision') changed.records[0].date = '2026-02-01T00:00:00.000Z';
                if (change === 'membership')
                    changed.records[0].credentials = [
                        { uri: 'vc:eligible', category: 'TestCredential' },
                    ];
                if (change === 'contract') changed.records[0].contractUri = 'test:other-contract';
                return changed;
            });
            const operation = background
                ? processCredentials('did:example:learner', {
                      id: 'changed-batch',
                      updateProgress: mock(async () => undefined),
                  } as any)
                : fetchInsightCredentials();
            await expect(operation).rejects.toThrow();
            expect(reads).toBe(2);
            expect(dbMock.storeVC).not.toHaveBeenCalled();
            expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
            expect(generateAIInsightCredential).not.toHaveBeenCalled();
            expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
            expect(deleteCredentialEmbeddings).not.toHaveBeenCalled();
        });
    }
    for (const empty of [false, true]) {
        test(`final batch check remains mandatory with ${empty ? 'empty' : 'all-excluded'} input (background=${background})`, async () => {
            shareInputs(...(empty ? [] : ['vc:excluded']));
            learnCardMocks.readGet.mockImplementation(async uri => unsupportedInput(uri!));
            const initial = structuredClone(consentFlowResponse);
            let reads = 0;
            learnCardMocks.getConsentFlowDataForDid.mockImplementation(async () => {
                reads += 1;
                const result = structuredClone(initial);
                if (reads === 2) result.records[0].status = 'revoked';
                return result;
            });
            await expect(
                background
                    ? processCredentials('did:example:learner', {
                          id: 'empty-batch',
                          updateProgress: mock(async () => undefined),
                      } as any)
                    : fetchInsightCredentials()
            ).rejects.toThrow();
            expect(reads).toBe(2);
            expect(dbMock.storeRawCredential).not.toHaveBeenCalled();
            expect(generateAIInsightCredential).not.toHaveBeenCalled();
            expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
        });
    }
}

test('batch authorization is not reused across requests', async () => {
    expect((await fetchInsightCredentials()).coverage.verifiedCount).toBe(1);
    consentFlowResponse = structuredClone(activeConsentFlowResponse);
    consentFlowResponse.records[0].status = 'revoked';
    await expect(fetchInsightCredentials()).rejects.toThrow();
    expect(learnCardMocks.getConsentFlowDataForDid).toHaveBeenCalledTimes(3);
});

test('insight resolution drains sibling persistence before returning an infrastructure failure', async () => {
    consentFlowResponse = structuredClone(activeConsentFlowResponse);
    consentFlowResponse.records[0].credentials = [
        { uri: 'vc:test:failed', category: 'TestCredential' },
        { uri: 'vc:test:sibling', category: 'TestCredential' },
    ];
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const failure = new Error('synthetic persistence failure');
    let settled = false;
    let siblingPersisted = false;
    dbMock.storeRawCredential.mockImplementation(async (...args: any[]) => {
        const record = args[1];
        if (record.uri === 'vc:test:failed') {
            await entered.promise;
            throw failure;
        }
        entered.resolve();
        await release.promise;
        siblingPersisted = true;
    });
    const operation = fetchInsightCredentials().finally(() => {
        settled = true;
    });
    // Attach rejection handling before deliberately releasing the pending sibling.
    const rejected = operation.catch((error: unknown) => error);
    try {
        await Promise.race([
            entered.promise,
            Bun.sleep(1000).then(() => {
                throw new Error('Synthetic sibling did not reach persistence');
            }),
        ]);
        await Bun.sleep(10);
        expect(settled).toBe(false);
        expect(siblingPersisted).toBe(false);
    } finally {
        release.resolve();
    }
    expect(await rejected).toBe(failure);
    expect(siblingPersisted).toBe(true);
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    expect(generateAIInsightCredential).not.toHaveBeenCalled();
});

// A hung SDK call must not hold resolution open: before the bound, these never
// settled. Each case settles or reports "pending" after a short wait.
const settleWithin = async (work: Promise<unknown>, ms: number) =>
    Promise.race([
        work.then(
            () => ({ state: 'resolved' as const, error: undefined }),
            (error: unknown) => ({ state: 'rejected' as const, error })
        ),
        Bun.sleep(ms).then(() => ({ state: 'pending' as const, error: undefined })),
    ]);

const withLearnCardCallTimeout = async <T>(
    timeoutMs: string,
    run: () => Promise<T>
): Promise<T> => {
    const previous = process.env.LEARNCARD_CALL_TIMEOUT_MS;
    process.env.LEARNCARD_CALL_TIMEOUT_MS = timeoutMs;
    try {
        return await run();
    } finally {
        if (previous === undefined) delete process.env.LEARNCARD_CALL_TIMEOUT_MS;
        else process.env.LEARNCARD_CALL_TIMEOUT_MS = previous;
    }
};

const resolveSharedCredential = () =>
    runWithAiPrivacyContext('did:example:learner', () =>
        resolveVerifiedCredentialProjection('did:example:learner', 'vc:test:1', currentReceipt())
    );

test('a hung credential read is cut off at LEARNCARD_CALL_TIMEOUT_MS', async () => {
    learnCardMocks.readGet.mockImplementation(() => new Promise<never>(() => {}));
    const outcome = await withLearnCardCallTimeout('40', () =>
        settleWithin(resolveSharedCredential(), 1_000)
    );

    expect(outcome.state).toBe('rejected');
    expect(outcome.error).toMatchObject({ name: 'TimeoutError' });
    expect(learnCardMocks.verifyCredential).not.toHaveBeenCalled();
    expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
});

test('a hung verifier is cut off and reported as an sdk_timeout subreason', async () => {
    learnCardMocks.verifyCredential.mockImplementation(() => new Promise<never>(() => {}));
    const outcome = await withLearnCardCallTimeout('40', () =>
        settleWithin(resolveSharedCredential(), 1_000)
    );

    expect(outcome.state).toBe('rejected');
    expect(outcome.error).toBeInstanceOf(CredentialVerificationUnavailableError);
    expect(outcome.error).toMatchObject({ verificationSubreason: 'sdk_timeout' });
    expect(dbMock.storeCredentialVerification).not.toHaveBeenCalled();
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
});

test("the request scope's signal releases a hung credential read", async () => {
    const { runWithLearnCardRequestScope } = await import('../learncard/requestScope');
    learnCardMocks.readGet.mockImplementation(() => new Promise<never>(() => {}));
    const controller = new AbortController();
    // The per-call bound is far away; only the request signal can end this.
    const outcome = await withLearnCardCallTimeout('60000', () => {
        const work = runWithLearnCardRequestScope(
            { signal: controller.signal },
            resolveSharedCredential
        );
        setTimeout(() => controller.abort(new DOMException('synthetic abort', 'AbortError')), 20);
        return settleWithin(work, 1_000);
    });

    expect(outcome.state).toBe('rejected');
    expect(outcome.error).toMatchObject({ name: 'AbortError' });
});

test('an empty credential read is unavailable with a read_empty subreason', async () => {
    learnCardMocks.readGet.mockImplementation(async () => undefined as never);
    const error = await resolveSharedCredential().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CredentialVerificationUnavailableError);
    expect(error).toMatchObject({ verificationSubreason: 'read_empty' });
});

/* Per-credential isolation: one bad credential must not break the batch. */
const twoCredentialConsent = () => ({
    ...activeConsentFlowResponse,
    records: [
        {
            ...activeConsentFlowResponse.records[0],
            credentials: [
                { uri: 'vc:test:1', category: 'TestCredential' },
                { uri: 'vc:test:2', category: 'TestCredential' },
            ],
        },
    ],
});
const JSONLD_TERM_FAILURE = {
    checks: ['expiration'],
    errors: ['Unknown context: https://private.example/context'],
    warnings: [],
};
/* The production boost failure: two undefined terms plus the boost wrapper. */
const UNDEFINED_TERM_BOOST_FAILURE = {
    checks: ['expiration'],
    errors: [
        'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI: privateTerm',
        'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI: privateTerm',
        'Boost Credential could not be verified.',
    ],
    warnings: [],
};
const captureWarnings = async <T>(
    run: () => Promise<T>
): Promise<{ result: T | undefined; error: unknown; events: unknown[] }> => {
    const events: unknown[] = [];
    const originalWarn = console.warn;
    const originalInfo = console.info;
    console.warn = mock((...data: unknown[]) => events.push(...data));
    console.info = mock((...data: unknown[]) => events.push(...data));
    try {
        const result = await run();
        return { result, error: undefined, events };
    } catch (error) {
        return { result: undefined, error, events };
    } finally {
        console.warn = originalWarn;
        console.info = originalInfo;
    }
};

test('preload skips a jsonld_context credential and still loads the good one', async () => {
    consentFlowResponse = twoCredentialConsent();
    learnCardMocks.readGet.mockImplementation(async (uri?: string) =>
        createTestVc(uri ?? '', 'TestCredential', {
            id: 'did:example:learner',
            skills: [uri === 'vc:test:1' ? 'Good credential skill' : 'Bad skill'],
        })
    );
    learnCardMocks.verifyCredential.mockImplementation(async credential =>
        credential?.id === 'vc:test:2'
            ? JSONLD_TERM_FAILURE
            : { checks: ['proof'], errors: [], warnings: [] }
    );

    const { result, error, events } = await captureWarnings(() =>
        runWithAiPrivacyContext('did:example:learner', () =>
            service.getSuggestedTopics('did:example:learner')
        )
    );

    expect(error).toBeUndefined();
    expect(result).toMatchObject({ count: 1 });
    expect(JSON.stringify(result)).toContain('Good credential skill');
    expect(JSON.stringify(result)).not.toContain('Bad skill');
    expect(events).toContainEqual({
        event: 'credential_skipped',
        credentialBatch: 'preload',
        index: 1,
        count: 2,
        failureCode: 'credential_verification_unavailable',
        verificationSubreason: 'unrecognized_verifier_error',
        verifierErrorKind: 'jsonld_context',
    });
    expect(events).toContainEqual(
        expect.objectContaining({
            event: 'credential_batch_completed',
            credentialBatch: 'preload',
            loadedCount: 1,
            skippedCount: 1,
            count: 2,
        })
    );
    const logged = JSON.stringify(events);
    expect(logged).not.toContain('vc:test');
    expect(logged).not.toContain('did:');
    expect(logged).not.toContain('private.example');
    expect(logged).not.toContain('Unknown context');
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    /* A context failure may be transient: it is not remembered as bad. */
    const batch = await import('./batch');
    expect(batch.isKnownBadCredential('did:example:learner', 'vc:test:2')).toBe(false);
});

test('preload skips an undefined_jsonld_term boost and still loads the good one', async () => {
    consentFlowResponse = twoCredentialConsent();
    learnCardMocks.verifyCredential.mockImplementation(async credential =>
        credential?.id === 'vc:test:2'
            ? UNDEFINED_TERM_BOOST_FAILURE
            : { checks: ['proof'], errors: [], warnings: [] }
    );

    const { result, error, events } = await captureWarnings(() =>
        runWithAiPrivacyContext('did:example:learner', () =>
            service.getSuggestedTopics('did:example:learner')
        )
    );

    expect(error).toBeUndefined();
    expect(result).toMatchObject({ count: 1 });
    expect(events).toContainEqual({
        event: 'credential_skipped',
        credentialBatch: 'preload',
        index: 1,
        count: 2,
        failureCode: 'credential_verification_unavailable',
        verificationSubreason: 'unrecognized_verifier_error',
        verifierErrorKind: 'undefined_jsonld_term',
    });
    const logged = JSON.stringify(events);
    expect(logged).not.toContain('privateTerm');
    expect(logged).not.toContain('vc:test');
    expect(logged).not.toContain('did:');
    expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
    /* The preload remembers the permanent failure for the chat context. */
    const batch = await import('./batch');
    expect(batch.isKnownBadCredential('did:example:learner', 'vc:test:2')).toBe(true);
    expect(batch.isKnownBadCredential('did:example:learner', 'vc:test:1')).toBe(false);
    batch.clearKnownBadCredentials();
});

test('preload skips a credential whose read throws or comes back empty', async () => {
    consentFlowResponse = {
        ...twoCredentialConsent(),
        records: [
            {
                ...twoCredentialConsent().records[0],
                credentials: [
                    { uri: 'vc:test:1', category: 'TestCredential' },
                    { uri: 'vc:test:2', category: 'TestCredential' },
                    { uri: 'vc:test:3', category: 'TestCredential' },
                ],
            },
        ],
    };
    learnCardMocks.readGet.mockImplementation(async (uri?: string) => {
        if (uri === 'vc:test:2')
            throw new Error('private read failure for vc:test:2 did:example:learner');
        if (uri === 'vc:test:3') return undefined as never;
        return createTestVc(uri ?? '');
    });

    const { result, error, events } = await captureWarnings(() =>
        runWithAiPrivacyContext('did:example:learner', () =>
            service.getSuggestedTopics('did:example:learner')
        )
    );

    expect(error).toBeUndefined();
    expect(result).toMatchObject({ count: 1 });
    expect(events).toContainEqual(
        expect.objectContaining({
            event: 'credential_skipped',
            index: 1,
            count: 3,
            failureCode: 'unknown',
        })
    );
    expect(events).toContainEqual(
        expect.objectContaining({
            event: 'credential_skipped',
            index: 2,
            count: 3,
            failureCode: 'credential_verification_unavailable',
            verificationSubreason: 'read_empty',
        })
    );
    expect(events).toContainEqual(
        expect.objectContaining({
            event: 'credential_batch_completed',
            loadedCount: 1,
            skippedCount: 2,
        })
    );
    expect(JSON.stringify(events)).not.toContain('private read failure');
    expect(JSON.stringify(events)).not.toContain('did:');
});

test('preload still fails when every credential is bad', async () => {
    consentFlowResponse = twoCredentialConsent();
    learnCardMocks.verifyCredential.mockResolvedValue(JSONLD_TERM_FAILURE);

    const { error } = await captureWarnings(() =>
        runWithAiPrivacyContext('did:example:learner', () =>
            service.getSuggestedTopics('did:example:learner')
        )
    );

    expect(error).toBeInstanceOf(CredentialVerificationUnavailableError);
    expect(error).toMatchObject({ verifierErrorKind: 'jsonld_context' });
    expect(getTopicSuggestions).not.toHaveBeenCalled();
});

test('a deadline mid-batch still fails preload as a timeout, not a skip', async () => {
    consentFlowResponse = twoCredentialConsent();
    learnCardMocks.readGet.mockImplementation(async (uri?: string) =>
        uri === 'vc:test:2' ? new Promise<never>(() => {}) : createTestVc(uri ?? '')
    );
    const controller = new AbortController();
    const deadline = new DOMException('Preload deadline exceeded', 'TimeoutError');
    setTimeout(() => controller.abort(deadline), 30);

    const outcome = await withLearnCardCallTimeout('60000', () =>
        settleWithin(
            runWithAiPrivacyContext('did:example:learner', () =>
                service.getSuggestedTopics('did:example:learner', {
                    signal: controller.signal,
                })
            ),
            1_000
        )
    );

    expect(outcome.state).toBe('rejected');
    expect(outcome.error).toBe(deadline);
    expect(getTopicSuggestions).not.toHaveBeenCalled();
});

test('an abort that lands in a verifier mid-batch is not treated as a skip', async () => {
    consentFlowResponse = twoCredentialConsent();
    learnCardMocks.verifyCredential.mockImplementation(async credential =>
        credential?.id === 'vc:test:2'
            ? new Promise<never>(() => {})
            : { checks: ['proof'], errors: [], warnings: [] }
    );
    const controller = new AbortController();
    setTimeout(
        () => controller.abort(new DOMException('Preload deadline exceeded', 'TimeoutError')),
        30
    );

    const outcome = await withLearnCardCallTimeout('60000', () =>
        settleWithin(
            runWithAiPrivacyContext('did:example:learner', () =>
                service.getSuggestedTopics('did:example:learner', {
                    signal: controller.signal,
                })
            ),
            1_000
        )
    );

    expect(outcome.state).toBe('rejected');
    expect(getTopicSuggestions).not.toHaveBeenCalled();
});

const resolveProjection = (receipt = currentReceipt()) =>
    runWithAiPrivacyContext('did:example:learner', () =>
        resolveVerifiedCredentialProjection('did:example:learner', 'vc:test:1', receipt)
    );

test('a verified credential is reused under the same consent revision without a LearnCard read or verify', async () => {
    const first = await resolveProjection();
    expect(learnCardMocks.readGet).toHaveBeenCalledTimes(1);
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(1);
    learnCardMocks.readGet.mockClear();
    learnCardMocks.verifyCredential.mockClear();
    learnCardMocks.getConsentFlowDataForDid.mockClear();

    const second = await resolveProjection();

    expect(second).toEqual(first);
    expect(learnCardMocks.readGet).not.toHaveBeenCalled();
    expect(learnCardMocks.verifyCredential).not.toHaveBeenCalled();
    // Consent and its revision are still checked on a hit.
    expect(learnCardMocks.getConsentFlowDataForDid).toHaveBeenCalled();
});

test('a consent revision change bypasses the verified cache', async () => {
    await resolveProjection();
    learnCardMocks.readGet.mockClear();
    learnCardMocks.verifyCredential.mockClear();
    consentFlowResponse = {
        ...activeConsentFlowResponse,
        records: [
            {
                ...activeConsentFlowResponse.records[0],
                date: '2026-02-01T00:00:00.000Z',
            },
        ],
    };

    await resolveProjection();

    expect(learnCardMocks.readGet).toHaveBeenCalledTimes(1);
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(1);
});

test('a cache hit still fails when consent is gone', async () => {
    const receipt = currentReceipt();
    await resolveProjection(receipt);
    consentFlowResponse = { records: [], hasMore: false };

    await expect(resolveProjection(receipt)).rejects.toThrow();
});

test('with fake timers, an opening with credentials the preload verified is ready within 2 s', async () => {
    await runWithAiPrivacyContext('did:example:learner', () =>
        service.getSuggestedTopics('did:example:learner')
    );
    // A fresh LearnCard read would now never finish inside the opening budget.
    learnCardMocks.readGet.mockImplementation(() => new Promise<never>(() => {}));
    const receipt = getActiveAiConsentReceipt(consentFlowResponse.records[0], 'model-inference')!;

    jest.useFakeTimers();
    try {
        let ready = false;
        const opening = resolveProjection(receipt).then((projection: unknown) => {
            ready = true;
            return projection;
        });
        for (let elapsed = 0; elapsed < 2_000 && !ready; elapsed += 100) {
            for (let tick = 0; tick < 50; tick += 1) await Promise.resolve();
            jest.advanceTimersByTime(100);
        }
        expect(ready).toBe(true);
        expect(await opening).toMatchObject({ schemaVersion: '1' });
        expect(learnCardMocks.readGet).toHaveBeenCalledTimes(1);
    } finally {
        jest.useRealTimers();
    }
});

test('two concurrent preloads for one owner make one LearnCard pass', async () => {
    consentFlowResponse = twoCredentialConsent();
    learnCardMocks.getConsentFlowDataForDid.mockClear();

    const [first, second] = await runWithAiPrivacyContext('did:example:learner', () =>
        Promise.all([
            service.getSuggestedTopics('did:example:learner'),
            service.getSuggestedTopics('did:example:learner'),
        ])
    );

    expect(second).toBe(first);
    expect(learnCardMocks.readGet).toHaveBeenCalledTimes(2);
    expect(learnCardMocks.verifyCredential).toHaveBeenCalledTimes(2);
    expect(getTopicSuggestions).toHaveBeenCalledTimes(1);
});

test('a preload joined after its starter cancels runs again for the joiner', async () => {
    const controller = new AbortController();
    const started = runWithAiPrivacyContext('did:example:learner', () =>
        service.getSuggestedTopics('did:example:learner', {
            signal: controller.signal,
        })
    );
    const joined = runWithAiPrivacyContext('did:example:learner', () =>
        service.getSuggestedTopics('did:example:learner')
    );
    controller.abort(new DOMException('Socket closed', 'AbortError'));

    await expect(started).rejects.toThrow('Socket closed');
    await expect(joined).resolves.toMatchObject({ count: 1 });
});

test('the preload reuses a credential the chat context just verified', async () => {
    await resolveProjection(
        getActiveAiConsentReceipt(consentFlowResponse.records[0], 'model-inference')!
    );
    learnCardMocks.readGet.mockClear();
    learnCardMocks.verifyCredential.mockClear();

    const result = await runWithAiPrivacyContext('did:example:learner', () =>
        service.getSuggestedTopics('did:example:learner')
    );

    expect(result).toMatchObject({ count: 1 });
    expect(learnCardMocks.readGet).not.toHaveBeenCalled();
    expect(learnCardMocks.verifyCredential).not.toHaveBeenCalled();
});

test('an uncached preload read waits while a chat start reads credential context', async () => {
    const did = 'did:example:learner';
    const endContextRead = beginCredentialContextRead(did);
    const preload = runWithAiPrivacyContext(did, () => service.getSuggestedTopics(did));
    await Bun.sleep(30);

    expect(learnCardMocks.readGet).not.toHaveBeenCalled();

    endContextRead();
    await expect(preload).resolves.toMatchObject({ count: 1 });
    expect(learnCardMocks.readGet).toHaveBeenCalledTimes(1);
});

test('session fetch drops one credential that cannot be projected and loads the rest', async () => {
    shareInputs('vc:unprojectable', 'vc:eligible');
    learnCardMocks.readGet.mockImplementation(async uri => createTestVc(uri!));
    learnCardMocks.verifyCredential.mockImplementation(async () => ({
        checks: ['proof'],
        errors: [],
        warnings: [],
    }));
    const realProject = projectionModule.projectCredential;
    const spy = spyOn(projectionModule, 'projectCredential').mockImplementation(
        (credential, ...rest) => {
            if ((credential as any).id === 'vc:unprojectable')
                throw new Error('UNPROJECTABLE_PRIVATE_SENTINEL');
            return realProject(credential, ...rest);
        }
    );
    try {
        const credentials = await fetchCredentials('did:example:learner');
        expect(credentials.map((credential: any) => credential.uri)).toEqual(['vc:eligible']);
        expect(dbMock.deleteVCsByUris).not.toHaveBeenCalled();
        expect(
            dbMock.storeCredentialVerification.mock.calls.every(
                (call: any[]) => call[1]?.credentialUri !== 'vc:unprojectable'
            )
        ).toBe(true);
    } finally {
        spy.mockRestore();
    }
});
