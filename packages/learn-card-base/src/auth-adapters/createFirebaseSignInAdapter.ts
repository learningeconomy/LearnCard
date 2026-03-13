/**
 * Firebase Sign-In Adapter
 *
 * Implements the generic SignInAdapter interface for Firebase Authentication.
 * Encapsulates all Firebase SDK calls, platform branching (web vs Capacitor
 * native), RecaptchaVerifier management, and user-mapping logic.
 *
 * Apps create one instance at startup via `registerSignInAdapterFactory()`:
 *
 * ```ts
 * registerSignInAdapterFactory('firebase', (config) =>
 *     createFirebaseSignInAdapter({
 *         getAuth: () => auth(),
 *         getNativeAuth: () => FirebaseAuthentication,
 *         isNativePlatform: () => Capacitor.isNativePlatform(),
 *         emailLinkSettings: { url: 'https://app.example.com/login', ... },
 *     })
 * );
 * ```
 */

import type {
    AuthUser,
    AuthProviderType,
    SignInAdapter,
    PhoneVerificationHandle,
} from '@learncard/types';

import { ensureRecaptcha, destroyRecaptcha } from '../helpers/recaptcha.helpers';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/**
 * Minimal shape of the Firebase Auth instance we need.
 * Using a structural type instead of importing `Auth` keeps the adapter
 * decoupled from the exact Firebase SDK version.
 */
export interface FirebaseAuthLike {
    currentUser: {
        uid: string;
        email: string | null;
        phoneNumber: string | null;
        displayName: string | null;
        photoURL: string | null;
        getIdToken: (forceRefresh?: boolean) => Promise<string>;
        metadata?: { creationTime?: string };
    } | null;
    signOut: () => Promise<void>;
}

/**
 * Minimal shape of the Capacitor FirebaseAuthentication plugin.
 * Uses permissive types (`any`) for return values so the structural type
 * is compatible with every version of the Capacitor plugin without
 * requiring consumers to cast.
 */
export interface NativeFirebaseAuthLike {
    signInWithGoogle: () => Promise<any>;
    signInWithApple: (options?: any) => Promise<any>;
    getCurrentUser: () => Promise<any>;
    getIdToken: () => Promise<any>;
    sendSignInLinkToEmail: (options: any) => Promise<any>;
    isSignInWithEmailLink: (options: any) => Promise<any>;
    signOut: () => Promise<any>;
}

export interface FirebaseSignInAdapterConfig {
    /** Returns the Firebase Auth instance */
    getAuth: () => FirebaseAuthLike;

    /** Returns the Capacitor FirebaseAuthentication plugin (optional, native only) */
    getNativeAuth?: () => NativeFirebaseAuthLike;

    /** Whether the app is running on a native Capacitor platform */
    isNativePlatform?: () => boolean;

