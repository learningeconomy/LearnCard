/**
 * Fetch boundary for the CLI's empty-wallet WASM verification path, not an OS sandbox.
 * DIDKit's generated WASM imports call global fetch/globalObject.fetch; dynamic-loader also
 * calls global fetch. The CLI supplies packaged WASM bytes, so no remote WASM loader is needed.
 */
export const createOwnedServiceFetch = (
    serviceUrls: readonly string[],
    onViolation: (message: string) => void,
    nativeFetch: typeof globalThis.fetch = globalThis.fetch
): typeof globalThis.fetch => {
    const origins = new Set(
        serviceUrls.map(value => {
            const url = new URL(value);
            if (
                url.protocol !== 'http:' ||
                !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
                url.username ||
                url.password
            ) {
                throw new Error('CLI verification requires explicit owned loopback HTTP services');
            }
            return url.origin;
        })
    );
    if (!origins.size) throw new Error('CLI verification requires owned service origins');

    const refuse = (reason: string): never => {
        const message = `CLI verification network policy: ${reason}`;
        onViolation(message);
        throw new Error(message);
    };

    return Object.assign(
        async (input: string | URL | Request, init?: RequestInit) => {
            const url = new URL(input instanceof Request ? input.url : input.toString());
            if (
                url.protocol !== 'http:' ||
                url.username ||
                url.password ||
                !origins.has(url.origin)
            ) {
                return refuse(`refused non-owned origin ${url.origin}`);
            }
            // Never let fetch follow a redirect before checking it. Even same-origin redirects
            // are refused: verification only needs the owned service's direct document response.
            const response = await nativeFetch(input, { ...init, redirect: 'manual' });
            if (response.status >= 300 && response.status < 400) {
                await response.body?.cancel();
                return refuse(`refused redirect from ${url.origin}`);
            }
            return response;
        },
        {
            preconnect: () => refuse('preconnect is unsupported during credential verification'),
        }
    );
};
