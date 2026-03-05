// Centralized GDPR age-of-consent thresholds for EU countries
// Keyed by country display name (as used in apps/*/src/constants/countries.json)

export const GDPR_AGE_LIMIT: Record<string, number> = {
    Germany: 16,
    France: 15,
    Spain: 14,
    Ireland: 13,
    Netherlands: 16,
    Austria: 14,
    Italy: 14,
    Sweden: 13,
    // Add more as needed
};

// Default age limit for unlisted EU countries
export const DEFAULT_EU_AGE_LIMIT = 16;

// Same thresholds keyed by ISO 3166-1 alpha-2 country code
export const GDPR_AGE_LIMIT_BY_CODE: Record<string, number> = {
    DE: 16, // Germany
    FR: 15, // France
    ES: 14, // Spain
    IE: 13, // Ireland
    NL: 16, // Netherlands
    AT: 14, // Austria
    IT: 14, // Italy
    SE: 13, // Sweden
};

// ISO 3166-1 alpha-2 codes for EU member countries
export const EU_COUNTRY_CODES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
];

/**
 * Returns the minor-age threshold for a given country.
 * EU countries use their GDPR age-of-consent (14–16); all others default to 18.
 */
export const getMinorAgeThreshold = (countryCode?: string): number => {
    if (countryCode && EU_COUNTRY_CODES.includes(countryCode)) {
        return GDPR_AGE_LIMIT_BY_CODE[countryCode] ?? DEFAULT_EU_AGE_LIMIT;
    }
    return 18;
};
