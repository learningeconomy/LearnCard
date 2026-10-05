import {
    ErrorResponse,
    InMemoryWebStorage,
    User,
    UserManager,
    WebStorageStateStore,
} from 'oidc-client-ts';
import type {
    CreateSigninRequestArgs,
    IWindow,
    NavigateResponse,
    RevokeTokensTypes,
    SigninSilentArgs,
    SigninRedirectArgs,
    UserManagerSettings,
} from 'oidc-client-ts';
import { AuthSessionError, UnsupportedSignInOperationError } from '@learncard/types';
import type { AuthProvider, AuthUser } from '@learncard/types';
import { createKeycloakUserStorage } from './keycloakUserStorage';

/**
 * Strip trailing slashes from a URL the host app supplies (config, not user
 * input, but still untrusted enough to keep linear-time). Implemented as a
 * character-wise loop rather than `value.replace(/\/+$/, '')` — CodeQL flags
 * the `+` quantifier on network-adjacent strings as a polynomial-ReDoS
 * candidate even though this particular pattern is linear; the loop sidesteps
 * the heuristic entirely.
 */
export const trimTrailingSlashes = (value: string): string => {
    let end = value.length;
    while (end > 0 && value.charCodeAt(end - 1) === 0x2f /* '/' */) end--;
    return value.slice(0, end);
};

/** The SDK boundary used by the provider and sign-in adapter. */
export interface UserManagerLike {
    getUser(): Promise<User | null>;
    storeUser(user: User | null): Promise<void>;
    signinSilent(): Promise<User | null>;
    signinRedirect(args: { extraQueryParams: Record<string, string> }): Promise<void>;
    signinCallback(url?: string): Promise<User | undefined>;
    signoutRedirect(args: { post_logout_redirect_uri: string }): Promise<void>;
    removeUser(): Promise<void>;
    events: {
        addUserLoaded(callback: (user: User) => Promise<void> | void): unknown;
        removeUserLoaded(callback: (user: User) => Promise<void> | void): void;
        addUserUnloaded(callback: () => void): unknown;
        removeUserUnloaded(callback: () => void): void;
        addAccessTokenExpiring(callback: () => void): unknown;
    };
    readonly settings: Pick<UserManagerSettings, 'authority' | 'client_id' | 'redirect_uri'> &
        Pick<UserManagerSettings, 'stateStore'>;
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
    /** Injectable SDK boundary; auth methods must await storeUser before emitting UserLoaded. */
    userManager?: UserManagerLike;
    /** Custom stores/managers must implement their own persistence migration. */
    setSessionPersistence?: (sessionOnly: boolean) => Promise<void>;
}

export interface KeycloakAuthProvider extends AuthProvider {
    userManager: UserManagerLike;
    /** Drain invalidated SDK work before admitting a new explicit authorization. */
    beginSignIn(): Promise<void>;
    /** true uses sessionStorage, false uses localStorage; await before starting sign-in. */
    setSessionPersistence(sessionOnly: boolean): Promise<void>;
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
    const authority = `${trimTrailingSlashes(config.serverUrl)}/realms/${config.realm}`;
    let signOutRevision = 0;
    let signedOut = false;
    let activeRevision: number | undefined;
    let authWork: Promise<unknown> | undefined;
    let writes: Promise<void> = Promise.resolve();
    let logout: Promise<void> = Promise.resolve();
    let opening: Promise<void> | undefined;
    const redirects = new Set<Promise<void>>();
    const userRevisions = new WeakMap<User, number>();
    const cancelled = (): AuthSessionError =>
        new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
    const assertRevision = (revision: number): void => {
        if (revision !== signOutRevision || signedOut) throw cancelled();
    };
    // Serialize SDK authentication, not logout. A single active revision gives the
    // SDK's storeUser (which has no attempt parameter) an unambiguous owner.
    const runAuth = <T>(action: () => Promise<T>): Promise<T> => {
        if (signedOut) return Promise.reject(cancelled());
        const revision = signOutRevision;
        const previous = authWork;
        const work = (async (): Promise<T> => {
            if (previous) await previous.catch(() => undefined);
            assertRevision(revision);
            activeRevision = revision;
            try {
                const result = await action();
                assertRevision(revision);
                return result;
            } finally {
                activeRevision = undefined;
            }
        })();
        authWork = work;
        void work.then(
            () => {
                if (authWork === work) authWork = undefined;
            },
            () => {
                if (authWork === work) authWork = undefined;
            }
        );
        return work;
    };
    const guardStore = (
        store: (user: User | null) => Promise<void>,
        user: User | null
    ): Promise<void> => {
        const revision = activeRevision ?? signOutRevision;
        const write = writes.then(async () => {
            if (user) assertRevision(revision);
            if (user) userRevisions.set(user, revision);
            await store(user);
            // A native async write may already be running when logout begins.
            // Drain and erase it before either logout or a fresh login can finish.
            if (user && (revision !== signOutRevision || signedOut)) {
                await store(null);
                throw cancelled();
            }
        });
        writes = write.catch(() => undefined);
        return write;
    };
    const stateStore =
        config.userManager?.settings.stateStore ??
        new WebStorageStateStore({
            store:
                config.stateStore ??
                (typeof window !== 'undefined' ? window.localStorage : new InMemoryWebStorage()),
        });
    const clearSigninState = async (): Promise<void> => {
        for (const key of await stateStore.getAllKeys()) {
            const value = await stateStore.get(key);
            if (!value) continue;
            let state: { authority?: string; client_id?: string };
            try {
                state = JSON.parse(value);
            } catch {
                continue;
            }
            if (state?.authority === authority && state.client_id === config.clientId) {
                await stateStore.remove(key);
            }
        }
    };
    // Enforce revisions before the SDK stores tokens and raises UserLoaded.
    // Owning signinSilent also covers the SDK's automatic renewal service.
    class ValidatingUserManager extends UserManager {
        private readonly logoutRevocationUsers = new WeakSet<User>();

