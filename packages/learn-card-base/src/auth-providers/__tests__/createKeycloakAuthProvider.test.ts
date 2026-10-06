import { describe, it, expect, vi } from 'vitest';
import { ErrorResponse, InMemoryWebStorage, User, WebStorageStateStore } from 'oidc-client-ts';
import { AuthSessionError } from '@learncard/types';
import { createKeycloakAuthProvider, trimTrailingSlashes } from '../createKeycloakAuthProvider';
import type {
    KeycloakAuthProvider,
    KeycloakAuthProviderConfig,
} from '../createKeycloakAuthProvider';
import { createManager, createUser, keycloakConfig } from './keycloakTestHelpers';

describe('trimTrailingSlashes', () => {
    it('leaves a URL with no trailing slash untouched', () => {
        expect(trimTrailingSlashes('https://auth.example.org')).toBe('https://auth.example.org');
    });
    it('strips a single trailing slash', () => {
        expect(trimTrailingSlashes('https://auth.example.org/')).toBe('https://auth.example.org');
    });
    it('strips many trailing slashes in linear time', () => {
        const input = `https://auth.example.org${'/'.repeat(50_000)}`;
        const start = performance.now();
        const result = trimTrailingSlashes(input);
        expect(performance.now() - start).toBeLessThan(50);
        expect(result).toBe('https://auth.example.org');
    });
    it('returns an empty string unchanged', () => {
        expect(trimTrailingSlashes('')).toBe('');
    });
    it('trims a string made entirely of slashes down to empty', () => {
        expect(trimTrailingSlashes('////')).toBe('');
    });
    it('does not touch interior slashes', () => {
        expect(trimTrailingSlashes('https://auth.example.org/realms/x//')).toBe(
            'https://auth.example.org/realms/x'
        );
    });
});

const constructed = vi.hoisted(() => vi.fn());
vi.mock('oidc-client-ts', async importOriginal => {
    const sdk = await importOriginal<typeof import('oidc-client-ts')>();
    return {
        ...sdk,
        UserManager: class extends sdk.UserManager {
            constructor(...args: ConstructorParameters<typeof sdk.UserManager>) {
                constructed(...args);
                super(...args);
            }
        },
    };
});

const create = (
    userManager = createManager(),
    extra: Partial<KeycloakAuthProviderConfig> = {}
): KeycloakAuthProvider => createKeycloakAuthProvider({ ...keycloakConfig, userManager, ...extra });

