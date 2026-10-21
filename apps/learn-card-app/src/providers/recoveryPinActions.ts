import type { AuthCoordinatorContextValue } from 'learn-card-base';
import { writeRecoveryPinPromptFlag } from '../components/recovery/recoveryPinPromptFlag';

type PinCoordinator = Pick<
    AuthCoordinatorContextValue,
    'runRecoverySetup' | 'resetRecoverySetup' | 'setEscrowPin' | 'clearEscrowPin'
>;

interface PinAttempt {
    pendingPin?: string;
    clearing: boolean;
}

// The provider's runRecoverySetup callback is bound to an account session. Keep
// attempt state with that callback so same-account auth refreshes or multiple
// callers cannot lose replacement detection or bypass the removal guard.
const attempts = new WeakMap<PinCoordinator['runRecoverySetup'], PinAttempt>();

/** Session-scoped PIN actions shared by prompts, onboarding, and settings. */
export const createRecoveryPinActions = (coordinator: PinCoordinator, did?: string) => {
    // Retained only while an attempt is incomplete, never persisted or logged.
    // A different PIN starts a replacement rather than retrying the previous save.
    const attempt = attempts.get(coordinator.runRecoverySetup) ?? { clearing: false };
    attempts.set(coordinator.runRecoverySetup, attempt);

    return {
        setEscrowPin: async (pin: string): Promise<void> => {
            if (attempt.clearing) throw new Error('Please wait for PIN removal to finish.');
            if (attempt.pendingPin !== undefined && attempt.pendingPin !== pin) {
                coordinator.resetRecoverySetup('pin');
            }
            attempt.pendingPin = pin;
            await coordinator.runRecoverySetup('pin', () => coordinator.setEscrowPin(pin));
            attempt.pendingPin = undefined;
            if (did) writeRecoveryPinPromptFlag(did, 'set');
        },
        clearEscrowPin: async (): Promise<void> => {
            if (attempt.clearing) throw new Error('Please wait for PIN removal to finish.');
            // Reject clearing during setup, and discard any activation-only retry.
            // Removing a PIN must never activate the account.
            coordinator.resetRecoverySetup('pin');
            attempt.clearing = true;
            try {
                await coordinator.clearEscrowPin();
                attempt.pendingPin = undefined;
                if (did) writeRecoveryPinPromptFlag(did, 'skipped');
            } finally {
                attempt.clearing = false;
            }
        },
    };
};
