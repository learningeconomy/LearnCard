import { afterAll, beforeAll, expect, mock, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';

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
