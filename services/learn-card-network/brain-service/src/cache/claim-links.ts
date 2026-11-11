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

// Namespace before encoded components: caller-controlled challenges can never name metadata.
const keyComponents = (boostUri: string, challenge: string): string =>
    Buffer.from(JSON.stringify([normalizeBoostUriForClaimLinkKey(boostUri), challenge])).toString(
        'base64url'
    );
export const getClaimLinkCacheKey = (boostUri: string, challenge: string): string =>
    `claimLink:v2:live|${keyComponents(boostUri, challenge)}`;
export const getClaimLinkOutcomeKey = (boostUri: string, challenge: string): string =>
    `claimLink:v2:outcome|${keyComponents(boostUri, challenge)}`;
export const getClaimLinkReplayKey = (
    boostUri: string,
    challenge: string,
    generation = 'legacy'
): string => `claimLink:v2:replay|${keyComponents(boostUri, challenge)}|${generation}`;
const legacyKey = (boostUri: string, challenge: string): string =>
    `claimLink|${normalizeBoostUriForClaimLinkKey(boostUri)}|${challenge}`;

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

// Upgrade on first access, atomically with respect to creation, consumption and invalidation.
// Never treat an old metadata key as a link, or move a colliding live link as metadata.
// Keep genuine replay sets so a lost consumption acknowledgement cannot spend capacity twice.
const MIGRATE_LINK = `
if redis.call('EXISTS', KEYS[1], KEYS[2]) > 0 then return 0 end
if ARGV[1] ~= '' and redis.call('GET', KEYS[3]) ~= ARGV[1] then return -1 end
if ARGV[2] ~= '' and redis.call('GET', KEYS[4]) ~= ARGV[2] then return -1 end
if ARGV[2] ~= '' then redis.call('RENAME', KEYS[4], KEYS[2]) end
if ARGV[1] == '' then return 1 end
local ttl = redis.call('PTTL', KEYS[3])
if ttl == 0 or ttl == -2 then return 0 end
if ttl > 0 then redis.call('SET', KEYS[1], ARGV[1], 'PX', ttl)
else redis.call('SET', KEYS[1], ARGV[1]) end
redis.call('DEL', KEYS[3])
if ttl > 0 and redis.call('EXISTS', KEYS[2]) == 0 then
  redis.call('SET', KEYS[2], '{"expiresAt":' .. (tonumber(ARGV[3]) + ttl) .. '}',
      'PX', ttl + tonumber(ARGV[4]))
end
local kind = redis.call('TYPE', KEYS[5])
if type(kind) == 'table' then kind = kind.ok end
if kind == 'set' then redis.call('RENAME', KEYS[5], KEYS[6]) end
return 1
`;

const migrateLegacyLink = async (boostUri: string, challenge: string): Promise<void> => {
    const redis = cache.redis ?? cache.node;
    const key = getClaimLinkCacheKey(boostUri, challenge);
    const outcome = getClaimLinkOutcomeKey(boostUri, challenge);
    const oldKey = legacyKey(boostUri, challenge);
    const oldOutcome = `${oldKey}|outcome`;
    for (let attempt = 0; attempt < MAX_CONTENTION_ATTEMPTS; attempt++) {
        if ((await redis.exists(key, outcome)) > 0) return;
        // Old suffix keys may hold another live link, outcome JSON or a replay set.
        const rawLink = (await redis.type(oldKey)) === 'string' ? await redis.get(oldKey) : null;
        const parsedLink = rawLink !== null ? JSON.parse(rawLink) : undefined;
        const link = BoostClaimLinkCacheValueValidator.safeParse(parsedLink);
        const possibleMetadata = OutcomeValidator.strict().safeParse(parsedLink);
        const isKnownMetadata =
            possibleMetadata.success &&
            (possibleMetadata.data.expiresAt !== undefined ||
                possibleMetadata.data.reason !== undefined);
        if (rawLink !== null && !link.success && !isKnownMetadata) {
            throw new Error('Invalid legacy claim link');
        }
        const rawOutcome =
            (await redis.type(oldOutcome)) === 'string' ? await redis.get(oldOutcome) : null;
        const parsedOutcome = rawOutcome ? JSON.parse(rawOutcome) : undefined;
        const evidence = OutcomeValidator.strict().safeParse(parsedOutcome);
        const hasEvidence =
            evidence.success &&
            (evidence.data.expiresAt !== undefined || evidence.data.reason !== undefined);
        if (!link.success && !hasEvidence) return;
        const generation = link.success ? link.data.generation : undefined;
        const result = await redis.eval(
            MIGRATE_LINK,
            6,
            key,
            outcome,
            oldKey,
            oldOutcome,
            `${oldKey}|replay|${generation ?? 'legacy'}`,
            getClaimLinkReplayKey(boostUri, challenge, generation),
            link.success ? rawLink! : '',
            hasEvidence ? rawOutcome! : '',
            Date.now(),
            OUTCOME_RETENTION_SECONDS * 1000
        );
        if (result !== -1) return;
    }
    throw new Error('Claim-link migration contention; retry');
};

