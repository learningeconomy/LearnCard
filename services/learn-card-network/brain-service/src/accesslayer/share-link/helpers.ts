import { randomBytes, randomUUID } from 'node:crypto';

import type { ShareLinkOperationKind } from '@helpers/share-link-lifecycle';

import type { ShareContentState, ShareLinkRecord, ShareLinkStatus } from '../../models/ShareLink';
import type { Neo4jQueryResult, ShareLinkTransaction } from './transaction';
import type {
    ShareContentCleanupJobRecord,
    ShareLinkOperationRecord,
    ShareLinkOperationStatus,
    ShareLinkReservationRecord,
} from './types';

type Neo4jNodeLike = {
    properties?: Record<string, unknown>;
};

/** Converts a neo4j-driver Integer (or nested array) to plain JS values. */
export const normalizeNeo4jValue = (value: unknown): unknown => {
    if (value === undefined || value === null) return null;

    if (typeof value === 'object') {
        const maybeInteger = value as { toNumber?: () => number };

        if (typeof maybeInteger.toNumber === 'function') {
            return maybeInteger.toNumber();
        }
    }

    if (Array.isArray(value)) return value.map(normalizeNeo4jValue);

    return value;
};

export const normalizeProperties = (props: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(
        Object.entries(props).map(([key, value]) => [key, normalizeNeo4jValue(value)])
    );

/** Reads `rowIndex`'s node under `key` and returns normalized properties, or null. */
export const readNodeProperties = (
    result: Neo4jQueryResult,
    key: string,
    rowIndex = 0
): Record<string, unknown> | null => {
    const value = result.records[rowIndex]?.get(key);

    if (!value || typeof value !== 'object') return null;

    const props = (value as Neo4jNodeLike).properties;

    return props ? normalizeProperties(props) : null;
};

const SHARE_LINK_STATUSES: readonly ShareLinkStatus[] = ['pending', 'active', 'stopped'];
const SHARE_CONTENT_STATES: readonly ShareContentState[] = [
    'staging',
    'finalized',
    'content_missing',
];
const OPERATION_KINDS: readonly ShareLinkOperationKind[] = ['create', 'update', 'revoke'];
const OPERATION_STATUSES: readonly ShareLinkOperationStatus[] = [
    'in_progress',
    'committed',
    'abandoned',
];
const CLEANUP_REASONS = ['superseded', 'abandoned', 'stopped'] as const;
const CLEANUP_STATUSES = ['queued', 'claimed', 'completed'] as const;

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value);

const asString = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null =>
    typeof value === 'string' ? value : null;

const asNumber = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asNullableNumber = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

const asBoolean = (value: unknown, fallback: boolean): boolean =>
    typeof value === 'boolean' ? value : fallback;

const asNullableBoolean = (value: unknown): boolean | null =>
    typeof value === 'boolean' ? value : null;

export const toShareLinkRecord = (props: Record<string, unknown>): ShareLinkRecord => ({
    id: asString(props.id),
    namespace: asString(props.namespace),
    ownerProfileId: asString(props.ownerProfileId),
    version: asNumber(props.version, 1),
    contentVersion: asNumber(props.contentVersion, 1),
    generation: asNumber(props.generation, 1),
    status: isOneOf(props.status, SHARE_LINK_STATUSES) ? props.status : 'pending',
    contentState: isOneOf(props.contentState, SHARE_CONTENT_STATES)
        ? props.contentState
        : 'staging',
    activeObjectRef: asNullableString(props.activeObjectRef),
    activeObjectOperationId: asNullableString(props.activeObjectOperationId),
    activeContentHash: asNullableString(props.activeContentHash),
    activeContentBytes: asNullableNumber(props.activeContentBytes),
    activeRecoveryHash: asNullableString(props.activeRecoveryHash),
    lastOperationId: asNullableString(props.lastOperationId),
    createdByClientRequestId: asNullableString(props.createdByClientRequestId),
    title: asString(props.title),
    note: asNullableString(props.note),
    selectedCount: asNumber(props.selectedCount, 1),
    expiresAt: asNullableString(props.expiresAt),
    stoppedAt: asNullableString(props.stoppedAt),
    viewCount: asNumber(props.viewCount, 0),
    lastViewedAt: asNullableString(props.lastViewedAt),
    minorPolicyIsMinor: asNullableBoolean(props.minorPolicyIsMinor),
    minorPolicyResolved: asBoolean(props.minorPolicyResolved, false),
    minorPolicyDefaultExpiryDays: asNumber(props.minorPolicyDefaultExpiryDays, 30),
    minorPolicyViewCountingEnabled: asBoolean(props.minorPolicyViewCountingEnabled, false),
    createdAt: asString(props.createdAt),
    updatedAt: asString(props.updatedAt),
});

