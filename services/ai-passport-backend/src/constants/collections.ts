import { QDRANT_PREFIX } from './env';
import {
    currentGeneration,
    generationDimensions,
    type EmbeddingGeneration,
} from '../ai/embedding-generation';
const namespace = (name: string) => `${QDRANT_PREFIX}__${name}`;
export const collectionForGeneration = (name: string, generation: EmbeddingGeneration) =>
    generation === 'openai1536' || name.endsWith('__nova2_text1024_privacy_v1')
        ? name
        : `${name}__nova2_text1024_privacy_v1`;
// Legacy logical names stay stable; the storage boundary resolves a generation.
export const EMBEDDINGS_COLLECTION = namespace('chat_embeddings');
export const EMBEDDINGS_DIMENSION = generationDimensions(currentGeneration());
export const CREDENTIAL_COLLECTION_PREFIXES = {
    FULL_TEXT: namespace('credential_full_text'),
    DOMAIN_SUMMARY: namespace('credential_domain_summary'),
    KEY_CLAIMS: namespace('credential_key_claims'),
    TECHNICAL_METADATA: namespace('credential_technical_metadata'),
    COMPARISON_CONTEXT: namespace('credential_comparison_context'),
};
export const vectorInventory = ['openai1536', 'nova1024v1'].flatMap(g => [
    ...Object.values(CREDENTIAL_COLLECTION_PREFIXES).map(name => ({
        collection: collectionForGeneration(name, g as EmbeddingGeneration),
        ownerField: 'did' as const,
    })),
    {
        collection: collectionForGeneration(EMBEDDINGS_COLLECTION, g as EmbeddingGeneration),
        ownerField: 'userId' as const,
    },
]);
// The six openai1536 collections that the legacy sweep and the explicit drop
// action may touch. Nova collections are never listed here.
export const legacyVectorInventory = vectorInventory.filter(
    entry => !entry.collection.endsWith('__nova2_text1024_privacy_v1')
);
export const resolveVectorCollection = (name: string) =>
    collectionForGeneration(name, currentGeneration());
