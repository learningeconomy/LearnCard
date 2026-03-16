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
        await db.open();

        // Clear well-known app-data tables.
        await db.query('DELETE FROM users');
        await db.query('DELETE FROM tokens');

        // Dynamically clear any other tables, but leave preserved ones intact.
        try {
            const preservedList = [...PRESERVED_TABLES].map(t => `'${t}'`).join(', ');

            const { values } = await db.query(
                `SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN (${preservedList})`
            );

            for (const row of values ?? []) {
                const table = row?.name;

                if (table) {
                    await db.query(`DELETE FROM ${table}`);
                }
            }
        } catch (tableErr) {
            console.warn('clearUserData: dynamic table clear failed', tableErr);
        }
    } catch (e) {
        console.warn('😵 clearUserData', e);
    } finally {
        if (db && (await db?.isDBOpen())?.result) {
            try {
                await db?.close();
            } catch (closeErr) {
                console.warn('😵 clearUserData close failed', closeErr);
            }
        }
    }
};
