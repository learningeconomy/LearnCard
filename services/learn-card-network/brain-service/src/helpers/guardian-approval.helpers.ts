// NOTE: Guardian credential approval (LC-1729/1730/1731) is not feature complete.
// Current implementation creates a MANAGES relationship but guardian child accounts
// are full independent accounts with a guardian — not the same as family child accounts.
// This is part of a larger goal of making child accounts independent of parent accounts.

import { environment } from '@environment';
import { v4 as uuid } from 'uuid';
import cache from '@cache';
import type { GuardianApprovalRequestStatus } from '@learncard/types';
import type { ProfileType } from 'types/profile';

const GUARDIAN_APPROVAL_PREFIX = 'guardian_approval:';
const GUARDIAN_REQUEST_PREFIX = 'guardian_approval_request:';
const GUARDIAN_SEND_LOCK_PREFIX = 'guardian_approval_send_lock:';
const GUARDIAN_SEND_COUNT_PREFIX = 'guardian_approval_send_count:';

export const GUARDIAN_SEND_LOCK_TTL_SECONDS = 60;
export const GUARDIAN_RESEND_COOLDOWN_SECONDS = 60;
export const GUARDIAN_SEND_WINDOW_SECONDS = 60 * 60;
export const GUARDIAN_MAX_SENDS_PER_WINDOW = 5;
export const DEFAULT_GUARDIAN_APPROVAL_TTL_HOURS = 24 * 7;
/** Extra time a request record (which holds the guardian's email) outlives its link. */
export const GUARDIAN_REQUEST_RETENTION_BUFFER_SECONDS = 30 * 24 * 60 * 60;

/**
 * Seconds to keep a request record: the longer of its link lifetime (or the default
 * link lifetime) and the attempt window, plus a retention buffer. Missing history on a
 * pending profile reads as `unknown`, so expiry is safe.
 */
export const getGuardianRequestRetentionSeconds = (
    record: Pick<GuardianApprovalRequestRecord, 'expiresAt'>,
    now: number = Date.now()
): number => {
    const linkSeconds = record.expiresAt
        ? Math.ceil((Date.parse(record.expiresAt) - now) / 1000)
        : 0;

    return (
        Math.max(
            linkSeconds,
            DEFAULT_GUARDIAN_APPROVAL_TTL_HOURS * 60 * 60,
            GUARDIAN_SEND_WINDOW_SECONDS
        ) + GUARDIAN_REQUEST_RETENTION_BUFFER_SECONDS
    );
};

/**
 * Latest account-level guardian approval request for a profile. Kept in the cache next to
 * the approval tokens (not on the Profile node) so the guardian's email never leaks through
 * profile payloads. `token` is the newest approval token the provider accepted.
 */
export type GuardianApprovalRequestRecord = {
    status: 'sending' | 'accepted' | 'failed';
    guardianEmail: string;
    token?: string;
    updatedAt: string;
    acceptedAt?: string;
    expiresAt?: string;
};

export const normalizeGuardianEmail = (email: string): string => email.trim().toLowerCase();

export const getGuardianApprovalRequest = async (
    profileId: string
): Promise<GuardianApprovalRequestRecord | null> => {
    const data = await cache.get(`${GUARDIAN_REQUEST_PREFIX}${profileId}`);
    if (!data) return null;

    try {
        return JSON.parse(data) as GuardianApprovalRequestRecord;
    } catch {
        return null;
    }
};

export const setGuardianApprovalRequest = async (
    profileId: string,
    record: GuardianApprovalRequestRecord
): Promise<void> => {
    await cache.set(
        `${GUARDIAN_REQUEST_PREFIX}${profileId}`,
        JSON.stringify(record),
        getGuardianRequestRetentionSeconds(record)
    );
};

export const deleteGuardianApprovalRequest = async (profileId: string): Promise<void> => {
    await cache.delete([`${GUARDIAN_REQUEST_PREFIX}${profileId}`]);
};

export const invalidateGuardianApprovalToken = async (token: string): Promise<void> => {
    await cache.delete([`${GUARDIAN_APPROVAL_PREFIX}${token}`]);
};

/**
 * Returns a lock id when acquired, or null when another send is already in flight.
 * Cache errors are rethrown so callers never report an outage as a concurrent send.
 */
export const acquireGuardianSendLock = async (profileId: string): Promise<string | null> => {
    const lockId = uuid();
    const redis = cache.redis ?? cache.node;

    try {
        const result = await redis.set(
            `${GUARDIAN_SEND_LOCK_PREFIX}${profileId}`,
            lockId,
            'EX',
            GUARDIAN_SEND_LOCK_TTL_SECONDS,
            'NX'
        );
        return result === 'OK' ? lockId : null;
    } catch (error) {
        console.error('Unable to acquire guardian approval send lock', error);
        throw error;
    }
};

