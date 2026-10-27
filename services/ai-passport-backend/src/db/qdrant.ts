import { decryptCleanupScope } from './vector-source';
import { prepareCredentialPayloadIndexes } from './credential-payload-indexes';
import { runWithAiPrivacyContext } from '../ai/privacy';
import { withOwnerOperation } from '../services/dataErasure';
import type { VectorSource } from './vector-source';
import type { ChatDB } from '.';
import { currentGeneration } from '../ai/embedding-generation';
import { randomUUID } from 'node:crypto';
import { QdrantClient } from '@qdrant/js-client-rest';
import { z } from 'zod';
import { QDRANT_HOST, QDRANT_PORT, QDRANT_HTTPS, QDRANT_API_KEY } from '../constants/env';
import {
    CREDENTIAL_COLLECTION_PREFIXES,
    vectorInventory,
    resolveVectorCollection,
} from '../constants/collections';
import { db } from '.';
import { getCurrentAiSubject } from '../ai/privacy';
import {
    assertOwnerOperationActive,
    isDataErasureRequested,
    PRIVACY_MAINTENANCE_KEY,
} from '../services/dataErasure';
import cache from '../utils/cache';

const QdrantConfigSchema = z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6333),
    timeout: z.number().optional(),
    apiKey: z.string().optional(),
    https: z.boolean().default(false),
});
export type QdrantConfig = z.infer<typeof QdrantConfigSchema>;
export type SearchSimilarOptions = {
    timeoutMs?: number;
    serverTimeoutSeconds?: number;
};
type PointId = string | number;
type VectorPoint = {
    id: PointId;
    vector: number[];
    payload?: Record<string, unknown>;
};
type ScrollRequest = NonNullable<Parameters<QdrantClient['scroll']>[1]>;
type PointFilter = NonNullable<ScrollRequest['filter']>;
type ScrollOffset = NonNullable<ScrollRequest['offset']>;

const ownerVectorCollections = vectorInventory;
const notErased: PointFilter = {
    must_not: [{ key: 'erased', match: { value: true } }],
};
const metadataFields = [
    'sourceEpoch',
    'recordType',
    'type',
    'did',
    'uri',
    'credentialType',
    'consentRevision',
    'contentHash',
    'timestamp',
    'messageId',
    'threadId',
    'userId',
    'role',
];
const credentialDimensions = [
    'fullText',
    'domainSummary',
    'keyClaims',
    'technicalMetadata',
    'comparisonContext',
];
const credentialMetadataFields = [
    'sourceEpoch',
    'did',
    'uri',
    'credentialType',
    'consentRevision',
    'contentHash',
    'timestamp',
];
const messageMetadataFields = [
    'sourceEpoch',
    'messageId',
    'threadId',
    'userId',
    'consentRevision',
    'timestamp',
];
const messageRoles = ['user', 'assistant', 'system', 'tool'];

// Only typed pointers and provenance survive the storage boundary. Legacy free text
// must not become model context, even before the maintenance migration has run.
function metadataOnly(
    collection: string,
    payload: Record<string, unknown> = {}
): Record<string, string> {
    const result: Record<string, string> = {};
    const chat = collectionOwnerField(collection) === 'userId';
    const fields = chat ? messageMetadataFields : credentialMetadataFields;
    for (const field of fields) {
        if (typeof payload[field] === 'string') result[field] = payload[field];
    }
    result.recordType = chat ? 'chat-message' : 'credential';
    if (chat && typeof payload.role === 'string' && messageRoles.includes(payload.role))
        result.role = payload.role;
    if (!chat && typeof payload.type === 'string' && credentialDimensions.includes(payload.type))
        result.type = payload.type;
    return result;
}

function collectionOwnerField(collection: string) {
    const configured = ownerVectorCollections.find(entry => entry.collection === collection);
    if (!configured) throw new Error('Unconfigured private vector collection');
    return configured.ownerField;
}

