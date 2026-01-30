import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { LCNNotificationTypeEnumValidator, UnsignedVC } from '@learncard/types';
import { isVC2Format } from '@learncard/helpers';

import { t, openRoute, profileRoute } from '@routes';
import { isAppStoreAdmin, APP_STORE_ADMIN_PROFILE_IDS } from 'src/constants/app-store';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { logCredentialSent } from '@helpers/activity.helpers';
import { getAvailableAppSlug } from '@helpers/slug.helpers';
import { getProfilesByProfileIds } from '@accesslayer/profile/read';
import { getOwnerProfileForIntegration } from '@accesslayer/integration/relationships/read';

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import {
    readAppStoreListingById,
    readAppStoreListingBySlug,
    readAppStoreListingByIdOrSlug,
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
    associateBoostWithListing,
} from '@accesslayer/app-store-listing/relationships/create';
import {
    uninstallAppForProfile,
    removeBoostFromListing,
} from '@accesslayer/app-store-listing/relationships/delete';
import {
    getIntegrationForListing,
    countProfilesInstalledApp,
    hasProfileInstalledApp,
    getBoostForListingByTemplateAlias,
    getBoostsForListing,
    hasTemplateAliasForListing,
} from '@accesslayer/app-store-listing/relationships/read';
import { readIntegrationById } from '@accesslayer/integration/read';
import { isIntegrationAssociatedWithProfile } from '@accesslayer/integration/relationships/read';
import {
    getPrimarySigningAuthorityForIntegration,
    getPrimarySigningAuthorityForUser,
} from '@accesslayer/signing-authority/relationships/read';
import { associateIntegrationWithSigningAuthority } from '@accesslayer/integration/relationships/create';
import {
    AppListingStatus,
    LaunchType,
    PromotionLevel,
    AppStoreListingValidator,
} from 'types/app-store-listing';
import { getBoostByUri } from '@accesslayer/boost/read';
import { sendBoost, isDraftBoost } from '@helpers/boost.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { renderBoostTemplate, parseRenderedTemplate } from '@helpers/template.helpers';
import { getAppDidWeb, getDidWeb } from '@helpers/did.helpers';

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

// Allowed image hosting domains for security
const ALLOWED_IMAGE_DOMAINS = [
    'cdn.filestackcontent.com',
    'learncard.com',
    'amazonaws.com',
    's3.amazonaws.com',
    'cloudfront.net',
    'imgur.com',
    'i.imgur.com',
    'example.com', // Used in tests
];

// JSON validation helper
const isValidJson = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
};

// URL domain validation helper
const isAllowedImageUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return ALLOWED_IMAGE_DOMAINS.some(
            domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
    } catch {
        return false;
    }
};

// Validate iframe URL for XSS prevention
const isValidIframeUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        // Only allow https URLs for iframes
        if (parsed.protocol !== 'https:') return false;
        // Block javascript:, data:, and vbscript: schemes (already handled by URL parsing, but be explicit)
        const lowerUrl = url.toLowerCase();
        if (
            lowerUrl.startsWith('javascript:') ||
            lowerUrl.startsWith('data:') ||
            lowerUrl.startsWith('vbscript:')
        ) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

// Basic content filtering - check for suspicious patterns
const containsSuspiciousContent = (text: string): boolean => {
    const suspiciousPatterns = [
        /<script\b[^>]*>/i,
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /on\w+\s*=/i, // onclick=, onerror=, etc.
        /<iframe\b[^>]*>/i,
        /<object\b[^>]*>/i,
        /<embed\b[^>]*>/i,
    ];
    return suspiciousPatterns.some(pattern => pattern.test(text));
};

// Zod refinements for validation
const jsonStringValidator = z.string().refine(isValidJson, {
    message: 'Must be valid JSON',
});

const safeImageUrlValidator = z
    .string()
    .url()
    .refine(url => isAllowedImageUrl(url), { message: 'Image URL must be from an allowed domain' });

const safeContentValidator = z.string().refine(text => !containsSuspiciousContent(text), {
    message: 'Content contains potentially unsafe patterns',
});

