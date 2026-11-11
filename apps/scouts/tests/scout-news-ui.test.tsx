// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScoutsNewsList } from '../src/components/scout-news/ScoutNews';
import fallback from '../src/components/scout-news/scoutnewsdefault.json';

const runtime = vi.hoisted(() => ({ native: false, domain: 'pass.scout.org' }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => runtime.native } }));
vi.mock('../src/config/bootstrapTenantConfig', () => ({
    getResolvedTenantConfig: () => ({ domain: runtime.domain }),
}));
vi.mock('../src/paraglide/messages.js', () => ({ 'scoutNews.viewPost': () => 'View post' }));
vi.mock('../src/i18n/formatters', () => ({ formatLocaleDate: () => 'October 11, 2026' }));
vi.mock('../src/helpers/externalLinkHelpers', () => ({ openExternalLink: vi.fn() }));
vi.mock('learn-card-base/svgs/ExternalLink', () => ({ default: () => null }));
vi.mock('learn-card-base/components/loaders/LoadingSpinner', () => ({
    LoadingSpinner: () => null,
}));

let client: QueryClient;
afterEach(() => {
    cleanup();
    client?.clear();
    vi.unstubAllGlobals();
});

const renderFeed = () => {
    client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
    render(
        <QueryClientProvider client={client}>
            <ScoutsNewsList />
        </QueryClientProvider>
    );
};

describe('Scout news feed', () => {
    it.each([
        [false, 'pass.scout.org', '/api/scout-news'],
        [false, 'staging.pass.scout.org', '/api/scout-news'],
        [true, 'pass.scout.org', 'https://pass.scout.org/api/scout-news'],
        [true, 'staging.pass.scout.org', 'https://staging.pass.scout.org/api/scout-news'],
    ])('renders live news for native=%s, domain=%s', async (native, domain, endpoint) => {
        runtime.native = native;
        runtime.domain = domain;
        const news = {
            ...fallback,
            data: [{ ...fallback.data[0], title: 'New &amp; live Scout news' }],
        };
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(news)));
        vi.stubGlobal('fetch', fetchMock);
        renderFeed();
        expect(await screen.findByText('New & live Scout news')).toBeTruthy();
        expect(fetchMock).toHaveBeenCalledWith(endpoint, { credentials: 'omit' });
    });

    it('keeps displaying bundled articles when the endpoint fails', async () => {
        runtime.native = false;
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        renderFeed();
        await vi.waitFor(() =>
            expect(client.getQueryState(['useFetchScoutNews', '/api/scout-news'])?.status).toBe(
                'error'
            )
        );
        expect(screen.getAllByTestId('scout-news-item-title')).toHaveLength(fallback.data.length);
    });
});
