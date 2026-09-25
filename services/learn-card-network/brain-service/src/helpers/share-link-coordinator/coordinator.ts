import { createHash } from 'node:crypto';

import {
    CreateShareLinkInputValidator,
    ShareLinkIdValidator,
    UpdateShareLinkInputValidator,
    decodedBase64UrlByteLength,
    utf8ByteLength,
} from '@learncard/types';

import {
    canonicalizeJson,
    computeShareLinkPayloadHash,
    computeShareLinkRequestHash,
} from '@helpers/share-link-lifecycle';
import {
    createShareLinkPolicyResolver,
    resolveShareLinkExpiry,
} from '@helpers/share-link-policy/resolver';
import type { ShareLinkPolicyResolver } from '@helpers/share-link-policy/types';
import { hashSharePasscode } from '@helpers/share-link-passcode';

import { isShareLinkRepositoryError } from '../../accesslayer/share-link/errors';
import type { ShareLinkReservationRecord } from '../../accesslayer/share-link';
import { isTransientShareContentError } from '../share-content-client/types';
import type {
    ShareContentClientErrorCode,
    ShareContentEnvelope,
} from '../share-content-client/types';
import { verifyShareContentActiveStat as verifyActiveStat } from './stat';
import {
    ShareLinkCoordinatorError,
    type PendingShareContentOperation,
    type ShareContentPayload,
    type ShareLinkCommitResult,
    type ShareLinkCoordinator,
    type ShareLinkCoordinatorErrorCode,
    type ShareLinkCoordinatorDependencies,
    type ShareLinkResumeResult,
    type ShareOwnerContext,
} from './types';

const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const isOpaqueIdentifier = (value: unknown, maxLength = 128): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    OPAQUE_IDENTIFIER_RE.test(value);

function fail(code: ShareLinkCoordinatorErrorCode, message: string): never {
    throw new ShareLinkCoordinatorError(code, message);
}

const mapRepositoryErrorCode = (code: string): ShareLinkCoordinatorErrorCode => {
    switch (code) {
        case 'NOT_FOUND':
        case 'CONFLICT':
        case 'OPERATION_IN_FLIGHT':
        case 'LEASE_EXPIRED':
        case 'STALE_GENERATION':
        case 'PRECONDITION_FAILED':
        case 'INVALID_INPUT':
            return code;
        default:
            return 'UNEXPECTED';
    }
};

const toCoordinatorError = (error: unknown): ShareLinkCoordinatorError => {
    if (isShareLinkRepositoryError(error)) {
        return new ShareLinkCoordinatorError(
            mapRepositoryErrorCode(error.code),
            'share-link lifecycle operation failed'
        );
    }

    return new ShareLinkCoordinatorError('UNEXPECTED', 'share-link lifecycle operation failed');
};

const parseOwnerContext = (context: ShareOwnerContext): ShareOwnerContext => {
    if (!isPlainObject(context)) fail('INVALID_INPUT', 'owner context must be an object');
    if (!isOpaqueIdentifier(context.namespace)) {
        fail('INVALID_INPUT', 'namespace must be an opaque configured identifier');
    }
    if (!isOpaqueIdentifier(context.ownerProfileId)) {
        fail('INVALID_INPUT', 'ownerProfileId must be an opaque identifier');
    }

    return { namespace: context.namespace, ownerProfileId: context.ownerProfileId };
};

const isRetryableClientError = (code: ShareContentClientErrorCode): boolean =>
    isTransientShareContentError(code) ||
    code === 'MALFORMED_RESPONSE' ||
    code === 'RESPONSE_TOO_LARGE';

/** Preserve the real cause for deterministic client failures instead of a generic conflict. */
const mapClientErrorCode = (code: ShareContentClientErrorCode): ShareLinkCoordinatorErrorCode => {
    switch (code) {
        case 'UNAUTHORIZED':
            return 'UNAUTHORIZED';
        case 'SIGNING_FAILED':
            return 'SIGNING_FAILED';
        case 'PAYLOAD_TOO_LARGE':
            return 'PAYLOAD_TOO_LARGE';
        case 'NOT_FOUND':
            return 'NOT_FOUND';
        case 'CONFLICT':
            return 'CONFLICT';
        case 'INVALID_INPUT':
            return 'INVALID_INPUT';
        default:
            return 'UNEXPECTED';
    }
};

