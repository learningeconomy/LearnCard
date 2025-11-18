// Centralized GDPR age-of-consent thresholds for EU countries
// Keyed by country display name (as used in countries.json)

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
