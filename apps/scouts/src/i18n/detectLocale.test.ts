import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    detectInitialLocaleSync,
    getEffectiveSupportedLanguages,
    setTenantDefaultLocaleCache,
    setTenantSupportedLanguagesCache,
} from './detectLocale';

const COMPILED_LANGUAGES = ['en', 'es', 'fr', 'ar'] as const;

describe('getEffectiveSupportedLanguages', () => {
    afterEach(() => {
        setTenantSupportedLanguagesCache(undefined);
        setTenantDefaultLocaleCache(undefined);
        vi.unstubAllGlobals();
    });

    it('intersects compiled languages with the active tenant configuration', () => {
        setTenantSupportedLanguagesCache(['en', 'fr']);

        expect(getEffectiveSupportedLanguages(COMPILED_LANGUAGES)).toEqual(['en', 'fr']);
    });

    it('returns all compiled languages when tenant configuration is unavailable', () => {
        setTenantSupportedLanguagesCache(undefined);

        expect(getEffectiveSupportedLanguages(COMPILED_LANGUAGES)).toEqual(COMPILED_LANGUAGES);
    });

    it('returns all compiled languages when the configured intersection is empty', () => {
        setTenantSupportedLanguagesCache(['de']);

        expect(getEffectiveSupportedLanguages(COMPILED_LANGUAGES)).toEqual(COMPILED_LANGUAGES);
    });

    it('uses the first supported browser language from the complete preference list', () => {
        vi.stubGlobal('navigator', {
            language: 'de-DE',
            languages: ['de-DE', 'es-ES', 'fr-FR'],
        });

        expect(detectInitialLocaleSync(COMPILED_LANGUAGES)).toBe('es');
    });
});
