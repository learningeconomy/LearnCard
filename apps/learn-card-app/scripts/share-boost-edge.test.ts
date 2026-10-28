import { describe, expect, it, mock } from 'bun:test';
import { createShareBoostHandler } from '../netlify/edge-functions/shared/share-boost-handler';

const ID = '5b58ff0c-bb55-4f25-a2a5-b4de3778c649';
const request = (
    ua: string,
    query = `?preview=${ID}&uri=credential%3Aprivate&seed=secret&pin=secret`
) => new Request(`https://tenant.example/share-boost${query}`, { headers: { 'user-agent': ua } });
const makeHandler = (
    fetcher: typeof fetch,
    resolveTenantConfig = (hostname: string) => ({
        apis: { brainServiceApi: `https://${hostname}/api` },
    })
) =>
    createShareBoostHandler({
        resolveTenantConfig,
        getTenantOrigin: url => new URL(url).origin,
        fetch: fetcher,
    });
const context = (
    next = mock(async () => new Response('<!doctype html><html><body>SPA</body></html>'))
) => ({ next });

describe('share preview crawler edge handler', () => {
    it('resolves the tenant backend and preserves a usable escaped share destination', async () => {
        const fetcher = mock(async () =>
            Response.json({
                name: '<Badge>',
                issuer: 'Issuer & Co',
                image: 'https://cdn.example/badge.png',
            })
        );
        const resolve = mock((hostname: string) => ({
            apis: { brainServiceApi: `https://${hostname}/api` },
        }));
        const next = context();
        const response = await makeHandler(fetcher, resolve)(
            request('LinkedInBot/1.0'),
            next as never
        );
        const html = await response.text();
        expect(resolve).toHaveBeenCalledWith('tenant.example');
        expect(fetcher).toHaveBeenCalledWith(
            new URL(
                `https://tenant.example/api/credential-share-previews/${ID}?shareUri=credential%3Aprivate`
            ),
            expect.objectContaining({ redirect: 'error' })
        );
        expect(html).toContain('&lt;Badge&gt;');
        expect(html).toContain('Issuer &amp; Co');
        expect(html).toContain('og:image" content="https://cdn.example/badge.png"');
        expect(html).toContain('twitter:card" content="summary_large_image"');
        const canonical = new URL(
            html.match(/property="og:url" content="([^"]+)"/)![1].replaceAll('&amp;', '&')
        );
        expect(canonical.origin + canonical.pathname).toBe('https://tenant.example/share-boost');
        expect(canonical.searchParams.get('uri')).toBe('credential:private');
        expect(canonical.searchParams.get('seed')).toBe('secret');
        expect(canonical.searchParams.get('pin')).toBe('secret');
        expect(canonical.searchParams.get('preview')).toBe(ID);
        expect(response.headers.get('cache-control')).toContain('no-store');
        expect(next.next).not.toHaveBeenCalled();
        expect([...canonical.searchParams.keys()].sort()).toEqual([
            'pin',
            'preview',
            'seed',
            'uri',
        ]);
    });

    it('passes browsers, missing previews and fetch failures to the SPA unchanged', async () => {
        const next = context();
        const fetcher = mock(async () => {
            throw new Error('backend unavailable');
        });
        const handler = makeHandler(fetcher);
        const browser = await handler(request('Mozilla/5.0'), next as never);
        expect(await browser.text()).toContain('SPA');
        const missing = await handler(request('LinkedInBot/1.0', ''), next as never);
        expect(await missing.text()).toContain('SPA');
        const failed = await handler(request('LinkedInBot/1.0'), next as never);
        expect(await failed.text()).toContain('SPA');
        expect(next.next).toHaveBeenCalledTimes(3);
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('falls back without exposing unexpected credential data from the backend', async () => {
        const next = context();
        const fetcher = mock(async () =>
            Response.json({
                name: 'Badge',
                issuer: 'Issuer',
                credentialSubject: { name: 'Private learner' },
            })
        );
        const response = await makeHandler(fetcher)(request('LinkedInBot/1.0'), next as never);
        const html = await response.text();
        expect(html).toContain('SPA');
        expect(html).not.toContain('Private learner');
        expect(html).not.toContain('og:title');
    });

    it('roundtrips encoded credential addresses while dropping unrelated query parameters', async () => {
        const uri = 'lc:cloud:localhost%3A40875/trpc:credential:opaque&value=one';
        const seed = 'original&seed=value';
        const params = new URLSearchParams({
            uri,
            seed,
            pin: '1234',
            preview: ID,
            redirect: 'https://untrusted.example/',
            subject: 'Private learner',
        });
        const response = await makeHandler(
            mock(async () => Response.json({ name: 'Badge', issuer: 'Issuer' }))
        )(request('LinkedInBot', `?${params}`), context() as never);
        const html = await response.text();
        const canonical = new URL(
            html.match(/property="og:url" content="([^"]+)"/)![1].replaceAll('&amp;', '&')
        );
        expect(canonical.searchParams.get('uri')).toBe(uri);
        expect(canonical.searchParams.get('seed')).toBe(seed);
        expect(canonical.searchParams.get('pin')).toBe('1234');
        expect(canonical.searchParams.get('preview')).toBe(ID);
        expect(canonical.searchParams.has('redirect')).toBe(false);
        expect(html).not.toContain('Private learner');
    });

    it('requires a share URI and lets the backend reject a mismatched binding', async () => {
        const next = context();
        const fetcher = mock(async () => new Response(null, { status: 404 }));
        const handler = makeHandler(fetcher);
        const missing = await handler(request('LinkedInBot', `?preview=${ID}`), next as never);
        expect(await missing.text()).toContain('SPA');
        expect(fetcher).not.toHaveBeenCalled();
        const mismatch = await handler(
            request('LinkedInBot', `?preview=${ID}&uri=credential%3Aanother`),
            next as never
        );
        expect(await mismatch.text()).toContain('SPA');
        expect(next.next).toHaveBeenCalledTimes(2);
    });
});