function ownerFilter(collection: string, did: string, extra?: PointFilter): PointFilter {
    if (!did.trim()) throw new Error('Vector owner is required');
    return {
        must: [
            { key: collectionOwnerField(collection), match: { value: did } },
            ...(extra ? [extra] : []),
        ],
        must_not: notErased.must_not,
    };
}

// The openai1536 collections (same rule as legacyVectorInventory).
const legacyVectorInventory = vectorInventory.filter(
    entry => !entry.collection.endsWith('__nova2_text1024_privacy_v1')
);
const isLegacyCollection = (collection: string) =>
    legacyVectorInventory.some(entry => entry.collection === collection);
// Fresh read each time; only legacy collections ever pay for it.
async function retiredState(
    collection: string,
    database: Pick<ChatDB, 'listRetiredVectorCollections'> = db
): Promise<'dropping' | 'dropped' | undefined> {
    if (!isLegacyCollection(collection)) return undefined;
    return (await database.listRetiredVectorCollections()).find(entry => entry._id === collection)
        ?.state;
}
async function assertCollectionNotRetired(collection: string) {
    if (await retiredState(collection)) throw new Error('Legacy vector collection is retired');
}
async function droppedCollections(
    database: Pick<ChatDB, 'listRetiredVectorCollections'> = db
): Promise<Set<string>> {
    return new Set(
        (await database.listRetiredVectorCollections())
            .filter(entry => entry.state === 'dropped')
            .map(entry => entry._id)
    );
}

let qdrantClient: QdrantClient | null = null;
let privacyCapabilities: Promise<void> | undefined;
const boundedClients = new WeakMap<SearchSimilarOptions, QdrantClient>();
const readyCollections = new Map<string, string>();
const collectionInitializations = new Map<string, Promise<void>>();
// An incomplete attempt forces read-only verification on retry, even when the
// collection is permissive. A name alone never grants index-write ownership.
const unverifiedCredentialCollections = new Set<string>();

export function getQdrantClient(partialConfig: Partial<QdrantConfig> = {}): QdrantClient {
    if (!qdrantClient) {
        const config = QdrantConfigSchema.parse({
            host: QDRANT_HOST,
            port: QDRANT_PORT,
            https: QDRANT_HTTPS,
            apiKey: QDRANT_API_KEY,
            ...partialConfig,
        });
        qdrantClient = new QdrantClient(config);
    }
    return qdrantClient;
}

function assertCompleted(result: { status?: string }) {
    if (result.status !== 'completed') throw new Error('Qdrant privacy mutation did not complete');
}

// The SDK spreads upsert body fields, including update_filter. A behavioral probe
// also catches older SDK/proxy versions that silently omit this critical field.
async function conditionalUpsert(
    client: QdrantClient,
    collection: string,
    points: VectorPoint[],
    updateFilter: PointFilter = notErased
) {
    const request = {
        points,
        wait: true,
        ordering: 'strong' as const,
        update_filter: updateFilter,
    };
    const result = await client.upsert(collection, request);
    assertCompleted(result);
    return result;
}

async function fencePoints(client: QdrantClient, collection: string, ids: PointId[]) {
    for (let index = 0; index < ids.length; index += 256) {
        const result = await client.upsert(collection, {
            points: ids
                .slice(index, index + 256)
                .map(id => ({ id, vector: {}, payload: { erased: true } })),
            wait: true,
            ordering: 'strong',
        });
        assertCompleted(result);
    }
}

