import { AsyncLocalStorage } from 'node:async_hooks';
export type EmbeddingGeneration = 'openai1536' | 'nova1024v1';
export const NOVA_MODEL = 'amazon.nova-2-multimodal-embeddings-v1:0';
// v1 identifies the existing five-view projection + managed privacy preprocessing,
// GENERIC_INDEX/TEXT_RETRIEVAL purposes, NONE truncation and 1024 dimensions.
export const NOVA_IDENTITY = 'nova2-text-1024-index-retrieval-privacy-v1';
const scope = new AsyncLocalStorage<EmbeddingGeneration>();
// EMBEDDINGS_PROVIDER picks the defaults below and nothing else: bedrock (the
// default) reads and writes nova1024v1, openai reads and writes openai1536.
// Unset, it follows LLM_PROVIDER, so LLM_PROVIDER=openai local dev still runs on
// OPENAI_API_KEY alone; deployed Fly apps must use LLM_PROVIDER=bedrock.
// EMBEDDINGS_READ_GENERATION, EMBEDDINGS_WRITE_GENERATION, EMBEDDINGS_DUAL_WRITE
// and BEDROCK_EMBEDDINGS_ENABLED still override them, so every caller resolves
// one generation (model, dimensions, collection) and the two can never disagree.
// Startup (validateAiProviderEnvironment) rejects unknown values.
export const defaultEmbeddingGeneration = (
    environment: NodeJS.ProcessEnv = process.env
): EmbeddingGeneration =>
    (environment.EMBEDDINGS_PROVIDER?.trim() || environment.LLM_PROVIDER?.trim())?.toLowerCase() ===
    'openai'
        ? 'openai1536'
        : 'nova1024v1';
const parseGeneration = (value: string | undefined, fallback: EmbeddingGeneration) =>
    value?.trim() ? value.trim() : fallback;
export function activeGeneration(
    environment: NodeJS.ProcessEnv = process.env
): EmbeddingGeneration {
    const value = parseGeneration(
        environment.EMBEDDINGS_READ_GENERATION,
        defaultEmbeddingGeneration(environment)
    );
    if (value !== 'openai1536' && value !== 'nova1024v1')
        throw new Error('Unknown embedding generation');
    return value;
}
export const pinnedEmbeddingGeneration = () => scope.getStore();
export const embeddingCacheIdentity = () =>
    `${currentGeneration()}:${currentGeneration() === 'nova1024v1' ? NOVA_IDENTITY : 'openai1536-v1'}`;
export const currentGeneration = () => scope.getStore() ?? activeGeneration();
export const withEmbeddingGeneration = <T>(generation: EmbeddingGeneration, fn: () => T): T =>
    scope.run(generation, fn);
export const generationDimensions = (generation: EmbeddingGeneration) =>
    generation === 'nova1024v1' ? 1024 : 1536;
export const writeGenerations = (
    environment: NodeJS.ProcessEnv = process.env
): EmbeddingGeneration[] => {
    if (environment.EMBEDDINGS_DUAL_WRITE === 'true') return ['openai1536', 'nova1024v1'];
    const value = parseGeneration(
        environment.EMBEDDINGS_WRITE_GENERATION,
        defaultEmbeddingGeneration(environment)
    );
    if (value !== 'openai1536' && value !== 'nova1024v1')
        throw new Error('Unknown embedding write generation');
    return [value];
};
/**
 * Nova calls are allowed when BEDROCK_EMBEDDINGS_ENABLED=true, or when it is
 * unset and EMBEDDINGS_PROVIDER is bedrock (the default). Any other explicit
 * value (e.g. false) stays a kill switch.
 */
export const novaEmbeddingsEnabled = (environment: NodeJS.ProcessEnv = process.env): boolean => {
    const value = environment.BEDROCK_EMBEDDINGS_ENABLED?.trim();
    return value ? value === 'true' : defaultEmbeddingGeneration(environment) === 'nova1024v1';
};
export function assertNovaEnabled() {
    if (!novaEmbeddingsEnabled()) throw new Error('Bedrock embeddings are disabled');
}
// Retirement configuration: Nova-only writes. From here on openai1536 copies
// go stale, so reads never fall back to them (rollback is a #98 build). This is
// also the default (EMBEDDINGS_PROVIDER=bedrock with no overrides).
export const legacyWritesRetired = (environment: NodeJS.ProcessEnv = process.env): boolean =>
    !writeGenerations(environment).includes('openai1536');
