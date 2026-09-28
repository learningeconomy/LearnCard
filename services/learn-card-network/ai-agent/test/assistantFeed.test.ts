import type { Db } from 'mongodb';
import { describe, expect, it, vi } from 'vitest';

import {
    createInMemoryLearnCardAssistantFeedRepository,
    createLearnCardAssistantFeedService,
    createLearnCardAssistantFeedRuntime,
    createLearnCardAssistantFeedTools,
} from '../src/assistantFeed';
import type { MongoRuntime } from '../src/mongo';
import { createStorageTestEncryption } from './helpers/storageEncryption';

const createService = () =>
    createLearnCardAssistantFeedService(createInMemoryLearnCardAssistantFeedRepository());

describe('LearnCard Assistant feed', () => {
    it.each(['status', 'database', 'indexes', 'migration'] as const)(
        'recovers after a failed first %s initialization',
        async phase => {
            const documents: Array<Record<string, unknown>> = [];
            const toArray = vi.fn(async () => [...documents]);
            const cursor = { toArray, sort: () => cursor, limit: () => cursor };
            const collection = {
                createIndex: vi.fn(async () => 'index'),
                listIndexes: () => ({ toArray: async () => [] }),
                find: () => cursor,
                insertOne: async (item: Record<string, unknown>) => {
                    documents.push(item);
                },
            };
            const mongoRuntime: MongoRuntime = {
                getStatus: vi.fn(async () => ({
                    configured: true,
                    connected: true,
                    dbName: 'test',
                })),
                getDb: vi.fn(async () => ({ collection: () => collection }) as unknown as Db),
                getClient: async () => {
                    throw new Error('No real Mongo client.');
                },
                close: async () => undefined,
            };
            const outage = new Error('Synthetic Mongo outage.');
            if (phase === 'status') vi.mocked(mongoRuntime.getStatus).mockRejectedValueOnce(outage);
            if (phase === 'database') vi.mocked(mongoRuntime.getDb).mockRejectedValueOnce(outage);
            if (phase === 'indexes') collection.createIndex.mockRejectedValueOnce(outage);
            if (phase === 'migration') toArray.mockRejectedValueOnce(outage);
            const runtime = createLearnCardAssistantFeedRuntime({
                mongoRuntime,
                getEncryption: createStorageTestEncryption,
            });

            await expect(runtime.listLatest('did:key:owner')).rejects.toThrow(outage);
            const item = await runtime.recordItem({
                ownerDid: 'did:key:owner',
                type: 'message',
                title: 'Recovered card',
                description: 'Storage can be used after Mongo recovers.',
            });
            await expect(runtime.listLatest('did:key:owner')).resolves.toMatchObject([
                { id: item.id, title: 'Recovered card' },
            ]);
        }
    );

    it('rejects invalid writes', async () => {
        const service = createService();

        await expect(
            service.recordItem({
                ownerDid: 'did:key:user',
                type: 'message',
                title: '',
                description: 'Needs clearer examples.',
            })
        ).rejects.toThrow();

        await expect(
            service.recordItem({
                ownerDid: 'did:key:user',
                type: 'message',
                title: 'Practice interview storytelling',
                description: 'Needs clearer examples.',
                cta: { label: 'Review profile' } as { label: string; href: string },
            })
        ).rejects.toThrow();
    });

    it('records a normal-priority message card by default', async () => {
        const service = createService();
        const item = await service.recordItem({
            ownerDid: 'did:key:user',
            type: 'message',
            title: 'Quick check-in',
            description: 'Your assistant has a new suggestion.',
        });

        expect(item).toMatchObject({
            ownerDid: 'did:key:user',
            type: 'message',
            title: 'Quick check-in',
            priority: 'normal',
        });
        expect(item.id).toEqual(expect.any(String));
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item.readAt).toBeUndefined();
    });

    it('updates an existing dedupeKey without creating a duplicate', async () => {
        const service = createService();
        const first = await service.recordItem({
            ownerDid: 'did:key:user',
            dedupeKey: 'assistant:storytelling',
            type: 'message',
            title: 'Practice interview storytelling',
            description: 'Add clearer project examples.',
        });

        const updated = await service.recordItem({
            ownerDid: 'did:key:user',
            dedupeKey: 'assistant:storytelling',
            type: 'action-item',
            title: 'Review interview examples',
            description: 'Pick two projects to explain before applying.',
            priority: 'high',
        });
        const latest = await service.listLatest('did:key:user');

        expect(updated.id).toBe(first.id);
        expect(updated.createdAt).toEqual(first.createdAt);
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(first.updatedAt.getTime());
        expect(latest).toHaveLength(1);
        expect(latest[0]).toMatchObject({
            type: 'action-item',
            title: 'Review interview examples',
            priority: 'high',
        });
    });

    it('lists newest items first and clamps limits', async () => {
        const now = Date.now();
        const service = createLearnCardAssistantFeedService(
            createInMemoryLearnCardAssistantFeedRepository(
                Array.from({ length: 55 }, (_, index) => ({
                    id: `item-${index}`,
                    ownerDid: 'did:key:user',
                    type: 'job-suggestion',
                    title: `Role match ${index}`,
                    description: 'A role match is available.',
                    priority: 'normal',
                    createdAt: new Date(now + index),
                    updatedAt: new Date(now + index),
                }))
            )
        );

        const latestTwo = await service.listLatest('did:key:user', 2);
        const clamped = await service.listLatest('did:key:user', 100);

        expect(latestTwo).toHaveLength(2);
        expect(latestTwo[0]?.createdAt.getTime()).toBeGreaterThanOrEqual(
            latestTwo[1]?.createdAt.getTime() ?? 0
        );
        expect(latestTwo[0]?.title).toBe('Role match 54');
        expect(clamped).toHaveLength(50);
    });

    it('injects ownerDid and sourceRunId in the assistant card tool', async () => {
        const service = createService();
        const [tool] = createLearnCardAssistantFeedTools({
            ownerDid: 'did:key:user',
            feedService: service,
        });

        const result = await tool!.execute(
            {
                dedupeKey: 'assistant:typescript',
                type: 'message',
                title: 'Practice TypeScript narrowing',
                description: 'A focused exercise would improve your frontend matches.',
            },
            { runId: 'run-123' }
        );
        const latest = await service.listLatest('did:key:user');

        expect(result).toMatchObject({
            ownerDid: 'did:key:user',
            sourceRunId: 'run-123',
        });
        expect(latest[0]).toMatchObject({
            ownerDid: 'did:key:user',
            sourceRunId: 'run-123',
        });
    });

    it('marks an item read', async () => {
        const service = createService();
        const item = await service.recordItem({
            ownerDid: 'did:key:user',
            type: 'message',
            title: 'Read this update',
            description: 'This card should become read.',
        });

        const updated = await service.markItemRead('did:key:user', item.id);

        expect(updated.readAt).toBeInstanceOf(Date);
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(item.updatedAt.getTime());
    });

    it('records thumbs-down feedback', async () => {
        const service = createService();
        const item = await service.recordItem({
            ownerDid: 'did:key:user',
            type: 'message',
            title: 'Feedback target',
            description: 'This card should receive feedback.',
        });

        const updated = await service.recordFeedback('did:key:user', item.id, {
            type: 'thumbs-down',
        });

        expect(updated.feedback).toMatchObject({ type: 'thumbs-down' });
        expect(updated.feedback?.createdAt).toBeInstanceOf(Date);
    });
});
