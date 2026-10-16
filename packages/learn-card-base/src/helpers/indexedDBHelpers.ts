import { getLogger } from '../logging/logger';
const log = getLogger('indexed-dbhelpers');
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
        const [
            { stopCredentialFactsLoaders },
            { disposeCredentialFacts },
            { resetInAppMessageEventSession },
        ] = await Promise.all([
            import('../in-app-messages/credentialFactsLoader'),
            import('../in-app-messages/credentialFactsStore'),
            import('../in-app-messages/inAppMessageEvents'),
        ]);
        stopCredentialFactsLoaders();
        resetInAppMessageEventSession();
        await disposeCredentialFacts();
    } catch {
        // A failed dynamic import must not prevent the general logout database sweep.
    }
    try {
        const preserved = new Set(strategy?.getPreservedStorageKeys() ?? DEFAULT_PRESERVED);

        const databases = await window.indexedDB.databases();

        databases.forEach(db => {
            const dbName = db.name;

            if (!dbName) return;

            if (preserved.has(dbName)) return;

            const request = window.indexedDB.deleteDatabase(dbName);

            request.onsuccess = () => log.debug(`Deleted database: ${dbName}`);
            request.onerror = e => log.debug(`Couldn't delete: ${dbName}`, e);
        });
    } catch (e) {
        log.error('Error clearing IndexedDB:', e);
    }
};
