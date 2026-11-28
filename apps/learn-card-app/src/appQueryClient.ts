import { QueryClient } from '@tanstack/react-query';

export const QUERY_CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

/**
 * The signed-in app's query cache (FullApp provides it). It lives in its own module so route
 * clientLoaders can prefetch a page's data into it while the page's code is still loading,
 * including on the first load, before FullApp's chunk has arrived.
 */
export const appQueryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: QUERY_CACHE_TTL } },
});
