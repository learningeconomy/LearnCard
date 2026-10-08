import base64url from 'base64url';

/**
 * Extracts the source Boost URI encoded in a claim VC-API exchange URL.
 */
export const getClaimInteractionBoostUri = (requestUrl: unknown): string | undefined => {
    if (typeof requestUrl !== 'string' || !requestUrl) return undefined;

    try {
        const url = new URL(requestUrl, 'https://learncard.app');
        const segments = url.pathname.split('/').filter(Boolean);
        const workflowIndex = segments.findIndex(
            (segment, index) =>
                segment === 'workflows' &&
                segments[index + 1] === 'claim' &&
                segments[index + 2] === 'exchanges'
        );
        const exchangeId = workflowIndex >= 0 ? segments[workflowIndex + 3] : undefined;
        if (!exchangeId) return undefined;

        const payload = JSON.parse(base64url.decode(exchangeId)) as { boostUri?: unknown };
        return typeof payload.boostUri === 'string' && payload.boostUri
            ? payload.boostUri
            : undefined;
    } catch {
        return undefined;
    }
};

/** Returns true when the exchange URL belongs to the Universal Inbox claim workflow. */
export const isInboxClaimInteraction = (requestUrl: unknown): boolean => {
    if (typeof requestUrl !== 'string' || !requestUrl) return false;

    try {
        const url = new URL(requestUrl, 'https://learncard.app');
        const segments = url.pathname.split('/').filter(Boolean);

        return segments.some(
            (segment, index) =>
                segment === 'workflows' &&
                segments[index + 1] === 'inbox-claim' &&
                segments[index + 2] === 'exchanges'
        );
    } catch {
        return false;
    }
};

/**
 * Inbox credentials are finalized before they are returned to the app. After the learner saves
 * that batch, an empty follow-up request would incorrectly start the already-completed exchange.
 */
export const shouldCompleteInboxClaimLocally = (
    requestUrl: unknown,
    credentialClaimCount: number | undefined,
    body: unknown
): boolean => {
    if (!isInboxClaimInteraction(requestUrl) || !credentialClaimCount) return false;
    if (!body || typeof body !== 'object') return true;

    return !('verifiablePresentation' in body) && !('@context' in body);
};

/**
 * Uses the source Boost as the fast path and stable contents for pre-index-metadata records.
 */
export const getClaimInteractionDuplicateLookup = (boostUri: string | undefined) =>
    boostUri ? { boostUri, compareByContent: true as const } : undefined;
