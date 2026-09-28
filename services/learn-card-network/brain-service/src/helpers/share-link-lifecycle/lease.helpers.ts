import {
    SHARE_LINK_CLEANUP_BASE_BACKOFF_MS,
    SHARE_LINK_CLEANUP_MAX_BACKOFF_MS,
    SHARE_LINK_DEFAULT_LEASE_MS,
} from './types';

/** ISO timestamp `leaseMs` milliseconds after `now`. */
export const computeLeaseExpiry = (
    now: Date,
    leaseMs: number = SHARE_LINK_DEFAULT_LEASE_MS
): string => new Date(now.getTime() + Math.max(0, Math.trunc(leaseMs))).toISOString();

/**
 * A lease is active only while `now` is strictly before its expiry. At the exact
 * expiry instant the lease has lapsed so a stale worker cannot finalize.
 */
export const isLeaseActive = (leaseExpiresAt: string | null, now: Date): boolean => {
    if (!leaseExpiresAt) return false;

    const expiry = Date.parse(leaseExpiresAt);

    return Number.isFinite(expiry) && now.getTime() < expiry;
};

/**
 * Exponential cleanup backoff capped at one day. `attempts` is the number of
 * completed retry cycles already recorded on the job (starts at 0 for a new job,
 * so the first retry waits one base interval).
 */
export const computeCleanupBackoffMs = (attempts: number): number => {
    const safeAttempts = Number.isSafeInteger(attempts) && attempts > 0 ? attempts : 0;
    const backoff = SHARE_LINK_CLEANUP_BASE_BACKOFF_MS * 2 ** safeAttempts;

    return Math.min(backoff, SHARE_LINK_CLEANUP_MAX_BACKOFF_MS);
};
