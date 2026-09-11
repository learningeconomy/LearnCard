import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    clearAuthConfigOverrides,
    getAuthConfig,
    getConfigCapabilities,
    getSSSConfig,
    getEscrowStrategyConfig,
    isEmailBackupShareEnabled,
    setAuthConfigFromTenant,
    setAuthConfigOverrides,
    shouldUseSSS,
} from '../authConfig';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../tenantDefaults';

describe('authConfig', () => {
    beforeEach(() => clearAuthConfigOverrides());
    afterEach(() => vi.unstubAllEnvs());

    it('uses enclave environment fallbacks only when tenant values are absent', () => {
        vi.stubEnv('VITE_ESCROW_ENCLAVE_MODE', 'software');
        vi.stubEnv('VITE_ESCROW_ENCLAVE_PUBLIC_KEYS', ' first, second , ');
        expect(getSSSConfig()).toMatchObject({
            escrowEnclaveMode: 'software',
            escrowEnclavePublicKeys: ['first', 'second'],
        });
        setAuthConfigOverrides({
            providerConfig: { sss: { escrowEnclaveMode: 'off', escrowEnclavePublicKeys: [] } },
        });
        expect(getEscrowStrategyConfig(getSSSConfig())).toBeUndefined();
        expect(getSSSConfig().escrowEnclavePublicKeys).toEqual([]);
    });

    it('uses deterministic isolated-consumer defaults', () => {
        expect(getAuthConfig()).toMatchObject({
            authProvider: 'firebase',
            keyDerivation: 'sss',
        });
        expect(getSSSConfig()).toEqual({
            serverUrl: 'http://localhost:5100/api',
            escrowRelayPublicKey: '',
            escrowRelayKeyId: '',
            escrowEnclaveMode: 'off',
            escrowEnclavePublicKeys: [],
            escrowEnclaveMeasurements: [],
            enableEmailBackupShare: true,
            requireEmailForPhoneUsers: true,
        });
    });

    it('reads the pinned escrow relay key from tenant SSS config', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { escrowRelayPublicKey: 'relay-public-key', escrowRelayKeyId: '2026-09' },
            },
        });

        expect(getSSSConfig()).toMatchObject({
            escrowRelayPublicKey: 'relay-public-key',
            escrowRelayKeyId: '2026-09',
        });
    });

    it('maps explicit enclave policies and leaves escrow disabled by default', () => {
        expect(getEscrowStrategyConfig(getSSSConfig())).toBeUndefined();
        setAuthConfigOverrides({
            providerConfig: {
                sss: {
                    escrowEnclaveMode: 'software',
                    escrowEnclavePublicKeys: ['dev-key'],
                },
            },
        });
        expect(getEscrowStrategyConfig(getSSSConfig())).toEqual({
            enabled: true,
            attestation: { mode: 'software', pinnedPublicKeys: ['dev-key'] },
        });
        setAuthConfigOverrides({
            providerConfig: {
                sss: {
                    escrowEnclaveMode: 'nitro',
                    escrowEnclaveMeasurements: [{ imageSha384: 'measurement' }],
                },
            },
        });
        expect(getEscrowStrategyConfig(getSSSConfig())).toEqual({
            enabled: true,
            attestation: { mode: 'nitro', pinnedMeasurements: [{ imageSha384: 'measurement' }] },
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
