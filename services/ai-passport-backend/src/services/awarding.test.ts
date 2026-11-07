import { runWithLocale } from '../ai/locale';
import { createHash } from 'node:crypto';
import * as aiPrivacy from '../ai/privacy';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AI_INSIGHT_CREDENTIAL_TYPE } from '../constants/vc';
import type { DBCredentialRecord } from '../db';
import type { ChatMessage, JWE, UnsignedVC, VC } from '@learncard/types';
import { projectCredential } from '../credentials/projection';
import { fingerprintCredential } from '../credentials/verification';
import type { ActiveAiConsentReceipt } from '../learncard/consent';
import type { SummaryCredentialData } from '../ai/generation-schemas';

const consent: ActiveAiConsentReceipt = {
    contractUri: 'test-contract-uri',
    receiptId: 'test-receipt',
    status: 'live',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Dummy'],
    credentialUris: ['vc:dummy', 'vc:second'],
    personalFields: [],
    guardian: { required: false, approved: false },
    purpose: 'model-inference',
    revision: 'test-revision',
};
// Preserve the real context exports used by the consent error module.
const privacyExports = { ...aiPrivacy };
mock.module('../ai/privacy', () => ({
    ...privacyExports,
    assertCurrentAiConsent: async () => consent,
}));
mock.module('./credentialSearch', () => ({
    searchCredentialsByTopic: async () => [],
}));

let issuanceError: Error | undefined;
let issuedInput: UnsignedVC | undefined;
let storageError: Error | undefined;

const dbCalls: Array<{ did: string; vc: DBCredentialRecord }> = [];
const credential: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'vc:dummy',
    type: ['VerifiableCredential', 'Dummy'],
    issuer: 'did:example:issuer',
    issuanceDate: new Date().toISOString(),
    credentialSubject: { id: 'did:example:user1', any: 'thing' },
    proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
    },
};
let excludedFixtureCount = 0;
let excludedFixtureReason: 'unsupported_cryptosuite' | 'verification_unavailable' =
    'unsupported_cryptosuite';
let credentialFixtures: DBCredentialRecord[] = [
    {
        id: 'vc:dummy',
        uri: 'vc:dummy',
        category: 'Dummy',
        credential,
        rawCredentialJson: JSON.stringify(credential),
        aiContext: '',
        createdAt: new Date().toISOString(),
    },
];

mock.module('../credentials/service', () => ({
    fetchCredentials: mock(async () => credentialFixtures),
    fetchInsightCredentials: mock(async () => ({
        credentials: credentialFixtures,
        coverage: {
            verifiedCount: credentialFixtures.length,
            excludedCount: excludedFixtureCount,
            exclusions: excludedFixtureCount
                ? [{ reason: excludedFixtureReason, count: excludedFixtureCount }]
                : [],
        },
    })),
}));

let measurementError: Error | undefined;
let afterSummary: (() => void) | undefined;
mock.module('../ai/pseudonymization', () => ({
    measureProviderInputSize: async (value: unknown) => {
        if (measurementError) throw measurementError;
        return JSON.stringify([value]).length;
    },
}));

const TEST_SHORT_SUMMARY = 'Short summary';

const aiStubs = {
    aiCall: mock(async (input: unknown): Promise<unknown> => {
        const schema = (input as { output?: { shape?: Record<string, unknown> } }).output?.shape;
        if (schema?.summary && Object.keys(schema).length === 1) {
            afterSummary?.();
            return { summary: 'Synthetic compacted verified evidence.' };
        }
        return {
            strongestArea: { title: 'A', summary: 'a' },
            weakestArea: { title: 'B', summary: 'b' },
            roomForGrowth: { title: 'C', summary: 'c' },
            generalSummary: TEST_SHORT_SUMMARY,
            suggestedPathways: [],
        };
    }),
    streamingAiCall: mock(async () => ''),
};
mock.module('../ai', () => aiStubs);
mock.module(new URL('../ai/index.ts', import.meta.url).href, () => aiStubs);

