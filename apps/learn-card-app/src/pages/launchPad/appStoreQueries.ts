import { queryOptions } from '@tanstack/react-query';
import { getAnonymousNetworkClient } from 'learn-card-base/helpers/anonymousNetworkClient';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type {
    AppStoreListing,
    PaginatedAppStoreListings,
    PaginatedInstalledApps,
    PromotionLevel,
} from '@learncard/types';

/**
 * App store queries, shared by the hooks in useAppStore and by route clientLoaders, which prefetch
 * them into the app's query cache before the page renders (same keys, so the page reads that data).
 *
 * Listings, install counts and browsing are public network routes, so they use an anonymous client
 * instead of a wallet: a signed-out visitor no longer waits on a fallback wallet, and a signed-in one
 * doesn't wait on wallet start-up.
 */

const publicAppStore = () => getAnonymousNetworkClient().appStore;

type BrowseOptions = {
    category?: string;
    limit?: number;
    cursor?: string;
    promotionLevel?: PromotionLevel;
};

const FIVE_MINUTES = 1000 * 60 * 5;

export const browseAppStoreQuery = (options?: BrowseOptions) =>
    queryOptions({
        queryKey: [
            'appStore',
            'browse',
            options?.category,
            options?.promotionLevel,
            options?.limit,
            options?.cursor,
        ],
        queryFn: (): Promise<PaginatedAppStoreListings> =>
            publicAppStore().browseListedApps.query({
                category: options?.category,
                promotionLevel: options?.promotionLevel,
                limit: options?.limit ?? 50,
                cursor: options?.cursor,
            }),
        staleTime: FIVE_MINUTES,
    });

/** FEATURED_CAROUSEL apps; a category scopes the carousel to that category tab. */
export const featuredCarouselQuery = (category?: string) =>
    queryOptions({
        queryKey: ['appStore', 'featuredCarousel', category ?? null],
        queryFn: async (): Promise<AppStoreListing[]> => {
            const result = await publicAppStore().browseListedApps.query({
                promotionLevel: 'FEATURED_CAROUSEL',
                category,
                limit: 10,
            });
            return result.records;
        },
        staleTime: FIVE_MINUTES,
    });

export const curatedListQuery = () =>
    queryOptions({
        queryKey: ['appStore', 'curatedList'],
        queryFn: async (): Promise<AppStoreListing[]> => {
            const result = await publicAppStore().browseListedApps.query({
                promotionLevel: 'CURATED_LIST',
                limit: 20,
            });
            return result.records;
        },
        staleTime: FIVE_MINUTES,
    });

export const publicListingQuery = (listingId: string) =>
    queryOptions({
        queryKey: ['appStore', 'publicListing', listingId],
        queryFn: async (): Promise<AppStoreListing | null> =>
            (await publicAppStore().getPublicListing.query({ listingId })) ?? null,
        enabled: !!listingId,
    });

export const installCountQuery = (listingId: string) =>
    queryOptions({
        queryKey: ['appStore', 'installCount', listingId],
        queryFn: (): Promise<number> =>
            publicAppStore().getListingInstallCount.query({ listingId }),
        enabled: !!listingId,
    });

/** The signed-in user's installed apps; needs their wallet. */
export const installedAppsQuery = (
    getWallet: () => Promise<BespokeLearnCard>,
    options?: { limit?: number; cursor?: string }
) =>
    queryOptions({
        queryKey: ['appStore', 'installed', options?.limit, options?.cursor],
        queryFn: async (): Promise<PaginatedInstalledApps> => {
            const wallet = await getWallet();
            return wallet.invoke.getInstalledApps({
                limit: options?.limit ?? 50,
                cursor: options?.cursor,
            });
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        // A reload can restore the pre-install persisted snapshot before its throttled
        // write completes. Revalidate on mount instead of trusting that snapshot's age.
        refetchOnMount: 'always',
    });
