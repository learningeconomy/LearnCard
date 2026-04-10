/**
 * Pure utility functions for theme JSON expansion.
 *
 * Extracted from `loadJsonTheme.ts` so they can be unit-tested without
 * Vite's `import.meta.glob` or React dependencies.
 */

import { CredentialCategoryEnum } from 'learn-card-base';

import type { ThemeJsonColors } from '../validators/themeJson.validators';

// ─── Constants ──────────────────────────────────────────────────────────

export const ALL_CATEGORIES = Object.values(CredentialCategoryEnum);

/**
 * Map from enum key (camelCase, used in JSON) → enum value (spaced string, used at runtime).
 * e.g. 'socialBadge' → 'Social Badge'
 */
export const CATEGORY_KEY_TO_VALUE: Record<string, CredentialCategoryEnum> = {};

for (const [key, value] of Object.entries(CredentialCategoryEnum)) {
    CATEGORY_KEY_TO_VALUE[key] = value as CredentialCategoryEnum;
}

// ─── Utilities ──────────────────────────────────────────────────────────

/** Resolve a JSON category key to its runtime enum value, falling through as-is if no mapping. */
export const resolveCategoryKey = (key: string): string => CATEGORY_KEY_TO_VALUE[key] ?? key;

/** Remap object keys from JSON enum keys to runtime enum values. */
export const remapCategoryKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        result[resolveCategoryKey(key)] = value;
    }

    return result;
};

/**
 * Expand `categoryBase` + optional `categories` overrides into a full
 * per-`CredentialCategoryEnum` color map.
 */
export const expandCategoryColors = (
    colors: ThemeJsonColors,
): Record<string, Record<string, string>> => {
    const base = colors.categoryBase ?? {};
    const overrides = colors.categories ?? {};

    const result: Record<string, Record<string, string>> = {};

    for (const cat of ALL_CATEGORIES) {
        // Find overrides using either the enum value or the JSON key
        const jsonKey = Object.entries(CATEGORY_KEY_TO_VALUE).find(([, v]) => v === cat)?.[0];
        const catOverrides = overrides[cat] ?? (jsonKey ? overrides[jsonKey] : undefined);

        result[cat] = { ...base, ...catOverrides };
    }

    return result;
};

/**
 * Expand `placeholderBase` into per-category placeholder entries,
 * or pass through explicit `placeholders` as-is.
 */
export const expandPlaceholders = (
    colors: ThemeJsonColors,
): Record<string, unknown> => {
    if (colors.placeholders) {
        // Remap JSON keys (camelCase) to enum values (spaced strings)
        return remapCategoryKeys(colors.placeholders);
    }

    if (!colors.placeholderBase) return {};

    const result: Record<string, unknown> = {};

    for (const cat of ALL_CATEGORIES) {
        result[cat] = { ...colors.placeholderBase };
    }

    result['defaults'] = { ...colors.placeholderBase };

    return result;
};
