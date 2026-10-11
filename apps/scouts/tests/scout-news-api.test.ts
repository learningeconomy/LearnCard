import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
    getScoutNewsEndpoint,
    scoutNewsQueryOptions,
} from '../src/components/scout-news/scoutNewsApi';
import fallback from '../src/components/scout-news/scoutnewsdefault.json';

afterEach(() => vi.unstubAllGlobals());

describe('Scout news client', () => {
    it.each(['pass.scout.org', 'staging.pass.scout.org'])(
        'uses the current web origin and the configured HTTPS native domain %s',
        domain => {
            expect(getScoutNewsEndpoint(false, domain)).toBe('/api/scout-news');
            expect(getScoutNewsEndpoint(true, domain)).toBe(`https://${domain}/api/scout-news`);
        }
    );

    it('parses direct JSON and reuses successful data during the five-minute stale time', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(fallback)));
        vi.stubGlobal('fetch', fetchMock);
        const client = new QueryClient();
        try {
            const options = scoutNewsQueryOptions('/api/scout-news');
            expect(await client.fetchQuery(options)).toEqual(fallback);
            expect(await client.fetchQuery(options)).toEqual(fallback);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith('/api/scout-news', { credentials: 'omit' });
        } finally {
            client.clear();
        }
    });

    it('fetches on the first mount even though bundled fallback data is present', async () => {
        const live = { ...fallback, data: [{ ...fallback.data[0], title: 'Fresh upstream news' }] };
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(live)));
        vi.stubGlobal('fetch', fetchMock);
        const client = new QueryClient();
        const observer = new QueryObserver(client, scoutNewsQueryOptions('/api/scout-news'));
        expect(observer.getCurrentResult().data).toEqual(fallback);
        const unsubscribe = observer.subscribe(() => {});
        try {
            await vi.waitFor(() => expect(observer.getCurrentResult().data).toEqual(live));
            expect(fetchMock).toHaveBeenCalledTimes(1);
        } finally {
            unsubscribe();
            client.clear();
        }
    });

    it.each([
        new Response('unavailable', { status: 502 }),
        new Response('<html>SPA fallback</html>'),
        new Response(JSON.stringify({ contents: JSON.stringify(fallback) })),
        new Response(JSON.stringify({ ...fallback, data: [{ title: 'Malformed news' }] })),
    ])('retains bundled fallback and exposes an error on unsuccessful fetches', async response => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockImplementation(() => Promise.resolve(response.clone()))
        );
        const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
        const options = scoutNewsQueryOptions('/api/scout-news');
        const observer = new QueryObserver(client, options);
        const unsubscribe = observer.subscribe(() => {});
        try {
            await vi.waitFor(() => expect(observer.getCurrentResult().isError).toBe(true));
            expect(observer.getCurrentResult().data).toEqual(fallback);
            expect(fetch).toHaveBeenCalledTimes(2);
        } finally {
            unsubscribe();
            client.clear();
        }
    });
});
