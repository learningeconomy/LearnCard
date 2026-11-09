declare module 'crypto-js/sha256' {
    /** SHA-256 digest; the default string representation is hexadecimal. */
    export default function SHA256(message: string): { toString(): string };
}
