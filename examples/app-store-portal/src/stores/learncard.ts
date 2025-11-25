import { create } from 'zustand';
import { initLearnCard } from '@learncard/init';
import type {
    AppStoreListing,
    AppStoreListingCreateType,
    AppStoreListingUpdateType,
    LCNIntegration,
    AppListingStatus,
    PromotionLevel,
} from '@learncard/types';

// Environment variables (in real app, these come from env)
const USER_SEED = import.meta.env.PUBLIC_USER_SEED || '';
const NETWORK_URL = import.meta.env.PUBLIC_NETWORK_URL || 'http://localhost:4000/trpc';

type LearnCardInstance = Awaited<ReturnType<typeof initLearnCard>>;

interface LearnCardState {
    // LearnCard instance
    learnCard: LearnCardInstance | null;
    isInitializing: boolean;
    initError: string | null;

    // User state
    isAdmin: boolean;
    profileId: string | null;

    // Integrations (for partner mode)
    integrations: LCNIntegration[];
    selectedIntegrationId: string | null;
    isLoadingIntegrations: boolean;

    // Listings
    listings: AppStoreListing[];
    isLoadingListings: boolean;

    // Actions
    initialize: (seed?: string, networkUrl?: string) => Promise<void>;
    disconnect: () => void;

    // Integration actions
    loadIntegrations: () => Promise<void>;
    selectIntegration: (id: string | null) => void;
    createIntegration: (name: string) => Promise<string | null>;

    // Listing actions (Partner)
    loadListingsForIntegration: (integrationId: string) => Promise<void>;
    createListing: (integrationId: string, listing: AppStoreListingCreateType) => Promise<string | null>;
    updateListing: (listingId: string, updates: AppStoreListingUpdateType) => Promise<boolean>;
    deleteListing: (listingId: string) => Promise<boolean>;
    submitForReview: (listingId: string) => Promise<boolean>;

    // Admin actions
    loadAllListings: (status?: AppListingStatus) => Promise<void>;
    adminUpdateStatus: (listingId: string, status: AppListingStatus) => Promise<boolean>;
    adminUpdatePromotion: (listingId: string, level: PromotionLevel) => Promise<boolean>;
}

