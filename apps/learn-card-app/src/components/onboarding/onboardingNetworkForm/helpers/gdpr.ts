import countries from '../../../../constants/countries.json';
import { GDPR_AGE_LIMIT, DEFAULT_EU_AGE_LIMIT } from 'learn-card-base/constants/gdprAgeLimits';

const COUNTRIES: Record<string, string> = countries as Record<string, string>;

// ISO 3166-1 alpha-2 codes for EU member countries
const EU_COUNTRY_CODES = [
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

export const getGdprAgeLimit = (countryCode?: string): number => {
    if (!countryCode) return DEFAULT_EU_AGE_LIMIT;
    const label = COUNTRIES[countryCode];
    return GDPR_AGE_LIMIT[label] ?? DEFAULT_EU_AGE_LIMIT;
};

export const requiresEUParentalConsent = (countryCode: string, age: number): boolean => {
    if (!EU_COUNTRY_CODES.includes(countryCode)) return false;
    const limit = getGdprAgeLimit(countryCode);
    return age >= 13 && age <= 17 && age < limit;
};

export const isEUCountry = (countryCode: string): boolean => EU_COUNTRY_CODES.includes(countryCode);
