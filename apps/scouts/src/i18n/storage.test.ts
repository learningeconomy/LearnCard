import { describe, expect, it } from 'vitest';

import { decideLocaleSync } from './localeSync';
import {
    LOCALE_STORAGE_KEY,
    MANUAL_LOCALE_STORAGE_KEY,
    readManualLocaleChoice,
} from './localeStorage';
import { clearStoragePreservingLocale } from './storage';

const createStorage = (entries: Array<[string, string]>) => {
    const values = new Map(entries);

    return {
        values,
        storage: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            clear: () => values.clear(),
        },
    };
};

describe('clearStoragePreservingLocale', () => {
    it('clears session data while retaining the selected locale', () => {
        const { storage, values } = createStorage([
            [LOCALE_STORAGE_KEY, 'ar'],
            [MANUAL_LOCALE_STORAGE_KEY, 'ar'],
            ['auth-token', 'secret'],
            ['cached-profile', 'profile'],
        ]);

        clearStoragePreservingLocale(storage);

        expect(Object.fromEntries(values)).toEqual({ [LOCALE_STORAGE_KEY]: 'ar' });
    });

    it('leaves storage empty when no locale was selected', () => {
        const { storage, values } = createStorage([['auth-token', 'secret']]);

        clearStoragePreservingLocale(storage);

        expect(values.size).toBe(0);
    });

    it('restores the next account profile locale instead of treating the previous choice as manual', () => {
        const { storage } = createStorage([
            [LOCALE_STORAGE_KEY, 'fr'],
            [MANUAL_LOCALE_STORAGE_KEY, 'fr'],
        ]);

        clearStoragePreservingLocale(storage);

        expect(readManualLocaleChoice(storage)).toBeUndefined();
        expect(decideLocaleSync('fr', 'es', !!readManualLocaleChoice(storage))).toEqual({
            action: 'restore',
            locale: 'es',
        });
    });

    it('does not abort logout cleanup when storage access throws', () => {
        const storage = {
            getItem: () => {
                throw new DOMException('Storage disabled', 'SecurityError');
            },
            setItem: () => {
                throw new DOMException('Storage disabled', 'SecurityError');
            },
            clear: () => {
                throw new DOMException('Storage disabled', 'SecurityError');
            },
        };

        expect(() => clearStoragePreservingLocale(storage)).not.toThrow();
    });
});
