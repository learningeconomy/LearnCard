/**
 * authConfig Unit Tests
 *
 * Tests the split-precedence auth configuration model:
 * - Provider/strategy selection: config > ENV > default
 * - Operational values (URLs, keys): ENV > config > default
 * - Default values when no env vars or config overrides are set
 * - VITE_ prefix reading
 * - REACT_APP_ prefix fallback
 * - VITE_ takes precedence over REACT_APP_
 * - Helper functions: shouldUseSSS, isEmailBackupShareEnabled
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    getAuthConfig,
    getSSSConfig,
    shouldUseSSS,
    isEmailBackupShareEnabled,
    setAuthConfigOverrides,
    clearAuthConfigOverrides,
} from '../authConfig';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const originalEnv = { ...process.env };

const setEnv = (vars: Record<string, string>) => {
    for (const [key, value] of Object.entries(vars)) {
        process.env[key] = value;
    }
};

const clearAuthEnvVars = () => {
    const prefixes = ['VITE_', 'REACT_APP_'];

    const suffixes = [
        'AUTH_PROVIDER',
        'KEY_DERIVATION',
        'KEY_DERIVATION_PROVIDER',
        'SSS_SERVER_URL',
        'ENABLE_EMAIL_BACKUP_SHARE',
        'REQUIRE_EMAIL_FOR_PHONE_USERS',
    ];

    for (const prefix of prefixes) {
        for (const suffix of suffixes) {
            delete process.env[`${prefix}${suffix}`];
        }
    }
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getAuthConfig', () => {
    beforeEach(() => {
        clearAuthEnvVars();
        clearAuthConfigOverrides();
    });

    afterEach(() => {
        clearAuthConfigOverrides();
        process.env = { ...originalEnv };
    });

    describe('defaults', () => {
        it('returns correct defaults when no env vars are set', () => {
            const config = getAuthConfig();

            expect(config.authProvider).toBe('firebase');
            expect(config.keyDerivation).toBe('sss');

            const sss = getSSSConfig();
            expect(sss.serverUrl).toBe('http://localhost:5100/api');
            expect(sss.enableEmailBackupShare).toBe(true);
            expect(sss.requireEmailForPhoneUsers).toBe(true);
        });
    });

    describe('VITE_ prefix reading', () => {
        it('reads VITE_AUTH_PROVIDER', () => {
            setEnv({ VITE_AUTH_PROVIDER: 'supertokens' });

            const config = getAuthConfig();

            expect(config.authProvider).toBe('supertokens');
        });

        it('reads VITE_KEY_DERIVATION', () => {
            setEnv({ VITE_KEY_DERIVATION: 'web3auth' });

            const config = getAuthConfig();

            expect(config.keyDerivation).toBe('web3auth');
        });

        it('reads VITE_SSS_SERVER_URL', () => {
            setEnv({ VITE_SSS_SERVER_URL: 'https://custom.server/api' });

            expect(getSSSConfig().serverUrl).toBe('https://custom.server/api');
        });

        it('reads VITE_ENABLE_EMAIL_BACKUP_SHARE=false', () => {
            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'false' });

            expect(getSSSConfig().enableEmailBackupShare).toBe(false);
        });

    });

    describe('REACT_APP_ prefix fallback', () => {
        it('falls back to REACT_APP_AUTH_PROVIDER', () => {
            setEnv({ REACT_APP_AUTH_PROVIDER: 'supertokens' });

            const config = getAuthConfig();

            expect(config.authProvider).toBe('supertokens');
        });

        it('falls back to REACT_APP_KEY_DERIVATION_PROVIDER', () => {
            setEnv({ REACT_APP_KEY_DERIVATION_PROVIDER: 'web3auth' });

            const config = getAuthConfig();

            expect(config.keyDerivation).toBe('web3auth');
        });

        it('falls back to REACT_APP_SSS_SERVER_URL', () => {
            setEnv({ REACT_APP_SSS_SERVER_URL: 'https://react-app.server/api' });

            expect(getSSSConfig().serverUrl).toBe('https://react-app.server/api');
        });
    });

    describe('VITE_ takes precedence over REACT_APP_', () => {
        it('prefers VITE_AUTH_PROVIDER over REACT_APP_AUTH_PROVIDER', () => {
            setEnv({
                VITE_AUTH_PROVIDER: 'vite-provider',
                REACT_APP_AUTH_PROVIDER: 'react-provider',
            });

            const config = getAuthConfig();

            expect(config.authProvider).toBe('vite-provider');
        });

        it('prefers VITE_SSS_SERVER_URL over REACT_APP_SSS_SERVER_URL', () => {
            setEnv({
                VITE_SSS_SERVER_URL: 'https://vite.server/api',
                REACT_APP_SSS_SERVER_URL: 'https://react.server/api',
            });

            expect(getSSSConfig().serverUrl).toBe('https://vite.server/api');
        });
    });

    describe('key derivation passthrough', () => {
        it('passes through unknown key derivation values (open string)', () => {
            setEnv({ VITE_KEY_DERIVATION: 'unknown-provider' });

            const config = getAuthConfig();

            expect(config.keyDerivation).toBe('unknown-provider');
        });

        it('accepts web3auth explicitly', () => {
            setEnv({ VITE_KEY_DERIVATION: 'web3auth' });

            const config = getAuthConfig();

            expect(config.keyDerivation).toBe('web3auth');
        });
    });

    describe('boolean parsing', () => {
        it('enableEmailBackupShare defaults to true', () => {
            expect(getSSSConfig().enableEmailBackupShare).toBe(true);
        });

        it('enableEmailBackupShare is true for any value except "false"', () => {
            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'true' });
            expect(getSSSConfig().enableEmailBackupShare).toBe(true);

            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: '1' });
            expect(getSSSConfig().enableEmailBackupShare).toBe(true);

            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'yes' });
            expect(getSSSConfig().enableEmailBackupShare).toBe(true);
        });

    });
});

describe('split-precedence: config wins for provider/strategy selection', () => {
    beforeEach(() => {
        clearAuthEnvVars();
        clearAuthConfigOverrides();
    });

    afterEach(() => {
        clearAuthConfigOverrides();
        process.env = { ...originalEnv };
    });

    it('tenant config authProvider overrides ENV var', () => {
        setEnv({ VITE_AUTH_PROVIDER: 'env-provider' });
        setAuthConfigOverrides({ authProvider: 'tenant-provider' as never });

        expect(getAuthConfig().authProvider).toBe('tenant-provider');
    });

    it('tenant config keyDerivation overrides ENV var', () => {
        setEnv({ VITE_KEY_DERIVATION: 'env-strategy' });
        setAuthConfigOverrides({ keyDerivation: 'tenant-strategy' });

        expect(getAuthConfig().keyDerivation).toBe('tenant-strategy');
    });

    it('falls back to ENV var when config does not set authProvider', () => {
        setEnv({ VITE_AUTH_PROVIDER: 'env-provider' });
        setAuthConfigOverrides({ keyDerivation: 'sss' });

        expect(getAuthConfig().authProvider).toBe('env-provider');
    });
});

describe('split-precedence: ENV wins for operational values', () => {
    beforeEach(() => {
        clearAuthEnvVars();
        clearAuthConfigOverrides();
    });

    afterEach(() => {
        clearAuthConfigOverrides();
        process.env = { ...originalEnv };
    });

    it('ENV SSS_SERVER_URL overrides tenant config sss.serverUrl', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { serverUrl: 'https://tenant-sss.example.com/api' },
            },
        });

        setEnv({ VITE_SSS_SERVER_URL: 'https://env-sss.example.com/api' });

        expect(getSSSConfig().serverUrl).toBe('https://env-sss.example.com/api');
    });

    it('falls back to tenant config sss.serverUrl when no ENV var', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { serverUrl: 'https://tenant-sss.example.com/api' },
            },
        });

        expect(getSSSConfig().serverUrl).toBe('https://tenant-sss.example.com/api');
    });

    it('ENV ENABLE_EMAIL_BACKUP_SHARE overrides tenant config value', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { enableEmailBackupShare: true },
            },
        });

        setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'false' });

        expect(getSSSConfig().enableEmailBackupShare).toBe(false);
    });

    it('falls back to tenant config enableEmailBackupShare when no ENV var', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { enableEmailBackupShare: false },
            },
        });

        expect(getSSSConfig().enableEmailBackupShare).toBe(false);
    });

    it('ENV REQUIRE_EMAIL_FOR_PHONE_USERS overrides tenant config value', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { requireEmailForPhoneUsers: true },
            },
        });

        setEnv({ VITE_REQUIRE_EMAIL_FOR_PHONE_USERS: 'false' });

        expect(getSSSConfig().requireEmailForPhoneUsers).toBe(false);
    });

    it('falls back to tenant config requireEmailForPhoneUsers when no ENV var', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { requireEmailForPhoneUsers: false },
            },
        });

        expect(getSSSConfig().requireEmailForPhoneUsers).toBe(false);
    });

    it('preserves extra tenant SSS config fields when ENV overrides specific values', () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: {
                    serverUrl: 'https://tenant.example.com/api',
                    customTenantField: 'preserved',
                },
            },
        });

        setEnv({ VITE_SSS_SERVER_URL: 'https://env.example.com/api' });

        const config = getAuthConfig();
        const sss = config.providerConfig.sss!;

        expect(sss.serverUrl).toBe('https://env.example.com/api');
        expect(sss.customTenantField).toBe('preserved');
    });

    it('ENV Web3Auth values override tenant config', () => {
        setAuthConfigOverrides({
            providerConfig: {
                web3Auth: {
                    clientId: 'tenant-client-id',
                    network: 'tenant-network',
                    verifierId: 'tenant-verifier',
                    rpcTarget: 'https://tenant-rpc.example.com',
                },
            },
        });

        setEnv({ VITE_WEB3AUTH_CLIENT_ID: 'env-client-id' });

        const w3a = getAuthConfig().providerConfig.web3Auth!;

        expect(w3a.clientId).toBe('env-client-id');
        expect(w3a.network).toBe('tenant-network');
        expect(w3a.verifierId).toBe('tenant-verifier');
        expect(w3a.rpcTarget).toBe('https://tenant-rpc.example.com');
    });

    it('falls back to tenant Web3Auth config when no ENV vars', () => {
        setAuthConfigOverrides({
            providerConfig: {
                web3Auth: {
                    clientId: 'tenant-client-id',
                    network: 'tenant-network',
                    verifierId: 'tenant-verifier',
                },
            },
        });

        const w3a = getAuthConfig().providerConfig.web3Auth!;

        expect(w3a.clientId).toBe('tenant-client-id');
        expect(w3a.network).toBe('tenant-network');
        expect(w3a.verifierId).toBe('tenant-verifier');
    });
});

describe('helper functions', () => {
    beforeEach(() => {
        clearAuthEnvVars();
        clearAuthConfigOverrides();
    });

    afterEach(() => {
        clearAuthConfigOverrides();
        process.env = { ...originalEnv };
    });

    describe('shouldUseSSS', () => {
        it('returns true by default', () => {
            expect(shouldUseSSS()).toBe(true);
        });

        it('returns false when key derivation is web3auth', () => {
            setEnv({ VITE_KEY_DERIVATION: 'web3auth' });

            expect(shouldUseSSS()).toBe(false);
        });
    });

    describe('isEmailBackupShareEnabled', () => {
        it('returns true by default', () => {
            expect(isEmailBackupShareEnabled()).toBe(true);
        });

        it('returns false when explicitly disabled', () => {
            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'false' });

            expect(isEmailBackupShareEnabled()).toBe(false);
        });
    });

});
