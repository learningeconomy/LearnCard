import { dehydrate } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

interface QueryStorage {
    getItem: (key: string) => Promise<string | null | undefined>;
    setItem: (key: string, value: string) => Promise<unknown>;
    removeItem: (key: string) => Promise<unknown>;
}

const CACHE_KEY = 'REACT_QUERY_OFFLINE_CACHE';

/** Batch ordinary cache events, but let mutations await a durable, ordered snapshot. */
export const createQueryPersister = (
    storage: QueryStorage,
    onError: (error: unknown) => void
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
        const serialized = JSON.stringify(snapshot);
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
            return serialized ? JSON.parse(serialized) : undefined;
        },
        removeClient: () => {
            clearPending();
            return enqueue(() => storage.removeItem(CACHE_KEY));
        },
    };

    return {
        persister,
        persistNow: client => {
            pending = { buster: '', timestamp: Date.now(), clientState: dehydrate(client) };
            // Supersede the throttled snapshot and wait behind any older in-flight write.
            return flush();
        },
    };
};
