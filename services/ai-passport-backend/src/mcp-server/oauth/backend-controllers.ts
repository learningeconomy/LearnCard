/**
 * MCP OAuth Controller Functions
 *
 * Business logic for OAuth 2.0 + PKCE authorization.
 * Each controller handles all logic for its endpoint.
 * HTTP handling (parsing, response formatting) remains in backend-routes.ts.
 */

import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { authService } from '../../auth/service';
import { withOwnerOperation as runOwnerOperation } from '../../services/dataErasure';
import {
    consumeAuthorizationCode,
    rotateRefreshToken,
    generateAuthorizationCode,
    getRefreshToken,
    storeRefreshToken,
} from './storage';
import { createOAuthSession, consumeOAuthSession } from './sessions';
import { getRegisteredClient, isValidRedirectUri } from './clients';
import { verifyPKCE } from './pkce';
import { JWT_SECRET, LEARNCARD_CONTRACT_URI } from '../../constants/env';
import { BACKEND_URL, OAUTH_ENDPOINTS } from '../constants';
type WithOwnerOperation = typeof runOwnerOperation;

// ============================================================================
// Constants
// ============================================================================

const ACCESS_TOKEN_EXPIRY_SECONDS = 3600; // 60 minutes
const OAUTH_SCOPE = 'mcp:read mcp:write';

// ============================================================================
// Types
// ============================================================================

export type OAuthResult<T> =
    { success: true; data: T } | { success: false; error: string; statusCode: number };

type DidAuthService = Pick<
    typeof authService,
    'authenticate' | 'createChallenge' | 'deleteSession'
>;

// Authorize
export interface AuthorizeParams {
    client_id: string | null;
    redirect_uri: string | null;
    state: string | null;
    code_challenge: string | null;
    code_challenge_method: string;
    response_type: string | null;
}

export interface AuthorizeResult {
    challenge: string;
    loginBinding: string;
    redirectUrl: string;
}

// Callback
export interface CallbackResult {
    redirectUrl: string;
}

// Token
export interface TokenParams {
    grant_type: string | null;
    code: string | null;
    code_verifier: string | null;
    client_id: string | null;
    redirect_uri: string | null;
    refresh_token: string | null;
}

export interface TokenResult {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token?: string;
    scope?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a signed JWT access token
 */
function generateAccessToken(did: string, clientId: string): string {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
        {
            sub: did,
            aud: clientId,
            iss: BACKEND_URL,
            iat: now,
            exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
        },
        JWT_SECRET,
        { algorithm: 'HS256' }
    );
}

/**
 * Build the standard OAuth token response
 */
function buildTokenResponse(accessToken: string, refreshToken: string): TokenResult {
    return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: ACCESS_TOKEN_EXPIRY_SECONDS,
        refresh_token: refreshToken,
        scope: OAUTH_SCOPE,
    };
}

// ============================================================================
// Controller Functions
// ============================================================================

/**
 * Handle OAuth authorization request
 * Validates params, creates session, returns LearnCard redirect URL
 */
export async function handleAuthorize(
    params: AuthorizeParams,
    didAuth: DidAuthService = authService
): Promise<OAuthResult<AuthorizeResult>> {
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method, response_type } =
        params;

    console.log('🚀 Processing authorize request:', {
        client_id,
        redirect_uri,
        response_type,
        code_challenge_method,
    });

    // Validate required params
    if (!client_id || !redirect_uri || !code_challenge || response_type !== 'code') {
        console.log('❌ Invalid OAuth parameters');
        return {
            success: false,
            error: 'Invalid OAuth parameters',
            statusCode: 400,
        };
    }

    try {
        // Validate client is registered
        const client = await getRegisteredClient(client_id);
        if (!client) {
            console.log('❌ Unregistered client:', client_id);
            return {
                success: false,
                error: 'invalid_client',
                statusCode: 401,
            };
        }

        // Validate redirect_uri is allowed for this client
        if (!isValidRedirectUri(client, redirect_uri)) {
            console.log('❌ Invalid redirect_uri for client:', {
                client_id,
                redirect_uri,
                allowed: client.redirect_uris,
            });
            return {
                success: false,
                error: 'invalid_redirect_uri',
                statusCode: 400,
            };
        }

        console.log('✅ Client validated:', client_id);

        // Store OAuth params in Redis
        const oauthSessionId = await createOAuthSession({
            clientId: client_id,
            redirectUri: redirect_uri,
            state: state || '',
            codeChallenge: code_challenge,
            codeChallengeMethod: code_challenge_method,
        });

        console.log('✅ Created OAuth session:', oauthSessionId);

        const { binding, challenge } = await didAuth.createChallenge({
            audience: new URL(BACKEND_URL).origin,
            returnTo: `oauth:${oauthSessionId}`,
        });
        const LCA_URL = process.env.LCA_URL || 'https://learncard.app';
        const learnCardUrl = new URL(`${LCA_URL}/consent-flow-login`);
        const callbackUrl = new URL(OAUTH_ENDPOINTS.CALLBACK, BACKEND_URL);

        callbackUrl.searchParams.set('challenge', challenge);
        callbackUrl.searchParams.set('session', oauthSessionId);
        learnCardUrl.searchParams.set('uri', LEARNCARD_CONTRACT_URI);
        learnCardUrl.searchParams.set('returnTo', callbackUrl.toString());
        learnCardUrl.searchParams.set('challenge', challenge);
        learnCardUrl.searchParams.set('domain', new URL(BACKEND_URL).origin);

        console.log('🔀 Built LearnCard redirect URL');

        return {
            success: true,
            data: {
                challenge,
                loginBinding: binding,
                redirectUrl: learnCardUrl.toString(),
            },
        };
    } catch (error) {
        console.error('❌ Error in authorize:', error);
        return {
            success: false,
            error: 'OAuth authorization failed',
            statusCode: 500,
        };
    }
}

