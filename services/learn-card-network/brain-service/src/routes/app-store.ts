import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, openRoute, profileRoute } from '@routes';
import { isAppStoreAdmin } from 'src/constants/app-store';

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import {
    readAppStoreListingById,
    getListingsForIntegration,
    countListingsForIntegration,
    getListedApps,
    getInstalledAppsForProfile,
    countInstalledAppsForProfile,
    checkIfProfileInstalledApp,
} from '@accesslayer/app-store-listing/read';
import { updateAppStoreListing } from '@accesslayer/app-store-listing/update';
import { deleteAppStoreListing } from '@accesslayer/app-store-listing/delete';
import {
    associateListingWithIntegration,
    installAppForProfile,
} from '@accesslayer/app-store-listing/relationships/create';
import { uninstallAppForProfile } from '@accesslayer/app-store-listing/relationships/delete';
import {
    getIntegrationForListing,
    countProfilesInstalledApp,
} from '@accesslayer/app-store-listing/relationships/read';
import { readIntegrationById } from '@accesslayer/integration/read';
import { isIntegrationAssociatedWithProfile } from '@accesslayer/integration/relationships/read';
import {
    AppListingStatus,
    LaunchType,
    PromotionLevel,
    AppStoreListingValidator,
} from 'types/app-store-listing';

// Zod validators for API
const AppStoreListingInputValidator = z.object({
    display_name: z.string().min(1).max(100),
    tagline: z.string().min(1).max(200),
    full_description: z.string().min(1).max(5000),
    icon_url: z.string().url(),
    app_listing_status: AppListingStatus,
    launch_type: LaunchType,
    launch_config_json: z.string(),
    category: z.string().optional(),
    promo_video_url: z.string().url().optional(),
    promotion_level: PromotionLevel.optional(),
    ios_app_store_id: z.string().optional(),
    android_app_store_id: z.string().optional(),
    privacy_policy_url: z.string().url().optional(),
    terms_url: z.string().url().optional(),
    highlights: z.array(z.string()).optional(),
    screenshots: z.array(z.string().url()).optional(),
    hero_background_color: z.string().optional(),
});

// Helper to transform listing for API response (JSON strings -> arrays)
const transformListingForResponse = (listing: any) => {
    const result = { ...listing };

    if (result.highlights_json) {
        try {
            result.highlights = JSON.parse(result.highlights_json);
        } catch {
            result.highlights = [];
        }
        delete result.highlights_json;
    }

    if (result.screenshots_json) {
        try {
            result.screenshots = JSON.parse(result.screenshots_json);
        } catch {
            result.screenshots = [];
        }
        delete result.screenshots_json;
    }

    return result;
};

// Helper to transform input for storage (arrays -> JSON strings)
const transformInputForStorage = (input: any) => {
    const result = { ...input };

    if (result.highlights !== undefined) {
        result.highlights_json = JSON.stringify(result.highlights);
        delete result.highlights;
    }

    if (result.screenshots !== undefined) {
        result.screenshots_json = JSON.stringify(result.screenshots);
        delete result.screenshots;
    }

    return result;
};

// Regular update validator - excludes admin-only fields
const AppStoreListingUpdateInputValidator = AppStoreListingInputValidator.partial().omit({
    app_listing_status: true,
    promotion_level: true,
});

// Create validator - new listings start as DRAFT, no promotion level
const AppStoreListingCreateInputValidator = AppStoreListingInputValidator.omit({
    app_listing_status: true,
    promotion_level: true,
});

// Extended validator that includes the transformed array fields for API responses
const AppStoreListingResponseValidator = AppStoreListingValidator.extend({
    highlights: z.array(z.string()).optional(),
    screenshots: z.array(z.string()).optional(),
}).omit({
    highlights_json: true,
    screenshots_json: true,
});

const PaginatedAppStoreListingsValidator = z.object({
    hasMore: z.boolean(),
    cursor: z.string().optional(),
    records: z.array(AppStoreListingResponseValidator),
});

const InstalledAppValidator = AppStoreListingResponseValidator.extend({
    installed_at: z.string(),
});

const PaginatedInstalledAppsValidator = z.object({
    hasMore: z.boolean(),
    cursor: z.string().optional(),
    records: z.array(InstalledAppValidator),
});

// Helper to verify integration ownership
const verifyIntegrationOwnership = async (integrationId: string, profileId: string) => {
    const associated = await isIntegrationAssociatedWithProfile(integrationId, profileId);

    if (!associated) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This Integration is not associated with you!',
        });
    }

    const integration = await readIntegrationById(integrationId);

    if (!integration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
    }

    return integration;
};

