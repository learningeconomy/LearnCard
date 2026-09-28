import { describe, expect, it } from 'vitest';

import {
    buildCredentialUpdatedEmailModel,
    chooseCredentialRefreshEmailTarget,
    extractBoundedCredentialDisplayTitle,
    MAX_CREDENTIAL_DISPLAY_TITLE_LENGTH,
} from './credential-refresh-email-content.helpers';

const email = (value: string, { verified = true, primary = false } = {}) => ({
    type: 'email',
    value,
    isVerified: verified,
    isPrimary: primary,
});

const phone = (value: string) => ({
    type: 'phone',
    value,
    isVerified: true,
    isPrimary: true,
});

describe('extractBoundedCredentialDisplayTitle', () => {
    it('returns a trimmed, whitespace-collapsed title', () => {
        expect(extractBoundedCredentialDisplayTitle('  Introduction \n to\tBiology  ')).toBe(
            'Introduction to Biology'
        );
    });

    it('removes control characters', () => {
        expect(extractBoundedCredentialDisplayTitle('Biology\u0000\u0007 101')).toBe('Biology 101');
    });

    it('truncates to the bounded maximum length', () => {
        const long = 'x'.repeat(MAX_CREDENTIAL_DISPLAY_TITLE_LENGTH + 50);
        const result = extractBoundedCredentialDisplayTitle(long);

        expect(result).toHaveLength(MAX_CREDENTIAL_DISPLAY_TITLE_LENGTH);
    });

    it('honors an explicit maximum length', () => {
        expect(extractBoundedCredentialDisplayTitle('abcdef', 3)).toBe('abc');
    });

    it.each([undefined, null, '', '   ', 42, {}, []])(
        'returns undefined for a non-title value (%s)',
        value => {
            expect(extractBoundedCredentialDisplayTitle(value)).toBeUndefined();
        }
    );

    it('returns undefined when only whitespace remains after sanitization', () => {
        expect(extractBoundedCredentialDisplayTitle('\u0000 \n\u0007')).toBeUndefined();
    });
});

describe('chooseCredentialRefreshEmailTarget', () => {
    it('resolves a verified holder email for an unmanaged holder', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: { locale: 'es' },
            holderContactMethods: [email('holder@example.com')],
            managers: [],
        });

        expect(result).toEqual({
            status: 'resolved',
            kind: 'holder',
            locale: 'es',
            contactMethod: { type: 'email', value: 'holder@example.com' },
        });
    });

    it('prefers the verified primary holder email', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: {},
            holderContactMethods: [
                email('secondary@example.com'),
                email('primary@example.com', { primary: true }),
            ],
            managers: [],
        });

        expect(result).toMatchObject({
            status: 'resolved',
            contactMethod: { value: 'primary@example.com' },
        });
    });

    it('never uses an unverified holder email', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: {},
            holderContactMethods: [
                email('unverified@example.com', { verified: false }),
                email('verified@example.com'),
            ],
            managers: [],
        });

        expect(result).toMatchObject({
            status: 'resolved',
            contactMethod: { value: 'verified@example.com' },
        });
    });

    it('ignores non-email contact methods', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: {},
            holderContactMethods: [phone('+15555550100')],
            managers: [],
        });

        expect(result).toEqual({ status: 'skipped', reason: 'no-verified-holder-email' });
    });

    it('skips an unmanaged holder with no verified email', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: {},
            holderContactMethods: [],
            managers: [],
        });

        expect(result).toEqual({ status: 'skipped', reason: 'no-verified-holder-email' });
    });

    it('routes a managed child to the verified guardian email, never the child', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: { locale: 'en' },
            holderContactMethods: [email('child@example.com')],
            managers: [
                {
                    locale: 'fr',
                    contactMethods: [email('guardian@example.com')],
                },
            ],
        });

        expect(result).toEqual({
            status: 'resolved',
            kind: 'guardian',
            locale: 'fr',
            contactMethod: { type: 'email', value: 'guardian@example.com' },
        });
        expect(JSON.stringify(result)).not.toContain('child@example.com');
    });

    it('skips a managed child when no guardian has a verified email', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: {},
            holderContactMethods: [email('child@example.com')],
            managers: [
                { contactMethods: [email('guardian@example.com', { verified: false })] },
                { contactMethods: [] },
            ],
        });

        expect(result).toEqual({ status: 'skipped', reason: 'no-verified-guardian-email' });
    });

    it('skips a managed child even when the child has a verified email', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: {},
            holderContactMethods: [email('child@example.com')],
            managers: [{ contactMethods: [] }],
        });

        expect(result).toEqual({ status: 'skipped', reason: 'no-verified-guardian-email' });
    });

    it('prefers a primary verified guardian email across managers', () => {
        const result = chooseCredentialRefreshEmailTarget({
            holder: {},
            holderContactMethods: [],
            managers: [
                { contactMethods: [email('guardian-a@example.com')] },
                {
                    contactMethods: [
                        email('guardian-b@example.com', { primary: true }),
                        email('guardian-b2@example.com'),
                    ],
                },
            ],
        });

        expect(result).toMatchObject({
            status: 'resolved',
            kind: 'guardian',
            contactMethod: { value: 'guardian-b@example.com' },
        });
    });
});

describe('buildCredentialUpdatedEmailModel', () => {
    it('includes the issuer display name and credential title', () => {
        expect(
            buildCredentialUpdatedEmailModel({
                issuerDisplayName: 'Inbox Demo School',
                credentialTitle: 'Introduction to Biology',
            })
        ).toEqual({
            issuer: { name: 'Inbox Demo School' },
            credential: { name: 'Introduction to Biology' },
        });
    });

    it('omits the credential title when unavailable', () => {
        expect(
            buildCredentialUpdatedEmailModel({
                issuerDisplayName: 'Inbox Demo School',
            })
        ).toEqual({ issuer: { name: 'Inbox Demo School' } });
    });

    it('does not include any other credential content', () => {
        const model = buildCredentialUpdatedEmailModel({
            issuerDisplayName: 'Inbox Demo School',
            credentialTitle: 'Introduction to Biology',
        });

        expect(Object.keys(model).sort()).toEqual(['credential', 'issuer']);
    });
});
