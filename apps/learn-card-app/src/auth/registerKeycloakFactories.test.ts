import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface MockProviderConfig {
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    navigate?: (url: string) => Promise<void>;
    [key: string]: unknown;
}

interface MockAdapterConfig {
    openAuthorization?: (args: { extraQueryParams: Record<string, string> }) => Promise<void>;
    nativeSocial?: { google: () => Promise<string>; apple: () => Promise<string> };
    [key: string]: unknown;
}

const mocks = vi.hoisted(() => ({
    authFactory: vi.fn<(name: string, factory: () => unknown) => void>(),
    adapterFactory: vi.fn<(name: string, factory: () => unknown) => void>(),
    createProvider: vi.fn((_config: MockProviderConfig) => ({
        marker: 'provider',
        userManager: { signinRedirect: vi.fn(async () => undefined) },
        handleRedirectCallback: vi.fn(async () => ({ id: 'user-1' })),
    })),
    createAdapter: vi.fn((_config: MockAdapterConfig) => ({ marker: 'adapter' })),
    config: vi.fn(() => ({
        serverUrl: 'http://localhost:8081',
        realm: 'learncard',
        clientId: 'learncard-app',
    })),
    isNative: false,
    resolvedTenantConfig: vi.fn((): { native?: { bundleId?: string } } => ({
        native: { bundleId: 'com.learncard.app' },
    })),
    openNativeAuthSession: vi.fn(),
    getNativeGoogleIdToken: vi.fn(),
    getNativeAppleIdToken: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => mocks.isNative },
}));
vi.mock('learn-card-base', () => ({
    registerAuthProviderFactory: mocks.authFactory,
    registerSignInAdapterFactory: mocks.adapterFactory,
    createKeycloakAuthProvider: mocks.createProvider,
    createKeycloakSignInAdapter: mocks.createAdapter,
    getKeycloakConfig: mocks.config,
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));
vi.mock('../config/tenantConfigState', () => ({
    getResolvedTenantConfig: mocks.resolvedTenantConfig,
}));
vi.mock('./nativeAuthSession', () => ({
    openNativeAuthSession: mocks.openNativeAuthSession,
}));
vi.mock('./nativeSocialTokens', () => ({
    getNativeGoogleIdToken: mocks.getNativeGoogleIdToken,
    getNativeAppleIdToken: mocks.getNativeAppleIdToken,
}));
vi.mock('./keycloakTickets', () => ({
    requestEmailOtpTicket: vi.fn(),
    requestSocialTicket: vi.fn(),
}));

import { registerKeycloakFactories } from './registerKeycloakFactories';
import { beginKeycloakReauth, readKeycloakReauth } from './keycloakReauth';

describe('Keycloak factory registration', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        mocks.isNative = false;
        mocks.resolvedTenantConfig.mockReturnValue({ native: { bundleId: 'com.learncard.app' } });
    });

    it('registers only Keycloak factories without touching Firebase or constructing a session', () => {
        registerKeycloakFactories();
        expect(mocks.authFactory).toHaveBeenCalledExactlyOnceWith('keycloak', expect.any(Function));
        expect(mocks.adapterFactory).toHaveBeenCalledExactlyOnceWith(
            'keycloak',
            expect.any(Function)
        );
        expect(mocks.createProvider).not.toHaveBeenCalled();
        expect(mocks.config).not.toHaveBeenCalled();
    });

    it('shares one provider between both factories regardless of resolution order', () => {
        registerKeycloakFactories();
        const createAdapter = mocks.adapterFactory.mock.calls[0]?.[1];
        const createProvider = mocks.authFactory.mock.calls[0]?.[1];
        createAdapter?.();
        createProvider?.();
        expect(mocks.createProvider).toHaveBeenCalledTimes(1);
        expect(mocks.createProvider).toHaveBeenCalledWith(
            expect.objectContaining({
                redirectUri: `${window.location.origin}/login`,
                postLogoutRedirectUri: `${window.location.origin}/login`,
            })
        );
        expect(mocks.createAdapter).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: mocks.createProvider.mock.results[0]?.value,
                requestEmailOtpTicket: expect.any(Function),
                requestSocialTicket: expect.any(Function),
                isNative: expect.any(Function),
            })
        );
        expect(mocks.createAdapter.mock.calls[0]?.[0]).not.toHaveProperty('nativeSocial');
    });

    it('binds the reauth request to OIDC state but clears abandoned intent on normal login', async () => {
        registerKeycloakFactories();
        mocks.adapterFactory.mock.calls[0]?.[1]();
        const open = mocks.createAdapter.mock.calls[0]?.[0].openAuthorization;
        if (typeof open !== 'function') throw new Error('Missing authorization callback');
        const intent = beginKeycloakReauth('same-user', 'account-recovery');
        const extraQueryParams = { prompt: 'login', kc_idp_hint: 'lca-api', login_hint: 'ticket' };
        await open({ extraQueryParams });
        const manager = mocks.createProvider.mock.results[0]?.value.userManager;
        expect(manager.signinRedirect).toHaveBeenLastCalledWith({
            extraQueryParams,
            state: { reauthId: intent.id },
        });
        await open({ extraQueryParams: { kc_idp_hint: 'google' } });
        expect(manager.signinRedirect).toHaveBeenLastCalledWith({
            extraQueryParams: { kc_idp_hint: 'google' },
        });
        expect(readKeycloakReauth()).toBeNull();
    });

    describe('native (Capacitor) wiring', () => {
        beforeEach(() => {
            mocks.isNative = true;
        });

        it('uses the bundle-id custom scheme as the redirect URI and skips the end-session redirect URI', () => {
            registerKeycloakFactories();
            const getProvider = mocks.authFactory.mock.calls[0]?.[1];
            getProvider?.();
            expect(mocks.createProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    redirectUri: 'com.learncard.app://login',
                    postLogoutRedirectUri: undefined,
                    navigate: expect.any(Function),
                })
            );
        });

        it('throws a clear error when the tenant config is missing native.bundleId', () => {
            mocks.resolvedTenantConfig.mockReturnValue({});
            registerKeycloakFactories();
            const getProvider = mocks.authFactory.mock.calls[0]?.[1];
            expect(() => getProvider?.()).toThrow(/native\.bundleId/);
            expect(mocks.createProvider).not.toHaveBeenCalled();
        });

        it('opens a native auth session and completes the callback through the provider', async () => {
            registerKeycloakFactories();
            const getProvider = mocks.authFactory.mock.calls[0]?.[1];
            getProvider?.();
            const navigate = mocks.createProvider.mock.calls[0]?.[0].navigate;
            if (typeof navigate !== 'function') throw new Error('Missing navigate hook');
            const provider = mocks.createProvider.mock.results[0]?.value;
            mocks.openNativeAuthSession.mockResolvedValue('com.learncard.app://login?code=abc');

            await navigate(
                'https://auth.example.org/realms/learncard/protocol/openid-connect/auth'
            );

            expect(mocks.openNativeAuthSession).toHaveBeenCalledWith(
                'https://auth.example.org/realms/learncard/protocol/openid-connect/auth',
                {
                    callbackUrlPrefix: 'com.learncard.app://login',
                    callbackScheme: 'com.learncard.app',
                }
            );
            expect(provider.handleRedirectCallback).toHaveBeenCalledWith(
                'com.learncard.app://login?code=abc'
            );
        });

        it('uses authBridgeUrl if provided in config', async () => {
            mocks.config.mockReturnValue({
                serverUrl: 'http://localhost:8081',
                realm: 'learncard',
                clientId: 'learncard-app',
                authBridgeUrl: 'https://app.example.com/auth/continue.html',
            });
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => new Response(null))
            );
            registerKeycloakFactories();
            const getProvider = mocks.authFactory.mock.calls[0]?.[1];
            getProvider?.();
            const navigate = mocks.createProvider.mock.calls[0]?.[0].navigate;
            if (typeof navigate !== 'function') throw new Error('Missing navigate hook');
            const provider = mocks.createProvider.mock.results[0]?.value;
            mocks.openNativeAuthSession.mockResolvedValue('com.learncard.app://login?code=abc');

            await navigate(
                'https://auth.example.org/realms/learncard/protocol/openid-connect/auth'
            );

            expect(mocks.openNativeAuthSession).toHaveBeenCalledWith(
                'https://app.example.com/auth/continue.html#next=https%3A%2F%2Fauth.example.org%2Frealms%2Flearncard%2Fprotocol%2Fopenid-connect%2Fauth',
                {
                    callbackUrlPrefix: 'com.learncard.app://login',
                    callbackScheme: 'com.learncard.app',
                }
            );
            expect(provider.handleRedirectCallback).toHaveBeenCalledWith(
                'com.learncard.app://login?code=abc'
            );
        });

        it('opens Keycloak directly when the bridge page is unreachable', async () => {
            mocks.config.mockReturnValue({
                serverUrl: 'http://localhost:8081',
                realm: 'learncard',
                clientId: 'learncard-app',
                authBridgeUrl: 'http://localhost:3000/auth/continue.html',
            });
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => {
                    throw new TypeError('Load failed');
                })
            );
            registerKeycloakFactories();
            const getProvider = mocks.authFactory.mock.calls[0]?.[1];
            getProvider?.();
            const navigate = mocks.createProvider.mock.calls[0]?.[0].navigate;
            if (typeof navigate !== 'function') throw new Error('Missing navigate hook');
            mocks.openNativeAuthSession.mockResolvedValue('com.learncard.app://login?code=abc');

            await navigate(
                'https://auth.example.org/realms/learncard/protocol/openid-connect/auth'
            );

            expect(mocks.openNativeAuthSession).toHaveBeenCalledWith(
                'https://auth.example.org/realms/learncard/protocol/openid-connect/auth',
                expect.anything()
            );
        });

        it('propagates handleRedirectCallback failures out of navigate without swallowing them', async () => {
            registerKeycloakFactories();
            const getProvider = mocks.authFactory.mock.calls[0]?.[1];
            getProvider?.();
            const navigate = mocks.createProvider.mock.calls[0]?.[0].navigate;
            if (typeof navigate !== 'function') throw new Error('Missing navigate hook');
            const provider = mocks.createProvider.mock.results[0]?.value;
            mocks.openNativeAuthSession.mockResolvedValue(
                'com.learncard.app://login?error=access_denied'
            );
            provider.handleRedirectCallback.mockRejectedValue(new Error('Sign-in cancelled'));

            await expect(
                navigate('https://auth.example.org/realms/learncard/protocol/openid-connect/auth')
            ).rejects.toThrow('Sign-in cancelled');
        });

        it('always forces prompt=login, computing the reauth-clear decision from the original args', async () => {
            registerKeycloakFactories();
            mocks.adapterFactory.mock.calls[0]?.[1]();
            const open = mocks.createAdapter.mock.calls[0]?.[0].openAuthorization;
            if (typeof open !== 'function') throw new Error('Missing authorization callback');
            const intent = beginKeycloakReauth('same-user', 'account-recovery');
            const extraQueryParams = {
                prompt: 'login',
                kc_idp_hint: 'lca-api',
                login_hint: 'ticket',
            };

            await open({ extraQueryParams });
            const manager = mocks.createProvider.mock.results[0]?.value.userManager;
            expect(manager.signinRedirect).toHaveBeenLastCalledWith({
                extraQueryParams,
                state: { reauthId: intent.id },
            });

            // No prompt in the original args -> still clears the abandoned intent,
            // and native still forces prompt=login on top of the caller's params.
            await open({ extraQueryParams: { kc_idp_hint: 'google' } });
            expect(manager.signinRedirect).toHaveBeenLastCalledWith({
                extraQueryParams: { kc_idp_hint: 'google', prompt: 'login' },
            });
            expect(readKeycloakReauth()).toBeNull();
        });

        it('passes native Google/Apple ID token getters as nativeSocial', () => {
            registerKeycloakFactories();
            mocks.adapterFactory.mock.calls[0]?.[1]();
            expect(mocks.createAdapter).toHaveBeenCalledWith(
                expect.objectContaining({
                    nativeSocial: {
                        google: mocks.getNativeGoogleIdToken,
                        apple: mocks.getNativeAppleIdToken,
                    },
                })
            );
        });
    });
});
