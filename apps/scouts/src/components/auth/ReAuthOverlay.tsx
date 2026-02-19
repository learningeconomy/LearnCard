/**
 * ReAuthOverlay
 *
 * In-place re-authentication overlay shown when the auth session (Firebase JWT)
 * has expired and silent refresh fails. Detects the user's original login method
 * and shows the appropriate re-auth UI (e.g., "Continue with Google" button).
 *
 * Flow:
 * 1. Mount → attempt silent refresh via coordinator.refreshAuthSession()
 * 2. If silent refresh succeeds → call onSuccess immediately
 * 3. If silent refresh fails → show re-auth UI matching the original login method
 * 4. User clicks re-auth → Firebase re-authenticates → onSuccess
 */

import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
    signInWithPopup,
    signInWithCredential,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    OAuthProvider,
} from 'firebase/auth';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

import {
    authStore,
    SocialLoginTypes,
    firebaseAuthStore,
    currentUserStore,
} from 'learn-card-base';

import { auth } from '../../firebase/firebase';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';

import AppleIcon from 'learn-card-base/assets/images/apple-logo.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-G-logo.svg';

type ReAuthState = 'refreshing' | 'needs_reauth' | 'reauthing' | 'success' | 'error';

interface ReAuthOverlayProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const UID_MISMATCH_ERROR = 'You signed in with a different account. Please try again with the correct account.';

