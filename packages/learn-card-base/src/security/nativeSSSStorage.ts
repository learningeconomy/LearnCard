import { ensureSQLiteSchema, withSQLiteDatabase } from 'learn-card-base/SQL/connection';
import { getLogger } from '../logging/logger';
const log = getLogger('native-sssstorage');
/**
 * Native SSS Device Share Storage
 *
 * On native Capacitor platforms (iOS/Android), IndexedDB persistence can be
 * unreliable — iOS WKWebView may evict IndexedDB data under storage pressure.
 *
 * This module provides an alternative `SSSStorageFunctions` implementation
 * backed by the encrypted SQLite database that learn-card-base already uses
 * for private key storage on native. The share is stored in a dedicated
 * `sss_shares` table.
 *
 * Usage:
 * ```ts
 * import { createNativeSSSStorage } from 'learn-card-base/security/nativeSSSStorage';
 *
 * const nativeStorage = createNativeSSSStorage();
 * const strategy = createSSSStrategy({ serverUrl, storage: nativeStorage });
 * ```
 */

import { sqliteStore } from 'learn-card-base/stores/sqliteStore';
import { waitForSQLiteReady } from 'learn-card-base/SQL/sqliteReady';

const TABLE = 'sss_shares';
const DEFAULT_SHARE_ID = 'sss-device-share';

/**
 * Ensure the `sss_shares` table exists in the SQLite database.
 */
const ensureTable = async (): Promise<boolean> => {
    await waitForSQLiteReady();

    const db = sqliteStore.get.db();

    if (!db) return false;

    try {
        await ensureSQLiteSchema(
            db,
            TABLE,
            `
            CREATE TABLE IF NOT EXISTS ${TABLE} (
                id TEXT PRIMARY KEY,
                share TEXT NOT NULL
            )
        `
        );
        return true;
    } catch {
        return false;
    }
};

export interface NativeShareEntry {
    id: string;
    preview: string;
    shareVersion?: number;
}

export interface NativeSSSStorageFunctions {
    storeDeviceShare: (share: string, id?: string) => Promise<void>;
    getDeviceShare: (id?: string) => Promise<string | null>;
    hasDeviceShare: (id?: string) => Promise<boolean>;
    clearAllShares: (id?: string) => Promise<void>;
    deleteDeviceShare: (id?: string) => Promise<void>;
    storeShareVersion: (version: number, id?: string) => Promise<void>;
    getShareVersion: (id?: string) => Promise<number | null>;
    listAllShares: () => Promise<NativeShareEntry[]>;
    deleteShare: (id: string) => Promise<void>;
}

/**
 * Create a native SSS storage adapter backed by the app's encrypted SQLite DB.
 * Falls back gracefully if the DB is not available (returns null / no-ops).
 */
