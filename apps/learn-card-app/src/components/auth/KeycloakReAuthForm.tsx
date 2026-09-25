import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { authUserStore, currentUserStore, useSignInAdapter } from 'learn-card-base';
import type { KeycloakSignInAdapter } from 'learn-card-base';
import { useSendLoginVerificationCode } from 'learn-card-base/react-query/mutations/firebase';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import {
    assertCurrentKeycloakReauth,
    beginKeycloakReauth,
    clearKeycloakReauth,
    getReauthReturnTo,
} from '../../auth/keycloakReauth';
import type { ReauthAction } from '../../auth/keycloakReauth';
import type { RecoverySetupType } from '../recovery/RecoverySetupModal';
import { requestEmailOtpTicket } from '../../auth/keycloakTickets';

export const KeycloakReAuthForm: React.FC<{
    action: ReauthAction;
    initialMethod?: RecoverySetupType;
    onCancel: () => void;
    /**
     * Native only: web never reaches this point in-process — the redirect
     * unloads the page and `useKeycloakRedirect` resumes the caller's flow
     * after reload instead. Called once refreshAuthSession() has confirmed
     * the new session is live.
     */
    onComplete?: () => void;
}> = ({ action, initialMethod, onCancel, onComplete }) => {
    const adapter = useSignInAdapter();
    const { refreshAuthSession } = useAppAuth();
    const user = authUserStore.use.currentUser();
    const savedUser = currentUserStore.use.currentUser();
    const email = user?.email || savedUser?.email;
    const userId = user?.id || savedUser?.uid;
    const { mutateAsync: sendCode } = useSendLoginVerificationCode();
    const [sent, setSent] = useState(false);
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mounted = useRef(true);
    const available = !!email && !!userId;

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const submit = async (): Promise<void> => {
        if (!available || busy || adapter.providerType !== 'keycloak') return;
        setBusy(true);
        setError(null);
        const returnTo = getReauthReturnTo();
        try {
            if (!sent) {
                await sendCode({
                    email,
                    locale: localStorage.getItem('i18n.language') || undefined,
                });
                if (mounted.current) setSent(true);
            } else {
                const ticket = await requestEmailOtpTicket(email, code);
                if (!mounted.current) return;
                const intent = beginKeycloakReauth(userId, action, returnTo, initialMethod);
                const signedInUser = await (adapter as KeycloakSignInAdapter).signInWithCustomToken(
                    ticket,
                    { intent: 'reauthenticate' }
                );
                // Web never reaches here: the browser navigates away mid-flight and
                // `useKeycloakRedirect` resumes this same intent after the reload.
                // Native has no reload, so signInWithCustomToken resolves in-place —
                // run the same post-reauth steps the web resume does, right here.
                if (Capacitor.isNativePlatform()) {
                    assertCurrentKeycloakReauth(intent, signedInUser.id);
                    if (!(await refreshAuthSession())) {
                        throw new Error('Session could not be restored');
                    }
                    assertCurrentKeycloakReauth(intent, signedInUser.id);
                    clearKeycloakReauth();
                    onComplete?.();
                }
            }
        } catch {
            clearKeycloakReauth();
            if (!mounted.current) return;
            setError(
                sent
                    ? 'That code could not be verified. Request a new code and try again.'
                    : 'Unable to send a code. Please try again.'
            );
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    return (
        <form
            onSubmit={event => {
                event.preventDefault();
                void submit();
            }}
            className="p-8 text-center space-y-5 bg-white rounded-[20px] font-poppins"
        >
            <h2 className="text-xl font-semibold text-grayscale-900">Verify it's you</h2>
            <p className="text-sm text-grayscale-600 leading-relaxed">
                {available
                    ? sent
                        ? `Enter the code sent to ${email}.`
                        : `Send a verification code to ${email}.`
                    : 'Email verification is not available for this account on this device.'}
            </p>
            {error && (
                <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
                >
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}
            {sent && (
                <div className="text-left">
                    <label
                        htmlFor="reauth-code"
                        className="block text-xs font-medium text-grayscale-700 mb-1.5"
                    >
                        Verification code
                    </label>
                    <input
                        id="reauth-code"
                        value={code}
                        onChange={event => setCode(event.target.value)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        disabled={busy}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                </div>
            )}
            <div className="flex flex-col gap-3">
                {available && (
                    <button
                        type="submit"
                        disabled={busy || (sent && !/^\d{6}$/.test(code))}
                        className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {busy ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {sent ? 'Verifying...' : 'Sending...'}
                            </span>
                        ) : sent ? (
                            'Verify Identity'
                        ) : (
                            'Send Code'
                        )}
                    </button>
                )}
                {sent && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            setSent(false);
                            setCode('');
                            setError(null);
                        }}
                        className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        Request New Code
                    </button>
                )}
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                        clearKeycloakReauth();
                        onCancel();
                    }}
                    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};
