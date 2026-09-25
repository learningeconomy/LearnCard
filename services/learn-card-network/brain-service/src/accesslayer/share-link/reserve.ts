import {
    SHARE_LINK_OPERATION_RETENTION_MS,
    computeLeaseExpiry,
    isLeaseActive,
} from '@helpers/share-link-lifecycle';
import {
    DEFAULT_SHARE_LINK_POLICY,
    type ShareLinkPolicySnapshot,
} from '@helpers/share-link-policy/types';

import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import type { ShareLinkRecord } from '../../models/ShareLink';
import { failShareLink } from './errors';
import {
    deleteReservation,
    enqueueCleanupJob,
    generateObjectRef,
    generateOperationId,
    lockShare,
    markOperationAbandoned,
    readOperation,
    readReservation,
    readShareById,
    toShareLinkOperationRecord,
    toShareLinkRecord,
    toShareLinkReservationRecord,
    writeOperationInProgress,
    type ShareLinkOperationKey,
} from './helpers';
import { withShareLinkTransaction, type ShareLinkTransaction } from './transaction';
import type {
    ReserveCreateInput,
    ReserveReplacementInput,
    ReserveShareLinkResult,
    ShareLinkReservationRecord,
} from './types';

const pruneAfterFrom = (now: Date): string =>
    new Date(now.getTime() + SHARE_LINK_OPERATION_RETENTION_MS).toISOString();

function assertSafeVersion(value: unknown, field: string): asserts value is number {
    if (!Number.isSafeInteger(value) || (value as number) < 1) {
        failShareLink('INVALID_INPUT', `${field} must be a positive safe integer`);
    }
}

const parseRecordedResult = (
    operationProps: Record<string, unknown> | null,
    current: ShareLinkRecord
): ShareLinkRecord => {
    const resultJson = operationProps?.resultJson;

    if (typeof resultJson !== 'string') return current;

    try {
        return toShareLinkRecord(JSON.parse(resultJson) as Record<string, unknown>);
    } catch {
        return current;
    }
};

type ReservationProps = {
    shareId: string;
    namespace: string;
    ownerProfileId: string;
    opKind: 'create' | 'update';
    clientRequestId: string;
    requestHash: string;
    operationId: string;
    objectRef: string | null;
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
    passcodeHash: string | null;
    notifyOnView: boolean;
    policyIsMinor: boolean | null;
    policyResolved: boolean;
    policyDefaultExpiryDays: number;
    policyViewCountingEnabled: boolean;
    generation: number;
    leaseOwner: string;
    leaseExpiresAt: string;
    createdAt: string;
    updatedAt: string;
};

const writeReservation = async (
    tx: ShareLinkTransaction,
    props: ReservationProps
): Promise<void> => {
    await tx.run('CREATE (r:ShareLinkReservation) SET r = $props', { props });
};

const bumpShareGeneration = async (
    tx: ShareLinkTransaction,
    shareId: string,
    generation: number,
    now: string
): Promise<void> => {
    await tx.run(
        `MATCH (s:ShareLink {id: $shareId})
         SET s.generation = $generation, s.lockTick = coalesce(s.lockTick, 0) + 1, s.updatedAt = $now`,
        { shareId, generation, now }
    );
};

/**
 * Irreversibly supersedes a stale reservation: queue cleanup for its exact
 * immutable object, mark its operation abandoned so a late finalize is rejected,
 * and remove the reservation. Used when the lease has expired.
 */
const supersedeReservation = async (
    tx: ShareLinkTransaction,
    reservationProps: Record<string, unknown>,
    now: string
): Promise<ShareLinkReservationRecord> => {
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
            now,
        });
    }

    await markOperationAbandoned(tx, {
        namespace: reservation.namespace,
        ownerProfileId: reservation.ownerProfileId,
        opKind: reservation.opKind,
        clientRequestId: reservation.clientRequestId,
        now,
    });
    await deleteReservation(tx, reservation.shareId);

    return reservation;
};

/**
 * Reserves the first content revision for a new share.
 *
 * Idempotent on `(namespace, ownerProfileId, 'create', clientRequestId)`: the same
 * request hash returns the recorded committed result or resumes the in-flight
 * reservation; a different hash under the same key is a conflict. A duplicate
 * share id owned by someone else fails closed without leaking which owner holds it.
 */
