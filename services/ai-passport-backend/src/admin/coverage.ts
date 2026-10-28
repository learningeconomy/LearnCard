import { observeCoverageStage } from './coverage-error';
import { generationDimensions } from '../ai/embedding-generation';
import { MongoClient, type Document } from 'mongodb';
import { MONGO_URI, MONGO_DB } from '../constants/env';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_HOST, QDRANT_PORT, QDRANT_HTTPS, QDRANT_API_KEY } from '../constants/env';
import { CREDENTIAL_COLLECTION_PREFIXES, collectionForGeneration } from '../constants/collections';
import { getPrivacySubjectRef } from '../ai/privacy-keys';
import { isDataErasureRequested } from '../services/dataErasure';
import { classifyCoverage, sourceFingerprint, type CoverageSource } from './coverage-model';

import { ObjectId } from 'mongodb';
import { vectorSourceRef } from '../db/vector-source';
import {
    CoverageScan,
    type CoverageEntry,
    type CoverageScanStorage,
    type CoverageChange,
} from './coverage-scan';
const BATCH_SIZE = 100;
let mongo: MongoClient | undefined;
let scan: CoverageScan | undefined;
let stream: ReturnType<ReturnType<MongoClient['db']>['watch']> | undefined;
let inFlight: Promise<Awaited<ReturnType<typeof stepInventory>>> | undefined;
let cached: Awaited<ReturnType<typeof stepInventory>> | undefined;
export function migrationCoverage() {
    if (inFlight) return inFlight;
    if (cached && Date.now() - Date.parse(cached.observedAt) < 5000) return Promise.resolve(cached);
    inFlight = stepInventory()
        .then(value => (cached = value))
        .catch(async error => {
            scan = undefined;
            cached = undefined;
            await stream?.close().catch(() => {});
            stream = undefined;
            throw error;
        })
        .finally(() => {
            inFlight = undefined;
        });
    return inFlight;
}
async function stepInventory() {
    mongo ??= new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 2000,
        socketTimeoutMS: 3000,
    });
    await observeCoverageStage('database', () => mongo!.connect());
    const database = mongo.db(MONGO_DB);
    const projection = {
        _id: 1,
        did: 1,
        uri: 1,
        embeddingEpoch: 1,
        'verification.contentHash': 1,
        'verification.consent.revision': 1,
    };
    const sources = database.collection<CoverageSource>('credentials');
    if (!scan) {
        stream = database.watch(
            [
                {
                    $match: {
                        'ns.coll': {
                            $in: ['credentials', 'owner_vector_references', 'owner_write_guards'],
                        },
                    },
                },
                {
                    $project: {
                        operationType: 1,
                        documentKey: 1,
                        ns: 1,
                        'fullDocument.sourceRef': 1,
                        'fullDocument.erased': 1,
                    },
                },
            ],
            { fullDocument: 'updateLookup', maxAwaitTimeMS: 50 }
        );
        const storage: CoverageScanStorage = {
            highWater: async () =>
                observeCoverageStage('source-read', async () =>
                    String(
                        (
                            await sources
                                .find({}, { projection: { _id: 1 }, maxTimeMS: 2000 })
                                .sort({ _id: -1 })
                                .limit(1)
                                .next()
                        )?._id ?? ''
                    )
                ),
            page: async (cursor, high, limit) => {
                const rows = await observeCoverageStage('source-read', () =>
                    sources
                        .find(
                            {
                                _id: {
                                    ...(cursor ? { $gt: new ObjectId(cursor) } : {}),
                                    $lte: new ObjectId(high),
                                },
                            } as Document,
                            { projection, maxTimeMS: 2000 }
                        )
                        .sort({ _id: 1 })
                        .limit(limit)
                        .toArray()
                );
                const next = rows.length ? String(rows[rows.length - 1]._id) : cursor;
                return {
                    rows: await observe(rows),
                    cursor: next,
                    done: rows.length < limit || next === high,
                    scanned: rows.length,
                };
            },
            byIds: async ids =>
                observe(
                    await observeCoverageStage('source-read', () =>
                        sources
                            .find({ _id: { $in: ids.map(id => new ObjectId(id)) } } as Document, {
                                projection,
                                maxTimeMS: 2000,
                            })
                            .sort({ _id: 1 })
                            .limit(BATCH_SIZE)
                            .toArray()
                    )
                ),
            changes: async limit => {
                const events: CoverageChange[] = [];
                for (let i = 0; i < limit; i += 1) {
                    const change = await observeCoverageStage('change-stream', () =>
                        stream!.tryNext()
                    );
                    if (!change) return { events, drained: true };
                    if (!['insert', 'update', 'replace', 'delete'].includes(change.operationType)) {
                        events.push({ reset: true });
                        continue;
                    }
                    const event = change as unknown as {
                        operationType: string;
                        ns: { coll: string };
                        documentKey: { _id: unknown };
                        fullDocument?: { sourceRef?: string; erased?: boolean };
                    };
                    if (event.ns.coll === 'credentials')
                        events.push({
                            id: String(event.documentKey._id),
                            deleted: event.operationType === 'delete',
                        });
                    else if (
                        event.ns.coll === 'owner_vector_references' &&
                        event.fullDocument?.sourceRef
                    )
                        events.push({ sourceRef: event.fullDocument.sourceRef });
                    else if (
                        event.ns.coll !== 'owner_write_guards' ||
                        event.operationType === 'delete' ||
                        event.fullDocument?.erased === true
                    )
                        events.push({ reset: true });
                }
                return { events, drained: false };
            },
        };
        scan = new CoverageScan(storage, BATCH_SIZE);
    }
    const progress = await scan.step();
    return {
        ...classifyCoverage(progress.rows, progress.complete, BATCH_SIZE),
        scanning: progress.scanning,
        scannedThisPass: progress.scannedThisPass,
        pendingChanges: progress.pendingChanges,
        snapshotAt: progress.snapshotAt,
        inventoryBatchSize: BATCH_SIZE,
    };
}
async function observe(sources: CoverageSource[]): Promise<CoverageEntry[]> {
    const database = mongo!.db(MONGO_DB);
    const sourceStore = database.collection<CoverageSource>('credentials');
    const projection = {
        _id: 1,
        did: 1,
        uri: 1,
        embeddingEpoch: 1,
        'verification.contentHash': 1,
        'verification.consent.revision': 1,
    };

    const views = new Map<string, { openai: Set<string>; nova: Set<string> }>();
    const key = (did: string, uri: string) => JSON.stringify([did, uri]);
    const client = new QdrantClient({
        host: QDRANT_HOST,
        port: QDRANT_PORT,
        https: QDRANT_HTTPS,
        apiKey: QDRANT_API_KEY,
        timeout: 2500,
    });
    const deadline = Date.now() + 10000;
    let vectorsComplete = true;
    const dids = [
        ...new Set(sources.map(s => s.did).filter((s): s is string => typeof s === 'string')),
    ];
    const uris = [
        ...new Set(sources.map(s => s.uri).filter((s): s is string => typeof s === 'string')),
    ];
    const byKey = new Map(sources.map(s => [key(String(s.did), String(s.uri)), s]));
    if (dids.length && uris.length)
        for (const generation of ['openai1536', 'nova1024v1'] as const) {
            for (const [view, logical] of Object.entries(CREDENTIAL_COLLECTION_PREFIXES)) {
                const vectorContext = { generation, view };
                if (Date.now() > deadline) {
                    vectorsComplete = false;
                    continue;
                }
                const collection = collectionForGeneration(logical, generation);
                if (
                    !(
                        await observeCoverageStage(
                            'vector-schema',
                            () => client.collectionExists(collection),
                            vectorContext
                        )
                    ).exists
                )
                    continue;
                const schema = (
                    await observeCoverageStage(
                        'vector-schema',
                        () => client.getCollection(collection),
                        vectorContext
                    )
                ).config.params.vectors;
                if (
                    !schema ||
                    !('size' in schema) ||
                    schema.size !== generationDimensions(generation) ||
                    schema.distance !== 'Cosine'
                )
                    throw new Error('Incompatible coverage vector schema');
                let offset: string | number | Record<string, unknown> | undefined;
                for (let page = 0; page < 4; page += 1) {
                    if (Date.now() > deadline) {
                        vectorsComplete = false;
                        break;
                    }
                    const result = await observeCoverageStage(
                        'vector-read',
                        () =>
                            client.scroll(collection, {
                                filter: {
                                    must: [
                                        { key: 'did', match: { any: dids } },
                                        { key: 'uri', match: { any: uris } },
                                    ],
                                    must_not: [{ key: 'erased', match: { value: true } }],
                                },
                                offset,
                                limit: 500,
                                with_vector: false,
                                with_payload: [
                                    'did',
                                    'uri',
                                    'sourceEpoch',
                                    'contentHash',
                                    'consentRevision',
                                    'erased',
                                ],
                                timeout: 2,
                            }),
                        vectorContext
                    );
                    // A vector sent before a deletion fence must never count, even if remote cleanup is pending.
                    const references = await observeCoverageStage('source-read', () =>
                        database
                            .collection('owner_vector_references')
                            .find(
                                {
                                    collection,
                                    pointId: { $in: result.points.map(p => p.id) },
                                    deleted: { $ne: true },
                                },
                                {
                                    projection: { pointId: 1, subjectRef: 1, sourceEpoch: 1 },
                                    maxTimeMS: 2000,
                                }
                            )
                            .toArray()
                    );
                    const live = new Map(references.map(r => [String(r.pointId), r]));
                    for (const point of result.points) {
                        const p = point.payload;
                        if (
                            !p ||
                            p.erased === true ||
                            typeof p.did !== 'string' ||
                            typeof p.uri !== 'string'
                        )
                            continue;
                        const k = key(p.did, p.uri),
                            source = byKey.get(k),
                            ref = live.get(String(point.id));
                        if (
                            !source?.embeddingEpoch ||
                            !source.verification?.contentHash ||
                            !source.verification.consent?.revision ||
                            !ref ||
                            ref.subjectRef !== getPrivacySubjectRef(p.did) ||
                            ref.sourceEpoch !== source.embeddingEpoch ||
                            p.sourceEpoch !== source.embeddingEpoch ||
                            p.contentHash !== source.verification.contentHash ||
                            p.consentRevision !== source.verification.consent.revision
                        )
                            continue;
                        const entry = views.get(k) ?? {
                            openai: new Set<string>(),
                            nova: new Set<string>(),
                        };
                        entry[generation === 'openai1536' ? 'openai' : 'nova'].add(logical);
                        views.set(k, entry);
                    }
                    offset = result.next_page_offset ?? undefined;
                    if (offset === undefined) break;
                    if (page === 3) vectorsComplete = false;
                }
            }
        }
    // Recheck source versions, owner erasure and membership after remote observation.
    const current = await observeCoverageStage('source-read', () =>
        sourceStore
            .find({ _id: { $in: sources.map(s => s._id) } } as Document, {
                projection,
                maxTimeMS: 2000,
            })
            .toArray()
    );
    const currentMap = new Map(current.map(s => [String(s._id), s]));
    const erased = new Set<string>();
    for (const did of dids) {
        if (Date.now() > deadline) {
            vectorsComplete = false;
            break;
        }
        if (
            (await observeCoverageStage('owner-fence', () => isDataErasureRequested(did))) ||
            (await observeCoverageStage('owner-fence', () =>
                database
                    .collection('owner_write_guards')
                    .findOne({ _id: getPrivacySubjectRef(did), erased: true } as Document, {
                        projection: { _id: 1 },
                        maxTimeMS: 2000,
                    })
            ))
        )
            erased.add(did);
    }
    const rows = sources.flatMap(source => {
        const currentSource = currentMap.get(String(source._id));
        if (!currentSource) return [];
        const stable = Boolean(
            vectorsComplete &&
            currentSource &&
            sourceFingerprint(currentSource) === sourceFingerprint(source) &&
            !erased.has(String(source.did))
        );
        const view = views.get(key(String(source.did), String(source.uri)));
        return [
            {
                id: String(source._id),
                sourceRef: vectorSourceRef(String(source.did), 'credential', String(source.uri)),
                stable,
                novaViews: view?.nova.size ?? 0,
                openaiViews: view?.openai.size ?? 0,
            },
        ];
    });
    return rows;
}

/** Close process-local inventory observation during shutdown or offline fixture teardown. */
export async function closeMigrationCoverage() {
    await inFlight?.catch(() => {});
    await stream?.close();
    await mongo?.close();
    stream = undefined;
    mongo = undefined;
    scan = undefined;
    cached = undefined;
}
