import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ModelSafeCredentialProjection } from '@learncard/types';
import type { ActiveAiConsentReceipt } from '../learncard/consent';
import type { TopicSearchResult } from './credentialSearch';

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
const answerInputs: string[] = [];
let searchResults: TopicSearchResult[] = [];
let duringSearch: (() => void) | undefined;
let projectionFailure: unknown;
const searchCredentialsByTopic = mock(async () => {
    duringSearch?.();
    return searchResults;
});
mock.module('./credentialSearch', () => ({ searchCredentialsByTopic }));
mock.module('../services/dataErasure', () => ({ assertOwnerOperationActive: async () => {} }));
mock.module('../ai/client', () => ({
    streamingAiCall: mock(async (input: { message: string }) => {
        answerInputs.push(input.message);
        duringInference?.();
        return 'Evidence-based answer';
    }),
}));
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
const { CredentialVerificationUnavailableError } = await import('../credentials/verification');
mock.module('../learncard/consent', () => ({
    AiConsentError,
    loadActiveAiConsentData: async (_learnCard: unknown, did: string) => {
        if (revoked || !currentReceipt.guardian.approved) throw new AiConsentError();
        if (!bindAiConsentRevision(did, currentReceipt.revision)) throw new AiConsentError();
        const cloned = structuredClone(currentReceipt);
        return {
            records: [{ personal: { name: personalName } }],
            receipt: { ...cloned, credentialUris: currentReceipt.credentialUris },
        };
    },
}));
mock.module('../learncard', () => ({ getLearnCard: async () => ({}) }));
mock.module('../credentials/service', () => ({
    assertCredentialScope: () => undefined,
    // Every shared URI is located; the projection mock ignores the location.
    consentCredentialLocations: () => ({ get: (uri: string) => ({ uri }) }),
    resolveVerifiedCredentialProjection: async (_did: string, uri: string) => {
        if (projectionFailure) throw projectionFailure;
        const projection = projections.get(uri);
        if (!projection) throw new CredentialVerificationUnavailableError('read_empty');
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
const { runWithAiPrivacyContext, bindAiConsentRevision } = await import('../ai/privacy');
const { getAnswerAboutUser } = await import('../mcp-server/controllers/get-answer-about-user');
const request = (overrides: Record<string, unknown> = {}) =>
    parseLearnerContextPromptRequest({
        credentialUris: [URI],
        personalFields: ['name'],
        ...overrides,
    });
const format = (overrides: Record<string, unknown> = {}, did = OWNER) =>
    runWithAiPrivacyContext(did, () => generateLearnerContextPrompt(request(overrides)));

beforeEach(() => {
    answerInputs.length = 0;
    searchResults = [];
    duringSearch = undefined;
    searchCredentialsByTopic.mockClear();
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
    projectionFailure = undefined;
});

describe('selection-only learner context', () => {
    it('accepts trusted request input and applies parser defaults', async () => {
        const result = await runWithAiPrivacyContext(OWNER, () =>
            generateLearnerContextPrompt({ credentialUris: [URI], personalFields: ['name'] })
        );
        expect(providerInputs).toHaveLength(1);
        expect(providerInputs[0]).toContain('Requested detail level: compact');
        expect(result.structuredContext).toBeUndefined();
        expect(result.prompt).toContain('TypeScript Foundations');
    });

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

describe('MCP answer/context consistency', () => {
    const arithmetic: TopicSearchResult = {
        uri: URI,
        title: 'Arithmetic practice',
        type: 'Achievement',
        context: 'Practiced arithmetic',
        score: 0.9,
        strongestScore: 0.9,
        averageScore: 0.9,
        matchCount: 5,
    };
    const addBackgroundEvidence = () => {
        const background = [
            {
                uri: 'lc:network:design',
                type: 'AchievementCredential',
                value: 'Product design background',
            },
            {
                uri: 'lc:network:ai-summary',
                type: 'AISummaryCredential',
                value: 'AI Summary: experienced in visual design',
            },
        ];
        currentReceipt = {
            ...receipt,
            credentialUris: [URI, ...background.map(({ uri }) => uri)],
        };
        for (const { uri, type, value } of background) {
            projections.set(uri, {
                ...source,
                credentialTypes: [type],
                facts: [{ kind: 'achievement', value }],
            });
        }
    };
    const answer = () =>
        runWithAiPrivacyContext(OWNER, () =>
            getAnswerAboutUser(OWNER, 'What is my design background?')
        );

    it('includes the same design and AI Summary evidence when retrieval only finds arithmetic', async () => {
        addBackgroundEvidence();
        searchResults = [arithmetic];
        const context = await runWithAiPrivacyContext(OWNER, () => getLatestUserSummary(OWNER));
        expect(context).toContain('Product design background');
        expect(context).toContain('AI Summary: experienced in visual design');

        await answer();

        expect(answerInputs).toHaveLength(1);
        expect(answerInputs[0]).toContain(context);
        expect(answerInputs[0]).not.toContain('Taylor');
        expect(answerInputs[0]).toContain('Practiced arithmetic');
    });

    it('does not treat an empty vector result as an empty consented credential set', async () => {
        addBackgroundEvidence();
        await answer();
        expect(answerInputs).toHaveLength(1);
        expect(answerInputs[0]).toContain('Product design background');
        expect(answerInputs[0]).toContain('AI Summary: experienced in visual design');
    });

    it('keeps background evidence even when all five retrieval slots are filled', async () => {
        addBackgroundEvidence();
        searchResults = Array.from({ length: 5 }, (_, i) => ({
            ...arithmetic,
            uri: `lc:math:${i}`,
        }));
        for (const { uri } of searchResults) projections.set(uri, source);
        currentReceipt = {
            ...currentReceipt,
            credentialUris: [
                ...currentReceipt.credentialUris,
                ...searchResults.map(({ uri }) => uri),
            ],
        };
        await answer();
        expect(answerInputs[0]).toContain('Product design background');
    });

    it('returns insufficient information without inference when nothing is consented', async () => {
        currentReceipt = { ...receipt, credentialUris: [], personalFields: [] };
        const result = await answer();
        expect(result).toContain("don't have enough information");
        expect(answerInputs).toHaveLength(0);
        expect(providerInputs).toHaveLength(0);
        expect(searchCredentialsByTopic).not.toHaveBeenCalled();
    });

    it('rejects a foreign subject before gathering any evidence', async () => {
        await expect(
            runWithAiPrivacyContext(OWNER, () =>
                getAnswerAboutUser('did:example:foreign', 'What is my background?')
            )
        ).rejects.toBeInstanceOf(AiConsentError);
        expect(answerInputs).toHaveLength(0);
        expect(searchCredentialsByTopic).not.toHaveBeenCalled();
    });

    it('fails closed when consent changes while the shared context is synthesized', async () => {
        addBackgroundEvidence();
        searchResults = [arithmetic];
        duringInference = () => {
            currentReceipt = { ...currentReceipt, revision: 'changed' };
        };
        await expect(answer()).rejects.toBeInstanceOf(AiConsentError);
        expect(answerInputs).toHaveLength(0);
    });

    it('rechecks consent after retrieval before sending the assembled evidence', async () => {
        addBackgroundEvidence();
        duringSearch = () => {
            currentReceipt = { ...currentReceipt, revision: 'changed' };
        };
        await expect(answer()).rejects.toBeInstanceOf(AiConsentError);
        expect(answerInputs).toHaveLength(0);
    });

    it('does not release an answer if consent changes during answer inference', async () => {
        addBackgroundEvidence();
        duringInference = () => {
            if (answerInputs.length) currentReceipt = { ...currentReceipt, revision: 'changed' };
        };
        await expect(answer()).rejects.toBeInstanceOf(AiConsentError);
        expect(answerInputs).toHaveLength(1);
    });

    it('skips one unavailable shared-context credential and still returns the rest', async () => {
        addBackgroundEvidence();
        projections.delete('lc:network:design');
        searchResults = [arithmetic];
        const context = await runWithAiPrivacyContext(OWNER, () => getLatestUserSummary(OWNER));
        expect(context).toContain('AI Summary: experienced in visual design');
        expect(context).toContain('TypeScript Foundations');
        expect(context).not.toContain('Product design background');
        await answer();
        expect(answerInputs).toHaveLength(1);
        expect(answerInputs[0]).toContain('AI Summary: experienced in visual design');
        expect(answerInputs[0]).not.toContain('Product design background');
    });

    it('fails shared context when every consented credential is unavailable', async () => {
        currentReceipt = {
            ...receipt,
            credentialUris: ['lc:network:bad-1', 'lc:network:bad-2'],
        };
        projections.clear();
        await expect(
            runWithAiPrivacyContext(OWNER, () => getLatestUserSummary(OWNER))
        ).rejects.toMatchObject({ code: 'learner_context_unavailable' });
        expect(answerInputs).toHaveLength(0);
    });

    it('fails shared context on an unmarked projection Error instead of skipping it', async () => {
        addBackgroundEvidence();
        projectionFailure = new Error('consent snapshot reuse failed');
        await expect(
            runWithAiPrivacyContext(OWNER, () => getLatestUserSummary(OWNER))
        ).rejects.toMatchObject({ code: 'learner_context_unavailable' });
        expect(answerInputs).toHaveLength(0);
    });

    it('keeps the 501st consented credential through shared context before search and answer', async () => {
        const uris = Array.from({ length: 501 }, (_, i) => `lc:network:hist-${i}`);
        const marker = 'Deep history design studio';
        currentReceipt = { ...receipt, credentialUris: uris };
        for (let i = 0; i < 500; i++) projections.set(uris[i]!, source);
        projections.set(uris[500]!, {
            ...source,
            facts: [{ kind: 'achievement', value: marker }],
        });
        searchResults = [arithmetic];
        await answer();
        expect(answerInputs).toHaveLength(1);
        expect(answerInputs[0]).toContain(marker);
        expect(searchCredentialsByTopic).toHaveBeenCalled();
    });
});
