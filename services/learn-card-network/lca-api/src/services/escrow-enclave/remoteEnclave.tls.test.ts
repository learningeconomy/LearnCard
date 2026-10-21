import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:https';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHttpTransport } from './remoteEnclave';
import { pinnedEnclaveCa } from './enclaveTrustAnchors';

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
});
