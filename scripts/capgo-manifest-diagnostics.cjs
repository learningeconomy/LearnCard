// The CLI prints only the top-level manifest error. Capture the response's
// diagnostic fields without logging request bodies, URLs, or authorization.
const originalFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const input = args[0];
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    if (url && new URL(url).pathname.endsWith('/private/set_manifest') && !response.ok) {
        try {
            const body = await response.clone().json();
            const redact = value => {
                let text = JSON.stringify(value);
                const token = process.env.CAPGO_TOKEN;
                if (token) text = text.split(token).join('[redacted]');
                return text.slice(0, 12000);
            };
            console.error('[capgo-manifest-response] ' + redact({
                status: response.status,
                requestId: response.headers.get('x-request-id'),
                error: body.error,
                message: body.message,
                moreInfo: body.moreInfo,
            }));
        } catch {
            console.error('[capgo-manifest-response] Could not decode error response; HTTP ' + response.status);
        }
    }
    return response;
};
