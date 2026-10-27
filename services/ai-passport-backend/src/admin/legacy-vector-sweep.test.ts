import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';

// Real Mongo transactions and a real local Qdrant with synthetic seed data.
// Consent is injected; no LearnCard, provider or network call is made.
const fixture = `legacy_sweep_${randomUUID().replaceAll('-', '')}`;
process.env.MONGO_DB = fixture;
process.env.REDIS_PREFIX = fixture;
const owner = `did:example:${fixture}`;
const other = `did:example:other_${fixture}`;
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
const actualCollections = await import('../constants/collections');
mock.module('../constants/collections', () => ({
    ...actualCollections,
    CREDENTIAL_COLLECTION_PREFIXES: credentialCollections,
    EMBEDDINGS_COLLECTION: messageCollection,
    vectorInventory: inventory,
    legacyVectorInventory: legacy,
}));

const { db } = await import('../db');
const { getQdrantClient } = await import('../db/qdrant');
const { sweepLegacyVectors } = await import('./legacy-vector-sweep');
const { runWithAiPrivacyContext } = await import('../ai/privacy');
const { withOwnerOperation } = await import('../services/dataErasure');
const { default: cache } = await import('../utils/cache');
const client = getQdrantClient();
const mongo = new MongoClient(process.env.MONGO_URI!);
await mongo.connect();
const persisted = mongo.db(fixture);

const full = legacy[0].collection;
const domain = legacy[1].collection;
const messages = messageCollection;
const novaFull = full + NOVA;
const vector = [1, 0, 0, 0];

async function seedPoint(
    collection: string,
    payload: Record<string, unknown>,
    id: string = randomUUID()
) {
    await client.upsert(collection, {
        points: [{ id, vector, payload }],
        wait: true,
    });
    return id;
}
async function live(collection: string) {
    const { points } = await client.scroll(collection, {
        filter: { must_not: [{ key: 'erased', match: { value: true } }] },
        limit: 1000,
        with_payload: true,
        with_vector: false,
    });
    return points;
}
async function liveLegacyCount() {
    let total = 0;
    for (const { collection } of legacy) total += (await live(collection)).length;
    return total;
}
async function ledger() {
    return persisted
        .collection('owner_vector_references')
        .find(
            {},
            {
                projection: {
                    _id: 0,
                    collection: 1,
                    pointId: 1,
                    deleted: 1,
                    cleanupComplete: 1,
                },
            }
        )
        .toArray();
}

let shared: Set<string> | undefined;
const consent = async (did: string) => {
    expect(did).toBe(owner);
    return shared ? new Set(shared) : undefined;
};
const ids: Record<string, string> = {};

beforeEach(async () => {
    for (const collection of await persisted.collections()) await collection.deleteMany({});
    for (const { collection } of inventory) {
        if ((await client.collectionExists(collection)).exists)
            await client.deleteCollection(collection);
        await client.createCollection(collection, {
            vectors: { size: 4, distance: 'Dot' },
        });
    }
    shared = new Set(['lc:shared', 'lc:current']);
    // Mongo seed: three of four credential sources still exist, one thread does.
    await persisted.collection('credentials').insertMany([
        { did: owner, uri: 'lc:shared', embeddingEpoch: 'epoch-shared' },
        { did: owner, uri: 'lc:unshared', embeddingEpoch: 'epoch-unshared' },
        { did: owner, uri: 'lc:unshared-current', embeddingEpoch: 'epoch-current' },
        { did: owner, uri: 'lc:current', embeddingEpoch: 'epoch-c' },
    ]);
    await persisted.collection('threads').insertOne({ did: owner, id: 'thread-live' });
    // Qdrant seed (legacy openai1536 collections).
    ids.shared = await seedPoint(full, { did: owner, uri: 'lc:shared' });
    ids.unshared = await seedPoint(full, { did: owner, uri: 'lc:unshared' });
    ids.unsharedDomain = await seedPoint(domain, {
        did: owner,
        uri: 'lc:unshared',
    });
    ids.unsharedCurrent = await seedPoint(full, {
        did: owner,
        uri: 'lc:unshared-current',
        sourceEpoch: 'epoch-current',
    });
    ids.missing = await seedPoint(full, { did: owner, uri: 'lc:gone' });
    ids.unowned = await seedPoint(full, { uri: 'lc:gone' });
    ids.threadLive = await seedPoint(messages, {
        userId: owner,
        threadId: 'thread-live',
        messageId: 'm1',
    });
    ids.threadGone = await seedPoint(messages, {
        userId: owner,
        threadId: 'thread-gone',
        messageId: 'm2',
    });
    // Nova point for the deleted source: the sweep must never touch Nova.
    ids.nova = await seedPoint(novaFull, { did: owner, uri: 'lc:gone' });
});
afterAll(async () => {
    for (const { collection } of inventory)
        if ((await client.collectionExists(collection)).exists)
            await client.deleteCollection(collection);
    await persisted.dropDatabase();
    await mongo.close();
    await cache.redis?.quit();
});

