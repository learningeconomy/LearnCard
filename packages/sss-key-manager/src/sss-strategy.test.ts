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

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

import {
    createSSSStrategy,
    formatVersionedEmailShare,
    parseVersionedEmailShare,
} from './sss-strategy';
import { reconstructFromShares } from './sss';
import { AtomicUpdateError, splitAndVerify, verifyStoredShares } from './atomic-operations';
import { shareToRecoveryPhrase, recoveryPhraseToShare } from './recovery-phrase';
import { bufferToBase64 } from './crypto';
import { decryptEmailRelayPayload, type EmailRelayEnvelope } from './email-relay-crypto';

import type { SSSStorageFunctions } from './sss-strategy';
import type { SSSKeyDerivationStrategy } from './types';

// ---------------------------------------------------------------------------
// In-memory storage mock
// ---------------------------------------------------------------------------

const DEFAULT_KEY = 'device';
const TEST_RELAY_KEY_ID = 'sss-strategy-test-key';
let testRelayPublicKey = '';
let testRelayPrivateKey = '';

beforeAll(async () => {
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
        'deriveBits',
    ]);
    const [publicKey, privateKey] = await Promise.all([
        crypto.subtle.exportKey('spki', keyPair.publicKey),
        crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
    ]);

    testRelayPublicKey = bufferToBase64(publicKey);
    testRelayPrivateKey = bufferToBase64(privateKey);
});

const getTestRelayConfig = () => ({
    escrowRelayPublicKey: testRelayPublicKey,
    escrowRelayKeyId: TEST_RELAY_KEY_ID,
    emailBranding: { brandName: 'Test LearnCard', fromDomain: 'example.com' },
});

