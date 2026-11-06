import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    usePathQuery,
    useToast,
    useWallet,
    ToastTypeEnum,
    getLogger,
    SCHOOL_CONNECTION_QUERY_KEY,
} from 'learn-card-base';
import { useClassLinkConnect } from 'learn-card-base/react-query/mutations/firebase';
import { LoadingPageDumb } from '../loadingPage/LoadingPage';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { consumeClassLinkAttempt } from '../../auth/classlink/classlinkPkce';
import {
    claimClassLinkCallback,
    getClassLinkCallbackKey,
} from '../../auth/classlink/classlinkCallbackGuard';
import { applyClassLinkPrivateProfile } from '../../auth/classlink/classlinkProfileDefaults';
import { CLASSLINK_TIMEOUT_ERROR } from '../../auth/classlink/startClassLinkLogin';
import * as m from '../../paraglide/messages.js';

const log = getLogger('classlink-connect');

export const SCHOOL_CONNECT_PATH = '/school-connect';
const READY_TIMEOUT_MS = 30_000;
const SHOWN_ERROR_CODES = ['BAD_REQUEST', 'CONFLICT', 'PRECONDITION_FAILED', 'TOO_MANY_REQUESTS'];

/**
 * Finishes a School Connect round trip: attaches the ClassLink school account to the
 * account that is already signed in. Unlike sign-in, it never changes the session.
 */
const ClassLinkConnectCallback: React.FC = () => {
    const query = usePathQuery();
    const history = useHistory();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const { state: authState } = useAppAuth();
    const { mutateAsync: connect } = useClassLinkConnect();
    const { initWallet } = useWallet();
    const hasRun = useRef(false);
    const isReady = authState.status === 'ready';

    const fail = (message: string, path = SCHOOL_CONNECT_PATH) => {
        presentToast(message, { type: ToastTypeEnum.Error, hasDismissButton: true });
        history.replace(path);
    };

    useEffect(() => {
        if (isReady || hasRun.current) return;
        const timer = window.setTimeout(() => {
            if (hasRun.current) return;
            hasRun.current = true;
            fail(m['schoolConnect.signInFirst'](), '/login');
        }, READY_TIMEOUT_MS);
        return () => window.clearTimeout(timer);
    }, [isReady]);

    useEffect(() => {
        if (!isReady || hasRun.current) return;
        hasRun.current = true;

        const error = query.get('error');
        const code = query.get('code');
        const state = query.get('state');
        // A second instance for the same callback (remount) must not re-consume the
        // single-use attempt or connect the same code twice.
        const release = claimClassLinkCallback(getClassLinkCallbackKey({ code, state, error }));
        if (!release) return;

        const run = async () => {
            const attempt = state ? await consumeClassLinkAttempt(state) : null;
            const returnTo = attempt?.redirectTo || SCHOOL_CONNECT_PATH;

            if (error) {
                fail(
                    error === 'access_denied'
                        ? m['login.classlink.cancelled']()
                        : error === CLASSLINK_TIMEOUT_ERROR
                          ? m['login.classlink.timedOut']()
                          : m['schoolConnect.connectFailed'](),
                    returnTo
                );
                return;
            }
            if (!code || !attempt) {
                fail(m['login.classlink.expired'](), returnTo);
                return;
            }

            try {
                const result = await connect({
                    code,
                    codeVerifier: attempt.codeVerifier,
                    redirectUri: attempt.redirectUri,
                    nonce: attempt.nonce,
                });
                // Sign-in applies the private-profile default at profile creation; an
                // existing account connecting a student school account needs it applied
                // now. Logged (not fatal) on failure: the connection itself succeeded.
                if (result?.isStudent) {
                    await initWallet()
                        .then(applyClassLinkPrivateProfile)
                        .catch(profileError =>
                            log.error('classlink.profile.private.failed', profileError)
                        );
                }
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: [SCHOOL_CONNECTION_QUERY_KEY] }),
                    queryClient.invalidateQueries({ queryKey: ['transcriptStatus'] }),
                    queryClient.invalidateQueries({ queryKey: ['useGetPreferencesForDid'] }),
                ]);
                presentToast(m['schoolConnect.connectedToast'](), {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });
                history.replace(returnTo);
            } catch (e) {
                log.error('School connect failed', e);
                const trpcError = e as { data?: { code?: string }; message?: string };
                const code = trpcError.data?.code ?? '';
                const shown =
                    code === 'SERVICE_UNAVAILABLE'
                        ? m['login.classlink.unavailable']()
                        : SHOWN_ERROR_CODES.includes(code) && trpcError.message;
                fail(shown || m['schoolConnect.connectFailed'](), returnTo);
            }
        };

        void run().finally(release);
    }, [isReady]);

    return <LoadingPageDumb />;
};

export default ClassLinkConnectCallback;
