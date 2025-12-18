import cache from '@cache';

export const getInviteCacheKey = (profileId: string, challenge: string): string =>
    `inviteChallenge:${profileId}:${challenge}`;

export const VALID = 'valid';

export const isInviteValidForProfile = async (
    profileId: string,
    challenge: string
): Promise<typeof VALID | null | undefined> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge));

    return result === VALID ? result : undefined;
};

export const isInviteAlreadySetForProfile = async (
    profileId: string,
    challenge: string
): Promise<boolean> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge));

    return Boolean(result);
};

export const setValidInviteForProfile = async (profileId: string, challenge: string) => {
    return cache.set(getInviteCacheKey(profileId, challenge), VALID);
};

export const invalidateInviteForProfile = async (profileId: string, challenge: string) => {
    return cache.delete([getInviteCacheKey(profileId, challenge)]);
};
