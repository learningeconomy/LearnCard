/**
 * authConfig Unit Tests
 *
 * Tests the environment-driven auth configuration for:
 * - Default values when no env vars are set
 * - VITE_ prefix reading
 * - REACT_APP_ prefix fallback
 * - VITE_ takes precedence over REACT_APP_
 * - Helper functions: shouldUseSSS, isAuthMigrationEnabled
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    getAuthConfig,
    shouldUseSSS,
    isAuthMigrationEnabled,
    isEmailBackupShareEnabled,
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
        'ENABLE_MIGRATION',
        'ENABLE_SSS_MIGRATION',
        'ENABLE_EMAIL_BACKUP_SHARE',
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
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    describe('defaults', () => {
        it('returns correct defaults when no env vars are set', () => {
            const config = getAuthConfig();

            expect(config.authProvider).toBe('firebase');
            expect(config.keyDerivation).toBe('sss');
            expect(config.serverUrl).toBe('http://localhost:5100/api');
            expect(config.enableMigration).toBe(false);
            expect(config.enableEmailBackupShare).toBe(true);
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

            const config = getAuthConfig();

            expect(config.serverUrl).toBe('https://custom.server/api');
        });

        it('reads VITE_ENABLE_MIGRATION=true', () => {
            setEnv({ VITE_ENABLE_MIGRATION: 'true' });

            const config = getAuthConfig();

            expect(config.enableMigration).toBe(true);
        });

        it('reads VITE_ENABLE_EMAIL_BACKUP_SHARE=false', () => {
            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'false' });

            const config = getAuthConfig();

            expect(config.enableEmailBackupShare).toBe(false);
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

            const config = getAuthConfig();

            expect(config.serverUrl).toBe('https://react-app.server/api');
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

            const config = getAuthConfig();

            expect(config.serverUrl).toBe('https://vite.server/api');
        });
    });

    describe('key derivation normalization', () => {
        it('normalizes unknown key derivation values to sss', () => {
            setEnv({ VITE_KEY_DERIVATION: 'unknown-provider' });

            const config = getAuthConfig();

            expect(config.keyDerivation).toBe('sss');
        });

        it('accepts web3auth explicitly', () => {
            setEnv({ VITE_KEY_DERIVATION: 'web3auth' });

            const config = getAuthConfig();

            expect(config.keyDerivation).toBe('web3auth');
        });
    });

    describe('boolean parsing', () => {
        it('enableMigration defaults to false', () => {
            const config = getAuthConfig();

            expect(config.enableMigration).toBe(false);
        });

        it('enableMigration is only true for "true"', () => {
            setEnv({ VITE_ENABLE_MIGRATION: 'true' });
            expect(getAuthConfig().enableMigration).toBe(true);

            setEnv({ VITE_ENABLE_MIGRATION: '1' });
            expect(getAuthConfig().enableMigration).toBe(false);

            setEnv({ VITE_ENABLE_MIGRATION: 'yes' });
            expect(getAuthConfig().enableMigration).toBe(false);
        });

        it('enableEmailBackupShare defaults to true', () => {
            const config = getAuthConfig();

            expect(config.enableEmailBackupShare).toBe(true);
        });

        it('enableEmailBackupShare is true for any value except "false"', () => {
            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'true' });
            expect(getAuthConfig().enableEmailBackupShare).toBe(true);

            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: '1' });
            expect(getAuthConfig().enableEmailBackupShare).toBe(true);

            setEnv({ VITE_ENABLE_EMAIL_BACKUP_SHARE: 'yes' });
            expect(getAuthConfig().enableEmailBackupShare).toBe(true);
        });

    });
});

describe('helper functions', () => {
    beforeEach(() => {
        clearAuthEnvVars();
    });

    afterEach(() => {
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

    describe('isAuthMigrationEnabled', () => {
        it('returns false by default', () => {
            expect(isAuthMigrationEnabled()).toBe(false);
        });

        it('returns false when explicitly disabled', () => {
            setEnv({ VITE_ENABLE_MIGRATION: 'false' });

            expect(isAuthMigrationEnabled()).toBe(false);
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
