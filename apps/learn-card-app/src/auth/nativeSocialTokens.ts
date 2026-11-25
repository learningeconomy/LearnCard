import { AuthSessionError } from '@learncard/types';

/**
 * Native Google/Apple ID tokens for the Keycloak ticket hop.
 *
 * `skipNativeAuth: true` runs the native Google/Apple sign-in sheet without
 * signing into Firebase — only the ID token is used, to broker an lca-api
 * login ticket (see `keycloakTickets.requestSocialTicket`). The audience
 * allowlists (`GOOGLE_OAUTH_CLIENT_IDS`, `APPLE_OAUTH_CLIENT_IDS`) must
 * include the native client IDs; see environments/README.md.
 */
export const getNativeGoogleIdToken = async (): Promise<string> => {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const { credential } = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    if (!credential?.idToken) {
        throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
    }
    return credential.idToken;
};

export const getNativeAppleIdToken = async (): Promise<string> => {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const { credential } = await FirebaseAuthentication.signInWithApple({ skipNativeAuth: true });
    if (!credential?.idToken) {
        throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
    }
    return credential.idToken;
};
