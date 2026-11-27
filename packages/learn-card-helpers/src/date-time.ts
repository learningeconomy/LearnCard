import { DateTime } from 'luxon';

// Keep the input shapes the previous strict ISO parser accepted. Luxon also
// accepts time-only values and combinations of reduced dates and times.
const EXTENDED_ISO =
    /^(?:(?:\d{4}|[+-]\d{6})-\d{2}-\d{2}|\d{4}-(?:W\d{2}-\d|\d{3}))(?:[T ]\d{2}(?::\d{2}(?::\d{2}(?:[.,]\d+)?)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/;
const BASIC_ISO =
    /^(?:(?:\d{4}|[+-]\d{6})\d{4}|\d{4}(?:W\d{3}|\d{3}))(?:[T ]\d{2}(?:\d{2}(?:\d{2}(?:[.,]\d+)?)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/;
const REDUCED_ISO = /^\d{4}(?:-?(?:\d{2}|W\d{2}))?$/;

/** Parses a legacy ISO value, honoring the provided offset or the caller's default zone. */
const parseLegacyISODateTime = (value: string, zone: 'local' | 'utc'): DateTime | undefined => {
    if (
        typeof value !== 'string' ||
        value.trim() !== value ||
        !(EXTENDED_ISO.test(value) || BASIC_ISO.test(value) || REDUCED_ISO.test(value))
    ) {
        return undefined;
    }

    const parsed = DateTime.fromISO(value.replace(' ', 'T'), { zone, setZone: true });

    if (!parsed.isValid) return undefined;
    if (parsed.zone.type !== 'system') return parsed;

    // Local Date and Moment pick the earlier instant when the clock repeats an hour.
    const [first = parsed, second] = parsed.getPossibleOffsets();
    if (second && second.toMillis() < first.toMillis()) return second;
    return first;
};

const asLocalDateTime = (value: string | Date): DateTime | undefined =>
    typeof value === 'string'
        ? parseLegacyISODateTime(value, 'local')?.setZone('local')
        : DateTime.fromJSDate(value, { zone: 'local' });

/** Validates the ISO date or date-time formats accepted by existing LearnCard forms. */
export const isValidISOString = (value: string): boolean =>
    parseLegacyISODateTime(value, 'utc') !== undefined;

/** Compares instants, interpreting an offset-less input in the device time zone. */
export const isFutureDate = (value: string | Date, now: Date = new Date()): boolean =>
    (asLocalDateTime(value)?.toMillis() ?? Number.NaN) > now.getTime();

/** Returns completed years under the app's local-time age rule, or NaN for invalid/future input. */
export const calculateLocalAge = (dob: string | Date, now: Date = new Date()): number => {
    const birth = asLocalDateTime(dob);
    const today = DateTime.fromJSDate(now, { zone: 'local' });

    if (!birth?.isValid || !today.isValid || birth.toMillis() > today.toMillis()) return Number.NaN;

    return Math.trunc(today.diff(birth, 'years').years);
};

/**
 * Counts completed years by the DOB's source calendar day and today's UTC day.
 * A February 29 birthday falls on March 1 in non-leap years under this policy.
 */
export const calculateAgeFromISODate = (dob: string, now: Date = new Date()): number => {
    const birth = parseLegacyISODateTime(dob, 'utc');
    const today = DateTime.fromJSDate(now, { zone: 'utc' });

    if (!birth || !today.isValid) return Number.NaN;

    const years = today.year - birth.year;
    const birthdayPending =
        today.month < birth.month || (today.month === birth.month && today.day < birth.day);

    if (years < 0 || (years === 0 && birthdayPending)) return Number.NaN;

    return years - Number(birthdayPending);
};
