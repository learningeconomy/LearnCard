import { describe, expect, it, vi } from 'vitest';

import { applyLocaleChange } from './localeChange';
import { LOCALE_STORAGE_KEY, MANUAL_LOCALE_STORAGE_KEY } from './localeStorage';

describe('applyLocaleChange', () => {
    it('changes the active locale even when persistence throws', () => {
        const events: string[] = [];
        const setRuntimeLocale = vi.fn((locale: string) => events.push(`runtime:${locale}`));
        const setReactLocale = vi.fn((locale: string) => events.push(`react:${locale}`));
        const storage = {
            setItem: vi.fn(() => {
                events.push('storage');
                throw new DOMException('Storage disabled', 'SecurityError');
            }),
            removeItem: vi.fn(),
        };

        expect(() =>
            applyLocaleChange('fr', setRuntimeLocale, setReactLocale, storage)
        ).not.toThrow();
        expect(events).toEqual(['runtime:fr', 'react:fr', 'storage']);
    });

    it('records an explicit locale choice separately from the effective locale', () => {
        const values = new Map<string, string>();
        const storage = {
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        };

        applyLocaleChange('fr', vi.fn(), vi.fn(), storage);

        expect(Object.fromEntries(values)).toEqual({
            [LOCALE_STORAGE_KEY]: 'fr',
            [MANUAL_LOCALE_STORAGE_KEY]: 'fr',
        });
    });

    it('clears the manual-choice marker for an automatic locale change', () => {
        const values = new Map<string, string>([[MANUAL_LOCALE_STORAGE_KEY, 'fr']]);
        const storage = {
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        };

        applyLocaleChange('en', vi.fn(), vi.fn(), storage, { manual: false });

        expect(values.get(LOCALE_STORAGE_KEY)).toBe('en');
        expect(values.has(MANUAL_LOCALE_STORAGE_KEY)).toBe(false);
    });
});
