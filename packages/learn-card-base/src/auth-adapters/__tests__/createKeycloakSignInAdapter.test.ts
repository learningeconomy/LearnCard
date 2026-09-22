import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionError, UnsupportedSignInOperationError } from '@learncard/types';
import type { SignInAdapter } from '@learncard/types';
import { createKeycloakAuthProvider } from '../../auth-providers/createKeycloakAuthProvider';
import {
    createManager,
    createUser,
    keycloakConfig,
} from '../../auth-providers/__tests__/keycloakTestHelpers';
import { createKeycloakSignInAdapter } from '../createKeycloakSignInAdapter';
import type { KeycloakSignInAdapterConfig } from '../keycloakTypes';

vi.mock('../../logging/logger', () => ({ getLogger: (): object => ({ warn: vi.fn() }) }));

let manager = createManager();
let config: KeycloakSignInAdapterConfig;
const replaceState = vi.fn();
const adapters: SignInAdapter[] = [];
const create = (extra: Partial<KeycloakSignInAdapterConfig> = {}): SignInAdapter => {
    const adapter = createKeycloakSignInAdapter({ ...config, ...extra });
    adapters.push(adapter);
    return adapter;
};
const location = (query = ''): void => {
    vi.stubGlobal('window', {
        location: { href: `https://app.example.org/callback${query}` },
        history: { replaceState, state: { keep: true } },
    });
};
const finish = async (adapter: SignInAdapter): Promise<void> => {
    location('?code=code&state=state');
    await adapter.checkRedirectResult?.();
};

beforeEach(() => {
    vi.clearAllMocks();
    manager = createManager();
    config = {
        provider: createKeycloakAuthProvider({ ...keycloakConfig, userManager: manager }),
        requestEmailOtpTicket: vi.fn(),
    };
    location();
});
afterEach(() => {
    for (const adapter of adapters.splice(0)) adapter.cleanup?.();
    vi.unstubAllGlobals();
});

