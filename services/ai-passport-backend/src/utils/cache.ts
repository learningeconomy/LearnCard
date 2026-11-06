import type { RedisValue, RedisKey } from 'ioredis';
import Redis from 'ioredis';
import MemoryRedis from 'ioredis-mock';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../constants/env';
import {
    DataErasureRequestedError,
    getCurrentOwnerOperation,
    getOwnerOperationFence,
    OWNER_OPERATION_FENCE_SCRIPT,
    PRIVACY_MAINTENANCE_KEY,
} from '../services/dataErasure';

export type RedisScriptStore = Pick<Redis, 'eval'>;
// Scripts receive their own keys from KEYS[4] and arguments from ARGV[2].
export const evalOwnerMutation = async (
    store: RedisScriptStore,
    did: string,
    script: string,
    keys: RedisKey[],
    args: RedisValue[] = []
): Promise<unknown> => {
    const operation = getCurrentOwnerOperation();
    const fence = getOwnerOperationFence();
    if (!operation || operation.did !== did || !fence) throw new DataErasureRequestedError();
    try {
        return await store.eval(
            `${OWNER_OPERATION_FENCE_SCRIPT}\n${script}`,
            keys.length + 3,
            fence.tombstoneKey,
            fence.operationsKey,
            PRIVACY_MAINTENANCE_KEY,
            ...keys,
            fence.token,
            ...args
        );
    } catch (error) {
        if (error instanceof Error && error.message.includes('OWNER_OPERATION_INACTIVE'))
            throw new DataErasureRequestedError();
        throw error;
    }
};
const requiresOwner = (key: RedisKey) =>
    /^(topics:|credential-ingestion-state:|single-flight:|topic-generation:|ai-insight-generation:|oauth:(authcode|refresh):)|:did-auth:(session|session-handoff|websocket-ticket):/.test(
        String(key)
    );
const simpleScan = async (redis: Redis, pattern: string): Promise<string[]> => {
    const { promise, resolve, reject } = Promise.withResolvers<string[]>();
    const results = new Set<string>();
    const stream = redis.scanStream({ match: pattern });
    stream.on('data', (keys: string[]) => {
        for (const key of keys) results.add(key);
    });
    stream.on('end', () => resolve([...results]));
    stream.on('error', reject);
    return promise;
};
export type Cache = {
    node: Redis;
    redis?: Redis;
    set: (
        key: RedisKey,
        value: RedisValue,
        ttl?: number | false,
        keepTtl?: boolean
    ) => Promise<'OK'>;
    mset: (values: Record<string, RedisValue>, ttl?: number, keepTtl?: boolean) => Promise<'OK'>;
    get: (key: RedisKey, resetTTL?: boolean, ttl?: number) => Promise<string | null>;
    keys: (pattern: string) => Promise<RedisKey[]>;
    delete: (keys: RedisKey[]) => Promise<number>;
    ttl: (key: RedisKey) => Promise<number>;
};
const DEFAULT_TTL_SECS = 60 * 60;
export const getCache = (): Cache => {
    const mutate = async (script: string, keys: RedisKey[], args: RedisValue[]) => {
        const operation = getCurrentOwnerOperation();
        if (operation) {
            if (!cache.redis)
                throw new Error('Persistent Redis is required for owner cache writes');
            return evalOwnerMutation(cache.redis, operation.did, script, keys, args);
        }
        if (keys.some(requiresOwner)) throw new DataErasureRequestedError();
        // Preserve the same script layout for unowned caches (no owner guard).
        return (cache.redis ?? cache.node).eval(
            script,
            keys.length + 3,
            '',
            '',
            '',
            ...keys,
            '',
            ...args
        );
    };
    const cache: Cache = {
        node: new MemoryRedis(),
        set: async (key, value, ttl = DEFAULT_TTL_SECS, keepTtl = false) => {
            await mutate(
                `
if ARGV[3] == "keep" then return redis.call("SET", KEYS[4], ARGV[2], "KEEPTTL") end
if tonumber(ARGV[3]) > 0 then return redis.call("SET", KEYS[4], ARGV[2], "EX", ARGV[3]) end
return redis.call("SET", KEYS[4], ARGV[2])`,
                [key],
                [value, keepTtl ? 'keep' : ttl || 0]
            );
            return 'OK';
        },
        mset: async (values, ttl = DEFAULT_TTL_SECS, keepTtl = false) => {
            const entries = Object.entries(values);
            if (!entries.length) return 'OK';
            await mutate(
                `
for i = 4, #KEYS do
  if ARGV[2] == "keep" then redis.call("SET", KEYS[i], ARGV[i-1], "KEEPTTL")
  elseif tonumber(ARGV[2]) > 0 then redis.call("SET", KEYS[i], ARGV[i-1], "EX", ARGV[2])
  else redis.call("SET", KEYS[i], ARGV[i-1]) end
end
return "OK"`,
                entries.map(([key]) => key),
                [keepTtl ? 'keep' : ttl, ...entries.map(([, value]) => value)]
            );
            return 'OK';
        },
        get: async (key, resetTTL = false, ttl = DEFAULT_TTL_SECS) =>
            resetTTL
                ? ((await mutate(
                      `return redis.call("GETEX", KEYS[4], "EX", ARGV[2])`,
                      [key],
                      [ttl]
                  )) as string | null)
                : (cache.redis ?? cache.node).get(key),
        keys: pattern => simpleScan(cache.redis ?? cache.node, pattern),
        delete: async keys =>
            keys.length
                ? Number(await mutate(`return redis.call("UNLINK", unpack(KEYS, 4))`, keys, []))
                : 0,
        ttl: key => (cache.redis ?? cache.node).ttl(key),
    };
    if (REDIS_HOST && !Number.isNaN(REDIS_PORT)) {
        cache.redis = new Redis({
            host: REDIS_HOST,
            port: REDIS_PORT,
            ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
            retryStrategy: (times: number) => Math.min(times * 50, 2000),
            enableAutoPipelining: true,
        });
    }
    return cache;
};
export default getCache();
