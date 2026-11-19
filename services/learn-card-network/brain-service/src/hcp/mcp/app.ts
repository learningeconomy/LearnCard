/**
 * HCP OAuth AS (Unit 1) + Streamable HTTP MCP tools (Unit 2) on one Express app.
 *
 * Reuses `@learncard/mcp` createMcpServer / tool registration. AS routes stay on
 * createHcpOAuthApp; MCP is mounted at `/mcp` with bearer → resolveBearerToGrant.
 * We do not mount createMcpApp's mcpAuthRouter (it would collide with Unit 1 PRM/AS).
 */
import { type Express, type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { createMcpServer, type McpServerInfo } from '@learncard/mcp';

import { createHcpOAuthApp, type CreateHcpOAuthAppOptions } from '../oauth/app';
import { createMemoryOAuthSessionStore } from '../oauth/session-store';
import type { TokenSignerConfig } from '../oauth/tokens';
import type { HcpV1Deps } from '../v1/service/deps';
import { createHcpVerifyAccessToken } from './auth-bridge';
import { createHcpMcpTools } from './tools';

export const HCP_MCP_PATH = '/mcp';

export const HCP_MCP_SERVER_INFO: McpServerInfo = {
    name: 'learncard-hcp',
    version: '0.2.0',
};

export type CreateHcpMcpAppOptions = Omit<CreateHcpOAuthAppOptions, 'hcp'> & {
    /** Full v1 deps — tools call create/query/revise/withdraw. */
    hcp: HcpV1Deps;
    /** MCP Streamable HTTP path. Defaults to `/mcp`. */
    mcpPath?: string;
};

export const createHcpMcpApp = (options: CreateHcpMcpAppOptions): Express => {
    const sessions = options.sessions ?? createMemoryOAuthSessionStore();
    const issuerUrl = options.issuerUrl.replace(/\/$/, '');
    const resourceUrl = (options.resourceUrl ?? options.issuerUrl).replace(/\/$/, '');
    const mcpPath = options.mcpPath ?? HCP_MCP_PATH;

    const tokenConfig: TokenSignerConfig = {
        secret: options.tokenSecret,
        issuerUrl,
        resourceUrl,
        accessTokenTtlSeconds: options.accessTokenTtlSeconds,
    };

    const app = createHcpOAuthApp({ ...options, sessions, hcp: options.hcp });
    const tools = createHcpMcpTools({ hcp: options.hcp });
    const verifyAccessToken = createHcpVerifyAccessToken(options.hcp, tokenConfig);
    const metadataUrl = `${resourceUrl}/.well-known/oauth-protected-resource`;

    // Fail at startup if a tool is missing annotations (same check createMcpApp does).
    createMcpServer(HCP_MCP_SERVER_INFO, tools);

    app.post(
        mcpPath,
        requireBearerAuth({
            verifier: { verifyAccessToken },
            requiredScopes: [],
            resourceMetadataUrl: metadataUrl,
        }),
        async (req: Request, res: Response) => {
            try {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                    enableJsonResponse: true,
                });
                const server = createMcpServer(HCP_MCP_SERVER_INFO, tools);

                res.on('close', () => {
                    void server.close().catch(() => undefined);
                    void transport.close().catch(() => undefined);
                });

                await server.connect(transport);
                await transport.handleRequest(req, res, req.body);
            } catch {
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'server_error',
                        error_description: 'Internal server error',
                    });
                }
            }
        }
    );

    return app;
};
