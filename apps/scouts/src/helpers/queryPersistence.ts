import { ensureReactQueryTableExists, sqliteStore } from 'learn-card-base';
import { withSQLiteDatabase } from 'learn-card-base/SQL/connection';
import { waitForSQLiteReady } from 'learn-card-base/SQL/sqliteReady';

type QueryCacheDatabase = NonNullable<ReturnType<typeof sqliteStore.get.db>>;

export const SQLITE_READY_TIMEOUT_MS = 10_000;

/**
 * FullApp initializes SQLite (web and native) and signals readiness even on failure. Wait for it
 * instead of silently dropping a save made during boot, and reject if it never arrives (LC-2351).
 */
const getQueryCacheDatabase = async (): Promise<QueryCacheDatabase> => {
    if (!sqliteStore.get.db()) {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
            await Promise.race([
                waitForSQLiteReady(),
                new Promise<never>((_, reject) => {
                    timeout = setTimeout(
                        () => reject(new Error('Timed out waiting for query cache SQLite')),
                        SQLITE_READY_TIMEOUT_MS
                    );
                }),
            ]);
        } finally {
            clearTimeout(timeout);
        }
    }

    const db = sqliteStore.get.db();
    if (!db) throw new Error('Query cache SQLite is unavailable after initialization');
    return db;
};

const withQueryCacheDatabase = async <T>(
    operation: (db: QueryCacheDatabase) => Promise<T>
): Promise<T> => {
    const db = await getQueryCacheDatabase();

    return withSQLiteDatabase(db, async connection => {
        await ensureReactQueryTableExists(connection);
        return operation(connection);
    });
};

/** Share connection ownership with account, recovery and credential operations. */
export const queryCacheStorage = {
    getItem: (key: string): Promise<string | undefined> =>
        withQueryCacheDatabase(async db => {
            const result = await db.query('SELECT cache FROM reactQuery WHERE id = ?;', [key]);
            return result.values?.[0]?.cache;
        }),
    setItem: (key: string, value: string): Promise<void> =>
        withQueryCacheDatabase(async db => {
            await db.executeSet([
                {
                    statement:
                        'INSERT INTO reactQuery (id, cache) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET cache=excluded.cache;',
                    values: [key, value],
                },
            ]);
        }),
    removeItem: (key: string): Promise<void> =>
        withQueryCacheDatabase(async db => {
            await db.run('DELETE FROM reactQuery WHERE id = ?;', [key]);
        }),
};
