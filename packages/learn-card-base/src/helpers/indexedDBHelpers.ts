import { getLogger } from '../logging/logger';
const log = getLogger('indexed-dbhelpers');
/**
 * IndexedDB helper utilities shared across apps.
 */

import type { KeyDerivationStrategy } from '../auth-coordinator/types';

/** Fallback preserved keys when no strategy is provided */
const DEFAULT_PRESERVED = ['lcb-sss-keys'];

// Firebase keeps this telemetry database open across sign-outs. Deleting it can
// block new tabs' heartbeat reads and prevent auth requests from reaching fetch.
// It contains SDK telemetry, not the signed-in user's session.
const ALWAYS_PRESERVED = ['firebase-heartbeat-database'];

/**
 * Clear IndexedDB databases except Firebase heartbeat telemetry and those the
 * key derivation strategy needs to preserve. If no strategy is provided, preserves
 * the default SSS device share database ('lcb-sss-keys').
 */
export const clearAllIndexedDB = async (strategy?: KeyDerivationStrategy): Promise<void> => {
    try {
        const preserved = new Set([
            ...ALWAYS_PRESERVED,
            ...(strategy?.getPreservedStorageKeys() ?? DEFAULT_PRESERVED),
        ]);

        const databases = await window.indexedDB.databases();

        databases.forEach(db => {
            const dbName = db.name;

            if (!dbName) return;

            if (preserved.has(dbName)) return;

            const request = window.indexedDB.deleteDatabase(dbName);

            request.onsuccess = () => log.debug(`Deleted database: ${dbName}`);
            request.onerror = e => log.debug(`Couldn't delete: ${dbName}`, e);
            request.onblocked = () =>
                log.warn('IndexedDB logout cleanup blocked by an open connection', {
                    isFirebaseDatabase: dbName.startsWith('firebase'),
                });
        });
    } catch (e) {
        log.error('Error clearing IndexedDB:', e);
    }
};
