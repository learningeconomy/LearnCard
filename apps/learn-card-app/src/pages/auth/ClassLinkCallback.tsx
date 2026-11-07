import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
    usePathQuery,
    useToast,
    ToastTypeEnum,
    authUserStore,
    SocialLoginTypes,
} from 'learn-card-base';
import { useClassLinkExchangeCode } from 'learn-card-base/react-query/mutations/firebase';
import { LoadingPageDumb } from '../loadingPage/LoadingPage';
import { useFirebase } from '../../hooks/useFirebase';
import { useAuthCoordinator } from '../../providers/AuthCoordinatorProvider';
import {
    consumeClassLinkAttempt,
    peekClassLinkAttemptIntent,
} from '../../auth/classlink/classlinkPkce';
import {
    claimClassLinkCallback,
    getClassLinkCallbackKey,
} from '../../auth/classlink/classlinkCallbackGuard';
import { CLASSLINK_TIMEOUT_ERROR } from '../../auth/classlink/startClassLinkLogin';
import ClassLinkConnectCallback from './ClassLinkConnectCallback';
import { getLogger } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const log = getLogger('classlink');

const RELAUNCH_KEY = 'classlink-relaunch-at';

/** Message for an `error` param on the ClassLink sign-in callback. */
const getClassLinkCallbackErrorMessage = (error: string, fallback: string): string => {
    if (error === 'access_denied') return m['login.classlink.cancelled']();
    if (error === CLASSLINK_TIMEOUT_ERROR) return m['login.classlink.timedOut']();
    return fallback;
};

/**
 * A launch from the ClassLink dashboard arrives with a code we did not request (no stored
 * state/PKCE attempt). Never exchange it; restart our own sign-in once instead. The student
 * already has a ClassLink session, so this completes without another login.
 */
const shouldRestartLaunch = (code: string | null): boolean => {
    if (!code) return false;
    const last = Number(sessionStorage.getItem(RELAUNCH_KEY) ?? 0);
    if (Date.now() - last < 2 * 60 * 1000) return false;
    sessionStorage.setItem(RELAUNCH_KEY, String(Date.now()));
    return true;
};

const ClassLinkSignInCallback: React.FC = () => {
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

        const code = query.get('code');
        const state = query.get('state');
        const error = query.get('error');
        // A second instance for the same callback (remount) must not re-consume the
        // single-use attempt or exchange the code twice.
        const release = claimClassLinkCallback(getClassLinkCallbackKey({ code, state, error }));
        if (!release) return;

        const processCallback = async () => {
            if (error) {
                // Clear the abandoned attempt so it cannot be replayed later.
                if (state) await consumeClassLinkAttempt(state);
                presentToast(
                    getClassLinkCallbackErrorMessage(error, m['login.classlink.failed']()),
                    {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    }
                );
                history.replace('/login');
                return;
            }

            if (!state && shouldRestartLaunch(code)) {
                history.replace('/auth/classlink/start');
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
            if (!attempt && shouldRestartLaunch(code)) {
                history.replace('/auth/classlink/start');
                return;
            }
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
                    // Throws on failure so the catch below shows the error and returns to
                    // /login, instead of landing on /wallet without a session.
                    await signInWithCustomFirebaseToken(response.token, {
                        loginMethod: SocialLoginTypes.classlink,
                        throwOnError: true,
                    });
                    history.replace(attempt.redirectTo || '/wallet');
                } else {
                    throw new Error('No token returned');
                }
            } catch (e) {
                log.error('ClassLink exchange failed', e);

                const trpcError = e as { data?: { code?: string }; message?: string };
                const code = trpcError.data?.code;

                let errorMessage: string = m['login.classlink.failed']();
                if (
                    code === 'BAD_REQUEST' ||
                    code === 'CONFLICT' ||
                    code === 'PRECONDITION_FAILED' ||
                    code === 'TOO_MANY_REQUESTS'
                ) {
                    errorMessage = trpcError.message || errorMessage;
                } else if (code === 'SERVICE_UNAVAILABLE') {
                    errorMessage = m['login.classlink.unavailable']();
                }

                presentToast(errorMessage, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                history.replace('/login');
            }
        };

        void processCallback().finally(release);
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

const ClassLinkCallback: React.FC = () => {
    const query = usePathQuery();
    const [intent] = React.useState(() => peekClassLinkAttemptIntent(query.get('state')));
    return intent === 'connect' ? <ClassLinkConnectCallback /> : <ClassLinkSignInCallback />;
};

export default ClassLinkCallback;
