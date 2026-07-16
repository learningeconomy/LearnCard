import countries from '../../../constants/countries.json';

const COUNTRY_CODES = new Set(Object.keys(countries as Record<string, string>));

const extractRegion = (tag: string | undefined): string | null => {
    if (!tag) return null;

    for (const part of tag.split('-').slice(1)) {
        const region = part.toUpperCase();
        if (/^[A-Z]{2}$/.test(region) && COUNTRY_CODES.has(region)) {
            return region;
        }
    }

    return null;
};

export const inferCountryCode = (): string | null => {
    if (typeof navigator === 'undefined') return null;

    const tags: string[] = [];
    if (Array.isArray(navigator.languages)) tags.push(...navigator.languages);
    if (navigator.language) tags.push(navigator.language);

    for (const tag of tags) {
        const region = extractRegion(tag);
        if (region) return region;
    }

    return null;
};

export default inferCountryCode;
