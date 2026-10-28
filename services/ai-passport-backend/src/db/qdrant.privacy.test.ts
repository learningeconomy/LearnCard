import { currentGeneration, withEmbeddingGeneration } from '../ai/embedding-generation';
import { afterAll, beforeAll, beforeEach, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import type { QdrantClient } from '@qdrant/js-client-rest';

// This suite uses real Qdrant in unique, owned collections. Mongo/Redis are
// isolated lifecycle doubles; their transaction/lease contracts have separate suites.
const prefix = `vector_privacy_${randomUUID().replaceAll('-', '')}`;
const collections = {
    FULL_TEXT: `${prefix}_full`,
    DOMAIN_SUMMARY: `${prefix}_domain`,
    KEY_CLAIMS: `${prefix}_claims`,
    TECHNICAL_METADATA: `${prefix}_technical`,
    COMPARISON_CONTEXT: `${prefix}_comparison`,
};
const messageCollection = `${prefix}_messages`;
const owner = 'did:example:vector-owner';
const otherOwner = 'did:example:other-owner';
let erased = false;
let fenced = false;
let maintenance = false;
let registrationFails = false;
const references = new Map<string, Set<string | number>>();
let sourceHash = 'synthetic-hash';
const db = {
    acknowledgeErasedSourceVectorFences: async () => {
        if (!fenced) throw new Error('Owner not permanently fenced');
    },
    getEmbeddingCredentialVersion: async () => ({
        embeddingEpoch: 'fixture-epoch',
        contentHash: sourceHash,
        consent: { revision: 'r1' },
    }),
    registerVectorPoints: async (did: string, collection: string, ids: (string | number)[]) => {
        if (registrationFails || fenced || did !== owner)
            throw new Error('Owner registration fenced');
        const current = references.get(collection) ?? new Set();
        for (const id of ids) current.add(id);
        references.set(collection, current);
    },
    registerErasedVectorPoints: async (
        did: string,
        collection: string,
        ids: (string | number)[]
    ) => {
        if (!fenced || did !== owner) throw new Error('Owner is not fenced');
        const current = references.get(collection) ?? new Set();
        for (const id of ids) current.add(id);
        references.set(collection, current);
    },
    registerLegacyVectorPoints: async (
        _did: string,
        collection: string,
        ids: (string | number)[]
    ) => {
        if (!maintenance) throw new Error('Maintenance required');
        const current = references.get(collection) ?? new Set();
        for (const id of ids) current.add(id);
        references.set(collection, current);
    },
    getVectorPointReferences: async (_did: string) =>
        [...references].map(([collection, ids]) => ({ collection, ids: [...ids] })),
};
Object.assign(db, {
    registerSourceVectorPoints: db.registerVectorPoints,
    getDeletedSourceVectorReferences: async () => [],
    registerDeletedLegacyVectorPoints: db.registerVectorPoints,
    listRetiredVectorCollections: async () => [],
});
mock.module('.', () => ({ db }));
mock.module('../ai/privacy', () => ({
    getCurrentAiSubject: () => owner,
    runWithAiPrivacyContext: (_did: string, fn: () => unknown) => fn(),
}));
mock.module('../services/dataErasure', () => ({
    withOwnerOperation: async (_did: string, fn: () => Promise<unknown>) => fn(),
    assertOwnerOperationActive: async (did: string) => {
        if (erased || maintenance || did !== owner) throw new Error('Owner operation inactive');
    },
    isDataErasureRequested: async (did: string) => did === owner && erased,
    PRIVACY_MAINTENANCE_KEY: 'fixture:maintenance',
}));
mock.module('../utils/cache', () => ({
    default: { redis: { exists: async () => Number(maintenance) } },
}));
mock.module('../constants/collections', () => ({
    CREDENTIAL_COLLECTION_PREFIXES: collections,
    EMBEDDINGS_COLLECTION: messageCollection,
    resolveVectorCollection: (name: string) =>
        currentGeneration() === 'nova1024v1' ? `${name}__nova_fixture` : name,
    vectorInventory: ['', '__nova_fixture'].flatMap(suffix => [
        ...Object.values(collections).map(collection => ({
            collection: collection + suffix,
            ownerField: 'did',
        })),
        { collection: messageCollection + suffix, ownerField: 'userId' },
    ]),
}));
// Loading after mock registration is necessary to isolate infrastructure imports.
const {
    assertQdrantPrivacyCapabilities,
    getQdrantClient,
    storeEmbeddings: actualStoreEmbeddings,
    deleteOwnerVectors,
    exportOwnerVectors,
    searchSimilar,
    migrateLegacyVectorPayloads,
    createCollectionIfNotExists,
    getCredentialVectorCoverage,
} = await import('./qdrant');
const storeEmbeddings = async (collection: string, points: any[]) => {
    const source = {
        kind: 'credential' as const,
        key: 'lc:private:credential',
        epoch: 'fixture-epoch',
        consentRevision: 'r1',
    };
    return actualStoreEmbeddings(
        collection,
        points.map(point => ({
            ...point,
            payload: { ...point.payload, sourceEpoch: source.epoch },
        })),
        source
    );
};
const client = getQdrantClient();
const allCollections = ['', '__nova_fixture'].flatMap(suffix =>
    [...Object.values(collections), messageCollection].map(name => name + suffix)
);

beforeAll(async () => {
    const versionInfo = client.versionInfo;
    client.versionInfo = async () => ({ title: 'fixture', version: '1.16.9' });
    try {
        await expect(assertQdrantPrivacyCapabilities()).rejects.toThrow('1.17+');
    } finally {
        client.versionInfo = versionInfo;
    }
    const create = client.createCollection.bind(client);
    client.createCollection = (name, options) =>
        create(name, {
            ...options,
            strict_mode_config: {
                enabled: true,
                unindexed_filtering_retrieve: false,
                unindexed_filtering_update: false,
            },
        });
    try {
        await assertQdrantPrivacyCapabilities();
    } finally {
        client.createCollection = create;
    }
    for (const collection of allCollections)
        await client.createCollection(collection, {
            vectors: { size: 2, distance: 'Dot' },
        });
}, 30_000);

beforeEach(async () => {
    sourceHash = 'synthetic-hash';
    erased = false;
    fenced = false;
    maintenance = false;
    registrationFails = false;
    references.clear();
    for (const collection of allCollections)
        await client.delete(collection, {
            filter: {},
            wait: true,
            ordering: 'strong',
        });
});

afterAll(async () => {
    for (const collection of allCollections) {
        if ((await client.collectionExists(collection)).exists)
            await client.deleteCollection(collection);
    }
});

function pointer(id: string | number, did = owner) {
    return {
        id,
        vector: [1, 0],
        payload: {
            did,
            uri: 'lc:private:credential',
            recordType: 'credential',
            type: 'fullText',
            credentialType: 'Achievement',
            consentRevision: 'r1',
            contentHash: 'synthetic-hash',
        },
    };
}

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>(done => {
        resolve = done;
    });
    return { promise, resolve };
}

