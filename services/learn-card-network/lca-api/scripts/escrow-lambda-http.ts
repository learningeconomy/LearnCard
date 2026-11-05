/** Local API Gateway bridge to the real Lambda entrypoint; no application mocks. */
import { createServer } from 'node:http';
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { openApiHandler } from '../lambda';

const server = createServer(async (request, response) => {
    try {
        const url = new URL(request.url ?? '/', 'http://localhost');
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const headers = Object.fromEntries(
            Object.entries(request.headers).flatMap(([key, value]) =>
                value === undefined ? [] : [[key, Array.isArray(value) ? value.join(',') : value]]
            )
        );
        const event: APIGatewayProxyEventV2 = {
            version: '2.0',
            routeKey: '$default',
            rawPath: url.pathname,
            rawQueryString: url.search.slice(1),
            pathParameters: { trpc: url.pathname.replace(/^\/api\//, '') },
            headers,
            isBase64Encoded: false,
            body: Buffer.concat(chunks).toString() || undefined,
            requestContext: {
                accountId: 'local',
                apiId: 'owned-verification',
                domainName: 'localhost',
                domainPrefix: 'localhost',
                requestId: crypto.randomUUID(),
                routeKey: '$default',
                stage: '$default',
                time: new Date().toISOString(),
                timeEpoch: Date.now(),
                http: {
                    method: request.method ?? 'GET',
                    path: url.pathname,
                    protocol: 'HTTP/1.1',
                    sourceIp: '127.0.0.1',
                    userAgent: 'owned-verification',
                },
            },
        };
        const context: Context = {
            callbackWaitsForEmptyEventLoop: false,
            functionName: 'owned-verification',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'local',
            memoryLimitInMB: '1024',
            awsRequestId: event.requestContext.requestId,
            logGroupName: 'local',
            logStreamName: 'local',
            getRemainingTimeInMillis: () => 120_000,
            done: () => {},
            fail: () => {},
            succeed: () => {},
        };
        const result = await openApiHandler(event, context, () => {});
        if (typeof result !== 'object' || !result) throw new Error('Expected Lambda HTTP response');
        response.writeHead(
            result.statusCode ?? 200,
            Object.fromEntries(
                Object.entries(result.headers ?? {}).map(([key, value]) => [key, String(value)])
            )
        );
        response.end(
            result.isBase64Encoded ? Buffer.from(result.body ?? '', 'base64') : result.body
        );
    } catch (error) {
        console.error('Local Lambda bridge failed', error);
        response.writeHead(500).end('Local Lambda bridge failed');
    }
});
server.listen(Number(process.env.PORT), '127.0.0.1');
