import { describe, it, expect } from 'vitest';

import { shouldResetWalletOnStatus, mergeAuthUserIntoCurrentUser } from './authCoordinator.helpers';

describe('shouldResetWalletOnStatus', () => {
    it('keeps the wallet while the coordinator is in a transitional status', () => {
        // These occur during the noOp → real authProvider re-init on hard
        // refresh; resetting here flashes the loader over the rendered app.
        expect(shouldResetWalletOnStatus('authenticating')).toBe(false);
        expect(shouldResetWalletOnStatus('authenticated')).toBe(false);
        expect(shouldResetWalletOnStatus('checking_key_status')).toBe(false);
        expect(shouldResetWalletOnStatus('deriving_key')).toBe(false);
    });

    it('does not reset while ready', () => {
        expect(shouldResetWalletOnStatus('ready')).toBe(false);
    });

    it('resets the wallet in settled non-ready statuses', () => {
        expect(shouldResetWalletOnStatus('idle')).toBe(true);
        expect(shouldResetWalletOnStatus('needs_setup')).toBe(true);
        expect(shouldResetWalletOnStatus('needs_migration')).toBe(true);
        expect(shouldResetWalletOnStatus('needs_recovery')).toBe(true);
        expect(shouldResetWalletOnStatus('error')).toBe(true);
    });
});

describe('mergeAuthUserIntoCurrentUser', () => {
    const baseUser = {
        uid: '',
        email: '',
        phoneNumber: '',
        name: 'Keep Me',
        privateKey: 'pk',
    };

    it('backfills uid/email/phone from the auth user when empty', () => {
        const merged = mergeAuthUserIntoCurrentUser(baseUser, {
            id: 'firebase-uid',
            email: 'user@example.com',
            phone: '+15551234567',
        });

        expect(merged).toEqual({
            ...baseUser,
            uid: 'firebase-uid',
            email: 'user@example.com',
            phoneNumber: '+15551234567',
        });
    });

    it('preserves already-populated fields', () => {
        const populated = { ...baseUser, uid: 'existing-uid', email: 'kept@example.com' };

        const merged = mergeAuthUserIntoCurrentUser(populated, {
            id: 'other-uid',
            email: 'other@example.com',
            phone: '+15550000000',
        });

        expect(merged).toEqual({ ...populated, phoneNumber: '+15550000000' });
    });

    it('returns null when nothing changes', () => {
        const populated = {
            ...baseUser,
            uid: 'uid',
            email: 'a@b.c',
            phoneNumber: '+15551112222',
        };

        expect(mergeAuthUserIntoCurrentUser(populated, { id: 'uid', email: 'a@b.c' })).toBeNull();
    });

    it('returns null without a current user or auth user', () => {
        expect(mergeAuthUserIntoCurrentUser(null, { id: 'uid' })).toBeNull();
        expect(mergeAuthUserIntoCurrentUser(baseUser, null)).toBeNull();
        expect(mergeAuthUserIntoCurrentUser(baseUser, undefined)).toBeNull();
    });
});
