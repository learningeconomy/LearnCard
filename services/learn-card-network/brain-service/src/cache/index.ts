import Redis, { type RedisKey, type RedisValue } from 'ioredis';
import MemoryRedis, { type Redis as RedisMockType } from 'ioredis-mock';

const simpleScan = async (redis: Redis, pattern: string): Promise<string[]> => {
    try {
        return await new Promise<string[]>(res => {
            const results: string[] = [];
            const stream = redis.scanStream({ match: pattern });

            stream.on('data', keys => {
                const dedupedKeys = keys.filter((key: string) => !results.includes(key));

                results.push(...dedupedKeys);
            });

            stream.on('end', () => res(results));

            stream.on('error', error => {
                console.error('Cache simpleScan error', error);
                res([]);
            });
        });
    } catch (error) {
        console.error('Cache simpleScan error', error);
        return [];
    }
};

/**
 * Server caching layer. Intended for managing cross-session, cross-request data.
 * Prefers Redis infrastructure, but will fallback to ioredis-mock if no config exists.
 *
 * NOTE: Basic get/set/keys/delete are provided. For more complex use of Redis, access at cache.redis
 */
export type Cache = {
    /** In-memory Redis instance. This is only used if you do not have Redis set up! */
    node: RedisMockType;

    /** Real Redis instance. This is used if you have Redis set up! */
    redis?: Redis;

    /**
     * Sets a key to a given value in the cache.
     * Optionally give it a time to live before being evicted (defaults to 1 hour)
     */
    set: (
        key: RedisKey,
        value: RedisValue,
        ttl?: number | false,
        keepTtl?: boolean
    ) => Promise<'OK' | undefined>;

    /**
     * Sets a key to a given value in the cache.
     * Optionally give it a time to live before being evicted (defaults to 1 hour)
     */
    mset: (
        values: Record<string, RedisValue>,
        ttl?: number,
        keepTtl?: boolean
    ) => Promise<'OK' | undefined>;

    /** Gets a key from the cache, optionally reseting it's time to live */
    get: (key: RedisKey, resetTTL?: boolean, ttl?: number) => Promise<string | null | undefined>;

    /** Returns an array of keys matching a pattern */
    keys: (pattern: string) => Promise<RedisKey[] | undefined>;

    /** Forcibly evicts a key or keys from the cache */
    delete: (keys: RedisKey[]) => Promise<number | undefined>;

    /** Gets TTL of a key **/
    ttl: (key: RedisKey) => Promise<number | undefined>;
};

/** Evict all keys after one hour by default */
const DEFAULT_TTL_SECS = 60 * 60;

export const getCache = (): Cache => {
    const cache: Cache = {
        node: new MemoryRedis(),
        set: async (key, value, ttl = DEFAULT_TTL_SECS, keepTtl = false) => {
            if (keepTtl) {
                try {
                    if (cache?.redis) return await cache.redis.set(key, value, 'KEEPTTL');
                    if (cache?.node) return await cache.node.set(key, value, 'KEEPTTL');
                } catch (error) {
                    console.error('Cache set error', error);
                }
            } else if (ttl) {
                try {
                    if (cache?.redis) return await cache.redis.setex(key, ttl, value);
                    if (cache?.node) return await cache.node.setex(key, ttl, value);
                } catch (error) {
                    console.error('Cache set error', error);
                }
            } else {
                try {
                    if (cache?.redis) return await cache.redis.set(key, value);
                    if (cache?.node) return await cache.node.set(key, value);
                } catch (error) {
                    console.error('Cache set error', error);
                }
            }

            return undefined;
        },
        mset: async (values, ttl = DEFAULT_TTL_SECS, keepTtl = false) => {
            try {
                if (keepTtl || ttl) {
                    if (cache?.redis) {
                        const pipeline = cache.redis.pipeline();

                        Object.entries(values).forEach(([key, value]) => {
                            if (keepTtl) pipeline.set(key, value, 'KEEPTTL');
                            else pipeline.setex(key, ttl, value);
                        });

                        await pipeline.exec();

                        return 'OK';
                    }
                    if (cache?.node) {
                        const pipeline = cache.node.pipeline();

                        Object.entries(values).forEach(([key, value]) => {
                            if (keepTtl) pipeline.set(key, value, 'KEEPTTL');
                            else pipeline.setex(key, ttl, value);
                        });

                        await pipeline.exec();

                        return 'OK';
                    }
                } else {
                    if (cache?.redis) return await cache.redis.mset(values);
                    if (cache?.node) return await cache.node.mset(values);
                }
            } catch (error) {
                console.error('Cache set error', error);
            }

            return undefined;
        },
        get: async (key, resetTTL = false, ttl = DEFAULT_TTL_SECS) => {
            try {
                if (resetTTL) {
                    if (cache?.redis) return await cache.redis.getex(key, 'EX', ttl);
                    if (cache?.node) return await cache.node.getex(key, 'EX', ttl);
                } else {
                    if (cache?.redis) return await cache.redis.get(key);
                    if (cache?.node) return await cache.node.get(key);
                }
            } catch {
                // logger.error('Cache get error', e);
            }

            return undefined;
        },
        keys: async pattern => {
            try {
                if (cache?.redis) return await simpleScan(cache.redis, pattern);
                if (cache?.node) return await simpleScan(cache.node, pattern);
            } catch (error) {
                console.error('Cache keys error', error);
            }

            return undefined;
        },
        delete: async keys => {
            if (keys.length === 0) return;

            try {
                if (cache?.redis) return await cache.redis.unlink(keys);
                if (cache?.node) return await cache.node.unlink(keys);
            } catch (error) {
                console.error('Cache delete error', error);
            }

            return undefined;
        },
        ttl: async key => {
            try {
                if (cache?.redis) return await cache.redis.ttl(key);
                if (cache?.node) return await cache.node.ttl(key);
            } catch {
                // logger.error('Cache get error', e);
            }

            return undefined;
        },
    };

    try {
        const { REDIS_HOST: url, REDIS_PORT: _port } = process.env;
        const port = parseInt(_port ?? '');

        if (url && !Number.isNaN(port)) {
            console.info('Setting up Redis-backed cache');

            cache.redis = new Redis({
                host: url,
                port: port,
                retryStrategy: (times: number) => Math.min(times * 50, 2000),
                enableAutoPipelining: true,
            });
        }
    } catch (error) {
        console.error('Could not connect to redis', error);
        delete cache.redis;
    }

    return cache;
};

export default getCache();
