import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionError } from '@learncard/types';
import { createWeb3AuthStrategy, deriveWeb3AuthKey } from '../createWeb3AuthStrategy';

const sdk = vi.hoisted(() => ({
    init: vi.fn(),
    connect: vi.fn(),
    logout: vi.fn(),
    getUserInfo: vi.fn(),
    request: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    connected: false,
}));
vi.mock('../../logging/logger', () => ({ getLogger: () => sdk }));
vi.mock('@web3auth/base', () => ({ CHAIN_NAMESPACES: { EIP155: 'eip155' } }));
vi.mock('@web3auth/ethereum-provider', () => ({ EthereumPrivateKeyProvider: class {} }));
vi.mock('@web3auth/single-factor-auth', () => ({
    Web3Auth: class {
        connected = sdk.connected;
        provider = { request: sdk.request };
        init = sdk.init;
        connect = sdk.connect;
        getUserInfo = sdk.getUserInfo;
        async logout(): Promise<void> {
            await sdk.logout();
            this.connected = false;
        }
    },
}));
const token = (uid = 'test-user'): string =>
    `header.${btoa(JSON.stringify({ sub: uid }))}.synthetic-signature`;
const config = { clientId: 'test-client', web3AuthNetwork: 'testnet', verifier: 'test-verifier' };
const credentials = async (strategy: ReturnType<typeof createWeb3AuthStrategy>): Promise<void> => {
    await strategy.fetchServerKeyStatus(token(), 'firebase');
};
const derive = (strategy: ReturnType<typeof createWeb3AuthStrategy>): Promise<string> =>
    strategy.reconstructKey('local', 'remote');

