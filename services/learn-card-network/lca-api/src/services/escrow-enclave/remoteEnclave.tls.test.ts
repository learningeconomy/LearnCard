import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:https';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createHttpTransport, createRemoteEnclave } from './remoteEnclave';
import { pinnedEnclaveCa } from './enclaveTrustAnchors';
import { logEscrowFailure } from './logFailure';

const fixture = (name: string): string =>
    readFileSync(new URL(`./__fixtures__/tls/${name}`, import.meta.url), 'utf8');

const listen = async (prefix: 'pinned' | 'rogue'): Promise<Server> => {
    const server = createServer(
        { cert: fixture(`${prefix}-leaf.pem`), key: fixture(`${prefix}-leaf.key`) },
        (_request, response) => {
            response.setHeader('content-type', 'application/json');
            response.end('{"ok":true}');
        }
    );
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    return server;
};

const url = (server: Server): string =>
    `https://localhost:${(server.address() as AddressInfo).port}/v1/attest`;

describe('remote enclave TLS trust', () => {
    let pinned: Server;
    let rogue: Server;
    const config = { headers: {}, timeout: 5_000 };

    beforeAll(async () => {
        [pinned, rogue] = await Promise.all([listen('pinned'), listen('rogue')]);
    });
    afterAll(() => {
        pinned.close();
        rogue.close();
    });

    it('accepts a server certificate issued by the pinned CA', async () => {
        const transport = createHttpTransport(fixture('pinned-ca.pem'));
        await expect(transport.post(url(pinned), {}, config)).resolves.toEqual({
            status: 200,
            data: { ok: true },
        });
    });

    it('rejects a certificate from any other CA when a CA is pinned', async () => {
        const transport = createHttpTransport(fixture('pinned-ca.pem'));
        await expect(transport.post(url(rogue), {}, config)).rejects.toThrow();
    });

    it('does not trust a private CA unless it is pinned', async () => {
        await expect(createHttpTransport().post(url(pinned), {}, config)).rejects.toThrow();
    });

    it('pins the staging CA by hostname only', () => {
        expect(pinnedEnclaveCa('https://escrow-enclave.staging.internal:8443')).toContain(
            'BEGIN CERTIFICATE'
        );
        expect(pinnedEnclaveCa('https://enclave-host.internal')).toBeUndefined();
    });

    it('pins a distinct production CA by hostname only', () => {
        const production = pinnedEnclaveCa('https://escrow-enclave.production.internal:8443');

        expect(production).toContain('BEGIN CERTIFICATE');
        expect(production).not.toEqual(
            pinnedEnclaveCa('https://escrow-enclave.staging.internal:8443')
        );
        expect(pinnedEnclaveCa('https://production.internal:8443')).toBeUndefined();
    });
});

