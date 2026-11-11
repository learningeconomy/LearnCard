/**
 * Allowlisted proxy for public issuer-registry documents (OpenSALT OIDF federation).
 *
 * This module must stay dependency-free: the same file is bundled by Netlify edge
 * functions (Deno), the Vite dev/preview middleware (Node), and the browser client.
 */

export const REGISTRY_PROXY_PATH = '/api/registry-proxy';
export const REGISTRY_PROXY_HEADER = 'X-Registry-Proxy';
export const REGISTRY_PROXY_TIMEOUT_MS = 8_000;
export const REGISTRY_PROXY_MAX_BYTES = 256 * 1024;

const ALLOWED_HOSTS: ReadonlySet<string> = new Set(['opensalt.net', 'staging.opensalt.net']);

/** Exact upstream paths mapped to the only query parameters each one accepts. */
const ALLOWED_PATHS: ReadonlyMap<string, readonly string[]> = new Map([
    ['/issuer-registry/.well-known/openid-federation', []],
    ['/issuer-registry/fetch', ['sub', 'iss']],
    ['/issuer-registry/list', ['entity_type']],
    ['/issuer-registry/subordinate_listing', ['entity_type']],
]);

const REQUIRED_PARAMS: ReadonlyMap<string, string> = new Map([['/issuer-registry/fetch', 'sub']]);

/**
 * Netlify's CDN cache key ignores the query string unless the response opts in. Every
 * response (cached or not) must send the same value, so it is derived from the allowlist.
 */
export const REGISTRY_PROXY_NETLIFY_VARY = `query=${[
    ...new Set([...ALLOWED_PATHS.values()].flat()),
].join('|')}`;

const JWT_CONTENT_TYPES: ReadonlySet<string> = new Set([
    'application/entity-statement+jwt',
    'application/jwt',
]);
const JSON_CONTENT_TYPE = 'application/json';
const MAX_QUERY_VALUE_LENGTH = 2_048;
const COMPACT_JWS = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
const PROXY_TARGET = /^[a-z0-9.-]+\/[A-Za-z0-9._/-]+$/;

const baseHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, sentry-trace, baggage',
    'Access-Control-Expose-Headers': REGISTRY_PROXY_HEADER,
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Netlify-Vary': REGISTRY_PROXY_NETLIFY_VARY,
    'X-Content-Type-Options': 'nosniff',
    [REGISTRY_PROXY_HEADER]: '1',
};

const errorResponse = (status: number, error: string, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify({ error }), {
        status,
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8', ...extra },
    });

/** Returns the parsed URL only when it is an allowlisted registry document URL. */
export const getAllowedRegistryUrl = (value: string): URL | null => {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
        return null;
    }
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;

    const allowedParams = ALLOWED_PATHS.get(url.pathname);
    if (!allowedParams) return null;

    const seen = new Set<string>();
    for (const [name, paramValue] of url.searchParams) {
        if (
            !allowedParams.includes(name) ||
            seen.has(name) ||
            !paramValue ||
            paramValue.length > MAX_QUERY_VALUE_LENGTH
        ) {
            return null;
        }
        seen.add(name);
    }
    const required = REQUIRED_PARAMS.get(url.pathname);
    if (required && !seen.has(required)) return null;

    return url;
};

/** Maps an allowlisted upstream URL onto the proxy at `baseUrl`; null means "do not proxy". */
export const toRegistryProxyUrl = (upstream: string, baseUrl: string): string | null => {
    const url = getAllowedRegistryUrl(upstream);
    if (!url) return null;
    return `${baseUrl.replace(/\/+$/, '')}${REGISTRY_PROXY_PATH}/${url.hostname}${url.pathname}${
        url.search
    }`;
};

/**
 * Web uses the current origin (including local Vite dev, which serves the same handler).
 * Native origins are capacitor://localhost / https://localhost, so use the tenant's HTTPS domain.
 */
export const getRegistryProxyBaseUrl = (
    isNative: boolean,
    tenantDomain?: string,
    webOrigin?: string
): string | undefined => {
    if (isNative) return tenantDomain ? `https://${tenantDomain}` : undefined;
    return webOrigin || undefined;
};

const readLimited = async (response: Response, limit: number): Promise<string | null> => {
    if (!response.body) return '';
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new TextDecoder().decode(body);
};

const isValidBody = (contentType: string, body: string): boolean => {
    if (JWT_CONTENT_TYPES.has(contentType)) return COMPACT_JWS.test(body.trim());
    try {
        JSON.parse(body);
        return true;
    } catch {
        return false;
    }
};

export const handleRegistryProxyRequest = async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS')
        return new Response(null, { status: 204, headers: baseHeaders });
    if (request.method !== 'GET') {
        return errorResponse(405, 'Method not allowed', { Allow: 'GET, OPTIONS' });
    }

    const requestUrl = new URL(request.url);
    const prefix = `${REGISTRY_PROXY_PATH}/`;
    const target = requestUrl.pathname.startsWith(prefix)
        ? requestUrl.pathname.slice(prefix.length)
        : '';
    const upstream = PROXY_TARGET.test(target)
        ? getAllowedRegistryUrl(`https://${target}${requestUrl.search}`)
        : null;
    if (!upstream) return errorResponse(403, 'Registry upstream is not allowed');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REGISTRY_PROXY_TIMEOUT_MS);
    try {
        // Fresh headers only: caller cookies/authorization are never forwarded, and
        // redirects are not followed so the allowlist cannot be escaped upstream.
        const response = await fetch(upstream.href, {
            headers: {
                Accept: 'application/entity-statement+jwt, application/jwt, application/json',
            },
            redirect: 'manual',
            signal: controller.signal,
        });
        if (response.status === 404) {
            await response.body?.cancel();
            return errorResponse(404, 'Registry entry not found');
        }
        if (!response.ok) {
            await response.body?.cancel();
            return errorResponse(502, 'Registry is unavailable');
        }

        const contentType =
            response.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() ?? '';
        if (!JWT_CONTENT_TYPES.has(contentType) && contentType !== JSON_CONTENT_TYPE) {
            await response.body?.cancel();
            return errorResponse(502, 'Unexpected registry response type');
        }
        if (Number(response.headers.get('Content-Length')) > REGISTRY_PROXY_MAX_BYTES) {
            await response.body?.cancel();
            return errorResponse(502, 'Registry response is too large');
        }

        const body = await readLimited(response, REGISTRY_PROXY_MAX_BYTES);
        if (body === null) return errorResponse(502, 'Registry response is too large');
        if (!isValidBody(contentType, body)) {
            return errorResponse(502, 'Invalid registry response');
        }

        return new Response(body, {
            headers: {
                ...baseHeaders,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=60',
                'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch {
        return errorResponse(
            controller.signal.aborted ? 504 : 502,
            controller.signal.aborted ? 'Registry request timed out' : 'Registry is unavailable'
        );
    } finally {
        clearTimeout(timeout);
    }
};

export default handleRegistryProxyRequest;
