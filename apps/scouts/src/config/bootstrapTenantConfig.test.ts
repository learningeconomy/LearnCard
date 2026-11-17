import { afterEach, describe, expect, it, vi } from 'vitest';
import production from '../../environments/scoutpass/config.json';
import staging from '../../environments/scoutpass/config.staging.json';
import local from '../../environments/scoutpass/config.local.json';
import { deepMerge } from 'learn-card-base/config/deepMerge';

vi.mock('./environment', () => ({
    environment: {
        VITE_WEB3AUTH_CLIENT_ID: 'synthetic-client',
        VITE_WEB3AUTH_RPC_TARGET: 'https://rpc.example.test',
    },
}));
vi.mock('learn-card-base', async () => ({
    ...(await import('../../../../packages/learn-card-base/src/config/tenantDefaults')),
}));

afterEach(() => vi.unstubAllGlobals());

describe('ScoutPass SSS configuration', () => {
    it.each([
        ['production', {}, 'https://api.scoutnetwork.org/api'],
        ['staging', staging, 'https://staging.api.scoutnetwork.org/api'],
        ['local', local, 'http://localhost:5100/api'],
    ] as const)(
        'uses the ScoutPass %s API and preserves legacy settings',
        async (_stage, overlay, serverUrl) => {
            vi.resetModules();
            vi.stubGlobal('__SCOUTS_TENANT_OVERRIDES__', deepMerge(production, overlay));
            const { SCOUTS_TENANT_CONFIG } = await import('./bootstrapTenantConfig');
            expect(SCOUTS_TENANT_CONFIG.auth.keyDerivation).toBe('sss');
            expect(SCOUTS_TENANT_CONFIG.auth.sss?.serverUrl).toBe(serverUrl);
            expect(SCOUTS_TENANT_CONFIG.auth.web3Auth).toEqual({
                clientId: 'synthetic-client',
                network: 'cyan',
                verifierId: 'scoutPass-firebase-cyan-mainnet',
                rpcTarget: 'https://rpc.example.test',
            });
        }
    );
});
