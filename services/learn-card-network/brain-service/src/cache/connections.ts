import cache from '@cache';
import { ProfileType } from 'types/profile';

const CONNECTIONS_TTL = 60 * 60 * 24;

export const getConnectionsCacheKey = (profileId: string): string => `connections:${profileId}`;

export const getCachedConnectionsByProfileId = async (
    profileId: string
): Promise<ProfileType[] | null | undefined> => {
    const result = await cache.get(getConnectionsCacheKey(profileId), true, CONNECTIONS_TTL);

    return result && JSON.parse(result);
};

export const setCachedConnectionsForProfileId = async (
    profileId: string,
    connections: ProfileType[]
) => {
    return cache.set(
        getConnectionsCacheKey(profileId),
        JSON.stringify(connections),
        CONNECTIONS_TTL
    );
};

export const deleteCachedConnectionsForProfileId = async (profileId: string) => {
    return cache.delete([getConnectionsCacheKey(profileId)]);
};

export const deleteCachedConnectionsForProfileIds = async (profileIds: string[]) => {
    return cache.delete(profileIds.map(getConnectionsCacheKey));
};
