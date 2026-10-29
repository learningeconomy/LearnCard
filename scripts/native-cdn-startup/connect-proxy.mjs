import { createServer, request as forwardRequest } from 'node:http';
import { connect } from 'node:net';

/** Opaque HTTPS CONNECT tunnel: no certificate interception or request-body logging. */
export const createCdnProxy = async () => {
    const sockets = new Set();
    const timers = new Set();
    let delayMs = 0;
    let releaseAt = 0;
    const validationHosts = [
        'www.google.com',
        'connectivitycheck.gstatic.com',
        'connectivitycheck.android.com',
    ];
    const emptyStats = () => ({
        cdnConnections: 0,
        delayed: 0,
        denied: 0,
        validationConnections: 0,
        validationRequests: 0,
    });
    let stats = emptyStats();
    const server = createServer((request, response) => {
        const target = new URL(request.url);
        if (
            request.method === 'GET' &&
            target.protocol === 'http:' &&
            validationHosts.includes(target.hostname) &&
            ['/generate_204', '/gen_204'].includes(target.pathname)
        ) {
            stats.validationRequests++;
            const upstream = forwardRequest(target, { method: 'GET' }, result => {
                response.writeHead(result.statusCode, result.headers);
                result.pipe(response);
            });
            upstream.on('error', () => response.writeHead(502).end());
            upstream.end();
        } else {
            stats.denied++;
            response.writeHead(403).end();
        }
    });
    server.on('connection', socket => {
        sockets.add(socket);
        socket.on('error', () => socket.destroy());
        socket.once('close', () => sockets.delete(socket));
    });
    server.on('clientError', (_error, socket) => socket.destroy());
    server.on('connect', (request, client, head) => {
        const target = new URL('http://' + request.url);
        // Never forward the APK's local API URLs to unrelated services on the host.
        const cdn = target.hostname === 'cdn.jsdelivr.net';
        if (
            (!cdn &&
                target.hostname !== 'learncard.app' &&
                !validationHosts.includes(target.hostname)) ||
            target.port !== '443'
        ) {
            stats.denied++;
            client.end('HTTP/1.1 403 Forbidden\r\n\r\n');
            return;
        }
        if (cdn) stats.cdnConnections++;
        else stats.validationConnections++;
        sockets.add(client);
        client.on('error', () => client.destroy());
        client.once('close', () => sockets.delete(client));
        const forward = () => {
            const upstream = connect({ host: target.hostname, port: 443 }, () => {
                client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                if (head.length) upstream.write(head);
                client.pipe(upstream);
                upstream.pipe(client);
            });
            sockets.add(upstream);
            upstream.on('error', () => {
                upstream.destroy();
                client.destroy();
            });
            upstream.once('close', () => sockets.delete(upstream));
            client.once('close', () => upstream.destroy());
        };
        if (cdn && delayMs && !releaseAt) releaseAt = performance.now() + delayMs;
        const remaining = releaseAt - performance.now();
        if (cdn && delayMs && remaining > 0) {
            stats.delayed++;
            const timer = setTimeout(() => {
                timers.delete(timer);
                if (!client.destroyed) forward();
            }, remaining);
            timers.add(timer);
        } else forward();
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return {
        port: server.address().port,
        reset: ms => {
            for (const timer of timers) clearTimeout(timer);
            timers.clear();
            for (const socket of sockets) socket.destroy();
            delayMs = ms;
            releaseAt = 0;
            stats = emptyStats();
        },
        stats: () => ({ ...stats, delayMs }),
        close: async () => {
            for (const timer of timers) clearTimeout(timer);
            for (const socket of sockets) socket.destroy();
            await new Promise(resolve => server.close(resolve));
        },
    };
};