    /** Email link action code settings */
    emailLinkSettings?: {
        url: string;
        iOS?: { bundleId: string };
        android?: { packageName: string; installApp?: boolean; minimumVersion?: string };
        dynamicLinkDomain?: string;
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mapFirebaseUser = (u: NonNullable<FirebaseAuthLike['currentUser']>): AuthUser => ({
    id: u.uid,
    email: u.email || undefined,
    phone: u.phoneNumber || undefined,
    displayName: u.displayName || undefined,
    photoUrl: u.photoURL || undefined,
    providerType: 'firebase' as AuthProviderType,
    createdAt: u.metadata?.creationTime ? new Date(u.metadata.creationTime) : undefined,
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createFirebaseSignInAdapter(config: FirebaseSignInAdapterConfig): SignInAdapter {
    const { getAuth, getNativeAuth, isNativePlatform } = config;

    let cachedUser: AuthUser | null = null;

    const isNative = () => isNativePlatform?.() ?? false;

    const requireCurrentUser = (): AuthUser => {
        const cu = getAuth().currentUser;

        if (!cu) throw new Error('No authenticated user after sign-in');

        const user = mapFirebaseUser(cu);
        cachedUser = user;
        return user;
    };

    return {
        providerType: 'firebase',

        // ── Auth state subscription ──────────────────────────────────────

        subscribe(onUser: (user: AuthUser | null) => void) {
            // Dynamically import onAuthStateChanged to avoid bundling issues
            // when the adapter is created at module level.
            let unsubscribe: (() => void) | null = null;
            let cancelled = false;

            (async () => {
                const { onAuthStateChanged } = await import('firebase/auth');

                if (cancelled) return;

                unsubscribe = onAuthStateChanged(getAuth() as never, (fbUser: unknown) => {
                    if (fbUser && typeof fbUser === 'object' && 'uid' in fbUser) {
                        const typed = fbUser as NonNullable<FirebaseAuthLike['currentUser']>;
                        cachedUser = mapFirebaseUser(typed);
                        onUser(cachedUser);
                    } else {
                        cachedUser = null;
                        onUser(null);
                    }
                });
            })();

            return () => {
                cancelled = true;
                unsubscribe?.();
            };
        },

        getCurrentUser(): AuthUser | null {
            const cu = getAuth().currentUser;

            if (cu) {
                cachedUser = mapFirebaseUser(cu);
                return cachedUser;
            }

            return cachedUser;
        },

        // ── Email link ───────────────────────────────────────────────────

        async sendEmailLink(email: string, redirectUrl?: string) {
            const settings = config.emailLinkSettings;
            const url = redirectUrl ?? settings?.url ?? window.location.origin + '/login';

            if (isNative() && getNativeAuth?.()) {
                await getNativeAuth!().sendSignInLinkToEmail({
                    email,
                    actionCodeSettings: {
                        url,
                        handleCodeInApp: true,
                        ...(settings?.iOS ? { iOS: settings.iOS } : {}),
                        ...(settings?.android ? { android: settings.android } : {}),
                        ...(settings?.dynamicLinkDomain ? { dynamicLinkDomain: settings.dynamicLinkDomain } : {}),
                    },
                });
            } else {
                const { sendSignInLinkToEmail } = await import('firebase/auth');

                await sendSignInLinkToEmail(getAuth() as never, email, {
                    url,
                    handleCodeInApp: true,
                });
            }

            window.localStorage.setItem('emailForSignIn', email);
        },

        async verifyEmailLink(email: string, link: string): Promise<AuthUser> {
            if (!email || !link) throw new Error('Email and link are required');

            const firebaseAuth = getAuth();

            if (isNative() && getNativeAuth?.()) {
                const nativeAuth = getNativeAuth!();
                const { isSignInWithEmailLink } = await nativeAuth.isSignInWithEmailLink({ emailLink: link });
                const storedEmail = window.localStorage.getItem('emailForSignIn') || email;

                if (!isSignInWithEmailLink) throw new Error('Invalid email sign-in link');

                const { EmailAuthProvider, signInWithCredential } = await import('firebase/auth');
                const credential = EmailAuthProvider.credentialWithLink(storedEmail, link);
                await signInWithCredential(firebaseAuth as never, credential);
            } else {
                const { isSignInWithEmailLink, signInWithEmailLink } = await import('firebase/auth');

                if (!isSignInWithEmailLink(firebaseAuth as never, link)) {
                    throw new Error('Invalid email sign-in link');
                }

                await signInWithEmailLink(firebaseAuth as never, email, link);
            }

            window.localStorage.removeItem('emailForSignIn');
            return requireCurrentUser();
        },

        isEmailLink(link: string): boolean {
            // Synchronous best-effort check — look for Firebase email link params
            return link.includes('oobCode=') && link.includes('mode=signIn');
        },

        // ── Phone OTP ────────────────────────────────────────────────────

        async sendPhoneOtp(phoneNumber: string): Promise<PhoneVerificationHandle> {
            const firebaseAuth = getAuth();

            destroyRecaptcha();
            await ensureRecaptcha(firebaseAuth);

            const { signInWithPhoneNumber } = await import('firebase/auth');

            const confirmationResult = await signInWithPhoneNumber(
                firebaseAuth as never,
                phoneNumber,
                window.recaptchaVerifier
            );

            // Store on window for backward compat with existing native flows
            window.confirmationResult = confirmationResult;

            return {
                verificationId: confirmationResult.verificationId,
                _internal: confirmationResult,
            };
        },

        async confirmPhoneOtp(handle: PhoneVerificationHandle, code: string | number): Promise<AuthUser> {
            const confirmationResult = handle._internal as { confirm: (code: string | number) => Promise<{ user: unknown }> } | undefined;

            if (confirmationResult?.confirm) {
                await confirmationResult.confirm(code);
            } else {
                // Fallback: use credential-based sign-in
                const { PhoneAuthProvider, signInWithCredential } = await import('firebase/auth');
                const credential = PhoneAuthProvider.credential(handle.verificationId, String(code));
                await signInWithCredential(getAuth() as never, credential);
            }

            return requireCurrentUser();
        },

        async confirmNativePhoneOtp(verificationId: string, code: string | number): Promise<AuthUser> {
            const { PhoneAuthProvider, signInWithCredential } = await import('firebase/auth');
            const credential = PhoneAuthProvider.credential(verificationId, String(code));
            await signInWithCredential(getAuth() as never, credential);
            return requireCurrentUser();
        },

        // ── OAuth ────────────────────────────────────────────────────────

        async signInWithGoogle(): Promise<AuthUser> {
            const firebaseAuth = getAuth();
            const nativeAuth = getNativeAuth?.();

            if (!nativeAuth) throw new Error('Google sign-in requires the native Firebase plugin');

            const signInResult = await nativeAuth.signInWithGoogle();

            // Also sign in on the web layer for SDK consistency on native
            if (isNative() && signInResult.credential?.idToken) {
                try {
                    const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
                    const credential = GoogleAuthProvider.credential(signInResult.credential.idToken);
                    await signInWithCredential(firebaseAuth as never, credential);
                } catch (e) {
                    console.warn('[FirebaseSignInAdapter] Web-layer Google credential failed:', e);
                }
            }

            return requireCurrentUser();
        },

        async signInWithApple(): Promise<AuthUser> {
            const firebaseAuth = getAuth();

            if (isNative()) {
                const nativeAuth = getNativeAuth?.();

                if (!nativeAuth) throw new Error('Apple sign-in on native requires the Firebase plugin');

                const result = await nativeAuth.signInWithApple({ skipNativeAuth: true });

                const { OAuthProvider, signInWithCredential } = await import('firebase/auth');
                const provider = new OAuthProvider('apple.com');
                const credential = provider.credential({
                    idToken: result.credential?.idToken,
                    rawNonce: result.credential?.nonce,
                });

                await signInWithCredential(firebaseAuth as never, credential);
            } else {
                const { OAuthProvider, signInWithPopup } = await import('firebase/auth');
                const provider = new OAuthProvider('apple.com');

                await signInWithPopup(firebaseAuth as never, provider);
            }

            return requireCurrentUser();
        },

        async checkRedirectResult(): Promise<AuthUser | null> {
            if (isNative()) return null;

            const { getRedirectResult, OAuthProvider } = await import('firebase/auth');
            const result = await getRedirectResult(getAuth() as never);

            if (!result) return null;

            const credential = OAuthProvider.credentialFromResult(result);

            if (!credential) return null;

            return requireCurrentUser();
        },

        // ── Custom / SSO ─────────────────────────────────────────────────

        async signInWithCustomToken(token: string): Promise<AuthUser> {
            const { signInWithCustomToken } = await import('firebase/auth');
            await signInWithCustomToken(getAuth() as never, token);
            return requireCurrentUser();
        },

        async signInWithOidcCredential(providerId: string, idToken: string): Promise<AuthUser> {
            const { OAuthProvider, signInWithCredential } = await import('firebase/auth');
            const provider = new OAuthProvider(providerId);
            const credential = provider.credential({ idToken });
            await signInWithCredential(getAuth() as never, credential);
            return requireCurrentUser();
        },

        // ── Account management ───────────────────────────────────────────

        async deleteAccount(): Promise<void> {
            const cu = getAuth().currentUser;

            if (!cu) throw new Error('No user to delete');

            const { deleteUser } = await import('firebase/auth');
            await deleteUser(cu as never);
        },

        async signOut(): Promise<void> {
            await getAuth().signOut();

            if (isNative() && getNativeAuth?.()) {
                try {
                    await getNativeAuth!().signOut();
                } catch (e) {
                    console.warn('[FirebaseSignInAdapter] Native signOut failed:', e);
                }
            }
        },

        // ── Cleanup ──────────────────────────────────────────────────────

        cleanup() {
            destroyRecaptcha();
        },
    };
}
