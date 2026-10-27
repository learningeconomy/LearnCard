import { expect, test } from 'bun:test';
import { createUsageMeter } from '../ai/usage-meter';
import { costPricing } from './cost-model';
import { addUsageAttempt, usageCostSummary } from './usage-cost';

const pricing = costPricing({ AWS_REGION: 'us-east-1' });
const options = { completed: true, credential: true, historicalRequestsUnmeasured: false };
function credential() {
    const meter = createUsageMeter();
    meter.generation = { requests: 1, measuredRequests: 1, inputTokens: 1000, outputTokens: 500 };
    meter.embedding.requests = 5; // Official Nova response omits token usage.
    meter.privacy = { requests: 3, measuredRequests: 3, textUnits: 8, freeTextUnits: 0 };
    return meter;
}

test('sample records measured generation/privacy and keeps Nova allowance distinct', () => {
    const ledger = addUsageAttempt(undefined, credential(), pricing, options)!;
    const summary = usageCostSummary(ledger, pricing)!;
    expect(summary.knownListPriceUsd).toBeCloseTo(0.001185, 9);
    expect(summary.unmeasuredRequests).toEqual({ generation: 0, embedding: 5, privacy: 0 });
    expect(summary.sample?.meanKnownUsd).toBeCloseTo(0.001185, 9);
    expect(summary.sample?.meanWithEmbeddingAllowanceUsd).toBeCloseTo(0.0067146, 9);
    expect(summary.sample?.count).toBe(1);
    expect(summary.totals.privacy.textUnits).toBe(8);
    expect(summary.historicalRequestsUnmeasured).toBe(false);
});

test('old jobs and empty attempts never invent retrospective usage', () => {
    expect(usageCostSummary(undefined, pricing)).toBeNull();
    expect(addUsageAttempt(undefined, createUsageMeter(), pricing, options)).toBeUndefined();
    const ledger = addUsageAttempt(undefined, credential(), pricing, {
        ...options,
        historicalRequestsUnmeasured: true,
    })!;
    expect(usageCostSummary(ledger, pricing)?.historicalRequestsUnmeasured).toBe(true);
});

test('failures retain measured costs and missing request counts but are excluded from projections', () => {
    const meter = credential();
    meter.privacy.requests += 1;
    const ledger = addUsageAttempt(undefined, meter, pricing, { ...options, completed: false })!;
    const summary = usageCostSummary(ledger, pricing)!;
    expect(summary.failedAttempts).toBe(1);
    expect(summary.unmeasuredRequests.privacy).toBe(1);
    expect(summary.knownListPriceUsd).toBeGreaterThan(0);
    expect(summary.sample).toBeNull();
    const retried = addUsageAttempt(ledger, credential(), pricing, options)!;
    expect(retried.attempts).toBe(2);
    expect(retried.samples.count).toBe(1);
    expect(retried.knownListPriceUsd).toBeCloseTo(ledger.knownListPriceUsd * 2, 9);
    expect(ledger.attempts).toBe(1); // No mutation of persisted prior state.
});

test('missing generation/privacy usage and message-only attempts do not become credential samples', () => {
    for (const kind of ['generation', 'privacy'] as const) {
        const meter = credential();
        meter[kind].measuredRequests = 0;
        expect(addUsageAttempt(undefined, meter, pricing, options)?.samples.count).toBe(0);
    }
    expect(
        addUsageAttempt(undefined, credential(), pricing, { ...options, credential: false })
            ?.samples.count
    ).toBe(0);
});

test('model/pricing changes suppress reuse of old sample forecasts', () => {
    const ledger = addUsageAttempt(undefined, credential(), pricing, options)!;
    const unknown = costPricing({ AWS_REGION: 'us-east-1', TITLE_MODEL: 'unrecognized' });
    expect(usageCostSummary(ledger, unknown)?.sample).toBeNull();
    expect(
        usageCostSummary(
            ledger,
            costPricing({ AWS_REGION: 'us-east-1', TITLE_MODEL: 'gpt-6-luna-high' })
        )?.sample
    ).toBeNull();
    const mixed = addUsageAttempt(ledger, credential(), unknown, options)!;
    expect(mixed.mixedPricing).toBe(true);
    expect(usageCostSummary(mixed, pricing)?.unpricedComponents).toContain('generation');
    expect(usageCostSummary(mixed, pricing)?.sample).toBeNull();
});

test('long-context generation uses verified higher tier instead of short-context rate', () => {
    const meter = credential();
    meter.generation.inputTokens = 300000;
    const ledger = addUsageAttempt(undefined, meter, pricing, options)!;
    expect(ledger.knownListPriceUsd).toBeCloseTo(0.0672125, 9);
});

test('sample range and average retain all successful observations', () => {
    let ledger = addUsageAttempt(undefined, credential(), pricing, options)!;
    const bigger = credential();
    bigger.privacy.textUnits = 18;
    ledger = addUsageAttempt(ledger, bigger, pricing, options)!;
    const sample = usageCostSummary(ledger, pricing)!.sample!;
    expect(sample.count).toBe(2);
    expect(sample.meanKnownUsd).toBeCloseTo(0.001685, 9);
    expect(sample.minKnownUsd).toBeCloseTo(0.001185, 9);
    expect(sample.maxWithEmbeddingAllowanceUsd).toBeCloseTo(0.0077146, 9);
});
