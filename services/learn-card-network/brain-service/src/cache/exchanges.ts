import cache from '@cache';

export const getExchangeChallengeCacheKey = (token: string, challenge: string): string =>
    `exchange-challenge|${token}|${challenge}`;

export const VALID = 'valid';
export const EXHAUSTED = 'exhausted';

export const isExchangeChallengeValidForToken = async (
    token: string,
    challenge: string
): Promise<typeof VALID | null | undefined> => {
    const result = await cache.get(getExchangeChallengeCacheKey(token, challenge));

    return result === VALID ? result : undefined;
};

export const getExchangeChallengeStateForToken = async (
    token: string,
    challenge: string
): Promise<typeof VALID | typeof EXHAUSTED | null | undefined> => {
    const result = await cache.get(getExchangeChallengeCacheKey(token, challenge));

    return result === VALID ? VALID : result === EXHAUSTED ? EXHAUSTED : undefined;
};

export const setValidExchangeChallengeForToken = async (token: string, challenge: string) => {
    return cache.set(getExchangeChallengeCacheKey(token, challenge), VALID);
};

export const setValidExchangeChallengesForToken = async (token: string, challenges: string[]) => {
    const values = challenges.reduce<Record<string, typeof VALID>>((acc, cur) => {
        acc[getExchangeChallengeCacheKey(token, cur)] = VALID;

        return acc;
    }, {});

    return cache.mset(values);
};

export const invalidateExchangeChallengeForToken = async (token: string, challenge: string) => {
    return cache.delete([getExchangeChallengeCacheKey(token, challenge)]);
};

export const exhaustExchangeChallengeForToken = async (token: string, challenge: string) => {
    return cache.set(getExchangeChallengeCacheKey(token, challenge), EXHAUSTED);
};