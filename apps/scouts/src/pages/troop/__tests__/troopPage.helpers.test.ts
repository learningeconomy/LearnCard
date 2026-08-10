import { describe, expect, it } from 'bun:test';

import { hasReachableMembers, selectHolderRecipient } from '../troopPage.helpers';

describe('selectHolderRecipient', () => {
    it('uses the exact credential URI when one profile has multiple issuances', () => {
        const recipients = [
            {
                uri: 'lc:credential:pending-sibling',
                received: undefined,
                to: { profileId: 'scout-1' },
            },
            {
                uri: 'lc:credential:accepted-holder',
                received: { date: '2026-08-10T12:00:00.000Z' },
                to: { profileId: 'scout-1' },
            },
        ];

        expect(
            selectHolderRecipient(recipients, 'scout-1', 'lc:credential:accepted-holder')?.uri
        ).toBe('lc:credential:accepted-holder');
    });

    it('falls back to the profile only when there is no exact holder URI', () => {
        const recipients = [
            {
                uri: 'lc:credential:profile-fallback',
                received: undefined,
                to: { profileId: 'scout-1' },
            },
        ];

        expect(selectHolderRecipient(recipients, 'scout-1')?.uri).toBe(
            'lc:credential:profile-fallback'
        );
        expect(
            selectHolderRecipient(recipients, 'scout-1', 'lc:credential:missing-exact')
        ).toBeUndefined();
    });
});

describe('hasReachableMembers', () => {
    it('keeps pending-only member controls reachable without inflating accepted counts', () => {
        const pendingRows = [{ issuanceState: 'pending' }];

        expect(hasReachableMembers(0, pendingRows)).toBe(true);
    });

    it('hides member controls when both accepted counts and visible rows are empty', () => {
        expect(hasReachableMembers(0, [])).toBe(false);
    });
});
