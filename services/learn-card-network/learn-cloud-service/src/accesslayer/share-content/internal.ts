import type { Filter } from 'mongodb';

import {
    ShareContentObjectBindingValidator,
    type MongoShareContentActive,
    type MongoShareContentDocument,
    type MongoShareContentTombstone,
    type ShareContentObjectBinding,
} from '@models';

import type { ShareContentActiveSummary, ShareContentTombstoneSummary } from './types';

/**
 * Bounded retry count for the atomic insert/delete race loops. The state machine
 * is monotonic (active -> tombstone, never back), so the loop always settles; the
 * bound protects against a pathological unique-index/driver anomaly rather than
 * ordinary contention.
 */
export const MAX_SHARE_CONTENT_ATTEMPTS = 5;

export const parseShareContentBinding = (raw: unknown): ShareContentObjectBinding | null => {
    const parsed = ShareContentObjectBindingValidator.safeParse(raw);

    return parsed.success ? parsed.data : null;
};

/** Exact six-field binding filter. Missing any field would widen the query. */
export const shareContentBindingFilter = (
    binding: ShareContentObjectBinding
): Filter<MongoShareContentDocument> => ({
    namespace: binding.namespace,
    ownerProfileId: binding.ownerProfileId,
    shareId: binding.shareId,
    contentVersion: binding.contentVersion,
    objectId: binding.objectId,
    operationId: binding.operationId,
});

/** Identity filter for the unique `(namespace, objectId)` index. */
export const shareContentIdentityFilter = (
    binding: Pick<ShareContentObjectBinding, 'namespace' | 'objectId'>
): Filter<MongoShareContentDocument> => ({
    namespace: binding.namespace,
    objectId: binding.objectId,
});

export const bindingMatchesDocument = (
    doc: MongoShareContentDocument,
    binding: ShareContentObjectBinding
): boolean =>
    doc.namespace === binding.namespace &&
    doc.ownerProfileId === binding.ownerProfileId &&
    doc.shareId === binding.shareId &&
    doc.contentVersion === binding.contentVersion &&
    doc.objectId === binding.objectId &&
    doc.operationId === binding.operationId;

/** MongoDB duplicate-key error (unique index violation). */
export const isDuplicateKeyError = (error: unknown): boolean =>
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000;

export const toActiveSummary = (doc: MongoShareContentActive): ShareContentActiveSummary => ({
    kind: 'active',
    namespace: doc.namespace,
    ownerProfileId: doc.ownerProfileId,
    shareId: doc.shareId,
    contentVersion: doc.contentVersion,
    objectId: doc.objectId,
    operationId: doc.operationId,
    contentHash: doc.contentHash,
    payloadHash: doc.payloadHash,
    ciphertextBytes: doc.ciphertextBytes,
    recoveryBytes: doc.recoveryBytes,
    createdAt: doc.createdAt,
});

export const toTombstoneSummary = (
    doc: MongoShareContentTombstone
): ShareContentTombstoneSummary => ({
    kind: 'tombstone',
    namespace: doc.namespace,
    ownerProfileId: doc.ownerProfileId,
    shareId: doc.shareId,
    contentVersion: doc.contentVersion,
    objectId: doc.objectId,
    operationId: doc.operationId,
    ...(doc.contentHash === undefined ? {} : { contentHash: doc.contentHash }),
    deletedAt: doc.deletedAt,
});