        constructor(...args: ConstructorParameters<typeof UserManager>) {
            super(...args);
            const load = this.events.load.bind(this.events);
            this.events.load = (user, raiseEvent) =>
                this.logoutRevocationUsers.has(user) ? Promise.resolve() : load(user, raiseEvent);
        }

        protected override async _revokeInternal(
            user: User | null,
            types?: RevokeTokensTypes
        ): Promise<void> {
            if (!signedOut || !user) return super._revokeInternal(user, types);
            // oidc-client-ts 3.5.0 persists and emits this exact object after
            // revoking its tokens, before removing it and navigating to end_session.
            // Let that bookkeeping finish without persisting/emitting an identity.
            // Other objects (including concurrent auth results) remain guarded.
            this.logoutRevocationUsers.add(user);
            try {
                await super._revokeInternal(user, types);
            } finally {
                this.logoutRevocationUsers.delete(user);
            }
        }

        override signinSilent(args?: SigninSilentArgs): Promise<User | null> {
            return runAuth(() => super.signinSilent(args));
        }
        override signinCallback(url?: string): Promise<User | undefined> {
            return runAuth(() => super.signinCallback(url));
        }
        override storeUser(user: User | null): Promise<void> {
            if (user && this.logoutRevocationUsers.has(user)) return Promise.resolve();
            return guardStore(value => super.storeUser(value), user);
        }
        override signinRedirect(args?: SigninRedirectArgs): Promise<void> {
            if (signedOut) return Promise.reject(cancelled());
            const work = super.signinRedirect(args);
            redirects.add(work);
            void work.then(
                () => redirects.delete(work),
                () => redirects.delete(work)
            );
            return work;
        }
        protected override _signinStart(
            args: CreateSigninRequestArgs,
            handle: IWindow
        ): Promise<NavigateResponse> {
            const revision = signOutRevision;
            return super._signinStart(args, {
                close: () => handle.close(),
                navigate: async params => {
                    if (signedOut || revision !== signOutRevision) {
                        if (params.state) await stateStore.remove(params.state);
                        throw cancelled();
                    }
                    return handle.navigate(params);
                },
            });
        }
    }
    const browserStorage =
        !config.userManager && !config.userStore && typeof window !== 'undefined'
            ? createKeycloakUserStorage(
                  authority,
                  config.clientId,
                  window.localStorage,
                  window.sessionStorage
              )
            : undefined;
    const setSessionPersistence =
        config.setSessionPersistence ??
        browserStorage?.setSessionPersistence ??
        (async (): Promise<never> => {
            throw new UnsupportedSignInOperationError('setSessionPersistence', 'keycloak');
        });
    const userManager =
        config.userManager ??
        new ValidatingUserManager(
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
                revokeTokensOnSignout: true,
                stateStore,
                userStore: new WebStorageStateStore({
                    store: config.userStore ?? browserStorage?.store ?? new InMemoryWebStorage(),
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
    // UserManagerEvents.load itself awaits before raising UserLoaded. Recheck at
    // dispatch too, including logout occurring between storage and that event.
    type LoadedListener = (user: User) => Promise<void> | void;
    const loadedListeners = new Map<LoadedListener, LoadedListener>();
    const addLoaded = userManager.events.addUserLoaded.bind(userManager.events);
    const removeLoaded = userManager.events.removeUserLoaded.bind(userManager.events);
    userManager.events.addUserLoaded = callback => {
        const guarded: LoadedListener = user => {
            if (
                signedOut ||
                (userRevisions.get(user) ?? activeRevision ?? signOutRevision) !== signOutRevision
            )
                return;
            return callback(user);
        };
        loadedListeners.set(callback, guarded);
        return addLoaded(guarded);
    };
    userManager.events.removeUserLoaded = callback => {
        const guarded = loadedListeners.get(callback);
        if (guarded) removeLoaded(guarded);
        loadedListeners.delete(callback);
    };
    let reauthenticating = false;
    if (config.userManager) {
        // Injected managers must use their public storeUser boundary before emitting.
        const store = userManager.storeUser.bind(userManager);
        userManager.storeUser = user => guardStore(store, user);
        const silent = userManager.signinSilent.bind(userManager);
        const callback = userManager.signinCallback.bind(userManager);
        userManager.signinSilent = () => runAuth(silent);
        userManager.signinCallback = url => runAuth(() => callback(url));
    }
    const beginSignIn = (): Promise<void> => {
        const revision = signOutRevision;
        if (!signedOut) return Promise.resolve();
        if (opening) return opening;
        opening = (async () => {
            await logout;
            await authWork?.catch(() => undefined);
            await Promise.allSettled([...redirects]);
            await writes;
            await clearSigninState();
            if (revision !== signOutRevision) throw cancelled();
            signedOut = false;
        })().finally(() => {
            opening = undefined;
        });
        return opening;
    };

    const renew = async (): Promise<User> => {
        const revision = signOutRevision;
        // Never fall back to iframe silent SSO when there is no refresh token.
        if (!(await userManager.getUser())?.refresh_token) {
            throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
        }
        assertRevision(revision);
        let user: User | null;
        try {
            user = await userManager.signinSilent();
            assertRevision(revision);
        } catch (error) {
            if (
                error instanceof ErrorResponse &&
                error.error != null &&
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
        beginSignIn,
        setSessionPersistence,
        onRedirectComplete: (callback): (() => void) => {
            redirectListeners.add(callback);
            return (): void => {
                redirectListeners.delete(callback);
            };
        },
        getProviderType: (): string => 'keycloak',
        getCurrentUser: async (): Promise<AuthUser | null> => {
            const revision = signOutRevision;
            const user = await userManager.getUser();
            return signedOut || revision !== signOutRevision ? null : keycloakUserToAuthUser(user);
        },
        getIdToken: async (forceRefresh = false): Promise<string> => {
            const revision = signOutRevision;
            let user = await userManager.getUser();
            assertRevision(revision);
            if (!user) throw new AuthSessionError('Please sign in to continue.', 'no_session');
            if (forceRefresh || user.expired || (user.expires_in ?? Infinity) <= 60) {
                user = await renew();
            }
            if (!user.id_token) {
                throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
            }
            assertRevision(revision);
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
                await beginSignIn();
                assertRevision(initialSignOutRevision);
                await userManager.storeUser(bootstrap);
                assertRevision(initialSignOutRevision);
                const user = await renew();
                if (initialSignOutRevision !== signOutRevision) {
                    throw new AuthSessionError(
                        'Sign-in cancelled. Please try again.',
                        'no_session'
                    );
                }
                return keycloakUserToAuthUser(user);
            } catch (error) {
                const stored = await userManager.getUser();
                if (
                    initialSignOutRevision === signOutRevision &&
                    stored?.refresh_token === token &&
                    !stored.id_token &&
                    !stored.profile.sub
                ) {
                    await userManager.removeUser();
                }
                throw error;
            } finally {
                reauthenticating = false;
            }
        },
        signOut: (): Promise<void> => {
            signOutRevision++;
            signedOut = true;
            const previousLogout = logout;
            logout = (async () => {
                // A failed cleanup must remain retryable, not poison the queue forever.
                await previousLogout.catch(() => undefined);
                await writes;
                await clearSigninState();
                if (config.postLogoutRedirectUri) {
                    try {
                        await userManager.signoutRedirect({
                            post_logout_redirect_uri: config.postLogoutRedirectUri,
                        });
                    } catch (error) {
                        // SDK revocation can fail before removeUser. A reload must
                        // not restore the old session even if remote logout fails.
                        await userManager.removeUser();
                        throw error;
                    }
                } else {
                    await userManager.removeUser();
                }
            })();
            return logout;
        },
        handleRedirectCallback: async (url?: string): Promise<AuthUser | null> => {
            const revision = signOutRevision;
            assertRevision(revision);
            // Snapshot before awaiting: an older callback must never settle a later attempt.
            const listeners = [...redirectListeners];
            if ((!config.userManager || config.userManager.settings.stateStore) && url) {
                const state = new URL(url).searchParams.get('state');
                // A callback whose PKCE state was invalidated cannot fail a newer attempt.
                if (state && !(await stateStore.get(state))) throw cancelled();
                assertRevision(revision);
            }
            try {
                const user = await handleRedirectCallback(userManager, url);
                assertRevision(revision);
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
