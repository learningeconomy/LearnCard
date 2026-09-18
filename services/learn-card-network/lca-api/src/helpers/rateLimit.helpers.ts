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
 * Lua script for atomic increment with TTL.
 * Ensures the key always has an expiry, even if the process crashes
 * between INCR and EXPIRE in a non-atomic implementation.
 */
const ATOMIC_INCR_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`;

/**
 * Check and increment a rate-limit counter in Redis.
 * Returns true if the request is allowed, false if rate-limited.
 *
 * Uses an atomic Lua script to increment and set TTL in a single operation,
 * preventing the race condition where a crash between INCR and EXPIRE
 * could leave a key with no expiry, permanently blocking users.
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

    // Use Lua script for atomic INCR + EXPIRE
    const current = (await redis.eval(
        ATOMIC_INCR_SCRIPT,
        1,
        fullKey,
        windowSeconds.toString()
    )) as number;

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
