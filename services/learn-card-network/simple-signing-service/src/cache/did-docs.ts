import cache from '@cache';

export const getDidDocCacheKey = (profileId: string): string => `did-doc:${profileId}`;

export const getDidDocForProfile = async (
    profileId: string
): Promise<Record<string, any> | null | undefined> => {
    const result = await cache.get(getDidDocCacheKey(profileId));

    return result && JSON.parse(result);
};

export const setDidDocForProfile = async (profileId: string, doc: Record<string, any>) => {
    return cache.set(getDidDocCacheKey(profileId), JSON.stringify(doc));
};

export const deleteDidDocForProfile = async (profileId: string) => {
    return cache.delete([getDidDocCacheKey(profileId)]);
};
