import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import { useClassLinkAuthorizeUrl } from 'learn-card-base/react-query/mutations/firebase';
import { LoadingPageDumb } from '../loadingPage/LoadingPage';
import { runClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';
import * as m from '../../paraglide/messages.js';

/**
 * Launch URL for ClassLink's LaunchPad. ClassLink-initiated sign-ins carry no state or PKCE
 * verifier from this app, so instead of accepting them we start our normal sign-in; the
 * student's ClassLink session is already active, so it completes without another login.
 */
const ClassLinkStart: React.FC = () => {
    const navigate = useNavigate();
    const { mutateAsync: getAuthorizeUrl } = useClassLinkAuthorizeUrl();
    const { presentToast } = useToast();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        void runClassLinkLogin(getAuthorizeUrl, path => navigate(path, { replace: true })).then(
            outcome => {
                // 'handled' already navigated to the callback route, which shows the message.
                if (outcome !== 'failed') return;
                presentToast(m['login.classlink.failed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                navigate('/login', { replace: true });
            }
        );
    }, [getAuthorizeUrl, navigate, presentToast]);

    return <LoadingPageDumb />;
};

export default ClassLinkStart;
