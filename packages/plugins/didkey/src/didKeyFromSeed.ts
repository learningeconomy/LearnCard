import { getPublicKeyAsync } from '@noble/ed25519';
import { base58 } from '@scure/base';

import { didKeySeedToBytes } from './seed';

/** Multicodec varint prefix for an Ed25519 public key (0xed). */
const ED25519_PUB_MULTICODEC = [0xed, 0x01];

/**
 * Derives the Ed25519 `did:key` for a seed without DIDKit (no WASM, no wallet).
 *
 * Same seed handling and result as `getDidKeyPlugin(learnCard, key, 'key')`'s `did()`:
 * the 32 seed bytes are the Ed25519 secret, and the DID is
 * `did:key:z` + base58btc(0xed01 ‖ publicKey).
 */
export const getEd25519DidKeyFromSeed = async (key: string): Promise<string> => {
    const { seedBytes } = didKeySeedToBytes(key);
    const publicKey = await getPublicKeyAsync(seedBytes);

    const multicodecKey = new Uint8Array(ED25519_PUB_MULTICODEC.length + publicKey.length);
    multicodecKey.set(ED25519_PUB_MULTICODEC);
    multicodecKey.set(publicKey, ED25519_PUB_MULTICODEC.length);

    return `did:key:z${base58.encode(multicodecKey)}`;
};
