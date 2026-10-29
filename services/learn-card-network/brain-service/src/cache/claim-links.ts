import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import cache from '@cache';
import type { ClaimLinkTerminalReason } from '@learncard/types';
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
const outcomeKey = (boostUri: string, challenge: string): string =>
    `${getClaimLinkCacheKey(boostUri, challenge)}|outcome`;

// After this evidence expires, report unavailable rather than infer why an old link disappeared.
const OUTCOME_RETENTION_SECONDS = 30 * 24 * 60 * 60;
const OutcomeValidator = z.object({
    expiresAt: z.number().optional(),
    reason: z.enum(['exhausted', 'unavailable']).optional(),
});

export const VALID = 'valid';
export type ClaimLinkAvailability = 'available' | ClaimLinkTerminalReason;

export const stringifyClaimLinkValue = (
    claimLinkSA: BoostClaimLinkSigningAuthorityType,
    options: BoostClaimLinkOptionsType,
    generatorProfileId?: string
): string =>
    JSON.stringify({
        claimLinkSA,
        options,
        ...(generatorProfileId ? { generatorProfileId } : {}),
    });

const readLink = async (boostUri: string, challenge: string) => {
    // The general cache facade swallows transport errors; a failed read must not look like expiry.
    const value = await (cache.redis ?? cache.node).get(getClaimLinkCacheKey(boostUri, challenge));
    return value ? BoostClaimLinkCacheValueValidator.parse(JSON.parse(value)) : undefined;
};

export const getClaimLinkAvailability = async (
    boostUri: string,
    challenge: string
): Promise<ClaimLinkAvailability> => {
    const redis = cache.redis ?? cache.node;
    const [value, outcome] = await redis.mget(
        getClaimLinkCacheKey(boostUri, challenge),
        outcomeKey(boostUri, challenge)
    );
    if (value) {
        const link = BoostClaimLinkCacheValueValidator.parse(JSON.parse(value));
        return link.expiresAt !== undefined && link.expiresAt <= Date.now()
            ? 'expired'
            : 'available';
    }
    if (outcome) {
        const evidence = OutcomeValidator.parse(JSON.parse(outcome));
        if (evidence.reason) return evidence.reason;
        if (evidence.expiresAt !== undefined && evidence.expiresAt <= Date.now()) return 'expired';
    }
    return 'unavailable';
};

export const getClaimLinkGeneration = async (
    boostUri: string,
    challenge: string
): Promise<string | undefined> => (await readLink(boostUri, challenge))?.generation;

export const isClaimLinkValidForBoost = async (
    boostUri: string,
    challenge: string
): Promise<typeof VALID | null | undefined> =>
    (await getClaimLinkAvailability(boostUri, challenge)) === 'available' ? VALID : undefined;

export const isClaimLinkAlreadySetForBoost = async (
    boostUri: string,
    challenge: string
): Promise<boolean> => Boolean(await readLink(boostUri, challenge));

export const getTTLForClaimLink = async (
    boostUri: string,
    challenge: string
): Promise<number | undefined> =>
    (cache.redis ?? cache.node).ttl(getClaimLinkCacheKey(boostUri, challenge));

export const setValidClaimLinkForBoost = async (
    boostUri: string,
    challenge: string,
    claimLinkSA: BoostClaimLinkSigningAuthorityType,
    options: BoostClaimLinkOptionsType,
    generatorProfileId?: string
) => {
    const redis = cache.redis ?? cache.node;
    const ttl = options.ttlSeconds;
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    const link = JSON.stringify({
        claimLinkSA,
        options,
        generatorProfileId,
        generation: randomUUID(),
        expiresAt,
    });
    const transaction = redis.multi();
    if (ttl) transaction.set(getClaimLinkCacheKey(boostUri, challenge), link, 'EX', ttl);
    else transaction.set(getClaimLinkCacheKey(boostUri, challenge), link);
    if (ttl)
        transaction.set(
            outcomeKey(boostUri, challenge),
            JSON.stringify({ expiresAt }),
            'EX',
            ttl + OUTCOME_RETENTION_SECONDS
        );
    else transaction.set(outcomeKey(boostUri, challenge), '{}');
    const results = await transaction.exec();
    if (!results || results.some(([error]) => error))
        throw new Error('Claim link could not be stored');
    return 'OK' as const;
};

export const getClaimLinkSAInfoForBoost = async (
    boostUri: string,
    challenge: string
): Promise<BoostClaimLinkSigningAuthorityType | undefined> =>
    (await readLink(boostUri, challenge))?.claimLinkSA;

export const getClaimLinkGeneratorProfileId = async (
    boostUri: string,
    challenge: string
): Promise<string | undefined> => (await readLink(boostUri, challenge))?.generatorProfileId;

export const getClaimLinkOptionsInfoForBoost = async (
    boostUri: string,
    challenge: string
): Promise<BoostClaimLinkOptionsType | undefined> => (await readLink(boostUri, challenge))?.options;

// Count and replay evidence share one value. CAS also works with the existing in-memory Redis adapter,
// whose Lua VM has no cjson module; both adapters execute exactly the same atomic update.
const CONSUME_LINK = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
if ARGV[3] == 'exhausted' then
    redis.call('SET', KEYS[2], '{"reason":"exhausted"}', 'EX', ARGV[4])
    redis.call('DEL', KEYS[1])
else
    redis.call('SET', KEYS[1], ARGV[2], 'KEEPTTL')
end
return 1
`;

/** Consume finite capacity once for an accepted request, including interrupted finalization retries. */
export const useClaimLinkForBoost = async (
    boostUri: string,
    challenge: string,
    usageId?: string,
    expectedGeneration?: string
): Promise<boolean | undefined> => {
    const redis = cache.redis ?? cache.node;
    const key = getClaimLinkCacheKey(boostUri, challenge);
    while (true) {
        const value = await redis.get(key);
        if (!value) return true;
        const link = BoostClaimLinkCacheValueValidator.parse(JSON.parse(value));
        if (usageId && link.generation !== expectedGeneration) return true;
        if (usageId && link.completedRequests?.[usageId]) return true;
        if (!link.options.totalUses) return true;
        link.options.totalUses -= 1;
        if (usageId) {
            link.completedRequests ??= {};
            link.completedRequests[usageId] = true;
        }
        const exhausted = link.options.totalUses <= 0;
        const updated = await redis.eval(
            CONSUME_LINK,
            2,
            key,
            outcomeKey(boostUri, challenge),
            value,
            exhausted ? '' : JSON.stringify(link),
            exhausted ? 'exhausted' : '',
            OUTCOME_RETENTION_SECONDS
        );
        if (updated) return true;
        // Only a competing atomic update retries; transport failures propagate without replay.
    }
};

export const invalidateClaimLinkForBoost = async (boostUri: string, challenge: string) => {
    const redis = cache.redis ?? cache.node;
    const results = await redis
        .multi()
        .set(
            outcomeKey(boostUri, challenge),
            JSON.stringify({ reason: 'unavailable' }),
            'EX',
            OUTCOME_RETENTION_SECONDS
        )
        .del(getClaimLinkCacheKey(boostUri, challenge))
        .exec();
    if (!results || results.some(([error]) => error))
        throw new Error('Claim link could not be invalidated');
    return Number(results[1]?.[1] ?? 0);
};
