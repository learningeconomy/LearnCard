import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { z } from 'zod';
import {
    InsufficientScopeError,
    InvalidTokenError,
    ServerError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';

import {
    createMcpApp,
    createOAuthProxyProvider,
    defineMcpTool,
    getAuthenticatedDid,
    jsonToolResponse,
    McpToolError,
    type McpToolDefinition,
    type McpEvent,
} from './index';

const VALID_TOKEN = 'valid-token';
const PRIVATE_DETAIL = 'SYNTHETIC_PRIVATE_DRIVER_DETAIL';

const provider = createOAuthProxyProvider({
    authorizationServerUrl: 'https://auth.example.test/',
    verifyAccessToken: async token => {
        if (token === 'verifier-outage') throw new Error('private database connection detail');
        if (token === 'server-error') throw new ServerError('Verifier unavailable');
        if (token === 'insufficient-scope') throw new InsufficientScopeError('Insufficient scope');
        if (!token.startsWith(VALID_TOKEN)) throw new InvalidTokenError('Invalid access token');
        return {
            token,
            clientId: 'client',
            scopes: [],
            expiresAt: Math.floor(Date.now() / 1000) + 300,
            extra: { did: `did:example:${token.slice(VALID_TOKEN.length + 1) || 'anon'}` },
        };
    },
    getClient: async () => undefined,
});

const readOnly = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
} as const;

type Gate = { resolve: (value: string) => void };
const gates: Gate[] = [];
let onGate: (() => void) | undefined;

