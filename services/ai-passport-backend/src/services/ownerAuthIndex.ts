import { REDIS_PREFIX } from '../constants/env';
import { getPrivacySubjectRef } from '../ai/privacy-keys';
import cache, { evalOwnerMutation, type RedisScriptStore } from '../utils/cache';
import { isDataErasureRequested, PRIVACY_MAINTENANCE_KEY } from './dataErasure';

export const ownerAuthenticationIndexKey = (did: string): string =>
    `${REDIS_PREFIX}:privacy:auth-index:${getPrivacySubjectRef(did)}`;

const authenticationPatterns = [
    `${REDIS_PREFIX}:did-auth:challenge:*`,
    `${REDIS_PREFIX}:did-auth:session:*`,
    `${REDIS_PREFIX}:did-auth:session-handoff:*`,
    `${REDIS_PREFIX}:did-auth:websocket-ticket:*`,
    'oauth:authcode:*',
    'oauth:refresh:*',
    'oauth:session:*',
];
const isAuthenticationKey = (key: string) =>
    authenticationPatterns.some(pattern => key.startsWith(pattern.slice(0, -1)));
const recordOwner = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const did = (value as Record<string, unknown>).did;
    return typeof did === 'string' && did.startsWith('did:') ? did : undefined;
};
const store = () => {
    if (!cache.redis) throw new Error('Persistent Redis is required for authentication indexing');
    return cache.redis;
};

// Redis server time and the record's actual TTL keep the index conservative.
// The index expires with its last record, even if its owner never returns.
export const INDEX_AUTHENTICATION_RECORD_SCRIPT = `
local clock = redis.call("TIME")
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
redis.call("ZREMRANGEBYSCORE", indexKey, "-inf", now)
local ttl = redis.call("PTTL", recordKey)
if ttl == -1 then
  redis.call("ZADD", indexKey, "+inf", member)
elseif ttl > 0 then
  redis.call("ZADD", indexKey, now + ttl, member)
else
  redis.call("ZREM", indexKey, member)
end
local last = redis.call("ZREVRANGE", indexKey, 0, 0, "WITHSCORES")
if #last > 0 then
  if last[2] == "inf" then redis.call("PERSIST", indexKey)
  else redis.call("PEXPIREAT", indexKey, math.ceil(tonumber(last[2]))) end
end
`;

export const setOwnerAuthenticationRecord = async (
    redis: RedisScriptStore,
    did: string,
    key: string,
    value: string,
    ttl: number
): Promise<void> => {
    if (
        !isAuthenticationKey(key) ||
        recordOwner(JSON.parse(value)) !== did ||
        !Number.isInteger(ttl) ||
        ttl <= 0
    )
        throw new Error('Invalid owner authentication record');
    await evalOwnerMutation(
        redis,
        did,
        `
local indexType = redis.call("TYPE", KEYS[5]).ok
if indexType ~= "none" and indexType ~= "zset" then return redis.error_reply("INVALID_AUTHENTICATION_INDEX") end
redis.call("SET", KEYS[4], ARGV[2], "EX", ARGV[3])
local recordKey = KEYS[4]
local indexKey = KEYS[5]
local member = ARGV[4]
${INDEX_AUTHENTICATION_RECORD_SCRIPT}
return 1`,
        [key, ownerAuthenticationIndexKey(did)],
        [value, ttl, key]
    );
};

export const consumeOwnerAuthenticationRecord = async (
    redis: RedisScriptStore,
    did: string,
    key: string,
    expected: string
): Promise<boolean> => {
    if (!isAuthenticationKey(key) || recordOwner(JSON.parse(expected)) !== did)
        throw new Error('Invalid owner authentication record');
    return (
        (await evalOwnerMutation(
            redis,
            did,
            `
if redis.call("GET", KEYS[4]) ~= ARGV[2] then return 0 end
redis.call("DEL", KEYS[4])
redis.call("ZREM", KEYS[5], ARGV[3])
return 1`,
            [key, ownerAuthenticationIndexKey(did)],
            [expected, key]
        )) === 1
    );
};

