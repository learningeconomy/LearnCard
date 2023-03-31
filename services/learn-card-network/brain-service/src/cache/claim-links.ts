import cache from '@cache';
import { BoostClaimLinkSigningAuthorityType, BoostClaimLinkOptionsType, BoostClaimLinkCacheValueValidator } from 'types/boost';

export const getClaimLinkCacheKey = (boostUri: string, challenge: string): string =>
    `claimLink|${boostUri}|${challenge}`;

export const VALID = 'valid';

export const stringifyClaimLinkValue = (claimLinkSA: BoostClaimLinkSigningAuthorityType, options: BoostClaimLinkOptionsType): string => {
    return JSON.stringify({
        claimLinkSA,
        options
    })
}

export const isClaimLinkValidForBoost = async (
    boostUri: string,
    challenge: string
): Promise<typeof VALID | null | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    return result ? VALID : undefined;
};

export const isClaimLinkAlreadySetForBoost = async (
    boostUri: string,
    challenge: string
): Promise<boolean> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    return Boolean(result);
};


export const getTTLForClaimLink = async (
    boostUri: string,
    challenge: string
): Promise<number | undefined> => {
    return cache.ttl(getClaimLinkCacheKey(boostUri, challenge));
};

export const setValidClaimLinkForBoost = async (boostUri: string, challenge: string, claimLinkSA: BoostClaimLinkSigningAuthorityType, options: BoostClaimLinkOptionsType) => {
    return cache.set(getClaimLinkCacheKey(boostUri, challenge), stringifyClaimLinkValue(claimLinkSA, options), options.ttlSeconds);
};

export const getClaimLinkSAInfoForBoost = async (
    boostUri: string,
    challenge: string
): Promise<BoostClaimLinkSigningAuthorityType | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    if(!result) return;
    const validated = await BoostClaimLinkCacheValueValidator.spa(JSON.parse(result));
    if(!validated.success) {
        console.warn("[getClaimLinkSAInfoForBoost] Malformed claim link stored in cache", validated, boostUri, challenge);
        return;
    }
    return validated.data.claimLinkSA;
};

export const getClaimLinkOptionsInfoForBoost = async (
    boostUri: string,
    challenge: string
): Promise<BoostClaimLinkSigningAuthorityType | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    if(!result) return;
    const validated = await BoostClaimLinkCacheValueValidator.spa(JSON.parse(result));
    if(!validated.success) {
        console.warn("[getClaimLinkSAInfoForBoost] Malformed claim link stored in cache", validated, boostUri, challenge);
        return;
    }
    return validated.data.options;
};

export const useClaimLinkForBoost = async (
    boostUri: string,
    challenge: string
): Promise<boolean | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    if(!result) return;
    const parsed = JSON.parse(result);
    const validated = await BoostClaimLinkCacheValueValidator.spa(parsed);
    if(!validated.success) {
        console.warn("[useClaimLinkForBoost] Malformed claim link stored in cache", validated, boostUri, challenge);
        return;
    }
    if(validated.data.options && validated.data.options.totalUses) {
        const usesLeft = validated.data.options.totalUses - 1;
        if(usesLeft <= 0) {
            await invalidateClaimLinkForBoost(boostUri, challenge)
            return true;
        } 
        cache.set(getClaimLinkCacheKey(boostUri, challenge), stringifyClaimLinkValue(validated.data.claimLinkSA, { ...validated.data.options, totalUses: usesLeft }), undefined, true)
    }
    return true;
};


export const invalidateClaimLinkForBoost = async (boostUri: string, challenge: string) => {
    return cache.delete([getClaimLinkCacheKey(boostUri, challenge)]);
};
