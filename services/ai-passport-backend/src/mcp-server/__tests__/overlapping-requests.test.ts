import { afterAll, beforeAll, expect, mock, spyOn, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';

// The MCP endpoint is stateless: every POST gets its own StreamableHTTPServerTransport.
// McpServer.connect() refuses a second transport while one is attached, so a server
// shared across requests turned overlapping authenticated calls into HTTP 500s.

type Deferred = { promise: Promise<string>; resolve: (value: string) => void };

const deferred = (): Deferred => {
    let resolve!: (value: string) => void;
    const promise = new Promise<string>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

const pending: Deferred[] = [];
let calls = 0;
let notifyCall: (() => void) | undefined;

mock.module('../controllers', () => ({
    getLatestUserSummary: () => {
        const gate = deferred();
        pending.push(gate);
        calls += 1;
        notifyCall?.();
        return gate.promise;
    },
    getAnswerAboutUser: async () => 'unused',
    saveSessionSummary: async () => undefined,
}));
mock.module('../ownerOperation', () => ({
    runMcpOwnerOperation: <T>(_did: string, operation: () => Promise<T>) => operation(),
}));
mock.module('../oauth/clients', () => ({
    getRegisteredClient: async () => undefined,
}));

const { app } = await import('../app');
const { JWT_SECRET } = await import('../../constants/env');

let server: Server;
let baseUrl: string;

beforeAll(async () => {
    server = await new Promise<Server>(resolve => {
        const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/`;
});

afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
});

const waitForCalls = async (count: number) => {
    while (calls < count) {
        await new Promise<void>(resolve => {
            notifyCall = resolve;
        });
    }
};

const callTool = (did: string, id: number) =>
    fetch(baseUrl, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${jwt.sign({ sub: did, aud: 'test-client' }, JWT_SECRET, {
                expiresIn: '5m',
            })}`,
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            method: 'tools/call',
            params: { name: 'get_user_context', arguments: {} },
        }),
    });

test('overlapping authenticated MCP requests each get their own server', async () => {
    const first = callTool('did:example:alice', 1);
    await waitForCalls(1);

    // The first request is still in flight (its tool call is parked), so its transport is
    // still attached when the second request connects.
    const second = callTool('did:example:bob', 2);
    const early = await Promise.race([waitForCalls(2).then(() => undefined), second]);

    // A shared server answers the overlapping request before its tool ever runs.
    expect(early?.status).toBeUndefined();

    pending[1]!.resolve('summary for bob');
    pending[0]!.resolve('summary for alice');

    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    const firstBody = await firstResponse.json();
    const secondBody = await secondResponse.json();

    expect(firstBody.id).toBe(1);
    expect(firstBody.result.structuredContent).toEqual({ general_summary: 'summary for alice' });
    expect(secondBody.id).toBe(2);
    expect(secondBody.result.structuredContent).toEqual({ general_summary: 'summary for bob' });
});

test('mounts the AI Passport tools with their behavior annotations', async () => {
    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${jwt.sign({ sub: 'did:example:carol', aud: 'test-client' }, JWT_SECRET, { expiresIn: '5m' })}`,
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} }),
    });

    expect(response.status).toBe(200);
    const { result } = await response.json();
    const byName = Object.fromEntries(
        result.tools.map((tool: { name: string; annotations: Record<string, unknown> }) => [
            tool.name,
            tool.annotations,
        ])
    );

    expect(Object.keys(byName).sort()).toEqual([
        'get_answer_about_user',
        'get_user_context',
        'save_session_summary',
    ]);
    expect(byName.get_user_context).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    expect(byName.save_session_summary).toMatchObject({
        readOnlyHint: false,
        destructiveHint: false,
    });
});

const listToolsWithToken = (token?: string) =>
    fetch(baseUrl, {
        method: 'POST',
        headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/list', params: {} }),
    });

test.each([
    ['missing', undefined],
    ['malformed', 'not-a-token'],
    [
        'wrong signature',
        jwt.sign({ sub: 'did:example:alice', aud: 'test-client' }, 'wrong-secret', {
            expiresIn: '5m',
        }),
    ],
    [
        'expired',
        jwt.sign({ sub: 'did:example:alice', aud: 'test-client' }, JWT_SECRET, { expiresIn: -1 }),
    ],
    [
        'not active',
        jwt.sign({ sub: 'did:example:alice', aud: 'test-client' }, JWT_SECRET, {
            notBefore: '5m',
            expiresIn: '10m',
        }),
    ],
])('returns 401 for a %s token', async (_label, token) => {
    const capture = spyOn(Sentry, 'captureMessage').mockImplementation(() => 'test-event');
    try {
        const response = await listToolsWithToken(token);
        expect(response.status).toBe(401);
        expect(response.headers.get('www-authenticate')).toContain('invalid_token');
        expect(capture).not.toHaveBeenCalled();
    } finally {
        capture.mockRestore();
    }
});

test('returns 500 and reports a safe event for an unexpected JWT verifier failure', async () => {
    const capture = spyOn(Sentry, 'captureMessage').mockImplementation(() => 'test-event');
    const verify = spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('private verifier detail');
    });
    try {
        const response = await listToolsWithToken('token');
        expect(response.status).toBe(500);
        expect(response.headers.get('www-authenticate')).toBeNull();
        expect(await response.json()).toEqual({
            error: 'server_error',
            error_description: 'Internal Server Error',
        });
        expect(capture).toHaveBeenCalledTimes(1);
        expect(capture).toHaveBeenCalledWith('auth_verification_failed', { level: 'error' });
    } finally {
        verify.mockRestore();
        capture.mockRestore();
    }
});

test.each([
    ['get_answer_about_user', { question: 123 }],
    ['save_session_summary', { summary: 123 }],
])('rejects malformed %s arguments as a tool error, not a protocol error', async (name, args) => {
    const token = jwt.sign({ sub: 'did:example:alice', aud: 'test-client' }, JWT_SECRET, {
        expiresIn: '5m',
    });
    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: { name, arguments: args },
        }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.error).toBeUndefined();
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain('Input validation error');
});
