import { walletStore } from 'learn-card-base/stores/walletStore';

import { appQueryClient } from '../appQueryClient';
import {
    curatedListQuery,
    featuredCarouselQuery,
    installCountQuery,
    installedAppsQuery,
    publicListingQuery,
} from '../pages/launchPad/appStoreQueries';
import type { RouteDataPrefetch } from './pageLoader';
import type { PageKey } from './pages';

/*
 * Route data prefetches: each starts the queries its page reads first, with the page's own query
 * options, so the page finds them in the cache (or in flight) when it renders.
 */

/** /launchpad: the My Apps grid (useMoreApps). Installed apps need the wallet, ready in-app. */
const prefetchMyApps: RouteDataPrefetch = () => {
    const wallet = walletStore.get.wallet();
    if (wallet) {
        void appQueryClient.prefetchQuery(installedAppsQuery(async () => wallet, { limit: 50 }));
    }
    void appQueryClient.prefetchQuery(featuredCarouselQuery());
    void appQueryClient.prefetchQuery(curatedListQuery());
};

/** /app/:listingId: the listing and its install count. Public, so it also runs on a first load. */
const prefetchAppListing: RouteDataPrefetch = ({ params }) => {
    const { listingId } = params;
    if (!listingId) return;
    void appQueryClient.prefetchQuery(publicListingQuery(listingId));
    void appQueryClient.prefetchQuery(installCountQuery(listingId));
};

/**
 * The pages whose route modules prefetch data (src/routes/pages/<page>.tsx passes it to its
 * clientLoader). Prefetched data lands in the persisted query cache, so per-recipient pages
 * (share links, shared boosts and resumes: routing/prerender.ts) must never be listed here.
 */
export const ROUTE_DATA = {
    myApps: prefetchMyApps,
    appListing: prefetchAppListing,
} satisfies Partial<Record<PageKey, RouteDataPrefetch>>;
