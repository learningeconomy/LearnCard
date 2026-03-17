import cache from '@cache';
import {
    BoostClaimLinkSigningAuthorityType,
    BoostClaimLinkOptionsType,
    BoostClaimLinkCacheValueValidator,
} from 'types/boost';
import { escapeColonsInDomain } from '@helpers/uri.helpers';

const normalizeBoostUriForClaimLinkKey = (boostUri: string): string => {
    try {
        return escapeColonsInDomain(decodeURIComponent(boostUri));
    } catch {
        return escapeColonsInDomain(boostUri);
    }
};

export const getClaimLinkCacheKey = (boostUri: string, challenge: string): string =>
    `claimLink|${normalizeBoostUriForClaimLinkKey(boostUri)}|${challenge}`;

export const VALID = 'valid';

export const stringifyClaimLinkValue = (
    claimLinkSA: BoostClaimLinkSigningAuthorityType,
    options: BoostClaimLinkOptionsType,
    generatorProfileId?: string
): string => {
    return JSON.stringify({
        claimLinkSA,
        options,
        ...(generatorProfileId ? { generatorProfileId } : {}),
    });
};

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

export const setValidClaimLinkForBoost = async (
    boostUri: string,
    challenge: string,
    claimLinkSA: BoostClaimLinkSigningAuthorityType,
    options: BoostClaimLinkOptionsType,
    generatorProfileId?: string
) => {
    return cache.set(
        getClaimLinkCacheKey(boostUri, challenge),
        stringifyClaimLinkValue(claimLinkSA, options, generatorProfileId),
        options.ttlSeconds ?? false
    );
};

export const getClaimLinkSAInfoForBoost = async (
    boostUri: string,
    challenge: string
): Promise<BoostClaimLinkSigningAuthorityType | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    if (!result) return;
    const validated = await BoostClaimLinkCacheValueValidator.spa(JSON.parse(result));
    if (!validated.success) {
        console.warn(
            '[getClaimLinkSAInfoForBoost] Malformed claim link stored in cache',
            validated,
            boostUri,
            challenge
        );
        return;
    }
    return validated.data.claimLinkSA;
};

export const getClaimLinkGeneratorProfileId = async (
    boostUri: string,
    challenge: string
): Promise<string | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    if (!result) return;

    const validated = await BoostClaimLinkCacheValueValidator.spa(JSON.parse(result));
    if (!validated.success) return;

    return validated.data.generatorProfileId;
};

export const getClaimLinkOptionsInfoForBoost = async (
    boostUri: string,
    challenge: string
): Promise<BoostClaimLinkOptionsType | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    if (!result) return;
    const validated = await BoostClaimLinkCacheValueValidator.spa(JSON.parse(result));
    if (!validated.success) {
        console.warn(
            '[getClaimLinkSAInfoForBoost] Malformed claim link stored in cache',
            validated,
            boostUri,
            challenge
        );
        return;
    }
    return validated.data.options;
};

export const useClaimLinkForBoost = async (
    boostUri: string,
    challenge: string
): Promise<boolean | undefined> => {
    const result = await cache.get(getClaimLinkCacheKey(boostUri, challenge));
    if (!result) return;
    const parsed = JSON.parse(result);
    const validated = await BoostClaimLinkCacheValueValidator.spa(parsed);
    if (!validated.success) {
        console.warn(
            '[useClaimLinkForBoost] Malformed claim link stored in cache',
            validated,
            boostUri,
            challenge
        );
        return;
    }
    if (validated.data.options && validated.data.options.totalUses) {
        const usesLeft = validated.data.options.totalUses - 1;
        if (usesLeft <= 0) {
            await invalidateClaimLinkForBoost(boostUri, challenge);
            return true;
        }
        cache.set(
            getClaimLinkCacheKey(boostUri, challenge),
            stringifyClaimLinkValue(validated.data.claimLinkSA, {
                ...validated.data.options,
                totalUses: usesLeft,
            }, validated.data.generatorProfileId),
            undefined,
            true
        );
    }
    return true;
};

export const invalidateClaimLinkForBoost = async (boostUri: string, challenge: string) => {
    return cache.delete([getClaimLinkCacheKey(boostUri, challenge)]);
};
