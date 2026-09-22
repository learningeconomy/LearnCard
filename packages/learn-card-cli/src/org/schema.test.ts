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
    it.each([
        ['read-only', 'READ_ONLY'],
        ['issuer', 'issuer'],
        ['Issuer', 'issuer'],
    ])('rejects duplicate normalized secrets keys: %s / %s', (first, second) => {
        const result = OrgSpecValidator.safeParse({
            ...validSpec,
            serviceAccounts: [first, second].map(name => ({ name, scopes: ['inbox:read'] })),
        });
        expect(result.success).toBe(false);
        if (!result.success)
            expect(result.error.issues).toContainEqual(
                expect.objectContaining({
                    path: ['serviceAccounts', 1, 'name'],
                    message: expect.stringContaining('Duplicate service-account secrets key'),
                })
            );
    });

    it('accepts distinct normalized secrets keys', () => {
        expect(
            OrgSpecValidator.safeParse({
                ...validSpec,
                serviceAccounts: ['read-only', 'write-only'].map(name => ({
                    name,
                    scopes: ['inbox:read'],
                })),
            }).success
        ).toBe(true);
    });

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

    it.each([
        [
            'profileManager.managedProfiles',
            { profileManager: { displayName: 'SC Districts', managedProfiles: [] } },
            ['profileManager'],
        ],
        [
            'issuer.signingAuthority.endpoint on a hosted signer',
            {
                issuer: {
                    ...validSpec.issuer,
                    signingAuthority: {
                        type: 'learncard-hosted',
                        name: 'scde-clr',
                        endpoint: 'https://x',
                    },
                },
            },
            ['issuer', 'signingAuthority'],
        ],
        [
            'serviceAccounts[].scope',
            { serviceAccounts: [{ name: 'a', scope: ['inbox:read'] }] },
            ['serviceAccounts', 0],
        ],
        ['top-level typo', { webhook: [{ url: 'https://x' }] }, []],
    ])('rejects unknown keys instead of silently dropping them: %s', (_label, override, path) => {
        const result = OrgSpecValidator.safeParse({ ...validSpec, ...override });
        expect(result.success).toBe(false);
        if (!result.success)
            expect(result.error.issues).toContainEqual(
                expect.objectContaining({ code: 'unrecognized_keys', path })
            );
    });
});

describe('examples/*.network.yaml', () => {
    it('every shipped example parses', async () => {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const { loadOrgSpec } = await import('./load');
        const dir = path.resolve(__dirname, '../../examples');
        const files = (await fs.readdir(dir)).filter(f => f.endsWith('.network.yaml'));
        expect(files.length).toBeGreaterThanOrEqual(5);
        for (const file of files) {
            const spec = await loadOrgSpec(path.join(dir, file));
            expect(spec.issuer.profileId, file).toBeTruthy();
        }
    });
});
