import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Integration, IntegrationInstance } from './Integration';
import { Profile, ProfileInstance } from './Profile';
import {
    FlatAppStoreListingType,
    AppListingStatus,
    LaunchType,
    PromotionLevel,
} from 'types/app-store-listing';

export type AppStoreListingRelationships = {
    publishedBy: ModelRelatedNodesI<typeof Integration, IntegrationInstance>;
    installedBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { listing_id: string; installed_at: string },
        { listing_id: string; installed_at: string }
    >;
};

export type AppStoreListingInstance = NeogmaInstance<
    FlatAppStoreListingType,
    AppStoreListingRelationships
>;

export const AppStoreListing = ModelFactory<
    FlatAppStoreListingType,
    AppStoreListingRelationships
>(
    {
        label: 'AppStoreListing',
        schema: {
            listing_id: { type: 'string', required: true, uniqueItems: true },
            display_name: { type: 'string', required: true },
            tagline: { type: 'string', required: true },
            full_description: { type: 'string', required: true },
            icon_url: { type: 'string', required: true },
            app_listing_status: {
                type: 'string',
                enum: AppListingStatus.options,
                required: true,
            },
            launch_type: { type: 'string', enum: LaunchType.options, required: true },
            launch_config_json: { type: 'string', required: true },
            category: { type: 'string', required: false },
            promo_video_url: { type: 'string', required: false },
            promotion_level: {
                type: 'string',
                enum: PromotionLevel.options,
                required: false,
            },
            ios_app_store_id: { type: 'string', required: false },
            android_app_store_id: { type: 'string', required: false },
            privacy_policy_url: { type: 'string', required: false },
            terms_url: { type: 'string', required: false },
            highlights_json: { type: 'string', required: false },
            screenshots_json: { type: 'string', required: false },
            hero_background_color: { type: 'string', required: false },
        } as any,
        relationships: {
            publishedBy: { model: Integration, direction: 'in', name: 'PUBLISHES_LISTING' },
            installedBy: {
                model: Profile,
                direction: 'in',
                name: 'INSTALLS',
                properties: {
                    listing_id: {
                        property: 'listing_id',
                        schema: { type: 'string', required: true },
                    },
                    installed_at: {
                        property: 'installed_at',
                        schema: { type: 'string', required: true },
                    },
                },
            },
        },
        primaryKeyField: 'listing_id',
    },
    neogma
);

export default AppStoreListing;
