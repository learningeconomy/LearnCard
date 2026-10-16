import { QueryClient, hydrate } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getDb: vi.fn(),
    ensureTable: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('learn-card-base', () => ({
    sqliteStore: { get: { db: mocks.getDb } },
    ensureReactQueryTableExists: mocks.ensureTable,
    getLogger: () => ({ error: vi.fn() }),
}));
vi.mock('localforage', () => ({
    default: { getItem: mocks.getItem, setItem: mocks.setItem, removeItem: mocks.removeItem },
}));

import { persister, persistQueryCacheNow } from './queryPersistence';

describe('browser query cache backend', () => {
    it('saves and reloads from the same store even when SQLite initializes between hydration and save', async () => {
        let stored: string | undefined;
        mocks.getItem.mockImplementation(async () => stored);
        mocks.setItem.mockImplementation(async (_key: string, value: string) => {
            stored = value;
        });
        mocks.getDb.mockReturnValue(undefined);
        const client = new QueryClient();
        const key = ['getProfile', '', undefined];
        client.setQueryData(key, { profileId: 'learner', displayName: 'Verify Learner' });
        await persistQueryCacheNow(client);

        // SQLite used to become the write backend here, stranding the older web snapshot.
        let sqliteSnapshot: string | undefined;
        mocks.getDb.mockReturnValue({
            isDBOpen: async () => ({ result: true }),
            executeSet: async (statements: Array<{ values: string[] }>) => {
                sqliteSnapshot = statements[0]!.values[1];
            },
            query: async () => ({ values: sqliteSnapshot ? [{ cache: sqliteSnapshot }] : [] }),
        });
        client.setQueryData(key, { profileId: 'learner', displayName: 'Exact Saved Name' });
        await persistQueryCacheNow(client);

        // On reload SQLite has not initialized yet; storage must still contain the save.
        mocks.getDb.mockReturnValue(undefined);
        const restored = new QueryClient();
        const persisted = await persister.restoreClient();
        expect(persisted).toBeDefined();
        hydrate(restored, persisted!.clientState);
        expect(restored.getQueryData(key)).toEqual({
            profileId: 'learner',
            displayName: 'Exact Saved Name',
        });
        client.clear();
        restored.clear();
    });
});
