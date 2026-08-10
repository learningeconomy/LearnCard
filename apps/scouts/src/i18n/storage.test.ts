import { describe, expect, it } from 'vitest';

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
            ['i18n.language', 'ar'],
            ['auth-token', 'secret'],
            ['cached-profile', 'profile'],
        ]);

        clearStoragePreservingLocale(storage);

        expect(Object.fromEntries(values)).toEqual({ 'i18n.language': 'ar' });
    });

    it('leaves storage empty when no locale was selected', () => {
        const { storage, values } = createStorage([['auth-token', 'secret']]);

        clearStoragePreservingLocale(storage);

        expect(values.size).toBe(0);
    });
});
