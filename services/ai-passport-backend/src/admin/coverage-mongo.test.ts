import { expect, mock, test } from 'bun:test';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
const fixture = `coverage_${randomUUID().replaceAll('-', '')}`;
process.env.MONGO_DB = fixture;
process.env.AI_PRIVACY_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.QDRANT_PREFIX = fixture;
const did = `did:example:${fixture}`;
let injectedStage: 'vector-schema' | 'vector-read' | undefined;
const nova = new Set<string>();
const versions = new Map<string, { epoch: string; hash: string }>();
mock.module('../services/dataErasure', () => ({
    isDataErasureRequested: async () => false,
}));
mock.module('@qdrant/js-client-rest', () => ({
    QdrantClient: class {
        async collectionExists() {
            if (injectedStage === 'vector-schema') throw new Error('synthetic private URI token');
            return { exists: true };
        }
        async getCollection(collection: string) {
            return {
                config: {
                    params: {
                        vectors: {
                            size: collection.includes('nova2') ? 1024 : 1536,
                            distance: 'Cosine',
                        },
                    },
                },
            };
        }
        async scroll(collection: string, options: any) {
            if (injectedStage === 'vector-read') throw new Error('synthetic private URI token');
            const uris = options.filter.must[1].match.any as string[];
            return {
                points: uris
                    .filter(uri => !collection.includes('nova2') || nova.has(uri))
                    .map(uri => ({
                        id: `${collection}:${uri}`,
                        payload: {
                            did,
                            uri,
                            sourceEpoch: versions.get(uri)?.epoch,
                            contentHash: versions.get(uri)?.hash,
                            consentRevision: 'revision',
                        },
                    })),
                next_page_offset: null,
            };
        }
    },
}));
const { CREDENTIAL_COLLECTION_PREFIXES, collectionForGeneration } =
    await import('../constants/collections');
const { vectorSourceRef } = await import('../db/vector-source');
const { getPrivacySubjectRef } = await import('../ai/privacy-keys');
const { migrationCoverage, closeMigrationCoverage } = await import('./coverage');
test('real Mongo change streams reconcile a 550-record inventory and changes behind its cursor', async () => {
    const client = await new MongoClient(process.env.MONGO_URI!).connect();
    const database = client.db(fixture);
    const documents = Array.from({ length: 550 }, (_, i) => ({
        _id: new ObjectId(),
        did,
        uri: `urn:fixture:${i}`,
        embeddingEpoch: 'epoch',
        verification: { contentHash: 'hash', consent: { revision: 'revision' } },
    }));
    async function references(uri: string, generation: 'openai1536' | 'nova1024v1') {
        await database.collection('owner_vector_references').insertMany(
            Object.values(CREDENTIAL_COLLECTION_PREFIXES).map(logical => {
                const collection = collectionForGeneration(logical, generation);
                return {
                    collection,
                    pointId: `${collection}:${uri}`,
                    sourceRef: vectorSourceRef(did, 'credential', uri),
                    subjectRef: getPrivacySubjectRef(did),
                    sourceEpoch: 'epoch',
                    deleted: false,
                };
            })
        );
    }
    const now = Date.now;
    let offset = 0;
    Date.now = () => now() + offset;
    const step = async () => {
        offset += 10000;
        return migrationCoverage();
    };
    try {
        for (const source of documents) versions.set(source.uri, { epoch: 'epoch', hash: 'hash' });
        await database.collection('credentials').insertMany(documents);
        for (const source of documents) await references(source.uri, 'openai1536');
        let state = await step();
        expect(state.complete).toBe(false);
        expect(state.observedRecords).toBe(100);
        const behind = {
            ...documents[0],
            _id: new ObjectId('000000000000000000000001'),
            uri: 'urn:fixture:behind',
        };
        versions.set(behind.uri, { epoch: 'epoch', hash: 'hash' });
        await database.collection('credentials').insertOne(behind);
        await references(behind.uri, 'openai1536');
        for (let i = 0; i < 20 && !state.complete; i += 1) state = await step();
        expect(state.complete).toBe(true);
        expect(state.totalRecords).toBe(551);
        expect(state.openaiOnly).toBe(551);
        const last = documents[549];
        nova.add(last.uri);
        await references(last.uri, 'nova1024v1');
        state = await step();
        expect(state.novaReady).toBe(1);
        expect(state.rollbackCopies).toBe(1);
        expect(state.totalRecords).toBe(551);
        await database.collection('credentials').deleteOne({ _id: documents[20]._id });
        await database
            .collection('credentials')
            .updateOne(
                { _id: documents[0]._id },
                { $set: { 'verification.contentHash': 'changed' } }
            );
        for (let i = 0; i < 8; i += 1) state = await step();
        expect(state.totalRecords).toBe(550);
        expect(state.novaReady).toBe(1);
        expect(state.openaiOnly).toBe(548);
        expect(state.unresolved).toBe(1);
        await database
            .collection<{ _id: string; erased: boolean; revision: number }>('owner_write_guards')
            .insertOne({
                _id: getPrivacySubjectRef(did),
                erased: false,
                revision: 1,
            });
        state = await step();
        expect(state.totalRecords).toBe(550);
        await database
            .collection<{ _id: string; erased: boolean; revision: number }>('owner_write_guards')
            .updateOne({ _id: getPrivacySubjectRef(did) }, { $set: { erased: true } });
        await expect(step()).rejects.toThrow('Coverage inventory invalidated');
    } finally {
        Date.now = now;
        await closeMigrationCoverage();
        await database.dropDatabase();
        await client.close();
    }
}, 30000);

test('real observer tags vector failures without leaking underlying messages', async () => {
    const { coverageFailureStage, coverageFailureReason } = await import('./coverage-error');
    const client = await new MongoClient(process.env.MONGO_URI!).connect();
    const database = client.db(fixture);
    try {
        await database
            .collection('credentials')
            .insertOne({ _id: new ObjectId(), did, uri: 'urn:fixture:diagnostics' });
        for (const stage of ['vector-schema', 'vector-read'] as const) {
            injectedStage = stage;
            try {
                await migrationCoverage();
                throw new Error('Expected observer failure');
            } catch (error) {
                expect(coverageFailureStage(error)).toBe(stage);
                expect(coverageFailureReason(error)).not.toContain('synthetic private');
            }
            await closeMigrationCoverage();
        }
    } finally {
        injectedStage = undefined;
        await closeMigrationCoverage();
        await database.dropDatabase();
        await client.close();
    }
});
