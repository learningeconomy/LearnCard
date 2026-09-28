/**
 * Retryable lazy initialization for the owner share-link runtime.
 *
 * Successful and in-flight builds are shared across concurrent callers. A
 * *failed* build must never be cached: a transient constraint/graph/signer
 * failure would otherwise poison the owner API until the process restarts
 * (the same defect previously corrected for the C7 setup cache). Only the
 * failed attempt is cleared, so a later request retries while any other
 * in-flight attempt keeps its own shared promise.
 */
export const createRetryableLazyInitializer = <T>(build: () => Promise<T>): (() => Promise<T>) => {
    let cached: Promise<T> | null = null;

    return () => {
        if (cached) return cached;

        const attempt = build();
        cached = attempt;

        // Preserve the rejection for the awaiting caller, but detach it from the
        // cache so the next call rebuilds. `catch` also prevents an unhandled
        // rejection when nobody is awaiting this particular attempt.
        attempt.catch(() => {
            if (cached === attempt) cached = null;
        });

        return attempt;
    };
};
