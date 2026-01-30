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
import { isAppDidWeb } from '@learncard/helpers';
import { getAppDidFromSlug } from './utils/appDid';

// Type for integration signing authority info
export type IntegrationSigningAuthorityInfo = {
    endpoint: string;
    name: string;
    did: string;
    isPrimary: boolean;
};

export const useDeveloperPortal = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const APP_SIGNING_AUTHORITY_PREFIX = 'app-';
    const MAX_SIGNING_AUTHORITY_NAME_LENGTH = 15;

    const buildAppSigningAuthorityName = (slug: string): string => {
        const normalized = slug.replace(/[^a-z0-9-]/g, '');
        const trimmed = normalized.slice(
            0,
            MAX_SIGNING_AUTHORITY_NAME_LENGTH - APP_SIGNING_AUTHORITY_PREFIX.length
        );
        const base = trimmed || 'app';

        return `${APP_SIGNING_AUTHORITY_PREFIX}${base}`.slice(0, MAX_SIGNING_AUTHORITY_NAME_LENGTH);
    };

    const buildFallbackSigningAuthorityName = (baseName: string): string => {
        const suffix = `-${Math.floor(Math.random() * 1000)}`;
        const trimmed = baseName.slice(0, MAX_SIGNING_AUTHORITY_NAME_LENGTH - suffix.length);
        const base = trimmed || 'app';

        return `${base}${suffix}`.slice(0, MAX_SIGNING_AUTHORITY_NAME_LENGTH);
    };

    const ensureAppSigningAuthority = async (
        listingId: string,
        integrationId: string
    ): Promise<void> => {
        const wallet = await initWallet();
        const listing = await wallet.invoke.getAppStoreListing(listingId);

        if (!listing?.slug) return;

        const appDid = getAppDidFromSlug(listing.slug);
        const baseName = buildAppSigningAuthorityName(listing.slug);

        const createAuthority = async (name: string) => {
            try {
                return await wallet.invoke.createSigningAuthority(name, appDid);
            } catch (error) {
                console.warn('Failed to create app signing authority', error);
                // Re-throw error for critical failures that would prevent credential issuance
                if (
                    error instanceof Error &&
                    (error.message.includes('unauthorized') ||
                        error.message.includes('forbidden') ||
                        error.message.includes('authentication'))
                ) {
                    throw error;
                }
                return null;
            }
        };

        const authority =
            (await createAuthority(baseName)) ??
            (await createAuthority(buildFallbackSigningAuthorityName(baseName)));

        if (!authority?.endpoint || !authority?.name || !authority?.did) {
            console.error(
                'Failed to create signing authority for app. Credential issuance will fail.'
            );
            throw new Error(
                'Unable to create app signing authority - required for credential issuance'
            );
        }

        try {
            await wallet.invoke.registerSigningAuthority(
                authority.endpoint,
                authority.name,
                authority.did
            );

            await wallet.invoke.associateIntegrationWithSigningAuthority(
                integrationId,
                authority.endpoint,
                authority.name,
                authority.did,
                true
            );
        } catch (error) {
            console.error('Failed to register app signing authority', error);
            // Registration/association failures are critical - they prevent credential issuance
            throw new Error(
                'Failed to register app signing authority - credential issuance will not work'
            );
        }
    };

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
                queryClient.invalidateQueries({
                    queryKey: ['developer', 'integration', variables.id],
                });
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

    // Query for integration's signing authority
    const useIntegrationSigningAuthority = (integrationId: string | null) => {
        return useQuery({
            queryKey: ['developer', 'integration-sa', integrationId],
            queryFn: async (): Promise<IntegrationSigningAuthorityInfo | null> => {
                if (!integrationId) return null;

                const wallet = await initWallet();

                try {
                    const sa = await wallet.invoke.getIntegrationSigningAuthority(integrationId);
                    return sa ?? null;
                } catch {
                    return null;
                }
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

                const listingId = await wallet.invoke.createAppStoreListing(
                    integrationId,
                    listing as AppStoreListingCreateType
                );

                await ensureAppSigningAuthority(listingId, integrationId);

                return listingId;
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
                integrationId,
            }: {
                listingId: string;
                updates: AppStoreListingUpdateType | Record<string, unknown>;
                integrationId?: string;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                const result = await wallet.invoke.updateAppStoreListing(
                    listingId,
                    updates as AppStoreListingUpdateType
                );

                if (integrationId) {
                    await ensureAppSigningAuthority(listingId, integrationId);
                }

                return result;
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

    // ========== App DID Upgrade Hooks ==========

    // Mutation to upgrade a legacy app to use app DIDs
    const useUpgradeAppToAppDid = () => {
        return useMutation({
            mutationFn: async ({
                listingId,
                integrationId,
            }: {
                listingId: string;
                integrationId: string;
            }): Promise<boolean> => {
                const wallet = await initWallet();

                // Step 1: Get current listing
                const listing = await wallet.invoke.getAppStoreListing(listingId);
                if (!listing) {
                    throw new Error('Listing not found');
                }

                // Step 2: If listing has no slug, trigger slug generation by updating with current name
                // The backend auto-generates a slug when updating a listing that doesn't have one
                if (!listing.slug) {
                    await wallet.invoke.updateAppStoreListing(listingId, {
                        display_name: listing.display_name,
                    });
                }

                // Step 3: Use ensureAppSigningAuthority to create and associate app-specific SA
                await ensureAppSigningAuthority(listingId, integrationId);

                return true;
            },
            onSuccess: () => {
                // Invalidate all relevant queries to refresh data
                queryClient.invalidateQueries({ queryKey: ['developer', 'listings'] });
                queryClient.invalidateQueries({ queryKey: ['developer', 'listing'] });
                queryClient.invalidateQueries({ queryKey: ['developer', 'integration-sa'] });
            },
        });
    };

    // Helper to check if an app needs upgrading to app DIDs
    const checkAppNeedsUpgrade = (
        listing: AppStoreListing | null | undefined,
        signingAuthority: IntegrationSigningAuthorityInfo | null | undefined
    ): boolean => {
        if (!listing) return false;

        // Case 1: No slug means legacy app
        if (!listing.slug) return true;

        // Case 2: Has slug but signing authority is not an app DID
        if (signingAuthority?.did && !isAppDidWeb(signingAuthority.did)) {
            return true;
        }

        return false;
    };

    return {
        // Integration hooks
        useIntegrations,
        useIntegration,
        useIntegrationSigningAuthority,
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

        // App DID upgrade
        useUpgradeAppToAppDid,
        checkAppNeedsUpgrade,
    };
};

export default useDeveloperPortal;
