import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { usePathQuery, useToast, ToastTypeEnum, authUserStore } from 'learn-card-base';
import { useClassLinkExchangeCode } from 'learn-card-base/react-query/mutations/firebase';
import { LoadingPageDumb } from '../loadingPage/LoadingPage';
import { useFirebase } from '../../hooks/useFirebase';
import { useAuthCoordinator } from '../../providers/AuthCoordinatorProvider';
import { consumeClassLinkAttempt } from '../../auth/classlink/classlinkPkce';
import { getLogger } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const log = getLogger('classlink');

const ClassLinkCallback: React.FC = () => {
    const query = usePathQuery();
    const history = useHistory();
    const { logout: coordinatorLogout } = useAuthCoordinator();
    const { signInWithCustomFirebaseToken } = useFirebase();
    const { mutateAsync: exchangeCode } = useClassLinkExchangeCode();
    const { presentToast } = useToast();
    const hasRun = useRef(false);
    const currentAuthUser = authUserStore.get.currentUser();

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const processCallback = async () => {
            const code = query.get('code');
            const state = query.get('state');
            const error = query.get('error');

            if (error) {
                if (error === 'access_denied') {
                    presentToast(m['login.classlink.cancelled'](), {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                } else {
                    presentToast(m['login.classlink.failed'](), {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                }
                history.replace('/login');
                return;
            }

            if (!code || !state) {
                presentToast(m['login.classlink.expired'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                history.replace('/login');
                return;
            }

            const attempt = await consumeClassLinkAttempt(state);
            if (!attempt) {
                presentToast(m['login.classlink.expired'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                history.replace('/login');
                return;
            }

            try {
                const response = await exchangeCode({
                    code,
                    codeVerifier: attempt.codeVerifier,
                    redirectUri: attempt.redirectUri,
                    nonce: attempt.nonce,
                });

                if (response?.token) {
                    if (currentAuthUser) {
                        await coordinatorLogout();
                    }
                    await signInWithCustomFirebaseToken(response.token);
                    history.replace(attempt.redirectTo || '/wallet');
                } else {
                    throw new Error('No token returned');
                }
            } catch (e) {
                log.error('ClassLink exchange failed', e);

                const trpcError = e as { data?: { code?: string }; message?: string };
                const code = trpcError.data?.code;

                let errorMessage = m['login.classlink.failed']();
                if (
                    code === 'BAD_REQUEST' ||
                    code === 'CONFLICT' ||
                    code === 'PRECONDITION_FAILED' ||
                    code === 'TOO_MANY_REQUESTS'
                ) {
                    errorMessage = trpcError.message || errorMessage;
                }

                presentToast(errorMessage, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                history.replace('/login');
            }
        };

        void processCallback();
    }, [
        query,
        history,
        coordinatorLogout,
        signInWithCustomFirebaseToken,
        exchangeCode,
        presentToast,
        currentAuthUser,
    ]);

    return <LoadingPageDumb />;
};

export default ClassLinkCallback;
