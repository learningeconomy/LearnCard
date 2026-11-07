import { dehydrate } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

interface QueryStorage {
    getItem: (key: string) => Promise<string | null | undefined>;
    setItem: (key: string, value: string) => Promise<unknown>;
    removeItem: (key: string) => Promise<unknown>;
}

const CACHE_KEY = 'REACT_QUERY_OFFLINE_CACHE';

/**
 * A missing own profile is a live-session result, not durable identity state.
 * Profile creation can finish just before a reload drops the next batched save;
 * restoring the older null would suppress a fresh lookup for its five-minute
 * staleTime. Keep real profiles for offline use, but resolve absence again.
 * JSON turns the optional profileId in the query key from undefined into null.
 */
const withoutMissingOwnProfiles = (snapshot: PersistedClient): PersistedClient => ({
    ...snapshot,
    clientState: {
        ...snapshot.clientState,
        queries: snapshot.clientState.queries.filter(
            query =>
                !(
                    query.queryKey[0] === 'getProfile' &&
                    query.queryKey[2] == null &&
                    query.state.data == null
                )
        ),
    },
});

/** Batch ordinary cache events, but let mutations await a durable, ordered snapshot. */
export const createQueryPersister = (
    storage: QueryStorage,
    onError: (error: unknown) => void,
    // Must match PersistQueryClientProvider's buster, or restore discards explicit saves.
    buster = ''
): { persister: Persister; persistNow: (client: QueryClient) => Promise<void> } => {
    let pending: PersistedClient | undefined;
    let timer: number | undefined;
    let writes = Promise.resolve();

    const enqueue = (operation: () => Promise<unknown>): Promise<void> => {
        const write = writes.then(async () => {
            await operation();
        });
        // A failed background write must not prevent a later explicit save from retrying.
        writes = write.catch(() => undefined);
        return write;
    };

    const clearPending = () => {
        window.clearTimeout(timer);
        timer = undefined;
        pending = undefined;
    };

    const flush = async (): Promise<void> => {
        const snapshot = pending;
        clearPending();
        if (!snapshot) return writes;
        const serialized = JSON.stringify(withoutMissingOwnProfiles(snapshot));
        return enqueue(() => storage.setItem(CACHE_KEY, serialized));
    };

    const persister: Persister = {
        persistClient: snapshot => {
            pending = snapshot;
            if (timer === undefined) {
                timer = window.setTimeout(() => {
                    void flush().catch(onError);
                }, 1000);
            }
        },
        restoreClient: async () => {
            await writes;
            const serialized = await storage.getItem(CACHE_KEY);
            // Also repair snapshots written by earlier app versions.
            return serialized ? withoutMissingOwnProfiles(JSON.parse(serialized)) : undefined;
        },
        removeClient: () => {
            clearPending();
            return enqueue(() => storage.removeItem(CACHE_KEY));
        },
    };

    return {
        persister,
        persistNow: client => {
            pending = { buster, timestamp: Date.now(), clientState: dehydrate(client) };
            // Supersede the throttled snapshot and wait behind any older in-flight write.
            return flush();
        },
    };
};
