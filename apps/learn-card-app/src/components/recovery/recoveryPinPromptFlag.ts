/**
 * Per-DID, per-device memory of whether the user has been asked to set a
 * recovery PIN and what they chose. Drives the one-time post-signup prompt
 * and the "set your PIN again" banner after a share rotation dropped it.
 */
export type RecoveryPinPromptFlag = 'set' | 'skipped';

const storageKey = (did: string): string => `lc:recovery-pin-prompt:${did}`;

export const readRecoveryPinPromptFlag = (did: string): RecoveryPinPromptFlag | null => {
    try {
        const value = localStorage.getItem(storageKey(did));

        return value === 'set' || value === 'skipped' ? value : null;
    } catch {
        return null;
    }
};

export const writeRecoveryPinPromptFlag = (did: string, value: RecoveryPinPromptFlag): void => {
    try {
        localStorage.setItem(storageKey(did), value);
    } catch {
        // Storage unavailable (private mode / quota) — the prompt may repeat, which is safe.
    }
};
