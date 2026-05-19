/**
 * The `formattedValues` convention.
 *
 * Mustache is intentionally logic-less, so the W3C VC Render Method spec gives template
 * authors no way to format dates, truncate DIDs, or apply locale-aware presentation. This
 * module fills that gap by producing a mirror of the credential keyed by `formattedValues`,
 * with pre-computed locale-aware variants for fields that look like ISO 8601 timestamps
 * or DIDs.
 *
 * The shape:
 *
 *     {
 *         validFrom: '2024-07-01T00:00:00Z',
 *         formattedValues: {
 *             validFrom: { long, medium, short, iso, year, month, day, weekday,
 *                          relative, time, datetime }
 *         }
 *     }
 *
 * The convention is intentionally additive — templates that ignore `formattedValues` still
 * work, and templates that reference it gracefully degrade to the raw field when a renderer
 * doesn't compute the mirror. The designer's emitter (`emit.ts`) generates the section-pair
 * fallback automatically.
 *
 * This is a LearnCard convention, not a W3C standard. The intent is to propose it (or
 * something like it) to the W3C VC Render Method WG once the convention is proven in
 * practice. Implementations that want byte-for-byte interop can import this module and
 * call `buildFormattedValues` on their data context.
 */

export interface FormatAliasesOptions {
    /** BCP 47 locale tag. Defaults to 'en-US'. Browser callers typically pass
     *  `navigator.language` from the wallet runtime. */
    locale?: string;
    /** IANA timezone (e.g. 'America/New_York'). Defaults to the host's timezone. */
    timeZone?: string;
    /** Stable 'now' for tests or for deterministic snapshot rendering. */
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
    /** Middle-ellipsized form for long identifiers (DIDs, URLs, hashes). */
    short: string;
    /** Pass-through of the original value. */
    long: string;
}

/**
 * Loose detector for ISO 8601 date/time strings. Accepts both date-only
 * (`2024-07-01`) and full timestamp variants. Intentionally strict — false positives are
 * worse than false negatives here because misclassified strings would render with `Invalid
 * Date` in the formatted variants.
 */
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

const buildDateFormat = (
    iso: string,
    options: FormatAliasesOptions
): FormattedDate => {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return { ...ZERO_FORMATTED_DATE, long: iso };

    const locale = options.locale ?? 'en-US';
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

/**
 * Relative-time formatter. Chooses the largest meaningful unit (years → months → days →
 * hours → minutes → seconds) using `Intl.RelativeTimeFormat`. Falls back to the medium
 * absolute date when `RelativeTimeFormat` is unavailable (older runtimes).
 */
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

/**
 * Middle-ellipsize a long string. Used for DIDs, UUIDs, URLs. Keeps the front and back
 * substrings recognizable (the DID method prefix and the last few characters of the
 * fingerprint are both useful identifiers).
 */
const truncateMiddle = (value: string, frontLen = 12, backLen = 4): string => {
    if (value.length <= frontLen + backLen + 3) return value;
    return `${value.slice(0, frontLen)}…${value.slice(-backLen)}`;
};

const buildStringFormat = (value: string): FormattedString => ({
    short: truncateMiddle(value),
    long: value,
});

/**
 * Prototype-pollution guard for keys that originate in untrusted credential data. Mirrors
 * the same `__proto__`/`constructor`/`prototype` deny-list used in `read.ts:resolvePointer`.
 */
const isUnsafeKey = (key: string): boolean =>
    key === '__proto__' || key === 'constructor' || key === 'prototype';

/**
 * Recursively walk a credential-shaped object and produce a `formattedValues` mirror.
 * Only ISO 8601 timestamps and long identifiers (DIDs, URNs, URLs) get formatted variants
 * — everything else is omitted from the mirror to keep the payload small.
 *
 * Arrays are skipped (we don't auto-format each item of `credentialSubject` when it's an
 * array — templates that need that can use Mustache section iteration).
 */
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

/**
 * Available format keys for ISO-date fields. Useful for UIs (e.g. the designer's binding
 * picker) that want to enumerate options.
 */
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

/** Available format keys for long-identifier fields. */
export const STRING_FORMAT_KEYS = ['short', 'long'] as const;

export type DateFormatKey = (typeof DATE_FORMAT_KEYS)[number];
export type StringFormatKey = (typeof STRING_FORMAT_KEYS)[number];

/**
 * Classify a value for format-picker UIs. Returns 'date' for ISO timestamps, 'identifier'
 * for long DIDs/URNs/URLs, null otherwise. This is the same heuristic
 * `buildFormattedValues` uses, exposed so consumers don't re-implement it.
 */
export const classifyFormattable = (
    value: unknown
): 'date' | 'identifier' | null => {
    if (typeof value !== 'string') return null;
    if (isIsoDate(value)) return 'date';
    if (looksLikeLongIdentifier(value)) return 'identifier';
    return null;
};
