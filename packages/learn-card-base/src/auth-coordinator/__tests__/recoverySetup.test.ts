import { describe, expect, it, vi } from 'vitest';
import { countConfiguredRecoveryMethods, createRecoverySetupRunner } from '../recoverySetup';

const harness = () => {
    let needsActivation = true;
    let identity = {};
    const activate = vi.fn(async () => {
        needsActivation = false;
    });
    const completed = vi.fn();
    const runner = createRecoverySetupRunner(
        () => ({ identity, needsActivation, activate }),
        completed
    );
    return {
        runner,
        activate,
        completed,
        switchAccount: () => {
            identity = {};
        },
    };
};

describe('activation-aware recovery setup', () => {
    it.each(['passkey', 'phrase', 'backup', 'email', 'pin'])(
        '%s retries activation without repeating successful setup/confirmation',
        async method => {
            const { runner, activate, completed } = harness();
            activate.mockRejectedValueOnce(new Error('network unavailable'));
            const setup = vi.fn().mockResolvedValue('result');
            await expect(runner.run(method, setup)).rejects.toThrow('Please try again');
            expect(completed).not.toHaveBeenCalled();
            expect(await runner.run(method, setup)).toBe('result');
            expect(setup).toHaveBeenCalledOnce();
            expect(activate).toHaveBeenCalledTimes(2);
            expect(completed).toHaveBeenCalledOnce();
        }
    );

    it('does not activate or complete when confirmation fails; retries confirmation', async () => {
        const { runner, activate, completed } = harness();
        const setup = vi
            .fn()
            .mockRejectedValueOnce(new Error('wrong words'))
            .mockResolvedValue(undefined);
        await expect(runner.run('phrase', setup)).rejects.toThrow('wrong words');
        expect(activate).not.toHaveBeenCalled();
        expect(completed).not.toHaveBeenCalled();
        await runner.run('phrase', setup);
        expect(setup).toHaveBeenCalledTimes(2);
    });

    it('waits for activation before reporting success and deduplicates in-flight attempts', async () => {
        const { runner, activate, completed } = harness();
        let finish!: () => void;
        activate.mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    finish = resolve;
                })
        );
        const setup = vi.fn().mockResolvedValue('credential');
        const first = runner.run('passkey', setup);
        expect(runner.run('passkey', setup)).toBe(first);
        await vi.waitFor(() => expect(activate).toHaveBeenCalledOnce());
        expect(completed).not.toHaveBeenCalled();
        finish();
        await first;
        expect(completed).toHaveBeenCalledOnce();
        expect(setup).toHaveBeenCalledOnce();
    });

    it('requires fresh confirmation after generating replacement material', async () => {
        const { runner, activate } = harness();
        activate.mockRejectedValueOnce(new Error('offline'));
        const setup = vi.fn().mockResolvedValue(undefined);
        await expect(runner.run('phrase', setup)).rejects.toThrow();
        runner.reset('phrase');
        await runner.run('phrase', setup);
        expect(setup).toHaveBeenCalledTimes(2);
    });

    it('does not suppress replacement setup after a successful attempt on an active account', async () => {
        const { runner, activate } = harness();
        const setup = vi.fn().mockResolvedValue(undefined);
        await runner.run('phrase', setup);
        await runner.run('phrase', setup);
        expect(setup).toHaveBeenCalledTimes(2);
        expect(activate).toHaveBeenCalledOnce();
    });

    it('never resumes another account’s pending activation', async () => {
        const { runner, activate, switchAccount } = harness();
        activate.mockRejectedValueOnce(new Error('offline'));
        const setup = vi.fn().mockResolvedValue(undefined);
        await expect(runner.run('backup', setup)).rejects.toThrow();
        switchAccount();
        await runner.run('backup', setup);
        expect(setup).toHaveBeenCalledTimes(2);
    });

    it('rejects a setup completing after logout/account switch without activating', async () => {
        const { runner, activate, completed, switchAccount } = harness();
        let finish!: () => void;
        const pending = runner.run(
            'email',
            () =>
                new Promise<void>(resolve => {
                    finish = resolve;
                })
        );
        await vi.waitFor(() => expect(finish).toBeDefined());
        switchAccount();
        finish();
        await expect(pending).rejects.toThrow('sign in again');
        expect(activate).not.toHaveBeenCalled();
        expect(completed).not.toHaveBeenCalled();
    });
});

describe('configured recovery method counts', () => {
    it('counts types once across re-confirmations, replacements, and modal reopenings', () => {
        expect(countConfiguredRecoveryMethods([{ type: 'phrase' }, { type: 'phrase' }])).toBe(1);
        expect(countConfiguredRecoveryMethods([{ type: 'phrase' }, { type: 'backup' }])).toBe(2);
    });
    it('excludes automatic email but includes explicitly configured email', () => {
        expect(countConfiguredRecoveryMethods([{ type: 'email' }])).toBe(0);
        expect(countConfiguredRecoveryMethods([{ type: 'email', confirmedAt: 'today' }])).toBe(1);
        expect(countConfiguredRecoveryMethods([{ type: 'email' }], 'a***@example.com')).toBe(1);
    });
});
