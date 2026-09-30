import cache from '@cache';

export const getChallengeCacheKey = (did: string, challenge: string): string =>
    `challenge|${did}|${challenge}`;

export const VALID = 'valid';
export const DID_CHALLENGE_TTL_SECS = 5 * 60;

export const isChallengeValidForDid = async (
    did: string,
    challenge: string
): Promise<typeof VALID | null | undefined> => {
    const result = await cache.get(getChallengeCacheKey(did, challenge));

    return result === VALID ? result : undefined;
};

/** Atomically validate and consume a challenge so concurrent replays cannot both succeed. */
export const consumeChallengeForDid = async (did: string, challenge: string): Promise<boolean> => {
    const key = getChallengeCacheKey(did, challenge);
    const redis = cache.redis ?? cache.node;
    const value = await redis.getdel(key);

    return value === VALID;
};

export const setValidChallengeForDid = async (did: string, challenge: string) => {
    return cache.set(getChallengeCacheKey(did, challenge), VALID, DID_CHALLENGE_TTL_SECS);
};

export const setValidChallengesForDid = async (did: string, challenges: string[]) => {
    const values = challenges.reduce<Record<string, typeof VALID>>((acc, cur) => {
        acc[getChallengeCacheKey(did, cur)] = VALID;

        return acc;
    }, {});

    return cache.mset(values, DID_CHALLENGE_TTL_SECS);
};

export const invalidateChallengeForDid = async (did: string, challenge: string) => {
    return cache.delete([getChallengeCacheKey(did, challenge)]);
};
