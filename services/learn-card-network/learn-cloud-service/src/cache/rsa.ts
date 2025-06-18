import cache from '@cache';
import type { KeyPair } from '@helpers/crypto.helpers';

/** 1 Week */
export const RSA_TTL = 60 * 60 * 24 * 7;

export const getRsaCacheKey = (): string => '__SPECIAL__RSA__';

export const getRsaInfo = async (): Promise<
    { keypair: KeyPair; kid: string } | null | undefined
> => {
    const result = await cache.get(getRsaCacheKey(), true, RSA_TTL);

    return result && JSON.parse(result);
};

export const setRsaInfo = async (keyInfo: { keypair: KeyPair; kid: string }) => {
    return cache.set(getRsaCacheKey(), JSON.stringify(keyInfo), RSA_TTL);
};
