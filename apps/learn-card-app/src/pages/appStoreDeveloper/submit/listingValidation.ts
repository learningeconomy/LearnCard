import { DEFAULT_APP_ICON_URL } from './constants';
import { getInvalidOptionalFields } from './listingForm';
import type { OptionalFormatField } from './listingForm';

export type ListingField =
    'icon' | 'name' | 'productionUrl' | 'tagline' | 'description' | OptionalFormatField;

export interface MissingListingField {
    field: ListingField;
    message: string;
}

export interface ListingValidationState {
    name: string;
    tagline: string;
    description: string;
    iconUrl: string;
    privacyPolicyUrl?: string;
    termsUrl?: string;
    contactEmail?: string;
    promoVideoUrl?: string;
    heroColor?: string;
    needsProductionUrl: boolean;
    productionUrl: string;
}

const OPTIONAL_FIELD_MESSAGES: Array<[OptionalFormatField, string]> = [
    ['privacyPolicyUrl', 'Fix the privacy policy link to submit'],
    ['termsUrl', 'Fix the terms of service link to submit'],
    ['contactEmail', 'Fix the contact email to submit'],
    ['promoVideoUrl', 'Fix the promo video link to submit'],
    ['heroColor', 'Fix the header color to submit'],
];

/** Returns the first thing blocking submission, in the order the fields appear on screen. */
export const getFirstMissingField = (state: ListingValidationState): MissingListingField | null => {
    if (!state.iconUrl || state.iconUrl === DEFAULT_APP_ICON_URL) {
        return { field: 'icon', message: 'Add an icon to submit' };
    }
    if (!state.name.trim()) return { field: 'name', message: 'Add a name to submit' };
    if (state.needsProductionUrl && !state.productionUrl.trim()) {
        return { field: 'productionUrl', message: 'Add where your app will live to submit' };
    }
    if (!state.tagline.trim()) return { field: 'tagline', message: 'Add a tagline to submit' };
    if (!state.description.trim()) {
        return { field: 'description', message: 'Add a description to submit' };
    }

    const invalid = getInvalidOptionalFields({
        privacyPolicyUrl: state.privacyPolicyUrl ?? '',
        termsUrl: state.termsUrl ?? '',
        contactEmail: state.contactEmail ?? '',
        promoVideoUrl: state.promoVideoUrl ?? '',
        heroColor: state.heroColor ?? '',
    });
    const firstInvalid = OPTIONAL_FIELD_MESSAGES.find(([field]) => invalid.has(field));

    return firstInvalid ? { field: firstInvalid[0], message: firstInvalid[1] } : null;
};

export const getProductionUrlError = (value: string): string | null => {
    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:') return 'Use an https:// address.';
        if (url.pathname !== '/' || url.search || url.hash) {
            return 'Use just the domain, like https://myapp.com.';
        }
        return null;
    } catch {
        return 'Enter a full address, like https://myapp.com.';
    }
};
