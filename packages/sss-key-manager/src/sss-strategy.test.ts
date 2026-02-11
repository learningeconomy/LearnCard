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
import { reconstructFromShares } from './sss';

import type { SSSStorageFunctions } from './sss-strategy';
import type { SSSKeyDerivationStrategy } from './types';

// ---------------------------------------------------------------------------
// In-memory storage mock
// ---------------------------------------------------------------------------

const DEFAULT_KEY = 'device';

const createMemoryStorage = (): SSSStorageFunctions & { _store: Map<string, string>; _versions: Map<string, number> } => {
    const store = new Map<string, string>();
    const versions = new Map<string, number>();

    return {
        _store: store,
        _versions: versions,

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
                versions.delete(id);
            } else {
                store.clear();
                versions.clear();
            }
        }),

        storeShareVersion: vi.fn(async (version: number, id?: string) => {
            versions.set(id ?? DEFAULT_KEY, version);
        }),

        getShareVersion: vi.fn(async (id?: string) => {
            return versions.get(id ?? DEFAULT_KEY) ?? null;
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
            expect(typeof strategy.getLocalShareVersion).toBe('function');
            expect(typeof strategy.storeLocalShareVersion).toBe('function');
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

        it('falls back to legacy unscoped key when scoped key is missing', async () => {
            // Store share under the default (legacy) key — no active user
            await strategy.storeLocalKey('legacy-share');

            // Now scope to a user — scoped key doesn't exist yet
            strategy.setActiveUser!('user-x');

            // hasLocalKey should find the legacy share via fallback
            expect(await strategy.hasLocalKey()).toBe(true);

            // getLocalKey should return the legacy share and auto-migrate it
            expect(await strategy.getLocalKey()).toBe('legacy-share');

            // After migration, the scoped key should be populated
            expect(storage.storeDeviceShare).toHaveBeenCalledWith(
                'legacy-share',
                'sss-device-share:user-x'
            );

            // Subsequent call should find the scoped key directly
            expect(await strategy.getLocalKey()).toBe('legacy-share');
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
    // Share version lifecycle (getLocalShareVersion / storeLocalShareVersion)
    // -----------------------------------------------------------------------

    describe('share version lifecycle', () => {
        it('getLocalShareVersion returns null when no version stored', async () => {
            expect(await strategy.getLocalShareVersion!()).toBeNull();
        });

        it('storeLocalShareVersion → getLocalShareVersion round-trip', async () => {
            await strategy.storeLocalShareVersion!(3);

            expect(await strategy.getLocalShareVersion!()).toBe(3);
        });

        it('overwriting version replaces the previous value', async () => {
            await strategy.storeLocalShareVersion!(1);
            await strategy.storeLocalShareVersion!(7);

            expect(await strategy.getLocalShareVersion!()).toBe(7);
        });

        it('version is scoped to the active user', async () => {
            strategy.setActiveUser!('user-a');
            await strategy.storeLocalShareVersion!(2);

            strategy.setActiveUser!('user-b');
            await strategy.storeLocalShareVersion!(5);

            // Verify isolation
            strategy.setActiveUser!('user-a');
            expect(await strategy.getLocalShareVersion!()).toBe(2);

            strategy.setActiveUser!('user-b');
            expect(await strategy.getLocalShareVersion!()).toBe(5);
        });

        it('version persists across storeLocalKey calls (rotation)', async () => {
            await strategy.storeLocalShareVersion!(4);
            await strategy.storeLocalKey('share-v1');
            await strategy.storeLocalKey('share-v2');

            expect(await strategy.getLocalShareVersion!()).toBe(4);
        });

        it('clearLocalKeys also removes the version (clean slate)', async () => {
            await strategy.storeLocalShareVersion!(6);
            await strategy.storeLocalKey('share-to-clear');

            await strategy.clearLocalKeys();

            // Both share and version are removed for a clean slate
            expect(await strategy.hasLocalKey()).toBe(false);
            expect(await strategy.getLocalShareVersion!()).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    // fetchServerKeyStatus — shareVersion extraction
    // -----------------------------------------------------------------------

    describe('fetchServerKeyStatus shareVersion', () => {
        it('returns shareVersion when server includes it', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    authShare: 'share-data',
                    keyProvider: 'sss',
                    primaryDid: 'did:key:z123',
                    recoveryMethods: [],
                    shareVersion: 5,
                }), { status: 200 })
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.shareVersion).toBe(5);
        });

        it('returns null shareVersion when server omits it', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    authShare: 'share-data',
                    keyProvider: 'sss',
                    primaryDid: 'did:key:z123',
                    recoveryMethods: [],
                }), { status: 200 })
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.shareVersion).toBeNull();
        });

        it('backfills local shareVersion when server has it but local does not', async () => {
            // Simulate a legacy account: no local version stored
            strategy.setActiveUser!('legacy-user');

            expect(await strategy.getLocalShareVersion!()).toBeNull();

            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    authShare: 'share-data',
                    keyProvider: 'sss',
                    primaryDid: 'did:key:z123',
                    recoveryMethods: [],
                    shareVersion: 3,
                }), { status: 200 })
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.shareVersion).toBe(3);

            // Wait for the fire-and-forget backfill to complete
            await new Promise(r => setTimeout(r, 10));

            expect(storage.storeShareVersion).toHaveBeenCalledWith(3, 'sss-device-share:legacy-user');
            expect(await strategy.getLocalShareVersion!()).toBe(3);
        });

        it('does not overwrite local shareVersion when it already exists', async () => {
            strategy.setActiveUser!('versioned-user');
            await strategy.storeLocalShareVersion!(2);

            storage.storeShareVersion.mockClear();

            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({
                    authShare: 'share-data',
                    keyProvider: 'sss',
                    primaryDid: 'did:key:z123',
                    recoveryMethods: [],
                    shareVersion: 5,
                }), { status: 200 })
            );

            await strategy.fetchServerKeyStatus('token', 'firebase');

            // storeShareVersion should NOT have been called — local version already exists
            expect(storage.storeShareVersion).not.toHaveBeenCalled();

            // Local version should remain unchanged
            expect(await strategy.getLocalShareVersion!()).toBe(2);
        });
    });

    // -----------------------------------------------------------------------
    // storeAuthShare — persists returned shareVersion locally
    // -----------------------------------------------------------------------

    describe('storeAuthShare shareVersion persistence', () => {
        it('stores the shareVersion returned by the server', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({ success: true, shareVersion: 4 }), { status: 200 })
            );

            await strategy.storeAuthShare('token', 'firebase', 'share', 'did:key:z1');

            expect(storage.storeShareVersion).toHaveBeenCalledWith(4, undefined);
        });

        it('defaults to version 1 when server response omits shareVersion', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({ success: true }), { status: 200 })
            );

            await strategy.storeAuthShare('token', 'firebase', 'share', 'did:key:z1');

            // putAuthShare defaults to shareVersion 1 when server omits it
            expect(storage.storeShareVersion).toHaveBeenCalledWith(1, undefined);
        });

        it('stores shareVersion under the active user scope', async () => {
            strategy.setActiveUser!('uid-99');

            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({ success: true, shareVersion: 10 }), { status: 200 })
            );

            await strategy.storeAuthShare('token', 'firebase', 'share', 'did:key:z1');

            expect(storage.storeShareVersion).toHaveBeenCalledWith(10, 'sss-device-share:uid-99');
        });
    });

    // -----------------------------------------------------------------------
    // executeRecovery — shareVersion stored after successful recovery
    // -----------------------------------------------------------------------

    describe('executeRecovery shareVersion storage', () => {
        it('stores shareVersion from server response after successful recovery', async () => {
            const originalKey = 'e1f2a3b4c5d6'.padEnd(64, '0');
            const { localKey, remoteKey } = await strategy.splitKey(originalKey);

            await strategy.storeLocalKey(localKey);

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(JSON.stringify({
                        authShare: { encryptedData: remoteKey, encryptedDek: '', iv: '' },
                        primaryDid: 'did:key:zCorrect',
                        recoveryMethods: [],
                        keyProvider: 'sss',
                        shareVersion: 42,
                    }), { status: 200 });
                }

                return new Response(null, { status: 200 });
            });

            await strategy.executeRecovery({
                token: 'tok',
                providerType: 'firebase',
                input: { method: 'email', emailShare: localKey },
                didFromPrivateKey: async () => 'did:key:zCorrect',
            });

            expect(storage.storeShareVersion).toHaveBeenCalledWith(42, undefined);
        });

        it('defaults to shareVersion 1 when server response omits it', async () => {
            const originalKey = 'e1f2a3b4c5d6'.padEnd(64, '0');
            const { localKey, remoteKey } = await strategy.splitKey(originalKey);

            await strategy.storeLocalKey(localKey);

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(JSON.stringify({
                        authShare: { encryptedData: remoteKey, encryptedDek: '', iv: '' },
                        primaryDid: 'did:key:zCorrect',
                        recoveryMethods: [],
                        keyProvider: 'sss',
                        // no shareVersion field
                    }), { status: 200 });
                }

                return new Response(null, { status: 200 });
            });

            await strategy.executeRecovery({
                token: 'tok',
                providerType: 'firebase',
                input: { method: 'email', emailShare: localKey },
                didFromPrivateKey: async () => 'did:key:zCorrect',
            });

            expect(storage.storeShareVersion).toHaveBeenCalledWith(1, undefined);
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
            expect(status.shareVersion).toBeNull(); // no shareVersion in response
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
            expect(status.shareVersion).toBeNull();
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
        it('sends PUT request to the server and stores returned shareVersion', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({ success: true, shareVersion: 3 }), { status: 200 })
            );

            await strategy.storeAuthShare('token', 'firebase', 'share-data', 'did:key:z1');

            expect(fetchSpy).toHaveBeenCalledWith(
                'http://test-server:5100/api/keys/auth-share',
                expect.objectContaining({
                    method: 'PUT',
                    body: expect.stringContaining('share-data'),
                })
            );

            // shareVersion should be persisted locally
            expect(storage.storeShareVersion).toHaveBeenCalledWith(3, undefined);
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

    // -----------------------------------------------------------------------
    // executeRecovery — DID validation before rotation
    // -----------------------------------------------------------------------

    describe('executeRecovery DID validation', () => {
        const setupRecoveryTest = async (originalKey: string) => {
            const { localKey, remoteKey } = await strategy.splitKey(originalKey);

            await strategy.storeLocalKey(localKey);

            const fetchCalls: { url: string; method: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({
                    url: urlStr,
                    method,
                    body: init?.body as string ?? '',
                });

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(JSON.stringify({
                        authShare: { encryptedData: remoteKey, encryptedDek: '', iv: '' },
                        primaryDid: 'did:key:zCorrect',
                        recoveryMethods: [],
                        keyProvider: 'sss',
                        shareVersion: 1,
                    }), { status: 200 });
                }

                return new Response(null, { status: 200 });
            });

            return { localKey, remoteKey, fetchCalls };
        };

        it('rejects stale share without corrupting server auth share', async () => {
            const originalKey = 'e1f2a3b4c5d6'.padEnd(64, '0');
            const { remoteKey, fetchCalls } = await setupRecoveryTest(originalKey);

            // Create a stale share from a DIFFERENT split (valid hex, correct length, wrong split)
            const differentKey = 'f0f0f0f0f0f0'.padEnd(64, '0');
            const { localKey: staleShare } = await strategy.splitKey(differentKey);

            await expect(
                strategy.executeRecovery({
                    token: 'tok',
                    providerType: 'firebase',
                    input: { method: 'email', emailShare: staleShare },
                    didFromPrivateKey: async () => 'did:key:zWrong',
                })
            ).rejects.toThrow('Recovery produced an incorrect key');

            // CRITICAL: no PUT to /keys/auth-share — server state is intact
            const putCalls = fetchCalls.filter(
                c => c.url.includes('/keys/auth-share') && c.method === 'PUT'
            );

            expect(putCalls).toHaveLength(0);
        });

        it('correct share + matching DID succeeds and stores recovery share as device share', async () => {
            const originalKey = 'e1f2a3b4c5d6'.padEnd(64, '0');
            const { localKey, fetchCalls } = await setupRecoveryTest(originalKey);

            const result = await strategy.executeRecovery({
                token: 'tok',
                providerType: 'firebase',
                input: { method: 'email', emailShare: localKey },
                didFromPrivateKey: async () => 'did:key:zCorrect',
            });

            expect(result.privateKey).toBe(originalKey);
            expect(result.did).toBe('did:key:zCorrect');

            // No rotateShares — recovery share is stored as device share directly,
            // so no PUT to /keys/auth-share (preserves existing recovery methods).
            const putCalls = fetchCalls.filter(
                c => c.url.includes('/keys/auth-share') && c.method === 'PUT'
            );

            expect(putCalls).toHaveLength(0);

            // Verify the recovery share is now the device share and can reconstruct
            const storedDevice = await strategy.getLocalKey();
            expect(storedDevice).toBe(localKey);

            // Verify shareVersion was stored (server returned shareVersion: 1)
            expect(storage.storeShareVersion).toHaveBeenCalledWith(1, undefined);
        });

        it('retry after stale share still works (server not corrupted)', async () => {
            const originalKey = 'e1f2a3b4c5d6'.padEnd(64, '0');
            const { localKey, fetchCalls } = await setupRecoveryTest(originalKey);

            // First attempt: stale share — should fail WITHOUT corrupting
            const differentKey = 'f0f0f0f0f0f0'.padEnd(64, '0');
            const { localKey: staleShare } = await strategy.splitKey(differentKey);

            await expect(
                strategy.executeRecovery({
                    token: 'tok',
                    providerType: 'firebase',
                    input: { method: 'email', emailShare: staleShare },
                    didFromPrivateKey: async () => 'did:key:zWrong',
                })
            ).rejects.toThrow('Recovery produced an incorrect key');

            // Second attempt: correct share — should succeed because server was NOT corrupted
            const result = await strategy.executeRecovery({
                token: 'tok',
                providerType: 'firebase',
                input: { method: 'email', emailShare: localKey },
                didFromPrivateKey: async () => 'did:key:zCorrect',
            });

            expect(result.privateKey).toBe(originalKey);
            expect(result.did).toBe('did:key:zCorrect');

            // No PUT calls at all — recovery no longer rotates shares
            const putCalls = fetchCalls.filter(
                c => c.url.includes('/keys/auth-share') && c.method === 'PUT'
            );

            expect(putCalls).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------
    // Email backup share
    // -----------------------------------------------------------------------

    describe('email backup share', () => {
        let emailStrategy: SSSKeyDerivationStrategy;
        let emailStorage: ReturnType<typeof createMemoryStorage>;

        beforeEach(() => {
            emailStorage = createMemoryStorage();

            emailStrategy = createSSSStrategy({
                serverUrl: 'http://test-server:5100/api',
                storage: emailStorage,
                enableEmailBackupShare: true,
            });
        });

        it('emailed share + auth share reconstruct the original private key', async () => {
            const originalKey = 'a1b2c3d4e5f6'.padEnd(64, '0');

            // Step 1: Split the key (caches email share internally)
            const { remoteKey } = await emailStrategy.splitKey(originalKey);

            // Step 2: Send email backup — capture the emailShare from the fetch body
            let capturedEmailShare: string | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                const body = JSON.parse(init?.body as string);
                capturedEmailShare = body.emailShare;

                return new Response(null, { status: 200 });
            });

            await emailStrategy.sendEmailBackupShare!(
                'token', 'firebase', originalKey, 'user@test.com'
            );

            expect(capturedEmailShare).toBeDefined();
            expect(capturedEmailShare!.length).toBeGreaterThan(0);

            // Step 3: Reconstruct from email share + auth share
            const reconstructed = await reconstructFromShares([capturedEmailShare!, remoteKey]);

            expect(reconstructed).toBe(originalKey);
        });

        it('does not re-split when sending email backup (uses cached share)', async () => {
            const originalKey = 'b2c3d4e5f6a1'.padEnd(64, '0');

            // Split once
            const { localKey, remoteKey } = await emailStrategy.splitKey(originalKey);

            // Capture the email share
            let capturedEmailShare: string | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                const body = JSON.parse(init?.body as string);
                capturedEmailShare = body.emailShare;

                return new Response(null, { status: 200 });
            });

            await emailStrategy.sendEmailBackupShare!(
                'token', 'firebase', originalKey, 'user@test.com'
            );

            // The email share must NOT equal the device or auth shares
            // (it's a distinct share from the same split)
            expect(capturedEmailShare).not.toBe(localKey);
            expect(capturedEmailShare).not.toBe(remoteKey);

            // But it must reconstruct the same key when combined with either
            const fromEmailAndAuth = await reconstructFromShares([capturedEmailShare!, remoteKey]);

            expect(fromEmailAndAuth).toBe(originalKey);
        });

        it('warns and skips if sendEmailBackupShare called without prior splitKey', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Call sendEmailBackupShare without calling splitKey first
            await emailStrategy.sendEmailBackupShare!(
                'token', 'firebase', 'some-key', 'user@test.com'
            );

            expect(warnSpy).toHaveBeenCalledWith(
                'Cannot send email backup share: no cached email share from splitKey()'
            );

            warnSpy.mockRestore();
        });

        it('email share is sent to email endpoint only, never stored on the server', async () => {
            const originalKey = 'd4e5f6a1b2c3'.padEnd(64, '0');

            const { remoteKey } = await emailStrategy.splitKey(originalKey);

            const fetchCalls: { url: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                fetchCalls.push({
                    url: typeof url === 'string' ? url : url.toString(),
                    body: init?.body as string ?? '',
                });

                return new Response(null, { status: 200 });
            });

            await emailStrategy.sendEmailBackupShare!(
                'token', 'firebase', originalKey, 'user@test.com'
            );

            // Only one fetch call should have been made — to the email relay
            expect(fetchCalls).toHaveLength(1);
            expect(fetchCalls[0]!.url).toBe('http://test-server:5100/api/keys/email-backup');

            // The email share must NOT appear in any auth-share or recovery endpoint calls
            const emailBody = JSON.parse(fetchCalls[0]!.body);
            const emailShare = emailBody.emailShare;

            expect(emailShare).toBeDefined();
            expect(emailShare).not.toBe(remoteKey); // different from the auth share

            // No calls to storage endpoints
            const storageCalls = fetchCalls.filter(
                c => c.url.includes('/keys/auth-share') || c.url.includes('/keys/recovery')
            );

            expect(storageCalls).toHaveLength(0);
        });

        it('setupRecoveryMethod re-sends email backup share', async () => {
            const originalKey = 'c3d4e5f6a1b2'.padEnd(64, '0');

            // Split the key first (initial setup)
            await emailStrategy.splitKey(originalKey);

            // Mock all fetch calls during setupRecoveryMethod:
            //   1. fetchAuthShareRaw (GET /keys/auth-share)
            //   2. putAuthShare (PUT /keys/auth-share)
            //   3. postRecoveryMethod (POST /keys/recovery)
            //   4. sendEmailBackupShare (POST /keys/email-backup)
            const fetchCalls: { url: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({
                    url: urlStr,
                    body: init?.body as string ?? '',
                });

                // fetchAuthShareRaw needs to return server data
                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(JSON.stringify({
                        authShare: 'existing-auth-share',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 2,
                    }), { status: 200 });
                }

                // putAuthShare returns shareVersion
                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 3 }), { status: 200 });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            await emailStrategy.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'password', password: 'test-password' },
                authUser: { id: 'user-1', providerType: 'firebase', email: 'user@test.com' },
            });

            // Verify email backup share was re-sent
            const emailBackupCall = fetchCalls.find(c => c.url.includes('/keys/email-backup'));

            expect(emailBackupCall).toBeDefined();

            // Verify the re-sent email share + new auth share can reconstruct the key
            const emailBody = JSON.parse(emailBackupCall!.body);
            const putAuthCall = fetchCalls.find(
                c => c.url.includes('/keys/auth-share') && c.body && JSON.parse(c.body).authShare
            );
            // putAuthShare wraps as { encryptedData: share, encryptedDek: '', iv: '' }
            const newAuthShare = JSON.parse(putAuthCall!.body).authShare.encryptedData;

            const reconstructed = await reconstructFromShares([emailBody.emailShare, newAuthShare]);

            expect(reconstructed).toBe(originalKey);
        });
    });
});
