import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { ensureReactQueryTableExists, sqliteStore } from 'learn-card-base';
import { withSQLiteDatabase } from 'learn-card-base/SQL/connection';

const withQueryCacheDatabase = async <T>(
    operation: (db: SQLiteDBConnection) => Promise<T>
): Promise<T | undefined> => {
    const db = sqliteStore.get.db();
    if (!db) return;

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
    setItem: (key: string, value: string): Promise<unknown> =>
        withQueryCacheDatabase(db =>
            db.executeSet([
                {
                    statement:
                        'INSERT INTO reactQuery (id, cache) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET cache=excluded.cache;',
                    values: [key, value],
                },
            ])
        ),
    removeItem: (key: string): Promise<unknown> =>
        withQueryCacheDatabase(db => db.run('DELETE FROM reactQuery WHERE id = ?;', [key])),
};
