import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCrypto } from './crypto';
import { CryptoPlugin } from './index';

describe('getCrypto', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the platform's WebCrypto", () => {
        expect(getCrypto()).toBe(globalThis.crypto);
        expect(CryptoPlugin.methods.crypto({} as never)).toBe(globalThis.crypto);
    });

    it('explains what to do when WebCrypto is missing', () => {
        vi.stubGlobal('crypto', undefined);

        expect(() => getCrypto()).toThrow(/WebCrypto is not available/);
    });

    it('preserves random-byte access without SubtleCrypto in an insecure browser context', () => {
        const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(42));
        const browserCrypto = { getRandomValues };
        vi.stubGlobal('crypto', browserCrypto);

        expect(getCrypto()).toBe(browserCrypto);
        const crypto = CryptoPlugin.methods.crypto({} as never);
        expect(crypto).toBe(browserCrypto);
        expect(crypto.subtle).toBeUndefined();
        const bytes = new Uint8Array(4);
        expect(crypto.getRandomValues(bytes)).toBe(bytes);
        expect([...bytes]).toEqual([42, 42, 42, 42]);
        expect(getRandomValues).toHaveBeenCalledWith(bytes);
    });

    it.each([undefined, 'not callable'])(
        'rejects missing or invalid randomness support: %s',
        getRandomValues => {
            vi.stubGlobal('crypto', { subtle: {}, getRandomValues });

            expect(() => getCrypto()).toThrow(/globalThis\.crypto\.getRandomValues is missing/);
        }
    );
});