mock.module('../constants/env', () => ({
    AI_LOCAL_DEBUG_LOGGING: false,
    NODE_ENV: 'test',
    DOMAIN: 'http://localhost',
    AI_PRIVACY_KEY: Buffer.alloc(32, 7).toString('base64'),
    OPENAI_API_KEY: 'test-openai-key',
    ANTHROPIC_API_KEY: '',
    GOOGLE_AI_API_KEY: '',
    SEED: 'test-seed',
    CHAT_MODEL: 'test-chat-model',
    LEARNCARD_CONTRACT_URI: 'test-contract-uri',
    MONGO_URI: 'mongodb://localhost:27017',
    REDIS_HOST: '',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: '',
    REDIS_PREFIX: 'test',
    QDRANT_HOST: 'localhost',
    QDRANT_PORT: 6333,
    QDRANT_HTTPS: false,
    QDRANT_API_KEY: undefined,
    MONGO_DB: 'test-db',
    CORS_ORIGINS: ['*'],
    PORT: 3001,
    LEARNCARD_DID_WEB: 'did:web:test:issuer',
    FORMATTING_MODEL: 'test-formatting-model',
    PLANNING_MODEL: 'test-planning-model',
    TITLE_MODEL: 'test-title-model',
    EMBEDDING_MODEL: 'test-embedding-model',
    OPENAI_REASONING_EFFORT: 'none',
    AI_PROVIDER_QUOTA_COOLDOWN_SECONDS: 300,
    CREDENTIAL_RELEVANCE_MIN_AVERAGE_SCORE: 0.2,
    CREDENTIAL_RELEVANCE_MIN_MATCHES: 3,
    CREDENTIAL_RELEVANCE_STRONG_SCORE: 0.82,
    QDRANT_PREFIX: 'test',
    OPEN_SYLLABUS_ANALYTICS_BASE_URL: 'https://example.test',
    OPEN_SYLLABUS_API_KEY: '',
    CAREER_ONE_STOP_CONFIG: '',
}));
mock.module(new URL('../constants/env.ts', import.meta.url).href, () => ({
    AI_LOCAL_DEBUG_LOGGING: false,
    NODE_ENV: 'test',
    DOMAIN: 'http://localhost',
    AI_PRIVACY_KEY: Buffer.alloc(32, 7).toString('base64'),
    OPENAI_API_KEY: 'test-openai-key',
    ANTHROPIC_API_KEY: '',
    GOOGLE_AI_API_KEY: '',
    SEED: 'test-seed',
    CHAT_MODEL: 'test-chat-model',
    LEARNCARD_CONTRACT_URI: 'test-contract-uri',
    MONGO_URI: 'mongodb://localhost:27017',
    REDIS_HOST: '',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: '',
    REDIS_PREFIX: 'test',
    QDRANT_HOST: 'localhost',
    QDRANT_PORT: 6333,
    QDRANT_HTTPS: false,
    QDRANT_API_KEY: undefined,
    MONGO_DB: 'test-db',
    CORS_ORIGINS: ['*'],
    PORT: 3001,
    LEARNCARD_DID_WEB: 'did:web:test:issuer',
    FORMATTING_MODEL: 'test-formatting-model',
    PLANNING_MODEL: 'test-planning-model',
    TITLE_MODEL: 'test-title-model',
    EMBEDDING_MODEL: 'test-embedding-model',
    OPENAI_REASONING_EFFORT: 'none',
    AI_PROVIDER_QUOTA_COOLDOWN_SECONDS: 300,
    CREDENTIAL_RELEVANCE_MIN_AVERAGE_SCORE: 0.2,
    CREDENTIAL_RELEVANCE_MIN_MATCHES: 3,
    CREDENTIAL_RELEVANCE_STRONG_SCORE: 0.82,
    QDRANT_PREFIX: 'test',
    OPEN_SYLLABUS_ANALYTICS_BASE_URL: 'https://example.test',
    OPEN_SYLLABUS_API_KEY: '',
    CAREER_ONE_STOP_CONFIG: '',
}));

const createBoost = mock(async () => 'lc:boost:summary');
const createChildBoost = mock(async () => 'lc:boost:pathway');
const encryptedPayloads = new Map<JWE, VC>();
const createDagJwe = async (vc: VC): Promise<JWE> => {
    const encrypted: JWE = {
        ciphertext: 'test-ciphertext',
        protected: 'test-protected',
        iv: 'test-iv',
        tag: 'test-tag',
        recipients: [],
    };
    encryptedPayloads.set(encrypted, vc);
    return encrypted;
};
const writeCredentialToContract = mock(
    async (_did: string, _contract: string, _vc: JWE, boostUri: string) => `${boostUri}:credential`
);
const storeThreadSummaryCredential = mock(
    async (
        _did: string,
        _threadId: string,
        _summaryData: string,
        _credentialUri: string,
        _boostUri?: string
    ) => undefined
);

const verifyGeneratedCredential = mock(async (): Promise<unknown> => ({
    checks: ['proof'],
    errors: [],
    warnings: [],
}));

mock.module('../learncard', () => ({
    getLearnCard: mock(async () => ({
        id: { did: () => 'did:example:issuer' },
        invoke: {
            createBoost,
            createChildBoost,
            writeCredentialToContract,
            createDagJwe,
            verifyCredential: verifyGeneratedCredential,
            issueCredential: async (unsigned: UnsignedVC) => {
                issuedInput = structuredClone(unsigned);
                if (issuanceError) throw issuanceError;
                return { ...unsigned, proof: credential.proof };
            },
        },
    })),
}));