export const reserveCreate = async (input: ReserveCreateInput): Promise<ReserveShareLinkResult> => {
    await ensureShareLinkConstraints();

    const now = input.now ?? new Date();
    const nowIso = now.toISOString();
    const leaseExpiresAt = computeLeaseExpiry(now, input.leaseMs);
    const pruneAfter = pruneAfterFrom(now);
    const opKey: ShareLinkOperationKey = {
        namespace: input.namespace,
        ownerProfileId: input.ownerProfileId,
        opKind: 'create',
        clientRequestId: input.clientRequestId,
    };

    assertSafeVersion(input.selectedCount, 'selectedCount');

    return withShareLinkTransaction(async tx => {
        // Lock before reading operation/reservation state when the share exists; a
        // brand-new share has no node to lock and is protected by the unique id
        // constraint instead.
        const shareProps = await lockShare(tx, input.shareId);
        const existingOperation = await readOperation(tx, opKey);

        // When an expired reservation for the SAME logical operation is
        // superseded, its originally persisted effective expiry must survive the
        // replacement. The coordinator re-derives an omitted-expiry default from
        // the current clock on every call, so trusting `input.expiresAt` here
        // would silently extend a retried create. The replacement still receives
        // a fresh immutable object ref (queued cleanup for the abandoned upload).
        // If abandonment already deleted the reservation, the pending share
        // still holds that logical create's original effective expiry.
        let supersededExpiresAt: { value: string | null } | null = null;

        if (existingOperation) {
            const operation = toShareLinkOperationRecord(existingOperation);

            if (operation.requestHash !== input.requestHash) {
                failShareLink(
                    'CONFLICT',
                    'clientRequestId was already used with a different create request'
                );
            }

            const share = shareProps ? toShareLinkRecord(shareProps) : null;

            if (operation.status === 'committed') {
                if (!share) {
                    failShareLink('CONFLICT', 'recorded create result is no longer available');
                }

                return {
                    outcome: 'already_committed',
                    recorded: parseRecordedResult(existingOperation, share),
                    current: share,
                };
            }

            const existingReservationProps = await readReservation(tx, input.shareId);

            if (existingReservationProps) {
                const existingReservation = toShareLinkReservationRecord(existingReservationProps);
                const sameOperation =
                    existingReservation.operationId === operation.operationId &&
                    existingReservation.opKind === 'create' &&
                    existingReservation.clientRequestId === input.clientRequestId;

                if (!sameOperation) {
                    failShareLink(
                        'OPERATION_IN_FLIGHT',
                        'another create/update reservation is already in flight for this share'
                    );
                }

                if (isLeaseActive(existingReservation.leaseExpiresAt, now)) {
                    if (!share) {
                        failShareLink('CONFLICT', 'in-flight reservation exists without a share');
                    }

                    return {
                        outcome: 'reserved',
                        state: 'resumed',
                        share,
                        reservation: existingReservation,
                    };
                }

                // Same logical operation, expired lease: retain its expiry.
                supersededExpiresAt = { value: existingReservation.expiresAt };
                await supersedeReservation(tx, existingReservationProps, nowIso);
            }

            if (!share) {
                failShareLink('CONFLICT', 'operation record exists but the share is missing');
            }
            if (share.status === 'stopped') {
                failShareLink('CONFLICT', 'cannot re-drive create for a stopped share');
            }

            return createReservationForShare(tx, {
                share,
                opKey,
                operationId: generateOperationId(),
                requestHash: input.requestHash,
                objectRef: generateObjectRef(),
                contentVersion: 1,
                baseContentVersion: share.contentVersion,
                content: input.content,
                selectedCount: input.selectedCount,
                title: input.title,
                note: input.note ?? null,
                expiresAt:
                    supersededExpiresAt !== null ? supersededExpiresAt.value : share.expiresAt,
                passcodeHash: share.passcodeHash ?? input.passcodeHash ?? null,
                notifyOnView: share.notifyOnView ?? input.notifyOnView ?? false,
                policy: input.policy ?? DEFAULT_SHARE_LINK_POLICY,
                leaseOwner: input.leaseOwner,
                leaseExpiresAt,
                nowIso,
                pruneAfter,
            });
        }

        if (shareProps) {
            const share = toShareLinkRecord(shareProps);

            // Never disclose whether another owner holds this id.
            if (
                share.namespace !== input.namespace ||
                share.ownerProfileId !== input.ownerProfileId
            ) {
                failShareLink('CONFLICT', 'share id is not available');
            }

            failShareLink('CONFLICT', 'share id is not available');
        }

        const operationId = generateOperationId();
        const objectRef = generateObjectRef();
        const policy = input.policy ?? DEFAULT_SHARE_LINK_POLICY;

        const shareRecord: Record<string, unknown> = {
            id: input.shareId,
            namespace: input.namespace,
            ownerProfileId: input.ownerProfileId,
            version: 1,
            contentVersion: 1,
            generation: 1,
            status: 'pending',
            contentState: 'staging',
            activeObjectRef: null,
            activeContentHash: null,
            activeContentBytes: null,
            activeRecoveryHash: null,
            lastOperationId: null,
            createdByClientRequestId: input.clientRequestId,
            title: input.title,
            note: input.note ?? null,
            selectedCount: input.selectedCount,
            expiresAt: input.expiresAt ?? null,
            stoppedAt: null,
            viewCount: 0,
            lastViewedAt: null,
            passcodeHash: input.passcodeHash ?? null,
            notifyOnView: input.notifyOnView ?? false,
            minorPolicyIsMinor: policy.isMinor,
            minorPolicyResolved: policy.policyResolved,
            minorPolicyDefaultExpiryDays: policy.defaultExpiryDays,
            minorPolicyViewCountingEnabled: policy.viewCountingEnabled,
            createdAt: nowIso,
            updatedAt: nowIso,
        };

        await tx.run('CREATE (s:ShareLink) SET s = $props', { props: shareRecord });
        await writeOperationInProgress(tx, {
            ...opKey,
            operationId,
            shareId: input.shareId,
            requestHash: input.requestHash,
            now: nowIso,
            pruneAfter,
        });
        await writeReservation(tx, {
            shareId: input.shareId,
            namespace: input.namespace,
            ownerProfileId: input.ownerProfileId,
            opKind: 'create',
            clientRequestId: input.clientRequestId,
            requestHash: input.requestHash,
            operationId,
            objectRef,
            contentVersion: 1,
            baseVersion: 1,
            baseContentVersion: 1,
            contentHash: input.content.contentHash,
            contentBytes: input.content.contentBytes,
            recoveryHash: input.content.recoveryHash,
            recoveryBytes: input.content.recoveryBytes,
            title: input.title,
            note: input.note ?? null,
            expiresAt: input.expiresAt ?? null,
            selectedCount: input.selectedCount,
            passcodeHash: input.passcodeHash ?? null,
            notifyOnView: input.notifyOnView ?? false,
            policyIsMinor: policy.isMinor,
            policyResolved: policy.policyResolved,
            policyDefaultExpiryDays: policy.defaultExpiryDays,
            policyViewCountingEnabled: policy.viewCountingEnabled,
            generation: 1,
            leaseOwner: input.leaseOwner,
            leaseExpiresAt,
            createdAt: nowIso,
            updatedAt: nowIso,
        });

        const createdShare = await readShareById(tx, input.shareId);
        const createdReservation = await readReservation(tx, input.shareId);

        if (!createdShare || !createdReservation) {
            failShareLink('CONFLICT', 'failed to persist the create reservation');
        }

        return {
            outcome: 'reserved',
            state: 'created',
            share: toShareLinkRecord(createdShare),
            reservation: toShareLinkReservationRecord(createdReservation),
        };
    });
};

