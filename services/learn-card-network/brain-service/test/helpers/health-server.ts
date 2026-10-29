import { createServer } from 'node:http';
import { importJWK, jwtVerify } from 'jose';
import {
    serviceAccountSigningPublicKey,
    INTEGRATION_PROBE_TYPE,
} from '@helpers/service-account-auth.helpers';

export type HealthServerControl = { healthy: boolean; probes: number };

/**
 * A real in-process integration health endpoint: verifies the platform's EdDSA challenge
 * and echoes its `jti`, or answers 503 while `control.healthy` is false. Listens on
 * `localhost` (the only plain-http host brain probes) and closes after `run`.
 */
export const withHealthServer = async (
    run: (endpoint: string, control: HealthServerControl) => Promise<void>
): Promise<void> => {
    const control: HealthServerControl = { healthy: true, probes: 0 };
    const key = await importJWK(serviceAccountSigningPublicKey(), 'EdDSA');
    let endpoint = '';
    const server = createServer(async (request, response) => {
        control.probes++;
        try {
            const token = request.headers['x-educationos-health-challenge'];
            if (typeof token !== 'string') throw new Error('No challenge');
            const { payload } = await jwtVerify(token, key, {
                algorithms: ['EdDSA'],
                typ: INTEGRATION_PROBE_TYPE,
                audience: endpoint,
                issuer: 'educationos-platform',
            });
            if (!control.healthy) {
                response.writeHead(503).end();
                return;
            }
            if (!payload.jti) throw new Error('No challenge nonce');
            response.setHeader('x-educationos-health-response', payload.jti);
            response.writeHead(200).end();
        } catch {
            response.writeHead(401).end();
        }
    });
    await new Promise<void>(resolve => server.listen(0, 'localhost', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing server port');
    endpoint = `http://localhost:${address.port}/health`;
    try {
        await run(endpoint, control);
    } finally {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve()))
        );
    }
};