let generatedCacheReads = 0;
const summaryCache = new Map<string, Record<string, unknown>>();
mock.module('../db', () => ({
    db: {
        getCredentialSummaryByHash: async (did: string, revision: string, hash: string) =>
            summaryCache.get(`${did}:${revision}:${hash}`),
        upsertCredentialSummaryByHash: async (record: {
            did: string;
            consentRevision: string;
            hash: string;
        }) => {
            summaryCache.set(`${record.did}:${record.consentRevision}:${record.hash}`, record);
        },
        getThreads: async () => [{ id: 'thread-summary', title: 'Understanding fractions' }],
        getThreadCredentials: async () => [],
        getThreadSummaryCredentials: async () => [],
        storeThreadSummaryCredential,
        reserveExternalArtifact: async () => undefined,
        completeExternalArtifact: async () => undefined,
        storeVC: async (did: string, vc: DBCredentialRecord) => {
            if (storageError) throw storageError;
            return dbCalls.push({ did, vc });
        },
        getGeneratedCredentialByFingerprint: async (
            did: string,
            category: string,
            sourceFingerprint: string
        ) => {
            generatedCacheReads += 1;
            return (
                dbCalls.find(
                    call =>
                        call.did === did &&
                        call.vc.category === category &&
                        call.vc.sourceFingerprint === sourceFingerprint
                )?.vc ?? null
            );
        },
        close: async () => {},
    },
}));

const { default: cache } = await import('../utils/cache');
cache.redis = cache.node;
const { withOwnerOperation } = await import('./dataErasure');
const { generateAIInsightCredential: awardInsight, sendConversationSummary: publishSummary } =
    await import('./awarding');
const generateAIInsightCredential = (did: string) =>
    withOwnerOperation(did, () => awardInsight(did));
const sendConversationSummary = (...args: Parameters<typeof publishSummary>) =>
    withOwnerOperation(args[1], () => publishSummary(...args));
const { AiConsentError } = await import('../learncard/consent');

const TEST_DID = 'did:example:user1';

