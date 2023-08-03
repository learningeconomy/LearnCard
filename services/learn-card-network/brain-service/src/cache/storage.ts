import cache from '@cache';
import { UnsignedVC, VC, VP, JWE } from '@learncard/types';

const STORAGE_TTL = 60 * 60 * 24;

export const getStorageCacheKey = (uri: string): string => `storage:${uri}`;

export const getCachedStorageByUri = async (
    uri: string
): Promise<UnsignedVC | VC | VP | JWE | null | undefined> => {
    const result = await cache.get(getStorageCacheKey(uri), true, STORAGE_TTL);

    return result && JSON.parse(result);
};

export const setStorageForUri = async (uri: string, item: UnsignedVC | VC | VP | JWE) => {
    return cache.set(getStorageCacheKey(uri), JSON.stringify(item), STORAGE_TTL);
};

export const deleteStorageForUri = async (uri: string) => {
    return cache.delete([getStorageCacheKey(uri)]);
};
