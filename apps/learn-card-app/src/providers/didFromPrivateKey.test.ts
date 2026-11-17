import { describe, expect, it, vi } from 'vitest';

const signing = vi.hoisted(() => ({ getSigningLearnCard: vi.fn() }));
vi.mock('learn-card-base/helpers/walletHelpers', () => signing);

import { deriveDidKeyFromPrivateKey } from './didFromPrivateKey';

// Fixed vectors from DIDKit (getDidKeyPlugin over didkit_wasm), the DID the app derived before.
const VECTORS: [string, string][] = [
    ['1'.repeat(64), 'did:key:z6MktULudTtAsAhRegYPiZ6631RV3viv12qd4GQF8z1xB22S'],
    ['a', 'did:key:z6Mkk16aKmGEVkeFu83FsP5bwELFWNf6hqRQhJxxSjrndyFv'],
];

describe('deriveDidKeyFromPrivateKey', () => {
    it.each(VECTORS)(
        'derives the DIDKit did:key for %s without building a wallet',
        async (key, did) => {
            await expect(deriveDidKeyFromPrivateKey(key)).resolves.toBe(did);
            expect(signing.getSigningLearnCard).not.toHaveBeenCalled();
        }
    );

    it('rejects a malformed key like the signing wallet did', async () => {
        await expect(deriveDidKeyFromPrivateKey('not-hex')).rejects.toThrow(
            'Key must be a hexadecimal string!'
        );
    });
});
