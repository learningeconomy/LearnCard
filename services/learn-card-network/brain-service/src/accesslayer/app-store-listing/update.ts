import { QueryBuilder, BindParam } from 'neogma';

import { AppStoreListing } from '@models';
import {
    FlatAppStoreListingType,
    AppStoreListingType,
    AppStoreListingUpdateType,
} from 'types/app-store-listing';

export const updateAppStoreListing = async (
    listing: AppStoreListingType,
    updates: AppStoreListingUpdateType
): Promise<boolean> => {
    const updatesToPersist: Partial<FlatAppStoreListingType> = {};

    if (typeof updates.display_name !== 'undefined')
        updatesToPersist.display_name = updates.display_name;
    if (typeof updates.tagline !== 'undefined') updatesToPersist.tagline = updates.tagline;
    if (typeof updates.full_description !== 'undefined')
        updatesToPersist.full_description = updates.full_description;
    if (typeof updates.icon_url !== 'undefined') updatesToPersist.icon_url = updates.icon_url;
    if (typeof updates.app_listing_status !== 'undefined')
        updatesToPersist.app_listing_status = updates.app_listing_status;
    if (typeof updates.launch_type !== 'undefined')
        updatesToPersist.launch_type = updates.launch_type;
    if (typeof updates.launch_config_json !== 'undefined')
        updatesToPersist.launch_config_json = updates.launch_config_json;
    if (typeof updates.category !== 'undefined') updatesToPersist.category = updates.category;
    if (typeof updates.promo_video_url !== 'undefined')
        updatesToPersist.promo_video_url = updates.promo_video_url;
    if (typeof updates.promotion_level !== 'undefined')
        updatesToPersist.promotion_level = updates.promotion_level;
    if (typeof updates.ios_app_store_id !== 'undefined')
        updatesToPersist.ios_app_store_id = updates.ios_app_store_id;
    if (typeof updates.android_app_store_id !== 'undefined')
        updatesToPersist.android_app_store_id = updates.android_app_store_id;
    if (typeof updates.privacy_policy_url !== 'undefined')
        updatesToPersist.privacy_policy_url = updates.privacy_policy_url;
    if (typeof updates.terms_url !== 'undefined') updatesToPersist.terms_url = updates.terms_url;
    if (typeof updates.highlights_json !== 'undefined')
        updatesToPersist.highlights_json = updates.highlights_json;
    if (typeof updates.screenshots_json !== 'undefined')
        updatesToPersist.screenshots_json = updates.screenshots_json;

    const params: Partial<FlatAppStoreListingType> = updatesToPersist;

    // Nothing to update
    if (Object.keys(params as Record<string, unknown>).length === 0) return true;

    const result = await new QueryBuilder(new BindParam({ params }))
        .match({
            model: AppStoreListing,
            where: { listing_id: listing.listing_id },
            identifier: 'listing',
        })
        .set('listing += $params')
        .run();

    return result.summary.updateStatistics.containsUpdates();
};
