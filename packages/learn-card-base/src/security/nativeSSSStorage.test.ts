import { DatabaseSync } from 'node:sqlite';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as unknown, warn: vi.fn(), error: vi.fn() }));
vi.mock('learn-card-base/stores/sqliteStore', () => ({
    sqliteStore: { get: { db: () => mocks.db } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ waitForSQLiteReady: async () => undefined }));
vi.mock('learn-card-base/react-sqlite-hook', () => ({ useSQLite: vi.fn() }));
vi.mock('learn-card-base', () => ({}));
vi.mock('../logging/logger', () => ({
    getLogger: () => ({ warn: mocks.warn, error: mocks.error }),
}));
import { createNativeSSSStorage } from './nativeSSSStorage';
import { deleteDatabase } from '../hooks/useSQLiteStorage';
beforeEach(() => vi.clearAllMocks());

const database = () => {
    const sqlite = new DatabaseSync(':memory:');
    let open = false;
    const db = {
        open: async () => {
            open = true;
        },
        close: async () => {
            if (!open) throw Error('already closed');
            open = false;
        },
        execute: vi.fn(async (sql: string) => {
            expect(open).toBe(true);
            sqlite.exec(sql);
        }),
        isExists: async () => ({ result: true }),
        getConnectionDBName: () => 'synthetic-db',
        delete: vi.fn(async () => sqlite.exec('DROP TABLE sss_shares')),
        run: async (sql: string, values: string[] = []) => {
            expect(open).toBe(true);
            return sqlite.prepare(sql).run(...values);
        },
        query: async (sql: string, values: string[] = []) => {
            expect(open).toBe(true);
            return { values: sqlite.prepare(sql).all(...values) };
        },
    };
    return { db, sqlite, isOpen: () => open };
};

it('preserves native recovery shares and versions across overlapping operations and selective deletion', async () => {
    const { db, sqlite, isOpen } = database();
    mocks.db = db;
    try {
        const store = createNativeSSSStorage();
        await Promise.all([
            store.storeDeviceShare('synthetic-share-one', 'one'),
            store.storeDeviceShare('synthetic-share-two', 'two'),
        ]);
        await Promise.all([store.storeShareVersion(3, 'one'), store.getDeviceShare('two')]);
        expect(await store.getDeviceShare('one')).toBe('synthetic-share-one');
        expect(await store.getShareVersion('one')).toBe(3);
        expect((await store.listAllShares()).map(x => x.id).sort()).toEqual(['one', 'two']);
        await store.deleteShare('one');
        expect(await store.hasDeviceShare('one')).toBe(false);
        expect(await store.getShareVersion('one')).toBeNull();
        expect(await store.getDeviceShare('two')).toBe('synthetic-share-two');
        await store.clearAllShares();
        expect(await store.listAllShares()).toEqual([]);
        await store.storeDeviceShare('after-clear');
        expect(await store.getDeviceShare()).toBe('after-clear');
        expect(db.execute).toHaveBeenCalledTimes(2); // one schema init + one row clear
        expect(isOpen()).toBe(false);
        expect(mocks.error).not.toHaveBeenCalled();
        expect(mocks.warn).not.toHaveBeenCalled();
    } finally {
        sqlite.close();
    }
});

it('recreates the recovery schema after the owning database is deleted', async () => {
    const { db, sqlite } = database();
    mocks.db = db;
    try {
        const store = createNativeSSSStorage();
        await store.storeDeviceShare('before-delete');
        await deleteDatabase(db as unknown as Parameters<typeof deleteDatabase>[0]);
        expect(db.delete).toHaveBeenCalledOnce();
        await store.storeDeviceShare('after-delete');
        expect(await store.getDeviceShare()).toBe('after-delete');
        expect(db.execute).toHaveBeenCalledTimes(2);
        expect(mocks.error).not.toHaveBeenCalled();
    } finally {
        sqlite.close();
    }
});

it('initializes recovery storage separately for a replacement connection', async () => {
    const first = database();
    const replacement = database();
    try {
        const store = createNativeSSSStorage();
        mocks.db = first.db;
        await store.storeDeviceShare('first-connection');
        mocks.db = replacement.db;
        await store.storeDeviceShare('replacement-connection');
        expect(await store.getDeviceShare()).toBe('replacement-connection');
        expect(first.db.execute).toHaveBeenCalledOnce();
        expect(replacement.db.execute).toHaveBeenCalledOnce();
        expect(mocks.error).not.toHaveBeenCalled();
    } finally {
        first.sqlite.close();
        replacement.sqlite.close();
    }
});
