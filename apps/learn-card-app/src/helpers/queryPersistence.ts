import { Capacitor } from '@capacitor/core';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { ensureReactQueryTableExists, getLogger, sqliteStore } from 'learn-card-base';
import { waitForSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
import localforage from 'localforage';
import { createQueryPersister } from './createQueryPersister';

const log = getLogger('cache');
const isNative = Capacitor.isNativePlatform();
const SQLITE_READY_TIMEOUT_MS = 10_000;

/**
 * Native initialization runs in FullApp's effects and signals readiness even on failure.
 * Wait for it before restoring; never consult a second store, including after a reload.
 * A failed/timed-out initialization rejects persistence rather than claiming a durable save.
 */
const getNativeDatabase = async (): Promise<SQLiteDBConnection> => {
    if (!sqliteStore.get.db()) {
        let timeout: number | undefined;
        try {
            await Promise.race([
                waitForSQLiteReady(),
                new Promise<never>((_, reject) => {
                    timeout = window.setTimeout(
                        () => reject(new Error('Timed out waiting for native query cache SQLite')),
                        SQLITE_READY_TIMEOUT_MS
                    );
                }),
            ]);
        } finally {
            window.clearTimeout(timeout);
        }
    }

    const db = sqliteStore.get.db();
    if (!db) throw new Error('Native query cache SQLite is unavailable after initialization');
    return db;
};

const withNativeDatabase = async <T>(
    operation: (db: SQLiteDBConnection) => Promise<T>
): Promise<T> => {
    const db = await getNativeDatabase();
    await ensureReactQueryTableExists(db);
    const isOpen = await db.isDBOpen();
    if (!isOpen.result) await db.open();
    try {
        return await operation(db);
    } finally {
        if (!isOpen.result) await db.close();
    }
};

export const { persister, persistNow: persistQueryCacheNow } = createQueryPersister(
    {
        // Browser storage remains independent of the optional web SQLite initialization.
        // Native ignores legacy localforage snapshots: falling back can resurrect stale data.
        getItem: key =>
            isNative
                ? withNativeDatabase(async db => {
                      const result = await db.query('SELECT cache FROM reactQuery WHERE id = ?;', [
                          key,
                      ]);
                      return result.values?.[0]?.cache;
                  })
                : localforage.getItem<string>(key),
        setItem: (key, value) =>
            isNative
                ? withNativeDatabase(db =>
                      db.executeSet([
                          {
                              statement:
                                  'INSERT INTO reactQuery (id, cache) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET cache=excluded.cache;',
                              values: [key, value],
                          },
                      ])
                  )
                : localforage.setItem(key, value),
        removeItem: key =>
            isNative
                ? withNativeDatabase(db => db.run('DELETE FROM reactQuery WHERE id = ?;', [key]))
                : localforage.removeItem(key),
    },
    error => log.error('Error persisting query cache', error)
);