test('registered unsent writes cannot resurrect or remove erasure fences', async () => {
    await storeEmbeddings(collections.FULL_TEXT, [pointer(1)]);
    const sendReached = deferred();
    const allowSend = deferred();
    const originalUpsert = client.upsert;
    client.upsert = async (collection: string, request: Parameters<QdrantClient['upsert']>[1]) => {
        if (
            collection === collections.FULL_TEXT &&
            'points' in request &&
            request.points.some(point => point.id === 2 && point.payload?.erased !== true)
        ) {
            sendReached.resolve();
            await allowSend.promise;
        }
        return originalUpsert.call(client, collection, request);
    };
    let pendingWrite: Promise<unknown> | undefined;
    try {
        pendingWrite = storeEmbeddings(collections.FULL_TEXT, [pointer(2)]).then(
            () => 'completed',
            () => 'cancelled'
        );
        await sendReached.promise;
        erased = true;
        fenced = true;
        await deleteOwnerVectors(owner);
        // ID 2 did not exist before erasure: its durable pre-send registration is
        // what makes this tombstone possible. Conditional upsert alone is insufficient.
        expect(
            await client.retrieve(collections.FULL_TEXT, {
                ids: [1, 2],
                with_payload: true,
                with_vector: true,
            })
        ).toEqual([
            { id: 1, payload: { erased: true }, vector: {} },
            { id: 2, payload: { erased: true }, vector: {} },
        ]);
        allowSend.resolve();
        expect(await pendingWrite).toBe('cancelled');
        const after = await client.retrieve(collections.FULL_TEXT, {
            ids: [1, 2],
            with_payload: true,
            with_vector: true,
        });
        expect(after).toEqual([
            { id: 1, payload: { erased: true }, vector: {} },
            { id: 2, payload: { erased: true }, vector: {} },
        ]);
    } finally {
        allowSend.resolve();
        await pendingWrite;
        client.upsert = originalUpsert;
    }
});

