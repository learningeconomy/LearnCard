import { describe, it, expect, beforeEach, vi } from 'vitest';

import { addActiveLocaleToPayload, addActiveLocaleToUrl, getActiveLocale } from './index';

const store: Record<string, string> = {};

beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.stubGlobal('document', undefined);
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

    it('uses the persisted locale while the document locale is still stale during startup', () => {
        store['i18n.language'] = 'en';
        vi.stubGlobal('document', { documentElement: { lang: 'fr' } });

        expect(getActiveLocale()).toBe('en');
    });

    it('uses the live document locale when there is no persisted choice', () => {
        vi.stubGlobal('document', { documentElement: { lang: 'fr' } });

        expect(getActiveLocale()).toBe('fr');
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

describe('addActiveLocaleToUrl', () => {
    it('preserves existing parameters and adds the live locale', () => {
        vi.stubGlobal('document', { documentElement: { lang: 'ar' } });

        expect(addActiveLocaleToUrl('https://ai.example/threads/visibility?did=did:key:123')).toBe(
            'https://ai.example/threads/visibility?did=did%3Akey%3A123&locale=ar'
        );
    });
});

describe('addActiveLocaleToPayload', () => {
    it('adds the current locale without mutating the original payload', () => {
        store['i18n.language'] = 'fr';
        const payload = { action: 'continue_plan', threadId: 'thread-1' };

        expect(addActiveLocaleToPayload(payload)).toEqual({ ...payload, locale: 'fr' });
        expect(payload).not.toHaveProperty('locale');
    });
});
