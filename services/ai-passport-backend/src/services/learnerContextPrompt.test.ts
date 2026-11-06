import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ModelSafeCredentialProjection } from '@learncard/types';
import type { ActiveAiConsentReceipt } from '../learncard/consent';

process.env.MONGO_URI ||= 'mongodb://localhost:27017/test';
process.env.OPENAI_API_KEY ||= 'test-openai-key';
process.env.SEED ||= 'test-seed';
process.env.REDIS_HOST ||= 'localhost';
process.env.REDIS_PORT ||= '6379';
process.env.AI_PRIVACY_KEY ||= Buffer.alloc(32, 9).toString('base64');

const OWNER = 'did:example:learner';
const URI = 'lc:network:credential-1';
const receipt: ActiveAiConsentReceipt = {
    contractUri: 'lc:network:ai-contract',
    receiptId: 'receipt-1',
    status: 'live',
    updatedAt: '2026-09-01T00:00:00.000Z',
    contractUpdatedAt: '2026-09-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: [URI],
    personalFields: ['name'],
    purpose: 'model-inference',
    revision: 'revision-1',
    guardian: { required: true, approved: true },
};
const source: ModelSafeCredentialProjection = {
    schemaVersion: '1',
    category: 'Achievement',
    credentialTypes: ['AchievementCredential'],
    facts: [{ kind: 'achievement', value: 'TypeScript Foundations' }],
};
let currentReceipt = receipt;
let revoked = false;
let personalName = 'Taylor';
let duringInference: (() => void) | undefined;
let duringCacheRead: (() => void) | undefined;
let duringPseudonymization: (() => void) | undefined;
const projections = new Map<string, ModelSafeCredentialProjection>();
type CachedPrompt = {
    did: string;
    consentRevision: string;
    hash: string;
    prompt: string;
    metadata: Record<string, unknown>;
    model: string;
    version: string;
};
const promptCache = new Map<string, CachedPrompt>();
const summaryCache = new Map<string, { summary: string; version: string }>();
const providerInputs: string[] = [];
const aiStubs = {
    aiCall: mock(async (input: { message: unknown }) => {
        providerInputs.push(JSON.stringify(input));
        duringInference?.();
        return {
            prompt: `Taylor: ${JSON.stringify(input.message)}`,
            summary: `Evidence: ${JSON.stringify(input.message)}`,
        };
    }),
};
// Load the real error class before replacing consent I/O. Production modules
// below load only after Bun's module mocks have been registered.
const { AiConsentError } = await import('../learncard/consent');
mock.module('../learncard/consent', () => ({
    AiConsentError,
    loadActiveAiConsentData: async () => {
        if (revoked || !currentReceipt.guardian.approved) throw new AiConsentError();
        return {
            records: [{ personal: { name: personalName } }],
            receipt: structuredClone(currentReceipt),
        };
    },
}));
mock.module('../learncard', () => ({ getLearnCard: async () => ({}) }));
mock.module('../credentials/service', () => ({
    resolveVerifiedCredentialProjection: async (_did: string, uri: string) => {
        const projection = projections.get(uri);
        if (!projection) throw new Error('private source dependency detail');
        return projection;
    },
}));
mock.module('../ai', () => aiStubs);
mock.module(new URL('../ai/index.ts', import.meta.url).href, () => aiStubs);
mock.module('../ai/pseudonymization', () => ({
    pseudonymizeProviderInput: async (text: string) => {
        duringPseudonymization?.();
        return text.replaceAll('Taylor', '{{NAME_scoped}}');
    },
}));
mock.module('../db', () => ({
    db: {
        getLearnerContextPromptByHash: async (did: string, revision: string, hash: string) => {
            const result = promptCache.get(`${did}:${revision}:${hash}`) ?? null;
            duringCacheRead?.();
            return result;
        },
        upsertLearnerContextPromptByHash: async (input: CachedPrompt) => {
            promptCache.set(`${input.did}:${input.consentRevision}:${input.hash}`, input);
        },
        getCredentialSummaryByHash: async (did: string, revision: string, hash: string) =>
            summaryCache.get(`${did}:${revision}:${hash}`),
        upsertCredentialSummaryByHash: async (input: {
            did: string;
            consentRevision: string;
            hash: string;
            summary: string;
            version: string;
        }) => {
            summaryCache.set(`${input.did}:${input.consentRevision}:${input.hash}`, input);
        },
    },
}));

const { generateLearnerContextPrompt, parseLearnerContextPromptRequest } =
    await import('./learnerContextPrompt');
const { getLatestUserSummary } = await import('../mcp-server/controllers/get-user-context');
const { runWithLocale } = await import('../ai/locale');
const { runWithAiPrivacyContext } = await import('../ai/privacy');
const request = (overrides: Record<string, unknown> = {}) =>
    parseLearnerContextPromptRequest({
        credentialUris: [URI],
        personalFields: ['name'],
        ...overrides,
    });
const format = (overrides: Record<string, unknown> = {}, did = OWNER) =>
    runWithAiPrivacyContext(did, () => generateLearnerContextPrompt(request(overrides)));

beforeEach(() => {
    promptCache.clear();
    summaryCache.clear();
    projections.clear();
    projections.set(URI, structuredClone(source));
    providerInputs.length = 0;
    aiStubs.aiCall.mockClear();
    currentReceipt = structuredClone(receipt);
    revoked = false;
    personalName = 'Taylor';
    duringInference = undefined;
    duringCacheRead = undefined;
    duringPseudonymization = undefined;
});

