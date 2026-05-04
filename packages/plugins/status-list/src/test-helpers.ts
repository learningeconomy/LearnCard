/**
 * Test-only helpers for the bitstring status list module.
 *
 * Lives in a separate file (NOT re-exported from `vp/index.ts`) so
 * the production code surface stays minimal. Uses fflate (the same
 * cross-platform gzip the production decoder uses) so the helper
 * runs equally well in Node tests and in browser-based interop
 * harnesses if a future slice exercises status checking from the
 * browser.
 *
 * The same encode pipeline a real issuer would use \u2014 just
 * synchronous, with controllable bit-set inputs \u2014 so unit tests
 * exercise the actual wire format we emit (high-order-bit-first
 * layout, GZIP compression, base64url encoding) end-to-end against
 * the production decoder in `./status.ts`.
 */
import { gzipSync } from 'fflate';

import type {
    StatusListCredential,
    StatusListCredentialSubject,
} from './status';

/**
 * Build a status-list credential body the unit tests can mount via
 * `fetchStatusList`. Exposed for plugin tests (and the Sphereon
 * interop harness, when a future slice exercises status checking
 * interop) to construct lists without re-implementing the encode
 * pipeline.
 *
 * `bitsSet` is a sparse list of indices to flip to 1. Everything
 * else stays 0 (active). The bitstring length defaults to 16 KiB
 * (131,072 bits) per the W3C spec's recommended minimum, which is
 * well under the 1 GiB max and large enough for realistic test
 * scenarios.
 */
export const buildBitstringStatusListCredential = (args: {
    bitsSet?: readonly number[];
    bitstringLengthBytes?: number;
    statusPurpose?: string;
    /** Helper for tests that need to assert against the encoded form. */
    listIssuer?: string;
}): StatusListCredential & { credentialSubject: StatusListCredentialSubject } => {
    const lengthBytes = args.bitstringLengthBytes ?? 16 * 1024;
    const bytes = new Uint8Array(lengthBytes);

    for (const idx of args.bitsSet ?? []) {
        if (idx < 0 || idx >= lengthBytes * 8) {
            throw new RangeError(
                `Cannot set bit ${idx}: bitstring is ${lengthBytes * 8} bits long`
            );
        }
        const byteIndex = idx >> 3;
        const bitInByte = 7 - (idx & 7);
        bytes[byteIndex] = (bytes[byteIndex] ?? 0) | (1 << bitInByte);
    }

    const compressed = gzipSync(bytes);
    // Buffer is available in Node + most browser bundlers; the test
    // suite runs only in Node, so we rely on it for the base64 step.
    const encodedList = Buffer.from(compressed)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/vc/status-list/2021/v1',
        ],
        type: ['VerifiableCredential', 'BitstringStatusListCredential'],
        ...(args.listIssuer ? { issuer: args.listIssuer } : {}),
        credentialSubject: {
            type: 'BitstringStatusList',
            statusPurpose: args.statusPurpose ?? 'revocation',
            encodedList,
        },
    };
};
