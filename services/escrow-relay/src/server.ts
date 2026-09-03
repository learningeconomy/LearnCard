import { createServer } from 'node:http';

import { loadEscrowRelayConfig } from './config';
import { createEscrowRelayHandler } from './relay';

const MAX_BODY_BYTES = 32 * 1024;
const relay = createEscrowRelayHandler(loadEscrowRelayConfig());

const server = createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== '/email-backup') {
        response.writeHead(404, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ accepted: false, error: 'Not found' }));
        return;
    }

    const chunks: Buffer[] = [];
    let totalBytes = 0;

    request.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;

        if (totalBytes > MAX_BODY_BYTES) request.destroy();
        else chunks.push(chunk);
    });
    request.on('end', async () => {
        let body: unknown;

        try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
        } catch {
            response.writeHead(400, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ accepted: false, error: 'Invalid request body' }));
            return;
        }

        const result = await relay({
            authorization: request.headers.authorization,
            body,
        });

        response.writeHead(result.statusCode, {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        });
        response.end(JSON.stringify(result.body));
    });
});

server.listen(Number(process.env.PORT ?? 3200), '0.0.0.0');
