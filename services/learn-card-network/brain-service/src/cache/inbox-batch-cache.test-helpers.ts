import { describe, expect, it } from 'vitest';
import type { Cache } from './index';

/** Run the same contract against memory in unit tests and Redis 7 in the CI container suite. */
export const testInboxBatchCache = (cache: Cache): void => {
    describe('batch cache atomic operations', () => {
        it('reserves once and permits only the owner to complete or release', async () => {
            const key = `batch-reservation-${crypto.randomUUID()}`;
            try {
                const results = await Promise.all(
                    ['a', 'b'].map(owner => cache.setIfAbsent(key, owner, 86400))
                );
                expect(results.filter(value => value === 'OK')).toHaveLength(1);
                const owner = (await cache.get(key))!;
                expect(await cache.compareAndSet(key, 'not-the-owner', 'result', 86400)).toBe(
                    false
                );
                expect(await cache.compareAndSet(key, owner, 'result', 86400)).toBe(true);
                expect(await cache.compareAndSet(key, owner, null, 86400)).toBe(false);
                expect(await cache.get(key)).toBe('result');
                expect(await cache.ttl(key)).toBeGreaterThan(86390);
                expect(await cache.compareAndSet(key, 'result', null, 86400)).toBe(true);
                expect(await cache.setIfAbsent(key, 'new-owner', 86400)).toBe('OK');
                expect(await cache.compareAndSet(key, owner, null, 86400)).toBe(false);
                expect(await cache.get(key)).toBe('new-owner');
            } finally {
                await cache.delete([key]);
            }
        });

        it('increments atomically and repairs missing expiry', async () => {
            const key = `batch-increment-${crypto.randomUUID()}`;
            try {
                const counts = await Promise.all(
                    Array.from({ length: 20 }, () => cache.incr(key, 3600, 5))
                );
                expect(counts.slice().sort((a, b) => a! - b!)).toEqual(
                    Array.from({ length: 20 }, (_, i) => (i + 1) * 5)
                );
                expect(await cache.ttl(key)).toBeGreaterThan(3590);
                // ttl=false deliberately writes without expiry; keepTtl would preserve it.
                await cache.set(key, 200, false);
                expect(await cache.ttl(key)).toBe(-1);
                expect(await cache.incr(key, 3600, 2)).toBe(202);
                expect(await cache.ttl(key)).toBeGreaterThan(3590);
            } finally {
                await cache.delete([key]);
            }
        });

        it('rejects excess quota without spending the remainder or resetting the window', async () => {
            const key = `batch-quota-${crypto.randomUUID()}`;
            try {
                await cache.set(key, 9950, 1200);
                expect(await cache.consumeQuota(key, 3600, 100, 10000)).toBe(false);
                expect(await cache.get(key)).toBe('9950');
                expect(await cache.ttl(key)).toBeLessThanOrEqual(1200);
                const admitted = await Promise.all(
                    Array.from({ length: 10 }, () => cache.consumeQuota(key, 3600, 10, 10000))
                );
                expect(admitted.filter(Boolean)).toHaveLength(5);
                expect(await cache.get(key)).toBe('10000');
                expect(await cache.ttl(key)).toBeLessThanOrEqual(1200);
                expect(await cache.ttl(key)).toBeGreaterThan(1190);
            } finally {
                await cache.delete([key]);
            }
        });

        it('sets quota expiry on creation and repairs it only on admitted requests', async () => {
            const key = `batch-quota-expiry-${crypto.randomUUID()}`;
            try {
                expect(await cache.consumeQuota(key, 3600, 11, 10)).toBe(false);
                expect(await cache.get(key)).toBeNull();
                expect(await cache.consumeQuota(key, 3600, 2, 10)).toBe(true);
                expect(await cache.ttl(key)).toBeGreaterThan(3590);
                await cache.set(key, 2, false);
                expect(await cache.consumeQuota(key, 3600, 9, 10)).toBe(false);
                expect(await cache.ttl(key)).toBe(-1);
                expect(await cache.consumeQuota(key, 3600, 3, 10)).toBe(true);
                expect(await cache.get(key)).toBe('5');
                expect(await cache.ttl(key)).toBeGreaterThan(3590);
            } finally {
                await cache.delete([key]);
            }
        });
    });
};
