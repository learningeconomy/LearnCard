import cache from '@cache';

/**
 * Atomically read-and-delete a key so its value can only ever be consumed once.
 *
 * Redis `GETDEL` is a single command, so concurrent redemptions return the value
 * to exactly one caller — closing the read-then-delete race that `get` + `delete`
 * would leave open. Used for login codes, login tickets and authorization codes.
 *
 * NOTE: `GETDEL` requires Redis >= 6.2. Deployed ElastiCache clusters are on 7.x
 * (see the `ElasticCacheCluster` note in `serverless.yml`); `ioredis-mock`
 * implements it for the no-Redis fallback.
 */
export const getDel = async (key: string): Promise<string | null> => {
    const redis = cache.redis ?? cache.node;
    return redis.getdel(key);
};