describe('remote enclave connection recovery', () => {
    const servers: Server[] = [];
    const config = { headers: { Authorization: 'Bearer test-secret' }, timeout: 1_000 };
    const serve = async (handler: Parameters<typeof createServer>[1]): Promise<string> => {
        const server = createServer(
            { cert: fixture('pinned-leaf.pem'), key: fixture('pinned-leaf.key') },
            handler
        );
        servers.push(server);
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        return url(server).replace('/v1/attest', '');
    };

    afterEach(async () => {
        vi.restoreAllMocks();
        await Promise.all(
            servers.splice(0).map(
                server =>
                    new Promise<void>(resolve => {
                        server.closeAllConnections();
                        server.close(() => resolve());
                    })
            )
        );
    });

    it.each(['/v1/attest', '/v1/enrollment-state', '/v1/hold-state'])(
        'retries %s once on a pre-response reset, on a fresh TLS connection',
        async path => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const sockets = new Set();
            let requests = 0;
            const origin = await serve((request, response) => {
                sockets.add(request.socket);
                requests += 1;
                if (requests === 1) request.socket.destroy();
                else response.end('{"ok":true}');
            });
            const transport = createHttpTransport(fixture('pinned-ca.pem'));
            await expect(
                transport.post(`${origin}${path}`, { secret: 'private-body' }, config)
            ).resolves.toEqual({ status: 200, data: { ok: true } });
            expect(requests).toBe(2);
            expect(sockets.size).toBe(2);
            expect(warn.mock.calls).toEqual([
                ['[LCA escrow] retrying enclave read', { code: 'ECONNRESET' }],
            ]);
        }
    );

    it('does not pool successful requests across invocations', async () => {
        const sockets = new Set();
        const connections: (string | undefined)[] = [];
        const origin = await serve((request, response) => {
            sockets.add(request.socket);
            connections.push(request.headers.connection);
            response.end('{"ok":true}');
        });
        const transport = createHttpTransport(fixture('pinned-ca.pem'));
        await transport.post(`${origin}/v1/attest`, {}, config);
        await transport.post(`${origin}/v1/attest`, {}, config);
        expect(sockets.size).toBe(2);
        expect(connections).toEqual(['close', 'close']);
    });

    it.each([
        '/v1/create-hold',
        '/v1/confirm-hold',
        '/v1/release',
        '/v1/cancel-hold',
        '/v1/apply-enrollment',
        '/v1/authority-rewrap',
        '/v1/carry-pin-verifier',
        '/v1/resend-code',
        '/v1/send-release-warning',
        '/v1/unknown',
    ])('never retries %s even when no response arrived', async path => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        let requests = 0;
        const origin = await serve(request => {
            requests += 1;
            request.socket.destroy();
        });
        await expect(
            createHttpTransport(fixture('pinned-ca.pem')).post(`${origin}${path}`, {}, config)
        ).rejects.toMatchObject({ code: 'ECONNRESET' });
        expect(requests).toBe(1);
        expect(warn).not.toHaveBeenCalled();
    });

    it.each([429, 503, 302])('does not retry or follow HTTP %s', async status => {
        let requests = 0;
        const origin = await serve((_request, response) => {
            requests += 1;
            response.writeHead(status, { Location: '/v1/attest' });
            response.end('{}');
        });
        await expect(
            createHttpTransport(fixture('pinned-ca.pem')).post(`${origin}/v1/attest`, {}, config)
        ).resolves.toMatchObject({ status });
        expect(requests).toBe(1);
    });

    it('does not retry a timeout', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        let requests = 0;
        const origin = await serve(() => {
            requests += 1;
        });
        await expect(
            createHttpTransport(fixture('pinned-ca.pem')).post(
                `${origin}/v1/attest`,
                {},
                { ...config, timeout: 100 }
            )
        ).rejects.toThrow();
        expect(requests).toBe(1);
        expect(warn).not.toHaveBeenCalled();
    });

    it('does not retry after even partial response headers', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        let requests = 0;
        const origin = await serve(request => {
            requests += 1;
            request.socket.write('HTTP/1.1 200 OK\r\n');
            setTimeout(() => request.socket.destroy(), 20);
        });
        await expect(
            createHttpTransport(fixture('pinned-ca.pem')).post(`${origin}/v1/attest`, {}, config)
        ).rejects.toThrow();
        expect(requests).toBe(1);
        expect(warn).not.toHaveBeenCalled();
    });

    it('keeps the second attempt within the original wall-clock budget', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        let requests = 0;
        const origin = await serve(request => {
            requests += 1;
            if (requests === 1) setTimeout(() => request.socket.destroy(), 150);
        });
        const start = performance.now();
        await expect(
            createHttpTransport(fixture('pinned-ca.pem')).post(
                `${origin}/v1/attest`,
                {},
                { ...config, timeout: 300 }
            )
        ).rejects.toThrow();
        expect(performance.now() - start).toBeLessThan(430);
        expect(requests).toBe(2);
        expect(warn).toHaveBeenCalledOnce();
    });

    it('stops after one retry and preserves sanitized transport failure logging', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        let requests = 0;
        const origin = await serve(request => {
            requests += 1;
            request.socket.destroy();
        });
        const enclave = createRemoteEnclave({
            baseUrl: origin,
            token: 'private-token',
            timeoutMs: 1_000,
            caPem: fixture('pinned-ca.pem'),
        });
        const error = await enclave.getAttestation().catch(error => error);
        expect(error).toMatchObject({ reason: 'transport' });
        logEscrowFailure(error);
        expect(requests).toBe(2);
        expect(warn.mock.calls).toEqual([
            ['[LCA escrow] retrying enclave read', { code: 'ECONNRESET' }],
            ['[LCA escrow] enclave operation failed', { reason: 'transport' }],
        ]);
    });
});