const createMemoryStorage = (): SSSStorageFunctions & {
    _store: Map<string, string>;
    _versions: Map<string, number>;
} => {
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
            expect(typeof strategy.activate).toBe('function');
            expect(typeof strategy.verifyKeys).toBe('function');
            expect(typeof strategy.setupRecoveryMethod).toBe('function');
            expect(typeof strategy.confirmRecoveryMethod).toBe('function');
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
                new Response(
                    JSON.stringify({
                        authShare: 'share-data',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 5,
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.shareVersion).toBe(5);
        });

        it('returns null shareVersion when server omits it', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'share-data',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.shareVersion).toBeNull();
        });

        it('backfills local shareVersion when server has it but local does not', async () => {
            // Simulate a legacy account: no local version stored
            strategy.setActiveUser!('legacy-user');

            expect(await strategy.getLocalShareVersion!()).toBeNull();

            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'share-data',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 3,
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.shareVersion).toBe(3);

            // Wait for the fire-and-forget backfill to complete
            await new Promise(r => setTimeout(r, 10));

            expect(storage.storeShareVersion).toHaveBeenCalledWith(
                3,
                'sss-device-share:legacy-user'
            );
            expect(await strategy.getLocalShareVersion!()).toBe(3);
        });

        it('does not overwrite local shareVersion when it already exists', async () => {
            strategy.setActiveUser!('versioned-user');
            await strategy.storeLocalShareVersion!(2);

            storage.storeShareVersion.mockClear();

            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'share-data',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 5,
                    }),
                    { status: 200 }
                )
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
                    return new Response(
                        JSON.stringify({
                            authShare: { encryptedData: remoteKey, encryptedDek: '', iv: '' },
                            primaryDid: 'did:key:zCorrect',
                            recoveryMethods: [],
                            keyProvider: 'sss',
                            shareVersion: 42,
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 43 }), {
                        status: 200,
                    });
                }

                return new Response(null, { status: 200 });
            });

            await strategy.executeRecovery({
                token: 'tok',
                providerType: 'firebase',
                input: { method: 'email', emailShare: '002a' + localKey },
                didFromPrivateKey: async () => 'did:key:zCorrect',
            });

            expect(storage.storeShareVersion).toHaveBeenCalledWith(43, undefined);
        });

        it('defaults to shareVersion 1 when server response omits it', async () => {
            const originalKey = 'e1f2a3b4c5d6'.padEnd(64, '0');
            const { localKey, remoteKey } = await strategy.splitKey(originalKey);

            await strategy.storeLocalKey(localKey);

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: { encryptedData: remoteKey, encryptedDek: '', iv: '' },
                            primaryDid: 'did:key:zCorrect',
                            recoveryMethods: [],
                            keyProvider: 'sss',
                            // no shareVersion field
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true }), { status: 200 });
                }

                return new Response(JSON.stringify({ success: true, shareVersion: 2 }), {
                    status: 200,
                });
            });

            await strategy.executeRecovery({
                token: 'tok',
                providerType: 'firebase',
                input: { method: 'email', emailShare: '0001' + localKey },
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
            expect(status.sssActivationState).toBeNull();
        });

        it('parses server response with string authShare', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'raw-auth-share-string',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [{ type: 'passkey', createdAt: '2024-01-01' }],
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.exists).toBe(true);
            expect(status.needsMigration).toBe(false);
            expect(status.primaryDid).toBe('did:key:z123');
            expect(status.authShare).toBe('raw-auth-share-string');
            expect(status.recoveryMethods).toHaveLength(1);
            expect(status.shareVersion).toBeNull(); // no shareVersion in response
            expect(status.sssActivationState).toBe('active');
        });

        it('parses server response with object authShare (encrypted envelope)', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: {
                            encryptedData: 'encrypted-share',
                            iv: 'iv-value',
                            encryptedDek: 'dek',
                        },
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z456',
                        recoveryMethods: [],
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.authShare).toBe('encrypted-share');
            expect(status.shareVersion).toBeNull();
        });

        it('detects web3auth migration', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'share',
                        keyProvider: 'web3auth',
                        primaryDid: 'did:key:zOld',
                        recoveryMethods: [],
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            expect(status.needsMigration).toBe(true);
        });

        it('throws on non-404 server errors', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 500, statusText: 'Internal Server Error' })
            );

            await expect(strategy.fetchServerKeyStatus('token', 'firebase')).rejects.toThrow(
                'Failed to fetch key status'
            );
        });
    });

    // -----------------------------------------------------------------------
    // storeAuthShare
    // -----------------------------------------------------------------------

    describe('storeAuthShare', () => {
        it('sends PUT request to the server and stores returned shareVersion', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({ success: true, shareVersion: 3 }), {
                    status: 200,
                })
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

            const requestBody = JSON.parse(fetchSpy.mock.calls[0]![1]?.body as string);
            expect(requestBody.sssActivationState).toBe('provisional');
            expect(requestBody.sssActivationState).not.toBe('active');
        });

        it('throws on server error', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 500, statusText: 'Server Error' })
            );

            await expect(
                strategy.storeAuthShare('token', 'firebase', 'share', 'did')
            ).rejects.toThrow('Failed to store auth share');
        });
    });

    // -----------------------------------------------------------------------
    // markMigrated
    // -----------------------------------------------------------------------

    describe('markMigrated', () => {
        it('sends POST to /keys/migrate', async () => {
            const fetchSpy = vi
                .spyOn(globalThis, 'fetch')
                .mockResolvedValueOnce(new Response(null, { status: 200 }));

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

            await expect(strategy.markMigrated!('token', 'firebase')).rejects.toThrow(
                'Failed to mark migrated'
            );
        });
    });

    describe('activate', () => {
        it('sends POST to /keys/activate', async () => {
            const fetchSpy = vi
                .spyOn(globalThis, 'fetch')
                .mockResolvedValueOnce(new Response(null, { status: 200 }));

            await strategy.activate!('token', 'firebase', 'did-auth-vp');

            expect(fetchSpy).toHaveBeenCalledWith(
                'http://test-server:5100/api/keys/activate',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({ Authorization: 'Bearer did-auth-vp' }),
                })
            );
        });

        it('throws on server error', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 409, statusText: 'Conflict' })
            );

            await expect(strategy.activate!('token', 'firebase')).rejects.toThrow(
                'Failed to activate SSS key'
            );
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
                    body: (init?.body as string) ?? '',
                });

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: { encryptedData: remoteKey, encryptedDek: '', iv: '' },
                            primaryDid: 'did:key:zCorrect',
                            recoveryMethods: [],
                            keyProvider: 'sss',
                            shareVersion: 1,
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 2 }), {
                        status: 200,
                    });
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
                    input: { method: 'email', emailShare: '0001' + staleShare },
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
                input: { method: 'email', emailShare: '0001' + localKey },
                didFromPrivateKey: async () => 'did:key:zCorrect',
            });

            expect(result.privateKey).toBe(originalKey);
            expect(result.did).toBe('did:key:zCorrect');

            // Recovery rotates through atomicRecovery so device + auth advance together.
            const putCalls = fetchCalls.filter(
                c => c.url.includes('/keys/auth-share') && c.method === 'PUT'
            );

            expect(putCalls).toHaveLength(1);

            // Verify the fresh device share reconstructs with the fresh auth share.
            const storedDevice = await strategy.getLocalKey();
            const storedAuth = JSON.parse(putCalls[0]!.body).authShare.encryptedData;
            expect(await strategy.reconstructKey(storedDevice!, storedAuth)).toBe(originalKey);

            expect(storage.storeShareVersion).toHaveBeenCalledWith(2, undefined);
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
                    input: { method: 'email', emailShare: '0001' + staleShare },
                    didFromPrivateKey: async () => 'did:key:zWrong',
                })
            ).rejects.toThrow('Recovery produced an incorrect key');

            // Second attempt: correct share — should succeed because server was NOT corrupted
            const result = await strategy.executeRecovery({
                token: 'tok',
                providerType: 'firebase',
                input: { method: 'email', emailShare: '0001' + localKey },
                didFromPrivateKey: async () => 'did:key:zCorrect',
            });

            expect(result.privateKey).toBe(originalKey);
            expect(result.did).toBe('did:key:zCorrect');

            // Only the successful retry rotates shares; the stale attempt never writes.
            const putCalls = fetchCalls.filter(
                c => c.url.includes('/keys/auth-share') && c.method === 'PUT'
            );

            expect(putCalls).toHaveLength(1);
        });
    });

    describe('lost login identity recovery', () => {
        it('hard-fails a DID mismatch before retaining rebind state or rotating shares', async () => {
            const originalKey = 'e1f2a3b4c5d6'.padEnd(64, '0');
            const { localKey, remoteKey } = await strategy.splitKey(originalKey);
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: { encryptedData: remoteKey, encryptedDek: '', iv: '' },
                        primaryDid: 'did:key:zExpected',
                        shareVersion: 1,
                        rebindSessionToken: 'rebind-session-token',
                    }),
                    { status: 200 }
                )
            );

            await expect(
                strategy.prepareIdentityRecovery!({
                    recoverySessionToken: 'recovery-session-token',
                    input: {
                        method: 'email',
                        emailShare: formatVersionedEmailShare(localKey, 1),
                    },
                    didFromPrivateKey: async () => 'did:key:zWrong',
                })
            ).rejects.toThrow('Recovery produced an incorrect key');

            expect(strategy.hasPendingIdentityRecovery!()).toBe(false);
            expect(storage.storeDeviceShare).not.toHaveBeenCalled();
            expect(
                fetchSpy.mock.calls.some(([url]) =>
                    String(url).includes('/recovery-session/rebind')
                )
            ).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // Cross-device recovery with older shareVersion (regression tests)
    //
    // Scenario: Device A is at v3, Device B has v2. Device A loses its share
    // and recovers via Device B. Device B sends its v2 device share + version.
    // Device A must request the v2 auth share from the server (stored in
    // previousAuthShares) and reconstruct successfully.
    // -----------------------------------------------------------------------

    describe('recovery via another device with older shareVersion', () => {
        it('fetchServerKeyStatus sends local shareVersion in the request body', async () => {
            strategy.setActiveUser!('user-x');
            await strategy.storeLocalShareVersion!(2);

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'v2-auth-share',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 3,
                    }),
                    { status: 200 }
                )
            );

            await strategy.fetchServerKeyStatus('token', 'firebase');

            const requestBody = JSON.parse(fetchSpy.mock.calls[0]![1]?.body as string);

            expect(requestBody.shareVersion).toBe(2);
        });

        it('fetchServerKeyStatus omits shareVersion from request when local is null', async () => {
            strategy.setActiveUser!('new-device');

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'current-share',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 3,
                    }),
                    { status: 200 }
                )
            );

            await strategy.fetchServerKeyStatus('token', 'firebase');

            const requestBody = JSON.parse(fetchSpy.mock.calls[0]![1]?.body as string);

            expect(requestBody).not.toHaveProperty('shareVersion');
        });

        it('full flow: v2 device share from another device reconstructs with v2 auth share from server', async () => {
            // --- Setup: split a key to get a real v2 device/auth pair ---
            const originalKey = 'deadbeef1234'.padEnd(64, '0');
            const { localKey: v2DeviceShare, remoteKey: v2AuthShare } = await strategy.splitKey(
                originalKey
            );

            // --- Simulate: Device A receives v2 share via QR recovery ---
            strategy.setActiveUser!('recovering-user');
            await strategy.storeLocalKey(v2DeviceShare);
            await strategy.storeLocalShareVersion!(2);

            // --- Mock server: returns the v2 auth share when version 2 is requested ---
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: { encryptedData: v2AuthShare, encryptedDek: '', iv: '' },
                        keyProvider: 'sss',
                        primaryDid: 'did:key:zRecoveredUser',
                        recoveryMethods: [{ type: 'passkey', createdAt: '2024-01-01' }],
                        shareVersion: 3, // server is at v3 but returns v2 auth share
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            // Server returned the v2 auth share content
            expect(status.authShare).toBe(v2AuthShare);
            expect(status.shareVersion).toBe(3);

            // Reconstruct with v2 device share + v2 auth share
            const reconstructed = await strategy.reconstructKey(v2DeviceShare, status.authShare!);

            expect(reconstructed).toBe(originalKey);
        });

        it('version overwrite: backfilled v3 is overwritten by QR-delivered v2, fetch uses v2', async () => {
            strategy.setActiveUser!('overwrite-user');

            // Step 1: First initialize — no local key, server backfills v3
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'v3-auth-share',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 3,
                    }),
                    { status: 200 }
                )
            );

            await strategy.fetchServerKeyStatus('token', 'firebase');

            // Wait for fire-and-forget backfill
            await new Promise(r => setTimeout(r, 10));

            expect(await strategy.getLocalShareVersion!()).toBe(3);

            // Step 2: QR recovery delivers v2 — overwrite the backfilled v3
            await strategy.storeLocalShareVersion!(2);

            expect(await strategy.getLocalShareVersion!()).toBe(2);

            // Step 3: Second fetchServerKeyStatus — should send version 2
            fetchSpy.mockClear().mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'v2-auth-share-from-previous',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z123',
                        recoveryMethods: [],
                        shareVersion: 3,
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            const requestBody = JSON.parse(fetchSpy.mock.calls[0]![1]?.body as string);

            expect(requestBody.shareVersion).toBe(2);
            expect(status.authShare).toBe('v2-auth-share-from-previous');
        });

        it('storeLocalShareVersion before re-initialize ensures correct version is sent', async () => {
            // Simulates the full onRecoverWithDevice handler:
            // 1. storeLocalKey(v2DeviceShare)
            // 2. storeLocalShareVersion(2)
            // 3. coordinator.initialize() → fetchServerKeyStatus sends v2

            const originalKey = 'cafe0123babe'.padEnd(64, '0');
            const { localKey: v2DeviceShare, remoteKey: v2AuthShare } = await strategy.splitKey(
                originalKey
            );

            strategy.setActiveUser!('device-recovery-user');
            await strategy.storeLocalKey(v2DeviceShare);
            await strategy.storeLocalShareVersion!(2);

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: { encryptedData: v2AuthShare, encryptedDek: '', iv: '' },
                        keyProvider: 'sss',
                        primaryDid: 'did:key:zUser',
                        recoveryMethods: [],
                        shareVersion: 3,
                    }),
                    { status: 200 }
                )
            );

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');

            // Verify v2 was sent
            const requestBody = JSON.parse(fetchSpy.mock.calls[0]![1]?.body as string);

            expect(requestBody.shareVersion).toBe(2);

            // Verify reconstruction works
            const reconstructed = await strategy.reconstructKey(v2DeviceShare, status.authShare!);

            expect(reconstructed).toBe(originalKey);

            // Verify the backfill did NOT fire (localVersion was 2, not null)
            // Only the initial storeLocalShareVersion(2) call should exist
            const versionCalls = storage.storeShareVersion.mock.calls.filter(
                (c: [number, string | undefined]) => c[0] !== 2
            );

            expect(versionCalls).toHaveLength(0);
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
                ...getTestRelayConfig(),
            });
        });

        it('emailed share + auth share reconstruct the original private key', async () => {
            const originalKey = 'a1b2c3d4e5f6'.padEnd(64, '0');

            // Step 1: Split the key (caches email share internally)
            const { remoteKey } = await emailStrategy.splitKey(originalKey);

            // Step 1b: storeAuthShare so the version is cached for email send
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(JSON.stringify({ success: true, shareVersion: 5 }), {
                        status: 200,
                    })
            );

            await emailStrategy.storeAuthShare('token', 'firebase', remoteKey, 'did:key:z1');

            // Step 2: Send email backup — capture and decrypt as the test relay.
            let capturedEnvelope: EmailRelayEnvelope | undefined;
            let capturedConfirmationCode: string | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                const body = JSON.parse(init?.body as string);
                capturedEnvelope = body.relayPayload;
                capturedConfirmationCode = body.confirmationCode;

                return new Response(null, { status: 200 });
            });

            await emailStrategy.sendEmailBackupShare!(
                'token',
                'firebase',
                originalKey,
                'user@test.com'
            );

            expect(capturedEnvelope).toBeDefined();
            const decrypted = await decryptEmailRelayPayload(capturedEnvelope, testRelayPrivateKey);
            const capturedPayload = decrypted.recoveryKey;

            expect(decrypted.targetEmail).toBe('user@test.com');
            expect(decrypted.confirmationCode).toBe(capturedConfirmationCode);
            // New format: 4-char hex prefix (e.g. "0005" for version 5)
            expect(capturedPayload.slice(0, 4)).toBe('0005');

            // Strip 4-char version prefix for reconstruction
            const rawShare = capturedPayload.slice(4);

            // Step 3: Reconstruct from email share + auth share
            const reconstructed = await reconstructFromShares([rawShare, remoteKey]);

            expect(reconstructed).toBe(originalKey);
        });

        it('does not re-split when sending email backup (uses cached share)', async () => {
            const originalKey = 'b2c3d4e5f6a1'.padEnd(64, '0');

            // Split once
            const { localKey, remoteKey } = await emailStrategy.splitKey(originalKey);

            // storeAuthShare so version is cached
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(JSON.stringify({ success: true, shareVersion: 1 }), {
                        status: 200,
                    })
            );

            await emailStrategy.storeAuthShare('token', 'firebase', remoteKey, 'did:key:z1');

            // Capture the encrypted relay payload.
            let capturedEnvelope: EmailRelayEnvelope | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                const body = JSON.parse(init?.body as string);
                capturedEnvelope = body.relayPayload;

                return new Response(null, { status: 200 });
            });

            await emailStrategy.sendEmailBackupShare!(
                'token',
                'firebase',
                originalKey,
                'user@test.com'
            );

            const decrypted = await decryptEmailRelayPayload(capturedEnvelope, testRelayPrivateKey);
            // Strip 4-char hex version prefix
            const rawShare = decrypted.recoveryKey.slice(4);

            // The raw email share must NOT equal the device or auth shares
            // (it's a distinct share from the same split)
            expect(rawShare).not.toBe(localKey);
            expect(rawShare).not.toBe(remoteKey);

            // But it must reconstruct the same key when combined with either
            const fromEmailAndAuth = await reconstructFromShares([rawShare, remoteKey]);

            expect(fromEmailAndAuth).toBe(originalKey);
        });

        it('warns and skips if sendEmailBackupShare called without prior splitKey', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Call sendEmailBackupShare without calling splitKey first
            await emailStrategy.sendEmailBackupShare!(
                'token',
                'firebase',
                'some-key',
                'user@test.com'
            );

            expect(warnSpy).toHaveBeenCalledWith(
                'Cannot send email backup share: no cached email share from splitKey()'
            );

            warnSpy.mockRestore();
        });

        it('email share is sent to email endpoint only, never stored on the server', async () => {
            const originalKey = 'd4e5f6a1b2c3'.padEnd(64, '0');

            const { remoteKey } = await emailStrategy.splitKey(originalKey);

            // storeAuthShare to cache version
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(JSON.stringify({ success: true, shareVersion: 2 }), {
                        status: 200,
                    })
            );

            await emailStrategy.storeAuthShare('token', 'firebase', remoteKey, 'did:key:z1');

            const fetchCalls: { url: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                fetchCalls.push({
                    url: typeof url === 'string' ? url : url.toString(),
                    body: (init?.body as string) ?? '',
                });

                return new Response(null, { status: 200 });
            });

            await emailStrategy.sendEmailBackupShare!(
                'token',
                'firebase',
                originalKey,
                'user@test.com'
            );

            // Only one fetch call should have been made — to the lca-api relay proxy.
            expect(fetchCalls).toHaveLength(1);
            expect(fetchCalls[0]!.url).toBe('http://test-server:5100/api/keys/email-backup');

            // The email share must not appear in the lca-api-visible request.
            const emailBody = JSON.parse(fetchCalls[0]!.body);

            expect(emailBody.emailShare).toBeUndefined();
            expect(emailBody.relayPayload).toBeDefined();
            expect(fetchCalls[0]!.body).not.toContain(remoteKey);

            const decrypted = await decryptEmailRelayPayload(
                emailBody.relayPayload,
                testRelayPrivateKey
            );

            expect(decrypted.recoveryKey.slice(0, 4)).toBe('0002');
            expect(decrypted.recoveryKey).not.toBe(remoteKey);
            expect(fetchCalls[0]!.body).not.toContain(decrypted.recoveryKey);

            // No calls to storage endpoints
            const storageCalls = fetchCalls.filter(
                c => c.url.includes('/keys/auth-share') || c.url.includes('/keys/recovery')
            );

            expect(storageCalls).toHaveLength(0);
        });

        it('setupRecoveryMethod does not silently send a share to the login email', async () => {
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
                    body: (init?.body as string) ?? '',
                });

                // fetchAuthShareRaw needs to return server data
                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing-auth-share',
                            primaryDid: 'did:key:z123',
                            recoveryMethods: [],
                            shareVersion: 2,
                        }),
                        { status: 200 }
                    );
                }

                // putAuthShare returns shareVersion
                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 3 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            await emailStrategy.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'phrase' },
                authUser: { id: 'user-1', providerType: 'firebase', email: 'user@test.com' },
            });

            // Recovery enrollment is explicit and receipt-confirmed. Rotating
            // another method must never silently target the login email.
            const emailBackupCall = fetchCalls.find(c => c.url.includes('/keys/email-backup'));

            expect(emailBackupCall).toBeUndefined();
        });

        it('emailed share includes the shareVersion prefix from storeAuthShare', async () => {
            const originalKey = 'e5f6a1b2c3d4'.padEnd(64, '0');

            await emailStrategy.splitKey(originalKey);

            // storeAuthShare returns version 7
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(JSON.stringify({ success: true, shareVersion: 7 }), {
                        status: 200,
                    })
            );

            await emailStrategy.storeAuthShare('token', 'firebase', 'auth-share', 'did:key:z1');

            // Capture encrypted email payload
            let capturedEnvelope: EmailRelayEnvelope | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                const body = JSON.parse(init?.body as string);
                capturedEnvelope = body.relayPayload;

                return new Response(null, { status: 200 });
            });

            await emailStrategy.sendEmailBackupShare!(
                'token',
                'firebase',
                originalKey,
                'user@test.com'
            );

            const decrypted = await decryptEmailRelayPayload(capturedEnvelope, testRelayPrivateKey);

            // New format: 4-char hex prefix (version 7 = "0007")
            expect(decrypted.recoveryKey.slice(0, 4)).toBe('0007');
        });

        it('setupRecoveryMethod does not auto-send email when another method rotates shares', async () => {
            const originalKey = 'f6a1b2c3d4e5'.padEnd(64, '0');

            await emailStrategy.splitKey(originalKey);

            const fetchCalls: { url: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({
                    url: urlStr,
                    body: (init?.body as string) ?? '',
                });

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 4,
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 5 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            await emailStrategy.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'phrase' },
                authUser: { id: 'user-1', providerType: 'firebase', email: 'user@test.com' },
            });

            const emailCall = fetchCalls.find(c => c.url.includes('/keys/email-backup'));

            expect(emailCall).toBeUndefined();
        });

        it('email recovery with versioned share fetches matching auth share version', async () => {
            const originalKey = 'a1b2c3d4e5f6'.padEnd(64, '0');

            // Split to get real shares
            const { shares } = await splitAndVerify(originalKey);

            // Simulate the versioned email share the user received
            // New format: 4-char hex prefix (version 2 = "0002")
            const versionedEmailShare = `0002${shares.emailShare}`;

            let capturedVersion: number | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();

                // fetchAuthShareRaw — capture the requested shareVersion
                if (urlStr.includes('/keys/auth-share') && (init?.method ?? 'GET') === 'POST') {
                    const body = JSON.parse(init?.body as string);
                    capturedVersion = body.shareVersion;

                    return new Response(
                        JSON.stringify({
                            authShare: shares.authShare,
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 2,
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share')) {
                    return new Response(JSON.stringify({ success: true, shareVersion: 3 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            const result = await emailStrategy.executeRecovery!({
                token: 'token',
                providerType: 'firebase',
                input: { method: 'email', emailShare: versionedEmailShare },
            });

            expect(result.privateKey).toBe(originalKey);
            expect(capturedVersion).toBe(2);
        });

        it('email recovery with large version still parses correctly', async () => {
            const originalKey = 'b2c3d4e5f6a1'.padEnd(64, '0');

            const { shares } = await splitAndVerify(originalKey);

            // Version 255 = "00ff" in hex
            const prefixedShare = '00ff' + shares.emailShare;

            let capturedVersion: number | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();

                if (urlStr.includes('/keys/auth-share') && (init?.method ?? 'GET') === 'POST') {
                    const body = JSON.parse(init?.body as string);
                    capturedVersion = body.shareVersion;

                    return new Response(
                        JSON.stringify({
                            authShare: shares.authShare,
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 255,
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share')) {
                    return new Response(JSON.stringify({ success: true, shareVersion: 256 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            const result = await emailStrategy.executeRecovery!({
                token: 'token',
                providerType: 'firebase',
                input: { method: 'email', emailShare: prefixedShare },
            });

            expect(result.privateKey).toBe(originalKey);
            expect(capturedVersion).toBe(255);
        });

        it('setupRecoveryMethod for phrase registers method on server with shareVersion', async () => {
            const originalKey = 'a1a2a3a4a5a6'.padEnd(64, '0');

            await emailStrategy.splitKey(originalKey);

            const fetchCalls: { url: string; method: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({
                    url: urlStr,
                    method,
                    body: (init?.body as string) ?? '',
                });

                // fetchAuthShareRaw
                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 5,
                        }),
                        { status: 200 }
                    );
                }

                // putAuthShare
                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 6 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            const result = await emailStrategy.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'phrase' },
                authUser: { id: 'user-1', providerType: 'firebase', email: 'user@test.com' },
            });

            expect(result.method).toBe('phrase');
            expect('phrase' in result && result.phrase).toBeTruthy();

            // Verify postRecoveryMethod was called for phrase
            const recoveryCall = fetchCalls.find(
                c => c.url.includes('/keys/recovery') && c.method === 'POST'
            );

            expect(recoveryCall).toBeDefined();

            const recoveryBody = JSON.parse(recoveryCall!.body);

            expect(recoveryBody.type).toBe('phrase');
            expect(recoveryBody.shareVersion).toBe(6);
            // Phrase should NOT have an encryptedShare — the user holds the phrase
            expect(recoveryBody.encryptedShare).toBeUndefined();
        });

        it('keeps phrase enrollment pending after wrong challenge words and allows retry', async () => {
            const originalKey = 'abababababab'.padEnd(64, '0');
            const fetchCalls: { url: string; method: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({ url: urlStr, method });

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 1,
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 2 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            const result = await emailStrategy.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'phrase' },
            });

            expect(result.method).toBe('phrase');
            if (result.method !== 'phrase') throw new Error('Expected phrase setup result');

            const confirmationsBefore = fetchCalls.filter(call =>
                call.url.endsWith('/keys/recovery/confirm')
            ).length;

            await expect(
                emailStrategy.confirmRecoveryMethod!({
                    token: 'token',
                    providerType: 'firebase',
                    privateKey: originalKey,
                    input: {
                        method: 'phrase',
                        challengeWords: result.challengeWordIndices.map(() => 'wrong'),
                    },
                })
            ).rejects.toThrow('do not match');
            expect(
                fetchCalls.filter(call => call.url.endsWith('/keys/recovery/confirm'))
            ).toHaveLength(confirmationsBefore);

            const phraseWords = result.phrase.split(/\s+/);
            await expect(
                emailStrategy.confirmRecoveryMethod!({
                    token: 'token',
                    providerType: 'firebase',
                    privateKey: originalKey,
                    input: {
                        method: 'phrase',
                        challengeWords: result.challengeWordIndices.map(
                            index => phraseWords[index]!
                        ),
                    },
                })
            ).resolves.toBeUndefined();
            expect(
                fetchCalls.filter(call => call.url.endsWith('/keys/recovery/confirm'))
            ).toHaveLength(confirmationsBefore + 1);
        });

        it('phrase recovery fetches shareVersion from server to get correct auth share', async () => {
            const originalKey = 'b1b2b3b4b5b6'.padEnd(64, '0');

            // Split to get real shares
            const { shares } = await splitAndVerify(originalKey);

            // Convert recovery share to phrase
            const phrase = await shareToRecoveryPhrase(shares.recoveryShare);

            // Verify the phrase round-trips
            const recoveredShare = await recoveryPhraseToShare(phrase);

            expect(recoveredShare).toBe(shares.recoveryShare);

            // Mock server: phrase record returns shareVersion 3,
            // fetchAuthShareRaw should be called with that version
            let authShareRequestVersion: number | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                // getRecoveryShare for phrase — returns shareVersion only (no encryptedShare)
                if (urlStr.includes('/keys/recovery') && method === 'GET') {
                    return new Response(
                        JSON.stringify({
                            shareVersion: 3,
                        }),
                        { status: 200 }
                    );
                }

                // fetchAuthShareRaw — capture requested shareVersion
                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    const body = JSON.parse(init?.body as string);
                    authShareRequestVersion = body.shareVersion;

                    return new Response(
                        JSON.stringify({
                            authShare: shares.authShare,
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [
                                { type: 'phrase', createdAt: new Date().toISOString() },
                            ],
                            shareVersion: 3,
                        }),
                        { status: 200 }
                    );
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            const result = await emailStrategy.executeRecovery!({
                token: 'token',
                providerType: 'firebase',
                input: { method: 'phrase', phrase },
            });

            expect(result.privateKey).toBe(originalKey);

            // Should have requested the specific shareVersion from the phrase record
            expect(authShareRequestVersion).toBe(3);
        });

        it('setupRecoveryMethod for backup registers method on server with shareVersion', async () => {
            const originalKey = 'c1c2c3c4c5c6'.padEnd(64, '0');

            await emailStrategy.splitKey(originalKey);

            const fetchCalls: { url: string; method: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({
                    url: urlStr,
                    method,
                    body: (init?.body as string) ?? '',
                });

                // fetchAuthShareRaw
                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 7,
                        }),
                        { status: 200 }
                    );
                }

                // putAuthShare
                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 8 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            const result = await emailStrategy.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'backup', password: 'testpass123', did: 'did:key:z1' },
                authUser: { id: 'user-1', providerType: 'firebase', email: 'user@test.com' },
            });

            expect(result.method).toBe('backup');
            expect('backupFile' in result && result.backupFile).toBeTruthy();

            // Backup file should embed the shareVersion
            if (result.method === 'backup') {
                expect(result.backupFile.shareVersion).toBe(8);
            }

            // Verify postRecoveryMethod was called for backup
            const recoveryCalls = fetchCalls.filter(
                c => c.url.includes('/keys/recovery') && c.method === 'POST'
            );

            expect(recoveryCalls).toHaveLength(1);

            const recoveryBody = JSON.parse(recoveryCalls[0]!.body);

            expect(recoveryBody.type).toBe('backup');
            expect(recoveryBody.shareVersion).toBe(8);
            // No encryptedShare on the server record — the backup file is self-contained
            expect(recoveryBody.encryptedShare).toBeUndefined();
        });

        it('decrypts and checksum-verifies a just-written backup before confirming it', async () => {
            const originalKey = 'cdcdcdcdcdcd'.padEnd(64, '0');
            const fetchCalls: string[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push(urlStr);

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 1,
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 2 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            const result = await emailStrategy.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'backup', password: 'correct-password', did: 'did:key:z1' },
            });

            if (result.method !== 'backup') throw new Error('Expected backup setup result');

            await expect(
                emailStrategy.confirmRecoveryMethod!({
                    token: 'token',
                    providerType: 'firebase',
                    privateKey: originalKey,
                    input: {
                        method: 'backup',
                        fileContents: JSON.stringify(result.backupFile),
                        password: 'wrong-password',
                    },
                })
            ).rejects.toThrow('Incorrect password');
            expect(fetchCalls.filter(url => url.endsWith('/keys/recovery/confirm'))).toHaveLength(
                0
            );

            await expect(
                emailStrategy.confirmRecoveryMethod!({
                    token: 'token',
                    providerType: 'firebase',
                    privateKey: originalKey,
                    input: {
                        method: 'backup',
                        fileContents: JSON.stringify(result.backupFile),
                        password: 'correct-password',
                    },
                })
            ).resolves.toBeUndefined();
            expect(fetchCalls.filter(url => url.endsWith('/keys/recovery/confirm'))).toHaveLength(
                1
            );
        });
    });

    describe('confirmed recovery-method availability', () => {
        it('does not synthesize email availability when the feature flag is enabled', async () => {
            const flaggedStrategy = createSSSStrategy({
                serverUrl: 'http://test-server:5100/api',
                storage: createMemoryStorage(),
                enableEmailBackupShare: true,
            });

            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'auth-share',
                        primaryDid: 'did:key:z1',
                        keyProvider: 'sss',
                        shareVersion: 1,
                        recoveryMethods: [],
                        sssActivationState: 'provisional',
                    }),
                    { status: 200 }
                )
            );

            await expect(
                flaggedStrategy.getAvailableRecoveryMethods!('token', 'firebase')
            ).resolves.toEqual([]);
        });

        it('excludes pending records while preserving confirmed and active legacy records', async () => {
            const confirmedAt = new Date().toISOString();
            const fetchSpy = vi.spyOn(globalThis, 'fetch');

            fetchSpy.mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        recoveryMethods: [
                            {
                                type: 'phrase',
                                createdAt: new Date().toISOString(),
                                confirmationStatus: 'pending',
                            },
                            {
                                type: 'backup',
                                createdAt: new Date().toISOString(),
                                confirmedAt,
                            },
                        ],
                        sssActivationState: 'provisional',
                    }),
                    { status: 200 }
                )
            );

            const provisionalMethods = await strategy.getAvailableRecoveryMethods!(
                'token',
                'firebase'
            );

            expect(provisionalMethods.map(method => method.type)).toEqual(['backup']);

            fetchSpy.mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        recoveryMethods: [{ type: 'phrase', createdAt: new Date().toISOString() }],
                        sssActivationState: 'active',
                    }),
                    { status: 200 }
                )
            );

            await expect(
                strategy.getAvailableRecoveryMethods!('token', 'firebase')
            ).resolves.toHaveLength(1);
        });
    });

    // -----------------------------------------------------------------------
    // Email routing: recovery email vs primary email
    // -----------------------------------------------------------------------

    describe('email routing — recovery email vs primary', () => {
        it('setupRecoveryMethod("email") binds ciphertext to the verified recovery email', async () => {
            const strat = createSSSStrategy({
                serverUrl: 'http://test-server:5100/api',
                storage: createMemoryStorage(),
                enableEmailBackupShare: true,
                ...getTestRelayConfig(),
            });

            const originalKey = 'e1e2e3e4e5e6'.padEnd(64, '0');

            await strat.splitKey(originalKey);

            const fetchCalls: { url: string; method: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({ url: urlStr, method, body: (init?.body as string) ?? '' });

                // fetchAuthShareRaw
                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 10,
                        }),
                        { status: 200 }
                    );
                }

                // putAuthShare
                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 11 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            await strat.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'email', email: 'recovery@test.com' },
                authUser: { id: 'user-1', providerType: 'firebase', email: 'primary@test.com' },
            });

            const emailBackupCalls = fetchCalls.filter(c => c.url.includes('/keys/email-backup'));

            // Should be exactly one call with no raw recovery share.
            expect(emailBackupCalls).toHaveLength(1);

            const body = JSON.parse(emailBackupCalls[0]!.body);
            const decrypted = await decryptEmailRelayPayload(
                body.relayPayload,
                testRelayPrivateKey
            );

            expect(body.emailShare).toBeUndefined();
            expect(body.email).toBe('recovery@test.com');
            expect(decrypted.targetEmail).toBe('recovery@test.com');
            expect(decrypted.confirmationCode).toBe(body.confirmationCode);
        });

        it('setupRecoveryMethod("phrase") does not auto-send email after rotating shares', async () => {
            // Create a strategy and prime hasRecoveryEmail via fetchServerKeyStatus
            const stratWithRecovery = createSSSStrategy({
                serverUrl: 'http://test-server:5100/api',
                storage: createMemoryStorage(),
                enableEmailBackupShare: true,
                ...getTestRelayConfig(),
            });

            const originalKey = 'f1f2f3f4f5f6'.padEnd(64, '0');

            // First: fetchServerKeyStatus to set hasRecoveryEmail = true
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(
                        JSON.stringify({
                            authShare: 'existing-share',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 1,
                            keyProvider: 'sss',
                            maskedRecoveryEmail: 'r****@personal.com',
                        }),
                        { status: 200 }
                    )
            );

            await stratWithRecovery.fetchServerKeyStatus('token', 'firebase');

            // Now split the key
            vi.restoreAllMocks();

            await stratWithRecovery.splitKey(originalKey);

            const fetchCalls: { url: string; method: string; body: string }[] = [];

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
                const urlStr = typeof url === 'string' ? url : url.toString();
                const method = (init?.method ?? 'GET').toUpperCase();

                fetchCalls.push({ url: urlStr, method, body: (init?.body as string) ?? '' });

                if (urlStr.includes('/keys/auth-share') && method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: 'existing',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 1,
                            maskedRecoveryEmail: 'r****@personal.com',
                        }),
                        { status: 200 }
                    );
                }

                if (urlStr.includes('/keys/auth-share') && method === 'PUT') {
                    return new Response(JSON.stringify({ success: true, shareVersion: 2 }), {
                        status: 200,
                    });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200 });
            });

            await stratWithRecovery.setupRecoveryMethod!({
                token: 'token',
                providerType: 'firebase',
                privateKey: originalKey,
                input: { method: 'phrase' },
                authUser: { id: 'user-1', providerType: 'firebase', email: 'primary@test.com' },
            });

            const emailBackupCalls = fetchCalls.filter(c => c.url.includes('/keys/email-backup'));

            expect(emailBackupCalls).toHaveLength(0);
        });

        it('sendEmailBackupShare cryptographically binds the explicit recipient', async () => {
            const stratWithRecovery = createSSSStrategy({
                serverUrl: 'http://test-server:5100/api',
                storage: createMemoryStorage(),
                enableEmailBackupShare: true,
                ...getTestRelayConfig(),
            });

            const originalKey = 'd1d2d3d4d5d6'.padEnd(64, '0');

            // Prime hasRecoveryEmail via fetchServerKeyStatus
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(
                        JSON.stringify({
                            authShare: 'existing-share',
                            primaryDid: 'did:key:z1',
                            recoveryMethods: [],
                            shareVersion: 3,
                            keyProvider: 'sss',
                            maskedRecoveryEmail: 'r****@personal.com',
                        }),
                        { status: 200 }
                    )
            );

            await stratWithRecovery.fetchServerKeyStatus('token', 'firebase');

            vi.restoreAllMocks();

            // Split key to cache email share
            const { remoteKey } = await stratWithRecovery.splitKey(originalKey);

            // storeAuthShare to cache version
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(JSON.stringify({ success: true, shareVersion: 4 }), {
                        status: 200,
                    })
            );

            await stratWithRecovery.storeAuthShare('token', 'firebase', remoteKey, 'did:key:z1');

            // Now capture sendEmailBackupShare call
            let capturedBody: Record<string, unknown> | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                capturedBody = JSON.parse(init?.body as string);
                return new Response(null, { status: 200 });
            });

            await stratWithRecovery.sendEmailBackupShare!(
                'token',
                'firebase',
                originalKey,
                'primary@test.com'
            );

            const decrypted = await decryptEmailRelayPayload(
                capturedBody!.relayPayload,
                testRelayPrivateKey
            );

            expect(capturedBody).toBeDefined();
            expect(capturedBody!.useRecoveryEmail).toBeUndefined();
            expect(capturedBody!.email).toBe('primary@test.com');
            expect(decrypted.targetEmail).toBe('primary@test.com');
        });

        it('sendEmailBackupShare routes to primary email when no recovery email is configured', async () => {
            const strat = createSSSStrategy({
                serverUrl: 'http://test-server:5100/api',
                storage: createMemoryStorage(),
                enableEmailBackupShare: true,
                ...getTestRelayConfig(),
            });

            const originalKey = 'a2b3c4d5e6f7'.padEnd(64, '0');

            const { remoteKey } = await strat.splitKey(originalKey);

            // storeAuthShare to cache version
            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
                async () =>
                    new Response(JSON.stringify({ success: true, shareVersion: 1 }), {
                        status: 200,
                    })
            );

            await strat.storeAuthShare('token', 'firebase', remoteKey, 'did:key:z1');

            let capturedBody: Record<string, unknown> | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                capturedBody = JSON.parse(init?.body as string);
                return new Response(null, { status: 200 });
            });

            await strat.sendEmailBackupShare!('token', 'firebase', originalKey, 'primary@test.com');

            // Should send to the explicit primary email
            expect(capturedBody).toBeDefined();
            expect(capturedBody!.email).toBe('primary@test.com');
            expect(capturedBody!.useRecoveryEmail).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // hasRecoveryEmail reset on 404 (new/migrated user)
    // -----------------------------------------------------------------------

    describe('hasRecoveryEmail reset on server 404', () => {
        it('sendEmailBackupShare uses primary email after fetchServerKeyStatus returns no data', async () => {
            const strat = createSSSStrategy({
                serverUrl: 'http://test-server:5100/api',
                enableEmailBackupShare: true,
                storage,
                ...getTestRelayConfig(),
            });

            strat.setActiveUser!('user-with-recovery');

            // Step 1: fetchServerKeyStatus returns a user WITH a recovery email
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        authShare: 'share',
                        keyProvider: 'sss',
                        primaryDid: 'did:key:z1',
                        recoveryMethods: [{ type: 'email', createdAt: new Date().toISOString() }],
                        maskedRecoveryEmail: 'r***@test.com',
                        shareVersion: 1,
                    }),
                    { status: 200 }
                )
            );

            await strat.fetchServerKeyStatus('token', 'firebase');

            // Step 2: Switch to a NEW user whose server returns 404 (no record)
            strat.setActiveUser!('brand-new-user');

            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(null, { status: 404 })
            );

            await strat.fetchServerKeyStatus('token', 'firebase');

            // Step 3: Split a key so sendEmailBackupShare has a cached email share
            const originalKey = 'a1b2c3d4e5f6'.padEnd(64, '0');

            await strat.splitKey(originalKey);

            // storeAuthShare to cache shareVersion
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                new Response(JSON.stringify({ success: true, shareVersion: 1 }), { status: 200 })
            );

            await strat.storeAuthShare('token', 'firebase', 'auth-share', 'did:key:z1');

            // Step 4: sendEmailBackupShare — should send to primary email, NOT useRecoveryEmail
            let capturedBody: Record<string, unknown> | undefined;

            vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
                capturedBody = JSON.parse(init?.body as string);

                return new Response(null, { status: 200 });
            });

            await strat.sendEmailBackupShare!('token', 'firebase', originalKey, 'primary@test.com');

            expect(capturedBody).toBeDefined();
            expect(capturedBody!.email).toBe('primary@test.com');
            expect(capturedBody!.useRecoveryEmail).toBeUndefined();
        });
    });

    describe('production lifecycle atomicity and reconciliation', () => {
        const privateKey = '1234567890abcdef'.repeat(4);
        const expectedDid = 'did:key:zAtomicOwner';

        it.each(['initial setup', 'Web3Auth migration'])(
            '%s restores the previous device share when the server write fails',
            async () => {
                const previous = await splitAndVerify(privateKey);

                await strategy.storeLocalKey(previous.shares.deviceShare);
                await strategy.storeLocalShareVersion!(4);

                vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                    new Response(null, { status: 503, statusText: 'Unavailable' })
                );

                let thrown: unknown;
                try {
                    await strategy.atomicUpdateShares!({
                        token: 'token',
                        providerType: 'firebase',
                        privateKey,
                        did: expectedDid,
                    });
                } catch (error) {
                    thrown = error;
                }

                expect(thrown).toBeInstanceOf(AtomicUpdateError);
                expect((thrown as AtomicUpdateError).rolledBack).toBe(true);
                expect(await strategy.getLocalKey()).toBe(previous.shares.deviceShare);
                expect(await strategy.getLocalShareVersion!()).toBe(4);
            }
        );

        it('setupRecoveryMethod restores the previous device share when auth-share rotation fails', async () => {
            const previous = await splitAndVerify(privateKey);

            await strategy.storeLocalKey(previous.shares.deviceShare);
            await strategy.storeLocalShareVersion!(7);

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
                const method = (init?.method ?? 'GET').toUpperCase();

                if (method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: previous.shares.authShare,
                            primaryDid: expectedDid,
                            recoveryMethods: [],
                            keyProvider: 'sss',
                            shareVersion: 7,
                        }),
                        { status: 200 }
                    );
                }

                return new Response(null, { status: 503, statusText: 'Unavailable' });
            });

            let thrown: unknown;
            try {
                await strategy.setupRecoveryMethod!({
                    token: 'token',
                    providerType: 'firebase',
                    privateKey,
                    input: { method: 'phrase' },
                });
            } catch (error) {
                thrown = error;
            }

            expect(thrown).toBeInstanceOf(AtomicUpdateError);
            expect((thrown as AtomicUpdateError).rolledBack).toBe(true);
            expect(await strategy.getLocalKey()).toBe(previous.shares.deviceShare);
            expect(await strategy.getLocalShareVersion!()).toBe(7);
        });

        it('executeRecovery uses atomicRecovery and restores the previous device share on rotation failure', async () => {
            const recoverySource = await splitAndVerify(privateKey);
            const previousDevice = 'previous-device-share';

            await strategy.storeLocalKey(previousDevice);
            await strategy.storeLocalShareVersion!(2);

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
                const method = (init?.method ?? 'GET').toUpperCase();

                if (method === 'POST') {
                    return new Response(
                        JSON.stringify({
                            authShare: recoverySource.shares.authShare,
                            primaryDid: expectedDid,
                            recoveryMethods: [],
                            keyProvider: 'sss',
                            shareVersion: 2,
                        }),
                        { status: 200 }
                    );
                }

                return new Response(null, { status: 503, statusText: 'Unavailable' });
            });

            let thrown: unknown;
            try {
                await strategy.executeRecovery({
                    token: 'token',
                    providerType: 'firebase',
                    input: {
                        method: 'email',
                        emailShare: `0002${recoverySource.shares.emailShare}`,
                    },
                    didFromPrivateKey: async key =>
                        key === privateKey ? expectedDid : 'did:key:zWrong',
                });
            } catch (error) {
                thrown = error;
            }

            expect(thrown).toBeInstanceOf(AtomicUpdateError);
            expect((thrown as AtomicUpdateError).rolledBack).toBe(true);
            expect(await strategy.getLocalKey()).toBe(previousDevice);
            expect(await strategy.getLocalShareVersion!()).toBe(2);
        });

        it('repairs an ack-lost server commit on the next login', async () => {
            const versionOne = await splitAndVerify(privateKey);
            const server = {
                currentAuthShare: versionOne.shares.authShare,
                previousAuthShares: new Map<number, string>(),
                version: 1,
                loseNextAck: true,
            };

            await strategy.storeLocalKey(versionOne.shares.deviceShare);
            await strategy.storeLocalShareVersion!(1);

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
                const method = (init?.method ?? 'GET').toUpperCase();
                const body = init?.body ? JSON.parse(String(init.body)) : {};

                if (method === 'PUT') {
                    server.previousAuthShares.set(server.version, server.currentAuthShare);
                    server.currentAuthShare = body.authShare.encryptedData;
                    server.version += 1;

                    if (server.loseNextAck) {
                        server.loseNextAck = false;
                        throw new Error('Connection closed after commit');
                    }

                    return new Response(
                        JSON.stringify({ success: true, shareVersion: server.version }),
                        { status: 200 }
                    );
                }

                const requestedVersion = body.shareVersion as number | undefined;
                const authShare = requestedVersion
                    ? requestedVersion === server.version
                        ? server.currentAuthShare
                        : server.previousAuthShares.get(requestedVersion) ?? null
                    : server.currentAuthShare;

                return new Response(
                    JSON.stringify({
                        authShare,
                        primaryDid: expectedDid,
                        recoveryMethods: [],
                        keyProvider: 'sss',
                        shareVersion: server.version,
                    }),
                    { status: 200 }
                );
            });

            await expect(
                strategy.atomicUpdateShares!({
                    token: 'token',
                    providerType: 'firebase',
                    privateKey,
                    did: expectedDid,
                })
            ).rejects.toMatchObject({ rolledBack: true });

            expect(await strategy.getLocalKey()).toBe(versionOne.shares.deviceShare);
            expect(await strategy.getLocalShareVersion!()).toBe(1);
            expect(server.version).toBe(2);

            const status = await strategy.fetchServerKeyStatus('token', 'firebase');
            const localShare = await strategy.getLocalKey();
            const preRepairHealth = await verifyStoredShares(
                {
                    getDevice: async () => localShare,
                    getAuth: async () => status.authShare,
                },
                expectedDid,
                async key => (key === privateKey ? expectedDid : 'did:key:zWrong')
            );

            expect(preRepairHealth.healthy).toBe(true);
            expect(status.shareVersion).toBe(2);
            expect(await strategy.getLocalShareVersion!()).toBe(1);

            const reconciled = await strategy.reconcileShares!({
                token: 'token',
                providerType: 'firebase',
                expectedDid,
                didFromPrivateKey: async key =>
                    key === privateKey ? expectedDid : 'did:key:zWrong',
            });

            expect(reconciled).toEqual({ privateKey, did: expectedDid });
            expect(server.version).toBe(3);
            expect(await strategy.getLocalShareVersion!()).toBe(3);

            const repairedDevice = await strategy.getLocalKey();
            const repairedHealth = await verifyStoredShares(
                {
                    getDevice: async () => repairedDevice,
                    getAuth: async () => server.currentAuthShare,
                },
                expectedDid,
                async key => (key === privateKey ? expectedDid : 'did:key:zWrong')
            );

            expect(repairedHealth.healthy).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // Versioned email share format edge cases
    // -----------------------------------------------------------------------

    describe('formatVersionedEmailShare / parseVersionedEmailShare', () => {
        it('round-trip: format then parse recovers the original share and version', () => {
            const share = 'abcdef1234567890';
            const version = 5;

            const formatted = formatVersionedEmailShare(share, version);
            const parsed = parseVersionedEmailShare(formatted);

            expect(parsed.share).toBe(share);
            expect(parsed.version).toBe(version);
        });

        it('format produces no word-boundary characters (pure hex)', () => {
            const formatted = formatVersionedEmailShare('deadbeef', 42);

            // Must be entirely hex: [0-9a-f]
            expect(formatted).toMatch(/^[0-9a-f]+$/);
        });

        it('format pads version to exactly 4 hex chars', () => {
            expect(formatVersionedEmailShare('aa', 1)).toBe('0001aa');
            expect(formatVersionedEmailShare('aa', 255)).toBe('00ffaa');
            expect(formatVersionedEmailShare('aa', 4096)).toBe('1000aa');
            expect(formatVersionedEmailShare('aa', 65535)).toBe('ffffaa');
        });

        it('version 0 prefix ("0000") is treated as unversioned', () => {
            const parsed = parseVersionedEmailShare('0000abcdef');

            // maybeVersion > 0 check fails, so entire string is the share
            expect(parsed.version).toBeUndefined();
            expect(parsed.share).toBe('0000abcdef');
        });

        it('version 1 is the minimum valid version', () => {
            const parsed = parseVersionedEmailShare('0001abcdef');

            expect(parsed.version).toBe(1);
            expect(parsed.share).toBe('abcdef');
        });

        it('large version (65535 = "ffff") parses correctly', () => {
            const parsed = parseVersionedEmailShare('ffffabcdef');

            expect(parsed.version).toBe(65535);
            expect(parsed.share).toBe('abcdef');
        });

        it('input shorter than 5 chars is treated as unversioned', () => {
            expect(parseVersionedEmailShare('abcd')).toEqual({ share: 'abcd', version: undefined });
            expect(parseVersionedEmailShare('abc')).toEqual({ share: 'abc', version: undefined });
            expect(parseVersionedEmailShare('')).toEqual({ share: '', version: undefined });
        });

        it('input that is exactly 4 chars is treated as unversioned (no share data after prefix)', () => {
            const parsed = parseVersionedEmailShare('0005');

            expect(parsed.version).toBeUndefined();
            expect(parsed.share).toBe('0005');
        });

        it('system never produces version 0 (formatVersionedEmailShare with version >= 1)', () => {
            // This documents the contract: version starts at 1
            const formatted = formatVersionedEmailShare('share', 1);

            expect(formatted.slice(0, 4)).toBe('0001');
        });
    });
});
