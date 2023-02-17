import cache from '@cache';

export const getDidDocForProfile = async (
    profileId: string
): Promise<Record<string, any> | null | undefined> => {
    const result = await cache.get(`did-doc:${profileId}`);

    return result && JSON.parse(result);
};

export const setDidDocForProfile = async (profileId: string, doc: Record<string, any>) => {
    return cache.set(`did-doc:${profileId}`, JSON.stringify(doc));
};

export const deleteDidDocForProfile = async (profileId: string) => {
    return cache.delete([`did-doc:${profileId}`]);
};
