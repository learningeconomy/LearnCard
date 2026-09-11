// Only operator-approved endpoints may receive requests from this example server.
// Return the configured value, never the request's URL, to keep the trust boundary explicit.
export const createNetworkUrlResolver = (additionalUrls = '') => {
    const trustedUrls = [
        'https://network.learncard.com/trpc',
        'https://api.learncard.com/trpc',
        'http://localhost:4000/trpc',
        ...additionalUrls
            .split(',')
            .map(value => value.trim())
            .filter(Boolean),
    ];
    for (const value of trustedUrls) {
        const url = new URL(value);
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password ||
            url.search ||
            url.hash
        ) {
            throw new Error(
                'Trusted network URLs must be HTTP(S) endpoints without credentials, query, or fragment'
            );
        }
    }
    return (requestedUrl, defaultUrl = true) => {
        if (requestedUrl === undefined || requestedUrl === '') return defaultUrl;
        if (typeof requestedUrl === 'string') {
            for (const trustedUrl of trustedUrls) {
                if (requestedUrl === trustedUrl) return trustedUrl;
            }
        }
        const error = new Error(
            'Network URL is not trusted. Configure CONSENT_FLOW_TRUSTED_NETWORK_URLS on the server.'
        );
        error.status = 400;
        throw error;
    };
};

export const resolveNetworkUrl = createNetworkUrlResolver(
    process.env.CONSENT_FLOW_TRUSTED_NETWORK_URLS
);
