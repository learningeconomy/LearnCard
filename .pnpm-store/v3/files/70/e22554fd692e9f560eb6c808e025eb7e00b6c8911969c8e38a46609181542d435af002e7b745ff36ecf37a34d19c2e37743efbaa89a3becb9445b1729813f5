import { bases } from 'multiformats/basics';
/**
 * @deprecated Signers will be expected to return base64url `string` signatures.
 */
export interface EcdsaSignature {
    r: string;
    s: string;
    recoveryParam?: number | null;
}
export declare function bytesToBase64url(b: Uint8Array): string;
export declare function base64ToBytes(s: string): Uint8Array;
export declare function bytesToBase64(b: Uint8Array): string;
export declare function base58ToBytes(s: string): Uint8Array;
export declare function bytesToBase58(b: Uint8Array): string;
export declare function bytesToMultibase(b: Uint8Array, base: keyof typeof bases): string;
export declare function hexToBytes(s: string): Uint8Array;
export declare function encodeBase64url(s: string): string;
export declare function decodeBase64url(s: string): string;
export declare function bytesToHex(b: Uint8Array): string;
export declare function stringToBytes(s: string): Uint8Array;
export declare function toJose({ r, s, recoveryParam }: EcdsaSignature, recoverable?: boolean): string;
export declare function fromJose(signature: string): {
    r: string;
    s: string;
    recoveryParam?: number;
};
export declare function toSealed(ciphertext: string, tag: string): Uint8Array;
/**
 * Parses a private key and returns the Uint8Array representation.
 * This method uses an heuristic to determine the key encoding to then be able to parse it into 32 or 64 bytes.
 *
 * @param input a 32 or 64 byte key presented either as a Uint8Array or as a hex, base64, or base58btc encoded string
 *
 * @throws TypeError('Invalid private key format') if the key doesn't match any of the accepted formats or length
 */
export declare function parseKey(input: string | Uint8Array): Uint8Array;
export declare function leftpad(data: string, size?: number): string;
//# sourceMappingURL=util.d.ts.map