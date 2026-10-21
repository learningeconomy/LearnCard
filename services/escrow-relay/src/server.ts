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
    let rejected = false;

    request.on('error', () => {
        rejected = true;
    });
    request.on('data', (chunk: Buffer) => {
        if (rejected) return;

        totalBytes += chunk.length;

        if (totalBytes > MAX_BODY_BYTES) {
            rejected = true;
            response.writeHead(413, { 'content-type': 'application/json', connection: 'close' });
            response.end(JSON.stringify({ accepted: false, error: 'Request body too large' }));
            request.destroy();
        } else {
            chunks.push(chunk);
        }
    });
    request.on('end', async () => {
        if (rejected) return;

        let body: unknown;

        try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
        } catch {
            response.writeHead(400, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ accepted: false, error: 'Invalid request body' }));
            return;
        }

        let result: Awaited<ReturnType<typeof relay>>;

        try {
            result = await relay({
                authorization: request.headers.authorization,
                body,
            });
        } catch {
            response.writeHead(500, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ accepted: false, error: 'Relay failed' }));
            return;
        }

        response.writeHead(result.statusCode, {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        });
        response.end(JSON.stringify(result.body));
    });
});

server.listen(Number(process.env.PORT ?? 3200), '0.0.0.0');
