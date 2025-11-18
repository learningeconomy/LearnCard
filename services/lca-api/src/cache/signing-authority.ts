import cache from '@cache';
import { SigningAuthorityMeta } from 'types/signing-authority';

export const getSigningAuthorityKey = (did: string, name: string): string => `sa|${did}|${name}`;

export const getSigningAuthorityForDid = async (
    did: string,
    name: string
): Promise<string | null | undefined> => {
    return cache.get(getSigningAuthorityKey(did, name));
};

export const getSigningAuthoritiesForDid = async (did: string): Promise<SigningAuthorityMeta[]> => {
    const keys = await cache.keys(getSigningAuthorityKey(did, '*'), 5000);

    if (!keys) return [];

    return (
        await Promise.all(
            keys.map(async key => {
                return {
                    ownerDid: did,
                    name: (key + '').slice(3).replace(did + '|', ''),
                    seed: await cache.get(key),
                };
            })
        )
    ).filter(sa => !!sa.seed) as SigningAuthorityMeta[];
};

export const addSigningAuthorityForDid = async (did: string, name: string, seed: string) => {
    return cache.set(getSigningAuthorityKey(did, name), seed, 0);
};

export const deleteSigningAuthorityForDid = async (did: string, name: string) => {
    return cache.delete([getSigningAuthorityKey(did, name)]);
};
