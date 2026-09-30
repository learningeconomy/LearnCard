import { isShareLinkRepositoryError } from '../../accesslayer/share-link/errors';
import type {
    RecoveryClaimRejection,
    ShareLinkReservationRecord,
} from '../../accesslayer/share-link';
import type { ShareLinkRecord } from '../../models/ShareLink';
import { isTransientShareContentError } from '../share-content-client/types';
import { budgetAllows, budgetHasUnitReserve, boundTransactionTimeout } from './budget-helpers';
import { verifyShareContentActiveStat } from './stat';
import {
    ShareLinkCoordinatorError,
    type RecoveryRunnerDependencies,
    type ScopedShareRecoveryResult,
    type ShareRecoveryCategory,
    type ShareRecoveryRunSummary,
} from './types';

const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;

const isOpaqueIdentifier = (value: unknown, maxLength = 128): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    OPAQUE_IDENTIFIER_RE.test(value);

const failInvalidInput = (message: string): never => {
    throw new ShareLinkCoordinatorError('INVALID_INPUT', message);
};

const assertRunnerScope = (
    dependencies: RecoveryRunnerDependencies,
    key?: { namespace: string; ownerProfileId: string; shareId: string; operationId: string }
): void => {
    if (!isOpaqueIdentifier(dependencies.claimant)) {
        failInvalidInput('claimant must be an opaque configured identifier');
    }
    if (!isOpaqueIdentifier(dependencies.namespace)) {
        failInvalidInput('namespace must be an opaque configured identifier');
    }
    if (
        key &&
        (key.namespace !== dependencies.namespace ||
            !isOpaqueIdentifier(key.namespace) ||
            !isOpaqueIdentifier(key.ownerProfileId) ||
            !isOpaqueIdentifier(key.shareId) ||
            !isOpaqueIdentifier(key.operationId))
    ) {
        failInvalidInput('recovery key must be well-formed opaque identifiers');
    }
};

const recordCategory = (
    categories: Partial<Record<ShareRecoveryCategory, number>>,
    category: ShareRecoveryCategory
): void => {
    categories[category] = (categories[category] ?? 0) + 1;
};

type RecoveryDriveOutcome =
    | { kind: 'finalized'; share: ShareLinkRecord }
    | { kind: 'abandoned'; category: ShareRecoveryCategory }
    | { kind: 'deferred'; category: ShareRecoveryCategory }
    | { kind: 'claim_lost'; reason: RecoveryClaimRejection };

/** Bounded graph cost of one recovery transaction (claim, finalize or abandon). */
const graphCostMs = (dependencies: RecoveryRunnerDependencies): number =>
    dependencies.transactionTimeoutMs ?? 0;

/**
 * Worst-case bounded cost of claiming and driving one reservation:
 *   claim (graph) + stat (HTTP) + finalize/abandon (graph).
 * The HTTP allowance is fixed when the transport client is constructed, so it
 * cannot be reduced per call; the graph calls are bounded per call below.
 */
const recoveryUnitCostMs = (dependencies: RecoveryRunnerDependencies): number =>
    (dependencies.requestTimeoutMs ?? 0) + 2 * graphCostMs(dependencies);

/** Cost of the stat/verify tail once a reservation has already been claimed. */
const recoveryRemoteCostMs = (dependencies: RecoveryRunnerDependencies): number =>
    (dependencies.requestTimeoutMs ?? 0) + graphCostMs(dependencies);

const finalizeFailureReason = (error: unknown): RecoveryClaimRejection | null => {
    if (!isShareLinkRepositoryError(error)) return null;

    switch (error.code) {
        case 'STALE_GENERATION':
            return 'stale_generation';
        case 'LEASE_EXPIRED':
            return 'lease_lapsed';
        case 'NOT_FOUND':
            return 'absent';
        case 'CONFLICT':
        case 'PRECONDITION_FAILED':
            return 'version_changed';
        default:
            return null;
    }
};

const finalizeClaimedReservation = async (
    reservation: ShareLinkReservationRecord,
    dependencies: RecoveryRunnerDependencies
): Promise<RecoveryDriveOutcome> => {
    try {
        const finalized = await dependencies.repository.finalizeReservation({
            namespace: reservation.namespace,
            ownerProfileId: reservation.ownerProfileId,
            shareId: reservation.shareId,
            operationId: reservation.operationId,
            objectRef: reservation.objectRef,
            generation: reservation.generation,
            leaseOwner: reservation.leaseOwner,
            verifiedContentHash:
                reservation.objectRef === null || reservation.contentHash === null
                    ? undefined
                    : reservation.contentHash,
            now: dependencies.now?.(),
            transactionTimeoutMs: boundTransactionTimeout(
                dependencies.transactionTimeoutMs,
                dependencies.budget
            ),
            noInlineRetry: dependencies.noInlineRetry,
        });

        return { kind: 'finalized', share: finalized.share };
    } catch (error) {
        const reason = finalizeFailureReason(error);

        // A typed fence failure means another worker may own the reservation now;
        // an unexpected failure keeps the work recoverable until the lease lapses.
        return reason
            ? { kind: 'claim_lost', reason }
            : { kind: 'deferred', category: 'deferred_finalize' };
    }
};

