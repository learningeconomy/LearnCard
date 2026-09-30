import { int } from 'neo4j-driver';

import {
    clampShareLinkRecoveryBatch,
    classifyOperationBinding,
    classifyReservationBinding,
    computeLeaseExpiry,
    isLeaseActive,
} from '@helpers/share-link-lifecycle';
import { neogma } from '@instance';

import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import { failShareLink } from './errors';
import {
    deleteReservation,
    enqueueCleanupJob,
    lockShare,
    markOperationAbandoned,
    readNodeProperties,
    readReservation,
    toShareLinkOperationRecord,
    toShareLinkRecord,
    toShareLinkReservationRecord,
} from './helpers';
import { getShareLink } from './read';
import { withShareLinkRead, withShareLinkTransaction, type Neo4jQueryResult } from './transaction';
import type {
    AbandonRecoveredReservationInput,
    AbandonRecoveredReservationResult,
    ClaimRecoverableReservationInput,
    ClaimRecoverableReservationResult,
    DiscoverRecoverableReservationsInput,
    DiscoverRecoverableReservationsResult,
    ShareLinkRecoveryKey,
    ShareLinkRecoveryTarget,
} from './types';

type GraphRunner = {
    run: (query: string, params?: Record<string, unknown>) => Promise<Neo4jQueryResult>;
};

const isOpaqueIdentifier = (value: unknown, maxLength = 128): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    /^[A-Za-z0-9._~-]+$/.test(value);

const assertRecoveryKey = (input: ShareLinkRecoveryKey): void => {
    if (
        !isOpaqueIdentifier(input.namespace) ||
        !isOpaqueIdentifier(input.ownerProfileId) ||
        !isOpaqueIdentifier(input.shareId) ||
        !isOpaqueIdentifier(input.operationId)
    ) {
        failShareLink('INVALID_INPUT', 'recovery key must be well-formed opaque identifiers');
    }
};

function assertLeaseOwner(leaseOwner: unknown): asserts leaseOwner is string {
    if (!isOpaqueIdentifier(leaseOwner)) {
        failShareLink('INVALID_INPUT', 'leaseOwner must be a well-formed opaque identifier');
    }
}

/** Do not let permissive legacy record converters normalize corrupt fences. */
const hasValidShareFence = (props: Record<string, unknown>): boolean =>
    ['version', 'contentVersion', 'generation'].every(
        field =>
            Number.isSafeInteger(props[field]) &&
            (props[field] as number) >= 1 &&
            (props[field] as number) < Number.MAX_SAFE_INTEGER
    ) &&
    typeof props.status === 'string' &&
    ['pending', 'active', 'stopped'].includes(props.status) &&
    typeof props.contentState === 'string' &&
    ['staging', 'finalized', 'content_missing'].includes(props.contentState);

/** Metadata will be activated without the original request, so validate it before conversion. */
const hasValidReservationIntent = (props: Record<string, unknown>): boolean =>
    typeof props.title === 'string' &&
    (props.note == null || typeof props.note === 'string') &&
    (props.expiresAt == null ||
        (typeof props.expiresAt === 'string' && Number.isFinite(Date.parse(props.expiresAt)))) &&
    Number.isSafeInteger(props.selectedCount) &&
    (props.selectedCount as number) >= 1 &&
    (props.selectedCount as number) <= 50 &&
    (props.opKind !== 'create' ||
        (typeof props.objectRef === 'string' && props.contentVersion === 1)) &&
    (props.opKind !== 'update' ||
        props.contentVersion == null ||
        props.contentVersion === (props.baseContentVersion as number) + 1);

/** Binds the idempotency operation record to the exact scoped key. */
const readOperationForRecovery = async (
    runner: GraphRunner,
    input: ShareLinkRecoveryKey
): Promise<Record<string, unknown> | null> => {
    const result = await runner.run(
        `MATCH (o:ShareLinkOperation {operationId: $operationId})
         WHERE o.namespace = $namespace
           AND o.ownerProfileId = $ownerProfileId
           AND o.shareId = $shareId
         RETURN o LIMIT 1`,
        input
    );

    return readNodeProperties(result, 'o');
};

/**
 * Read-only scoped recovery lookup derived entirely from persisted Brain state.
 *
 * A reservation that matches the exact namespace/owner/share/operation key is
 * returned with its committed share snapshot. When the reservation is already
 * consumed but the operation committed — a finalize whose response was lost —
 * the current committed share is returned instead, so a retry can observe success
 * without re-uploading or reconstructing the deleted reservation. A wrong
 * namespace/owner/operation returns `absent`; this function performs no remote
 * I/O and never trusts a caller-supplied object ref, hash or generation.
 */