export const releaseGuardianSendLock = async (profileId: string, lockId: string): Promise<void> => {
    const redis = cache.redis ?? cache.node;

    try {
        await redis.eval(
            "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
            1,
            `${GUARDIAN_SEND_LOCK_PREFIX}${profileId}`,
            lockId
        );
    } catch (error) {
        console.error('Unable to release guardian approval send lock', error);
    }
};

export const recordGuardianSendAttempt = async (profileId: string): Promise<void> => {
    await cache.incr(`${GUARDIAN_SEND_COUNT_PREFIX}${profileId}`, GUARDIAN_SEND_WINDOW_SECONDS);
};

/**
 * Derives the learner-facing status. Missing history on a pending profile is reported as
 * `unknown` (legacy accounts, evicted state) and a `sending` record without a live lock is
 * `unknown` (the send was interrupted), so we never imply an email went out.
 */
export const getGuardianApprovalStatus = async (
    profile: Pick<ProfileType, 'profileId' | 'approved'>
): Promise<GuardianApprovalRequestStatus> => {
    const { profileId } = profile;
    const pendingApproval = profile.approved === false;
    const now = Date.now();

    const [record, lock, countRaw, windowTtl] = await Promise.all([
        getGuardianApprovalRequest(profileId),
        cache.get(`${GUARDIAN_SEND_LOCK_PREFIX}${profileId}`),
        cache.get(`${GUARDIAN_SEND_COUNT_PREFIX}${profileId}`),
        cache.ttl(`${GUARDIAN_SEND_COUNT_PREFIX}${profileId}`),
    ]);

    let status: GuardianApprovalRequestStatus['status'];
    if (!record) status = pendingApproval ? 'unknown' : 'not_requested';
    else if (record.status === 'sending' && !lock) status = 'unknown';
    else status = record.status;

    const attemptsRemaining = Math.max(0, GUARDIAN_MAX_SENDS_PER_WINDOW - Number(countRaw ?? 0));

    let resendAvailableAt: number | undefined;
    if (attemptsRemaining === 0 && windowTtl && windowTtl > 0) {
        resendAvailableAt = now + windowTtl * 1000;
    } else if (record?.status === 'accepted' && record.acceptedAt) {
        const cooldownEndsAt =
            Date.parse(record.acceptedAt) + GUARDIAN_RESEND_COOLDOWN_SECONDS * 1000;
        if (cooldownEndsAt > now) resendAvailableAt = cooldownEndsAt;
    }

    return {
        pendingApproval,
        status,
        ...(record?.guardianEmail ? { guardianEmail: record.guardianEmail } : {}),
        ...(record?.updatedAt ? { updatedAt: record.updatedAt } : {}),
        ...(record?.status === 'accepted' && record.expiresAt
            ? { linkExpiresAt: record.expiresAt }
            : {}),
        ...(resendAvailableAt
            ? { resendAvailableAt: new Date(resendAvailableAt).toISOString() }
            : {}),
        attemptsRemaining,
    };
};

export type GuardianApprovalTokenData = {
    token: string;
    requesterProfileId: string;
    guardianEmail: string;
    createdAt: string;
    expiresAt: string;
    used: boolean;
    inboxCredentialId?: string; // NEW: present for credential-scoped tokens
};

export type GuardianApprovalValidationResult =
    | { valid: true; data: GuardianApprovalTokenData }
    | { valid: false; reason: 'invalid' | 'expired' | 'already_used' };

export const generateGuardianApprovalToken = async (
    requesterProfileId: string,
    guardianEmail: string,
    ttlHours = 24 * 7 // default 7 days
): Promise<string> => {
    const token = uuid();
    const key = `${GUARDIAN_APPROVAL_PREFIX}${token}`;

    const ttlSeconds = Math.max(0, Math.floor(ttlHours * 60 * 60));
    const data: GuardianApprovalTokenData = {
        token,
        requesterProfileId,
        guardianEmail,
        createdAt: new Date().toISOString(),
        // If ttlSeconds is 0, set expiresAt in the past to guarantee immediate invalidation
        expiresAt:
            ttlSeconds > 0
                ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
                : new Date(Date.now() - 1000).toISOString(),
        used: false,
    };

    // Store token in cache even if expired so it can be validated as 'expired' rather than 'invalid'
    // Use minimum TTL of 60 seconds for expired tokens to allow proper error messaging
    const cacheTtl = ttlSeconds > 0 ? ttlSeconds : 60;
    await cache.set(key, JSON.stringify(data), cacheTtl);

    return token;
};

export const validateGuardianApprovalToken = async (
    token: string
): Promise<GuardianApprovalTokenData | null> => {
    const result = await validateGuardianApprovalTokenDetailed(token);
    return result.valid ? result.data : null;
};

