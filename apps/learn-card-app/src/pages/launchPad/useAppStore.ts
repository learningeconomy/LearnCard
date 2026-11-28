import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet } from 'learn-card-base';

import {
    browseAppStoreQuery,
    curatedListQuery,
    featuredCarouselQuery,
    installCountQuery,
    installedAppsQuery,
    publicListingQuery,
} from './appStoreQueries';

export type AppStoreCategory =
    | 'All'
    | 'AI'
    | 'Learning'
    | 'Games'
    | 'Tools'
    | 'Employment'
    | 'Credentials'
    | 'Plugins'
    | 'Other';

export const APP_STORE_CATEGORIES: AppStoreCategory[] = [
    'All',
    'AI',
    'Learning',
    'Games',
    'Tools',
    'Employment',
    'Credentials',
    'Plugins',
    'Other',
];

// Map LaunchPad tab categories to app store categories
export const mapTabToCategory = (tab: string): string | undefined => {
    if (tab === 'My Apps' || tab === 'All') return undefined;

    const mapping: Record<string, string> = {
        'AI': 'ai',
        'Learning': 'learning',
        'Games': 'games',
        'Tools': 'tools',
        'Employment': 'employment',
        'Credentials': 'credentials',
        'Plugins': 'plugin',
        'Other': 'other',
    };

    return mapping[tab];
};

export const useAppStore = () => {
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const queryClient = useQueryClient();

    // Public listings (browse, featured carousel, curated list) need no wallet: appStoreQueries.
    const useBrowseAppStore = (
        options?: Parameters<typeof browseAppStoreQuery>[0] & { enabled?: boolean }
    ) => {
        const { enabled = true, ...browse } = options ?? {};
        return useQuery({ ...browseAppStoreQuery(browse), enabled });
    };

    // Pass a category to scope the carousel to that category (e.g. on category tabs).
    // Omit category for cross-category carousel (My Apps / All tabs).
    const useFeaturedCarouselApps = (category?: string) =>
        useQuery(featuredCarouselQuery(category));

    const useCuratedListApps = () => useQuery(curatedListQuery());

    // Query for user's installed apps
    const useInstalledApps = (options?: { limit?: number; cursor?: string }) =>
        useQuery(installedAppsQuery(initWallet, options));

    // Query for checking if an app is installed
    const useIsAppInstalled = (listingId: string) => {
        return useQuery({
            queryKey: ['appStore', 'isInstalled', listingId],
            queryFn: async (): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.isAppInstalled(listingId);
            },
            // Signed-out visitors have no installs. The listing page renders before sign-in
            // settles, and starting the wallet here would race the auth coordinator's start-up.
            enabled: !!listingId && isLoggedIn,
        });
    };

    const usePublicListing = (listingId: string) => useQuery(publicListingQuery(listingId));

    const useInstallCount = (listingId: string) => useQuery(installCountQuery(listingId));

    // Mutation for installing an app
    const useInstallApp = () => {
        return useMutation({
            mutationFn: async (listingId: string): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.installApp(listingId);
            },
            onSuccess: (_, listingId) => {
                // Invalidate related queries
                queryClient.invalidateQueries({ queryKey: ['appStore', 'installed'] });
                queryClient.invalidateQueries({ queryKey: ['appStore', 'isInstalled', listingId] });
                queryClient.invalidateQueries({
                    queryKey: ['appStore', 'installCount', listingId],
                });
                queryClient.invalidateQueries({ queryKey: ['appStore', 'featuredCarousel'] });
                queryClient.invalidateQueries({ queryKey: ['appStore', 'curatedList'] });
            },
        });
    };

    // Mutation for uninstalling an app
    const useUninstallApp = () => {
        return useMutation({
            mutationFn: async (listingId: string): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.uninstallApp(listingId);
            },
            onSuccess: (_, listingId) => {
                // Invalidate related queries
                queryClient.invalidateQueries({ queryKey: ['appStore', 'installed'] });
                queryClient.invalidateQueries({ queryKey: ['appStore', 'isInstalled', listingId] });
                queryClient.invalidateQueries({
                    queryKey: ['appStore', 'installCount', listingId],
                });
                queryClient.invalidateQueries({ queryKey: ['appStore', 'featuredCarousel'] });
                queryClient.invalidateQueries({ queryKey: ['appStore', 'curatedList'] });
            },
        });
    };

    return {
        useBrowseAppStore,
        useFeaturedCarouselApps,
        useCuratedListApps,
        useInstalledApps,
        useIsAppInstalled,
        usePublicListing,
        useInstallCount,
        useInstallApp,
        useUninstallApp,
    };
};

export default useAppStore;
