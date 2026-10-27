import * as Sentry from '@sentry/node';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { getLatestUserSummary, getAnswerAboutUser, saveSessionSummary } from './controllers';
import { JWT_SECRET } from '../constants/env';
import { BACKEND_URL, MCP_SERVER_URL, OAUTH_ENDPOINTS } from './constants';
import { getRegisteredClient } from './oauth/clients';
import { runMcpOwnerOperation } from './ownerOperation';
import { logSafeEvent } from '../logging';

// Create ProxyOAuthServerProvider pointing to AI Passport backend
const oauthProvider = new ProxyOAuthServerProvider({
    endpoints: {
        authorizationUrl: `${BACKEND_URL}${OAUTH_ENDPOINTS.AUTHORIZE}`,
        tokenUrl: `${BACKEND_URL}${OAUTH_ENDPOINTS.TOKEN}`,
    },
    verifyAccessToken: async (token: string) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                sub: string;
                aud: string;
                iss: string;
                iat: number;
                exp: number;
            };
            return {
                token,
                clientId: decoded.aud,
                scopes: [],
                expiresAt: decoded.exp,
                extra: { did: decoded.sub },
            };
        } catch {
            logSafeEvent('warn', 'auth_verification_failed');
            throw new Error('Invalid or expired token');
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

// Create an MCP server
const server = new McpServer({
    name: 'learncard-mcp-server',
    version: '1.0.0',
});
type ToolSchema = Record<string, z.ZodType>;

type ToolExtra = {
    authInfo?: {
        extra?: Record<string, unknown>;
    };
};

type ToolResponse = {
    content: { type: 'text'; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
};

type RegisterTool = (
    name: string,
    config: {
        title?: string;
        description?: string;
        inputSchema?: ToolSchema;
        outputSchema?: ToolSchema;
    },
    callback: (args: Record<string, unknown>, extra: ToolExtra) => Promise<ToolResponse>
) => unknown;

// The SDK installs its own compatible Zod version, so its generic type identity
// differs from the workspace Zod instance even though both work at runtime.
const registerTool = server.registerTool.bind(server) as unknown as RegisterTool;

const getAuthenticatedDid = (extra: ToolExtra): string | undefined => {
    const did = extra.authInfo?.extra?.did;

    return typeof did === 'string' ? did : undefined;
};

type StructuredResponse = {
    content: { type: 'text'; text: string }[];
    structuredContent: { general_summary: string };
};

const createResponse = (general_summary: string): StructuredResponse => ({
    content: [{ type: 'text', text: JSON.stringify({ general_summary }) }],
    structuredContent: { general_summary },
});

// Get user context for personalized teaching
registerTool(
    'get_user_context',
    {
        title: 'Get User Context Tool',
        description:
            'It is recommended to call this tool before teaching the user something. Helps tailor explanations and teaching style for better learning outcomes.',
        inputSchema: {},
        outputSchema: { general_summary: z.string().nullable() },
    },
    async (_args, extra) => {
        const did = getAuthenticatedDid(extra);

        if (!did) {
            logSafeEvent('warn', 'auth_verification_failed');
            throw new Error('Unauthorized: No DID found in authentication token');
        }

        try {
            const generalSummary = await runMcpOwnerOperation(did, () => getLatestUserSummary(did));
            return createResponse(generalSummary);
        } catch {
            Sentry.captureMessage('backend_operation_failed', {
                level: 'error',
                tags: { tool: 'get_user_context' },
            });
            logSafeEvent('error', 'request_failed');
            return createResponse('Unable to retrieve user context');
        }
    }
);

// Ask questions to personalize teaching
registerTool(
    'get_answer_about_user',
    {
        title: 'Ask Learning Question',
        description:
            "It is recommended to call this tool frequently during teaching to ask specific questions about the user's knowledge, skills, and experience.",
        inputSchema: { question: z.string() },
    },
    async (args, extra) => {
        const { question } = z.object({ question: z.string() }).parse(args);
        const did = getAuthenticatedDid(extra);

        if (!did) {
            logSafeEvent('warn', 'auth_verification_failed');
            throw new Error('Unauthorized: No DID found in authentication token');
        }

        try {
            const response = await runMcpOwnerOperation(did, () =>
                getAnswerAboutUser(did, question)
            );
            const answer = { answer: response };
            return {
                content: [{ type: 'text', text: JSON.stringify(answer) }],
                structuredContent: answer,
            };
        } catch {
            Sentry.captureMessage('backend_operation_failed', {
                level: 'error',
                tags: { tool: 'get_answer_about_user' },
            });
            logSafeEvent('error', 'request_failed');
            throw new Error('Unable to answer learning question');
        }
    }
);

// Save learning session summary
registerTool(
    'save_session_summary',
    {
        title: 'Save Session Summary',
        description:
            'Save a summary at the end of a learning session to track progress. Share the returned sessions link with the learner; they can sign in and choose their session for review and assessment.',
        inputSchema: {
            summary: z
                .string()
                .describe(
                    'A summary of the learning session including topics covered and insights gained'
                ),
        },
        outputSchema: {
            success: z.boolean(),
            message: z.string(),
            learnCardLink: z.string().optional(),
        },
    },
    async (args, extra) => {
        const { summary } = z.object({ summary: z.string() }).parse(args);
        const did = getAuthenticatedDid(extra);

        if (!did) {
            logSafeEvent('warn', 'auth_verification_failed');
            throw new Error('Unauthorized: No DID found in authentication token');
        }

        try {
            // Auto-generate threadId internally
            const threadId = `session:${Date.now()}:${did.slice(-8)}`;
            await runMcpOwnerOperation(did, () => saveSessionSummary(did, threadId, { summary }));
            const output = {
                success: true,
                message: 'Session summary saved successfully',
                // External models must not receive the underlying credential/storage IDs.
                learnCardLink: 'https://learncard.app/ai/sessions',
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        } catch {
            Sentry.captureMessage('backend_operation_failed', {
                level: 'error',
                tags: { tool: 'save_session_summary' },
            });
            logSafeEvent('error', 'request_failed');
            const output = {
                success: false,
                message: 'Unable to save session summary',
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
    }
);

// Set up Express and HTTP transport
const app = express();
app.use(express.json());

// Add OAuth router - provides /.well-known/oauth-protected-resource
app.use(
    mcpAuthRouter({
        provider: oauthProvider,
        issuerUrl: new URL(BACKEND_URL),
        baseUrl: new URL(MCP_SERVER_URL),
        scopesSupported: ['mcp:read', 'mcp:write'],
    })
);

// MCP endpoint at root path with Bearer auth
app.post(
    '/',
    requireBearerAuth({
        verifier: oauthProvider,
        requiredScopes: [],
        resourceMetadataUrl: `${MCP_SERVER_URL}${OAUTH_ENDPOINTS.PROTECTED_RESOURCE_METADATA}`, // This is the endpoint that the LLM client will use to discover the MCP server for its OAuth configuration
    }),
    async (req, res) => {
        try {
            // Create a new transport for each request to prevent request ID collisions
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true,
            });

            res.on('close', () => {
                transport.close();
            });

            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch {
            logSafeEvent('error', 'request_failed');
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal server error',
                });
            }
        }
    }
);

// Sentry error handler - must be after all controllers and before other error middleware
Sentry.setupExpressErrorHandler(app);
app.use(
    (
        _error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        // Express's default handler can write raw stacks directly to stderr.
        logSafeEvent('error', 'request_failed');
        if (res.headersSent) {
            res.end();
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
);

export const startMcpServer = () => {
    if (!process.env.JWT_SECRET) {
        logSafeEvent('warn', 'auth_verification_warning');
    }

    const port = Number.parseInt(process.env.PORT || '3000', 10);

    return app
        .listen(port, () => {
            logSafeEvent('info', 'service_started');
        })
        .on('error', () => {
            logSafeEvent('error', 'service_start_failed');
            process.exit(1);
        });
};