const abandonClaimedReservation = async (
    reservation: ShareLinkReservationRecord,
    dependencies: RecoveryRunnerDependencies,
    category: ShareRecoveryCategory
): Promise<RecoveryDriveOutcome> => {
    try {
        const abandoned = await dependencies.repository.abandonRecoveredReservation({
            namespace: reservation.namespace,
            ownerProfileId: reservation.ownerProfileId,
            shareId: reservation.shareId,
            operationId: reservation.operationId,
            generation: reservation.generation,
            leaseOwner: reservation.leaseOwner,
            now: dependencies.now?.(),
            transactionTimeoutMs: boundTransactionTimeout(
                dependencies.transactionTimeoutMs,
                dependencies.budget
            ),
            noInlineRetry: dependencies.noInlineRetry,
        });

        if (abandoned.outcome === 'abandoned') return { kind: 'abandoned', category };
        if (abandoned.outcome === 'already_finalized') {
            return { kind: 'finalized', share: abandoned.share };
        }
        if (abandoned.outcome === 'not_claimable') {
            return { kind: 'claim_lost', reason: abandoned.reason };
        }

        return { kind: 'claim_lost', reason: 'absent' };
    } catch {
        return { kind: 'deferred', category: 'deferred_finalize' };
    }
};

/**
 * Drives one claimed reservation to a finalize or a fenced abandon using the
 * persisted immutable tuple. All remote stat I/O happens here, outside every
 * graph transaction. A mismatch or dependency failure never destroys content.
 */
const driveClaimedReservation = async (
    reservation: ShareLinkReservationRecord,
    dependencies: RecoveryRunnerDependencies
): Promise<RecoveryDriveOutcome> => {
    if (reservation.objectRef === null || reservation.contentVersion === null) {
        // Metadata-only reservation: finalize without any storage I/O.
        if (
            budgetHasUnitReserve(dependencies.budget) &&
            !budgetAllows(dependencies.budget, graphCostMs(dependencies))
        ) {
            return { kind: 'deferred', category: 'budget_exhausted' };
        }

        return finalizeClaimedReservation(reservation, dependencies);
    }

    if (
        budgetHasUnitReserve(dependencies.budget) &&
        !budgetAllows(dependencies.budget, recoveryRemoteCostMs(dependencies))
    ) {
        return { kind: 'deferred', category: 'budget_exhausted' };
    }

    const stat = await dependencies.client.stat({
        namespace: reservation.namespace,
        ownerProfileId: reservation.ownerProfileId,
        shareId: reservation.shareId,
        contentVersion: reservation.contentVersion,
        objectId: reservation.objectRef,
        operationId: reservation.operationId,
    });

    if (!stat.ok) {
        if (stat.error === 'NOT_FOUND') {
            if (
                budgetHasUnitReserve(dependencies.budget) &&
                !budgetAllows(dependencies.budget, graphCostMs(dependencies))
            ) {
                return { kind: 'deferred', category: 'budget_exhausted' };
            }

            return abandonClaimedReservation(reservation, dependencies, 'abandoned_missing');
        }

        return {
            kind: 'deferred',
            category: isTransientShareContentError(stat.error)
                ? 'deferred_stat_transient'
                : 'deferred_stat_error',
        };
    }

    if (verifyShareContentActiveStat(stat.value, reservation)) {
        if (
            budgetHasUnitReserve(dependencies.budget) &&
            !budgetAllows(dependencies.budget, graphCostMs(dependencies))
        ) {
            return { kind: 'deferred', category: 'budget_exhausted' };
        }

        return finalizeClaimedReservation(reservation, dependencies);
    }

    if (stat.value.kind === 'tombstone') {
        if (
            budgetHasUnitReserve(dependencies.budget) &&
            !budgetAllows(dependencies.budget, graphCostMs(dependencies))
        ) {
            return { kind: 'deferred', category: 'budget_exhausted' };
        }

        return abandonClaimedReservation(reservation, dependencies, 'abandoned_tombstone');
    }

    return { kind: 'deferred', category: 'deferred_stat_mismatch' };
};

/**
 * Wraps the remote drive so a throwing storage dependency is reported as a
 * bounded deferred category. A thrown stat must never escape the recovery pass or
 * be mistaken for a proven deletion.
 */
const safeDriveClaimedReservation = async (
    reservation: ShareLinkReservationRecord,
    dependencies: RecoveryRunnerDependencies
): Promise<RecoveryDriveOutcome> => {
    try {
        return await driveClaimedReservation(reservation, dependencies);
    } catch {
        return { kind: 'deferred', category: 'deferred_stat_error' };
    }
};

