import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    authFactory: vi.fn<(name: string, factory: () => unknown) => void>(),
    adapterFactory: vi.fn<(name: string, factory: () => unknown) => void>(),
    createProvider: vi.fn((_config: Record<string, unknown>) => ({ marker: 'provider' })),
    createAdapter: vi.fn((_config: Record<string, unknown>) => ({ marker: 'adapter' })),
    config: vi.fn(() => ({
        serverUrl: 'http://localhost:8081',
        realm: 'learncard',
        clientId: 'learncard-app',
    })),
}));
vi.mock('learn-card-base', () => ({
    registerAuthProviderFactory: mocks.authFactory,
    registerSignInAdapterFactory: mocks.adapterFactory,
    createKeycloakAuthProvider: mocks.createProvider,
    createKeycloakSignInAdapter: mocks.createAdapter,
    getKeycloakConfig: mocks.config,
}));
vi.mock('./keycloakTickets', () => ({
    requestEmailOtpTicket: vi.fn(),
    requestSocialTicket: vi.fn(),
}));

import { registerKeycloakFactories } from './registerKeycloakFactories';

describe('Keycloak factory registration', () => {
    beforeEach(() => vi.clearAllMocks());

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
});
