import type { ShareLinkOperationKind } from './types';

/**
 * Bounded discovery batch for durable reservation recovery.
 *
 * The runner must never enumerate an unbounded set: an operator gets one capped
 * pass, and any remaining expired work is picked up by a later pass after its
 * lease lapses again. The hard cap matches the cleanup-job batch cap.
 */
export const SHARE_LINK_RECOVERY_DEFAULT_BATCH = 25;
export const SHARE_LINK_RECOVERY_MAX_BATCH = 100;

/** Clamps a caller-supplied recovery batch into the documented 1..100 window. */
export const clampShareLinkRecoveryBatch = (limit: number | undefined): number => {
    if (!Number.isSafeInteger(limit) || (limit as number) < 1) {
        return SHARE_LINK_RECOVERY_DEFAULT_BATCH;
    }

    return Math.min(limit as number, SHARE_LINK_RECOVERY_MAX_BATCH);
};

/** Exact scoped recovery key, always derived from persisted Brain state. */
export type ShareLinkRecoveryKeyShape = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    operationId: string;
};

/** Outcome of checking one persisted record against an exact scoped key. */
export type ShareLinkRecoveryBindingCheck = 'ok' | 'binding_mismatch' | 'malformed_binding';

const RESERVATION_OP_KINDS: readonly ShareLinkOperationKind[] = ['create', 'update'];
const OPERATION_STATUSES = ['in_progress', 'committed', 'abandoned'] as const;

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value);

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0;

const isPositiveSafeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) >= 1;

const isNonNegativeSafeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) >= 0;

const isTimestamp = (value: unknown): value is string =>
    typeof value === 'string' && Number.isFinite(Date.parse(value));

const isAbsentOrNull = (value: unknown): boolean => value === undefined || value === null;

/**
 * Validates a persisted `:ShareLinkReservation` against an exact scoped key.
 *
 * Any missing/typed-wrong core field, an inconsistent object/content tuple, or a
 * content binding without its hashes and byte counts is `malformed_binding` and
 * must never be reclaimed. A well-formed record that simply does not match the
 * key is `binding_mismatch`, which is an expected stale/foreign selection rather
 * than corruption.
 */
export const classifyReservationBinding = (
    props: Record<string, unknown>,
    key: ShareLinkRecoveryKeyShape
): ShareLinkRecoveryBindingCheck => {
    if (
        !isNonEmptyString(props.shareId) ||
        !isNonEmptyString(props.namespace) ||
        !isNonEmptyString(props.ownerProfileId) ||
        !isNonEmptyString(props.operationId) ||
        !isNonEmptyString(props.clientRequestId) ||
        !isNonEmptyString(props.leaseOwner) ||
        !isPositiveSafeInteger(props.generation) ||
        !isPositiveSafeInteger(props.baseVersion) ||
        !isPositiveSafeInteger(props.baseContentVersion) ||
        !isTimestamp(props.leaseExpiresAt)
    ) {
        return 'malformed_binding';
    }

    if (!isOneOf(props.opKind, RESERVATION_OP_KINDS)) return 'malformed_binding';

    const hasObject = !isAbsentOrNull(props.objectRef);
    const hasContentVersion = !isAbsentOrNull(props.contentVersion);

    if (hasObject !== hasContentVersion) return 'malformed_binding';

    if (hasObject) {
        if (
            !isNonEmptyString(props.objectRef) ||
            !isPositiveSafeInteger(props.contentVersion) ||
            !isNonEmptyString(props.contentHash) ||
            !isNonNegativeSafeInteger(props.contentBytes) ||
            !isNonEmptyString(props.recoveryHash) ||
            !isNonNegativeSafeInteger(props.recoveryBytes)
        ) {
            return 'malformed_binding';
        }
    } else if (
        !isAbsentOrNull(props.contentHash) ||
        !isAbsentOrNull(props.contentBytes) ||
        !isAbsentOrNull(props.recoveryHash) ||
        !isAbsentOrNull(props.recoveryBytes)
    ) {
        return 'malformed_binding';
    }

    if (
        props.namespace !== key.namespace ||
        props.ownerProfileId !== key.ownerProfileId ||
        props.shareId !== key.shareId ||
        props.operationId !== key.operationId
    ) {
        return 'binding_mismatch';
    }

    return 'ok';
};

/** Expected binding for a reservation's idempotency `:ShareLinkOperation` record. */
export type ShareLinkRecoveryOperationExpectation = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    operationId: string;
    opKind?: string;
    clientRequestId?: string;
};

/**
 * Validates a persisted `:ShareLinkOperation` against the reservation it must
 * drive. A missing/wrong-typed field or an unknown status is `malformed_binding`;
 * a well-formed record bound to a different operation is `binding_mismatch`.
 */
export const classifyOperationBinding = (
    props: Record<string, unknown>,
    expected: ShareLinkRecoveryOperationExpectation
): ShareLinkRecoveryBindingCheck => {
    if (
        !isNonEmptyString(props.namespace) ||
        !isNonEmptyString(props.ownerProfileId) ||
        !isNonEmptyString(props.shareId) ||
        !isNonEmptyString(props.operationId) ||
        !isNonEmptyString(props.opKind) ||
        !isNonEmptyString(props.clientRequestId)
    ) {
        return 'malformed_binding';
    }

    if (!isOneOf(props.status, OPERATION_STATUSES)) return 'malformed_binding';

    if (
        props.namespace !== expected.namespace ||
        props.ownerProfileId !== expected.ownerProfileId ||
        props.shareId !== expected.shareId ||
        props.operationId !== expected.operationId
    ) {
        return 'binding_mismatch';
    }

    if (expected.opKind !== undefined && props.opKind !== expected.opKind) {
        return 'binding_mismatch';
    }

    if (
        expected.clientRequestId !== undefined &&
        props.clientRequestId !== expected.clientRequestId
    ) {
        return 'binding_mismatch';
    }

    return 'ok';
};