describe('selection-only learner context', () => {
    it('rejects raw credential/personal payloads and caller identity', () => {
        for (const input of [
            { credentials: [source] },
            { personalData: { name: 'forged' } },
            { did: OWNER },
        ]) {
            expect(() => parseLearnerContextPromptRequest(input)).toThrow();
        }
        expect(() => request({ credentialUris: Array(501).fill(URI) })).toThrow();
        expect(() => request({ personalFields: Array(101).fill('name') })).toThrow();
        expect(() => request({ instructions: 'x'.repeat(8_001) })).toThrow();
    });

    it('requires authentication and rejects every unauthorized selection, including beyond the requested synthesis limit', async () => {
        await expect(generateLearnerContextPrompt(request())).rejects.toMatchObject({
            status: 401,
        });
        await expect(format({ personalFields: ['name', 'privateAddress'] })).rejects.toBeInstanceOf(
            AiConsentError
        );
        await expect(
            format({
                credentialUris: [URI, 'lc:network:foreign'],
                maxCredentials: 1,
            })
        ).rejects.toBeInstanceOf(AiConsentError);
        expect(providerInputs).toEqual([]);
    });

    it('reuses current evidence without sending raw credential material', async () => {
        const first = await format();
        const second = await format();
        expect(second.prompt).toBe(first.prompt);
        expect(second.metadata.promptCacheHit).toBe(true);
        expect(second.metadata.consentRevision).toBe(receipt.revision);
        expect(providerInputs).toHaveLength(1);
        expect(first.prompt).toContain('TypeScript Foundations');
        for (const forbidden of ['credentialSubject', 'proofValue', 'did:example', 'lc:network:'])
            expect(providerInputs.join()).not.toContain(forbidden);
    });

    it('isolates owners, locale, source changes, instructions and detail level', async () => {
        const initial = await format();
        const other = await format({}, 'did:example:other');
        expect(other.metadata.promptCacheHash).not.toBe(initial.metadata.promptCacheHash);
        await runWithLocale('es', () => format());
        await runWithLocale('fr', () => format());
        await format({ instructions: 'Focus on collaboration.' });
        await format({ detailLevel: 'expanded' });
        projections.set(URI, {
            ...source,
            facts: [{ kind: 'achievement', value: 'Advanced Algebra' }],
        });
        const changed = await format();
        expect(changed.prompt).toContain('Advanced Algebra');
        expect(changed.prompt).not.toContain('TypeScript Foundations');
        expect(providerInputs).toHaveLength(7);
    });

    it('does not release cached output after revocation or a guardian policy change', async () => {
        await format();
        revoked = true;
        await expect(format()).rejects.toBeInstanceOf(AiConsentError);
        revoked = false;
        duringCacheRead = () => {
            currentReceipt = { ...currentReceipt, revision: 'guardian-changed' };
        };
        await expect(format()).rejects.toBeInstanceOf(AiConsentError);
        expect(providerInputs).toHaveLength(1);
    });

    it('rejects generation if consent changes during inference', async () => {
        duringInference = () => {
            currentReceipt.guardian.approved = false;
        };
        await expect(format()).rejects.toBeInstanceOf(AiConsentError);
        expect(promptCache.size).toBe(0);
    });

    it('does not replace unavailable authoritative sources with an empty success', async () => {
        projections.clear();
        await expect(format()).rejects.toMatchObject({
            status: 503,
            message: 'Learner context service is unavailable',
        });
        expect(providerInputs).toEqual([]);
    });

    it('preserves session facts and deduplicates identical evidence in compaction', async () => {
        const uris = Array.from({ length: 21 }, (_, index) => `lc:network:session-${index}`);
        const session = {
            ...source,
            credentialTypes: ['SummaryCredential'],
            facts: [
                {
                    kind: 'summary' as const,
                    value: 'Practiced algebra with guided scaffolding; ready for equations.',
                },
            ],
        };
        currentReceipt.credentialUris = uris;
        for (const uri of uris) projections.set(uri, session);
        const result = await format({
            credentialUris: uris,
            includeStructuredContext: true,
        });
        expect(result.prompt).toContain('ready for equations');
        expect(result.metadata).toMatchObject({
            compactionApplied: true,
            duplicateCredentialCount: 20,
            specializedAiSessionCount: 1,
            deterministicSummaryCount: 1,
        });
        expect(result.structuredContext?.credentials).toEqual([session]);
        expect(providerInputs).toHaveLength(1);
    });
});

describe('MCP current user context', () => {
    it('returns useful pseudonymized evidence rather than legacy insight or raw credentials', async () => {
        const context = await runWithAiPrivacyContext(OWNER, () => getLatestUserSummary(OWNER));
        expect(context).toContain('TypeScript Foundations');
        expect(context).toContain('{{NAME_scoped}}');
        expect(context).not.toContain('Taylor');
        expect(context).not.toContain('credentialSubject');
    });

    it('rejects identity mismatch and revocation during external-output pseudonymization', async () => {
        await expect(
            runWithAiPrivacyContext(OWNER, () => getLatestUserSummary('did:example:foreign'))
        ).rejects.toMatchObject({ status: 401 });
        duringPseudonymization = () => {
            revoked = true;
        };
        await expect(
            runWithAiPrivacyContext(OWNER, () => getLatestUserSummary(OWNER))
        ).rejects.toBeInstanceOf(AiConsentError);
    });
});
