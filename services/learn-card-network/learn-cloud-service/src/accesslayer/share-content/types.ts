import type { Collection } from 'mongodb';

import type {
    MongoShareContentDocument,
    ShareContentHash,
    ShareContentObjectBinding,
    ShareContentPutInput,
    ShareEnvelope,
    ShareOwnerRecovery,
} from '@models';

/**
 * Stable, non-secret repository result codes. Routes map every failure to a
 * single generic external rejection; a repository error must never be returned
 * verbatim to a caller.
 */
export type ShareContentRepositoryError =
    'INVALID_INPUT' | 'NOT_FOUND' | 'TOMBSTONED' | 'BINDING_MISMATCH' | 'CONFLICT' | 'STORE_ERROR';

export type ShareContentRepositoryFailure = { ok: false; error: ShareContentRepositoryError };

export type ShareContentRepositoryResult<T> =
    { ok: true; value: T } | ShareContentRepositoryFailure;

/** `created` for the first write, `idempotent` for an exact retry. */
export type ShareContentWriteStatus = 'created' | 'idempotent';

/** Non-sensitive active summary; never includes ciphertext or recovery. */
export type ShareContentActiveSummary = {
    kind: 'active';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash: ShareContentHash;
    payloadHash: ShareContentHash;
    ciphertextBytes: number;
    recoveryBytes: number;
    createdAt: Date;
};

/** Tombstone summary retained after deletion. */
export type ShareContentTombstoneSummary = {
    kind: 'tombstone';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash?: ShareContentHash;
    deletedAt: Date;
};

/**
 * Content projection. The owner recovery is deliberately absent: it is only
 * reachable through the separately authorized {@link
 * ShareContentRepository.getRecovery} method.
 */
export type ShareContentContentProjection = {
    kind: 'active';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash: ShareContentHash;
    payloadHash: ShareContentHash;
    envelope: ShareEnvelope;
    ciphertextBytes: number;
    createdAt: Date;
};

/**
 * Owner-only recovery projection. The ciphertext envelope is absent. The route
 * layer must call this only for an authenticated owner-recovery request; the
 * repository is not an authorization boundary by itself.
 */
export type ShareContentRecoveryProjection = {
    kind: 'active';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash: ShareContentHash;
    payloadHash: ShareContentHash;
    ownerEncryptedRecovery: ShareOwnerRecovery;
    recoveryBytes: number;
    createdAt: Date;
};

export type ShareContentStatProjection = ShareContentActiveSummary | ShareContentTombstoneSummary;

/** Successful put value: `created` or an exact idempotent retry. */
export type ShareContentPutResultValue = {
    status: ShareContentWriteStatus;
    record: ShareContentActiveSummary;
};
export type ShareContentPutResult = ShareContentRepositoryResult<ShareContentPutResultValue>;

/**
 * Narrow exact-object repository. There is deliberately no list, scan,
 * wildcard or `deleteOwner` method: every call is bound to one immutable tuple.
 *
 * The repository enforces data-level bindings only. It is **not** an
 * authorization boundary: callers must have already verified the C1 service
 * authorization context (namespace/op/shareId/contentVersion/ownerProfileId/
 * objectId/operationId/requestHash) before invoking it.
 */
export type ShareContentRepository = {
    /** The injected collection. Useful for diagnostics; not a query surface. */
    readonly collection: Collection<MongoShareContentDocument>;
    /**
     * Explicitly install the required unique identity index before serving any
     * operation. Must be awaited during startup; index creation is never left to
     * an eventual background build.
     */
    initialize: () => Promise<void>;
    /** Create-only write. Same tuple + derived hash is an idempotent success. */
    put: (input: ShareContentPutInput) => Promise<ShareContentPutResult>;
    /** Content projection (no recovery) for the active object, or a failure. */
    getContent: (
        binding: ShareContentObjectBinding
    ) => Promise<ShareContentRepositoryResult<ShareContentContentProjection>>;
    /** Owner-only recovery projection for the active object, or a failure. */
    getRecovery: (
        binding: ShareContentObjectBinding
    ) => Promise<ShareContentRepositoryResult<ShareContentRecoveryProjection>>;
    /** Existence/hash/byte summary for the exact tuple (active or tombstone). */
    stat: (
        binding: ShareContentObjectBinding
    ) => Promise<ShareContentRepositoryResult<ShareContentStatProjection>>;
    /**
     * Atomically tombstone the exact object. Deleting an absent identity writes a
     * permanent tombstone first, so a late concurrent put can never resurrect it.
     */
    delete: (
        binding: ShareContentObjectBinding
    ) => Promise<ShareContentRepositoryResult<ShareContentTombstoneSummary>>;
};

/** Thrown when an operation is attempted before {@link ShareContentRepository.initialize}. */
export class ShareContentRepositoryNotInitializedError extends Error {
    readonly code = 'SHARE_CONTENT_REPOSITORY_NOT_INITIALIZED';

    constructor() {
        super('share-content repository must be initialized before serving operations');
        this.name = 'ShareContentRepositoryNotInitializedError';
    }
}
