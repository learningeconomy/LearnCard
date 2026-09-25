import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    clearAuthConfigOverrides,
    getAuthConfig,
    getConfigCapabilities,
    getSSSConfig,
    getEscrowStrategyConfig,
    isEmailBackupShareEnabled,
    isProductionTenant,
    setAuthConfigFromTenant,
    setAuthConfigOverrides,
    shouldUseSSS,
} from '../authConfig';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../tenantDefaults';
import { tenantConfigSchema } from '../tenantConfigSchema';

const PCR0 = 'a'.repeat(96);
const PCR1 = 'b'.repeat(96);
const PCR2 = 'c'.repeat(96);
const ROOT_SHA256 = 'd'.repeat(64);

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

    it('maps the software enclave policy and leaves escrow disabled by default', () => {
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
    });

    it('maps a valid nitro PCR tuple, passing through root hash and max age', () => {
        const pcrTuple = { pcr0: PCR0, pcr1: PCR1, pcr2: PCR2 };
        setAuthConfigOverrides({
            providerConfig: {
                sss: {
                    escrowEnclaveMode: 'nitro',
                    escrowEnclaveMeasurements: [pcrTuple],
                    escrowEnclaveRootSha256: ROOT_SHA256,
                    escrowEnclaveMaxAgeMs: 60000,
                },
            },
        });
        expect(getEscrowStrategyConfig(getSSSConfig())).toEqual({
            enabled: true,
            attestation: {
                mode: 'nitro',
                pinnedMeasurements: [pcrTuple],
                rootCertificateSha256: ROOT_SHA256,
                maxAgeMs: 60000,
            },
        });
    });

    it('disables escrow and logs an error for a legacy image-only nitro config (no PCR pins)', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        setAuthConfigOverrides({
            providerConfig: {
                sss: {
                    escrowEnclaveMode: 'nitro',
                    escrowEnclaveMeasurements: [{ imageSha384: 'a'.repeat(96) }],
                },
            },
        });

        expect(getEscrowStrategyConfig(getSSSConfig())).toBeUndefined();
        expect(errorSpy).toHaveBeenCalledWith(
            '[auth-config]',
            'escrow.nitro-mode.no-pcr-pins',
            expect.anything()
        );
    });

    it('disables escrow and logs an error for nitro mode with an empty pin list', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        setAuthConfigOverrides({
            providerConfig: {
                sss: { escrowEnclaveMode: 'nitro', escrowEnclaveMeasurements: [] },
            },
        });

        expect(getEscrowStrategyConfig(getSSSConfig())).toBeUndefined();
        expect(errorSpy).toHaveBeenCalledWith(
            '[auth-config]',
            'escrow.nitro-mode.no-pcr-pins',
            expect.anything()
        );
    });

    it('blocks software mode for a production tenant in a production build, and logs an error', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        setAuthConfigOverrides({
            tenantId: 'learncard',
            providerConfig: {
                sss: { escrowEnclaveMode: 'software', escrowEnclavePublicKeys: ['dev-key'] },
            },
        });

        expect(
            getEscrowStrategyConfig(getSSSConfig(), { isProductionBuild: true })
        ).toBeUndefined();
        expect(errorSpy).toHaveBeenCalledWith(
            '[auth-config]',
            'escrow.software-mode.blocked-in-production',
            { tenantId: 'learncard' }
        );
    });

    it('keeps software mode working outside of a production build (local/staging)', () => {
        setAuthConfigOverrides({
            tenantId: 'learncard',
            providerConfig: {
                sss: { escrowEnclaveMode: 'software', escrowEnclavePublicKeys: ['dev-key'] },
            },
        });

        expect(getEscrowStrategyConfig(getSSSConfig(), { isProductionBuild: false })).toEqual({
            enabled: true,
            attestation: { mode: 'software', pinnedPublicKeys: ['dev-key'] },
        });
    });

    it('keeps software mode working for a non-production tenant even in a production build', () => {
        setAuthConfigOverrides({
            tenantId: 'some-dev-tenant',
            providerConfig: {
                sss: { escrowEnclaveMode: 'software', escrowEnclavePublicKeys: ['dev-key'] },
            },
        });

        expect(getEscrowStrategyConfig(getSSSConfig(), { isProductionBuild: true })).toEqual({
            enabled: true,
            attestation: { mode: 'software', pinnedPublicKeys: ['dev-key'] },
        });
    });

    it('recognizes only known production tenants', () => {
        expect(isProductionTenant('learncard')).toBe(true);
        expect(isProductionTenant('vetpass')).toBe(true);
        expect(isProductionTenant('scoutpass')).toBe(true);
        expect(isProductionTenant('some-dev-tenant')).toBe(false);
        expect(isProductionTenant(undefined)).toBe(false);
    });

    it('schema rejects nitro measurements with an invalid hex length', () => {
        const result = tenantConfigSchema.safeParse({
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            auth: {
                ...DEFAULT_LEARNCARD_TENANT_CONFIG.auth,
                sss: {
                    ...DEFAULT_LEARNCARD_TENANT_CONFIG.auth.sss,
                    escrowEnclaveMeasurements: [{ pcr0: 'too-short', pcr1: PCR1, pcr2: PCR2 }],
                },
            },
        });

        expect(result.success).toBe(false);
    });

    it('schema rejects an escrowEnclaveRootSha256 with an invalid hex length', () => {
        const result = tenantConfigSchema.safeParse({
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            auth: {
                ...DEFAULT_LEARNCARD_TENANT_CONFIG.auth,
                sss: {
                    ...DEFAULT_LEARNCARD_TENANT_CONFIG.auth.sss,
                    escrowEnclaveRootSha256: 'too-short',
                },
            },
        });

        expect(result.success).toBe(false);
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
        expect(config.tenantId).toBe('learncard');
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