/**
 * Handle OAuth callback from LearnCard
 * Validates session, generates auth code, returns client redirect URL
 */
export async function handleCallback(
    presentation: string | null,
    challenge: string | null,
    loginBinding: string | null,
    sessionId: string | null,
    didAuth: DidAuthService = authService,
    withOwnerOperation: WithOwnerOperation = runOwnerOperation
): Promise<OAuthResult<CallbackResult>> {
    console.log('🔄 Processing OAuth callback:', {
        hasChallenge: Boolean(challenge),
        hasPresentation: Boolean(presentation),
        sessionId,
    });

    if (!presentation || !challenge || !loginBinding || !sessionId) {
        console.log('❌ Missing DID Auth callback parameters');
        return {
            success: false,
            error: 'Invalid callback parameters',
            statusCode: 400,
        };
    }

    try {
        const authentication = await didAuth.authenticate({
            challenge,
            expectedBinding: loginBinding,
            expectedReturnTo: `oauth:${sessionId}`,
            presentation,
        });
        const did = authentication.did;

        return await withOwnerOperation(did, async (): Promise<OAuthResult<CallbackResult>> => {
            await didAuth.deleteSession(authentication.sessionId);
            const sessionResult = await consumeOAuthSession(sessionId);

            if (!sessionResult.success) {
                if (sessionResult.error === 'storage_error')
                    return { success: false, error: 'server_error', statusCode: 500 };
                console.log('❌ Invalid or expired session:', sessionResult.error);
                return {
                    success: false,
                    error: 'Invalid or expired session',
                    statusCode: 400,
                };
            }

            const session = sessionResult.data;

            console.log('✅ Found OAuth session:', {
                clientId: session.clientId,
                redirectUri: session.redirectUri,
            });

            // Generate authorization code
            const authCode = await generateAuthorizationCode(
                did,
                session.clientId,
                session.redirectUri,
                session.codeChallenge,
                session.codeChallengeMethod
            );

            console.log('✅ Generated authorization code');

            // Build redirect URL
            const redirectUrl = new URL(session.redirectUri);
            redirectUrl.searchParams.set('code', authCode);
            if (session.state) {
                redirectUrl.searchParams.set('state', session.state);
            }

            console.log('🔀 Built client redirect URL');

            return {
                success: true,
                data: { redirectUrl: redirectUrl.toString() },
            };
        });
    } catch (error) {
        console.error('❌ Error in callback:', error);
        return {
            success: false,
            error: 'OAuth callback failed',
            statusCode: 500,
        };
    }
}

/**
 * Handle OAuth token exchange
 * Supports both authorization_code and refresh_token grant types
 */
export async function handleTokenExchange(
    params: TokenParams,
    withOwnerOperation: WithOwnerOperation = runOwnerOperation
): Promise<OAuthResult<TokenResult>> {
    const { grant_type, code, code_verifier, client_id, redirect_uri, refresh_token } = params;

    console.log('📥 Processing token exchange:', {
        grant_type,
        client_id,
        redirect_uri,
        has_code: !!code,
        has_verifier: !!code_verifier,
        has_refresh_token: !!refresh_token,
    });

    // Handle refresh_token grant
    if (grant_type === 'refresh_token') {
        return handleRefreshTokenGrant(refresh_token, client_id, withOwnerOperation);
    }

    // Handle authorization_code grant
    if (grant_type === 'authorization_code') {
        return handleAuthorizationCodeGrant(
            code,
            code_verifier,
            client_id,
            redirect_uri,
            withOwnerOperation
        );
    }

    // Unsupported grant type
    console.log('❌ Unsupported grant type:', grant_type);
    return {
        success: false,
        error: 'unsupported_grant_type',
        statusCode: 400,
    };
}

