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
