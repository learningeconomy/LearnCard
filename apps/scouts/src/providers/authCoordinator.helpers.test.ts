// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';

import {
    decidePinPromptAfterReady,
    settleEscrowRecoveryMarker,
    secureFlowOffersPin,
    pinChangePromptOpens,
    type EscrowRecoveryKind,
} from './authCoordinator.helpers';

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

describe('pinChangePromptOpens', () => {
    it('opens on start while wrong entries are recorded against the PIN', () => {
        expect(
            pinChangePromptOpens({ did: 'did:a', changeRequired: true, pinSignInPending: false })
        ).toBe(true);
    });

    it('lets the post-sign-in review ask first', () => {
        expect(
            pinChangePromptOpens({ did: 'did:a', changeRequired: true, pinSignInPending: true })
        ).toBe(false);
    });

    it('stays closed when no change is required (or it was dismissed) or nobody is signed in', () => {
        expect(
            pinChangePromptOpens({ did: 'did:a', changeRequired: false, pinSignInPending: false })
        ).toBe(false);
        expect(
            pinChangePromptOpens({ did: undefined, changeRequired: true, pinSignInPending: false })
        ).toBe(false);
    });
});
