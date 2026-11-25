import { createHash, randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import cache from '../utils/cache';
import { REDIS_PREFIX } from '../constants/env';
const scope = new AsyncLocalStorage<{ assert: () => Promise<void> }>();
export const assertEmbeddingLock = async () => {
    await scope.getStore()?.assert();
};
export async function withEmbeddingLock<T>(
    owner: string,
    source: string,
    fn: () => Promise<T>
): Promise<T> {
    const redis = cache.redis;
    if (!redis) throw new Error('Persistent Redis required for embedding coordination');
    const key = `${REDIS_PREFIX}:embedding-lock:${createHash('sha256')
        .update(JSON.stringify([owner, source]))
        .digest('hex')}`;
    const token = randomUUID();
    if ((await redis.set(key, token, 'PX', 600000, 'NX')) !== 'OK')
        throw new Error('Embedding source busy; retry batch');
    const assert = async () => {
        if ((await redis.get(key)) !== token) throw new Error('Embedding source lease lost');
    };
    try {
        return await scope.run({ assert }, fn);
    } finally {
        await redis.eval(
            'if redis.call("GET",KEYS[1]) == ARGV[1] then return redis.call("DEL",KEYS[1]) end return 0',
            1,
            key,
            token
        );
    }
}
