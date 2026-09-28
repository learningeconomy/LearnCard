import type {
    ShareContentCleanupReason,
    ShareContentCleanupStatus,
    ShareLinkOperationKind,
} from '@helpers/share-link-lifecycle';
import type { ShareLinkPolicySnapshot } from '@helpers/share-link-policy';

import type { ShareContentState, ShareLinkRecord, ShareLinkStatus } from '../../models/ShareLink';
import type { ShareLinkTransactionOptions } from './transaction';

/** Namespace + owner + share id binding used by every lifecycle operation. */
export type ShareLinkKey = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
};

export type ShareLinkOperationStatus = 'in_progress' | 'committed' | 'abandoned';

/**
 * Idempotency record for one owner request.
 *
 * The key is `(namespace, ownerProfileId, opKind, clientRequestId)` and is enforced
 * by a composite unique constraint. `requestHash` is the canonical hash of the full
 * validated request (including encrypted recovery, excluding the request id); a
 * retry with the same key and hash returns the recorded result, any other payload
 * under the same key is a conflict.
 */
export type ShareLinkOperationRecord = {
    namespace: string;
    ownerProfileId: string;
    opKind: ShareLinkOperationKind;
    clientRequestId: string;
    operationId: string;
    shareId: string;
    requestHash: string;
    status: ShareLinkOperationStatus;
    resultJson: string | null;
    resultVersion: number | null;
    createdAt: string;
    updatedAt: string;
    /**
     * Recommended prune instant (createdAt + 30 days). Pruning is explicit; no
     * worker auto-deletes records or replays them.
     */
    pruneAfter: string;
};

/**
 * One in-flight content/metadata operation for a share.
 *
 * There is at most one per share (unique `shareId`). The reservation carries the
 * intended metadata, the opaque immutable object reference, content/recovery
 * hashes and byte counts, the expected base versions and a fenced generation with
 * a bounded lease so a restart can either resume or supersede it.
 */
export type ShareLinkReservationRecord = {
    shareId: string;
    namespace: string;
    ownerProfileId: string;
    opKind: ShareLinkOperationKind;
    clientRequestId: string;
    requestHash: string;
    operationId: string;
    /** Opaque immutable LearnCloud object id; `null` for a metadata-only revision. */
    objectRef: string | null;
    /** Intended visible content version; `null` for a metadata-only revision. */
    contentVersion: number | null;
    baseVersion: number;
    baseContentVersion: number;
    contentHash: string | null;
    contentBytes: number | null;
    recoveryHash: string | null;
    recoveryBytes: number | null;
    title: string;
    note: string | null;
    expiresAt: string | null;
    selectedCount: number;
    /**
     * Coherent policy snapshot derived server-side at reservation time and
     * applied to the share at finalize under the same lock. Re-derived on every
     * mutation so a stale adult snapshot cannot keep counting views.
     */
    policy: ShareLinkPolicySnapshot;
    /** Fence that must still equal `ShareLink.generation` at finalize. */
    generation: number;
    leaseOwner: string;
    leaseExpiresAt: string;
    createdAt: string;
    updatedAt: string;
};

export type ShareContentCleanupJobRecord = {
    objectRef: string;
    operationId: string;
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    reason: ShareContentCleanupReason;
    status: ShareContentCleanupStatus;
    attempts: number;
    nextAttemptAt: string;
    claimToken: string | null;
    claimedBy: string | null;
    claimExpiresAt: string | null;
    lastError: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
};

/** Opaque content/recovery binding for a staged revision. Never ciphertext. */
export type ShareContentBinding = {
    /** LearnCloud payloadHash over envelope + ownerEncryptedRecovery, excluding allocated IDs. */
    contentHash: string;
    contentBytes: number;
    recoveryHash: string;
    recoveryBytes: number;
};

export type ReserveCreateInput = {
    namespace: string;
    ownerProfileId: string;
    clientRequestId: string;
    shareId: string;
    title: string;
    note?: string | null;
    expiresAt?: string | null;
    selectedCount: number;
    content: ShareContentBinding;
    /** Canonical hash of the full validated create request. */
    requestHash: string;
    /** Server-derived policy snapshot; conservative default when omitted. */
    policy?: ShareLinkPolicySnapshot;
    leaseOwner: string;
    leaseMs?: number;
    now?: Date;
};

export type ReserveReplacementContent = ShareContentBinding & {
    /** Must equal the current visible content version + 1. */
    contentVersion: number;
    selectedCount: number;
};