type CreateReservationForShareInput = {
    share: ShareLinkRecord;
    opKey: ShareLinkOperationKey;
    operationId: string;
    requestHash: string;
    objectRef: string | null;
    contentVersion: number | null;
    baseContentVersion: number;
    content: ReserveCreateInput['content'] | ReserveReplacementInput['content'];
    selectedCount: number;
    title: string;
    note: string | null;
    expiresAt: string | null;
    passcodeHash: string | null;
    notifyOnView: boolean;
    policy: ShareLinkPolicySnapshot;
    leaseOwner: string;
    leaseExpiresAt: string;
    nowIso: string;
    pruneAfter: string;
};

const createReservationForShare = async (
    tx: ShareLinkTransaction,
    input: CreateReservationForShareInput
): Promise<ReserveShareLinkResult> => {
    const generation = input.share.generation + 1;

    await writeOperationInProgress(tx, {
        ...input.opKey,
        operationId: input.operationId,
        shareId: input.share.id,
        requestHash: input.requestHash,
        now: input.nowIso,
        pruneAfter: input.pruneAfter,
    });
    await bumpShareGeneration(tx, input.share.id, generation, input.nowIso);
    await writeReservation(tx, {
        shareId: input.share.id,
        namespace: input.share.namespace,
        ownerProfileId: input.share.ownerProfileId,
        opKind: input.opKey.opKind === 'create' ? 'create' : 'update',
        clientRequestId: input.opKey.clientRequestId,
        requestHash: input.requestHash,
        operationId: input.operationId,
        objectRef: input.objectRef,
        contentVersion: input.contentVersion,
        baseVersion: input.share.version,
        baseContentVersion: input.baseContentVersion,
        contentHash: input.content ? input.content.contentHash : null,
        contentBytes: input.content ? input.content.contentBytes : null,
        recoveryHash: input.content ? input.content.recoveryHash : null,
        recoveryBytes: input.content ? input.content.recoveryBytes : null,
        title: input.title,
        note: input.note,
        expiresAt: input.expiresAt,
        selectedCount: input.selectedCount,
        passcodeHash: input.passcodeHash,
        notifyOnView: input.notifyOnView,
        policyIsMinor: input.policy.isMinor,
        policyResolved: input.policy.policyResolved,
        policyDefaultExpiryDays: input.policy.defaultExpiryDays,
        policyViewCountingEnabled: input.policy.viewCountingEnabled,
        generation,
        leaseOwner: input.leaseOwner,
        leaseExpiresAt: input.leaseExpiresAt,
        createdAt: input.nowIso,
        updatedAt: input.nowIso,
    });

    const updatedShare = await readShareById(tx, input.share.id);
    const reservation = await readReservation(tx, input.share.id);

    if (!updatedShare || !reservation) {
        failShareLink('CONFLICT', 'failed to persist the reservation');
    }

    return {
        outcome: 'reserved',
        state: 'created',
        share: toShareLinkRecord(updatedShare),
        reservation: toShareLinkReservationRecord(reservation),
    };
};

