// Server URLs
const BACKEND_URL = process.env.DOMAIN || 'http://localhost:3001';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';

// OAuth endpoint paths
const OAUTH_ENDPOINTS = {
    AUTHORIZE: '/oauth/authorize',
    CALLBACK: '/oauth/callback',
    TOKEN: '/oauth/token',
    REGISTER: '/oauth/register',
    AUTHORIZATION_SERVER_METADATA: '/.well-known/oauth-authorization-server',
    PROTECTED_RESOURCE_METADATA: '/.well-known/oauth-protected-resource',
} as const;

export { BACKEND_URL, MCP_SERVER_URL, OAUTH_ENDPOINTS };
