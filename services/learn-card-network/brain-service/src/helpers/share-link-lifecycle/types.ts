/**
 * LC-2187 share-link lifecycle constants and literals.
 *
 * This module is intentionally storage- and transport-agnostic: routes, the
 * LearnCloud client and the reconciliation worker all derive their bounds from
 * here so the Brain repository and the tests agree on one set of numbers.
 */

/** Operation kinds that are bound to an idempotency record. */
export type ShareLinkOperationKind = 'create' | 'update' | 'revoke';

export const SHARE_LINK_OPERATION_KINDS: readonly ShareLinkOperationKind[] = [
    'create',
    'update',
    'revoke',
];

/**
 * Default bounded lease for one in-flight share content operation. A worker that
 * cannot finish staging + finalize within the lease loses its fence and must not
 * commit; a later reservation supersedes it with a higher generation.
 */
export const SHARE_LINK_DEFAULT_LEASE_MS = 2 * 60 * 1000;

/**
 * Retain completed operation records for 30 days.
 *
 * Pruning is an explicit operator action, not an automatic replay path. After a
 * record is pruned, object-reference uniqueness, the share version compare-and-set
 * and the `stopped` terminal state still prevent a replay from overwriting newer
 * content.
 */
export const SHARE_LINK_OPERATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Cleanup retry backoff bounds (exponential, capped). */
export const SHARE_LINK_CLEANUP_BASE_BACKOFF_MS = 30 * 1000;
export const SHARE_LINK_CLEANUP_MAX_BACKOFF_MS = 24 * 60 * 60 * 1000;

/** Default cap on cleanup jobs claimed in one bounded batch. */
export const SHARE_LINK_CLEANUP_DEFAULT_BATCH = 25;
export const SHARE_LINK_CLEANUP_MAX_BATCH = 100;

/** Default lease for a claimed cleanup job. */
export const SHARE_LINK_CLEANUP_DEFAULT_CLAIM_MS = 5 * 60 * 1000;

/**
 * Hard bounds for a caller-supplied cleanup claim lease. A configured
 * maintenance lease is clamped into this window so a bad deployment cannot hold
 * (or instantly drop) work; the repository default is unchanged.
 */
export const SHARE_LINK_CLEANUP_MIN_CLAIM_MS = 1_000;
export const SHARE_LINK_CLEANUP_MAX_CLAIM_MS = 30 * 60 * 1000;

/** Reasons a durable cleanup job can be created. */
export type ShareContentCleanupReason = 'superseded' | 'abandoned' | 'stopped';

/** Lifecycle status of a durable cleanup job. */
export type ShareContentCleanupStatus = 'queued' | 'claimed' | 'completed';
