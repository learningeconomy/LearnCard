import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionError } from '@learncard/types';
import {
    ACCOUNT_LOOKUP_STATUS_TIMEOUT_MS,
    AccountUsesNewerSignInError,
    createWeb3AuthStrategy,
    deriveWeb3AuthKey,
} from '../createWeb3AuthStrategy';
import { isNetworkError } from '../../helpers/networkError';

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
    options: [] as Record<string, unknown>[],
    native: false,
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => sdk.native } }));
vi.mock('../../logging/logger', () => ({ getLogger: () => sdk }));
vi.mock('@web3auth/base', () => ({ CHAIN_NAMESPACES: { EIP155: 'eip155' } }));
vi.mock('@web3auth/ethereum-provider', () => ({ EthereumPrivateKeyProvider: class {} }));
vi.mock('@web3auth/single-factor-auth', () => ({
    SDK_MODE: { WEB: 'web', NODE: 'node' },
    Web3Auth: class {
        constructor(options: Record<string, unknown>) {
            sdk.options.push(options);
        }
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
        sdk.native = false;
        sdk.options = [];
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

    it('keeps the web SDK session on web and skips the session server on native', async () => {
        const web = createWeb3AuthStrategy(config);
        await credentials(web);
        await derive(web);
        expect(sdk.options[0]).not.toHaveProperty('mode');

        sdk.native = true;
        const native = createWeb3AuthStrategy(config);
        await credentials(native);
        expect(await derive(native)).toBe('synthetic-private-key');
        expect(sdk.options[1]).toMatchObject({ mode: 'node' });
    });

    it('reports the failing SDK step and a redacted error without exposing credentials', async () => {
        const failure = Object.assign(
            new Error(
                `Could not get lookup for test-user with ${token()} and eyJhbGc.eyJzdWIiOiJ4In0.sig`
            ),
            { code: 'TORUS_LOOKUP' }
        );
        failure.name = 'WalletLoginError';
        sdk.connect.mockRejectedValueOnce(failure);
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toThrow(
            'We couldn’t finish signing you in. Please try again.'
        );
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({
                failureStage: 'connect',
                errorType: 'WalletLoginError',
                errorCode: 'TORUS_LOOKUP',
                networkFailure: false,
                failureMessage: expect.stringContaining('Could not get lookup for [uid] with'),
            })
        );
        const logged = JSON.stringify(sdk.error.mock.calls);
        expect(logged).not.toContain(token());
        expect(logged).not.toContain(token().split('.')[1]);
        expect(logged).not.toContain('eyJzdWIiOiJ4In0');
        expect(logged).not.toContain('test-user');
    });

    it.each([
        ['init', () => sdk.init.mockRejectedValueOnce(new Error('init exploded'))],
        ['identity_check', () => sdk.getUserInfo.mockRejectedValueOnce(new Error('no user info'))],
        ['private_key', () => sdk.request.mockRejectedValueOnce(new Error('no key'))],
    ])('reports %s as the failing step', async (stage, arrange) => {
        arrange();
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toThrow('We couldn’t finish signing you in.');
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({ failureStage: stage })
        );
    });

    it('keeps network failures network-class so the coordinator retries instead of erroring', async () => {
        sdk.connect.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        const error = await derive(strategy).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(Error);
        expect((error as { code?: string }).code).toBe('network_error');
        expect(isNetworkError(error)).toBe(true);
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({ failureStage: 'connect', networkFailure: true })
        );
        expect(await derive(strategy)).toBe('synthetic-private-key');
    });

    it('does not treat ordinary SDK failures as network failures', async () => {
        sdk.connect.mockRejectedValueOnce(new Error('Verifier not supported'));
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        const error = await derive(strategy).catch((e: unknown) => e);
        expect(isNetworkError(error)).toBe(false);
    });
    it.each([
        ['string', () => `token rejected for test-user: ${token()}`],
        [
            'object',
            () => ({ code: 'TORUS_LOOKUP', message: `lookup failed for test-user ${token()}` }),
        ],
        ['object', () => ({ code: 'NO_MESSAGE', detail: `test-user ${token()}` })],
    ])('describes a non-Error %s rejection with redacted detail', async (type, rejection) => {
        sdk.connect.mockRejectedValueOnce(rejection());
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toThrow('We couldn’t finish signing you in.');
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({
                failureStage: 'connect',
                errorType: type,
                failureMessage: expect.stringContaining('[uid]'),
            })
        );
        const logged = JSON.stringify(sdk.error.mock.calls);
        expect(logged).not.toContain(token().split('.')[1]);
        expect(logged).not.toContain('test-user');
    });

    it('classifies a network failure rejected as a plain object', async () => {
        sdk.connect.mockRejectedValueOnce({ message: 'Failed to fetch' });
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        const error = await derive(strategy).catch((e: unknown) => e);
        expect(isNetworkError(error)).toBe(true);
    });

    it('keeps endpoint hostnames in the failure message', async () => {
        sdk.connect.mockRejectedValueOnce(
            new Error('Request to https://api.web3auth.io/signer-service failed with 500')
        );
        const strategy = createWeb3AuthStrategy(config);
        await credentials(strategy);
        await expect(derive(strategy)).rejects.toThrow('We couldn’t finish signing you in.');
        expect(sdk.error).toHaveBeenCalledWith(
            'Web3Auth account setup failed',
            expect.objectContaining({
                failureMessage: expect.stringContaining('api.web3auth.io/signer-service'),
            })
        );
    });
});

