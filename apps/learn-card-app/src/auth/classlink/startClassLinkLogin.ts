import { Capacitor } from '@capacitor/core';
import { getLogger } from 'learn-card-base';

import { createClassLinkAttempt, type ClassLinkAttemptIntent } from './classlinkPkce';
import { AuthSessionError } from '@learncard/types';
import { openNativeAuthSession } from '../nativeAuthSession';
import {
    CLASSLINK_CALLBACK_PATH,
    setClassLinkNativeSessionInFlight,
    toClassLinkCallbackPath,
} from './classlinkPkce';

// Re-exported for existing callers; lives in classlinkPkce so AppUrlListener can use it
// without pulling in the native auth session module.
export { toClassLinkCallbackPath };

const log = getLogger('classlink-start-login');

/**
 * How long the native auth sheet may stay open. ClassLink sign-in is interactive
 * (district search, credentials, federated Google/Microsoft, MFA), so the 60 s iOS
 * default built for silent Keycloak hops would cut real students off mid-login.
 */
export const CLASSLINK_NATIVE_SESSION_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * App-local `error` value (not an OAuth error code) the callback route maps to a
 * "took too long" message, so a timed-out sheet is not reported as a cancellation.
 */
export const CLASSLINK_TIMEOUT_ERROR = 'login_timeout';

export type ClassLinkAuthorizeUrlFn = (args: {
    redirectUri: string;
    codeChallenge: string;
    state: string;
    nonce: string;
}) => Promise<{ url: string }>;

/**
 * Outcome of {@link runClassLinkLogin}:
 *  - `started`: the browser is redirecting to ClassLink (web) or the native sheet returned
 *    a callback URL and the in-app callback route was navigated to.
 *  - `handled`: the native sheet was closed (`error=access_denied`) or timed out
 *    (`error=login_timeout`); the callback route was navigated to and shows the message,
 *    so callers must not show their own.
 *  - `failed`: the attempt could not be started; callers show a generic error.
 */
export type ClassLinkLoginOutcome = 'started' | 'handled' | 'failed';

/**
 * Starts (or re-starts) a ClassLink sign-in attempt: generates PKCE state, requests
 * the authorize URL, then navigates (web) or opens the native auth session. Shared
 * between LoginPage, ClassLinkStart, School Connect and TranscriptOptInCard's reauth
 * button so all follow the exact same redirect/PKCE handling.
 */
export const runClassLinkLogin = async (
    getAuthorizeUrl: ClassLinkAuthorizeUrlFn,
    navigate: (path: string) => void,
    redirectTo?: string,
    intent: ClassLinkAttemptIntent = 'signIn'
): Promise<ClassLinkLoginOutcome> => {
    try {
        const attempt = await createClassLinkAttempt({
            ...(redirectTo ? { redirectTo } : {}),
            intent,
        });
        const { url } = await getAuthorizeUrl({
            redirectUri: attempt.redirectUri,
            codeChallenge: attempt.codeChallenge,
            state: attempt.state,
            nonce: attempt.nonce,
        });

        if (Capacitor.isNativePlatform()) {
            let callbackUrl: string;
            // While the sheet is open its own listener owns the callback; AppUrlListener
            // only routes ClassLink callbacks no live session will handle (cold start).
            setClassLinkNativeSessionInFlight(true);
            try {
                callbackUrl = await openNativeAuthSession(url, {
                    callbackUrlPrefix: attempt.redirectUri,
                    callbackScheme: attempt.redirectUri.split(':')[0],
                    timeoutMs: CLASSLINK_NATIVE_SESSION_TIMEOUT_MS,
                    // iOS keeps `ephemeral: true` (set inside openNativeAuthSession): ClassLink
                    // is used on shared school iPads, so we deliberately do NOT share Safari's
                    // cookie jar. Students may need to re-enter ClassLink credentials, but the
                    // next student on the device never inherits the previous one's session.
                });
            } catch (e) {
                if (e instanceof AuthSessionError) {
                    const error =
                        e.reason === 'expired' ? CLASSLINK_TIMEOUT_ERROR : 'access_denied';
                    // Carry `state` so the callback can clear (connect: and return from)
                    // the pending attempt.
                    const params = new URLSearchParams({ error, state: attempt.state });
                    navigate(`${CLASSLINK_CALLBACK_PATH}?${params.toString()}`);
                    return 'handled';
                }
                throw e;
            } finally {
                setClassLinkNativeSessionInFlight(false);
            }
            // The native session hands the callback URL straight back; process it in-app.
            navigate(toClassLinkCallbackPath(callbackUrl));
        } else {
            window.location.assign(url);
        }
        return 'started';
    } catch (e) {
        log.error('ClassLink login failed', e);
        return 'failed';
    }
};

/**
 * Boolean wrapper around {@link runClassLinkLogin}, kept for existing callers:
 * `true` only when the login actually started. A closed or timed-out native sheet
 * resolves `false` (the callback route has already shown its message).
 */
export const startClassLinkLogin = async (
    getAuthorizeUrl: ClassLinkAuthorizeUrlFn,
    navigate: (path: string) => void,
    redirectTo?: string,
    intent: ClassLinkAttemptIntent = 'signIn'
): Promise<boolean> =>
    (await runClassLinkLogin(getAuthorizeUrl, navigate, redirectTo, intent)) === 'started';
