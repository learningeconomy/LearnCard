import type { FastifyRequest } from 'fastify';

import cache from '@cache';

export const DEFAULT_MAX_FAILED_ATTEMPTS = 50;
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

// Repair legacy counters during reads too: an already-blocked caller never reaches recordFailure.
const READ_ATTEMPTS = `
local attempts = redis.call('GET', KEYS[1])
if attempts and redis.call('TTL', KEYS[1]) < 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return attempts
`;

const RECORD_FAILURE = `
local attempts = redis.call('INCR', KEYS[1])
if redis.call('TTL', KEYS[1]) < 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return attempts
`;

/**
 * Failures-only rate limiting. Callers check `isRateLimited` up front and call
 * `recordFailure` only on rejected attempts, so legitimate traffic behind a
 * shared NAT never counts toward the ceiling. Increment and TTL repair run in
 * one script without extending an existing window.
 *
 * Both halves fail open: if Redis is unreachable, reads return false and
 * `recordFailure` logs and returns
 * rather than turning a rejected login attempt into a 500. Limiting is a
 * brute-force speed bump, not the access control — that is the ticket / code /
 * client secret entropy.
 */
export const isRateLimited = async (
    key: string,
    max = DEFAULT_MAX_FAILED_ATTEMPTS
): Promise<boolean> => {
    const redis = cache.redis ?? cache.node;
    try {
        const attempts =
            Number(await redis.eval(READ_ATTEMPTS, 1, key, DEFAULT_RATE_LIMIT_WINDOW_SECONDS)) || 0;
        return attempts >= max;
    } catch {
        return false;
    }
};

export const recordFailure = async (
    key: string,
    windowSeconds = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
): Promise<void> => {
    const redis = cache.redis ?? cache.node;
    try {
        await redis.eval(RECORD_FAILURE, 1, key, windowSeconds);
    } catch (error) {
        console.error('Rate limit recordFailure error', error);
    }
};

/**
 * Client address for rate-limit keys.
 *
 * `request.ip` is the transport-level peer: under `serverless-http` it is API
 * Gateway's `requestContext.http.sourceIp`, which the caller cannot forge. The
 * `x-forwarded-for` header is NOT trusted — API Gateway appends the real source
 * to whatever the client sent, so the first hop is attacker-controlled and would
 * let anyone mint a fresh per-IP bucket per request.
 */
export const getRequestClientIp = (request: Pick<FastifyRequest, 'ip'>): string =>
    request.ip || 'unknown';
