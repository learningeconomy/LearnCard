import { describe, expect, it, vi } from 'vitest';

// The signing wallet loads DIDKit from the bundled `?url` asset, which only Vite can serve.
// Hand it the same WASM as bytes; everything else is the real getSigningLearnCard path.
vi.mock('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url', async () => {
    const fs = await vi.importActual<{ readFileSync: (path: URL) => Uint8Array }>('node:fs');
    return {
        default: fs.readFileSync(
            new URL(
                '../../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
                import.meta.url
            )
        ),
    };
});

import { getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';

import { deriveDidKeyFromPrivateKey } from './didFromPrivateKey';

const hex = (bytes: Uint8Array) =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

/** Scouts' cached key: sss-key-manager generateEd25519PrivateKey = bytesToHex(32 random bytes). */
const cachedKey = () => hex(crypto.getRandomValues(new Uint8Array(32)));

const SEEDS: string[] = [
    '0'.repeat(64),
    'f'.repeat(64),
    'F'.repeat(64),
    `${'0'.repeat(63)}1`,
    `8${'0'.repeat(63)}`,
    '7f'.repeat(32),
    '80'.repeat(32),
    '0123456789abcdef'.repeat(4),
    '0123456789ABCDEF'.repeat(4),
    // Legacy Web3Auth keys can drop leading zeroes; both paths left-pad them to 32 bytes.
    cachedKey().slice(1),
    cachedKey().slice(2),
    'a',
    ...Array.from({ length: 50 }, cachedKey),
];

describe('Scouts deriveDidKeyFromPrivateKey', () => {
    it(`matches the signing wallet's DIDKit did:key for ${SEEDS.length} seeds`, async () => {
        const mismatches: string[] = [];
        const walletRejected: string[] = [];
        for (const seed of SEEDS) {
            const js = await deriveDidKeyFromPrivateKey(seed);
            const lc = await getSigningLearnCard(seed).catch(() => undefined);
            if (!lc) {
                walletRejected.push(seed);
                continue;
            }
            const didkit = lc.id.did();
            if (js !== didkit) mismatches.push(`${seed}: ${js} !== ${didkit}`);
        }
        expect(mismatches).toEqual([]);
        // Only keys that are not valid secp256k1 scalars (0, >= n) fail the full wallet build
        // (the Ethereum plugin needs secp256k1); their did:key still derives in JS.
        expect(walletRejected).toEqual(['0'.repeat(64), 'f'.repeat(64), 'F'.repeat(64)]);
        expect(SEEDS.length - walletRejected.length).toBeGreaterThanOrEqual(55);
    }, 120_000);

    // Pinned DIDKit vectors: seed handling (padStart etc.) is shared by both sides above, so pin
    // the DIDs main produced to catch a regression there too.
    it.each([
        ['1'.repeat(64), 'did:key:z6MktULudTtAsAhRegYPiZ6631RV3viv12qd4GQF8z1xB22S'],
        ['a', 'did:key:z6Mkk16aKmGEVkeFu83FsP5bwELFWNf6hqRQhJxxSjrndyFv'],
    ])('derives the pinned DIDKit did:key for %s', async (key, did) => {
        await expect(deriveDidKeyFromPrivateKey(key)).resolves.toBe(did);
    });

    it('rejects malformed keys with the signing wallet error', async () => {
        for (const bad of ['', 'not-hex', 'a'.repeat(65)]) {
            const js = await deriveDidKeyFromPrivateKey(bad).catch((e: Error) => e.message);
            const didkit = await getSigningLearnCard(bad).then(
                () => 'resolved',
                (e: Error) => e.message
            );
            expect(js).toBe(didkit);
        }
    });
});
