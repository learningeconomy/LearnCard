/**
 * Encrypt src with XChaCha20 stream generated for the given 32-byte key and
 * 8-byte (as in original implementation) or 12-byte (as in RFC7539) nonce and
 * write the result into dst and return it.
 *
 * dst and src may be the same, but otherwise must not overlap.
 *
 * Nonce length is set in such a way that given it's generated via a CSPRNG
 * then there's little concern of collision for roughly 2^96 messages while
 * reusing a secret key and not encountering nonce reuse vulnerabilities.
 */
export declare function streamXOR(key: Uint8Array, nonce: Uint8Array, src: Uint8Array, dst: Uint8Array): Uint8Array;
/**
 * Generate XChaCha20 stream for the given 32-byte key and 12-byte
 * nonce (last 8 bytes of 24 byte nonce prefixed with 4 zero bytes)
 * and write it into dst and return it.
 *
 * Nonces MUST be generated using an CSPRNG to generate a sufficiently
 * random nonce such that a collision is highly unlikely to occur.
 *
 * stream is like streamXOR with all-zero src.
 */
export declare function stream(key: Uint8Array, nonce: Uint8Array, dst: Uint8Array): Uint8Array;
/**
 * HChaCha is a one-way function used in XChaCha to extend nonce.
 *
 * It takes 32-byte key and 16-byte src and writes 32-byte result
 * into dst and returns it.
 */
export declare function hchacha(key: Uint8Array, src: Uint8Array, dst: Uint8Array): Uint8Array;
