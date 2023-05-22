import cache from '@cache';

export const getChallengeCacheKey = (did: string, challenge: string): string =>
    `challenge|${did}|${challenge}`;

export const VALID = 'valid';

export const isChallengeValidForDid = async (
    did: string,
    challenge: string
): Promise<typeof VALID | null | undefined> => {
    const result = await cache.get(getChallengeCacheKey(did, challenge));

    return result === VALID ? result : undefined;
};

export const setValidChallengeForDid = async (did: string, challenge: string) => {
    return cache.set(getChallengeCacheKey(did, challenge), VALID);
};

export const invalidateChallengeForDid = async (did: string, challenge: string) => {
    return cache.delete([getChallengeCacheKey(did, challenge)]);
};
