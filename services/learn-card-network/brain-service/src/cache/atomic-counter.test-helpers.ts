import { describe, expect, it } from 'vitest';
import type { Cache } from './index';

/** Run the same contract against memory in unit tests and Redis 7 in the CI container suite. */
export const testAtomicCacheCounter = (cache: Cache): void => {
    describe('atomic cache counter', () => {
        it('increments atomically and repairs missing expiry', async () => {
            const key = `atomic-increment-${crypto.randomUUID()}`;
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
    });
};