const readLink = async (boostUri: string, challenge: string) => {
    await migrateLegacyLink(boostUri, challenge);
    // The general cache facade swallows transport errors; a failed read must not look like expiry.
    const value = await (cache.redis ?? cache.node).get(getClaimLinkCacheKey(boostUri, challenge));
    return value ? BoostClaimLinkCacheValueValidator.parse(JSON.parse(value)) : undefined;
};

export const getClaimLinkAvailability = async (
    boostUri: string,
    challenge: string
): Promise<ClaimLinkAvailability> => {
    const redis = cache.redis ?? cache.node;
    await migrateLegacyLink(boostUri, challenge);
    const [value, outcome] = await redis.mget(
        getClaimLinkCacheKey(boostUri, challenge),
        getClaimLinkOutcomeKey(boostUri, challenge)
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
): Promise<number | undefined> => {
    await migrateLegacyLink(boostUri, challenge);
    return (cache.redis ?? cache.node).ttl(getClaimLinkCacheKey(boostUri, challenge));
};

export const setValidClaimLinkForBoost = async (
    boostUri: string,
    challenge: string,
    claimLinkSA: BoostClaimLinkSigningAuthorityType,
    options: BoostClaimLinkOptionsType,
    generatorProfileId?: string
) => {
    const redis = cache.redis ?? cache.node;
    await migrateLegacyLink(boostUri, challenge);
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
            getClaimLinkOutcomeKey(boostUri, challenge),
            JSON.stringify({ expiresAt }),
            'EX',
            ttl + OUTCOME_RETENTION_SECONDS
        );
    else transaction.del(getClaimLinkOutcomeKey(boostUri, challenge));
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
    await migrateLegacyLink(boostUri, challenge);
    const key = getClaimLinkCacheKey(boostUri, challenge);
    for (let attempt = 0; attempt < MAX_CONTENTION_ATTEMPTS; attempt++) {
        const value = await redis.get(key);
        if (!value) return true;
        const link = BoostClaimLinkCacheValueValidator.parse(JSON.parse(value));
        if (usageId && link.generation !== expectedGeneration) return true;
        if (!link.options.totalUses) return true;
        const replayKey = getClaimLinkReplayKey(boostUri, challenge, link.generation);
        link.options.totalUses -= 1;
        const exhausted = link.options.totalUses <= 0;
        const updated = await redis.eval(
            CONSUME_LINK,
            3,
            key,
            getClaimLinkOutcomeKey(boostUri, challenge),
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
    await migrateLegacyLink(boostUri, challenge);
    const key = getClaimLinkCacheKey(boostUri, challenge);
    for (let attempt = 0; attempt < MAX_CONTENTION_ATTEMPTS; attempt++) {
        const snapshot = await redis.get(key);
        if (!snapshot) return 0;
        const generation = BoostClaimLinkCacheValueValidator.parse(JSON.parse(snapshot)).generation;
        const deleted = await redis.eval(
            INVALIDATE_LINK,
            3,
            key,
            getClaimLinkOutcomeKey(boostUri, challenge),
            getClaimLinkReplayKey(boostUri, challenge, generation),
            snapshot,
            OUTCOME_RETENTION_SECONDS
        );
        if (deleted !== -1) return Number(deleted);
    }
    throw new Error('Claim-link invalidation contention; retry');
};