export const readShareLinkRecoveryTarget = async (
    input: ShareLinkRecoveryKey
): Promise<ShareLinkRecoveryTarget> => {
    assertRecoveryKey(input);

    const share = await getShareLink({
        shareId: input.shareId,
        namespace: input.namespace,
        ownerProfileId: input.ownerProfileId,
    });

    if (!share) return { state: 'absent' };

    const reservationResult = await neogma.queryRunner.run(
        'MATCH (r:ShareLinkReservation {shareId: $shareId}) RETURN r LIMIT 1',
        { shareId: input.shareId }
    );
    const reservationProps = readNodeProperties(reservationResult, 'r');

    if (reservationProps && classifyReservationBinding(reservationProps, input) === 'ok') {
        return {
            state: 'reservation',
            share,
            reservation: toShareLinkReservationRecord(reservationProps),
        };
    }

    const operationProps = await readOperationForRecovery(neogma.queryRunner, input);

    if (operationProps && classifyOperationBinding(operationProps, input) === 'ok') {
        const operation = toShareLinkOperationRecord(operationProps);

        if (operation.status === 'committed') {
            return { state: 'committed', share };
        }
    }

    return { state: 'absent' };
};

/**
 * Enumerates only *expired in-flight* reservation keys for one explicit
 * namespace. The bounded query joins the share and idempotency operation so it
 * returns neither active leases nor stale/foreign bindings; malformed records
 * fail to match and are therefore never offered for reclamation.
 */
export const discoverRecoverableReservations = async (
    input: DiscoverRecoverableReservationsInput
): Promise<DiscoverRecoverableReservationsResult> => {
    await ensureShareLinkConstraints();

    if (!isOpaqueIdentifier(input.namespace)) {
        failShareLink('INVALID_INPUT', 'discovery requires an explicit opaque namespace');
    }

    const now = input.now ?? new Date();
    const limit = clampShareLinkRecoveryBatch(input.limit);

    const result = await withShareLinkRead(
        runner =>
            runner.run(
                `MATCH (r:ShareLinkReservation {namespace: $namespace})
         MATCH (s:ShareLink {id: r.shareId})
         MATCH (o:ShareLinkOperation {operationId: r.operationId})
         WHERE r.leaseExpiresAt <= $now
           AND s.namespace = $namespace
           AND s.ownerProfileId = r.ownerProfileId
           AND s.status <> 'stopped'
           AND s.generation = r.generation
           AND s.version = r.baseVersion
           AND s.contentVersion = r.baseContentVersion
           AND o.status = 'in_progress'
           AND o.shareId = r.shareId
           AND o.namespace = r.namespace
           AND o.ownerProfileId = r.ownerProfileId
         RETURN DISTINCT r.namespace AS namespace,
            r.ownerProfileId AS ownerProfileId,
            r.shareId AS shareId,
            r.operationId AS operationId,
            r.leaseExpiresAt AS leaseExpiresAt
         ORDER BY leaseExpiresAt ASC, shareId ASC
         LIMIT $limit`,
                { namespace: input.namespace, now: now.toISOString(), limit: int(limit) }
            ),
        { timeoutMs: input.transactionTimeoutMs, noInlineRetry: input.noInlineRetry }
    );

    const keys: ShareLinkRecoveryKey[] = [];

    for (const record of result.records) {
        const namespace = record.get('namespace');
        const ownerProfileId = record.get('ownerProfileId');
        const shareId = record.get('shareId');
        const operationId = record.get('operationId');

        if (
            typeof namespace === 'string' &&
            typeof ownerProfileId === 'string' &&
            typeof shareId === 'string' &&
            typeof operationId === 'string'
        ) {
            keys.push({ namespace, ownerProfileId, shareId, operationId });
        }
    }

    return { keys };
};

/**
 * Atomically claims one exact expired reservation for a recovery worker.
 *
 * Under the share write lock the persisted reservation, operation and share are
 * re-read and validated against the current version/content version, generation,
 * owner/namespace/operation binding and non-stopped state before anything is
 * written. A claim then bumps the share and reservation generation together and
 * renews only the lease owner/expiry, so two claimers cannot both win and the
 * immutable object tuple, request hashes, metadata and original operation id are
 * preserved. Any malformed persisted binding fails closed.
 */
