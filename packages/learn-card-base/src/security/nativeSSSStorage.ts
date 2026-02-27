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
        await db.open();

        await db.execute(`
            CREATE TABLE IF NOT EXISTS ${TABLE} (
                id TEXT PRIMARY KEY,
                share TEXT NOT NULL
            )
        `);
        return true;
    } catch {
        return false;
    } finally {
        try {
            if ((await db?.isDBOpen())?.result) await db?.close();
        } catch {}
    }
};

let tableEnsured = false;

const ensureTableOnce = async () => {
    if (!tableEnsured) {
        const ok = await ensureTable();
        tableEnsured = ok;
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

    const storeShareVersion = async (version: number, id?: string): Promise<void> => {
        await ensureTableOnce();

        const versionId = `${id ?? DEFAULT_SHARE_ID}:version`;
        const db = sqliteStore.get.db();

        if (!db) {
            console.warn('[NativeSSSStorage] No SQLite DB available, falling back to no-op');
            return;
        }

        try {
            await db.open();

            await db.run(
                `INSERT OR REPLACE INTO ${TABLE} (id, share) VALUES (?, ?)`,
                [versionId, String(version)]
            );
        } catch (e) {
            console.error('[NativeSSSStorage] storeShareVersion failed', e);
        } finally {
            try {
                if ((await db?.isDBOpen())?.result) await db?.close();
            } catch {}
        }
    };

    const getShareVersion = async (id?: string): Promise<number | null> => {
        await ensureTableOnce();

        const versionId = `${id ?? DEFAULT_SHARE_ID}:version`;
        const db = sqliteStore.get.db();

        if (!db) return null;

        try {
            await db.open();

            const res = await db.query(
                `SELECT share FROM ${TABLE} WHERE id = ? LIMIT 1`,
                [versionId]
            );

            const raw = res?.values?.[0]?.share ?? null;

            if (raw == null) return null;

            const parsed = Number(raw);

            return Number.isFinite(parsed) ? parsed : null;
        } catch (e) {
            console.warn('[NativeSSSStorage] getShareVersion failed', e);
            return null;
        } finally {
            try {
                if ((await db?.isDBOpen())?.result) await db?.close();
            } catch {}
        }
    };

    const listAllShares = async (): Promise<NativeShareEntry[]> => {
        await ensureTableOnce();

        const db = sqliteStore.get.db();

        if (!db) return [];

        try {
            await db.open();

            const res = await db.query(`SELECT id, share FROM ${TABLE}`);
            const rows: Array<{ id: string; share: string }> = res?.values ?? [];

            const entries: NativeShareEntry[] = [];

            for (const row of rows) {
                // Skip :version metadata rows
                if (row.id.endsWith(':version')) continue;

                const share = row.share;
                const preview = share.length > 16
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
        } catch (e) {
            console.warn('[NativeSSSStorage] listAllShares failed', e);
            return [];
        } finally {
            try {
                if ((await db?.isDBOpen())?.result) await db?.close();
            } catch {}
        }
    };

    const deleteShare = async (id: string): Promise<void> => {
        await ensureTableOnce();

        const db = sqliteStore.get.db();

        if (!db) return;

        try {
            await db.open();

            await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
            await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [`${id}:version`]);
        } catch (e) {
            console.warn('[NativeSSSStorage] deleteShare failed', e);
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
        storeShareVersion,
        getShareVersion,
        listAllShares,
        deleteShare,
    };
};
