import { AuthSessionError, UnsupportedSignInOperationError } from '@learncard/types';
import type { AuthUser, SignInAdapter, SocialSignInOptions } from '@learncard/types';
import type { User } from 'oidc-client-ts';
import { keycloakUserToAuthUser } from '../auth-providers/createKeycloakAuthProvider';
import { getLogger } from '../logging/logger';
import type { KeycloakSignInAdapterConfig, KeycloakSignInOperation } from './keycloakTypes';

export type { KeycloakSignInAdapterConfig } from './keycloakTypes';

const log = getLogger('keycloak-sign-in');

/**
 * Login tickets are brokered through Keycloak, never exchanged directly for tokens.
 * A web redirect destroys the initiating JS realm; the next adapter instance completes
 * sign-in through checkRedirectResult. In a native sheet the same instance can settle
 * its pending promise when the host completes the provider callback.
 */
export const createKeycloakSignInAdapter = (config: KeycloakSignInAdapterConfig): SignInAdapter => {
    const { provider } = config;
    const { userManager } = provider;
    const listeners = new Set<(user: AuthUser | null) => void>();
    let currentUser: AuthUser | null = null;
    let revision = 0;
    let listening = false;
    let disposed = false;
    let pending:
        | {
              resolve: (user: AuthUser) => void;
              reject: (error: unknown) => void;
          }
        | undefined;

    const notify = (callback: () => void): void => {
        try {
            callback();
        } catch {
            log.warn('Sign-in instrumentation callback failed');
        }
    };
    const operation = async <T>(
        name: KeycloakSignInOperation,
        action: () => Promise<T>
    ): Promise<T> => {
        if (disposed)
            throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
        notify(() => config.onOperation?.(name, 'started'));
        try {
            const result = await action();
            if (disposed)
                throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
            notify(() => config.onOperation?.(name, 'succeeded'));
            return result;
        } catch (error) {
            notify(() => config.onOperation?.(name, 'failed', error));
            throw error;
        }
    };
    const emit = (user: AuthUser | null): void => {
        revision++;
        currentUser = user;
        for (const listener of listeners) listener(user);
    };
    const loaded = (user: User): void => {
        emit(keycloakUserToAuthUser(user));
    };
    const unloaded = (): void => emit(null);
    const listen = (): void => {
        if (listening) return;
        listening = true;
        userManager.events.addUserLoaded(loaded);
        userManager.events.addUserUnloaded(unloaded);
        const initialRevision = revision;
        void provider
            .getCurrentUser()
            .then(user => {
                if (listening && initialRevision === revision) emit(user);
            })
            .catch(() => log.warn('Unable to read Keycloak auth state'));
    };
    const stopListening = (): void => {
        listening = false;
        revision++;
        userManager.events.removeUserLoaded(loaded);
        userManager.events.removeUserUnloaded(unloaded);
    };
    const authorize = async (extraQueryParams: Record<string, string>): Promise<AuthUser> => {
        if (disposed)
            throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
        if (pending) throw new Error('A sign-in is already in progress');
        let cancel: ((error: unknown) => void) | undefined;
        const cancellation = new Promise<never>((_resolve, reject) => {
            cancel = reject;
        });
        const completion = new Promise<AuthUser>(resolve => {
            pending = { resolve, reject: error => cancel?.(error) };
        });
        const attempt = pending;
        const unsubscribe = provider.onRedirectComplete(result => {
            if ('user' in result) attempt?.resolve(result.user);
            else attempt?.reject(result.error);
        });
        // Attach rejection handling before navigation (native callbacks may arrive immediately).
        try {
            const navigation = Promise.resolve().then(() => {
                if (disposed)
                    throw new AuthSessionError(
                        'Sign-in cancelled. Please try again.',
                        'no_session'
                    );
                return (config.openAuthorization ?? (args => userManager.signinRedirect(args)))({
                    extraQueryParams,
                });
            });
            const user = await Promise.race([
                Promise.all([completion, navigation]).then(([user]) => user),
                cancellation,
            ]);
            if (disposed)
                throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
            return user;
        } finally {
            unsubscribe();
            if (pending === attempt) pending = undefined;
        }
    };
    const hop = (ticket: string, options?: SocialSignInOptions): Promise<AuthUser> =>
        authorize({
            kc_idp_hint: 'lca-api',
            login_hint: ticket,
            ...(options?.intent === 'reauthenticate' ? { prompt: 'login' } : {}),
        });
    const social = (name: 'google' | 'apple', options?: SocialSignInOptions): Promise<AuthUser> =>
        operation(name, async () => {
            const native = config.nativeSocial?.[name];
            const user =
                config.isNative?.() && native && config.requestSocialTicket
                    ? await hop(await config.requestSocialTicket(name, await native()), options)
                    : await authorize({
                          kc_idp_hint: name,
                          ...(options?.intent === 'reauthenticate' ? { prompt: 'login' } : {}),
                      });
            if (options?.intent !== 'reauthenticate') notify(() => config.onSignedIn?.(name, user));
            return user;
        });
    const unsupported = async (name: string): Promise<never> => {
        throw new UnsupportedSignInOperationError(name, 'keycloak');
    };
    const noSubscription = (): (() => void) => (): void => undefined;

    return {
        providerType: 'keycloak',
        capabilities: Object.freeze({
            emailLink: false,
            emailOtp: true,
            phoneOtp: false,
            google: true,
            apple: true,
            social: true,
            customToken: true,
            deleteAccount: false,
        }),
        subscribe: (onUser): (() => void) => {
            if (disposed)
                throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
            listeners.add(onUser);
            onUser(currentUser);
            listen();
            return (): void => {
                listeners.delete(onUser);
                if (!listeners.size) stopListening();
            };
        },
        getCurrentUser: (): AuthUser | null => currentUser,
        signInWithCustomToken: (ticket): Promise<AuthUser> =>
            operation('customToken', async () => {
                const user = await hop(ticket);
                notify(() => config.onSignedIn?.('customToken', user));
                return user;
            }),
        signInWithGoogle: (options): Promise<AuthUser> => social('google', options),
        signInWithApple: (options): Promise<AuthUser> => social('apple', options),
        signInWithOidcCredential: (providerId, idToken): Promise<AuthUser> =>
            operation('oidc', async () => {
                if (
                    (providerId !== 'google' && providerId !== 'apple') ||
                    !config.requestSocialTicket
                ) {
                    return unsupported('signInWithOidcCredential');
                }
                const user = await hop(await config.requestSocialTicket(providerId, idToken));
                notify(() => config.onSignedIn?.('oidc', user));
                return user;
            }),
        checkRedirectResult: (): Promise<AuthUser | null> =>
            operation('redirect', async () => {
                if (typeof window === 'undefined') return null;
                const url = new URL(window.location.href);
                if (
                    !url.searchParams.has('error') &&
                    !(url.searchParams.has('code') && url.searchParams.has('state'))
                )
                    return null;
                const attempt = pending;
                try {
                    // Always let the SDK validate and consume callback state, including errors.
                    const user = await provider.handleRedirectCallback(url.href);
                    if (disposed)
                        throw new AuthSessionError(
                            'Sign-in cancelled. Please try again.',
                            'no_session'
                        );
                    if (url.searchParams.get('error') === 'login_required') {
                        throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
                    }
                    if (!user) throw new AuthSessionError('Please sign in again.', 'no_session');
                    emit(user);
                    if (attempt) {
                        attempt.resolve(user);
                    } else {
                        notify(() => config.onSignedIn?.('redirect', user));
                    }
                    return user;
                } catch (error) {
                    const failure =
                        url.searchParams.get('error') === 'login_required'
                            ? new AuthSessionError('Sign-in expired. Please try again.', 'expired')
                            : error;
                    attempt?.reject(failure);
                    throw failure;
                } finally {
                    for (const key of [
                        'code',
                        'state',
                        'error',
                        'error_description',
                        'error_uri',
                        'session_state',
                        'iss',
                    ]) {
                        url.searchParams.delete(key);
                    }
                    window.history.replaceState(window.history.state, '', url.href);
                }
            }),
        signOut: (): Promise<void> => operation('signOut', () => provider.signOut()),
        isEmailLink: (): boolean => false,
        validateEmailLink: async (): Promise<boolean> => false,
        sendEmailLink: (): Promise<never> => unsupported('sendEmailLink'),
        verifyEmailLink: (): Promise<never> => unsupported('verifyEmailLink'),
        sendPhoneOtp: (): Promise<never> => unsupported('sendPhoneOtp'),
        confirmPhoneOtp: (): Promise<never> => unsupported('confirmPhoneOtp'),
        confirmNativePhoneOtp: (): Promise<never> => unsupported('confirmNativePhoneOtp'),
        deleteAccount: (): Promise<never> => unsupported('deleteAccount'),
        updateProfile: (): Promise<never> => unsupported('updateProfile'),
        setSessionPersistence: (): Promise<never> => unsupported('setSessionPersistence'),
        onPhoneCodeSent: noSubscription,
        onPhoneVerificationCompleted: noSubscription,
        onPhoneVerificationFailed: noSubscription,
        cleanup: (): void => {
            disposed = true;
            stopListening();
            listeners.clear();
            pending?.reject(
                new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session')
            );
            pending = undefined;
            currentUser = null;
        },
    };
};
