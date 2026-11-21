import { createServer, type Server } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeHarness } from '../v1/service/test-harness';
import { createHcpMcpApp } from '../mcp/app';
import { devIssuerUrl, hcpOAuthEnvironment } from './environment';

describe('dev-server issuer (HCP_OAUTH_ISSUER_URL)', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('defaults to the local listen address when unset or empty', () => {
        vi.stubEnv('HCP_OAUTH_ISSUER_URL', '');
        expect(devIssuerUrl(hcpOAuthEnvironment(), 18766)).toBe('http://127.0.0.1:18766');
    });

    it('honors HCP_OAUTH_ISSUER_URL, trimmed and without its trailing slash', () => {
        vi.stubEnv('HCP_OAUTH_ISSUER_URL', ' http://localhost:18797/ ');
        expect(devIssuerUrl(hcpOAuthEnvironment(), 18797)).toBe('http://localhost:18797');
        vi.stubEnv('HCP_OAUTH_ISSUER_URL', 'https://hcp.example.test');
        expect(devIssuerUrl(hcpOAuthEnvironment(), 1)).toBe('https://hcp.example.test');
    });

    it('refuses a relative or non-http(s) URL', () => {
        for (const bad of ['/hcp', 'localhost:18797', 'ftp://hcp.example.test']) {
            vi.stubEnv('HCP_OAUTH_ISSUER_URL', bad);
            expect(() => hcpOAuthEnvironment()).toThrow(/HCP_OAUTH_ISSUER_URL/);
        }
    });

    it('the AS advertises that issuer in discovery and PRM', async () => {
        vi.stubEnv('HCP_OAUTH_ISSUER_URL', 'http://localhost:18797/');
        const issuer = devIssuerUrl(hcpOAuthEnvironment(), 18797);
        const harness = makeHarness();
        const server: Server = createServer(
            createHcpMcpApp({
                store: harness.store,
                hcp: harness.deps,
                issuerUrl: issuer,
                resourceUrl: issuer,
                tokenSecret: 'unit-test-hcp-issuer-secret-32bytes!!',
                consentAppUrl: 'http://app.test',
            })
        );
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('expected TCP port');
        const at = `http://127.0.0.1:${address.port}`;
        try {
            const as = (await (
                await fetch(`${at}/.well-known/oauth-authorization-server`)
            ).json()) as { issuer: string; authorization_endpoint: string };
            expect(as.issuer).toBe('http://localhost:18797');
            expect(as.authorization_endpoint).toBe('http://localhost:18797/oauth/authorize');
            const prm = (await (
                await fetch(`${at}/.well-known/oauth-protected-resource`)
            ).json()) as { resource: string; authorization_servers: string[] };
            expect(prm.authorization_servers).toEqual(['http://localhost:18797']);
            expect(prm.resource.startsWith('http://localhost:18797')).toBe(true);
        } finally {
            await new Promise<void>(resolve => server.close(() => resolve()));
        }
    });
});
