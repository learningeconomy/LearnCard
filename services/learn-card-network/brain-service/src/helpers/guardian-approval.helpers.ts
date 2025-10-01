import { v4 as uuid } from 'uuid';
import cache from '@cache';

const GUARDIAN_APPROVAL_PREFIX = 'guardian_approval:';

export type GuardianApprovalTokenData = {
    token: string;
    requesterProfileId: string;
    guardianEmail: string;
    createdAt: string;
    expiresAt: string;
    used: boolean;
};

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

    // If ttlSeconds <= 0, do not persist the token in cache.
    // Validation will not find it and will treat it as invalid.
    if (ttlSeconds > 0) {
        await cache.set(key, JSON.stringify(data), ttlSeconds);
    }

    return token;
};

export const validateGuardianApprovalToken = async (
    token: string
): Promise<GuardianApprovalTokenData | null> => {
    const key = `${GUARDIAN_APPROVAL_PREFIX}${token}`;
    const data = await cache.get(key);

    if (!data) return null;

    try {
        const parsed = JSON.parse(data) as GuardianApprovalTokenData;

        if (parsed.used || new Date(parsed.expiresAt) <= new Date()) {
            await cache.delete([key]);
            return null;
        }

        return parsed;
    } catch (error) {
        // Handle corrupted JSON data by cleaning up the cache entry
        await cache.delete([key]);
        return null;
    }
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

export const generateGuardianApprovalUrl = (token: string): string => {
    const domainName = process.env.CLIENT_APP_DOMAIN_NAME;
    const domain = !domainName || process.env.IS_OFFLINE
        ? `localhost:${process.env.PORT || 3000}`
        : domainName;

    const protocol = process.env.IS_OFFLINE ? 'http' : 'https';

    return `${protocol}://${domain}/interactions/guardian-approval/${token}`;
};