export function assertQdrantPrivacyCapabilities(): Promise<void> {
    if (privacyCapabilities) return privacyCapabilities;
    privacyCapabilities = (async () => {
        const client = getQdrantClient();
        const { version } = await client.versionInfo();
        const parsed = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
        if (
            !parsed ||
            Number(parsed[1]) < 1 ||
            (Number(parsed[1]) === 1 && Number(parsed[2]) < 17)
        ) {
            throw new Error(
                'Qdrant 1.17+ with conditional upserts is required for private vectors'
            );
        }
        const collection = `privacy_capability_${randomUUID().replaceAll('-', '')}`;
        await client.createCollection(collection, {
            vectors: { size: 2, distance: 'Dot' },
        });
        let failure: { error: unknown } | undefined;
        try {
            // This owned probe also filters on the deletion fence under strict mode.
            assertCompleted(
                await client.createPayloadIndex(collection, {
                    field_name: 'erased',
                    field_schema: 'bool',
                    wait: true,
                })
            );
            assertCompleted(
                await client.upsert(collection, {
                    points: [{ id: 1, vector: [1, 0], payload: { private: 'synthetic probe' } }],
                    wait: true,
                    ordering: 'strong',
                })
            );
            await fencePoints(client, collection, [1, 2]);
            await conditionalUpsert(client, collection, [
                {
                    id: 1,
                    vector: [1, 0],
                    payload: { marker: 'must not replace existing data fence' },
                },
                {
                    id: 2,
                    vector: [1, 0],
                    payload: { marker: 'must not replace future write fence' },
                },
                { id: 3, vector: [1, 0], payload: { marker: 'inserted' } },
            ]);
            await conditionalUpsert(client, collection, [
                { id: 3, vector: [0, 1], payload: { marker: 'updated' } },
            ]);
            const points = await client.retrieve(collection, {
                ids: [1, 2, 3],
                with_payload: true,
                with_vector: true,
                consistency: 'all',
            });
            for (const id of [1, 2]) {
                const point = points.find(point => point.id === id);
                if (
                    !point ||
                    JSON.stringify(point.payload) !== '{"erased":true}' ||
                    !point.vector ||
                    Array.isArray(point.vector) ||
                    Object.keys(point.vector).length !== 0
                ) {
                    throw new Error(
                        'Qdrant conditional upsert or vector removal semantics are unavailable'
                    );
                }
            }
            const updated = points.find(point => point.id === 3);
            if (
                updated?.payload?.marker !== 'updated' ||
                JSON.stringify(updated.vector) !== '[0,1]'
            )
                throw new Error('Qdrant conditional upsert semantics are unavailable');
        } catch (error) {
            failure = { error };
        }
        if (!(await client.deleteCollection(collection)))
            throw new Error('Qdrant capability probe cleanup failed');
        if (failure) throw failure.error;
    })().catch(error => {
        privacyCapabilities = undefined;
        throw error;
    });
    return privacyCapabilities;
}

export async function checkQdrantHealth(): Promise<boolean> {
    try {
        await getQdrantClient().versionInfo();
        return true;
    } catch {
        return false;
    }
}