const tools: McpToolDefinition[] = [
    defineMcpTool({
        name: 'whoami',
        title: 'Who am I',
        description: 'Returns the caller DID after a parked delay.',
        annotations: readOnly,
        inputSchema: {},
        outputSchema: { did: z.string() },
        handler: async (_args, context) => {
            const did = getAuthenticatedDid(context)!;
            await new Promise<string>(resolve => {
                gates.push({ resolve });
                onGate?.();
            });
            return jsonToolResponse({ did });
        },
    }),
    defineMcpTool({
        name: 'fails',
        title: 'Fails',
        description: 'Always throws a typed error.',
        annotations: readOnly,
        inputSchema: { reason: z.string() },
        handler: async () => {
            throw new McpToolError('forbidden', 'Not allowed');
        },
    }),
    defineMcpTool({
        name: 'untyped-fails',
        title: 'Untyped failure',
        description: 'Throws synthetic private diagnostics.',
        annotations: readOnly,
        inputSchema: { kind: z.enum(['error', 'string', 'object', 'forged']) },
        handler: async args => {
            if (args.kind === 'string') throw PRIVATE_DETAIL;
            if (args.kind === 'object') throw { message: PRIVATE_DETAIL };
            if (args.kind === 'forged') {
                throw { name: 'McpToolError', code: 'internal_error', message: PRIVATE_DETAIL };
            }
            throw new Error(PRIVATE_DETAIL);
        },
    }),
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readJson = (response: Response): Promise<any> => response.json();

let server: Server;
let baseUrl: string;
const events: { level: string; event: McpEvent }[] = [];
const diagnosticCalls: unknown[][] = [];

beforeAll(async () => {
    const app = createMcpApp({
        serverInfo: { name: 'test-mcp', version: '0.0.0' },
        tools,
        auth: {
            provider,
            issuerUrl: 'https://auth.example.test',
            baseUrl: 'https://mcp.example.test',
        },
        skills: [{ name: 'hello', description: 'Says hello', content: '# Hello' }],
        onEvent: (...args) => {
            events.push({ level: args[0], event: args[1] });
            diagnosticCalls.push(args);
        },
    });
    server = await new Promise<Server>(resolve => {
        const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
});

const rpc = (token: string | undefined, id: number, method: string, params: unknown = {}) =>
    fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });

describe('defineMcpTool', () => {
    it('requires every behavior annotation', () => {
        expect(() =>
            defineMcpTool({
                ...tools[1]!,
                annotations: { readOnlyHint: true } as never,
            })
        ).toThrow(/annotations\.destructiveHint/);
    });

    it('rejects read-only destructive tools', () => {
        expect(() =>
            defineMcpTool({ ...tools[1]!, annotations: { ...readOnly, destructiveHint: true } })
        ).toThrow(/read-only and destructive/);
    });

    it('rejects duplicate names when mounting', () => {
        expect(() =>
            createMcpApp({
                serverInfo: { name: 'dup', version: '0' },
                tools: [tools[1]!, tools[1]!],
                auth: { provider, issuerUrl: 'https://a.test', baseUrl: 'https://b.test' },
            })
        ).toThrow(/Duplicate MCP tool name/);
    });
});

describe('createOAuthProxyProvider', () => {
    it.each([
        new InvalidTokenError('Invalid access token'),
        new InsufficientScopeError('Insufficient scope'),
        new ServerError('Verifier unavailable'),
        new Error('private database connection detail'),
    ])('preserves the verifier error: %s', async error => {
        const failingProvider = createOAuthProxyProvider({
            authorizationServerUrl: 'https://auth.example.test',
            verifyAccessToken: async () => {
                throw error;
            },
            getClient: async () => undefined,
        });
        await expect(failingProvider.verifyAccessToken('token')).rejects.toBe(error);
    });
});

describe('createMcpApp', () => {
    it('requires a bearer token and points at protected resource metadata', async () => {
        const response = await rpc(undefined, 1, 'tools/list');
        expect(response.status).toBe(401);
        expect(response.headers.get('www-authenticate')).toContain(
            'https://mcp.example.test/.well-known/oauth-protected-resource'
        );
    });

    it('rejects a wrong bearer token with 401 and the same challenge as a missing one', async () => {
        const response = await rpc('not-a-real-token', 1, 'tools/list');
        expect(response.status).toBe(401);
        const challenge = response.headers.get('www-authenticate');
        expect(challenge).toContain('error="invalid_token"');
        expect(challenge).toContain(
            'https://mcp.example.test/.well-known/oauth-protected-resource'
        );
    });

    it.each([
        ['verifier-outage', 500, 'server_error', 'Internal Server Error'],
        ['server-error', 500, 'server_error', 'Verifier unavailable'],
        ['insufficient-scope', 403, 'insufficient_scope', 'Insufficient scope'],
    ])('returns the correct HTTP status for %s', async (token, status, code, message) => {
        events.length = 0;
        const response = await rpc(token, 1, 'tools/list');
        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ error: code, error_description: message });
        if (status === 500) {
            expect(response.headers.get('www-authenticate')).toBeNull();
            expect(events).toEqual([{ level: 'error', event: 'auth_verification_failed' }]);
        } else {
            expect(response.headers.get('www-authenticate')).toContain(
                'error="insufficient_scope"'
            );
            expect(events).toEqual([]);
        }
    });

    it('rejects invalid tool arguments before the handler runs', async () => {
        const response = await rpc(VALID_TOKEN, 2, 'tools/call', {
            name: 'fails',
            arguments: { reason: 123 },
        });
        expect(response.status).toBe(200);
        const body = await readJson(response);
        expect(body.error).toBeUndefined();
        expect(body.result.isError).toBe(true);
        expect(body.result.content[0].text).toContain('Input validation error');
        expect(body.result.content[0].text).not.toContain('Not allowed');
    });

    it('serves OAuth metadata naming the authorization server', async () => {
        const resource = await readJson(
            await fetch(`${baseUrl}/.well-known/oauth-protected-resource`)
        );
        expect(resource.authorization_servers).toEqual(['https://auth.example.test/']);
        const server = await readJson(
            await fetch(`${baseUrl}/.well-known/oauth-authorization-server`)
        );
        expect(server.issuer).toBe('https://auth.example.test/');
    });

    it('lists tools with their required annotations', async () => {
        const response = await rpc(VALID_TOKEN, 1, 'tools/list');
        const body = await readJson(response);
        const whoami = body.result.tools.find((tool: { name: string }) => tool.name === 'whoami');
        expect(whoami.annotations).toEqual({ title: 'Who am I', ...readOnly });
    });

    it('turns McpToolError into a typed tool error', async () => {
        events.length = 0;
        const response = await rpc(VALID_TOKEN, 2, 'tools/call', {
            name: 'fails',
            arguments: { reason: 'x' },
        });
        const body = await readJson(response);
        expect(body.result.isError).toBe(true);
        expect(JSON.parse(body.result.content[0].text)).toEqual({
            error: { code: 'forbidden', message: 'Not allowed' },
        });
        expect(events).toEqual([]);
    });

    it.each(['error', 'string', 'object', 'forged'])(
        'sanitizes an untyped %s over HTTP and emits only a content-free diagnostic',
        async kind => {
            events.length = 0;
            diagnosticCalls.length = 0;
            const response = await rpc(VALID_TOKEN, 20, 'tools/call', {
                name: 'untyped-fails',
                arguments: { kind },
            });
            expect(response.status).toBe(200);
            const text = await response.text();
            expect(text).not.toContain(PRIVATE_DETAIL);
            expect(text).not.toContain(VALID_TOKEN);
            const body = JSON.parse(text);
            expect(body.error).toBeUndefined();
            expect(body.result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: { code: 'internal_error', message: 'Internal error' },
                        }),
                    },
                ],
                structuredContent: { error: { code: 'internal_error', message: 'Internal error' } },
                isError: true,
            });
            expect(diagnosticCalls).toEqual([['error', 'request_failed']]);
            expect(JSON.stringify(diagnosticCalls)).not.toContain(PRIVATE_DETAIL);
            expect(JSON.stringify(diagnosticCalls)).not.toContain(VALID_TOKEN);
        }
    );

    it('keeps a diagnostic callback failure out of the HTTP tool result', async () => {
        const app = createMcpApp({
            serverInfo: { name: 'diagnostic-failure-test', version: '0' },
            tools: [tools[2]!],
            auth: {
                provider,
                issuerUrl: 'https://auth.example.test',
                baseUrl: 'https://mcp.example.test',
            },
            onEvent: () => {
                throw new Error('SYNTHETIC_PRIVATE_DIAGNOSTIC_DETAIL');
            },
        });
        const listener = await new Promise<Server>(resolve => {
            const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
        });
        try {
            const address = listener.address();
            if (!address || typeof address === 'string') throw new Error('Missing test listener');
            const response = await fetch(`http://127.0.0.1:${address.port}`, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${VALID_TOKEN}`,
                    'content-type': 'application/json',
                    accept: 'application/json, text/event-stream',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 21,
                    method: 'tools/call',
                    params: { name: 'untyped-fails', arguments: { kind: 'error' } },
                }),
            });
            const text = await response.text();
            expect(text).not.toContain(PRIVATE_DETAIL);
            expect(text).not.toContain('SYNTHETIC_PRIVATE_DIAGNOSTIC_DETAIL');
            expect(JSON.parse(text).result.structuredContent).toEqual({
                error: { code: 'internal_error', message: 'Internal error' },
            });
        } finally {
            await new Promise<void>(resolve => listener.close(() => resolve()));
        }
    });

    it('gives overlapping requests their own server', async () => {
        gates.length = 0;
        const waitFor = (count: number) =>
            new Promise<void>(resolve => {
                const check = () => (gates.length >= count ? resolve() : (onGate = check));
                check();
            });
        const call = (who: string, id: number) =>
            rpc(`${VALID_TOKEN}:${who}`, id, 'tools/call', { name: 'whoami', arguments: {} });

        const first = call('alice', 10);
        await waitFor(1);
        const second = call('bob', 11);
        await waitFor(2);
        gates[1]!.resolve('');
        gates[0]!.resolve('');

        const [a, b] = await Promise.all([first, second]);
        expect(a.status).toBe(200);
        expect(b.status).toBe(200);
        expect((await readJson(a)).result.structuredContent).toEqual({ did: 'did:example:alice' });
        expect((await readJson(b)).result.structuredContent).toEqual({ did: 'did:example:bob' });
    });

    it('serves skills publicly', async () => {
        const index = await readJson(await fetch(`${baseUrl}/skills`));
        expect(index).toEqual({ skills: [{ name: 'hello', description: 'Says hello' }] });
        const doc = await fetch(`${baseUrl}/skills/hello`);
        expect(doc.headers.get('content-type')).toContain('text/markdown');
        expect(await doc.text()).toBe('# Hello');
        expect((await fetch(`${baseUrl}/skills/missing`)).status).toBe(404);
    });
});
