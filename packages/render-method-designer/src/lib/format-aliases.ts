/**
 * `renderValues` mirror for the designer's preview pipeline.
 *
 * Deliberate duplicate of `packages/plugins/render-method/src/format-aliases.ts`. Both
 * produce the same `renderValues` shape so the designer preview and the eventually-issued
 * credential render identically.
 */

export interface RenderValuesOptions {
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

const isImageFieldKey = (key: string): boolean => key.toLowerCase() === 'image';

const looksLikeImageObject = (value: Record<string, unknown>): value is { id: string } =>
    typeof value.id === 'string' && value.id.length > 0 && (typeof value.type === 'string' || 'caption' in value);

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

const defaultLocale = (): string => {
    if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
    return 'en-US';
};

const buildDateFormat = (iso: string, options: RenderValuesOptions): FormattedDate => {
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

const resolveImageLike = (value: unknown): string | null => {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    return typeof record.id === 'string' ? record.id : null;
};

export const buildRenderValues = (
    data: Record<string, unknown>,
    options: RenderValuesOptions = {}
): Record<string, unknown> => {
    const out: Record<string, unknown> = Object.create(null);
    for (const [key, value] of Object.entries(data)) {
        if (isUnsafeKey(key)) continue;

        if (typeof value === 'string') {
            if (isImageFieldKey(key)) {
                out[key] = { resolved: value };
            } else if (isIsoDate(value)) {
                out[key] = { formatted: buildDateFormat(value, options) };
            } else if (looksLikeLongIdentifier(value)) {
                out[key] = { formatted: buildStringFormat(value) };
            }
            continue;
        }

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (isImageFieldKey(key) && looksLikeImageObject(value as Record<string, unknown>)) {
                const nested = buildRenderValues(value as Record<string, unknown>, options);
                out[key] = { resolved: (value as { id: string }).id, ...nested };
                continue;
            }
            const nested = buildRenderValues(value as Record<string, unknown>, options);
            if (Object.keys(nested).length > 0) out[key] = nested;
        }
    }
    return out;
};

export const DATE_FORMAT_KEYS = [
    'long', 'medium', 'short', 'iso', 'year', 'month', 'day', 'weekday', 'relative', 'time', 'datetime',
] as const;
export const STRING_FORMAT_KEYS = ['short', 'long'] as const;
export type DateFormatKey = (typeof DATE_FORMAT_KEYS)[number];
export type StringFormatKey = (typeof STRING_FORMAT_KEYS)[number];

export const classifyFormattable = (value: unknown): 'date' | 'identifier' | null => {
    if (typeof value !== 'string') return null;
    if (isIsoDate(value)) return 'date';
    if (looksLikeLongIdentifier(value)) return 'identifier';
    return null;
};

export const classifyResolvable = (key: string, value: unknown): 'image' | null => {
    if (!isImageFieldKey(key)) return null;
    return resolveImageLike(value) ? 'image' : null;
};

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
