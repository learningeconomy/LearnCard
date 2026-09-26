import type { Collection } from 'mongodb';

import type { MongoShareContentDocument } from '@models';

import {
    parseShareContentBinding,
    shareContentBindingFilter,
    toActiveSummary,
    toTombstoneSummary,
} from './internal';
import type {
    ShareContentContentProjection,
    ShareContentRecoveryProjection,
    ShareContentRepositoryResult,
    ShareContentStatProjection,
} from './types';

/**
 * Content projection for the exact active object. The owner recovery is never
 * read into this projection. A missing object, a tombstone or any binding
 * mismatch is reported as the same opaque `NOT_FOUND`, so the repository does
 * not disclose another owner's object existence.
 */
export const getShareContentContent = async (
    collection: Collection<MongoShareContentDocument>,
    rawBinding: unknown
): Promise<ShareContentRepositoryResult<ShareContentContentProjection>> => {
    const binding = parseShareContentBinding(rawBinding);

    if (binding === null) return { ok: false, error: 'INVALID_INPUT' };

    const document = await collection.findOne(
        { ...shareContentBindingFilter(binding), kind: 'active' },
        { projection: { ownerEncryptedRecovery: 0 } }
    );

    if (document === null || document.kind !== 'active') return { ok: false, error: 'NOT_FOUND' };

    return {
        ok: true,
        value: {
            kind: 'active',
            namespace: binding.namespace,
            ownerProfileId: binding.ownerProfileId,
            shareId: binding.shareId,
            contentVersion: binding.contentVersion,
            objectId: binding.objectId,
            operationId: binding.operationId,
            contentHash: document.contentHash,
            payloadHash: document.payloadHash,
            envelope: document.envelope,
            ciphertextBytes: document.ciphertextBytes,
            createdAt: document.createdAt,
        },
    };
};

/**
 * Owner-only recovery projection for the exact active object. The ciphertext
 * envelope is never read into this projection and the returned value carries no
 * content bytes. The route layer must call this only after verifying the owner
 * context; the repository is not an authorization boundary.
 */
export const getShareContentRecovery = async (
    collection: Collection<MongoShareContentDocument>,
    rawBinding: unknown
): Promise<ShareContentRepositoryResult<ShareContentRecoveryProjection>> => {
    const binding = parseShareContentBinding(rawBinding);

    if (binding === null) return { ok: false, error: 'INVALID_INPUT' };

    const document = await collection.findOne(
        { ...shareContentBindingFilter(binding), kind: 'active' },
        { projection: { envelope: 0, ciphertextBytes: 0 } }
    );

    if (document === null || document.kind !== 'active') return { ok: false, error: 'NOT_FOUND' };

    return {
        ok: true,
        value: {
            kind: 'active',
            namespace: binding.namespace,
            ownerProfileId: binding.ownerProfileId,
            shareId: binding.shareId,
            contentVersion: binding.contentVersion,
            objectId: binding.objectId,
            operationId: binding.operationId,
            contentHash: document.contentHash,
            payloadHash: document.payloadHash,
            ownerEncryptedRecovery: document.ownerEncryptedRecovery,
            recoveryBytes: document.recoveryBytes,
            createdAt: document.createdAt,
        },
    };
};

/**
 * Existence/hash/byte summary for the exact tuple. Returns the tombstone summary
 * for a matching permanent tombstone (reconciliation needs it) and the opaque
 * `NOT_FOUND` for any binding mismatch. No ciphertext or recovery is read.
 */
export const statShareContent = async (
    collection: Collection<MongoShareContentDocument>,
    rawBinding: unknown
): Promise<ShareContentRepositoryResult<ShareContentStatProjection>> => {
    const binding = parseShareContentBinding(rawBinding);

    if (binding === null) return { ok: false, error: 'INVALID_INPUT' };

    const document = await collection.findOne(shareContentBindingFilter(binding), {
        projection: { envelope: 0, ownerEncryptedRecovery: 0 },
    });

    if (document === null) return { ok: false, error: 'NOT_FOUND' };

    return {
        ok: true,
        value:
            document.kind === 'tombstone'
                ? toTombstoneSummary(document)
                : toActiveSummary(document),
    };
};
