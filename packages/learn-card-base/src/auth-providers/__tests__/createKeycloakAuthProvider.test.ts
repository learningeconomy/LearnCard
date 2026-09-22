import { describe, it, expect, vi } from 'vitest';
import { ErrorResponse, InMemoryWebStorage, User, WebStorageStateStore } from 'oidc-client-ts';
import { AuthSessionError } from '@learncard/types';
import { createKeycloakAuthProvider } from '../createKeycloakAuthProvider';
import type {
    KeycloakAuthProvider,
    KeycloakAuthProviderConfig,
    UserManagerLike,
} from '../createKeycloakAuthProvider';
import { createManager, createUser, keycloakConfig } from './keycloakTestHelpers';

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
            revokeTokensOnSignout: false,
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
        vi.mocked(manager.signinSilent).mockRejectedValue(
            new ErrorResponse({ error: 'invalid_grant' })
        );
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
        expect(manager.signinSilent).not.toHaveBeenCalled();
    });
    it.each(['force', 'expired', 'near-expiry'] as const)('renews for %s', async reason => {
        const user = createUser();
        if (reason === 'expired') user.expires_at = 0;
        if (reason === 'near-expiry') user.expires_in = 60;
        const manager = createManager(user);
        expect(await create(manager).getIdToken(reason === 'force')).toBe('renewed');
        expect(manager.signinSilent).toHaveBeenCalledOnce();
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
            vi.mocked(manager.signinSilent).mockResolvedValue(result);
            await expect(create(manager).getIdToken(true)).rejects.toBeInstanceOf(AuthSessionError);
        }
    );
    it('clears local auth if host cleanup rejects without navigating with stale app state', async () => {
        const manager = createManager();
        const cleanup = vi.fn().mockRejectedValue(new Error('cleanup failed'));
        await create(manager, { postLogoutRedirectUri: keycloakConfig.redirectUri }).signOut(
            cleanup
        );
        expect(manager.removeUser).toHaveBeenCalledOnce();
        expect(manager.signoutRedirect).not.toHaveBeenCalled();
        expect(await manager.getUser()).toBeNull();
    });
    it('rejects missing cached ID tokens', async () => {
        await expect(
            create(createManager(createUser({ id_token: undefined }))).getIdToken()
        ).rejects.toBeInstanceOf(AuthSessionError);
    });
    it('does not start an iframe when renewal lacks a refresh token', async () => {
        const manager = createManager(createUser({ refresh_token: undefined }));
        await expect(create(manager).getIdToken(true)).rejects.toBeInstanceOf(AuthSessionError);
        expect(manager.signinSilent).not.toHaveBeenCalled();
    });
    it('refreshes the session', async () => {
        const manager = createManager();
        expect(await create(manager).refreshSession()).toBe(true);
        expect(manager.signinSilent).toHaveBeenCalledOnce();
    });
    it('returns false when session renewal fails', async () => {
        const manager = createManager();
        vi.mocked(manager.signinSilent).mockRejectedValue(new Error('offline'));
        expect(await create(manager).refreshSession()).toBe(false);
    });
    it('stores a refresh-token bootstrap User before silently reauthenticating', async () => {
        const manager = createManager(null);
        expect(await create(manager).reauthenticateWithToken('new-refresh')).toHaveProperty(
            'id',
            'user-1'
        );
        expect(manager.storeUser).toHaveBeenCalledWith(expect.any(User));
        expect(manager.storeUser).toHaveBeenCalledWith(
            expect.objectContaining({ refresh_token: 'new-refresh', id_token: undefined })
        );
        expect(vi.mocked(manager.storeUser).mock.invocationCallOrder[0]).toBeLessThan(
            vi.mocked(manager.signinSilent).mock.invocationCallOrder[0]
        );
    });
    it('removes the bootstrap record after failed reauthentication', async () => {
        const manager = createManager();
        vi.mocked(manager.signinSilent).mockResolvedValue(null);
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
        vi.mocked(manager.signinSilent).mockImplementation(async () => {
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
        vi.mocked(manager.signinSilent).mockImplementation(async () => {
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
            id_token_hint: 'id',
        });
        expect(manager.removeUser).not.toHaveBeenCalled();
    });
    it('removes the local user otherwise', async () => {
        const manager = createManager();
        await create(manager).signOut();
        expect(manager.removeUser).toHaveBeenCalledOnce();
        expect(manager.signoutRedirect).not.toHaveBeenCalled();
    });
    it('falls back to local logout when the redirect rejects', async () => {
        const manager = createManager();
        vi.mocked(manager.signoutRedirect).mockRejectedValue(new Error('offline'));
        const provider = create(manager, { postLogoutRedirectUri: keycloakConfig.redirectUri });
        await expect(provider.signOut()).resolves.toBeUndefined();
        expect(manager.removeUser).toHaveBeenCalledOnce();
        expect(await provider.getCurrentUser()).toBeNull();
    });
    it.each([null, createUser({ id_token: undefined })])(
        'removes local state without redirecting when no ID token is available',
        async user => {
            const manager = createManager(user);
            await create(manager, { postLogoutRedirectUri: keycloakConfig.redirectUri }).signOut();
            expect(manager.removeUser).toHaveBeenCalledOnce();
            expect(manager.signoutRedirect).not.toHaveBeenCalled();
        }
    );
    it('captures the ID token before awaiting host cleanup that clears storage', async () => {
        const manager = createManager();
        const cleanup = vi.fn(async () => {
            expect(manager.signoutRedirect).not.toHaveBeenCalled();
            await manager.removeUser();
        });
        await create(manager, { postLogoutRedirectUri: keycloakConfig.redirectUri }).signOut(
            cleanup
        );
        expect(cleanup).toHaveBeenCalledOnce();
        expect(manager.signoutRedirect).toHaveBeenCalledWith({
            post_logout_redirect_uri: keycloakConfig.redirectUri,
            id_token_hint: 'id',
        });
    });
    it('delegates redirect callback validation to the SDK', async () => {
        const manager: UserManagerLike = createManager();
        expect(
            await create(manager).handleRedirectCallback('https://app.example.org/?code=x&state=y')
        ).toHaveProperty('id', 'user-1');
        expect(manager.signinCallback).toHaveBeenCalledWith(
            'https://app.example.org/?code=x&state=y'
        );
    });
});
