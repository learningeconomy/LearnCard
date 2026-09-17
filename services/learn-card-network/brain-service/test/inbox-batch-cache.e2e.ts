import { afterAll, expect, it } from 'vitest';
import cache from '@cache';
import { testInboxBatchCache } from '../src/cache/inbox-batch-cache.test-helpers';

// Fail if the isolated Redis container is missing; never silently test the mock in CI.
it('uses real Redis for the batch cache contract', () => {
    expect(cache.redis).toBeDefined();
});
testInboxBatchCache(cache);
afterAll(async () => {
    await cache.redis?.quit();
});
