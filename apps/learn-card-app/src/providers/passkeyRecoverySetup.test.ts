import { describe, expect, it, vi } from 'vitest';
import { createRecoverySetupRunner } from '../../../../packages/learn-card-base/src/auth-coordinator/recoverySetup';
import { runPasskeyRecoverySetup } from './passkeyRecoverySetup';

describe('passkey recovery setup callback', () => {
    it('lets the runner activate a provisional account exactly once', async () => {
        let needsActivation = true;
        const identity = {};
        const activate = vi.fn(async () => {
            if (!needsActivation) throw new Error('Cannot activate key in state: ready');
            needsActivation = false;
        });
        const runner = createRecoverySetupRunner(
            () => ({ identity, needsActivation, activate }),
            vi.fn()
        );
        const setupPasskey = vi.fn().mockResolvedValue({
            method: 'passkey',
            credentialId: 'credential-id',
        });

        await expect(runPasskeyRecoverySetup(runner.run, setupPasskey)).resolves.toBe(
            'credential-id'
        );
        expect(setupPasskey).toHaveBeenCalledOnce();
        expect(activate).toHaveBeenCalledOnce();
    });
});