export type ReserveReplacementInput = {
    namespace: string;
    ownerProfileId: string;
    clientRequestId: string;
    shareId: string;
    expectedVersion: number;
    requestHash: string;
    leaseOwner: string;
    leaseMs?: number;
    now?: Date;
    /**
     * When present, stages a content replacement; when absent, the reservation is a
     * metadata-only revision (for example an expiry extension) that leaves the
     * visible object reference untouched.
     */
    content?: ReserveReplacementContent;
    title?: string;
    note?: string | null;
    expiresAt?: string | null;
    /**
     * Re-derived policy on every mutation so a profile that becomes managed (or
     * whose age source changes) stops accumulating views going forward.
     */
    policy?: ShareLinkPolicySnapshot;
};

export type ReserveShareLinkResult =
    | {
          outcome: 'reserved';
          /** `created` for a new reservation, `resumed` for an in-flight retry. */
          state: 'created' | 'resumed';
          share: ShareLinkRecord;
          reservation: ShareLinkReservationRecord;
      }
    | {
          outcome: 'already_committed';
          /** The recorded result for this request id; may be older than `current`. */
          recorded: ShareLinkRecord;
          /** The current committed share, which a caller must not roll back. */
          current: ShareLinkRecord;
      };

export type FinalizeReservationInput = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    operationId: string;
    objectRef: string | null;
    generation: number;
    leaseOwner: string;
    /**
     * PRECONDITION: the external coordinator must already have verified that the
     * immutable object for `objectRef` exists in LearnCloud and that its stored
     * content hash matches. When supplied here it is re-checked against the
     * reservation as defense in depth; this repository never performs network I/O.
     */
    verifiedContentHash?: string;
    now?: Date;
    /** Maintenance-only: bounded transaction timeout for this unit. */
    transactionTimeoutMs?: number;
    /** Maintenance-only: single explicit attempt with no inline retry. */
    noInlineRetry?: boolean;
};

export type FinalizeReservationResult =
    | { outcome: 'finalized'; share: ShareLinkRecord; cleanupQueuedFor: string | null }
    | { outcome: 'already_finalized'; share: ShareLinkRecord };

export type AbandonReservationInput = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    operationId: string;
    /** When supplied, only the matching reservation generation is abandoned. */
    generation?: number;
    /** When supplied, only the matching lease holder may abandon. */
    leaseOwner?: string;
    reason?: string;
    now?: Date;
};

export type AbandonReservationResult =
    | { outcome: 'abandoned'; cleanupQueuedFor: string | null }
    | { outcome: 'already_absent' }
    | { outcome: 'already_finalized'; share: ShareLinkRecord };

export type RevokeShareLinkInput = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    /** Optional optimistic check; ignored when the share is already stopped. */
    expectedVersion?: number;
    clientRequestId?: string;
    requestHash?: string;
    now?: Date;
};

export type RevokeShareLinkResult = {
    outcome: 'revoked' | 'already_stopped';
    share: ShareLinkRecord;
    /** Immutable object refs queued for tracked cleanup by this call. */
    cleanupQueuedFor: string[];
};

export type GetShareLinkInput = {
    shareId: string;
    namespace?: string;
    ownerProfileId?: string;
};

/**
 * Decoded keyset cursor for the owner list. Exactly the two immutable ordering
 * fields (`createdAt`, `id`); never a raw database node or a query clause.
 */
export type ShareLinkListCursor = {
    createdAt: string;
    id: string;
};

/**
 * Trusted, caller-independent owner-list query. Both `namespace` and
 * `ownerProfileId` are required and always originate from server config and the
 * authenticated profile. `cursor` is already decoded/validated.
 */
export type ListShareLinksInput = {
    namespace: string;
    ownerProfileId: string;
    limit: number;
    cursor?: ShareLinkListCursor | null;
};

export type ListShareLinksResult = {
    records: ShareLinkRecord[];
    /** Opaque next cursor; `null` on the last page. */
    nextCursor: string | null;
    hasMore: boolean;
};

export type GetCurrentShareContentInput = {
    shareId: string;
    namespace?: string;
    ownerProfileId?: string;
    now?: Date;
    /**
     * Owner-recovery only. When true, retained expired content is reported
     * `active` so the owner can extend/edit it. The public read path must never
     * set this; it defaults to false and the public active-content guard is
     * unchanged.
     */
    allowExpired?: boolean;
};

