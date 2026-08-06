export const SOCIAL_LOGIN_LOCK_KEY = 'learncard:auth:social-login-lock:v1';
export const SOCIAL_LOGIN_LOCK_TTL_MS = 2 * 60 * 1000;
export const SOCIAL_LOGIN_LOCK_HEARTBEAT_MS = 30 * 1000;
const MAX_SOCIAL_LOGIN_LOCK_AHEAD_MS = SOCIAL_LOGIN_LOCK_TTL_MS * 2;

let activeDocumentOwnerId: string | null = null;

interface SocialLoginLease {
    ownerId: string;
    expiresAt: number;
}

interface AcquireSocialLoginLockOptions {
    now?: number;
    storage?: Storage | null;
}

const getBrowserStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const readLease = (storage: Storage): SocialLoginLease | null => {
    const serializedLease = storage.getItem(SOCIAL_LOGIN_LOCK_KEY);
    if (!serializedLease) return null;

    try {
        const lease = JSON.parse(serializedLease) as Partial<SocialLoginLease>;

        if (
            typeof lease.ownerId !== 'string' ||
            lease.ownerId.length === 0 ||
            lease.ownerId.length > 128 ||
            typeof lease.expiresAt !== 'number' ||
            !Number.isFinite(lease.expiresAt)
        ) {
            return null;
        }

        return { ownerId: lease.ownerId, expiresAt: lease.expiresAt };
    } catch {
        return null;
    }
};

export const createSocialLoginLockOwnerId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Claims a short-lived browser-wide lease synchronously so the provider popup
 * can still open inside the original user gesture. Storage failures fall back
 * to the caller's in-memory guard. localStorage has no atomic compare-and-set,
 * so this is a UX concurrency guard rather than a security mutex.
 */
export const acquireSocialLoginLock = (
    ownerId: string,
    { now = Date.now(), storage = getBrowserStorage() }: AcquireSocialLoginLockOptions = {}
): boolean => {
    if (!storage) {
        if (activeDocumentOwnerId && activeDocumentOwnerId !== ownerId) return false;
        activeDocumentOwnerId = ownerId;
        return true;
    }

    try {
        const currentLease = readLease(storage);

        if (
            currentLease &&
            currentLease.expiresAt > now &&
            currentLease.expiresAt <= now + MAX_SOCIAL_LOGIN_LOCK_AHEAD_MS &&
            currentLease.ownerId !== ownerId
        ) {
            return false;
        }

        const lease: SocialLoginLease = {
            ownerId,
            expiresAt: now + SOCIAL_LOGIN_LOCK_TTL_MS,
        };

        storage.setItem(SOCIAL_LOGIN_LOCK_KEY, JSON.stringify(lease));

        const acquired = readLease(storage)?.ownerId === ownerId;
        if (acquired) activeDocumentOwnerId = ownerId;

        return acquired;
    } catch {
        if (activeDocumentOwnerId && activeDocumentOwnerId !== ownerId) return false;
        activeDocumentOwnerId = ownerId;
        return true;
    }
};

/** Extends only the current owner's lease; it never overwrites another tab. */
export const refreshSocialLoginLock = (
    ownerId: string,
    { now = Date.now(), storage = getBrowserStorage() }: AcquireSocialLoginLockOptions = {}
): boolean => {
    if (activeDocumentOwnerId !== ownerId) return false;
    if (!storage) return true;

    try {
        if (readLease(storage)?.ownerId !== ownerId) return false;

        storage.setItem(
            SOCIAL_LOGIN_LOCK_KEY,
            JSON.stringify({ ownerId, expiresAt: now + SOCIAL_LOGIN_LOCK_TTL_MS })
        );

        return readLease(storage)?.ownerId === ownerId;
    } catch {
        return true;
    }
};

/** Release only the caller's lease; a stale completion cannot unlock a newer attempt. */
export const releaseSocialLoginLock = (
    ownerId: string,
    storage: Storage | null = getBrowserStorage()
): void => {
    try {
        if (storage && readLease(storage)?.ownerId === ownerId) {
            storage.removeItem(SOCIAL_LOGIN_LOCK_KEY);
        }
    } catch {
        // The document guard is still released below.
    } finally {
        if (activeDocumentOwnerId === ownerId) {
            activeDocumentOwnerId = null;
        }
    }
};
