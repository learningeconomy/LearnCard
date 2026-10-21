const PARTNER_PREVIEW_PREFIX = 'partner-preview:';

interface StoredProvisionLike {
    listingId?: unknown;
    integrationId?: unknown;
}

const matchesDeletedApp = (
    raw: string | null,
    listingId: string,
    integrationId?: string | null
): boolean => {
    if (!raw) return false;
    try {
        const parsed = JSON.parse(raw) as StoredProvisionLike;
        return (
            parsed.listingId === listingId ||
            (Boolean(integrationId) && parsed.integrationId === integrationId)
        );
    } catch {
        return false;
    }
};

/**
 * Clears this browser's cached pointers to a deleted app: any `partner-preview:*`
 * entry whose stored listing or project matches, plus the saved test address for
 * the listing. Safe to call when storage is blocked or nothing is cached.
 */
export const forgetDeletedApp = (listingId: string, integrationId?: string | null): void => {
    try {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(PARTNER_PREVIEW_PREFIX)) continue;
            if (matchesDeletedApp(localStorage.getItem(key), listingId, integrationId)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem(`lc-test-address:${listingId}`);
    } catch {
        // Storage can be blocked entirely; there's nothing to clean up then.
    }
};
