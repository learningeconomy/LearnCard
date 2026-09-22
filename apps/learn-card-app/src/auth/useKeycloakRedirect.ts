import { useEffect, useRef, useState } from 'react';
import { AuthSessionError } from '@learncard/types';
import { getLogger, useSignInAdapter, useToast, ToastTypeEnum } from 'learn-card-base';
import {
    assertCurrentKeycloakReauth,
    clearKeycloakReauth,
    readKeycloakReauth,
} from './keycloakReauth';
import type { PendingKeycloakReauth } from './keycloakReauth';

const log = getLogger('keycloak-redirect');

/** Reuse /login's normal post-auth routing, including new-account setup. */
export const useKeycloakRedirect = (
    onReauthenticated?: (intent: PendingKeycloakReauth) => Promise<void>,
    ready = false
): boolean => {
    const adapter = useSignInAdapter();
    const { presentToast } = useToast();
    const started = useRef(false);
    const isKeycloak = adapter.providerType === 'keycloak';
    const [resume, setResume] = useState<PendingKeycloakReauth | null>(null);
    const resuming = useRef(false);

    useEffect(() => {
        if (!resume || !ready || !onReauthenticated || resuming.current) return;
        resuming.current = true;
        const complete = async (): Promise<void> => {
            try {
                assertCurrentKeycloakReauth(resume, resume.userId);
                await onReauthenticated(resume);
            } catch {
                presentToast('Unable to resume. Please try the action again.', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } finally {
                clearKeycloakReauth();
            }
        };
        void complete();
    }, [resume, ready, onReauthenticated, presentToast]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (
            !isKeycloak ||
            started.current ||
            !(params.has('error') || (params.has('code') && params.has('state')))
        )
            return;
        started.current = true;
        void adapter
            .checkRedirectResult?.()
            .then(user => {
                const intent = readKeycloakReauth();
                if (intent && user?.id === intent.userId) setResume(intent);
            })
            .catch(error => {
                clearKeycloakReauth();
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
