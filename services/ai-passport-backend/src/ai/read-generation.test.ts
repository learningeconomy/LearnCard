import { expect, mock, test } from 'bun:test';
import {
    currentGeneration,
    generationDimensions,
    embeddingCacheIdentity,
    writeGenerations,
    withEmbeddingGeneration,
} from './embedding-generation';
import { resolveVectorCollection, EMBEDDINGS_COLLECTION } from '../constants/collections';
process.env.EMBEDDINGS_LAUNCHDARKLY_ENABLED = 'true';
process.env.EMBEDDINGS_LAUNCHDARKLY_SDK_KEY = 'synthetic-key';
process.env.EMBEDDINGS_FLAG_ENVIRONMENT = 'test';
process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
// The LaunchDarkly read switch is a migration control: start from legacy reads and writes.
process.env.EMBEDDINGS_PROVIDER = 'openai';
let value = 'openai1536',
    evaluations = 0,
    release!: (value: void) => void,
    pause = false;
mock.module('@launchdarkly/node-server-sdk', () => ({
    init: () => ({
        waitForInitialization: async () => {},
        variationDetail: async () => {
            evaluations += 1;
            return { value, reason: { kind: 'OFF' } };
        },
        close() {},
    }),
}));
mock.module('./client', () => ({
    aiCall: async () => {
        throw new Error('offline test');
    },
    streamingAiCall: async () => {
        throw new Error('offline test');
    },
    streamingStructuredAiCall: async () => {
        throw new Error('offline test');
    },
    embeddingAiCall: async () => {
        const generation = currentGeneration();
        if (pause) await new Promise<void>(resolve => (release = resolve));
        return [Array(generationDimensions(generation)).fill(0)];
    },
}));
mock.module('../db/qdrant', () => ({
    CREDENTIAL_VECTOR_COLLECTION_COUNT: 5,
    getCredentialVectorCoverage: async () => new Map(),
    getQdrantClient: () => {
        throw new Error('offline test');
    },
    assertQdrantPrivacyCapabilities: async () => {},
    checkQdrantHealth: async () => true,
    recoverSourceVectorCleanup: async () => {},
    fenceDeletedSourceVectors: async () => {},
    deleteCredentialEmbeddings: async () => {},
    deleteThreadEmbeddings: async () => {},
    exportOwnerVectors: async () => [],
    deleteOwnerVectors: async () => {},
    migrateLegacyVectorPayloads: async () => {},
    createCollectionIfNotExists: async () => {},
    storeEmbeddings: async () => {},
    searchSimilar: async (collection: string, vector: number[]) => {
        expect(vector.length).toBe(generationDimensions(currentGeneration()));
        return [
            {
                id: 'synthetic',
                score: 1,
                payload: {
                    collection: resolveVectorCollection(collection),
                    generation: currentGeneration(),
                },
            },
        ];
    },
}));
const { withSearchGeneration, closeReadGenerationControl } = await import('./read-generation');
const { findSimilarText } = await import('./embeddings');
test('in-flight query embedding and index stay pinned across flag flips; later searches switch', async () => {
    pause = true;
    const first = findSimilarText('synthetic query');
    while (!release) await new Promise(resolve => setTimeout(resolve, 0));
    value = 'nova1024v1';
    pause = false;
    release();
    expect(await first).toEqual([
        {
            id: 'synthetic',
            score: 1,
            payload: { collection: EMBEDDINGS_COLLECTION, generation: 'openai1536' },
        },
    ]);
    expect(await findSimilarText('next synthetic query')).toEqual([
        {
            id: 'synthetic',
            score: 1,
            payload: {
                collection: EMBEDDINGS_COLLECTION + '__nova2_text1024_privacy_v1',
                generation: 'nova1024v1',
            },
        },
    ]);
    expect(evaluations).toBe(2);
});
test('async subcalls reuse one decision, cache identities separate and write policy is independent', async () => {
    const identities: string[] = [];
    value = 'openai1536';
    await withSearchGeneration(async () => {
        identities.push(embeddingCacheIdentity());
        value = 'nova1024v1';
        await Promise.all([
            withSearchGeneration(async () => expect(currentGeneration()).toBe('openai1536')),
            Promise.resolve().then(() => expect(currentGeneration()).toBe('openai1536')),
        ]);
    });
    await withSearchGeneration(async () => {
        identities.push(embeddingCacheIdentity());
        expect(currentGeneration()).toBe('nova1024v1');
        expect(writeGenerations()).toEqual(['openai1536']);
    });
    expect(identities[0]).not.toBe(identities[1]);
    process.env.EMBEDDINGS_DUAL_WRITE = 'true';
    await withEmbeddingGeneration('nova1024v1', async () =>
        expect(writeGenerations()).toEqual(['openai1536', 'nova1024v1'])
    );
    delete process.env.EMBEDDINGS_DUAL_WRITE;
    await closeReadGenerationControl();
});
