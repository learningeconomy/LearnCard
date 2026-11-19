import type { HcpOAuthUrls } from './types';

const trim = (url: string) => url.replace(/\/$/, '');

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728) for the HCP Provider (§13.5).
 */
export const buildProtectedResourceMetadata = (
    urls: HcpOAuthUrls,
    scopesSupported: string[]
): Record<string, unknown> => {
    const resource = trim(urls.resourceUrl ?? urls.issuerUrl);
    const issuer = trim(urls.issuerUrl);
    return {
        resource,
        authorization_servers: [issuer],
        bearer_methods_supported: ['header'],
        scopes_supported: scopesSupported,
        resource_documentation: 'https://github.com/loyalagents/hcp-spec',
    };
};

/** Authorization Server Metadata (RFC 8414) for the HCP AS. */
export const buildAuthorizationServerMetadata = (
    urls: HcpOAuthUrls,
    scopesSupported: string[]
): Record<string, unknown> => {
    const issuer = trim(urls.issuerUrl);
    return {
        issuer,
        authorization_endpoint: `${issuer}/oauth/authorize`,
        token_endpoint: `${issuer}/oauth/token`,
        registration_endpoint: `${issuer}/oauth/register`,
        revocation_endpoint: `${issuer}/oauth/revoke`,
        scopes_supported: scopesSupported,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
        // MCP clients discover the resource via PRM; AS still advertises resource indicators.
        require_resource: true,
    };
};

/** Default scopes advertised before a grant narrows them (§6.1.1 registered set sample). */
export const DEFAULT_SCOPES_SUPPORTED = [
    'hcp:general_preferences:read',
    'hcp:general_preferences:write',
    'hcp:health_context:read',
    'hcp:education_learner_profile:read',
];
