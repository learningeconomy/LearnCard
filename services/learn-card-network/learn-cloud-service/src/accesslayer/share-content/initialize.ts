import type { Collection } from 'mongodb';

import type { MongoShareContentDocument } from '@models';

/** Stable index name so operators can verify/report the installed index. */
export const SHARE_CONTENT_IDENTITY_INDEX = 'share_content_identity_unique';

/**
 * Explicitly install the required indexes before any operation is served.
 *
 * The unique `(namespace, objectId)` index is what makes create-only writes and
 * permanent tombstones atomic: without it, a duplicate `insertOne` would create a
 * second document instead of failing closed. Index creation is awaited by
 * {@link createShareContentRepository}.initialize; it is never left to an
 * eventual background build.
 */
export const ensureShareContentIndexes = async (
    collection: Collection<MongoShareContentDocument>
): Promise<void> => {
    await collection.createIndex(
        { namespace: 1, objectId: 1 },
        { unique: true, name: SHARE_CONTENT_IDENTITY_INDEX }
    );
};
