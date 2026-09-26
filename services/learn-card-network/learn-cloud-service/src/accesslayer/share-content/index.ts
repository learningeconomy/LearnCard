import type { Collection, Db } from 'mongodb';

import {
    SHARE_CONTENT_COLLECTION,
    type MongoShareContentDocument,
    type ShareContentObjectBinding,
    type ShareContentPutInput,
} from '@models';

import { deleteShareContent } from './delete';
import { ensureShareContentIndexes } from './initialize';
import { putShareContent } from './put';
import { getShareContentContent, getShareContentRecovery, statShareContent } from './read';
import { ShareContentRepositoryNotInitializedError } from './types';
import type { ShareContentRepository } from './types';

export * from './types';
export { ensureShareContentIndexes, SHARE_CONTENT_IDENTITY_INDEX } from './initialize';

/**
 * Bind the dedicated `share_content` collection from a caller-provided `Db`.
 * Deliberately does not import the service `@mongo` singleton, so nothing here
 * opens a connection at import time and tests can inject a real/memory database.
 */
export const getShareContentCollection = (db: Db): Collection<MongoShareContentDocument> =>
    db.collection<MongoShareContentDocument>(SHARE_CONTENT_COLLECTION);

/**
 * Build the narrow exact-object share-content repository over an injected
 * collection.
 *
 * Operational contract:
 * - `initialize()` must be awaited at startup; it installs the unique
 *   `(namespace, objectId)` index. Every operation throws
 *   {@link ShareContentRepositoryNotInitializedError} until then, so an
 *   un-indexed database can never serve a write.
 * - This repository is **not** an authorization boundary. The route batch must
 *   verify the C1 service context (namespace/op/shareId/contentVersion/
 *   ownerProfileId/objectId/operationId/requestHash) first, then pass the exact
 *   verified tuple. The repository only enforces the data-level binding and the
 *   active/tombstone state machine.
 */
export const createShareContentRepository = (
    collection: Collection<MongoShareContentDocument>
): ShareContentRepository => {
    let initialized = false;

    const requireInitialized = (): Collection<MongoShareContentDocument> => {
        if (!initialized) throw new ShareContentRepositoryNotInitializedError();

        return collection;
    };

    return {
        collection,
        initialize: async () => {
            await ensureShareContentIndexes(collection);
            initialized = true;
        },
        put: async (input: ShareContentPutInput) => putShareContent(requireInitialized(), input),
        getContent: async (binding: ShareContentObjectBinding) =>
            getShareContentContent(requireInitialized(), binding),
        getRecovery: async (binding: ShareContentObjectBinding) =>
            getShareContentRecovery(requireInitialized(), binding),
        stat: async (binding: ShareContentObjectBinding) =>
            statShareContent(requireInitialized(), binding),
        delete: async (binding: ShareContentObjectBinding) =>
            deleteShareContent(requireInitialized(), binding),
    };
};
