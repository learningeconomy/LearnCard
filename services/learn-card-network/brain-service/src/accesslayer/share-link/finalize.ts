import { SHARE_LINK_OPERATION_RETENTION_MS, isLeaseActive } from '@helpers/share-link-lifecycle';
import { mergeShareLinkPolicyConservatively } from '@helpers/share-link-policy/resolver';
import { DEFAULT_SHARE_LINK_POLICY } from '@helpers/share-link-policy/types';
import type { ShareLinkPolicySnapshot } from '@helpers/share-link-policy/types';

import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import { failShareLink } from './errors';
import {
    deleteReservation,
    enqueueCleanupJob,
    lockShare,
    markOperationCommitted,
    readOperationByOperationId,
    readReservation,
    readShareById,
    toShareLinkOperationRecord,
    toShareLinkRecord,
    toShareLinkReservationRecord,
} from './helpers';
import { withShareLinkTransaction } from './transaction';
import type { FinalizeReservationInput, FinalizeReservationResult } from './types';

const pruneAfterFrom = (now: Date): string =>
    new Date(now.getTime() + SHARE_LINK_OPERATION_RETENTION_MS).toISOString();

/**
 * Commits a reserved revision: consumes the reservation under the share write
 * lock, updates the visible fields/version, records the exact operation result and
 * enqueues cleanup for the superseded immutable object — all in ONE transaction.
 *
 * PRECONDITION (enforced by the caller, never by this repository): the external
 * coordinator has already verified that the immutable LearnCloud object for
 * `objectRef` exists and its payloadHash matches the reserved contentHash. `verifiedContentHash`
 * is re-checked here as defense in depth, but this module performs no network I/O
 * and cannot itself attest remote existence.
 *
 * A stale worker is fenced three ways: the reservation must still match the share,
 * its bounded lease must be active, and its generation must equal the share's
 * current generation. A metadata-only reservation leaves `activeObjectRef`
 * untouched and enqueues no cleanup.
 */
