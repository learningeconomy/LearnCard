/// <reference path="../global.d.ts" />

import Redis, { RedisValue, RedisKey } from 'ioredis';
import MemoryRedis, { Redis as RedisMockType } from 'ioredis-mock';

let ioredisInstance: Redis;

export type Pipeline = {
    hset: (key: RedisKey, field: string, value: RedisValue) => Pipeline;
    expire: (key: RedisKey, seconds: number) => Pipeline;
    delete: (key: RedisKey) => Pipeline;
    exec: () => Promise<[Error | null, any][] | null>;
};

const simpleScan = async (
    redis: Redis,
    pattern: string,
    count: number = 100
): Promise<string[]> => {
    try {
        return await new Promise<string[]>(res => {
            const results: string[] = [];
            const stream = redis.scanStream({ match: pattern, count });

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
        ttl?: number,
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

    /** Gets multiple keys from the cache, optionally reseting their time to live */
    mget: (keys: RedisKey[], resetTTL?: boolean, ttl?: number) => Promise<(string | null)[]>;

    /** Returns an array of keys matching a pattern */
    keys: (pattern: string, count?: number) => Promise<RedisKey[]>;

    /** Forcibly evicts a key or keys from the cache */
    delete: (keys: RedisKey[]) => Promise<number | undefined>;

    /** Gets TTL of a key **/
    ttl: (key: RedisKey) => Promise<number | undefined>;

    /** Sets field in the hash stored at key to value */
    hset: (key: RedisKey, field: string, value: RedisValue) => Promise<number>;

    /** Retrieves the value associated with field in the hash stored at key */
    hget: (key: RedisKey, field: string) => Promise<string | null>;

    /** Sets a timeout on key */
    expire: (key: RedisKey, seconds: number) => Promise<number>;

    /** Creates a Pipeline instance */
    pipeline: () => Pipeline;
};

/** Evict all keys after one hour by default */
const DEFAULT_TTL_SECS = 60 * 60;

export const getCache = (): Cache => {
    const cache: Cache = {
        node: new MemoryRedis(),
        set: async (key, value, ttl = DEFAULT_TTL_SECS, keepTtl = false) => {
            try {
                if (keepTtl) {
                    if (cache?.redis) return await cache.redis.set(key, value, 'KEEPTTL');
                    if (cache?.node) return await cache.node.set(key, value, 'KEEPTTL');
                } else {
                    if (cache?.redis) return await cache.redis.setex(key, ttl, value);
                    if (cache?.node) return await cache.node.setex(key, ttl, value);
                }
            } catch (e) {
                console.error('Cache set error', e);
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
            } catch (e) {
                console.error('Cache set error', e);
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
            } catch (e) {
                // logger.error('Cache get error', e);
            }

            return undefined;
        },
        mget: async (keys, resetTTL = false, ttl = DEFAULT_TTL_SECS) => {
            try {
                if (resetTTL) {
                    if (cache?.redis) {
                        const pipeline = cache.redis.pipeline();

                        keys.forEach(key => pipeline.getex(key, 'EX', ttl));

                        const results = await pipeline.exec();

                        return results?.map(result => result[1] || null) ?? [];
                    }
                    if (cache?.node) {
                        const pipeline = cache.node.pipeline();

                        keys.forEach(key => pipeline.getex(key, 'EX', ttl));

                        const results = await pipeline.exec();

                        return results?.map(result => result[1] || null) ?? [];
                    }
                } else {
                    if (cache?.redis) return await cache.redis.mget(keys);
                    if (cache?.node) return await cache.node.mget(keys);
                }
            } catch (e) {
                // logger.error('Cache get error', e);
            }

            return Array(keys.length).fill(null);
        },
        keys: async (pattern, count) => {
            try {
                if (cache?.redis) return await simpleScan(cache.redis, pattern, count);
                if (cache?.node) return await simpleScan(cache.node, pattern, count);
            } catch (error) {
                console.error('Cache keys error', error);
            }

            return [];
        },
        delete: async keys => {
            if (keys.length === 0) return;

            try {
                if (cache?.redis) return await cache.redis.unlink(keys);
                if (cache?.node) return await cache.node.unlink(keys);
            } catch (e) {
                console.error('Cache delete error', e);
            }

            return undefined;
        },
        ttl: async key => {
            try {
                if (cache?.redis) return await cache.redis.ttl(key);
                if (cache?.node) return await cache.node.ttl(key);
            } catch (e) {
                // logger.error('Cache get error', e);
            }

            return undefined;
        },
        hset: async (key, field, value) => {
            try {
                if (cache?.redis) return await cache.redis.hset(key, field, value);
                if (cache?.node) return await cache.node.hset(key, field, value);
            } catch (e) {
                console.error('Cache hset error', e);
            }
            return 0;
        },

        hget: async (key, field) => {
            try {
                if (cache?.redis) return await cache.redis.hget(key, field);
                if (cache?.node) return await cache.node.hget(key, field);
            } catch (e) {
                console.error('Cache hget error', e);
            }
            return null;
        },

        expire: async (key, seconds) => {
            try {
                if (cache?.redis) return await cache.redis.expire(key, seconds);
                if (cache?.node) return await cache.node.expire(key, seconds);
            } catch (e) {
                console.error('Cache expire error', e);
            }
            return 0;
        },

        pipeline: () => {
            const commands: any[] = [];
            const pipeline: Pipeline = {
                hset: (key, field, value) => {
                    commands.push(['hset', key, field, value]);
                    return pipeline;
                },
                expire: (key, seconds) => {
                    commands.push(['expire', key, seconds]);
                    return pipeline;
                },
                delete: key => {
                    commands.push(['del', key]);
                    return pipeline;
                },
                exec: async () => {
                    if (cache?.redis) return await cache.redis.pipeline(commands).exec();
                    if (cache?.node) return await cache.node.pipeline(commands).exec();
                    return commands.map(() => [null, null]);
                },
            };
            return pipeline;
        },
    };

    try {
        const { REDIS_HOST: url, REDIS_PORT: _port } = process.env;
        const port = parseInt(_port ?? '');

        if (url && !Number.isNaN(port)) {
            if (ioredisInstance) {
                console.log('Reusing ioredis instance =)');

                cache.redis = ioredisInstance;
            }

            console.info('Setting up Redis-backed cache =(');

            ioredisInstance = new Redis({
                host: url,
                port: port,
                retryStrategy: (times: number) => Math.min(times * 50, 2000),
                reconnectOnError: error => {
                    return [/READONLY/, /ETIMEDOUT/].some(targetError => {
                        return targetError.test(error.message);
                    });
                },
                enableAutoPipelining: true,
                connectTimeout: 20_000,
            });

            cache.redis = ioredisInstance;
        }
    } catch (e) {
        console.error('Could not connect to redis', e);
        delete cache.redis;
    }

    return cache;
};

export default getCache();