export const toShareLinkReservationRecord = (
    props: Record<string, unknown>
): ShareLinkReservationRecord => ({
    shareId: asString(props.shareId),
    namespace: asString(props.namespace),
    ownerProfileId: asString(props.ownerProfileId),
    opKind: isOneOf(props.opKind, OPERATION_KINDS) ? props.opKind : 'create',
    clientRequestId: asString(props.clientRequestId),
    requestHash: asString(props.requestHash),
    operationId: asString(props.operationId),
    objectRef: asNullableString(props.objectRef),
    contentVersion: asNullableNumber(props.contentVersion),
    baseVersion: asNumber(props.baseVersion, 1),
    baseContentVersion: asNumber(props.baseContentVersion, 1),
    contentHash: asNullableString(props.contentHash),
    contentBytes: asNullableNumber(props.contentBytes),
    recoveryHash: asNullableString(props.recoveryHash),
    recoveryBytes: asNullableNumber(props.recoveryBytes),
    title: asString(props.title),
    note: asNullableString(props.note),
    expiresAt: asNullableString(props.expiresAt),
    selectedCount: asNumber(props.selectedCount, 1),
    policy: {
        isMinor: asNullableBoolean(props.policyIsMinor),
        policyResolved: asBoolean(props.policyResolved, false),
        defaultExpiryDays: asNumber(props.policyDefaultExpiryDays, 30) === 365 ? 365 : 30,
        viewCountingEnabled: asBoolean(props.policyViewCountingEnabled, false),
    },
    generation: asNumber(props.generation, 1),
    leaseOwner: asString(props.leaseOwner),
    leaseExpiresAt: asString(props.leaseExpiresAt),
    createdAt: asString(props.createdAt),
    updatedAt: asString(props.updatedAt),
});

export const toShareLinkOperationRecord = (
    props: Record<string, unknown>
): ShareLinkOperationRecord => ({
    namespace: asString(props.namespace),
    ownerProfileId: asString(props.ownerProfileId),
    opKind: isOneOf(props.opKind, OPERATION_KINDS) ? props.opKind : 'create',
    clientRequestId: asString(props.clientRequestId),
    operationId: asString(props.operationId),
    shareId: asString(props.shareId),
    requestHash: asString(props.requestHash),
    status: isOneOf(props.status, OPERATION_STATUSES) ? props.status : 'in_progress',
    resultJson: asNullableString(props.resultJson),
    resultVersion: asNullableNumber(props.resultVersion),
    createdAt: asString(props.createdAt),
    updatedAt: asString(props.updatedAt),
    pruneAfter: asString(props.pruneAfter),
});

export const toShareContentCleanupJobRecord = (
    props: Record<string, unknown>
): ShareContentCleanupJobRecord => ({
    objectRef: asString(props.objectRef),
    operationId: asString(props.operationId),
    namespace: asString(props.namespace),
    ownerProfileId: asString(props.ownerProfileId),
    shareId: asString(props.shareId),
    contentVersion: asNumber(props.contentVersion, 0),
    reason: isOneOf(props.reason, CLEANUP_REASONS) ? props.reason : 'superseded',
    status: isOneOf(props.status, CLEANUP_STATUSES) ? props.status : 'queued',
    attempts: asNumber(props.attempts, 0),
    nextAttemptAt: asString(props.nextAttemptAt),
    claimToken: asNullableString(props.claimToken),
    claimedBy: asNullableString(props.claimedBy),
    claimExpiresAt: asNullableString(props.claimExpiresAt),
    lastError: asNullableString(props.lastError),
    createdAt: asString(props.createdAt),
    updatedAt: asString(props.updatedAt),
    completedAt: asNullableString(props.completedAt),
});

/** 32-byte opaque immutable LearnCloud object id (43-char base64url). */
export const generateObjectRef = (): string => randomBytes(32).toString('base64url');

/** Opaque, unique operation id used to bind a reservation to a worker's finalize. */
export const generateOperationId = (): string => randomUUID();

/** Opaque cleanup claim fence; a stale claimant can no longer complete the job. */
export const generateClaimToken = (): string => randomUUID();

export type ShareLinkOperationKey = {
    namespace: string;
    ownerProfileId: string;
    opKind: ShareLinkOperationKind;
    clientRequestId: string;
};

/**
 * Acquires the share write lock.
 *
 * The property write is deliberate: once it commits, every other lifecycle
 * transaction that targets this share blocks until this transaction ends, so a
 * caller always reads status/version/reservation state under the lock.
 */
export const lockShare = async (
    tx: ShareLinkTransaction,
    shareId: string
): Promise<Record<string, unknown> | null> => {
    const result = await tx.run(
        `MATCH (s:ShareLink {id: $shareId})
         SET s.lockTick = coalesce(s.lockTick, 0) + 1
         RETURN s`,
        { shareId }
    );

    return readNodeProperties(result, 's');
};

export const readShareById = async (
    tx: ShareLinkTransaction,
    shareId: string
): Promise<Record<string, unknown> | null> => {
    const result = await tx.run('MATCH (s:ShareLink {id: $shareId}) RETURN s LIMIT 1', {
        shareId,
    });

    return readNodeProperties(result, 's');
};

