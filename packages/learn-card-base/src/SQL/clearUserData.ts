import { withSQLiteDatabase } from './connection';
import { getLogger } from '../logging/logger';
const log = getLogger('clear-user-data');
/**
 * Logout cleanup for SQLite — clears user data while preserving
 * the SSS device share so returning users can reconstruct their
 * key without the recovery flow.
 *
 * Extracted into its own module so it can be unit-tested without
 * pulling in React / Capacitor / SQLite hook dependencies.
 */

import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

/**
 * Tables that must NEVER be deleted during logout cleanup.
 * The device share must survive logout so returning users can
 * reconstruct their key without the recovery flow.
 */
export const PRESERVED_TABLES = new Set(['sss_shares', 'sqlite_sequence']);

/**
 * Clear all user-specific data from the SQLite database while
 * preserving security-critical tables (device shares).
 *
 * The hook's `clearDB` delegates here.
 */
export const clearUserData = async (db: SQLiteDBConnection): Promise<void> => {
    try {
        return await withSQLiteDatabase(db, async () => {
            // Web creates tables lazily. Enumerate only existing tables so absent
            // users/tokens tables cannot prevent clearing credentials or caches.
            try {
                const preservedList = [...PRESERVED_TABLES].map(t => `'${t}'`).join(', ');

                const { values } = await db.query(
                    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN (${preservedList})`
                );

                for (const row of values ?? []) {
                    const table = row?.name;

                    if (table) {
                        // Table names are identifiers, not bindable values.
                        const identifier = `"${String(table).replace(/"/g, '""')}"`;
                        try {
                            await db.query(`DELETE FROM ${identifier}`);
                        } catch (tableErr) {
                            // One failed table must not skip the remaining data.
                            log.warn('clearUserData: table clear failed', tableErr);
                        }
                    }
                }
            } catch (tableErr) {
                log.warn('clearUserData: dynamic table clear failed', tableErr);
            }
        });
    } catch (e) {
        log.warn('😵 clearUserData', e);
    }
};
