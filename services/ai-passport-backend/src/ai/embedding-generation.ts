import { AsyncLocalStorage } from 'node:async_hooks';
export type EmbeddingGeneration = 'openai1536' | 'nova1024v1';
export const NOVA_MODEL = 'amazon.nova-2-multimodal-embeddings-v1:0';
// v1 identifies the existing five-view projection + managed privacy preprocessing,
// GENERIC_INDEX/TEXT_RETRIEVAL purposes, NONE truncation and 1024 dimensions.
export const NOVA_IDENTITY = 'nova2-text-1024-index-retrieval-privacy-v1';
const scope = new AsyncLocalStorage<EmbeddingGeneration>();
export function activeGeneration(): EmbeddingGeneration {
    const value = process.env.EMBEDDINGS_READ_GENERATION ?? 'openai1536';
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
export const writeGenerations = (): EmbeddingGeneration[] => {
    if (process.env.EMBEDDINGS_DUAL_WRITE === 'true') return ['openai1536', 'nova1024v1'];
    const value = process.env.EMBEDDINGS_WRITE_GENERATION ?? 'openai1536';
    if (value !== 'openai1536' && value !== 'nova1024v1')
        throw new Error('Unknown embedding write generation');
    return [value];
};
export function assertNovaEnabled() {
    if (process.env.BEDROCK_EMBEDDINGS_ENABLED !== 'true')
        throw new Error('Bedrock embeddings are disabled');
}
// Retirement configuration: Nova-only writes. From here on openai1536 copies
// go stale, so reads never fall back to them (rollback is a #98 build).
export const legacyWritesRetired = (): boolean => !writeGenerations().includes('openai1536');