export const claimRecoverableReservation = async (
    input: ClaimRecoverableReservationInput
): Promise<ClaimRecoverableReservationResult> => {
    await ensureShareLinkConstraints();
    assertRecoveryKey(input);
    assertLeaseOwner(input.leaseOwner);

    return withShareLinkTransaction(
        async tx => {
            const lockedProps = await lockShare(tx, input.shareId);
            // Production uses the actual clock after the lock is held; an injected
            // test clock is allowed for deterministic lease windows.
            const now = input.now ?? new Date();
            const nowIso = now.toISOString();

            if (!lockedProps) return { outcome: 'not_claimable', reason: 'absent' };

            const share = toShareLinkRecord(lockedProps);

            if (
                share.id !== input.shareId ||
                share.namespace !== input.namespace ||
                share.ownerProfileId !== input.ownerProfileId
            ) {
                return { outcome: 'not_claimable', reason: 'absent' };
            }
            if (!hasValidShareFence(lockedProps)) {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }

            const reservationProps = await readReservation(tx, input.shareId);

            if (!reservationProps) {
                return { outcome: 'not_claimable', reason: 'absent' };
            }

            const binding = classifyReservationBinding(reservationProps, input);

            if (binding === 'malformed_binding' || !hasValidReservationIntent(reservationProps)) {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }
            if (binding === 'binding_mismatch') {
                return { outcome: 'not_claimable', reason: 'binding_mismatch' };
            }

            const reservation = toShareLinkReservationRecord(reservationProps);

            if (share.status === 'stopped') {
                return { outcome: 'not_claimable', reason: 'share_not_recoverable' };
            }
            if (share.generation !== reservation.generation) {
                return { outcome: 'not_claimable', reason: 'stale_generation' };
            }
            if (
                share.version !== reservation.baseVersion ||
                share.contentVersion !== reservation.baseContentVersion
            ) {
                return { outcome: 'not_claimable', reason: 'version_changed' };
            }
            if (isLeaseActive(reservation.leaseExpiresAt, now)) {
                return { outcome: 'not_claimable', reason: 'lease_active' };
            }

            const operationProps = await readOperationForRecovery(tx, input);

            if (!operationProps) {
                return { outcome: 'not_claimable', reason: 'operation_not_in_progress' };
            }

            const operationBinding = classifyOperationBinding(operationProps, {
                ...input,
                opKind: reservation.opKind,
                clientRequestId: reservation.clientRequestId,
            });

            if (operationBinding === 'malformed_binding') {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }
            if (
                !/^[a-f0-9]{64}$/.test(reservation.requestHash) ||
                typeof operationProps.requestHash !== 'string' ||
                !/^[a-f0-9]{64}$/.test(operationProps.requestHash)
            ) {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }
            if (reservation.requestHash !== operationProps.requestHash) {
                return { outcome: 'not_claimable', reason: 'binding_mismatch' };
            }
            if (operationBinding === 'binding_mismatch') {
                return { outcome: 'not_claimable', reason: 'binding_mismatch' };
            }
            if (toShareLinkOperationRecord(operationProps).status !== 'in_progress') {
                return { outcome: 'not_claimable', reason: 'operation_not_in_progress' };
            }

            const nextGeneration = reservation.generation + 1;
            const leaseExpiresAt = computeLeaseExpiry(now, input.leaseMs);

            await tx.run(
                `MATCH (s:ShareLink {id: $shareId})
             SET s.generation = $generation,
                 s.lockTick = coalesce(s.lockTick, 0) + 1,
                 s.updatedAt = $now`,
                { shareId: input.shareId, generation: nextGeneration, now: nowIso }
            );
            await tx.run(
                `MATCH (r:ShareLinkReservation {shareId: $shareId})
             SET r.generation = $generation,
                 r.leaseOwner = $leaseOwner,
                 r.leaseExpiresAt = $leaseExpiresAt,
                 r.updatedAt = $now`,
                {
                    shareId: input.shareId,
                    generation: nextGeneration,
                    leaseOwner: input.leaseOwner,
                    leaseExpiresAt,
                    now: nowIso,
                }
            );

            const claimedShareProps = await tx.run(
                'MATCH (s:ShareLink {id: $shareId}) RETURN s LIMIT 1',
                { shareId: input.shareId }
            );
            const claimedReservationProps = await readReservation(tx, input.shareId);

            const claimedShare = readNodeProperties(claimedShareProps, 's');
            const claimedReservation = claimedReservationProps;

            if (!claimedShare || !claimedReservation) {
                failShareLink('CONFLICT', 'failed to persist the recovery claim');
            }

            return {
                outcome: 'claimed',
                share: toShareLinkRecord(claimedShare),
                reservation: toShareLinkReservationRecord(claimedReservation),
            };
        },
        { timeoutMs: input.transactionTimeoutMs, noInlineRetry: input.noInlineRetry }
    );
};

/**
 * Fenced recovery abandon.
 *
 * This is deliberately separate from the internal `abandonReservation`: it
 * requires both the claimed generation and lease owner AND an active lease, so a
 * worker whose lease already lapsed — or a stale generation, even when the
 * claimant string is reused — cannot destroy work another worker now owns.
 * Intentional stop/revoke semantics still use the internal path and are
 * untouched.
 */