/**
 * One bounded, one-shot recovery pass.
 *
 * It performs ONE discovery pass for the explicit namespace and then services
 * each persisted key at most once, so a contended or failed item is never
 * re-selected within the same pass. Every per-item failure is reported as a
 * bounded category; the summary carries no owner ids, share ids, object refs,
 * titles, notes, payloads, keys or URIs. Failed work stays recoverable and can be
 * retried after its lease lapses.
 */
export const runShareLinkRecoveryOnce = async (
    dependencies: RecoveryRunnerDependencies
): Promise<ShareRecoveryRunSummary> => {
    assertRunnerScope(dependencies);

    const summary: ShareRecoveryRunSummary = {
        discovered: 0,
        claimed: 0,
        finalized: 0,
        abandoned: 0,
        deferred: 0,
        claimLost: 0,
        anomalies: 0,
        categories: {},
    };

    // Bound discovery itself: a bounded maintenance pass must not start a read
    // it cannot cover. Ordinary callers omit the reserve and keep the reviewed
    // behaviour.
    if (
        budgetHasUnitReserve(dependencies.budget) &&
        !budgetAllows(dependencies.budget, graphCostMs(dependencies))
    ) {
        recordCategory(summary.categories, 'budget_exhausted');

        return summary;
    }

    const discovery = await dependencies.repository.discoverRecoverableReservations({
        namespace: dependencies.namespace,
        limit: dependencies.limit,
        now: dependencies.now?.(),
        transactionTimeoutMs: boundTransactionTimeout(
            dependencies.transactionTimeoutMs,
            dependencies.budget
        ),
        noInlineRetry: dependencies.noInlineRetry,
    });

    summary.discovered = discovery.keys.length;

    for (const key of discovery.keys) {
        // Whole-unit admission before each claim so a discovered item is never
        // claimed only to be left mid-flight; a later run retries.
        if (!budgetAllows(dependencies.budget, recoveryUnitCostMs(dependencies))) break;

        let claim: Awaited<
            ReturnType<RecoveryRunnerDependencies['repository']['claimRecoverableReservation']>
        >;

        try {
            claim = await dependencies.repository.claimRecoverableReservation({
                ...key,
                leaseOwner: dependencies.claimant,
                leaseMs: dependencies.leaseMs,
                now: dependencies.now?.(),
                transactionTimeoutMs: boundTransactionTimeout(
                    dependencies.transactionTimeoutMs,
                    dependencies.budget
                ),
                noInlineRetry: dependencies.noInlineRetry,
            });
        } catch {
            // Could not confirm a claim; a later pass retries after the lease.
            summary.claimLost += 1;
            recordCategory(summary.categories, 'claim_lost');
            continue;
        }

        if (claim.outcome !== 'claimed') {
            if (claim.reason === 'malformed_binding') {
                summary.anomalies += 1;
                recordCategory(summary.categories, 'malformed_binding');
            } else {
                summary.claimLost += 1;
                recordCategory(summary.categories, 'claim_lost');
            }
            continue;
        }

        summary.claimed += 1;
        const outcome = await safeDriveClaimedReservation(claim.reservation, dependencies);

        switch (outcome.kind) {
            case 'finalized':
                summary.finalized += 1;
                recordCategory(summary.categories, 'finalized');
                break;
            case 'abandoned':
                summary.abandoned += 1;
                recordCategory(summary.categories, outcome.category);
                break;
            case 'deferred':
                summary.deferred += 1;
                recordCategory(summary.categories, outcome.category);
                break;
            case 'claim_lost':
                summary.claimLost += 1;
                recordCategory(summary.categories, 'claim_lost');
                break;
        }
    }

    return summary;
};

/**
 * Scoped exact-key recovery retry.
 *
 * The reservation is loaded and claimed server-side; the caller supplies only the
 * exact key, never an object ref, hash, generation or lease. When the finalize
 * already committed but its response was lost, the committed current state is
 * returned without re-uploading or reconstructing the deleted reservation.
 */
export const recoverShareLinkOperation = async (
    dependencies: RecoveryRunnerDependencies,
    key: { namespace: string; ownerProfileId: string; shareId: string; operationId: string }
): Promise<ScopedShareRecoveryResult> => {
    assertRunnerScope(dependencies, key);

    const target = await dependencies.repository.readShareLinkRecoveryTarget(key);

    if (target.state === 'committed') return { status: 'committed', share: target.share };
    if (target.state === 'absent') return { status: 'absent' };

    const claim = await dependencies.repository.claimRecoverableReservation({
        ...key,
        leaseOwner: dependencies.claimant,
        leaseMs: dependencies.leaseMs,
        now: dependencies.now?.(),
    });

    if (claim.outcome !== 'claimed') {
        return { status: 'not_claimable', reason: claim.reason };
    }

    const outcome = await safeDriveClaimedReservation(claim.reservation, dependencies);

    switch (outcome.kind) {
        case 'finalized':
            return { status: 'committed', share: outcome.share };
        case 'abandoned':
            return { status: 'abandoned' };
        case 'deferred':
            return { status: 'deferred', category: outcome.category };
        case 'claim_lost':
            return { status: 'not_claimable', reason: outcome.reason };
    }
};
