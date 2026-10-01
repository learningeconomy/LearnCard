import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import {
    integrationHealthUrlAllowed,
    probeIntegrationHealth,
    publicProbeAddress,
} from './service-account-health.helpers';

describe('health probe real transport', () => {
    it('rejects private DNS destinations before connecting, without mocking fetch', async () => {
        let connections = 0;
        const server = createServer(socket => {
            connections++;
            socket.destroy();
        });
        await new Promise<void>(resolve => server.listen(0, 'localhost', resolve));
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('No server address');
        // Trailing-dot DNS hostname is deliberately not the literal-localhost test exception.
        const url = `https://localhost.:${address.port}/health`;
        try {
            expect(integrationHealthUrlAllowed(url)).toBe(true);
            expect(
                await probeIntegrationHealth(
                    {
                        id: 'sa',
                        installId: 'install',
                        ecosystemId: 'eco',
                        credentialGeneration: 1,
                        status: 'PROVISIONED',
                        createdAt: new Date().toISOString(),
                    },
                    url
                )
            ).toBe(false);
            expect(connections).toBe(0);
        } finally {
            await new Promise<void>(resolve => server.close(() => resolve()));
        }
    });
    it('rejects private, link-local, multicast and mapped addresses', () => {
        for (const address of [
            '127.0.0.1',
            '10.0.0.1',
            '169.254.169.254',
            '172.16.0.1',
            '192.168.1.1',
            '100.64.0.1',
            '224.0.0.1',
            '::1',
            '::ffff:127.0.0.1',
            'fe80::1',
            'fc00::1',
        ])
            expect(publicProbeAddress(address)).toBe(false);
        expect(publicProbeAddress('8.8.8.8')).toBe(true);
    });
});
