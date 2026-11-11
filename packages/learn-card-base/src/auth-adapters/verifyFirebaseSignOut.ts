import type { Auth } from 'firebase/auth';
import { getLogger } from '../logging/logger';

const log = getLogger('firebase-sign-out-verification');
const CHECK_TIMEOUT_MS = 1_000;

/**
 * Check that SDK sign-out removed this app's IndexedDB user record without
 * reading credentials or deleting Firebase's shared database containers.
 * Diagnostic only: unavailable/blocked storage must never prevent logout.
 */
export const verifyFirebaseSignOut = async (auth: Auth): Promise<void> => {
    const apiKey = auth.app?.options.apiKey;
    const appName = auth.app?.name;
    if (!apiKey || !appName || typeof indexedDB === 'undefined') return;

    await new Promise<void>(resolve => {
        let database: IDBDatabase | undefined;
        let transaction: IDBTransaction | undefined;
        let finished = false;
        const finish = (
            outcome: 'cleared' | 'remaining' | 'unavailable' | 'timeout' | 'session_changed'
        ): void => {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            database?.close();
            if (outcome === 'remaining') {
                log.warn('Firebase persisted sign-in remains after sign-out', {
                    liveAuthUserPresent: Boolean(auth.currentUser),
                });
            } else if (outcome === 'cleared') {
                log.info('Firebase persisted sign-in cleared after sign-out');
            } else if (outcome === 'session_changed') {
                log.info('Firebase sign-out persistence check skipped for a new sign-in');
            } else {
                log.warn('Firebase sign-out persistence check incomplete', { outcome });
            }
            resolve();
        };
        const timeout = setTimeout(() => {
            finish('timeout');
            try {
                transaction?.abort();
            } catch {
                // The read transaction may already have completed.
            }
        }, CHECK_TIMEOUT_MS);

        try {
            const request = indexedDB.open('firebaseLocalStorageDb');
            // Opening an absent DB must not create a new SDK container/schema.
            request.onupgradeneeded = () => {
                request.transaction?.abort();
                finish('unavailable');
            };
            request.onerror = () => finish('unavailable');
            request.onsuccess = () => {
                database = request.result;
                // A blocked open can finish after our deadline. Always close it.
                if (finished) {
                    database.close();
                    return;
                }
                database.onversionchange = () => database?.close();
                try {
                    if (!database.objectStoreNames.contains('firebaseLocalStorage')) {
                        finish('unavailable');
                        return;
                    }
                    transaction = database.transaction('firebaseLocalStorage', 'readonly');
                    transaction.onabort = () => finish('unavailable');
                    transaction.onerror = () => finish('unavailable');
                    // Firebase keys persistence by API key + app name. count()
                    // checks only this app's record and never loads its value.
                    const count = transaction
                        .objectStore('firebaseLocalStorage')
                        .count(`firebase:authUser:${apiKey}:${appName}`);
                    count.onsuccess = () => {
                        // Another login may have begun since sign-out completed.
                        if (auth.currentUser) {
                            finish('session_changed');
                            return;
                        }
                        finish(count.result === 0 ? 'cleared' : 'remaining');
                    };
                    count.onerror = () => finish('unavailable');
                } catch {
                    finish('unavailable');
                }
            };
        } catch {
            finish('unavailable');
        }
    });
};
