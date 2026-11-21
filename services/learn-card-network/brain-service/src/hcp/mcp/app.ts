/**
 * HCP OAuth AS (Unit 1) + Streamable HTTP MCP tools (Unit 2–3) on one Express app.
 *
 * Reuses `@learncard/mcp` createMcpServer / tool registration. AS routes stay on
 * createHcpOAuthApp; MCP is mounted at `/mcp` with bearer → resolveBearerToGrant.
 * We do not mount createMcpApp's mcpAuthRouter (it would collide with Unit 1 PRM/AS).
 *
 * Unit 3: advertises §10.2 `example.hcp/hcp` on initialize and serves
 * `/.well-known/hcp-configuration` without claiming official conformsTo URIs (§18.1).
 */
import { type Express, type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { createMcpServer, type McpServerInfo, type McpToolDefinition } from '@learncard/mcp';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createHcpOAuthApp, type CreateHcpOAuthAppOptions } from '../oauth/app';
import { createMemoryOAuthSessionStore } from '../oauth/session-store';
import type { TokenSignerConfig } from '../oauth/tokens';
import type { HcpV1Deps } from '../v1/service/deps';
import { createHcpVerifyAccessToken } from './auth-bridge';
import { buildHcpConfiguration, buildHcpMcpExtension, HCP_MCP_EXTENSION_ID } from './discovery';
import { createHcpMcpTools } from './tools';

export const HCP_MCP_PATH = '/mcp';

export const HCP_MCP_SERVER_INFO: McpServerInfo = {
    name: 'learncard-hcp',
    version: '0.3.0',
};

export type CreateHcpMcpAppOptions = Omit<CreateHcpOAuthAppOptions, 'hcp'> & {
    /** Full v1 deps — tools call create/query/revise/withdraw. */
    hcp: HcpV1Deps;
    /** MCP Streamable HTTP path. Defaults to `/mcp`. */
    mcpPath?: string;
};

/** Fresh McpServer with §10.2 extension registered before connect. */
export const createConfiguredHcpMcpServer = (
    tools: readonly McpToolDefinition[],
    resourceUrl: string
): McpServer => {
    const server = createMcpServer(HCP_MCP_SERVER_INFO, tools);
    server.server.registerCapabilities({
        tools: {},
        extensions: {
            [HCP_MCP_EXTENSION_ID]: buildHcpMcpExtension({ resourceUrl }),
        },
    });
    return server;
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
    createConfiguredHcpMcpServer(tools, resourceUrl);

    // Draft 3 §19 / §10.2 discovery (LC-adapted; no official Part URI claims).
    app.get('/.well-known/hcp-configuration', (_req, res) => {
        res.json(buildHcpConfiguration({ resourceUrl, mcpPath }));
    });

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
                const server = createConfiguredHcpMcpServer(tools, resourceUrl);

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