/**
 * Reserves a replacement revision (content and/or metadata) for an existing share.
 *
 * The currently visible object reference is deliberately left untouched: old
 * content stays visible while the replacement is staged and only becomes visible
 * when `finalizeReservation` commits. A metadata-only reservation (no `content`)
 * carries no object reference and leaves the visible content version unchanged.
 *
 * At most one reservation may be in flight. A reservation whose bounded lease has
 * expired may be superseded with a higher generation; its staged object is queued
 * for tracked cleanup and any late finalize is fenced out.
 */
export const reserveReplacement = async (
    input: ReserveReplacementInput
): Promise<ReserveShareLinkResult> => {
    await ensureShareLinkConstraints();
    assertSafeVersion(input.expectedVersion, 'expectedVersion');

    const now = input.now ?? new Date();
    const nowIso = now.toISOString();
    const leaseExpiresAt = computeLeaseExpiry(now, input.leaseMs);
    const pruneAfter = pruneAfterFrom(now);
    const opKey: ShareLinkOperationKey = {
        namespace: input.namespace,
        ownerProfileId: input.ownerProfileId,
        opKind: 'update',
        clientRequestId: input.clientRequestId,
    };

    if (input.content) {
        assertSafeVersion(input.content.selectedCount, 'content.selectedCount');
        assertSafeVersion(input.content.contentVersion, 'content.contentVersion');
    }

    return withShareLinkTransaction(async tx => {
        const lockedProps = await lockShare(tx, input.shareId);

        if (!lockedProps) {
            failShareLink('NOT_FOUND', 'share not found');
        }

        const share = toShareLinkRecord(lockedProps);

        if (share.namespace !== input.namespace || share.ownerProfileId !== input.ownerProfileId) {
            failShareLink('NOT_FOUND', 'share not found');
        }

        const existingOperation = await readOperation(tx, opKey);

        if (existingOperation) {
            const operation = toShareLinkOperationRecord(existingOperation);

            if (operation.requestHash !== input.requestHash) {
                failShareLink(
                    'CONFLICT',
                    'clientRequestId was already used with a different update request'
                );
            }

            if (operation.status === 'committed') {
                return {
                    outcome: 'already_committed',
                    recorded: parseRecordedResult(existingOperation, share),
                    current: share,
                };
            }

            const existingReservationProps = await readReservation(tx, input.shareId);

            if (existingReservationProps) {
                const existingReservation = toShareLinkReservationRecord(existingReservationProps);
                const sameOperation =
                    existingReservation.operationId === operation.operationId &&
                    existingReservation.opKind === 'update' &&
                    existingReservation.clientRequestId === input.clientRequestId;

                if (!sameOperation) {
                    failShareLink(
                        'OPERATION_IN_FLIGHT',
                        'another create/update reservation is already in flight for this share'
                    );
                }

                if (isLeaseActive(existingReservation.leaseExpiresAt, now)) {
                    return {
                        outcome: 'reserved',
                        state: 'resumed',
                        share,
                        reservation: existingReservation,
                    };
                }

                await supersedeReservation(tx, existingReservationProps, nowIso);
            }

            return reserveReplacementForLockedShare(tx, {
                share,
                input,
                opKey,
                leaseExpiresAt,
                nowIso,
                pruneAfter,
            });
        }

        if (share.status === 'stopped') {
            failShareLink('CONFLICT', 'cannot update a stopped share');
        }

        const existingReservationProps = await readReservation(tx, input.shareId);

        if (existingReservationProps) {
            const existingReservation = toShareLinkReservationRecord(existingReservationProps);

            if (isLeaseActive(existingReservation.leaseExpiresAt, now)) {
                failShareLink(
                    'OPERATION_IN_FLIGHT',
                    'another create/update reservation is already in flight for this share'
                );
            }

            await supersedeReservation(tx, existingReservationProps, nowIso);
        }

        if (share.contentState === 'staging') {
            failShareLink('CONFLICT', 'share content is still staging');
        }

        if (share.version !== input.expectedVersion) {
            failShareLink(
                'CONFLICT',
                `expectedVersion ${input.expectedVersion} does not match the current version ${share.version}`
            );
        }

        return reserveReplacementForLockedShare(tx, {
            share,
            input,
            opKey,
            leaseExpiresAt,
            nowIso,
            pruneAfter,
        });
    });
};

