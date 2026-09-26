import type { Collection } from 'mongodb';

import type { MongoShareContentDocument } from '@models';

import {
    MAX_SHARE_CONTENT_ATTEMPTS,
    bindingMatchesDocument,
    parseShareContentBinding,
    shareContentBindingFilter,
    shareContentIdentityFilter,
    toTombstoneSummary,
} from './internal';
import type { ShareContentRepositoryResult, ShareContentTombstoneSummary } from './types';

/**
 * Atomically tombstone the exact object.
 *
 * The active -> tombstone transition is a single atomic `findOneAndUpdate` that
 * also removes the ciphertext/recovery fields, so once it returns the payload is
 * gone. If the identity does not exist yet, a tombstone is inserted with an
 * atomic `$setOnInsert` upsert (delete-before-put), so a late concurrent put can
 * never resurrect the identity. The loop only re-runs when a racing writer
 * changed the document between the two atomic steps; active documents are
 * otherwise immutable and tombstones are permanent, so it always settles.
 *
 * A binding mismatch (including another owner's object at the same identity)
 * never modifies the stored document and returns `BINDING_MISMATCH`.
 */
export const deleteShareContent = async (
    collection: Collection<MongoShareContentDocument>,
    rawBinding: unknown
): Promise<ShareContentRepositoryResult<ShareContentTombstoneSummary>> => {
    const binding = parseShareContentBinding(rawBinding);

    if (binding === null) return { ok: false, error: 'INVALID_INPUT' };

    const exactFilter = shareContentBindingFilter(binding);
    const identityFilter = shareContentIdentityFilter(binding);

    for (let attempt = 0; attempt < MAX_SHARE_CONTENT_ATTEMPTS; attempt += 1) {
        // 1. Atomic active -> tombstone, dropping the payload in the same update.
        const deletedAt = new Date();

        const replaced = await collection.findOneAndUpdate(
            { ...exactFilter, kind: 'active' },
            {
                $set: { kind: 'tombstone', deletedAt },
                $unset: {
                    payloadHash: '',
                    envelope: '',
                    ownerEncryptedRecovery: '',
                    ciphertextBytes: '',
                    recoveryBytes: '',
                    createdAt: '',
                },
            },
            { returnDocument: 'after' }
        );

        if (replaced !== null) {
            if (replaced.kind === 'tombstone') {
                return { ok: true, value: toTombstoneSummary(replaced) };
            }

            // Unreachable under the `kind: 'active'` filter; a racing writer
            // changed the document. Re-classify rather than trust the shape.
            continue;
        }

        // 2. Delete-before-put: create a permanent tombstone only if absent.
        const inserted = await collection.updateOne(
            identityFilter,
            {
                $setOnInsert: {
                    kind: 'tombstone',
                    namespace: binding.namespace,
                    ownerProfileId: binding.ownerProfileId,
                    shareId: binding.shareId,
                    contentVersion: binding.contentVersion,
                    objectId: binding.objectId,
                    operationId: binding.operationId,
                    deletedAt,
                },
            },
            { upsert: true }
        );

        if (inserted.upsertedCount === 1) {
            return {
                ok: true,
                value: {
                    kind: 'tombstone',
                    namespace: binding.namespace,
                    ownerProfileId: binding.ownerProfileId,
                    shareId: binding.shareId,
                    contentVersion: binding.contentVersion,
                    objectId: binding.objectId,
                    operationId: binding.operationId,
                    deletedAt,
                },
            };
        }

        // 3. The identity exists but was not replaced: classify and fail closed.
        const existing = await collection.findOne(identityFilter);

        if (existing === null) continue;

        if (existing.kind === 'tombstone') {
            return bindingMatchesDocument(existing, binding)
                ? { ok: true, value: toTombstoneSummary(existing) }
                : { ok: false, error: 'BINDING_MISMATCH' };
        }

        if (!bindingMatchesDocument(existing, binding)) {
            return { ok: false, error: 'BINDING_MISMATCH' };
        }

        // Exact active document: a concurrent writer slipped in between the two
        // atomic steps; retry the replacement.
    }

    return { ok: false, error: 'CONFLICT' };
};
