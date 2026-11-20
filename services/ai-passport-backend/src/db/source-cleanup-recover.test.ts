import { expect, mock, test } from 'bun:test';

const vectorSource = await import('./vector-source');
mock.module('./vector-source', () => ({
    ...vectorSource,
    decryptCleanupScope: () => ({ did: 'did:example:learner', key: 'source' }),
}));
const privacy = await import('../ai/privacy');
mock.module('../ai/privacy', () => ({
    ...privacy,
    runWithAiPrivacyContext: async (_did: string, callback: () => Promise<unknown>) => callback(),
}));
const dataErasure = await import('../services/dataErasure');
mock.module('../services/dataErasure', () => ({
    ...dataErasure,
    withOwnerOperation: async (_did: string, callback: () => Promise<unknown>) => callback(),
    assertOwnerOperationActive: async () => undefined,
}));

const { recoverSourceVectorCleanup, fenceDeletedSourceVectors } = await import('./qdrant');
const { SOURCE_CLEANUP_BUSY_MESSAGE, SOURCE_CLEANUP_PENDING_MESSAGE } =
    await import('./source-cleanup');

const busyDatabase = {
    getSourceCleanupTask: async () => ({ _id: 'task' }),
    withSourceCleanupLease: async () => {
        throw new Error(SOURCE_CLEANUP_BUSY_MESSAGE);
    },
    sourceCleanupSummary: async () => ({ pendingTasks: 2, pendingPoints: 1 }),
};

test('recoverSourceVectorCleanup returns pending work instead of throwing when the lease is busy', async () => {
    await expect(
        recoverSourceVectorCleanup({
            did: 'did:example:learner',
            limit: 4,
            database: busyDatabase as never,
        })
    ).resolves.toEqual({
        units: 0,
        discoveryPages: 0,
        pointsFenced: 0,
        tasksCompleted: 0,
        pendingTasks: 2,
        pendingPoints: 1,
    });
});

test('fenceDeletedSourceVectors still requires later recovery after a busy lease', async () => {
    await expect(
        fenceDeletedSourceVectors('did:example:learner', busyDatabase as never)
    ).rejects.toThrow(SOURCE_CLEANUP_PENDING_MESSAGE);
});
