/**
 * `formattedValues` mirror for the designer's preview pipeline.
 *
 * This file is a deliberate duplicate of
 * `packages/plugins/render-method/src/format-aliases.ts`. Both produce byte-for-byte
 * identical `formattedValues` mirrors so the designer's Canvas preview and the
 * eventually-issued credential render identically.
 *
 * Why duplicate instead of import: the designer is meant to be embedded standalone in
 * third-party CMS apps that may not depend on `@learncard/render-method-plugin`. The
 * function is pure (no wallet, no React, no LearnCard runtime), so duplication is a
 * deliberate choice for dependency-surface minimization. The two files must be kept in
 * sync when format keys are added — see the plugin file's docstring for the canonical
 * contract.
 */

export interface FormatAliasesOptions {
    locale?: string;
    timeZone?: string;
    now?: Date;
}

export interface FormattedDate {
    long: string;
    medium: string;
    short: string;
    iso: string;
    year: string;
    month: string;
    day: string;
    weekday: string;
    relative: string;
    time: string;
    datetime: string;
}

export interface FormattedString {
    short: string;
    long: string;
}

const ISO_DATE_REGEX =
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const isIsoDate = (value: string): boolean => {
    if (!ISO_DATE_REGEX.test(value)) return false;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed);
};

const looksLikeLongIdentifier = (value: string): boolean => {
    if (value.length < 30) return false;
    return /^did:/.test(value) || /^urn:uuid:/.test(value) || /^https?:\/\//.test(value);
};

const ZERO_FORMATTED_DATE: FormattedDate = {
    long: '',
    medium: '',
    short: '',
    iso: '',
    year: '',
    month: '',
    day: '',
    weekday: '',
    relative: '',
    time: '',
    datetime: '',
};

const buildDateFormat = (iso: string, options: FormatAliasesOptions): FormattedDate => {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return { ...ZERO_FORMATTED_DATE, long: iso };

    const locale = options.locale ?? defaultLocale();
    const timeZone = options.timeZone;
    const baseOpts = timeZone ? { timeZone } : {};

    const safeFormat = (opts: Intl.DateTimeFormatOptions): string => {
        try {
            return new Intl.DateTimeFormat(locale, { ...baseOpts, ...opts }).format(date);
        } catch {
            return '';
        }
    };

    return {
        long: safeFormat({ year: 'numeric', month: 'long', day: 'numeric' }),
        medium: safeFormat({ year: 'numeric', month: 'short', day: 'numeric' }),
        short: safeFormat({ year: 'numeric', month: '2-digit', day: '2-digit' }),
        iso: date.toISOString().slice(0, 10),
        year: safeFormat({ year: 'numeric' }),
        month: safeFormat({ month: 'long' }),
        day: safeFormat({ day: 'numeric' }),
        weekday: safeFormat({ weekday: 'long' }),
        relative: buildRelative(date, options.now ?? new Date(), locale),
        time: safeFormat({ hour: 'numeric', minute: '2-digit' }),
        datetime: safeFormat({ dateStyle: 'medium', timeStyle: 'short' }),
    };
};

const buildRelative = (date: Date, now: Date, locale: string): string => {
    if (typeof Intl.RelativeTimeFormat === 'undefined') {
        try {
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }).format(date);
        } catch {
            return '';
        }
    }
    const diffMs = date.getTime() - now.getTime();
    const diffSec = diffMs / 1000;
    const diffMin = diffSec / 60;
    const diffHour = diffMin / 60;
    const diffDay = diffHour / 24;
    const diffMonth = diffDay / 30.44;
    const diffYear = diffDay / 365.25;

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffYear) >= 1) return rtf.format(Math.round(diffYear), 'year');
    if (Math.abs(diffMonth) >= 1) return rtf.format(Math.round(diffMonth), 'month');
    if (Math.abs(diffDay) >= 1) return rtf.format(Math.round(diffDay), 'day');
    if (Math.abs(diffHour) >= 1) return rtf.format(Math.round(diffHour), 'hour');
    if (Math.abs(diffMin) >= 1) return rtf.format(Math.round(diffMin), 'minute');
    return rtf.format(Math.round(diffSec), 'second');
};

const truncateMiddle = (value: string, frontLen = 12, backLen = 4): string => {
    if (value.length <= frontLen + backLen + 3) return value;
    return `${value.slice(0, frontLen)}…${value.slice(-backLen)}`;
};

const buildStringFormat = (value: string): FormattedString => ({
    short: truncateMiddle(value),
    long: value,
});

const isUnsafeKey = (key: string): boolean =>
    key === '__proto__' || key === 'constructor' || key === 'prototype';

const defaultLocale = (): string => {
    if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
    return 'en-US';
};

export const buildFormattedValues = (
    data: Record<string, unknown>,
    options: FormatAliasesOptions = {}
): Record<string, unknown> => {
    const out: Record<string, unknown> = Object.create(null);
    for (const [key, value] of Object.entries(data)) {
        if (isUnsafeKey(key)) continue;
        if (typeof value === 'string') {
            if (isIsoDate(value)) {
                out[key] = buildDateFormat(value, options);
            } else if (looksLikeLongIdentifier(value)) {
                out[key] = buildStringFormat(value);
            }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            const nested = buildFormattedValues(value as Record<string, unknown>, options);
            if (Object.keys(nested).length > 0) out[key] = nested;
        }
    }
    return out;
};

export const DATE_FORMAT_KEYS = [
    'long',
    'medium',
    'short',
    'iso',
    'year',
    'month',
    'day',
    'weekday',
    'relative',
    'time',
    'datetime',
] as const;

export const STRING_FORMAT_KEYS = ['short', 'long'] as const;

export type DateFormatKey = (typeof DATE_FORMAT_KEYS)[number];
export type StringFormatKey = (typeof STRING_FORMAT_KEYS)[number];

/**
 * Classify a value for the format picker. Returns `'date'` for ISO 8601 timestamps,
 * `'identifier'` for long DIDs/URNs/URLs, `null` otherwise. Used by the binding picker
 * to decide which format options to surface in the UI.
 */
export const classifyFormattable = (
    value: unknown
): 'date' | 'identifier' | null => {
    if (typeof value !== 'string') return null;
    if (isIsoDate(value)) return 'date';
    if (looksLikeLongIdentifier(value)) return 'identifier';
    return null;
};

/**
 * Human-readable labels for date format keys. Used by the binding picker to show users
 * what each option produces (e.g. `'long'` → "July 1, 2024 (long)").
 */
export const DATE_FORMAT_LABELS: Record<DateFormatKey, string> = {
    long: 'Long (July 1, 2024)',
    medium: 'Medium (Jul 1, 2024)',
    short: 'Short (07/01/2024)',
    iso: 'ISO (2024-07-01)',
    year: 'Year only',
    month: 'Month only',
    day: 'Day only',
    weekday: 'Weekday',
    relative: 'Relative (5 months ago)',
    time: 'Time of day',
    datetime: 'Date + time',
};

export const STRING_FORMAT_LABELS: Record<StringFormatKey, string> = {
    short: 'Truncated (did:key:z6…tBz)',
    long: 'Full',
};
