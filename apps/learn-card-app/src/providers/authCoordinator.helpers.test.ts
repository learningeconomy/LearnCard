import { describe, it, expect } from 'vitest';

import {
    countUserConfiguredRecoveryMethods,
    registerRecoveryMethodCompletion,
    shouldResetWalletOnStatus,
    mergeAuthUserIntoCurrentUser,
    decidePinPromptAfterReady,
    settleEscrowRecoveryMarker,
    secureFlowOffersPin,
    type EscrowRecoveryKind,
} from './authCoordinator.helpers';

describe('registerRecoveryMethodCompletion', () => {
    it('registers each method once per setup session', () => {
        const completedMethods = new Set<string>();

        expect(registerRecoveryMethodCompletion(completedMethods, 'phrase')).toBe(true);
        expect(registerRecoveryMethodCompletion(completedMethods, 'phrase')).toBe(false);
        expect(registerRecoveryMethodCompletion(completedMethods, 'email')).toBe(true);
        expect([...completedMethods]).toEqual(['phrase', 'email']);
    });
});

describe('countUserConfiguredRecoveryMethods', () => {
    it('does not count automatic recovery as a user-configured method', () => {
        expect(countUserConfiguredRecoveryMethods([{ type: 'escrow' }])).toBe(0);
        expect(countUserConfiguredRecoveryMethods([{ type: 'escrow' }, { type: 'phrase' }])).toBe(
            1
        );
    });
    it('counts durable methods and ignores a synthetic primary-email entry', () => {
        expect(
            countUserConfiguredRecoveryMethods([
                { type: 'email' },
                { type: 'passkey' },
                { type: 'phrase' },
            ])
        ).toBe(2);
    });

    it('counts a verified recovery email after reload', () => {
        expect(countUserConfiguredRecoveryMethods([{ type: 'email' }], 'r***@example.com')).toBe(1);
    });

    it('counts a code-confirmed email method even without a masked recovery email', () => {
        expect(
            countUserConfiguredRecoveryMethods([
                { type: 'email', confirmedAt: '2026-09-03T00:00:00.000Z' },
            ])
        ).toBe(1);
    });
});

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

describe('decidePinPromptAfterReady', () => {
    const base = { pinEnabled: false, enrollment: 'enrolled', promptFlag: null } as const;

    it('offers a new PIN after a PIN recovery only when the PIN was cleared', () => {
        // Fallback: re-enrolling with the proven PIN failed and the repair cleared it.
        expect(decidePinPromptAfterReady({ ...base, recoveredVia: 'pin' })).toEqual({
            kind: 'after-recovery',
        });
    });

    it('shows the PIN sign-in review first and holds every other prompt back', () => {
        for (const pinEnabled of [true, false, undefined])
            expect(
                decidePinPromptAfterReady({
                    ...base,
                    recoveredVia: 'pin',
                    pinEnabled,
                    pinResetRequired: true,
                    pinSignInReview: true,
                })
            ).toEqual({ kind: 'pin-sign-in-review' });
        // Once answered, the usual decision applies again.
        expect(
            decidePinPromptAfterReady({
                ...base,
                recoveredVia: 'pin',
                pinEnabled: true,
                pinSignInReview: false,
            })
        ).toEqual({ kind: 'none' });
    });

    it('does not ask for a PIN the user kept through a PIN recovery', () => {
        expect(
            decidePinPromptAfterReady({ ...base, recoveredVia: 'pin', pinEnabled: true })
        ).toEqual({ kind: 'none' });
        // Status not refreshed yet: wait rather than prompt.
        expect(
            decidePinPromptAfterReady({ ...base, recoveredVia: 'pin', pinEnabled: undefined })
        ).toEqual({ kind: 'none' });
    });

    it('asks for a new PIN when repair requires a PIN reset, even while unenrolled', () => {
        for (const recoveredVia of [null, 'hold', 'pin'] as const)
            expect(
                decidePinPromptAfterReady({
                    ...base,
                    recoveredVia,
                    enrollment: 'not-enrolled',
                    pinResetRequired: true,
                })
            ).toEqual({ kind: 'pin-reset-required' });
        expect(
            decidePinPromptAfterReady({
                ...base,
                recoveredVia: null,
                pinResetRequired: true,
                pinEnabled: true,
            })
        ).toEqual({ kind: 'none' });
    });

    it('offers a PIN after waiting out the hold, even if a PIN was set before', () => {
        expect(decidePinPromptAfterReady({ ...base, recoveredVia: 'hold' })).toEqual({
            kind: 'after-hold-recovery',
        });
        expect(
            decidePinPromptAfterReady({ ...base, recoveredVia: 'hold', promptFlag: 'set' })
        ).toEqual({ kind: 'after-hold-recovery' });
    });

    it('does not offer a PIN after a hold recovery unless escrow is enrolled', () => {
        expect(
            decidePinPromptAfterReady({ ...base, recoveredVia: 'hold', enrollment: 'not-enrolled' })
        ).toEqual({ kind: 'none' });
    });

    it('offers the hold prompt when asynchronous enrollment becomes known', () => {
        const recovery = { recoveredVia: 'hold', promptFlag: null } as const;
        expect(
            decidePinPromptAfterReady({ ...recovery, enrollment: undefined, pinEnabled: undefined })
        ).toEqual({ kind: 'none' });
        // The provider consumes recoveredVia only when showing the prompt (or a working PIN).
        expect(
            decidePinPromptAfterReady({ ...recovery, enrollment: 'enrolled', pinEnabled: false })
        ).toEqual({ kind: 'after-hold-recovery' });
        // Once consumed, a device that never asked falls back to the one-time prompt.
        expect(decidePinPromptAfterReady({ ...base, recoveredVia: null })).toEqual({
            kind: 'first-time',
        });
    });

    it('waits until PIN status is known and never prompts when a PIN works', () => {
        for (const pinEnabled of [undefined, true]) {
            expect(
                decidePinPromptAfterReady({ ...base, pinEnabled, recoveredVia: 'hold' })
            ).toEqual({
                kind: 'none',
            });
        }
    });

    it('shows the reset banner only for a previously set PIN without a recovery', () => {
        expect(
            decidePinPromptAfterReady({ ...base, recoveredVia: null, promptFlag: 'set' })
        ).toEqual({ kind: 'reset-banner' });
        expect(
            decidePinPromptAfterReady({ ...base, recoveredVia: null, promptFlag: 'skipped' })
        ).toEqual({ kind: 'none' });
    });

    describe('first-time prompt for accounts not created this session (e.g. migrated)', () => {
        it('asks an enrolled account without a PIN once per device', () => {
            expect(decidePinPromptAfterReady({ ...base, recoveredVia: null })).toEqual({
                kind: 'first-time',
            });
            for (const promptFlag of ['skipped', 'set'] as const)
                expect(
                    decidePinPromptAfterReady({ ...base, recoveredVia: null, promptFlag }).kind
                ).not.toBe('first-time');
        });

        it('leaves accounts created this session to new-user setup', () => {
            expect(
                decidePinPromptAfterReady({ ...base, recoveredVia: null, newUserThisSession: true })
            ).toEqual({ kind: 'none' });
        });

        it('stays inside the escrow rollout: never asks unless enrolled', () => {
            for (const enrollment of ['not-enrolled', 'disabled', 'stale', undefined])
                expect(
                    decidePinPromptAfterReady({ ...base, recoveredVia: null, enrollment })
                ).toEqual({ kind: 'none' });
        });

        it('never asks while PIN status is unknown or a PIN works', () => {
            for (const pinEnabled of [undefined, true])
                expect(
                    decidePinPromptAfterReady({ ...base, recoveredVia: null, pinEnabled })
                ).toEqual({ kind: 'none' });
        });
    });
});

