import { trimTrailingSlashes } from './url';
import type { Server } from 'node:http';

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { OAuthError, ServerError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import type { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';

import { DEFAULT_OAUTH_PATHS } from './auth';
import { httpErrorBody } from './errors';
import { createSkillsRouter, type McpSkill } from './skills';
import { registerMcpTools, type McpToolDefinition } from './tools';

export type McpLogLevel = 'info' | 'warn' | 'error';

/** Content-free lifecycle events. Hosts map them onto their own (privacy-safe) logger. */
export type McpEvent =
    'auth_verification_failed' | 'request_failed' | 'service_started' | 'service_start_failed';

export type McpServerInfo = { name: string; version: string };

export type McpAuthOptions = {
    provider: ProxyOAuthServerProvider;
    /** Authorization server issuer advertised in OAuth metadata. */
    issuerUrl: string;
    /** Public URL of this MCP server. */
    baseUrl: string;
    scopesSupported?: string[];
    requiredScopes?: string[];
    protectedResourceMetadataPath?: string;
};

export type CreateMcpAppOptions = {
    serverInfo: McpServerInfo;
    /** Tools registered on every per-request server. A function is re-run per request. */
    tools: readonly McpToolDefinition[] | (() => readonly McpToolDefinition[]);
    auth: McpAuthOptions;
    /** Path the StreamableHTTP endpoint is mounted on. Defaults to `/`. */
    mcpPath?: string;
    /** Optional Markdown skills, served publicly under `skillsPath` (default `/skills`). */
    skills?: readonly McpSkill[];
    skillsPath?: string;
    onEvent?: (level: McpLogLevel, event: McpEvent) => void;
    /** Runs after all routes and before the final JSON error handler (e.g. Sentry). */
    beforeErrorHandler?: (app: express.Express) => void;
};

const resolveTools = (tools: CreateMcpAppOptions['tools']) =>
    typeof tools === 'function' ? tools() : tools;

/**
 * A fresh server and tool registry. McpServer.connect() owns exactly one transport,
 * so a shared server across stateless per-request transports breaks overlapping calls.
 */
export const createMcpServer = (
    serverInfo: McpServerInfo,
    tools: readonly McpToolDefinition[]
): McpServer => {
    const server = new McpServer(serverInfo);
    registerMcpTools(server, tools);
    return server;
};

/** Express app with OAuth metadata, bearer-protected stateless StreamableHTTP, and skills. */
export const createMcpApp = (options: CreateMcpAppOptions): express.Express => {
    const emit = options.onEvent ?? (() => undefined);
    const mcpPath = options.mcpPath ?? '/';
    const { auth } = options;

    // Fail at startup, not on the first request, when a tool is missing annotations.
    // This validation-only server never connects, so it owns no transport to close.
    createMcpServer(options.serverInfo, resolveTools(options.tools));

    const app = express();
    app.use(express.json());

    app.use(
        mcpAuthRouter({
            provider: auth.provider,
            issuerUrl: new URL(auth.issuerUrl),
            baseUrl: new URL(auth.baseUrl),
            scopesSupported: auth.scopesSupported,
        })
    );

    if (options.skills?.length) {
        app.use(options.skillsPath ?? '/skills', createSkillsRouter(options.skills));
    }

    const metadataPath =
        auth.protectedResourceMetadataPath ?? DEFAULT_OAUTH_PATHS.PROTECTED_RESOURCE_METADATA;

    app.post(
        mcpPath,
        requireBearerAuth({
            verifier: {
                verifyAccessToken: async token => {
                    try {
                        return await auth.provider.verifyAccessToken(token);
                    } catch (error) {
                        // The SDK writes auth error responses without calling Express's error handler.
                        if (error instanceof ServerError || !(error instanceof OAuthError)) {
                            emit('error', 'auth_verification_failed');
                        }
                        throw error;
                    }
                },
            },
            requiredScopes: auth.requiredScopes ?? [],
            // Clients discover this server's OAuth configuration from here.
            resourceMetadataUrl: `${trimTrailingSlashes(auth.baseUrl)}${metadataPath}`,
        }),
        async (req, res) => {
            try {
                // A new transport per request prevents JSON-RPC request ID collisions.
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                    enableJsonResponse: true,
                });
                const server = createMcpServer(options.serverInfo, resolveTools(options.tools));

                res.on('close', () => {
                    // Closing the server closes its transport; close the transport too in
                    // case connect() never attached it.
                    void server.close().catch(() => undefined);
                    void transport.close().catch(() => undefined);
                });

                await server.connect(transport);
                await transport.handleRequest(req, res, req.body);
            } catch {
                emit('error', 'request_failed');
                if (!res.headersSent) {
                    res.status(500).json(httpErrorBody('internal_error', 'Internal server error'));
                }
            }
        }
    );

    options.beforeErrorHandler?.(app);

    app.use(
        (
            _error: unknown,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction
        ) => {
            // Express's default handler can write raw stacks to stderr.
            emit('error', 'request_failed');
            if (res.headersSent) {
                res.end();
                return;
            }
            res.status(500).json(httpErrorBody('internal_error', 'Internal server error'));
        }
    );

    return app;
};

export type ListenOptions = {
    port?: number;
    host?: string;
    onEvent?: (level: McpLogLevel, event: McpEvent) => void;
    /** Called when the listener fails. Defaults to exiting the process. */
    onListenError?: (error: Error) => void;
};

export const listenMcpApp = (app: express.Express, options: ListenOptions = {}): Server => {
    const emit = options.onEvent ?? (() => undefined);
    const port = options.port ?? Number.parseInt(process.env.PORT || '3000', 10);
    const onReady = () => emit('info', 'service_started');
    const server = options.host
        ? app.listen(port, options.host, onReady)
        : app.listen(port, onReady);

    return server.on('error', (error: Error) => {
        emit('error', 'service_start_failed');
        if (options.onListenError) options.onListenError(error);
        else process.exit(1);
    });
};