export type CurrentShareContentResult =
    | {
          state: 'active';
          shareId: string;
          namespace: string;
          ownerProfileId: string;
          version: number;
          contentVersion: number;
          objectRef: string;
          operationId: string;
          contentHash: string | null;
          contentBytes: number | null;
          recoveryHash: string | null;
          selectedCount: number;
          expiresAt: string | null;
          updatedAt: string;
      }
    | {
          state: 'not_active';
          shareId: string;
          namespace: string;
          ownerProfileId: string;
          status: ShareLinkStatus;
          contentState: ShareContentState;
          reason: 'stopped' | 'expired' | 'staging' | 'content_missing';
      }
    | { state: 'missing' };

export type ClaimCleanupJobsInput = {
    /**
     * Required explicit namespace. Scheduled maintenance signs for exactly one
     * namespace, so it must never discover and claim another namespace's jobs and
     * rely on the remote client to reject them.
     */
    namespace: string;
    claimant: string;
    limit?: number;
    claimMs?: number;
    /** When supplied, the managed transaction timeout in milliseconds. */
    transactionTimeoutMs?: number;
    /** Maintenance-only: single explicit attempt with no inline retry. */
    noInlineRetry?: boolean;
    now?: Date;
};

export type ClaimCleanupJobsResult = {
    claimToken: string;
    jobs: ShareContentCleanupJobRecord[];
};

export type CompleteCleanupJobInput = {
    objectRef: string;
    claimToken: string;
    outcome: 'completed' | 'retry';
    errorMessage?: string;
    /** When supplied, the managed transaction timeout in milliseconds. */
    transactionTimeoutMs?: number;
    /** Maintenance-only: single explicit attempt with no inline retry. */
    noInlineRetry?: boolean;
    now?: Date;
};

export type CompleteCleanupJobResult =
    | { outcome: 'completed'; job: ShareContentCleanupJobRecord }
    | { outcome: 'retry'; job: ShareContentCleanupJobRecord }
    | { outcome: 'claim_lost' };

/**
 * Exact scoped recovery key. Every field is persisted Brain state; a caller
 * never supplies an object ref, hash, generation or lease as authority.
 */
export type ShareLinkRecoveryKey = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    operationId: string;
};

export type DiscoverRecoverableReservationsInput = {
    /** Required. Discovery is never global. */
    namespace: string;
    /** Bounded to the 1..100 recovery batch window. */
    limit?: number;
    now?: Date;
    /** Maintenance-only: bounded read-transaction timeout. */
    transactionTimeoutMs?: number;
    /** Maintenance-only: single explicit attempt with no inline retry. */
    noInlineRetry?: boolean;
};

export type DiscoverRecoverableReservationsResult = {
    keys: ShareLinkRecoveryKey[];
};

/**
 * Read-only recovery target derived from durable Brain state.
 *
 * `committed` lets a scoped retry observe a finalize whose response was lost
 * without re-uploading or reconstructing the deleted reservation.
 */
export type ShareLinkRecoveryTarget =
    | {
          state: 'reservation';
          share: ShareLinkRecord;
          reservation: ShareLinkReservationRecord;
      }
    | { state: 'committed'; share: ShareLinkRecord }
    | { state: 'absent' };

/**
 * Why a persisted reservation was not reclaimed. Every value is a bounded,
 * non-sensitive category safe to aggregate in logs or a runner summary.
 */
export type RecoveryClaimRejection =
    | 'absent'
    | 'lease_active'
    | 'lease_lapsed'
    | 'stale_generation'
    | 'binding_mismatch'
    | 'malformed_binding'
    | 'operation_not_in_progress'
    | 'share_not_recoverable'
    | 'version_changed';

export type ClaimRecoverableReservationInput = ShareLinkRecoveryKey & {
    leaseOwner: string;
    leaseMs?: number;
    now?: Date;
    /** Maintenance-only: bounded transaction timeout for this claim. */
    transactionTimeoutMs?: number;
    /** Maintenance-only: single explicit attempt with no inline retry. */
    noInlineRetry?: boolean;
};

/**
 * A claim atomically bumps the share and reservation generation and renews only
 * the lease owner/expiry. The immutable object tuple, hashes, metadata and
 * original operation id are preserved.
 */
export type ClaimRecoverableReservationResult =
    | {
          outcome: 'claimed';
          share: ShareLinkRecord;
          reservation: ShareLinkReservationRecord;
      }
    | { outcome: 'not_claimable'; reason: RecoveryClaimRejection };

export type AbandonRecoveredReservationInput = ShareLinkRecoveryKey & {
    /** Required. A stale generation can never abandon reclaimed work. */
    generation: number;
    /** Required. A reused claimant string is still fenced by generation + lease. */
    leaseOwner: string;
    reason?: string;
    now?: Date;
    /** Maintenance-only: bounded transaction timeout for this abandon. */
    transactionTimeoutMs?: number;
    /** Maintenance-only: single explicit attempt with no inline retry. */
    noInlineRetry?: boolean;
};

