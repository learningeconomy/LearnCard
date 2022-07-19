/**
 * Package xchacha20poly1305 implements XChaCha20-Poly1305 AEAD.
 */
import { AEAD } from "@stablelib/aead";
export declare const KEY_LENGTH = 32;
export declare const NONCE_LENGTH = 24;
export declare const TAG_LENGTH = 16;
/**
 * XChaCha20-Poly1305 Authenticated Encryption with Associated Data.
 *
 * Defined in draft-irtf-cfrg-xchacha-01.
 * See https://tools.ietf.org/html/draft-irtf-cfrg-xchacha-01
 */
export declare class XChaCha20Poly1305 implements AEAD {
    readonly nonceLength = 24;
    readonly tagLength = 16;
    private _key;
    /**
     * Creates a new instance with the given 32-byte key.
     */
    constructor(key: Uint8Array);
    /**
     * Encrypts and authenticates plaintext, authenticates associated data,
     * and returns sealed ciphertext, which includes authentication tag.
     *
     * draft-irtf-cfrg-xchacha-01 defines a 24 byte nonce (192 bits) which
     * uses the first 16 bytes of the nonce and the secret key with
     * HChaCha to generate an initial subkey. The last 8 bytes of the nonce
     * are then prefixed with 4 zero bytes and then provided with the subkey
     * to the ChaCha20Poly1305 implementation.
     *
     * If dst is given (it must be the size of plaintext + the size of tag
     * length) the result will be put into it. Dst and plaintext must not
     * overlap.
     */
    seal(nonce: Uint8Array, plaintext: Uint8Array, associatedData?: Uint8Array, dst?: Uint8Array): Uint8Array;
    /**
     * Authenticates sealed ciphertext (which includes authentication tag) and
     * associated data, decrypts ciphertext and returns decrypted plaintext.
     *
     * draft-irtf-cfrg-xchacha-01 defines a 24 byte nonce (192 bits) which
     * then uses the first 16 bytes of the nonce and the secret key with
     * Hchacha to generate an initial subkey. The last 8 bytes of the nonce
     * are then prefixed with 4 zero bytes and then provided with the subkey
     * to the chacha20poly1305 implementation.
     *
     * If authentication fails, it returns null.
     *
     * If dst is given (it must be the size of plaintext + the size of tag
     * length) the result will be put into it. Dst and plaintext must not
     * overlap.
     */
    open(nonce: Uint8Array, sealed: Uint8Array, associatedData?: Uint8Array, dst?: Uint8Array): Uint8Array | null;
    clean(): this;
}
