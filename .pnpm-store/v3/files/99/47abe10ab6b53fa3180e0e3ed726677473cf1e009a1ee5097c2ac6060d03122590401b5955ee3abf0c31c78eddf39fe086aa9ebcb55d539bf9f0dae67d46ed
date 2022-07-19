import { Encrypter, Decrypter } from './JWE';
import type { Resolvable } from 'did-resolver';
import { ECDH } from './ECDH';
/**
 * Extra parameters for JWE using authenticated encryption
 */
export declare type AuthEncryptParams = {
    /**
     * recipient key ID
     */
    kid?: string;
    /**
     * See {@link https://datatracker.ietf.org/doc/html/rfc7518#section-4.6.1.2}
     * base64url encoded
     */
    apu?: string;
    /**
     * See {@link https://datatracker.ietf.org/doc/html/rfc7518#section-4.6.1.3}
     * base64url encoded
     */
    apv?: string;
};
/**
 * Extra parameters for JWE using anonymous encryption
 */
export declare type AnonEncryptParams = {
    /**
     * recipient key ID
     */
    kid?: string;
};
/**
 * Recommended encrypter for authenticated encryption (i.e. sender authentication and requires
 * sender private key to encrypt the data).
 * Uses {@link https://tools.ietf.org/html/draft-madden-jose-ecdh-1pu-03 | ECDH-1PU v3 } and
 * {@link https://tools.ietf.org/html/draft-amringer-jose-chacha-02 | XC20PKW v2 }.
 *
 * @param recipientPublicKey the byte array representing the recipient public key
 * @param senderSecret either a Uint8Array representing the sender secret key or
 *   an ECDH function that wraps the key and can promise a shared secret given a public key
 * @param options {@link AuthEncryptParams} used to specify extra header parameters
 *
 * @returns an {@link Encrypter} instance usable with {@link createJWE}
 *
 * NOTE: ECDH-1PU and XC20PKW are proposed drafts in IETF and not a standard yet and
 * are subject to change as new revisions or until the official CFRG specification are released.
 *
 * @beta
 */
export declare function createAuthEncrypter(recipientPublicKey: Uint8Array, senderSecret: Uint8Array | ECDH, options?: Partial<AuthEncryptParams>): Encrypter;
/**
 * Recommended encrypter for anonymous encryption (i.e. no sender authentication).
 * Uses {@link https://tools.ietf.org/html/draft-amringer-jose-chacha-02 | ECDH-ES+XC20PKW v2}.
 *
 * @param publicKey the byte array representing the recipient public key
 * @param options {@link AnonEncryptParams} used to specify the recipient key ID (`kid`)
 *
 * @returns an {@link Encrypter} instance usable with {@link createJWE}
 *
 * NOTE: ECDH-ES+XC20PKW is a proposed draft in IETF and not a standard yet and
 * is subject to change as new revisions or until the official CFRG specification is released.
 *
 * @beta
 */
export declare function createAnonEncrypter(publicKey: Uint8Array, options?: Partial<AnonEncryptParams>): Encrypter;
/**
 * Recommended decrypter for authenticated encryption (i.e. sender authentication and requires
 * sender public key to decrypt the data).
 * Uses {@link https://tools.ietf.org/html/draft-madden-jose-ecdh-1pu-03 | ECDH-1PU v3 } and
 * {@link https://tools.ietf.org/html/draft-amringer-jose-chacha-02 | XC20PKW v2 }.
 *
 * @param recipientSecret either a Uint8Array representing the recipient secret key or
 *   an ECDH function that wraps the key and can promise a shared secret given a public key
 * @param senderPublicKey the byte array representing the sender public key
 *
 * @returns a {@link Decrypter} instance usable with {@link decryptJWE}
 *
 * NOTE: ECDH-1PU and XC20PKW are proposed drafts in IETF and not a standard yet and
 * are subject to change as new revisions or until the official CFRG specification are released.
 *
 * @beta
 */
export declare function createAuthDecrypter(recipientSecret: Uint8Array | ECDH, senderPublicKey: Uint8Array): Decrypter;
/**
 * Recommended decrypter for anonymous encryption (i.e. no sender authentication).
 * Uses {@link https://tools.ietf.org/html/draft-amringer-jose-chacha-02 | ECDH-ES+XC20PKW v2 }.
 *
 * @param recipientSecret either a Uint8Array representing the recipient secret key or
 *   an ECDH function that wraps the key and can promise a shared secret given a public key
 *
 * @returns a {@link Decrypter} instance usable with {@link decryptJWE}
 *
 * NOTE: ECDH-ES+XC20PKW is a proposed draft in IETF and not a standard yet and
 * is subject to change as new revisions or until the official CFRG specification is released.
 *
 * @beta
 */
export declare function createAnonDecrypter(recipientSecret: Uint8Array | ECDH): Decrypter;
export declare function xc20pDirEncrypter(key: Uint8Array): Encrypter;
export declare function xc20pDirDecrypter(key: Uint8Array): Decrypter;
export declare function x25519Encrypter(publicKey: Uint8Array, kid?: string): Encrypter;
/**
 * Implements ECDH-1PU+XC20PKW with XChaCha20Poly1305 based on the following specs:
 *   - {@link https://tools.ietf.org/html/draft-amringer-jose-chacha-02 | XC20PKW}
 *   - {@link https://tools.ietf.org/html/draft-madden-jose-ecdh-1pu-03 | ECDH-1PU}
 */
export declare function xc20pAuthEncrypterEcdh1PuV3x25519WithXc20PkwV2(recipientPublicKey: Uint8Array, senderSecret: Uint8Array | ECDH, options?: Partial<AuthEncryptParams>): Encrypter;
export declare function resolveX25519Encrypters(dids: string[], resolver: Resolvable): Promise<Encrypter[]>;
export declare function x25519Decrypter(receiverSecret: Uint8Array | ECDH): Decrypter;
/**
 * Implements ECDH-1PU+XC20PKW with XChaCha20Poly1305 based on the following specs:
 *   - {@link https://tools.ietf.org/html/draft-amringer-jose-chacha-02 | XC20PKW}
 *   - {@link https://tools.ietf.org/html/draft-madden-jose-ecdh-1pu-03 | ECDH-1PU}
 */
export declare function xc20pAuthDecrypterEcdh1PuV3x25519WithXc20PkwV2(recipientSecret: Uint8Array | ECDH, senderPublicKey: Uint8Array): Decrypter;
//# sourceMappingURL=xc20pEncryption.d.ts.map