import cache from '@cache';
import { BoostClaimLinkSigningAuthorityType } from 'types/boost';

export const getClaimLinkCacheKey = (boostUri: string, challenge: string): string =>
    `claimLink|${boostUri}|${challenge}`;

export const VALID = 'valid';

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

export const setValidClaimLinkForBoost = async (boostUri: string, challenge: string, claimLinkSA: BoostClaimLinkSigningAuthorityType ) => {
    return cache.set(getClaimLinkCacheKey(boostUri, challenge), JSON.stringify(claimLinkSA));
};

export const getClaimLinkSAInfoForBoost = async (
    boostUri: string,
    challenge: string
): Promise<BoostClaimLinkSigningAuthorityType | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    return result ? JSON.parse(result) as BoostClaimLinkSigningAuthorityType : undefined;
};

export const invalidateClaimLinkForBoost = async (boostUri: string, challenge: string) => {
    return cache.delete([getClaimLinkCacheKey(boostUri, challenge)]);
};
