import * as Sentry from '@sentry/node';
import jwt from 'jsonwebtoken';
import {
    createMcpApp,
    createMcpServer as createSharedMcpServer,
    createOAuthProxyProvider,
    InvalidTokenError,
    listenMcpApp,
    type McpServerInfo,
} from '@learncard/mcp';
import { JWT_SECRET } from '../constants/env';
import { BACKEND_URL, MCP_SERVER_URL, OAUTH_ENDPOINTS } from './constants';
import { getRegisteredClient } from './oauth/clients';
import { aiPassportMcpTools } from './tools';
import { logSafeEvent } from '../logging';

// AI Passport adapter for @learncard/mcp: JWT verification, registered OAuth clients,
// AIP tools, Sentry and privacy-safe logging. Transport and auth wiring live in the package.

const SERVER_INFO: McpServerInfo = { name: 'learncard-mcp-server', version: '1.0.0' };

const oauthProvider = createOAuthProxyProvider({
    authorizationServerUrl: BACKEND_URL,
    authorizePath: OAUTH_ENDPOINTS.AUTHORIZE,
    tokenPath: OAUTH_ENDPOINTS.TOKEN,
    verifyAccessToken: async (token: string) => {
        if (!JWT_SECRET) throw new Error('JWT verification is not configured');
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                sub: string;
                aud: string;
                exp: number;
            };
            return {
                token,
                clientId: decoded.aud,
                scopes: [],
                expiresAt: decoded.exp,
                extra: { did: decoded.sub },
            };
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                logSafeEvent('warn', 'auth_verification_failed');
                throw new InvalidTokenError('Invalid or expired token');
            }
            throw error;
        }
    },
    getClient: async (clientId: string) => {
        const client = await getRegisteredClient(clientId);
        if (!client) {
            logSafeEvent('warn', 'auth_verification_failed');
            throw new Error('OAuth client not found');
        }
        return {
            client_id: client.client_id,
            client_name: client.client_name,
            redirect_uris: client.redirect_uris,
        };
    },
});

export const createMcpServer = () => createSharedMcpServer(SERVER_INFO, aiPassportMcpTools);

export const app = createMcpApp({
    serverInfo: SERVER_INFO,
    tools: aiPassportMcpTools,
    auth: {
        provider: oauthProvider,
        issuerUrl: BACKEND_URL,
        baseUrl: MCP_SERVER_URL,
        scopesSupported: ['mcp:read', 'mcp:write'],
        protectedResourceMetadataPath: OAUTH_ENDPOINTS.PROTECTED_RESOURCE_METADATA,
    },
    onEvent: (level, event) => {
        logSafeEvent(level, event);
        if (
            level === 'error' &&
            (event === 'auth_verification_failed' || event === 'request_failed')
        ) {
            Sentry.captureMessage(event, { level: 'error' });
        }
    },
    // Sentry's handler must follow every route and precede the final error middleware.
    beforeErrorHandler: expressApp => Sentry.setupExpressErrorHandler(expressApp),
});

export const startMcpServer = () => {
    if (!process.env.JWT_SECRET) {
        logSafeEvent('warn', 'auth_verification_warning');
    }

    return listenMcpApp(app, { onEvent: (level, event) => logSafeEvent(level, event) });
};
