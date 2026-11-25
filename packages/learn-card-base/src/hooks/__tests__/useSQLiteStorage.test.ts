import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('../../stores/sqliteStore', () => ({ sqliteStore: { use: { db: () => mocks.db } } }));
vi.mock('learn-card-base/react-sqlite-hook', () => ({ useSQLite: vi.fn() }));
vi.mock('learn-card-base', () => ({}));
vi.mock('../../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn() }) }));

import { useSQLiteStorage } from '../useSQLiteStorage';

let database: DatabaseSync;
let open = false;
let run: ReturnType<typeof vi.fn>;

beforeEach(() => {
    database = new DatabaseSync(':memory:');
    open = false;
    // Execute the hook's SQL against real SQLite, behind the Capacitor connection API.
    run = vi.fn(async (sql: string, values: string[] = []) => database.prepare(sql).run(...values));
    mocks.db = {
        open: async () => {
            open = true;
        },
        close: async () => {
            open = false;
        },
        isDBOpen: async () => ({ result: open }),
        isTable: async (name: string) => ({
            result: Boolean(
                database
                    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
                    .get(name)
            ),
        }),
        execute: async (sql: string) => database.exec(sql),
        query: async (sql: string, values: string[] = []) => ({
            values: database.prepare(sql).all(...values),
        }),
        run,
    };
});
afterEach(() => database.close());

const rows = () => database.prepare('SELECT uid, name, profileImage FROM users ORDER BY uid').all();

describe('SQLite user profile persistence', () => {
    it.each([
        `O"Brien's Scout`,
        `name", profileImage="injected" WHERE 1=1; --`,
        `name'); DROP TABLE users; --`,
    ])('stores the literal name %j without changing other users', async name => {
        const storage = useSQLiteStorage();
        await storage.setCurrentUser({ uid: 'one', name: 'First' });
        await storage.setCurrentUser({ uid: 'two', name: 'Second' });
        const image = `https://example.com/"quoted'image"`;
        await storage.updateCurrentUser('one', { name, profileImage: image });
        expect(rows()).toEqual([
            { uid: 'one', name, profileImage: image },
            { uid: 'two', name: 'Second', profileImage: '' },
        ]);
        expect(open).toBe(false);
    });

    it('binds user identifiers and insert values, including duplicate lookups', async () => {
        const storage = useSQLiteStorage();
        const uid = `one" OR 1=1; --`;
        const name = `O'Brien'); DROP TABLE users; --`;
        await storage.setCurrentUser({ uid: 'other', name: 'Other' });
        await storage.setCurrentUser({ uid, name });
        await storage.setCurrentUser({ uid, name: 'Duplicate should not insert' });
        await storage.updateCurrentUser(uid, { name, profileImage: 'updated' });
        expect(rows()).toEqual([
            { uid, name, profileImage: 'updated' },
            { uid: 'other', name: 'Other', profileImage: '' },
        ]);
    });

    it('binds email lookup values when no uid is available', async () => {
        const storage = useSQLiteStorage();
        const email = `scout"@example.com`;
        await storage.setCurrentUser({ email, name: `O'Brien` });
        await storage.setCurrentUser({ email, name: 'Duplicate' });
        expect(database.prepare('SELECT email, name FROM users').all()).toEqual([
            { email, name: `O'Brien` },
        ]);
    });

    it('binds the legacy update without a uid', async () => {
        const storage = useSQLiteStorage();
        await storage.setCurrentUser({ name: 'Old' });
        const name = `O"Brien's Scout`;
        await storage.updateCurrentUser(undefined, { name, profileImage: '' });
        expect(rows()).toEqual([{ uid: '', name, profileImage: '' }]);
    });

    it('rejects write failures so forms can stay open for retry', async () => {
        const storage = useSQLiteStorage();
        await storage.setCurrentUser({ uid: 'one', name: 'Original' });
        run.mockRejectedValueOnce(new Error('disk full'));
        await expect(
            storage.updateCurrentUser('one', { name: 'New', profileImage: '' })
        ).rejects.toThrow('disk full');
        expect(open).toBe(false);
        expect(rows()).toEqual([{ uid: 'one', name: 'Original', profileImage: '' }]);
    });
});
