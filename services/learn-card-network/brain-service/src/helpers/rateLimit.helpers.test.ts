import { describe, it, expect, vi, beforeEach } from 'vitest';

const incr = vi.fn();

vi.mock('@cache', () => ({ default: { incr: (...args: any[]) => incr(...args) } }));

import { enforceRateLimits } from './rateLimit.helpers';

const window = (over: Partial<Parameters<typeof enforceRateLimits>[0][number]> = {}) => ({
    key: 'k',
    limit: 10,
    windowSeconds: 3600,
    description: 'max 10 per hour',
    ...over,
});

describe('enforceRateLimits', () => {
    beforeEach(() => incr.mockReset());

    it('permits a call at the limit and rejects the one past it', async () => {
        incr.mockResolvedValueOnce(10);
        await expect(enforceRateLimits([window()])).resolves.toBeUndefined();

        incr.mockResolvedValueOnce(11);
        await expect(enforceRateLimits([window()])).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded: max 10 per hour',
        });
    });

    it('passes the window length through as the key TTL', async () => {
        incr.mockResolvedValueOnce(1);
        await enforceRateLimits([window({ key: 'ip:1.2.3.4', windowSeconds: 60 })]);

        expect(incr).toHaveBeenCalledWith('ip:1.2.3.4', 60);
    });

    // Fails closed: an unreachable cache must not silently become "unlimited".
    it('rejects when the cache is unavailable rather than allowing the call', async () => {
        incr.mockResolvedValueOnce(undefined);

        await expect(enforceRateLimits([window()])).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
        });
    });

    it('trips on whichever window is exhausted first', async () => {
        incr.mockResolvedValueOnce(1).mockResolvedValueOnce(99);

        await expect(
            enforceRateLimits([
                window({ key: 'broad', limit: 3000, description: 'broad' }),
                window({ key: 'narrow', limit: 10, description: 'narrow' }),
            ])
        ).rejects.toMatchObject({ message: 'Rate limit exceeded: narrow' });
    });

    // Stopping at the first breach keeps a tripped broad window from also
    // burning down the narrower per-email budget.
    it('does not consume later windows once an earlier one trips', async () => {
        incr.mockResolvedValueOnce(3001);

        await expect(
            enforceRateLimits([
                window({ key: 'broad', limit: 3000, description: 'broad' }),
                window({ key: 'narrow', limit: 10, description: 'narrow' }),
            ])
        ).rejects.toMatchObject({ message: 'Rate limit exceeded: broad' });

        expect(incr).toHaveBeenCalledTimes(1);
        expect(incr).toHaveBeenCalledWith('broad', 3600);
    });

    it('consumes every window when all are under budget', async () => {
        incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

        await enforceRateLimits([window({ key: 'a' }), window({ key: 'b' })]);

        expect(incr).toHaveBeenCalledTimes(2);
    });
});
