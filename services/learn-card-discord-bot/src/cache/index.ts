import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

import { simpleScan } from './helpers/scan.helpers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Server caching layer. Intended for managing cross-session, cross-request data.
 * Prefers Redis infrastructure, but will fallback to ioredis-mock if no config exists.
 *
 * NOTE: Basic get/set/keys/delete are provided. For more complex use of Redis, access at cache.redis
 */
export type Cache = {
    /** In-memory Redis instance. This is only used if you do not have Redis set up! */
    node: RedisMock.Redis;

    /** Real Redis instance. This is used if you have Redis set up! */
    redis?: Redis.Redis;

    /**
     * Sets a key to a given value in the cache.
     * Optionally give it a time to live before being evicted (defaults to 1 hour)
     */
    set: (key: string, value: ValueType, ttl?: number) => Promise<'OK' | undefined>;

    /** Gets a key from the cache, optionally reseting it's time to live */
    get: (key: string, resetTTL?: boolean, ttl?: number) => Promise<string | null | undefined>;

    /** Returns an array of keys matching a pattern */
    keys: (pattern: string) => Promise<string[] | undefined>;

    /** Forcibly evicts a key or keys from the cache */
    delete: (keys: string | string[]) => Promise<number | undefined>;
};

/** Evict all keys after one hour by default */
const DEFAULT_TTL_SECS = 60 * 60;

const getCache = (): Cache => {
    const cache: Cache = {
        node: new RedisMock(),
        set: async (key, value) => {
            try {
                if (cache?.redis) return await cache.redis.set(key, value);
                if (cache?.node) return await cache.node.set(key, value);
            } catch (e) {
                console.error('Cache set error', e);
            }
        },
        setex: async (key, value, ttl = DEFAULT_TTL_SECS) => {
            try {
                if (cache?.redis) return await cache.redis.setex(key, ttl, value);
                if (cache?.node) return await cache.node.setex(key, ttl, value);
            } catch (e) {
                console.error('Cache setex error', e);
            }
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
        },
        keys: async pattern => {
            try {
                if (cache?.redis) return await simpleScan(cache.redis, pattern);
                if (cache?.node) return await simpleScan(cache.node, pattern);
            } catch (error) {
                console.error('Cache keys error', error);
            }
        },
        delete: async keys => {
            if (keys.length === 0) return;

            try {
                if (cache?.redis) return await cache.redis.unlink(keys);
                if (cache?.node) return await cache.node.unlink(keys);
            } catch (e) {
                console.error('Cache delete error', e);
            }
        },
    };

    try {
        const host = process.env.REDIS_HOST;
        const port = process.env.REDIS_PORT;
        const password = process.env.REDIS_PW;

        if (host && port) {
            console.log('Setting up Redis-backed cache');
            cache.redis = new Redis({
                host,
                port,
                retryStrategy: times => Math.min(times * 50, 2000),
                enableAutoPipelining: true,
                ...(password ? { password } : {}),
            });
        }
    } catch (e) {
        console.log('Could not connect to redis', e);
        delete cache.redis;
    }

    return cache;
};

export default getCache();
