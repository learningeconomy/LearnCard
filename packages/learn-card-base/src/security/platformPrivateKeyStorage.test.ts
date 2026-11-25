import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    db: null as unknown,
    user: null as { uid?: string; email?: string; verifierId?: string } | null,
    platform: 'android',
    fallback: vi.fn(),
    webGet: vi.fn(),
    webSet: vi.fn(),
    webClear: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform } }));
vi.mock('learn-card-base/security/webSecureStorage', () => ({
    getPrivateKey: mocks.webGet,
    setPrivateKey: mocks.webSet,
    clearPrivateKey: mocks.webClear,
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({
    default: { get: { currentUser: () => mocks.user }, set: { currentUserPK: mocks.fallback } },
}));
vi.mock('learn-card-base/stores/sqliteStore', () => ({
    sqliteStore: { get: { db: () => mocks.db } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ waitForSQLiteReady: async () => undefined }));
vi.mock('../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn() }) }));
import {
    clearPlatformPrivateKey,
    getPlatformPrivateKey,
    setPlatformPrivateKey,
} from './platformPrivateKeyStorage';

let sqlite: DatabaseSync;
let opened: boolean;
beforeEach(() => {
    vi.clearAllMocks();
    mocks.platform = 'android';
    mocks.user = { uid: `learner's "id"`, email: 'test@example.com' };
    sqlite = new DatabaseSync(':memory:');
    sqlite.exec(
        `CREATE TABLE users (email TEXT, name TEXT, profileImage TEXT, aggregateVerifier TEXT, verifier TEXT, verifierId TEXT, typeOfLogin TEXT, dappShare TEXT, privateKey TEXT, baseColor TEXT, uid TEXT, phoneNumber TEXT);`
    );
    opened = false;
    mocks.db = {
        open: async () => {
            opened = true;
        },
        close: async () => {
            if (!opened) throw new Error('already closed');
            opened = false;
        },
        run: async (sql: string, values: string[] = []) => {
            expect(opened).toBe(true);
            return sqlite.prepare(sql).run(...values);
        },
        query: async (sql: string, values: string[] = []) => {
            expect(opened).toBe(true);
            return { values: sqlite.prepare(sql).all(...values) };
        },
    };
});
afterEach(() => sqlite.close());

describe('native account key persistence', () => {
    it('inserts, restores and updates the exact account key with bound identifiers', async () => {
        await setPlatformPrivateKey('synthetic-key-one');
        expect(await getPlatformPrivateKey()).toBe('synthetic-key-one');
        await setPlatformPrivateKey('synthetic-key-two');
        expect(await getPlatformPrivateKey()).toBe('synthetic-key-two');
        expect(sqlite.prepare('SELECT COUNT(*) AS count FROM users').get()).toEqual({ count: 1 });
        expect(opened).toBe(false);
        expect(mocks.fallback).not.toHaveBeenCalled();
    });
    it('restores on cold hydration before account identifiers are available', async () => {
        await setPlatformPrivateKey('synthetic-key');
        mocks.user = null;
        expect(await getPlatformPrivateKey()).toBe('synthetic-key');
        expect(opened).toBe(false);
    });
    it('clears only the selected account even when the connection started closed', async () => {
        await setPlatformPrivateKey('first-key');
        mocks.user = { uid: 'other' };
        await setPlatformPrivateKey('other-key');
        await clearPlatformPrivateKey();
        expect(sqlite.prepare('SELECT privateKey FROM users WHERE uid = ?').get('other')).toEqual({
            privateKey: null,
        });
        mocks.user = { uid: `learner's "id"` };
        expect(await getPlatformPrivateKey()).toBe('first-key');
        expect(opened).toBe(false);
    });
    it('keeps the browser storage backend independent of native SQLite', async () => {
        mocks.platform = 'web';
        mocks.db = null;
        mocks.webGet.mockResolvedValue('browser-key');
        await setPlatformPrivateKey('browser-key');
        expect(await getPlatformPrivateKey()).toBe('browser-key');
        await clearPlatformPrivateKey();
        expect(mocks.webSet).toHaveBeenCalledWith('browser-key');
        expect(mocks.webClear).toHaveBeenCalledOnce();
    });
});
