import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { knownDIDRegistryQueryOptions, ISSUER_REGISTRY_STALE_TIME } from './issuerRegistry';
const list = 'https://registries.learncard.com/known-did-registries.json';
const legacy = 'https://example.com/registry';
const anchor = 'https://example.com/anchor';
const endpoint = 'https://example.com/issuer';
const jwt = (metadata: object) =>
    `e30.${Buffer.from(JSON.stringify({ metadata })).toString('base64url')}.x`;
let client: QueryClient;
let failure: boolean;
let fetchMock: Mock<(url: string) => Promise<Response>>;
beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    failure = false;
    fetchMock = vi.fn(async (url: string) => {
        if (url === list)
            return Response.json([
                { type: 'dcc-legacy', name: 'Trusted', url: legacy },
                { type: 'oidf', name: 'Federation', trustAnchorEC: anchor },
            ]);
        if (url.includes('untrusted-did-registries'))
            return Response.json([
                { type: 'dcc-legacy', name: 'Untrusted', url: 'https://example.com/untrusted' },
            ]);
        if (url === legacy)
            return failure
                ? new Response('', { status: 503 })
                : Response.json({
                      registry: { 'did:a': { name: 'A', url: 'https://a.example' } },
                  });
        if (url === anchor)
            return new Response(
                jwt({ federation_entity: { federation_fetch_endpoint: endpoint } })
            );
        if (url.startsWith(endpoint))
            return new URL(url).searchParams.get('sub') === 'did:b'
                ? new Response(jwt({ federation_entity: { organization_name: 'B' } }))
                : new Response('', { status: 404 });
        return Response.json({ registry: { 'did:c': { name: 'C' } } });
    });
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
    client.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});
const lookup = (did: string) =>
    client.fetchQuery({ ...knownDIDRegistryQueryOptions(client, did), retry: false });
const calls = (url: string) => fetchMock.mock.calls.filter(([value]) => value === url).length;
it('shares documents across concurrent issuers, preserving trust precedence and issuer metadata', async () => {
    const [a, b, c] = await Promise.all(['did:a', 'did:b', 'did:c'].map(lookup));
    expect([a.source, b.source, c.source]).toEqual(['trusted', 'trusted', 'untrusted']);
    expect(b.results).toMatchObject({
        matchingIssuers: [{ issuer: { federation_entity: { organization_name: 'B' } } }],
    });
    await lookup('did:a');
    for (const url of [list, legacy, anchor]) expect(calls(url)).toBe(1);
    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith(endpoint))).toHaveLength(3);
});
it('expires documents and honors explicit document invalidation', async () => {
    vi.useFakeTimers();
    await lookup('did:a');
    vi.setSystemTime(Date.now() + ISSUER_REGISTRY_STALE_TIME + 1);
    await client.invalidateQueries({ queryKey: ['knownDidRegistry'] });
    await lookup('did:a');
    expect(calls(legacy)).toBe(2);
    await client.invalidateQueries({ queryKey: ['issuerRegistryDocument'] });
    await client.invalidateQueries({ queryKey: ['knownDidRegistry'] });
    await lookup('did:a');
    expect(calls(legacy)).toBe(3);
});
it('retries registry outages without retaining them as fresh negative results', async () => {
    failure = true;
    expect((await lookup('did:a')).source).toBe('unknown');
    failure = false;
    await client.invalidateQueries({ queryKey: ['knownDidRegistry'] });
    expect((await lookup('did:a')).source).toBe('trusted');
    expect(calls(legacy)).toBe(2);
    expect(calls(anchor)).toBe(1);
});
it('propagates list failures and recovers on the next lookup', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('', { status: 503 }));
    await expect(lookup('did:a')).rejects.toThrow('Registry request failed');
    expect((await lookup('did:a')).source).toBe('trusted');
    expect(calls(list)).toBe(2);
});
it('disables lookups without an issuer', () => {
    const observer = new QueryObserver(client, knownDIDRegistryQueryOptions(client));
    const stop = observer.subscribe(() => {});
    expect(fetchMock).not.toHaveBeenCalled();
    stop();
});

it('keeps conclusive issuer results fresh for an hour and incomplete results for a minute', async () => {
    vi.useFakeTimers();
    const conclusive = new QueryObserver(client, knownDIDRegistryQueryOptions(client, 'did:a'));
    await conclusive.refetch();
    expect(conclusive.getCurrentResult().data?.incomplete).toBe(false);
    vi.setSystemTime(Date.now() + 61_000);
    await lookup('did:a');
    expect(calls(legacy)).toBe(1);
    vi.setSystemTime(Date.now() + 60 * 60_000);
    await lookup('did:a');
    expect(calls(legacy)).toBe(2);
});

it('retains an untrusted warning during a trusted-registry outage and rechecks after one minute', async () => {
    vi.useFakeTimers();
    failure = true;
    const partial = await lookup('did:c');
    expect(partial).toMatchObject({ source: 'untrusted', incomplete: true });
    await lookup('did:c');
    expect(calls(legacy)).toBe(1);
    failure = false;
    vi.setSystemTime(Date.now() + 61_000);
    expect(await lookup('did:c')).toMatchObject({ source: 'untrusted', incomplete: false });
    expect(calls(legacy)).toBe(2);
});

