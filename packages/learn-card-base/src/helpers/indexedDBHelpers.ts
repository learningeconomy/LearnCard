import { getLogger } from '../logging/logger';
const log = getLogger('indexed-dbhelpers');
/**
 * IndexedDB helper utilities shared across apps.
 */

import type { KeyDerivationStrategy } from '../auth-coordinator/types';

/** Fallback preserved keys when no strategy is provided */
const DEFAULT_PRESERVED = ['lcb-sss-keys'];

// Firebase caches open connections to these databases across sign-outs. Deleting
// them can block other tabs' auth initialization, request headers, or analytics.
// Firebase signOut() removes the persisted user before this cleanup runs; preserve
// its database infrastructure, not the authenticated session. Installations keeps
// its SDK installation identity independently of the signed-in user.
const ALWAYS_PRESERVED = [
    'firebase-heartbeat-database',
    'firebaseLocalStorageDb',
    'firebase-installations-database',
];

/**
 * Clear app databases after provider sign-out, preserving Firebase-managed
 * database connections and the key derivation strategy's recovery storage.
 * Without a strategy, preserves the default device share database ('lcb-sss-keys').
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
            // Blocked is temporary: deletion can finish after other tabs close.
            request.onblocked = () =>
                log.warn('IndexedDB logout cleanup blocked by an open connection', {
                    isFirebaseDatabase: dbName.startsWith('firebase'),
                });
        });
    } catch (e) {
        log.error('Error clearing IndexedDB:', e);
    }
};
