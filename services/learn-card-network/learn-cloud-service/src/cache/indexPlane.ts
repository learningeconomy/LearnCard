import { ClientSession } from 'mongodb';

import stringify from 'json-stringify-deterministic';

import cache from '@cache';
import { PaginatedEncryptedCredentialRecordsType, PaginationOptionsType } from '@learncard/types';
import { getAllDidsForDid } from '@accesslayer/user/read';

/** 1 Day */
export const INDEX_TTL = 60 * 60 * 24;

export const getIndexPageCacheKey = (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
    includeAssociatedDids = true
): string =>
    `index:${did}:${stringify(paginationOptions)}:${includeAssociatedDids}:${stringify(query)}`;

export const getCachedIndexPageForDid = async (
    did: string,
    query: Record<string, any>,
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
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
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
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
    paginationOptions: PaginationOptionsType & { sort: 'newestFirst' | 'oldestFirst' },
    includeAssociatedDids = true
) => {
    return cache.delete([
        getIndexPageCacheKey(did, query, paginationOptions, includeAssociatedDids),
    ]);
};

export const flushIndexCacheForDid = async (
    did: string,
    includeAssociatedDids = true,
    session?: ClientSession
) => {
    if (!includeAssociatedDids) {
        const keys = await cache.keys(`index:${did}:*`, 5000);

        return cache.delete(keys);
    }
    console.log("JOTI: Flush Index Cach for DID", did);
    const dids = await getAllDidsForDid(did, session);
    console.log("JOTI: Got DIDS", dids);
    const results = await Promise.all(
        dids.map(async _did => {
            console.log("JOTI: RETRIEVING KEYS:", `index:${_did}:*`)
            const keys = await cache.keys(`index:${_did}:*`, 5000);
            console.log("JOTI: DELETING KEYS:", keys?.length, keys)
            return cache.delete(keys);
        })
    );
    console.log("JOTI: FLUSHED KEYS: ", results);
    return results.reduce<number>((total, current) => total + (current ?? 0), 0);
};
