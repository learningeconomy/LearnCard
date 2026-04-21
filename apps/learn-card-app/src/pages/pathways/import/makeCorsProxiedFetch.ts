/**
 * makeCorsProxiedFetch — a `typeof fetch` adapter suitable for
 * reaching the Credential Engine Registry from the browser.
 *
 * The registry serves CTDL JSON-LD at `credentialengineregistry.org`
 * but historically has not advertised permissive CORS headers on every
 * origin. On native Capacitor platforms we can bypass browser CORS
 * entirely via `CapacitorHttp`; on the web we tunnel through
 * `corsproxy.io` using the same key-gated pattern already used by
 * `aiPassport-queries.ts` for iTunes lookups.
 *
 * Responsibilities intentionally kept narrow: this function builds a
 * fetch-shaped callable that `fetchCtdlPathway` consumes. The import
 * pipeline itself stays platform-agnostic.
 *
 * If the CORS proxy key is unset (dev environments without
 * `CORS_PROXY_API_KEY`), we fall back to direct `fetch` and let the
 * browser do its thing — handy for local testing against mock servers
 * or when the registry happens to allow the origin.
 */

import { Capacitor, CapacitorHttp } from '@capacitor/core';

declare const CORS_PROXY_API_KEY: string | undefined;

export interface MakeCorsProxiedFetchOptions {
    /**
     * Override the platform detection. Primarily used by tests so we
     * can exercise the web branch without a native shim.
     */
    forceWeb?: boolean;

    /**
     * Override the CORS-proxy key. Defaults to the bundler-injected
     * `CORS_PROXY_API_KEY` constant.
     */
    corsProxyKey?: string;
}

/**
 * Build a `typeof fetch` that tunnels through the appropriate channel
 * for the current runtime.
 */
export const makeCorsProxiedFetch = (
    opts: MakeCorsProxiedFetchOptions = {},
): typeof fetch => {
    const { forceWeb = false, corsProxyKey = CORS_PROXY_API_KEY } = opts;

    const isNative = !forceWeb && Capacitor.isNativePlatform();

    const fetchImpl: typeof fetch = async (input, init) => {
        const originalUrl =
            typeof input === 'string'
                ? input
                : input instanceof URL
                    ? input.toString()
                    : (input as Request).url;

        // Resolve the URL we actually send the request to.
        const resolvedUrl = isNative || !corsProxyKey
            ? originalUrl
            : `https://corsproxy.io/?key=${corsProxyKey}&url=${encodeURIComponent(originalUrl)}`;

        if (isNative) {
            // CapacitorHttp on native platforms — bypasses CORS entirely
            // and gives us the registry response directly.
            const response = await CapacitorHttp.get({
                url: resolvedUrl,
                headers: { Accept: 'application/json' },
            });

            const ok = response.status >= 200 && response.status < 300;

            // Normalize Capacitor's response shape into a `Response` so
            // `fetchCtdlPathway`'s `response.ok` / `response.json()`
            // contract still works.
            const body =
                typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data ?? null);

            return new Response(body, {
                status: response.status,
                statusText: ok ? 'OK' : 'HTTP error',
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Web: plain fetch through the proxy (or direct if no key set).
        return fetch(resolvedUrl, {
            ...init,
            headers: {
                Accept: 'application/json',
                ...(init?.headers ?? {}),
            },
        });
    };

    return fetchImpl;
};
