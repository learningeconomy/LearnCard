export declare type ProtectedHeader = Record<string, any> & Partial<RecipientHeader>;
/**
 * The JWK representation of an ephemeral public key.
 * See https://www.rfc-editor.org/rfc/rfc7518.html#section-6
 */
interface EphemeralPublicKey {
    kty?: string;
    crv?: string;
    x?: string;
    y?: string;
    n?: string;
    e?: string;
}
export interface RecipientHeader {
    alg: string;
    iv: string;
    tag: string;
    epk?: EphemeralPublicKey;
    kid?: string;
    apv?: string;
    apu?: string;
}
export interface Recipient {
    header: RecipientHeader;
    encrypted_key: string;
}
export interface JWE {
    protected: string;
    iv: string;
    ciphertext: string;
    tag: string;
    aad?: string;
    recipients?: Recipient[];
}
export interface EncryptionResult {
    ciphertext: Uint8Array;
    tag: Uint8Array;
    iv: Uint8Array;
    protectedHeader?: string;
    recipient?: Recipient;
    cek?: Uint8Array;
}
export interface Encrypter {
    alg: string;
    enc: string;
    encrypt: (cleartext: Uint8Array, protectedHeader: ProtectedHeader, aad?: Uint8Array) => Promise<EncryptionResult>;
    encryptCek?: (cek: Uint8Array) => Promise<Recipient>;
}
export interface Decrypter {
    alg: string;
    enc: string;
    decrypt: (sealed: Uint8Array, iv: Uint8Array, aad?: Uint8Array, recipient?: Recipient) => Promise<Uint8Array | null>;
}
export declare function createJWE(cleartext: Uint8Array, encrypters: Encrypter[], protectedHeader?: {}, aad?: Uint8Array): Promise<JWE>;
export declare function decryptJWE(jwe: JWE, decrypter: Decrypter): Promise<Uint8Array>;
export {};
//# sourceMappingURL=JWE.d.ts.map