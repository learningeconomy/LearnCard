import cache from '@cache';

export const getPushTokenKey = (did: string, token: string): string => `pushtoken|${did}|${token}`;

export const isTokenValidForDid = async (did: string, token: string): Promise<boolean> => {
    return !!(await cache.get(getPushTokenKey(did, token)));
};

export const getTokensForDid = async (did: string): Promise<string[]> => {
    const keys = await cache.keys(getPushTokenKey(did, '*'), 5000);

    if (!keys) return [];

    return (await Promise.all(keys.map(async key => cache.get(key)))).filter(
        token => !!token
    ) as string[];
};

export const addTokenForDid = async (did: string, token: string) => {
    return cache.set(getPushTokenKey(did, token), token, 0);
};

export const deleteTokenForDid = async (did: string, token: string) => {
    return cache.delete([getPushTokenKey(did, token)]);
};
