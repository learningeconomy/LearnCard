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
