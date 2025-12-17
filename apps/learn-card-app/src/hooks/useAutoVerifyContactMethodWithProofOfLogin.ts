import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import { useVerifyContactMethodWithProofOfLogin } from 'learn-card-base/react-query/mutations/firebase';
import { auth } from '../firebase/firebase';
import { useIsLoggedIn, useIsCurrentUserLCNUser, currentUserStore, firebaseAuthStore } from 'learn-card-base';
import { captureException } from '@sentry/react';
import autoVerifyStore from '../stores/autoVerifyStore';
import { useFlags } from 'launchdarkly-react-client-sdk';

// Verification cache settings
const VERIFY_CACHE_TTL_MS = 30 * 60_000; // 30 minutes

type VerifyCacheEntry = { fingerprint: string; ts: number };

// Ephemeral, in-memory cache to throttle redundant verifications per UID + contact fingerprint
const verifiedContactCache = new Map<string, VerifyCacheEntry>();

const needsVerification = (uid: string | null | undefined, fingerprint: string): boolean => {
    if (!uid) return true;

    const entry = verifiedContactCache.get(uid);
    if (!entry) return true;

    const age = Date.now() - entry.ts;
    if (age > VERIFY_CACHE_TTL_MS) return true;

    return entry.fingerprint !== fingerprint;
};

const markVerified = (uid: string | null | undefined, fingerprint: string): void => {
    if (!uid) return;
    verifiedContactCache.set(uid, { fingerprint, ts: Date.now() });
};

export const useAutoVerifyContactMethodWithProofOfLogin = () => {
    const flags = useFlags();
    const { data: isLCNUser, isLoading } = useIsCurrentUserLCNUser();
    const isLoggedIn = useIsLoggedIn();
    const currentUser = currentUserStore.get.currentUser();
    const firebaseAuthUser = firebaseAuthStore.useTracked.currentUser();

    const { mutateAsync: verifyContact } = useVerifyContactMethodWithProofOfLogin();

    const inFlightRef = useRef(false);

    useEffect(() => {
        if (!isLoggedIn) {
            inFlightRef.current = false;
            return;
        }

        if (inFlightRef.current) return;

        (async () => {
            if (isLoading || !isLCNUser || !isLoggedIn || !flags?.enableAutoVerifyContactMethodWithProofOfLogin) return;
            try {
                inFlightRef.current = true;

                let token: string | undefined;

                if (Capacitor.isNativePlatform()) {
                    const res = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
                    token = res?.token || undefined;
                } else {
                    const firebaseAuth = auth();
                    const user = firebaseAuth?.currentUser;
                    token = user ? await user.getIdToken(true) : undefined;
                }

                if (!token) return;

                // Compute a fingerprint for the contact method so we can compare without storing raw values
                const fingerprint = async (value: string) => {
                    try {
                        if (typeof window !== 'undefined' && window.crypto?.subtle) {
                            const data = new TextEncoder().encode(value);
                            const hash = await window.crypto.subtle.digest('SHA-256', data);
                            return Array.from(new Uint8Array(hash))
                                .map(b => b.toString(16).padStart(2, '0'))
                                .join('');
                        }
                    } catch {}
                    return value; // fallback
                };

                const contactValue = currentUser?.email ?? currentUser?.phoneNumber ?? '';
                const currentContactMethodFingerprint = await fingerprint(contactValue);

                if (!needsVerification(currentUser?.uid, currentContactMethodFingerprint)) {
                    return;
                }

                const result = await verifyContact({ token });

                if (result?.success) {
                    markVerified(currentUser?.uid, currentContactMethodFingerprint);
                    autoVerifyStore.set.markVerifySuccess();
                }
            } catch (e) {
                // Capture with Sentry; verification is best-effort and should not block app flow
                captureException(e);
            } finally {
                inFlightRef.current = false;
            }
        })();
    }, [isLoggedIn, isLCNUser, firebaseAuthUser]);
};

export default useAutoVerifyContactMethodWithProofOfLogin;
