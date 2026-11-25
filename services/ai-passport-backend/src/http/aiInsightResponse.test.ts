import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test';
import { VCValidator } from '@learncard/types';
import { createAiInsightHttpResponse } from './aiInsightResponse';
import { createJsonResponse } from './jsonResponse';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'AIInsight', 'BoostCredential'],
    issuer: 'did:example:synthetic-issuer',
    issuanceDate: '2026-10-01T00:00:00Z',
    credentialSubject: { id: 'did:example:synthetic-subject' },
    insights: {
        strongestArea: { title: 'Synthetic strength' },
        weakestArea: { title: 'Synthetic weakness' },
        roomForGrowth: { title: 'Synthetic growth' },
        credentialsAnalyzed: 1,
        analysisDate: '2026-10-01T00:00:00Z',
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-10-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:synthetic-issuer#key',
        proofValue: 'synthetic-proof',
    },
};
const result = () => ({
    vc: VCValidator.parse(structuredClone(credential)),
    inputCoverage: {
        verifiedCount: 1,
        excludedCount: 1,
        exclusions: [{ reason: 'unsupported_cryptosuite' as const, count: 1 }],
    },
    compaction: { originalChars: 100, compactChars: 50, compactionPercent: 50 },
});
let events: Record<string, unknown>[];
let restore: () => void;
beforeEach(() => {
    events = [];
    const info = spyOn(console, 'info').mockImplementation(event => events.push(event));
    const error = spyOn(console, 'error').mockImplementation(event => events.push(event));
    restore = () => {
        info.mockRestore();
        error.mockRestore();
    };
});
afterEach(() => restore());

test('real HTTP response construction accepts a synthetic cached insight and coverage', async () => {
    const input = result();
    const before = structuredClone(input);
    const response = await createAiInsightHttpResponse(
        async () => input,
        (data, status) =>
            createJsonResponse(data, status, {
                'Access-Control-Allow-Origin': 'https://synthetic.example',
            })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://synthetic.example');
    const body = await response.json();
    expect(await VCValidator.parseAsync(body.credential)).toEqual(credential);
    expect(body.meta.inputCoverage).toEqual(input.inputCoverage);
    expect(body.meta.compactionPercent).toBe(50);
    expect(body.insights.strongestArea).toEqual(credential.insights.strongestArea);
    expect(input).toEqual(before);
    expect(events.filter(event => event.event === 'ai_insight_response_constructed')).toHaveLength(
        1
    );
    expect(events.find(event => event.event === 'ai_insight_response_constructed')).toMatchObject({
        stage: 'response_assembly',
        httpStatus: 200,
    });
    expect(events.at(-1)?.event).toBe('ai_insight_completed');
    expect(JSON.stringify(events)).not.toContain('synthetic-subject');
    expect(JSON.stringify(events)).not.toContain('Synthetic strength');
    expect(JSON.stringify(events)).not.toContain('synthetic-proof');
});

test('empty result preserves the existing 204 response construction', async () => {
    const response = await createAiInsightHttpResponse(async () => null, createJsonResponse);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('null');
    expect(
        events.find(event => event.event === 'ai_insight_response_constructed')?.httpStatus
    ).toBe(204);
});

test('malformed cached insight fails HTTP assembly despite successful service return', async () => {
    const input = result();
    delete input.vc.insights;
    await expect(
        createAiInsightHttpResponse(async () => input, createJsonResponse)
    ).rejects.toBeInstanceOf(TypeError);
    expect(events.find(event => event.event === 'ai_insight_failed')?.stage).toBe(
        'response_assembly'
    );
    expect(
        events.some(event =>
            ['ai_insight_completed', 'ai_insight_response_constructed'].includes(
                String(event.event)
            )
        )
    ).toBe(false);
});

test('serialization failures preserve the original error without a success response', async () => {
    const error = new Error('synthetic private payload token=sentinel');
    const input = result();
    input.vc.insights.toJSON = () => {
        throw error;
    };
    await expect(createAiInsightHttpResponse(async () => input, createJsonResponse)).rejects.toBe(
        error
    );
    expect(events.find(event => event.event === 'ai_insight_failed')?.stage).toBe(
        'response_assembly'
    );
    expect(events.some(event => event.event === 'ai_insight_completed')).toBe(false);
    expect(JSON.stringify(events)).not.toContain('sentinel');
});

test('response-constructor rejection preserves identity and signal observation covers assembly', async () => {
    const controller = new AbortController();
    const error = new Error('synthetic private response-constructor failure');
    await expect(
        createAiInsightHttpResponse(
            async () => result(),
            () => {
                controller.abort();
                throw error;
            },
            { signal: controller.signal }
        )
    ).rejects.toBe(error);
    expect(events.find(event => event.event === 'ai_insight_interrupted')?.observation).toBe(
        'request_signal_aborted'
    );
    expect(events.find(event => event.event === 'ai_insight_failed')?.stage).toBe(
        'response_assembly'
    );
    expect(JSON.stringify(events)).not.toContain(error.message);
});

test('HTTP metadata preserves prompt-budget coverage without changing signed credential', async () => {
    const input = result();
    const promptCoverage = {
        includedCount: 1,
        omittedCount: 7,
        reason: 'privacy_input_budget' as const,
    };
    const response = await createAiInsightHttpResponse(
        async () => ({
            ...input,
            inputCoverage: { ...input.inputCoverage, promptCoverage },
        }),
        createJsonResponse
    );
    const body = await response.json();
    expect(body.meta.inputCoverage.promptCoverage).toEqual(promptCoverage);
    expect(body.meta.credentialsAnalyzed).toBe(1);
    expect(body.credential).toEqual(input.vc);
    expect(body.credential.proof).toEqual(input.vc.proof);
});

test('full-evidence cohort coverage is additive HTTP metadata outside the signed credential', async () => {
    const input = result();
    const compactionCoverage = {
        strategy: 'cohort_compaction' as const,
        representedCredentialCount: 196,
        representativeCount: 182,
        duplicateCount: 14,
        splitProjectionCount: 1,
        cohortCount: 13,
        levels: 1,
        summaryCacheHits: 0,
        summaryCacheMisses: 13,
        summaryModelCalls: 13,
        generationCacheHit: false,
    };
    const response = await createAiInsightHttpResponse(
        async () => ({
            ...input,
            inputCoverage: { ...input.inputCoverage, compactionCoverage },
        }),
        createJsonResponse
    );
    const body = await response.json();
    expect(body.meta.inputCoverage.compactionCoverage).toEqual(compactionCoverage);
    expect(body.credential).toEqual(input.vc);
    expect(body.credential).not.toHaveProperty('compactionCoverage');
    expect(JSON.stringify(events)).not.toContain('Synthetic strength');
});
