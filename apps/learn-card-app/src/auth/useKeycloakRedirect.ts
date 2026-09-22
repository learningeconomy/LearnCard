import { useEffect, useRef } from 'react';
import { AuthSessionError } from '@learncard/types';
import { getLogger, useSignInAdapter, useToast, ToastTypeEnum } from 'learn-card-base';

const log = getLogger('keycloak-redirect');

/** Reuse /login's normal post-auth routing, including new-account setup. */
export const useKeycloakRedirect = (): boolean => {
    const adapter = useSignInAdapter();
    const { presentToast } = useToast();
    const started = useRef(false);
    const isKeycloak = adapter.providerType === 'keycloak';

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (
            !isKeycloak ||
            started.current ||
            !(params.has('error') || (params.has('code') && params.has('state')))
        )
            return;
        started.current = true;
        void adapter.checkRedirectResult?.().catch(error => {
            // Callback URLs and SDK errors can contain credentials. Log no raw callback data.
            log.warn('Sign-in redirect could not be completed');
            presentToast(
                error instanceof AuthSessionError
                    ? 'Sign-in expired. Please try again.'
                    : 'Something went wrong. Please try again.',
                { type: ToastTypeEnum.Error, hasDismissButton: true }
            );
        });
    }, [adapter, isKeycloak, presentToast]);

    return isKeycloak;
};
