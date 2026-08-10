import { describe, expect, it } from 'bun:test';

import { deriveTroopIdStatus, isCredentialActionRestricted } from '../troopIdStatus.helpers';

describe('deriveTroopIdStatus', () => {
    it('uses revoked and suspended lifecycle states before issuance state', () => {
        expect(deriveTroopIdStatus({ lifecycleStatus: 'revoked', issuanceState: 'pending' })).toBe(
            'revoked'
        );
        expect(
            deriveTroopIdStatus({ lifecycleStatus: 'suspended', issuanceState: 'accepted' })
        ).toBe('suspended');
    });

    it('uses explicit pending metadata and otherwise reports valid', () => {
        expect(deriveTroopIdStatus({ lifecycleStatus: 'active', issuanceState: 'pending' })).toBe(
            'pending'
        );
        expect(deriveTroopIdStatus({ lifecycleStatus: 'active', issuanceState: 'accepted' })).toBe(
            'valid'
        );
    });

    it('keeps loading neutral and restricts actions until resolved', () => {
        expect(deriveTroopIdStatus({ lifecycleStatus: 'active', isLoading: true })).toBeUndefined();
        expect(isCredentialActionRestricted(undefined)).toBe(true);
        expect(isCredentialActionRestricted('valid')).toBe(false);
        expect(isCredentialActionRestricted('pending')).toBe(true);
        expect(isCredentialActionRestricted('suspended')).toBe(true);
        expect(isCredentialActionRestricted('revoked')).toBe(true);
    });

    it.each([
        [undefined, true],
        ['pending', true],
        ['suspended', true],
        ['revoked', true],
        ['valid', false],
    ] as const)('maps %s to restricted=%s', (status, expected) => {
        expect(isCredentialActionRestricted(status)).toBe(expected);
    });
});