describe('services/awarding.generateAIInsightCredential', () => {
    beforeEach(() => {
        consent.revision = 'test-revision';
        credentialFixtures = [
            {
                id: 'vc:dummy',
                uri: 'vc:dummy',
                category: 'Dummy',
                credential,
                rawCredentialJson: JSON.stringify(credential),
                aiContext: '',
                createdAt: new Date().toISOString(),
            },
        ];
        for (const fixture of credentialFixtures) {
            fixture.verification = {
                credentialUri: fixture.uri,
                contentHash: fingerprintCredential(fixture.credential),
                status: 'valid',
                checkedAt: '2026-01-01T00:00:00.000Z',
                verifiedPayload: 'credential',
                checks: ['proof'],
                errors: [],
                warnings: [],
                verifier: { name: 'fixture', version: '1' },
                provenance: {
                    source: 'wallet',
                    retrievedAt: '2026-01-01T00:00:00.000Z',
                },
                consent: structuredClone(consent),
            };
            fixture.projection = projectCredential(
                fixture.credential,
                fixture.category,
                fixture.verification
            );
        }
        measurementError = undefined;
        afterSummary = undefined;
        consent.revision = 'test-revision';
        issuanceError = undefined;
        issuedInput = undefined;
        storageError = undefined;
        excludedFixtureCount = 0;
        excludedFixtureReason = 'unsupported_cryptosuite';
        generatedCacheReads = 0;
        summaryCache.clear();
        verifyGeneratedCredential.mockReset();
        verifyGeneratedCredential.mockResolvedValue({
            checks: ['proof'],
            errors: [],
            warnings: [],
        });
        dbCalls.length = 0;
        aiStubs.aiCall.mockClear();
    });

    it('signs the actual insight structure with pinned DIDKit and rejects changed claims', async () => {
        const { initLearnCard } = await import('@learncard/init');
        const { readFile } = await import('node:fs/promises');
        const wallet = await initLearnCard({
            seed: 'ab'.repeat(32),
            didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
        });
        const area = {
            title: 'Analysis',
            summary: 'Synthetic systems evidence',
            keywords: {
                occupations: ['Engineer'],
                careers: ['Engineering'],
                jobs: ['Engineer'],
                skills: ['Analysis'],
                fieldOfStudy: 'Engineering',
            },
        };
        aiStubs.aiCall.mockResolvedValueOnce({
            strongestArea: area,
            weakestArea: area,
            roomForGrowth: area,
            generalSummary: 'Synthetic systems evidence',
            suggestedPathways: ['urn:synthetic:pathway'],
        });
        await generateAIInsightCredential(TEST_DID);
        expect(issuedInput).toBeDefined();
        const unsigned = structuredClone(issuedInput!);
        expect(unsigned['@context']).toContain('https://ctx.learncard.com/boosts/1.0.1.json');
        // Use only a synthetic issuer/subject; all insight structure comes from the real builder.
        unsigned.issuer = wallet.id.did();
        unsigned.credentialSubject = { id: wallet.id.did() };
        const original = JSON.stringify(unsigned);
        const issued = await wallet.invoke.issueCredential(unsigned);
        expect(JSON.stringify(unsigned)).toBe(original);
        const verified = await wallet.invoke.verifyCredential(issued);
        expect(verified.errors).toEqual([]);
        expect(verified.checks).toContain('proof');
        const changed = structuredClone(issued);
        (changed as any).insights.generalSummary = 'Changed synthetic claim';
        expect((await wallet.invoke.verifyCredential(changed)).errors.length).toBeGreaterThan(0);
        const withoutBoost = structuredClone(unsigned);
        withoutBoost['@context'] = (withoutBoost['@context'] as any[]).filter(
            value => value !== 'https://ctx.learncard.com/boosts/1.0.1.json'
        );
        await expect(wallet.invoke.issueCredential(withoutBoost)).rejects.toBe(
            'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI `BoostCredential`'
        );
    }, 30_000);

    it('reports safe generation and issuance failures while preserving errors and best-effort storage', async () => {
        const { runAiInsightDiagnostics } = await import('../diagnostics/ai-insight');
        const events: unknown[] = [];
        const originalError = console.error,
            originalInfo = console.info;
        console.error = mock(event => events.push(event));
        console.info = mock(event => events.push(event));
        try {
            const privateError = new Error('private learner token and provider payload');
            aiStubs.aiCall.mockRejectedValueOnce(privateError);
            await expect(
                runAiInsightDiagnostics(() => generateAIInsightCredential(TEST_DID))
            ).rejects.toBe(privateError);
            expect(events.at(-1)).toMatchObject({
                stage: 'generation',
                failureCode: 'unknown',
            });
            expect(dbCalls).toHaveLength(0);
            issuanceError = privateError;
            await expect(
                runAiInsightDiagnostics(() => generateAIInsightCredential(TEST_DID))
            ).rejects.toBe(privateError);
            expect(events.at(-1)).toMatchObject({
                stage: 'issuance',
                failureCode: 'unknown',
            });
            expect(dbCalls).toHaveLength(0);
            issuanceError = undefined;
            storageError = privateError;
            const result = await runAiInsightDiagnostics(() =>
                generateAIInsightCredential(TEST_DID)
            );
            expect(result?.vc.type).toContain(AI_INSIGHT_CREDENTIAL_TYPE);
            expect(
                events.filter((event: any) => event.event === 'ai_insight_failed').at(-1)
            ).toMatchObject({
                stage: 'storage',
                failureCode: 'unknown',
            });
            expect(events.at(-1)).toMatchObject({
                event: 'ai_insight_completed',
                success: true,
            });
            expect(JSON.stringify(events)).not.toContain('private learner');
            expect(JSON.stringify(events)).not.toContain(TEST_DID);
        } finally {
            console.error = originalError;
            console.info = originalInfo;
        }
    });

    it('attributes generated credential verification after issuance without storing it', async () => {
        const { runAiInsightDiagnostics } = await import('../diagnostics/ai-insight');
        const { CredentialVerificationUnavailableError } =
            await import('../credentials/verification');
        const events: unknown[] = [];
        const original = console.error;
        console.error = mock(event => events.push(event));
        verifyGeneratedCredential.mockRejectedValueOnce(
            new Error('private generated credential token')
        );
        try {
            await expect(
                runAiInsightDiagnostics(() => generateAIInsightCredential(TEST_DID))
            ).rejects.toBeInstanceOf(CredentialVerificationUnavailableError);
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                stage: 'credential_verification',
                failureCode: 'credential_verification_unavailable',
                verificationOrigin: 'generated',
                verificationSubreason: 'sdk_exception',
            });
            expect(aiStubs.aiCall).toHaveBeenCalledTimes(1);
            expect(verifyGeneratedCredential).toHaveBeenCalledTimes(1);
            expect(dbCalls).toHaveLength(0);
            expect(JSON.stringify(events)).not.toContain('private');
            expect(JSON.stringify(events)).not.toContain(TEST_DID);
        } finally {
            console.error = original;
        }
    });

    it('persists an AI Insight VC with a general summary for the DID', async () => {
        const result = await generateAIInsightCredential(TEST_DID);

        expect(result).not.toBeNull();
        const { vc } = result!;

        expect(vc.type).toContain(AI_INSIGHT_CREDENTIAL_TYPE);

        const stored = dbCalls.find(
            c => c.did === TEST_DID && c.vc.category === AI_INSIGHT_CREDENTIAL_TYPE
        );
        expect(stored).toBeDefined();

        expect(stored!.vc.credential).toEqual(vc);
        expect(stored!.vc.generalSummary).toBe(TEST_SHORT_SUMMARY);
        const providerPayload = aiStubs.aiCall.mock.calls
            .map(([input]) => (input as { message: string }).message)
            .join('\n');
        expect(providerPayload).toContain('\\"schemaVersion\\":\\"1\\"');
        expect(providerPayload).not.toContain('credentialSubject');
        expect(providerPayload).not.toContain('proofValue');
        expect(providerPayload).not.toContain('did:example');
    });

    it('reuses the generated insight while wallet evidence is unchanged', async () => {
        const first = await generateAIInsightCredential(TEST_DID);
        const second = await generateAIInsightCredential(TEST_DID);

        expect(second?.vc).toEqual(first?.vc);
        expect(aiStubs.aiCall).toHaveBeenCalledTimes(1);
        expect(dbCalls).toHaveLength(1);
        expect(dbCalls[0]?.vc).toMatchObject({ source: 'generated' });
    });

    it('coalesces concurrent generation for the same wallet snapshot', async () => {
        const originalImplementation = aiStubs.aiCall.getMockImplementation();
        const { promise, resolve } = Promise.withResolvers<void>();

        aiStubs.aiCall.mockImplementationOnce(async (input: unknown) => {
            await promise;
            return originalImplementation!(input);
        });

        const first = generateAIInsightCredential(TEST_DID);
        const second = generateAIInsightCredential(TEST_DID);
        await Bun.sleep(10);
        resolve();
        await Promise.all([first, second]);

        expect(aiStubs.aiCall).toHaveBeenCalledTimes(1);
        expect(dbCalls).toHaveLength(1);
    });

    it('generates once for each distinct wallet snapshot', async () => {
        await generateAIInsightCredential(TEST_DID);
        credentialFixtures = [
            ...credentialFixtures,
            {
                ...credentialFixtures[0]!,
                id: 'vc:second',
                uri: 'vc:second',
                verification: {
                    ...credentialFixtures[0]!.verification!,
                    credentialUri: 'vc:second',
                },
            },
        ];
        await generateAIInsightCredential(TEST_DID);

        expect(aiStubs.aiCall).toHaveBeenCalledTimes(2);
        expect(dbCalls).toHaveLength(2);
        expect(dbCalls[0]?.vc.uri).not.toBe(dbCalls[1]?.vc.uri);
    });

    it('invalidates previous generation caches even when unsupported inputs are excluded', async () => {
        excludedFixtureCount = 2;
        const sourceFingerprint = createHash('sha256')
            .update(
                JSON.stringify({
                    generationVersion: '6-unicode-best-effort-privacy',
                    model: 'test-chat-model',
                })
            )
            .update('\n')
            .update(
                credentialFixtures
                    .map(fixture => ({
                        uri: fixture.uri,
                        consentRevision: fixture.verification!.consent.revision,
                        projection: fixture.projection,
                    }))
                    .sort((left, right) => left.uri.localeCompare(right.uri))
                    .map(item => JSON.stringify(item))
                    .join('\n')
            )
            .digest('hex');
        const cachedCredential = {
            ...credential,
            insights: {
                credentialsAnalyzed: 1,
                analysisDate: '2026-01-01T00:00:00Z',
            },
        };
        dbCalls.push({
            did: TEST_DID,
            vc: {
                ...credentialFixtures[0]!,
                category: AI_INSIGHT_CREDENTIAL_TYPE,
                credential: cachedCredential,
                source: 'generated',
                sourceFingerprint,
            },
        });
        const result = await generateAIInsightCredential(TEST_DID);
        expect(result?.vc).not.toEqual(cachedCredential);
        expect(result?.inputCoverage).toMatchObject({
            verifiedCount: 1,
            excludedCount: 2,
        });
        expect(aiStubs.aiCall).toHaveBeenCalledTimes(1);
        expect(verifyGeneratedCredential).toHaveBeenCalledTimes(1);
        expect(dbCalls).toHaveLength(2);
    });

    it('returns null when there are no analyzable credentials', async () => {
        credentialFixtures = [];

        const result = await generateAIInsightCredential(TEST_DID);

        expect(result).toBeNull();
        expect(dbCalls).toHaveLength(0);
    });
    it('reports partial insight coverage without excluded input context', async () => {
        excludedFixtureCount = 2;
        const result = await generateAIInsightCredential(TEST_DID);
        expect(result?.inputCoverage).toMatchObject({
            verifiedCount: 1,
            excludedCount: 2,
            exclusions: [{ reason: 'unsupported_cryptosuite', count: 2 }],
        });
        expect(aiStubs.aiCall).toHaveBeenCalledTimes(1);
        excludedFixtureCount = 3;
        const cached = await generateAIInsightCredential(TEST_DID);
        expect(cached?.inputCoverage.excludedCount).toBe(3);
        expect(aiStubs.aiCall).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(aiStubs.aiCall.mock.calls)).not.toContain(
            'EXCLUDED_PRIVATE_SENTINEL'
        );
    });

    for (const reason of ['unsupported_cryptosuite', 'verification_unavailable'] as const) {
        it(`all ${reason} sources return coverage without model, issuance or cache fallback`, async () => {
            excludedFixtureReason = reason;
            credentialFixtures = [];
            excludedFixtureCount = 3;
            const { NoEligibleInsightInputsError } =
                await import('../credentials/insight-eligibility');
            const error = await generateAIInsightCredential(TEST_DID).catch(error => error);
            expect(error).toBeInstanceOf(NoEligibleInsightInputsError);
            expect(error.coverage).toEqual({
                verifiedCount: 0,
                excludedCount: 3,
                exclusions: [{ reason, count: 3 }],
            });
            expect(aiStubs.aiCall).not.toHaveBeenCalled();
            expect(verifyGeneratedCredential).not.toHaveBeenCalled();
            expect(generatedCacheReads).toBe(0);
            expect(dbCalls).toHaveLength(0);
        });
    }
    const largeBatch = () => {
        const base = credentialFixtures[0]!;
        return Array.from({ length: 8 }, (_, index) => {
            const uri = `vc:source-${index}`;
            const original: VC = {
                ...structuredClone(base.credential),
                id: uri,
                credentialSubject: {
                    id: TEST_DID,
                    skills: Array.from(
                        { length: 100 },
                        (_, fact) =>
                            `source-${index}-skill-${fact}-` +
                            'synthetic systems engineering '.repeat(8)
                    ),
                },
            };
            const verification = {
                ...structuredClone(base.verification!),
                credentialUri: uri,
                contentHash: fingerprintCredential(original),
            };
            return {
                ...structuredClone(base),
                id: uri,
                uri,
                credential: original,
                rawCredentialJson: JSON.stringify(original),
                verification,
                projection: projectCredential(original, base.category, verification),
            };
        });
    };
    it('compacts every eligible source, preserves signed data and reports cold/warm coverage', async () => {
        credentialFixtures = largeBatch();
        const originals = structuredClone(credentialFixtures);
        const result = await generateAIInsightCredential(TEST_DID);
        const coverage = result!.inputCoverage.promptCoverage!;
        expect(coverage).toEqual({
            includedCount: 8,
            omittedCount: 0,
            reason: null,
        });
        expect(result!.inputCoverage.verifiedCount).toBe(8);
        expect(result!.vc.insights.credentialsAnalyzed).toBe(8);
        expect(result!.inputCoverage.compactionCoverage).toMatchObject({
            strategy: 'cohort_compaction',
            representedCredentialCount: 8,
            representativeCount: 8,
            generationCacheHit: false,
        });
        const calls = aiStubs.aiCall.mock.calls.map(
            ([input]) =>
                input as {
                    message: string;
                    output: { shape: Record<string, unknown> };
                }
        );
        const final = calls.find(input => input.output.shape.strongestArea)!;
        expect(JSON.stringify([final.message]).length).toBeLessThanOrEqual(80000);
        expect(final.message).toContain('No eligible source is omitted');
        for (let index = 0; index < 8; index += 1)
            expect(JSON.stringify(calls)).toContain(`source-${index}-skill`);
        expect(credentialFixtures).toEqual(originals);
        const coldCalls = aiStubs.aiCall.mock.calls.length;
        const cached = await generateAIInsightCredential(TEST_DID);
        expect(cached!.vc).toEqual(result!.vc);
        expect(cached!.inputCoverage.promptCoverage).toEqual(coverage);
        expect(cached!.inputCoverage.compactionCoverage).toMatchObject({
            generationCacheHit: true,
            summaryModelCalls: 0,
        });
        expect(aiStubs.aiCall).toHaveBeenCalledTimes(coldCalls);
        // Removing only generated output reuses scoped summaries, with one final synthesis.
        dbCalls.length = 0;
        const summarized = await generateAIInsightCredential(TEST_DID);
        expect(summarized!.inputCoverage.compactionCoverage!.summaryModelCalls).toBe(0);
        expect(summarized!.inputCoverage.compactionCoverage!.summaryCacheHits).toBeGreaterThan(0);
        expect(aiStubs.aiCall).toHaveBeenCalledTimes(coldCalls + 1);
        credentialFixtures[7]!.projection = {
            ...credentialFixtures[7]!.projection!,
            facts: [{ kind: 'skill', value: 'new evidence' }],
        };
        const changed = await generateAIInsightCredential(TEST_DID);
        expect(changed!.inputCoverage.compactionCoverage!.summaryModelCalls).toBeGreaterThan(0);
        expect(changed!.inputCoverage.compactionCoverage!.generationCacheHit).toBe(false);
    });
    it('versions full-evidence cache even when every verified projection fits', async () => {
        const original = credentialFixtures[0]!;
        const expected = createHash('sha256')
            .update(
                JSON.stringify({
                    generationVersion: '7-small-cohorts',
                    model: 'test-chat-model',
                    locale: 'en',
                })
            )
            .update('\n')
            .update(
                JSON.stringify({
                    uri: original.uri,
                    consentRevision: original.verification!.consent.revision,
                    projection: original.projection,
                })
            )
            .digest('hex');
        const result = await generateAIInsightCredential(TEST_DID);
        expect(dbCalls[0]!.vc.sourceFingerprint).toBe(expected);
        expect(result!.inputCoverage.promptCoverage).toEqual({
            includedCount: 1,
            omittedCount: 0,
            reason: null,
        });
    });
    it('splits oversized projections at whole facts without omitting their source', async () => {
        const base = credentialFixtures[0]!;
        base.projection = {
            schemaVersion: '1',
            category: 'Dummy',
            credentialTypes: ['Dummy'],
            facts: Array.from({ length: 100 }, (_, index) => ({
                kind: 'skill' as const,
                value: `${index} ` + '"\\'.repeat(115),
                label: '"\\'.repeat(60),
            })),
        };
        const original = structuredClone(base);
        const result = await generateAIInsightCredential(TEST_DID);
        expect(result!.inputCoverage.compactionCoverage).toMatchObject({
            representedCredentialCount: 1,
            splitProjectionCount: 1,
        });
        expect(result!.inputCoverage.promptCoverage).toEqual({
            includedCount: 1,
            omittedCount: 0,
            reason: null,
        });
        expect(base).toEqual(original);
        expect(verifyGeneratedCredential).toHaveBeenCalledTimes(1);
    });
    it('grant revision changes during compaction prevent final inference, issuance and summary cache writes', async () => {
        credentialFixtures = largeBatch();
        afterSummary = () => {
            consent.revision = 'changed-revision';
        };
        await expect(generateAIInsightCredential(TEST_DID)).rejects.toBeInstanceOf(AiConsentError);
        expect(summaryCache.size).toBe(0);
        expect(dbCalls).toHaveLength(0);
        expect(verifyGeneratedCredential).not.toHaveBeenCalled();
        expect(
            aiStubs.aiCall.mock.calls.every(
                ([input]) =>
                    !(input as { output: { shape: Record<string, unknown> } }).output.shape
                        .strongestArea
            )
        ).toBe(true);
    });
    it('warm generated cache cannot cross a changed live grant', async () => {
        await generateAIInsightCredential(TEST_DID);
        consent.revision = 'changed-revision';
        await expect(generateAIInsightCredential(TEST_DID)).rejects.toBeInstanceOf(AiConsentError);
        expect(aiStubs.aiCall).toHaveBeenCalledTimes(1);
    });
    it('oversized final synthesis fails before credential issuance', async () => {
        aiStubs.aiCall.mockResolvedValueOnce({
            generalSummary: 'synthetic '.repeat(12000),
        });
        await expect(generateAIInsightCredential(TEST_DID)).rejects.toMatchObject({
            name: 'InsightCompactionError',
            reason: 'invalid_summary',
        });
        expect(verifyGeneratedCredential).not.toHaveBeenCalled();
        expect(dbCalls).toHaveLength(0);
    });
    it('Unicode verified sources remain eligible without script-specific omission or mutation', async () => {
        credentialFixtures[0]!.projection!.facts = [
            { kind: 'skill', value: 'English π radians Δ Иван 👩🏽‍💻' },
        ];
        const before = structuredClone(credentialFixtures);
        const result = await generateAIInsightCredential(TEST_DID);
        expect(JSON.stringify(aiStubs.aiCall.mock.calls)).toContain('π radians Δ Иван');
        expect(result?.inputCoverage.verifiedCount).toBe(1);
        expect(result?.inputCoverage.promptCoverage?.includedCount).toBe(1);
        expect(result?.inputCoverage).not.toHaveProperty('sourceCoverage');
        expect(credentialFixtures).toEqual(before);
        const calls = aiStubs.aiCall.mock.calls.length;
        const warm = await generateAIInsightCredential(TEST_DID);
        expect(warm?.inputCoverage.compactionCoverage?.generationCacheHit).toBe(true);
        expect(aiStubs.aiCall.mock.calls.length).toBe(calls);
    });
    it('unsupported request locale stops before generated-cache reuse or provider calls', async () => {
        await generateAIInsightCredential(TEST_DID);
        const calls = aiStubs.aiCall.mock.calls.length;
        const reads = generatedCacheReads;
        await expect(
            runWithLocale('ru-RU', () => generateAIInsightCredential(TEST_DID))
        ).rejects.toMatchObject({
            name: 'UnsupportedPrivacyLanguageError',
            languageReason: 'locale',
        });
        expect(generatedCacheReads).toBe(reads);
        expect(aiStubs.aiCall.mock.calls.length).toBe(calls);
        expect(dbCalls).toHaveLength(1);
    });
    it('privacy sizing failure preserves request-wide consent rejection with no fallback', async () => {
        const primary = new AiConsentError();
        measurementError = primary;
        await expect(generateAIInsightCredential(TEST_DID)).rejects.toBe(primary);
        expect(aiStubs.aiCall).not.toHaveBeenCalled();
        expect(generatedCacheReads).toBe(2);
        expect(dbCalls).toHaveLength(0);
    });
});

