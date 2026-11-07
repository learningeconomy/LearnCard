import { trimTrailingSlashes } from './url';
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

export {
    OAuthError,
    InvalidTokenError,
    InsufficientScopeError,
    ServerError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';

export const DEFAULT_OAUTH_PATHS = {
    AUTHORIZE: '/oauth/authorize',
    CALLBACK: '/oauth/callback',
    TOKEN: '/oauth/token',
    REGISTER: '/oauth/register',
    AUTHORIZATION_SERVER_METADATA: '/.well-known/oauth-authorization-server',
    PROTECTED_RESOURCE_METADATA: '/.well-known/oauth-protected-resource',
} as const;

export type OAuthProxyOptions = {
    /** Base URL of the OAuth 2.1 authorization server this MCP server proxies to. */
    authorizationServerUrl: string;
    authorizePath?: string;
    tokenPath?: string;
    revocationPath?: string;
    registrationPath?: string;
    /**
     * Verify a bearer token. Throw InvalidTokenError from @learncard/mcp for invalid tokens (401).
     * Other errors remain service failures (500); OAuthError subclasses keep their SDK status.
     * OAuthError messages reach the client, so use client-safe text.
     */
    verifyAccessToken: (token: string) => Promise<AuthInfo>;
    /** Look up a registered client. Throw or return undefined when unknown. */
    getClient: (clientId: string) => Promise<OAuthClientInformationFull | undefined>;
};

/** Builds the SDK's proxy provider from a host's endpoints and auth adapters. */
export const createOAuthProxyProvider = (options: OAuthProxyOptions): ProxyOAuthServerProvider => {
    const base = trimTrailingSlashes(options.authorizationServerUrl);

    return new ProxyOAuthServerProvider({
        endpoints: {
            authorizationUrl: `${base}${options.authorizePath ?? DEFAULT_OAUTH_PATHS.AUTHORIZE}`,
            tokenUrl: `${base}${options.tokenPath ?? DEFAULT_OAUTH_PATHS.TOKEN}`,
            ...(options.revocationPath
                ? { revocationUrl: `${base}${options.revocationPath}` }
                : {}),
            ...(options.registrationPath
                ? { registrationUrl: `${base}${options.registrationPath}` }
                : {}),
        },
        verifyAccessToken: options.verifyAccessToken,
        getClient: options.getClient,
    });
};
