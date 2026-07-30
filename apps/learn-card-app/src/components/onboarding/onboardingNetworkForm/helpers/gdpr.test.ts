import { describe, expect, it } from 'vitest';

import { requiresEUParentalConsent } from './gdpr';

describe('requiresEUParentalConsent', () => {
    it('requires consent for a user below the country threshold in France', () => {
        expect(requiresEUParentalConsent('FR', 14)).toBe(true);
    });

    it('does not require consent once the user reaches the country threshold', () => {
        expect(requiresEUParentalConsent('FR', 16)).toBe(false);
        expect(requiresEUParentalConsent('FR', 15)).toBe(false);
    });

    it('does not require consent for non-EU countries', () => {
        expect(requiresEUParentalConsent('US', 15)).toBe(false);
    });
});
