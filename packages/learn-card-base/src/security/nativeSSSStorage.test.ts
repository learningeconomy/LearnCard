import { DatabaseSync } from 'node:sqlite';
import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as unknown, warn: vi.fn(), error: vi.fn() }));
vi.mock('learn-card-base/stores/sqliteStore', () => ({
    sqliteStore: { get: { db: () => mocks.db } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ waitForSQLiteReady: async () => undefined }));
vi.mock('../logging/logger', () => ({
    getLogger: () => ({ warn: mocks.warn, error: mocks.error }),
}));
import { createNativeSSSStorage } from './nativeSSSStorage';
it('preserves native recovery shares and versions across overlapping operations and selective deletion', async () => {
    const sqlite = new DatabaseSync(':memory:');
    let open = false;
    mocks.db = {
        open: async () => {
            open = true;
        },
        close: async () => {
            if (!open) throw Error('already closed');
            open = false;
        },
        execute: async (sql: string) => {
            expect(open).toBe(true);
            sqlite.exec(sql);
        },
        run: async (sql: string, values: string[] = []) => {
            expect(open).toBe(true);
            return sqlite.prepare(sql).run(...values);
        },
        query: async (sql: string, values: string[] = []) => {
            expect(open).toBe(true);
            return { values: sqlite.prepare(sql).all(...values) };
        },
    };
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
        expect(open).toBe(false);
        expect(mocks.error).not.toHaveBeenCalled();
        expect(mocks.warn).not.toHaveBeenCalled();
    } finally {
        sqlite.close();
    }
});
