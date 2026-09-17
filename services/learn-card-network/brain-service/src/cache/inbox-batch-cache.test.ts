import { describe, expect, it, vi } from 'vitest';
vi.mock('@environment', () => ({ environment: {} }));
import { getCache } from './index';

describe('batch cache atomic operations', () => {
    it('reserves once and allows only the owner to complete or release', async () => {
        const cache = getCache();
        const key = `batch-reservation-${crypto.randomUUID()}`;
        const results = await Promise.all(
            ['a', 'b'].map(owner => cache.setIfAbsent(key, owner, 86400))
        );
        expect(results.filter(value => value === 'OK')).toHaveLength(1);
        const owner = (await cache.get(key))!;
        expect(await cache.compareAndSet(key, 'not-the-owner', 'result', 86400)).toBe(false);
        expect(await cache.compareAndSet(key, owner, 'result', 86400)).toBe(true);
        expect(await cache.compareAndSet(key, owner, null, 86400)).toBe(false);
        expect(await cache.get(key)).toBe('result');
        expect(await cache.ttl(key)).toBeGreaterThan(86390);
        await cache.delete([key]);
    });

    it('increments by item count and atomically sets or repairs expiry', async () => {
        const cache = getCache();
        const key = `batch-quota-${crypto.randomUUID()}`;
        expect(await cache.incr(key, 3600, 100)).toBe(100);
        expect(await cache.incr(key, 3600, 3)).toBe(103);
        expect(await cache.ttl(key)).toBeGreaterThan(3590);
        await cache.set(key, 200, false);
        expect(await cache.ttl(key)).toBe(-1);
        expect(await cache.incr(key, 3600, 2)).toBe(202);
        expect(await cache.ttl(key)).toBeGreaterThan(3590);
        await cache.delete([key]);
    });
});
