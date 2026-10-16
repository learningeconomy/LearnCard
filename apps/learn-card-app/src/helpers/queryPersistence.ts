import { Capacitor } from '@capacitor/core';
import { ensureReactQueryTableExists, getLogger, sqliteStore } from 'learn-card-base';
import localforage from 'localforage';
import { createQueryPersister } from './createQueryPersister';

const log = getLogger('cache');

export const { persister, persistNow: persistQueryCacheNow } = createQueryPersister(
    {
        getItem: async key => {
            try {
                // Web hydration can precede SQLite initialization. Never switch its
                // cache backend mid-session or the next reload can restore an older copy.
                const db = Capacitor.isNativePlatform() ? sqliteStore.get.db() : undefined;

                if (!db) return localforage.getItem<string>(key);

                await ensureReactQueryTableExists(db);

                // Check if DB is already open before opening
                const isOpen = await db.isDBOpen();
                if (!isOpen.result) {
                    await db.open();
                }

                const result = await db.query(`SELECT cache FROM reactQuery WHERE id="${key}";`);

                // Only close if we opened it
                if (!isOpen.result) {
                    await db.close();
                }

                if (result.values?.length === 0) return;

                return result.values![0].cache;
            } catch (error) {
                log.error('Error getting from cache', error, { key });
                // Fallback to localforage on error
                return localforage.getItem<string>(key);
            }
        },
        setItem: async (key, value) => {
            try {
                const db = Capacitor.isNativePlatform() ? sqliteStore.get.db() : undefined;

                if (!db) return localforage.setItem(key, value);

                await ensureReactQueryTableExists(db);

                // Check if DB is already open before opening
                const isOpen = await db.isDBOpen();
                if (!isOpen.result) {
                    await db.open();
                }

                await db.executeSet([
                    {
                        statement:
                            'INSERT INTO reactQuery (id, cache) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET cache=excluded.cache;',
                        values: [key, value],
                    },
                ]);

                // Only close if we opened it
                if (!isOpen.result) {
                    await db.close();
                }
            } catch (error) {
                log.error('Error setting in cache', error, { key });
                // Fallback to localforage on error
                try {
                    return await localforage.setItem(key, value);
                } catch (fallbackError) {
                    log.error('Fallback cache error', fallbackError);
                    throw fallbackError;
                }
            }
        },
        removeItem: async key => {
            try {
                const db = Capacitor.isNativePlatform() ? sqliteStore.get.db() : undefined;

                if (!db) {
                    await localforage.removeItem(key);
                    return;
                }

                await ensureReactQueryTableExists(db);

                // Check if DB is already open before opening
                const isOpen = await db.isDBOpen();
                if (!isOpen.result) {
                    await db.open();
                }

                await db.execute(`DELETE FROM reactQuery WHERE id="${key}";`);

                // Only close if we opened it
                if (!isOpen.result) {
                    await db.close();
                }
            } catch (error) {
                log.error('Error removing from cache', error, { key });
                // Fallback to localforage on error
                try {
                    await localforage.removeItem(key);
                } catch (fallbackError) {
                    log.error('Fallback cache removal error', fallbackError);
                    throw fallbackError;
                }
            }
        },
    },
    error => log.error('Error persisting query cache', error)
);
