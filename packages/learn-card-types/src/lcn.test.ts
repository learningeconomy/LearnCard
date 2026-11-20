import { describe, expect, it } from 'vitest';
import {
    ConsentFlowContractRequestStatusValidator,
    ContractRequestValidator,
    ContractSentRequestValidator,
    CredentialDisplayValidator,
    LCNProfileValidator,
    LCNPublicProfileValidator,
    SendContractRequestResultValidator,
    SendContractRequestValidator,
} from './lcn';

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

describe('contract request result and view validators', () => {
    const profile = { profileId: 'learner', did: 'did:web:example.com:users:learner' };

    it('accepts expired as a request status', () => {
        expect(ConsentFlowContractRequestStatusValidator.parse('expired')).toBe('expired');
        expect(ConsentFlowContractRequestStatusValidator.parse(null)).toBeNull();
    });

    it('parses a send result', () => {
        expect(
            SendContractRequestResultValidator.parse({ requestId: 'r1', status: 'pending' })
        ).toEqual({ requestId: 'r1', status: 'pending' });
        expect(SendContractRequestResultValidator.safeParse(true).success).toBe(false);
    });

    it('parses a request addressed to an email or to a profile', () => {
        expect(
            ContractRequestValidator.parse({
                requestId: 'r1',
                status: 'pending',
                target: { email: 'person@example.com' },
            }).target
        ).toEqual({ email: 'person@example.com' });
        expect(
            ContractRequestValidator.parse({
                requestId: 'r2',
                status: 'accepted',
                target: { profile },
            }).target
        ).toMatchObject({ profile: { profileId: 'learner' } });
        expect(
            ContractRequestValidator.safeParse({ requestId: 'r3', status: 'pending', target: {} })
                .success
        ).toBe(false);
    });

    it('allows a sent request without a profile', () => {
        expect(
            ContractSentRequestValidator.parse({
                requestId: 'r1',
                status: 'expired',
                target: { email: 'person@example.com' },
            })
        ).not.toHaveProperty('profile');
    });
});

describe('SendContractRequestValidator targets', () => {
    const contractUri = 'lc:network:example.com/trpc:contract:1';

    it('accepts exactly one of targetProfileId and targetEmail', () => {
        expect(
            SendContractRequestValidator.safeParse({ contractUri, targetProfileId: 'learner' })
                .success
        ).toBe(true);
        expect(
            SendContractRequestValidator.parse({ contractUri, targetEmail: ' Person@Example.com ' })
                .targetEmail
        ).toBe('Person@Example.com');
        expect(SendContractRequestValidator.safeParse({ contractUri }).success).toBe(false);
        expect(
            SendContractRequestValidator.safeParse({
                contractUri,
                targetProfileId: 'learner',
                targetEmail: 'person@example.com',
            }).success
        ).toBe(false);
    });

    it('rejects a malformed email', () => {
        expect(
            SendContractRequestValidator.safeParse({ contractUri, targetEmail: 'not-an-email' })
                .success
        ).toBe(false);
    });
});
