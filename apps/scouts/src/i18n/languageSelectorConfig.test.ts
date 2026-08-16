import { describe, it, expect } from 'vitest';

import { resolveLanguageSelectorConfig } from './languageSelectorConfig';
import { SUPPORTED_LANGUAGES } from './index';

// Sanity: tests assume the canonical supported set is [en, es, fr, ar].
const ALL = [...SUPPORTED_LANGUAGES];

describe('resolveLanguageSelectorConfig', () => {
    it('shows everything when the flag is undefined (LD unreachable)', () => {
        const config = resolveLanguageSelectorConfig(undefined);
        expect(config.hideSelector).toBe(false);
        expect(config.visibleLanguages).toEqual(ALL);
        expect(config.hiddenLanguages).toEqual([]);
    });

    it('shows everything for an empty array (default served value)', () => {
        const config = resolveLanguageSelectorConfig([]);
        expect(config.hideSelector).toBe(false);
        expect(config.visibleLanguages).toEqual(ALL);
        expect(config.hiddenLanguages).toEqual([]);
    });

    it('hides the listed languages and keeps the rest visible', () => {
        const config = resolveLanguageSelectorConfig(['fr', 'ar']);
        expect(config.hideSelector).toBe(false);
        expect(config.hiddenLanguages).toEqual(['fr', 'ar']);
        expect(config.visibleLanguages).toEqual(['en', 'es']);
    });

    it('preserves SUPPORTED_LANGUAGES order regardless of array order', () => {
        const config = resolveLanguageSelectorConfig(['ar', 'fr']);
        expect(config.hiddenLanguages).toEqual(['fr', 'ar']);
        expect(config.visibleLanguages).toEqual(['en', 'es']);
    });

    it('treats the "*" wildcard as an explicit kill-switch', () => {
        const config = resolveLanguageSelectorConfig(['*']);
        expect(config.hideSelector).toBe(true);
        expect(config.visibleLanguages).toEqual([]);
        expect(config.hiddenLanguages).toEqual(ALL);
    });

    it('hides the selector when ≤ 1 language remains visible', () => {
        const config = resolveLanguageSelectorConfig(['es', 'fr', 'ar']);
        expect(config.visibleLanguages).toEqual(['en']);
        expect(config.hideSelector).toBe(true);
    });

    it('hides the selector when every language is listed', () => {
        const config = resolveLanguageSelectorConfig(['en', 'es', 'fr', 'ar']);
        expect(config.visibleLanguages).toEqual([]);
        expect(config.hideSelector).toBe(true);
    });

    it('ignores unknown codes', () => {
        const config = resolveLanguageSelectorConfig(['xx', 'fr', 'zz']);
        expect(config.hiddenLanguages).toEqual(['fr']);
        expect(config.visibleLanguages).toEqual(['en', 'es', 'ar']);
        expect(config.hideSelector).toBe(false);
    });

    it('normalizes case and whitespace in entries', () => {
        const config = resolveLanguageSelectorConfig([' FR ', 'Ar']);
        expect(config.hiddenLanguages).toEqual(['fr', 'ar']);
        expect(config.visibleLanguages).toEqual(['en', 'es']);
    });

    it('honors a stray boolean true as hide-all (reconfiguration window)', () => {
        const config = resolveLanguageSelectorConfig(true);
        expect(config.hideSelector).toBe(true);
        expect(config.visibleLanguages).toEqual([]);
        expect(config.hiddenLanguages).toEqual(ALL);
    });

    it('honors a stray boolean false as show-all', () => {
        const config = resolveLanguageSelectorConfig(false);
        expect(config.hideSelector).toBe(false);
        expect(config.visibleLanguages).toEqual(ALL);
    });

    it('shows everything for malformed (non-array, non-boolean) values', () => {
        for (const bad of [{}, 'fr', 42, () => {}]) {
            const config = resolveLanguageSelectorConfig(bad);
            expect(config.hideSelector).toBe(false);
            expect(config.visibleLanguages).toEqual(ALL);
        }
    });

    it('ignores non-string array entries', () => {
        const config = resolveLanguageSelectorConfig(['fr', 5, null, { code: 'ar' }]);
        expect(config.hiddenLanguages).toEqual(['fr']);
    });
});
