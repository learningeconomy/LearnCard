import type { AppStoreListing } from '@learncard/types';

import { getListingMode } from '../submit/listingLifecycle';
import type { ListingMode } from '../submit/listingLifecycle';
import { withPendingChanges } from '../submit/listingLifecycle';

export interface MyApp {
    integrationId: string;
    listing: AppStoreListing;
    mode: ListingMode;
    nudge?: string;
}

const MODE_ORDER: Record<ListingMode, number> = {
    'live': 0,
    'update-in-review': 1,
    'in-review': 2,
    'draft': 3,
    'removed': 4,
};

export const STATUS_LABELS: Record<ListingMode, string> = {
    'draft': 'Draft',
    'in-review': 'In review',
    'live': 'Live',
    'update-in-review': 'Live · update in review',
    'removed': 'Removed',
};

const getNudge = (listing: AppStoreListing, mode: ListingMode): string | undefined => {
    if (mode === 'draft') return 'Finish your listing';
    if (mode === 'live' && listing.pending_update?.status === 'DRAFT') {
        return 'Changes not submitted';
    }
    return undefined;
};

export const toMyApps = (
    records: Array<{ integrationId: string; listing: AppStoreListing }>
): MyApp[] =>
    records
        .map(({ integrationId, listing }) => {
            const mode = getListingMode(listing);
            return {
                integrationId,
                listing: withPendingChanges(listing),
                mode,
                nudge: getNudge(listing, mode),
            };
        })
        .sort(
            (a, b) =>
                MODE_ORDER[a.mode] - MODE_ORDER[b.mode] ||
                a.listing.display_name.localeCompare(b.listing.display_name)
        );

export const getAppStatusPath = (listingId: string): string =>
    `/app-store/developer/apps/${listingId}`;
