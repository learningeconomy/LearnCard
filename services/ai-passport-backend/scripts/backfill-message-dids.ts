import { MongoClient, ObjectId, type Collection } from 'mongodb';

import { EMBEDDINGS_COLLECTION } from '../src/constants/collections';
import { MONGO_DB, MONGO_URI } from '../src/constants/env';
import { getQdrantClient } from '../src/db/qdrant';

type RecordId = number | string;

type MessageRecord = {
    _id: string;
    did?: unknown;
    threadId?: unknown;
};

type ThreadRecord = {
    did?: unknown;
    id?: unknown;
};

type VectorRecord = {
    id: RecordId;
    payload?: Record<string, unknown> | null;
};

type OwnershipUpdate = {
    did: string;
    id: RecordId;
};

export type MigrationCounts = {
    ambiguous: number;
    backfilled: number;
    mismatched: number;
    missing: number;
    orphaned: number;
    preserved: number;
    total: number;
};

export type MigrationReport = {
    final: {
        messages: MigrationCounts;
        vectors: MigrationCounts;
    };
    initial: {
        messages: MigrationCounts;
        vectors: MigrationCounts;
    };
    indexCreated: boolean;
};

export type MessageOwnershipStore = {
    createMessageOwnershipIndex(): Promise<boolean>;
    listMessages(afterId: string | undefined, limit: number): Promise<MessageRecord[]>;
    listThreads(threadIds: string[]): Promise<ThreadRecord[]>;
    updateMessageDids(updates: OwnershipUpdate[]): Promise<number>;
};

export type VectorOwnershipStore = {
    listVectors(
        offset: RecordId | undefined,
        limit: number
    ): Promise<{ nextOffset?: RecordId; records: VectorRecord[] }>;
    updateVectorDids(updates: OwnershipUpdate[]): Promise<number>;
};

const emptyCounts = (): MigrationCounts => ({
    ambiguous: 0,
    backfilled: 0,
    mismatched: 0,
    missing: 0,
    orphaned: 0,
    preserved: 0,
    total: 0,
});

const getOwners = (threads: ThreadRecord[]): Map<string, Set<string>> => {
    const owners = new Map<string, Set<string>>();

    for (const thread of threads) {
        if (typeof thread.id !== 'string' || typeof thread.did !== 'string') continue;

        const threadOwners = owners.get(thread.id) ?? new Set<string>();

        threadOwners.add(thread.did);
        owners.set(thread.id, threadOwners);
    }

    return owners;
};

const inspectBatch = (
    records: { did?: unknown; id: RecordId; threadId?: unknown }[],
    owners: Map<string, Set<string>>,
    counts: MigrationCounts
): OwnershipUpdate[] => {
    const updates: OwnershipUpdate[] = [];

    for (const record of records) {
        counts.total += 1;

        if (typeof record.threadId !== 'string') {
            counts.orphaned += 1;
            continue;
        }

        const threadOwners = owners.get(record.threadId);

        if (!threadOwners || threadOwners.size === 0) {
            counts.orphaned += 1;
            continue;
        }

        if (threadOwners.size > 1) {
            counts.ambiguous += 1;
            continue;
        }

        const [owner] = threadOwners;

        if (record.did === undefined) {
            counts.missing += 1;
            updates.push({ did: owner!, id: record.id });
            continue;
        }

        if (record.did !== owner) {
            counts.mismatched += 1;
            continue;
        }

        counts.preserved += 1;
    }

    return updates;
};

const scanMessages = async (
    store: MessageOwnershipStore,
    batchSize: number,
    apply: boolean
): Promise<MigrationCounts> => {
    const counts = emptyCounts();
    let afterId: string | undefined;

    while (true) {
        const records = await store.listMessages(afterId, batchSize);

        if (records.length === 0) break;

        const threadIds = [
            ...new Set(
                records
                    .map(({ threadId }) => threadId)
                    .filter((threadId): threadId is string => typeof threadId === 'string')
            ),
        ];
        const owners = getOwners(await store.listThreads(threadIds));
        const updates = inspectBatch(
            records.map(({ _id, did, threadId }) => ({ id: _id, did, threadId })),
            owners,
            counts
        );

        if (apply && updates.length > 0) {
            counts.backfilled += await store.updateMessageDids(updates);
        }

        afterId = records.at(-1)!._id;
    }

    return counts;
};

const scanVectors = async (
    messageStore: MessageOwnershipStore,
    vectorStore: VectorOwnershipStore | undefined,
    batchSize: number,
    apply: boolean
): Promise<MigrationCounts> => {
    const counts = emptyCounts();

    if (!vectorStore) return counts;

    let offset: RecordId | undefined;

    while (true) {
        const { nextOffset, records } = await vectorStore.listVectors(offset, batchSize);

        if (records.length === 0) break;

        const threadIds = [
            ...new Set(
                records
                    .map(({ payload }) => payload?.threadId)
                    .filter((threadId): threadId is string => typeof threadId === 'string')
            ),
        ];
        const owners = getOwners(await messageStore.listThreads(threadIds));
        const updates = inspectBatch(
            records.map(({ id, payload }) => ({
                id,
                did: payload?.userId,
                threadId: payload?.threadId,
            })),
            owners,
            counts
        );

        if (apply && updates.length > 0) {
            counts.backfilled += await vectorStore.updateVectorDids(updates);
        }

        if (nextOffset === undefined) break;
        offset = nextOffset;
    }

    return counts;
};

