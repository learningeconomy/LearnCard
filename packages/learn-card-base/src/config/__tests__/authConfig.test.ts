import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearAuthConfigOverrides,
    getAuthConfig,
    getConfigCapabilities,
    getSSSConfig,
    isEmailBackupShareEnabled,
    setAuthConfigFromTenant,
    setAuthConfigOverrides,
    shouldUseSSS,
} from '../authConfig';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../tenantDefaults';

describe('authConfig', () => {
    beforeEach(() => clearAuthConfigOverrides());

    it('uses deterministic isolated-consumer defaults', () => {
        expect(getAuthConfig()).toMatchObject({
            authProvider: 'firebase',
            keyDerivation: 'sss',
        });
        expect(getSSSConfig()).toEqual({
            serverUrl: 'http://localhost:5100/api',
            enableEmailBackupShare: true,
            requireEmailForPhoneUsers: true,
        });
    });

    it('uses explicit validated overrides without consulting environment variables', () => {
        setAuthConfigOverrides({
            authProvider: 'keycloak',
            keyDerivation: 'custom-strategy',
            providerConfig: {
                customStrategy: { endpoint: 'https://auth.example.com' },
            },
        });

        expect(getAuthConfig()).toMatchObject({
            authProvider: 'keycloak',
            keyDerivation: 'custom-strategy',
            providerConfig: {
                customStrategy: { endpoint: 'https://auth.example.com' },
            },
        });
    });

    it('bridges the complete validated TenantConfig auth section', () => {
        setAuthConfigFromTenant({
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            auth: {
                ...DEFAULT_LEARNCARD_TENANT_CONFIG.auth,
                keyDerivation: 'web3auth',
                sss: {
                    serverUrl: 'https://tenant.example.com/trpc',
                    enableEmailBackupShare: false,
                    requireEmailForPhoneUsers: false,
                    customTenantField: 'preserved',
                },
                web3Auth: {
                    clientId: 'tenant-client-id',
                    network: 'cyan',
                    verifierId: 'tenant-verifier',
                    rpcTarget: 'https://rpc.example.com',
                },
                keycloak: {
                    issuer: 'https://keycloak.example.com',
                },
            },
        });

        const config = getAuthConfig();

        expect(config.authProvider).toBe('firebase');
        expect(config.keyDerivation).toBe('web3auth');
        expect(config.providerConfig.sss).toMatchObject({
            serverUrl: 'https://tenant.example.com/trpc',
            enableEmailBackupShare: false,
            requireEmailForPhoneUsers: false,
            customTenantField: 'preserved',
        });
        expect(config.providerConfig.web3Auth).toEqual({
            clientId: 'tenant-client-id',
            network: 'cyan',
            verifierId: 'tenant-verifier',
            rpcTarget: 'https://rpc.example.com',
        });
        expect(config.providerConfig.keycloak).toEqual({
            issuer: 'https://keycloak.example.com',
        });
    });

    it('clears host overrides back to deterministic defaults', () => {
        setAuthConfigOverrides({ keyDerivation: 'web3auth' });
        clearAuthConfigOverrides();

        expect(getAuthConfig().keyDerivation).toBe('sss');
    });

    it('reports SSS selection and email-backup state from resolved config', () => {
        setAuthConfigOverrides({
            keyDerivation: 'sss',
            providerConfig: {
                sss: {
                    serverUrl: 'https://tenant.example.com/trpc',
                    enableEmailBackupShare: false,
                    requireEmailForPhoneUsers: true,
                },
            },
        });

        expect(shouldUseSSS()).toBe(true);
        expect(isEmailBackupShareEnabled()).toBe(false);
        expect(getConfigCapabilities()).toMatchObject({
            recovery: true,
            deviceLinking: true,
        });
    });

    it('reports Web3Auth capabilities from explicit resolved config', () => {
        setAuthConfigOverrides({ keyDerivation: 'web3auth' });

        expect(shouldUseSSS()).toBe(false);
        expect(getConfigCapabilities()).toEqual({
            recovery: false,
            deviceLinking: false,
            localKeyPersistence: false,
            contactMethodUpgrade: false,
        });
    });
});