export async function createCollectionIfNotExists(
    collectionName: string,
    dimensions: number,
    distance: 'Cosine' | 'Euclid' | 'Dot' = 'Cosine'
): Promise<void> {
    collectionName = resolveVectorCollection(collectionName);
    const ownerField = collectionOwnerField(collectionName);
    // Never recreate a legacy collection the explicit drop action retired.
    await assertCollectionNotRetired(collectionName);
    await assertQdrantPrivacyCapabilities();
    const expectedSchema = `${dimensions}|${distance}`;
    const ready = readyCollections.get(collectionName);
    if (ready) {
        if (ready !== expectedSchema) throw new Error('Incompatible cached vector schema');
        return;
    }
    const current = collectionInitializations.get(collectionName);
    if (current) {
        await current;
        if (readyCollections.get(collectionName) !== expectedSchema)
            throw new Error('Incompatible vector schema');
        return;
    }
    const initialization = (async () => {
        const client = getQdrantClient();
        let createdHere = false;
        if (!(await client.collectionExists(collectionName)).exists) {
            try {
                const created = await client.createCollection(collectionName, {
                    vectors: { size: dimensions, distance },
                });
                if (!created) throw new Error('Vector collection creation did not complete');
                createdHere = true;
                if (ownerField === 'did') unverifiedCredentialCollections.add(collectionName);
            } catch (error) {
                if (
                    !error ||
                    typeof error !== 'object' ||
                    !('status' in error) ||
                    error.status !== 409
                )
                    throw error;
            }
        }
        const info = await client.getCollection(collectionName);
        const schema = info.config.params.vectors;
        if (
            !schema ||
            !('size' in schema) ||
            schema.size !== dimensions ||
            schema.distance !== distance
        )
            throw new Error('Incompatible vector collection schema');
        const strict = info.config.strict_mode_config;
        const requiresIndexes =
            createdHere ||
            unverifiedCredentialCollections.has(collectionName) ||
            (strict?.enabled &&
                (strict.unindexed_filtering_retrieve === false ||
                    strict.unindexed_filtering_update === false));
        if (ownerField === 'did' && requiresIndexes) {
            await prepareCredentialPayloadIndexes(client, collectionName, createdHere);
            unverifiedCredentialCollections.delete(collectionName);
        }
        readyCollections.set(collectionName, expectedSchema);
    })().finally(() => collectionInitializations.delete(collectionName));
    collectionInitializations.set(collectionName, initialization);
    return initialization;
}

export async function storeEmbeddings(
    collectionName: string,
    points: VectorPoint[],
    source: VectorSource
) {
    if (!source?.epoch) throw new Error('Versioned vector source required');
    collectionName = resolveVectorCollection(collectionName);
    await assertCollectionNotRetired(collectionName);
    const did = getCurrentAiSubject();
    if (!did) throw new Error('Authenticated vector owner is required');
    const ownerField = collectionOwnerField(collectionName);
    await assertOwnerOperationActive(did);
    await assertQdrantPrivacyCapabilities();
    const safePoints = points.map(point => {
        if (point.payload?.[ownerField] !== did) throw new Error('Vector owner mismatch');
        return {
            id: point.id,
            vector: point.vector,
            payload: metadataOnly(collectionName, point.payload),
        };
    });
    if (!safePoints.length) return;
    // This transaction commits before any network send. Erasure fences this exact
    // ID set, including an upsert paused in transit or not yet sent to Qdrant.
    if (
        safePoints.some(
            point => point.payload.sourceEpoch !== source.epoch || point.payload.uri !== source.key
        )
    )
        throw new Error('Vector source pointer mismatch');
    await db.registerSourceVectorPoints(
        did,
        collectionName,
        safePoints.map(point => point.id),
        source
    );
    await assertOwnerOperationActive(did);
    const result = await conditionalUpsert(
        getQdrantClient(),
        collectionName,
        safePoints,
        ownerFilter(collectionName, did)
    );
    await assertOwnerOperationActive(did);
    return result;
}

export async function searchSimilar(
    collectionName: string,
    vector: number[],
    limit = 5,
    filter?: Record<string, unknown>,
    options?: SearchSimilarOptions
) {
    collectionName = resolveVectorCollection(collectionName);
    const did = getCurrentAiSubject();
    if (!did) throw new Error('Authenticated vector owner is required');
    await assertOwnerOperationActive(did);
    const scopedFilter = ownerFilter(collectionName, did, filter);
    let client = getQdrantClient();
    if (options?.timeoutMs !== undefined) {
        const existing = boundedClients.get(options);
        if (existing) client = existing;
        else {
            client = new QdrantClient(
                QdrantConfigSchema.parse({
                    host: QDRANT_HOST,
                    port: QDRANT_PORT,
                    https: QDRANT_HTTPS,
                    apiKey: QDRANT_API_KEY,
                    timeout: options.timeoutMs,
                })
            );
            boundedClients.set(options, client);
        }
    }
    const points = await client.search(collectionName, {
        vector,
        limit,
        filter: scopedFilter,
        with_payload: metadataFields,
        with_vector: false,
        ...(options?.serverTimeoutSeconds === undefined
            ? {}
            : { timeout: options.serverTimeoutSeconds }),
    });
    await assertOwnerOperationActive(did);
    const validPoints =
        currentGeneration() === 'nova1024v1' && collectionOwnerField(collectionName) === 'did'
            ? (
                  await Promise.all(
                      points.map(async point => {
                          const uri = point.payload?.uri;
                          if (typeof uri !== 'string') return null;
                          const source = await db.getEmbeddingCredentialVersion(did, uri);
                          return source?.embeddingEpoch === point.payload?.sourceEpoch &&
                              typeof point.payload?.sourceEpoch === 'string' &&
                              source?.contentHash === point.payload?.contentHash &&
                              source?.consent.revision === point.payload?.consentRevision
                              ? point
                              : null;
                      })
                  )
              ).filter((point): point is (typeof points)[number] => point !== null)
            : points;
    return validPoints.map(({ id, score, payload }) => ({
        id,
        score,
        payload: metadataOnly(collectionName, payload ?? {}),
    }));
}

