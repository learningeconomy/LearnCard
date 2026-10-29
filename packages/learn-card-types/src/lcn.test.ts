import { describe, expect, it } from 'vitest';
import { LCNProfileValidator, LCNPublicProfileValidator } from './lcn';

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
