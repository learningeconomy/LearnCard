import { describe, expect, it } from 'vitest';

import {
    ACCEPTED_VERSION_PREDICATE,
    isConsentExpiryActive,
    isConsentUnexpired,
} from './consent-expiry.helpers';

const NOW = Date.parse('2026-06-01T00:00:00.000Z');
const PAST = '2026-05-31T23:59:59.000Z';
const FUTURE = '2026-06-01T00:00:01.000Z';

describe('isConsentExpiryActive', () => {
    it.each([undefined, null, '', '   '])('treats %j as no expiry', value => {
        expect(isConsentExpiryActive(value, NOW)).toBe(true);
    });

    it('is active before the date and expired at or after it', () => {
        expect(isConsentExpiryActive(FUTURE, NOW)).toBe(true);
        expect(isConsentExpiryActive(PAST, NOW)).toBe(false);
        expect(isConsentExpiryActive('2026-06-01T00:00:00.000Z', NOW)).toBe(false);
    });

    it('treats a value that cannot be parsed as expired', () => {
        expect(isConsentExpiryActive('not-a-date', NOW)).toBe(false);
    });
});

describe('isConsentUnexpired', () => {
    const base = {
        termsExpiresAt: undefined,
        hasAcceptedVersion: true,
        acceptedVersionExpiresAt: undefined,
    };

    it('is true without any expiry', () => {
        expect(isConsentUnexpired(base, NOW)).toBe(true);
    });

    it('expires with the terms', () => {
        expect(isConsentUnexpired({ ...base, termsExpiresAt: PAST }, NOW)).toBe(false);
        expect(isConsentUnexpired({ ...base, termsExpiresAt: FUTURE }, NOW)).toBe(true);
    });

    it('expires with the accepted contract version', () => {
        expect(isConsentUnexpired({ ...base, acceptedVersionExpiresAt: PAST }, NOW)).toBe(false);
        expect(isConsentUnexpired({ ...base, acceptedVersionExpiresAt: FUTURE }, NOW)).toBe(true);
    });

    it('is false when the accepted version does not exist', () => {
        expect(isConsentUnexpired({ ...base, hasAcceptedVersion: false }, NOW)).toBe(false);
    });
});

describe('ACCEPTED_VERSION_PREDICATE', () => {
    it('compares the version with the one the terms accepted, 1 by default', () => {
        expect(ACCEPTED_VERSION_PREDICATE).toBe(
            'accepted.version = coalesce(terms.consentedVersion, 1)'
        );
    });
});
