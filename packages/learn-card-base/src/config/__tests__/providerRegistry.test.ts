/**
 * providerRegistry Unit Tests
 *
 * Tests the factory registration/resolution pattern for:
 * - Registering and resolving auth provider factories
 * - Registering and resolving key derivation factories
 * - Error when no factory registered for a given name
 * - Duplicate registration (overwrites)
 * - Introspection helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
    registerAuthProviderFactory,
    registerKeyDerivationFactory,
    resolveAuthProvider,
    resolveKeyDerivation,
    getRegisteredAuthProviders,
    getRegisteredKeyDerivations,
} from '../providerRegistry';

import type { AuthConfig } from '../authConfig';
import type { AuthProvider, KeyDerivationStrategy } from '../../auth-coordinator/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseConfig: AuthConfig = {
    authProvider: 'firebase',
    keyDerivation: 'sss',
    serverUrl: 'http://localhost:5100/api',
    enableMigration: true,
};

const createMockAuthProvider = (): AuthProvider => ({
    getIdToken: vi.fn().mockResolvedValue('token'),
    getCurrentUser: vi.fn().mockResolvedValue(null),
    getProviderType: vi.fn().mockReturnValue('firebase'),
    signOut: vi.fn().mockResolvedValue(undefined),
});

const createMockKeyDerivation = (): KeyDerivationStrategy => ({
    name: 'test-sss',
    hasLocalKey: vi.fn().mockResolvedValue(false),
    getLocalKey: vi.fn().mockResolvedValue(null),
    storeLocalKey: vi.fn().mockResolvedValue(undefined),
    clearLocalKeys: vi.fn().mockResolvedValue(undefined),
    splitKey: vi.fn().mockResolvedValue({ localKey: 'l', remoteKey: 'r' }),
    reconstructKey: vi.fn().mockResolvedValue('pk'),
    fetchServerKeyStatus: vi.fn().mockResolvedValue({ exists: false, needsMigration: false, primaryDid: null, recoveryMethods: [], authShare: null }),
    storeAuthShare: vi.fn().mockResolvedValue(undefined),
    executeRecovery: vi.fn().mockResolvedValue({ privateKey: 'pk', did: 'did:key:z1' }),
    getPreservedStorageKeys: vi.fn().mockReturnValue([]),
    cleanup: vi.fn().mockResolvedValue(undefined),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('providerRegistry', () => {
    // Note: The registry is module-level singleton state. Earlier tests or the
    // app-level provider files may have already registered factories. We use
    // unique provider names in these tests to avoid collisions.

    describe('auth provider factories', () => {
        it('registers and resolves an auth provider factory', () => {
            const mockProvider = createMockAuthProvider();
            const factory = vi.fn().mockReturnValue(mockProvider);

            registerAuthProviderFactory('test-auth-1', factory);

            const result = resolveAuthProvider({ ...baseConfig, authProvider: 'test-auth-1' as 'firebase' });

            expect(factory).toHaveBeenCalledWith(expect.objectContaining({ authProvider: 'test-auth-1' }));
            expect(result).toBe(mockProvider);
        });

        it('factory can return null (e.g. no user yet)', () => {
            const factory = vi.fn().mockReturnValue(null);

            registerAuthProviderFactory('test-auth-null', factory);

            const result = resolveAuthProvider({ ...baseConfig, authProvider: 'test-auth-null' as 'firebase' });

            expect(result).toBeNull();
        });

        it('throws when no factory registered for the given name', () => {
            expect(() =>
                resolveAuthProvider({ ...baseConfig, authProvider: 'nonexistent-provider' as 'firebase' })
            ).toThrow('No auth provider factory registered for "nonexistent-provider"');
        });

        it('duplicate registration overwrites the previous factory', () => {
            const factory1 = vi.fn().mockReturnValue(createMockAuthProvider());
            const factory2 = vi.fn().mockReturnValue(createMockAuthProvider());

            registerAuthProviderFactory('test-auth-overwrite', factory1);
            registerAuthProviderFactory('test-auth-overwrite', factory2);

            resolveAuthProvider({ ...baseConfig, authProvider: 'test-auth-overwrite' as 'firebase' });

            expect(factory1).not.toHaveBeenCalled();
            expect(factory2).toHaveBeenCalled();
        });

        it('passes the full AuthConfig to the factory', () => {
            const factory = vi.fn().mockReturnValue(createMockAuthProvider());

            registerAuthProviderFactory('test-auth-config', factory);

            const customConfig = {
                ...baseConfig,
                authProvider: 'test-auth-config' as 'firebase',
                serverUrl: 'https://custom.server/api',
            };

            resolveAuthProvider(customConfig);

            expect(factory).toHaveBeenCalledWith(customConfig);
        });
    });

    describe('key derivation factories', () => {
        it('registers and resolves a key derivation factory', () => {
            const mockStrategy = createMockKeyDerivation();
            const factory = vi.fn().mockReturnValue(mockStrategy);

            registerKeyDerivationFactory('test-kd-1', factory);

            const result = resolveKeyDerivation({ ...baseConfig, keyDerivation: 'test-kd-1' as 'sss' });

            expect(factory).toHaveBeenCalledWith(expect.objectContaining({ keyDerivation: 'test-kd-1' }));
            expect(result).toBe(mockStrategy);
        });

        it('throws when no factory registered for the given name', () => {
            expect(() =>
                resolveKeyDerivation({ ...baseConfig, keyDerivation: 'nonexistent-kd' as 'sss' })
            ).toThrow('No key derivation factory registered for "nonexistent-kd"');
        });

        it('error message includes registered factory names', () => {
            registerKeyDerivationFactory('test-kd-listed', vi.fn().mockReturnValue(createMockKeyDerivation()));

            try {
                resolveKeyDerivation({ ...baseConfig, keyDerivation: 'missing-kd' as 'sss' });
            } catch (e) {
                expect((e as Error).message).toContain('test-kd-listed');
            }
        });

        it('duplicate registration overwrites the previous factory', () => {
            const factory1 = vi.fn().mockReturnValue(createMockKeyDerivation());
            const factory2 = vi.fn().mockReturnValue(createMockKeyDerivation());

            registerKeyDerivationFactory('test-kd-overwrite', factory1);
            registerKeyDerivationFactory('test-kd-overwrite', factory2);

            resolveKeyDerivation({ ...baseConfig, keyDerivation: 'test-kd-overwrite' as 'sss' });

            expect(factory1).not.toHaveBeenCalled();
            expect(factory2).toHaveBeenCalled();
        });
    });

    describe('introspection', () => {
        it('getRegisteredAuthProviders returns registered names', () => {
            registerAuthProviderFactory('test-introspect-auth', vi.fn());

            const names = getRegisteredAuthProviders();

            expect(names).toContain('test-introspect-auth');
        });

        it('getRegisteredKeyDerivations returns registered names', () => {
            registerKeyDerivationFactory('test-introspect-kd', vi.fn());

            const names = getRegisteredKeyDerivations();

            expect(names).toContain('test-introspect-kd');
        });
    });

});