test('failed durable registration sends no user vector', async () => {
    registrationFails = true;
    await expect(storeEmbeddings(collections.FULL_TEXT, [pointer(7)])).rejects.toThrow(
        'registration fenced'
    );
    expect(
        await client.retrieve(collections.FULL_TEXT, {
            ids: [7],
            with_payload: true,
            with_vector: true,
        })
    ).toEqual([]);
});

test('legacy exports and search return owner-only pointers without raw text or vectors', async () => {
    const legacy = {
        ...pointer(10),
        payload: {
            ...pointer(10).payload,
            text: 'private old projection',
            credentialContext: 'private raw context',
            credential: { name: 'Private Name' },
            rawCredentialJson: 'private raw credential',
            snippet: 'private snippet',
        },
    };
    await client.upsert(collections.FULL_TEXT, {
        points: [legacy, pointer(11, otherOwner)],
        wait: true,
    });
    const exported = await exportOwnerVectors(owner);
    expect(exported[collections.FULL_TEXT]).toEqual([{ id: 10, payload: pointer(10).payload }]);
    expect(await searchSimilar(collections.FULL_TEXT, [1, 0], 10)).toEqual([
        { id: 10, score: 1, payload: pointer(10).payload },
    ]);
    expect(JSON.stringify(exported)).not.toContain('private old projection');
    expect(JSON.stringify(exported)).not.toContain('"vector"');
});

test('legacy migration paginates, is read-only in dry-run, and preserves typed metadata and usable vectors', async () => {
    const points = Array.from({ length: 257 }, (_, index) => ({
        ...pointer(index + 100),
        payload: {
            ...pointer(index + 100).payload,
            text: 'private legacy text',
            credentialContext: 'private legacy context',
            rawCredentialJson: 'private raw credential',
        },
    }));
    await client.upsert(collections.FULL_TEXT, { points, wait: true });
    const before = await client.retrieve(collections.FULL_TEXT, {
        ids: [100, 356],
        with_payload: true,
        with_vector: true,
    });
    const dryRun = await migrateLegacyVectorPayloads({ apply: false });
    expect(dryRun.scanned).toBe(257);
    expect(
        await client.retrieve(collections.FULL_TEXT, {
            ids: [100, 356],
            with_payload: true,
            with_vector: true,
        })
    ).toEqual(before);
    expect(references.size).toBe(0);
    await expect(migrateLegacyVectorPayloads({ apply: true })).rejects.toThrow('maintenance');
    maintenance = true;
    const applied = await migrateLegacyVectorPayloads({ apply: true });
    expect(applied.minimized).toBe(257);
    expect(references.get(collections.FULL_TEXT)?.size).toBe(257);
    expect(
        await client.retrieve(collections.FULL_TEXT, {
            ids: [100, 356],
            with_payload: true,
            with_vector: true,
        })
    ).toEqual([{ ...pointer(100) }, { ...pointer(356) }]);
}, 30_000);

test('legacy owner points are registered and fenced, and retries retain their opaque tombstones', async () => {
    await client.upsert(collections.FULL_TEXT, {
        points: [pointer(20), pointer(21, otherOwner)],
        wait: true,
    });
    erased = true;
    fenced = true;
    await deleteOwnerVectors(owner);
    await deleteOwnerVectors(owner);
    expect(
        await client.retrieve(collections.FULL_TEXT, {
            ids: [20, 21],
            with_payload: true,
            with_vector: true,
        })
    ).toEqual([{ id: 20, payload: { erased: true }, vector: {} }, pointer(21, otherOwner)]);
});

