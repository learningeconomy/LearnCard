import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, {
    REGISTRY_PROXY_MAX_BYTES,
    getAllowedRegistryUrl,
    getRegistryProxyBaseUrl,
    toRegistryProxyUrl,
} from './registryProxy';
import * as lcaEntry from '../../../../apps/learn-card-app/netlify/edge-functions/registry-proxy';
import * as scoutsEntry from '../../../../apps/scouts/netlify/edge-functions/registry-proxy';

const ANCHOR = 'https://staging.opensalt.net/issuer-registry/.well-known/openid-federation';
const JWS = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ4In0.c2ln';
const proxied = (target: string, init?: RequestInit) =>
    handler(new Request(`https://learncard.app/api/registry-proxy/${target}`, init));
const jwtResponse = (body = JWS, headers: Record<string, string> = {}) =>
    new Response(body, {
        headers: { 'Content-Type': 'application/entity-statement+jwt', ...headers },
    });

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('registry proxy allowlist', () => {
    it.each([
        ANCHOR,
        'https://opensalt.net/issuer-registry/.well-known/openid-federation',
        'https://staging.opensalt.net/issuer-registry/fetch?sub=did%3Aweb%3Aexample.edu',
        'https://staging.opensalt.net/issuer-registry/fetch?sub=did:key:z6Mk&iss=https://x',
        'https://staging.opensalt.net/issuer-registry/subordinate_listing',
        'https://staging.opensalt.net/issuer-registry/list?entity_type=openid_credential_issuer',
    ])('allows %s', url => {
        expect(getAllowedRegistryUrl(url)?.href).toBe(new URL(url).href);
    });

    it.each([
        'http://staging.opensalt.net/issuer-registry/fetch?sub=did:a',
        'https://evil.example/issuer-registry/fetch?sub=did:a',
        'https://staging.opensalt.net.evil.example/issuer-registry/fetch?sub=did:a',
        'https://sub.staging.opensalt.net/issuer-registry/fetch?sub=did:a',
        'https://staging.opensalt.net:8443/issuer-registry/fetch?sub=did:a',
        'https://user:pass@staging.opensalt.net/issuer-registry/fetch?sub=did:a',
        'https://staging.opensalt.net/issuer-registry/governance',
        'https://staging.opensalt.net/issuer-registry/fetch',
        'https://staging.opensalt.net/issuer-registry/fetch?sub=',
        'https://staging.opensalt.net/issuer-registry/fetch?sub=did:a&sub=did:b',
        'https://staging.opensalt.net/issuer-registry/fetch?sub=did:a&url=https://evil',
        `https://staging.opensalt.net/issuer-registry/fetch?sub=${'a'.repeat(2049)}`,
        `${ANCHOR}?sub=did:a`,
        `${ANCHOR}#frag`,
        'https://staging.opensalt.net/api/v1/frameworks',
        'not a url',
    ])('rejects %s', url => {
        expect(getAllowedRegistryUrl(url)).toBeNull();
        expect(toRegistryProxyUrl(url, 'https://learncard.app')).toBeNull();
    });

    it('maps allowlisted upstreams onto the proxy path and preserves the query', () => {
        expect(
            toRegistryProxyUrl(
                'https://staging.opensalt.net/issuer-registry/fetch?sub=did%3Aweb%3Ax',
                'https://staging.pass.scout.org/'
            )
        ).toBe(
            'https://staging.pass.scout.org/api/registry-proxy/staging.opensalt.net/issuer-registry/fetch?sub=did%3Aweb%3Ax'
        );
    });

    it.each([
        [false, 'learncard.app', 'http://localhost:3000', 'http://localhost:3000'],
        [
            false,
            undefined,
            'https://deploy-preview-1.netlify.app',
            'https://deploy-preview-1.netlify.app',
        ],
        [true, 'staging.learncard.ai', 'capacitor://localhost', 'https://staging.learncard.ai'],
        [true, 'pass.scout.org', 'https://localhost', 'https://pass.scout.org'],
        [true, undefined, 'capacitor://localhost', undefined],
    ])(
        'resolves base URL (native=%s, domain=%s, origin=%s)',
        (native, domain, origin, expected) => {
            expect(getRegistryProxyBaseUrl(native, domain, origin)).toBe(expected);
        }
    );
});

