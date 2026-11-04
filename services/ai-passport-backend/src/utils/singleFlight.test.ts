import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import Redis from 'ioredis';
mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => createHash('sha256').update(did).digest('hex'),
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
}));
// Load after installing the isolated privacy-key fixture.
const { createDistributedSingleFlight } = await import('./singleFlight');
const { default: cache } = await import('./cache');
const { withOwnerOperation, requestDataErasure } = await import('../services/dataErasure');
await cache.redis?.quit();
let redis: Redis;
beforeEach(() => {
    redis = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6384),
        keyPrefix: `single-flight-test:${randomUUID()}:`,
    });
    cache.redis = redis;
});
afterEach(async () => {
    const prefix = redis.options.keyPrefix!;
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys.map(key => key.slice(prefix.length)));
    await redis.quit();
});
const did = 'did:example:learner';

describe('owner single-flight locks', () => {
    it('shares concurrent generation without allowing another owner to reuse it', async () => {
        const singleFlight = createDistributedSingleFlight(redis);
        const started = Promise.withResolvers<void>();
        const resume = Promise.withResolvers<void>();
        let calls = 0;
        const first = withOwnerOperation(did, () =>
            singleFlight('same-key', async () => {
                calls += 1;
                started.resolve();
                await resume.promise;
                return 'private-result';
            })
        );
        await started.promise;
        const second = withOwnerOperation(did, () =>
            singleFlight('same-key', async () => {
                calls += 1;
                return 'duplicate';
            })
        );
        expect(
            await withOwnerOperation('did:example:other', () =>
                singleFlight('same-key', async () => 'other-result')
            )
        ).toBe('other-result');
        resume.resolve();
        expect(await Promise.all([first, second])).toEqual(['private-result', 'private-result']);
        expect(calls).toBe(1);
    });

    it('does not run without admission or when lock acquisition fails', async () => {
        let calls = 0;
        const operation = async () => {
            calls += 1;
            return 'private';
        };
        await expect(createDistributedSingleFlight(redis)('key', operation)).rejects.toMatchObject({
            code: 'data_erasure_requested',
        });
        const failingStore = {
            eval: async () => {
                throw new Error('Redis unavailable');
            },
        };
        await expect(
            withOwnerOperation(did, () =>
                createDistributedSingleFlight(failingStore)('key', operation)
            )
        ).rejects.toThrow('Redis unavailable');
        expect(calls).toBe(0);
    });

    it('fails closed at the wait boundary without running uncoordinated generation', async () => {
        let called = false;
        await expect(
            withOwnerOperation(did, () =>
                createDistributedSingleFlight(redis)(
                    'key',
                    async () => {
                        called = true;
                        return 'private';
                    },
                    { waitTimeoutMs: 0 }
                )
            )
        ).rejects.toThrow('Timed out');
        expect(called).toBe(false);
    });

    it('rejects the generated result if the owner is erased before lock release', async () => {
        await expect(
            withOwnerOperation(did, () =>
                createDistributedSingleFlight(redis)('key', async () => {
                    await requestDataErasure(did);
                    return 'must not escape';
                })
            )
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
    });
});
