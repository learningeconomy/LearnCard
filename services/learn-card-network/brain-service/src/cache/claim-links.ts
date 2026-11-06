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

/** Usage accounting exhausted its bounded retry budget without confirming an update. */
export class ClaimLinkUsageContentionError extends Error {
    constructor() {
        super('Claim-link usage contention; retry reconciliation');
        this.name = 'ClaimLinkUsageContentionError';
    }
}

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
    else transaction.del(outcomeKey(boostUri, challenge));
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

// Replay markers are independent, generation-scoped keys so live link JSON stays bounded.
// Lua carries consumption and marker creation in one atomic operation. The finite contention
// bound turns sustained hot-link races into honest retryable failures.
const CONSUME_LINK = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
if ARGV[3] ~= '' and redis.call('SISMEMBER', KEYS[3], ARGV[3]) == 1 then return 2 end
local ttl = redis.call('PTTL', KEYS[1])
if ttl == 0 or ttl == -2 then
  redis.call('DEL', KEYS[1], KEYS[3])
  return 1
end
if ARGV[3] ~= '' then
  redis.call('SADD', KEYS[3], ARGV[3])
  if ttl > 0 then redis.call('PEXPIRE', KEYS[3], ttl) end
end
if ARGV[4] == 'exhausted' then
    redis.call('SET', KEYS[2], '{"reason":"exhausted"}', 'EX', ARGV[5])
    redis.call('DEL', KEYS[1], KEYS[3])
else
    if ttl > 0 then redis.call('SET', KEYS[1], ARGV[2], 'PX', ttl)
    else redis.call('SET', KEYS[1], ARGV[2]) end
end
return 1
`;

const MAX_CONTENTION_ATTEMPTS = 32;
/** Consume finite capacity once for an accepted request, including interrupted finalization retries. */
export const useClaimLinkForBoost = async (
    boostUri: string,
    challenge: string,
    usageId?: string,
    expectedGeneration?: string
): Promise<boolean | undefined> => {
    const redis = cache.redis ?? cache.node;
    const key = getClaimLinkCacheKey(boostUri, challenge);
    for (let attempt = 0; attempt < MAX_CONTENTION_ATTEMPTS; attempt++) {
        const value = await redis.get(key);
        if (!value) return true;
        const link = BoostClaimLinkCacheValueValidator.parse(JSON.parse(value));
        if (usageId && link.generation !== expectedGeneration) return true;
        if (!link.options.totalUses) return true;
        const replayKey = `${key}|replay|${link.generation ?? 'legacy'}`;
        link.options.totalUses -= 1;
        const exhausted = link.options.totalUses <= 0;
        const updated = await redis.eval(
            CONSUME_LINK,
            3,
            key,
            outcomeKey(boostUri, challenge),
            replayKey,
            value,
            JSON.stringify(link),
            usageId ?? '',
            exhausted ? 'exhausted' : '',
            OUTCOME_RETENTION_SECONDS
        );
        if (updated === 1 || updated === 2) return true;
    }
    throw new ClaimLinkUsageContentionError();
};

const INVALIDATE_LINK = `
local current = redis.call('GET', KEYS[1])
if not current then return 0 end
if current ~= ARGV[1] then return -1 end
redis.call('SET', KEYS[2], '{"reason":"unavailable"}', 'EX', ARGV[2])
local deleted = redis.call('DEL', KEYS[1])
redis.call('DEL', KEYS[3])
return deleted
`;

export const invalidateClaimLinkForBoost = async (boostUri: string, challenge: string) => {
    const redis = cache.redis ?? cache.node;
    const key = getClaimLinkCacheKey(boostUri, challenge);
    for (let attempt = 0; attempt < MAX_CONTENTION_ATTEMPTS; attempt++) {
        const snapshot = await redis.get(key);
        if (!snapshot) return 0;
        const generation = BoostClaimLinkCacheValueValidator.parse(JSON.parse(snapshot)).generation;
        const deleted = await redis.eval(
            INVALIDATE_LINK,
            3,
            key,
            outcomeKey(boostUri, challenge),
            `${key}|replay|${generation ?? 'legacy'}`,
            snapshot,
            OUTCOME_RETENTION_SECONDS
        );
        if (deleted !== -1) return Number(deleted);
    }
    throw new Error('Claim-link invalidation contention; retry');
};
