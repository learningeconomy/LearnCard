import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, { config } from '../netlify/edge-functions/scout-news';
import news from '../src/components/scout-news/scoutnewsdefault.json';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('Scout news edge endpoint', () => {
    it.each(['https://pass.scout.org', 'https://staging.pass.scout.org'])(
        'serves the fixed upstream JSON with native CORS and CDN caching on %s',
        async origin => {
            const fetchMock = vi.fn().mockResolvedValue(
                new Response(JSON.stringify(news), {
                    headers: { 'Set-Cookie': 'upstream-session=private' },
                })
            );
            vi.stubGlobal('fetch', fetchMock);
            const response = await handler(
                new Request(`${origin}/api/scout-news`, {
                    headers: { Origin: 'capacitor://localhost', Cookie: 'session=private' },
                })
            );

            expect(await response.json()).toEqual(news);
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
            expect(response.headers.get('Netlify-CDN-Cache-Control')).toContain('s-maxage=300');
            expect(response.headers.get('Set-Cookie')).toBeNull();
            expect(config).toEqual({ path: '/api/scout-news', cache: 'manual' });
            expect(fetchMock).toHaveBeenCalledWith('https://www.scout.org/api/news', {
                headers: { Accept: 'application/json' },
                signal: expect.any(AbortSignal),
            });
        }
    );

    it.each([
        ['OPTIONS', '/api/scout-news', 204],
        ['POST', '/api/scout-news', 405],
        ['GET', '/api/scout-news?url=https://example.com', 400],
    ])('handles %s %s without fetching upstream', async (method, path, status) => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const response = await handler(
            new Request(`https://pass.scout.org${path}`, {
                method,
                headers: { 'Access-Control-Request-Headers': 'sentry-trace,baggage' },
            })
        );
        expect(response.status).toBe(status);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Access-Control-Allow-Headers')).toContain('sentry-trace');
        expect(response.headers.get('Access-Control-Allow-Headers')).toContain('baggage');
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        new Response('unavailable', { status: 503 }),
        new Response('<html>upstream failure</html>'),
        new Response(JSON.stringify({ contents: '{}' })),
    ])(
        'returns an uncached CORS error for failed or malformed upstream responses',
        async upstream => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream));
            const response = await handler(new Request('https://pass.scout.org/api/scout-news'));
            expect(response.status).toBe(502);
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
            expect(response.headers.get('Cache-Control')).toBe('no-store');
            expect(response.headers.has('Netlify-CDN-Cache-Control')).toBe(false);
        }
    );

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
        const pending = handler(new Request('https://pass.scout.org/api/scout-news'));
        await vi.advanceTimersByTimeAsync(8_000);
        expect((await pending).status).toBe(504);
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
        undefined,
        null,
        {},
        { pages: '35', current_page: 0 },
        { pages: 35, current_page: '0' },
        { pages: Infinity, current_page: 0 },
    ])('does not cache an upstream response with invalid pager %j', async pager => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...news, pager })))
        );
        const response = await handler(new Request('https://pass.scout.org/api/scout-news'));
        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Invalid Scout news response' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.has('Netlify-CDN-Cache-Control')).toBe(false);
    });
});