export const validateGuardianApprovalTokenDetailed = async (
    token: string
): Promise<GuardianApprovalValidationResult> => {
    const key = `${GUARDIAN_APPROVAL_PREFIX}${token}`;
    const data = await cache.get(key);

    if (!data) return { valid: false, reason: 'invalid' };

    try {
        const parsed = JSON.parse(data) as GuardianApprovalTokenData;

        // Check if already used
        if (parsed.used) {
            await cache.delete([key]);
            return { valid: false, reason: 'already_used' };
        }

        // Check if expired
        if (new Date(parsed.expiresAt) <= new Date()) {
            await cache.delete([key]);
            return { valid: false, reason: 'expired' };
        }

        return { valid: true, data: parsed };
    } catch (error) {
        // Handle corrupted JSON data by cleaning up the cache entry
        await cache.delete([key]);
        return { valid: false, reason: 'invalid' };
    }
};

/**
 * An account approval token only counts while it targets the guardian address on the
 * learner's current request, and, once a send is accepted, only if it is that send's token.
 * Tokens without request history (legacy) remain valid.
 */
export const isGuardianApprovalTokenCurrent = async (
    data: GuardianApprovalTokenData
): Promise<boolean> => {
    const request = await getGuardianApprovalRequest(data.requesterProfileId);
    if (!request) return true;

    if (
        normalizeGuardianEmail(request.guardianEmail) !== normalizeGuardianEmail(data.guardianEmail)
    ) {
        return false;
    }

    return !(request.status === 'accepted' && request.token && request.token !== data.token);
};

export const markGuardianApprovalTokenAsUsed = async (token: string): Promise<boolean> => {
    const key = `${GUARDIAN_APPROVAL_PREFIX}${token}`;
    const data = await cache.get(key);

    if (!data) return false;

    try {
        const parsed = JSON.parse(data) as GuardianApprovalTokenData;
        parsed.used = true;

        const ttl = Math.floor((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000);
        if (ttl > 0) {
            await cache.set(key, JSON.stringify(parsed), ttl);
        }

        return true;
    } catch (error) {
        // Handle corrupted JSON data by cleaning up the cache entry
        await cache.delete([key]);
        return false;
    }
};

export const generateGuardianApprovalUrl = (token: string, appUrl?: string): string => {
    // Prefer the resolved tenant's appUrl so the link lands on the correct tenant domain.
    // Falls back to CLIENT_APP_DOMAIN_NAME env (or localhost when offline) if no tenant appUrl.
    if (appUrl) return `${appUrl.replace(/\/+$/, '')}/interactions/guardian-approval/${token}`;

    const domainName = environment.CLIENT_APP_DOMAIN_NAME;
    const domain =
        !domainName || environment.IS_OFFLINE
            ? `localhost:${environment.PORT || 3000}`
            : domainName;

    const protocol = environment.IS_OFFLINE ? 'http' : 'https';

    return `${protocol}://${domain}/interactions/guardian-approval/${token}`;
};

// NEW: Generate a credential-scoped approval token
export const generateGuardianCredentialApprovalToken = async (
    inboxCredentialId: string,
    guardianEmail: string,
    ttlHours = 24 * 7 // 7 days default
): Promise<string> => {
    const token = uuid();
    const key = `${GUARDIAN_APPROVAL_PREFIX}${token}`;

    const ttlSeconds = Math.max(0, Math.floor(ttlHours * 60 * 60));
    const data: GuardianApprovalTokenData = {
        token,
        requesterProfileId: '', // Not applicable for credential tokens
        guardianEmail,
        inboxCredentialId,
        createdAt: new Date().toISOString(),
        expiresAt:
            ttlSeconds > 0
                ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
                : new Date(Date.now() - 1000).toISOString(),
        used: false,
    };

    const cacheTtl = ttlSeconds > 0 ? ttlSeconds : 60;
    await cache.set(key, JSON.stringify(data), cacheTtl);

    return token;
};

// NEW: URL for credential-specific guardian approval (different path than profile approval)
export const generateGuardianCredentialApprovalUrl = (token: string, appUrl?: string): string => {
    // Prefer the resolved tenant's appUrl so the link lands on the correct tenant domain.
    // Falls back to CLIENT_APP_DOMAIN_NAME env (or localhost when offline) if no tenant appUrl.
    if (appUrl) {
        return `${appUrl.replace(/\/+$/, '')}/interactions/guardian-credential-approval/${token}`;
    }

    const domainName = environment.CLIENT_APP_DOMAIN_NAME;
    const domain =
        !domainName || environment.IS_OFFLINE
            ? `localhost:${environment.CLIENT_APP_PORT || 3000}`
            : domainName;

    const protocol = environment.IS_OFFLINE ? 'http' : 'https';

    return `${protocol}://${domain}/interactions/guardian-credential-approval/${token}`;
};
