/**
 * MCP OAuth Authorization Server Routes
 *
 * Thin HTTP adapter layer. Each route:
 * 1. Parses HTTP request → params
 * 2. Calls controller → gets result
 * 3. Converts result → HTTP response
 *
 * All business logic lives in backend-controllers.ts.
 */

import { randomUUID } from 'crypto';
import { getAuthLoginCookieName } from '../../auth/service';
import { AUTH_CHALLENGE_TTL_SECONDS } from '../../constants/env';
import { BACKEND_URL, OAUTH_ENDPOINTS } from '../constants';
import { handleAuthorize, handleCallback, handleTokenExchange } from './backend-controllers';
import { registerClient } from './clients';

type JsonResponseFn = (data: any, status?: number) => Response;

// Helper to create redirect response
function redirectResponse(
    location: string,
    corsHeaders: Record<string, string>,
    headers: Record<string, string> = {}
): Response {
    return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, ...headers, Location: location },
    });
}

const getCookie = (req: Request, name: string): string | undefined =>
    req.headers
        .get('cookie')
        ?.split(';')
        .map(cookie => cookie.trim().split('='))
        .find(([cookieName]) => cookieName === name)
        ?.slice(1)
        .join('=');

// Helper to parse token request body (supports form-urlencoded and JSON)
async function parseTokenBody(req: Request): Promise<Record<string, string>> {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        return Object.fromEntries(formData) as Record<string, string>;
    }

    if (contentType.includes('application/json')) {
        return await req.json();
    }

    // Fallback: parse as URL-encoded text
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text));
}

/**
 * Extract client_id from HTTP Basic Auth header
 * Format: "Basic base64(client_id:client_secret)"
 * We extract client_id and ignore client_secret (public client compatibility)
 */
function extractClientIdFromAuthHeader(req: Request): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'basic') {
        return null;
    }

    try {
        const decoded = atob(parts[1]);
        const colonIndex = decoded.indexOf(':');
        if (colonIndex === -1) return null;

        const clientId = decoded.substring(0, colonIndex);
        return clientId || null;
    } catch (error) {
        console.warn('Failed to parse Basic Auth header:', error);
        return null;
    }
}

export async function handleMcpOAuthRoute(
    req: Request,
    url: URL,
    jsonResponse: JsonResponseFn,
    corsHeaders: Record<string, string>
): Promise<Response | null> {
    switch (url.pathname) {
        case OAUTH_ENDPOINTS.AUTHORIZE: {
            if (req.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed' }, 405);
            }

            const result = await handleAuthorize({
                client_id: url.searchParams.get('client_id'),
                redirect_uri: url.searchParams.get('redirect_uri'),
                state: url.searchParams.get('state'),
                code_challenge: url.searchParams.get('code_challenge'),
                code_challenge_method: url.searchParams.get('code_challenge_method') || 'S256',
                response_type: url.searchParams.get('response_type'),
            });

            if (!result.success) {
                return jsonResponse({ error: result.error }, result.statusCode);
            }

            return redirectResponse(result.data.redirectUrl, corsHeaders, {
                'Set-Cookie': [
                    `${getAuthLoginCookieName(result.data.challenge)}=${encodeURIComponent(
                        result.data.loginBinding
                    )}`,
                    'Path=/',
                    'HttpOnly',
                    'Secure',
                    'SameSite=None',
                    `Max-Age=${AUTH_CHALLENGE_TTL_SECONDS}`,
                ].join('; '),
            });
        }

        case OAUTH_ENDPOINTS.CALLBACK: {
            if (req.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed' }, 405);
            }

            const challenge = url.searchParams.get('challenge');
            const result = await handleCallback(
                url.searchParams.get('vp'),
                challenge,
                challenge ? (getCookie(req, getAuthLoginCookieName(challenge)) ?? null) : null,
                url.searchParams.get('session')
            );

            if (!result.success) {
                return jsonResponse({ error: result.error }, result.statusCode);
            }

            return redirectResponse(result.data.redirectUrl, corsHeaders);
        }

        case OAUTH_ENDPOINTS.TOKEN: {
            if (req.method !== 'POST') {
                return jsonResponse({ error: 'Method not allowed' }, 405);
            }

            const body = await parseTokenBody(req);

            // Extract client_id from Authorization header (ChatGPT compatibility)
            // Falls back to body.client_id if header not present
            const clientIdFromHeader = extractClientIdFromAuthHeader(req);
            const clientId = clientIdFromHeader || body.client_id || null;

            console.log('🔐 Token request auth debug:', {
                hasAuthHeader: !!req.headers.get('authorization'),
                clientIdFromHeader,
                clientIdFromBody: body.client_id || null,
                resolvedClientId: clientId,
            });

            const result = await handleTokenExchange({
                grant_type: body.grant_type || null,
                code: body.code || null,
                code_verifier: body.code_verifier || null,
                client_id: clientId,
                redirect_uri: body.redirect_uri || null,
                refresh_token: body.refresh_token || null,
            });

            if (!result.success) {
                return jsonResponse({ error: result.error }, result.statusCode);
            }

            return jsonResponse(result.data);
        }

        case OAUTH_ENDPOINTS.AUTHORIZATION_SERVER_METADATA: {
            if (req.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed' }, 405);
            }

            // Static metadata - no controller needed
            return jsonResponse({
                issuer: BACKEND_URL,
                authorization_endpoint: `${BACKEND_URL}${OAUTH_ENDPOINTS.AUTHORIZE}`,
                token_endpoint: `${BACKEND_URL}${OAUTH_ENDPOINTS.TOKEN}`,
                registration_endpoint: `${BACKEND_URL}${OAUTH_ENDPOINTS.REGISTER}`,
                response_types_supported: ['code'],
                grant_types_supported: ['authorization_code', 'refresh_token'],
                code_challenge_methods_supported: ['S256', 'plain'],
                token_endpoint_auth_methods_supported: ['none', 'client_secret_basic'],
                scopes_supported: ['mcp:read', 'mcp:write'],
            });
        }

        case OAUTH_ENDPOINTS.REGISTER: {
            if (req.method !== 'POST') {
                return jsonResponse({ error: 'Method not allowed' }, 405);
            }

            try {
                const body = await req.json();
                const clientId = randomUUID();

                // Validate redirect_uris is provided and non-empty
                if (!body.redirect_uris || body.redirect_uris.length === 0) {
                    return jsonResponse(
                        { error: 'redirect_uris is required and must be non-empty' },
                        400
                    );
                }

                // Store client in Redis
                const client = await registerClient({
                    client_id: clientId,
                    client_name: body.client_name || 'Unnamed Client',
                    redirect_uris: body.redirect_uris,
                    grant_types: body.grant_types || ['authorization_code'],
                    response_types: body.response_types || ['code'],
                    token_endpoint_auth_method: 'none',
                });

                console.log('✅ Registered new OAuth client:', clientId);

                return jsonResponse(client, 201);
            } catch (error) {
                console.error('Error in client registration:', error);
                return jsonResponse({ error: 'Registration failed' }, 500);
            }
        }

        default:
            return null; // Not an MCP OAuth route
    }
}
