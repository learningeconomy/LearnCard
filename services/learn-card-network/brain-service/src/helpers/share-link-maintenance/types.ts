import type { ShareRecoveryRunSummary, CleanupRunSummary } from '../share-link-coordinator';

/**
 * LC-2187 share-link maintenance (scheduling + cleanup integration).
 *
 * This module owns the automatically configured, namespace-scoped maintenance pass. It
 * is deliberately separate from the coordinator barrel so unit tests never load
 * the Neo4j `@instance` or the LearnCard signing graph.
 */

/** A fully validated, enabled maintenance configuration. */
export type ShareLinkMaintenanceConfig = {
    namespace: string;
    origin: string;
    audience: string;
    allowInsecureLoopback: boolean;
    claimant: string;
    recoveryLimit: number;
    cleanupLimit: number;
    receiptPruneLimit: number;
    leaseMs: number;
    claimMs: number;
    budgetMs: number;
    intervalMs: number;
    requestTimeoutMs: number;
    finalizeReserveMs: number;
    graphTimeoutMs: number;
};

/**
 * Fixed, non-sensitive configuration outcome. `invalid` never carries the bad
 * value or an exception, so it is safe to log verbatim.
 */
export type ShareLinkMaintenanceConfigResolution =
    | { status: 'enabled'; config: ShareLinkMaintenanceConfig }
    | { status: 'disabled' }
    | { status: 'invalid'; category: 'share_link_maintenance_configuration_invalid' };

/** Fixed pass status. Never carries request/record data. */
export type ShareLinkMaintenanceStatus =
    | 'disabled'
    | 'invalid_configuration'
    | 'initialization_failed'
    | 'completed'
    | 'deadline_exhausted'
    | 'failed';

/** Fixed failure categories allowed in a maintenance summary/log. */
export type ShareLinkMaintenanceFailureCategory =
    | 'share_link_maintenance_pass_failed'
    | 'share_link_maintenance_recovery_failed'
    | 'share_link_maintenance_cleanup_failed'
    | 'share_link_maintenance_receipt_prune_failed'
    | 'share_link_maintenance_initialization_failed'
    | 'share_link_maintenance_configuration_invalid';

/**
 * Aggregate-only result of one maintenance invocation. It contains counts,
 * durations and fixed categories; it never contains object/share/owner ids,
 * URLs, keys, ciphertext, recovery, titles, notes or exception objects.
 */
export type ShareLinkMaintenanceRunSummary = {
    status: ShareLinkMaintenanceStatus;
    durationMs: number;
    budgetMs: number;
    recovery: ShareRecoveryRunSummary | null;
    cleanup: CleanupRunSummary | null;
    /** Namespace-scoped expired/consumed receipt nodes deleted this pass. */
    receiptPrune: { pruned: number } | null;
    categories: Partial<Record<ShareLinkMaintenanceFailureCategory, number>>;
};

/**
 * Allowlisted log event shape. The logger is called with this object only; a
 * throwing logger must never corrupt lifecycle state.
 */
export type ShareLinkMaintenanceLogEvent = {
    event: 'share_link_maintenance';
    status: ShareLinkMaintenanceStatus;
    durationMs: number;
    budgetMs: number;
    counts: Record<string, number>;
    categories: Record<string, number>;
};

export type ShareLinkMaintenanceLogger = {
    info: (event: ShareLinkMaintenanceLogEvent) => void;
    error: (event: ShareLinkMaintenanceLogEvent) => void;
};
