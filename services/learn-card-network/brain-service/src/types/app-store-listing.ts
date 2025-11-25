import { z } from 'zod';

export const AppListingStatus = z.enum(['DRAFT', 'PENDING_REVIEW', 'LISTED', 'ARCHIVED']);
export type AppListingStatusEnum = z.infer<typeof AppListingStatus>;

export const LaunchType = z.enum([
    'EMBEDDED_IFRAME',
    'SECOND_SCREEN',
    'DIRECT_LINK',
    'CONSENT_REDIRECT',
    'SERVER_HEADLESS',
]);
export type LaunchTypeEnum = z.infer<typeof LaunchType>;

export const PromotionLevel = z.enum([
    'FEATURED_CAROUSEL',
    'CURATED_LIST',
    'STANDARD',
    'DEMOTED',
]);
export type PromotionLevelEnum = z.infer<typeof PromotionLevel>;

export const AppStoreListingValidator = z.object({
    listing_id: z.string(),
    display_name: z.string(),
    tagline: z.string(),
    full_description: z.string(),
    icon_url: z.string(),
    app_listing_status: AppListingStatus,
    launch_type: LaunchType,
    launch_config_json: z.string(),
    category: z.string().optional(),
    promo_video_url: z.string().optional(),
    promotion_level: PromotionLevel.optional(),
    ios_app_store_id: z.string().optional(),
    android_app_store_id: z.string().optional(),
    privacy_policy_url: z.string().optional(),
    terms_url: z.string().optional(),
});
export type AppStoreListingType = z.infer<typeof AppStoreListingValidator>;

export const FlatAppStoreListingValidator = AppStoreListingValidator.catchall(z.any());
export type FlatAppStoreListingType = z.infer<typeof FlatAppStoreListingValidator>;

export const AppStoreListingCreateValidator = AppStoreListingValidator.omit({
    listing_id: true,
}).extend({
    listing_id: z.string().optional(),
});
export type AppStoreListingCreateType = z.infer<typeof AppStoreListingCreateValidator>;

export const AppStoreListingUpdateValidator = AppStoreListingValidator.partial().omit({
    listing_id: true,
});
export type AppStoreListingUpdateType = z.infer<typeof AppStoreListingUpdateValidator>;
