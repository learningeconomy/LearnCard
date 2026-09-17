import { describe, expect, it } from 'vitest';
import { OrgSpecValidator } from './schema';

const validSpec = {
    issuer: {
        profileId: 'scde',
        displayName: 'South Carolina Department of Education',
        signingAuthority: { type: 'learncard-hosted', name: 'scde-clr' },
    },
    profileManager: {
        displayName: 'SC Districts',
        managed: [{ profileId: 'sc-greenville', displayName: 'Greenville County Schools' }],
    },
    serviceAccounts: [
        {
            name: 'ea-clr-issuer',
            scopes: ['inbox:write', 'inbox:read', 'credentials:write', 'credentials:read'],
            expiresAt: '2027-06-30',
        },
    ],
    webhooks: [{ url: 'https://clr.example.org/learncard/webhook' }],
};

describe('OrgSpecValidator', () => {
    it('accepts a fully-populated spec', () => {
        const result = OrgSpecValidator.safeParse(validSpec);
        expect(result.success).toBe(true);
    });

    it('accepts the minimal issuer-only spec', () => {
        const result = OrgSpecValidator.safeParse({ issuer: validSpec.issuer });
        expect(result.success).toBe(true);
    });

    it('rejects a self-hosted signing authority missing endpoint/did', () => {
        const result = OrgSpecValidator.safeParse({
            issuer: {
                ...validSpec.issuer,
                signingAuthority: { type: 'self-hosted', name: 'my-issuer' },
            },
        });
        expect(result.success).toBe(false);
    });

    it('accepts a valid self-hosted signing authority', () => {
        const result = OrgSpecValidator.safeParse({
            issuer: {
                ...validSpec.issuer,
                signingAuthority: {
                    type: 'self-hosted',
                    name: 'my-issuer',
                    endpoint: 'https://issuer.example/api',
                    did: 'did:web:issuer.example',
                },
            },
        });
        expect(result.success).toBe(true);
    });

    it('rejects an unknown scope resource', () => {
        const result = OrgSpecValidator.safeParse({
            ...validSpec,
            serviceAccounts: [{ name: 'ea-clr-issuer', scopes: ['unicorns:write'] }],
        });
        expect(result.success).toBe(false);
        if (!result.success)
            expect(
                result.error.issues.some(issue => issue.message.includes('Unknown scope resource'))
            ).toBe(true);
    });

    it('rejects a malformed scope action', () => {
        const result = OrgSpecValidator.safeParse({
            ...validSpec,
            serviceAccounts: [{ name: 'ea-clr-issuer', scopes: ['boosts:admin'] }],
        });
        expect(result.success).toBe(false);
    });

    it('rejects a signing authority name that is too long', () => {
        const result = OrgSpecValidator.safeParse({
            issuer: {
                ...validSpec.issuer,
                signingAuthority: { type: 'learncard-hosted', name: 'this-name-is-way-too-long' },
            },
        });
        expect(result.success).toBe(false);
    });

    it('rejects a signing authority name with uppercase or invalid characters', () => {
        const result = OrgSpecValidator.safeParse({
            issuer: {
                ...validSpec.issuer,
                signingAuthority: { type: 'learncard-hosted', name: 'SCDE_CLR' },
            },
        });
        expect(result.success).toBe(false);
    });

    it('rejects a profileId that is too short', () => {
        const result = OrgSpecValidator.safeParse({
            issuer: { ...validSpec.issuer, profileId: 'ab' },
        });
        expect(result.success).toBe(false);
    });

    it('rejects a profileId with uppercase or invalid characters', () => {
        const result = OrgSpecValidator.safeParse({
            issuer: { ...validSpec.issuer, profileId: 'SCDE_Org!' },
        });
        expect(result.success).toBe(false);
    });

    it('rejects a webhook URL that is not https', () => {
        const result = OrgSpecValidator.safeParse({
            ...validSpec,
            webhooks: [{ url: 'http://clr.example.org/webhook' }],
        });
        expect(result.success).toBe(false);
    });

    it('defaults profileManager.managed to an empty array when omitted', () => {
        const result = OrgSpecValidator.safeParse({
            issuer: validSpec.issuer,
            profileManager: { displayName: 'SC Districts' },
        });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.profileManager?.managed).toEqual([]);
    });
});
