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

export type RecoveryOtpVerificationResult =
    | { status: 'ok'; record: RecoveryOtpRecord }
    | { status: 'mismatch'; attempts: number }
    | { status: 'locked' }
    | { status: 'none' };

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

const VERIFY_RECOVERY_OTP_SCRIPT = `
if redis.call('EXISTS', KEYS[3]) == 1 then
    return 'locked'
end

local pending = redis.call('GET', KEYS[1])
if not pending then
    return 'none'
end

local decoded, record = pcall(cjson.decode, pending)
if not decoded or type(record) ~= 'table' or type(record.codeHash) ~= 'string' then
    redis.call('DEL', KEYS[1])
    return 'none'
end

-- Both values are fixed-length SHA-256 hex digests rather than raw OTPs. A simple
-- server-side equality check is acceptable here because attempts are capped and Redis
-- round-trip noise makes digest-prefix timing impractical; doing it here also keeps the
-- existence check, attempt increment, lock, and consume operations atomic.
if record.codeHash == ARGV[1] then
    redis.call('DEL', KEYS[1], KEYS[2])
    return { 'ok', pending }
end

local attempts = redis.call('INCR', KEYS[2])
if attempts == 1 then
    redis.call('EXPIRE', KEYS[2], tonumber(ARGV[3]))
end

if attempts >= tonumber(ARGV[2]) then
    redis.call('DEL', KEYS[1])
    redis.call('SET', KEYS[3], 'locked', 'EX', tonumber(ARGV[3]))
end

return 'mismatch:' .. attempts
`;

const fallbackVerificationQueues = new Map<string, Promise<void>>();

const withFallbackVerificationLock = async <T>(
    key: string,
    operation: () => Promise<T>
): Promise<T> => {
    const previous = fallbackVerificationQueues.get(key) ?? Promise.resolve();
    let release = (): void => undefined;
    const gate = new Promise<void>(resolve => {
        release = resolve;
    });
    const queued = previous.then(() => gate);

    fallbackVerificationQueues.set(key, queued);
    await previous;

    try {
        return await operation();
    } finally {
        release();
        if (fallbackVerificationQueues.get(key) === queued) {
            fallbackVerificationQueues.delete(key);
        }
    }
};

const parseRecoveryOtpRecord = (raw: string): RecoveryOtpRecord | null => {
    try {
        const record = JSON.parse(raw) as RecoveryOtpRecord;

        if (
            typeof record.codeHash !== 'string' ||
            typeof record.authProvider?.type !== 'string' ||
            typeof record.authProvider.id !== 'string'
        ) {
            return null;
        }

        return record;
    } catch {
        return null;
    }
};

export const storeRecoveryOtp = async (email: string, record: RecoveryOtpRecord): Promise<void> => {
    const key = getRecoveryOtpCacheKey(email);
    const value = JSON.stringify(record);

    if (cache.redis) {
        await cache.redis.setex(key, RECOVERY_OTP_TTL_SECS, value);
        return;
    }

    await withFallbackVerificationLock(key, async () => {
        await cache.node.setex(key, RECOVERY_OTP_TTL_SECS, value);
    });
};

export const verifyRecoveryOtp = async (
    email: string,
    submittedCodeHash: string
): Promise<RecoveryOtpVerificationResult> => {
    const otpKey = getRecoveryOtpCacheKey(email);
    const attemptsKey = getRecoveryOtpAttemptsCacheKey(email);
    const lockKey = getRecoveryOtpLockCacheKey(email);

    if (cache.redis) {
        const result = await cache.redis.eval(
            VERIFY_RECOVERY_OTP_SCRIPT,
            3,
            otpKey,
            attemptsKey,
            lockKey,
            submittedCodeHash,
            MAX_RECOVERY_OTP_ATTEMPTS,
            RECOVERY_OTP_TTL_SECS
        );

        if (Array.isArray(result) && result[0] === 'ok' && typeof result[1] === 'string') {
            const record = parseRecoveryOtpRecord(result[1]);
            if (record) return { status: 'ok', record };
            return { status: 'none' };
        }

        const status = String(result);
        if (status === 'locked' || status === 'none') return { status };

        const mismatch = /^mismatch:(\d+)$/.exec(status);
        if (mismatch?.[1]) {
            return { status: 'mismatch', attempts: Number(mismatch[1]) };
        }

        throw new Error(`Unexpected recovery OTP verification result: ${status}`);
    }

    return withFallbackVerificationLock(otpKey, async () => {
        if (await cache.node.get(lockKey)) return { status: 'locked' };

        const raw = await cache.node.get(otpKey);
        if (!raw) return { status: 'none' };

        const record = parseRecoveryOtpRecord(raw);
        if (!record) {
            await cache.node.del(otpKey);
            return { status: 'none' };
        }

        // See the Lua comment above: only fixed-length server-side digests are compared.
        if (record.codeHash === submittedCodeHash) {
            await cache.node.del(otpKey, attemptsKey);
            return { status: 'ok', record };
        }

        const attempts = await cache.node.incr(attemptsKey);
        if (attempts === 1) await cache.node.expire(attemptsKey, RECOVERY_OTP_TTL_SECS);

        if (attempts >= MAX_RECOVERY_OTP_ATTEMPTS) {
            await cache.node.del(otpKey);
            await cache.node.set(lockKey, 'locked', 'EX', RECOVERY_OTP_TTL_SECS);
        }

        return { status: 'mismatch', attempts };
    });
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
