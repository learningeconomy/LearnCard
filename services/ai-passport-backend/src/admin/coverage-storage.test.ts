import { expect, mock, test } from 'bun:test';
let badSchema = true;
let vectorFailure: { operation: string; collection: string; cause: unknown } | undefined;
const failVector = (operation: string, collection: string) => {
    if (vectorFailure?.operation === operation && vectorFailure.collection === collection)
        throw vectorFailure.cause;
};
let fail = true,
    connects = 0;
const sources = ['both', 'old', 'partial', 'stale', 'deleted', 'fenced'].map((uri, i) => ({
    _id: String(i),
    did: 'did:web:fixture',
    uri,
    embeddingEpoch: 'epoch',
    verification: { contentHash: 'hash', consent: { revision: 'revision' } },
}));
const sourceCursor = (values: unknown[]) => ({
    sort() {
        return this;
    },
    limit() {
        return this;
    },
    toArray: async () => values,
    next: async () => values.at(-1) ?? null,
});
mock.module('../constants/env', () => ({
    MONGO_URI: 'mongodb://fixture',
    MONGO_DB: 'fixture',
    QDRANT_HOST: 'fixture',
    QDRANT_PREFIX: 'fixture',
    QDRANT_PORT: 6333,
    QDRANT_HTTPS: false,
    QDRANT_API_KEY: undefined,
}));
mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: () => 'subject',
}));
mock.module('../services/dataErasure', () => ({
    isDataErasureRequested: async () => false,
}));
mock.module('../db/vector-source', () => ({
    vectorSourceRef: (_did: string, _kind: string, key: string) => `ref-${key}`,
}));
mock.module('mongodb', () => ({
    ObjectId: class {
        constructor(private value: string) {}
        toString() {
            return this.value;
        }
    },
    MongoClient: class {
        async connect() {
            connects += 1;
            if (fail) {
                fail = false;
                throw Error('inventory unavailable');
            }
        }
        db() {
            return {
                watch: () => ({ tryNext: async () => null, close: async () => {} }),
                collection: (name: string) => ({
                    find: (filter: any, options: any) => {
                        if (name === 'credentials') {
                            expect(options.projection.credential).toBeUndefined();
                            expect(
                                Object.keys(options.projection).every(k =>
                                    [
                                        '_id',
                                        'did',
                                        'uri',
                                        'embeddingEpoch',
                                        'verification.contentHash',
                                        'verification.consent.revision',
                                    ].includes(k)
                                )
                            ).toBe(true);
                            return sourceCursor(
                                filter._id?.$in ? sources.filter(s => s.uri !== 'deleted') : sources
                            );
                        }
                        return sourceCursor(
                            filter.pointId.$in
                                .filter((id: string) => !id.includes('fenced'))
                                .map((pointId: string) => ({
                                    pointId,
                                    subjectRef: 'subject',
                                    sourceEpoch: 'epoch',
                                }))
                        );
                    },
                    findOne: async () => null,
                }),
            };
        }
    },
}));
mock.module('@qdrant/js-client-rest', () => ({
    QdrantClient: class {
        async getCollection(collection: string) {
            failVector('schema', collection);
            if (badSchema) {
                badSchema = false;
                return {
                    config: { params: { vectors: { size: 12, distance: 'Cosine' } } },
                };
            }
            return {
                config: {
                    params: {
                        vectors: {
                            size: collection.includes('nova') ? 1024 : 1536,
                            distance: 'Cosine',
                        },
                    },
                },
            };
        }
        async collectionExists(collection: string) {
            failVector('exists', collection);
            return { exists: true };
        }
        async scroll(collection: string, options: any) {
            failVector('scroll', collection);
            expect(options.with_vector).toBe(false);
            const nova = collection.includes('nova');
            const points = sources
                .filter(
                    s =>
                        !nova ||
                        ['both', 'stale', 'deleted', 'fenced'].includes(s.uri) ||
                        (s.uri === 'partial' && collection.includes('full_text'))
                )
                .flatMap(s =>
                    [1, 2].map(n => ({
                        id: `${collection}-${s.uri}-${n}`,
                        payload: {
                            did: s.did,
                            uri: s.uri,
                            contentHash: s.uri === 'stale' ? 'old-hash' : 'hash',
                            sourceEpoch: 'epoch',
                            consentRevision: 'revision',
                        },
                    }))
                );
            return { points, next_page_offset: null };
        }
    },
}));
const { migrationCoverage } = await import('./coverage');
const {
    CoverageObservationError,
    coverageFailureStage,
    coverageFailureReason,
    coverageVectorFailure,
} = await import('./coverage-error');
test('bounded inventory matches real source versions and live references, rejects fences and coalesces failures/retries', async () => {
    const failed = migrationCoverage();
    await expect(failed).rejects.toThrow('Coverage observation failed');
    const error = await failed.catch((value: unknown) => value);
    expect(error).toBeInstanceOf(CoverageObservationError);
    expect(coverageFailureStage(error)).toBe('database');
    expect((error as InstanceType<typeof CoverageObservationError>).cause).toBeInstanceOf(Error);
    expect(((error as InstanceType<typeof CoverageObservationError>).cause as Error).message).toBe(
        'inventory unavailable'
    );
    expect(coverageFailureReason(error)).toContain('Database connection failed');
    expect(coverageFailureReason(error)).not.toContain('inventory unavailable');
    await expect(migrationCoverage()).rejects.toThrow('Incompatible coverage vector schema');
    for (const [operation, generation, view, logical] of [
        ['exists', 'openai1536', 'FULL_TEXT', 'credential_full_text'],
        ['schema', 'nova1024v1', 'DOMAIN_SUMMARY', 'credential_domain_summary'],
        ['scroll', 'openai1536', 'KEY_CLAIMS', 'credential_key_claims'],
        ['scroll', 'nova1024v1', 'TECHNICAL_METADATA', 'credential_technical_metadata'],
    ]) {
        vectorFailure = {
            operation,
            collection: `fixture__${logical}${generation === 'nova1024v1' ? '__nova2_text1024_privacy_v1' : ''}`,
            cause: {
                status: 403,
                message: 'secret learner URI token',
                data: { error: 'secret' },
            },
        };
        const failedVector = migrationCoverage();
        expect(migrationCoverage()).toBe(failedVector);
        await expect(failedVector).rejects.toThrow('Coverage observation failed');
        const error = await failedVector.catch((value: unknown) => value);
        expect(coverageFailureStage(error)).toBe(
            operation === 'scroll' ? 'vector-read' : 'vector-schema'
        );
        expect(coverageVectorFailure(error)).toEqual({
            generation,
            view,
            category: 'authorization',
            httpStatus: 403,
        });
        expect(JSON.stringify(coverageVectorFailure(error))).not.toContain('fixture');
        expect(JSON.stringify(coverageVectorFailure(error))).not.toContain('secret');
    }
    vectorFailure = undefined;
    const first = migrationCoverage();
    expect(migrationCoverage()).toBe(first);
    const result = await first;
    expect(result).toMatchObject({
        novaReady: 1,
        openaiOnly: 1,
        unresolved: 3,
        rollbackCopies: 1,
        observedRecords: 5,
        totalRecords: 5,
        complete: true,
    });
    expect(JSON.stringify(result)).not.toContain('did:web');
    expect(JSON.stringify(result)).not.toContain('hash');
    expect(await migrationCoverage()).toBe(result);
    expect(connects).toBe(7);
});
