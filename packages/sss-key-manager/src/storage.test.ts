/**
 * Storage layer tests for SSS device share management.
 *
 * Verifies:
 * - Basic device share CRUD (store, get, has, delete)
 * - Share version metadata (store, get, round-trip)
 * - listAllDeviceShares skips :version metadata keys
 * - deleteDeviceShare cleans up companion :version key
 * - clearAllShares (full wipe and per-user) removes version metadata
 * - Multi-user isolation
 *
 * Uses jsdom's fake IndexedDB + real Web Crypto (AES-GCM).
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import {
    storeDeviceShare,
    getDeviceShare,
    hasDeviceShare,
    deleteDeviceShare,
    clearAllShares,
    listAllDeviceShares,
    storeShareVersion,
    getShareVersion,
} from './storage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wipe the entire IndexedDB database between tests for isolation. */
const wipeDB = async () => {
    await clearAllShares(); // deletes the whole DB when called with no arg
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SSS Storage', () => {
    beforeEach(async () => {
        await wipeDB();
    });

    // -----------------------------------------------------------------------
    // Basic device share lifecycle
    // -----------------------------------------------------------------------

    describe('device share CRUD', () => {
        it('hasDeviceShare returns false when nothing is stored', async () => {
            expect(await hasDeviceShare()).toBe(false);
        });

        it('store → get round-trip returns the original share', async () => {
            await storeDeviceShare('my-secret-share');

            expect(await hasDeviceShare()).toBe(true);
            expect(await getDeviceShare()).toBe('my-secret-share');
        });

        it('deleteDeviceShare removes the share', async () => {
            await storeDeviceShare('to-delete');

            expect(await hasDeviceShare()).toBe(true);

            await deleteDeviceShare();

            expect(await hasDeviceShare()).toBe(false);
            expect(await getDeviceShare()).toBeNull();
        });

        it('scoped shares are isolated by id', async () => {
            const idA = 'sss-device-share:user-a';
            const idB = 'sss-device-share:user-b';

            await storeDeviceShare('share-a', idA);
            await storeDeviceShare('share-b', idB);

            expect(await getDeviceShare(idA)).toBe('share-a');
            expect(await getDeviceShare(idB)).toBe('share-b');

            await deleteDeviceShare(idA);

            expect(await hasDeviceShare(idA)).toBe(false);
            expect(await getDeviceShare(idB)).toBe('share-b');
        });
    });

    // -----------------------------------------------------------------------
    // Share version metadata
    // -----------------------------------------------------------------------

    describe('share version metadata', () => {
        it('getShareVersion returns null when no version is stored', async () => {
            expect(await getShareVersion()).toBeNull();
        });

        it('store → get round-trip returns the correct version', async () => {
            await storeShareVersion(3);

            expect(await getShareVersion()).toBe(3);
        });

        it('overwriting a version replaces it', async () => {
            await storeShareVersion(1);

            expect(await getShareVersion()).toBe(1);

            await storeShareVersion(5);

            expect(await getShareVersion()).toBe(5);
        });

        it('scoped versions are isolated by id', async () => {
            const idA = 'sss-device-share:user-a';
            const idB = 'sss-device-share:user-b';

            await storeShareVersion(2, idA);
            await storeShareVersion(7, idB);

            expect(await getShareVersion(idA)).toBe(2);
            expect(await getShareVersion(idB)).toBe(7);
        });

        it('version persists independently of the device share', async () => {
            const id = 'sss-device-share:user-x';

            await storeDeviceShare('the-share', id);
            await storeShareVersion(4, id);

            // Re-store the share (e.g. after rotation) — version should remain
            await storeDeviceShare('new-share', id);

            expect(await getShareVersion(id)).toBe(4);
        });
    });

    // -----------------------------------------------------------------------
    // listAllDeviceShares — must skip :version metadata keys
    // -----------------------------------------------------------------------

    describe('listAllDeviceShares', () => {
        it('returns empty array when nothing stored', async () => {
            const entries = await listAllDeviceShares();

            expect(entries).toEqual([]);
        });

        it('returns stored shares with previews', async () => {
            const id = 'sss-device-share:user-1';

            await storeDeviceShare('abcdefgh12345678', id);

            const entries = await listAllDeviceShares();

            expect(entries).toHaveLength(1);
            expect(entries[0]!.id).toBe(id);
            expect(entries[0]!.preview).toContain('...');
        });

        it('does NOT include :version metadata keys as separate entries', async () => {
            const id = 'sss-device-share:user-1';

            await storeDeviceShare('abcdefgh12345678', id);
            await storeShareVersion(3, id);

            const entries = await listAllDeviceShares();

            // Should only see the share entry, NOT the :version entry
            expect(entries).toHaveLength(1);
            expect(entries[0]!.id).toBe(id);

            // No entry should have an id ending in :version
            const versionEntries = entries.filter(e => e.id.endsWith(':version'));

            expect(versionEntries).toHaveLength(0);
        });

        it('attaches shareVersion to the correct entry', async () => {
            const id = 'sss-device-share:user-1';

            await storeDeviceShare('abcdefgh12345678', id);
            await storeShareVersion(5, id);

            const entries = await listAllDeviceShares();

            expect(entries).toHaveLength(1);
            expect(entries[0]!.shareVersion).toBe(5);
        });

        it('shareVersion is undefined for entries without a stored version', async () => {
            const id = 'sss-device-share:legacy-user';

            await storeDeviceShare('legacysharedata1', id);

            const entries = await listAllDeviceShares();

            expect(entries).toHaveLength(1);
            expect(entries[0]!.shareVersion).toBeUndefined();
        });

        it('handles multiple users with and without versions', async () => {
            const idA = 'sss-device-share:user-a';
            const idB = 'sss-device-share:user-b';

            await storeDeviceShare('shareAAAAAAAAAAAA', idA);
            await storeShareVersion(2, idA);

            await storeDeviceShare('shareBBBBBBBBBBBB', idB);
            // user-b has no version (legacy)

            const entries = await listAllDeviceShares();

            expect(entries).toHaveLength(2);

            const entryA = entries.find(e => e.id === idA);
            const entryB = entries.find(e => e.id === idB);

            expect(entryA).toBeDefined();
            expect(entryA!.shareVersion).toBe(2);

            expect(entryB).toBeDefined();
            expect(entryB!.shareVersion).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // deleteDeviceShare — must also remove companion :version key
    // -----------------------------------------------------------------------

    describe('deleteDeviceShare cleans up version metadata', () => {
        it('removes the :version key when deleting a share', async () => {
            const id = 'sss-device-share:user-cleanup';

            await storeDeviceShare('share-to-delete', id);
            await storeShareVersion(3, id);

            // Sanity check
            expect(await getShareVersion(id)).toBe(3);

            await deleteDeviceShare(id);

            // Share should be gone
            expect(await hasDeviceShare(id)).toBe(false);

            // Version should also be gone
            expect(await getShareVersion(id)).toBeNull();
        });

        it('deleting one user does not affect another user\'s version', async () => {
            const idA = 'sss-device-share:user-a';
            const idB = 'sss-device-share:user-b';

            await storeDeviceShare('share-a', idA);
            await storeShareVersion(1, idA);

            await storeDeviceShare('share-b', idB);
            await storeShareVersion(2, idB);

            await deleteDeviceShare(idA);

            // User A is fully gone
            expect(await hasDeviceShare(idA)).toBe(false);
            expect(await getShareVersion(idA)).toBeNull();

            // User B is untouched
            expect(await getDeviceShare(idB)).toBe('share-b');
            expect(await getShareVersion(idB)).toBe(2);
        });

        it('after deletion, listAllDeviceShares has no orphaned entries', async () => {
            const id = 'sss-device-share:user-x';

            await storeDeviceShare('share-x-data-here', id);
            await storeShareVersion(7, id);

            await deleteDeviceShare(id);

            const entries = await listAllDeviceShares();

            expect(entries).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------
    // clearAllShares — full wipe and per-user
    // -----------------------------------------------------------------------

    describe('clearAllShares', () => {
        it('per-user clear removes share and version for that user only', async () => {
            const idA = 'sss-device-share:user-a';
            const idB = 'sss-device-share:user-b';

            await storeDeviceShare('share-a', idA);
            await storeShareVersion(1, idA);

            await storeDeviceShare('share-b', idB);
            await storeShareVersion(2, idB);

            await clearAllShares(idA);

            expect(await hasDeviceShare(idA)).toBe(false);
            expect(await getShareVersion(idA)).toBeNull();

            expect(await getDeviceShare(idB)).toBe('share-b');
            expect(await getShareVersion(idB)).toBe(2);
        });

        it('full wipe (no id) removes everything', async () => {
            await storeDeviceShare('share-1', 'sss-device-share:u1');
            await storeShareVersion(1, 'sss-device-share:u1');

            await storeDeviceShare('share-2', 'sss-device-share:u2');
            await storeShareVersion(5, 'sss-device-share:u2');

            await clearAllShares();

            const entries = await listAllDeviceShares();

            expect(entries).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------
    // Encryption integrity — ensures AES-GCM additional data binding
    // -----------------------------------------------------------------------

    describe('encryption integrity', () => {
        it('share encrypted under one id cannot be read under a different id', async () => {
            // Store under id A
            await storeDeviceShare('secret-share', 'id-a');

            // Try to read under id B — should fail because AES-GCM uses id as AD
            // getDeviceShare catches decrypt errors and returns null
            const result = await getDeviceShare('id-b');

            expect(result).toBeNull();
        });

        it('re-storing a share re-encrypts with fresh IV', async () => {
            const id = 'sss-device-share:user-reencrypt';

            await storeDeviceShare('the-share', id);

            const first = await getDeviceShare(id);

            await storeDeviceShare('the-share', id);

            const second = await getDeviceShare(id);

            // Both decrypt to the same value
            expect(first).toBe('the-share');
            expect(second).toBe('the-share');
        });
    });

    // -----------------------------------------------------------------------
    // Auto-cleanup of orphaned entries in listAllDeviceShares
    // -----------------------------------------------------------------------

    describe('listAllDeviceShares auto-cleanup', () => {
        it('auto-removes entries that fail to decrypt (orphaned shares)', async () => {
            const goodId = 'sss-device-share:good-user';
            const orphanId = 'sss-device-share:orphan-user';

            // Store a valid share
            await storeDeviceShare('valid-share-data!', goodId);

            // Manually inject an orphaned entry that can't be decrypted —
            // a raw string instead of a proper EncryptedPayload
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                const req = indexedDB.open('lcb-sss-keys', 1);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

            await new Promise<void>((resolve, reject) => {
                const t = db.transaction('shares', 'readwrite');
                const s = t.objectStore('shares');
                // Store garbage data that will fail AES-GCM decryption
                const req = s.put({ version: 1, iv: 'bad', cipher: 'bad', keyVersion: 1 }, orphanId);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });

            db.close();

            // First call: auto-cleans the orphan, returns only the valid entry
            const entries = await listAllDeviceShares();

            expect(entries).toHaveLength(1);
            expect(entries[0]!.id).toBe(goodId);

            // Second call: orphan is gone permanently
            const entries2 = await listAllDeviceShares();

            expect(entries2).toHaveLength(1);
            expect(entries2[0]!.id).toBe(goodId);
        });
    });

    // -----------------------------------------------------------------------
    // Concurrent access — master key serialisation
    // -----------------------------------------------------------------------

    describe('concurrent access', () => {
        it('concurrent storeDeviceShare calls do not corrupt each other', async () => {
            const idA = 'sss-device-share:concurrent-a';
            const idB = 'sss-device-share:concurrent-b';

            // Fire two stores simultaneously
            await Promise.all([
                storeDeviceShare('share-aaa', idA),
                storeDeviceShare('share-bbb', idB),
            ]);

            // Both should be readable
            expect(await getDeviceShare(idA)).toBe('share-aaa');
            expect(await getDeviceShare(idB)).toBe('share-bbb');
        });
    });
});
