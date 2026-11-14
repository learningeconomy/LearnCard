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

    it('rejects a partial implementation without SubtleCrypto', () => {
        vi.stubGlobal('crypto', { getRandomValues: () => new Uint8Array() });

        expect(() => getCrypto()).toThrow(/globalThis\.crypto\.subtle is missing/);
    });
});
