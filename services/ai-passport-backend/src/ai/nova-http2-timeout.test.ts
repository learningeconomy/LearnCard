import { expect, test } from 'bun:test';
import { createServer, type ServerHttp2Stream } from 'node:http2';
import { once } from 'node:events';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Exercise the installed SDK's real default handler against loopback only.
// Synthetic credentials; no AWS endpoint, DNS, account or paid model is used.
test('pinned Bedrock SDK defaults to HTTP/2 and honors per-call timeout override', async () => {
    const server = createServer();
    server.on('stream', (stream: ServerHttp2Stream) => {
        stream.on('error', () => {});
        stream.resume();
        setTimeout(() => {
            if (stream.destroyed || stream.closed) return;
            stream.respond({ ':status': 200, 'content-type': 'application/json' });
            stream.end(JSON.stringify({ embeddings: [] }));
        }, 120);
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Loopback fixture unavailable');
    const client = new BedrockRuntimeClient({
        region: 'us-east-1',
        endpoint: `http://127.0.0.1:${address.port}`,
        credentials: { accessKeyId: 'synthetic', secretAccessKey: 'synthetic' },
        maxAttempts: 1,
        requestHandler: { requestTimeout: 30, disableConcurrentStreams: true },
    });
    try {
        expect(client.config.requestHandler.metadata?.handlerProtocol).toBe('h2');
        const command = () =>
            new InvokeModelCommand({
                modelId: 'synthetic',
                body: '{}',
                contentType: 'application/json',
            });
        const error = await client.send(command()).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(Error);
        if (!(error instanceof Error)) throw new Error('Expected timeout');
        expect(error.name).toBe('TimeoutError');
        expect(error.message).toContain('30 ms');
        const result = await client.send(command(), { requestTimeout: 1000 });
        expect(result.$metadata.httpStatusCode).toBe(200);
    } finally {
        client.destroy();
        server.close();
        await once(server, 'close');
    }
});
