import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { getVerifyBoostPlugin } from '../plugin';

const trustedIssuer = 'did:web:network.learncard.com';
const boostId = 'lc:network:network.learncard.com/trpc:boost:test';
const result = (errors: string[] = []) => ({ errors, warnings: [], checks: ['proof', 'status'] });

describe('VerifyBoost wrapper transition', () => {
    it.each([
        ['lc:network:localhost%3A4000/trpc:boost:test', 'did:web:localhost%3A4000'],
        ['lc:network:preview.example/brain/trpc:boost:test', 'did:web:preview.example:brain'],
        ['lc:network:preview.example/trpc/trpc:boost:test', 'did:web:preview.example:trpc'],
        ['lc:network:network.learncard.com/boost:test', trustedIssuer],
    ])('resolves the registry network from %s', async (boostId, did) => {
        const card = {
            invoke: { verifyCredential: vi.fn().mockResolvedValue(result()) },
        } as unknown as Parameters<typeof getVerifyBoostPlugin>[0];
        const registryUrl = `data:application/json,${encodeURIComponent(
            JSON.stringify([{ id: 'Test Network', did, url: 'https://registry.example' }])
        )}`;
        const plugin = await getVerifyBoostPlugin(card, registryUrl);
        const verified = await plugin.methods.verifyCredential(card, {
            issuer: 'did:key:z6MkSigningAuthority',
            boostId,
            type: ['BoostCredential'],
        } as unknown as VC);
        expect(verified.checks).toContain('Boost is Authentic. Verified by Test Network.');
        expect(verified.errors).toEqual([]);
        expect(verified.warnings).toEqual([]);
    });

    it('does not infer authenticity for a pre-signed Boost without a signed association', async () => {
        const card = {
            invoke: { verifyCredential: vi.fn().mockResolvedValue(result()) },
        } as unknown as Parameters<typeof getVerifyBoostPlugin>[0];
        const plugin = await getVerifyBoostPlugin(card);
        const verified = await plugin.methods.verifyCredential(card, {
            issuer: trustedIssuer,
            type: ['BoostCredential'],
        } as unknown as VC);
        expect(verified.errors).toEqual([]);
        expect(verified.checks).toContain('proof');
        expect(verified.checks.some(check => check.includes('Boost is Authentic'))).toBe(false);
        expect(verified.warnings).toEqual([
            'Boost Authenticity could not be verified: Boost ID metadata is missing.',
        ]);
    });

    it.each([
        'did:key:z6MkSigningAuthority',
        'did:web:network.learncard.com:users:issuer',
        { id: 'did:web:network.learncard.com:users:issuer' },
    ])('verifies a direct SA credential using its signed Boost network (%j)', async issuer => {
        const verifyCredential = vi.fn().mockResolvedValue(result());
        const card = { invoke: { verifyCredential } } as unknown as Parameters<
            typeof getVerifyBoostPlugin
        >[0];
        const plugin = await getVerifyBoostPlugin(card);
        const vc = { issuer, boostId, type: ['BoostCredential'] } as unknown as VC;
        const verified = await plugin.methods.verifyCredential(card, vc);
        expect(verifyCredential).toHaveBeenCalledTimes(1);
        expect(verified.errors).toEqual([]);
        expect(verified.checks).toContain('Boost is Authentic. Verified by LearnCard Network.');
    });

    it.each([
        'lc:network:untrusted.example/boost:test',
        'lc:network:network.learncard.com.evil.example/boost:test',
        'lc:network:network.learncard.com@evil.example/boost:test',
        'lc:network:network.learncard.com/credential:test',
        'lc:network:network.learncard.com/boost:',
        'lc:network:network.learncard.com/boost:test?network=trusted',
        'not-a-boost-uri',
    ])(
        'does not mark a direct credential with an untrusted or invalid Boost URI authentic (%s)',
        async boostId => {
            const card = {
                invoke: { verifyCredential: vi.fn().mockResolvedValue(result()) },
            } as unknown as Parameters<typeof getVerifyBoostPlugin>[0];
            const plugin = await getVerifyBoostPlugin(card);
            const verified = await plugin.methods.verifyCredential(card, {
                issuer: trustedIssuer,
                boostId,
                type: ['BoostCredential'],
            } as unknown as VC);
            expect(verified.checks.some(check => check.includes('Boost is Authentic'))).toBe(false);
            expect(verified.warnings).not.toEqual([]);
        }
    );

    it.each(['Invalid signature', 'Credential revoked'])(
        'explains why a direct credential with %s cannot establish Boost authenticity',
        async error => {
            const card = {
                invoke: { verifyCredential: vi.fn().mockResolvedValue(result([error])) },
            } as unknown as Parameters<typeof getVerifyBoostPlugin>[0];
            const plugin = await getVerifyBoostPlugin(card);
            const verified = await plugin.methods.verifyCredential(card, {
                issuer: trustedIssuer,
                boostId,
                type: ['BoostCredential'],
            } as unknown as VC);
            expect(verified.errors).toEqual([error]);
            expect(verified.warnings).toContain(
                'Boost Authenticity could not be verified: Credential verification failed.'
            );
            expect(verified.checks.some(check => check.includes('Boost is Authentic'))).toBe(false);
        }
    );

    it('preserves legacy inner verification failures even when both boost IDs are missing', async () => {
        const verifyCredential = vi
            .fn()
            .mockResolvedValueOnce(result())
            .mockResolvedValueOnce(result(['Credential revoked']));
        const card = { invoke: { verifyCredential } } as unknown as Parameters<
            typeof getVerifyBoostPlugin
        >[0];
        const plugin = await getVerifyBoostPlugin(card);
        const verified = await plugin.methods.verifyCredential(card, {
            issuer: trustedIssuer,
            type: ['CertifiedBoostCredential'],
            boostCredential: { issuer: 'did:example:issuer', type: ['BoostCredential'] },
        } as unknown as VC);
        expect(verifyCredential).toHaveBeenCalledTimes(2);
        expect(verified.errors).toContain('Credential revoked');
        expect(verified.checks).not.toContain('status');
    });

    it('continues to verify matching legacy wrappers', async () => {
        const verifyCredential = vi.fn().mockImplementation(async () => result());
        const card = { invoke: { verifyCredential } } as unknown as Parameters<
            typeof getVerifyBoostPlugin
        >[0];
        const plugin = await getVerifyBoostPlugin(card);
        const verified = await plugin.methods.verifyCredential(card, {
            issuer: trustedIssuer,
            boostId,
            type: ['CertifiedBoostCredential'],
            boostCredential: { issuer: 'did:example:issuer', boostId, type: ['BoostCredential'] },
        } as unknown as VC);
        expect(verifyCredential).toHaveBeenCalledTimes(2);
        expect(verified.errors).toEqual([]);
        expect(verified.checks).toContain('Boost is Authentic. Verified by LearnCard Network.');
    });
});
