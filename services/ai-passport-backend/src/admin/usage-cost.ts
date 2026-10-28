import type { UsageMeter } from '../ai/usage-meter';
import type { CostPricing } from './cost-model';

export type UsageLedger = {
    version: 1;
    pricing: CostPricing;
    mixedPricing: boolean;
    historicalRequestsUnmeasured: boolean;
    attempts: number;
    failedAttempts: number;
    totals: UsageMeter;
    knownListPriceUsd: number;
    unpricedComponents: string[];
    samples: {
        count: number;
        sumKnownUsd: number;
        sumWithEmbeddingAllowanceUsd: number;
        minKnownUsd: number;
        maxWithEmbeddingAllowanceUsd: number;
    };
};

const validRate = (n: number | null) => n !== null && Number.isFinite(n) && n >= 0;
const samePricing = (a: CostPricing, b: CostPricing) => JSON.stringify(a) === JSON.stringify(b);

/** Measures only response metadata. No source content or identity enters this ledger. */
export function addUsageAttempt(
    previous: UsageLedger | undefined,
    meter: UsageMeter,
    pricing: CostPricing,
    options: { completed: boolean; credential: boolean; historicalRequestsUnmeasured: boolean }
): UsageLedger | undefined {
    if (!(meter.generation.requests + meter.embedding.requests + meter.privacy.requests))
        return previous;
    const ledger: UsageLedger = previous
        ? structuredClone(previous)
        : {
              version: 1,
              pricing,
              mixedPricing: false,
              historicalRequestsUnmeasured: options.historicalRequestsUnmeasured,
              attempts: 0,
              failedAttempts: 0,
              totals: {
                  generation: { requests: 0, measuredRequests: 0, inputTokens: 0, outputTokens: 0 },
                  embedding: { requests: 0, measuredRequests: 0, inputTokens: 0 },
                  privacy: { requests: 0, measuredRequests: 0, textUnits: 0, freeTextUnits: 0 },
              },
              knownListPriceUsd: 0,
              unpricedComponents: [],
              samples: {
                  count: 0,
                  sumKnownUsd: 0,
                  sumWithEmbeddingAllowanceUsd: 0,
                  minKnownUsd: 0,
                  maxWithEmbeddingAllowanceUsd: 0,
              },
          };
    ledger.mixedPricing ||= !samePricing(ledger.pricing, pricing);
    ledger.attempts += 1;
    if (!options.completed) ledger.failedAttempts += 1;
    for (const kind of ['generation', 'embedding', 'privacy'] as const) {
        for (const key of Object.keys(meter[kind])) {
            const values = ledger.totals[kind] as unknown as Record<string, number>;
            values[key] += (meter[kind] as unknown as Record<string, number>)[key]!;
        }
    }
    // A credential attempt makes one generation request. Refuse to price an
    // unexpected multi-request envelope rather than lose per-request tier data.
    const generationKnown =
        meter.generation.requests <= 1 &&
        validRate(pricing.generationInputUsdPerMillionTokens) &&
        validRate(pricing.generationOutputUsdPerMillionTokens);
    const longContext = meter.generation.inputTokens > 272000;
    const generation = generationKnown
        ? (meter.generation.inputTokens *
              pricing.generationInputUsdPerMillionTokens! *
              (longContext ? 2 : 1) +
              meter.generation.outputTokens *
                  pricing.generationOutputUsdPerMillionTokens! *
                  (longContext ? 1.5 : 1)) /
          1e6
        : 0;
    const embeddingKnown = validRate(pricing.embeddingUsdPerMillionTokens);
    const embedding = embeddingKnown
        ? (meter.embedding.inputTokens * pricing.embeddingUsdPerMillionTokens!) / 1e6
        : 0;
    const privacyKnown = validRate(pricing.privacyUsdPerThousandTextUnits);
    const privacy = privacyKnown
        ? (meter.privacy.textUnits * pricing.privacyUsdPerThousandTextUnits!) / 1000
        : 0;
    const known = generation + embedding + privacy;
    ledger.knownListPriceUsd += known;
    ledger.unpricedComponents = [
        ...new Set([
            ...(ledger.unpricedComponents ?? []),
            ...(meter.generation.measuredRequests && !generationKnown ? ['generation'] : []),
            ...(meter.embedding.measuredRequests && !embeddingKnown ? ['embedding'] : []),
            ...(meter.privacy.measuredRequests && !privacyKnown ? ['privacy'] : []),
        ]),
    ];
    const sampled =
        options.completed &&
        options.credential &&
        generationKnown &&
        embeddingKnown &&
        privacyKnown &&
        meter.generation.requests === 1 &&
        meter.generation.measuredRequests === 1 &&
        meter.embedding.requests === 5 &&
        meter.privacy.requests === 3 &&
        meter.privacy.measuredRequests === 3;
    if (sampled) {
        const unmeasuredEmbeddings = meter.embedding.requests - meter.embedding.measuredRequests;
        const withAllowance =
            known + (unmeasuredEmbeddings * 8192 * pricing.embeddingUsdPerMillionTokens!) / 1e6;
        const s = ledger.samples;
        s.minKnownUsd = s.count ? Math.min(s.minKnownUsd, known) : known;
        s.maxWithEmbeddingAllowanceUsd = Math.max(s.maxWithEmbeddingAllowanceUsd, withAllowance);
        s.count += 1;
        s.sumKnownUsd += known;
        s.sumWithEmbeddingAllowanceUsd += withAllowance;
    }
    return ledger;
}

export function usageCostSummary(ledger: UsageLedger | undefined, pricing: CostPricing) {
    if (!ledger) return null;
    const t = ledger.totals;
    const pricesMatch = !ledger.mixedPricing && samePricing(ledger.pricing, pricing);
    const s = ledger.samples;
    return {
        attempts: ledger.attempts,
        failedAttempts: ledger.failedAttempts,
        historicalRequestsUnmeasured: ledger.historicalRequestsUnmeasured,
        knownListPriceUsd: ledger.knownListPriceUsd,
        unpricedComponents: ledger.unpricedComponents ?? [],
        totals: t,
        unmeasuredRequests: {
            generation: t.generation.requests - t.generation.measuredRequests,
            embedding: t.embedding.requests - t.embedding.measuredRequests,
            privacy: t.privacy.requests - t.privacy.measuredRequests,
        },
        sample:
            pricesMatch && s.count
                ? {
                      count: s.count,
                      meanKnownUsd: s.sumKnownUsd / s.count,
                      meanWithEmbeddingAllowanceUsd: s.sumWithEmbeddingAllowanceUsd / s.count,
                      minKnownUsd: s.minKnownUsd,
                      maxWithEmbeddingAllowanceUsd: s.maxWithEmbeddingAllowanceUsd,
                  }
                : null,
        pricesMatch,
    };
}
