/**
 * AuthCoordinator Unit Tests
 *
 * Tests the core state machine transitions for:
 * - initialize() — private-key-first path, auth-provider-first path, all branching cases
 * - setupNewKey() — new user key setup
 * - migrate() — legacy → new key derivation strategy migration
 * - recover() — strategy-delegated recovery
 * - logout() — cleanup and state reset
 * - retry() — error recovery
 * - verifyKeyIntegrity() — health check
 * - AuthSessionError — typed auth session errors go to idle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthCoordinator, createAuthCoordinator } from '../AuthCoordinator';
import { AuthSessionError } from '../types';

import type {
    AuthProvider,
    AuthUser,
    AuthCoordinatorConfig,
    KeyDerivationStrategy,
    ServerKeyStatus,
    UnifiedAuthState,
} from '../types';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const mockUser: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    providerType: 'firebase',
};

const defaultServerStatus: ServerKeyStatus = {
    exists: true,
    needsMigration: false,
    primaryDid: 'did:key:z123',
    recoveryMethods: [],
    authShare: 'server-auth-share',
};

const createMockAuthProvider = (overrides?: Partial<AuthProvider>): AuthProvider => ({
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
    getCurrentUser: vi.fn().mockResolvedValue(mockUser),
    getProviderType: vi.fn().mockReturnValue('firebase'),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

const createMockKeyDerivation = (overrides?: Partial<KeyDerivationStrategy>): KeyDerivationStrategy => ({
    name: 'mock-sss',
    hasLocalKey: vi.fn().mockResolvedValue(true),
    getLocalKey: vi.fn().mockResolvedValue('local-key-abc'),
    storeLocalKey: vi.fn().mockResolvedValue(undefined),
    clearLocalKeys: vi.fn().mockResolvedValue(undefined),
    splitKey: vi.fn().mockResolvedValue({ localKey: 'local-split', remoteKey: 'remote-split' }),
    reconstructKey: vi.fn().mockResolvedValue('reconstructed-private-key'),
    fetchServerKeyStatus: vi.fn().mockResolvedValue(defaultServerStatus),
    storeAuthShare: vi.fn().mockResolvedValue(undefined),
    markMigrated: vi.fn().mockResolvedValue(undefined),
    executeRecovery: vi.fn().mockResolvedValue({ privateKey: 'recovered-pk', did: 'did:key:z123' }),
    getPreservedStorageKeys: vi.fn().mockReturnValue(['lcb-sss-keys']),
    cleanup: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

interface SetupOptions {
    authProvider?: Partial<AuthProvider>;
    keyDerivation?: Partial<KeyDerivationStrategy>;
    config?: Partial<Omit<AuthCoordinatorConfig, 'authProvider' | 'keyDerivation'>>;
}

const setup = (options: SetupOptions = {}) => {
    const stateChanges: UnifiedAuthState[] = [];

    const authProvider = createMockAuthProvider(options.authProvider);
    const keyDerivation = createMockKeyDerivation(options.keyDerivation);

    const onStateChange = vi.fn((state: UnifiedAuthState) => {
        stateChanges.push(state);
    });

    const coordinator = createAuthCoordinator({
        authProvider,
        keyDerivation,
        onStateChange,
        didFromPrivateKey: vi.fn().mockResolvedValue('did:key:z123'),
        ...options.config,
    });

    return { coordinator, authProvider, keyDerivation, onStateChange, stateChanges };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthCoordinator', () => {
    describe('initial state', () => {
        it('starts in idle state', () => {
            const { coordinator } = setup();

            expect(coordinator.getState()).toEqual({ status: 'idle' });
        });
    });

    // -----------------------------------------------------------------------
    // initialize() — private-key-first path
    // -----------------------------------------------------------------------

    describe('initialize() — private-key-first path', () => {
        it('reaches ready immediately when cached private key exists', async () => {
            const { coordinator, stateChanges } = setup({
                config: {
                    getCachedPrivateKey: vi.fn().mockResolvedValue('cached-pk'),
                    didFromPrivateKey: vi.fn().mockResolvedValue('did:key:zCached'),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('ready');

            if (result.status === 'ready') {
                expect(result.privateKey).toBe('cached-pk');
                expect(result.did).toBe('did:key:zCached');
                expect(result.authSessionValid).toBe(true);
            }

            const statuses = stateChanges.map(s => s.status);
            expect(statuses).toContain('deriving_key');
            expect(statuses[statuses.length - 1]).toBe('ready');
        });

        it('reaches ready with authSessionValid=false when auth check fails', async () => {
            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockRejectedValue(new AuthSessionError('No Firebase user', 'no_session')),
                },
                config: {
                    getCachedPrivateKey: vi.fn().mockResolvedValue('cached-pk'),
                    didFromPrivateKey: vi.fn().mockResolvedValue('did:key:zCached'),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('ready');

            if (result.status === 'ready') {
                expect(result.authSessionValid).toBe(false);
                expect(result.authUser).toBeUndefined();
            }
        });

        it('falls through to auth path when cached key returns null', async () => {
            const { coordinator, stateChanges } = setup({
                config: {
                    getCachedPrivateKey: vi.fn().mockResolvedValue(null),
                },
            });

            await coordinator.initialize();

            const statuses = stateChanges.map(s => s.status);
            expect(statuses).toContain('authenticating');
        });

        it('falls through to auth path when DID derivation returns empty', async () => {
            const { coordinator, stateChanges } = setup({
                config: {
                    getCachedPrivateKey: vi.fn().mockResolvedValue('some-key'),
                    didFromPrivateKey: vi.fn().mockResolvedValue(''),
                },
            });

            await coordinator.initialize();

            const statuses = stateChanges.map(s => s.status);
            expect(statuses).toContain('authenticating');
        });

        it('falls through to auth path when cached key check throws', async () => {
            const { coordinator, stateChanges } = setup({
                config: {
                    getCachedPrivateKey: vi.fn().mockRejectedValue(new Error('storage error')),
                },
            });

            await coordinator.initialize();

            const statuses = stateChanges.map(s => s.status);
            expect(statuses).toContain('authenticating');
        });
    });

    // -----------------------------------------------------------------------
    // initialize() — auth-provider-first path
    // -----------------------------------------------------------------------

    describe('initialize() — auth-provider-first path', () => {
        it('goes to idle when no user is authenticated', async () => {
            const { coordinator, stateChanges } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockResolvedValue(null),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('idle');

            const statuses = stateChanges.map(s => s.status);
            expect(statuses).toContain('authenticating');
            expect(statuses[statuses.length - 1]).toBe('idle');
        });

        it('goes to needs_setup when server has no record', async () => {
            const { coordinator } = setup({
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_setup');

            if (result.status === 'needs_setup') {
                expect(result.authUser).toEqual(mockUser);
            }
        });

        it('goes to needs_migration when no server record but account is old (legacy account)', async () => {
            const oldUser: AuthUser = {
                ...mockUser,
                createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            };

            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockResolvedValue(oldUser),
                },
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
                config: {
                    legacyAccountThresholdMs: 5 * 60 * 1000, // 5 minutes
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_migration');

            if (result.status === 'needs_migration') {
                expect(result.authUser.createdAt).toBeDefined();
            }
        });

        it('goes to needs_setup when no server record and account is fresh', async () => {
            const freshUser: AuthUser = {
                ...mockUser,
                createdAt: new Date(Date.now() - 30 * 1000), // 30 seconds ago
            };

            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockResolvedValue(freshUser),
                },
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
                config: {
                    legacyAccountThresholdMs: 5 * 60 * 1000, // 5 minutes
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_setup');
        });

        it('goes to needs_setup when no server record and threshold is 0 (disabled)', async () => {
            const oldUser: AuthUser = {
                ...mockUser,
                createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            };

            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockResolvedValue(oldUser),
                },
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
                // No legacyAccountThresholdMs → defaults to 0 (disabled)
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_setup');
        });

        it('goes to needs_setup when no server record and no createdAt on user', async () => {
            // mockUser has no createdAt by default
            const { coordinator } = setup({
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
                config: {
                    legacyAccountThresholdMs: 5 * 60 * 1000,
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_setup');
        });

        it('goes to needs_migration when needsMigration is true', async () => {
            const { coordinator } = setup({
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: true,
                        primaryDid: 'did:key:zOld',
                        recoveryMethods: [],
                        authShare: 'old-share',
                    } satisfies ServerKeyStatus),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_migration');

            if (result.status === 'needs_migration') {
                expect(result.authUser).toEqual(mockUser);
            }
        });

        it('goes to needs_recovery (new_device) when no local key exists', async () => {
            const recoveryMethods = [{ type: 'password' as const, createdAt: new Date() }];

            const { coordinator } = setup({
                keyDerivation: {
                    hasLocalKey: vi.fn().mockResolvedValue(false),
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: false,
                        primaryDid: 'did:key:z123',
                        recoveryMethods,
                        authShare: 'server-share',
                    } satisfies ServerKeyStatus),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_recovery');

            if (result.status === 'needs_recovery') {
                expect(result.recoveryMethods).toEqual(recoveryMethods);
                expect(result.recoveryReason).toBe('new_device');
            }
        });

        it('goes to needs_recovery (missing_server_data) when local key exists but no auth share', async () => {
            const { coordinator } = setup({
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: false,
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_recovery');

            if (result.status === 'needs_recovery') {
                expect(result.recoveryReason).toBe('missing_server_data');
            }
        });

        it('reaches ready when both local and server keys are present', async () => {
            const { coordinator, stateChanges } = setup();

            const result = await coordinator.initialize();

            expect(result.status).toBe('ready');

            if (result.status === 'ready') {
                expect(result.privateKey).toBe('reconstructed-private-key');
                expect(result.authSessionValid).toBe(true);
                expect(result.authUser).toEqual(mockUser);
            }

            const statuses = stateChanges.map(s => s.status);
            expect(statuses).toContain('authenticating');
            expect(statuses).toContain('authenticated');
            expect(statuses).toContain('checking_key_status');
            expect(statuses).toContain('deriving_key');
            expect(statuses).toContain('ready');
        });

        it('derives DID from private key when server primaryDid is null', async () => {
            const didFromPrivateKey = vi.fn().mockResolvedValue('did:key:zDerived');

            const { coordinator } = setup({
                config: { didFromPrivateKey },
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: 'placeholder',
                    } satisfies ServerKeyStatus),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('ready');

            if (result.status === 'ready') {
                expect(result.did).toBe('did:key:zDerived');
                expect(didFromPrivateKey).toHaveBeenCalledWith('reconstructed-private-key');
            }
        });

        it('sets empty DID when primaryDid is null and no didFromPrivateKey', async () => {
            const { coordinator } = setup({
                config: { didFromPrivateKey: undefined },
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: 'placeholder',
                    } satisfies ServerKeyStatus),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('ready');

            if (result.status === 'ready') {
                expect(result.did).toBe('');
            }
        });

        it('goes to needs_recovery (stale_local_key) on DID mismatch', async () => {
            const { coordinator } = setup({
                config: {
                    didFromPrivateKey: vi.fn().mockResolvedValue('did:key:zWrong'),
                },
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: false,
                        primaryDid: 'did:key:zExpected',
                        recoveryMethods: [],
                        authShare: 'server-share',
                    } satisfies ServerKeyStatus),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('needs_recovery');

            if (result.status === 'needs_recovery') {
                expect(result.recoveryReason).toBe('stale_local_key');
            }
        });

        it('goes to idle (not error) when AuthSessionError is thrown', async () => {
            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockRejectedValue(
                        new AuthSessionError('No Firebase user', 'no_session')
                    ),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('idle');
        });

        it('goes to error on unexpected failures', async () => {
            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockRejectedValue(new Error('Network failure')),
                },
            });

            const result = await coordinator.initialize();

            expect(result.status).toBe('error');

            if (result.status === 'error') {
                expect(result.error).toBe('Network failure');
                expect(result.canRetry).toBe(true);
            }
        });
    });

    // -----------------------------------------------------------------------
    // setupNewKey()
    // -----------------------------------------------------------------------

    describe('setupNewKey()', () => {
        it('splits key, stores locally and remotely, then reaches ready', async () => {
            const { coordinator, keyDerivation } = setup({
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
            });

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_setup');

            const result = await coordinator.setupNewKey('new-private-key', 'did:key:zNew');

            expect(result.status).toBe('ready');

            if (result.status === 'ready') {
                expect(result.privateKey).toBe('new-private-key');
                expect(result.did).toBe('did:key:zNew');
            }

            expect(keyDerivation.splitKey).toHaveBeenCalledWith('new-private-key');
            expect(keyDerivation.storeLocalKey).toHaveBeenCalledWith('local-split');
            expect(keyDerivation.storeAuthShare).toHaveBeenCalledWith('mock-token', 'firebase', 'remote-split', 'did:key:zNew');
        });

        it('throws when called in wrong state', async () => {
            const { coordinator } = setup();

            await expect(coordinator.setupNewKey('key', 'did')).rejects.toThrow(
                'Cannot setup key in state: idle'
            );
        });

        it('goes to error on failure and preserves previous state', async () => {
            const { coordinator } = setup({
                keyDerivation: {
                    splitKey: vi.fn().mockRejectedValue(new Error('Split failed')),
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
            });

            await coordinator.initialize();

            const result = await coordinator.setupNewKey('key', 'did');

            expect(result.status).toBe('error');

            if (result.status === 'error') {
                expect(result.error).toBe('Split failed');
                expect(result.previousState?.status).toBe('needs_setup');
            }
        });

        it('calls sendEmailBackupShare when strategy supports it and user has email', async () => {
            const sendEmailBackupShare = vi.fn().mockResolvedValue(undefined);

            const { coordinator } = setup({
                keyDerivation: {
                    sendEmailBackupShare,
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
            });

            await coordinator.initialize();

            await coordinator.setupNewKey('new-private-key', 'did:key:zNew');

            expect(sendEmailBackupShare).toHaveBeenCalledWith(
                'mock-token',
                'firebase',
                'new-private-key',
                'test@example.com'
            );
        });

        it('does not call sendEmailBackupShare when user has no email', async () => {
            const sendEmailBackupShare = vi.fn().mockResolvedValue(undefined);

            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn().mockResolvedValue({
                        id: 'user-123',
                        providerType: 'firebase',
                        // no email
                    }),
                },
                keyDerivation: {
                    sendEmailBackupShare,
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
            });

            await coordinator.initialize();

            await coordinator.setupNewKey('new-private-key', 'did:key:zNew');

            expect(sendEmailBackupShare).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // migrate()
    // -----------------------------------------------------------------------

    describe('migrate()', () => {
        it('splits key, stores shares, marks migrated, then reaches ready', async () => {
            const { coordinator, keyDerivation } = setup({
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: true,
                        primaryDid: 'did:key:zOld',
                        recoveryMethods: [],
                        authShare: 'old-share',
                    } satisfies ServerKeyStatus),
                },
            });

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_migration');

            const result = await coordinator.migrate('web3auth-key', 'did:key:zOld');

            expect(result.status).toBe('ready');
            expect(keyDerivation.storeAuthShare).toHaveBeenCalled();
            expect(keyDerivation.markMigrated).toHaveBeenCalledWith('mock-token', 'firebase');
        });

        it('throws when called in wrong state', async () => {
            const { coordinator } = setup();

            await expect(coordinator.migrate('key', 'did')).rejects.toThrow(
                'Cannot migrate in state: idle'
            );
        });
    });

    // -----------------------------------------------------------------------
    // setMigrationData()
    // -----------------------------------------------------------------------

    describe('setMigrationData()', () => {
        const setupForMigration = () => setup({
            keyDerivation: {
                fetchServerKeyStatus: vi.fn().mockResolvedValue({
                    exists: true,
                    needsMigration: true,
                    primaryDid: 'did:key:zOld',
                    recoveryMethods: [],
                    authShare: 'old-share',
                } satisfies ServerKeyStatus),
            },
        });

        it('attaches data to the needs_migration state', async () => {
            const { coordinator, stateChanges } = setupForMigration();

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_migration');

            coordinator.setMigrationData({ web3AuthKey: 'extracted-key-abc' });

            const state = coordinator.getState();

            expect(state.status).toBe('needs_migration');

            if (state.status === 'needs_migration') {
                expect(state.migrationData).toEqual({ web3AuthKey: 'extracted-key-abc' });
            }

            // Verify onStateChange was called with the updated state
            const lastChange = stateChanges[stateChanges.length - 1];
            expect(lastChange.status).toBe('needs_migration');

            if (lastChange.status === 'needs_migration') {
                expect(lastChange.migrationData?.web3AuthKey).toBe('extracted-key-abc');
            }
        });

        it('merges with existing migration data', async () => {
            const { coordinator } = setupForMigration();

            await coordinator.initialize();

            coordinator.setMigrationData({ web3AuthKey: 'key-1' });
            coordinator.setMigrationData({ extraInfo: 'something' });

            const state = coordinator.getState();

            if (state.status === 'needs_migration') {
                expect(state.migrationData).toEqual({
                    web3AuthKey: 'key-1',
                    extraInfo: 'something',
                });
            }
        });

        it('throws when called in wrong state', () => {
            const { coordinator } = setup();

            expect(() => coordinator.setMigrationData({ key: 'val' })).toThrow(
                'Cannot set migration data in state: idle'
            );
        });
    });

    // -----------------------------------------------------------------------
    // recover()
    // -----------------------------------------------------------------------

    describe('recover()', () => {
        const setupForRecovery = () => {
            const recoveryMethods = [{ type: 'password' as const, createdAt: new Date() }];

            return setup({
                keyDerivation: {
                    hasLocalKey: vi.fn().mockResolvedValue(false),
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: false,
                        primaryDid: 'did:key:z123',
                        recoveryMethods,
                        authShare: 'server-share',
                    } satisfies ServerKeyStatus),
                    executeRecovery: vi.fn().mockResolvedValue({ privateKey: 'recovered-pk', did: 'did:key:z123' }),
                },
                config: {
                    didFromPrivateKey: vi.fn().mockResolvedValue('did:key:z123'),
                },
            });
        };

        it('delegates to strategy.executeRecovery and reaches ready', async () => {
            const { coordinator, keyDerivation } = setupForRecovery();

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_recovery');

            const input = { method: 'password', password: 'test123' };
            const result = await coordinator.recover(input);

            expect(result.status).toBe('ready');

            if (result.status === 'ready') {
                expect(result.privateKey).toBe('recovered-pk');
                expect(result.did).toBe('did:key:z123');
            }

            expect(keyDerivation.executeRecovery).toHaveBeenCalledWith({
                token: 'mock-token',
                providerType: 'firebase',
                input,
            });
        });

        it('throws when called in wrong state', async () => {
            const { coordinator } = setup();

            await expect(
                coordinator.recover({ method: 'password', password: 'test' })
            ).rejects.toThrow('Cannot recover in state: idle');
        });

        it('goes to error when strategy.executeRecovery fails', async () => {
            const s = setup({
                keyDerivation: {
                    hasLocalKey: vi.fn().mockResolvedValue(false),
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: true,
                        needsMigration: false,
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [{ type: 'password' as const, createdAt: new Date() }],
                        authShare: 'server-share',
                    } satisfies ServerKeyStatus),
                    executeRecovery: vi.fn().mockRejectedValue(new Error('No auth share found on server')),
                },
            });

            await s.coordinator.initialize();

            const result = await s.coordinator.recover({ method: 'password', password: 'wrong' });

            expect(result.status).toBe('error');

            if (result.status === 'error') {
                expect(result.error).toBe('No auth share found on server');
                expect(result.previousState?.status).toBe('needs_recovery');
            }
        });
    });

    // -----------------------------------------------------------------------
    // logout()
    // -----------------------------------------------------------------------

    describe('logout()', () => {
        it('signs out, calls cleanup + onLogout, preserves device share, and returns to idle', async () => {
            const onLogout = vi.fn().mockResolvedValue(undefined);

            const { coordinator, authProvider, keyDerivation } = setup({
                config: { onLogout },
            });

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('ready');

            await coordinator.logout();

            expect(authProvider.signOut).toHaveBeenCalled();
            expect(keyDerivation.clearLocalKeys).not.toHaveBeenCalled();
            expect(keyDerivation.cleanup).toHaveBeenCalled();
            expect(onLogout).toHaveBeenCalled();
            expect(coordinator.getState().status).toBe('idle');
        });

        it('works without onLogout callback', async () => {
            const { coordinator } = setup();

            await coordinator.initialize();
            await coordinator.logout();

            expect(coordinator.getState().status).toBe('idle');
        });
    });

    // -----------------------------------------------------------------------
    // forgetDevice()
    // -----------------------------------------------------------------------

    describe('forgetDevice()', () => {
        it('clears local keys (device share)', async () => {
            const { coordinator, keyDerivation } = setup();

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('ready');

            await coordinator.forgetDevice();

            expect(keyDerivation.clearLocalKeys).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // retry()
    // -----------------------------------------------------------------------

    describe('retry()', () => {
        it('returns current state if not in error', async () => {
            const { coordinator } = setup();

            const result = await coordinator.retry();

            expect(result.status).toBe('idle');
        });

        it('re-initializes from error state', async () => {
            const { coordinator } = setup({
                authProvider: {
                    getCurrentUser: vi.fn()
                        // First call fails
                        .mockRejectedValueOnce(new Error('Network failure'))
                        // Second call succeeds
                        .mockResolvedValueOnce(mockUser),
                },
            });

            const errorResult = await coordinator.initialize();
            expect(errorResult.status).toBe('error');

            const retryResult = await coordinator.retry();
            expect(retryResult.status).toBe('ready');
        });
    });

    // -----------------------------------------------------------------------
    // verifyKeyIntegrity()
    // -----------------------------------------------------------------------

    describe('verifyKeyIntegrity()', () => {
        it('returns false when not in ready state', async () => {
            const { coordinator } = setup();

            const result = await coordinator.verifyKeyIntegrity();

            expect(result).toBe(false);
        });

        it('returns true when keys verify successfully', async () => {
            const mockVerifyKeys = vi.fn().mockResolvedValue(true);

            const { coordinator } = setup({
                keyDerivation: {
                    verifyKeys: mockVerifyKeys,
                },
            });

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('ready');

            const result = await coordinator.verifyKeyIntegrity();

            expect(result).toBe(true);
            expect(mockVerifyKeys).toHaveBeenCalled();
        });

        it('returns false when key verification fails', async () => {
            const { coordinator } = setup({
                keyDerivation: {
                    verifyKeys: vi.fn().mockResolvedValue(false),
                },
            });

            await coordinator.initialize();

            const result = await coordinator.verifyKeyIntegrity();

            expect(result).toBe(false);
        });

        it('falls back to DID comparison when verifyKeys is not available', async () => {
            const { coordinator } = setup({
                keyDerivation: {
                    verifyKeys: undefined,
                },
                config: {
                    didFromPrivateKey: vi.fn().mockResolvedValue('did:key:z123'),
                },
            });

            await coordinator.initialize();

            const result = await coordinator.verifyKeyIntegrity();

            expect(result).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // onStateChange callback
    // -----------------------------------------------------------------------

    describe('onStateChange', () => {
        it('fires for every state transition during initialize', async () => {
            const { coordinator, onStateChange } = setup();

            await coordinator.initialize();

            // authenticating, authenticated, checking_key_status, deriving_key, ready
            expect(onStateChange).toHaveBeenCalledTimes(5);
        });

        it('fires for transitions during setupNewKey', async () => {
            const { coordinator, onStateChange } = setup({
                keyDerivation: {
                    fetchServerKeyStatus: vi.fn().mockResolvedValue({
                        exists: false,
                        needsMigration: false,
                        primaryDid: null,
                        recoveryMethods: [],
                        authShare: null,
                    } satisfies ServerKeyStatus),
                },
            });

            await coordinator.initialize();

            const callsBefore = onStateChange.mock.calls.length;

            await coordinator.setupNewKey('key', 'did');

            // deriving_key, ready
            expect(onStateChange.mock.calls.length - callsBefore).toBe(2);
        });
    });

    // -----------------------------------------------------------------------
    // createAuthCoordinator factory
    // -----------------------------------------------------------------------

    describe('createAuthCoordinator()', () => {
        it('returns an AuthCoordinator instance', () => {
            const coordinator = createAuthCoordinator({
                authProvider: createMockAuthProvider(),
                keyDerivation: createMockKeyDerivation(),
            });

            expect(coordinator).toBeInstanceOf(AuthCoordinator);
        });
    });
});
