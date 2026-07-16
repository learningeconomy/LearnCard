import { afterEach, describe, expect, it, vi } from 'vitest';

import { inferCountryCode } from './countryInference';

const stubNavigator = (nav: { language?: string; languages?: string[] }) => {
    vi.stubGlobal('navigator', nav);
};

describe('inferCountryCode', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('extracts the region from navigator.language', () => {
        stubNavigator({ language: 'en-US', languages: [] });
        expect(inferCountryCode()).toBe('US');
    });

    it('prefers the first valid region found in navigator.languages', () => {
        stubNavigator({ language: 'en', languages: ['en', 'pt-BR'] });
        expect(inferCountryCode()).toBe('BR');
    });

    it('skips script subtags and finds the region (zh-Hant-TW)', () => {
        stubNavigator({ language: 'zh-Hant-TW', languages: ['zh-Hant-TW'] });
        expect(inferCountryCode()).toBe('TW');
    });

    it('returns null when the locale has no region', () => {
        stubNavigator({ language: 'en', languages: ['en'] });
        expect(inferCountryCode()).toBeNull();
    });

    it('returns null for a region not in the known country list', () => {
        stubNavigator({ language: 'en-ZZ', languages: ['en-ZZ'] });
        expect(inferCountryCode()).toBeNull();
    });
});
