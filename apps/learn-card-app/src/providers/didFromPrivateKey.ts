import { getEd25519DidKeyFromSeed } from '@learncard/didkey-plugin';

/**
 * did:key for a private key, derived in plain JS (@noble/ed25519, no DIDKit WASM, no wallet).
 *
 * Same seed handling and DID as the signing wallet's `lc.id.did()`; the parity test against
 * DIDKit lives in @learncard/didkey-plugin. Keeps the cached-key launch path from paying for
 * the first DIDKit init plus a throwaway signing wallet. Signing still uses getSigningLearnCard.
 */
export const deriveDidKeyFromPrivateKey = (privateKey: string): Promise<string> =>
    getEd25519DidKeyFromSeed(privateKey);