export const createNativeSSSStorage = (): NativeSSSStorageFunctions => {
    const storeDeviceShare = async (share: string, id?: string): Promise<void> => {
        await ensureTable();

        const shareId = id ?? DEFAULT_SHARE_ID;
        const db = sqliteStore.get.db();

        if (!db) {
            log.warn('[NativeSSSStorage] No SQLite DB available, falling back to no-op');
            return;
        }

        try {
            return await withSQLiteDatabase(db, async () => {
                await db.run(`INSERT OR REPLACE INTO ${TABLE} (id, share) VALUES (?, ?)`, [
                    shareId,
                    share,
                ]);
            });
        } catch (e) {
            log.error('[NativeSSSStorage] storeDeviceShare failed', e);
        }
    };

    const getDeviceShare = async (id?: string): Promise<string | null> => {
        await ensureTable();

        const shareId = id ?? DEFAULT_SHARE_ID;
        const db = sqliteStore.get.db();

        if (!db) return null;

        try {
            return await withSQLiteDatabase(db, async () => {
                const res = await db.query(`SELECT share FROM ${TABLE} WHERE id = ? LIMIT 1`, [
                    shareId,
                ]);

                const share = res?.values?.[0]?.share ?? null;

                return typeof share === 'string' && share.length > 0 ? share : null;
            });
        } catch (e) {
            log.warn('[NativeSSSStorage] getDeviceShare failed', e);
            return null;
        }
    };

    const hasDeviceShare = async (id?: string): Promise<boolean> => {
        const share = await getDeviceShare(id);
        return share !== null;
    };

    const clearAllShares = async (id?: string): Promise<void> => {
        const db = sqliteStore.get.db();

        if (!db) return;

        try {
            return await withSQLiteDatabase(db, async () => {
                if (id) {
                    await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
                } else {
                    await db.execute(`DELETE FROM ${TABLE}`);
                }
            });
        } catch (e) {
            log.warn('[NativeSSSStorage] clearAllShares failed', e);
        }
    };

    const storeShareVersion = async (version: number, id?: string): Promise<void> => {
        await ensureTable();

        const versionId = `${id ?? DEFAULT_SHARE_ID}:version`;
        const db = sqliteStore.get.db();

        if (!db) {
            log.warn('[NativeSSSStorage] No SQLite DB available, falling back to no-op');
            return;
        }

        try {
            return await withSQLiteDatabase(db, async () => {
                await db.run(`INSERT OR REPLACE INTO ${TABLE} (id, share) VALUES (?, ?)`, [
                    versionId,
                    String(version),
                ]);
            });
        } catch (e) {
            log.error('[NativeSSSStorage] storeShareVersion failed', e);
        }
    };

    const getShareVersion = async (id?: string): Promise<number | null> => {
        await ensureTable();

        const versionId = `${id ?? DEFAULT_SHARE_ID}:version`;
        const db = sqliteStore.get.db();

        if (!db) return null;

        try {
            return await withSQLiteDatabase(db, async () => {
                const res = await db.query(`SELECT share FROM ${TABLE} WHERE id = ? LIMIT 1`, [
                    versionId,
                ]);

                const raw = res?.values?.[0]?.share ?? null;

                if (raw == null) return null;

                const parsed = Number(raw);

                return Number.isFinite(parsed) ? parsed : null;
            });
        } catch (e) {
            log.warn('[NativeSSSStorage] getShareVersion failed', e);
            return null;
        }
    };

    const listAllShares = async (): Promise<NativeShareEntry[]> => {
        await ensureTable();

        const db = sqliteStore.get.db();

        if (!db) return [];

        try {
            return await withSQLiteDatabase(db, async () => {
                const res = await db.query(`SELECT id, share FROM ${TABLE}`);
                const rows: Array<{ id: string; share: string }> = res?.values ?? [];

                const entries: NativeShareEntry[] = [];

                for (const row of rows) {
                    // Skip :version metadata rows
                    if (row.id.endsWith(':version')) continue;

                    const share = row.share;
                    const preview =
                        share.length > 16
                            ? share.substring(0, 8) + '...' + share.substring(share.length - 8)
                            : share;

                    // Look up companion version
                    const versionRow = rows.find(r => r.id === `${row.id}:version`);
                    const version = versionRow ? Number(versionRow.share) : undefined;

                    entries.push({
                        id: row.id,
                        preview,
                        shareVersion: version && Number.isFinite(version) ? version : undefined,
                    });
                }

                return entries;
            });
        } catch (e) {
            log.warn('[NativeSSSStorage] listAllShares failed', e);
            return [];
        }
    };

    const deleteShare = async (id: string): Promise<void> => {
        await ensureTable();

        const db = sqliteStore.get.db();

        if (!db) return;

        try {
            return await withSQLiteDatabase(db, async () => {
                await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
                await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [`${id}:version`]);
            });
        } catch (e) {
            log.warn('[NativeSSSStorage] deleteShare failed', e);
        }
    };

    return {
        storeDeviceShare,
        getDeviceShare,
        hasDeviceShare,
        clearAllShares,
        deleteDeviceShare: (id?: string) => deleteShare(id ?? DEFAULT_SHARE_ID),
        storeShareVersion,
        getShareVersion,
        listAllShares,
        deleteShare,
    };
};
