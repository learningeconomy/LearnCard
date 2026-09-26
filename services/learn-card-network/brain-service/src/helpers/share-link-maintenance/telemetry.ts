import type { CleanupRunSummary, ShareRecoveryRunSummary } from '../share-link-coordinator';
import type {
    ShareLinkMaintenanceLogEvent,
    ShareLinkMaintenanceLogger,
    ShareLinkMaintenanceRunSummary,
} from './types';

/**
 * Fixed, allowlisted aggregate counters. This is the ONLY surface a maintenance
 * log may contain: no object ref, share id, owner id, namespace value, title,
 * note, URL, fragment, key, ciphertext, recovery blob or exception object.
 */
const recoveryCounts = (recovery: ShareRecoveryRunSummary | null): Record<string, number> => ({
    recoveryDiscovered: recovery?.discovered ?? 0,
    recoveryClaimed: recovery?.claimed ?? 0,
    recoveryFinalized: recovery?.finalized ?? 0,
    recoveryAbandoned: recovery?.abandoned ?? 0,
    recoveryDeferred: recovery?.deferred ?? 0,
    recoveryClaimLost: recovery?.claimLost ?? 0,
    recoveryAnomalies: recovery?.anomalies ?? 0,
});

const cleanupCounts = (cleanup: CleanupRunSummary | null): Record<string, number> => ({
    cleanupClaimed: cleanup?.claimed ?? 0,
    cleanupCompleted: cleanup?.completed ?? 0,
    cleanupRetried: cleanup?.retried ?? 0,
    cleanupClaimLost: cleanup?.claimLost ?? 0,
    cleanupSkipped: cleanup?.skipped ?? 0,
});

export const toMaintenanceLogEvent = (
    summary: ShareLinkMaintenanceRunSummary
): ShareLinkMaintenanceLogEvent => ({
    event: 'share_link_maintenance',
    status: summary.status,
    durationMs: Math.max(0, Math.trunc(summary.durationMs)),
    budgetMs: Math.max(0, Math.trunc(summary.budgetMs)),
    counts: {
        ...recoveryCounts(summary.recovery),
        ...cleanupCounts(summary.cleanup),
        receiptsPruned: summary.receiptPrune?.pruned ?? 0,
    },
    categories: {
        ...(summary.recovery?.categories ?? {}),
        ...(summary.cleanup?.categories ?? {}),
        ...summary.categories,
    },
});

/**
 * Emit one allowlisted event. A throwing logger is swallowed: telemetry must
 * never corrupt lifecycle state or turn a completed pass into a failure.
 */
export const safeLogMaintenance = (
    logger: ShareLinkMaintenanceLogger,
    summary: ShareLinkMaintenanceRunSummary
): void => {
    try {
        const event = toMaintenanceLogEvent(summary);
        if (summary.status === 'failed') logger.error(event);
        else logger.info(event);
    } catch {
        // Intentionally ignored: lifecycle state is authoritative.
    }
};

export const createConsoleMaintenanceLogger = (): ShareLinkMaintenanceLogger => ({
    info: event => console.log('[share-link-maintenance]', event),
    error: event => console.error('[share-link-maintenance]', event),
});