describe('registry proxy edge handler', () => {
    it('proxies an allowlisted document with CORS, CDN caching and no forwarded credentials', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(jwtResponse(JWS, { 'Set-Cookie': 'upstream=private' }));
        vi.stubGlobal('fetch', fetchMock);
        const response = await proxied(
            'staging.opensalt.net/issuer-registry/.well-known/openid-federation',
            {
                headers: {
                    Origin: 'capacitor://localhost',
                    Cookie: 'session=private',
                    Authorization: 'Bearer secret',
                },
            }
        );

        expect(response.status).toBe(200);
        expect(await response.text()).toBe(JWS);
        expect(response.headers.get('Content-Type')).toBe('application/entity-statement+jwt');
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('X-Registry-Proxy')).toBe('1');
        expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-Registry-Proxy');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=60');
        expect(response.headers.get('Netlify-CDN-Cache-Control')).toBe(
            'public, s-maxage=300, stale-while-revalidate=600'
        );
        expect(response.headers.get('Set-Cookie')).toBeNull();
        expect(fetchMock).toHaveBeenCalledWith(ANCHOR, {
            headers: {
                Accept: 'application/entity-statement+jwt, application/jwt, application/json',
            },
            redirect: 'manual',
            signal: expect.any(AbortSignal),
        });
    });

    it('forwards only the allowlisted query for issuer fetches', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jwtResponse());
        vi.stubGlobal('fetch', fetchMock);
        await proxied('staging.opensalt.net/issuer-registry/fetch?sub=did%3Aweb%3Ax');
        expect(fetchMock.mock.calls[0]![0]).toBe(
            'https://staging.opensalt.net/issuer-registry/fetch?sub=did%3Aweb%3Ax'
        );
    });

    it('serves JSON listings', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(['did:web:a'])));
        const response = await proxied('staging.opensalt.net/issuer-registry/subordinate_listing');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(['did:web:a']);
    });

    it.each([
        ['OPTIONS', 'staging.opensalt.net/issuer-registry/fetch?sub=did:a', 204],
        ['POST', 'staging.opensalt.net/issuer-registry/fetch?sub=did:a', 405],
        ['PUT', 'staging.opensalt.net/issuer-registry/fetch?sub=did:a', 405],
        ['DELETE', 'staging.opensalt.net/issuer-registry/fetch?sub=did:a', 405],
        ['HEAD', 'staging.opensalt.net/issuer-registry/fetch?sub=did:a', 405],
        ['GET', 'evil.example/issuer-registry/fetch?sub=did:a', 403],
        ['GET', 'staging.opensalt.net/issuer-registry/governance', 403],
        ['GET', 'staging.opensalt.net/issuer-registry/fetch?sub=did:a&url=https://evil', 403],
        ['GET', 'staging.opensalt.net/issuer-registry/fetch', 403],
        ['GET', 'staging.opensalt.net%2Fissuer-registry%2Ffetch?sub=did:a', 403],
        ['GET', 'staging.opensalt.net@evil.example/issuer-registry/fetch?sub=did:a', 403],
        ['GET', 'localhost:8080/issuer-registry/fetch?sub=did:a', 403],
        ['GET', '169.254.169.254/latest/meta-data', 403],
        ['GET', '', 403],
    ])('handles %s %s without fetching upstream', async (method, target, status) => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const response = await proxied(target, {
            method,
            headers: { 'Access-Control-Request-Headers': 'sentry-trace,baggage' },
        });
        expect(response.status).toBe(status);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Access-Control-Allow-Headers')).toContain('sentry-trace');
        expect(response.headers.get('Access-Control-Allow-Headers')).toContain('baggage');
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.has('Netlify-CDN-Cache-Control')).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects path traversal out of the allowlisted prefix', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const response = await handler(
            new Request(
                'https://learncard.app/api/registry-proxy/staging.opensalt.net/issuer-registry/../api/v1/frameworks'
            )
        );
        expect(response.status).toBe(403);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('passes through an upstream 404 as an uncached negative lookup', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response('<html>not found</html>', {
                    status: 404,
                    headers: { 'Content-Type': 'text/html' },
                })
            )
        );
        const response = await proxied('staging.opensalt.net/issuer-registry/fetch?sub=did:a');
        expect(response.status).toBe(404);
        expect(response.headers.get('X-Registry-Proxy')).toBe('1');
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.has('Netlify-CDN-Cache-Control')).toBe(false);
    });

    it.each([
        ['upstream 503', () => new Response('down', { status: 503 })],
        ['upstream 500', () => new Response('err', { status: 500 })],
        [
            'redirect',
            () =>
                new Response(null, { status: 302, headers: { Location: 'https://evil.example' } }),
        ],
        [
            'HTML body',
            () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }),
        ],
        ['missing content type', () => new Response(JWS, { headers: { 'Content-Type': '' } })],
        ['malformed JWT', () => jwtResponse('not-a-jwt')],
        [
            'malformed JSON',
            () => new Response('{', { headers: { 'Content-Type': 'application/json' } }),
        ],
        [
            'declared oversize',
            () => jwtResponse(JWS, { 'Content-Length': String(REGISTRY_PROXY_MAX_BYTES + 1) }),
        ],
        ['streamed oversize', () => jwtResponse(`${'a'.repeat(REGISTRY_PROXY_MAX_BYTES)}.b.c`)],
    ])('returns an uncached 502 for %s', async (_label, upstream) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream()));
        const response = await proxied(
            'staging.opensalt.net/issuer-registry/.well-known/openid-federation'
        );
        expect(response.status).toBe(502);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.has('Netlify-CDN-Cache-Control')).toBe(false);
    });

    it('returns an uncached 502 when the upstream request throws', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
        const response = await proxied(
            'staging.opensalt.net/issuer-registry/.well-known/openid-federation'
        );
        expect(response.status).toBe(502);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('aborts a stalled upstream after eight seconds', async () => {
        vi.useFakeTimers();
        vi.stubGlobal(
            'fetch',
            vi.fn(
                (_url, { signal }: { signal: AbortSignal }) =>
                    new Promise((_resolve, reject) => {
                        signal.addEventListener('abort', () => reject(new Error('aborted')));
                    })
            )
        );
        const pending = proxied(
            'staging.opensalt.net/issuer-registry/.well-known/openid-federation'
        );
        await vi.advanceTimersByTimeAsync(7_999);
        expect(vi.getTimerCount()).toBe(1);
        await vi.advanceTimersByTimeAsync(1);
        const response = await pending;
        expect(response.status).toBe(504);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('app edge function entries', () => {
    it.each([
        ['learn-card-app', lcaEntry],
        ['scouts', scoutsEntry],
    ])('%s wires the shared handler', (_app, entry) => {
        expect(entry.default).toBe(handler);
        expect(entry.config).toEqual({ path: '/api/registry-proxy/*', cache: 'manual' });
    });
});
