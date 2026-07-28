import type { AppStoreListingType } from 'types/app-store-listing';

export const DEFAULT_APP_STORE_LISTING_KIND: AppStoreListingType['kind'] = 'APP';

export const normalizeAppStoreListing = <
    T extends Omit<AppStoreListingType, 'kind'> & { kind?: AppStoreListingType['kind'] }
>(
    listing: T
): T & Pick<AppStoreListingType, 'kind'> => ({
    ...listing,
    kind: listing.kind ?? DEFAULT_APP_STORE_LISTING_KIND,
});