const all = (
    apply: boolean,
    extra: Parameters<typeof sweepLegacyVectors>[0] extends infer T ? Partial<T> : never = {}
) => sweepLegacyVectors({ apply, pages: 8, consent, ...extra });

test('the dry run reports candidates by reason and writes nothing', async () => {
    const before = await liveLegacyCount();
    const report = await all(false);
    expect(report.done).toBe(true);
    expect(report.scanned).toBe(8);
    expect(report.candidates).toEqual({
        source_missing: 1,
        unshared: 2,
        thread_missing: 1,
    });
    expect(report.fenced).toEqual({
        source_missing: 0,
        unshared: 0,
        thread_missing: 0,
    });
    expect(report.kept).toBe(2);
    expect(report.skipped).toMatchObject({
        unattributable: 1,
        current_incarnation: 1,
    });
    expect(await liveLegacyCount()).toBe(before);
    expect(await ledger()).toEqual([]);
    console.log(
        `[sweep dry run] live legacy points before=${before} after=${await liveLegacyCount()} candidates=${JSON.stringify(report.candidates)}`
    );
});

test('applying fences exactly the candidates, keeps tombstones and a ledger, and a rerun finds nothing', async () => {
    const before = await liveLegacyCount();
    const novaBefore = (await live(novaFull)).length;
    const report = await all(true);
    expect(report.fenced).toEqual({
        source_missing: 1,
        unshared: 2,
        thread_missing: 1,
    });
    expect(report.keptOnRecheck).toBe(0);
    const after = await liveLegacyCount();
    expect(after).toBe(before - 4);
    const remaining = new Set([
        ...(await live(full)).map(p => p.id),
        ...(await live(domain)).map(p => p.id),
        ...(await live(messages)).map(p => p.id),
    ]);
    for (const id of [ids.shared, ids.unsharedCurrent, ids.unowned, ids.threadLive])
        expect(remaining.has(id)).toBe(true);
    for (const id of [ids.unshared, ids.unsharedDomain, ids.missing, ids.threadGone])
        expect(remaining.has(id)).toBe(false);
    // Tombstones: empty vector, erased payload.
    const [tombstone] = await client.retrieve(full, {
        ids: [ids.missing],
        with_payload: true,
        with_vector: true,
    });
    expect(tombstone.payload).toEqual({ erased: true });
    // Fence ledger: permanent deleted references, acknowledged.
    const rows = await ledger();
    expect(rows).toHaveLength(4);
    expect(rows.every(row => row.deleted === true && row.cleanupComplete === true)).toBe(true);
    expect((await live(novaFull)).length).toBe(novaBefore);
    console.log(
        `[sweep apply] live legacy points before=${before} after=${after} fenced=${JSON.stringify(report.fenced)} ledger=${rows.length} nova before=${novaBefore} after=${(await live(novaFull)).length}`
    );

    const again = await all(true);
    expect(again.candidates).toEqual({
        source_missing: 0,
        unshared: 0,
        thread_missing: 0,
    });
    expect(again.fenced).toEqual({
        source_missing: 0,
        unshared: 0,
        thread_missing: 0,
    });
    expect(await liveLegacyCount()).toBe(after);
    expect(await ledger()).toHaveLength(4);
});

