export const SOURCE_CLEANUP_BUSY_MESSAGE = 'Source cleanup busy; retry';
export const SOURCE_CLEANUP_LEASE_EXPIRED_MESSAGE = 'Source cleanup lease expired';
export const SOURCE_CLEANUP_PENDING_MESSAGE =
    'Source vector cleanup pending; bounded recovery required';
export const SOURCE_CLEANUP_PENDING_INGEST_MESSAGE =
    'Source cleanup pending; retry ingestion or bounded admin recovery';
export const SOURCE_CLEANUP_SCOPE_CHANGED_MESSAGE = 'Cleanup scope changed; retry';

const LEASE_CONTENTION_MESSAGES = new Set([
    SOURCE_CLEANUP_BUSY_MESSAGE,
    SOURCE_CLEANUP_LEASE_EXPIRED_MESSAGE,
]);

const RETRYABLE_MESSAGES = new Set([
    ...LEASE_CONTENTION_MESSAGES,
    SOURCE_CLEANUP_PENDING_MESSAGE,
    SOURCE_CLEANUP_PENDING_INGEST_MESSAGE,
    SOURCE_CLEANUP_SCOPE_CHANGED_MESSAGE,
]);

export const isSourceCleanupLeaseBusyError = (error: unknown): boolean =>
    error instanceof Error && LEASE_CONTENTION_MESSAGES.has(error.message);

export const isRetryableSourceCleanupError = (error: unknown): boolean =>
    error instanceof Error && RETRYABLE_MESSAGES.has(error.message);

const parseMs = (value: string | undefined, fallback: number, allowZero: boolean): number => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return fallback;
    if (allowZero ? parsed < 0 : parsed <= 0) return fallback;
    return parsed;
};

// How long a waiter retries before treating the per-owner Mongo lease as busy.
export const sourceCleanupLeaseWaitMs = (): number =>
    parseMs(process.env.SOURCE_CLEANUP_LEASE_WAIT_MS, 1_000, true);

export const sourceCleanupLeaseRetryDelayMs = (): number =>
    parseMs(process.env.SOURCE_CLEANUP_LEASE_RETRY_MS, 50, false);

export const waitForSourceCleanupLeaseRetry = (ms: number): Promise<void> =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });
