import cache from '@cache';
import { JWE } from '@learncard/types';

const CREDENTIAL_TTL = 60 * 60 * 24;

export const getCredentialCacheKey = (id: string): string => `credential:${id}`;

export const getCachedCredentialById = async (id: string): Promise<JWE | null | undefined> => {
    const result = await cache.get(getCredentialCacheKey(id), true, CREDENTIAL_TTL);

    return result && JSON.parse(result);
};

export const setCredentialForId = async (id: string, credential: JWE) => {
    return cache.set(getCredentialCacheKey(id), JSON.stringify(credential), CREDENTIAL_TTL);
};

export const deleteCredentialForId = async (id: string) => {
    return cache.delete([getCredentialCacheKey(id)]);
};