test('missing registered collections fail erasure instead of reporting successful deletion', async () => {
    const missing = `${prefix}_missing`;
    references.set(missing, new Set([30]));
    erased = true;
    fenced = true;
    await expect(deleteOwnerVectors(owner)).rejects.toThrow(
        'Unconfigured private vector collection'
    );
    references.clear();
    references.set(collections.COMPARISON_CONTEXT, new Set([30]));
    await client.deleteCollection(collections.COMPARISON_CONTEXT);
    try {
        await expect(deleteOwnerVectors(owner)).rejects.toThrow('collection is missing');
    } finally {
        await client.createCollection(collections.COMPARISON_CONTEXT, {
            vectors: { size: 2, distance: 'Dot' },
        });
    }
});

test('Nova coverage excludes legacy generation; export and erasure retain both inventories', async () => {
    await storeEmbeddings(collections.FULL_TEXT, [pointer(9001)]);
    await withEmbeddingGeneration('nova1024v1', async () => {
        expect(
            (await getCredentialVectorCoverage(owner, ['lc:private:credential'])).get(
                'lc:private:credential'
            )?.size
        ).toBe(0);
        await storeEmbeddings(collections.FULL_TEXT, [pointer(9002)]);
        expect(
            (await getCredentialVectorCoverage(owner, ['lc:private:credential'])).get(
                'lc:private:credential'
            )?.size
        ).toBe(1);
        expect(await searchSimilar(collections.FULL_TEXT, [1, 0])).toHaveLength(1);
        sourceHash = 'changed-source';
        expect(await searchSimilar(collections.FULL_TEXT, [1, 0])).toHaveLength(0);
    });
    const exported = await exportOwnerVectors(owner);
    expect(exported[collections.FULL_TEXT]).toHaveLength(1);
    expect(exported[collections.FULL_TEXT + '__nova_fixture']).toHaveLength(1);
    erased = true;
    fenced = true;
    await deleteOwnerVectors(owner);
    for (const name of [collections.FULL_TEXT, collections.FULL_TEXT + '__nova_fixture']) {
        expect(
            (
                await client.scroll(name, {
                    filter: { must: [{ key: 'did', match: { value: owner } }] },
                })
            ).points
        ).toHaveLength(0);
    }
});
test('collection readiness rejects incompatible persisted and cached schemas', async () => {
    await expect(
        createCollectionIfNotExists(collections.DOMAIN_SUMMARY, 1024, 'Cosine')
    ).rejects.toThrow('schema');
    await createCollectionIfNotExists(collections.DOMAIN_SUMMARY, 2, 'Dot');
    await expect(
        createCollectionIfNotExists(collections.DOMAIN_SUMMARY, 1536, 'Dot')
    ).rejects.toThrow('schema');
});

test('chat points written by an earlier build stay exported and erased', async () => {
    // Nothing writes chat vectors any more; seed one directly, as a #98 pre-merge
    // build could have left in either generation's chat collection.
    const id = '507f1f77bcf86cd799439011';
    const collection = messageCollection + '__nova_fixture';
    await client.upsert(collection, {
        wait: true,
        points: [
            {
                id: '1b4e28ba-2fa1-4d3b-a3f5-ef19b5a7633b',
                vector: [1, 0],
                payload: {
                    recordType: 'chat-message',
                    messageId: id,
                    userId: owner,
                    threadId: 'thread',
                    consentRevision: 'r1',
                    role: 'user',
                    sourceEpoch: 'fixture-epoch',
                },
            },
        ],
    });
    const exported = await exportOwnerVectors(owner);
    expect(exported[collection][0].payload).toMatchObject({
        userId: owner,
        messageId: id,
        recordType: 'chat-message',
    });
    erased = true;
    fenced = true;
    await deleteOwnerVectors(owner);
    expect(
        (
            await client.scroll(collection, {
                filter: { must: [{ key: 'userId', match: { value: owner } }] },
            })
        ).points
    ).toHaveLength(0);
});