describe('OpenSALT registry proxy', () => {
    const base = 'https://staging.learncard.ai';
    const osAnchor = 'https://staging.opensalt.net/issuer-registry/.well-known/openid-federation';
    const osFetch = 'https://staging.opensalt.net/issuer-registry/fetch';
    const proxyPrefix = `${base}/api/registry-proxy/staging.opensalt.net`;
    const proxyHeaders = { 'X-Registry-Proxy': '1' };
    type Mode = 'ok' | 'proxy-502' | 'spa-fallback' | 'proxy-network' | 'all-down';
    let mode: Mode;
    let osFetchMock: Mock<(url: string, init?: RequestInit) => Promise<Response>>;
    const upstream = (url: string) => {
        if (url === osAnchor)
            return new Response(jwt({ federation_entity: { federation_fetch_endpoint: osFetch } }));
        if (url.startsWith(osFetch))
            return new URL(url).searchParams.get('sub') === 'did:os'
                ? new Response(jwt({ federation_entity: { organization_name: 'OS' } }))
                : new Response('', { status: 404 });
        return null;
    };
    beforeEach(() => {
        mode = 'ok';
        osFetchMock = vi.fn(async (url: string) => {
            if (url === list)
                return Response.json([
                    { type: 'dcc-legacy', name: 'Trusted', url: legacy },
                    { type: 'oidf', name: 'OpenSALT', trustAnchorEC: osAnchor },
                ]);
            if (url.includes('untrusted-did-registries')) return Response.json([]);
            if (url === legacy) return Response.json({ registry: {} });
            if (url.startsWith(`${base}/api/registry-proxy/`)) {
                if (mode === 'proxy-network' || mode === 'all-down')
                    throw new TypeError('Failed to fetch');
                if (mode === 'proxy-502')
                    return Response.json({ error: 'x' }, { status: 502, headers: proxyHeaders });
                if (mode === 'spa-fallback')
                    return new Response('<!doctype html>', {
                        headers: { 'Content-Type': 'text/html' },
                    });
                const target = `https://${url.slice(`${base}/api/registry-proxy/`.length)}`;
                const response = upstream(target)!;
                return new Response(response.body, {
                    status: response.status,
                    headers: proxyHeaders,
                });
            }
            if (mode === 'all-down') throw new TypeError('CORS');
            return upstream(url) ?? new Response('', { status: 404 });
        });
        vi.stubGlobal('fetch', osFetchMock);
    });
    const osLookup = (did: string) =>
        client.fetchQuery({ ...knownDIDRegistryQueryOptions(client, did, base), retry: false });
    const proxyCalls = () =>
        osFetchMock.mock.calls.filter(([url]) => url.startsWith(`${base}/api/registry-proxy/`));
    const directOpenSaltCalls = () =>
        osFetchMock.mock.calls.filter(([url]) => url.startsWith('https://staging.opensalt.net/'));

    it('resolves OpenSALT-listed issuers as trusted through the proxy only', async () => {
        const result = await osLookup('did:os');
        expect(result.source).toBe('trusted');
        expect(result.results).toMatchObject({
            matchingIssuers: [{ issuer: { federation_entity: { organization_name: 'OS' } } }],
        });
        expect(proxyCalls().map(([url]) => url)).toEqual([
            `${proxyPrefix}/issuer-registry/.well-known/openid-federation`,
            `${proxyPrefix}/issuer-registry/fetch?sub=did%3Aos`,
        ]);
        expect(proxyCalls().every(([, init]) => init?.credentials === 'omit')).toBe(true);
        expect(directOpenSaltCalls()).toHaveLength(0);
        for (const url of [list, legacy]) {
            expect(osFetchMock.mock.calls.filter(([value]) => value === url)).toHaveLength(1);
        }
    });

    it('treats a proxied 404 as a negative lookup without retrying directly', async () => {
        expect(await osLookup('did:nobody')).toMatchObject({
            source: 'unknown',
            incomplete: false,
        });
        expect(directOpenSaltCalls()).toHaveLength(0);
    });

    it.each<Mode>(['proxy-502', 'spa-fallback', 'proxy-network'])(
        'falls back to the direct request when the proxy fails (%s)',
        async proxyFailure => {
            mode = proxyFailure;
            expect((await osLookup('did:os')).source).toBe('trusted');
            expect(directOpenSaltCalls().length).toBeGreaterThan(0);
        }
    );

    it('reports unknown and incomplete, never trusted, when proxy and direct both fail', async () => {
        mode = 'all-down';
        expect(await osLookup('did:os')).toMatchObject({ source: 'unknown', incomplete: true });
    });

    it('does not proxy anything without a base URL', async () => {
        expect((await osLookup('did:os')).source).toBe('trusted');
        client.clear();
        osFetchMock.mockClear();
        await client.fetchQuery({
            ...knownDIDRegistryQueryOptions(client, 'did:os'),
            retry: false,
        });
        expect(proxyCalls()).toHaveLength(0);
        expect(directOpenSaltCalls()).toHaveLength(2);
    });
});

it('marks unsupported registry types as unchecked instead of claiming a complete lookup', async () => {
    const originalFetch = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string) =>
        url === list
            ? Response.json([
                  { type: 'future-registry', name: 'Future', url: 'https://example.com/future' },
              ])
            : originalFetch(url)
    );
    expect(await lookup('did:c')).toMatchObject({ source: 'untrusted', incomplete: true });
    expect(await lookup('did:unknown')).toMatchObject({ source: 'unknown', incomplete: true });
    expect(calls('https://example.com/future')).toBe(0);
});