test('consent re-granted or a source restored between classification and apply is not deleted', async () => {
    const report = await all(true, {
        beforeApply: async collection => {
            if (collection !== full) return;
            shared = new Set(['lc:shared', 'lc:current', 'lc:unshared']);
            await persisted
                .collection('credentials')
                .updateOne(
                    { did: owner, uri: 'lc:gone' },
                    { $set: { did: owner, uri: 'lc:gone', embeddingEpoch: 'epoch-new' } },
                    { upsert: true }
                );
        },
    });
    // Both candidates in the first collection are rechecked and kept.
    expect(report.byCollection[full]).toEqual({
        scanned: 5,
        candidates: 2,
        fenced: 0,
    });
    expect(report.keptOnRecheck).toBe(2);
    expect(report.fenced.unshared + report.fenced.source_missing).toBe(0);
    const remaining = new Set((await live(full)).map(p => p.id));
    expect(remaining.has(ids.unshared)).toBe(true);
    expect(remaining.has(ids.missing)).toBe(true);
});

test('a thread recreated between classification and apply is not deleted', async () => {
    const report = await all(true, {
        beforeApply: async collection => {
            if (collection !== messages) return;
            await persisted.collection('threads').insertOne({ did: owner, id: 'thread-gone' });
        },
    });
    expect(report.candidates.thread_missing).toBe(1);
    expect(report.fenced.thread_missing).toBe(0);
    expect((await live(messages)).some(p => p.id === ids.threadGone)).toBe(true);
});

test('without a current consent receipt nothing is swept as unshared; deleted sources still are', async () => {
    shared = undefined;
    const report = await all(true);
    expect(report.skipped.consent_unavailable).toBe(4);
    expect(report.fenced).toEqual({
        source_missing: 1,
        unshared: 0,
        thread_missing: 1,
    });
    const remaining = new Set((await live(full)).map(p => p.id));
    expect(remaining.has(ids.unshared)).toBe(true);
    expect(remaining.has(ids.missing)).toBe(false);
});

test('a point registered to another owner is never swept', async () => {
    await runWithAiPrivacyContext(other, () =>
        withOwnerOperation(other, () => db.registerVectorPoints(other, full, [ids.missing]))
    );
    const report = await all(true);
    expect(report.skipped.ownership_conflict).toBeGreaterThan(0);
    expect((await live(full)).some(p => p.id === ids.missing)).toBe(true);
    const rows = await ledger();
    expect(rows.filter(row => row.pointId === ids.missing && row.deleted)).toEqual([]);
});

test('pages are bounded and the cursor resumes where the last call stopped', async () => {
    const extra = [];
    for (let index = 0; index < 300; index += 1)
        extra.push({
            id: randomUUID(),
            vector,
            payload: { did: owner, uri: 'lc:gone' },
        });
    await client.upsert(full, { points: extra, wait: true });
    const first = await sweepLegacyVectors({ apply: false, pages: 1, consent });
    expect(first.scanned).toBe(256);
    expect(first.done).toBe(false);
    expect(first.cursor?.collectionIndex).toBe(0);
    expect(first.cursor?.offset).toBeDefined();
    let cursor = first.cursor;
    let scanned = first.scanned;
    let calls = 1;
    while (cursor) {
        const next = await sweepLegacyVectors({
            apply: false,
            pages: 1,
            consent,
            cursor,
        });
        scanned += next.scanned;
        cursor = next.cursor;
        calls += 1;
        expect(calls).toBeLessThan(20);
    }
    expect(scanned).toBe(308);
    await expect(sweepLegacyVectors({ apply: false, pages: 9, consent })).rejects.toThrow(
        'page limit'
    );
    await expect(
        sweepLegacyVectors({
            apply: false,
            consent,
            cursor: { collectionIndex: 99 },
        })
    ).rejects.toThrow('cursor');
});
