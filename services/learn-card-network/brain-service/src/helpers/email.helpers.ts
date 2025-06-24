import { v4 as uuid } from 'uuid';
import cache from '@cache';
import { ClaimTokenType } from 'types/inbox-credential';

const EMAIL_VERIFICATION_PREFIX = 'email_verification:';
const INBOX_CLAIM_TOKEN_PREFIX = 'inbox_claim:';

export const generateEmailVerificationToken = async (
    emailAddressId: string,
    ttlHours = 24
): Promise<string> => {
    const token = uuid();
    const key = `${EMAIL_VERIFICATION_PREFIX}${token}`;
    
    await cache.set(key, emailAddressId, ttlHours * 60 * 60);
    
    return token;
};

export const validateEmailVerificationToken = async (token: string): Promise<string | null> => {
    const key = `${EMAIL_VERIFICATION_PREFIX}${token}`;
    const emailAddressId = await cache.get(key);
    
    if (emailAddressId) {
        // Delete the token after use
        await cache.delete([key]);
    }
    
    return emailAddressId || null;
};

export const generateInboxClaimToken = async (
    emailId: string,
    ttlHours = 48
): Promise<string> => {
    const token = uuid();
    const key = `${INBOX_CLAIM_TOKEN_PREFIX}${token}`;
    
    const claimTokenData: ClaimTokenType = {
        token,
        emailId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
        used: false,
    };
    
    await cache.set(key, JSON.stringify(claimTokenData), ttlHours * 60 * 60);
    
    return token;
};

export const validateInboxClaimToken = async (token: string): Promise<ClaimTokenType | null> => {
    const key = `${INBOX_CLAIM_TOKEN_PREFIX}${token}`;
    const claimTokenJson = await cache.get(key);
    
    if (!claimTokenJson) return null;
    
    try {
        const claimToken = JSON.parse(claimTokenJson) as ClaimTokenType;
        
        // Check if token is expired
        if (new Date(claimToken.expiresAt) < new Date()) {
            await cache.delete([key]);
            return null;
        }
        
        // Check if token was already used
        if (claimToken.used) {
            return null;
        }
        
        return claimToken;
    } catch (error) {
        await cache.delete([key]);
        return null;
    }
};

export const markInboxClaimTokenAsUsed = async (token: string): Promise<boolean> => {
    const key = `${INBOX_CLAIM_TOKEN_PREFIX}${token}`;
    const claimTokenJson = await cache.get(key);
    
    if (!claimTokenJson) return false;
    
    try {
        const claimToken = JSON.parse(claimTokenJson) as ClaimTokenType;
        claimToken.used = true;
        
        // Update the token with remaining TTL
        const ttl = await cache.ttl(key);
        if (ttl && ttl > 0) {
            await cache.set(key, JSON.stringify(claimToken), ttl);
        }
        
        return true;
    } catch (error) {
        return false;
    }
};

export const generateClaimUrl = (token: string, domain: string): string => {
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    return `${baseUrl}/workflows/inbox-claim/exchanges/${token}`;
};