import { randomUUID, randomInt } from 'crypto';

import { readAppStoreListingBySlug } from '@accesslayer/app-store-listing/read';

export const MAX_APP_SLUG_LENGTH = 50;
export const MAX_VALID_SLUG_LENGTH = 100;

/**
 * Validates an app slug to prevent injection attacks.
 * Slugs must contain only lowercase letters, numbers, and hyphens.
 * Cannot start or end with a hyphen.
 */
export const isValidAppSlug = (slug: string): boolean => {
    const slugPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

    return (
        typeof slug === 'string' &&
        slug.length >= 1 &&
        slug.length <= MAX_VALID_SLUG_LENGTH &&
        slugPattern.test(slug)
    );
};

/**
 * Normalizes a string into a valid slug format.
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 * - Truncates to MAX_APP_SLUG_LENGTH
 */
export const normalizeAppSlug = (value: string): string => {
    const normalized = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const trimmed = normalized.slice(0, MAX_APP_SLUG_LENGTH).replace(/-+$/g, '');

    return trimmed || 'app';
};

/**
 * Appends a suffix to a slug while respecting the max length.
 */
export const appendSlugSuffix = (base: string, suffix: string): string => {
    const availableLength = MAX_APP_SLUG_LENGTH - suffix.length;
    const trimmedBase = base.slice(0, Math.max(availableLength, 0)).replace(/-+$/g, '');
    const safeBase = trimmedBase || 'app';

    return `${safeBase}${suffix}`.slice(0, MAX_APP_SLUG_LENGTH);
};

/**
 * Generates a unique, available slug for an app listing.
 * Tries the base slug first, then adds numeric suffixes, then falls back to random.
 */
export const getAvailableAppSlug = async (
    displayName: string,
    listingId?: string
): Promise<string> => {
    const baseSlug = normalizeAppSlug(displayName);

    const candidates = [baseSlug];
    for (let suffix = 0; suffix <= 8; suffix += 1) {
        candidates.push(appendSlugSuffix(baseSlug, `-${suffix}`));
    }

    for (const candidate of candidates) {
        const existing = await readAppStoreListingBySlug(candidate);

        if (!existing || (listingId && existing.listing_id === listingId)) {
            return candidate;
        }
    }

    const randomCandidate = appendSlugSuffix(baseSlug, `-${randomInt(0, 100001)}`);
    const randomExisting = await readAppStoreListingBySlug(randomCandidate);

    if (!randomExisting || (listingId && randomExisting.listing_id === listingId)) {
        return randomCandidate;
    }

    return appendSlugSuffix(baseSlug, `-${randomUUID()}`);
};
