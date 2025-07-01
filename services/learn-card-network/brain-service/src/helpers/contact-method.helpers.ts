import { v4 as uuid } from 'uuid';
import cache from '@cache';
import { ClaimTokenType } from 'types/inbox-credential';

const CONTACT_METHOD_VERIFICATION_PREFIX = 'contact_method_verification:';
const INBOX_CLAIM_TOKEN_PREFIX = 'inbox_claim:';

export const generateContactMethodVerificationToken = async (
    contactMethodId: string,
    ttlHours = 24
): Promise<string> => {
    const token = uuid();
    const key = `${CONTACT_METHOD_VERIFICATION_PREFIX}${token}`;

    await cache.set(key, contactMethodId, ttlHours * 60 * 60);

    return token;
};

export const validateContactMethodVerificationToken = async (token: string): Promise<string | null> => {
    const key = `${CONTACT_METHOD_VERIFICATION_PREFIX}${token}`;
    const contactMethodId = await cache.get(key);

    if (contactMethodId) {
        // Delete the token after use
        await cache.delete([key]);
    }

    return contactMethodId || null;
};

export const generateInboxClaimToken = async (
    contactMethodId: string,
    ttlHours = 48
): Promise<string> => {
    const token = uuid();
    const key = `${INBOX_CLAIM_TOKEN_PREFIX}${token}`;

    const claimTokenData: ClaimTokenType = {
        token,
        contactMethodId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
        used: false,
    };

    await cache.set(key, JSON.stringify(claimTokenData), ttlHours * 60 * 60);

    return token;
};

export const validateInboxClaimToken = async (token: string): Promise<ClaimTokenType | null> => {
    const key = `${INBOX_CLAIM_TOKEN_PREFIX}${token}`;
    const data = await cache.get(key);

    if (!data) return null;

    const claimTokenData = JSON.parse(data) as ClaimTokenType;

    // Check if token is expired or already used
    if (claimTokenData.used || new Date(claimTokenData.expiresAt) < new Date()) {
        // Clean up expired/used token
        await cache.delete([key]);
        return null;
    }

    return claimTokenData;
};

export const markInboxClaimTokenAsUsed = async (token: string): Promise<boolean> => {
    const key = `${INBOX_CLAIM_TOKEN_PREFIX}${token}`;
    const data = await cache.get(key);

    if (!data) return false;

    const claimTokenData = JSON.parse(data) as ClaimTokenType;
    claimTokenData.used = true;

    // Re-save with the same TTL to mark as used
    const ttl = Math.floor((new Date(claimTokenData.expiresAt).getTime() - Date.now()) / 1000);
    if (ttl > 0) {
        await cache.set(key, JSON.stringify(claimTokenData), ttl);
    }

    return true;
};

export const generateClaimUrl = (token: string): string => {
    const domainName = process.env.DOMAIN_NAME;
    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost:${process.env.PORT || 3000}`
            : domainName;

    const protocol = process.env.IS_OFFLINE ? 'http' : 'https';

    return `${protocol}://${domain}/interactions/inbox-claim/${token}?iuv=1`;
};
