import { describe, it, expect, vi } from 'vitest';
import { UnsignedVC } from '@learncard/types';

import { getLearnCard } from '@helpers/learnCard.helpers';
import { verifyCredentialCanBeSigned } from '@helpers/inbox.helpers';

const TEST_SEED = 'a'.repeat(64);

describe('getLearnCard', () => {
    it('should return a LearnCard instance with a DID', async () => {
        const lc = await getLearnCard(TEST_SEED);

        expect(lc.id.did()).toBeDefined();
        expect(lc.id.did()).toContain('did:');
    });

    it('should cache instances by seed + allowRemoteContexts', async () => {
        const lcA = await getLearnCard(TEST_SEED, false);
        const lcB = await getLearnCard(TEST_SEED, false);

        expect(lcA).toBe(lcB);
    });

    it('should return different instances for different allowRemoteContexts values', async () => {
        const lcLocal = await getLearnCard(TEST_SEED, false);
        const lcRemote = await getLearnCard(TEST_SEED, true);

        expect(lcLocal).not.toBe(lcRemote);
    });

    it('should return the same DID regardless of allowRemoteContexts', async () => {
        const lcLocal = await getLearnCard(TEST_SEED, false);
        const lcRemote = await getLearnCard(TEST_SEED, true);

        expect(lcLocal.id.did()).toBe(lcRemote.id.did());
    });

    it('should include DynamicLoaderPlugin when allowRemoteContexts is true', async () => {
        const lcRemote = await getLearnCard(TEST_SEED, true);
        const pluginNames = lcRemote.plugins.map(p => p.name);

        expect(pluginNames).toContain('Dynamic Loader');
    });

    it('should NOT include DynamicLoaderPlugin when allowRemoteContexts is false', async () => {
        const lcLocal = await getLearnCard(TEST_SEED, false);
        const pluginNames = lcLocal.plugins.map(p => p.name);

        expect(pluginNames).not.toContain('Dynamic Loader');
    });

    it('should throw when no seed is provided and SEED env is unset', async () => {
        const original = process.env.SEED;
        delete process.env.SEED;

        await expect(getLearnCard(undefined)).rejects.toThrow('No seed set!');

        process.env.SEED = original;
    });
});

describe('getLearnCard remote context resolution', () => {
    it('should be able to resolve a remote context when allowRemoteContexts is true', async () => {
        const lcRemote = await getLearnCard(TEST_SEED, true);

        const doc = await lcRemote.context.resolveDocument(
            'https://www.w3.org/ns/credentials/v2',
            true
        );

        expect(doc).toBeDefined();
        expect(doc?.['@context']).toBeDefined();
    });
});

describe('verifyCredentialCanBeSigned', () => {
    const simpleUnsignedVC: UnsignedVC = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:placeholder',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: 'did:example:subject',
        },
    };

    it('should return true for a well-formed credential', async () => {
        const result = await verifyCredentialCanBeSigned(simpleUnsignedVC);

        expect(result).toBe(true);
    });

    it('should not mutate the original credential', async () => {
        const original = { ...simpleUnsignedVC, issuer: 'did:example:original-issuer' };
        const issuerBefore = original.issuer;

        await verifyCredentialCanBeSigned(original);

        expect(original.issuer).toBe(issuerBefore);
    });

    it('should return true for a credential with remote JSON-LD contexts', async () => {
        const remoteContextVC: UnsignedVC = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                'https://w3id.org/vc/render-method/v2rc1'
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer: 'did:example:placeholder',
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: 'did:example:subject',
                type: ['AchievementSubject'],
                achievement: {
                    id: 'urn:uuid:test-achievement',
                    type: ['Achievement'],
                    name: 'Test Achievement',
                    criteria: { narrative: 'Test criteria' },
                },
            },
        };

        const result = await verifyCredentialCanBeSigned(remoteContextVC);

        expect(result).toBe(true);
    });

    it('should return false for a credential that cannot be signed', async () => {
        const badCredential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: [], // empty type array should cause failure
            issuer: 'did:example:placeholder',
            issuanceDate: new Date().toISOString(),
            credentialSubject: {},
        } as unknown as UnsignedVC;

        const result = await verifyCredentialCanBeSigned(badCredential);

        expect(result).toBe(false);
    });

    it('should log error when pre-flight signing fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const badCredential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: [],
            issuer: 'did:example:placeholder',
            issuanceDate: new Date().toISOString(),
            credentialSubject: {},
        } as unknown as UnsignedVC;

        await verifyCredentialCanBeSigned(badCredential);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[verifyCredentialCanBeSigned] Pre-flight signing failed:',
            expect.anything()
        );

        consoleSpy.mockRestore();
    });
});
