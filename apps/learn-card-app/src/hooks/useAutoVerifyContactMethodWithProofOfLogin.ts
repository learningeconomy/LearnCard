import { useEffect, useRef } from 'react';

import { useVerifyContactMethodWithProofOfLogin } from 'learn-card-base/react-query/mutations/firebase';
import { useAppAuth } from '../providers/AuthCoordinatorProvider';
import {
    useIsLoggedIn,
    useIsCurrentUserLCNUser,
    currentUserStore,
    authUserStore,
    getLogger,
} from 'learn-card-base';
import autoVerifyStore from '../stores/autoVerifyStore';

// Verification cache settings
const VERIFY_CACHE_TTL_MS = 30 * 60_000; // 30 minutes
const log = getLogger('auto-verify-contact');

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
    const { data: isLCNUser, isLoading } = useIsCurrentUserLCNUser();
    const isLoggedIn = useIsLoggedIn();
    const currentUser = currentUserStore.get.currentUser();
    const authUser = authUserStore.useTracked.currentUser();
    const { authProvider } = useAppAuth();

    const { mutateAsync: verifyContact } = useVerifyContactMethodWithProofOfLogin();

    const inFlightRef = useRef(false);

    useEffect(() => {
        if (!isLoggedIn) {
            inFlightRef.current = false;
            return;
        }

        if (inFlightRef.current) return;

        (async () => {
            if (isLoading || !isLCNUser || !isLoggedIn) return;
            try {
                inFlightRef.current = true;

                const token = await authProvider?.getIdToken(true);

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
                    } catch (error) {
                        log.warn('Unable to hash contact fingerprint', error);
                    }
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
                log.error(e);
            } finally {
                inFlightRef.current = false;
            }
        })();
    }, [isLoggedIn, isLCNUser, isLoading, authUser, currentUser, authProvider]);
};

export default useAutoVerifyContactMethodWithProofOfLogin;
