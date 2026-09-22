import { ErrorResponse, User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import type { UserManagerSettings } from 'oidc-client-ts';
import { AuthSessionError } from '@learncard/types';
import type { AuthProvider, AuthUser } from '@learncard/types';

/** The SDK boundary used by the provider and sign-in adapter. */
export interface UserManagerLike {
    getUser(): Promise<User | null>;
    storeUser(user: User | null): Promise<void>;
    signinSilent(): Promise<User | null>;
    signinRedirect(args: { extraQueryParams: Record<string, string> }): Promise<void>;
    signinCallback(url?: string): Promise<User | undefined>;
    signoutRedirect(args: {
        post_logout_redirect_uri: string;
        id_token_hint?: string;
    }): Promise<void>;
    removeUser(): Promise<void>;
    events: {
        addUserLoaded(callback: (user: User) => void): unknown;
        removeUserLoaded(callback: (user: User) => void): void;
        addUserUnloaded(callback: () => void): unknown;
        removeUserUnloaded(callback: () => void): void;
        addAccessTokenExpiring(callback: () => void): unknown;
    };
    readonly settings: Pick<UserManagerSettings, 'authority' | 'client_id' | 'redirect_uri'>;
}

type OidcStorage = NonNullable<ConstructorParameters<typeof WebStorageStateStore>[0]>['store'];

export interface KeycloakAuthProviderConfig {
    serverUrl: string;
    realm: string;
    clientId: string;
    scopes?: string[];
    redirectUri: string;
    postLogoutRedirectUri?: string;
    /** Defaults to localStorage. Native hosts can supply Preferences-backed stores. */
    stateStore?: OidcStorage;
    userStore?: OidcStorage;
    /** Injectable SDK boundary for tests and embedding hosts. */
    userManager?: UserManagerLike;
}

export interface KeycloakAuthProvider extends AuthProvider {
    userManager: UserManagerLike;
    /** Finish host cleanup before navigating away; the ID token is captured first. */
    signOut(beforeRedirect?: () => Promise<void>): Promise<void>;
    handleRedirectCallback(url?: string): Promise<AuthUser | null>;
    /** Callback completion is distinct from user-loaded events raised by token renewal. */
    onRedirectComplete(callback: (result: KeycloakRedirectResult) => void): () => void;
    refreshSession(): Promise<boolean>;
    /** The string is a Keycloak refresh token, NOT a login ticket or an ID token. */
    reauthenticateWithToken(token: string): Promise<AuthUser | null>;
}

export type KeycloakRedirectResult = { user: AuthUser } | { error: unknown };

/** Map only authenticated profiles; refresh-token bootstrap records are not users. */
export const keycloakUserToAuthUser = (user: User | null | undefined): AuthUser | null => {
    if (!user?.profile.sub || (user.expired && !user.refresh_token)) return null;
    return {
        id: user.profile.sub,
        email: user.profile.email,
        phone: user.profile.phone_number,
        displayName: user.profile.name,
        photoUrl: user.profile.picture,
        providerType: 'keycloak',
    };
};

/** Complete an OIDC callback through the SDK's state/PKCE validation. */
export const handleRedirectCallback = async (
    userManager: UserManagerLike,
    url?: string
): Promise<AuthUser | null> => keycloakUserToAuthUser(await userManager.signinCallback(url));

/** Create a Keycloak authorization-code/PKCE provider with refresh-token renewal. */
export const createKeycloakAuthProvider = (
    config: KeycloakAuthProviderConfig
): KeycloakAuthProvider => {
    const authority = `${config.serverUrl.replace(/\/+$/, '')}/realms/${config.realm}`;
    const userManager =
        config.userManager ??
        new UserManager(
            {
                authority,
                client_id: config.clientId,
                redirect_uri: config.redirectUri,
                post_logout_redirect_uri: config.postLogoutRedirectUri,
                response_type: 'code',
                scope: (config.scopes ?? ['openid', 'profile', 'email', 'phone']).join(' '),
                automaticSilentRenew: true,
                silentRequestTimeoutInSeconds: 30,
                loadUserInfo: false,
                monitorSession: false,
                filterProtocolClaims: true,
                // Keycloak end-session ends the session and invalidates tokens without prior revocation.
                revokeTokensOnSignout: false,
                stateStore: new WebStorageStateStore({
                    store: config.stateStore ?? window.localStorage,
                }),
                userStore: new WebStorageStateStore({
                    store: config.userStore ?? window.localStorage,
                }),
            },
            undefined,
            undefined,
            {
                // Automatic renewal calls the SDK directly. Reject its iframe fallback too.
                prepare: async (): Promise<never> => {
                    throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
                },
                callback: async (): Promise<never> => {
                    throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
                },
            }
        );
    const redirectListeners = new Set<(result: KeycloakRedirectResult) => void>();
    let reauthenticating = false;
    let signOutRevision = 0;

    const renew = async (): Promise<User> => {
        // Never fall back to iframe silent SSO when there is no refresh token.
        if (!(await userManager.getUser())?.refresh_token) {
            throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
        }
        let user: User | null;
        try {
            user = await userManager.signinSilent();
        } catch (error) {
            if (
                error instanceof ErrorResponse &&
                ['invalid_grant', 'login_required', 'interaction_required'].includes(error.error)
            ) {
                throw new AuthSessionError(
                    'Sign-in expired. Please try again.',
                    error.error === 'invalid_grant' ? 'revoked' : 'expired'
                );
            }
            throw error;
        }
        if (!user?.id_token || !keycloakUserToAuthUser(user)) {
            throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
        }
        return user;
    };

    return {
        userManager,
        onRedirectComplete: (callback): (() => void) => {
            redirectListeners.add(callback);
            return (): void => {
                redirectListeners.delete(callback);
            };
        },
        getProviderType: (): string => 'keycloak',
        getCurrentUser: async (): Promise<AuthUser | null> =>
            keycloakUserToAuthUser(await userManager.getUser()),
        getIdToken: async (forceRefresh = false): Promise<string> => {
            let user = await userManager.getUser();
            if (!user) throw new AuthSessionError('Please sign in to continue.', 'no_session');
            if (forceRefresh || user.expired || (user.expires_in ?? Infinity) <= 60) {
                user = await renew();
            }
            if (!user.id_token) {
                throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
            }
            return user.id_token;
        },
        refreshSession: async (): Promise<boolean> => {
            try {
                await renew();
                return true;
            } catch {
                return false;
            }
        },
        /** Accepts a Keycloak refresh token; the SDK exchanges it for the full token set. */
        reauthenticateWithToken: async (token: string): Promise<AuthUser | null> => {
            if (!token) throw new AuthSessionError('Please sign in to continue.', 'no_session');
            if (reauthenticating)
                throw new AuthSessionError('Sign-in is already in progress.', 'no_session');
            reauthenticating = true;
            const initialSignOutRevision = signOutRevision;
            // No ID token: the SDK must populate the profile from the refresh response,
            // not compare against a potentially stale account's ID token.
            const bootstrap = new User({
                refresh_token: token,
                access_token: '',
                token_type: 'Bearer',
                profile: { sub: '', iss: authority, aud: config.clientId, exp: 0, iat: 0 },
            });
            try {
                await userManager.storeUser(bootstrap);
                const user = await renew();
                if (initialSignOutRevision !== signOutRevision) {
                    await userManager.removeUser();
                    throw new AuthSessionError(
                        'Sign-in cancelled. Please try again.',
                        'no_session'
                    );
                }
                return keycloakUserToAuthUser(user);
            } catch (error) {
                const stored = await userManager.getUser();
                if (stored?.refresh_token === token && !stored.id_token && !stored.profile.sub) {
                    await userManager.removeUser();
                }
                throw error;
            } finally {
                reauthenticating = false;
            }
        },
        signOut: async (beforeRedirect?: () => Promise<void>): Promise<void> => {
            signOutRevision++;
            const user = await userManager.getUser();
            if (!config.postLogoutRedirectUri || !user?.id_token) {
                await userManager.removeUser();
                return;
            }
            try {
                // A redirect unloads the page before the coordinator can run its normal cleanup.
                await beforeRedirect?.();
                await userManager.signoutRedirect({
                    post_logout_redirect_uri: config.postLogoutRedirectUri,
                    id_token_hint: user.id_token,
                });
            } catch {
                // Still clear local auth when host cleanup, discovery, or navigation fails.
                await userManager.removeUser();
            }
        },
        handleRedirectCallback: async (url?: string): Promise<AuthUser | null> => {
            // Snapshot before awaiting: an older callback must never settle a later attempt.
            const listeners = [...redirectListeners];
            try {
                const user = await handleRedirectCallback(userManager, url);
                if (!user) throw new AuthSessionError('Please sign in again.', 'no_session');
                for (const listener of listeners) listener({ user });
                return user;
            } catch (error) {
                for (const listener of listeners) listener({ error });
                throw error;
            }
        },
    };
};
