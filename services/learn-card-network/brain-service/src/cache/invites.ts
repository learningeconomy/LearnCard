import cache from '@cache';

export const getInviteCacheKey = (profileId: string, challenge: string): string =>
    `inviteChallenge:${profileId}:${challenge}`;

export const VALID = 'valid';
export const NEVER_EXPIRE = 'never';

type InviteCacheJson = {
    maxUses: number | null;
    usesRemaining: number | null;
};

const parseInviteValue = (value?: string | null): InviteCacheJson | undefined => {
    if (!value) return undefined;

    // Back-compat: pre-existing string values
    if (value === VALID || value === NEVER_EXPIRE) {
        return { maxUses: 1, usesRemaining: 1 };
    }

    try {
        const parsed = JSON.parse(value) as InviteCacheJson;

        // Basic shape validation
        if (
            parsed &&
            ('usesRemaining' in parsed || 'maxUses' in parsed)
        ) {
            return parsed;
        }
    } catch {}

    return undefined;
};

export const isInviteValidForProfile = async (
    profileId: string,
    challenge: string
): Promise<boolean> => {
    const raw = await cache.get(getInviteCacheKey(profileId, challenge));

    // If result is null or undefined, the invite has expired or doesn't exist
    if (!raw) return false;

    const parsed = parseInviteValue(raw);

    if (!parsed) return false;

    // Unlimited uses
    if (parsed.usesRemaining === null) return true;

    // Must have at least 1 remaining
    return parsed.usesRemaining > 0;
};

export const isInviteAlreadySetForProfile = async (
    profileId: string,
    challenge: string
): Promise<boolean> => {
    const result = await cache.get(getInviteCacheKey(profileId, challenge));

    return Boolean(result);
};

export const setValidInviteForProfile = async (
    profileId: string,
    challenge: string,
    expiration: number | null,
    maxUses: number | null | undefined
) => {
    const value: InviteCacheJson = {
        maxUses: maxUses === 0 ? null : (maxUses ?? 1),
        usesRemaining: maxUses === 0 ? null : (maxUses ?? 1),
    };

    const serialized = JSON.stringify(value);

    if (expiration === null) {
        // Never expire
        return cache.set(getInviteCacheKey(profileId, challenge), serialized, 0);
    } else {
        return cache.set(getInviteCacheKey(profileId, challenge), serialized, expiration);
    }
};

export const invalidateInviteForProfile = async (profileId: string, challenge: string) => {
    return cache.delete([getInviteCacheKey(profileId, challenge)]);
};

export const getInviteStatus = async (
    profileId: string,
    challenge: string
): Promise<{ isValid: boolean; isExpired: boolean; message?: string }> => {
    const raw = await cache.get(getInviteCacheKey(profileId, challenge));

    if (!raw) {
        return { isValid: false, isExpired: true, message: 'Invite not found or has expired' };
    }

    const parsed = parseInviteValue(raw);

    if (!parsed) return { isValid: false, isExpired: true, message: 'Invite has expired' };

    if (parsed.usesRemaining === null) return { isValid: true, isExpired: false };

    return parsed.usesRemaining > 0
        ? { isValid: true, isExpired: false }
        : { isValid: false, isExpired: true, message: 'Invite has expired' };
};

export const consumeInviteUseForProfile = async (
    profileId: string,
    challenge: string
): Promise<{ usesRemaining: number | null; maxUses: number | null }> => {
    const key = getInviteCacheKey(profileId, challenge);

    const raw = await cache.get(key);

    const parsed = parseInviteValue(raw);

    // If no value, nothing to consume
    if (!parsed) return { usesRemaining: 0, maxUses: 0 } as any;

    // Unlimited uses: keep as-is
    if (parsed.usesRemaining === null) {
        // Ensure JSON format is stored for back-compat string cases
        if (raw === VALID || raw === NEVER_EXPIRE) {
            await cache.set(key, JSON.stringify(parsed), false, true);
        }

        return { usesRemaining: null, maxUses: parsed.maxUses };
    }

    const remaining = (parsed.usesRemaining ?? 0) - 1;

    if (remaining <= 0) {
        // Delete key when exhausted
        await cache.delete([key]);
        return { usesRemaining: 0, maxUses: parsed.maxUses };
    }

    const updated: InviteCacheJson = { ...parsed, usesRemaining: remaining };

    await cache.set(key, JSON.stringify(updated), false, true);

    return { usesRemaining: remaining, maxUses: parsed.maxUses };
};

export const getValidInvitesForProfile = async (
    profileId: string
): Promise<
    { challenge: string; expiresIn: number | null; usesRemaining: number | null; maxUses: number | null }[]
> => {
    const pattern = `inviteChallenge:${profileId}:*`;

    const keys = (await cache.keys(pattern)) || [];

    const entries = await Promise.all(
        keys.map(async key => {
            const raw = await cache.get(key);

            if (!raw) return undefined;

            const parsed = parseInviteValue(raw);

            if (!parsed) return undefined;

            // Filter out exhausted (0 uses remaining)
            if (parsed.usesRemaining !== null && parsed.usesRemaining <= 0) return undefined;

            // TTL: -1 means no expiration; return null in that case
            const ttl = await cache.ttl(key);

            const expiresIn = typeof ttl === 'number' && ttl >= 0 ? ttl : null;

            const keyStr = typeof key === 'string' ? key : key.toString();
            const challenge = keyStr.split(':').slice(2).join(':');

            return {
                challenge,
                expiresIn,
                usesRemaining: parsed.usesRemaining,
                maxUses: parsed.maxUses,
            };
        })
    );

    return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
};

// Alias for invalidateInviteForProfile to match the name used in the route
export const invalidateInvite = invalidateInviteForProfile;