const ReAuthOverlay: React.FC<ReAuthOverlayProps> = ({ onSuccess, onCancel }) => {
    const { refreshAuthSession } = useAppAuth();

    const [state, setState] = useState<ReAuthState>('refreshing');
    const [error, setError] = useState<string | null>(null);

    const attemptedRef = useRef(false);

    const loginType = authStore.use.typeOfLogin();

    // Capture the expected UID from the persisted store (auth()?.currentUser is null
    // when the session is expired, but currentUserStore retains the UID)
    const expectedUidRef = useRef<string | null>(
        currentUserStore.get.currentUser()?.uid ?? null
    );

    // Step 1: Try silent refresh on mount
    useEffect(() => {
        if (attemptedRef.current) return;

        attemptedRef.current = true;

        const tryRefresh = async () => {
            const refreshed = await refreshAuthSession();

            if (refreshed) {
                setState('success');

                // Brief delay so the user sees "Session restored" before proceeding
                setTimeout(onSuccess, 400);
            } else {
                setState('needs_reauth');
            }
        };

        tryRefresh();
    }, [refreshAuthSession, onSuccess]);

    // Step 2: Re-auth with the original login method
    const handleGoogleReAuth = async () => {
        setState('reauthing');
        setError(null);

        try {
            const firebaseAuth = auth();

            let newUid: string | undefined;

            if (Capacitor.isNativePlatform()) {
                const result = await FirebaseAuthentication.signInWithGoogle();
                const { user } = await FirebaseAuthentication.getCurrentUser();

                if (result.user && user) {
                    newUid = user.uid;

                    authStore.set.typeOfLogin(SocialLoginTypes.google);
                    firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);

                    // Also sign in on the web layer
                    try {
                        const credential = GoogleAuthProvider.credential(
                            result.credential?.idToken
                        );

                        await signInWithCredential(firebaseAuth, credential);
                    } catch (e) {
                        console.warn('ReAuth: web-layer credential sync failed', e);
                    }
                }
            } else {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(firebaseAuth, provider);

                if (result?.user) {
                    newUid = result.user.uid;

                    authStore.set.typeOfLogin(SocialLoginTypes.google);
                    firebaseAuthStore.set.setFirebaseCurrentUser(result.user);
                }
            }

            // UID mismatch guard — reject if a different account was used
            if (expectedUidRef.current && newUid && newUid !== expectedUidRef.current) {
                console.warn('ReAuth: UID mismatch — expected', expectedUidRef.current, 'got', newUid);
                await firebaseSignOut(firebaseAuth);
                setError(UID_MISMATCH_ERROR);
                setState('error');
                return;
            }

            // Refresh the coordinator's session state
            await refreshAuthSession();

            setState('success');
            setTimeout(onSuccess, 400);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Sign-in failed';
            const code = (e as { code?: string })?.code;

            // User cancelled — don't show error
            if (
                code === 'auth/popup-closed-by-user' ||
                code === 'auth/cancelled-popup-request'
            ) {
                setState('needs_reauth');
                return;
            }

            setError(msg);
            setState('error');
        }
    };

    const handleAppleReAuth = async () => {
        setState('reauthing');
        setError(null);

        try {
            const firebaseAuth = auth();

            let newUid: string | undefined;

            if (Capacitor.isNativePlatform()) {
                const result = await FirebaseAuthentication.signInWithApple({
                    skipNativeAuth: true,
                });

                const provider = new OAuthProvider('apple.com');
                const credential = provider.credential({
                    idToken: result.credential?.idToken,
                    rawNonce: result.credential?.nonce,
                });

                await signInWithCredential(firebaseAuth, credential);

                const user = firebaseAuth.currentUser;

                if (user) {
                    newUid = user.uid;

                    authStore.set.typeOfLogin(SocialLoginTypes.apple);
                    firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);
                }
            } else {
                const provider = new OAuthProvider('apple.com');
                const result = await signInWithPopup(firebaseAuth, provider);

                if (result?.user) {
                    newUid = result.user.uid;

                    authStore.set.typeOfLogin(SocialLoginTypes.apple);
                    firebaseAuthStore.set.setFirebaseCurrentUser(result.user);
                }
            }

            // UID mismatch guard — reject if a different account was used
            if (expectedUidRef.current && newUid && newUid !== expectedUidRef.current) {
                console.warn('ReAuth: UID mismatch — expected', expectedUidRef.current, 'got', newUid);
                await firebaseSignOut(firebaseAuth);
                setError(UID_MISMATCH_ERROR);
                setState('error');
                return;
            }

            await refreshAuthSession();

            setState('success');
            setTimeout(onSuccess, 400);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Sign-in failed';
            const code = (e as { code?: string })?.code;

            if (
                code === 'auth/popup-closed-by-user' ||
                code === 'auth/cancelled-popup-request'
            ) {
                setState('needs_reauth');
                return;
            }

            setError(msg);
            setState('error');
        }
    };

    // --- Refreshing state ---
    if (state === 'refreshing') {
        return (
            <div className="p-8 text-center space-y-5 bg-white rounded-[20px] font-poppins">
                <div className="flex justify-center">
                    <span className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin" />
                </div>

                <p className="text-sm text-grayscale-600">Restoring your session...</p>
            </div>
        );
    }

    // --- Success state ---
    if (state === 'success') {
        return (
            <div className="p-8 text-center space-y-5 bg-white rounded-[20px] font-poppins">
                <div className="flex justify-center">
                    <IonIcon icon={checkmarkCircleOutline} className="text-emerald-500 text-4xl" />
                </div>

                <h2 className="text-xl font-semibold text-grayscale-900">Session Restored</h2>

                <p className="text-sm text-grayscale-600">You're all set.</p>
            </div>
        );
    }

    // --- Determine which re-auth buttons to show ---
    const isGoogle = loginType === SocialLoginTypes.google;
    const isApple = loginType === SocialLoginTypes.apple;
    const hasSocialReAuth = isGoogle || isApple;

    return (
        <div className="p-8 text-center space-y-5 bg-white rounded-[20px] font-poppins">
            <div className="flex justify-center">
                <IonIcon icon={alertCircleOutline} className="text-amber-500 text-4xl" />
            </div>

            <h2 className="text-xl font-semibold text-grayscale-900">Session Expired</h2>

            <p className="text-sm text-grayscale-600 leading-relaxed">
                {hasSocialReAuth
                    ? 'Your sign-in session has expired. Please sign in again to continue.'
                    : 'Your sign-in session has expired. Please sign out and sign back in to continue.'}
            </p>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
                    <span className="text-sm text-red-700 leading-relaxed text-left">{error}</span>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {isGoogle && (
                    <button
                        onClick={handleGoogleReAuth}
                        disabled={state === 'reauthing'}
                        className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                        {state === 'reauthing' ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            <>
                                <img src={GoogleIcon} alt="" className="w-5 h-5" />
                                Continue with Google
                            </>
                        )}
                    </button>
                )}

                {isApple && (
                    <button
                        onClick={handleAppleReAuth}
                        disabled={state === 'reauthing'}
                        className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                        {state === 'reauthing' ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            <>
                                <img src={AppleIcon} alt="" className="w-5 h-5 brightness-0 invert" />
                                Continue with Apple
                            </>
                        )}
                    </button>
                )}

                <button
                    onClick={onCancel}
                    disabled={state === 'reauthing'}
                    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                >
                    {hasSocialReAuth ? 'Cancel' : 'Dismiss'}
                </button>
            </div>
        </div>
    );
};

export default ReAuthOverlay;
