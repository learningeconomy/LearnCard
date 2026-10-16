import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    isNative: vi.fn(),
    getDb: vi.fn(),
    waitForReady: vi.fn(),
    ensureTable: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: mocks.isNative } }));
vi.mock('learn-card-base', () => ({
    sqliteStore: { get: { db: mocks.getDb } },
    ensureReactQueryTableExists: mocks.ensureTable,
    getLogger: () => ({ error: vi.fn() }),
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({
    waitForSQLiteReady: mocks.waitForReady,
}));
vi.mock('localforage', () => ({
    default: { getItem: mocks.getItem, setItem: mocks.setItem, removeItem: mocks.removeItem },
}));

const cacheKey = 'REACT_QUERY_OFFLINE_CACHE';
const profileKey = ['getProfile', '', undefined];
const clients: QueryClient[] = [];
let localSnapshot: string | undefined;
let markReady: () => void;

const profileClient = (displayName?: string) => {
    const client = new QueryClient();
    if (displayName !== undefined) {
        client.setQueryData(profileKey, { profileId: 'learner', displayName });
    }
    clients.push(client);
    return client;
};

const serializedProfile = (displayName: string) => {
    const client = profileClient(displayName);
    return JSON.stringify({ buster: '', timestamp: Date.now(), clientState: dehydrate(client) });
};

// A working SQLite fake, not an incomplete object that accidentally triggers fallback.
const nativeDatabase = (initialSnapshot?: string) => {
    let stored = initialSnapshot;
    let open = false;
    return {
        isDBOpen: vi.fn(async () => ({ result: open })),
        open: vi.fn(async () => {
            open = true;
        }),
        close: vi.fn(async () => {
            open = false;
        }),
        query: vi.fn(async (_statement: string, values: string[]) => {
            expect(values).toEqual([cacheKey]);
            return { values: stored ? [{ cache: stored }] : [] };
        }),
        executeSet: vi.fn(async (statements: Array<{ values: string[] }>) => {
            expect(statements[0]!.values[0]).toBe(cacheKey);
            stored = statements[0]!.values[1];
            return { changes: { changes: 1 } };
        }),
        run: vi.fn(async (_statement: string, values: string[]) => {
            expect(values).toEqual([cacheKey]);
            stored = undefined;
            return { changes: { changes: 1 } };
        }),
    };
};

// Dynamic imports deliberately exercise fresh module lifecycles (native boot and reload);
// a static import would freeze the platform decision before each test configures it.
beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    localSnapshot = undefined;
    mocks.isNative.mockReturnValue(false);
    mocks.getDb.mockReturnValue(undefined);
    mocks.ensureTable.mockResolvedValue(undefined);
    mocks.getItem.mockImplementation(async () => localSnapshot);
    mocks.setItem.mockImplementation(async (_key: string, value: string) => {
        localSnapshot = value;
    });
    mocks.removeItem.mockImplementation(async () => {
        localSnapshot = undefined;
    });
    const ready = new Promise<void>(resolve => {
        markReady = resolve;
    });
    mocks.waitForReady.mockReturnValue(ready);
});

afterEach(() => {
    for (const client of clients) client.clear();
    clients.length = 0;
    vi.useRealTimers();
});

describe('browser query cache backend', () => {
    it('saves, reloads and removes from localforage across SQLite readiness changes', async () => {
        const { persister, persistQueryCacheNow } = await import('./queryPersistence');
        const client = profileClient('Verify Learner');
        await persistQueryCacheNow(client);
        const db = nativeDatabase(serializedProfile('Stale SQLite Name'));
        mocks.getDb.mockReturnValue(db);
        client.setQueryData(profileKey, { profileId: 'learner', displayName: 'Exact Saved Name' });
        await persistQueryCacheNow(client);

        // Reload with SQLite unavailable again; the durable browser snapshot must not regress.
        vi.resetModules();
        mocks.getDb.mockReturnValue(undefined);
        const reloaded = await import('./queryPersistence');
        const restored = profileClient();
        hydrate(restored, (await reloaded.persister.restoreClient())!.clientState);
        expect(restored.getQueryData(profileKey)).toEqual({
            profileId: 'learner',
            displayName: 'Exact Saved Name',
        });
        await persister.removeClient();
        expect(await reloaded.persister.restoreClient()).toBeUndefined();
        expect(mocks.getDb).not.toHaveBeenCalled();
        expect(mocks.waitForReady).not.toHaveBeenCalled();
        expect(db.executeSet).not.toHaveBeenCalled();
    });

    it('rejects a failed browser flush instead of silently changing stores', async () => {
        const { persistQueryCacheNow } = await import('./queryPersistence');
        mocks.setItem.mockRejectedValueOnce(new Error('localforage write failed'));
        await expect(persistQueryCacheNow(profileClient('New Name'))).rejects.toThrow(
            'localforage write failed'
        );
        expect(mocks.getDb).not.toHaveBeenCalled();
    });
});

