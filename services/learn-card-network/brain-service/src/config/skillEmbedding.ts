/**
 * LC-2206: skill-matching embeddings run on Amazon Nova 2 Multimodal Embeddings (Bedrock).
 *
 * Values mirror AI Passport's reviewed Nova identity (`nova2-text-1024-index-retrieval-*`):
 * the in-Region base model ID (Nova 2 embeddings has no geo/global inference profile),
 * us-east-1, 1024 dimensions, GENERIC_INDEX for stored skills, TEXT_RETRIEVAL for queries,
 * NONE truncation and client-side unit normalisation.
 *
 * Every (model, dimension, scheme) generation gets its own Neo4j property, key property and
 * vector index, so vectors from different models or dimensions are never mixed in one index.
 */

export const NOVA2_EMBEDDING_MODEL_ID = 'amazon.nova-2-multimodal-embeddings-v1:0';
export const DEFAULT_SKILL_EMBEDDING_REGION = 'us-east-1';
export const DEFAULT_SKILL_EMBEDDING_DIMENSION = 1024;
export const DEFAULT_SKILL_EMBEDDING_TIMEOUT_MS = 15_000;

/** Output sizes the Nova 2 embeddings API accepts. */
export const NOVA2_EMBEDDING_DIMENSIONS = [256, 384, 1024, 3072] as const;

/** Nova 2 synchronous text input limit (characters). */
export const NOVA2_MAX_TEXT_CHARS = 8192;

/**
 * Deployed (staging and production) runtimes may only use these values. Anything else fails
 * environment parsing at startup. Widening this list is a reviewed code change.
 */
export const DEPLOYED_SKILL_EMBEDDING_ALLOWLIST = {
    modelIds: [NOVA2_EMBEDDING_MODEL_ID],
    dimensions: [1024],
    regions: ['us-east-1'],
} as const;

/**
 * Bump when the embedded text, purposes, truncation or normalisation change. The version is
 * part of every node key and cache key, so a bump re-embeds skills and invalidates cached
 * query vectors without touching the stored vector schema.
 */
export const SKILL_EMBEDDING_SCHEME_VERSION = 'index-retrieval-v1';

const NOVA2_MODEL_PATTERN = /^amazon\.nova-2-multimodal-embeddings-v(\d{1,3}):(\d{1,3})$/;

export type SkillEmbeddingGeneration = {
    modelId: string;
    dimension: number;
    region: string;
    /** Stable identity used in node keys and Redis cache keys. */
    identity: string;
    /** Neo4j property holding the vector for this generation. */
    vectorProperty: string;
    /** Neo4j property holding sha256(identity + text) for idempotent backfill. */
    keyProperty: string;
    /** Neo4j vector index over `vectorProperty`. */
    indexName: string;
};

export const isNova2EmbeddingModelId = (modelId: string): boolean =>
    NOVA2_MODEL_PATTERN.test(modelId);

export const isSupportedSkillEmbeddingDimension = (dimension: number): boolean =>
    (NOVA2_EMBEDDING_DIMENSIONS as readonly number[]).includes(dimension);

export const resolveSkillEmbeddingGeneration = (input: {
    modelId: string;
    dimension: number;
    region: string;
}): SkillEmbeddingGeneration => {
    const match = NOVA2_MODEL_PATTERN.exec(input.modelId);

    if (!match) throw new Error('Unsupported skill embedding model');
    if (!isSupportedSkillEmbeddingDimension(input.dimension)) {
        throw new Error('Unsupported skill embedding dimension');
    }

    // Only digits from the validated model ID and dimension reach Cypher identifiers.
    const slug = `nova2_v${match[1]}_${match[2]}_d${input.dimension}`;

    return {
        modelId: input.modelId,
        dimension: input.dimension,
        region: input.region,
        identity: `${input.modelId}|${input.dimension}|${SKILL_EMBEDDING_SCHEME_VERSION}`,
        vectorProperty: `embedding_${slug}`,
        keyProperty: `embedding_${slug}_key`,
        indexName: `skill_embedding_${slug}_idx`,
    };
};

/** Cypher for the generation's vector index; idempotent so it is safe on every startup. */
export const buildSkillEmbeddingVectorIndexQuery = (generation: SkillEmbeddingGeneration): string =>
    `CREATE VECTOR INDEX ${generation.indexName} IF NOT EXISTS FOR (s:Skill) ON (s.${generation.vectorProperty}) OPTIONS {indexConfig: {\`vector.dimensions\`: ${generation.dimension}, \`vector.similarity_function\`: 'cosine'}}`;

/** Build the Cypher that writes one generation's vector and key (shared with the seed path). */
export const buildSkillEmbeddingUpdateQuery = (
    generation: SkillEmbeddingGeneration,
    scopedToFramework: boolean
): string => {
    const match = scopedToFramework
        ? 'MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})'
        : 'MATCH (s:Skill {id: $skillId})';

    // Property names come from resolveSkillEmbeddingGeneration ([a-z0-9_] only).
    return `${match}
             SET s.${generation.vectorProperty} = $embedding,
                 s.${generation.keyProperty} = $embeddingKey
             RETURN count(s) AS count`;
};

/** Legacy Google gemini-embedding-001 (768-dim) index; kept read-only for rollback, never queried. */
export const LEGACY_GOOGLE_SKILL_EMBEDDING_INDEX = 'skill_embedding_vector_idx';
export const LEGACY_GOOGLE_SKILL_EMBEDDING_PROPERTY = 'embedding';

/**
 * Staging and production Lambdas do not set NODE_ENV, so a Lambda that is not running under
 * serverless-offline also counts as deployed.
 */
export const isDeployedRuntime = (environment: {
    NODE_ENV?: string;
    IS_OFFLINE?: boolean;
    AWS_LAMBDA_FUNCTION_NAME?: string;
}): boolean =>
    !environment.IS_OFFLINE &&
    (environment.NODE_ENV === 'production' || Boolean(environment.AWS_LAMBDA_FUNCTION_NAME));