export const getUnresolvedCount = (counts: MigrationCounts): number =>
    counts.missing + counts.orphaned + counts.ambiguous + counts.mismatched;

export const getMigrationExitCode = (report: MigrationReport): number =>
    getUnresolvedCount(report.final.messages) + getUnresolvedCount(report.final.vectors) > 0
        ? 1
        : 0;

export const runMessageOwnershipMigration = async ({
    apply,
    batchSize,
    messageStore,
    vectorStore,
}: {
    apply: boolean;
    batchSize: number;
    messageStore: MessageOwnershipStore;
    vectorStore?: VectorOwnershipStore;
}): Promise<MigrationReport> => {
    if (!Number.isInteger(batchSize) || batchSize <= 0) {
        throw new Error('batchSize must be a positive integer');
    }

    const initial = {
        messages: await scanMessages(messageStore, batchSize, apply),
        vectors: await scanVectors(messageStore, vectorStore, batchSize, apply),
    };
    const final = apply
        ? {
              messages: await scanMessages(messageStore, batchSize, false),
              vectors: await scanVectors(messageStore, vectorStore, batchSize, false),
          }
        : initial;
    const unresolved = getUnresolvedCount(final.messages) + getUnresolvedCount(final.vectors);
    const indexCreated =
        apply && unresolved === 0 ? await messageStore.createMessageOwnershipIndex() : false;

    return { final, initial, indexCreated };
};

type MongoMessage = {
    _id: ObjectId;
    did?: unknown;
    threadId?: unknown;
};

type MongoThread = {
    did?: unknown;
    id?: unknown;
};

const createMongoStore = (
    messages: Collection<MongoMessage>,
    threads: Collection<MongoThread>
): MessageOwnershipStore => ({
    async createMessageOwnershipIndex() {
        const existingIndex = (await messages.listIndexes().toArray()).some(
            ({ key }) => key.did === 1 && key.threadId === 1 && key.created_at === 1
        );

        if (existingIndex) return false;

        await messages.createIndex(
            { did: 1, threadId: 1, created_at: 1 },
            { name: 'message_owner_thread_created_at' }
        );

        return true;
    },
    async listMessages(afterId, limit) {
        const filter = afterId ? { _id: { $gt: new ObjectId(afterId) } } : {};
        const records = await messages
            .find(filter, { projection: { did: 1, threadId: 1 } })
            .sort({ _id: 1 })
            .limit(limit)
            .toArray();

        return records.map(({ _id, did, threadId }) => ({
            _id: _id.toHexString(),
            did,
            threadId,
        }));
    },
    async listThreads(threadIds) {
        if (threadIds.length === 0) return [];

        return threads
            .find({ id: { $in: threadIds } }, { projection: { did: 1, id: 1 } })
            .toArray();
    },
    async updateMessageDids(updates) {
        if (updates.length === 0) return 0;

        const result = await messages.bulkWrite(
            updates.map(({ did, id }) => ({
                updateOne: {
                    filter: { _id: new ObjectId(String(id)), did: { $exists: false } },
                    update: { $set: { did } },
                },
            })),
            { ordered: false }
        );

        return result.modifiedCount;
    },
});

const createQdrantStore = async (): Promise<VectorOwnershipStore | undefined> => {
    const client = getQdrantClient();
    const collections = await client.getCollections();

    if (!collections.collections.some(({ name }) => name === EMBEDDINGS_COLLECTION)) {
        return;
    }

    return {
        async listVectors(offset, limit) {
            const page = await client.scroll(EMBEDDINGS_COLLECTION, {
                limit,
                offset,
                with_payload: true,
                with_vector: false,
                filter: { must_not: [{ key: 'erased', match: { value: true } }] },
            });
            const nextOffset = page.next_page_offset ?? undefined;

            if (
                nextOffset !== undefined &&
                typeof nextOffset !== 'string' &&
                typeof nextOffset !== 'number'
            ) {
                throw new Error('Unsupported Qdrant pagination offset');
            }

            return {
                nextOffset,
                records: page.points.map(({ id, payload }) => ({
                    id,
                    payload: payload ?? undefined,
                })),
            };
        },
        async updateVectorDids(updates) {
            const pointsByDid = new Map<string, RecordId[]>();

            for (const { did, id } of updates) {
                const points = pointsByDid.get(did) ?? [];

                points.push(id);
                pointsByDid.set(did, points);
            }

            for (const [did, points] of pointsByDid) {
                await client.setPayload(EMBEDDINGS_COLLECTION, {
                    payload: { userId: did },
                    points,
                    wait: true,
                });
            }

            return updates.length;
        },
    };
};

export const migrateLegacyMessageOwnership = async ({
    apply,
    batchSize = 500,
}: {
    apply: boolean;
    batchSize?: number;
}): Promise<MigrationReport> => {
    if (apply) {
        const [{ default: cache }, { PRIVACY_MAINTENANCE_KEY }] = await Promise.all([
            import('../src/utils/cache'),
            import('../src/services/dataErasure'),
        ]);
        if (!cache.redis || !(await cache.redis.exists(PRIVACY_MAINTENANCE_KEY)))
            throw new Error('Offline privacy maintenance is required');
    }
    if (!MONGO_URI) throw new Error('MONGO_URI is required');
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const database = client.db(MONGO_DB);
        return await runMessageOwnershipMigration({
            apply,
            batchSize,
            messageStore: createMongoStore(
                database.collection<MongoMessage>('messages'),
                database.collection<MongoThread>('threads')
            ),
            vectorStore: await createQdrantStore(),
        });
    } finally {
        await client.close();
    }
};