describe('settleEscrowRecoveryMarker', () => {
    it('keeps the marker until a PIN status is published', () => {
        expect(settleEscrowRecoveryMarker('pin', undefined)).toBe('pin');
        expect(settleEscrowRecoveryMarker('hold', undefined)).toBe('hold');
    });

    it('consumes the marker on the first published status, enabled or not', () => {
        for (const marker of ['pin', 'hold', null] as const) {
            expect(settleEscrowRecoveryMarker(marker, true)).toBeNull();
            expect(settleEscrowRecoveryMarker(marker, false)).toBeNull();
        }
    });

    // Mirrors the provider's ready effect: decide, then settle the marker.
    const readyRender = (marker: EscrowRecoveryKind | null, pinEnabled: boolean | undefined) => {
        const prompt = decidePinPromptAfterReady({
            recoveredVia: marker,
            pinEnabled,
            enrollment: 'enrolled',
            promptFlag: 'set',
        });
        return { prompt: prompt.kind, marker: settleEscrowRecoveryMarker(marker, pinEnabled) };
    };

    it.each(['pin', 'hold'] as const)(
        'does not re-prompt after a kept PIN (%s recovery) is later removed',
        recoveredVia => {
            const kept = readyRender(recoveredVia, true);
            expect(kept).toEqual({ prompt: 'none', marker: null });
            // The user deliberately removes the kept PIN later in the session.
            expect(readyRender(kept.marker, false).prompt).toBe('reset-banner');
        }
    );

    it('still prompts once when the first published status shows the PIN was cleared', () => {
        const cleared = readyRender('pin', false);
        expect(cleared.prompt).toBe('after-recovery');
        expect(cleared.marker).toBeNull();
    });
});

describe('secureFlowOffersPin', () => {
    it('offers the PIN step right after a PIN sign-in, before the status loads', () => {
        expect(
            secureFlowOffersPin({
                afterPinSignIn: true,
                pinEnabled: undefined,
                escrowEnrollment: undefined,
            })
        ).toBe(true);
    });

    it('offers it while the escrow status is unknown, so the PIN is never dropped silently', () => {
        expect(
            secureFlowOffersPin({
                afterPinSignIn: false,
                pinEnabled: undefined,
                escrowEnrollment: undefined,
            })
        ).toBe(true);
    });

    it('follows the loaded status otherwise', () => {
        expect(
            secureFlowOffersPin({
                afterPinSignIn: false,
                pinEnabled: true,
                escrowEnrollment: 'enrolled',
            })
        ).toBe(true);
        expect(
            secureFlowOffersPin({
                afterPinSignIn: false,
                pinEnabled: false,
                escrowEnrollment: 'enrolled',
            })
        ).toBe(false);
        expect(
            secureFlowOffersPin({
                afterPinSignIn: false,
                pinEnabled: undefined,
                escrowEnrollment: 'opted-out',
            })
        ).toBe(false);
    });
});
