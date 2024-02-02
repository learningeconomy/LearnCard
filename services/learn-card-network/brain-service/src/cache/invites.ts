import cache from '@cache';
import exp from 'node:constants';

export const getInviteCacheKey = (profileId: string, challenge: string, expiration: number): string =>
    `inviteChallenge:${profileId}:${challenge}:${expiration}`;

export const VALID = 'valid';

export const isInviteValidForProfile = async (
    profileId: string,
    challenge: string,
    expiration: number
): Promise<typeof VALID | null | undefined> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge, expiration));

    return result === VALID ? result : undefined;
};

export const isInviteAlreadySetForProfile = async (
    profileId: string,
    challenge: string,
    expiration: number
): Promise<boolean> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge, expiration));

    return Boolean(result);
};

export const setValidInviteForProfile = async (profileId: string, challenge: string, expiration: number) => {
    return cache.set(getInviteCacheKey(profileId, challenge, expiration), VALID);
};

export const invalidateInviteForProfile = async (profileId: string, challenge: string, expiration: number) => {
    return cache.delete([getInviteCacheKey(profileId, challenge, expiration)]);
};
