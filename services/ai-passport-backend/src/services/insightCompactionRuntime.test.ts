import { assertPrivacyLocale } from '../ai/privacy-language';
import { withPrivacyOperation } from '../ai/privacy-diagnostics';
import { beforeEach, expect, mock, test } from 'bun:test';
import type { ModelSafeCredentialProjection } from '@learncard/types';
import { prepareInsightEvidence } from './insightCompaction';

let revision = 'revision-a';
let locale = 'en';
let ownerActive = true;
let filterFailure: Error | undefined;
let afterProvider: (() => void) | undefined;
let providerCalls = 0;
let providerSummary = 'Synthetic bounded cohort summary.';
let restoredSummary: string | undefined;
let filters = 0;
let restores = 0;
let writes = 0;
const filteredInputs = new Set<string>();
const cache = new Map<
    string,
    {
        did: string;
        consentRevision: string;
        hash: string;
        summary: string;
        model: string;
        version: string;
    }
>();
const ownerFailure = new Error('synthetic owner operation canceled');
class ConsentFailure extends Error {}
const controller = new AbortController();

mock.module('../constants/env', () => ({
    CHAT_MODEL: 'gpt-6.1-sol',
    OPENAI_API_KEY: 'synthetic',
    EMBEDDING_MODEL: 'synthetic',
}));
mock.module('../ai/locale', () => ({
    getCurrentLocale: () => locale,
    normalizeAiLocale: (value: string) => value,
    appendLocaleInstruction: (value: string) => ` Locale ${value}.`,
}));
mock.module('../ai/privacy', () => ({
    getCurrentAiSubject: () => 'did:example:owner-a',
    getCurrentAiPersonalFields: () => ({ name: 'PRIVATE_NAME' }),
    getCurrentAiCredentialUris: () => [],
    assertCurrentAiConsent: async () => ({ revision }),
}));
mock.module('../learncard/consent', () => ({ AiConsentError: ConsentFailure }));
mock.module('./dataErasure', () => ({
    assertOwnerOperationActive: async () => {
        if (!ownerActive) throw ownerFailure;
    },
    getCurrentOwnerOperation: () => ({ signal: controller.signal }),
}));
mock.module('../ai/privacy-keys', () => ({
    getPrivacyKeyMaterial: () => ({ reference: Buffer.alloc(32, 1) }),
}));
mock.module('../db', () => ({
    db: {
        getCredentialSummaryByHash: async (did: string, consentRevision: string, hash: string) =>
            cache.get(`${did}:${consentRevision}:${hash}`),
        upsertCredentialSummaryByHash: async (record: {
            did: string;
            consentRevision: string;
            hash: string;
            summary: string;
            model: string;
            version: string;
        }) => {
            if (!ownerActive) throw ownerFailure;
            writes += 1;
            cache.set(`${record.did}:${record.consentRevision}:${record.hash}`, record);
        },
    },
}));
mock.module('../ai/pseudonymization', () => ({
    measureProviderInputSize: async (value: string) => JSON.stringify([value]).length,
    pseudonymizeProviderInput: async (value: string) => {
        // Emulate the local + managed boundary, asserting the real client invokes it for each input.
        if (filterFailure) throw filterFailure;
        await withPrivacyOperation('language', () => assertPrivacyLocale(locale));
        const transformed = value.replaceAll('PRIVATE_NAME', '{{NAME_safe}}');
        filters += 1;
        filteredInputs.add(transformed);
        return transformed;
    },
    restoreProviderOutput: async (value: unknown) => {
        restores += 1;
        return restoredSummary === undefined ? value : { summary: restoredSummary };
    },
}));
mock.module('../ai/audit', () => ({
    withAiAudit: async (_metadata: unknown, callback: () => Promise<unknown>) => callback(),
}));
mock.module('../ai/provider-circuit', () => ({
    withAiProviderCircuit: async (_provider: string, callback: () => Promise<unknown>) =>
        callback(),
}));
class SyntheticProvider {
    async call(input: {
        message: string;
        systemPrompt: string;
        timeoutMs: number;
        signal: AbortSignal;
    }) {
        expect(filteredInputs.has(input.message)).toBe(true);
        expect(filteredInputs.has(input.systemPrompt)).toBe(true);
        expect(input.message).not.toContain('PRIVATE_NAME');
        expect(input.timeoutMs).toBe(60_000);
        expect(input.signal).toBe(controller.signal);
        providerCalls += 1;
        afterProvider?.();
        return { summary: providerSummary };
    }
}
mock.module('openai', () => ({ default: class {} }));
mock.module('../ai/bedrock-responses', () => ({
    BedrockResponsesProvider: SyntheticProvider,
    getReasoningConfig: () => undefined,
    parseOpenAIModelAlias: (model: string) => ({ apiModel: model }),
}));
mock.module('../ai/anthropic', () => ({
    AnthropicProvider: SyntheticProvider,
}));
mock.module('../ai/google', () => ({ GoogleProvider: SyntheticProvider }));
const { aiCall } = await import('../ai/client');
mock.module('../ai', () => ({ aiCall }));
const { compactInsightEvidence } = await import('./insightCompactionRuntime');
const plan = prepareInsightEvidence(
    Array.from({ length: 40 }, (_, index) => ({
        key: `synthetic-${String(index).padStart(4, '0')}`,
        projection: {
            schemaVersion: '1',
            category: 'Learning',
            credentialTypes: ['CourseCredential'],
            facts: Array.from({ length: 12 }, (_, fact) => ({
                kind: 'skill',
                value: `${index} ${fact} PRIVATE_NAME ${'synthetic systems engineering '.repeat(6)}`,
            })),
        } as ModelSafeCredentialProjection,
    }))
);
beforeEach(() => {
    revision = 'revision-a';
    locale = 'en';
    ownerActive = true;
    filterFailure = undefined;
    afterProvider = undefined;
    providerCalls = 0;
    providerSummary = 'Synthetic bounded cohort summary.';
    restoredSummary = undefined;
    filters = 0;
    restores = 0;
    writes = 0;
    filteredInputs.clear();
    cache.clear();
});

