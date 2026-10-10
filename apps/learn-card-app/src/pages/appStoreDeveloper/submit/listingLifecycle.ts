import type { AppStoreListing } from '@learncard/types';

export type ListingMode = 'draft' | 'in-review' | 'live' | 'update-in-review' | 'removed';

type LifecycleListing = {
    app_listing_status: AppStoreListing['app_listing_status'];
    pending_update?: AppStoreListing['pending_update'];
};

export const getListingMode = (listing: LifecycleListing | null | undefined): ListingMode => {
    if (!listing) return 'draft';

    switch (listing.app_listing_status) {
        case 'PENDING_REVIEW':
            return 'in-review';
        case 'LISTED':
            return listing.pending_update?.status === 'PENDING_REVIEW'
                ? 'update-in-review'
                : 'live';
        case 'ARCHIVED':
            return 'removed';
        default:
            return 'draft';
    }
};

export const isListingLocked = (mode: ListingMode): boolean =>
    mode === 'in-review' || mode === 'update-in-review' || mode === 'removed';

/** What the developer is working on: the live listing with any held changes on top. */
export const withPendingChanges = <T extends Partial<AppStoreListing>>(listing: T): T => ({
    ...listing,
    ...listing.pending_update?.changes,
});
