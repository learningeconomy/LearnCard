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
import { withSQLiteDatabase } from '../SQL/connection';

let sqlite: DatabaseSync;
let query: ReturnType<typeof vi.fn>;
let opened: boolean;
let open: ReturnType<typeof vi.fn>;
let close: ReturnType<typeof vi.fn>;

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
    sqlite = new DatabaseSync(':memory:');
    sqlite.exec('CREATE TABLE users (uid TEXT, verifierId TEXT, email TEXT, privateKey TEXT)');
    opened = false;
    open = vi.fn(async () => {
        if (opened) throw new Error('Synthetic connection is already open');
        opened = true;
    });
    close = vi.fn(async () => {
        if (!opened) throw new Error('Synthetic connection is already closed');
        opened = false;
    });
    query = vi.fn(async (sql: string, values: string[] = []) => {
        if (!opened) throw new Error('Synthetic connection was closed underneath a reader');
        return { values: sqlite.prepare(sql).all(...values) };
    });
    mocks.db = {
        open,
        close,
        query,
    };
});

afterEach(() => {
    sqlite.close();
    vi.useRealTimers();
    expect(opened).toBe(false);
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

    it('does not join an email-only legacy key to a hydrated uid row without a key', async () => {
        insertUser({ email: 'account-a@example.test' }, 'synthetic-key-a');
        insertUser({ uid: 'account-a', email: 'account-a@example.test' }, null);
        mocks.user = { uid: 'account-a', email: 'account-a@example.test' };

        expect(await readKey()).toBeNull();
        expect(query.mock.calls.every(([, values]) => values?.[0] === 'account-a')).toBe(true);
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

    it('restores a single key repeated across legacy rows before identity hydration', async () => {
        insertUser({ email: 'account-a@example.test' }, 'synthetic-key-a');
        insertUser({ uid: 'account-a', email: 'account-a@example.test' }, 'synthetic-key-a');

        expect(await readKey()).toBe('synthetic-key-a');
    });

    it.each(['uid', 'verifierId', 'email'] as const)(
        'restores identical duplicate keys only within the matching %s scope',
        async identifier => {
            insertUser({ [identifier]: 'account-b' }, 'synthetic-key-b');
            insertUser({ [identifier]: 'account-a' }, 'synthetic-key-a');
            insertUser({ [identifier]: 'account-a' }, 'synthetic-key-a');
            mocks.user = { [identifier]: 'account-a' };

            expect(await readKey()).toBe('synthetic-key-a');
            expect(query.mock.calls.every(([, values]) => values?.[0] === 'account-a')).toBe(true);
        }
    );

    it('detects a conflicting key after repeated identical rows before identity hydration', async () => {
        insertUser({ uid: 'account-a' }, 'synthetic-key-a');
        insertUser({ uid: 'account-a' }, 'synthetic-key-a');
        insertUser({ uid: 'account-b' }, 'synthetic-key-b');

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

    it.each(['uid', 'verifierId', 'email'] as const)(
        'uses a hydrated %s after a transient failure instead of a globally stored key',
        async identifier => {
            insertUser({ [identifier]: 'account-a' }, 'synthetic-key-a');
            query.mockRejectedValueOnce(new Error('synthetic transient query failure'));
            setTimeout(() => {
                mocks.user = { [identifier]: 'account-b' };
            }, 100);

            expect(await readKey()).toBeNull();
            expect(query.mock.calls[0]?.[1]).toEqual([]);
            expect(
                query.mock.calls.slice(1).every(([, values]) => values?.[0] === 'account-b')
            ).toBe(true);
        }
    );

    it.each(['uid', 'verifierId', 'email'] as const)(
        'resolves an initially ambiguous lookup after %s hydrates between attempts',
        async identifier => {
            insertUser({ [identifier]: 'account-a' }, 'synthetic-key-a');
            insertUser({ [identifier]: 'account-b' }, 'synthetic-key-b');
            setTimeout(() => {
                mocks.user = { [identifier]: 'account-b' };
            }, 100);

            expect(await readKey()).toBe('synthetic-key-b');
            expect(query.mock.calls[0]?.[1]).toEqual([]);
            expect(query).toHaveBeenCalledWith(expect.any(String), ['account-b']);
        }
    );

    it('uses a UID hydrated after an ambiguous email lookup', async () => {
        insertUser({ uid: 'account-a', email: 'same@example.test' }, 'synthetic-key-a');
        insertUser({ uid: 'account-b', email: 'same@example.test' }, 'synthetic-key-b');
        mocks.user = { email: 'same@example.test' };
        setTimeout(() => {
            mocks.user = { uid: 'account-b', email: 'same@example.test' };
        }, 100);

        expect(await readKey()).toBe('synthetic-key-b');
        expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE uid = ?'), ['account-b']);
    });

    it.each([null, { email: 'same@example.test' }])(
        'never weakens a known UID lookup if identity becomes %s during retries',
        async nextUser => {
            insertUser({ uid: 'account-a', email: 'same@example.test' }, 'synthetic-key-a');
            mocks.user = { uid: 'account-b', email: 'same@example.test' };
            setTimeout(() => {
                mocks.user = nextUser;
            }, 100);

            expect(await readKey()).toBeNull();
            expect(query.mock.calls.every(([, values]) => values?.[0] === 'account-b')).toBe(true);
        }
    );

    it.each(
        (['open', 'query', 'close'] as const).flatMap(phase =>
            [false, true].map(hasKey => ({ phase, hasKey }))
        )
    )(
        'uses hydrated identity during SQLite $phase (matching key: $hasKey)',
        async ({ phase, hasKey }) => {
            insertUser({ uid: 'account-a' }, 'synthetic-key-a');
            if (hasKey) insertUser({ uid: 'account-b' }, 'synthetic-key-b');
            const hydrate = () => {
                mocks.user = { uid: 'account-b' };
            };
            if (phase === 'open') {
                open.mockImplementationOnce(async () => {
                    opened = true;
                    hydrate();
                });
            } else if (phase === 'query') {
                query.mockImplementationOnce(async (sql: string, values: string[] = []) => {
                    const result = { values: sqlite.prepare(sql).all(...values) };
                    hydrate();
                    return result;
                });
            } else {
                close.mockImplementationOnce(async () => {
                    opened = false;
                    hydrate();
                });
            }

            expect(await readKey()).toBe(hasKey ? 'synthetic-key-b' : null);
            expect(query).toHaveBeenCalledWith(expect.any(String), ['account-b']);
        }
    );

    it.each([true, false])(
        'keeps account selection and overlapping SQLite ownership together (matching key: %s)',
        async hasKey => {
            insertUser({ uid: 'account-a' }, 'synthetic-key-a');
            insertUser({ uid: 'account-b' }, hasKey ? 'synthetic-key-b' : null);
            mocks.user = { uid: 'account-b' };
            let entered!: () => void;
            let release!: () => void;
            const started = new Promise<void>(resolve => {
                entered = resolve;
            });
            const held = new Promise<void>(resolve => {
                release = resolve;
            });
            const db = { open, close, query };
            mocks.db = db;
            const reader = withSQLiteDatabase(db, async connection => {
                entered();
                await held;
                return connection.query('SELECT privateKey FROM users WHERE uid = ?', [
                    'account-b',
                ]);
            });
            await started;
            try {
                expect(await readKey()).toBe(hasKey ? 'synthetic-key-b' : null);
                expect(open).toHaveBeenCalledOnce();
                expect(close).not.toHaveBeenCalled();
                expect(query.mock.calls.every(([, values]) => values?.[0] === 'account-b')).toBe(
                    true
                );
            } finally {
                release();
                await reader;
            }
            expect(close).toHaveBeenCalledOnce();
        }
    );
});

it('keeps browser key restoration on web secure storage', async () => {
    mocks.platform = 'web';
    mocks.webGet.mockResolvedValue('synthetic-web-key');

    expect(await readKey()).toBe('synthetic-web-key');
    expect(query).not.toHaveBeenCalled();
});
