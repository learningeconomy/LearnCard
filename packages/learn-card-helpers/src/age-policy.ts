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
    const match =
        /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(
            dob
        );
    if (!match) return Number.NaN;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4] ?? 0);
    const minute = Number(match[5] ?? 0);
    const second = Number(match[6] ?? 0);
    const birth = new Date(Date.UTC(year, month - 1, day));
    if (
        birth.getUTCFullYear() !== year ||
        birth.getUTCMonth() !== month - 1 ||
        birth.getUTCDate() !== day ||
        hour > 23 ||
        minute > 59 ||
        second > 59 ||
        (dob.includes('T') && !Number.isFinite(Date.parse(dob)))
    ) {
        return Number.NaN;
    }
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
