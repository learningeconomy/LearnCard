import { createHash, randomBytes } from 'crypto';

import cache from '@cache';
import type { AuthProviderType } from '@helpers/auth.helpers';

export const RECOVERY_SESSION_TTL_SECS = 15 * 60;
export const RECOVERY_OTP_TTL_SECS = 15 * 60;
export const RECOVERY_OTP_SEND_COOLDOWN_SECS = 60;
export const MAX_RECOVERY_OTP_ATTEMPTS = 5;

export type RecoverySessionScope = 'recover' | 'rebind';

export interface RecoverySessionRecord {
    scope: RecoverySessionScope;
    authProvider: { type: AuthProviderType; id: string };
}

export interface RecoveryOtpRecord {
    codeHash: string;
    authProvider: { type: AuthProviderType; id: string };
}

const digest = (value: string): string => createHash('sha256').update(value).digest('hex');

export const getRecoveryEmailDigest = (email: string): string => digest(email.trim().toLowerCase());

export const getRecoveryOtpCacheKey = (email: string): string =>
    `recovery-session-otp|${getRecoveryEmailDigest(email)}`;

export const getRecoveryOtpAttemptsCacheKey = (email: string): string =>
    `recovery-session-otp-attempts|${getRecoveryEmailDigest(email)}`;

export const getRecoveryOtpLockCacheKey = (email: string): string =>
    `recovery-session-otp-lock|${getRecoveryEmailDigest(email)}`;

export const getRecoveryOtpSendCacheKey = (email: string): string =>
    `recovery-session-otp-send|${getRecoveryEmailDigest(email)}`;

export const getRecoverySessionCacheKey = (token: string): string =>
    `recovery-session|${digest(token)}`;

export const createRecoverySession = async (
    record: RecoverySessionRecord,
    ttl = RECOVERY_SESSION_TTL_SECS
): Promise<string> => {
    const token = randomBytes(32).toString('hex');

    await cache.set(getRecoverySessionCacheKey(token), JSON.stringify(record), ttl);

    return token;
};

/** Atomically consume a recovery token. Every token authorizes exactly one route call. */
export const consumeRecoverySession = async (
    token: string,
    expectedScope: RecoverySessionScope
): Promise<RecoverySessionRecord | null> => {
    const redis = cache.redis ?? cache.node;
    const raw = await redis.getdel(getRecoverySessionCacheKey(token));

    if (!raw) return null;

    try {
        const record = JSON.parse(raw) as RecoverySessionRecord;

        return record.scope === expectedScope ? record : null;
    } catch {
        return null;
    }
};

export const storeRecoveryOtp = async (email: string, record: RecoveryOtpRecord): Promise<void> => {
    await cache.set(getRecoveryOtpCacheKey(email), JSON.stringify(record), RECOVERY_OTP_TTL_SECS);
};

export const getRecoveryOtp = async (email: string): Promise<RecoveryOtpRecord | null> => {
    const raw = await cache.get(getRecoveryOtpCacheKey(email));

    if (!raw) return null;

    try {
        return JSON.parse(raw) as RecoveryOtpRecord;
    } catch {
        return null;
    }
};

export const consumeRecoveryOtp = async (email: string): Promise<RecoveryOtpRecord | null> => {
    const redis = cache.redis ?? cache.node;
    const raw = await redis.getdel(getRecoveryOtpCacheKey(email));

    if (!raw) return null;

    try {
        return JSON.parse(raw) as RecoveryOtpRecord;
    } catch {
        return null;
    }
};

export const isRecoveryOtpLocked = async (email: string): Promise<boolean> =>
    Boolean(await cache.get(getRecoveryOtpLockCacheKey(email)));

export const recordFailedRecoveryOtpAttempt = async (email: string): Promise<number> => {
    const redis = cache.redis ?? cache.node;
    const key = getRecoveryOtpAttemptsCacheKey(email);
    const attempts = await redis.incr(key);

    if (attempts === 1) await redis.expire(key, RECOVERY_OTP_TTL_SECS);

    if (attempts >= MAX_RECOVERY_OTP_ATTEMPTS) {
        await Promise.all([
            cache.delete([getRecoveryOtpCacheKey(email)]),
            cache.set(getRecoveryOtpLockCacheKey(email), 'locked', RECOVERY_OTP_TTL_SECS),
        ]);
    }

    return attempts;
};

export const clearRecoveryOtpAttempts = async (email: string): Promise<void> => {
    await cache.delete([getRecoveryOtpAttemptsCacheKey(email)]);
};

export const claimRecoveryOtpSendWindow = async (email: string): Promise<boolean> => {
    const redis = cache.redis ?? cache.node;
    const result = await redis.set(
        getRecoveryOtpSendCacheKey(email),
        'sent',
        'EX',
        RECOVERY_OTP_SEND_COOLDOWN_SECS,
        'NX'
    );

    return result === 'OK';
};
