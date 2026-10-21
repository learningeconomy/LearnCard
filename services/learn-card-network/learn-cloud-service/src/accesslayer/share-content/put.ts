import type { Collection } from 'mongodb';

import {
    ShareContentPutInputValidator,
    computeShareContentHash,
    computeSharePayloadHash,
    measureShareContentPayload,
    type MongoShareContentActive,
    type MongoShareContentDocument,
    type ShareContentPutInput,
} from '@models';

import {
    MAX_SHARE_CONTENT_ATTEMPTS,
    bindingMatchesDocument,
    isDuplicateKeyError,
    shareContentIdentityFilter,
    toActiveSummary,
} from './internal';
import type { ShareContentPutResult } from './types';

const buildActiveDocument = (
    input: ShareContentPutInput,
    contentHash: string
): MongoShareContentActive => {
    const { ciphertextBytes, recoveryBytes } = measureShareContentPayload(input);

    return {
        kind: 'active',
        namespace: input.namespace,
        ownerProfileId: input.ownerProfileId,
        shareId: input.shareId,
        contentVersion: input.contentVersion,
        objectId: input.objectId,
        operationId: input.operationId,
        contentHash,
        payloadHash: computeSharePayloadHash(input),
        envelope: input.envelope,
        ownerEncryptedRecovery: input.ownerEncryptedRecovery,
        ciphertextBytes,
        recoveryBytes,
        createdAt: new Date(),
    };
};

/**
 * Create-only immutable write.
 *
 * The write is an atomic `insertOne` against the unique `(namespace, objectId)`
 * index; there is no read-then-write window. On a duplicate key the existing
 * document is classified: a tombstone is permanent, an active document with the
 * same derived hash and all six bindings is an exact idempotent success, and
 * anything else is a conflict. Because active documents are never replaced and
 * tombstones are permanent, the classification read cannot be invalidated by a
 * concurrent writer in a way that resurrects content.
 */
export const putShareContent = async (
    collection: Collection<MongoShareContentDocument>,
    rawInput: unknown
): Promise<ShareContentPutResult> => {
    const parsed = ShareContentPutInputValidator.safeParse(rawInput);

    if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

    const input = parsed.data;
    const contentHash = computeShareContentHash(input);

    for (let attempt = 0; attempt < MAX_SHARE_CONTENT_ATTEMPTS; attempt += 1) {
        const document = buildActiveDocument(input, contentHash);

        try {
            await collection.insertOne(document);

            return { ok: true, value: { status: 'created', record: toActiveSummary(document) } };
        } catch (error) {
            if (!isDuplicateKeyError(error)) return { ok: false, error: 'STORE_ERROR' };
        }

        const existing = await collection.findOne(shareContentIdentityFilter(input));

        if (existing === null) continue;

        if (existing.kind === 'tombstone') return { ok: false, error: 'TOMBSTONED' };

        if (existing.contentHash === contentHash && bindingMatchesDocument(existing, input)) {
            return { ok: true, value: { status: 'idempotent', record: toActiveSummary(existing) } };
        }

        return { ok: false, error: 'CONFLICT' };
    }

    return { ok: false, error: 'CONFLICT' };
};
