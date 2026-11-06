import { describe, expect, it } from 'vitest';
import { CredentialDisplayValidator, LCNProfileValidator, LCNPublicProfileValidator } from './lcn';

const baseProfile = {
    profileId: 'issuer-org',
    did: 'did:web:example.com:users:issuer-org',
};

describe('LinkedIn organization ID profile field', () => {
    it('accepts numeric IDs and includes them in public profile projections', () => {
        const profile = LCNProfileValidator.parse({
            ...baseProfile,
            linkedInOrganizationId: '123456789',
            bio: 'private bio',
        });

        expect(profile.linkedInOrganizationId).toBe('123456789');
        expect(LCNPublicProfileValidator.parse(profile)).toMatchObject({
            profileId: 'issuer-org',
            linkedInOrganizationId: '123456789',
        });
        expect(LCNPublicProfileValidator.parse(profile)).not.toHaveProperty('bio');
    });

    it.each(['', 'company-page', '123abc', '-123'])(
        'rejects non-numeric ID %j',
        linkedInOrganizationId => {
            expect(() =>
                LCNProfileValidator.parse({ ...baseProfile, linkedInOrganizationId })
            ).toThrow();
        }
    );

    it('allows the field to be omitted', () => {
        expect(LCNProfileValidator.parse(baseProfile)).not.toHaveProperty('linkedInOrganizationId');
    });
});

describe('CredentialDisplayValidator image URL', () => {
    it('accepts an https image URL', () => {
        const display = CredentialDisplayValidator.parse({
            image: 'https://example.com/badge.png',
        });

        expect(display.image).toBe('https://example.com/badge.png');
    });

    it.each([
        'http://example.com/badge.png',
        'javascript:alert(1)',
        'data:image/png;base64,iVBORw0KGgo=',
        'file:///etc/passwd',
    ])('rejects a non-https image URL %j', image => {
        expect(() => CredentialDisplayValidator.parse({ image })).toThrow();
    });

    it('rejects an image URL longer than 2048 characters', () => {
        const image = `https://example.com/${'a'.repeat(2048)}`;

        expect(() => CredentialDisplayValidator.parse({ image })).toThrow();
    });

    it('allows image to be omitted', () => {
        expect(CredentialDisplayValidator.parse({})).not.toHaveProperty('image');
    });
});
