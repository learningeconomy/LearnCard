// Offline planning benchmark: synthetic evidence and summaries only, no provider/DB imports.
// Character/4 token estimates and illustrative rates are not provider usage or pricing.
import { createHash } from 'node:crypto';
import {
    buildFullEvidenceInsightPrompt,
    prepareInsightEvidence,
} from '../src/services/insightCompaction';
import type { ModelSafeCredentialProjection } from '@learncard/types';

const cases = [
    { name: '15-exact-duplicates', count: 15, unique: 1, facts: 12 },
    { name: '196-distinct', count: 196, unique: 196, facts: 12 },
    { name: '500-distinct', count: 500, unique: 500, facts: 12 },
    { name: '196-large-hierarchical', count: 196, unique: 196, facts: 40 },
];
const rates = {
    illustrativeInputUsdPerMillion: 3,
    illustrativeOutputUsdPerMillion: 15,
};
for (const fixture of cases) {
    const cache = new Map<string, string>();
    const inputs = Array.from({ length: fixture.count }, (_, index) => ({
        key: `synthetic-${String(index).padStart(4, '0')}`,
        projection: {
            schemaVersion: '1',
            category: 'Synthetic learning',
            credentialTypes: ['CourseCredential'],
            facts: Array.from({ length: fixture.facts }, (_, fact) => ({
                kind: 'skill',
                value: `Source ${index % fixture.unique} fact ${fact} ${'synthetic systems engineering '.repeat(7)}`,
            })),
        } as ModelSafeCredentialProjection,
    }));
    const plan = prepareInsightEvidence(inputs);
    let inputChars = 0;
    let outputChars = 0;
    const deps = {
        measure: async (value: string) => JSON.stringify([value]).length,
        hash: (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex'),
        assertFresh: async () => {},
        read: async (key: string) => cache.get(key),
        write: async (key: string, value: string) => {
            cache.set(key, value);
        },
        summarize: async ({ message, systemPrompt }: { message: string; systemPrompt: string }) => {
            inputChars += message.length + systemPrompt.length;
            // Large escaping pressures exercise hierarchy; synthetic content has no semantic quality claim.
            const summary = fixture.name.includes('hierarchical')
                ? '"\\'.repeat(1000)
                : 'Synthetic compacted evidence with uncertainty and source provenance.';
            outputChars += JSON.stringify({ summary }).length;
            return { summary };
        },
    };
    const started = performance.now();
    const cold = await buildFullEvidenceInsightPrompt(plan, deps);
    const coldPlanningMs = performance.now() - started;
    const summaryInputChars = inputChars;
    const summaryOutputChars = outputChars;
    // Final call counted explicitly: no final model is called by this benchmark.
    const finalInputChars = cold.message.length + 6500; // illustrative final system prompt overhead
    const finalOutputChars = 8000; // illustrative structured response
    const approximateCost = (input: number, output: number) =>
        Number(
            (
                ((input / 4) * rates.illustrativeInputUsdPerMillion +
                    (output / 4) * rates.illustrativeOutputUsdPerMillion) /
                1_000_000
            ).toFixed(6)
        );
    const warmStarted = performance.now();
    const warm = await buildFullEvidenceInsightPrompt(plan, deps);
    console.log(
        JSON.stringify({
            fixture: fixture.name,
            credentials: fixture.count,
            representatives: plan.groups.length,
            assumptions: {
                ...rates,
                tokenEstimate: 'characters/4, not tokenizer usage',
                finalInputOverheadChars: 6500,
                finalOutputChars,
                summaryConcurrency: 3,
            },
            cold: {
                ...cold.stats,
                finalModelCalls: 1,
                totalModelCalls: cold.stats.summaryModelCalls + 1,
                planningMs: Number(coldPlanningMs.toFixed(2)),
                summaryInputChars,
                summaryOutputChars,
                finalInputChars,
                estimatedUsd: approximateCost(
                    summaryInputChars + finalInputChars,
                    summaryOutputChars + finalOutputChars
                ),
            },
            warmSummaryCache: {
                ...warm.stats,
                finalModelCalls: 1,
                totalModelCalls: 1,
                planningMs: Number((performance.now() - warmStarted).toFixed(2)),
                estimatedUsd: approximateCost(finalInputChars, finalOutputChars),
            },
            warmGeneratedCache: {
                totalModelCalls: 0,
                estimatedUsd: 0,
                evidence: 'covered by awarding integration test; not simulated as a provider call',
            },
        })
    );
}
