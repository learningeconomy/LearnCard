import type { AppStoreListing } from '@learncard/types';

interface ReuseContext {
    storedListingId?: string;
    previewKey: string;
    previewUrl: string;
    displayName: string;
}

type ListingRecord = Pick<
    AppStoreListing,
    | 'listing_id'
    | 'app_listing_status'
    | 'launch_type'
    | 'launch_config_json'
    | 'display_name'
    | 'tagline'
>;

const readConfig = (listing: ListingRecord): { devPreviewKey?: unknown; url?: unknown } => {
    try {
        return JSON.parse(listing.launch_config_json) as { devPreviewKey?: unknown; url?: unknown };
    } catch {
        return {};
    }
};

/**
 * Picks the listing this publish link should keep working on, so re-opening a link
 * never creates another listing for the same app. In order: the listing this browser
 * last used, then a preview draft made for this app. Project identity must be
 * resolved by the caller before using this helper.
 */
export const findReusableListing = <T extends ListingRecord>(
    listings: T[],
    { storedListingId, previewKey, previewUrl, displayName }: ReuseContext
): T | undefined => {
    const stored = storedListingId
        ? listings.find(listing => listing.listing_id === storedListingId)
        : undefined;
    if (stored) return stored;

    const drafts = listings.filter(listing => listing.app_listing_status === 'DRAFT');

    const previewDraft = drafts.find(listing => {
        const config = readConfig(listing);
        if (config.devPreviewKey === previewKey) return true;

        return (
            config.devPreviewKey === undefined &&
            config.url === previewUrl &&
            listing.display_name === displayName &&
            listing.tagline === `${displayName} preview`
        );
    });
    if (previewDraft) return previewDraft;

    return undefined;
};
