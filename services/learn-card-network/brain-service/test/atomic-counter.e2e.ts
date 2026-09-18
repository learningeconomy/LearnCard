import { afterAll, expect, it } from 'vitest';
import cache from '@cache';
import { testAtomicCacheCounter } from '../src/cache/atomic-counter.test-helpers';

// Fail if the isolated Redis container is missing; never silently test the mock in CI.
it('uses real Redis for the atomic counter contract', () => {
    expect(cache.redis).toBeDefined();
});
testAtomicCacheCounter(cache);
afterAll(async () => {
    await cache.redis?.quit();
});
