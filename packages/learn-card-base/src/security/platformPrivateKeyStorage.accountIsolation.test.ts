import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    db: null as unknown,
    user: null as { uid?: string; verifierId?: string; email?: string } | null,
    platform: 'android',
    webGet: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform } }));
vi.mock('learn-card-base/security/webSecureStorage', () => ({
    getPrivateKey: mocks.webGet,
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({
    default: { get: { currentUser: () => mocks.user } },
}));
vi.mock('learn-card-base/stores/sqliteStore', () => ({
    sqliteStore: { get: { db: () => mocks.db } },
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ waitForSQLiteReady: async () => undefined }));
vi.mock('../logging/logger', () => ({ getLogger: () => ({ warn: vi.fn() }) }));

import { getPlatformPrivateKey } from './platformPrivateKeyStorage';

let sqlite: DatabaseSync;
let query: ReturnType<typeof vi.fn>;

const insertUser = (
    user: { uid?: string; verifierId?: string; email?: string },
    key: string | null
): void => {
    sqlite
        .prepare('INSERT INTO users (uid, verifierId, email, privateKey) VALUES (?, ?, ?, ?)')
        .run(user.uid ?? null, user.verifierId ?? null, user.email ?? null, key);
};

const readKey = async (): Promise<string | null> => {
    const result = getPlatformPrivateKey();
    await vi.runAllTimersAsync();
    return result;
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.platform = 'android';
    mocks.user = null;
    sqlite = new DatabaseSync(':memory:', { enableDoubleQuotedStringLiterals: true });
    sqlite.exec('CREATE TABLE users (uid TEXT, verifierId TEXT, email TEXT, privateKey TEXT)');
    query = vi.fn(async (sql: string, values: string[] = []) => ({
        values: sqlite.prepare(sql).all(...values),
    }));
    mocks.db = {
        open: vi.fn(async () => undefined),
        close: vi.fn(async () => undefined),
        query,
    };
});

afterEach(() => {
    sqlite.close();
    vi.useRealTimers();
});

describe.each(['android', 'ios'])('%s account key isolation', platform => {
    beforeEach(() => {
        mocks.platform = platform;
    });

    it.each(['uid', 'verifierId', 'email'] as const)(
        'does not fall back to another account after a missing %s lookup',
        async identifier => {
            insertUser({ [identifier]: 'account-a' }, 'synthetic-key-a');
            mocks.user = { [identifier]: 'account-b' };

            expect(await readKey()).toBeNull();
            expect(query.mock.calls.every(([, values]) => values?.[0] === 'account-b')).toBe(true);
        }
    );

    it.each([null, ''])(
        'does not replace the active account key %s with another key',
        async key => {
            insertUser({ uid: 'account-a' }, 'synthetic-key-a');
            insertUser({ uid: 'account-b' }, key);
            mocks.user = { uid: 'account-b' };

            expect(await readKey()).toBeNull();
        }
    );

    it.each(['uid', 'verifierId', 'email'] as const)(
        'restores only the matching %s using a bound identifier',
        async identifier => {
            const accountId = `learner's "account"`;
            insertUser({ [identifier]: 'account-a' }, 'synthetic-key-a');
            insertUser({ [identifier]: accountId }, 'synthetic-key-b');
            mocks.user = { [identifier]: accountId };

            expect(await readKey()).toBe('synthetic-key-b');
            expect(query).toHaveBeenCalledWith(expect.stringContaining('?'), [accountId]);
        }
    );

    it('does not use a weaker identifier after a known uid misses', async () => {
        insertUser({ uid: 'account-a', email: 'same@example.test' }, 'synthetic-key-a');
        mocks.user = { uid: 'account-b', email: 'same@example.test' };

        expect(await readKey()).toBeNull();
    });

    it.each([null, {}, { uid: '', verifierId: '', email: '' }])(
        'restores one unambiguous key before identity hydration (%s)',
        async user => {
            insertUser({ uid: 'keyless' }, null);
            insertUser({ uid: 'empty' }, '');
            insertUser({ uid: 'account-a' }, 'synthetic-key-a');
            mocks.user = user;

            expect(await readKey()).toBe('synthetic-key-a');
        }
    );

    it('returns missing when there are no stored keys before identity hydration', async () => {
        insertUser({ uid: 'keyless' }, null);

        expect(await readKey()).toBeNull();
    });

    it('does not choose between multiple account keys before identity hydration', async () => {
        insertUser({ uid: 'account-a' }, 'synthetic-key-a');
        insertUser({ uid: 'account-b' }, 'synthetic-key-b');

        expect(await readKey()).toBeNull();
    });

    it('does not choose between conflicting duplicate rows for a known account', async () => {
        insertUser({ uid: 'account-a' }, 'synthetic-key-one');
        insertUser({ uid: 'account-a' }, 'synthetic-key-two');
        mocks.user = { uid: 'account-a' };

        expect(await readKey()).toBeNull();
    });

    it('returns missing when native storage is unavailable', async () => {
        mocks.db = null;

        expect(await readKey()).toBeNull();
        expect(query).not.toHaveBeenCalled();
    });

    it('retries a transient query failure without changing account scope', async () => {
        insertUser({ uid: 'account-a' }, 'synthetic-key-a');
        insertUser({ uid: 'account-b' }, 'synthetic-key-b');
        mocks.user = { uid: 'account-b' };
        query.mockRejectedValueOnce(new Error('synthetic transient query failure'));

        expect(await readKey()).toBe('synthetic-key-b');
        expect(query.mock.calls.every(([, values]) => values?.[0] === 'account-b')).toBe(true);
    });
});

it('keeps browser key restoration on web secure storage', async () => {
    mocks.platform = 'web';
    mocks.webGet.mockResolvedValue('synthetic-web-key');

    expect(await readKey()).toBe('synthetic-web-key');
    expect(query).not.toHaveBeenCalled();
});
