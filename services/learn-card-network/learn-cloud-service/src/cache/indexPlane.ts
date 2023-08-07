import stringify from 'json-stringify-deterministic';

import cache from '@cache';
import { PaginatedEncryptedCredentialRecordsType, PaginationOptionsType } from '@learncard/types';
import { MongoUserType } from '@models';
import { getAllDidsForDid } from '@accesslayer/user/read';

/** 1 Day */
export const INDEX_TTL = 60 * 60 * 24;

export const getIndexPageCacheKey = (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType,
    includeAssociatedDids = true
): string =>
    `index:${did}:${stringify(paginationOptions)}:${includeAssociatedDids}:${stringify(query)}`;

export const getCachedIndexPageForDid = async (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType,
    includeAssociatedDids = true
): Promise<PaginatedEncryptedCredentialRecordsType | null | undefined> => {
    const result = await cache.get(
        getIndexPageCacheKey(did, query, paginationOptions, includeAssociatedDids),
        true,
        INDEX_TTL
    );

    return result && JSON.parse(result);
};

export const setCachedIndexPageForDid = async (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType,
    page: PaginatedEncryptedCredentialRecordsType,
    includeAssociatedDids = true
) => {
    return cache.set(
        getIndexPageCacheKey(did, query, paginationOptions, includeAssociatedDids),
        JSON.stringify(page),
        INDEX_TTL
    );
};

export const deleteCachedIndexPageForDid = async (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType,
    includeAssociatedDids = true
) => {
    return cache.delete([
        getIndexPageCacheKey(did, query, paginationOptions, includeAssociatedDids),
    ]);
};

export const flushIndexCacheForDid = async (did: string, includeAssociatedDids = true) => {
    if (!includeAssociatedDids) {
        const keys = await cache.keys(`index:${did}:*`);

        return cache.delete(keys);
    }

    const dids = await getAllDidsForDid(did);

    const results = await Promise.all(
        dids.map(async _did => {
            const keys = await cache.keys(`index:${_did}:*`);

            return cache.delete(keys);
        })
    );

    return results.reduce<number>((total, current) => total + (current ?? 0), 0);
};
