import { getAllDidsForDid } from '@accesslayer/user/read';
import cache from '@cache';
import { MongoUserType } from '@models';

/** 1 Day */
export const USER_TTL = 60 * 60 * 24;

export const getUserCacheKey = (did: string): string => `user:${did}`;

export const getCachedUserForDid = async (
    did: string
): Promise<MongoUserType | null | undefined> => {
    const result = await cache.get(getUserCacheKey(did), true, USER_TTL);

    return result && JSON.parse(result);
};

export const setCachedUserForDid = async (did: string, user: MongoUserType) => {
    return cache.set(getUserCacheKey(did), JSON.stringify(user), USER_TTL);
};

export const deleteCachedUsersForDid = async (did: string) => {
    const dids = await getAllDidsForDid(did);

    return cache.delete(dids.map(getUserCacheKey));
};
