import { DEFAULT_APP_ICON_URL } from './constants';
import { isValidContactEmail } from './listingForm';

export type ListingField =
    'icon' | 'name' | 'productionUrl' | 'tagline' | 'description' | 'contactEmail';

export interface MissingListingField {
    field: ListingField;
    message: string;
}

export interface ListingValidationState {
    name: string;
    tagline: string;
    description: string;
    iconUrl: string;
    contactEmail?: string;
    needsProductionUrl: boolean;
    productionUrl: string;
}

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
    if (state.contactEmail?.trim() && !isValidContactEmail(state.contactEmail)) {
        return { field: 'contactEmail', message: 'Fix the contact email to submit' };
    }
    return null;
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
