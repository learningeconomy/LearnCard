import moment from 'moment';

// Canonical GDPR age-of-consent thresholds for EU countries.
export const GDPR_AGE_LIMIT: Record<string, number> = {
    Germany: 16,
    France: 15,
    Spain: 14,
    Ireland: 13,
    Netherlands: 16,
    Austria: 14,
    Italy: 14,
    Sweden: 13,
};

export const DEFAULT_EU_AGE_LIMIT = 16;
export const GDPR_AGE_LIMIT_BY_CODE: Record<string, number> = {
    DE: 16,
    FR: 15,
    ES: 14,
    IE: 13,
    NL: 16,
    AT: 14,
    IT: 14,
    SE: 13,
};

export const EU_COUNTRY_CODES = [
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
];

/** EU countries use the established GDPR threshold; other countries default to 18. */
export const getMinorAgeThreshold = (countryCode?: string): number => {
    if (countryCode && EU_COUNTRY_CODES.includes(countryCode)) {
        return GDPR_AGE_LIMIT_BY_CODE[countryCode] ?? DEFAULT_EU_AGE_LIMIT;
    }
    return 18;
};

/** Returns completed years for a valid ISO date/timestamp, or NaN if invalid/future. */
export const calculateAgeFromISODate = (dob: string, now: Date = new Date()): number => {
    // Keep the ISO forms accepted by the existing profile/forms parser, including
    // compact, week and ordinal dates. parseZone preserves the DOB's calendar day
    // instead of shifting it with the browser/server timezone.
    const parsed = moment.parseZone(dob, moment.ISO_8601, true);
    if (!parsed.isValid()) return Number.NaN;
    const year = parsed.year();
    const month = parsed.month() + 1;
    const day = parsed.date();
    const birth = new Date(0);
    birth.setUTCFullYear(year, month - 1, day);
    birth.setUTCHours(0, 0, 0, 0);
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (birth > today) return Number.NaN;
    let age = today.getUTCFullYear() - year;
    if (
        today.getUTCMonth() < month - 1 ||
        (today.getUTCMonth() === month - 1 && today.getUTCDate() < day)
    ) {
        age--;
    }
    return age;
};
