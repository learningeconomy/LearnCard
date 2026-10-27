import { describe, expect, test } from 'bun:test';

import {
    getMigrationExitCode,
    runMessageOwnershipMigration,
    type MessageOwnershipStore,
    type VectorOwnershipStore,
} from './backfill-message-dids';

type FakeMessage = {
    _id: string;
    did?: unknown;
    threadId?: unknown;
};

type FakeThread = {
    did?: unknown;
    id?: unknown;
};

type FakeVector = {
    id: number | string;
    payload?: Record<string, unknown> | null;
};

class FakeMessageStore implements MessageOwnershipStore {
    indexCreated = false;
    updateCalls = 0;

    constructor(
        readonly messages: FakeMessage[],
        readonly threads: FakeThread[],
        readonly ignoreUpdates = false
    ) {}

    async createMessageOwnershipIndex() {
        const created = !this.indexCreated;

        this.indexCreated = true;

        return created;
    }

    async listMessages(afterId: string | undefined, limit: number) {
        return this.messages
            .filter(({ _id }) => afterId === undefined || _id > afterId)
            .toSorted((left, right) => left._id.localeCompare(right._id))
            .slice(0, limit)
            .map(message => ({ ...message }));
    }

    async listThreads(threadIds: string[]) {
        return this.threads.filter(({ id }) => typeof id === 'string' && threadIds.includes(id));
    }

    async updateMessageDids(updates: { did: string; id: number | string }[]) {
        this.updateCalls += updates.length;

        if (this.ignoreUpdates) return 0;

        let modifiedCount = 0;

        for (const update of updates) {
            const message = this.messages.find(({ _id }) => _id === update.id);

            if (message && message.did === undefined) {
                message.did = update.did;
                modifiedCount += 1;
            }
        }

        return modifiedCount;
    }
}

class FakeVectorStore implements VectorOwnershipStore {
    updateCalls = 0;

    constructor(readonly vectors: FakeVector[]) {}

    async listVectors(offset: number | string | undefined, limit: number) {
        const start =
            offset === undefined ? 0 : this.vectors.findIndex(({ id }) => id === offset) + 1;
        const records = this.vectors.slice(start, start + limit).map(vector => ({
            ...vector,
            payload: vector.payload ? { ...vector.payload } : vector.payload,
        }));
        const nextIndex = start + records.length;

        return {
            nextOffset: nextIndex < this.vectors.length ? records.at(-1)?.id : undefined,
            records,
        };
    }

    async updateVectorDids(updates: { did: string; id: number | string }[]) {
        this.updateCalls += updates.length;
        let modifiedCount = 0;

        for (const update of updates) {
            const vector = this.vectors.find(({ id }) => id === update.id);

            if (!vector) continue;

            vector.payload = { ...vector.payload, userId: update.did };
            modifiedCount += 1;
        }

        return modifiedCount;
    }
}

const aliceThread = { did: 'did:example:alice', id: 'thread-alice' };