/**
 * Handle refresh_token grant type
 */
async function handleRefreshTokenGrant(
    refresh_token: string | null,
    client_id: string | null,
    withOwnerOperation: WithOwnerOperation
): Promise<OAuthResult<TokenResult>> {
    if (!refresh_token || !client_id) {
        console.log('❌ Missing refresh_token or client_id');
        return {
            success: false,
            error: 'invalid_request',
            statusCode: 400,
        };
    }

    try {
        // Look up the refresh token
        const tokenResult = await getRefreshToken(refresh_token);
        if (!tokenResult.success) {
            if (tokenResult.error === 'storage_error') {
                return { success: false, error: 'server_error', statusCode: 500 };
            }
            console.log('❌ Invalid refresh token');
            return { success: false, error: 'invalid_grant', statusCode: 400 };
        }

        const tokenData = tokenResult.data;

        // Verify client_id matches
        if (tokenData.clientId !== client_id) {
            console.log('❌ Client ID mismatch for refresh token');
            return { success: false, error: 'invalid_grant', statusCode: 400 };
        }

        console.log('✅ Refresh token validated for DID:', tokenData.did);
        return await withOwnerOperation(
            tokenData.did,
            async (): Promise<OAuthResult<TokenResult>> => {
                // Generate new tokens (rotate refresh token for security)
                const newAccessToken = generateAccessToken(tokenData.did, tokenData.clientId);
                const newRefreshToken = randomUUID();
                if (!(await rotateRefreshToken(tokenData, newRefreshToken))) {
                    return { success: false, error: 'invalid_grant', statusCode: 400 };
                }

                console.log('✅ New tokens generated for DID:', tokenData.did);

                return {
                    success: true,
                    data: buildTokenResponse(newAccessToken, newRefreshToken),
                };
            }
        );
    } catch (error) {
        console.error('❌ Error in refresh token exchange:', error);
        return {
            success: false,
            error: 'server_error',
            statusCode: 500,
        };
    }
}

/**
 * Handle authorization_code grant type
 */
async function handleAuthorizationCodeGrant(
    code: string | null,
    code_verifier: string | null,
    client_id: string | null,
    redirect_uri: string | null,
    withOwnerOperation: WithOwnerOperation
): Promise<OAuthResult<TokenResult>> {
    // Validate required params
    if (!code || !code_verifier || !client_id || !redirect_uri) {
        console.log('❌ Missing required parameters');
        return {
            success: false,
            error: 'invalid_request',
            statusCode: 400,
        };
    }

    try {
        // Atomically consume before validation so concurrent exchanges cannot both
        // observe an unused code. Failed validation intentionally burns the code.
        const authResult = await consumeAuthorizationCode(code);
        if (!authResult.success) {
            if (authResult.error === 'storage_error') {
                return { success: false, error: 'server_error', statusCode: 500 };
            }
            console.log('❌ Invalid authorization code:', authResult.error);
            return { success: false, error: 'invalid_grant', statusCode: 400 };
        }

        const authData = authResult.data;

        console.log('✅ Found auth code data:', {
            clientId: authData.clientId,
            redirectUri: authData.redirectUri,
            did: authData.did,
        });

        // Verify client_id and redirect_uri match
        if (authData.clientId !== client_id || authData.redirectUri !== redirect_uri) {
            console.log('❌ Client ID or redirect URI mismatch:', {
                expected: {
                    clientId: authData.clientId,
                    redirectUri: authData.redirectUri,
                },
                received: { client_id, redirect_uri },
            });
            return { success: false, error: 'invalid_grant', statusCode: 400 };
        }

        // Verify PKCE
        if (!verifyPKCE(code_verifier, authData.codeChallenge, authData.codeChallengeMethod)) {
            console.log('❌ PKCE verification failed');
            return { success: false, error: 'invalid_grant', statusCode: 400 };
        }

        console.log('✅ PKCE verification passed');
        return await withOwnerOperation(
            authData.did,
            async (): Promise<OAuthResult<TokenResult>> => {
                const accessToken = generateAccessToken(authData.did, authData.clientId);
                const refreshToken = randomUUID();
                await storeRefreshToken(refreshToken, authData.did, authData.clientId);

                console.log('✅ Token generated successfully for DID:', authData.did);

                return {
                    success: true,
                    data: buildTokenResponse(accessToken, refreshToken),
                };
            }
        );
    } catch (error) {
        console.error('❌ Error in token exchange:', error);
        return {
            success: false,
            error: 'server_error',
            statusCode: 500,
        };
    }
}
