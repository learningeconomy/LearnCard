import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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
let fetchMock: ReturnType<typeof vi.fn>;
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
const lookup = (did: string) => client.fetchQuery(knownDIDRegistryQueryOptions(client, did));
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
    await lookup('did:a');
    expect(calls(legacy)).toBe(2);
    await client.invalidateQueries({ queryKey: ['issuerRegistryDocument'] });
    await lookup('did:a');
    expect(calls(legacy)).toBe(3);
});
it('retries registry outages without retaining them as fresh negative results', async () => {
    failure = true;
    expect((await lookup('did:a')).source).toBe('unknown');
    failure = false;
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
