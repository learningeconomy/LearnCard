import type {
    AbandonRecoveredReservationInput,
    AbandonRecoveredReservationResult,
    AbandonReservationInput,
    AbandonReservationResult,
    ClaimCleanupJobsInput,
    ClaimCleanupJobsResult,
    ClaimRecoverableReservationInput,
    ClaimRecoverableReservationResult,
    CompleteCleanupJobInput,
    CompleteCleanupJobResult,
    CurrentShareContentResult,
    DiscoverRecoverableReservationsInput,
    DiscoverRecoverableReservationsResult,
    FinalizeReservationInput,
    FinalizeReservationResult,
    GetCurrentShareContentInput,
    GetShareLinkInput,
    RecoveryClaimRejection,
    ReserveCreateInput,
    ReserveReplacementInput,
    ReserveShareLinkResult,
    RevokeShareLinkInput,
    RevokeShareLinkResult,
    ShareLinkRecoveryKey,
    ShareLinkRecoveryTarget,
    ShareLinkReservationRecord,
} from '../../accesslayer/share-link';
import type {
    ShareContentClient,
    ShareContentClientErrorCode,
    ShareContentClientResult,
    ShareContentContentProjection,
    ShareContentPutRequest,
    ShareContentRecoveryProjection,
} from '../share-content-client/types';
import type { ShareEnvelope } from '@learncard/types';
import type { ShareLinkRecord } from '../../models/ShareLink';
import type { ShareLinkPolicyResolver } from '../share-link-policy/types';

/**
 * Bounded, monotonic wall-clock budget shared by the recovery and cleanup runners.
 *
 * `exhausted()` is true once the remaining time is at or below the reserve the
 * orchestrator needs to finalize (write telemetry, return a summary). A runner
 * checks it before every claim so it never starts work it cannot finish; it must
 * never be implemented with `Promise.race` because that would leave graph or
 * remote mutations running untracked after the pass returns.
 */
export type MaintenanceBudget = {
    remainingMs: () => number;
    exhausted: () => boolean;
    /**
     * Optional finalization reserve in milliseconds. Direct/legacy callers omit
     * it (only `exhausted()` is enforced). The maintenance pass supplies it so a
     * runner can additionally require the remaining time to cover the whole next
     * unit's bounded graph/HTTP calls before it starts one.
     */
    reserveMs?: () => number;
};

/**
 * Structural type of the C3 lifecycle repository consumed by the coordinator.
 *
 * It is a type-only import of the reviewed lifecycle API: production wiring
 * passes the real functions, tests pass fakes. The coordinator never performs
 * network I/O inside a Neo4j transaction because it always awaits the
 * repository call first and only then drives the LearnCloud client.
 */
export type ShareLinkLifecycleRepository = {
    reserveCreate: (input: ReserveCreateInput) => Promise<ReserveShareLinkResult>;
    reserveReplacement: (input: ReserveReplacementInput) => Promise<ReserveShareLinkResult>;
    finalizeReservation: (input: FinalizeReservationInput) => Promise<FinalizeReservationResult>;
    abandonReservation: (input: AbandonReservationInput) => Promise<AbandonReservationResult>;
    revokeShareLink: (input: RevokeShareLinkInput) => Promise<RevokeShareLinkResult>;
    getShareLink: (input: GetShareLinkInput) => Promise<ShareLinkRecord | null>;
    getCurrentShareContent: (
        input: GetCurrentShareContentInput
    ) => Promise<CurrentShareContentResult>;
    claimCleanupJobs: (input: ClaimCleanupJobsInput) => Promise<ClaimCleanupJobsResult>;
    completeCleanupJob: (input: CompleteCleanupJobInput) => Promise<CompleteCleanupJobResult>;
};

/** Dependencies injected into the coordinator. */
export type ShareLinkCoordinatorDependencies = {
    repository: ShareLinkLifecycleRepository;
    client: Pick<ShareContentClient, 'put' | 'get' | 'stat' | 'delete' | 'readRecovery'>;
    /** Stable bounded lease owner for this worker/process. */
    leaseOwner: string;
    leaseMs?: number;
    now?: () => Date;
    /**
     * Server-side policy resolver. Omitted dependencies fall back to the
     * conservative unknown-age policy (30 days, no views), never to adult.
     */
    policyResolver?: ShareLinkPolicyResolver;
};

/** Trusted server-side context. Never taken from the caller's request body. */
export type ShareOwnerContext = {
    namespace: string;
    ownerProfileId: string;
};

