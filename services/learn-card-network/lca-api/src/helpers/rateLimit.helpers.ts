/**
 * Rate Limiting Helpers
 *
 * Shared utilities for rate limiting across routes. Uses atomic Redis
 * operations to prevent TOCTOU races.
 */

import cache from '@cache';

/** Default Redis key prefix for rate limit counters */
const DEFAULT_RATE_PREFIX = 'rate-limit:';

/**
 * Check and increment a rate-limit counter in Redis.
 * Returns true if the request is allowed, false if rate-limited.
 *
 * Uses atomic INCR + EXPIRE to avoid TOCTOU races where two concurrent
 * requests could both read the same counter value and both pass.
 *
 * @param key - Unique key identifying the resource being rate-limited (e.g., `login-verify:user@example.com`)
 * @param maxAttempts - Maximum number of attempts allowed within the window
 * @param windowSeconds - Duration of the rate-limit window in seconds
 * @param prefix - Optional key prefix (defaults to 'rate-limit:')
 * @returns true if the request is allowed, false if rate-limited
 */
export const checkRateLimit = async (
    key: string,
    maxAttempts: number,
    windowSeconds: number,
    prefix: string = DEFAULT_RATE_PREFIX
): Promise<boolean> => {
    const fullKey = `${prefix}${key}`;
    const redis = cache.redis ?? cache.node;

    // INCR is atomic — returns the new value after incrementing.
    // If the key doesn't exist, Redis creates it with value 1.
    const current = await redis.incr(fullKey);

    // First request for this window — set the TTL
    if (current === 1) {
        await redis.expire(fullKey, windowSeconds);
    }

    if (current > maxAttempts) return false;

    return true;
};

/**
 * Get the current count for a rate-limit key without incrementing.
 *
 * @param key - The rate-limit key
 * @param prefix - Optional key prefix (defaults to 'rate-limit:')
 * @returns Current count, or 0 if key doesn't exist
 */
export const getRateLimitCount = async (
    key: string,
    prefix: string = DEFAULT_RATE_PREFIX
): Promise<number> => {
    const fullKey = `${prefix}${key}`;
    const redis = cache.redis ?? cache.node;
    const count = await redis.get(fullKey);
    return count ? parseInt(count, 10) : 0;
};

/**
 * Clear a rate-limit counter (e.g., after successful authentication).
 *
 * @param key - The rate-limit key to clear
 * @param prefix - Optional key prefix (defaults to 'rate-limit:')
 */
export const clearRateLimit = async (
    key: string,
    prefix: string = DEFAULT_RATE_PREFIX
): Promise<void> => {
    const fullKey = `${prefix}${key}`;
    const redis = cache.redis ?? cache.node;
    await redis.del(fullKey);
};
