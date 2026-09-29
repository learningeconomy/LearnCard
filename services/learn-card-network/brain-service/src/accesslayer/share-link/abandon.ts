import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import { failShareLink } from './errors';
import {
    deleteReservation,
    enqueueCleanupJob,
    lockShare,
    markOperationAbandoned,
    readReservation,
    toShareLinkRecord,
    toShareLinkReservationRecord,
} from './helpers';
import { withShareLinkTransaction } from './transaction';
import type { AbandonReservationInput, AbandonReservationResult } from './types';

/**
 * Irreversibly abandons a reservation.
 *
 * The operation transitions to cleanup-only: its exact immutable object is queued
 * for tracked cleanup and the reservation is deleted, so a late finalize for the
 * same operation is rejected. A stale worker can never abandon a newer reservation
 * because the operation id (and, when supplied, generation/lease owner) must match.
 *
 * When the reservation is already gone but the share records this operation as the
 * committed one, abandon reports `already_finalized` instead of pretending to have
 * cleaned up live content.
 */
export const abandonReservation = async (
    input: AbandonReservationInput
): Promise<AbandonReservationResult> => {
    await ensureShareLinkConstraints();

    const now = input.now ?? new Date();
    const nowIso = now.toISOString();

    return withShareLinkTransaction(async tx => {
        const lockedProps = await lockShare(tx, input.shareId);

        if (!lockedProps) {
            failShareLink('NOT_FOUND', 'share not found');
        }

        const share = toShareLinkRecord(lockedProps);

        if (share.namespace !== input.namespace || share.ownerProfileId !== input.ownerProfileId) {
            failShareLink('NOT_FOUND', 'share not found');
        }

        const reservationProps = await readReservation(tx, input.shareId);

        if (!reservationProps) {
            if (share.lastOperationId === input.operationId) {
                return { outcome: 'already_finalized', share };
            }

            return { outcome: 'already_absent' };
        }

        const reservation = toShareLinkReservationRecord(reservationProps);

        if (reservation.operationId !== input.operationId) {
            return { outcome: 'already_absent' };
        }

        if (input.generation !== undefined && reservation.generation !== input.generation) {
            return { outcome: 'already_absent' };
        }

        if (input.leaseOwner !== undefined && reservation.leaseOwner !== input.leaseOwner) {
            return { outcome: 'already_absent' };
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
    });
};
