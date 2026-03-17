import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { usePathQuery, redirectStore } from 'learn-card-base';
import { useVerifyNetworkHandoffToken } from 'learn-card-base/react-query/mutations/firebase';

import { LoadingPageDumb } from '../loadingPage/LoadingPage';
import { useFirebase } from '../../hooks/useFirebase';
import { authUserStore } from 'learn-card-base';
import jwtDecode from 'jwt-decode';

import { useAuthCoordinator } from '../../providers/AuthCoordinatorProvider';

const shouldSkipLogout = (verifiedToken?: string, currentAuthUser?: { email?: string; phone?: string } | null) => {
    // Decode token JWT to get nonce which will look like this, e.g. contact_method_session:fc026367-a056-45ac-8135-ee2cdee1b75c:email:custard7@gmail.com
    // Then get the last two parts of the nonce, e.g. email:custard7@gmail.com as 'type' and 'value' of contact method.
    // Then compare the 'value' of the contact method with the current user's email if it's an email contact method.
    // If it's not an email contact method, then compare the 'value' of the contact method with the current user's phone number.
    // If they match, then continue with the handoff process but skip logout.
    // If they don't match, then continue with the handoff process and ensure logout is called.
    
    if (!verifiedToken || !currentAuthUser) {
        return false;
    }

    const normalizePhone = (val?: string | null) =>
        (val ?? '')
            .replace(/[^0-9+]/g, '')
            .replace(/(?!^)[+]/g, '');
    let _shouldSkipLogout = false;
    try {
        const decoded = jwtDecode<{ nonce?: string }>(verifiedToken);
        const nonce = decoded?.nonce ?? '';

        if (typeof nonce === 'string' && nonce.startsWith('contact_method_session:')) {
            const parts = nonce.split(':');
            const contactType = parts.at(-2);
            const contactValue = parts.at(-1);

            if (contactType && contactValue && currentAuthUser) {
                if (contactType.toLowerCase() === 'email') {
                    const userEmail = currentAuthUser?.email;
                    _shouldSkipLogout = !!userEmail && userEmail.toLowerCase() === contactValue.toLowerCase();
                } else {
                    const userPhone = currentAuthUser?.phone;
                    _shouldSkipLogout = !!userPhone && normalizePhone(userPhone) === normalizePhone(contactValue);
                }
            }
        }
    } catch (e) {
        // If decode fails, default to requiring logout
    }
    return _shouldSkipLogout;
};
    

const AuthHandoff: React.FC = () => {
    const query = usePathQuery();
    const history = useHistory();
    const { logout: coordinatorLogout } = useAuthCoordinator();
    const currentAuthUser = authUserStore.get.currentUser();

    const { mutateAsync: verifyNetworkHandoffToken } = useVerifyNetworkHandoffToken();
    const { signInWithCustomFirebaseToken } = useFirebase();

    useEffect(() => {
        const processHandoff = async () => {
            const token = query.get('token');

            if (!token) {
                history.replace('/login');
                return;
            }

            const redirectTo =
                redirectStore.get.authRedirect() || query.get('redirectTo') || '/wallet';

            // If the user is already logged in as the same contact method in the
            // handoff token, skip verification entirely and redirect straight away.
            // This avoids "Failed to verify network handoff token" errors when the
            // embed SDK opens the wallet for an already-authenticated user.
            if (currentFirebaseUser) {
                try {
                    const decoded = jwtDecode<{ nonce?: string }>(token);
                    const nonce = decoded?.nonce ?? '';

                    if (typeof nonce === 'string' && nonce.startsWith('contact_method_session:')) {
                        const parts = nonce.split(':');
                        const contactType = parts.at(-2);
                        const contactValue = parts.at(-1);

                        if (contactType && contactValue) {
                            const normalizePhone = (val?: string | null) =>
                                (val ?? '')
                                    .replace(/[^0-9+]/g, '')
                                    .replace(/(?!^)[+]/g, '');

                            const isMatch =
                                contactType.toLowerCase() === 'email'
                                    ? !!currentFirebaseUser.email &&
                                      currentFirebaseUser.email.toLowerCase() ===
                                          contactValue.toLowerCase()
                                    : !!currentFirebaseUser.phoneNumber &&
                                      normalizePhone(currentFirebaseUser.phoneNumber) ===
                                          normalizePhone(contactValue);

                            if (isMatch) {
                                history.replace(redirectTo);
                                return;
                            }
                        }
                    }
                } catch {
                    // Decode failed — fall through to normal verification
                }
            }

            try {
                const response = await verifyNetworkHandoffToken({ token });

                if (response?.token) {
                    if (!shouldSkipLogout(response.validatedNetworkHandoffToken, currentAuthUser)) {
                        await coordinatorLogout();
                    }

                    await signInWithCustomFirebaseToken(response.token);

                    history.replace(redirectTo);
                } else {
                    history.replace('/login');
                }
            } catch (e) {
                history.replace('/login');
            }
        };

        void processHandoff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <LoadingPageDumb />;
};

export default AuthHandoff;
