import type { ClientSession } from 'mongodb';
import stringify from 'json-stringify-deterministic';
import cache from '@cache';
import type { PaginatedEncryptedCredentialRecordsType, PaginationOptionsType } from '@learncard/types';
import { getAllDidsForDid } from '@accesslayer/user/read';

/** 1 Day */
export const INDEX_TTL = 60 * 60 * 24;

export const getIndexHashKey = (did: string): string => `index:${did}`;

export const getIndexFieldKey = (
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
    includeAssociatedDids = true
): string => `${stringify(paginationOptions)}:${includeAssociatedDids}:${stringify(query)}`;

export const getCachedIndexPageForDid = async (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
    includeAssociatedDids = true
): Promise<PaginatedEncryptedCredentialRecordsType | null | undefined> => {
    const hashKey = getIndexHashKey(did);
    const fieldKey = getIndexFieldKey(query, paginationOptions, includeAssociatedDids);

    const result = await cache.hget(hashKey, fieldKey);

    if (result) {
        // Reset TTL for the entire hash
        await cache.expire(hashKey, INDEX_TTL);
        return JSON.parse(result);
    }

    return null;
};

export const setCachedIndexPageForDid = async (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
    page: PaginatedEncryptedCredentialRecordsType,
    includeAssociatedDids = true
) => {
    const hashKey = getIndexHashKey(did);
    const fieldKey = getIndexFieldKey(query, paginationOptions, includeAssociatedDids);

    const pipeline = cache.pipeline();
    pipeline.hset(hashKey, fieldKey, JSON.stringify(page));
    pipeline.expire(hashKey, INDEX_TTL);
    return pipeline.exec();
};

export const deleteCachedIndexPageForDid = async (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
    includeAssociatedDids = true
) => {
    const hashKey = getIndexHashKey(did);
    const fieldKey = getIndexFieldKey(query, paginationOptions, includeAssociatedDids);

    return cache.hset(hashKey, fieldKey, ''); // We use an empty string to "delete" the field
};

export const flushIndexCacheForDid = async (
    did: string,
    includeAssociatedDids = true,
    session?: ClientSession
) => {
    if (!includeAssociatedDids) {
        return cache.delete([getIndexHashKey(did)]);
    }

    const dids = await getAllDidsForDid(did, session);
    const pipeline = cache.pipeline();

    dids.forEach(did => {
        pipeline.delete(getIndexHashKey(did));
    });

    const results = await pipeline.exec();
    return results?.reduce<number>((total, [_err, result]) => total + (result as number), 0);
};
