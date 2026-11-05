import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { z } from 'zod';

import {
    createMcpApp,
    createOAuthProxyProvider,
    defineMcpTool,
    getAuthenticatedDid,
    jsonToolResponse,
    McpToolError,
    type McpToolDefinition,
} from './index';

const VALID_TOKEN = 'valid-token';

const provider = createOAuthProxyProvider({
    authorizationServerUrl: 'https://auth.example.test/',
    verifyAccessToken: async token => {
        if (!token.startsWith(VALID_TOKEN)) throw new Error('bad token');
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
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readJson = (response: Response): Promise<any> => response.json();

let server: Server;
let baseUrl: string;

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
        const response = await rpc(VALID_TOKEN, 2, 'tools/call', {
            name: 'fails',
            arguments: { reason: 'x' },
        });
        const body = await readJson(response);
        expect(body.result.isError).toBe(true);
        expect(JSON.parse(body.result.content[0].text)).toEqual({
            error: { code: 'forbidden', message: 'Not allowed' },
        });
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
