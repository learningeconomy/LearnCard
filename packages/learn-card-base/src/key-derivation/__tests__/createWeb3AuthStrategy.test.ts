import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionError } from '@learncard/types';
import { createWeb3AuthStrategy } from '../createWeb3AuthStrategy';

const sdk = vi.hoisted(() => ({
    init: vi.fn(),
    connect: vi.fn(),
    getUserInfo: vi.fn(),
    request: vi.fn(),
    info: vi.fn(),
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
        sdk.getUserInfo.mockResolvedValue({ verifierId: 'test-user', verifier: 'test-verifier' });
        sdk.request.mockResolvedValue('synthetic-private-key');
        vi.stubGlobal('navigator', {});
    });
    afterEach(() => vi.unstubAllGlobals());

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
            (_name: string, action: () => Promise<string>) =>
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
            expect.any(Function)
        );
        expect(sdk.init).not.toHaveBeenCalled();
        await run?.();
        expect(await result).toBe('synthetic-private-key');
        expect(sdk.connect).not.toHaveBeenCalled();
    });

    it('rejects a restored session for another account before exposing its key', async () => {
        sdk.connected = true;
        sdk.getUserInfo.mockResolvedValue({ verifierId: 'other-user', verifier: 'test-verifier' });
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toThrow('We couldn’t finish signing you in.');
        expect(sdk.request).not.toHaveBeenCalled();
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({ restoredIdentityMismatch: true })
        );
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
            expect.objectContaining({ tokenAlreadyUsed: true })
        );
        expect(await derive(strategy)).toBe('synthetic-private-key');
    });
});