/**
 * Fenced recovery abandon. Unlike the internal abandon path, this requires an
 * active lease so a worker that already lost its fence cannot destroy work.
 */
export type AbandonRecoveredReservationResult =
    | { outcome: 'abandoned'; cleanupQueuedFor: string | null }
    | { outcome: 'already_absent' }
    | { outcome: 'already_finalized'; share: ShareLinkRecord }
    | { outcome: 'not_claimable'; reason: RecoveryClaimRejection };

/**
 * Input handed to a {@link ShareViewEligibilitySource} inside the receipt
 * transaction, after the share lock is held and the committed tuple re-read. It
 * carries only the already-validated identity of one committed revision.
 */
export type ShareViewEligibilityCheck = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    shareVersion: number;
    contentVersion: number;
    objectRef: string;
    operationId: string;
    /** Clock sampled after the blocking share lock, never before. */
    now: Date;
};

/**
 * Narrowly typed, transaction-compatible trusted policy source.
 *
 * This is the ONLY authority for "the owner is currently eligible to count a
 * view". Implementations MUST read persisted server state through the provided
 * transaction and MUST NOT perform network I/O or trust caller/request values.
 *
 * Fail-closed contract: an absent source, an unavailable/unverifiable source or
 * any thrown error is ineligible. A pre-lock boolean is never authority.
 */
export type ShareViewEligibilitySource = {
    isEligible: (
        tx: import('./transaction').ShareLinkTransaction,
        input: ShareViewEligibilityCheck
    ) => Promise<boolean>;
};

/**
 * Persist one short-lived, single-use view receipt for an eligible owner.
 *
 * Only the caller-supplied opaque token is hashed; the raw token never reaches
 * the graph. The persisted tuple is the exact committed revision that produced
 * it, so a superseded receipt can never count toward current content. The
 * current share state and `eligibilitySource` are re-checked under the share
 * lock before the node is created; an absent source writes nothing.
 */
export type PersistShareViewReceiptInput = {
    /** Raw opaque CSPRNG token (43-char base64url); hashed before storage. */
    receipt: string;
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    /** Immutable share record version (optimistic-concurrency revision). */
    shareVersion: number;
    contentVersion: number;
    objectRef: string;
    operationId: string;
    ttlSeconds: number;
    /**
     * Transaction-compatible trusted policy source. When omitted the receipt is
     * never written (production has no authoritative age source today).
     */
    eligibilitySource?: ShareViewEligibilitySource;
    /**
     * Clock seam, sampled AFTER the blocking share lock is held so a delayed
     * lock cannot mint a receipt with a stale expiry.
     */
    now?: () => Date;
};

/**
 * Outcome of one acknowledgement attempt. Every non-`consumed` value is a
 * fixed, non-sensitive category; the public route collapses all of them to the
 * same `{ ok: true }` response.
 */
export type ConsumeShareViewReceiptOutcome =
    | 'consumed'
    | 'not_found'
    | 'expired'
    | 'already_consumed'
    | 'ineligible'
    | 'not_active'
    | 'version_mismatch'
    | 'binding_mismatch';

export type ConsumeShareViewReceiptInput = {
    /** Raw opaque token exactly as returned to the viewer. */
    receipt: string;
    /**
     * Trusted deployment namespace from server configuration. The receipt, the
     * share and this value must all agree; a token minted in another namespace is
     * never consumable by this deployment.
     */
    namespace: string;
    /**
     * Transaction-compatible trusted policy source, consulted under the share
     * and receipt locks. When omitted, counting is denied. The committed share
     * policy is additionally required, so a stale permissive snapshot can never
     * re-enable counting on its own.
     */
    eligibilitySource?: ShareViewEligibilitySource;
    /**
     * Clock seam. Sampled AFTER the share and receipt locks are held, and
     * re-sampled on each managed-transaction retry.
     */
    now?: () => Date;
};

export type PruneShareViewReceiptsInput = {
    /**
     * Required trusted namespace. Pruning is never global: a pass may only
     * delete receipts belonging to the namespace it signs for.
     */
    namespace: string;
    /** Bounded 1..1000 batch; defaults to 200. Non-finite values are rejected. */
    limit?: number;
    now?: Date;
    /**
     * Maintenance bounds. When supplied the prune runs as a single explicit
     * bounded read transaction with no driver-managed inline retry.
     */
    transaction?: ShareLinkTransactionOptions;
};
