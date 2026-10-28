import { createHash } from 'node:crypto';
/** Metadata-only read: no retained original, raw JSON, or legacy AI context. */
export const REPAIR_SOURCE_PROJECTION = {
    _id: 1,
    did: 1,
    uri: 1,
    source: 1,
    category: 1,
    embeddingEpoch: 1,
    verification: 1,
    rawContentHash: 1,
    createdAt: 1,
    updatedAt: 1,
    updated_at: 1,
} as const;
/** Opaque supported-source-version token; never contains source data in output. */
export const repairSourceFingerprint = (source: any) =>
    createHash('sha256')
        .update(JSON.stringify(Object.keys(REPAIR_SOURCE_PROJECTION).map(key => source?.[key])))
        .digest('hex');