async function existingOwnerCollections(did: string) {
    const client = getQdrantClient();
    const available = new Set((await client.getCollections()).collections.map(({ name }) => name));
    const references = await db.getVectorPointReferences(did);
    const dropped = await droppedCollections();
    for (const { collection, ids } of references) {
        collectionOwnerField(collection);
        if (ids.length && !available.has(collection) && !dropped.has(collection))
            throw new Error(`Registered private vector collection is missing: ${collection}`);
    }
    return ownerVectorCollections.filter(({ collection }) => available.has(collection));
}

async function* ownerPages(collection: string, did: string, extra?: PointFilter) {
    let offset: ScrollOffset | undefined;
    do {
        const page = await getQdrantClient().scroll(collection, {
            filter: ownerFilter(collection, did, extra),
            limit: 256,
            with_payload: metadataFields,
            with_vector: false,
            consistency: 'all',
            ...(offset !== undefined ? { offset } : {}),
        });
        yield page.points;
        offset = page.next_page_offset ?? undefined;
    } while (offset !== undefined);
}

export type CredentialVectorCoverage = Map<string, Set<string>>;
export const CREDENTIAL_VECTOR_COLLECTION_COUNT = Object.values(
    CREDENTIAL_COLLECTION_PREFIXES
).length;
export const getCredentialVectorCoverage = async (
    did: string,
    uris: string[],
    version?: {
        contentHash: string;
        consentRevision: string;
        sourceEpoch?: string | null;
    }
): Promise<CredentialVectorCoverage> => {
    await assertOwnerOperationActive(did);
    const uniqueUris = [...new Set(uris)];
    const coverage: CredentialVectorCoverage = new Map(
        uniqueUris.map(uri => [uri, new Set<string>()])
    );
    if (!uniqueUris.length) return coverage;
    for (const { collection, ownerField } of await existingOwnerCollections(did)) {
        if (
            ownerField !== 'did' ||
            !Object.values(CREDENTIAL_COLLECTION_PREFIXES)
                .map(resolveVectorCollection)
                .includes(collection)
        )
            continue;
        for (let index = 0; index < uniqueUris.length; index += 256) {
            for await (const points of ownerPages(collection, did, {
                must: [{ key: 'uri', match: { any: uniqueUris.slice(index, index + 256) } }],
            })) {
                for (const point of points) {
                    const uri = point.payload?.uri;
                    if (
                        typeof uri === 'string' &&
                        (!version ||
                            (point.payload?.contentHash === version.contentHash &&
                                point.payload?.consentRevision === version.consentRevision &&
                                (version.sourceEpoch === undefined ||
                                    (typeof version.sourceEpoch === 'string' &&
                                        point.payload?.sourceEpoch === version.sourceEpoch))))
                    )
                        coverage.get(uri)?.add(collection);
                }
            }
        }
    }
    await assertOwnerOperationActive(did);
    return coverage;
};

