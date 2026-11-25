import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';

// Real Mongo and a real local Qdrant with synthetic collections. Nothing here
// runs automatically in a deployment; the drop is only reachable from the
// explicit admin endpoint.
const fixture = `legacy_retire_${randomUUID().replaceAll('-', '')}`;
process.env.MONGO_DB = fixture;
process.env.REDIS_PREFIX = fixture;
const owner = `did:example:${fixture}`;
const credentialCollections = {
    FULL_TEXT: `${fixture}_full`,
    DOMAIN_SUMMARY: `${fixture}_domain`,
    KEY_CLAIMS: `${fixture}_claims`,
    TECHNICAL_METADATA: `${fixture}_technical`,
    COMPARISON_CONTEXT: `${fixture}_comparison`,
};
const messageCollection = `${fixture}_messages`;
const NOVA = '__nova2_text1024_privacy_v1';
const inventory = ['', NOVA].flatMap(suffix => [
    ...Object.values(credentialCollections).map(collection => ({
        collection: collection + suffix,
        ownerField: 'did' as const,
    })),
    { collection: messageCollection + suffix, ownerField: 'userId' as const },
]);
const legacy = inventory.filter(entry => !entry.collection.endsWith(NOVA));
const nova = inventory.filter(entry => entry.collection.endsWith(NOVA));
const actualCollections = await import('../constants/collections');
mock.module('../constants/collections', () => ({
    ...actualCollections,
    CREDENTIAL_COLLECTION_PREFIXES: credentialCollections,
    EMBEDDINGS_COLLECTION: messageCollection,
    vectorInventory: inventory,
    legacyVectorInventory: legacy,
}));

const { db } = await import('../db');
const { getQdrantClient, createCollectionIfNotExists, recoverSourceVectorCleanup } =
    await import('../db/qdrant');
const { dropLegacyCollections, dropConfirmation, legacyRetirementStatus } =
    await import('./legacy-retirement');
const { withEmbeddingGeneration } = await import('../ai/embedding-generation');
const { runWithAiPrivacyContext } = await import('../ai/privacy');
const { withOwnerOperation } = await import('../services/dataErasure');
const { getPrivacySubjectRef } = await import('../ai/privacy-keys');
const { default: cache } = await import('../utils/cache');
const client = getQdrantClient();
const mongo = new MongoClient(process.env.MONGO_URI!);
await mongo.connect();
const persisted = mongo.db(fixture);
const names = legacy.map(({ collection }) => collection);

const retiredEnv = {
    EMBEDDINGS_WRITE_GENERATION: 'nova1024v1',
    EMBEDDINGS_READ_GENERATION: 'nova1024v1',
    BEDROCK_EMBEDDINGS_ENABLED: 'true',
    EMBEDDINGS_DUAL_WRITE: undefined,
    EMBEDDINGS_LAUNCHDARKLY_ENABLED: undefined,
};
const setEnv = (values: Record<string, string | undefined>) => {
    for (const [key, value] of Object.entries(values))
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
};

beforeEach(async () => {
    setEnv(retiredEnv);
    for (const collection of await persisted.collections()) await collection.deleteMany({});
    for (const { collection } of inventory) {
        if ((await client.collectionExists(collection)).exists)
            await client.deleteCollection(collection);
        await client.createCollection(collection, {
            vectors: { size: 4, distance: 'Dot' },
        });
        await client.upsert(collection, {
            points: [
                {
                    id: randomUUID(),
                    vector: [1, 0, 0, 0],
                    payload: { did: owner, userId: owner },
                },
            ],
            wait: true,
        });
    }
});
afterAll(async () => {
    for (const { collection } of inventory)
        if ((await client.collectionExists(collection)).exists)
            await client.deleteCollection(collection);
    await persisted.dropDatabase();
    await mongo.close();
    await cache.redis?.quit();
});

const exists = async (collection: string) => (await client.collectionExists(collection)).exists;

test('the drop needs the exact collection list and confirmation phrase', async () => {
    for (const [list, phrase] of [
        [names, 'drop legacy collections'],
        [names.slice(1), dropConfirmation()],
        [[...names.slice(1), nova[0].collection], dropConfirmation()],
    ] as const)
        await expect(dropLegacyCollections([...list], phrase)).rejects.toThrow(
            'exact legacy collection list'
        );
    for (const name of names) expect(await exists(name)).toBe(true);
});

test('the drop refuses while legacy writes, dual writes or pending cleanup remain', async () => {
    setEnv({ EMBEDDINGS_DUAL_WRITE: 'true' });
    await expect(dropLegacyCollections(names, dropConfirmation())).rejects.toThrow(
        'legacyWritesRetired, dualWriteOff'
    );
    setEnv(retiredEnv);
    await persisted.collection('owner_vector_references').insertOne({
        subjectRef: getPrivacySubjectRef(owner),
        collection: nova[0].collection,
        pointId: randomUUID(),
        deleted: true,
    });
    await expect(dropLegacyCollections(names, dropConfirmation())).rejects.toThrow(
        'cleanupDrained'
    );
    for (const name of names) expect(await exists(name)).toBe(true);
});

test('an approved drop removes only the six legacy collections and they cannot come back', async () => {
    const before = await legacyRetirementStatus();
    expect(before.ready).toBe(true);
    expect(before.collections.map(entry => entry.points)).toEqual(names.map(() => 1));
    const result = await dropLegacyCollections([...names].reverse(), dropConfirmation());
    expect(result.dropped).toEqual(
        names.map(collection => ({ collection, points: 1, existed: true }))
    );
    for (const name of names) expect(await exists(name)).toBe(false);
    for (const { collection } of nova) expect(await exists(collection)).toBe(true);
    const after = await legacyRetirementStatus();
    expect(after.collections.every(entry => entry.retired === 'dropped' && !entry.exists)).toBe(
        true
    );
    console.log(
        `[legacy drop] legacy collections before=${before.collections.filter(c => c.exists).length} after=${after.collections.filter(c => c.exists).length}; nova collections kept=${nova.length}`
    );
    // Repeating is harmless.
    expect(
        (await dropLegacyCollections(names, dropConfirmation())).dropped.every(
            entry => !entry.existed
        )
    ).toBe(true);
    // A legacy write path cannot recreate a dropped collection.
    await expect(
        withEmbeddingGeneration('openai1536', () =>
            createCollectionIfNotExists(credentialCollections.FULL_TEXT, 4)
        )
    ).rejects.toThrow('retired');
    expect(await exists(names[0])).toBe(false);
    // Cleanup for a reference in a dropped collection completes without it.
    await runWithAiPrivacyContext(owner, () =>
        withOwnerOperation(owner, () =>
            db.queueSourceVectorCleanup(owner, 'credential', ['lc:dropped'])
        )
    );
    await persisted.collection('owner_vector_references').insertOne({
        subjectRef: getPrivacySubjectRef(owner),
        collection: names[0],
        pointId: randomUUID(),
        deleted: true,
    });
    const cleanup = await recoverSourceVectorCleanup({ did: owner, limit: 32 });
    expect(cleanup).toMatchObject({ pendingPoints: 0, pendingTasks: 0 });
});