test('new strict credential provisioning coalesces calls and partial retries require operator repair', async () => {
    const name = collections.TECHNICAL_METADATA;
    await client.deleteCollection(name);
    const create = client.createCollection.bind(client);
    const index = client.createPayloadIndex.bind(client);
    let creates = 0,
        indexes = 0,
        fail = true;
    client.createCollection = (collection, options) => {
        creates += 1;
        return create(collection, {
            ...options,
            strict_mode_config: {
                enabled: true,
                unindexed_filtering_retrieve: false,
                unindexed_filtering_update: false,
            },
        });
    };
    client.createPayloadIndex = async (collection, options) => {
        indexes += 1;
        if (options.field_name === 'uri' && fail) {
            fail = false;
            throw new Error('synthetic creation failure');
        }
        return index(collection, options);
    };
    try {
        const failures = await Promise.allSettled(
            Array.from({ length: 3 }, () => createCollectionIfNotExists(name, 2, 'Dot'))
        );
        expect(failures.every(result => result.status === 'rejected')).toBe(true);
        expect(creates).toBe(1);
        expect(indexes).toBe(2);
        await expect(createCollectionIfNotExists(name, 2, 'Dot')).rejects.toThrow(
            'operator repair'
        );
        expect(indexes).toBe(2);
        // The operator explicitly repairs the two remaining indexes.
        await index(name, {
            field_name: 'uri',
            field_schema: 'keyword',
            wait: true,
        });
        await index(name, {
            field_name: 'erased',
            field_schema: 'bool',
            wait: true,
        });
        await Promise.all(
            Array.from({ length: 3 }, () => createCollectionIfNotExists(name, 2, 'Dot'))
        );
        expect(creates).toBe(1);
        expect(indexes).toBe(2);
        const info = await client.getCollection(name);
        expect(info.config.strict_mode_config?.unindexed_filtering_retrieve).toBe(false);
        expect(info.config.strict_mode_config?.unindexed_filtering_update).toBe(false);
        expect(info.payload_schema.did?.data_type).toBe('keyword');
        expect(info.payload_schema.uri?.data_type).toBe('keyword');
        expect(info.payload_schema.erased?.data_type).toBe('bool');
        expect(info.points_count).toBe(0);
        expect(
            (
                await client.scroll(name, {
                    filter: {
                        must: [
                            { key: 'did', match: { any: [owner] } },
                            { key: 'uri', match: { any: ['urn:synthetic'] } },
                        ],
                        must_not: [{ key: 'erased', match: { value: true } }],
                    },
                    limit: 500,
                    timeout: 2,
                    with_vector: false,
                })
            ).points
        ).toHaveLength(0);
        await createCollectionIfNotExists(name, 2, 'Dot');
        expect(indexes).toBe(2);
    } finally {
        client.createCollection = create;
        client.createPayloadIndex = index;
    }
});

test('existing strict credential collections require owner repair; provisioning never repairs them', async () => {
    const name = collections.KEY_CLAIMS;
    await client.updateCollection(name, {
        strict_mode_config: { enabled: true, unindexed_filtering_retrieve: false },
    });
    const index = client.createPayloadIndex.bind(client);
    let writes = 0;
    client.createPayloadIndex = async (collection, options) => {
        writes += 1;
        return index(collection, options);
    };
    try {
        await expect(createCollectionIfNotExists(name, 2, 'Dot')).rejects.toThrow(
            'operator repair'
        );
        expect(writes).toBe(0);
        for (const [field_name, field_schema] of [
            ['did', 'keyword'],
            ['uri', 'keyword'],
            ['erased', 'bool'],
        ] as const)
            await index(name, { field_name, field_schema, wait: true });
        await createCollectionIfNotExists(name, 2, 'Dot');
        expect(writes).toBe(0);
    } finally {
        client.createPayloadIndex = index;
    }
});

test('existing strict wrong-type indexes stop readiness without replacement', async () => {
    const name = collections.COMPARISON_CONTEXT;
    await client.createPayloadIndex(name, {
        field_name: 'did',
        field_schema: 'text',
        wait: true,
    });
    await client.updateCollection(name, {
        strict_mode_config: { enabled: true, unindexed_filtering_retrieve: false },
    });
    await expect(createCollectionIfNotExists(name, 2, 'Dot')).rejects.toThrow(
        'Incompatible credential payload index'
    );
    expect((await client.getCollection(name)).payload_schema).toMatchObject({
        did: { data_type: 'text' },
    });
    expect(Object.keys((await client.getCollection(name)).payload_schema)).toEqual(['did']);
});

