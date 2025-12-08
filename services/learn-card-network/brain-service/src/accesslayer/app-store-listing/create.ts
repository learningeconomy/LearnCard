import { v4 as uuid } from 'uuid';
import { BindParam, QueryBuilder } from 'neogma';

import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { AppStoreListing } from '@models';
import { AppStoreListingCreateType, AppStoreListingType } from 'types/app-store-listing';

export const createAppStoreListing = async (
    input: AppStoreListingCreateType
): Promise<AppStoreListingType> => {
    const params = flattenObject({
        listing_id: input.listing_id ?? uuid(),
        display_name: input.display_name,
        tagline: input.tagline,
        full_description: input.full_description,
        icon_url: input.icon_url,
        app_listing_status: input.app_listing_status,
        launch_type: input.launch_type,
        launch_config_json: input.launch_config_json,
        category: input.category,
        promo_video_url: input.promo_video_url,
        promotion_level: input.promotion_level,
        ios_app_store_id: input.ios_app_store_id,
        android_app_store_id: input.android_app_store_id,
        privacy_policy_url: input.privacy_policy_url,
        terms_url: input.terms_url,
        highlights_json: input.highlights_json,
        screenshots_json: input.screenshots_json,
        hero_background_color: input.hero_background_color,
    });

    const result = await new QueryBuilder(new BindParam({ params }))
        .create({ model: AppStoreListing, identifier: 'listing' })
        .set('listing += $params')
        .return('listing')
        .limit(1)
        .run();

    const listing = result.records[0]?.get('listing').properties!;

    return (inflateObject as any)(listing);
};
