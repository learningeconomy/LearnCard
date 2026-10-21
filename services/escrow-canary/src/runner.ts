import { EscrowPinMismatchError } from '@learncard/sss-key-manager';
import type { Config } from './config';
import { refreshIdentity, RunnerAuthError } from './auth';
import type { Emit, Step } from './metrics';
import type { SecretStore } from './secrets';
import type { Sdk } from './sdk';
import { memoryStorage } from './storage';

export interface RunEvent {
    tier: 1 | 2;
    time: string;
}
export interface Dependencies {
    secrets: SecretStore;
    sdk: Sdk;
    emit: Emit;
    refresh?: typeof refreshIdentity;
}

/** One serialized Lambda per tier. Slot claims suppress at-least-once EventBridge deliveries. */
export const runCanary = async (
    event: RunEvent,
    config: Config,
    deps: Dependencies
): Promise<void> => {
    const { emit, sdk, secrets } = deps;
    let step: Step = 'secret';
    const timed = async <T>(name: Step, operation: () => Promise<T>): Promise<T> => {
        step = name;
        const start = performance.now();
        try {
            return await operation();
        } finally {
            emit('Step.Latency', performance.now() - start, name);
        }
    };
    try {
        const time = Date.parse(event.time);
        if (!Number.isFinite(time) || Math.abs(Date.now() - time) > 5 * 60_000)
            throw new Error('Invalid scheduled time');
        const slot = Math.floor(time / 1_800_000);
        const selected = config.accounts[event.tier === 1 ? 0 : 1 + (slot % 2)];
        const secret = await timed('secret', () => secrets.read(selected.secretArn));
        if (secret.accountId !== selected.id) throw new Error('Wrong account secret');
        if (event.tier === 2 && secret.lastSlot !== undefined && secret.lastSlot >= slot) return;
        const auth = await timed('auth', () =>
            (deps.refresh ?? refreshIdentity)(config.firebaseApiKey, secret.refreshToken)
        );
        emit('Runner.AuthFailure', 0);
        const rotated = auth.refreshToken !== secret.refreshToken;
        secret.refreshToken = auth.refreshToken;
        const week = Math.floor((time - Date.UTC(1970, 0, 5)) / 604_800_000);
        const wrongPin = event.tier === 2 && secret.wrongPinWeek !== week;
        const interrupted = secret.needsPinReset === true;
        if (event.tier === 2) {
            secret.lastSlot = slot;
            secret.needsPinReset = true;
            // Claim weekly attempt before IO: crashes cannot repeatedly spend guesses.
            if (wrongPin) secret.wrongPinWeek = week;
        }
        if (rotated || event.tier === 2)
            await timed('persist', () => secrets.write(selected.secretArn, secret));
        await timed('identity', async () => {
            if ((await sdk.did(secret.privateKey)) !== secret.did)
                throw new Error('Known identity mismatch');
        });
        const identity = await timed('attestation', () => sdk.attest());
        const state = await timed('authority', () => sdk.authority(secret, auth.token, identity));
        if (event.tier === 2) {
            const common = {
                token: auth.token,
                providerType: 'firebase' as const,
                signDidAuthVp: sdk.sign,
            };
            const resetParams = {
                ...common,
                privateKey: secret.privateKey,
                pin: secret.pin,
                options: {
                    recoveryEmail: secret.recoveryEmail,
                    recoveryLanguage: secret.recoveryLanguage,
                },
            };
            // Stored seed is used ONLY for crash repair/signing, never as recovered output.
            if (!state.hasPin || interrupted) {
                const repair = memoryStorage();
                await timed('crashRepair', () =>
                    sdk.strategy(repair.storage).setEscrowPin!(resetParams)
                );
                secret.deviceState = repair.snapshot();
                secret.needsPinReset = true;
                await timed('persist', () => secrets.write(selected.secretArn, secret));
            }
            const memory = memoryStorage();
            const strategy = sdk.strategy(memory.storage);
            const recover = (pin: string) =>
                strategy.executeRecovery!({
                    ...common,
                    didFromPrivateKey: sdk.did,
                    input: { method: 'escrow-pin', pin, expectedDid: secret.did },
                });
            if (wrongPin)
                await timed('wrongPin', async () => {
                    const wrong = `${secret.pin[0] === '9' ? '8' : '9'}${secret.pin.slice(1)}`;
                    try {
                        await recover(wrong);
                    } catch (error) {
                        if (
                            error instanceof EscrowPinMismatchError &&
                            error.attemptsRemaining === 9
                        )
                            return;
                        throw error;
                    }
                    throw new Error('Incorrect PIN accepted');
                });
            const recovered = await timed('recovery', () => recover(secret.pin));
            await timed('identity', async () => {
                if (
                    recovered.did !== secret.did ||
                    (await sdk.did(recovered.privateKey)) !== secret.did
                )
                    throw new Error('Recovered identity mismatch');
            });
            secret.deviceState = memory.snapshot();
            secret.needsPinReset = true;
            await timed('persist', () => secrets.write(selected.secretArn, secret));
            await timed('resetPin', () =>
                strategy.setEscrowPin!({ ...resetParams, privateKey: recovered.privateKey })
            );
            secret.deviceState = memory.snapshot();
            secret.needsPinReset = false;
            await timed('persist', () => secrets.write(selected.secretArn, secret));
        }
        emit(event.tier === 1 ? 'Tier1.Success' : 'Tier2.Success', 1);
    } catch (error) {
        if (error instanceof RunnerAuthError) emit('Runner.AuthFailure', 1);
        emit('Step.Failure', 1, step, error);
        emit(event.tier === 1 ? 'Tier1.Success' : 'Tier2.Success', 0);
        // Do not throw raw SDK/AWS errors into Lambda's automatic error logger or retry mutations.
    }
};
