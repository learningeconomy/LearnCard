import cache from '@cache';
import { UnsignedVC, VC, VP, JWE, ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';
import { createHash } from 'crypto';

export type { StoredCredential } from 'types/credential';

const STORAGE_TTL = 60 * 60 * 24;

export const getStorageCacheKey = (uri: string): string => `storage:${uri}`;

export const getStorageContentHashKey = (content: unknown): string =>
    `storage:hash:${createHash('sha256').update(JSON.stringify(content)).digest('hex')}`;

export const getCachedStorageByUri = async (
    uri: string
): Promise<
    UnsignedVC | VC | VP | JWE | ConsentFlowContract | ConsentFlowTerms | null | undefined
> => {
    const result = await cache.get(getStorageCacheKey(uri), true, STORAGE_TTL);

    if (!result) return undefined;

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
