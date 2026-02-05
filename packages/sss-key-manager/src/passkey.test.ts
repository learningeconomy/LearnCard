import { describe, it, expect, vi } from 'vitest';
import {
    isWebAuthnSupported,
    isPRFSupported,
} from './passkey';

describe('Passkey utilities', () => {
    describe('isWebAuthnSupported', () => {
        it('should return false when window is undefined', () => {
            const originalWindow = global.window;
            // @ts-expect-error - Testing undefined window
            delete global.window;

            expect(isWebAuthnSupported()).toBe(false);

            global.window = originalWindow;
        });

        it('should return false when PublicKeyCredential is undefined', () => {
            const originalPKC = global.window?.PublicKeyCredential;
            if (global.window) {
                // @ts-expect-error - Testing undefined PublicKeyCredential
                delete global.window.PublicKeyCredential;
            }

            expect(isWebAuthnSupported()).toBe(false);

            if (global.window && originalPKC) {
                global.window.PublicKeyCredential = originalPKC;
            }
        });
    });

    describe('isPRFSupported', () => {
        it('should return false when WebAuthn is not supported', async () => {
            const originalWindow = global.window;
            // @ts-expect-error - Testing undefined window
            delete global.window;

            const result = await isPRFSupported();
            expect(result).toBe(false);

            global.window = originalWindow;
        });
    });

    describe('Module exports', () => {
        it('should export all required functions', async () => {
            const passkey = await import('./passkey');

            expect(typeof passkey.isWebAuthnSupported).toBe('function');
            expect(typeof passkey.isPRFSupported).toBe('function');
            expect(typeof passkey.createPasskeyCredential).toBe('function');
            expect(typeof passkey.deriveKeyFromPasskey).toBe('function');
            expect(typeof passkey.encryptShareWithPasskey).toBe('function');
            expect(typeof passkey.decryptShareWithPasskey).toBe('function');
        });
    });
});
