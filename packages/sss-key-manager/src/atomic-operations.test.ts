/**
 * Atomic Operations Tests
 * 
 * Tests for split verification, atomic updates, and rollback behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
    splitAndVerify,
    atomicShareUpdate,
    verifyStoredShares,
    atomicRecovery,
    ShareVerificationError,
    AtomicUpdateError,
    type StorageOperations,
} from './atomic-operations';
import { generateEd25519PrivateKey } from './crypto';
import { splitPrivateKey, reconstructFromShares } from './sss';

describe('splitAndVerify', () => {

    it('should return verified shares that reconstruct the key', async () => {
        const privateKey = await generateEd25519PrivateKey();

        const result = await splitAndVerify(privateKey);

        expect(result.verified).toBe(true);
        expect(result.privateKey).toBe(privateKey);
        expect(result.shares.deviceShare).toBeDefined();
        expect(result.shares.authShare).toBeDefined();
        expect(result.shares.recoveryShare).toBeDefined();

        // Verify all combinations work
        const fromDeviceAuth = await reconstructFromShares([
            result.shares.deviceShare,
            result.shares.authShare,
        ]);
        expect(fromDeviceAuth).toBe(privateKey);
    });

    it('should work for 100 random keys', async () => {
        for (let i = 0; i < 100; i++) {
            const privateKey = await generateEd25519PrivateKey();
            const result = await splitAndVerify(privateKey);

            expect(result.verified).toBe(true);

            const reconstructed = await reconstructFromShares([
                result.shares.deviceShare,
                result.shares.authShare,
            ]);
            expect(reconstructed).toBe(privateKey);
        }
    });
});

describe('atomicShareUpdate', () => {

    const createMockStorage = (): StorageOperations & {
        deviceShare: string | null;
        authShare: string | null;
    } => ({
        deviceShare: null,
        authShare: null,

        storeDevice: vi.fn(async function(this: any, share: string) {
            this.deviceShare = share;
        }),

        storeAuth: vi.fn(async function(this: any, share: string) {
            this.authShare = share;
        }),

        getDevice: vi.fn(async function(this: any) {
            return this.deviceShare;
        }),

        getAuth: vi.fn(async function(this: any) {
            return this.authShare;
        }),
    });

    it('should store both device and auth shares on success', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const storage = createMockStorage();

        const shares = await atomicShareUpdate(privateKey, storage);

        expect(storage.storeDevice).toHaveBeenCalledWith(shares.deviceShare);
        expect(storage.storeAuth).toHaveBeenCalledWith(shares.authShare);
        expect(storage.deviceShare).toBe(shares.deviceShare);
        expect(storage.authShare).toBe(shares.authShare);
    });

    it('should rollback device share if auth storage fails', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const previousDeviceShare = 'previous-device-share-hex';

        const storage = createMockStorage();
        storage.deviceShare = previousDeviceShare;

        // Make auth storage fail
        storage.storeAuth = vi.fn().mockRejectedValue(new Error('Network error'));

        const onRollback = vi.fn();

        await expect(
            atomicShareUpdate(privateKey, storage, {
                previousDeviceShare,
                onRollback,
            })
        ).rejects.toThrow(AtomicUpdateError);

        // Device share should be rolled back to previous value
        expect(storage.deviceShare).toBe(previousDeviceShare);
        expect(onRollback).toHaveBeenCalled();
    });

    it('should throw AtomicUpdateError with correct phase on device storage failure', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const storage = createMockStorage();

        storage.storeDevice = vi.fn().mockRejectedValue(new Error('IndexedDB error'));

        try {
            await atomicShareUpdate(privateKey, storage);
            expect.fail('Should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(AtomicUpdateError);
            const error = e as AtomicUpdateError;
            expect(error.phase).toBe('store_device');
            expect(error.rolledBack).toBe(false);
        }
    });

    it('should throw AtomicUpdateError with correct phase on auth storage failure', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const storage = createMockStorage();

        storage.storeAuth = vi.fn().mockRejectedValue(new Error('Server error'));

        try {
            await atomicShareUpdate(privateKey, storage, {
                previousDeviceShare: 'previous',
            });
            expect.fail('Should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(AtomicUpdateError);
            const error = e as AtomicUpdateError;
            expect(error.phase).toBe('store_auth');
            expect(error.rolledBack).toBe(true);
        }
    });

    it('should return verified shares on success', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const storage = createMockStorage();

        const shares = await atomicShareUpdate(privateKey, storage);

        // Verify the returned shares can reconstruct the key
        const reconstructed = await reconstructFromShares([
            shares.deviceShare,
            shares.authShare,
        ]);
        expect(reconstructed).toBe(privateKey);
    });
});

describe('verifyStoredShares', () => {

    it('should return healthy=true when shares match expected DID', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const shares = await splitPrivateKey(privateKey);
        const expectedDid = `did:key:${privateKey.slice(0, 16)}`;

        const storage = {
            getDevice: vi.fn().mockResolvedValue(shares.deviceShare),
            getAuth: vi.fn().mockResolvedValue(shares.authShare),
        };

        const didFromPrivateKey = vi.fn().mockResolvedValue(expectedDid);

        const result = await verifyStoredShares(storage, expectedDid, didFromPrivateKey);

        expect(result.healthy).toBe(true);
        expect(result.hasDeviceShare).toBe(true);
        expect(result.hasAuthShare).toBe(true);
        expect(result.didMatches).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('should return healthy=false when device share is missing', async () => {
        const storage = {
            getDevice: vi.fn().mockResolvedValue(null),
            getAuth: vi.fn().mockResolvedValue('some-auth-share'),
        };

        const result = await verifyStoredShares(
            storage,
            'did:key:expected',
            async () => 'did:key:any'
        );

        expect(result.healthy).toBe(false);
        expect(result.hasDeviceShare).toBe(false);
        expect(result.error).toBe('No device share found');
    });

    it('should return healthy=false when auth share is missing', async () => {
        const storage = {
            getDevice: vi.fn().mockResolvedValue('some-device-share'),
            getAuth: vi.fn().mockResolvedValue(null),
        };

        const result = await verifyStoredShares(
            storage,
            'did:key:expected',
            async () => 'did:key:any'
        );

        expect(result.healthy).toBe(false);
        expect(result.hasDeviceShare).toBe(true);
        expect(result.hasAuthShare).toBe(false);
        expect(result.error).toBe('No auth share found');
    });

    it('should return healthy=false when DID does not match', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const shares = await splitPrivateKey(privateKey);

        const storage = {
            getDevice: vi.fn().mockResolvedValue(shares.deviceShare),
            getAuth: vi.fn().mockResolvedValue(shares.authShare),
        };

        const result = await verifyStoredShares(
            storage,
            'did:key:expected',
            async () => 'did:key:different'
        );

        expect(result.healthy).toBe(false);
        expect(result.hasDeviceShare).toBe(true);
        expect(result.hasAuthShare).toBe(true);
        expect(result.didMatches).toBe(false);
        expect(result.error).toContain('DID mismatch');
    });

    it('should handle reconstruction errors gracefully', async () => {
        const storage = {
            getDevice: vi.fn().mockResolvedValue('invalid-share'),
            getAuth: vi.fn().mockResolvedValue('also-invalid'),
        };

        const result = await verifyStoredShares(
            storage,
            'did:key:expected',
            async () => 'did:key:any'
        );

        expect(result.healthy).toBe(false);
        expect(result.error).toBeDefined();
    });
});

describe('atomicRecovery', () => {

    it('should reconstruct key and generate new shares', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const originalShares = await splitPrivateKey(privateKey);

        const storage = {
            deviceShare: null as string | null,
            authShare: null as string | null,

            storeDevice: vi.fn(async function(this: any, share: string) {
                this.deviceShare = share;
            }),

            storeAuth: vi.fn(async function(this: any, share: string) {
                this.authShare = share;
            }),
        };

        const result = await atomicRecovery(
            originalShares.recoveryShare,
            originalShares.authShare,
            storage
        );

        // Should reconstruct the correct private key
        expect(result.privateKey).toBe(privateKey);

        // Should generate new shares
        expect(result.newShares.deviceShare).toBeDefined();
        expect(result.newShares.authShare).toBeDefined();
        expect(result.newShares.recoveryShare).toBeDefined();

        // New shares should also reconstruct the key
        const reconstructed = await reconstructFromShares([
            result.newShares.deviceShare,
            result.newShares.authShare,
        ]);
        expect(reconstructed).toBe(privateKey);
    });

    it('should store new device and auth shares', async () => {
        const privateKey = await generateEd25519PrivateKey();
        const originalShares = await splitPrivateKey(privateKey);

        const storage = {
            storeDevice: vi.fn(),
            storeAuth: vi.fn(),
        };

        const result = await atomicRecovery(
            originalShares.recoveryShare,
            originalShares.authShare,
            storage
        );

        expect(storage.storeDevice).toHaveBeenCalledWith(result.newShares.deviceShare);
        expect(storage.storeAuth).toHaveBeenCalledWith(result.newShares.authShare);
    });
});
