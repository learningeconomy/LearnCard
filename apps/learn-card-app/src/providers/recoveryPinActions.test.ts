import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecoveryPinActions } from './recoveryPinActions';
import { readRecoveryPinPromptFlag } from '../components/recovery/recoveryPinPromptFlag';
import { createRecoverySetupRunner } from '../../../../packages/learn-card-base/src/auth-coordinator/recoverySetup';

const did = 'did:key:pin-test';
const harness = (provisional = true) => {
    let needsActivation = provisional;
    const identity = {};
    const activate = vi.fn(async () => {
        needsActivation = false;
    });
    const runner = createRecoverySetupRunner(
        () => ({ identity, needsActivation, activate }),
        vi.fn()
    );
    const save = vi.fn().mockResolvedValue(undefined);
    const clear = vi.fn().mockResolvedValue(undefined);
    const recreate = () =>
        createRecoveryPinActions(
            {
                runRecoverySetup: runner.run,
                resetRecoverySetup: runner.reset,
                setEscrowPin: save,
                clearEscrowPin: clear,
            },
            did
        );
    return { ...recreate(), recreate, activate, save, clear };
};

describe('provider recovery PIN actions', () => {
    beforeEach(() => localStorage.clear());

    it('keeps activation failures retryable and records the prompt flag only after full success', async () => {
        const actions = harness();
        actions.activate.mockRejectedValueOnce(new Error('offline'));
        await expect(actions.setEscrowPin('135790')).rejects.toThrow('Please try again');
        expect(readRecoveryPinPromptFlag(did)).toBeNull();
        await actions.setEscrowPin('135790');
        expect(actions.save).toHaveBeenCalledOnce();
        expect(actions.activate).toHaveBeenCalledTimes(2);
        expect(readRecoveryPinPromptFlag(did)).toBe('set');
    });

    it('does not activate or write a flag when saving fails', async () => {
        const actions = harness();
        actions.save.mockRejectedValueOnce(new Error('save failed'));
        await expect(actions.setEscrowPin('135790')).rejects.toThrow('save failed');
        expect(actions.activate).not.toHaveBeenCalled();
        expect(readRecoveryPinPromptFlag(did)).toBeNull();
        await actions.setEscrowPin('135790');
        expect(actions.save).toHaveBeenCalledTimes(2);
    });

    it('saves a changed PIN instead of treating it as a retry of the previous value', async () => {
        const actions = harness();
        actions.activate.mockRejectedValueOnce(new Error('offline'));
        await expect(actions.setEscrowPin('135790')).rejects.toThrow();
        await actions.setEscrowPin('246802');
        expect(actions.save.mock.calls).toEqual([['135790'], ['246802']]);
    });

    it.each(['135790', '246802'])(
        'preserves attempt identity across helper recreation for %s',
        async pin => {
            const actions = harness();
            actions.activate.mockRejectedValueOnce(new Error('offline'));
            await expect(actions.setEscrowPin('135790')).rejects.toThrow();
            await actions.recreate().setEscrowPin(pin);
            expect(actions.save.mock.calls).toEqual(
                pin === '135790' ? [['135790']] : [['135790'], [pin]]
            );
            expect(actions.activate).toHaveBeenCalledTimes(2);
        }
    );

    it('rejects a different in-flight PIN even from a recreated helper', async () => {
        const actions = harness();
        let finish!: () => void;
        actions.save.mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    finish = resolve;
                })
        );
        const first = actions.setEscrowPin('135790');
        await vi.waitFor(() => expect(actions.save).toHaveBeenCalledOnce());
        const other = actions.recreate();
        await expect(other.setEscrowPin('246802')).rejects.toThrow('Please wait');
        await expect(other.clearEscrowPin()).rejects.toThrow('Please wait');
        finish();
        await first;
        expect(actions.save.mock.calls).toEqual([['135790']]);
    });

    it('updates a PIN on an active account without activation', async () => {
        const actions = harness(false);
        await actions.setEscrowPin('135790');
        await actions.setEscrowPin('246802');
        expect(actions.save).toHaveBeenCalledTimes(2);
        expect(actions.activate).not.toHaveBeenCalled();
        expect(readRecoveryPinPromptFlag(did)).toBe('set');
    });

    it('clearing a PIN never activates and invalidates a pending activation retry', async () => {
        const actions = harness();
        actions.activate.mockRejectedValueOnce(new Error('offline'));
        await expect(actions.setEscrowPin('135790')).rejects.toThrow();
        await actions.clearEscrowPin();
        expect(actions.clear).toHaveBeenCalledOnce();
        expect(actions.activate).toHaveBeenCalledOnce();
        expect(readRecoveryPinPromptFlag(did)).toBe('skipped');
        await actions.setEscrowPin('135790');
        expect(actions.save).toHaveBeenCalledTimes(2);
        expect(actions.activate).toHaveBeenCalledTimes(2);
    });

    it('does not mark a failed clear as skipped', async () => {
        const actions = harness();
        actions.clear.mockRejectedValueOnce(new Error('offline'));
        await expect(actions.clearEscrowPin()).rejects.toThrow();
        expect(readRecoveryPinPromptFlag(did)).toBeNull();
        expect(actions.activate).not.toHaveBeenCalled();
    });

    it.each([false, true])(
        'blocks setup during removal and releases the guard (failure: %s)',
        async fail => {
            const actions = harness();
            let finish!: () => void;
            actions.clear.mockImplementationOnce(
                () =>
                    new Promise<void>((resolve, reject) => {
                        finish = () => (fail ? reject(new Error('offline')) : resolve());
                    })
            );
            const removing = actions.clearEscrowPin();
            await expect(actions.recreate().setEscrowPin('135790')).rejects.toThrow('Please wait');
            await expect(actions.recreate().clearEscrowPin()).rejects.toThrow('Please wait');
            expect(actions.save).not.toHaveBeenCalled();
            expect(actions.activate).not.toHaveBeenCalled();
            finish();
            if (fail) await expect(removing).rejects.toThrow('offline');
            else await removing;
            await actions.setEscrowPin('135790');
            expect(actions.save).toHaveBeenCalledOnce();
            expect(actions.activate).toHaveBeenCalledOnce();
        }
    );
});