describe('native query cache backend', () => {
    beforeEach(() => {
        mocks.isNative.mockReturnValue(true);
    });

    it('waits for SQLite to restore, writes there, and waits there again on reload', async () => {
        localSnapshot = serializedProfile('Stale localforage Name');
        const db = nativeDatabase(serializedProfile('SQLite Name'));
        const { persister, persistQueryCacheNow } = await import('./queryPersistence');
        let restored = false;
        const restoring = Promise.resolve(persister.restoreClient()).then(snapshot => {
            restored = true;
            return snapshot;
        });
        await Promise.resolve();
        await Promise.resolve();
        expect(mocks.waitForReady).toHaveBeenCalledOnce();
        expect(restored).toBe(false);
        expect(mocks.getItem).not.toHaveBeenCalled();
        mocks.getDb.mockReturnValue(db);
        markReady();
        const client = profileClient();
        hydrate(client, (await restoring)!.clientState);
        expect(client.getQueryData(profileKey)).toEqual({
            profileId: 'learner',
            displayName: 'SQLite Name',
        });
        client.setQueryData(profileKey, { profileId: 'learner', displayName: 'Exact Saved Name' });
        await persistQueryCacheNow(client);
        expect(db.executeSet).toHaveBeenCalledOnce();

        vi.resetModules();
        mocks.getDb.mockReturnValue(undefined);
        mocks.waitForReady.mockReturnValue(
            new Promise<void>(resolve => {
                markReady = resolve;
            })
        );
        const reloaded = await import('./queryPersistence');
        const reloading = reloaded.persister.restoreClient();
        await Promise.resolve();
        await Promise.resolve();
        expect(mocks.waitForReady).toHaveBeenCalledTimes(2);
        mocks.getDb.mockReturnValue(db);
        markReady();
        const reloadedClient = profileClient();
        hydrate(reloadedClient, (await reloading)!.clientState);
        expect(reloadedClient.getQueryData(profileKey)).toEqual({
            profileId: 'learner',
            displayName: 'Exact Saved Name',
        });
        await reloaded.persister.removeClient();
        expect(await reloaded.persister.restoreClient()).toBeUndefined();
        expect(db.run).toHaveBeenCalledOnce();
        expect(mocks.ensureTable).toHaveBeenCalledWith(db);
        expect(mocks.getItem).not.toHaveBeenCalled();
        expect(mocks.setItem).not.toHaveBeenCalled();
        expect(mocks.removeItem).not.toHaveBeenCalled();
    });

    it('waits for initialization before an explicit flush and ignores stale fallback when SQLite is empty', async () => {
        localSnapshot = serializedProfile('Legacy fallback');
        const { persister, persistQueryCacheNow } = await import('./queryPersistence');
        const db = nativeDatabase();
        let saved = false;
        const saving = persistQueryCacheNow(profileClient('Saved before readiness')).then(() => {
            saved = true;
        });
        await Promise.resolve();
        await Promise.resolve();
        expect(saved).toBe(false);
        expect(mocks.setItem).not.toHaveBeenCalled();
        mocks.getDb.mockReturnValue(db);
        markReady();
        await saving;
        expect(db.executeSet).toHaveBeenCalledOnce();
        await persister.removeClient();
        expect(await persister.restoreClient()).toBeUndefined();
        expect(mocks.getItem).not.toHaveBeenCalled();
    });

    it('rejects initialization failure, never falls back, and can recover when SQLite becomes available', async () => {
        const { persister, persistQueryCacheNow } = await import('./queryPersistence');
        markReady(); // The real initializer also signals completion when initialization fails.
        await expect(persister.restoreClient()).rejects.toThrow('unavailable after initialization');
        await expect(persistQueryCacheNow(profileClient('Failed save'))).rejects.toThrow(
            'unavailable after initialization'
        );
        await expect(persister.removeClient()).rejects.toThrow('unavailable after initialization');
        expect(mocks.getItem).not.toHaveBeenCalled();
        expect(mocks.setItem).not.toHaveBeenCalled();
        expect(mocks.removeItem).not.toHaveBeenCalled();

        const db = nativeDatabase();
        mocks.getDb.mockReturnValue(db);
        await persistQueryCacheNow(profileClient('Recovered'));
        expect(db.executeSet).toHaveBeenCalledOnce();
        expect(await persister.restoreClient()).toBeDefined();
    });

    it('rejects an initialization that never signals readiness without hanging or falling back', async () => {
        vi.useFakeTimers();
        const { persister } = await import('./queryPersistence');
        const restoring = expect(persister.restoreClient()).rejects.toThrow(
            'Timed out waiting for native query cache SQLite'
        );
        await vi.advanceTimersByTimeAsync(10_000);
        await restoring;
        expect(mocks.getItem).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['restore', 'write', 'remove', 'table'] as const)(
        'rejects a SQLite %s failure without using a stale fallback and allows a later retry',
        async operation => {
            localSnapshot = serializedProfile('Stale fallback');
            const db = nativeDatabase(serializedProfile('Existing SQLite'));
            mocks.getDb.mockReturnValue(db);
            const { persister, persistQueryCacheNow } = await import('./queryPersistence');
            const error = new Error(`SQLite ${operation} failed`);
            if (operation === 'restore') db.query.mockRejectedValueOnce(error);
            if (operation === 'write') db.executeSet.mockRejectedValueOnce(error);
            if (operation === 'remove') db.run.mockRejectedValueOnce(error);
            if (operation === 'table') mocks.ensureTable.mockRejectedValueOnce(error);
            const attempt =
                operation === 'write'
                    ? persistQueryCacheNow(profileClient('Failed save'))
                    : operation === 'remove'
                      ? persister.removeClient()
                      : persister.restoreClient();
            await expect(attempt).rejects.toThrow(error.message);
            if (operation !== 'table') expect(db.close).toHaveBeenCalledOnce();
            expect(mocks.getItem).not.toHaveBeenCalled();
            expect(mocks.setItem).not.toHaveBeenCalled();
            expect(mocks.removeItem).not.toHaveBeenCalled();

            await persistQueryCacheNow(profileClient('Recovered'));
            const client = profileClient();
            hydrate(client, (await persister.restoreClient())!.clientState);
            expect(client.getQueryData(profileKey)).toEqual({
                profileId: 'learner',
                displayName: 'Recovered',
            });
        }
    );
});