// =============================================================================
// ZOD VALIDATORS FOR API
// =============================================================================

// Base schema without superRefine (so we can use .partial() and .omit())
const AppStoreListingBaseSchema = z.object({
    display_name: z
        .string()
        .min(1)
        .max(100)
        .refine(text => !containsSuspiciousContent(text), {
            message: 'Display name contains potentially unsafe patterns',
        }),
    tagline: z
        .string()
        .min(1)
        .max(200)
        .refine(text => !containsSuspiciousContent(text), {
            message: 'Tagline contains potentially unsafe patterns',
        }),
    full_description: safeContentValidator.pipe(z.string().min(1).max(5000)),
    icon_url: safeImageUrlValidator,
    app_listing_status: AppListingStatus,
    launch_type: LaunchType,
    launch_config_json: jsonStringValidator,
    category: z.string().max(50).optional(),
    promo_video_url: z.string().url().optional(),
    promotion_level: PromotionLevel.optional(),
    ios_app_store_id: z.string().max(20).optional(),
    android_app_store_id: z.string().max(100).optional(),
    privacy_policy_url: z.string().url().optional(),
    terms_url: z.string().url().optional(),
    highlights: z
        .array(
            z
                .string()
                .max(200)
                .refine(text => !containsSuspiciousContent(text), {
                    message: 'Highlight contains potentially unsafe patterns',
                })
        )
        .max(10)
        .optional(),
    screenshots: z.array(safeImageUrlValidator).max(10).optional(),
    hero_background_color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, {
            message: 'Must be a valid hex color (e.g., #FF5733)',
        })
        .optional(),
});

// Iframe URL validation refinement (applied to schemas that include launch_type)
const iframeUrlRefinement = (
    data: { launch_type?: string; launch_config_json?: string },
    ctx: z.RefinementCtx
) => {
    if (data.launch_type === 'EMBEDDED_IFRAME' && data.launch_config_json) {
        try {
            const config = JSON.parse(data.launch_config_json);

            if (config.iframeUrl && !isValidIframeUrl(config.iframeUrl)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Iframe URL must be a valid HTTPS URL',
                    path: ['launch_config_json'],
                });
            }
        } catch {
            // JSON parsing already validated above
        }
    }
};

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
// Validates that arrays are properly formatted before stringifying
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformInputForStorage = (input: any): any => {
    const result = { ...input };

    if (result.highlights !== undefined) {
        if (!Array.isArray(result.highlights)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'highlights must be an array of strings',
            });
        }

        // Validate each highlight is a string
        const validHighlights = result.highlights.every(
            (h: unknown): h is string => typeof h === 'string'
        );

        if (!validHighlights) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Each highlight must be a string',
            });
        }

        result.highlights_json = JSON.stringify(result.highlights);
        delete result.highlights;
    }

    if (result.screenshots !== undefined) {
        if (!Array.isArray(result.screenshots)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'screenshots must be an array of URLs',
            });
        }

        // Validate each screenshot is a valid URL string
        const validScreenshots = result.screenshots.every((s: unknown): s is string => {
            if (typeof s !== 'string') return false;

            try {
                new URL(s);
                return true;
            } catch {
                return false;
            }
        });

        if (!validScreenshots) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Each screenshot must be a valid URL',
            });
        }

        result.screenshots_json = JSON.stringify(result.screenshots);
        delete result.screenshots;
    }

    return result;
};

// Regular update validator - excludes admin-only fields, all fields optional
const AppStoreListingUpdateInputValidator = AppStoreListingBaseSchema.omit({
    app_listing_status: true,
    promotion_level: true,
})
    .partial()
    .superRefine(iframeUrlRefinement);

// Create validator - new listings start as DRAFT, no promotion level
const AppStoreListingCreateInputValidator = AppStoreListingBaseSchema.omit({
    app_listing_status: true,
    promotion_level: true,
}).superRefine(iframeUrlRefinement);

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

