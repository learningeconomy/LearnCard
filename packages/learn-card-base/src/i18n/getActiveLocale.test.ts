import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getActiveLocale } from './index';

const store: Record<string, string> = {};

beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
    });
});

describe('getActiveLocale', () => {
    it('returns the stored locale', () => {
        store['i18n.language'] = 'es';
        expect(getActiveLocale()).toBe('es');
    });

    it('strips characters that could inject extra URL query params', () => {
        // The value is interpolated into `&locale=...` request URLs; a crafted
        // localStorage entry must not be able to smuggle in `&did=...` etc.
        store['i18n.language'] = 'en&did=attacker';
        const result = getActiveLocale();
        expect(result).not.toContain('&');
        expect(result).not.toContain('=');
        expect(result).toBe('endidattacker');
    });

    it('falls back to en for an all-invalid value', () => {
        store['i18n.language'] = '%%%';
        expect(getActiveLocale()).toBe('en');
    });

    it('falls back to en when unset', () => {
        expect(getActiveLocale()).toBe('en');
    });
});
