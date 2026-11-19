// Escrow/PIN prompt decisions, mirrored from apps/learn-card-app/src/providers/authCoordinator.helpers.ts.

export type EscrowRecoveryKind = 'pin' | 'hold';

export type PinPromptAfterReady =
    | { kind: 'pin-sign-in-review' }
    | { kind: 'after-recovery' }
    | { kind: 'after-hold-recovery' }
    | { kind: 'pin-reset-required' }
    | { kind: 'first-time' }
    | { kind: 'reset-banner' }
    | { kind: 'none' };

/**
 * Decides which PIN prompt (if any) to show once the account is ready without a
 * working PIN. PIN prompts only make sense while escrow recovery is enrolled.
 *
 * `first-time` covers enrolled accounts this device has never asked, e.g. users
 * migrated from Web3Auth, who skip the new-user setup that owns the prompt for
 * accounts created in this session. Asking only enrolled accounts keeps the
 * escrow rollout gate in charge of who sees it.
 *
 * `pin-sign-in-review` (the one-time "Did you lose a device…?" sheet after a PIN
 * sign-in) comes first and holds every other prompt back until it is answered.
 */
export const decidePinPromptAfterReady = ({
    recoveredVia,
    pinEnabled,
    enrollment,
    promptFlag,
    pinResetRequired = false,
    newUserThisSession = false,
    pinSignInReview = false,
}: {
    recoveredVia: EscrowRecoveryKind | null;
    pinEnabled: boolean | undefined;
    enrollment: string | undefined;
    promptFlag: string | null | undefined;
    /** Repair stopped because only a new user-chosen PIN can restore automatic recovery. */
    pinResetRequired?: boolean;
    /** The account was created in this session; new-user setup prompts instead. */
    newUserThisSession?: boolean;
    /** A PIN sign-in just kept the account and its review has not been answered. */
    pinSignInReview?: boolean;
}): PinPromptAfterReady => {
    if (pinSignInReview) return { kind: 'pin-sign-in-review' };
    if (pinEnabled !== false) return { kind: 'none' };
    if (pinResetRequired) return { kind: 'pin-reset-required' };
    if (recoveredVia === 'pin') return { kind: 'after-recovery' };
    if (recoveredVia === 'hold') {
        return enrollment === 'enrolled' ? { kind: 'after-hold-recovery' } : { kind: 'none' };
    }
    if (promptFlag === 'set') return { kind: 'reset-banner' };
    if (promptFlag == null && enrollment === 'enrolled' && !newUserThisSession) {
        return { kind: 'first-time' };
    }
    return { kind: 'none' };
};

/**
 * Returns the escrow-recovery marker to keep after a ready render. The first
 * published PIN status (enabled or not) is the one that decides the
 * post-recovery prompt, so it consumes the marker; while the status is still
 * unknown the marker is kept for the publish that follows.
 */
export const settleEscrowRecoveryMarker = (
    recoveredVia: EscrowRecoveryKind | null,
    pinEnabled: boolean | undefined
): EscrowRecoveryKind | null => (pinEnabled === undefined ? recoveredVia : null);

/**
 * Whether "Secure my account" should offer the PIN step. A PIN sign-in proves a PIN
 * exists even before the async escrow refresh publishes `ready.escrowPin`, and an
 * unloaded status (`escrowEnrollment` still undefined) must not skip the step: that
 * would turn the PIN off without asking.
 */
export const secureFlowOffersPin = ({
    afterPinSignIn,
    pinEnabled,
    escrowEnrollment,
}: {
    afterPinSignIn: boolean;
    pinEnabled: boolean | undefined;
    escrowEnrollment: string | undefined;
}): boolean => afterPinSignIn || pinEnabled === true || escrowEnrollment === undefined;

/**
 * Whether the "choose a new PIN" prompt opens on its own. The coordinator sets
 * `escrowPinChangeRequired` while wrong entries are recorded against the current PIN
 * (unless dismissed this session); right after a PIN sign-in the review sheet asks
 * first, so the prompt only opens directly on later renders and app starts.
 */
export const pinChangePromptOpens = ({
    did,
    changeRequired,
    pinSignInPending,
}: {
    did: string | undefined;
    changeRequired: boolean;
    pinSignInPending: boolean;
}): boolean => !!did && changeRequired && !pinSignInPending;