describe('Web3Auth account setup coordination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sdk.connected = false;
        sdk.init.mockResolvedValue(undefined);
        sdk.connect.mockResolvedValue(undefined);
        sdk.logout.mockResolvedValue(undefined);
        sdk.getUserInfo.mockResolvedValue({ verifierId: 'test-user', verifier: 'test-verifier' });
        sdk.request.mockResolvedValue('synthetic-private-key');
        vi.stubGlobal('navigator', {});
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('coalesces same-account initialization across strategy instances within a tab', async () => {
        let finish: () => void = () => undefined;
        sdk.init.mockImplementation(
            () =>
                new Promise<void>(resolve => {
                    finish = resolve;
                })
        );
        const a = createWeb3AuthStrategy(config);
        const b = createWeb3AuthStrategy(config);
        await credentials(a);
        await credentials(b);
        const first = derive(a);
        const second = derive(b);
        await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledOnce());
        finish();
        expect(await Promise.all([first, second])).toEqual([
            'synthetic-private-key',
            'synthetic-private-key',
        ]);
        expect(sdk.connect).toHaveBeenCalledOnce();
    });

    it('waits for the browser lock before initializing and restores a matching SDK session', async () => {
        let run: (() => Promise<string>) | undefined;
        const request = vi.fn(
            (_name: string, _options: LockOptions, action: () => Promise<string>) =>
                new Promise<string>((resolve, reject) => {
                    run = () =>
                        action()
                            .then(resolve, reject)
                            .then(() => '');
                })
        );
        vi.stubGlobal('navigator', { locks: { request } });
        sdk.connected = true;
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        const result = derive(strategy);
        expect(request).toHaveBeenCalledWith(
            'learncard:web3auth:key-derivation',
            { signal: expect.any(AbortSignal) },
            expect.any(Function)
        );
        expect(sdk.init).not.toHaveBeenCalled();
        await run?.();
        expect(await result).toBe('synthetic-private-key');
        expect(sdk.connect).not.toHaveBeenCalled();
    });

    it('reconnects a restored session for another account before exposing the current key', async () => {
        sdk.connected = true;
        sdk.getUserInfo.mockResolvedValueOnce({
            verifierId: 'other-user',
            verifier: 'test-verifier',
        });
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        expect(await derive(strategy)).toBe('synthetic-private-key');
        expect(sdk.logout).toHaveBeenCalledOnce();
        expect(sdk.connect).toHaveBeenCalledExactlyOnceWith({
            verifier: config.verifier,
            verifierId: 'test-user',
            idToken: token(),
        });
        expect(sdk.logout.mock.invocationCallOrder[0]).toBeLessThan(
            sdk.connect.mock.invocationCallOrder[0]!
        );
        expect(sdk.getUserInfo).toHaveBeenCalledTimes(2);
    });

    it('still rejects the wrong identity after reconnecting before exposing a key', async () => {
        sdk.connected = true;
        sdk.getUserInfo.mockResolvedValue({ verifierId: 'other-user', verifier: 'test-verifier' });
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toThrow('We couldn’t finish signing you in.');
        expect(sdk.request).not.toHaveBeenCalled();
        expect(sdk.logout).toHaveBeenCalledOnce();
        expect(sdk.connect).toHaveBeenCalledOnce();
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({ restoredIdentityMismatch: true })
        );
    });

    it('coalesces legacy upgrade extraction with ordinary sign-in under the same lock', async () => {
        let run: (() => Promise<string>) | undefined;
        const request = vi.fn(
            (_name: string, _options: LockOptions, action: () => Promise<string>) =>
                new Promise<string>((resolve, reject) => {
                    run = () =>
                        action()
                            .then(resolve, reject)
                            .then(() => '');
                })
        );
        vi.stubGlobal('navigator', { locks: { request } });
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        const ordinary = derive(strategy);
        const upgrade = deriveWeb3AuthKey(config, token());
        await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
        expect(sdk.init).not.toHaveBeenCalled();
        await run?.();
        expect(await Promise.all([ordinary, upgrade])).toEqual([
            'synthetic-private-key',
            'synthetic-private-key',
        ]);
        expect(sdk.connect).toHaveBeenCalledOnce();
    });

    it('aborts a queued lock after 30 seconds, reports the wait, and allows retry', async () => {
        vi.useFakeTimers();
        let signal: AbortSignal | undefined;
        const request = vi.fn(
            (_name: string, options: LockOptions, _action: () => Promise<string>) =>
                new Promise<string>((_resolve, reject) => {
                    signal = options.signal;
                    signal?.addEventListener('abort', () =>
                        reject(new DOMException('Aborted', 'AbortError'))
                    );
                })
        );
        vi.stubGlobal('navigator', { locks: { request } });
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        const result = derive(strategy);
        const rejection = expect(result).rejects.toThrow('Sign-in is taking longer in another tab');
        await vi.advanceTimersByTimeAsync(1_000);
        expect(sdk.info).toHaveBeenCalledWith(
            'Waiting for another tab to finish sign-in',
            expect.objectContaining({ setupAttemptId: expect.any(Number) })
        );
        await vi.advanceTimersByTimeAsync(29_000);
        await rejection;
        expect(signal?.aborted).toBe(true);
        expect(sdk.init).not.toHaveBeenCalled();
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({ lockWaitTimedOut: true })
        );
        request.mockImplementationOnce(async (_name, _options, action) => action());
        expect(await derive(strategy)).toBe('synthetic-private-key');
        expect(vi.getTimerCount()).toBe(0);
    });

    it('keeps an acquired lock and same-tab deduplication while the SDK runs past the deadline', async () => {
        vi.useFakeTimers();
        let finish: () => void = () => undefined;
        sdk.init.mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    finish = resolve;
                })
        );
        let signal: AbortSignal | undefined;
        let released = false;
        const request = vi.fn(
            async (_name: string, options: LockOptions, action: () => Promise<string>) => {
                signal = options.signal;
                try {
                    return await action();
                } finally {
                    released = true;
                }
            }
        );
        vi.stubGlobal('navigator', { locks: { request } });
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        const first = derive(strategy);
        await vi.advanceTimersByTimeAsync(60_000);
        const second = derive(strategy);
        expect(released).toBe(false);
        expect(signal?.aborted).toBe(false);
        expect(request).toHaveBeenCalledOnce();
        expect(sdk.init).toHaveBeenCalledOnce();
        expect(
            sdk.info.mock.calls.some(
                ([message]) => message === 'Waiting for another tab to finish sign-in'
            )
        ).toBe(false);
        finish();
        expect(await Promise.all([first, second])).toEqual([
            'synthetic-private-key',
            'synthetic-private-key',
        ]);
        expect(released).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('sanitizes a legacy upgrade replay failure before it reaches the caller', async () => {
        sdk.connect.mockRejectedValueOnce(new Error(`token is used: ${token()}`));
        await expect(deriveWeb3AuthKey(config, token())).rejects.toThrow(
            'Sign-in is already completing in another tab.'
        );
        expect(JSON.stringify(sdk.error.mock.calls)).not.toContain(token());
    });

    it('sanitizes malformed legacy credentials without starting SDK setup', async () => {
        const malformed = `header.${btoa('private-account malformed JSON')}.signature`;
        await expect(deriveWeb3AuthKey(config, malformed)).rejects.toThrow(
            'We couldn’t finish signing you in. Please try again.'
        );
        expect(sdk.init).not.toHaveBeenCalled();
        expect(JSON.stringify(sdk.error.mock.calls)).not.toContain('private-account');
    });

    it('cancels queued work if Firebase signed out while another tab held the lock', async () => {
        const strategy = createWeb3AuthStrategy({ ...config, isSessionCurrent: async () => false });
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toBeInstanceOf(AuthSessionError);
        expect(sdk.init).not.toHaveBeenCalled();
        expect(sdk.error).not.toHaveBeenCalled();
    });

    it('rejects a result if the account changes during derivation', async () => {
        const isSessionCurrent = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        const strategy = createWeb3AuthStrategy({ ...config, isSessionCurrent });
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toBeInstanceOf(AuthSessionError);
    });

    it('classifies replay without exposing a JWT and releases failed work for retry', async () => {
        const raw = `Error occurred while verifying params token is used: ${token()}`;
        sdk.connect.mockRejectedValueOnce(new Error(raw));
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toThrow(
            'Sign-in is already completing in another tab.'
        );
        expect(JSON.stringify(sdk.error.mock.calls)).not.toContain(token());
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({ replayedCredential: true })
        );
        expect(await derive(strategy)).toBe('synthetic-private-key');
    });
});
