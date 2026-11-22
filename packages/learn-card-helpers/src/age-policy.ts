export { calculateAgeFromISODate } from './date-time';

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