// Helper to verify listing ownership via integration
const verifyListingOwnership = async (listingId: string, profileId: string) => {
    const listing = await readAppStoreListingById(listingId);

    if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'App Store Listing not found' });
    }

    const integration = await getIntegrationForListing(listingId);

    if (!integration) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Listing is not associated with any Integration',
        });
    }

    await verifyIntegrationOwnership(integration.id, profileId);

    return { listing, integration };
};

// Helper to verify app store admin privileges
const verifyAppStoreAdmin = (profileId: string) => {
    if (!isAppStoreAdmin(profileId)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only App Store administrators can perform this action',
        });
    }
};

// Helper to get listing without ownership check (for admin routes)
const getListingOrThrow = async (listingId: string) => {
    const listing = await readAppStoreListingById(listingId);

    if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'App Store Listing not found' });
    }

    return listing;
};

export const appStoreRouter = t.router({
    // ==================== Integration Owner Routes ====================

    createListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/listing/create',
                tags: ['App Store'],
                summary: 'Create App Store Listing',
                description: 'Create a new App Store Listing for your Integration',
            },
            requiredScope: 'app-store:write',
        })
        .input(
            z.object({
                integrationId: z.string(),
                listing: AppStoreListingCreateInputValidator,
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            await verifyIntegrationOwnership(input.integrationId, ctx.user.profile.profileId);

            // New listings always start as DRAFT with STANDARD promotion
            const storageData = transformInputForStorage({
                ...input.listing,
                app_listing_status: 'DRAFT',
                promotion_level: 'STANDARD',
            });

            const listing = await createAppStoreListing(storageData);

            await associateListingWithIntegration(listing.listing_id, input.integrationId);

            return listing.listing_id;
        }),

    getListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/app-store/listing/{listingId}',
                tags: ['App Store'],
                summary: 'Get App Store Listing (Owner)',
                description: 'Get an App Store Listing by id (for integration owners)',
            },
            requiredScope: 'app-store:read',
        })
        .input(z.object({ listingId: z.string() }))
        .output(AppStoreListingResponseValidator.optional())
        .query(async ({ input, ctx }) => {
            const { listing } = await verifyListingOwnership(
                input.listingId,
                ctx.user.profile.profileId
            );

            return transformListingForResponse(listing);
        }),

    getListingsForIntegration: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/integration/{integrationId}/listings',
                tags: ['App Store'],
                summary: 'Get Listings for Integration',
                description: 'Get all App Store Listings for your Integration',
            },
            requiredScope: 'app-store:read',
        })
        .input(
            z.object({
                integrationId: z.string(),
                limit: z.number().optional(),
                cursor: z.string().optional(),
            })
        )
        .output(PaginatedAppStoreListingsValidator)
        .query(async ({ input, ctx }) => {
            await verifyIntegrationOwnership(input.integrationId, ctx.user.profile.profileId);

            const limit = input.limit ?? 25;
            const results = await getListingsForIntegration(input.integrationId, {
                limit: limit + 1,
                cursor: input.cursor,
            });

            const hasMore = results.length > limit;
            const rawRecords = hasMore ? results.slice(0, limit) : results;
            const records = rawRecords.map(transformListingForResponse);
            const cursor = hasMore ? rawRecords[rawRecords.length - 1]?.listing_id : undefined;

            return { hasMore, cursor, records };
        }),

    countListingsForIntegration: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/app-store/integration/{integrationId}/listings/count',
                tags: ['App Store'],
                summary: 'Count Listings for Integration',
                description: 'Count App Store Listings for your Integration',
            },
            requiredScope: 'app-store:read',
        })
        .input(z.object({ integrationId: z.string() }))
        .output(z.number())
        .query(async ({ input, ctx }) => {
            await verifyIntegrationOwnership(input.integrationId, ctx.user.profile.profileId);

            return countListingsForIntegration(input.integrationId);
        }),

    updateListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/listing/{listingId}/update',
                tags: ['App Store'],
                summary: 'Update App Store Listing',
                description: 'Update an App Store Listing',
            },
            requiredScope: 'app-store:write',
        })
        .input(
            z.object({
                listingId: z.string(),
                updates: AppStoreListingUpdateInputValidator,
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { listing } = await verifyListingOwnership(
                input.listingId,
                ctx.user.profile.profileId
            );

            console.log("Listing", input.updates);
            const storageUpdates = transformInputForStorage(input.updates);

            return updateAppStoreListing(listing, storageUpdates);
        }),

    submitForReview: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/listing/{listingId}/submit-for-review',
                tags: ['App Store'],
                summary: 'Submit Listing for Review',
                description: 'Submit a DRAFT listing for admin review',
            },
            requiredScope: 'app-store:write',
        })
        .input(z.object({ listingId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { listing } = await verifyListingOwnership(
                input.listingId,
                ctx.user.profile.profileId
            );

            // Only DRAFT listings can be submitted for review
            if (listing.app_listing_status !== 'DRAFT') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Cannot submit listing with status "${listing.app_listing_status}" for review. Only DRAFT listings can be submitted.`,
                });
            }

            return updateAppStoreListing(listing, { app_listing_status: 'PENDING_REVIEW' });
        }),

    deleteListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/app-store/listing/{listingId}',
                tags: ['App Store'],
                summary: 'Delete App Store Listing',
                description: 'Delete an App Store Listing',
            },
            requiredScope: 'app-store:delete',
        })
        .input(z.object({ listingId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            await verifyListingOwnership(input.listingId, ctx.user.profile.profileId);

            await deleteAppStoreListing(input.listingId);

            return true;
        }),

    // ==================== Public Browse Routes ====================

    browseListedApps: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'POST',
                path: '/app-store/browse',
                tags: ['App Store'],
                summary: 'Browse App Store',
                description: 'Browse all publicly listed apps in the App Store',
            },
        })
        .input(
            z
                .object({
                    limit: z.number().optional(),
                    cursor: z.string().optional(),
                    category: z.string().optional(),
                    promotionLevel: PromotionLevel.optional(),
                })
                .optional()
        )
        .output(PaginatedAppStoreListingsValidator)
        .query(async ({ input }) => {
            const limit = input?.limit ?? 25;
            const results = await getListedApps({
                limit: limit + 1,
                cursor: input?.cursor,
                category: input?.category,
                promotionLevel: input?.promotionLevel,
            });

            const hasMore = results.length > limit;
            const rawRecords = hasMore ? results.slice(0, limit) : results;
            const records = rawRecords.map(transformListingForResponse);
            const cursor = hasMore ? rawRecords[rawRecords.length - 1]?.listing_id : undefined;

            return { hasMore, cursor, records };
        }),

    getPublicListing: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'GET',
                path: '/app-store/public/listing/{listingId}',
                tags: ['App Store'],
                summary: 'Get Public App Listing',
                description: 'Get a publicly listed app by id',
            },
        })
        .input(z.object({ listingId: z.string() }))
        .output(AppStoreListingResponseValidator.optional())
        .query(async ({ input }) => {
            const listing = await readAppStoreListingById(input.listingId);

            if (!listing || listing.app_listing_status !== 'LISTED') {
                return undefined;
            }

            return transformListingForResponse(listing);
        }),

    getListingInstallCount: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'GET',
                path: '/app-store/listing/{listingId}/install-count',
                tags: ['App Store'],
                summary: 'Get App Install Count',
                description: 'Get the number of users who have installed an app',
            },
        })
        .input(z.object({ listingId: z.string() }))
        .output(z.number())
        .query(async ({ input }) => {
            const listing = await readAppStoreListingById(input.listingId);

            if (!listing || listing.app_listing_status !== 'LISTED') {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }

            return countProfilesInstalledApp(input.listingId);
        }),

    // ==================== User Install/Uninstall Routes ====================

    installApp: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/listing/{listingId}/install',
                tags: ['App Store'],
                summary: 'Install App',
                description: 'Install an app from the App Store',
            },
            requiredScope: 'app-store:write',
        })
        .input(z.object({ listingId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const listing = await readAppStoreListingById(input.listingId);

            if (!listing || listing.app_listing_status !== 'LISTED') {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found or not available' });
            }

            const alreadyInstalled = await checkIfProfileInstalledApp(
                ctx.user.profile.profileId,
                input.listingId
            );

            if (alreadyInstalled) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'You have already installed this app',
                });
            }

            await installAppForProfile(ctx.user.profile.profileId, input.listingId);

            return true;
        }),

    uninstallApp: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/listing/{listingId}/uninstall',
                tags: ['App Store'],
                summary: 'Uninstall App',
                description: 'Uninstall an app from your profile',
            },
            requiredScope: 'app-store:write',
        })
        .input(z.object({ listingId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const isInstalled = await checkIfProfileInstalledApp(
                ctx.user.profile.profileId,
                input.listingId
            );

            if (!isInstalled) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'You have not installed this app',
                });
            }

            await uninstallAppForProfile(ctx.user.profile.profileId, input.listingId);

            return true;
        }),

    getInstalledApps: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/installed',
                tags: ['App Store'],
                summary: 'Get Installed Apps',
                description: 'Get all apps you have installed',
            },
            requiredScope: 'app-store:read',
        })
        .input(
            z
                .object({
                    limit: z.number().optional(),
                    cursor: z.string().optional(),
                })
                .optional()
        )
        .output(PaginatedInstalledAppsValidator)
        .query(async ({ input, ctx }) => {
            const limit = input?.limit ?? 25;
            const results = await getInstalledAppsForProfile(ctx.user.profile.profileId, {
                limit: limit + 1,
                cursor: input?.cursor,
            });

            const hasMore = results.length > limit;
            const rawRecords = hasMore ? results.slice(0, limit) : results;
            const records = rawRecords.map(transformListingForResponse);
            const cursor = hasMore ? rawRecords[rawRecords.length - 1]?.installed_at : undefined;

            return { hasMore, cursor, records };
        }),

    countInstalledApps: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/app-store/installed/count',
                tags: ['App Store'],
                summary: 'Count Installed Apps',
                description: 'Count all apps you have installed',
            },
            requiredScope: 'app-store:read',
        })
        .input(z.void())
        .output(z.number())
        .query(async ({ ctx }) => {
            return countInstalledAppsForProfile(ctx.user.profile.profileId);
        }),

    isAppInstalled: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/app-store/listing/{listingId}/is-installed',
                tags: ['App Store'],
                summary: 'Check if App is Installed',
                description: 'Check if you have installed a specific app',
            },
            requiredScope: 'app-store:read',
        })
        .input(z.object({ listingId: z.string() }))
        .output(z.boolean())
        .query(async ({ input, ctx }) => {
            return checkIfProfileInstalledApp(ctx.user.profile.profileId, input.listingId);
        }),

    // ==================== Admin Routes ====================

    adminUpdateListingStatus: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/admin/listing/{listingId}/status',
                tags: ['App Store Admin'],
                summary: 'Update Listing Status (Admin)',
                description: 'Update the status of an App Store Listing (admin only)',
            },
            requiredScope: 'app-store:admin',
        })
        .input(
            z.object({
                listingId: z.string(),
                status: AppListingStatus,
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            verifyAppStoreAdmin(ctx.user.profile.profileId);

            const listing = await getListingOrThrow(input.listingId);

            return updateAppStoreListing(listing, { app_listing_status: input.status });
        }),

    adminUpdatePromotionLevel: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/admin/listing/{listingId}/promotion',
                tags: ['App Store Admin'],
                summary: 'Update Promotion Level (Admin)',
                description: 'Update the promotion level of an App Store Listing (admin only)',
            },
            requiredScope: 'app-store:admin',
        })
        .input(
            z.object({
                listingId: z.string(),
                promotionLevel: PromotionLevel,
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            verifyAppStoreAdmin(ctx.user.profile.profileId);

            const listing = await getListingOrThrow(input.listingId);

            return updateAppStoreListing(listing, { promotion_level: input.promotionLevel });
        }),

    adminGetAllListings: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/admin/listings',
                tags: ['App Store Admin'],
                summary: 'Get All Listings (Admin)',
                description: 'Get all App Store Listings regardless of status (admin only)',
            },
            requiredScope: 'app-store:admin',
        })
        .input(
            z
                .object({
                    limit: z.number().optional(),
                    cursor: z.string().optional(),
                    status: AppListingStatus.optional(),
                })
                .optional()
        )
        .output(PaginatedAppStoreListingsValidator)
        .query(async ({ input, ctx }) => {
            verifyAppStoreAdmin(ctx.user.profile.profileId);

            const limit = input?.limit ?? 25;

            // Get listings with optional status filter, or all statuses if not specified
            const results = await getListedApps({
                limit: limit + 1,
                cursor: input?.cursor,
                status: input?.status,
                includeAllStatuses: !input?.status, // Include all if no specific status filter
            });

            const hasMore = results.length > limit;
            const rawRecords = hasMore ? results.slice(0, limit) : results;
            const records = rawRecords.map(transformListingForResponse);
            const cursor = hasMore ? rawRecords[rawRecords.length - 1]?.listing_id : undefined;

            return { hasMore, cursor, records };
        }),

    isAdmin: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/app-store/admin/check',
                tags: ['App Store Admin'],
                summary: 'Check Admin Status',
                description: 'Check if the current user is an App Store administrator',
            },
            requiredScope: 'app-store:read',
        })
        .input(z.void())
        .output(z.boolean())
        .query(async ({ ctx }) => {
            return isAppStoreAdmin(ctx.user.profile.profileId);
        }),
});

export type AppStoreRouter = typeof appStoreRouter;
