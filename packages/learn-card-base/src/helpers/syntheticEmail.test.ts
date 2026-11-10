import { describe, expect, it } from 'vitest';
import { getContactEmail, isSyntheticEmail, SYNTHETIC_EMAIL_DOMAIN } from './syntheticEmail';

describe('synthetic ClassLink emails', () => {
    it('recognises the placeholder domain lca-api assigns', () => {
        expect(SYNTHETIC_EMAIL_DOMAIN).toBe('users.classlink.invalid');
        expect(isSyntheticEmail('AbC123@users.classlink.invalid')).toBe(true);
        expect(isSyntheticEmail(' abc@USERS.CLASSLINK.INVALID ')).toBe(true);
    });

    it('does not flag real or look-alike addresses', () => {
        expect(isSyntheticEmail('student@school.org')).toBe(false);
        expect(isSyntheticEmail('x@notusers.classlink.invalid')).toBe(false);
        expect(isSyntheticEmail('users.classlink.invalid')).toBe(false);
        expect(isSyntheticEmail(undefined)).toBe(false);
        expect(isSyntheticEmail(null)).toBe(false);
        expect(isSyntheticEmail('')).toBe(false);
    });

    it('treats a synthetic email as no contact email', () => {
        expect(getContactEmail('u1@users.classlink.invalid')).toBeUndefined();
        expect(getContactEmail('')).toBeUndefined();
        expect(getContactEmail(null)).toBeUndefined();
        expect(getContactEmail('student@school.org')).toBe('student@school.org');
    });
});
