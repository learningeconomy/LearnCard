import { describe, expect, it } from 'vitest';

import { verifyCredentialIsDerivedFromBoost } from '../helpers/boost-verification';

describe('verifyCredentialIsDerivedFromBoost', () => {
    const boostUri = 'lc:network:network.learncard.com/trpc:boost:abc123';
    const boostTemplate = {
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
    };

    it('returns true when boostId matches and credential includes all boost template types', () => {
        const credential = {
            boostId: boostUri,
            type: ['VerifiableCredential', 'OpenBadgeCredential', 'AchievementCredential'],
        };

        expect(verifyCredentialIsDerivedFromBoost(credential, boostTemplate, boostUri)).toBe(true);
    });

    it('returns false when boostId does not match the boost uri', () => {
        const credential = {
            boostId: 'lc:network:network.learncard.com/trpc:boost:wrong',
            type: ['VerifiableCredential', 'OpenBadgeCredential', 'AchievementCredential'],
        };

        expect(verifyCredentialIsDerivedFromBoost(credential, boostTemplate, boostUri)).toBe(false);
    });

    it('returns false when boostId is missing', () => {
        const credential = {
            type: ['VerifiableCredential', 'OpenBadgeCredential', 'AchievementCredential'],
        };

        expect(verifyCredentialIsDerivedFromBoost(credential, boostTemplate, boostUri)).toBe(false);
    });

    it('returns false when credential is missing a required boost template type', () => {
        const credential = {
            boostId: boostUri,
            type: ['VerifiableCredential', 'AchievementCredential'],
        };

        expect(verifyCredentialIsDerivedFromBoost(credential, boostTemplate, boostUri)).toBe(false);
    });
});