export type ShareContentPendingReason =
    | 'upload_unavailable'
    | 'stat_unavailable'
    | 'stat_missing'
    | 'stat_mismatch'
    | 'finalize_unavailable';

export type ShareLinkCommitResult =
    | { status: 'committed'; share: ShareLinkRecord }
    | { status: 'replayed'; share: ShareLinkRecord; recorded: ShareLinkRecord }
    | {
          status: 'pending';
          reservation: ShareLinkReservationRecord;
          reason: ShareContentPendingReason;
      };

export type ShareLinkRevokeResult = {
    status: 'revoked' | 'already_stopped';
    share: ShareLinkRecord;
    cleanupQueuedFor: string[];
};

export type ShareLinkResumeResult =
    | { status: 'committed'; share: ShareLinkRecord }
    | { status: 'replayed'; share: ShareLinkRecord }
    | {
          status: 'pending';
          reservation: ShareLinkReservationRecord;
          reason: ShareContentPendingReason;
      }
    | { status: 'abandoned'; cleanupQueuedFor: string | null };

/** Opaque content payload supplied on a stateless retry. */
export type ShareContentPayload = {
    envelope: ShareEnvelope;
    ownerEncryptedRecovery: Record<string, unknown>;
};

/**
 * INTERNAL ONLY. A pending reservation descriptor may only be produced by this
 * server from a prior coordinator call; it must never be accepted from a client
 * request body. Durable restart recovery must instead use the persisted-state
 * entry points (`runShareLinkRecoveryOnce` / `recoverShareLinkOperation`), which
 * never trust a caller-supplied object ref, hash, generation or lease.
 */
export type PendingShareContentOperation = {
    reservation: ShareLinkReservationRecord;
};

export type ShareLinkCoordinatorErrorCode =
    | 'INVALID_INPUT'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'UNAUTHORIZED'
    | 'SIGNING_FAILED'
    | 'PAYLOAD_TOO_LARGE'
    | 'UNAVAILABLE'
    | 'LEASE_EXPIRED'
    | 'STALE_GENERATION'
    | 'OPERATION_IN_FLIGHT'
    | 'PRECONDITION_FAILED'
    | 'UNEXPECTED';

export class ShareLinkCoordinatorError extends Error {
    readonly code: ShareLinkCoordinatorErrorCode;

    constructor(code: ShareLinkCoordinatorErrorCode, message: string) {
        super(message);
        this.name = 'ShareLinkCoordinatorError';
        this.code = code;
    }
}

/**
 * Fixed, non-sensitive cleanup outcome categories. Client transport codes are
 * reused verbatim; the extra literals cover a claim that could not be confirmed
 * and a throwing client/complete dependency. No value carries an identifier.
 */
export type ShareCleanupCategory =
    | ShareContentClientErrorCode
    | 'claim_lost'
    | 'claim_error'
    | 'client_error'
    | 'budget_exhausted';

/**
 * One-shot cleanup runner result.
 *
 * `skipped` is a count, never a per-item array: a deterministic delete failure
 * must not leak object refs, share/owner ids or exception text into telemetry.
 * `categories` is a fixed histogram drawn only from `ShareCleanupCategory`.
 */
export type CleanupRunSummary = {
    claimed: number;
    completed: number;
    retried: number;
    claimLost: number;
    skipped: number;
    categories: Partial<Record<ShareCleanupCategory, number>>;
};

export type CleanupRunnerDependencies = {
    repository: Pick<ShareLinkLifecycleRepository, 'claimCleanupJobs' | 'completeCleanupJob'>;
    client: Pick<ShareContentClient, 'delete'>;
    claimant: string;
    /** Required explicit namespace; cleanup is never global. */
    namespace: string;
    limit?: number;
    claimMs?: number;
    /**
     * Max jobs per claim transaction. The scheduled maintenance pass sets this to
     * 1 so a deadline cannot strand a whole claimed batch; the default preserves
     * the reviewed one-shot batch behaviour.
     */
    claimBatchSize?: number;
    /** Optional bounded budget; stops before claiming work it cannot finish. */
    budget?: MaintenanceBudget;
    /** Bounded managed-transaction timeout for each claim/complete unit. */
    transactionTimeoutMs?: number;
    /**
     * Configured HTTP allowance for one bounded delete. Only used for whole-unit
     * admission; the transport timeout itself is fixed when the client is built.
     */
    requestTimeoutMs?: number;
    /** Maintenance-only: single explicit graph attempt with no inline retry. */
    noInlineRetry?: boolean;
    now?: () => Date;
};

