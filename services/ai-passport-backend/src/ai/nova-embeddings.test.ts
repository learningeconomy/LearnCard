import { expect, test } from 'bun:test';
import { novaPayload, novaVector } from './nova-embeddings';
import {
    withEmbeddingGeneration,
    currentGeneration,
    assertNovaEnabled,
} from './embedding-generation';
import {
    vectorInventory,
    resolveVectorCollection,
    EMBEDDINGS_COLLECTION,
} from '../constants/collections';
test('pilot-compatible explicit wire identity and strict vector parsing', () => {
    expect(novaPayload('text', 'document').singleEmbeddingParams).toMatchObject({
        embeddingPurpose: 'GENERIC_INDEX',
        embeddingDimension: 1024,
        text: { truncationMode: 'NONE' },
    });
    expect(novaPayload('text', 'query').singleEmbeddingParams.embeddingPurpose).toBe(
        'TEXT_RETRIEVAL'
    );
    expect(() => novaPayload('é'.repeat(2049), 'document')).toThrow();
    expect(() => novaPayload(' ', 'document')).toThrow();
    const envelope = {
        embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
    };
    expect(novaVector(envelope)[0]).toBe(1 / 32);
    for (const value of [
        { embeddings: [] },
        { embeddings: [{ ...envelope.embeddings[0], truncatedCharLength: 0 }] },
        {
            embeddings: [{ ...envelope.embeddings[0], embedding: Array(1536).fill(1) }],
        },
        {
            embeddings: [{ ...envelope.embeddings[0], embedding: Array(1024).fill(0) }],
        },
        {
            embeddings: [{ ...envelope.embeddings[0], embedding: Array(1024).fill(NaN) }],
        },
    ])
        expect(() => novaVector(value)).toThrow();
});
test('generation scope isolates target storage; erasure inventory includes both generations', async () => {
    expect(vectorInventory).toHaveLength(12);
    expect(new Set(vectorInventory.map(x => x.collection)).size).toBe(12);
    await withEmbeddingGeneration('nova1024v1', async () => {
        expect(currentGeneration()).toBe('nova1024v1');
        expect(resolveVectorCollection(EMBEDDINGS_COLLECTION)).toContain(
            'nova2_text1024_privacy_v1'
        );
    });
    expect(resolveVectorCollection(EMBEDDINGS_COLLECTION)).toBe(EMBEDDINGS_COLLECTION);
    delete process.env.BEDROCK_EMBEDDINGS_ENABLED;
    expect(() => assertNovaEnabled()).toThrow();
});
