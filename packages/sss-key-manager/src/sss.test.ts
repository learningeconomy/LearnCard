import { describe, it, expect } from 'vitest';
import {
    hexToBytes,
    bytesToHex,
    generateRandomBytes,
    bufferToBase64,
    base64ToBuffer,
    DEFAULT_KDF_PARAMS,
} from './crypto';

describe('Crypto utilities', () => {
    describe('hexToBytes / bytesToHex', () => {
        it('should convert even-length hex to bytes and back', () => {
            const originalHex = 'deadbeef01234567890abcde';
            const bytes = hexToBytes(originalHex);
            const backToHex = bytesToHex(bytes);
            expect(backToHex).toBe(originalHex);
        });

        it('should handle empty hex string', () => {
            const bytes = hexToBytes('');
            expect(bytes.length).toBe(0);
            expect(bytesToHex(bytes)).toBe('');
        });

        it('should convert 32-byte private key hex correctly', () => {
            const privateKeyHex = 'a'.repeat(64);
            const bytes = hexToBytes(privateKeyHex);
            expect(bytes.length).toBe(32);
            expect(bytesToHex(bytes)).toBe(privateKeyHex);
        });

        it('should handle mixed case hex', () => {
            const hex = 'DeAdBeEf';
            const bytes = hexToBytes(hex);
            expect(bytesToHex(bytes)).toBe('deadbeef');
        });

        it('should pad single digit hex values with leading zero', () => {
            const bytes = new Uint8Array([0, 1, 15, 255]);
            expect(bytesToHex(bytes)).toBe('00010fff');
        });
    });

    describe('base64 encoding', () => {
        it('should encode and decode buffer to base64', () => {
            const original = new Uint8Array([1, 2, 3, 4, 5]);
            const b64 = bufferToBase64(original.buffer);
            const decoded = base64ToBuffer(b64);
            expect(Array.from(decoded)).toEqual(Array.from(original));
        });

        it('should handle empty buffer', () => {
            const empty = new Uint8Array([]);
            const b64 = bufferToBase64(empty.buffer);
            expect(b64).toBe('');
            expect(base64ToBuffer(b64).length).toBe(0);
        });

        it('should handle large buffers', () => {
            const large = new Uint8Array(1024);
            for (let i = 0; i < large.length; i++) {
                large[i] = i % 256;
            }
            const b64 = bufferToBase64(large.buffer);
            const decoded = base64ToBuffer(b64);
            expect(decoded.length).toBe(1024);
            expect(Array.from(decoded)).toEqual(Array.from(large));
        });
    });

    describe('generateRandomBytes', () => {
        it('should generate bytes of specified length', () => {
            expect(generateRandomBytes(16).length).toBe(16);
            expect(generateRandomBytes(32).length).toBe(32);
            expect(generateRandomBytes(64).length).toBe(64);
        });

        it('should generate different values each time', () => {
            const a = generateRandomBytes(32);
            const b = generateRandomBytes(32);
            expect(bytesToHex(a)).not.toBe(bytesToHex(b));
        });

        it('should handle zero length', () => {
            const bytes = generateRandomBytes(0);
            expect(bytes.length).toBe(0);
        });
    });

    describe('KDF params', () => {
        it('should have secure default parameters', () => {
            expect(DEFAULT_KDF_PARAMS.algorithm).toBe('argon2id');
            expect(DEFAULT_KDF_PARAMS.timeCost).toBeGreaterThanOrEqual(3);
            expect(DEFAULT_KDF_PARAMS.memoryCost).toBeGreaterThanOrEqual(65536);
            expect(DEFAULT_KDF_PARAMS.parallelism).toBeGreaterThanOrEqual(1);
        });
    });
});