export type SourceCleanupProgress = {
    units: number;
    discoveryPages: number;
    pointsFenced: number;
    tasksCompleted: number;
    pendingTasks: number;
    pendingPoints: number;
};
// One unit is one discovery page/collection, one <=256-point fence batch, or one task acknowledgement.
// Only pending references are paged. Permanent Mongo admission bits/Qdrant tombstones are never removed.
export async function recoverSourceVectorCleanup({
    did,
    limit = 1,
    database = db,
}: {
    did?: string;
    limit?: number;
    database?: ChatDB;
} = {}): Promise<SourceCleanupProgress> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 32)
        throw new Error('Cleanup unit limit must be 1–32');
    const progress = {
        units: 0,
        discoveryPages: 0,
        pointsFenced: 0,
        tasksCompleted: 0,
    };
    for (; progress.units < limit; progress.units++) {
        const task = await database.getSourceCleanupTask(did);
        if (!task) break;
        const scope = decryptCleanupScope(task);
        await runWithAiPrivacyContext(scope.did, () =>
            withOwnerOperation(scope.did, () =>
                database.withSourceCleanupLease(scope.did, async assertLease => {
                    await assertLease();
                    // Nothing is sent on a fully completed retry. Capabilities are needed only for pending work.
                    const rows = await database.getDeletedSourceVectorReferences(scope.did, 256);
                    if (rows.length) {
                        const collection = rows[0].collection;
                        collectionOwnerField(collection);
                        if ((await retiredState(collection, database)) === 'dropped') {
                            // The explicit drop deleted this collection and its points.
                            await assertLease();
                            await database.acknowledgeSourceVectorFences(
                                scope.did,
                                collection,
                                rows.map(row => row.pointId)
                            );
                            progress.pointsFenced += rows.length;
                            return;
                        }
                        await assertQdrantPrivacyCapabilities();
                        if (!(await getQdrantClient().collectionExists(collection)).exists)
                            throw new Error(
                                'Registered vector collection missing; restore before recovery'
                            );
                        await assertLease();
                        await fencePoints(
                            getQdrantClient(),
                            collection,
                            rows.map(row => row.pointId)
                        );
                        await assertLease();
                        await database.acknowledgeSourceVectorFences(
                            scope.did,
                            collection,
                            rows.map(row => row.pointId)
                        );
                        progress.pointsFenced += rows.length;
                        return;
                    }
                    if (task.discoveryComplete) {
                        await assertLease();
                        if (await database.finishSourceCleanupTask(scope.did, task))
                            progress.tasksCompleted += 1;
                        return;
                    }
                    const collection = task.collections[task.collectionIndex];
                    collectionOwnerField(collection);
                    await assertQdrantPrivacyCapabilities();
                    const client = getQdrantClient();
                    let next: string | number | undefined;
                    if ((await client.collectionExists(collection)).exists) {
                        await assertLease();
                        const page = await client.scroll(collection, {
                            filter: ownerFilter(collection, scope.did, {
                                must: [
                                    {
                                        key: task.kind === 'credential' ? 'uri' : 'threadId',
                                        match: { value: scope.key },
                                    },
                                ],
                            }),
                            limit: 256,
                            ...(task.offset === undefined ? {} : { offset: task.offset }),
                            with_payload: metadataFields,
                            with_vector: false,
                        });
                        const ids = page.points
                            .filter(point => !point.payload?.sourceEpoch)
                            .map(point => point.id);
                        await assertLease();
                        if (ids.length)
                            await database.registerDeletedLegacyVectorPoints(
                                scope.did,
                                collection,
                                ids
                            );
                        const offset = page.next_page_offset;
                        if (typeof offset === 'string' || typeof offset === 'number') next = offset;
                    }
                    await assertLease();
                    const collectionIndex =
                        next === undefined ? task.collectionIndex + 1 : task.collectionIndex;
                    await database.advanceSourceCleanupTask(scope.did, task, {
                        collectionIndex,
                        offset: next,
                        discoveryComplete: collectionIndex >= task.collections.length,
                    });
                    progress.discoveryPages += 1;
                })
            )
        );
    }
    return { ...progress, ...(await database.sourceCleanupSummary(did)) };
}

