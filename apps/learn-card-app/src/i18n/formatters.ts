import { getLocale } from '../paraglide/runtime.js';

/**
 * Locale-aware Intl formatting helpers.
 *
 * `date.toLocaleDateString('en-US', …)` hardcodes English output regardless of
 * the user's selected language — dates still render "Jan 5, 2026" under a
 * French or Arabic UI, quietly undoing the translation work around them.
 *
 * These read Paraglide's active locale instead. `LocaleProvider` keeps that in
 * sync via `setLocale()` on every language change, and re-renders consumers, so
 * a call during render always formats in the currently-selected language.
 */
export const formatLocaleDate = (date: Date, options?: Intl.DateTimeFormatOptions): string =>
    date.toLocaleDateString(getLocale(), options);

export const formatLocaleTime = (date: Date, options?: Intl.DateTimeFormatOptions): string =>
    date.toLocaleTimeString(getLocale(), options);

export const formatLocaleNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(getLocale(), options).format(value);
