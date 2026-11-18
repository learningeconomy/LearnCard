import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

import { describe, expect, it } from 'vitest';
import { getDidKitPlugin } from '@learncard/didkit-plugin';

import { getDidKeyPlugin, getEd25519DidKeyFromSeed } from '../src';

const wasm = readFile(new URL('../../didkit/src/didkit/pkg/didkit_wasm_bg.wasm', import.meta.url));

/** The DID the app gets today: getDidKeyPlugin over DIDKit, as initLearnCard({ seed }) wires it. */
const didkitDid = async (seed: string) => {
    const didkit = await getDidKitPlugin(await wasm);
    const invoke = Object.fromEntries(
        Object.entries(didkit.methods).map(([name, method]) => [
            name,
            (...args: unknown[]) => (method as (...a: unknown[]) => unknown)({}, ...args),
        ])
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal LearnCard stand-in
    const plugin = await getDidKeyPlugin({ invoke } as any, seed, 'key');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- plugin method signature
    return (plugin.id.did as any)({}, 'key') as string;
};

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

/** The cached key format: sss-key-manager's generateEd25519PrivateKey = bytesToHex(32 random bytes). */
const cachedKey = () => hex(randomBytes(32));

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

describe('getEd25519DidKeyFromSeed', () => {
    it(`matches the DIDKit did:key for ${SEEDS.length} seeds`, async () => {
        const mismatches: string[] = [];
        for (const seed of SEEDS) {
            const [js, didkit] = await Promise.all([
                getEd25519DidKeyFromSeed(seed),
                didkitDid(seed),
            ]);
            if (js !== didkit) mismatches.push(`${seed}: ${js} !== ${didkit}`);
        }
        expect(mismatches).toEqual([]);
        expect(SEEDS.length).toBeGreaterThanOrEqual(60);
    });

    it('returns a z6Mk ed25519 did:key', async () => {
        expect(await getEd25519DidKeyFromSeed(cachedKey())).toMatch(
            /^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]+$/
        );
    });

    it.each([
        ['', "Please don't use an empty string for a key!"],
        ['not-hex', 'Key must be a hexadecimal string!'],
        ['0x' + '1'.repeat(62), 'Key must be a hexadecimal string!'],
        ['1'.repeat(65), 'Key must be less than 64 characters'],
    ])('rejects %j like the DIDKit path does', async (seed, message) => {
        await expect(getEd25519DidKeyFromSeed(seed)).rejects.toThrow(message);
        await expect(didkitDid(seed)).rejects.toThrow(message);
    });
});