export const abandonRecoveredReservation = async (
    input: AbandonRecoveredReservationInput
): Promise<AbandonRecoveredReservationResult> => {
    await ensureShareLinkConstraints();
    assertRecoveryKey(input);
    assertLeaseOwner(input.leaseOwner);

    if (!Number.isSafeInteger(input.generation) || input.generation < 1) {
        failShareLink('INVALID_INPUT', 'generation must be a positive safe integer');
    }

    return withShareLinkTransaction(
        async tx => {
            const lockedProps = await lockShare(tx, input.shareId);
            const now = input.now ?? new Date();
            const nowIso = now.toISOString();

            if (!lockedProps) return { outcome: 'not_claimable', reason: 'absent' };

            const share = toShareLinkRecord(lockedProps);

            if (
                share.id !== input.shareId ||
                share.namespace !== input.namespace ||
                share.ownerProfileId !== input.ownerProfileId
            ) {
                return { outcome: 'not_claimable', reason: 'absent' };
            }
            if (!hasValidShareFence(lockedProps)) {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }

            const reservationProps = await readReservation(tx, input.shareId);

            if (!reservationProps) {
                const operationProps = await readOperationForRecovery(tx, input);

                if (
                    operationProps &&
                    classifyOperationBinding(operationProps, input) === 'ok' &&
                    toShareLinkOperationRecord(operationProps).status === 'committed'
                ) {
                    return { outcome: 'already_finalized', share };
                }

                return { outcome: 'already_absent' };
            }

            const binding = classifyReservationBinding(reservationProps, input);

            if (binding === 'malformed_binding' || !hasValidReservationIntent(reservationProps)) {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }
            if (binding === 'binding_mismatch') {
                return { outcome: 'already_absent' };
            }

            const reservation = toShareLinkReservationRecord(reservationProps);

            if (
                share.status === 'stopped' ||
                (reservation.objectRef && share.activeObjectRef === reservation.objectRef)
            ) {
                return { outcome: 'not_claimable', reason: 'share_not_recoverable' };
            }
            if (share.generation !== reservation.generation) {
                return { outcome: 'not_claimable', reason: 'stale_generation' };
            }
            if (
                share.version !== reservation.baseVersion ||
                share.contentVersion !== reservation.baseContentVersion
            ) {
                return { outcome: 'not_claimable', reason: 'version_changed' };
            }

            if (
                reservation.generation !== input.generation ||
                reservation.leaseOwner !== input.leaseOwner
            ) {
                return { outcome: 'not_claimable', reason: 'stale_generation' };
            }
            if (!isLeaseActive(reservation.leaseExpiresAt, now)) {
                return { outcome: 'not_claimable', reason: 'lease_lapsed' };
            }

            const operationProps = await readOperationForRecovery(tx, input);

            if (!operationProps) {
                return { outcome: 'not_claimable', reason: 'operation_not_in_progress' };
            }

            const operationBinding = classifyOperationBinding(operationProps, {
                ...input,
                opKind: reservation.opKind,
                clientRequestId: reservation.clientRequestId,
            });

            if (operationBinding === 'malformed_binding') {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }
            if (
                !/^[a-f0-9]{64}$/.test(reservation.requestHash) ||
                typeof operationProps.requestHash !== 'string' ||
                !/^[a-f0-9]{64}$/.test(operationProps.requestHash)
            ) {
                return { outcome: 'not_claimable', reason: 'malformed_binding' };
            }
            if (reservation.requestHash !== operationProps.requestHash) {
                return { outcome: 'not_claimable', reason: 'binding_mismatch' };
            }
            if (operationBinding === 'binding_mismatch') {
                return { outcome: 'not_claimable', reason: 'binding_mismatch' };
            }

            const operation = toShareLinkOperationRecord(operationProps);

            if (operation.status === 'committed') {
                return { outcome: 'already_finalized', share };
            }
            if (operation.status !== 'in_progress') {
                return { outcome: 'not_claimable', reason: 'operation_not_in_progress' };
            }

            let cleanupQueuedFor: string | null = null;

            if (reservation.objectRef) {
                await enqueueCleanupJob(tx, {
                    objectRef: reservation.objectRef,
                    operationId: reservation.operationId,
                    namespace: reservation.namespace,
                    ownerProfileId: reservation.ownerProfileId,
                    shareId: reservation.shareId,
                    contentVersion: reservation.contentVersion ?? reservation.baseContentVersion,
                    reason: 'abandoned',
                    now: nowIso,
                });
                cleanupQueuedFor = reservation.objectRef;
            }

            await markOperationAbandoned(tx, {
                namespace: reservation.namespace,
                ownerProfileId: reservation.ownerProfileId,
                opKind: reservation.opKind,
                clientRequestId: reservation.clientRequestId,
                now: nowIso,
            });
            await deleteReservation(tx, input.shareId);

            return { outcome: 'abandoned', cleanupQueuedFor };
        },
        { timeoutMs: input.transactionTimeoutMs, noInlineRetry: input.noInlineRetry }
    );
};
