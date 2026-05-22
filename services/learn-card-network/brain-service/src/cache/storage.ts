import cache from '@cache';
import { UnsignedVC, VC, VP, JWE, ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';
import { createHash } from 'crypto';

export type { StoredCredential } from 'types/credential';

const STORAGE_TTL = 60 * 60 * 24;

export const getStorageCacheKey = (uri: string): string => `storage:${uri}`;

export const getStorageContentHashCacheKey = (hash: string): string => `storage:hash:${hash}`;

export const getStorageContentHashKey = (content: unknown): string =>
    getStorageContentHashCacheKey(
        createHash('sha256').update(JSON.stringify(content)).digest('hex')
    );

export const getCachedStorageByUri = async (
    uri: string
): Promise<
    UnsignedVC | VC | VP | JWE | ConsentFlowContract | ConsentFlowTerms | null | undefined
> => {
    const cacheKey = uri.startsWith('storage:hash:') ? uri : getStorageCacheKey(uri);
    const result = await cache.get(cacheKey, true, STORAGE_TTL);

    if (!result) return undefined;

    if (uri.startsWith('storage:hash:')) return JSON.parse(result);

    const parsedResult = JSON.parse(result);
    const contentHashResult = await cache.get(
        getStorageContentHashKey(parsedResult),
        true,
        STORAGE_TTL
    );

    if (contentHashResult) return JSON.parse(contentHashResult);

    return undefined;
};

export const setStorageForUri = async (
    uri: string,
    item: UnsignedVC | VC | VP | JWE | ConsentFlowContract | ConsentFlowTerms
) => {
    const serializedItem = JSON.stringify(item);

    await Promise.all([
        cache.set(getStorageCacheKey(uri), serializedItem, STORAGE_TTL),
        cache.set(getStorageContentHashKey(item), serializedItem, STORAGE_TTL),
    ]);
};

export const deleteStorageForUri = async (uri: string) => {
    return cache.delete([getStorageCacheKey(uri)]);
};
