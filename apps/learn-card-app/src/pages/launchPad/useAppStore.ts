import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import type { AppStoreListing, InstalledApp, PaginatedAppStoreListings, PaginatedInstalledApps } from '@learncard/types';

export type AppStoreCategory = 'All' | 'AI' | 'Learning' | 'Games' | 'Integrations';

export const APP_STORE_CATEGORIES: AppStoreCategory[] = ['All', 'AI', 'Learning', 'Games', 'Integrations'];

// Map LaunchPad tab categories to app store categories
export const mapTabToCategory = (tab: string): string | undefined => {
    const mapping: Record<string, string | undefined> = {
        'All': undefined,
        'AI': 'ai',
        'Learning': 'learning',
        'Games': 'games',
        'Integrations': 'integrations',
    };

    return mapping[tab];
};

export const useAppStore = () => {
    const { initWallet, getWalletOrFallback } = useWallet();
    const queryClient = useQueryClient();

    // Query for browsing public app store listings
    const useBrowseAppStore = (options?: {
        category?: string;
        limit?: number;
        cursor?: string;
        promotionLevel?: string;
    }) => {
        return useQuery({
            queryKey: ['appStore', 'browse', options?.category, options?.promotionLevel, options?.limit, options?.cursor],
            queryFn: async (): Promise<PaginatedAppStoreListings> => {
                const wallet = await getWalletOrFallback();

                return wallet.invoke.browseAppStore({
                    category: options?.category,
                    promotionLevel: options?.promotionLevel,
                    limit: options?.limit ?? 50,
                    cursor: options?.cursor,
                });

            },
            staleTime: 1000 * 60 * 0.1, // 5 minutes
        });
    };

    // Query for featured carousel apps (FEATURED_CAROUSEL promotion level)
    const useFeaturedCarouselApps = () => {
        return useQuery({
            queryKey: ['appStore', 'featuredCarousel'],
            queryFn: async (): Promise<AppStoreListing[]> => {
                const wallet = await getWalletOrFallback();

                const result = await wallet.invoke.browseAppStore({
                    promotionLevel: 'FEATURED_CAROUSEL',
                    limit: 10,
                });

                return result.records;
            },
            staleTime: 1000 * 60 * 0.1, // 5 minutes
        });
    };

    // Query for curated list apps (CURATED_LIST promotion level)
    const useCuratedListApps = () => {
        return useQuery({
            queryKey: ['appStore', 'curatedList'],
            queryFn: async (): Promise<AppStoreListing[]> => {
                const wallet = await getWalletOrFallback();

                const result = await wallet.invoke.browseAppStore({
                    promotionLevel: 'CURATED_LIST',
                    limit: 20,
                });

                return result.records;
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
        });
    };

    // Query for user's installed apps
    const useInstalledApps = (options?: { limit?: number; cursor?: string }) => {
        return useQuery({
            queryKey: ['appStore', 'installed', options?.limit, options?.cursor],
            queryFn: async (): Promise<PaginatedInstalledApps> => {
                const wallet = await initWallet();

                return wallet.invoke.getInstalledApps({
                    limit: options?.limit ?? 50,
                    cursor: options?.cursor,
                });
            },
            staleTime: 1000 * 60 * 2, // 2 minutes
        });
    };

    // Query for checking if an app is installed
    const useIsAppInstalled = (listingId: string) => {
        return useQuery({
            queryKey: ['appStore', 'isInstalled', listingId],
            queryFn: async (): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.isAppInstalled(listingId);
            },
            enabled: !!listingId,
        });
    };

    // Query for getting a single public listing
    const usePublicListing = (listingId: string) => {
        return useQuery({
            queryKey: ['appStore', 'publicListing', listingId],
            queryFn: async (): Promise<AppStoreListing | null> => {
                const wallet = await getWalletOrFallback();
                const listing = await wallet.invoke.getPublicAppStoreListing(listingId);
                return listing ?? null;
            },
            enabled: !!listingId,
        });
    };

    // Query for getting install count
    const useInstallCount = (listingId: string) => {
        return useQuery({
            queryKey: ['appStore', 'installCount', listingId],
            queryFn: async (): Promise<number> => {
                const wallet = await getWalletOrFallback();

                return wallet.invoke.getAppStoreListingInstallCount(listingId);
            },
            enabled: !!listingId,
        });
    };

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
                queryClient.invalidateQueries({ queryKey: ['appStore', 'installCount', listingId] });
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
                queryClient.invalidateQueries({ queryKey: ['appStore', 'installCount', listingId] });
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
