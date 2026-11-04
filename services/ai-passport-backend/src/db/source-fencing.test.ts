import { afterAll, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import type { VC } from '@learncard/types';
import type { DBCredentialRecord } from '.';
import { currentGeneration, generationDimensions } from '../ai/embedding-generation';

// Real Mongo transactions, Redis admission leases and Qdrant conditional upserts.
// Only consent lookup and model computation are synthetic; no provider is called.
const fixture = `source_fence_${randomUUID().replaceAll('-', '')}`;
process.env.MONGO_DB = fixture;
process.env.REDIS_PREFIX = fixture;
const owner = `did:example:${fixture}`;
const uri = 'lc:synthetic:source';
const collections = {
    FULL_TEXT: `${fixture}_full`,
    DOMAIN_SUMMARY: `${fixture}_domain`,
    KEY_CLAIMS: `${fixture}_claims`,
    TECHNICAL_METADATA: `${fixture}_technical`,
    COMPARISON_CONTEXT: `${fixture}_comparison`,
};
const messageCollection = `${fixture}_messages`;
const inventory = ['', '__nova'].flatMap(suffix => [
    ...Object.values(collections).map(collection => ({
        collection: collection + suffix,
        ownerField: 'did',
    })),
    { collection: messageCollection + suffix, ownerField: 'userId' },
]);
mock.module('../constants/collections', () => ({
    CREDENTIAL_COLLECTION_PREFIXES: collections,
    EMBEDDINGS_COLLECTION: messageCollection,
    EMBEDDINGS_DIMENSION: 1536,
    vectorInventory: inventory,
    resolveVectorCollection: (name: string) =>
        currentGeneration() === 'nova1024v1' ? name + '__nova' : name,
}));
const receipt = () => ({
    contractUri: 'lc:contract:synthetic',
    receiptId: 'lc:receipt:synthetic',
    status: 'live' as const,
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: [uri],
    personalFields: [],
    guardian: { required: false, approved: false },
    purpose: 'embedding' as const,
    revision: 'r1',
});
const consent = await import('../learncard/consent');
mock.module('../learncard/consent', () => ({
    ...consent,
    loadActiveAiConsentData: async () => ({ records: [], receipt: receipt() }),
}));
const learncard = await import('../learncard');
mock.module('../learncard', () => ({
    ...learncard,
    getLearnCard: async () => ({}),
}));
const privacy = await import('../ai/privacy');
mock.module('../ai/privacy', () => ({
    ...privacy,
    assertCurrentAiConsent: async () => {
        if (privacy.getCurrentAiSubject() !== owner) throw new Error('Owner required');
        return receipt();
    },
}));
const actualClient = await import('../ai/client');
mock.module('../ai/client', () => ({
    ...actualClient,
    embeddingAiCall: async (texts: string[]) =>
        texts.map(() => {
            const vector = Array(generationDimensions(currentGeneration())).fill(0);
            vector[0] = 1;
            return vector;
        }),
}));
const { db, ChatDB } = await import('.');
const { processCredentials } = await import('../credentials/service');
const {
    getQdrantClient,
    deleteCredentialEmbeddings,
    deleteThreadEmbeddings,
    recoverSourceVectorCleanup,
    deleteOwnerVectors,
} = await import('./qdrant');
const { generateAndStoreCredentialEmbeddings } = await import('../ai/embeddings');
const { fingerprintCredential } = await import('../credentials/verification');
const { projectCredential } = await import('../credentials/projection');
const { withOwnerOperation, requestDataErasure } = await import('../services/dataErasure');
const { default: cache } = await import('../utils/cache');
const client = getQdrantClient();
const mongo = new MongoClient(process.env.MONGO_URI!);
await mongo.connect();
const persisted = mongo.db(fixture);
const run = <T>(fn: () => Promise<T>) =>
    privacy.runWithAiPrivacyContext(owner, () => withOwnerOperation(owner, fn));
const texts = {
    fullText: 'synthetic',
    domainSummary: 'synthetic',
    keyClaims: 'synthetic',
    technicalMetadata: 'synthetic',
    comparisonContext: 'synthetic',
};
function record(name = 'synthetic'): DBCredentialRecord {
    const credential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: uri,
        type: ['VerifiableCredential', 'TestCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2026-01-01T00:00:00.000Z',
        credentialSubject: { id: owner, name },
        proof: {
            created: '2026-01-01T00:00:00.000Z',
            type: 'Ed25519Signature2020',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#key-1',
            proofValue: 'synthetic',
        },
    } as VC;
    const verification = {
        credentialUri: uri,
        contentHash: fingerprintCredential(credential),
        status: 'valid' as const,
        checkedAt: '2026-01-01T00:00:00.000Z',
        verifiedPayload: 'credential' as const,
        checks: ['proof'],
        errors: [],
        warnings: [],
        verifier: { name: 'fixture', version: '1' },
        provenance: {
            source: 'wallet' as const,
            retrievedAt: '2026-01-01T00:00:00.000Z',
        },
        consent: receipt(),
    };
    return {
        id: 'synthetic',
        uri,
        category: 'Achievement',
        credential,
        rawCredentialJson: JSON.stringify(credential),
        aiContext: 'synthetic',
        createdAt: verification.checkedAt,
        verification,
        projection: projectCredential(credential, 'Achievement', verification),
    };
}
function gate() {
    let resolve!: () => void;
    const promise = new Promise<void>(r => (resolve = r));
    return { promise, resolve };
}
async function livePoints() {
    const result = [];
    for (const { collection } of inventory)
        if ((await client.collectionExists(collection)).exists) {
            let offset: string | number | undefined;
            do {
                const page = await client.scroll(collection, {
                    filter: {},
                    limit: 256,
                    with_payload: true,
                    with_vector: true,
                    ...(offset === undefined ? {} : { offset }),
                });
                result.push(...page.points.filter(point => point.payload?.erased !== true));
                for (const point of page.points.filter(point => point.payload?.erased === true)) {
                    expect(point.payload).toEqual({ erased: true });
                    expect(point.vector).toEqual({});
                }
                const next = page.next_page_offset;
                offset = typeof next === 'string' || typeof next === 'number' ? next : undefined;
            } while (offset !== undefined);
        }
    return result;
}
beforeEach(async () => {
    process.env.EMBEDDINGS_DUAL_WRITE = 'true';
    for (const collection of await persisted.collections()) await collection.deleteMany({});
    for (const { collection } of inventory)
        if ((await client.collectionExists(collection)).exists)
            await client.delete(collection, { filter: {}, wait: true });
});
afterAll(async () => {
    for (const { collection } of inventory)
        if ((await client.collectionExists(collection)).exists)
            await client.deleteCollection(collection);
    await persisted.dropDatabase();
    await mongo.close();
    await cache.redis?.quit();
});

test('new messages write no chat vectors; thread deletion still fences chat points an earlier build left in both generations', async () => {
    process.env.EMBEDDINGS_WRITE_GENERATION = 'nova1024v1';
    try {
        const thread = await run(() => db.createThread(owner));
        await run(() => db.addMessage(owner, thread, { role: 'user', content: 'synthetic' }));
        const [message] = await db.getMessages(owner, thread);
        expect(await livePoints()).toHaveLength(0);
        // Reproduce what a #98 pre-merge build registered and wrote for one message:
        // a ledger row carrying the thread reference, plus the point itself.
        const { getPrivacySubjectRef } = await import('../ai/privacy-keys');
        const { vectorSourceRef } = await import('./vector-source');
        for (const generation of ['openai1536', 'nova1024v1'] as const) {
            const collection =
                generation === 'nova1024v1' ? messageCollection + '__nova' : messageCollection;
            if (!(await client.collectionExists(collection)).exists)
                await client.createCollection(collection, {
                    vectors: { size: generationDimensions(generation), distance: 'Cosine' },
                });
            const pointId = randomUUID();
            const vector = Array(generationDimensions(generation)).fill(0);
            vector[0] = 1;
            await persisted.collection('owner_vector_references').insertOne({
                subjectRef: getPrivacySubjectRef(owner),
                collection,
                pointId,
                sourceRef: vectorSourceRef(owner, 'message', message.id),
                threadRef: vectorSourceRef(owner, 'thread', thread),
                sourceEpoch: 'earlier-build-epoch',
            });
            await client.upsert(collection, {
                wait: true,
                points: [
                    {
                        id: pointId,
                        vector,
                        payload: {
                            recordType: 'chat-message',
                            messageId: message.id,
                            threadId: thread,
                            userId: owner,
                            role: 'user',
                            consentRevision: 'r1',
                            sourceEpoch: 'earlier-build-epoch',
                        },
                    },
                ],
            });
        }
        expect(await livePoints()).toHaveLength(2);
        expect(await run(() => db.deleteThread(owner, thread))).toBe(true);
        expect(await livePoints()).toHaveLength(0);
        expect(await run(() => db.deleteThread(owner, thread))).toBe(false);
        await run(() => deleteThreadEmbeddings(owner, thread));
        expect(await livePoints()).toHaveLength(0);
    } finally {
        delete process.env.EMBEDDINGS_WRITE_GENERATION;
    }
}, 30000);

test('credential deletion after the final provenance read prevents registration; authorized reingestion gets new IDs', async () => {
    const vc = record();
    await run(() => db.storeVC(owner, vc));
    await run(() => generateAndStoreCredentialEmbeddings(vc, texts, owner));
    expect(await livePoints()).toHaveLength(10);
    const reached = gate(),
        release = gate();
    const original = db.getEmbeddingCredentialVersion.bind(db);
    const intercept = spyOn(db, 'getEmbeddingCredentialVersion').mockImplementation(
        async (...args) => {
            const version = await original(...args);
            reached.resolve();
            await release.promise;
            return version;
        }
    );
    const pending = run(() => generateAndStoreCredentialEmbeddings(vc, texts, owner)).then(
        () => 'wrote',
        () => 'rejected'
    );
    try {
        await reached.promise;
        expect(await run(() => db.deleteVCsByUris(owner, [uri]))).toBe(1);
        await run(() => deleteCredentialEmbeddings(owner, [uri]));
        release.resolve();
        expect(await pending).toBe('rejected');
        expect(await livePoints()).toHaveLength(0);
    } finally {
        release.resolve();
        await pending;
        intercept.mockRestore();
    }
    await run(() => db.storeVC(owner, vc));
    await run(() => generateAndStoreCredentialEmbeddings(vc, texts, owner));
    expect(await livePoints()).toHaveLength(10);
    // An old retry only applies permanent old-point fences, never the new incarnation.
    await run(() => deleteCredentialEmbeddings(owner, [uri]));
    expect(await livePoints()).toHaveLength(10);
    await run(() => db.deleteVCsByUris(owner, [uri]));
    await run(() => db.deleteVCsByUris(owner, [uri]));
    expect(await livePoints()).toHaveLength(0);
}, 30000);

test('registered dispatched credential writes cannot replace deletion fences, including stale workers and retries', async () => {
    const vc = record();
    await run(() => db.storeVC(owner, vc));
    const reached = gate(),
        release = gate();
    const original = client.upsert;
    client.upsert = async (collection, request) => {
        if ('points' in request && request.points.some(point => point.payload?.sourceEpoch)) {
            reached.resolve();
            await release.promise;
        }
        return original.call(client, collection, request);
    };
    const pending = run(() => generateAndStoreCredentialEmbeddings(vc, texts, owner)).then(
        () => 'settled',
        () => 'settled'
    );
    try {
        await reached.promise;
        await run(() => db.deleteVCsByUris(owner, [uri]));
        const keys = await cache.redis!.keys(`${fixture}:embedding-lock:*`);
        for (const key of keys) await cache.redis!.del(key);
        await run(() => deleteCredentialEmbeddings(owner, [uri]));
        release.resolve();
        await pending;
        // Let all Promise.all requests settle, rather than only the first rejection.
        await run(() => deleteCredentialEmbeddings(owner, [uri]));
        expect(await livePoints()).toHaveLength(0);
    } finally {
        release.resolve();
        await pending;
        client.upsert = original;
    }
}, 30000);

test('version mutation fences previous vectors; cancelled writes cannot undo durable cleanup after a Qdrant failure', async () => {
    const vc = record();
    await run(() => db.storeVC(owner, vc));
    await run(() => generateAndStoreCredentialEmbeddings(vc, texts, owner));
    const updated = record('new synthetic version');
    await run(() => db.storeVC(owner, updated));
    expect(await livePoints()).toHaveLength(0);
    await run(() => generateAndStoreCredentialEmbeddings(updated, texts, owner));
    expect(await livePoints()).toHaveLength(10);
    const original = client.upsert;
    let fail = true;
    client.upsert = async (collection, request) => {
        if (fail && 'points' in request && request.points.some(point => point.payload?.erased))
            throw new Error('synthetic transport loss');
        return original.call(client, collection, request);
    };
    try {
        await expect(run(() => db.deleteVCsByUris(owner, [uri]))).rejects.toThrow(
            'synthetic transport loss'
        );
        expect(await persisted.collection('credentials').countDocuments({ did: owner })).toBe(0);
        expect((await db.sourceCleanupSummary(owner)).pendingPoints).toBe(10);
        const cancelled = new AbortController();
        cancelled.abort();
        await expect(
            run(() =>
                generateAndStoreCredentialEmbeddings(updated, texts, owner, false, cancelled.signal)
            )
        ).rejects.toThrow();
        fail = false;
        expect(await run(() => db.deleteVCsByUris(owner, [uri]))).toBe(0);
        await run(() => deleteCredentialEmbeddings(owner, [uri]));
        expect(await livePoints()).toHaveLength(0);
    } finally {
        client.upsert = original;
    }
}, 30000);

test('normal ingestion retry drains failed cleanup after the last wallet credential is already absent', async () => {
    const vc = record();
    await run(() => db.storeVC(owner, vc));
    await run(() => generateAndStoreCredentialEmbeddings(vc, texts, owner));
    const original = client.upsert;
    let fail = true;
    let remoteFences = 0;
    client.upsert = async (collection, request) => {
        if ('points' in request && request.points.some(point => point.payload?.erased)) {
            remoteFences += 1;
            if (fail) throw new Error('synthetic last-credential cleanup failure');
        }
        return original.call(client, collection, request);
    };
    const job = { id: 'empty-wallet-retry', updateProgress: async () => {} };
    try {
        await expect(run(() => processCredentials(owner, job))).rejects.toThrow(
            'synthetic last-credential cleanup failure'
        );
        expect(await persisted.collection('credentials').countDocuments({ did: owner })).toBe(0);
        expect(await db.sourceCleanupSummary(owner)).toEqual({
            pendingTasks: 1,
            pendingPoints: 10,
        });
        fail = false;
        expect((await run(() => processCredentials(owner, job))).totalSeen).toBe(0);
        expect(await db.sourceCleanupSummary(owner)).toEqual({
            pendingTasks: 0,
            pendingPoints: 0,
        });
        expect(await livePoints()).toHaveLength(0);
        const completedFences = remoteFences;
        await run(() => processCredentials(owner, job));
        expect(remoteFences).toBe(completedFences);
    } finally {
        client.upsert = original;
    }
}, 30000);

async function seedLegacy(count: number) {
    for (const generation of ['openai1536', 'nova1024v1'] as const) {
        const collection =
            generation === 'openai1536' ? collections.FULL_TEXT : collections.FULL_TEXT + '__nova';
        if (!(await client.collectionExists(collection)).exists)
            await client.createCollection(collection, {
                vectors: { size: generationDimensions(generation), distance: 'Dot' },
            });
        const vector = Array(generationDimensions(generation)).fill(0);
        vector[0] = 1;
        await client.upsert(collection, {
            points: Array.from({ length: count }, (_, index) => ({
                id: index + 1,
                vector,
                payload: {
                    did: owner,
                    uri,
                    recordType: 'credential',
                    type: 'fullText',
                    consentRevision: 'r1',
                    contentHash: record().verification!.contentHash,
                    text: 'synthetic legacy private metadata',
                },
            })),
            wait: true,
        });
    }
}

test('encrypted pre-deletion scope survives failure before legacy discovery and supports global bounded recovery', async () => {
    await run(() => db.storeVC(owner, record()));
    await seedLegacy(1);
    const original = client.scroll;
    client.scroll = async () => {
        throw new Error('synthetic failure before discovery');
    };
    try {
        await expect(run(() => db.deleteVCsByUris(owner, [uri]))).rejects.toThrow(
            'synthetic failure before discovery'
        );
    } finally {
        client.scroll = original;
    }
    expect(await persisted.collection('credentials').countDocuments({ did: owner })).toBe(0);
    const raw = await persisted.collection('source_vector_cleanup').find({}).toArray();
    expect(raw).toHaveLength(1);
    expect(JSON.stringify(raw)).not.toContain(owner);
    expect(JSON.stringify(raw)).not.toContain(uri);
    expect(raw[0].ciphertext).toBeString();
    expect(raw[0].discoveryComplete).toBe(false);
    const first = await recoverSourceVectorCleanup({ limit: 1 });
    expect(first.units).toBe(1);
    expect(first.discoveryPages).toBe(1);
    expect(first.pendingPoints).toBe(1);
    const next = await recoverSourceVectorCleanup({ limit: 1 });
    expect(next.pointsFenced).toBe(1);
    expect(next.pendingTasks).toBe(1);
    const rest = await recoverSourceVectorCleanup({ limit: 32 });
    expect(rest.pendingTasks).toBe(0);
    expect(rest.pendingPoints).toBe(0);
    expect(rest.tasksCompleted).toBe(1);
    expect(await livePoints()).toHaveLength(0);
    expect(await persisted.collection('source_vector_cleanup').countDocuments({})).toBe(0);
    const receipts = await persisted
        .collection('source_vector_cleanup_receipts')
        .find({})
        .toArray();
    expect(receipts).toHaveLength(1);
    expect(Object.keys(receipts[0]).sort()).toEqual(['_id', 'subjectRef']);
}, 30000);

test('cleanup pages and batches pending work, acknowledges it, and never replays completed history', async () => {
    await run(() => db.storeVC(owner, record()));
    await seedLegacy(300);
    const original = client.upsert;
    let fail = true;
    const batches: number[][] = [];
    client.upsert = async (collection, request) => {
        if ('points' in request && request.points.some(point => point.payload?.erased)) {
            if (fail) throw new Error('synthetic partial-cleanup failure');
            expect(request.points.length).toBeLessThanOrEqual(256);
            batches.push(request.points.map(point => Number(point.id)));
        }
        return original.call(client, collection, request);
    };
    try {
        await expect(run(() => db.deleteVCsByUris(owner, [uri]))).rejects.toThrow(
            'synthetic partial-cleanup failure'
        );
        const before = await db.sourceCleanupSummary(owner);
        expect(before.pendingTasks).toBe(1);
        expect(before.pendingPoints).toBe(256);
        fail = false;
        const first = await recoverSourceVectorCleanup({ limit: 1 });
        expect(first.units).toBe(1);
        expect(first.pointsFenced).toBe(256);
        expect(first.pendingTasks).toBe(1);
        expect(batches).toHaveLength(1);
        // Resume through a new Mongo consumer after an acknowledged batch.
        const restarted = new ChatDB();
        const rest = await recoverSourceVectorCleanup({
            limit: 32,
            database: restarted,
        });
        await restarted.close();
        expect(rest.pendingTasks).toBe(0);
        expect(rest.pendingPoints).toBe(0);
        expect(batches).toHaveLength(4);
        expect(batches.map(batch => batch.length)).toEqual([256, 44, 256, 44]);
        // Completed requests do not even probe collections, let alone rewrite old fences.
        const checks = spyOn(client, 'collectionExists'),
            reads = spyOn(client, 'scroll'),
            writes = spyOn(client, 'upsert');
        try {
            expect((await recoverSourceVectorCleanup({ limit: 5 })).units).toBe(0);
            await run(() => deleteCredentialEmbeddings(owner, [uri]));
            await run(() => db.storeVC(owner, record()));
            expect(checks).not.toHaveBeenCalled();
            expect(reads).not.toHaveBeenCalled();
            expect(writes).not.toHaveBeenCalled();
        } finally {
            checks.mockRestore();
            reads.mockRestore();
            writes.mockRestore();
        }
        await run(() => generateAndStoreCredentialEmbeddings(record(), texts, owner));
        expect(await livePoints()).toHaveLength(10);
        await run(() => deleteCredentialEmbeddings(owner, [uri]));
        expect(await livePoints()).toHaveLength(10);
        await run(() => db.deleteVCsByUris(owner, [uri]));
        expect(await livePoints()).toHaveLength(0);
    } finally {
        client.upsert = original;
    }
}, 30000);

test('whole-owner erasure acknowledges exactly completed pending-source fence batches across failure and retry', async () => {
    const vc = record();
    await run(() => db.storeVC(owner, vc));
    await run(() => generateAndStoreCredentialEmbeddings(vc, texts, owner));
    await expect(
        db.acknowledgeErasedSourceVectorFences(owner, collections.FULL_TEXT, [1])
    ).rejects.toThrow('permanently fenced');
    const original = client.upsert;
    let fenceCalls = 0;
    client.upsert = async (collection, request) => {
        if ('points' in request && request.points.some(point => point.payload?.erased))
            throw new Error('synthetic source cleanup failure');
        return original.call(client, collection, request);
    };
    try {
        await expect(run(() => db.deleteVCsByUris(owner, [uri]))).rejects.toThrow(
            'synthetic source cleanup failure'
        );
    } finally {
        client.upsert = original;
    }
    expect(await db.sourceCleanupSummary(owner)).toEqual({
        pendingTasks: 1,
        pendingPoints: 10,
    });
    await requestDataErasure(owner);
    await db.fenceOwnerWrites(owner);
    client.upsert = async (collection, request) => {
        if ('points' in request && request.points.some(point => point.payload?.erased)) {
            fenceCalls += 1;
            if (fenceCalls === 2) throw new Error('synthetic partial owner fencing failure');
        }
        return original.call(client, collection, request);
    };
    try {
        await expect(deleteOwnerVectors(owner)).rejects.toThrow(
            'synthetic partial owner fencing failure'
        );
        // Only the first remotely completed collection/batch is acknowledged.
        expect(await db.sourceCleanupSummary(owner)).toEqual({
            pendingTasks: 1,
            pendingPoints: 9,
        });
        expect(
            await persisted
                .collection('owner_vector_references')
                .countDocuments({ deleted: true, cleanupComplete: true })
        ).toBe(1);
    } finally {
        client.upsert = original;
    }
    await deleteOwnerVectors(owner);
    expect(await db.sourceCleanupSummary(owner)).toEqual({
        pendingTasks: 1,
        pendingPoints: 0,
    });
    const { getPrivacySubjectRef } = await import('../ai/privacy-keys');
    await db.deleteOwnerData(owner, getPrivacySubjectRef(owner));
    expect(await db.sourceCleanupSummary(owner)).toEqual({
        pendingTasks: 0,
        pendingPoints: 0,
    });
    expect(
        await persisted
            .collection('owner_vector_references')
            .countDocuments({ deleted: true, cleanupComplete: true })
    ).toBe(10);
    expect(await persisted.collection('owner_write_guards').countDocuments({ erased: true })).toBe(
        1
    );
    expect(await livePoints()).toHaveLength(0);
    const result = await recoverSourceVectorCleanup({ limit: 5 });
    expect(result).toEqual({
        units: 0,
        discoveryPages: 0,
        pointsFenced: 0,
        tasksCompleted: 0,
        pendingTasks: 0,
        pendingPoints: 0,
    });
    await deleteOwnerVectors(owner);
    expect(await db.sourceCleanupSummary(owner)).toEqual({
        pendingTasks: 0,
        pendingPoints: 0,
    });
}, 30000);
