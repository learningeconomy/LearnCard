# @learncard/mcp

Shared [Model Context Protocol](https://modelcontextprotocol.io) server core for LearnCard services.

- `createMcpApp` builds an Express app with OAuth metadata routes, a bearer-protected stateless StreamableHTTP endpoint (a fresh `McpServer` per request), optional skills routes, and a JSON error handler.
- `createOAuthProxyProvider` proxies OAuth 2.1 to your authorization server; you supply `verifyAccessToken` and `getClient`.
- `defineMcpTool` / `registerMcpTools` require `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint` on every tool.
- `McpToolError`, `toolErrorResponse` and `jsonToolResponse` give typed tool results.

```ts
import {
    createMcpApp,
    createOAuthProxyProvider,
    defineMcpTool,
    jsonToolResponse,
    listenMcpApp,
} from '@learncard/mcp';

const ping = defineMcpTool({
    name: 'ping',
    title: 'Ping',
    description: 'Health check.',
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    handler: async () => jsonToolResponse({ ok: true }),
});

const app = createMcpApp({
    serverInfo: { name: 'my-mcp', version: '1.0.0' },
    tools: [ping],
    auth: {
        provider: createOAuthProxyProvider({
            authorizationServerUrl,
            verifyAccessToken,
            getClient,
        }),
        issuerUrl: authorizationServerUrl,
        baseUrl: mcpServerUrl,
    },
});

listenMcpApp(app, { port: 3000 });
```

The AI Passport backend (`services/ai-passport-backend/src/mcp-server/app.ts`) is the reference host.

## Bearer verification errors

`verifyAccessToken` throws the SDK's `InvalidTokenError` for invalid tokens. The bearer middleware returns 401 with a `WWW-Authenticate` challenge.
Other `OAuthError` subclasses keep their SDK status, including `InsufficientScopeError` (403) and `ServerError` (500).
Unexpected errors return a generic 500, not a token rejection. `OAuthError` messages reach the client, so hosts must use client-safe text.

On verifier service failures, `createMcpApp` emits the content-free `auth_verification_failed` event at error level through `onEvent`.
The SDK writes these responses itself, so they do not reach `beforeErrorHandler`. The AI Passport adapter reports this event to Sentry without tokens or raw errors.
