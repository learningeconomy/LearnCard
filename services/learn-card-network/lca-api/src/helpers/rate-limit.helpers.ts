import type { FastifyRequest } from 'fastify';

import cache from '@cache';

export const DEFAULT_MAX_FAILED_ATTEMPTS = 50;
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

/**
 * Failures-only rate limiting. Callers check `isRateLimited` up front and call
 * `recordFailure` only on rejected attempts, so legitimate traffic behind a
 * shared NAT never counts toward the ceiling. `INCR` is atomic; the window TTL
 * is set when the key is first created.
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
    const attempts = await redis.incr(key);
    if (attempts === 1) await redis.expire(key, windowSeconds);
};

/** First `x-forwarded-for` hop (API Gateway / proxies), else the socket address. */
export const getRequestClientIp = (request: Pick<FastifyRequest, 'headers' | 'ip'>): string => {
    const forwarded = request.headers['x-forwarded-for'];
    const firstHop = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
    return firstHop || request.ip || 'unknown';
};
