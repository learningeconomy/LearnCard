import { createPrivateKey, createPublicKey } from 'node:crypto';
import { base58btc } from 'multiformats/bases/base58';
import { expect, it, vi } from 'vitest';

vi.mock('@accesslayer/signing-authority/read', () => ({ getSigningAuthorityForDid: vi.fn() }));

import { getEphemeralLearnCard } from './learnCard.helpers';

it('derives the Ed25519 did:key from the seed without network requests', async () => {
    const seed = 'a'.repeat(64);
    const key = createPrivateKey({
        key: Buffer.concat([
            Buffer.from('302e020100300506032b657004220420', 'hex'),
            Buffer.from(seed, 'hex'),
        ]),
        format: 'der',
        type: 'pkcs8',
    });
    const publicKey = createPublicKey(key).export({ format: 'der', type: 'spki' }).subarray(-32);
    const expected = `did:key:${base58btc.encode(Buffer.concat([Buffer.from([0xed, 0x01]), publicKey]))}`;
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network forbidden'));
    try {
        expect((await getEphemeralLearnCard(seed)).id.did()).toBe(expected);
        expect(fetch).not.toHaveBeenCalled();
    } finally {
        fetch.mockRestore();
    }
});
