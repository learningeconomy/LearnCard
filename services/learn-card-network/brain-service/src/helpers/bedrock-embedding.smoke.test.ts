/**
 * LC-2206 opt-in smoke test against REAL Amazon Bedrock (paid: three InvokeModel calls).
 * Skipped unless SKILL_EMBEDDING_BEDROCK_SMOKE=true. Never enable it in CI.
 *
 *   SKILL_EMBEDDING_BEDROCK_SMOKE=true AWS_PROFILE=<profile> \
 *     bunx vitest run --config vitest.config.ts src/helpers/bedrock-embedding.smoke.test.ts
 *
 * Uses the normal AWS credential chain (SigV4) in us-east-1 and the same request shape,
 * purposes, dimension and normalisation as production.
 */
import { describe, expect, it } from 'vitest';

import {
    DEFAULT_SKILL_EMBEDDING_DIMENSION,
    DEFAULT_SKILL_EMBEDDING_REGION,
    NOVA2_EMBEDDING_MODEL_ID,
} from '../config/skillEmbedding';
import { embedTextWithBedrock, type BedrockEmbeddingConfig } from './bedrock-embedding.helpers';

const enabled = process.env.SKILL_EMBEDDING_BEDROCK_SMOKE === 'true';

const config: BedrockEmbeddingConfig = {
    modelId: process.env.SKILL_EMBEDDING_BEDROCK_MODEL_ID || NOVA2_EMBEDDING_MODEL_ID,
    region: process.env.SKILL_EMBEDDING_BEDROCK_REGION || DEFAULT_SKILL_EMBEDDING_REGION,
    dimension: Number(process.env.SKILL_EMBEDDING_DIMENSION || DEFAULT_SKILL_EMBEDDING_DIMENSION),
    timeoutMs: 15_000,
};

const dot = (a: number[], b: number[]) =>
    a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);

describe.skipIf(!enabled)('Bedrock Nova 2 embeddings smoke (real AWS, opt-in)', () => {
    it('returns unit vectors where a related skill outranks an unrelated one', async () => {
        const query = await embedTextWithBedrock('python data analysis', 'query', config);
        const related = await embedTextWithBedrock(
            'Data Analysis\nAnalyse datasets with Python and statistics',
            'index',
            config
        );
        const unrelated = await embedTextWithBedrock(
            'Customer service\nHelp customers resolve issues politely',
            'index',
            config
        );

        for (const vector of [query, related, unrelated]) {
            expect(vector).toHaveLength(config.dimension);
            expect(Math.hypot(...vector)).toBeCloseTo(1, 6);
        }

        expect(dot(query, related)).toBeGreaterThan(dot(query, unrelated));
    }, 60_000);
});
