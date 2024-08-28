import cache from '@cache';

export const getInviteCacheKey = (profileId: string, challenge: string): string =>
    `inviteChallenge:${profileId}:${challenge}`;

export const VALID = 'valid';
export const NEVER_EXPIRE = 'never';

export const isInviteValidForProfile = async (
    profileId: string,
    challenge: string,
): Promise<boolean> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge));

    // If result is null or undefined, the invite has expired or doesn't exist
    if (!result) {
        return false;
    }

    const isValid = result === VALID || result === NEVER_EXPIRE;
    return isValid;
};

export const isInviteAlreadySetForProfile = async (
    profileId: string,
    challenge: string,
): Promise<boolean> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge));
    console.log(`isInviteAlreadySetForProfile: Result from cache: ${result}`);

    return Boolean(result);
};

export const setValidInviteForProfile = async (
    profileId: string,
    challenge: string,
    expiration: number | null
) => {
    if (expiration === null) {
        return cache.set(getInviteCacheKey(profileId, challenge), NEVER_EXPIRE, 0);
    } else {
        return cache.set(getInviteCacheKey(profileId, challenge), VALID, expiration);
    }
};

export const invalidateInviteForProfile = async (profileId: string, challenge: string) => {
    return cache.delete([getInviteCacheKey(profileId, challenge)]);
};

export const getInviteStatus = async (
    profileId: string,
    challenge: string
): Promise<{ isValid: boolean; isExpired: boolean; message?: string }> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge));

    if (!result) {
        return { isValid: false, isExpired: true, message: 'Invite not found or has expired' };
    }

    if (result === NEVER_EXPIRE || result === VALID) return { isValid: true, isExpired: false };

    // This case should not happen, but we include it for completeness
    return { isValid: false, isExpired: true, message: 'Invite has expired' };
};

// Alias for invalidateInviteForProfile to match the name used in the route
export const invalidateInvite = invalidateInviteForProfile;