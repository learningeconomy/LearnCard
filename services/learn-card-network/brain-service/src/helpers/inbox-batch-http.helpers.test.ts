import { describe, expect, it, vi } from 'vitest';
import { initTRPC } from '@trpc/server';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { fastifyTRPCOpenApiPlugin, type OpenApiMeta } from 'trpc-to-openapi';
import Fastify from 'fastify';
import { z } from 'zod';
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { Readable } from 'node:stream';
import {
    configureInboxBatchBodyLimit,
    INBOX_BATCH_MAX_BYTES,
    withInboxBatchBodyLimit,
} from './inbox-batch-http.helpers';
import { createOpenApiAwsLambdaHandler } from './shim';

const t = initTRPC.meta<OpenApiMeta>().create();
const calls = vi.fn(() => true);
const router = t.router({
    inbox: t.router({
        issueBatch: t.procedure
            .meta({ openapi: { method: 'POST', path: '/inbox/issue-batch' } })
            .input(z.object({ padding: z.string() }))
            .output(z.boolean())
            .mutation(calls),
        issue: t.procedure
            .meta({ openapi: { method: 'POST', path: '/inbox/issue' } })
            .input(z.object({ padding: z.string() }))
            .output(z.boolean())
            .mutation(calls),
    }),
});

const bodyOfSize = (size: number): string => JSON.stringify({ padding: 'x'.repeat(size - 14) });
const event = (path: string, body: string, base64 = false): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: path.startsWith('/trpc/') ? 'ANY /trpc/{trpc+}' : 'ANY /api/{trpc+}',
    rawPath: path,
    rawQueryString: '',
    headers: { 'content-type': 'application/json', host: 'localhost' },
    requestContext: {
        http: {
            method: 'POST',
            path,
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
        },
        accountId: 'test',
        apiId: 'test',
        domainName: 'localhost',
        domainPrefix: 'test',
        requestId: 'test',
        routeKey: '$default',
        stage: '$default',
        time: '',
        timeEpoch: 0,
    },
    isBase64Encoded: base64,
    body: base64 ? Buffer.from(body).toString('base64') : body,
    pathParameters: { trpc: path.replace(/^\/(api|trpc)\//, '') },
});

describe('batch production transports', () => {
    it('enforces actual streamed bytes when Content-Length is absent', async () => {
        const server = Fastify({ bodyLimit: 32 });
        configureInboxBatchBodyLimit(server);
        server.post('/api/*', async () => true);
        try {
            const response = await server.inject({
                method: 'POST',
                url: '/api/inbox/issue',
                headers: { 'content-type': 'application/json' },
                payload: Readable.from([bodyOfSize(33)]),
            });
            expect(response.statusCode).toBe(413);
            const batchResponse = await server.inject({
                method: 'POST',
                url: '/api/inbox/issue-batch',
                headers: { 'content-type': 'application/json' },
                payload: Readable.from([bodyOfSize(33)]),
            });
            expect(batchResponse.statusCode).toBe(200);
        } finally {
            await server.close();
        }
    });
    it('uses the actual wildcard adapters and preserves limits on other procedures', async () => {
        const server = Fastify();
        configureInboxBatchBodyLimit(server);
        await server.register(fastifyTRPCPlugin, { prefix: '/trpc', trpcOptions: { router } });
        await server.register(fastifyTRPCOpenApiPlugin, { basePath: '/api', router });
        try {
            const payload = bodyOfSize(INBOX_BATCH_MAX_BYTES);
            expect(Buffer.byteLength(payload)).toBe(INBOX_BATCH_MAX_BYTES);
            for (const url of ['/api/inbox/issue-batch', '/trpc/inbox.issueBatch']) {
                const response = await server.inject({
                    method: 'POST',
                    url,
                    headers: { 'content-type': 'application/json' },
                    payload,
                });
                expect(response.statusCode, response.body).toBe(200);
                const tooLarge = await server.inject({
                    method: 'POST',
                    url,
                    headers: { 'content-type': 'application/json' },
                    payload: payload + ' ',
                });
                expect(tooLarge.statusCode).toBe(413);
            }
            for (const url of ['/api/inbox/issue', '/trpc/inbox.issue']) {
                expect(
                    (
                        await server.inject({
                            method: 'POST',
                            url,
                            headers: { 'content-type': 'application/json' },
                            payload,
                        })
                    ).statusCode
                ).toBe(413);
            }
        } finally {
            await server.close();
        }
    });

    it.each([false, true])(
        'checks decoded Lambda bytes before context creation (base64=%s)',
        async base64 => {
            const createContext = vi.fn(() => ({}));
            const rest = createOpenApiAwsLambdaHandler({ router, createContext });
            const trpc = withInboxBatchBodyLimit(
                awsLambdaRequestHandler({ router, createContext }),
                'trpc'
            );
            const context = {} as Context;
            for (const [path, handler] of [
                ['/api/inbox/issue-batch', rest],
                ['/trpc/inbox.issueBatch', trpc],
            ] as const) {
                createContext.mockClear();
                calls.mockClear();
                const valid = await handler(
                    event(path, bodyOfSize(INBOX_BATCH_MAX_BYTES), base64),
                    context
                );
                expect(valid.statusCode, valid.body).toBe(200);
                expect(calls).toHaveBeenCalledTimes(1);
                createContext.mockClear();
                const response = await handler(
                    event(path, bodyOfSize(INBOX_BATCH_MAX_BYTES) + ' ', base64),
                    context
                );
                expect(response.statusCode).toBe(413);
                expect(response.headers?.['Access-Control-Allow-Origin']).toBe('*');
                expect(createContext).not.toHaveBeenCalled();
                expect(calls).toHaveBeenCalledTimes(1);
            }
        }
    );

    it('counts UTF-8 bytes and rejects malformed oversized JSON before parsing', async () => {
        const handler = vi.fn(async () => ({ statusCode: 200 }));
        const wrapped = withInboxBatchBodyLimit(handler, 'trpc');
        const request = event(
            '/trpc/inbox.issue,inbox.issueBatch',
            'é'.repeat(INBOX_BATCH_MAX_BYTES / 2 + 1)
        );
        request.queryStringParameters = { batch: '1' };
        const response = await wrapped(request, {} as Context);
        expect(response.statusCode).toBe(413);
        expect(handler).not.toHaveBeenCalled();
        expect('body' in response && JSON.parse(response.body)).toHaveLength(2);
    });
});
