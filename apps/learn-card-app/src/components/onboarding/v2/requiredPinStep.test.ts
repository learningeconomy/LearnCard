import { describe, it, expect, vi, afterEach } from 'vitest';

import {
    canSkipRequiredPin,
    decideOnboardingPinStep,
    saveRequiredPin,
    REQUIRED_PIN_SAVE_TIMEOUT_MS,
    REQUIRED_PIN_SKIP_AFTER_ERRORS,
} from './requiredPinStep';
import { waitForEscrowEnrollment } from './waitForEscrowEnrollment';

afterEach(() => vi.useRealTimers());

const ready = { status: 'ready', did: 'did:key:new' };

describe('canSkipRequiredPin', () => {
    it('offers no skip at first or after one error, and offers it from the second error on', () => {
        expect(REQUIRED_PIN_SKIP_AFTER_ERRORS).toBe(2);
        expect(canSkipRequiredPin(0)).toBe(false);
        expect(canSkipRequiredPin(1)).toBe(false);
        expect(canSkipRequiredPin(2)).toBe(true);
        expect(canSkipRequiredPin(3)).toBe(true);
    });
});

describe('saveRequiredPin', () => {
    it('resolves when the save succeeds', async () => {
        const setPin = vi.fn().mockResolvedValue(undefined);
        await expect(saveRequiredPin(setPin, '135790')).resolves.toBeUndefined();
        expect(setPin).toHaveBeenCalledWith('135790');
    });

    it('rejects with the save error', async () => {
        const error = new Error('enclave unavailable');
        await expect(saveRequiredPin(vi.fn().mockRejectedValue(error), '135790')).rejects.toBe(
            error
        );
    });

    it('turns a synchronous throw into a rejection', async () => {
        const setPin = vi.fn(() => {
            throw new Error('boom');
        });
        await expect(saveRequiredPin(setPin, '135790')).rejects.toThrow('boom');
    });

    it('rejects a hung save after the deadline so the user is never stuck', async () => {
        vi.useFakeTimers();
        const result = saveRequiredPin(() => new Promise<void>(() => undefined), '135790');
        const settled = vi.fn();
        result.then(settled, settled);
        await vi.advanceTimersByTimeAsync(REQUIRED_PIN_SAVE_TIMEOUT_MS - 1);
        expect(settled).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        await expect(result).rejects.toMatchObject({ name: 'DeadlineError' });
    });
});

describe('decideOnboardingPinStep', () => {
    const decide = (
        overrides: Partial<Parameters<typeof decideOnboardingPinStep>[0]> = {}
    ): Promise<boolean> =>
        decideOnboardingPinStep({
            waitForPinAvailable: async () => true,
            getSnapshot: () => ready,
            readPromptFlag: () => null,
            ...overrides,
        });

    it('shows the step for a new account with escrow available and no PIN', async () => {
        await expect(decide()).resolves.toBe(true);
    });

    it('skips the step when escrow is not available (off, gated, failed or timed out)', async () => {
        await expect(decide({ waitForPinAvailable: async () => false })).resolves.toBe(false);
    });

    it('skips the step when finding out fails, instead of blocking sign-up', async () => {
        await expect(
            decide({
                waitForPinAvailable: async () => {
                    throw new Error('config unavailable');
                },
            })
        ).resolves.toBe(false);
        await expect(
            decide({
                getSnapshot: () => {
                    throw new Error('state unavailable');
                },
            })
        ).resolves.toBe(false);
    });

    it('skips the step when the account already has a PIN or was already asked', async () => {
        await expect(
            decide({ getSnapshot: () => ({ ...ready, escrowPinEnabled: true }) })
        ).resolves.toBe(false);
        await expect(decide({ readPromptFlag: () => 'skipped' })).resolves.toBe(false);
        await expect(decide({ readPromptFlag: () => 'set' })).resolves.toBe(false);
    });

    it('skips the step when the account is not ready', async () => {
        await expect(decide({ getSnapshot: () => ({ status: 'error' }) })).resolves.toBe(false);
    });

    it('skips the step when enrollment never settles (status load timeout)', async () => {
        vi.useFakeTimers();
        const result = decide({
            waitForPinAvailable: () =>
                waitForEscrowEnrollment(() => ({ status: 'ready' }), {
                    escrowEnabled: true,
                    timeoutMs: 1_000,
                }),
        });
        await vi.advanceTimersByTimeAsync(1_250);
        await expect(result).resolves.toBe(false);
    });

    it('skips the step when enrollment failed (enclave or attestation unavailable)', async () => {
        await expect(
            decide({
                waitForPinAvailable: () =>
                    waitForEscrowEnrollment(
                        () => ({ status: 'ready', escrowEnrollment: 'failed' }),
                        { escrowEnabled: true }
                    ),
            })
        ).resolves.toBe(false);
    });
});
