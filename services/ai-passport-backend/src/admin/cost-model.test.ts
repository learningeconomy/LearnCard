import { expect, test } from 'bun:test';
import { costPricing, estimateCosts, PRICE_SOURCES } from './cost-model';

const pricing = costPricing({ AWS_REGION: 'us-east-1' });

test('default role uses exact US geographic Luna and Nova on-demand rates', () => {
    expect(pricing.generationModel).toBe('us.openai.gpt-6-luna');
    expect(pricing.embeddingModel).toBe('amazon.nova-2-multimodal-embeddings-v1:0');
    expect(pricing.embeddingUsdPerMillionTokens).toBe(0.135);
    expect(pricing.generationInputUsdPerMillionTokens).toBe(0.11);
    expect(pricing.generationOutputUsdPerMillionTokens).toBe(0.55);
    expect(pricing.privacyUsdPerThousandTextUnits).toBe(0.1);
    expect(pricing.checkedAt).toBe('2026-10-13');
    expect(pricing.embeddingRateSource).toBe(PRICE_SOURCES.embedding);
});

test('all three components contribute to five-record planning total', () => {
    const result = estimateCosts(25, 5, pricing);
    expect(result.embeddingUsd).toBeCloseTo(0.027648, 9);
    expect(result.generationUsd).toBeCloseTo(0.022264, 9);
    expect(result.privacyUsd).toBeCloseTo(0.15, 9);
    expect(result.totalUsd).toBeCloseTo(0.199912, 9);
    expect(result.expectedTotalUsd).toBeNull();
    expect(result.estimateKind).toBe('stress-scenario');
    expect(result.privacyRequests).toBe(15);
    expect(result.missingComponents).toEqual([]);
    expect(result.generationInputTokensPerCall).toBe(20000);
    expect(result.generationOutputTokensPerCall).toBe(4096);
});

test('mixed credential/message reservations count one batched privacy call per credential', () => {
    expect(estimateCosts(7, 1, pricing).privacyRequests).toBe(5);
    expect(estimateCosts(7, 0, pricing).privacyRequests).toBe(7);
    const inconsistent = estimateCosts(4, 1, pricing);
    expect(inconsistent.totalUsd).toBeNull();
    expect(inconsistent.missingComponents).toEqual(['privacy']);
});

test('explicit generation assumptions alter only generation cost', () => {
    const base = estimateCosts(5, 1, pricing);
    const changed = estimateCosts(5, 1, pricing, 40000);
    expect(changed.generationUsd! - base.generationUsd!).toBeCloseTo(0.0022, 9);
    expect(changed.embeddingUsd).toBe(base.embeddingUsd);
    expect(changed.privacyUsd).toBe(base.privacyUsd);
});

test('unknown model returns known component subtotal, never an embedding-only total', () => {
    const unknown = costPricing({
        AWS_REGION: 'us-east-1',
        TITLE_MODEL: 'unrecognized-secret-model',
    });
    const result = estimateCosts(5, 1, unknown);
    expect(unknown.generationModel).toBeNull();
    expect(JSON.stringify(unknown)).not.toContain('unrecognized-secret-model');
    expect(result.generationUsd).toBeNull();
    expect(result.totalUsd).toBeNull();
    expect(result.knownSubtotalUsd).toBeCloseTo(0.0355296, 9);
    expect(result.missingComponents).toEqual(['generation']);
});

test('unsupported region/endpoints cannot reuse public prices or leak configuration', () => {
    for (const env of [
        {},
        { AWS_REGION: 'eu-west-1' },
        { AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'https://secret.example/token' },
    ]) {
        const value = costPricing(env);
        expect(estimateCosts(5, 1, value).missingComponents).toEqual([
            'embedding',
            'generation',
            'privacy',
        ]);
        expect(JSON.stringify(value)).not.toContain('secret.example');
    }
    const value = costPricing({
        AWS_REGION: 'us-east-1',
        BEDROCK_BASE_URL: 'https://secret.example',
    });
    expect(value.generationInputUsdPerMillionTokens).toBeNull();
    expect(
        costPricing({ AWS_REGION: 'us-east-1', BEDROCK_BASE_URL: '' })
            .generationInputUsdPerMillionTokens
    ).toBeNull();
});

test('operator overrides require usable provenance and are not silently replaced', () => {
    for (const invalid of ['', 'NaN', 'Infinity', '-1']) {
        expect(
            costPricing({
                AWS_REGION: 'us-east-1',
                NOVA_EMBEDDING_USD_PER_MILLION_TOKENS: invalid,
                NOVA_EMBEDDING_RATE_SOURCE: PRICE_SOURCES.embedding,
            }).embeddingUsdPerMillionTokens
        ).toBeNull();
    }
    expect(
        costPricing({
            AWS_REGION: 'us-east-1',
            NOVA_EMBEDDING_USD_PER_MILLION_TOKENS: '0.2',
            NOVA_EMBEDDING_RATE_SOURCE: PRICE_SOURCES.embedding,
        }).embeddingUsdPerMillionTokens
    ).toBeNull();
    expect(
        costPricing({
            AWS_REGION: 'us-east-1',
            NOVA_EMBEDDING_USD_PER_MILLION_TOKENS: '0.135',
            NOVA_EMBEDDING_RATE_SOURCE: PRICE_SOURCES.embedding,
        }).embeddingUsdPerMillionTokens
    ).toBe(0.135);
    expect(
        costPricing({
            AWS_REGION: 'us-east-1',
            EMBEDDING_REPRESENTATION_USD_PER_CALL_ESTIMATE: '0.1',
        }).generationInputUsdPerMillionTokens
    ).toBeNull();
});

test('zero work costs zero even when rates are unknown', () => {
    expect(estimateCosts(0, 0, costPricing({})).totalUsd).toBe(0);
    expect(estimateCosts(2, 0, pricing).generationUsd).toBe(0);
});

test('invalid/nonfinite input cannot produce NaN or a falsely small total', () => {
    for (const n of [-1, 0.5, NaN, Infinity, 1_000_001]) {
        expect(() => estimateCosts(n, 0, pricing)).toThrow();
        expect(() => estimateCosts(5, n, pricing)).toThrow();
    }
    for (const n of [-1, 0.5, NaN, Infinity, 272001])
        expect(() => estimateCosts(5, 1, pricing, n)).toThrow();
    expect(
        estimateCosts(5, 1, { ...pricing, privacyUsdPerThousandTextUnits: NaN }).totalUsd
    ).toBeNull();
});

test('reasoning configuration follows runtime validation and sample identity', () => {
    const env = { AWS_REGION: 'us-east-1', TITLE_MODEL: 'gpt-6-luna' };
    expect(
        costPricing({ ...env, OPENAI_REASONING_EFFORT: 'high' }).generationConfiguration
    ).not.toBe(costPricing({ ...env, OPENAI_REASONING_EFFORT: 'none' }).generationConfiguration);
    expect(
        costPricing({
            ...env,
            TITLE_MODEL: 'gpt-6-luna-none',
            OPENAI_REASONING_EFFORT: 'invalid-private',
        }).generationInputUsdPerMillionTokens
    ).toBeNull();
    expect(
        JSON.stringify(costPricing({ ...env, OPENAI_REASONING_EFFORT: 'invalid-private' }))
    ).not.toContain('invalid-private');
    expect(costPricing({ ...env, OPENAI_REASONING_EFFORT: '' }).generationConfiguration).toBe(
        'us.openai.gpt-6-luna:medium'
    );
});