test('permissive existing credentials and new chat collections retain their existing provisioning behavior', async () => {
    await createCollectionIfNotExists(collections.FULL_TEXT, 2, 'Dot');
    expect((await client.getCollection(collections.FULL_TEXT)).payload_schema).toEqual({});
    await client.deleteCollection(messageCollection);
    await createCollectionIfNotExists(messageCollection, 2, 'Dot');
    expect((await client.getCollection(messageCollection)).payload_schema).toEqual({});
});

test("a creation conflict never claims another process's existing strict collection", async () => {
    const physical = `${collections.TECHNICAL_METADATA}__nova_fixture`;
    await client.deleteCollection(physical);
    const exists = client.collectionExists.bind(client);
    const create = client.createCollection.bind(client);
    const index = client.createPayloadIndex.bind(client);
    let writes = 0;
    client.collectionExists = async name => (name === physical ? { exists: false } : exists(name));
    client.createCollection = async (name, options) => {
        await create(name, {
            ...options,
            strict_mode_config: {
                enabled: true,
                unindexed_filtering_retrieve: false,
            },
        });
        throw { status: 409 };
    };
    client.createPayloadIndex = async (name, options) => {
        writes += 1;
        return index(name, options);
    };
    try {
        await expect(
            withEmbeddingGeneration('nova1024v1', () =>
                createCollectionIfNotExists(collections.TECHNICAL_METADATA, 2, 'Dot')
            )
        ).rejects.toThrow('operator repair');
        expect(writes).toBe(0);
        expect((await client.getCollection(physical)).payload_schema).toEqual({});
    } finally {
        client.collectionExists = exists;
        client.createCollection = create;
        client.createPayloadIndex = index;
    }
});

test('new Nova credential collection receives all three indexes under strict mode', async () => {
    const name = `${collections.FULL_TEXT}__nova_fixture`;
    await client.deleteCollection(name);
    const create = client.createCollection.bind(client);
    client.createCollection = (collection, options) =>
        create(collection, {
            ...options,
            strict_mode_config: {
                enabled: true,
                unindexed_filtering_retrieve: false,
                unindexed_filtering_update: false,
            },
        });
    try {
        await withEmbeddingGeneration('nova1024v1', () =>
            Promise.all(
                Array.from({ length: 3 }, () =>
                    createCollectionIfNotExists(collections.FULL_TEXT, 2, 'Dot')
                )
            )
        );
        const info = await client.getCollection(name);
        expect(info.payload_schema).toMatchObject({
            did: { data_type: 'keyword' },
            uri: { data_type: 'keyword' },
            erased: { data_type: 'bool' },
        });
        expect(info.points_count).toBe(0);
        expect(info.config.strict_mode_config?.enabled).toBe(true);
    } finally {
        client.createCollection = create;
    }
});

test('partial creation followed by replacement never grants index writes to the replacement', async () => {
    const name = `${collections.DOMAIN_SUMMARY}__nova_fixture`;
    await client.deleteCollection(name);
    const index = client.createPayloadIndex.bind(client);
    let writes = 0;
    client.createPayloadIndex = async (collection, options) => {
        writes += 1;
        if (options.field_name === 'uri') throw new Error('synthetic creation failure');
        return index(collection, options);
    };
    try {
        await expect(
            withEmbeddingGeneration('nova1024v1', () =>
                createCollectionIfNotExists(collections.DOMAIN_SUMMARY, 2, 'Dot')
            )
        ).rejects.toThrow('synthetic creation failure');
        expect(writes).toBe(2);
        await client.deleteCollection(name);
        await client.createCollection(name, {
            vectors: { size: 2, distance: 'Dot' },
        });
        await expect(
            withEmbeddingGeneration('nova1024v1', () =>
                createCollectionIfNotExists(collections.DOMAIN_SUMMARY, 2, 'Dot')
            )
        ).rejects.toThrow('operator repair');
        expect(writes).toBe(2);
        expect((await client.getCollection(name)).payload_schema).toEqual({});
    } finally {
        client.createPayloadIndex = index;
    }
});
