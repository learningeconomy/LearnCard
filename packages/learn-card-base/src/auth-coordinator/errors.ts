/**
 * Errors the AuthCoordinator raises for its own (strategy-independent) rules.
 */

/**
 * A recovery is already in flight. Recovery inputs (PIN, waiting-period hold, phrase,
 * passkey, backup) and the lost-login session steps share one single-use session and
 * one pending identity, so a second submission is rejected before it touches any state;
 * the pending recovery continues unaffected.
 */
export class RecoveryInProgressError extends Error {
    constructor() {
        super('Recovery is already running');
        this.name = 'RecoveryInProgressError';
    }
}

/**
 * The PIN chosen to replace a PIN with recorded wrong entries is the same PIN. Only a
 * different PIN gets a fresh attempt budget.
 */
export class SameEscrowPinError extends Error {
    constructor() {
        super('Choose a different PIN from the one you just used.');
        this.name = 'SameEscrowPinError';
    }
}

/**
 * True for a SameEscrowPinError. Checked by name, not `instanceof`, so it also holds
 * when the error crossed a bundle or package-copy boundary (or a test stub).
 */
export const isSameEscrowPinError = (cause: unknown): cause is SameEscrowPinError =>
    cause instanceof Error && cause.name === 'SameEscrowPinError';

/**
 * LC-2409: an escrow contact re-seal (`confirmEscrowPin` / `resealEscrowContact`) was
 * refused before anything changed.
 * - `other-uid`: this session is not the login that holds the sign-in email
 *   (`primaryUid`); only that login's sessions may re-seal.
 * - `unconfirmed`: the session's email is not an address the user typed or proved on this
 *   device. Ask the user to type their sign-in email and pass it as `retypedEmail`.
 */
export class EscrowContactNotConfirmedError extends Error {
    constructor(public readonly reason: 'other-uid' | 'unconfirmed') {
        super(
            reason === 'other-uid'
                ? 'Sign in with your sign-in email on this device to finish.'
                : 'Type your sign-in email to confirm.'
        );
        this.name = 'EscrowContactNotConfirmedError';
    }
}

/** True for an EscrowContactNotConfirmedError, checked by name across bundles. */
export const isEscrowContactNotConfirmedError = (
    cause: unknown
): cause is EscrowContactNotConfirmedError =>
    cause instanceof Error && cause.name === 'EscrowContactNotConfirmedError';
