/**
 * Pure Neo4j transaction execution helpers.
 *
 * These live outside `transaction.ts` so they can be unit-tested without loading
 * `@instance` (which requires real Neo4j environment variables at import time).
 *
 * The driver's managed `executeWrite` retries transient failures inline using
 * driver-level configuration. That is correct for ordinary request callers, but a
 * cooperative maintenance pass instead wants one bounded attempt: if it cannot
 * commit now it leaves the durable work fenced and lets the next cadence retry.
 * `executeExplicitTransaction` provides exactly that explicit, no-inline-retry
 * attempt.
 */

/** Minimal structural transaction surface shared by managed and explicit paths. */
export type ExecutableTransaction = {
    run: (query: string, params?: Record<string, unknown>) => Promise<unknown>;
};

export type ExplicitTransaction = ExecutableTransaction & {
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
};

/** The subset of the neo4j-driver session API this module depends on. */
export type TransactionSession = {
    beginTransaction: (config?: { timeout?: number }) => ExplicitTransaction;
};

export type TransactionTimeoutConfig = { timeout: number } | undefined;

export const resolveTransactionConfig = (
    timeoutMs: number | undefined
): TransactionTimeoutConfig =>
    typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
        ? { timeout: Math.trunc(timeoutMs) }
        : undefined;

/**
 * Run one explicit transaction attempt with a bounded server-side timeout.
 *
 * There is deliberately no retry: a transient failure propagates to the caller,
 * which records a bounded category and leaves the durable claim/job for the next
 * cadence. The callback must only perform graph-local work — no network I/O — so
 * a rollback can never strand a remote mutation.
 */
export const executeExplicitTransaction = async <T>(
    session: TransactionSession,
    work: (tx: ExecutableTransaction) => Promise<T>,
    timeoutMs?: number
): Promise<T> => {
    const transaction = session.beginTransaction(resolveTransactionConfig(timeoutMs));

    let result: T;

    try {
        result = await work(transaction);
    } catch (error) {
        try {
            await transaction.rollback();
        } catch {
            // The transaction may already be terminated (e.g. timeout). The
            // original failure is authoritative.
        }

        throw error;
    }

    await transaction.commit();

    return result;
};