export const finalizeReservation = async (
    input: FinalizeReservationInput
): Promise<FinalizeReservationResult> => {
    await ensureShareLinkConstraints();

    const now = input.now ?? new Date();
    const nowIso = now.toISOString();

    return withShareLinkTransaction(
        async tx => {
            const lockedProps = await lockShare(tx, input.shareId);

            if (!lockedProps) {
                failShareLink('NOT_FOUND', 'share not found');
            }

            const share = toShareLinkRecord(lockedProps);

            if (
                share.namespace !== input.namespace ||
                share.ownerProfileId !== input.ownerProfileId
            ) {
                failShareLink('NOT_FOUND', 'share not found');
            }

            if (
                share.lastOperationId === input.operationId &&
                (share.activeObjectRef ?? null) === (input.objectRef ?? null) &&
                share.contentState === 'finalized'
            ) {
                return { outcome: 'already_finalized', share };
            }

            const reservationProps = await readReservation(tx, input.shareId);

            if (!reservationProps) {
                const operationProps = await readOperationByOperationId(tx, input.operationId);

                if (
                    operationProps &&
                    toShareLinkOperationRecord(operationProps).status === 'committed' &&
                    operationProps.shareId === input.shareId &&
                    operationProps.namespace === input.namespace &&
                    operationProps.ownerProfileId === input.ownerProfileId
                ) {
                    return { outcome: 'already_finalized', share };
                }

                failShareLink('CONFLICT', 'reservation is absent or already consumed');
            }

            const reservation = toShareLinkReservationRecord(reservationProps);

            if (
                reservation.operationId !== input.operationId ||
                (reservation.objectRef ?? null) !== (input.objectRef ?? null) ||
                reservation.generation !== input.generation ||
                reservation.leaseOwner !== input.leaseOwner ||
                reservation.namespace !== input.namespace ||
                reservation.ownerProfileId !== input.ownerProfileId
            ) {
                failShareLink('CONFLICT', 'finalize does not match the in-flight reservation');
            }

            if (share.status === 'stopped') {
                failShareLink('CONFLICT', 'cannot finalize a stopped share');
            }

            if (!isLeaseActive(reservation.leaseExpiresAt, input.now ?? new Date())) {
                failShareLink('LEASE_EXPIRED', 'the reservation lease has expired');
            }

            if (share.generation !== reservation.generation) {
                failShareLink('STALE_GENERATION', 'a newer reservation superseded this revision');
            }

            if (share.version !== reservation.baseVersion) {
                failShareLink('CONFLICT', 'share version changed since the reservation');
            }

            if (reservation.contentVersion !== null) {
                if (reservation.opKind === 'create') {
                    // The first revision is contentVersion 1 and is not a "+1" replacement.
                    if (reservation.contentVersion !== 1) {
                        failShareLink(
                            'PRECONDITION_FAILED',
                            'a create reservation must target version 1'
                        );
                    }
                } else {
                    if (share.contentVersion !== reservation.baseContentVersion) {
                        failShareLink(
                            'CONFLICT',
                            'visible content version changed since the reservation'
                        );
                    }

                    if (reservation.contentVersion !== share.contentVersion + 1) {
                        failShareLink(
                            'PRECONDITION_FAILED',
                            'the reserved content version is not current + 1'
                        );
                    }
                }
            }

            if (
                input.verifiedContentHash !== undefined &&
                reservation.contentHash !== null &&
                input.verifiedContentHash !== reservation.contentHash
            ) {
                failShareLink(
                    'PRECONDITION_FAILED',
                    'verified content hash does not match the reservation'
                );
            }

            const previousObjectRef = share.activeObjectRef;
            const nextObjectRef = reservation.objectRef ?? share.activeObjectRef;
            const nextContentVersion = reservation.contentVersion ?? share.contentVersion;

            // A fresh graph-local recheck is needed before enabling counting.
            // In particular, shares created while age was unavailable retain
            // an unknown snapshot until the owner explicitly updates them.
            const currentPolicy: ShareLinkPolicySnapshot = {
                isMinor: share.minorPolicyIsMinor,
                policyResolved: share.minorPolicyResolved,
                defaultExpiryDays: share.minorPolicyDefaultExpiryDays === 365 ? 365 : 30,
                viewCountingEnabled: share.minorPolicyViewCountingEnabled,
            };
            const checkedPolicy = input.resolveCurrentPolicy
                ? await input
                      .resolveCurrentPolicy(tx, share.ownerProfileId, now)
                      .catch(() => DEFAULT_SHARE_LINK_POLICY)
                : null;
            const reservationPolicy = checkedPolicy
                ? mergeShareLinkPolicyConservatively(reservation.policy, checkedPolicy)
                : mergeShareLinkPolicyConservatively(reservation.policy, currentPolicy);
            const mayReplaceUnknown =
                checkedPolicy !== null &&
                !currentPolicy.policyResolved &&
                (reservation.opKind === 'create' || reservation.opKind === 'update');
            const effectivePolicy = mayReplaceUnknown
                ? reservationPolicy
                : mergeShareLinkPolicyConservatively(currentPolicy, reservationPolicy);

            await tx.run(
                `MATCH (s:ShareLink {id: $shareId})
             SET s += $props`,
                {
                    shareId: input.shareId,
                    props: {
                        version: share.version + 1,
                        contentVersion: nextContentVersion,
                        status: 'active',
                        contentState: 'finalized',
                        activeObjectRef: nextObjectRef,
                        activeObjectOperationId: reservation.objectRef
                            ? reservation.operationId
                            : share.activeObjectOperationId,
                        activeContentHash: reservation.contentHash ?? share.activeContentHash,
                        activeContentBytes: reservation.contentBytes ?? share.activeContentBytes,
                        activeRecoveryHash: reservation.recoveryHash ?? share.activeRecoveryHash,
                        lastOperationId: reservation.operationId,
                        title: reservation.title,
                        note: reservation.note,
                        expiresAt: reservation.expiresAt,
                        selectedCount: reservation.selectedCount,
                        passcodeHash: reservation.passcodeHash,
                        notifyOnView:
                            reservation.notifyOnView && effectivePolicy.viewCountingEnabled,
                        minorPolicyIsMinor: effectivePolicy.isMinor,
                        minorPolicyResolved: effectivePolicy.policyResolved,
                        minorPolicyDefaultExpiryDays: effectivePolicy.defaultExpiryDays,
                        minorPolicyViewCountingEnabled: effectivePolicy.viewCountingEnabled,
                        updatedAt: nowIso,
                    },
                }
            );

            const updatedProps = await readShareById(tx, input.shareId);

            if (!updatedProps) {
                failShareLink('CONFLICT', 'share disappeared during finalize');
            }

            const updatedShare = toShareLinkRecord(updatedProps);

            await markOperationCommitted(tx, {
                namespace: reservation.namespace,
                ownerProfileId: reservation.ownerProfileId,
                opKind: reservation.opKind,
                clientRequestId: reservation.clientRequestId,
                operationId: reservation.operationId,
                resultJson: JSON.stringify(updatedShare),
                resultVersion: updatedShare.version,
                now: nowIso,
                pruneAfter: pruneAfterFrom(now),
            });

            await deleteReservation(tx, input.shareId);

            let cleanupQueuedFor: string | null = null;

            if (previousObjectRef && previousObjectRef !== nextObjectRef) {
                await enqueueCleanupJob(tx, {
                    objectRef: previousObjectRef,
                    operationId: share.activeObjectOperationId!,
                    namespace: reservation.namespace,
                    ownerProfileId: reservation.ownerProfileId,
                    shareId: input.shareId,
                    contentVersion: share.contentVersion,
                    reason: 'superseded',
                    now: nowIso,
                });

                cleanupQueuedFor = previousObjectRef;
            }

            return { outcome: 'finalized', share: updatedShare, cleanupQueuedFor };
        },
        { timeoutMs: input.transactionTimeoutMs, noInlineRetry: input.noInlineRetry }
    );
};