describe('Web3Auth sign-in account lookup', () => {
    const lookupConfig = {
        ...config,
        // Trailing slash: the request path must still be single-slashed.
        accountLookup: { serverUrl: 'https://lca.test/api/', tenantId: 'vetpass' },
    };
    const respond = (status: number, body?: unknown): Response =>
        new Response(body === undefined ? null : JSON.stringify(body), { status });
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        sdk.connected = false;
        sdk.native = false;
        sdk.init.mockResolvedValue(undefined);
        sdk.connect.mockResolvedValue(undefined);
        sdk.getUserInfo.mockResolvedValue({ verifierId: 'test-user', verifier: 'test-verifier' });
        sdk.request.mockResolvedValue('synthetic-private-key');
        fetchMock = vi.fn();
        vi.stubGlobal('navigator', {});
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('asks lca-api for the account with the sign-in token and tenant', async () => {
        fetchMock.mockResolvedValueOnce(respond(200, null));
        await createWeb3AuthStrategy(lookupConfig).fetchServerKeyStatus(token(), 'firebase');

        const [url, init] = fetchMock.mock.calls[0]!;
        expect(url).toBe('https://lca.test/api/keys/auth-share');
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({
            'Content-Type': 'application/json',
            'X-Tenant-Id': 'vetpass',
        });
        expect(JSON.parse(init.body)).toEqual({ authToken: token(), providerType: 'firebase' });
    });

    it.each([
        ['no record', () => respond(200, null)],
        [
            'a mid-migration record through its migration login',
            () => respond(200, { keyProvider: 'web3auth', isWeb3AuthLogin: true }),
        ],
        [
            'an SSS account signing in through its migration login',
            () => respond(200, { keyProvider: 'sss', isWeb3AuthLogin: true }),
        ],
    ])('derives the Web3Auth key for %s', async (_label, response) => {
        fetchMock.mockResolvedValueOnce(response());
        const strategy = createWeb3AuthStrategy(lookupConfig);
        await strategy.fetchServerKeyStatus(token(), 'firebase');

        await expect(derive(strategy)).resolves.toBe('synthetic-private-key');
    });

    it.each([
        ['another login (isWeb3AuthLogin: false)', { keyProvider: 'sss', isWeb3AuthLogin: false }],
        ['an older lca-api (no isWeb3AuthLogin)', { keyProvider: 'sss' }],
        [
            'a login PIN-linked to a mid-migration record',
            { keyProvider: 'web3auth', isWeb3AuthLogin: false },
        ],
        ['a mid-migration record from an older lca-api', { keyProvider: 'web3auth' }],
        ['a non-boolean isWeb3AuthLogin', { keyProvider: 'sss', isWeb3AuthLogin: 'true' }],
    ])('stops an existing account for %s', async (_label, body) => {
        fetchMock.mockResolvedValueOnce(respond(200, body));
        const strategy = createWeb3AuthStrategy(lookupConfig);

        await expect(strategy.fetchServerKeyStatus(token(), 'firebase')).rejects.toBeInstanceOf(
            AccountUsesNewerSignInError
        );
        expect(sdk.init).not.toHaveBeenCalled();
    });

    it('stops before Web3Auth when the account already uses SSS', async () => {
        fetchMock.mockResolvedValueOnce(
            respond(200, { keyProvider: 'sss', primaryDid: 'did:key:sss-account' })
        );
        const strategy = createWeb3AuthStrategy(lookupConfig);

        const error = await strategy
            .fetchServerKeyStatus(token(), 'firebase')
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(AccountUsesNewerSignInError);
        expect((error as AccountUsesNewerSignInError).code).toBe('account_uses_newer_sign_in');
        expect(isNetworkError(error)).toBe(false);
        await expect(derive(strategy)).rejects.toThrow('fetchServerKeyStatus must be called first');
        expect(sdk.init).not.toHaveBeenCalled();
    });

    it('does not keep an earlier account usable after a stopped sign-in', async () => {
        fetchMock
            .mockResolvedValueOnce(respond(200, null))
            .mockResolvedValueOnce(respond(200, { keyProvider: 'sss' }));
        const strategy = createWeb3AuthStrategy(lookupConfig);
        await strategy.fetchServerKeyStatus(token('earlier-user'), 'firebase');
        await strategy.fetchServerKeyStatus(token(), 'firebase').catch(() => undefined);

        await expect(derive(strategy)).rejects.toThrow('fetchServerKeyStatus must be called first');
    });

    it('leaves an offline device to the offline UI (network error)', async () => {
        vi.stubGlobal('navigator', { onLine: false });
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const strategy = createWeb3AuthStrategy(lookupConfig);

        const error = await strategy
            .fetchServerKeyStatus(token(), 'firebase')
            .catch((e: unknown) => e);

        expect(isNetworkError(error)).toBe(true);
        await expect(derive(strategy)).rejects.toThrow('fetchServerKeyStatus must be called first');
    });

    it('shows a retryable error, not a silent network error, when lca-api is unreachable online', async () => {
        vi.stubGlobal('navigator', { onLine: true });
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const strategy = createWeb3AuthStrategy(lookupConfig);

        const error = await strategy
            .fetchServerKeyStatus(token(), 'firebase')
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
            'We couldn’t finish signing you in. Please try again.'
        );
        expect(isNetworkError(error)).toBe(false);
        await expect(derive(strategy)).rejects.toThrow('fetchServerKeyStatus must be called first');
    });

    it('gives each retry a longer deadline and starts over after a success', async () => {
        vi.useFakeTimers();
        // A lookup that never answers until its deadline aborts it.
        const hang = (_url: string, init: RequestInit): Promise<Response> =>
            new Promise((_resolve, reject) => {
                init.signal?.addEventListener('abort', () =>
                    reject(new DOMException('The operation was aborted.', 'AbortError'))
                );
            });
        const strategy = createWeb3AuthStrategy(lookupConfig);
        const attempt = async (): Promise<number> => {
            const startedAt = Date.now();
            const pending = strategy
                .fetchServerKeyStatus(token(), 'firebase')
                .catch((e: unknown) => e);
            await vi.runAllTimersAsync();
            const error = await pending;
            expect(isNetworkError(error)).toBe(false);
            return Date.now() - startedAt;
        };

        fetchMock.mockImplementation(hang);
        expect(await attempt()).toBe(3_500);
        expect(await attempt()).toBe(7_000);
        expect(await attempt()).toBe(14_000);
        expect(await attempt()).toBe(28_000);
        expect(await attempt()).toBe(28_000);

        fetchMock.mockReset();
        fetchMock.mockResolvedValueOnce(respond(200, null));
        await strategy.fetchServerKeyStatus(token(), 'firebase');

        fetchMock.mockImplementation(hang);
        expect(await attempt()).toBe(3_500);
    });

    it('keeps the longest lookup deadline under the coordinator status deadline', () => {
        expect(ACCOUNT_LOOKUP_STATUS_TIMEOUT_MS).toBeGreaterThan(28_000);
    });

    it.each([
        ['a server error', () => respond(500)],
        ['a 404 (wrong URL; lca-api answers no record with null)', () => respond(404)],
        ['an unreadable body', () => new Response('not json', { status: 200 })],
    ])('fails closed on %s', async (_label, response) => {
        fetchMock.mockResolvedValueOnce(response());
        const strategy = createWeb3AuthStrategy(lookupConfig);

        await expect(strategy.fetchServerKeyStatus(token(), 'firebase')).rejects.toThrow(
            'We couldn’t finish signing you in.'
        );
        await expect(derive(strategy)).rejects.toThrow('fetchServerKeyStatus must be called first');
    });

    it('keeps Web3Auth for a login lca-api refuses for having no email or phone', async () => {
        fetchMock.mockResolvedValueOnce(
            respond(400, {
                code: 'BAD_REQUEST',
                message: 'User must have an email or phone number',
            })
        );
        const strategy = createWeb3AuthStrategy(lookupConfig);
        await strategy.fetchServerKeyStatus(token(), 'firebase');

        await expect(derive(strategy)).resolves.toBe('synthetic-private-key');
    });

    it.each([
        ['another 400', () => respond(400, { code: 'BAD_REQUEST', message: 'Something else' })],
        ['a 400 without a body', () => respond(400)],
        ['a 401', () => respond(401, { code: 'UNAUTHORIZED', message: 'Invalid token' })],
    ])('fails closed on %s', async (_label, response) => {
        fetchMock.mockResolvedValueOnce(response());
        const strategy = createWeb3AuthStrategy(lookupConfig);

        await expect(strategy.fetchServerKeyStatus(token(), 'firebase')).rejects.toThrow(
            'We couldn’t finish signing you in. Please try again.'
        );
        await expect(derive(strategy)).rejects.toThrow('fetchServerKeyStatus must be called first');
    });

    it('keeps the current credentials while a second lookup is in flight', async () => {
        let answer: (response: Response) => void = () => undefined;
        fetchMock.mockResolvedValueOnce(respond(200, null)).mockImplementationOnce(
            () =>
                new Promise<Response>(resolve => {
                    answer = resolve;
                })
        );
        const strategy = createWeb3AuthStrategy(lookupConfig);
        await strategy.fetchServerKeyStatus(token(), 'firebase');

        const second = strategy.fetchServerKeyStatus(token(), 'firebase');
        await expect(derive(strategy)).resolves.toBe('synthetic-private-key');
        answer(respond(200, null));
        await second;
    });

    it('does not look the account up without accountLookup (legacy key extraction)', async () => {
        await expect(deriveWeb3AuthKey(config, token())).resolves.toBe('synthetic-private-key');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
