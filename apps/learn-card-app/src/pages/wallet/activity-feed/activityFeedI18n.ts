/**
 * Render-layer i18n helpers for the Passport Activity Feed.
 *
 * Filter labels, month names, and category labels live as English data in
 * `activityFeed.helpers.ts` (a framework-free data file). This helper
 * translates them at the render site, keyed by the stable id/enum.
 */
import * as m from '../../../paraglide/messages.js';

const MONTHS_SHORT = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
] as const;

/** Translate a short month abbreviation (e.g. "Jan" → "Ene"). */
export const tShortMonth = (idx: number): string => {
    const key = `passport.activity.months.${MONTHS_SHORT[idx] ?? 'jan'}` as const;
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as () => string)() : '';
};

const MONTHS_FULL = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
] as const;

/** Translate a full month name from the MONTHS array (e.g. "JANUARY" → "January"). */
export const tFullMonth = (englishName: string): string => {
    const idx = MONTHS_FULL.indexOf(englishName);
    if (idx === -1) return englishName;
    const key = `passport.activity.months.${MONTHS_SHORT[idx]}` as const;
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as () => string)() : englishName;
};

/** Translate a localized group label like "JANUARY 2026" → "January 2026". */
export const tMonthGroupLabel = (label: string): string => {
    const parts = label.split(' ');
    if (parts.length >= 2) {
        parts[0] = tFullMonth(parts[0]);
    }
    return parts.join(' ');
};

/**
 * Activity filter label map. Filter id → translated label.
 * Falls back to id for unknown filter ids.
 */
export const tFilterLabel = (id: string): string => {
    const key = `passport.activity.categoriesPlural.${id}` as const;
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as () => string)() : id;
};

/** Category label used in activity titles (singular, e.g. "Badge"). */
export const tCategoryLabel = (category: string): string => {
    const key = `passport.activity.categories.${category}` as const;
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as () => string)() : category;
};