describe('services/awarding.sendConversationSummary', () => {
    const messages: ChatMessage[] = [
        {
            role: 'user',
            content: 'I can now add fractions using a common denominator.',
        },
    ];
    const send = mock((_message: string) => 0);
    const summary: SummaryCredentialData = {
        title: 'Adding fractions',
        summary: 'The learner explained how a common denominator allows fractions to be added.',
        learned: ['Find a common denominator before adding fractions.'],
        skills: [
            {
                title: 'Fraction addition',
                description: 'Adds fractions with different denominators.',
            },
        ],
        nextSteps: [
            {
                title: 'Compare fractions',
                description: 'Use common denominators to compare two fractions.',
                keywords: {
                    occupations: [],
                    careers: [],
                    jobs: [],
                    skills: ['Comparing fractions'],
                    fieldOfStudy: 'Mathematics',
                },
            },
        ],
        reflections: [],
    };

    beforeEach(() => {
        send.mockClear();
        createBoost.mockClear();
        createChildBoost.mockClear();
        writeCredentialToContract.mockClear();
        storeThreadSummaryCredential.mockClear();
        aiStubs.aiCall.mockClear();
        encryptedPayloads.clear();
    });

    it.each([
        ['revoked consent', new AiConsentError('Consent changed during this operation')],
        ['privacy data erasure', new Error('Privacy data erasure in progress')],
        ['cancellation', new DOMException('Operation cancelled', 'AbortError')],
    ])('does not publish or save a summary after %s', async (_reason, error) => {
        aiStubs.aiCall.mockRejectedValueOnce(error);

        await expect(
            sendConversationSummary({ send }, TEST_DID, messages, 'thread-summary')
        ).rejects.toBe(error);

        expect(createBoost).not.toHaveBeenCalled();
        expect(createChildBoost).not.toHaveBeenCalled();
        expect(writeCredentialToContract).not.toHaveBeenCalled();
        expect(storeThreadSummaryCredential).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
    });

    it('publishes and saves the generated summary and its learning pathway', async () => {
        aiStubs.aiCall.mockResolvedValueOnce(structuredClone(summary));

        await sendConversationSummary({ send }, TEST_DID, messages, 'thread-summary');

        const expectedSummary = { ...summary, title: 'Understanding fractions' };
        const publishedCredentials = writeCredentialToContract.mock.calls.map(([, , payload]) =>
            encryptedPayloads.get(payload)
        );
        expect(publishedCredentials).toHaveLength(2);
        expect(publishedCredentials[0]).toMatchObject({
            type: expect.arrayContaining(['SummaryCredential']),
            credentialSubject: { id: TEST_DID },
            summaryInfo: expectedSummary,
            boostId: 'lc:boost:summary',
            proof: credential.proof,
        });
        expect(publishedCredentials[1]).toMatchObject({
            type: expect.arrayContaining(['LearningPathwayCredential']),
            learningPathway: {
                stepIndex: 0,
                step: {
                    ...summary.nextSteps[0],
                    summary: summary.summary,
                    learned: summary.learned,
                    skills: summary.skills,
                },
            },
        });
        expect(storeThreadSummaryCredential).toHaveBeenCalledWith(
            TEST_DID,
            'thread-summary',
            JSON.stringify(expectedSummary),
            'lc:boost:summary:credential',
            'lc:boost:summary'
        );
        expect(send.mock.calls.map(([message]) => JSON.parse(message))).toEqual([
            {
                event: 'conversation_summary',
                summary: expectedSummary,
                credentialUri: 'lc:boost:summary:credential',
                threadId: 'thread-summary',
            },
            {
                event: 'learning_pathways_created',
                pathwayUris: ['lc:boost:pathway:credential'],
                threadId: 'thread-summary',
            },
        ]);
    });
});