export const readReservation = async (
    tx: ShareLinkTransaction,
    shareId: string
): Promise<Record<string, unknown> | null> => {
    const result = await tx.run(
        'MATCH (r:ShareLinkReservation {shareId: $shareId}) RETURN r LIMIT 1',
        { shareId }
    );

    return readNodeProperties(result, 'r');
};

export const readOperation = async (
    tx: ShareLinkTransaction,
    key: ShareLinkOperationKey
): Promise<Record<string, unknown> | null> => {
    const result = await tx.run(
        `MATCH (o:ShareLinkOperation {
            namespace: $namespace,
            ownerProfileId: $ownerProfileId,
            opKind: $opKind,
            clientRequestId: $clientRequestId
         })
         RETURN o LIMIT 1`,
        key
    );

    return readNodeProperties(result, 'o');
};

export const readOperationByOperationId = async (
    tx: ShareLinkTransaction,
    operationId: string
): Promise<Record<string, unknown> | null> => {
    const result = await tx.run(
        'MATCH (o:ShareLinkOperation {operationId: $operationId}) RETURN o LIMIT 1',
        { operationId }
    );

    return readNodeProperties(result, 'o');
};

export type WriteOperationInput = ShareLinkOperationKey & {
    operationId: string;
    shareId: string;
    requestHash: string;
    now: string;
    pruneAfter: string;
};

/**
 * Creates or re-arms the idempotency record for an in-flight operation.
 *
 * The caller has already validated the request hash for an existing record, so
 * overwriting the stored hash here is only a re-drive of an abandoned record.
 */
export const writeOperationInProgress = async (
    tx: ShareLinkTransaction,
    input: WriteOperationInput
): Promise<void> => {
    await tx.run(
        `MERGE (o:ShareLinkOperation {
            namespace: $namespace,
            ownerProfileId: $ownerProfileId,
            opKind: $opKind,
            clientRequestId: $clientRequestId
         })
         ON CREATE SET o.createdAt = $now, o.pruneAfter = $pruneAfter
         SET o.operationId = $operationId,
             o.shareId = $shareId,
             o.requestHash = $requestHash,
             o.status = 'in_progress',
             o.resultJson = null,
             o.resultVersion = null,
             o.updatedAt = $now`,
        input
    );
};

export const markOperationCommitted = async (
    tx: ShareLinkTransaction,
    input: ShareLinkOperationKey & {
        operationId: string;
        resultJson: string;
        resultVersion: number;
        now: string;
        pruneAfter: string;
    }
): Promise<void> => {
    await tx.run(
        `MATCH (o:ShareLinkOperation {
            namespace: $namespace,
            ownerProfileId: $ownerProfileId,
            opKind: $opKind,
            clientRequestId: $clientRequestId
         })
         SET o.operationId = $operationId,
             o.status = 'committed',
             o.resultJson = $resultJson,
             o.resultVersion = $resultVersion,
             o.updatedAt = $now,
             o.pruneAfter = $pruneAfter`,
        input
    );
};

export const markOperationAbandoned = async (
    tx: ShareLinkTransaction,
    key: ShareLinkOperationKey & { now: string }
): Promise<void> => {
    await tx.run(
        `MATCH (o:ShareLinkOperation {
            namespace: $namespace,
            ownerProfileId: $ownerProfileId,
            opKind: $opKind,
            clientRequestId: $clientRequestId
         })
         SET o.status = 'abandoned', o.updatedAt = $now`,
        key
    );
};

export const deleteReservation = async (
    tx: ShareLinkTransaction,
    shareId: string
): Promise<void> => {
    await tx.run('MATCH (r:ShareLinkReservation {shareId: $shareId}) DELETE r', { shareId });
};

export type EnqueueCleanupJobInput = {
    objectRef: string;
    operationId: string;
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    reason: 'superseded' | 'abandoned' | 'stopped';
    now: string;
};

/**
 * Durable, exact-object cleanup enqueue. `MERGE` on the unique `objectRef` makes
 * a retry idempotent; the repository never deletes LearnCloud content itself.
 */
export const enqueueCleanupJob = async (
    tx: ShareLinkTransaction,
    input: EnqueueCleanupJobInput
): Promise<void> => {
    await tx.run(
        `MERGE (c:ShareContentCleanupJob {objectRef: $objectRef})
         ON CREATE SET c.namespace = $namespace,
             c.ownerProfileId = $ownerProfileId,
             c.shareId = $shareId,
             c.contentVersion = $contentVersion,
             c.operationId = $operationId,
             c.reason = $reason,
             c.status = 'queued',
             c.attempts = 0,
             c.nextAttemptAt = $now,
             c.claimToken = null,
             c.claimedBy = null,
             c.claimExpiresAt = null,
             c.lastError = null,
             c.completedAt = null,
             c.createdAt = $now,
             c.updatedAt = $now`,
        input
    );
};