/**
 * Structural type of the durable reservation recovery repository.
 *
 * Recovery authority is always loaded from persisted Brain state: the runner is
 * handed a namespace (bounded discovery) or an exact scoped key, never a
 * serialized caller reservation. The coordinator only calls `finalizeReservation`
 * after that repository call returns, so no remote I/O happens inside a Neo4j
 * transaction.
 */
export type ShareLinkRecoveryRepository = {
    discoverRecoverableReservations: (
        input: DiscoverRecoverableReservationsInput
    ) => Promise<DiscoverRecoverableReservationsResult>;
    readShareLinkRecoveryTarget: (input: ShareLinkRecoveryKey) => Promise<ShareLinkRecoveryTarget>;
    claimRecoverableReservation: (
        input: ClaimRecoverableReservationInput
    ) => Promise<ClaimRecoverableReservationResult>;
    abandonRecoveredReservation: (
        input: AbandonRecoveredReservationInput
    ) => Promise<AbandonRecoveredReservationResult>;
    finalizeReservation: (input: FinalizeReservationInput) => Promise<FinalizeReservationResult>;
};

/**
 * Bounded, non-sensitive recovery categories. These are the only per-item
 * outcomes a runner summary ever exposes; records, ciphertext, owner ids and
 * object refs never leave the repository call.
 */
export type ShareRecoveryCategory =
    | 'finalized'
    | 'abandoned_missing'
    | 'abandoned_tombstone'
    | 'deferred_stat_mismatch'
    | 'deferred_stat_transient'
    | 'deferred_stat_error'
    | 'deferred_finalize'
    | 'claim_lost'
    | 'malformed_binding'
    | 'budget_exhausted';

/** Aggregate result of one bounded recovery pass; no per-item identifiers. */
export type ShareRecoveryRunSummary = {
    discovered: number;
    claimed: number;
    finalized: number;
    abandoned: number;
    deferred: number;
    claimLost: number;
    anomalies: number;
    categories: Partial<Record<ShareRecoveryCategory, number>>;
};

export type RecoveryRunnerDependencies = {
    repository: ShareLinkRecoveryRepository;
    client: Pick<ShareContentClient, 'stat'>;
    /** Stable bounded lease owner for this recovery worker/process. */
    claimant: string;
    /** Required explicit namespace; discovery is never global. */
    namespace: string;
    limit?: number;
    leaseMs?: number;
    /** Optional bounded budget; stops before claiming work it cannot finish. */
    budget?: MaintenanceBudget;
    /** Bounded transaction timeout propagated to every recovery graph path. */
    transactionTimeoutMs?: number;
    /**
     * Configured HTTP allowance for one bounded stat. Only used for whole-unit
     * admission; the transport timeout itself is fixed when the client is built.
     */
    requestTimeoutMs?: number;
    /** Maintenance-only: single explicit graph attempt with no inline retry. */
    noInlineRetry?: boolean;
    now?: () => Date;
};

/** Scoped-key recovery result. Internal only; never returned by a public route. */
export type ScopedShareRecoveryResult =
    | { status: 'committed'; share: ShareLinkRecord }
    | { status: 'abandoned' }
    | { status: 'deferred'; category: ShareRecoveryCategory }
    | { status: 'absent' }
    | { status: 'not_claimable'; reason: RecoveryClaimRejection };

export type ShareLinkCoordinator = {
    createShareLink: (
        request: unknown,
        context: ShareOwnerContext
    ) => Promise<ShareLinkCommitResult>;
    updateShareLink: (
        request: unknown,
        context: ShareOwnerContext
    ) => Promise<ShareLinkCommitResult>;
    revokeShareLink: (
        request: unknown,
        context: ShareOwnerContext
    ) => Promise<ShareLinkRevokeResult>;
    resumePendingOperation: (
        pending: PendingShareContentOperation,
        content?: ShareContentPayload
    ) => Promise<ShareLinkResumeResult>;
    abandonPendingOperation: (
        pending: PendingShareContentOperation
    ) => Promise<AbandonReservationResult>;
    getShareLink: (shareId: string, context: ShareOwnerContext) => Promise<ShareLinkRecord | null>;
    getActiveShareContent: (
        shareId: string,
        context: ShareOwnerContext
    ) => Promise<CurrentShareContentResult>;
    fetchShareContent: (
        shareId: string,
        context: ShareOwnerContext,
        options?: { allowExpired?: boolean }
    ) => Promise<ShareContentClientResult<ShareContentContentProjection>>;
    readOwnerRecovery: (
        shareId: string,
        context: ShareOwnerContext
    ) => Promise<ShareContentClientResult<ShareContentRecoveryProjection>>;
};

export type { ShareContentPutRequest };
