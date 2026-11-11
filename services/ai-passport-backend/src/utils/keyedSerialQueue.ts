import { AsyncLocalStorage } from 'node:async_hooks';

/** Process-local scheduling only; callers retain their transactional fences. */
export const createKeyedSerialQueue = () => {
    const tails = new Map<string, Promise<void>>();
    const admissions = new AsyncLocalStorage<Set<string>>();
    return async <T>(
        key: string,
        operation: () => Promise<T>,
        signal?: AbortSignal
    ): Promise<T> => {
        signal?.throwIfAborted();
        const parent = admissions.getStore();
        if (parent?.has(key))
            throw new Error('Nested queue admission requires an existing transaction');
        const previous = tails.get(key) ?? Promise.resolve();
        const current = previous.then(async () => {
            signal?.throwIfAborted();
            return admissions.run(new Set([...(parent ?? []), key]), operation);
        });
        // A rejected or cancelled member must not poison or release later members.
        const tail = current.then(
            () => undefined,
            () => undefined
        );
        tails.set(key, tail);
        void tail.then(() => {
            if (tails.get(key) === tail) tails.delete(key);
        });
        if (!signal) return current;
        let onAbort: () => void;
        const aborted = new Promise<never>((_, reject) => {
            onAbort = () => reject(signal.reason);
            signal.addEventListener('abort', onAbort, { once: true });
            if (signal.aborted) onAbort();
        });
        try {
            return await Promise.race([current, aborted]);
        } finally {
            signal.removeEventListener('abort', onAbort!);
        }
    };
};
