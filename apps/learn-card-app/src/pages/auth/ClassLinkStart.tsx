import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import { useClassLinkAuthorizeUrl } from 'learn-card-base/react-query/mutations/firebase';
import { LoadingPageDumb } from '../loadingPage/LoadingPage';
import { startClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';
import * as m from '../../paraglide/messages.js';

/**
 * Launch URL for ClassLink's LaunchPad. ClassLink-initiated sign-ins carry no state or PKCE
 * verifier from this app, so instead of accepting them we start our normal sign-in; the
 * student's ClassLink session is already active, so it completes without another login.
 */
const ClassLinkStart: React.FC = () => {
    const history = useHistory();
    const { mutateAsync: getAuthorizeUrl } = useClassLinkAuthorizeUrl();
    const { presentToast } = useToast();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        void startClassLinkLogin(getAuthorizeUrl, path => history.replace(path)).then(started => {
            if (started) return;
            presentToast(m['login.classlink.failed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            history.replace('/login');
        });
    }, [getAuthorizeUrl, history, presentToast]);

    return <LoadingPageDumb />;
};

export default ClassLinkStart;
