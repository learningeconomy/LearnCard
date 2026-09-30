import { SHARE_LINK_OPERATION_RETENTION_MS } from '@helpers/share-link-lifecycle';

import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import { failShareLink } from './errors';
import {
    deleteReservation,
    enqueueCleanupJob,
    generateOperationId,
    lockShare,
    markOperationAbandoned,
    markOperationCommitted,
    readOperation,
    readReservation,
    readShareById,
    toShareLinkOperationRecord,
    toShareLinkRecord,
    toShareLinkReservationRecord,
    writeOperationInProgress,
    type ShareLinkOperationKey,
} from './helpers';
import { withShareLinkTransaction } from './transaction';
import type { RevokeShareLinkInput, RevokeShareLinkResult } from './types';

const pruneAfterFrom = (now: Date): string =>
    new Date(now.getTime() + SHARE_LINK_OPERATION_RETENTION_MS).toISOString();

/**
 * Terminally stops a share.
 *
 * Revoke is serialized with finalize by the same share write lock and is
 * idempotent: once `status = 'stopped'` a retry returns the stopped share without
 * re-checking `expectedVersion`, so a retry after the revision changed still
 * succeeds. Stopping does not synchronously delete bytes; it queues the visible
 * object (and any staged replacement object) for tracked cleanup and bumps the
 * fencing generation so an in-flight finalize can no longer commit.
 */
export const revokeShareLink = async (
    input: RevokeShareLinkInput
): Promise<RevokeShareLinkResult> => {
    await ensureShareLinkConstraints();

    if (input.clientRequestId && !input.requestHash) {
        failShareLink('INVALID_INPUT', 'requestHash is required when clientRequestId is supplied');
    }

    const now = input.now ?? new Date();
    const nowIso = now.toISOString();
    const pruneAfter = pruneAfterFrom(now);

    return withShareLinkTransaction(async tx => {
        const lockedProps = await lockShare(tx, input.shareId);

        if (!lockedProps) {
            failShareLink('NOT_FOUND', 'share not found');
        }

        const share = toShareLinkRecord(lockedProps);

        if (share.namespace !== input.namespace || share.ownerProfileId !== input.ownerProfileId) {
            failShareLink('NOT_FOUND', 'share not found');
        }

        const operationKey: ShareLinkOperationKey | null =
            input.clientRequestId && input.requestHash
                ? {
                      namespace: input.namespace,
                      ownerProfileId: input.ownerProfileId,
                      opKind: 'revoke',
                      clientRequestId: input.clientRequestId,
                  }
                : null;

        if (operationKey && input.requestHash) {
            const operationProps = await readOperation(tx, operationKey);

            if (operationProps) {
                const operation = toShareLinkOperationRecord(operationProps);

                if (operation.requestHash !== input.requestHash) {
                    failShareLink(
                        'CONFLICT',
                        'clientRequestId was already used with a different revoke request'
                    );
                }

                if (operation.status === 'committed') {
                    return { outcome: 'already_stopped', share, cleanupQueuedFor: [] };
                }
            }
        }

        if (share.status === 'stopped') {
            return { outcome: 'already_stopped', share, cleanupQueuedFor: [] };
        }

        if (input.expectedVersion !== undefined && share.version !== input.expectedVersion) {
            failShareLink(
                'CONFLICT',
                `expectedVersion ${input.expectedVersion} does not match the current version ${share.version}`
            );
        }

        const cleanupRefs = new Set<string>();
        const reservationProps = await readReservation(tx, input.shareId);

        if (reservationProps) {
            const reservation = toShareLinkReservationRecord(reservationProps);

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
                cleanupRefs.add(reservation.objectRef);
            }

            await markOperationAbandoned(tx, {
                namespace: reservation.namespace,
                ownerProfileId: reservation.ownerProfileId,
                opKind: reservation.opKind,
                clientRequestId: reservation.clientRequestId,
                now: nowIso,
            });
            await deleteReservation(tx, input.shareId);
        }

        if (share.activeObjectRef) {
            await enqueueCleanupJob(tx, {
                objectRef: share.activeObjectRef,
                operationId: share.activeObjectOperationId!,
                namespace: share.namespace,
                ownerProfileId: share.ownerProfileId,
                shareId: share.id,
                contentVersion: share.contentVersion,
                reason: 'stopped',
                now: nowIso,
            });
            cleanupRefs.add(share.activeObjectRef);
        }

        await tx.run(
            `MATCH (s:ShareLink {id: $shareId})
             SET s.status = 'stopped',
                 s.stoppedAt = $now,
                 s.version = $version,
                 s.generation = $generation,
                 s.updatedAt = $now`,
            {
                shareId: input.shareId,
                now: nowIso,
                version: share.version + 1,
                generation: share.generation + 1,
            }
        );

        const updatedProps = await readShareById(tx, input.shareId);

        if (!updatedProps) {
            failShareLink('CONFLICT', 'share disappeared during revoke');
        }

        const updatedShare = toShareLinkRecord(updatedProps);

        if (operationKey && input.requestHash) {
            const operationId = generateOperationId();

            await writeOperationInProgress(tx, {
                ...operationKey,
                operationId,
                shareId: input.shareId,
                requestHash: input.requestHash,
                now: nowIso,
                pruneAfter,
            });
            await markOperationCommitted(tx, {
                ...operationKey,
                operationId,
                resultJson: JSON.stringify(updatedShare),
                resultVersion: updatedShare.version,
                now: nowIso,
                pruneAfter,
            });
        }

        return {
            outcome: 'revoked',
            share: updatedShare,
            cleanupQueuedFor: [...cleanupRefs],
        };
    });
};
