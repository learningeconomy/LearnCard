/**
 * IndexedDB helper utilities shared across apps.
 */

import type { KeyDerivationStrategy } from '../auth-coordinator/types';

/** Fallback preserved keys when no strategy is provided */
const DEFAULT_PRESERVED = ['lcb-sss-keys'];

/**
 * Clear all IndexedDB databases except those the key derivation strategy
 * needs to preserve. If no strategy is provided, falls back to preserving
 * the default SSS device share database ('lcb-sss-keys').
 */
export const clearAllIndexedDB = async (strategy?: KeyDerivationStrategy): Promise<void> => {
    try {
        const preserved = new Set(strategy?.getPreservedStorageKeys() ?? DEFAULT_PRESERVED);

        const databases = await window.indexedDB.databases();

        databases.forEach(db => {
            const dbName = db.name;

            if (!dbName) return;

            if (preserved.has(dbName)) return;

            const request = window.indexedDB.deleteDatabase(dbName);

            request.onsuccess = () => console.log(`Deleted database: ${dbName}`);
            request.onerror = (e) => console.log(`Couldn't delete: ${dbName}`, e);
        });
    } catch (e) {
        console.error('Error clearing IndexedDB:', e);
    }
};
