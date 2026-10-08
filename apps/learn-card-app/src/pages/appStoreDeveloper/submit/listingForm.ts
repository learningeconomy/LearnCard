import type { AppStoreListing, AppStoreListingUpdateType } from '@learncard/types';

import type { AgeRating } from '../types';
import { AGE_RATING_OPTIONS } from '../types';
import { DEFAULT_APP_ICON_URL } from './constants';

export const MAX_SCREENSHOTS = 10;
export const MAX_HIGHLIGHTS = 5;
export const DEFAULT_HERO_COLOR = '#18224E';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREVIEW_DESCRIPTION_SUFFIX = 'draft listing created from a LearnCard app preview.';

export interface ListingDetails {
    description: string;
    screenshots: string[];
    highlights: string[];
    category: string;
    ageRating: AgeRating | '';
    privacyPolicyUrl: string;
    termsUrl: string;
    contactEmail: string;
    promoVideoUrl: string;
    iosAppStoreId: string;
    androidAppStoreId: string;
    heroColor: string;
}

export interface ListingData extends ListingDetails {
    name: string;
    tagline: string;
    iconUrl: string;
}

export const EMPTY_LISTING_DETAILS: ListingDetails = {
    description: '',
    screenshots: [],
    highlights: [],
    category: '',
    ageRating: '',
    privacyPolicyUrl: '',
    termsUrl: '',
    contactEmail: '',
    promoVideoUrl: '',
    iosAppStoreId: '',
    androidAppStoreId: '',
    heroColor: '',
};

export const isValidContactEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim());

const toAgeRating = (value: string | undefined): AgeRating | '' =>
    AGE_RATING_OPTIONS.find(option => option.value === value)?.value ?? '';

/** Placeholder text the publish page writes when it provisions a preview listing. */
export const isPlaceholderTagline = (tagline: string, name: string): boolean =>
    tagline === `${name} preview` || tagline === 'Draft listing';

export const isPlaceholderDescription = (description: string, tagline: string): boolean =>
    description === 'Draft' ||
    description.endsWith(PREVIEW_DESCRIPTION_SUFFIX) ||
    (tagline !== '' && description === tagline);

export const listingToData = (listing: Partial<AppStoreListing>): ListingData => {
    const name = listing.display_name ?? '';
    const rawTagline = listing.tagline ?? '';
    const tagline = isPlaceholderTagline(rawTagline, name) ? '' : rawTagline;
    const rawDescription = listing.full_description ?? '';

    return {
        name,
        tagline,
        iconUrl: listing.icon_url ?? DEFAULT_APP_ICON_URL,
        description: isPlaceholderDescription(rawDescription, rawTagline) ? '' : rawDescription,
        screenshots: listing.screenshots ?? [],
        highlights: listing.highlights ?? [],
        category: listing.category ?? '',
        ageRating: toAgeRating(listing.age_rating),
        privacyPolicyUrl: listing.privacy_policy_url ?? '',
        termsUrl: listing.terms_url ?? '',
        contactEmail: listing.contact_email ?? '',
        promoVideoUrl: listing.promo_video_url ?? '',
        iosAppStoreId: listing.ios_app_store_id ?? '',
        androidAppStoreId: listing.android_app_store_id ?? '',
        heroColor: listing.hero_background_color ?? '',
    };
};

/**
 * Store-listing fields only — never launch type or launch config, so saving a
 * listing can't change how the app runs. Blank required fields are omitted so
 * an in-progress edit never wipes a saved value.
 */
export const toListingUpdates = (data: ListingData): AppStoreListingUpdateType => {
    const updates: AppStoreListingUpdateType = {
        screenshots: data.screenshots.filter(Boolean).slice(0, MAX_SCREENSHOTS),
        highlights: data.highlights
            .map(highlight => highlight.trim())
            .filter(Boolean)
            .slice(0, MAX_HIGHLIGHTS),
        category: data.category,
        privacy_policy_url: data.privacyPolicyUrl.trim(),
        terms_url: data.termsUrl.trim(),
        promo_video_url: data.promoVideoUrl.trim(),
        ios_app_store_id: data.iosAppStoreId.trim(),
        android_app_store_id: data.androidAppStoreId.trim(),
    };

    if (data.name.trim()) updates.display_name = data.name.trim();
    if (data.tagline.trim()) updates.tagline = data.tagline.trim();
    if (data.description.trim()) updates.full_description = data.description.trim();
    if (data.iconUrl && data.iconUrl !== DEFAULT_APP_ICON_URL) updates.icon_url = data.iconUrl;
    if (data.ageRating) updates.age_rating = data.ageRating;
    if (data.heroColor) updates.hero_background_color = data.heroColor;
    if (isValidContactEmail(data.contactEmail)) updates.contact_email = data.contactEmail.trim();

    return updates;
};

export interface EmbeddedLaunchTarget {
    url: string;
    permissions: string[];
    contractUri?: string | null;
}

/** Full update sent on submit: the listing plus where the app lives in production. */
export const toSubmissionUpdates = (
    data: ListingData,
    { url, permissions, contractUri }: EmbeddedLaunchTarget
): AppStoreListingUpdateType => ({
    ...toListingUpdates(data),
    launch_type: 'EMBEDDED_IFRAME',
    launch_config_json: JSON.stringify({
        url,
        permissions,
        ...(contractUri ? { contractUri } : {}),
    }),
});
