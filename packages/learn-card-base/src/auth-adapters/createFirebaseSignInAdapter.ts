import type { Auth } from 'firebase/auth';
import type { AuthUser, SignInAdapter } from '@learncard/types';
import { getLogger } from '../logging/logger';
import { createFirebasePhoneAuth } from './createFirebasePhoneAuth';
import { loadFirebaseAuth } from './firebaseAuthModule';
import type {
    FirebaseAuthLike,
    FirebaseSignInAdapterConfig,
    FirebaseSignInOperation,
} from './types';

// Preserve the original import locations as well as the barrel exports.
export type {
    FirebaseAuthLike,
    NativeFirebaseAuthLike,
    FirebaseSignInAdapterConfig,
} from './types';

const log = getLogger('create-firebase-sign-in-adapter');

const mapFirebaseUser = (user: NonNullable<FirebaseAuthLike['currentUser']>): AuthUser => ({
    id: user.uid,
    email: user.email || undefined,
    phone: user.phoneNumber || undefined,
    displayName: user.displayName || undefined,
    photoUrl: user.photoURL || undefined,
    providerType: 'firebase',
    createdAt: user.metadata?.creationTime ? new Date(user.metadata.creationTime) : undefined,
});

/** Firebase SDK boundary. UI, social-login locks and analytics remain app-owned. */
export const createFirebaseSignInAdapter = (config: FirebaseSignInAdapterConfig): SignInAdapter => {
    // Preload before a click so popup sign-in stays within the transient user-activation window.
    void loadFirebaseAuth();
    const isNative = (): boolean => config.isNativePlatform?.() ?? false;
    const auth = (): Auth => config.getAuth() as Auth;
    const notify = (callback: () => void): void => {
        try {
            callback();
        } catch {
            log.warn('Sign-in instrumentation callback failed');
        }
    };
    const operation = async <T>(
        name: FirebaseSignInOperation,
        action: () => Promise<T>
    ): Promise<T> => {
        notify(() => config.onOperation?.(name, 'started'));
        try {
            const result = await action();
            notify(() => config.onOperation?.(name, 'succeeded'));
            return result;
        } catch (error) {
            notify(() => config.onOperation?.(name, 'failed', error));
            // Keep code/message intact: the apps intentionally have different UI mappings.
            throw error;
        }
    };
    const signedIn = (
        method: Parameters<NonNullable<FirebaseSignInAdapterConfig['onSignedIn']>>[0],
        user: AuthUser
    ): AuthUser => {
        notify(() => config.onSignedIn?.(method, user));
        return user;
    };
    const finish = async (
        user: NonNullable<FirebaseAuthLike['currentUser']>,
        forceRefresh?: boolean
    ): Promise<AuthUser> => {
        await user.getIdToken(forceRefresh);
        return mapFirebaseUser(user);
    };
    const phone = createFirebasePhoneAuth(config, user => signedIn('phoneOtp', user));
    const validateEmailLink = async (link: string): Promise<boolean> => {
        if (isNative() && config.getNativeAuth) {
            return (await config.getNativeAuth().isSignInWithEmailLink({ emailLink: link }))
                .isSignInWithEmailLink;
        }
        const { isSignInWithEmailLink } = await loadFirebaseAuth();
        return isSignInWithEmailLink(auth(), link);
    };

    return {
        providerType: 'firebase',
        capabilities: Object.freeze({
            emailLink: true,
            emailOtp: true, // Server OTP verification finishes via signInWithCustomToken.
            phoneOtp:
                !isNative() ||
                Boolean(
                    config.getNativeAuth?.().signInWithPhoneNumber &&
                    config.getNativeAuth?.().addListener
                ),
            google: Boolean(config.getNativeAuth),
            apple: !isNative() || Boolean(config.getNativeAuth),
            social: !isNative() || Boolean(config.getNativeAuth),
            customToken: true,
            deleteAccount: true,
        }),
        subscribe: (onUser): (() => void) => {
            let unsubscribe: (() => void) | undefined;
            let cancelled = false;
            void loadFirebaseAuth()
                .then(({ onAuthStateChanged }) => {
                    if (!cancelled) {
                        unsubscribe = onAuthStateChanged(auth(), user =>
                            onUser(user ? mapFirebaseUser(user) : null)
                        );
                    }
                })
                .catch(() => log.error('Unable to subscribe to Firebase auth state'));
            return (): void => {
                cancelled = true;
                unsubscribe?.();
            };
        },
        getCurrentUser: (): AuthUser | null => {
            const user = config.getAuth().currentUser;
            return user ? mapFirebaseUser(user) : null;
        },
        sendEmailLink: (email, redirectUrl): Promise<void> =>
            operation('sendEmailLink', async () => {
                const settings =
                    (isNative() ? config.nativeEmailLinkSettings : undefined) ??
                    config.emailLinkSettings;
                const url = redirectUrl ?? settings?.url ?? window.location.origin + '/login';
                if (isNative() && config.getNativeAuth) {
                    await config.getNativeAuth().sendSignInLinkToEmail({
                        email,
                        actionCodeSettings: { ...settings, url, handleCodeInApp: true },
                    });
                } else {
                    const { sendSignInLinkToEmail } = await loadFirebaseAuth();
                    await sendSignInLinkToEmail(auth(), email, { url, handleCodeInApp: true });
                }
                window.localStorage.setItem('emailForSignIn', email);
            }),
        verifyEmailLink: (email, link): Promise<AuthUser> =>
            operation('verifyEmailLink', async () => {
                if (!email || !link) throw new Error('Email and link are required');
                if (!(await validateEmailLink(link))) throw new Error('Invalid email sign-in link');
                let user: AuthUser;
                if (isNative() && config.getNativeAuth) {
                    const { EmailAuthProvider, signInWithCredential } = await loadFirebaseAuth();
                    // Preserve the existing adapter's cross-device fallback to an explicitly entered email.
                    const storedEmail = window.localStorage.getItem('emailForSignIn') || email;
                    const result = await signInWithCredential(
                        auth(),
                        EmailAuthProvider.credentialWithLink(storedEmail, link)
                    );
                    user = await finish(result.user);
                } else {
                    const { signInWithEmailLink } = await loadFirebaseAuth();
                    user = await finish(
                        (await signInWithEmailLink(auth(), email, link)).user,
                        true
                    );
                }
                window.localStorage.removeItem('emailForSignIn');
                return signedIn('emailLink', user);
            }),
        isEmailLink: (link): boolean => link.includes('oobCode=') && link.includes('mode=signIn'),
        validateEmailLink,
        sendPhoneOtp: (number): ReturnType<SignInAdapter['sendPhoneOtp']> =>
            operation('sendPhoneOtp', () => phone.sendPhoneOtp(number)),
        confirmPhoneOtp: (
            handleOrCode: Parameters<SignInAdapter['confirmPhoneOtp']>[0],
            code?: string | number
        ): Promise<AuthUser> =>
            operation('confirmPhoneOtp', () => phone.confirmPhoneOtp(handleOrCode, code)),
        confirmNativePhoneOtp: (verificationId, code): Promise<AuthUser> =>
            operation('confirmPhoneOtp', () => phone.confirmPhoneOtp({ verificationId }, code)),
        onPhoneCodeSent: phone.onPhoneCodeSent,
        onPhoneVerificationCompleted: phone.onPhoneVerificationCompleted,
        onPhoneVerificationFailed: phone.onPhoneVerificationFailed,
        signInWithGoogle: (options): Promise<AuthUser> =>
            operation('google', async () => {
                if (options?.intent === 'reauthenticate' && !isNative()) {
                    const { GoogleAuthProvider, signInWithPopup } = await loadFirebaseAuth();
                    return mapFirebaseUser(
                        (await signInWithPopup(auth(), new GoogleAuthProvider())).user
                    );
                }
                const native = config.getNativeAuth?.();
                if (!native) throw new Error('Google sign-in requires the Firebase plugin');
                const result = await native.signInWithGoogle();
                const { user } = await native.getCurrentUser();
                if (!result.user || !user) throw new Error('No authenticated user after sign-in');
                if (options?.intent !== 'reauthenticate') await native.getIdToken();
                const mapped: AuthUser = {
                    id: user.uid,
                    email: user.email || undefined,
                    phone: user.phoneNumber || undefined,
                    displayName: user.displayName || undefined,
                    photoUrl: user.photoUrl || undefined,
                    providerType: 'firebase',
                    createdAt: user.metadata?.creationTime
                        ? new Date(user.metadata.creationTime)
                        : undefined,
                };
                signedIn('google', mapped);
                if (isNative()) {
                    try {
                        const { GoogleAuthProvider, signInWithCredential } =
                            await loadFirebaseAuth();
                        await signInWithCredential(
                            auth(),
                            GoogleAuthProvider.credential(result.credential?.idToken)
                        );
                    } catch (error) {
                        log.info('Google web-layer credential sign-in failed');
                        notify(() => config.onCredentialSyncError?.(error));
                    }
                }
                return mapped;
            }),
        signInWithApple: (options): Promise<AuthUser> =>
            operation('apple', async () => {
                const { OAuthProvider, signInWithCredential, signInWithPopup } =
                    await loadFirebaseAuth();
                const provider = new OAuthProvider('apple.com');
                let user: NonNullable<FirebaseAuthLike['currentUser']>;
                if (isNative()) {
                    const native = config.getNativeAuth?.();
                    if (!native) throw new Error('Apple sign-in requires the Firebase plugin');
                    const result = await native.signInWithApple({ skipNativeAuth: true });
                    await signInWithCredential(
                        auth(),
                        provider.credential({
                            idToken: result.credential?.idToken,
                            rawNonce: result.credential?.nonce,
                        })
                    );
                    const currentUser = config.getAuth().currentUser;
                    if (!currentUser) throw new Error('No authenticated user after sign-in');
                    user = currentUser;
                } else {
                    const result = await signInWithPopup(auth(), provider);
                    if (!result) throw new Error('Missing popup result');
                    if (
                        options?.intent !== 'reauthenticate' &&
                        !OAuthProvider.credentialFromResult(result)
                    ) {
                        throw new Error('Missing OAuth credential');
                    }
                    user = result.user;
                }
                if (options?.intent === 'reauthenticate') return mapFirebaseUser(user);
                return signedIn('apple', await finish(user, isNative() ? undefined : true));
            }),
        checkRedirectResult: (): Promise<AuthUser | null> =>
            operation('redirect', async () => {
                if (isNative()) return null;
                const { getRedirectResult, OAuthProvider } = await loadFirebaseAuth();
                const result = await getRedirectResult(auth());
                if (!result || !OAuthProvider.credentialFromResult(result)) return null;
                return signedIn('apple', await finish(result.user, true));
            }),
        signInWithCustomToken: (token): Promise<AuthUser> =>
            operation('customToken', async () => {
                const { signInWithCustomToken } = await loadFirebaseAuth();
                return signedIn(
                    'customToken',
                    await finish((await signInWithCustomToken(auth(), token)).user)
                );
            }),
        signInWithOidcCredential: (providerId, idToken): Promise<AuthUser> =>
            operation('oidc', async () => {
                const { OAuthProvider, signInWithCredential } = await loadFirebaseAuth();
                const credential = new OAuthProvider(providerId).credential({ idToken });
                return signedIn(
                    'oidc',
                    await finish((await signInWithCredential(auth(), credential)).user)
                );
            }),
        deleteAccount: (): Promise<void> =>
            operation('deleteAccount', async () => {
                const user = auth().currentUser;
                if (!user) throw new Error('No user to delete');
                const { deleteUser } = await loadFirebaseAuth();
                await deleteUser(user);
                phone.cleanup();
            }),
        updateProfile: async (profile): Promise<void> => {
            const user = auth().currentUser;
            if (!user) throw new Error('No user to update');
            const { updateProfile } = await loadFirebaseAuth();
            await updateProfile(user, {
                ...(profile.displayName !== undefined ? { displayName: profile.displayName } : {}),
                ...(profile.photoUrl !== undefined ? { photoURL: profile.photoUrl } : {}),
            });
        },
        setSessionPersistence: async (sessionOnly): Promise<void> => {
            const { setPersistence, browserSessionPersistence, indexedDBLocalPersistence } =
                await loadFirebaseAuth();
            await setPersistence(
                auth(),
                sessionOnly ? browserSessionPersistence : indexedDBLocalPersistence
            );
        },
        signOut: (): Promise<void> =>
            operation('signOut', async () => {
                await config.getAuth().signOut();
                phone.cleanup();
                if (isNative() && config.getNativeAuth) {
                    try {
                        await config.getNativeAuth().signOut();
                    } catch {
                        log.warn('Native signOut failed');
                    }
                }
            }),
        cleanup: phone.cleanup,
    };
};
