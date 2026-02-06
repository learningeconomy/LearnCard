/**
 * Auth Coordinator Tests
 * 
 * Tests for the unified auth state machine.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
    AuthCoordinator,
    createAuthCoordinator,
    type UnifiedAuthState,
    type ServerKeyStatus,
    type AuthCoordinatorConfig,
    type AuthCoordinatorApi,
    type StorageFunctions,
} from './auth-coordinator';
import type { AuthProvider, AuthUser, RecoveryMethodInfo } from './types';
import { generateEd25519PrivateKey } from './crypto';
import { splitPrivateKey } from './sss';

const createMockStorage = (): StorageFunctions & { deviceShare: string | null } => ({
    deviceShare: null,
    storeDeviceShare: vi.fn(async function(this: any, share: string) {
        this.deviceShare = share;
    }),
    getDeviceShare: vi.fn(async function(this: any) {
        return this.deviceShare;
    }),
    hasDeviceShare: vi.fn(async function(this: any) {
        return this.deviceShare !== null;
    }),
    clearAllShares: vi.fn(async function(this: any) {
        this.deviceShare = null;
    }),
});

const createMockAuthProvider = (user: AuthUser | null = null): AuthProvider => ({
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
    getCurrentUser: vi.fn().mockResolvedValue(user),
    getProviderType: vi.fn().mockReturnValue('firebase'),
    signOut: vi.fn().mockResolvedValue(undefined),
});

const createMockApi = (status: Partial<ServerKeyStatus> = {}): AuthCoordinatorApi => ({
    fetchServerKeyStatus: vi.fn().mockResolvedValue({
        exists: false,
        keyProvider: null,
        primaryDid: null,
        recoveryMethods: [],
        authShare: null,
        ...status,
    }),
    storeAuthShare: vi.fn().mockResolvedValue(undefined),
    markMigrated: vi.fn().mockResolvedValue(undefined),
});

const mockAuthUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    providerType: 'firebase',
};

describe('AuthCoordinator', () => {

    describe('initialization', () => {

        it('should start in idle state', () => {
            const authProvider = createMockAuthProvider();
            const api = createMockApi();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000' },
                api
            );

            expect(coordinator.getState().status).toBe('idle');
        });

        it('should transition to idle if no authenticated user', async () => {
            const authProvider = createMockAuthProvider(null);
            const api = createMockApi();
            const storage = createMockStorage();
            const states: UnifiedAuthState[] = [];

            const coordinator = createAuthCoordinator(
                {
                    authProvider,
                    serverUrl: 'http://localhost:3000',
                    storage,
                    onStateChange: (s) => states.push(s),
                },
                api
            );

            await coordinator.initialize();

            expect(coordinator.getState().status).toBe('idle');
            expect(states.map(s => s.status)).toContain('authenticating');
        });

        it('should transition to needs_setup for new user', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({ exists: false });
            const storage = createMockStorage();
            const states: UnifiedAuthState[] = [];

            const coordinator = createAuthCoordinator(
                {
                    authProvider,
                    serverUrl: 'http://localhost:3000',
                    storage,
                    onStateChange: (s) => states.push(s),
                },
                api
            );

            await coordinator.initialize();

            expect(coordinator.getState().status).toBe('needs_setup');

            const state = coordinator.getState();
            if (state.status === 'needs_setup') {
                expect(state.authUser).toEqual(mockAuthUser);
            }
        });

        it('should transition to needs_migration for web3auth user', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({
                exists: true,
                keyProvider: 'web3auth',
                primaryDid: 'did:key:web3auth123',
            });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();

            expect(coordinator.getState().status).toBe('needs_migration');
        });

        it('should transition to needs_recovery when no device share', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const recoveryMethods: RecoveryMethodInfo[] = [
                { type: 'password', createdAt: new Date() },
            ];
            const api = createMockApi({
                exists: true,
                keyProvider: 'sss',
                primaryDid: 'did:key:sss123',
                recoveryMethods,
                authShare: 'mock-auth-share',
            });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();

            const state = coordinator.getState();
            expect(state.status).toBe('needs_recovery');

            if (state.status === 'needs_recovery') {
                expect(state.recoveryMethods).toEqual(recoveryMethods);
            }
        });

        it('should handle initialization errors gracefully', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi();
            const storage = createMockStorage();
            api.fetchServerKeyStatus = vi.fn().mockRejectedValue(new Error('Network error'));

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();

            const state = coordinator.getState();
            expect(state.status).toBe('error');

            if (state.status === 'error') {
                expect(state.error).toContain('Network error');
                expect(state.canRetry).toBe(true);
            }
        });
    });

    describe('setupNewKey', () => {

        it('should setup new key and transition to ready', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({ exists: false });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_setup');

            const privateKey = await generateEd25519PrivateKey();
            const did = 'did:key:test123';

            await coordinator.setupNewKey(privateKey, did);

            const state = coordinator.getState();
            expect(state.status).toBe('ready');

            if (state.status === 'ready') {
                expect(state.did).toBe(did);
                expect(state.privateKey).toBe(privateKey);
            }

            expect(api.storeAuthShare).toHaveBeenCalled();
        });

        it('should throw if not in needs_setup state', async () => {
            const authProvider = createMockAuthProvider(null);
            const api = createMockApi();
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();

            await expect(
                coordinator.setupNewKey('some-key', 'did:key:test')
            ).rejects.toThrow('Cannot setup key in state: idle');
        });
    });

    describe('migrate', () => {

        it('should migrate from web3auth and transition to ready', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({
                exists: true,
                keyProvider: 'web3auth',
                primaryDid: 'did:key:web3auth123',
            });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_migration');

            const privateKey = await generateEd25519PrivateKey();
            const did = 'did:key:migrated123';

            await coordinator.migrate(privateKey, did);

            const state = coordinator.getState();
            expect(state.status).toBe('ready');

            if (state.status === 'ready') {
                expect(state.privateKey).toBe(privateKey);
            }

            expect(api.storeAuthShare).toHaveBeenCalled();
            expect(api.markMigrated).toHaveBeenCalled();
        });

        it('should throw if not in needs_migration state', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({ exists: false });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_setup');

            await expect(
                coordinator.migrate('some-key', 'did:key:test')
            ).rejects.toThrow('Cannot migrate in state: needs_setup');
        });
    });

    describe('recover', () => {

        it('should recover with recovery share and transition to ready', async () => {
            const privateKey = await generateEd25519PrivateKey();
            const shares = await splitPrivateKey(privateKey);
            const did = 'did:key:recovered123';

            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({
                exists: true,
                keyProvider: 'sss',
                primaryDid: did,
                recoveryMethods: [{ type: 'password', createdAt: new Date() }],
                authShare: shares.authShare,
            });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                {
                    authProvider,
                    serverUrl: 'http://localhost:3000',
                    storage,
                    didFromPrivateKey: async (pk) => pk === privateKey ? did : 'wrong-did',
                },
                api
            );

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('needs_recovery');

            await coordinator.recover(shares.recoveryShare, did);

            const state = coordinator.getState();
            expect(state.status).toBe('ready');

            if (state.status === 'ready') {
                expect(state.privateKey).toBe(privateKey);
                expect(state.did).toBe(did);
            }
        });

        it('should throw if not in needs_recovery state', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({ exists: false });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();

            await expect(
                coordinator.recover('some-share', 'did:key:test')
            ).rejects.toThrow('Cannot recover in state: needs_setup');
        });
    });

    describe('logout', () => {

        it('should clear state and sign out', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({ exists: false });
            const storage = createMockStorage();

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();
            await coordinator.logout();

            expect(coordinator.getState().status).toBe('idle');
            expect(authProvider.signOut).toHaveBeenCalled();
        });
    });

    describe('retry', () => {

        it('should retry from error state', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi();
            const storage = createMockStorage();

            // First call fails, second succeeds
            api.fetchServerKeyStatus = vi.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    exists: false,
                    keyProvider: null,
                    primaryDid: null,
                    recoveryMethods: [],
                    authShare: null,
                });

            const coordinator = createAuthCoordinator(
                { authProvider, serverUrl: 'http://localhost:3000', storage },
                api
            );

            await coordinator.initialize();
            expect(coordinator.getState().status).toBe('error');

            await coordinator.retry();
            expect(coordinator.getState().status).toBe('needs_setup');
        });
    });

    describe('state transitions', () => {

        it('should emit state changes via callback', async () => {
            const authProvider = createMockAuthProvider(mockAuthUser);
            const api = createMockApi({ exists: false });
            const storage = createMockStorage();
            const states: string[] = [];

            const coordinator = createAuthCoordinator(
                {
                    authProvider,
                    serverUrl: 'http://localhost:3000',
                    storage,
                    onStateChange: (s) => states.push(s.status),
                },
                api
            );

            await coordinator.initialize();

            expect(states).toContain('authenticating');
            expect(states).toContain('authenticated');
            expect(states).toContain('checking_key_status');
            expect(states).toContain('needs_setup');
        });
    });
});