describe('createKeycloakSignInAdapter', () => {
    it('exposes exact capabilities', () => {
        expect(create().capabilities).toEqual({
            emailLink: false,
            emailOtp: true,
            phoneOtp: false,
            google: true,
            apple: true,
            social: true,
            customToken: true,
            deleteAccount: false,
        });
    });
    it('subscribes immediately, hydrates, handles loaded/unloaded events, and unsubscribes', async () => {
        const adapter = create();
        const callback = vi.fn();
        const unsubscribe = adapter.subscribe(callback);
        expect(callback).toHaveBeenCalledWith(null);
        await vi.waitFor(() => expect(adapter.getCurrentUser()).toHaveProperty('id', 'user-1'));
        const loaded = vi.mocked(manager.events.addUserLoaded).mock.calls[0][0];
        const unloaded = vi.mocked(manager.events.addUserUnloaded).mock.calls[0][0];
        loaded(createUser({ profile: { ...createUser().profile, sub: 'user-2' } }));
        expect(adapter.getCurrentUser()).toHaveProperty('id', 'user-2');
        unloaded();
        expect(adapter.getCurrentUser()).toBeNull();
        unsubscribe();
        expect(manager.events.removeUserLoaded).toHaveBeenCalledWith(loaded);
        expect(manager.events.removeUserUnloaded).toHaveBeenCalledWith(unloaded);
    });
    it('does not emit a late storage read after unsubscribe', async () => {
        const adapter = create();
        const callback = vi.fn();
        adapter.subscribe(callback)();
        await Promise.resolve();
        await Promise.resolve();
        expect(callback).toHaveBeenCalledTimes(1);
    });
    it('hops with a login ticket, without prompt=none, and waits for a callback', async () => {
        const adapter = create();
        const completed = vi.fn();
        const signIn = adapter.signInWithCustomToken('ticket').then(completed);
        await Promise.resolve();
        expect(manager.signinRedirect).toHaveBeenCalledWith({
            extraQueryParams: { kc_idp_hint: 'lca-api', login_hint: 'ticket' },
        });
        await Promise.resolve();
        expect(completed).not.toHaveBeenCalled();
        await finish(adapter);
        await signIn;
        expect(completed).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
    });
    it.each(['google', 'apple'] as const)('uses the %s web broker hint', async name => {
        const adapter = create();
        const signIn = name === 'google' ? adapter.signInWithGoogle() : adapter.signInWithApple();
        await Promise.resolve();
        expect(manager.signinRedirect).toHaveBeenCalledWith({
            extraQueryParams: { kc_idp_hint: name },
        });
        await finish(adapter);
        await signIn;
    });
    it.each(['google', 'apple'] as const)('prompts for %s reauthentication', async name => {
        const adapter = create();
        const options = { intent: 'reauthenticate' } as const;
        const signIn =
            name === 'google'
                ? adapter.signInWithGoogle(options)
                : adapter.signInWithApple(options);
        await Promise.resolve();
        expect(manager.signinRedirect).toHaveBeenCalledWith({
            extraQueryParams: { kc_idp_hint: name, prompt: 'login' },
        });
        await finish(adapter);
        await signIn;
    });
    it.each(['google', 'apple'] as const)(
        'acquires native %s proof then a ticket then a hop',
        async name => {
            const native = vi.fn(async () => 'native-id-token');
            const ticket = vi.fn(async () => 'ticket');
            const open = vi.fn(async () => undefined);
            const adapter = create({
                isNative: () => true,
                nativeSocial: { [name]: native },
                requestSocialTicket: ticket,
                openAuthorization: open,
            });
            const signIn =
                name === 'google' ? adapter.signInWithGoogle() : adapter.signInWithApple();
            await vi.waitFor(() =>
                expect(open).toHaveBeenCalledWith({
                    extraQueryParams: { kc_idp_hint: 'lca-api', login_hint: 'ticket' },
                })
            );
            expect(ticket).toHaveBeenCalledWith(name, 'native-id-token');
            expect(native.mock.invocationCallOrder[0]).toBeLessThan(
                ticket.mock.invocationCallOrder[0]
            );
            await finish(adapter);
            await signIn;
        }
    );
    it('falls back to web without a native ticket exchange', async () => {
        const native = vi.fn();
        const adapter = create({ isNative: () => true, nativeSocial: { google: native } });
        const signIn = adapter.signInWithGoogle();
        await Promise.resolve();
        expect(native).not.toHaveBeenCalled();
        expect(manager.signinRedirect).toHaveBeenCalledWith({
            extraQueryParams: { kc_idp_hint: 'google' },
        });
        await finish(adapter);
        await signIn;
    });
    it('exchanges a known OIDC credential for a ticket', async () => {
        const requestSocialTicket = vi.fn(async () => 'social-ticket');
        const adapter = create({ requestSocialTicket });
        const signIn = adapter.signInWithOidcCredential?.('apple', 'apple-id-token');
        await vi.waitFor(() =>
            expect(manager.signinRedirect).toHaveBeenCalledWith({
                extraQueryParams: { kc_idp_hint: 'lca-api', login_hint: 'social-ticket' },
            })
        );
        expect(requestSocialTicket).toHaveBeenCalledWith('apple', 'apple-id-token');
        await finish(adapter);
        await signIn;
    });
    it('rejects unknown OIDC providers', async () => {
        await expect(create().signInWithOidcCredential?.('unknown', 'id')).rejects.toMatchObject({
            name: 'UnsupportedSignInOperationError',
            operation: 'signInWithOidcCredential',
            providerType: 'keycloak',
        });
    });
    it('rejects OIDC sign-in without a ticket exchange', async () => {
        await expect(create().signInWithOidcCredential?.('google', 'id')).rejects.toBeInstanceOf(
            UnsupportedSignInOperationError
        );
    });
    it('handles code/state callbacks and cleans only OIDC URL parameters', async () => {
        location('?code=c&state=s&keep=yes#tab');
        expect(await create().checkRedirectResult?.()).toHaveProperty('id', 'user-1');
        expect(manager.signinCallback).toHaveBeenCalledWith(
            'https://app.example.org/callback?code=c&state=s&keep=yes#tab'
        );
        expect(replaceState).toHaveBeenCalledWith(
            { keep: true },
            '',
            'https://app.example.org/callback?keep=yes#tab'
        );
    });
    it('maps login_required to a friendly session error and cleans the URL', async () => {
        location('?error=login_required&state=s');
        vi.mocked(manager.signinCallback).mockRejectedValue(new Error('login_required'));
        await expect(create().checkRedirectResult?.()).rejects.toMatchObject({
            name: 'AuthSessionError',
            message: 'Sign-in expired. Please try again.',
        });
        expect(replaceState).toHaveBeenCalled();
    });
    it.each(['', '?code=c', '?state=s'])(
        'ignores incomplete callback parameters %s',
        async query => {
            location(query);
            expect(await create().checkRedirectResult?.()).toBeNull();
            expect(manager.signinCallback).not.toHaveBeenCalled();
        }
    );
    it('rejects missing callback users', async () => {
        location('?code=c&state=s');
        vi.mocked(manager.signinCallback).mockResolvedValue(undefined);
        await expect(create().checkRedirectResult?.()).rejects.toBeInstanceOf(AuthSessionError);
    });
    it('propagates navigation failures', async () => {
        vi.mocked(manager.signinRedirect).mockRejectedValue(new Error('navigation failed'));
        await expect(create().signInWithCustomToken('ticket')).rejects.toThrow('navigation failed');
    });

    it('does not complete reauthentication on an unrelated token renewal', async () => {
        const adapter = create();
        adapter.subscribe(vi.fn());
        const completed = vi.fn();
        const signIn = adapter.signInWithGoogle({ intent: 'reauthenticate' }).then(completed);
        await manager.signinSilent();
        await Promise.resolve();
        expect(completed).not.toHaveBeenCalled();
        await finish(adapter);
        await signIn;
        expect(completed).toHaveBeenCalledOnce();
    });

    it.each(['signIn', 'reauthenticate'] as const)(
        'owns callback side effects for %s despite SDK events',
        async intent => {
            const onSignedIn = vi.fn();
            const adapter = create({ onSignedIn });
            adapter.subscribe(vi.fn());
            const signIn = adapter.signInWithGoogle({ intent });
            await finish(adapter);
            await signIn;
            expect(onSignedIn).toHaveBeenCalledTimes(intent === 'signIn' ? 1 : 0);
        }
    );

    it('settles native sign-in through the provider callback, not a loaded event', async () => {
        const adapter = create({
            openAuthorization: async () => {
                await config.provider.handleRedirectCallback(
                    'com.example.app:/callback?code=c&state=s'
                );
            },
        });
        expect(await adapter.signInWithCustomToken('ticket')).toHaveProperty('id', 'user-1');
    });

    it('permits retry after synchronous opener failure', async () => {
        const open = vi.fn((): Promise<void> => {
            throw new Error('open failed');
        });
        const adapter = create({ openAuthorization: open });
        await expect(adapter.signInWithCustomToken('ticket')).rejects.toThrow('open failed');
        open.mockResolvedValue(undefined);
        const retry = adapter.signInWithCustomToken('ticket');
        await finish(adapter);
        await retry;
    });

    it('does not start navigation after cleanup during native proof', async () => {
        let resolveProof: ((token: string) => void) | undefined;
        const proof = new Promise<string>(resolve => {
            resolveProof = resolve;
        });
        const adapter = create({
            isNative: () => true,
            nativeSocial: { google: () => proof },
            requestSocialTicket: async () => 'ticket',
        });
        const signIn = adapter.signInWithGoogle();
        const rejection = expect(signIn).rejects.toBeInstanceOf(AuthSessionError);
        adapter.cleanup?.();
        resolveProof?.('id-token');
        await rejection;
        expect(manager.signinRedirect).not.toHaveBeenCalled();
    });

    it('does not restore adapter state after cleanup during a callback', async () => {
        let resolveCallback: ((user: ReturnType<typeof createUser>) => void) | undefined;
        vi.mocked(manager.signinCallback).mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveCallback = resolve;
                })
        );
        const onSignedIn = vi.fn();
        const adapter = create({ onSignedIn });
        location('?code=c&state=s');
        const result = adapter.checkRedirectResult?.();
        const rejection = expect(result).rejects.toBeInstanceOf(AuthSessionError);
        adapter.cleanup?.();
        resolveCallback?.(createUser());
        await rejection;
        expect(adapter.getCurrentUser()).toBeNull();
        expect(onSignedIn).not.toHaveBeenCalled();
    });
    it('delegates sign-out', async () => {
        await create().signOut();
        expect(manager.removeUser).toHaveBeenCalledOnce();
    });

    it('cancels after callback completion while native navigation remains pending', async () => {
        const adapter = create({ openAuthorization: () => new Promise(() => undefined) });
        const signIn = adapter.signInWithCustomToken('ticket');
        const rejection = expect(signIn).rejects.toBeInstanceOf(AuthSessionError);
        await config.provider.handleRedirectCallback('com.app:/callback?code=c&state=s');
        adapter.cleanup?.();
        await rejection;
    });

    it('propagates an independently delivered native callback failure', async () => {
        const adapter = create({ openAuthorization: async () => undefined });
        const signIn = adapter.signInWithCustomToken('ticket');
        const rejection = expect(signIn).rejects.toThrow('callback failed');
        vi.mocked(manager.signinCallback).mockRejectedValue(new Error('callback failed'));
        await expect(
            config.provider.handleRedirectCallback('com.app:/callback?error=failed&state=s')
        ).rejects.toThrow('callback failed');
        await rejection;
    });

    it('does not settle a newer authorization with a callback already in flight', async () => {
        let finishOldCallback: ((user: ReturnType<typeof createUser>) => void) | undefined;
        let failNavigation: ((error: unknown) => void) | undefined;
        const open = vi.fn(
            () =>
                new Promise<void>((_resolve, reject) => {
                    failNavigation = reject;
                })
        );
        const adapter = create({ openAuthorization: open });
        const oldSignIn = adapter.signInWithCustomToken('old-ticket');
        const oldRejection = expect(oldSignIn).rejects.toThrow('cancelled');
        vi.mocked(manager.signinCallback).mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    finishOldCallback = resolve;
                })
        );
        const oldCallback = config.provider.handleRedirectCallback(
            'com.app:/callback?code=old&state=old'
        );
        await Promise.resolve();
        failNavigation?.(new Error('cancelled'));
        await oldRejection;
        open.mockResolvedValue(undefined);
        const completed = vi.fn();
        const newSignIn = adapter.signInWithCustomToken('new-ticket').then(completed);
        finishOldCallback?.(createUser());
        await oldCallback;
        await Promise.resolve();
        expect(completed).not.toHaveBeenCalled();
        await finish(adapter);
        await newSignIn;
    });
    it('rejects unsupported actions with typed operation names', async () => {
        const adapter = create();
        const operations: Array<[string, () => Promise<unknown> | undefined]> = [
            ['sendEmailLink', () => adapter.sendEmailLink('email')],
            ['verifyEmailLink', () => adapter.verifyEmailLink('email', 'link')],
            ['sendPhoneOtp', () => adapter.sendPhoneOtp('phone')],
            ['confirmPhoneOtp', () => adapter.confirmPhoneOtp('code')],
            ['confirmPhoneOtp', () => adapter.confirmPhoneOtp({ verificationId: 'id' }, 123)],
            ['confirmNativePhoneOtp', () => adapter.confirmNativePhoneOtp?.('id', 123)],
            ['deleteAccount', () => adapter.deleteAccount()],
            ['updateProfile', () => adapter.updateProfile?.({ displayName: 'Name' })],
            ['setSessionPersistence', () => adapter.setSessionPersistence?.(true)],
        ];
        for (const [operation, action] of operations) {
            await expect(action()).rejects.toBeInstanceOf(UnsupportedSignInOperationError);
            await expect(action()).rejects.toMatchObject({ operation, providerType: 'keycloak' });
        }
    });
    it('reports email links as unsupported hints', async () => {
        const adapter = create();
        expect(adapter.isEmailLink('link')).toBe(false);
        expect(await adapter.validateEmailLink('link')).toBe(false);
    });
    it('returns safe no-op phone unsubscribers', () => {
        const adapter = create();
        const callback = vi.fn();
        adapter.onPhoneCodeSent(callback)();
        adapter.onPhoneVerificationCompleted(callback)();
        adapter.onPhoneVerificationFailed(callback)();
        expect(callback).not.toHaveBeenCalled();
    });
    it('removes event handlers on cleanup', () => {
        const adapter = create();
        adapter.subscribe(vi.fn());
        adapter.cleanup?.();
        expect(manager.events.removeUserLoaded).toHaveBeenCalled();
        expect(manager.events.removeUserUnloaded).toHaveBeenCalled();
    });
});