const measurementFor = (
    envelope: ShareContentEnvelope,
    ownerEncryptedRecovery: Record<string, unknown>
): { contentBytes: number; recoveryBytes: number; recoveryHash: string } => {
    const contentBytes = decodedBase64UrlByteLength(envelope.ct);

    if (contentBytes === null) fail('INVALID_INPUT', 'envelope ciphertext must be base64url');

    const recoveryBytes = utf8ByteLength(JSON.stringify(ownerEncryptedRecovery));
    const recoveryHash = createHash('sha256')
        .update(canonicalizeJson(ownerEncryptedRecovery))
        .digest('hex');

    return { contentBytes, recoveryBytes, recoveryHash };
};

const contentBindingFor = (
    envelope: ShareContentEnvelope,
    ownerEncryptedRecovery: Record<string, unknown>
): {
    contentHash: string;
    contentBytes: number;
    recoveryHash: string;
    recoveryBytes: number;
} => ({
    contentHash: computeShareLinkPayloadHash({ envelope, ownerEncryptedRecovery }),
    ...measurementFor(envelope, ownerEncryptedRecovery),
});

export const createShareLinkCoordinator = (
    dependencies: ShareLinkCoordinatorDependencies
): ShareLinkCoordinator => {
    const { repository, client } = dependencies;
    const now = (): Date => dependencies.now?.() ?? new Date();

    // Fail-closed fallback policy: no views, 30 days, age unknown. Production
    // wiring injects the authoritative source; a missing resolver must never
    // behave as a known unmanaged adult.
    const policyResolver: ShareLinkPolicyResolver =
        dependencies.policyResolver ??
        createShareLinkPolicyResolver({
            resolveOwnerAge: async () => 'unknown',
            isManaged: async () => false,
        });

    const finalizeOrPending = async (
        reservation: ShareLinkReservationRecord,
        objectRef: string | null
    ): Promise<ShareLinkCommitResult> => {
        try {
            const finalized = await repository.finalizeReservation({
                namespace: reservation.namespace,
                ownerProfileId: reservation.ownerProfileId,
                shareId: reservation.shareId,
                operationId: reservation.operationId,
                objectRef,
                generation: reservation.generation,
                leaseOwner: reservation.leaseOwner,
                verifiedContentHash:
                    objectRef === null || reservation.contentHash === null
                        ? undefined
                        : reservation.contentHash,
                now: now(),
            });

            return finalized.outcome === 'finalized'
                ? { status: 'committed', share: finalized.share }
                : { status: 'replayed', share: finalized.share, recorded: finalized.share };
        } catch (error) {
            if (isShareLinkRepositoryError(error)) throw toCoordinatorError(error);

            // An unexpected failure may have committed the swap but lost the
            // response. Keep the reservation resumable; a stateless retry will
            // re-stat and finalize idempotently.
            return {
                status: 'pending',
                reservation,
                reason: 'finalize_unavailable',
            };
        }
    };

    const abandonBestEffort = async (reservation: ShareLinkReservationRecord): Promise<void> => {
        try {
            await repository.abandonReservation({
                namespace: reservation.namespace,
                ownerProfileId: reservation.ownerProfileId,
                shareId: reservation.shareId,
                operationId: reservation.operationId,
                generation: reservation.generation,
                leaseOwner: reservation.leaseOwner,
                now: now(),
            });
        } catch {
            // The reservation lease still bounds a later supersede; never hide the
            // original failure that triggered the abandon.
        }
    };

    const driveContentReservation = async (
        reservation: ShareLinkReservationRecord,
        payload: ShareContentPayload
    ): Promise<ShareLinkCommitResult> => {
        if (reservation.objectRef === null || reservation.contentVersion === null) {
            fail('PRECONDITION_FAILED', 'content reservation is missing its object binding');
        }

        const tuple = {
            namespace: reservation.namespace,
            ownerProfileId: reservation.ownerProfileId,
            shareId: reservation.shareId,
            contentVersion: reservation.contentVersion,
            objectId: reservation.objectRef,
            operationId: reservation.operationId,
        };

        const upload = await client.put({
            ...tuple,
            envelope: payload.envelope,
            ownerEncryptedRecovery: payload.ownerEncryptedRecovery,
        });

        if (!upload.ok) {
            if (isRetryableClientError(upload.error)) {
                return { status: 'pending', reservation, reason: 'upload_unavailable' };
            }

            // Deterministic rejection: release the reservation and never hide the
            // failure behind a pending state. The exact object is queued for
            // tracked cleanup by abandon.
            await abandonBestEffort(reservation);
            fail(mapClientErrorCode(upload.error), 'LearnCloud rejected the content upload');
        }

        const stat = await client.stat(tuple);

        if (!stat.ok) {
            if (stat.error === 'NOT_FOUND') {
                return { status: 'pending', reservation, reason: 'stat_missing' };
            }
            if (isRetryableClientError(stat.error)) {
                return { status: 'pending', reservation, reason: 'stat_unavailable' };
            }

            // Do not finalize on a failed stat, and do not destroy the staged
            // object on an ambiguous response.
            fail(mapClientErrorCode(stat.error), 'LearnCloud stat failed');
        }

        if (!verifyActiveStat(stat.value, reservation)) {
            if (stat.value.kind === 'tombstone') {
                await abandonBestEffort(reservation);
                fail('CONFLICT', 'the reserved object is a permanent tombstone');
            }

            return { status: 'pending', reservation, reason: 'stat_mismatch' };
        }

        return finalizeOrPending(reservation, reservation.objectRef);
    };

    const handleReserveResult = async (
        result: Awaited<
            ReturnType<ShareLinkCoordinatorDependencies['repository']['reserveCreate']>
        >,
        payload?: ShareContentPayload
    ): Promise<ShareLinkCommitResult> => {
        if (result.outcome === 'already_committed') {
            return { status: 'replayed', share: result.current, recorded: result.recorded };
        }

        if (!payload || result.reservation.objectRef === null) {
            return finalizeOrPending(result.reservation, null);
        }

        return driveContentReservation(result.reservation, payload);
    };

    return {
        createShareLink: async (request, context) => {
            const owner = parseOwnerContext(context);
            const parsed = CreateShareLinkInputValidator.safeParse(request);

            if (!parsed.success) fail('INVALID_INPUT', 'invalid create share-link request');

            const value = parsed.data;
            const content = contentBindingFor(value.envelope, value.ownerEncryptedRecovery);
            // Caller intent only: `expiresAt` remains exactly as supplied
            // (including omitted) so a later-clock retry of an omitted-expiry
            // create replays the original operation instead of deriving a new one.
            const requestHash = computeShareLinkRequestHash(
                'create',
                value as unknown as Record<string, unknown>
            );
            const policy = await policyResolver.resolve(owner.ownerProfileId);
            const effectiveExpiresAt = resolveShareLinkExpiry(policy, value.expiresAt, now());
            const passcodeHash = value.passcode ? await hashSharePasscode(value.passcode) : null;

            let reserved;

            try {
                reserved = await repository.reserveCreate({
                    namespace: owner.namespace,
                    ownerProfileId: owner.ownerProfileId,
                    clientRequestId: value.clientRequestId,
                    shareId: value.id,
                    title: value.title,
                    note: value.note ?? null,
                    expiresAt: effectiveExpiresAt,
                    selectedCount: value.selectedCount,
                    passcodeHash,
                    // Notification consent cannot override the same trusted
                    // policy that disables view counting for minors/unknown age.
                    notifyOnView: value.notifyOnView && policy.viewCountingEnabled,
                    content,
                    requestHash,
                    policy,
                    leaseOwner: dependencies.leaseOwner,
                    leaseMs: dependencies.leaseMs,
                    now: now(),
                });
            } catch (error) {
                throw toCoordinatorError(error);
            }

            return handleReserveResult(reserved, {
                envelope: value.envelope,
                ownerEncryptedRecovery: value.ownerEncryptedRecovery,
            });
        },

        updateShareLink: async (request, context) => {
            const owner = parseOwnerContext(context);
            const parsed = UpdateShareLinkInputValidator.safeParse(request);

            if (!parsed.success) fail('INVALID_INPUT', 'invalid update share-link request');

            const value = parsed.data;
            const hasContent = value.envelope !== undefined;
            const requestHash = computeShareLinkRequestHash(
                'update',
                value as unknown as Record<string, unknown>
            );
            // Policy is re-resolved on every mutation, even a metadata-only one,
            // so a profile that became managed stops accumulating views going
            // forward. An omitted `expiresAt` leaves the existing expiry intact.
            const policy = await policyResolver.resolve(owner.ownerProfileId);

            let reserved;

            try {
                reserved = await repository.reserveReplacement({
                    namespace: owner.namespace,
                    ownerProfileId: owner.ownerProfileId,
                    clientRequestId: value.clientRequestId,
                    shareId: value.id,
                    expectedVersion: value.expectedVersion,
                    requestHash,
                    leaseOwner: dependencies.leaseOwner,
                    leaseMs: dependencies.leaseMs,
                    now: now(),
                    ...(hasContent
                        ? {
                              content: {
                                  ...contentBindingFor(
                                      value.envelope!,
                                      value.ownerEncryptedRecovery!
                                  ),
                                  contentVersion: value.contentVersion!,
                                  selectedCount: value.selectedCount!,
                              },
                          }
                        : {}),
                    ...(value.title !== undefined ? { title: value.title } : {}),
                    ...(value.note !== undefined ? { note: value.note } : {}),
                    ...(value.expiresAt !== undefined ? { expiresAt: value.expiresAt } : {}),
                    policy,
                });
            } catch (error) {
                throw toCoordinatorError(error);
            }

            if (reserved.outcome === 'already_committed') {
                return {
                    status: 'replayed',
                    share: reserved.current,
                    recorded: reserved.recorded,
                };
            }

            if (!hasContent || reserved.reservation.objectRef === null) {
                // Metadata-only revision: never uploads, preserves the original
                // object operation id via the C3 finalize path.
                return finalizeOrPending(reserved.reservation, null);
            }

            return driveContentReservation(reserved.reservation, {
                envelope: value.envelope!,
                ownerEncryptedRecovery: value.ownerEncryptedRecovery!,
            });
        },

        revokeShareLink: async (request, context) => {
            const owner = parseOwnerContext(context);

            if (!isPlainObject(request)) fail('INVALID_INPUT', 'invalid revoke request');

            const allowedKeys = ['id', 'expectedVersion', 'clientRequestId'];

            if (Object.keys(request).some(key => !allowedKeys.includes(key))) {
                fail('INVALID_INPUT', 'invalid revoke request');
            }
            if (!ShareLinkIdValidator.safeParse(request.id).success) {
                fail('INVALID_INPUT', 'invalid share id');
            }
            if (
                request.expectedVersion !== undefined &&
                (!Number.isSafeInteger(request.expectedVersion) ||
                    (request.expectedVersion as number) < 1)
            ) {
                fail('INVALID_INPUT', 'invalid expectedVersion');
            }
            if (
                request.clientRequestId !== undefined &&
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    String(request.clientRequestId)
                )
            ) {
                fail('INVALID_INPUT', 'invalid clientRequestId');
            }

            const clientRequestId = request.clientRequestId as string | undefined;
            const requestHash = clientRequestId
                ? computeShareLinkRequestHash('revoke', {
                      id: request.id,
                      expectedVersion: request.expectedVersion,
                  })
                : undefined;

            try {
                const revoked = await repository.revokeShareLink({
                    namespace: owner.namespace,
                    ownerProfileId: owner.ownerProfileId,
                    shareId: request.id as string,
                    expectedVersion: request.expectedVersion as number | undefined,
                    clientRequestId,
                    requestHash,
                    now: now(),
                });

                return {
                    status: revoked.outcome,
                    share: revoked.share,
                    cleanupQueuedFor: revoked.cleanupQueuedFor,
                };
            } catch (error) {
                throw toCoordinatorError(error);
            }
        },

        resumePendingOperation: async (pending, content): Promise<ShareLinkResumeResult> => {
            const reservation = pending.reservation;

            if (reservation.objectRef === null || reservation.contentVersion === null) {
                const finalized = await finalizeOrPending(reservation, null);

                return finalized.status === 'pending'
                    ? { status: 'pending', reservation, reason: finalized.reason }
                    : finalized;
            }

            if (content) {
                const result = await driveContentReservation(reservation, content);

                return result.status === 'pending'
                    ? { status: 'pending', reservation, reason: result.reason }
                    : result;
            }

            const tuple = {
                namespace: reservation.namespace,
                ownerProfileId: reservation.ownerProfileId,
                shareId: reservation.shareId,
                contentVersion: reservation.contentVersion,
                objectId: reservation.objectRef,
                operationId: reservation.operationId,
            };

            const stat = await client.stat(tuple);

            if (stat.ok) {
                if (verifyActiveStat(stat.value, reservation)) {
                    const finalized = await finalizeOrPending(reservation, reservation.objectRef);

                    return finalized.status === 'pending'
                        ? { status: 'pending', reservation, reason: finalized.reason }
                        : finalized;
                }

                if (stat.value.kind === 'tombstone') {
                    const abandoned = await repository.abandonReservation({
                        namespace: reservation.namespace,
                        ownerProfileId: reservation.ownerProfileId,
                        shareId: reservation.shareId,
                        operationId: reservation.operationId,
                        generation: reservation.generation,
                        leaseOwner: reservation.leaseOwner,
                        now: now(),
                    });

                    return {
                        status: 'abandoned',
                        cleanupQueuedFor:
                            abandoned.outcome === 'abandoned' ? abandoned.cleanupQueuedFor : null,
                    };
                }

                // Active but divergent: never finalize and never destroy bytes.
                return { status: 'pending', reservation, reason: 'stat_mismatch' };
            }

            if (stat.error === 'NOT_FOUND') {
                const abandoned = await repository.abandonReservation({
                    namespace: reservation.namespace,
                    ownerProfileId: reservation.ownerProfileId,
                    shareId: reservation.shareId,
                    operationId: reservation.operationId,
                    generation: reservation.generation,
                    leaseOwner: reservation.leaseOwner,
                    now: now(),
                });

                return {
                    status: 'abandoned',
                    cleanupQueuedFor:
                        abandoned.outcome === 'abandoned' ? abandoned.cleanupQueuedFor : null,
                };
            }

            if (isRetryableClientError(stat.error)) {
                return { status: 'pending', reservation, reason: 'stat_unavailable' };
            }

            fail(mapClientErrorCode(stat.error), 'LearnCloud stat failed during recovery');
        },

        abandonPendingOperation: async pending =>
            repository.abandonReservation({
                namespace: pending.reservation.namespace,
                ownerProfileId: pending.reservation.ownerProfileId,
                shareId: pending.reservation.shareId,
                operationId: pending.reservation.operationId,
                generation: pending.reservation.generation,
                leaseOwner: pending.reservation.leaseOwner,
                now: now(),
            }),

        getShareLink: async (shareId, context) => {
            const owner = parseOwnerContext(context);

            return repository.getShareLink({
                shareId,
                namespace: owner.namespace,
                ownerProfileId: owner.ownerProfileId,
            });
        },

        getActiveShareContent: async (shareId, context) => {
            const owner = parseOwnerContext(context);

            return repository.getCurrentShareContent({
                shareId,
                namespace: owner.namespace,
                ownerProfileId: owner.ownerProfileId,
                now: now(),
            });
        },

        fetchShareContent: async (shareId, context) => {
            const owner = parseOwnerContext(context);
            const current = await repository.getCurrentShareContent({
                shareId,
                namespace: owner.namespace,
                ownerProfileId: owner.ownerProfileId,
                now: now(),
            });

            if (current.state !== 'active') {
                return {
                    ok: false,
                    error: 'NOT_FOUND',
                };
            }

            // Use the object's ORIGINAL operation id, never the latest metadata
            // operation id, for read/stat/delete of an immutable object.
            const result = await client.get({
                namespace: current.namespace,
                ownerProfileId: current.ownerProfileId,
                shareId: current.shareId,
                contentVersion: current.contentVersion,
                objectId: current.objectRef,
                operationId: current.operationId,
            });
            if (!result.ok) return result;

            // The remote read can overlap a stop, expiry or replacement. Only
            // release bytes if the same committed snapshot still permits it.
            const latest = await repository.getCurrentShareContent({
                shareId,
                namespace: owner.namespace,
                ownerProfileId: owner.ownerProfileId,
                now: now(),
            });
            if (
                latest.state !== 'active' ||
                latest.version !== current.version ||
                latest.objectRef !== current.objectRef ||
                latest.operationId !== current.operationId ||
                latest.contentVersion !== current.contentVersion
            ) {
                return { ok: false, error: 'NOT_FOUND' };
            }
            return result;
        },

        readOwnerRecovery: async (shareId, context) => {
            const owner = parseOwnerContext(context);
            // Owner recovery deliberately admits retained *expired* content so the
            // owner can extend/edit it. Stopped, staging, content_missing and
            // missing shares still fail closed here.
            const current = await repository.getCurrentShareContent({
                shareId,
                namespace: owner.namespace,
                ownerProfileId: owner.ownerProfileId,
                now: now(),
                allowExpired: true,
            });

            if (current.state !== 'active') {
                return { ok: false, error: 'NOT_FOUND' };
            }

            const result = await client.readRecovery({
                namespace: current.namespace,
                ownerProfileId: current.ownerProfileId,
                shareId: current.shareId,
                contentVersion: current.contentVersion,
                objectId: current.objectRef,
                operationId: current.operationId,
            });

            if (!result.ok) return result;

            // The remote read can overlap a stop/replacement. Only release the
            // recovery for the same immutable committed tuple that authorized it.
            const latest = await repository.getCurrentShareContent({
                shareId,
                namespace: owner.namespace,
                ownerProfileId: owner.ownerProfileId,
                now: now(),
                allowExpired: true,
            });
            if (
                latest.state !== 'active' ||
                latest.version !== current.version ||
                latest.objectRef !== current.objectRef ||
                latest.operationId !== current.operationId ||
                latest.contentVersion !== current.contentVersion
            ) {
                return { ok: false, error: 'NOT_FOUND' };
            }

            return result;
        },
    };
};

export type { PendingShareContentOperation };
