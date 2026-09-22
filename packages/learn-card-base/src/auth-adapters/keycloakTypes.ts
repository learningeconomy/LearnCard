import type { AuthUser, SignInAdapter, SocialSignInOptions } from '@learncard/types';
import type { KeycloakAuthProvider } from '../auth-providers/createKeycloakAuthProvider';

export type KeycloakSignInOperation =
    'google' | 'apple' | 'customToken' | 'oidc' | 'redirect' | 'signOut';

/** Keycloak tickets can also establish a fresh session for an existing account. */
export interface KeycloakSignInAdapter extends SignInAdapter {
    signInWithCustomToken(ticket: string, options?: SocialSignInOptions): Promise<AuthUser>;
}

export interface KeycloakSignInAdapterConfig {
    provider: KeycloakAuthProvider;
    /** App-owned email proof -> single-use lca-api login ticket, then signInWithCustomToken. */
    requestEmailOtpTicket: (email: string, code: string) => Promise<string>;
    requestSocialTicket?: (provider: 'google' | 'apple', idToken: string) => Promise<string>;
    nativeSocial?: { google?: () => Promise<string>; apple?: () => Promise<string> };
    isNative?: () => boolean;
    /**
     * Native hosts open a system auth sheet and await provider.handleRedirectCallback(url)
     * before resolving. Reject on cancellation or callback failure. Web defaults to
     * signinRedirect; a fresh adapter completes that flow with checkRedirectResult().
     */
    openAuthorization?: (args: { extraQueryParams: Record<string, string> }) => Promise<void>;
    onSignedIn?: (method: Exclude<KeycloakSignInOperation, 'signOut'>, user: AuthUser) => void;
    onOperation?: (
        operation: KeycloakSignInOperation,
        phase: 'started' | 'succeeded' | 'failed',
        error?: unknown
    ) => void;
}
