import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import type {
    AppStoreListing,
    AppStoreListingCreateType,
    AppStoreListingUpdateType,
    LCNIntegration,
    LCNIntegrationUpdateType,
    AppListingStatus,
    PromotionLevel,
} from '@learncard/types';

export const useDeveloperPortal = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    // ========== Integration Hooks ==========

    // Query for user's integrations
    const useIntegrations = () => {
        return useQuery({
            queryKey: ['developer', 'integrations'],
            queryFn: async (): Promise<LCNIntegration[]> => {
                const wallet = await initWallet();
                const result = await wallet.invoke.getIntegrations({ limit: 100 });

                return result.records;
            },
            staleTime: 1000 * 60 * 5,
        });
    };

    // Mutation for creating an integration
    const useCreateIntegration = () => {
        return useMutation({
            mutationFn: async (name: string): Promise<string> => {
                const wallet = await initWallet();

                return wallet.invoke.addIntegration({ name, whitelistedDomains: [] });
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['developer', 'integrations'] });
            },
        });
    };

    // Mutation for updating an integration
    const useUpdateIntegration = () => {
        return useMutation({
            mutationFn: async ({
                id,
                updates,
            }: {
                id: string;
                updates: LCNIntegrationUpdateType;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.updateIntegration(id, updates);
            },
            onSuccess: (_data, variables) => {
                // Invalidate both the list and the specific integration query
                queryClient.invalidateQueries({ queryKey: ['developer', 'integrations'] });
                queryClient.invalidateQueries({ queryKey: ['developer', 'integration', variables.id] });
            },
        });
    };

    // Query for a single integration
    const useIntegration = (integrationId: string | null) => {
        return useQuery({
            queryKey: ['developer', 'integration', integrationId],
            queryFn: async (): Promise<LCNIntegration | null> => {
                if (!integrationId) return null;

                const wallet = await initWallet();

                const integration = await wallet.invoke.getIntegration(integrationId);

                return integration ?? null;
            },
            enabled: !!integrationId,
            staleTime: 1000 * 60 * 2,
        });
    };

    // ========== Listing Hooks ==========

    // Query for listings belonging to an integration
    const useListingsForIntegration = (integrationId: string | null) => {
        return useQuery({
            queryKey: ['developer', 'listings', integrationId],
            queryFn: async (): Promise<AppStoreListing[]> => {
                if (!integrationId) return [];

                const wallet = await initWallet();
                const result = await wallet.invoke.getListingsForIntegration(integrationId, {
                    limit: 100,
                });

                return result.records;
            },
            enabled: !!integrationId,
            staleTime: 1000 * 60 * 2,
        });
    };

    // Query for a single listing
    const useListing = (listingId: string | null) => {
        return useQuery({
            queryKey: ['developer', 'listing', listingId],
            queryFn: async (): Promise<AppStoreListing | null> => {
                if (!listingId) return null;

                const wallet = await initWallet();
                const listing = await wallet.invoke.getPublicAppStoreListing(listingId);

                return listing ?? null;
            },
            enabled: !!listingId,
        });
    };

    // Mutation for creating a listing
    // Using 'any' for listing type since highlights/screenshots may not be in exported types yet
    const useCreateListing = () => {
        return useMutation({
            mutationFn: async ({
                integrationId,
                listing,
            }: {
                integrationId: string;
                listing: AppStoreListingCreateType | Record<string, unknown>;
            }): Promise<string> => {
                const wallet = await initWallet();

                return wallet.invoke.createAppStoreListing(
                    integrationId,
                    listing as AppStoreListingCreateType
                );
            },
            onSuccess: (_, { integrationId }) => {
                queryClient.invalidateQueries({
                    queryKey: ['developer', 'listings', integrationId],
                });
            },
        });
    };

    // Mutation for updating a listing
    // Using 'any' for updates type since highlights/screenshots may not be in exported types yet
    const useUpdateListing = () => {
        return useMutation({
            mutationFn: async ({
                listingId,
                updates,
            }: {
                listingId: string;
                updates: AppStoreListingUpdateType | Record<string, unknown>;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.updateAppStoreListing(
                    listingId,
                    updates as AppStoreListingUpdateType
                );
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['developer', 'listings'] });
                queryClient.invalidateQueries({ queryKey: ['developer', 'listing'] });
            },
        });
    };

    // Mutation for deleting a listing
    const useDeleteListing = () => {
        return useMutation({
            mutationFn: async (listingId: string): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.deleteAppStoreListing(listingId);
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['developer', 'listings'] });
            },
        });
    };

    // Mutation for submitting a listing for review
    const useSubmitForReview = () => {
        return useMutation({
            mutationFn: async (listingId: string): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.submitAppStoreListingForReview(listingId);
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['developer', 'listings'] });
                queryClient.invalidateQueries({ queryKey: ['developer', 'listing'] });
            },
        });
    };

    // ========== Admin Hooks ==========

    // Query for checking if user is admin
    const useIsAdmin = () => {
        return useQuery({
            queryKey: ['developer', 'isAdmin'],
            queryFn: async (): Promise<boolean> => {
                const wallet = await initWallet();

                try {
                    return await wallet.invoke.isAppStoreAdmin();
                } catch {
                    return false;
                }
            },
            staleTime: 1000 * 60 * 10,
        });
    };

    // Query for all listings (admin only)
    const useAdminListings = (status?: AppListingStatus) => {
        return useQuery({
            queryKey: ['admin', 'listings', status],
            queryFn: async (): Promise<AppStoreListing[]> => {
                const wallet = await initWallet();
                const result = await wallet.invoke.adminGetAllListings({
                    limit: 100,
                    status,
                });

                return result.records;
            },
            staleTime: 1000 * 60 * 2,
        });
    };

    // Mutation for updating listing status (admin)
    const useAdminUpdateStatus = () => {
        return useMutation({
            mutationFn: async ({
                listingId,
                status,
            }: {
                listingId: string;
                status: AppListingStatus;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.adminUpdateListingStatus(listingId, status);
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
            },
        });
    };

    // Mutation for updating promotion level (admin)
    const useAdminUpdatePromotion = () => {
        return useMutation({
            mutationFn: async ({
                listingId,
                level,
            }: {
                listingId: string;
                level: PromotionLevel;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                return wallet.invoke.adminUpdatePromotionLevel(listingId, level);
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
                queryClient.invalidateQueries({ queryKey: ['appStore'] });
            },
        });
    };

    // ========== Boost Management Hooks ==========

    // Query for boosts attached to a listing
    const useListingBoosts = (listingId: string | null) => {
        return useQuery({
            queryKey: ['developer', 'listing', listingId, 'boosts'],
            queryFn: async (): Promise<Array<{ boostId: string; boostUri: string }>> => {
                if (!listingId) return [];

                const wallet = await initWallet();

                // Use type assertion until types are rebuilt
                const invoke = wallet.invoke as typeof wallet.invoke & {
                    getAppBoosts?: (
                        listingId: string
                    ) => Promise<Array<{ boostId: string; boostUri: string }>>;
                };

                if (!invoke.getAppBoosts) return [];

                return invoke.getAppBoosts(listingId);
            },
            enabled: !!listingId,
        });
    };

    // Mutation for adding a boost to a listing
    const useAddBoostToListing = () => {
        return useMutation({
            mutationFn: async ({
                listingId,
                boostUri,
                boostId,
            }: {
                listingId: string;
                boostUri: string;
                boostId: string;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                // Use type assertion until types are rebuilt
                const invoke = wallet.invoke as typeof wallet.invoke & {
                    addBoostToApp?: (
                        listingId: string,
                        boostUri: string,
                        boostId: string
                    ) => Promise<boolean>;
                };

                if (!invoke.addBoostToApp)
                    throw new Error('addBoostToApp not available - rebuild types');

                return invoke.addBoostToApp(listingId, boostUri, boostId);
            },
            onSuccess: (_, { listingId }) => {
                queryClient.invalidateQueries({
                    queryKey: ['developer', 'listing', listingId, 'boosts'],
                });
            },
        });
    };

    // Mutation for removing a boost from a listing
    const useRemoveBoostFromListing = () => {
        return useMutation({
            mutationFn: async ({
                listingId,
                boostId,
            }: {
                listingId: string;
                boostId: string;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                // Use type assertion until types are rebuilt
                const invoke = wallet.invoke as typeof wallet.invoke & {
                    removeBoostFromApp?: (listingId: string, boostId: string) => Promise<boolean>;
                };

                if (!invoke.removeBoostFromApp)
                    throw new Error('removeBoostFromApp not available - rebuild types');

                return invoke.removeBoostFromApp(listingId, boostId);
            },
            onSuccess: (_, { listingId }) => {
                queryClient.invalidateQueries({
                    queryKey: ['developer', 'listing', listingId, 'boosts'],
                });
            },
        });
    };

    return {
        // Integration hooks
        useIntegrations,
        useIntegration,
        useCreateIntegration,
        useUpdateIntegration,

        // Listing hooks
        useListingsForIntegration,
        useListing,
        useCreateListing,
        useUpdateListing,
        useDeleteListing,
        useSubmitForReview,

        // Admin hooks
        useIsAdmin,
        useAdminListings,
        useAdminUpdateStatus,
        useAdminUpdatePromotion,

        // Boost management hooks
        useListingBoosts,
        useAddBoostToListing,
        useRemoveBoostFromListing,
    };
};

export default useDeveloperPortal;
