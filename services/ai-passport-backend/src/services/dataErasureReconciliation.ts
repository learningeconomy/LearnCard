import { logSafeEvent } from '../logging';
import cache from '../utils/cache';
import { PRIVACY_MAINTENANCE_KEY, readPendingDataErasurePage } from './dataErasure';
import { dataLifecycleService } from './dataLifecycle';

type ErasureCleanupOutcome = {
    status: 'complete' | 'incomplete';
    retryable?: boolean;
};

// Only the encrypted pending-owner outbox is paged, never the global keyspace.
// Cleanup is idempotent across API/worker replicas; remote unknown outcomes stay pending.
export const reconcileDataErasures = async (
    deleteData: (did: string) => Promise<ErasureCleanupOutcome> = dataLifecycleService.deleteData
): Promise<void> => {
    if (!cache.redis) throw new Error('Persistent Redis is required for erasure reconciliation');
    let cursor = '0';
    do {
        if (await cache.redis.exists(PRIVACY_MAINTENANCE_KEY)) return;
        const page = await readPendingDataErasurePage(cursor);
        cursor = page.nextCursor;
        if (page.unreadable)
            logSafeEvent('error', 'data_erasure_reconciliation_failed', {
                count: page.unreadable,
            });
        for (const did of page.owners) {
            if (await cache.redis.exists(PRIVACY_MAINTENANCE_KEY)) return;
            try {
                const result = await deleteData(did);
                if (result.status === 'complete')
                    logSafeEvent('info', 'data_erasure_completed', { count: 1 });
                else if (!result.retryable)
                    logSafeEvent('warn', 'data_erasure_needs_attention', { count: 1 });
            } catch {
                logSafeEvent('error', 'data_erasure_reconciliation_failed', {
                    count: 1,
                });
            }
        }
    } while (cursor !== '0');
};

let stopReconciliation: (() => void) | undefined;
export const startDataErasureReconciliation = (): (() => void) => {
    if (stopReconciliation) return stopReconciliation;
    let stopped = false;
    let timer: NodeJS.Timeout | undefined;
    const sweep = async (): Promise<void> => {
        try {
            await reconcileDataErasures();
        } catch {
            logSafeEvent('error', 'data_erasure_reconciliation_failed');
        } finally {
            if (!stopped) {
                timer = setTimeout(() => void sweep(), 30_000);
                timer.unref();
            }
        }
    };
    stopReconciliation = () => {
        stopped = true;
        clearTimeout(timer);
        stopReconciliation = undefined;
    };
    void sweep();
    return stopReconciliation;
};
