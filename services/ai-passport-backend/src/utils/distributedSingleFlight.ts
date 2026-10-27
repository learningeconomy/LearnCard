import type Redis from 'ioredis';
import cache from './cache';
import { createDistributedSingleFlight } from './singleFlight';

const store: Pick<Redis, 'eval'> = {
    eval: (...args) => {
        if (!cache.redis)
            throw new Error('Persistent Redis is required for owner single-flight locks');
        return Reflect.apply(cache.redis.eval, cache.redis, args);
    },
};
export const withDistributedSingleFlight = createDistributedSingleFlight(store);