export const fenceDeletedSourceVectors = async (did: string, database: ChatDB = db) => {
    const result = await recoverSourceVectorCleanup({ did, limit: 32, database });
    if (result.pendingTasks || result.pendingPoints)
        throw new Error('Source vector cleanup pending; bounded recovery required');
    return result;
};
export const deleteCredentialEmbeddings = async (
    did: string,
    uris: string[],
    database: ChatDB = db
) => {
    if (!uris.length) return;
    await assertOwnerOperationActive(did);
    await database.queueSourceVectorCleanup(did, 'credential', uris);
    return fenceDeletedSourceVectors(did, database);
};
export const deleteThreadEmbeddings = async (
    did: string,
    threadId: string,
    database: ChatDB = db
) => {
    await assertOwnerOperationActive(did);
    await database.queueSourceVectorCleanup(did, 'thread', [threadId]);
    return fenceDeletedSourceVectors(did, database);
};

// Legacy sweep only: tombstone ledger-registered openai1536 points. The caller
// has already recorded them as permanently deleted references.
export const fenceLegacySweepPoints = async (
    did: string,
    collection: string,
    ids: PointId[],
    database: ChatDB = db
) => {
    if (!legacyVectorInventory.some(entry => entry.collection === collection))
        throw new Error('Only legacy openai1536 collections can be swept');
    if (!ids.length) return;
    await assertQdrantPrivacyCapabilities();
    await fencePoints(getQdrantClient(), collection, ids);
    await database.acknowledgeSourceVectorFences(did, collection, ids);
};

// Explicit admin drop of one retired legacy collection. The ledger entry is
// written first (blocking writes), the collection deleted and confirmed gone,
// and only then marked dropped.
export const dropRetiredLegacyCollection = async (
    collection: string,
    database: ChatDB = db
): Promise<{ collection: string; points: number; existed: boolean }> => {
    if (!isLegacyCollection(collection))
        throw new Error('Only legacy openai1536 collections can be dropped');
    const client = getQdrantClient();
    await database.markVectorCollectionRetired(collection, 'dropping');
    readyCollections.delete(collection);
    const existed = (await client.collectionExists(collection)).exists;
    let points = 0;
    if (existed) {
        points = (await client.count(collection, { exact: true })).count;
        if (!(await client.deleteCollection(collection)))
            throw new Error('Legacy collection deletion did not complete');
    }
    if ((await client.collectionExists(collection)).exists)
        throw new Error('Legacy collection still exists after deletion');
    await database.markVectorCollectionRetired(collection, 'dropped');
    return { collection, points, existed };
};
export const legacyCollectionStatus = async () => {
    const client = getQdrantClient();
    const retired = new Map(
        (await db.listRetiredVectorCollections()).map(entry => [entry._id, entry.state])
    );
    return Promise.all(
        legacyVectorInventory.map(async ({ collection }) => {
            const exists = (await client.collectionExists(collection)).exists;
            return {
                collection,
                exists,
                points: exists ? (await client.count(collection, { exact: true })).count : 0,
                retired: retired.get(collection) ?? null,
            };
        })
    );
};

export const exportOwnerVectors = async (did: string) => {
    const result: Record<string, { id: PointId; payload: Record<string, string> }[]> = {};
    for (const { collection } of await existingOwnerCollections(did)) {
        const points: { id: PointId; payload: Record<string, string> }[] = [];
        for await (const page of ownerPages(collection, did)) {
            points.push(
                ...page.map(({ id, payload }) => ({
                    id,
                    payload: metadataOnly(collection, payload ?? {}),
                }))
            );
        }
        result[collection] = points;
    }
    return result;
};

