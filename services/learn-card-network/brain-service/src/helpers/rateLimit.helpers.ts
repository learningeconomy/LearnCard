/**
 * Fixed-window rate limiting built on the atomic `cache.incr(key, ttl)` counter
 * (Redis INCR + EXPIRE-on-first-write), mirroring the inline pattern already
 * used by the app-store notification routes.
 *
 * Fixed-window (not sliding/token-bucket) is deliberate: it's one round trip and
 * it's what the existing cache primitive gives us. The known tradeoff is that a
 * caller can burst up to 2x the limit across a window boundary. That's fine for
 * abuse damping; it is not a precise quota.
 */
import { TRPCError } from '@trpc/server';

import cache from '@cache';

export type RateLimitWindow = {
    /** Cache key for this window. Namespace it — keys share one Redis. */
    key: string;
    /** Units to consume (defaults to one). */
    amount?: number;
    /** Max permitted increments within the window. */
    limit: number;
    /** Window length in seconds. */
    windowSeconds: number;
    /** Human-readable limit description, surfaced in the error message. */
    description: string;
};

/**
 * Consume the requested units against each window, in order, and throw once any is
 * exhausted.
 *
 * Fails CLOSED: if the cache is unavailable, `cache.incr` returns `undefined`
 * and we throw rather than silently letting unlimited traffic through. Callers
 * on a pre-auth path should therefore treat a throw as "degrade gracefully",
 * never as "fail the user's request" — see `resolveEmailLocale`.
 *
 * Note the windows are consumed in array order and we stop at the first
 * breach, so later windows aren't incremented once an earlier one trips. Put
 * the cheapest/broadest window first.
 */
export const enforceRateLimits = async (windows: RateLimitWindow[]): Promise<void> => {
    for (const { key, limit, windowSeconds, description, amount } of windows) {
        const count =
            amount === undefined
                ? await cache.incr(key, windowSeconds)
                : await cache.incr(key, windowSeconds, amount);

        if (count === undefined) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Rate limiting service unavailable',
            });
        }

        if (count > limit) {
            throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: `Rate limit exceeded: ${description}`,
            });
        }
    }
};

export default enforceRateLimits;
