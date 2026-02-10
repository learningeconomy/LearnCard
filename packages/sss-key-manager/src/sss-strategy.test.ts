/**
 * createSSSStrategy Contract Tests
 *
 * Verifies that createSSSStrategy returns an object conforming to the
 * KeyDerivationStrategy interface used by AuthCoordinator. These tests
 * use an in-memory storage mock and mock fetch to avoid real network calls.
 *
 * Tests:
 * - Strategy shape (all required methods present)
 * - Local key lifecycle (store, get, has, clear)
 * - Key splitting and reconstruction
 * - fetchServerKeyStatus parsing
 * - storeAuthShare + markMigrated server calls
 * - getPreservedStorageKeys returns expected DB name
 * - Custom storage injection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createSSSStrategy } from './sss-strategy';

import type { SSSStorageFunctions } from './sss-strategy';
import type { SSSKeyDerivationStrategy } from './types';

// ---------------------------------------------------------------------------
// In-memory storage mock
// ---------------------------------------------------------------------------

const DEFAULT_KEY = 'device';

const createMemoryStorage = (): SSSStorageFunctions & { _store: Map<string, string> } => {
    const store = new Map<string, string>();

    return {
        _store: store,

        storeDeviceShare: vi.fn(async (share: string, id?: string) => {
            store.set(id ?? DEFAULT_KEY, share);
        }),

        getDeviceShare: vi.fn(async (id?: string) => {
            return store.get(id ?? DEFAULT_KEY) ?? null;
        }),

        hasDeviceShare: vi.fn(async (id?: string) => {
            return store.has(id ?? DEFAULT_KEY);
        }),

        clearAllShares: vi.fn(async (id?: string) => {
            if (id) {
                store.delete(id);
            } else {
                store.clear();
            }
        }),
    };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createSSSStrategy', () => {
    let strategy: SSSKeyDerivationStrategy;
    let storage: ReturnType<typeof createMemoryStorage>;

    beforeEach(() => {
        storage = createMemoryStorage();

        strategy = createSSSStrategy({
            serverUrl: 'http://test-server:5100/api',
            storage,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // -----------------------------------------------------------------------
    // Shape / interface conformance
    // -----------------------------------------------------------------------

    describe('interface conformance', () => {
        it('has all required KeyDerivationStrategy methods', () => {
            expect(strategy.name).toBe('sss');

            expect(typeof strategy.hasLocalKey).toBe('function');
            expect(typeof strategy.getLocalKey).toBe('function');
            expect(typeof strategy.storeLocalKey).toBe('function');
            expect(typeof strategy.clearLocalKeys).toBe('function');

            expect(typeof strategy.splitKey).toBe('function');
            expect(typeof strategy.reconstructKey).toBe('function');

            expect(typeof strategy.fetchServerKeyStatus).toBe('function');
            expect(typeof strategy.storeAuthShare).toBe('function');

            expect(typeof strategy.executeRecovery).toBe('function');
            expect(typeof strategy.getPreservedStorageKeys).toBe('function');
            expect(typeof strategy.cleanup).toBe('function');
        });

        it('has optional methods', () => {
            expect(typeof strategy.markMigrated).toBe('function');
            expect(typeof strategy.verifyKeys).toBe('function');
            expect(typeof strategy.setupRecoveryMethod).toBe('function');
            expect(typeof strategy.getAvailableRecoveryMethods).toBe('function');
            expect(typeof strategy.setActiveUser).toBe('function');
        });
    });

    // -----------------------------------------------------------------------
    // Local key lifecycle
    // -----------------------------------------------------------------------

    describe('local key lifecycle', () => {
        it('hasLocalKey returns false initially', async () => {
            expect(await strategy.hasLocalKey()).toBe(false);
        });

        it('storeLocalKey → hasLocalKey returns true', async () => {
            await strategy.storeLocalKey('test-share');

            expect(await strategy.hasLocalKey()).toBe(true);
        });

        it('storeLocalKey → getLocalKey returns the stored share', async () => {
            await strategy.storeLocalKey('my-device-share');

            expect(await strategy.getLocalKey()).toBe('my-device-share');
        });

        it('clearLocalKeys removes all shares', async () => {
            await strategy.storeLocalKey('share-to-clear');

            expect(await strategy.hasLocalKey()).toBe(true);

            await strategy.clearLocalKeys();

            expect(await strategy.hasLocalKey()).toBe(false);
            expect(await strategy.getLocalKey()).toBeNull();
        });

        it('delegates to the injected storage with undefined id when no active user', async () => {
            await strategy.storeLocalKey('delegated-share');

            expect(storage.storeDeviceShare).toHaveBeenCalledWith('delegated-share', undefined);

            await strategy.getLocalKey();

            expect(storage.getDeviceShare).toHaveBeenCalledWith(undefined);

            await strategy.hasLocalKey();

            expect(storage.hasDeviceShare).toHaveBeenCalledWith(undefined);

            await strategy.clearLocalKeys();

            expect(storage.clearAllShares).toHaveBeenCalledWith(undefined);
        });
    });

    // -----------------------------------------------------------------------
    // Per-user storage scoping
    // -----------------------------------------------------------------------

    describe('setActiveUser', () => {
        it('scopes storage calls to the given user ID', async () => {
            strategy.setActiveUser!('user-abc');

            await strategy.storeLocalKey('share-for-abc');

            expect(storage.storeDeviceShare).toHaveBeenCalledWith(
                'share-for-abc',
                'sss-device-share:user-abc'
            );

            await strategy.getLocalKey();

            expect(storage.getDeviceShare).toHaveBeenCalledWith('sss-device-share:user-abc');
        });

        it('allows multiple users to coexist without overwriting', async () => {
            // Store share for user A
            strategy.setActiveUser!('user-a');
            await strategy.storeLocalKey('share-a');

            // Store share for user B
            strategy.setActiveUser!('user-b');
            await strategy.storeLocalKey('share-b');

            // Switch back to user A — share should still be there
            strategy.setActiveUser!('user-a');
            expect(await strategy.getLocalKey()).toBe('share-a');

            // User B's share is also intact
            strategy.setActiveUser!('user-b');
            expect(await strategy.getLocalKey()).toBe('share-b');
        });

        it('clearLocalKeys only removes the active user share', async () => {
            strategy.setActiveUser!('user-a');
            await strategy.storeLocalKey('share-a');

            strategy.setActiveUser!('user-b');
            await strategy.storeLocalKey('share-b');

            // Clear user B
            await strategy.clearLocalKeys();

            expect(await strategy.hasLocalKey()).toBe(false);

            // User A is untouched
            strategy.setActiveUser!('user-a');
            expect(await strategy.hasLocalKey()).toBe(true);
            expect(await strategy.getLocalKey()).toBe('share-a');
        });
    });

    // -----------------------------------------------------------------------
    // Key splitting and reconstruction
    // -----------------------------------------------------------------------

    describe('splitKey and reconstructKey', () => {
        it('splitKey returns localKey and remoteKey', async () => {
            const result = await strategy.splitKey('a'.repeat(64));

            expect(result).toHaveProperty('localKey');
            expect(result).toHaveProperty('remoteKey');

            expect(typeof result.localKey).toBe('string');
            expect(typeof result.remoteKey).toBe('string');

            expect(result.localKey.length).toBeGreaterThan(0);
            expect(result.remoteKey.length).toBeGreaterThan(0);
        });

        it('reconstructKey reconstitutes the original key from shares', async () => {
            const originalKey = 'a1b2c3d4e5f6'.padEnd(64, '0');

            const { localKey, remoteKey } = await strategy.splitKey(originalKey);

            const reconstructed = await strategy.reconstructKey(localKey, remoteKey);

            expect(reconstructed).toBe(originalKey);
        });
    });

    // -----------------------------------------------------------------------
    // fetchServerKeyStatus
    // -----------------------------------------------------------------------

    describe('fetchServerKeyStatus', () => {
        it('returns exists:false when server returns 404', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 404 })
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.exists).toBe(false);
            expect(status.needsMigration).toBe(false);
            expect(status.primaryDid).toBeNull();
            expect(status.authShare).toBeNull();
        });

        it('parses server response with string authShare', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    authShare: 'raw-auth-share-string',
                    keyProvider: 'sss',
                    primaryDid: 'did:key:z123',
                    recoveryMethods: [{ type: 'password', createdAt: '2024-01-01' }],
                }), { status: 200 })
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.exists).toBe(true);
            expect(status.needsMigration).toBe(false);
            expect(status.primaryDid).toBe('did:key:z123');
            expect(status.authShare).toBe('raw-auth-share-string');
            expect(status.recoveryMethods).toHaveLength(1);
        });

        it('parses server response with object authShare (encrypted envelope)', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    authShare: { encryptedData: 'encrypted-share', iv: 'iv-value', encryptedDek: 'dek' },
                    keyProvider: 'sss',
                    primaryDid: 'did:key:z456',
                    recoveryMethods: [],
                }), { status: 200 })
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.authShare).toBe('encrypted-share');
        });

        it('detects web3auth migration', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    authShare: 'share',
                    keyProvider: 'web3auth',
                    primaryDid: 'did:key:zOld',
                    recoveryMethods: [],
                }), { status: 200 })
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.needsMigration).toBe(true);
        });

        it('throws on non-404 server errors', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 500, statusText: 'Internal Server Error' })
            );

            await expect(strategy.fetchServerKeyStatus('token', 'firebase'))
                .rejects.toThrow('Failed to fetch key status');
        });
    });

    // -----------------------------------------------------------------------
    // storeAuthShare
    // -----------------------------------------------------------------------

    describe('storeAuthShare', () => {
        it('sends PUT request to the server', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 200 })
            );

            await strategy.storeAuthShare('token', 'firebase', 'share-data', 'did:key:z1');

            expect(fetchSpy).toHaveBeenCalledWith(
                'http://test-server:5100/api/keys/auth-share',
                expect.objectContaining({
                    method: 'PUT',
                    body: expect.stringContaining('share-data'),
                })
            );
        });

        it('throws on server error', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 500, statusText: 'Server Error' })
            );

            await expect(strategy.storeAuthShare('token', 'firebase', 'share', 'did'))
                .rejects.toThrow('Failed to store auth share');
        });
    });

    // -----------------------------------------------------------------------
    // markMigrated
    // -----------------------------------------------------------------------

    describe('markMigrated', () => {
        it('sends POST to /keys/migrate', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 200 })
            );

            await strategy.markMigrated!('token', 'firebase');

            expect(fetchSpy).toHaveBeenCalledWith(
                'http://test-server:5100/api/keys/migrate',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('throws on server error', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 500, statusText: 'Fail' })
            );

            await expect(strategy.markMigrated!('token', 'firebase'))
                .rejects.toThrow('Failed to mark migrated');
        });
    });

    // -----------------------------------------------------------------------
    // getPreservedStorageKeys
    // -----------------------------------------------------------------------

    describe('getPreservedStorageKeys', () => {
        it('returns the SSS IndexedDB database name', () => {
            const keys = strategy.getPreservedStorageKeys();

            expect(keys).toContain('lcb-sss-keys');
        });
    });

    // -----------------------------------------------------------------------
    // cleanup
    // -----------------------------------------------------------------------

    describe('cleanup', () => {
        it('resolves without error', async () => {
            await expect(strategy.cleanup!()).resolves.toBeUndefined();
        });
    });
});
