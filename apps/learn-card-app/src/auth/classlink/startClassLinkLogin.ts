import { Capacitor } from '@capacitor/core';
import { getLogger } from 'learn-card-base';

import { createClassLinkAttempt } from './classlinkPkce';
import { openNativeAuthSession } from '../nativeAuthSession';

const log = getLogger('classlink-start-login');

export type ClassLinkAuthorizeUrlFn = (args: {
    redirectUri: string;
    codeChallenge: string;
    state: string;
    nonce: string;
}) => Promise<{ url: string }>;

/**
 * Starts (or re-starts) a ClassLink sign-in attempt: generates PKCE state, requests
 * the authorize URL, then navigates (web) or opens the native auth session. Shared
 * between LoginPage's initial sign-in and TranscriptOptInCard's reauth button so
 * both follow the exact same redirect/PKCE handling.
 */
export const startClassLinkLogin = async (
    getAuthorizeUrl: ClassLinkAuthorizeUrlFn,
    redirectTo?: string
): Promise<boolean> => {
    try {
        const attempt = await createClassLinkAttempt(redirectTo ? { redirectTo } : {});
        const { url } = await getAuthorizeUrl({
            redirectUri: attempt.redirectUri,
            codeChallenge: attempt.codeChallenge,
            state: attempt.state,
            nonce: attempt.nonce,
        });

        if (Capacitor.isNativePlatform()) {
            await openNativeAuthSession(url, {
                callbackUrlPrefix: attempt.redirectUri,
                callbackScheme: attempt.redirectUri.split(':')[0],
            });
            // The native callback URL is processed by the appUrlOpen listener in App.tsx,
            // which routes to /auth/classlink/callback.
        } else {
            window.location.assign(url);
        }
        return true;
    } catch (e) {
        log.error('ClassLink login failed', e);
        return false;
    }
};