// This reader also works after the permanent erasure fence is set. It only
// removes stale index members; it cannot issue or renew credentials.
export const readOwnerAuthenticationEntries = async (
    did: string
): Promise<{ key: string; value: unknown }[]> => {
    const redis = store();
    const indexKey = ownerAuthenticationIndexKey(did);
    const keys = await redis.eval(
        `
local clock = redis.call("TIME")
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now)
return redis.call("ZRANGE", KEYS[1], 0, -1)`,
        1,
        indexKey
    );
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string'))
        throw new Error('Invalid owner authentication index');
    const entries: { key: string; value: unknown }[] = [];
    for (const key of keys as string[]) {
        if (!isAuthenticationKey(key)) {
            await redis.zrem(indexKey, key);
            continue;
        }
        // Read and prune atomically, so a replacement cannot lose its index entry.
        const raw = await redis.eval(
            `
local value = redis.call("GET", KEYS[2])
if not value then redis.call("ZREM", KEYS[1], ARGV[2]); return false end
local ok, record = pcall(cjson.decode, value)
if not ok or type(record) ~= "table" then return redis.error_reply("INVALID_AUTHENTICATION_RECORD") end
if record.did ~= ARGV[1] then redis.call("ZREM", KEYS[1], ARGV[2]); return false end
return value`,
            2,
            indexKey,
            key,
            did,
            key
        );
        if (raw === null || raw === false) continue;
        if (typeof raw !== 'string') throw new Error('Invalid authentication record');
        const value: unknown = JSON.parse(raw);
        if (recordOwner(value) !== did) throw new Error('Authentication owner mismatch');
        entries.push({ key, value });
    }
    return entries;
};

// Lifecycle calls this only after all owner writers have drained. The permanent
// fence is checked here too: an index must never disappear under a live writer.
export const deleteOwnerAuthenticationEntries = async (did: string): Promise<number> => {
    if (!(await isDataErasureRequested(did)))
        throw new Error('Authentication deletion requires an erasure fence');
    const redis = store();
    const entries = await readOwnerAuthenticationEntries(did);
    const indexKey = ownerAuthenticationIndexKey(did);
    let deleted = 0;
    for (const { key } of entries) {
        deleted += Number(
            await redis.eval(
                `
local value = redis.call("GET", KEYS[2])
if value then
  local record = cjson.decode(value)
  if record.did ~= ARGV[1] then return redis.error_reply("AUTHENTICATION_OWNER_CHANGED") end
end
redis.call("ZREM", KEYS[1], ARGV[2])
return redis.call("UNLINK", KEYS[2])`,
                2,
                indexKey,
                key,
                did,
                key
            )
        );
    }
    await redis.del(indexKey);
    return deleted;
};

// Offline bootstrap only. Apply must run under the migration maintenance gate;
// dry-run performs no writes, including expiry pruning or index TTL changes.
export const rebuildOwnerAuthenticationIndex = async ({
    apply,
}: {
    apply: boolean;
}): Promise<{
    scanned: number;
    owned: number;
    indexed: number;
    unowned: number;
    invalid: number;
}> => {
    const redis = store();
    if (apply && !(await redis.exists(PRIVACY_MAINTENANCE_KEY)))
        throw new Error('Authentication index rebuild requires privacy maintenance');
    const counts = { scanned: 0, owned: 0, indexed: 0, unowned: 0, invalid: 0 };
    const seen = new Set<string>();
    const prefix = redis.options.keyPrefix ?? '';
    for (const pattern of authenticationPatterns) {
        let cursor = '0';
        do {
            const [next, keys] = await redis.scan(
                cursor,
                'MATCH',
                `${prefix}${pattern}`,
                'COUNT',
                100
            );
            cursor = next;
            for (const physicalKey of keys) {
                const key = physicalKey.slice(prefix.length);
                if (seen.has(key)) continue;
                seen.add(key);
                const raw = await redis.get(key);
                if (raw === null) continue;
                counts.scanned += 1;
                let value: unknown;
                try {
                    value = JSON.parse(raw);
                } catch {
                    counts.invalid += 1;
                    continue;
                }
                const did = recordOwner(value);
                if (!did) {
                    counts.unowned += 1;
                    continue;
                }
                counts.owned += 1;
                if (!apply) continue;
                const indexed = await redis.eval(
                    `
if redis.call("EXISTS", KEYS[1]) == 0 then return redis.error_reply("PRIVACY_MAINTENANCE_REQUIRED") end
if redis.call("GET", KEYS[2]) ~= ARGV[1] then return 0 end
local recordKey = KEYS[2]
local indexKey = KEYS[3]
local member = ARGV[2]
${INDEX_AUTHENTICATION_RECORD_SCRIPT}
return 1`,
                    3,
                    PRIVACY_MAINTENANCE_KEY,
                    key,
                    ownerAuthenticationIndexKey(did),
                    raw,
                    key
                );
                if (indexed === 1) counts.indexed += 1;
            }
        } while (cursor !== '0');
    }
    return counts;
};
