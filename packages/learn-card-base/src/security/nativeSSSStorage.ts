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

const TABLE = 'sss_shares';
const DEFAULT_SHARE_ID = 'sss-device-share';

/**
 * Ensure the `sss_shares` table exists in the SQLite database.
 */
const ensureTable = async (): Promise<void> => {
    const db = sqliteStore.get.db();

    if (!db) return;

    try {
        await db.open();

        await db.execute(`
            CREATE TABLE IF NOT EXISTS ${TABLE} (
                id TEXT PRIMARY KEY,
                share TEXT NOT NULL
            )
        `);
    } finally {
        try {
            if ((await db?.isDBOpen())?.result) await db?.close();
        } catch {}
    }
};

let tableEnsured = false;

const ensureTableOnce = async () => {
    if (!tableEnsured) {
        await ensureTable();
        tableEnsured = true;
    }
};

export interface NativeSSSStorageFunctions {
    storeDeviceShare: (share: string, id?: string) => Promise<void>;
    getDeviceShare: (id?: string) => Promise<string | null>;
    hasDeviceShare: (id?: string) => Promise<boolean>;
    clearAllShares: (id?: string) => Promise<void>;
}

/**
 * Create a native SSS storage adapter backed by the app's encrypted SQLite DB.
 * Falls back gracefully if the DB is not available (returns null / no-ops).
 */
export const createNativeSSSStorage = (): NativeSSSStorageFunctions => {
    const storeDeviceShare = async (share: string, id?: string): Promise<void> => {
        await ensureTableOnce();

        const shareId = id ?? DEFAULT_SHARE_ID;
        const db = sqliteStore.get.db();

        if (!db) {
            console.warn('[NativeSSSStorage] No SQLite DB available, falling back to no-op');
            return;
        }

        try {
            await db.open();

            await db.run(
                `INSERT OR REPLACE INTO ${TABLE} (id, share) VALUES (?, ?)`,
                [shareId, share]
            );
        } catch (e) {
            console.error('[NativeSSSStorage] storeDeviceShare failed', e);
        } finally {
            try {
                if ((await db?.isDBOpen())?.result) await db?.close();
            } catch {}
        }
    };

    const getDeviceShare = async (id?: string): Promise<string | null> => {
        await ensureTableOnce();

        const shareId = id ?? DEFAULT_SHARE_ID;
        const db = sqliteStore.get.db();

        if (!db) return null;

        try {
            await db.open();

            const res = await db.query(
                `SELECT share FROM ${TABLE} WHERE id = ? LIMIT 1`,
                [shareId]
            );

            const share = res?.values?.[0]?.share ?? null;

            return typeof share === 'string' && share.length > 0 ? share : null;
        } catch (e) {
            console.warn('[NativeSSSStorage] getDeviceShare failed', e);
            return null;
        } finally {
            try {
                if ((await db?.isDBOpen())?.result) await db?.close();
            } catch {}
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
            await db.open();

            if (id) {
                await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
            } else {
                await db.execute(`DELETE FROM ${TABLE}`);
                tableEnsured = false;
            }
        } catch (e) {
            console.warn('[NativeSSSStorage] clearAllShares failed', e);
        } finally {
            try {
                if ((await db?.isDBOpen())?.result) await db?.close();
            } catch {}
        }
    };

    return {
        storeDeviceShare,
        getDeviceShare,
        hasDeviceShare,
        clearAllShares,
    };
};
