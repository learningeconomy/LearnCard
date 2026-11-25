import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import cache from '@cache';
import { isRateLimited, recordFailure } from './rate-limit.helpers';

vi.mock('@environment', () => ({ environment: {} }));

const key = 'oidc:rate:test';

beforeEach(async () => {
    await cache.node.flushall();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('failure counter expiry', () => {
    it('increments and expires a new counter atomically', async () => {
        await recordFailure(key, 60);
        expect(await cache.node.get(key)).toBe('1');
        expect(await cache.node.ttl(key)).toBeGreaterThan(0);
        expect(await cache.node.ttl(key)).toBeLessThanOrEqual(60);
    });

    it('repairs a counter without a TTL when recording a failure', async () => {
        await cache.node.set(key, '4');
        expect(await cache.node.ttl(key)).toBe(-1);
        await recordFailure(key, 60);
        expect(await cache.node.get(key)).toBe('5');
        expect(await cache.node.ttl(key)).toBeGreaterThan(0);
    });

    it('repairs an already-blocked counter on read and eventually unblocks it', async () => {
        vi.useFakeTimers();
        await cache.node.set(key, '50');
        expect(await isRateLimited(key)).toBe(true);
        expect(await cache.node.ttl(key)).toBe(600);
        vi.advanceTimersByTime(601_000);
        expect(await isRateLimited(key)).toBe(false);
    });

    it('does not extend a live window on reads or writes', async () => {
        vi.useFakeTimers();
        await recordFailure(key, 60);
        vi.advanceTimersByTime(10_000);
        await recordFailure(key, 60);
        expect(await isRateLimited(key)).toBe(false);
        expect(await cache.node.ttl(key)).toBe(50);
    });

    it('does not create a counter for successful traffic', async () => {
        expect(await isRateLimited(key)).toBe(false);
        expect(await cache.node.exists(key)).toBe(0);
    });

    it('keeps the read-side fail-open behavior when Redis is unavailable', async () => {
        vi.spyOn(cache.node, 'eval').mockRejectedValueOnce(new Error('Redis unavailable'));
        expect(await isRateLimited(key)).toBe(false);
    });
});