const reserveReplacementForLockedShare = async (
    tx: ShareLinkTransaction,
    args: {
        share: ShareLinkRecord;
        input: ReserveReplacementInput;
        opKey: ShareLinkOperationKey;
        leaseExpiresAt: string;
        nowIso: string;
        pruneAfter: string;
    }
): Promise<ReserveShareLinkResult> => {
    const { share, input, opKey, leaseExpiresAt, nowIso, pruneAfter } = args;

    // Every path, including an abandoned request replay, enforces these guards.
    if (share.status !== 'active' || share.contentState !== 'finalized') {
        failShareLink('CONFLICT', 'share is not active and finalized');
    }
    if (share.version !== input.expectedVersion) {
        failShareLink('CONFLICT', 'share version changed since the request');
    }

    if (input.content) {
        const expectedContentVersion = share.contentVersion + 1;

        if (input.content.contentVersion !== expectedContentVersion) {
            failShareLink(
                'PRECONDITION_FAILED',
                `contentVersion ${input.content.contentVersion} must equal ${expectedContentVersion}`
            );
        }
    }

    return createReservationForShare(tx, {
        share,
        opKey,
        operationId: generateOperationId(),
        requestHash: input.requestHash,
        objectRef: input.content ? generateObjectRef() : null,
        contentVersion: input.content ? input.content.contentVersion : null,
        baseContentVersion: share.contentVersion,
        content: input.content,
        selectedCount: input.content ? input.content.selectedCount : share.selectedCount,
        title: input.title ?? share.title,
        note: input.note !== undefined ? input.note : share.note,
        expiresAt: input.expiresAt !== undefined ? input.expiresAt : share.expiresAt,
        passcodeHash: share.passcodeHash ?? null,
        notifyOnView: share.notifyOnView === true,
        policy:
            input.policy ??
            ({
                isMinor: share.minorPolicyIsMinor,
                policyResolved: share.minorPolicyResolved,
                defaultExpiryDays: share.minorPolicyDefaultExpiryDays === 365 ? 365 : 30,
                viewCountingEnabled: share.minorPolicyViewCountingEnabled,
            } satisfies ShareLinkPolicySnapshot),
        leaseOwner: input.leaseOwner,
        leaseExpiresAt,
        nowIso,
        pruneAfter,
    });
};