describe('createKeycloakAuthProvider', () => {
    it('tracks automatic renewal on an injected real SDK manager', async () => {
        const sdk = await vi.importActual<typeof import('oidc-client-ts')>('oidc-client-ts');
        const storage = new InMemoryWebStorage();
        const manager = new sdk.UserManager({
            authority: `${keycloakConfig.serverUrl}realms/${keycloakConfig.realm}`,
            client_id: keycloakConfig.clientId,
            redirect_uri: keycloakConfig.redirectUri,
            automaticSilentRenew: false,
            userStore: new WebStorageStateStore({ store: storage }),
            stateStore: new WebStorageStateStore({ store: storage }),
        });
        let release!: () => void;
        let entered!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const started = new Promise<void>(resolve => {
            entered = resolve;
        });
        vi.spyOn(manager, 'signinSilent').mockImplementation(async () => {
            entered();
            await gate;
            const user = createUser();
            await manager.storeUser(user);
            await manager.events.load(user);
            return user;
        });
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: storage,
            userManager: manager,
        });
        const loaded = vi.fn();
        manager.events.addUserLoaded(loaded);
        const old = manager.signinSilent().catch(error => error);
        await started;
        await provider.signOut();
        const fresh = provider.beginSignIn();
        release();
        expect(await old).toBeInstanceOf(AuthSessionError);
        await fresh;
        const freshUser = createUser({ profile: { ...createUser().profile, sub: 'fresh' } });
        await manager.storeUser(freshUser);
        expect(loaded).not.toHaveBeenCalled();
        expect(await provider.getCurrentUser()).toHaveProperty('id', 'fresh');
    });

    it('rejects late redirect creation before navigation and removes its PKCE state', async () => {
        const sdk = await vi.importActual<typeof import('oidc-client-ts')>('oidc-client-ts');
        const storage = new InMemoryWebStorage();
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: storage,
            userStore: storage,
        });
        const navigate = vi.fn();
        vi.stubGlobal('window', { self: { location: { assign: navigate }, stop: vi.fn() } });
        let release!: () => void;
        let entered!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const started = new Promise<void>(resolve => {
            entered = resolve;
        });
        let stateId = '';
        const request = vi
            .spyOn(sdk.OidcClient.prototype, 'createSigninRequest')
            .mockImplementation(async function () {
                entered();
                await gate;
                const state = await sdk.SigninState.create({
                    authority: provider.userManager.settings.authority,
                    client_id: keycloakConfig.clientId,
                    redirect_uri: keycloakConfig.redirectUri,
                    scope: 'openid',
                    code_verifier: true,
                });
                stateId = state.id;
                await this.settings.stateStore.set(stateId, state.toStorageString());
                return { url: `https://auth.example.org/authorize?state=${stateId}`, state };
            });
        try {
            const old = provider.userManager
                .signinRedirect({ extraQueryParams: {} })
                .catch(error => error);
            await started;
            await provider.signOut();
            release();
            expect(await old).toBeInstanceOf(AuthSessionError);
            expect(navigate).not.toHaveBeenCalled();
            expect(storage.getItem(`oidc.${stateId}`)).toBeFalsy();
            const reloaded = createKeycloakAuthProvider({
                ...keycloakConfig,
                stateStore: storage,
                userStore: storage,
            });
            await expect(
                reloaded.handleRedirectCallback(
                    `${keycloakConfig.redirectUri}?code=old&state=${stateId}`
                )
            ).rejects.toBeInstanceOf(AuthSessionError);
        } finally {
            request.mockRestore();
            vi.unstubAllGlobals();
        }
    });

    it('allows retry after a one-time logout cleanup failure', async () => {
        const manager = createManager();
        manager.removeUser.mockRejectedValueOnce(new Error('storage unavailable'));
        const provider = create(manager);
        await expect(provider.signOut()).rejects.toThrow('storage unavailable');
        await expect(provider.beginSignIn()).rejects.toThrow('storage unavailable');
        await provider.signOut();
        await provider.beginSignIn();
        expect(await provider.handleRedirectCallback()).toHaveProperty('id', 'user-1');
    });

    it('preserves SDK async loaded-listener ordering and rejection handling', async () => {
        const sdk = await vi.importActual<typeof import('oidc-client-ts')>('oidc-client-ts');
        const storage = new InMemoryWebStorage();
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: storage,
            userStore: storage,
        });
        const order: string[] = [];
        let release!: () => void;
        let entered!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const started = new Promise<void>(resolve => {
            entered = resolve;
        });
        const first = async (): Promise<void> => {
            entered();
            await gate;
            order.push('first');
        };
        const second = (): void => {
            order.push('second');
        };
        provider.userManager.events.addUserLoaded(first);
        provider.userManager.events.addUserLoaded(second);
        const callback = vi
            .spyOn(sdk.UserManager.prototype, 'signinCallback')
            .mockImplementation(async function () {
                const user = createUser();
                await this.storeUser(user);
                await this.events.load(user);
                return user;
            });
        try {
            const work = provider.handleRedirectCallback();
            await started;
            expect(order).toEqual([]);
            release();
            await work;
            expect(order).toEqual(['first', 'second']);
            provider.userManager.events.removeUserLoaded(first);
            provider.userManager.events.removeUserLoaded(second);
            provider.userManager.events.addUserLoaded(async () => {
                throw new Error('listener failed');
            });
            await expect(provider.handleRedirectCallback()).rejects.toThrow('listener failed');
        } finally {
            callback.mockRestore();
        }
    });

    it.each(['callback', 'automatic', 'manual'] as const)(
        'rejects an old %s at the real SDK storage boundary and allows fresh work',
        async mode => {
            const sdk = await vi.importActual<typeof import('oidc-client-ts')>('oidc-client-ts');
            let release!: () => void;
            let entered!: () => void;
            const gate = new Promise<void>(resolve => {
                release = resolve;
            });
            const started = new Promise<void>(resolve => {
                entered = resolve;
            });
            const method = mode === 'callback' ? 'signinCallback' : 'signinSilent';
            const spy = vi
                .spyOn(sdk.UserManager.prototype, method)
                .mockImplementation(async function () {
                    entered();
                    await gate;
                    const user = createUser();
                    await this.storeUser(user);
                    await this.events.load(user);
                    return user;
                });
            try {
                const storage = new InMemoryWebStorage();
                const provider = createKeycloakAuthProvider({
                    ...keycloakConfig,
                    stateStore: storage,
                    userStore: storage,
                });
                await provider.userManager.storeUser(createUser());
                const loaded = vi.fn();
                provider.userManager.events.addUserLoaded(loaded);
                const work =
                    mode === 'callback'
                        ? provider.handleRedirectCallback()
                        : mode === 'automatic'
                          ? provider.userManager.signinSilent()
                          : provider.getIdToken(true);
                const outcome = work.catch(error => error);
                await started;
                await provider.signOut();
                const fresh = provider.beginSignIn();
                release();
                expect(await outcome).toBeInstanceOf(AuthSessionError);
                await fresh;
                expect(await provider.userManager.getUser()).toBeNull();
                expect(loaded).not.toHaveBeenCalled();
                await provider.userManager.storeUser(createUser());
                expect(
                    await (mode === 'callback'
                        ? provider.handleRedirectCallback()
                        : provider.userManager.signinSilent())
                ).not.toBeNull();
                expect(loaded).toHaveBeenCalledOnce();
            } finally {
                spy.mockRestore();
            }
        }
    );

    it('drains an async store before clearing logout and admitting a fresh session', async () => {
        const sdk = await vi.importActual<typeof import('oidc-client-ts')>('oidc-client-ts');
        const memory = new InMemoryWebStorage();
        let release!: () => void;
        let entered!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const started = new Promise<void>(resolve => {
            entered = resolve;
        });
        let delay = true;
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: memory,
            userStore: {
                get length() {
                    return memory.length;
                },
                key: index => memory.key(index),
                getItem: key => memory.getItem(key),
                removeItem: key => memory.removeItem(key),
                setItem: async (key, value) => {
                    if (delay) {
                        entered();
                        await gate;
                        delay = false;
                    }
                    memory.setItem(key, value);
                },
            },
        });
        const spy = vi
            .spyOn(sdk.UserManager.prototype, 'signinCallback')
            .mockImplementation(async function () {
                const user = createUser();
                await this.storeUser(user);
                await this.events.load(user);
                return user;
            });
        try {
            const loaded = vi.fn();
            provider.userManager.events.addUserLoaded(loaded);
            const old = provider.handleRedirectCallback().catch(error => error);
            await started;
            const logout = provider.signOut();
            const fresh = provider.beginSignIn();
            release();
            await logout;
            expect(await old).toBeInstanceOf(AuthSessionError);
            await fresh;
            expect(await provider.getCurrentUser()).toBeNull();
            expect(loaded).not.toHaveBeenCalled();
            await provider.handleRedirectCallback();
            expect(await provider.getCurrentUser()).toHaveProperty('id', 'user-1');
            expect(loaded).toHaveBeenCalledOnce();
        } finally {
            spy.mockRestore();
        }
    });

    it('invalidates only this client pending PKCE states, including callbacks during a new attempt', async () => {
        const storage = new InMemoryWebStorage();
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: storage,
            userStore: storage,
        });
        storage.setItem(
            'oidc.old',
            JSON.stringify({
                authority: provider.userManager.settings.authority,
                client_id: keycloakConfig.clientId,
            })
        );
        storage.setItem(
            'oidc.other',
            JSON.stringify({
                authority: provider.userManager.settings.authority,
                client_id: 'other',
            })
        );
        await provider.signOut();
        await provider.beginSignIn();
        expect(storage.getItem('oidc.old')).toBeFalsy();
        expect(storage.getItem('oidc.other')).not.toBeNull();
        await expect(
            provider.handleRedirectCallback(`${keycloakConfig.redirectUri}?code=old&state=old`)
        ).rejects.toBeInstanceOf(AuthSessionError);
        expect(await provider.getCurrentUser()).toBeNull();
    });

    it('gates loaded listeners when logout occurs after storage but before SDK dispatch', async () => {
        const sdk = await vi.importActual<typeof import('oidc-client-ts')>('oidc-client-ts');
        const storage = new InMemoryWebStorage();
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: storage,
            userStore: storage,
        });
        const loaded = vi.fn();
        provider.userManager.events.addUserLoaded(loaded);
        const spy = vi
            .spyOn(sdk.UserManager.prototype, 'signinCallback')
            .mockImplementation(async function () {
                const user = createUser();
                await this.storeUser(user);
                await provider.signOut();
                await this.events.load(user);
                return user;
            });
        try {
            await expect(provider.handleRedirectCallback()).rejects.toBeInstanceOf(
                AuthSessionError
            );
            expect(loaded).not.toHaveBeenCalled();
            expect(await provider.getCurrentUser()).toBeNull();
        } finally {
            spy.mockRestore();
        }
    });
    it('builds PKCE authorization-code settings and injectable stores without iframe/session monitoring', () => {
        const storage = new InMemoryWebStorage();
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: storage,
            userStore: storage,
        });
        expect(provider.userManager.settings).toMatchObject({
            authority: 'https://auth.example.org/realms/learncard',
            client_id: 'app',
            redirect_uri: keycloakConfig.redirectUri,
            response_type: 'code',
            scope: 'openid profile email phone',
            automaticSilentRenew: true,
            silentRequestTimeoutInSeconds: 30,
            loadUserInfo: false,
            monitorSession: false,
            filterProtocolClaims: true,
            revokeTokensOnSignout: true,
            disablePKCE: false,
            stateStore: expect.any(WebStorageStateStore),
            userStore: expect.any(WebStorageStateStore),
        });
        // The SDK defaults its internal silent URI to redirect_uri; we never configure one.
        expect(constructed.mock.lastCall?.[0]).not.toHaveProperty('silent_redirect_uri');
    });

    it('uses custom scopes', () => {
        const storage = new InMemoryWebStorage();
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            scopes: ['openid', 'email'],
            stateStore: storage,
            userStore: storage,
        });
        expect(provider.userManager.settings).toHaveProperty('scope', 'openid email');
    });

    it('blocks iframe fallback even when the SDK initiates automatic renewal', async () => {
        const storage = new InMemoryWebStorage();
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            stateStore: storage,
            userStore: storage,
        });
        await expect(provider.userManager.signinSilent()).rejects.toBeInstanceOf(AuthSessionError);
    });

    it('maps revoked refresh tokens to typed session errors', async () => {
        const manager = createManager();
        manager.mocks.signinSilent.mockRejectedValue(new ErrorResponse({ error: 'invalid_grant' }));
        await expect(create(manager).getIdToken(true)).rejects.toMatchObject({
            name: 'AuthSessionError',
            reason: 'revoked',
        });
    });

    it('identifies keycloak', () => expect(create().getProviderType()).toBe('keycloak'));
    it('maps the profile', async () => {
        expect(await create().getCurrentUser()).toEqual({
            id: 'user-1',
            email: 'person@example.org',
            phone: '+15555550123',
            displayName: 'Person',
            photoUrl: 'https://example.org/photo',
            providerType: 'keycloak',
        });
    });
    it('maps phone-only accounts without inventing an email', async () => {
        const user = createUser();
        delete user.profile.email;
        expect(await create(createManager(user)).getCurrentUser()).toMatchObject({
            phone: '+15555550123',
            email: undefined,
        });
    });
    it('returns null without a user', async () =>
        expect(await create(createManager(null)).getCurrentUser()).toBeNull());
    it('returns null for expired users without refresh tokens', async () => {
        expect(
            await create(
                createManager(createUser({ expires_at: 0, refresh_token: undefined }))
            ).getCurrentUser()
        ).toBeNull();
    });
    it('retains expired but renewable profiles', async () => {
        expect(
            await create(createManager(createUser({ expires_at: 0 }))).getCurrentUser()
        ).toHaveProperty('id', 'user-1');
    });
    it('returns cached ID tokens without renewal', async () => {
        const manager = createManager();
        expect(await create(manager).getIdToken()).toBe('id');
        expect(manager.mocks.signinSilent).not.toHaveBeenCalled();
    });
    it.each(['force', 'expired', 'near-expiry'] as const)('renews for %s', async reason => {
        const user = createUser();
        if (reason === 'expired') user.expires_at = 0;
        if (reason === 'near-expiry') user.expires_in = 60;
        const manager = createManager(user);
        expect(await create(manager).getIdToken(reason === 'force')).toBe('renewed');
        expect(manager.mocks.signinSilent).toHaveBeenCalledOnce();
    });
    it('throws a no_session error with no user', async () => {
        await expect(create(createManager(null)).getIdToken()).rejects.toMatchObject({
            name: 'AuthSessionError',
            reason: 'no_session',
        });
    });
    it.each([null, createUser({ id_token: undefined })])(
        'rejects incomplete silent results',
        async result => {
            const manager = createManager();
            manager.mocks.signinSilent.mockResolvedValue(result);
            await expect(create(manager).getIdToken(true)).rejects.toBeInstanceOf(AuthSessionError);
        }
    );
    it('rejects missing cached ID tokens', async () => {
        await expect(
            create(createManager(createUser({ id_token: undefined }))).getIdToken()
        ).rejects.toBeInstanceOf(AuthSessionError);
    });
    it('does not start an iframe when renewal lacks a refresh token', async () => {
        const manager = createManager(createUser({ refresh_token: undefined }));
        await expect(create(manager).getIdToken(true)).rejects.toBeInstanceOf(AuthSessionError);
        expect(manager.mocks.signinSilent).not.toHaveBeenCalled();
    });
    it('refreshes the session', async () => {
        const manager = createManager();
        expect(await create(manager).refreshSession()).toBe(true);
        expect(manager.mocks.signinSilent).toHaveBeenCalledOnce();
    });
    it('returns false when session renewal fails', async () => {
        const manager = createManager();
        manager.mocks.signinSilent.mockRejectedValue(new Error('offline'));
        expect(await create(manager).refreshSession()).toBe(false);
    });
    it('stores a refresh-token bootstrap User before silently reauthenticating', async () => {
        const manager = createManager(null);
        const provider = create(manager);
        vi.spyOn(manager, 'storeUser');
        expect(await provider.reauthenticateWithToken('new-refresh')).toHaveProperty(
            'id',
            'user-1'
        );
        expect(manager.storeUser).toHaveBeenCalledWith(expect.any(User));
        expect(manager.storeUser).toHaveBeenCalledWith(
            expect.objectContaining({ refresh_token: 'new-refresh', id_token: undefined })
        );
        expect(vi.mocked(manager.storeUser).mock.invocationCallOrder[0]).toBeLessThan(
            manager.mocks.signinSilent.mock.invocationCallOrder[0]
        );
    });
    it('removes the bootstrap record after failed reauthentication', async () => {
        const manager = createManager();
        manager.mocks.signinSilent.mockResolvedValue(null);
        await expect(create(manager).reauthenticateWithToken('refresh')).rejects.toBeInstanceOf(
            AuthSessionError
        );
        expect(manager.removeUser).toHaveBeenCalledOnce();
    });
    it('rejects an empty refresh token', async () => {
        await expect(create().reauthenticateWithToken('')).rejects.toBeInstanceOf(AuthSessionError);
    });

    it('does not resurrect a bootstrapped session after sign-out', async () => {
        const manager = createManager();
        let finishRefresh: (() => void) | undefined;
        manager.mocks.signinSilent.mockImplementation(async () => {
            await new Promise<void>(resolve => {
                finishRefresh = resolve;
            });
            const user = createUser();
            await manager.storeUser(user);
            return user;
        });
        const provider = create(manager);
        const reauth = provider.reauthenticateWithToken('refresh');
        const rejection = expect(reauth).rejects.toBeInstanceOf(AuthSessionError);
        await vi.waitFor(() => expect(finishRefresh).toBeDefined());
        await provider.signOut();
        finishRefresh?.();
        await rejection;
        expect(await manager.getUser()).toBeNull();
    });

    it('preserves a newer session when bootstrap renewal fails', async () => {
        const manager = createManager();
        manager.mocks.signinSilent.mockImplementation(async () => {
            await manager.storeUser(createUser({ refresh_token: 'newer-session' }));
            throw new Error('old refresh failed');
        });
        await expect(create(manager).reauthenticateWithToken('old-refresh')).rejects.toThrow(
            'old refresh failed'
        );
        expect(manager.removeUser).not.toHaveBeenCalled();
        expect((await manager.getUser())?.refresh_token).toBe('newer-session');
    });
    it('redirects to end-session when a post-logout URI is configured', async () => {
        const manager = createManager();
        await create(manager, {
            postLogoutRedirectUri: 'https://app.example.org/logout',
        }).signOut();
        expect(manager.signoutRedirect).toHaveBeenCalledWith({
            post_logout_redirect_uri: 'https://app.example.org/logout',
        });
        expect(manager.removeUser).not.toHaveBeenCalled();
    });
    it('removes the local user otherwise', async () => {
        const manager = createManager();
        await create(manager).signOut();
        expect(manager.removeUser).toHaveBeenCalledOnce();
        expect(manager.signoutRedirect).not.toHaveBeenCalled();
    });
    it('delegates redirect callback validation to the SDK', async () => {
        const manager = createManager();
        expect(
            await create(manager).handleRedirectCallback('https://app.example.org/?code=x&state=y')
        ).toHaveProperty('id', 'user-1');
        expect(manager.mocks.signinCallback).toHaveBeenCalledWith(
            'https://app.example.org/?code=x&state=y'
        );
    });
});
