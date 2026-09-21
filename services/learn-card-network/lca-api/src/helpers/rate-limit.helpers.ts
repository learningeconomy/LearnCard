import type { FastifyRequest } from 'fastify';

import cache from '@cache';

export const DEFAULT_MAX_FAILED_ATTEMPTS = 50;
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

/**
 * Failures-only rate limiting. Callers check `isRateLimited` up front and call
 * `recordFailure` only on rejected attempts, so legitimate traffic behind a
 * shared NAT never counts toward the ceiling. `INCR` is atomic; the window TTL
 * is set when the key is first created.
 *
 * Both halves fail open: if Redis is unreachable, `cache.get` already returns
 * `undefined` (treated as zero failures) and `recordFailure` logs and returns
 * rather than turning a rejected login attempt into a 500. Limiting is a
 * brute-force speed bump, not the access control — that is the ticket / code /
 * client secret entropy.
 */
export const isRateLimited = async (
    key: string,
    max = DEFAULT_MAX_FAILED_ATTEMPTS
): Promise<boolean> => {
    const attempts = Number(await cache.get(key)) || 0;
    return attempts >= max;
};

export const recordFailure = async (
    key: string,
    windowSeconds = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
): Promise<void> => {
    const redis = cache.redis ?? cache.node;
    try {
        const attempts = await redis.incr(key);
        if (attempts === 1) await redis.expire(key, windowSeconds);
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