export const deleteOwnerVectors = async (did: string) => {
    await assertQdrantPrivacyCapabilities();
    if (!(await isDataErasureRequested(did)))
        throw new Error('Owner erasure must be requested before vector fencing');
    const collections = await existingOwnerCollections(did);
    // Fence registration for discovered historical points is allowed only after
    // Mongo owner fencing. These references are retained across partial retries.
    for (const { collection } of collections) {
        for await (const points of ownerPages(collection, did)) {
            if (points.length)
                await db.registerErasedVectorPoints(
                    did,
                    collection,
                    points.map(({ id }) => id)
                );
        }
    }
    const references = await db.getVectorPointReferences(did);
    const dropped = await droppedCollections();
    for (const { collection, ids } of references) {
        collectionOwnerField(collection);
        for (let index = 0; index < ids.length; index += 256) {
            const batch = ids.slice(index, index + 256);
            // A dropped legacy collection holds no data to fence.
            if (!dropped.has(collection)) await fencePoints(getQdrantClient(), collection, batch);
            await db.acknowledgeErasedSourceVectorFences(did, collection, batch);
        }
    }
    return collections.map(({ collection }) => collection);
};

export const migrateLegacyVectorPayloads = async ({ apply }: { apply: boolean }) => {
    if (apply && (!cache.redis || !(await cache.redis.exists(PRIVACY_MAINTENANCE_KEY))))
        throw new Error('Persistent privacy maintenance is required for vector migration');
    if (apply) await assertQdrantPrivacyCapabilities();
    const client = getQdrantClient();
    const available = new Set((await client.getCollections()).collections.map(({ name }) => name));
    const report = {
        apply,
        scanned: 0,
        minimized: 0,
        registered: 0,
        fenced: 0,
        unowned: 0,
        missingCollections: [] as string[],
    };
    for (const { collection, ownerField } of ownerVectorCollections) {
        if (!available.has(collection)) {
            report.missingCollections.push(collection);
            continue;
        }
        let offset: ScrollOffset | undefined;
        do {
            const page = await client.scroll(collection, {
                limit: 256,
                with_payload: true,
                with_vector: false,
                consistency: 'all',
                ...(offset !== undefined ? { offset } : {}),
            });
            for (const point of page.points) {
                report.scanned += 1;
                if (point.payload?.erased === true) {
                    if (apply) await fencePoints(client, collection, [point.id]);
                    report.fenced += 1;
                    continue;
                }
                const did = point.payload?.[ownerField];
                if (typeof did !== 'string' || !did.trim()) {
                    report.unowned += 1;
                    if (apply)
                        throw new Error(
                            'Legacy vector has no attributable owner; migration cannot safely complete'
                        );
                    continue;
                }
                if (apply) await db.registerLegacyVectorPoints(did, collection, [point.id]);
                report.registered += 1;
                if (await isDataErasureRequested(did)) {
                    if (apply) await fencePoints(client, collection, [point.id]);
                    report.fenced += 1;
                } else {
                    const payload = metadataOnly(collection, point.payload ?? {});
                    if (apply) {
                        if (!cache.redis || !(await cache.redis.exists(PRIVACY_MAINTENANCE_KEY)))
                            throw new Error('Privacy maintenance ended during vector migration');
                        // Payload-only updates preserve existing vectors but cannot create a
                        // point; owner/erased filtering prevents resurrecting a concurrent fence.
                        assertCompleted(
                            await client.overwritePayload(collection, {
                                payload,
                                filter: ownerFilter(collection, did, {
                                    must: [{ has_id: [point.id] }],
                                }),
                                wait: true,
                                ordering: 'strong',
                            })
                        );
                    }
                    report.minimized += 1;
                }
            }
            offset = page.next_page_offset ?? undefined;
        } while (offset !== undefined);
    }
    return report;
};