describe('SSS operations', () => {
    it('should export splitPrivateKey function', async () => {
        const sss = await import('./sss');
        expect(typeof sss.splitPrivateKey).toBe('function');
        expect(typeof sss.reconstructPrivateKey).toBe('function');
        expect(typeof sss.reconstructFromShares).toBe('function');
    });

    it('should have correct threshold constants', async () => {
        const sss = await import('./sss');
        expect(sss.SSS_TOTAL_SHARES).toBe(3);
        expect(sss.SSS_THRESHOLD).toBe(2);
    });

    it('should split and reconstruct a private key', async () => {
        const { splitPrivateKey, reconstructFromShares } = await import('./sss');

        const privateKeyHex = 'abcd1234'.repeat(8);
        const shares = await splitPrivateKey(privateKeyHex);

        expect(shares.deviceShare).toBeDefined();
        expect(shares.authShare).toBeDefined();
        expect(shares.recoveryShare).toBeDefined();

        expect(shares.deviceShare).not.toBe(shares.authShare);
        expect(shares.authShare).not.toBe(shares.recoveryShare);

        const reconstructed = await reconstructFromShares([
            shares.deviceShare,
            shares.authShare,
        ]);
        expect(reconstructed).toBe(privateKeyHex);

        const reconstructed2 = await reconstructFromShares([
            shares.deviceShare,
            shares.recoveryShare,
        ]);
        expect(reconstructed2).toBe(privateKeyHex);

        const reconstructed3 = await reconstructFromShares([
            shares.authShare,
            shares.recoveryShare,
        ]);
        expect(reconstructed3).toBe(privateKeyHex);
    });
});

describe('Storage operations', () => {
    it('should export storage functions', async () => {
        const storage = await import('./storage');
        expect(typeof storage.storeDeviceShare).toBe('function');
        expect(typeof storage.getDeviceShare).toBe('function');
        expect(typeof storage.hasDeviceShare).toBe('function');
        expect(typeof storage.deleteDeviceShare).toBe('function');
        expect(typeof storage.clearAllShares).toBe('function');
    });
});

describe('Key Manager', () => {
    const mockAuthProvider = {
        getIdToken: async () => 'mock-token',
        getCurrentUser: async () => ({
            id: 'user-123',
            email: 'test@example.com',
            providerType: 'firebase' as const,
        }),
        getProviderType: () => 'firebase' as const,
        signOut: async () => {},
    };

    it('should create key manager instance', async () => {
        const { createSSSKeyManager } = await import('./key-manager');

        const keyManager = createSSSKeyManager({
            serverUrl: 'http://localhost:3000',
            authProvider: mockAuthProvider,
        });

        expect(keyManager).toBeDefined();
        expect(keyManager.name).toBe('sss');
    });

    it('should expose required methods', async () => {
        const { createSSSKeyManager } = await import('./key-manager');

        const keyManager = createSSSKeyManager({
            serverUrl: 'http://localhost:3000',
            authProvider: mockAuthProvider,
        });

        expect(typeof keyManager.connect).toBe('function');
        expect(typeof keyManager.setupNewKey).toBe('function');
        expect(typeof keyManager.setupWithKey).toBe('function');
        expect(typeof keyManager.migrate).toBe('function');
        expect(typeof keyManager.addRecoveryMethod).toBe('function');
        expect(typeof keyManager.recover).toBe('function');
        expect(typeof keyManager.exportBackup).toBe('function');
        expect(typeof keyManager.clearLocalData).toBe('function');
        expect(typeof keyManager.isInitialized).toBe('function');
        expect(typeof keyManager.hasLocalKey).toBe('function');
    });

    it('should report not initialized before connect', async () => {
        const { createSSSKeyManager } = await import('./key-manager');

        const keyManager = createSSSKeyManager({
            serverUrl: 'http://localhost:3000',
            authProvider: mockAuthProvider,
        });

        expect(keyManager.isInitialized()).toBe(false);
    });
});

describe('Types', () => {
    it('should export all required types', async () => {
        const types = await import('./types');

        expect(types).toHaveProperty('SecurityLevels');
    });
});
