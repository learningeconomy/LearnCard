import { Capacitor } from '@capacitor/core';
import { getLogger } from 'learn-card-base';

import { createClassLinkAttempt } from './classlinkPkce';
import { AuthSessionError } from '@learncard/types';
import { openNativeAuthSession } from '../nativeAuthSession';
import { CLASSLINK_CALLBACK_PATH } from './classlinkPkce';

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
/** Turns a native callback URL into the in-app callback route, keeping only the OAuth params. */
export const toClassLinkCallbackPath = (callbackUrl: string): string => {
    const query = callbackUrl.includes('?') ? callbackUrl.slice(callbackUrl.indexOf('?') + 1) : '';
    const source = new URLSearchParams(query.split('#')[0]);
    const params = new URLSearchParams();
    for (const key of ['code', 'state', 'error']) {
        const value = source.get(key);
        if (value) params.set(key, value);
    }
    const search = params.toString();
    return search ? `${CLASSLINK_CALLBACK_PATH}?${search}` : CLASSLINK_CALLBACK_PATH;
};

export const startClassLinkLogin = async (
    getAuthorizeUrl: ClassLinkAuthorizeUrlFn,
    navigate: (path: string) => void,
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
            let callbackUrl: string;
            try {
                callbackUrl = await openNativeAuthSession(url, {
                    callbackUrlPrefix: attempt.redirectUri,
                    callbackScheme: attempt.redirectUri.split(':')[0],
                });
            } catch (e) {
                if (e instanceof AuthSessionError) {
                    navigate(`${CLASSLINK_CALLBACK_PATH}?error=access_denied`);
                    return false;
                }
                throw e;
            }
            // The native session hands the callback URL straight back; process it in-app.
            navigate(toClassLinkCallbackPath(callbackUrl));
        } else {
            window.location.assign(url);
        }
        return true;
    } catch (e) {
        log.error('ClassLink login failed', e);
        return false;
    }
};
