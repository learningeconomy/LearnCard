import { createHash, randomUUID } from 'node:crypto';

import { MongoClient } from 'mongodb';
import { describe, expect, it } from 'vitest';

import {
    LEARNCARD_ASSISTANT_FEED_COLLECTION,
    createLearnCardAssistantFeedService,
    createMongoLearnCardAssistantFeedRepository,
    type LearnCardAssistantCard,
} from '../src/assistantFeed';
import { createStorageTestEncryption } from './helpers/storageEncryption';

const mongoUri = process.env.AI_AGENT_TEST_MONGO_URI;
const ownerDid = 'did:key:synthetic-owner';
const createCard = (
    id: string,
    overrides: Partial<LearnCardAssistantCard> = {}
): LearnCardAssistantCard => ({
    id,
    ownerDid,
    origin: 'interactive',
    type: 'message',
    title: id,
    description: 'Synthetic storage regression.',
    priority: 'normal',
    createdAt: new Date('2026-07-15T12:00:00.000Z'),
    updatedAt: new Date('2026-07-15T12:00:00.000Z'),
    ...overrides,
});

// This suite must never connect to a shared or non-loopback Mongo deployment.
describe.skipIf(!mongoUri)('assistant feed Mongo repository', () => {
    it.each([false, true])(
        'allows optional per-owner dedupe keys (legacy index: %s)',
        async legacy => {
            const uri = new URL(mongoUri!);
            if (
                uri.protocol !== 'mongodb:' ||
                !['127.0.0.1', '[::1]', 'localhost'].includes(uri.hostname) ||
                uri.search ||
                uri.hash
            ) {
                throw new Error(
                    'AI_AGENT_TEST_MONGO_URI must be a single loopback mongodb:// URI without options.'
                );
            }
            const client = new MongoClient(mongoUri!, {
                directConnection: true,
                serverSelectionTimeoutMS: 5_000,
            });
            const db = client.db(`ai_agent_test_feed_${randomUUID().replaceAll('-', '')}`);
            try {
                await client.connect();
                const collection = db.collection(LEARNCARD_ASSISTANT_FEED_COLLECTION);
                await collection.createIndex({ sourceRunId: 1 }, { name: 'unrelated_source_run' });
                if (legacy) {
                    await collection.createIndex(
                        { ownerDid: 1, dedupeKeyHash: 1 },
                        { unique: true, sparse: true }
                    );
                    await collection.insertMany([
                        createCard('legacy-unkeyed'),
                        {
                            ...createCard('legacy-keyed', { dedupeKey: 'existing-key' }),
                            dedupeKeyHash: createHash('sha256')
                                .update(`${ownerDid}\0existing-key`)
                                .digest('hex'),
                        },
                    ]);
                }
                const encryption = createStorageTestEncryption();
                const first = createMongoLearnCardAssistantFeedRepository(db, encryption);
                const second = createMongoLearnCardAssistantFeedRepository(db, encryption);
                // Independent instances race index creation/removal and lazy migration.
                await Promise.all([
                    first.listLatest(ownerDid, 50),
                    second.listLatest(ownerDid, 50),
                ]);
                await Promise.all([
                    first.insert(createCard('unkeyed-a')),
                    second.insert(createCard('unkeyed-b')),
                ]);
                await first.insert(createCard('keyed-a', { dedupeKey: 'same-key' }));
                await expect(
                    second.insert(createCard('keyed-duplicate', { dedupeKey: 'same-key' }))
                ).rejects.toMatchObject({ code: 11000 });
                await second.insert(
                    createCard('other-owner', {
                        ownerDid: 'did:key:synthetic-other',
                        dedupeKey: 'same-key',
                    })
                );
                await expect(
                    first.findByDedupeKey('did:key:synthetic-other', 'same-key')
                ).resolves.toMatchObject({ id: 'other-owner' });

                const service = createLearnCardAssistantFeedService(first);
                const updated = await service.recordItem({
                    ownerDid,
                    dedupeKey: 'same-key',
                    type: 'message',
                    title: 'Updated keyed card',
                    description: 'Still one keyed card for this owner.',
                });
                expect(updated.id).toBe('keyed-a');
                expect((await first.listLatest(ownerDid, 50)).map(card => card.id).sort()).toEqual(
                    (legacy
                        ? ['legacy-unkeyed', 'legacy-keyed', 'unkeyed-a', 'unkeyed-b', 'keyed-a']
                        : ['unkeyed-a', 'unkeyed-b', 'keyed-a']
                    ).sort()
                );
                if (legacy) {
                    await expect(
                        first.findByDedupeKey(ownerDid, 'existing-key')
                    ).resolves.toMatchObject({ id: 'legacy-keyed' });
                    await expect(
                        first.insert(
                            createCard('legacy-key-duplicate', { dedupeKey: 'existing-key' })
                        )
                    ).rejects.toMatchObject({ code: 11000 });
                }
                expect(
                    (await collection.listIndexes().toArray()).some(
                        index => index.name === 'unrelated_source_run'
                    )
                ).toBe(true);
            } finally {
                try {
                    await db.dropDatabase();
                } finally {
                    await client.close();
                }
            }
        },
        30_000
    );
});
