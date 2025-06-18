import cache from '@cache';
import type { DidDocument } from '@learncard/types';

export const getDidDocCacheKey = (profileId: string): string => `did-doc:${profileId}`;

export const getDidDocForProfile = async (profileId: string): Promise<DidDocument> => {
    const result = await cache.get(getDidDocCacheKey(profileId), true);

    return result && JSON.parse(result);
};

export const setDidDocForProfile = async (profileId: string, doc: DidDocument) => {
    return cache.set(getDidDocCacheKey(profileId), JSON.stringify(doc));
};

export const deleteDidDocForProfile = async (profileId: string) => {
    return cache.delete([getDidDocCacheKey(profileId)]);
};

export const getManagerDidDocCacheKey = (id: string): string => `manager-did-doc:${id}`;

export const getDidDocForProfileManager = async (id: string): Promise<DidDocument> => {
    const result = await cache.get(getManagerDidDocCacheKey(id), true);

    return result && JSON.parse(result);
};

export const setDidDocForProfileManager = async (id: string, doc: DidDocument) => {
    return cache.set(getManagerDidDocCacheKey(id), JSON.stringify(doc));
};

export const deleteDidDocForProfileManager = async (id: string) => {
    return cache.delete([getManagerDidDocCacheKey(id)]);
};
