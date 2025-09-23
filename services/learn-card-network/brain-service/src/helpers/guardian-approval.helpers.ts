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

    const data: GuardianApprovalTokenData = {
        token,
        requesterProfileId,
        guardianEmail,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
        used: false,
    };

    await cache.set(key, JSON.stringify(data), ttlHours * 60 * 60);

    return token;
};

export const validateGuardianApprovalToken = async (
    token: string
): Promise<GuardianApprovalTokenData | null> => {
    const key = `${GUARDIAN_APPROVAL_PREFIX}${token}`;
    const data = await cache.get(key);

    if (!data) return null;

    const parsed = JSON.parse(data) as GuardianApprovalTokenData;

    if (parsed.used || new Date(parsed.expiresAt) < new Date()) {
        await cache.delete([key]);
        return null;
    }

    return parsed;
};

export const markGuardianApprovalTokenAsUsed = async (token: string): Promise<boolean> => {
    const key = `${GUARDIAN_APPROVAL_PREFIX}${token}`;
    const data = await cache.get(key);

    if (!data) return false;

    const parsed = JSON.parse(data) as GuardianApprovalTokenData;
    parsed.used = true;

    const ttl = Math.floor((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000);
    if (ttl > 0) {
        await cache.set(key, JSON.stringify(parsed), ttl);
    }

    return true;
};

export const generateGuardianApprovalUrl = (token: string): string => {
    const domainName = process.env.CLIENT_APP_DOMAIN_NAME;
    const domain = !domainName || process.env.IS_OFFLINE
        ? `localhost:${process.env.PORT || 3000}`
        : domainName;

    const protocol = process.env.IS_OFFLINE ? 'http' : 'https';

    return `${protocol}://${domain}/interactions/guardian-approval/${token}`;
};
