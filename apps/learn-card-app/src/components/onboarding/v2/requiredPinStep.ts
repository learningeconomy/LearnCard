import { withDeadline } from 'learn-card-base/helpers/withDeadline';

/**
 * Sign-up asks every new account to create a recovery PIN, but the PIN must never block
 * account creation (fail-open):
 *
 * - The step is shown only when escrow is confirmed available for the new account
 *   (`decideOnboardingPinStep`). Escrow off for the tenant or behind the rollout gate,
 *   enclave or lca-api down, attestation failure, or a status that does not load in
 *   time all skip the step without writing the prompt flag, so the existing first-time
 *   PIN prompt asks again later.
 * - Saving runs under a deadline (`saveRequiredPin`), so a hung save is an error, not a
 *   spinner the user cannot leave.
 * - After the second failed save "Skip for now" appears (`canSkipRequiredPin`); skipping
 *   continues onboarding without writing the prompt flag, so the existing first-time PIN
 *   prompt asks again on a later start. (The old optional step's skip wrote `'skipped'`,
 *   which never asked again; a skip forced by an error should not mean "no".)
 */

/** Failed saves after which "Skip for now" appears (the user's second error). */
export const REQUIRED_PIN_SKIP_AFTER_ERRORS = 2;

/** Longest a PIN save may take before it counts as a failed attempt. */
export const REQUIRED_PIN_SAVE_TIMEOUT_MS = 30_000;

/** Whether "Skip for now" is offered on the required PIN step after `saveErrors` failures. */
export const canSkipRequiredPin = (saveErrors: number): boolean =>
    saveErrors >= REQUIRED_PIN_SKIP_AFTER_ERRORS;

/**
 * Save the PIN, rejecting if it errors or takes longer than `timeoutMs`. A save that
 * times out may still finish in the background (its result is discarded here); the
 * user can retry or, after the second failure, skip.
 */
export const saveRequiredPin = (
    setPin: (pin: string) => Promise<void>,
    pin: string,
    timeoutMs: number = REQUIRED_PIN_SAVE_TIMEOUT_MS
): Promise<void> =>
    withDeadline(
        Promise.resolve().then(() => setPin(pin)),
        { ms: timeoutMs, label: 'onboarding.savePin' }
    );

export type OnboardingPinSnapshot = {
    status: string;
    did?: string;
    escrowPinEnabled?: boolean;
};

/**
 * Whether the onboarding PIN step is shown. Never throws: any failure while finding
 * out (including reading the escrow config) skips the step, which leaves the prompt
 * flag unset so the user is asked later.
 */
export const decideOnboardingPinStep = async ({
    waitForPinAvailable,
    getSnapshot,
    readPromptFlag,
}: {
    /** Resolves true only once escrow is confirmed enrolled for the account; bounded. */
    waitForPinAvailable: () => Promise<boolean>;
    getSnapshot: () => OnboardingPinSnapshot;
    readPromptFlag: (did: string) => string | null;
}): Promise<boolean> => {
    try {
        if (!(await waitForPinAvailable())) return false;
        const snapshot = getSnapshot();
        if (snapshot.status !== 'ready' || !snapshot.did) return false;
        // Resumed onboarding: the account may already have a PIN, or have been asked
        // by the provider's one-time prompt on this device.
        if (snapshot.escrowPinEnabled === true) return false;
        return readPromptFlag(snapshot.did) == null;
    } catch {
        return false;
    }
};