describe('message ownership migration', () => {
    test('backfills message and Qdrant ownership before creating the index', async () => {
        const messages = new FakeMessageStore(
            [{ _id: '01', threadId: 'thread-alice' }],
            [aliceThread]
        );
        const vectors = new FakeVectorStore([{ id: 1, payload: { threadId: 'thread-alice' } }]);
        const report = await runMessageOwnershipMigration({
            apply: true,
            batchSize: 1,
            messageStore: messages,
            vectorStore: vectors,
        });

        expect(messages.messages[0]?.did).toBe('did:example:alice');
        expect(vectors.vectors[0]?.payload?.userId).toBe('did:example:alice');
        expect(report.initial.messages.backfilled).toBe(1);
        expect(report.initial.vectors.backfilled).toBe(1);
        expect(report.final.messages.missing).toBe(0);
        expect(report.final.vectors.missing).toBe(0);
        expect(report.indexCreated).toBe(true);
        expect(messages.indexCreated).toBe(true);
    });

    test('is idempotent on a repeated apply', async () => {
        const messages = new FakeMessageStore(
            [{ _id: '01', threadId: 'thread-alice' }],
            [aliceThread]
        );

        await runMessageOwnershipMigration({
            apply: true,
            batchSize: 10,
            messageStore: messages,
        });
        const second = await runMessageOwnershipMigration({
            apply: true,
            batchSize: 10,
            messageStore: messages,
        });

        expect(messages.messages[0]?.did).toBe('did:example:alice');
        expect(second.initial.messages.backfilled).toBe(0);
        expect(second.initial.messages.preserved).toBe(1);
        expect(second.indexCreated).toBe(false);
        expect(messages.updateCalls).toBe(1);
    });

    test('preserves an existing matching DID', async () => {
        const messages = new FakeMessageStore(
            [
                {
                    _id: '01',
                    did: 'did:example:alice',
                    threadId: 'thread-alice',
                },
            ],
            [aliceThread]
        );
        const report = await runMessageOwnershipMigration({
            apply: true,
            batchSize: 10,
            messageStore: messages,
        });

        expect(report.initial.messages.preserved).toBe(1);
        expect(messages.updateCalls).toBe(0);
        expect(messages.messages[0]?.did).toBe('did:example:alice');
    });

    test('reports orphaned messages without modifying them', async () => {
        const messages = new FakeMessageStore([{ _id: '01', threadId: 'missing-thread' }], []);
        const report = await runMessageOwnershipMigration({
            apply: true,
            batchSize: 10,
            messageStore: messages,
        });

        expect(report.final.messages.orphaned).toBe(1);
        expect(messages.messages[0]?.did).toBeUndefined();
        expect(report.indexCreated).toBe(false);
    });

    test('reports ambiguous duplicate thread owners', async () => {
        const messages = new FakeMessageStore(
            [{ _id: '01', threadId: 'duplicate-thread' }],
            [
                { did: 'did:example:alice', id: 'duplicate-thread' },
                { did: 'did:example:bob', id: 'duplicate-thread' },
            ]
        );
        const report = await runMessageOwnershipMigration({
            apply: true,
            batchSize: 10,
            messageStore: messages,
        });

        expect(report.final.messages.ambiguous).toBe(1);
        expect(messages.messages[0]?.did).toBeUndefined();
        expect(report.indexCreated).toBe(false);
    });

    test('detects an existing DID that conflicts with the thread owner', async () => {
        const messages = new FakeMessageStore(
            [
                {
                    _id: '01',
                    did: 'did:example:bob',
                    threadId: 'thread-alice',
                },
            ],
            [aliceThread]
        );
        const report = await runMessageOwnershipMigration({
            apply: true,
            batchSize: 10,
            messageStore: messages,
        });

        expect(report.final.messages.mismatched).toBe(1);
        expect(messages.messages[0]?.did).toBe('did:example:bob');
        expect(messages.updateCalls).toBe(0);
        expect(report.indexCreated).toBe(false);
    });

    test('verifies persisted results before creating the ownership index', async () => {
        const messages = new FakeMessageStore(
            [{ _id: '01', threadId: 'thread-alice' }],
            [aliceThread],
            true
        );
        const report = await runMessageOwnershipMigration({
            apply: true,
            batchSize: 10,
            messageStore: messages,
        });

        expect(report.initial.messages.backfilled).toBe(0);
        expect(report.final.messages.missing).toBe(1);
        expect(report.indexCreated).toBe(false);
        expect(messages.indexCreated).toBe(false);
    });

    test('fails when ownership remains unresolved', async () => {
        const report = await runMessageOwnershipMigration({
            apply: false,
            batchSize: 10,
            messageStore: new FakeMessageStore([{ _id: '01', threadId: 'missing-thread' }], []),
        });

        expect(getMigrationExitCode(report)).toBe(1);
    });
});
