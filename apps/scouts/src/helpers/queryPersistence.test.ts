import { beforeEach, expect, it, vi } from 'vitest';
import { ensureSQLiteSchema, withSQLiteDatabase } from 'learn-card-base/SQL/connection';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), ensureTable: vi.fn() }));
vi.mock('learn-card-base', () => ({
    sqliteStore: { get: { db: mocks.getDb } },
    ensureReactQueryTableExists: mocks.ensureTable,
}));

import { queryCacheStorage } from './queryPersistence';

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(done => {
        resolve = done;
    });
    return { promise, resolve };
};

// A strict shared-handle fake: any read/write after another caller closes must fail.
const database = () => {
    let open = false;
    const cache = new Map<string, string>();
    const requireOpen = () => {
        if (!open) throw new Error('Database closed underneath operation');
    };
    return {
        open: vi.fn(async () => {
            open = true;
        }),
        close: vi.fn(async () => {
            open = false;
        }),
        execute: vi.fn(async () => {
            requireOpen();
        }),
        query: vi.fn(async (_sql: string, values: string[]) => {
            requireOpen();
            const stored = cache.get(values[0]!);
            return { values: stored === undefined ? [] : [{ cache: stored }] };
        }),
        executeSet: vi.fn(async (statements: Array<{ values: string[] }>) => {
            requireOpen();
            const [key, value] = statements[0]!.values;
            cache.set(key!, value!);
        }),
        run: vi.fn(async (_sql: string, values: string[]) => {
            requireOpen();
            cache.delete(values[0]!);
        }),
    };
};

beforeEach(() => {
    vi.resetAllMocks();
    mocks.ensureTable.mockImplementation(db =>
        ensureSQLiteSchema(
            db,
            'reactQuery',
            'CREATE TABLE IF NOT EXISTS reactQuery(id TEXT PRIMARY KEY, cache TEXT)'
        )
    );
});

it('round-trips and removes quoted cache keys with bound values and initializes schema once', async () => {
    const db = database();
    mocks.getDb.mockReturnValue(db);
    const key = 'cache"; DELETE FROM users; --';
    await queryCacheStorage.setItem(key, 'synthetic snapshot');
    expect(await queryCacheStorage.getItem(key)).toBe('synthetic snapshot');
    expect(db.query).toHaveBeenLastCalledWith('SELECT cache FROM reactQuery WHERE id = ?;', [key]);
    await queryCacheStorage.removeItem(key);
    expect(db.run).toHaveBeenLastCalledWith('DELETE FROM reactQuery WHERE id = ?;', [key]);
    expect(await queryCacheStorage.getItem(key)).toBeUndefined();
    expect(db.execute).toHaveBeenCalledOnce();
    expect(db.open).toHaveBeenCalledTimes(4);
    expect(db.close).toHaveBeenCalledTimes(4);
});

it.each(['getItem', 'setItem', 'removeItem'] as const)(
    '%s cannot close a connection held by an overlapping account/credential operation',
    async method => {
        const db = database();
        mocks.getDb.mockReturnValue(db);
        const entered = deferred();
        const release = deferred();
        const accountRead = withSQLiteDatabase(db, async connection => {
            entered.resolve();
            await release.promise;
            return connection.query('SELECT cache FROM reactQuery WHERE id = ?;', ['shared']);
        });
        await entered.promise;
        try {
            await queryCacheStorage[method]('shared', 'synthetic snapshot');
            expect(db.open).toHaveBeenCalledOnce();
            expect(db.close).not.toHaveBeenCalled();
        } finally {
            release.resolve();
            await accountRead;
        }
        expect(db.close).toHaveBeenCalledOnce();
    }
);

it.each(['query', 'executeSet', 'run', 'execute'] as const)(
    'releases ownership after a %s failure and allows the next cache operation to retry',
    async operation => {
        const db = database();
        mocks.getDb.mockReturnValue(db);
        db[operation].mockRejectedValueOnce(new Error('Synthetic storage failure'));
        const attempt =
            operation === 'executeSet'
                ? queryCacheStorage.setItem('key', 'failed')
                : operation === 'run'
                  ? queryCacheStorage.removeItem('key')
                  : queryCacheStorage.getItem('key');
        await expect(attempt).rejects.toThrow('Synthetic storage failure');
        expect(db.close).toHaveBeenCalledOnce();
        await queryCacheStorage.setItem('key', 'recovered');
        expect(await queryCacheStorage.getItem('key')).toBe('recovered');
    }
);

it('preserves the existing unavailable-database behavior without acquiring a connection', async () => {
    mocks.getDb.mockReturnValue(undefined);
    expect(await queryCacheStorage.getItem('key')).toBeUndefined();
    await queryCacheStorage.setItem('key', 'snapshot');
    await queryCacheStorage.removeItem('key');
    expect(mocks.ensureTable).not.toHaveBeenCalled();
});
