import { getLogger } from '../logging/logger';
const log = getLogger('indexed-dbhelpers');
let cleanupAttempt = 0;
/**
 * IndexedDB helper utilities shared across apps.
 */

import type { KeyDerivationStrategy } from '../auth-coordinator/types';

/** Fallback preserved keys when no strategy is provided */
const DEFAULT_PRESERVED = ['lcb-sss-keys'];

// Firebase caches open connections to these databases across sign-outs. Deleting
// them can block other tabs' auth initialization, request headers, or analytics.
// Firebase signOut() removes the persisted user before this cleanup runs, and
// the sign-in adapter verifies that removal with a bounded read-only check. Keep
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
    const cleanupAttemptId = ++cleanupAttempt;
    const startedAt = performance.now();
    const elapsedMs = (): number => Math.round(performance.now() - startedAt);
    log.info('IndexedDB logout cleanup started', { cleanupAttemptId });
    try {
        const [
            { stopCredentialFactsLoaders },
            { disposeCredentialFacts },
            { resetInAppMessageEventSession },
            { clearInAppMessageRequest },
        ] = await Promise.all([
            import('../in-app-messages/credentialFactsLoader'),
            import('../in-app-messages/credentialFactsStore'),
            import('../in-app-messages/inAppMessageEvents'),
            import('../in-app-messages/deepLinkRequestStore'),
        ]);
        stopCredentialFactsLoaders();
        resetInAppMessageEventSession();
        clearInAppMessageRequest();
        await disposeCredentialFacts();
    } catch {
        // A failed dynamic import must not prevent the general logout database sweep.
    }
    try {
        const preserved = new Set([
            ...ALWAYS_PRESERVED,
            ...(strategy?.getPreservedStorageKeys() ?? DEFAULT_PRESERVED),
        ]);

        const databases = await window.indexedDB.databases();
        const databaseNames = new Set(databases.flatMap(db => (db.name ? [db.name] : [])));
        const deletions = [...databaseNames].filter(name => !preserved.has(name));
        const firebaseKinds = [
            ['firebaseLocalStorageDb', 'auth'],
            ['firebase-heartbeat-database', 'heartbeat'],
            ['firebase-installations-database', 'installations'],
        ] as const;
        const preservedFirebaseDatabases = firebaseKinds
            .filter(([name]) => databaseNames.has(name))
            .map(([, kind]) => kind);
        const summary = {
            cleanupAttemptId,
            databaseCount: databaseNames.size,
            preservedCount: [...databaseNames].filter(name => preserved.has(name)).length,
            preservedFirebaseDatabases,
            deletionCount: deletions.length,
        };
        let pendingDeletions = deletions.length;
        let failedDeletions = 0;
        const reportFinished = (): void => {
            if (pendingDeletions === 0) {
                log.info('IndexedDB logout cleanup finished', {
                    ...summary,
                    pendingDeletions,
                    failedDeletions,
                    elapsedMs: elapsedMs(),
                });
            }
        };
        log.info('IndexedDB logout cleanup scheduled', { ...summary, elapsedMs: elapsedMs() });
        if (deletions.length === 0) reportFinished();

        deletions.forEach((dbName, index) => {
            const context = {
                cleanupAttemptId,
                deletionId: index + 1,
                databaseKind: dbName.startsWith('firebase') ? 'firebase_other' : 'app',
            };
            const request = window.indexedDB.deleteDatabase(dbName);
            let settled = false;
            const settle = (failed: boolean): void => {
                settled = true;
                pendingDeletions--;
                if (failed) failedDeletions++;
                reportFinished();
            };

            request.onsuccess = () => {
                if (settled) return;
                log.info('IndexedDB logout deletion completed', {
                    ...context,
                    elapsedMs: elapsedMs(),
                });
                settle(false);
            };
            request.onerror = () => {
                if (settled) return;
                log.warn('IndexedDB logout deletion failed', {
                    ...context,
                    errorType: request.error?.name ?? 'unknown',
                    elapsedMs: elapsedMs(),
                });
                settle(true);
            };
            // Blocked is temporary: deletion can finish after other tabs close.
            request.onblocked = () => {
                if (settled) return;
                log.warn('IndexedDB logout cleanup blocked by an open connection', {
                    ...context,
                    elapsedMs: elapsedMs(),
                });
            };
        });
    } catch (e) {
        log.error('IndexedDB logout cleanup failed', {
            cleanupAttemptId,
            errorType: e instanceof Error ? 'error' : typeof e,
            elapsedMs: elapsedMs(),
        });
    }
};