test('cohort adapter routes every model call through the real privacy client and reuses scoped summaries', async () => {
    const cold = await compactInsightEvidence('did:example:owner-a', revision, plan);
    expect(providerCalls).toBeGreaterThan(1);
    expect(filters).toBe(providerCalls * 2);
    expect(restores).toBe(providerCalls);
    expect(writes).toBe(providerCalls);
    const calls = providerCalls;
    const warm = await compactInsightEvidence('did:example:owner-a', revision, plan);
    expect(warm.message).toBe(cold.message);
    expect(warm.stats.summaryModelCalls).toBe(0);
    expect(providerCalls).toBe(calls);
    expect(filters).toBe(calls * 2);
    locale = 'fr';
    const localized = await compactInsightEvidence('did:example:owner-a', revision, plan);
    expect(localized.stats.summaryCacheHits).toBe(0);
    expect(providerCalls).toBeGreaterThan(calls);
});

test('5000-character restored summaries pass privacy and cache validation; expansion past the limit fails', async () => {
    providerSummary = 'synthetic placeholder';
    restoredSummary = 'x'.repeat(5000);
    const result = await compactInsightEvidence('did:example:owner-a', revision, plan);
    expect(result.message).toContain(restoredSummary);
    expect(filters).toBe(providerCalls * 2);
    expect(writes).toBe(providerCalls);
    cache.clear();
    writes = 0;
    restoredSummary = 'x'.repeat(5001);
    await expect(
        compactInsightEvidence('did:example:owner-a', revision, plan)
    ).rejects.toMatchObject({ reason: 'invalid_summary' });
    expect(writes).toBe(0);
});
test("changing owner or consent revision never reuses another scope's summaries", async () => {
    await compactInsightEvidence('did:example:owner-a', revision, plan);
    const secondOwner = await compactInsightEvidence('did:example:owner-b', revision, plan);
    expect(secondOwner.stats.summaryCacheHits).toBe(0);
    revision = 'revision-b';
    const secondRevision = await compactInsightEvidence('did:example:owner-a', revision, plan);
    expect(secondRevision.stats.summaryCacheHits).toBe(0);
});
test('managed privacy rejection reaches no provider and retains no summary', async () => {
    const original = new Error('synthetic privacy rejection');
    filterFailure = original;
    await expect(compactInsightEvidence('did:example:owner-a', revision, plan)).rejects.toBe(
        original
    );
    expect(providerCalls).toBe(0);
    expect(writes).toBe(0);
});
test('owner cancellation during model work rejects before summary persistence', async () => {
    afterProvider = () => {
        ownerActive = false;
    };
    await expect(compactInsightEvidence('did:example:owner-a', revision, plan)).rejects.toBe(
        ownerFailure
    );
    expect(writes).toBe(0);
});
test('grant revision change during model work rejects before summary persistence', async () => {
    afterProvider = () => {
        revision = 'revision-b';
    };
    await expect(
        compactInsightEvidence('did:example:owner-a', 'revision-a', plan)
    ).rejects.toBeInstanceOf(ConsentFailure);
    expect(writes).toBe(0);
});

test('Unicode source and generated summaries still traverse the real client privacy boundary', async () => {
    const unicode = prepareInsightEvidence(
        Array.from({ length: 40 }, (_, index) => ({
            key: `synthetic-${index}`,
            projection: {
                schemaVersion: '1',
                category: 'Learning π',
                credentialTypes: ['CourseCredential'],
                facts: Array.from({ length: 12 }, (_, fact) => ({
                    kind: 'skill',
                    value:
                        `${index} ${fact} π Δ Иван PRIVATE_NAME ` + 'synthetic learning '.repeat(8),
                })),
            } as ModelSafeCredentialProjection,
        }))
    );
    providerSummary = 'π Δ Иван 👩🏽‍💻 synthetic summary';
    const result = await compactInsightEvidence('did:example:owner-a', revision, unicode);
    expect(providerCalls).toBeGreaterThan(0);
    expect(filters).toBe(providerCalls * 2);
    expect(restores).toBe(providerCalls);
    expect(writes).toBe(providerCalls);
    expect(result.message).toContain(providerSummary);
    expect(result.stats.representedCredentialCount).toBe(40);
});
test('old summary version is not reused even if returned for the requested key', async () => {
    await compactInsightEvidence('did:example:owner-a', revision, plan);
    for (const record of cache.values()) {
        record.version = 'v4-cohort-5000';
        record.summary = 'π old summary';
    }
    const calls = providerCalls;
    const result = await compactInsightEvidence('did:example:owner-a', revision, plan);
    expect(result.stats.summaryCacheHits).toBe(0);
    expect(providerCalls).toBeGreaterThan(calls);
});