// Helper to handle send-credential app event
const handleSendCredentialEvent = async (
    ctx: { domain: string },
    profile: { profileId: string },
    listingId: string,
    event: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const templateAlias = event.templateAlias as string | undefined;
    const templateData = event.templateData as Record<string, unknown> | undefined;

    if (!templateAlias) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'templateAlias required' });
    }

    // Get the boost associated with this app (templateAlias maps to internal boost)
    const boostResult = await getBoostForListingByTemplateAlias(
        listingId,
        templateAlias,
        ctx.domain
    );
    if (!boostResult) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Boost not found for this app' });
    }

    const { boost, boostUri } = boostResult;

    if (isDraftBoost(boost)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Draft boosts cannot be issued',
        });
    }

    const listing = await readAppStoreListingById(listingId);
    if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'App Store Listing not found' });
    }

    // Get the integration that owns this listing
    const integration = await getIntegrationForListing(listingId);
    if (!integration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
    }

    // Get signing authority for the integration
    const sa = await getPrimarySigningAuthorityForIntegration(integration);
    if (!sa) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No signing authority configured for this app',
        });
    }

    // Get integration owner for signing
    const integrationOwner = await getOwnerProfileForIntegration(integration.id);
    if (!integrationOwner) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration owner not found' });
    }

    // Get the target profile (the user making the request)
    const targetProfile = await getProfilesByProfileIds([profile.profileId]);
    if (!targetProfile.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
    }

    // Build unsigned credential from boost template
    let unsignedVc: UnsignedVC;

    try {
        let boostJsonString = boost.boost;

        if (templateData && Object.keys(templateData).length > 0) {
            boostJsonString = renderBoostTemplate(boostJsonString, templateData);
        }

        unsignedVc = parseRenderedTemplate<UnsignedVC>(boostJsonString);

        if (isVC2Format(unsignedVc)) {
            unsignedVc.validFrom = new Date().toISOString();
        } else {
            unsignedVc.issuanceDate = new Date().toISOString();
        }

        const issuerDid = listing.slug
            ? getAppDidWeb(ctx.domain, listing.slug)
            : getDidWeb(ctx.domain, integrationOwner.profileId);
        unsignedVc.issuer =
            unsignedVc.issuer && typeof unsignedVc.issuer === 'object'
                ? { ...unsignedVc.issuer, id: issuerDid }
                : { id: issuerDid };

        const targetDid = getDidWeb(ctx.domain, targetProfile[0]!.profileId);

        if (Array.isArray(unsignedVc.credentialSubject)) {
            unsignedVc.credentialSubject = unsignedVc.credentialSubject.map(subject => ({
                ...subject,
                id: targetDid,
            }));
        } else {
            unsignedVc.credentialSubject = {
                ...unsignedVc.credentialSubject,
                id: targetDid,
            };
        }

        if (unsignedVc?.type?.includes('BoostCredential')) {
            unsignedVc.boostId = boostUri;
        }
    } catch (e) {
        console.error('Failed to parse boost', e);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to parse boost template',
        });
    }

    // Issue via signing authority
    let credential;

    try {
        credential = await issueCredentialWithSigningAuthority(
            integrationOwner,
            unsignedVc,
            sa,
            ctx.domain,
            true,
            listing.slug ? getAppDidWeb(ctx.domain, listing.slug) : undefined
        );
    } catch (e) {
        console.error('Failed to issue VC with signing authority', e);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Could not issue credential with signing authority',
        });
    }

    // Log credential activity FIRST to get activityId for chaining
    const activityId = await logCredentialSent({
        actorProfileId: integrationOwner.profileId,
        recipientType: 'profile',
        recipientIdentifier: targetProfile[0]!.profileId,
        recipientProfileId: targetProfile[0]!.profileId,
        boostUri,
        integrationId: integration.id,
        listingId,
        source: 'sendBoost',
        metadata: { listingId, templateAlias },
    });

    // Send to user's wallet
    const credentialUri = await sendBoost({
        from: integrationOwner,
        to: targetProfile[0]!,
        boost,
        credential,
        domain: ctx.domain,
        skipNotification: false,
        activityId,
        integrationId: integration.id,
        listingId,
    });

    return {
        credentialUri,
        boostUri,
    };
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

            const slug = await getAvailableAppSlug(storageData.display_name);
            const listing = await createAppStoreListing({
                ...storageData,
                slug,
            });

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

            const storageUpdates = transformInputForStorage(input.updates);

            if (!listing.slug) {
                const displayName = storageUpdates.display_name ?? listing.display_name;
                storageUpdates.slug = await getAvailableAppSlug(displayName, listing.listing_id);
            }

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

            const result = await updateAppStoreListing(listing, {
                app_listing_status: 'PENDING_REVIEW',
            });

            // Notify all App Store admins about the new submission
            if (APP_STORE_ADMIN_PROFILE_IDS.length > 0) {
                const adminProfiles = await getProfilesByProfileIds(APP_STORE_ADMIN_PROFILE_IDS);

                for (const adminProfile of adminProfiles) {
                    await addNotificationToQueue({
                        type: LCNNotificationTypeEnumValidator.enum.APP_LISTING_SUBMITTED,
                        to: adminProfile,
                        from: ctx.user.profile,
                        message: {
                            title: 'New App Listing Submitted',
                            body: `"${listing.display_name}" has been submitted for review.`,
                        },
                        data: {
                            metadata: {
                                listingId: listing.listing_id,
                                listingName: listing.display_name,
                            },
                        },
                    });
                }
            }

            return result;
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

    getPublicListingBySlug: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'GET',
                path: '/app-store/public/listing/slug/{slug}',
                tags: ['App Store'],
                summary: 'Get Public App Listing by Slug',
                description: 'Get a publicly listed app by slug',
            },
        })
        .input(z.object({ slug: z.string() }))
        .output(AppStoreListingResponseValidator.optional())
        .query(async ({ input }) => {
            const listing = await readAppStoreListingBySlug(input.slug);

            if (!listing) {
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
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Listing not found or not available',
                });
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

    // ==================== App Boost Management Routes ====================

    addBoostToListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/listing/{listingId}/boost/add',
                tags: ['App Store'],
                summary: 'Add Boost to Listing',
                description: 'Associate a boost with an app listing for credential issuance',
            },
            requiredScope: 'app-store:write',
        })
        .input(
            z.object({
                listingId: z.string(),
                boostUri: z.string(),
                templateAlias: z
                    .string()
                    .min(1)
                    .max(50)
                    .regex(/^[a-z0-9-]+$/, {
                        message: 'templateAlias must be lowercase alphanumeric with hyphens only',
                    }),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { integration } = await verifyListingOwnership(
                input.listingId,
                ctx.user.profile.profileId
            );

            const boost = await getBoostByUri(input.boostUri);
            if (!boost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Boost not found' });
            }

            const exists = await hasTemplateAliasForListing(input.listingId, input.templateAlias);
            if (exists) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'A boost with this templateAlias already exists for this listing',
                });
            }

            // Auto-setup signing authority for integration if not already configured
            const existingSa = await getPrimarySigningAuthorityForIntegration(integration);
            if (!existingSa) {
                // Try to use the user's primary signing authority
                const userSa = await getPrimarySigningAuthorityForUser(ctx.user.profile);
                if (userSa) {
                    await associateIntegrationWithSigningAuthority(
                        integration.id,
                        userSa.signingAuthority.endpoint,
                        {
                            name: userSa.relationship.name,
                            did: userSa.relationship.did,
                            isPrimary: true,
                        }
                    );
                }
            }

            return associateBoostWithListing(input.listingId, input.boostUri, input.templateAlias);
        }),

    removeBoostFromListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/listing/{listingId}/boost/remove',
                tags: ['App Store'],
                summary: 'Remove Boost from Listing',
                description: 'Remove a boost association from an app listing',
            },
            requiredScope: 'app-store:write',
        })
        .input(
            z.object({
                listingId: z.string(),
                templateAlias: z.string(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            await verifyListingOwnership(input.listingId, ctx.user.profile.profileId);

            const exists = await hasTemplateAliasForListing(input.listingId, input.templateAlias);
            if (!exists) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Boost not found for this listing',
                });
            }

            return removeBoostFromListing(input.listingId, input.templateAlias);
        }),

    getBoostsForListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/app-store/listing/{listingId}/boosts',
                tags: ['App Store'],
                summary: 'Get Boosts for Listing',
                description: 'Get all boosts associated with an app listing',
            },
            requiredScope: 'app-store:read',
        })
        .input(z.object({ listingId: z.string() }))
        .output(
            z.array(
                z.object({
                    templateAlias: z.string(),
                    boostUri: z.string(),
                })
            )
        )
        .query(async ({ input, ctx }) => {
            await verifyListingOwnership(input.listingId, ctx.user.profile.profileId);

            return getBoostsForListing(input.listingId, ctx.domain);
        }),

    // ==================== Generic App Event Route ====================

    appEvent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/app-store/event',
                tags: ['App Store'],
                summary: 'Process App Event',
                description: 'Process a generic event from an installed app',
            },
            requiredScope: 'app-store:write',
        })
        .input(
            z.object({
                listingId: z.string(),
                event: z.record(z.string(), z.unknown()),
            })
        )
        .output(z.record(z.string(), z.unknown()))
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const { listingId, event } = input;

            const listing = await readAppStoreListingByIdOrSlug(listingId);

            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'App Store Listing not found' });
            }

            const resolvedListingId = listing.listing_id;

            // Check if user has this app installed OR owns the integration (for testing)
            const isInstalled = await hasProfileInstalledApp(profile.profileId, resolvedListingId);

            if (!isInstalled) {
                // Check if user owns the integration - allows testing without installation
                const integration = await getIntegrationForListing(resolvedListingId);
                const isOwner = integration
                    ? await isIntegrationAssociatedWithProfile(integration.id, profile.profileId)
                    : false;
                if (!isOwner) {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'App not installed' });
                }
            }

            // Route based on event type
            const eventType = event.type as string | undefined;

            if (eventType === 'send-credential') {
                return handleSendCredentialEvent(ctx, profile, resolvedListingId, event);
            }

            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown event type' });
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
            const previousStatus = listing.app_listing_status;

            const result = await updateAppStoreListing(listing, {
                app_listing_status: input.status,
            });

            // Send notification to the listing owner if status changed
            if (previousStatus !== input.status) {
                const integration = await getIntegrationForListing(input.listingId);

                if (integration) {
                    const ownerProfile = await getOwnerProfileForIntegration(integration.id);

                    if (ownerProfile) {
                        // Approved: status changed to LISTED
                        if (input.status === 'LISTED') {
                            await addNotificationToQueue({
                                type: LCNNotificationTypeEnumValidator.enum.APP_LISTING_APPROVED,
                                to: ownerProfile,
                                from: ctx.user.profile,
                                message: {
                                    title: 'App Listing Approved!',
                                    body: `"${listing.display_name}" has been approved and is now live in the App Store.`,
                                },
                                data: {
                                    metadata: {
                                        listingId: listing.listing_id,
                                        listingName: listing.display_name,
                                    },
                                },
                            });
                        }

                        // Rejected: status changed from PENDING_REVIEW to something other than LISTED
                        if (previousStatus === 'PENDING_REVIEW' && input.status !== 'LISTED') {
                            await addNotificationToQueue({
                                type: LCNNotificationTypeEnumValidator.enum.APP_LISTING_REJECTED,
                                to: ownerProfile,
                                from: ctx.user.profile,
                                message: {
                                    title: 'App Listing Needs Changes',
                                    body: `"${listing.display_name}" was not approved. Please review and resubmit.`,
                                },
                                data: {
                                    metadata: {
                                        listingId: listing.listing_id,
                                        listingName: listing.display_name,
                                        newStatus: input.status,
                                    },
                                },
                            });
                        }
                    }
                }
            }

            return result;
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
            // Admin can see all listings including demoted ones
            const results = await getListedApps({
                limit: limit + 1,
                cursor: input?.cursor,
                status: input?.status,
                includeAllStatuses: !input?.status, // Include all if no specific status filter
                excludeDemoted: false, // Admin can see demoted listings
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