export const useLearnCardStore = create<LearnCardState>((set, get) => ({
    // Initial state
    learnCard: null,
    isInitializing: false,
    initError: null,
    isAdmin: false,
    profileId: null,
    integrations: [],
    selectedIntegrationId: null,
    isLoadingIntegrations: false,
    listings: [],
    isLoadingListings: false,

    // Initialize LearnCard
    initialize: async (seed?: string, networkUrl?: string) => {
        const effectiveSeed = seed || USER_SEED;
        const effectiveNetwork = networkUrl || NETWORK_URL;

        if (!effectiveSeed) {
            set({ initError: 'No seed provided. Set PUBLIC_USER_SEED environment variable.' });
            return;
        }

        set({ isInitializing: true, initError: null });

        try {
            const learnCard = await initLearnCard({
                seed: effectiveSeed,
                network: effectiveNetwork,
            });

            // Check if user is admin
            let isAdmin = false;
            try {
                isAdmin = await learnCard.invoke.isAppStoreAdmin();
            } catch {
                // Not admin or endpoint doesn't exist yet
            }

            // Get profile ID
            let profileId: string | null = null;
            try {
                const profile = await learnCard.invoke.getProfile();
                profileId = profile?.profileId ?? null;
            } catch {
                // Profile might not exist yet
            }

            set({
                learnCard,
                isAdmin,
                profileId,
                isInitializing: false,
            });
        } catch (error) {
            set({
                initError: error instanceof Error ? error.message : 'Failed to initialize LearnCard',
                isInitializing: false,
            });
        }
    },

    disconnect: () => {
        set({
            learnCard: null,
            isAdmin: false,
            profileId: null,
            integrations: [],
            selectedIntegrationId: null,
            listings: [],
        });
    },

    // Load integrations for current user
    loadIntegrations: async () => {
        const { learnCard } = get();
        if (!learnCard) return;

        set({ isLoadingIntegrations: true });

        try {
            const result = await learnCard.invoke.getIntegrations({ limit: 100 });
            set({ integrations: result.records, isLoadingIntegrations: false });
        } catch (error) {
            console.error('Failed to load integrations:', error);
            set({ isLoadingIntegrations: false });
        }
    },

    selectIntegration: (id) => {
        set({ selectedIntegrationId: id });
    },

    createIntegration: async (name) => {
        const { learnCard } = get();
        if (!learnCard) return null;

        try {
            const id = await learnCard.invoke.addIntegration({ name });
            await get().loadIntegrations();
            return id;
        } catch (error) {
            console.error('Failed to create integration:', error);
            return null;
        }
    },

    // Load listings for a specific integration
    loadListingsForIntegration: async (integrationId) => {
        const { learnCard } = get();
        if (!learnCard) return;

        set({ isLoadingListings: true });

        try {
            const result = await learnCard.invoke.getListingsForIntegration(integrationId, {
                limit: 100,
            });
            set({ listings: result.records, isLoadingListings: false });
        } catch (error) {
            console.error('Failed to load listings:', error);
            set({ listings: [], isLoadingListings: false });
        }
    },

    createListing: async (integrationId, listing) => {
        const { learnCard } = get();
        if (!learnCard) return null;

        try {
            const listingId = await learnCard.invoke.createAppStoreListing(integrationId, listing);

            // Refresh listings
            await get().loadListingsForIntegration(integrationId);

            return listingId;
        } catch (error) {
            console.error('Failed to create listing:', error);
            return null;
        }
    },

    updateListing: async (listingId, updates) => {
        const { learnCard, selectedIntegrationId } = get();
        if (!learnCard) return false;

        try {
            const success = await learnCard.invoke.updateAppStoreListing(listingId, updates);

            if (success && selectedIntegrationId) {
                await get().loadListingsForIntegration(selectedIntegrationId);
            }

            return success;
        } catch (error) {
            console.error('Failed to update listing:', error);
            return false;
        }
    },

    deleteListing: async (listingId) => {
        const { learnCard, selectedIntegrationId } = get();
        if (!learnCard) return false;

        try {
            const success = await learnCard.invoke.deleteAppStoreListing(listingId);

            if (success && selectedIntegrationId) {
                await get().loadListingsForIntegration(selectedIntegrationId);
            }

            return success;
        } catch (error) {
            console.error('Failed to delete listing:', error);
            return false;
        }
    },

    submitForReview: async (listingId: string) => {
        const { learnCard, selectedIntegrationId } = get();
        if (!learnCard) return false;

        try {
            // Use dedicated submitForReview endpoint
            const success = await learnCard.invoke.submitAppStoreListingForReview(listingId);

            if (success && selectedIntegrationId) {
                await get().loadListingsForIntegration(selectedIntegrationId);
            }

            return success;
        } catch (error) {
            console.error('Failed to submit for review:', error);
            return false;
        }
    },

    // Admin: Load all listings
    loadAllListings: async (status) => {
        const { learnCard, isAdmin } = get();
        if (!learnCard || !isAdmin) return;

        set({ isLoadingListings: true });

        try {
            const result = await learnCard.invoke.adminGetAllListings({
                limit: 100,
                status,
            });
            set({ listings: result.records, isLoadingListings: false });
        } catch (error) {
            console.error('Failed to load all listings:', error);
            set({ listings: [], isLoadingListings: false });
        }
    },

    adminUpdateStatus: async (listingId, status) => {
        const { learnCard, isAdmin } = get();
        if (!learnCard || !isAdmin) return false;

        try {
            const success = await learnCard.invoke.adminUpdateListingStatus(listingId, status);

            if (success) {
                // Update local state
                set(state => ({
                    listings: state.listings.map(l =>
                        l.listing_id === listingId ? { ...l, app_listing_status: status } : l
                    ),
                }));
            }

            return success;
        } catch (error) {
            console.error('Failed to update listing status:', error);
            return false;
        }
    },

    adminUpdatePromotion: async (listingId, level) => {
        const { learnCard, isAdmin } = get();
        if (!learnCard || !isAdmin) return false;

        try {
            const success = await learnCard.invoke.adminUpdatePromotionLevel(listingId, level);

            if (success) {
                // Update local state
                set(state => ({
                    listings: state.listings.map(l =>
                        l.listing_id === listingId ? { ...l, promotion_level: level } : l
                    ),
                }));
            }

            return success;
        } catch (error) {
            console.error('Failed to update promotion level:', error);
            return false;
        }
    },
}));
