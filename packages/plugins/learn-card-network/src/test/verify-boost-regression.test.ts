import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { getVerifyBoostPlugin } from '../plugin';

const trustedIssuer = 'did:web:network.learncard.com';
const boostId = 'lc:network:network.learncard.com/boost:test';
const result = (errors: string[] = []) => ({ errors, warnings: [], checks: ['proof', 'status'] });

describe('VerifyBoost wrapper transition', () => {
    it('verifies an unwrapped VC and checks its issuer against the registry', async () => {
        const verifyCredential = vi.fn().mockResolvedValue(result());
        const card = { invoke: { verifyCredential } } as unknown as Parameters<
            typeof getVerifyBoostPlugin
        >[0];
        const plugin = await getVerifyBoostPlugin(card);
        const vc = { issuer: trustedIssuer, boostId, type: ['BoostCredential'] } as unknown as VC;
        const verified = await plugin.methods.verifyCredential(card, vc);
        expect(verifyCredential).toHaveBeenCalledTimes(1);
        expect(verified.errors).toEqual([]);
        expect(verified.checks).toContain('Boost is Authentic. Verified by LearnCard Network.');
    });

    it('does not label an unwrapped VC with an invalid signature authentic', async () => {
        const card = {
            invoke: { verifyCredential: vi.fn().mockResolvedValue(result(['Invalid signature'])) },
        } as unknown as Parameters<typeof getVerifyBoostPlugin>[0];
        const plugin = await getVerifyBoostPlugin(card);
        const verified = await plugin.methods.verifyCredential(card, {
            issuer: trustedIssuer,
            boostId,
            type: ['BoostCredential'],
        } as unknown as VC);
        expect(verified.errors).toContain('Invalid signature');
        expect(verified.checks.some(check => check.includes('Boost is Authentic'))).toBe(false);
    });

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
