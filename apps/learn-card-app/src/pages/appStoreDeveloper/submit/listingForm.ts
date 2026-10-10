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

export const isValidLink = (value: string): boolean => {
    try {
        const { protocol } = new URL(value.trim());
        return protocol === 'https:' || protocol === 'http:';
    } catch {
        return false;
    }
};

export const isValidHexColor = (value: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(value.trim());

export type OptionalFormatField =
    'privacyPolicyUrl' | 'termsUrl' | 'contactEmail' | 'promoVideoUrl' | 'heroColor';

const FORMAT_CHECKS: Record<OptionalFormatField, (value: string) => boolean> = {
    privacyPolicyUrl: isValidLink,
    termsUrl: isValidLink,
    contactEmail: isValidContactEmail,
    promoVideoUrl: isValidLink,
    heroColor: isValidHexColor,
};

/** Optional fields that are filled in but malformed; the store would reject them. */
export const getInvalidOptionalFields = (
    details: Pick<ListingDetails, OptionalFormatField>
): Set<OptionalFormatField> =>
    new Set(
        (Object.keys(FORMAT_CHECKS) as OptionalFormatField[]).filter(
            field => details[field].trim() !== '' && !FORMAT_CHECKS[field](details[field])
        )
    );

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
 * listing can't change how the app runs. Blank or malformed fields are omitted:
 * the store rejects empty strings for format-checked fields, and leaving them
 * out means one half-typed link never blocks saving everything else.
 */
export const toListingUpdates = (data: ListingData): AppStoreListingUpdateType => {
    const updates: AppStoreListingUpdateType = {
        screenshots: data.screenshots.filter(Boolean).slice(0, MAX_SCREENSHOTS),
        highlights: data.highlights
            .map(highlight => highlight.trim())
            .filter(Boolean)
            .slice(0, MAX_HIGHLIGHTS),
    };
    const set = <K extends keyof AppStoreListingUpdateType>(
        key: K,
        value: AppStoreListingUpdateType[K] | undefined,
        include: boolean
    ) => {
        if (include && value !== undefined) updates[key] = value;
    };

    set('display_name', data.name.trim(), data.name.trim() !== '');
    set('tagline', data.tagline.trim(), data.tagline.trim() !== '');
    set('full_description', data.description.trim(), data.description.trim() !== '');
    set('icon_url', data.iconUrl, Boolean(data.iconUrl) && data.iconUrl !== DEFAULT_APP_ICON_URL);
    set('category', data.category, data.category !== '');
    set('age_rating', data.ageRating || undefined, data.ageRating !== '');
    set('privacy_policy_url', data.privacyPolicyUrl.trim(), isValidLink(data.privacyPolicyUrl));
    set('terms_url', data.termsUrl.trim(), isValidLink(data.termsUrl));
    set('promo_video_url', data.promoVideoUrl.trim(), isValidLink(data.promoVideoUrl));
    set('ios_app_store_id', data.iosAppStoreId.trim(), data.iosAppStoreId.trim() !== '');
    set(
        'android_app_store_id',
        data.androidAppStoreId.trim(),
        data.androidAppStoreId.trim() !== ''
    );
    set('hero_background_color', data.heroColor.trim(), isValidHexColor(data.heroColor));
    set('contact_email', data.contactEmail.trim(), isValidContactEmail(data.contactEmail));

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
