export declare const sha256Hex: (bytes: string | Buffer) => string;
export declare const stableStringify: (value: unknown) => string;
export declare const encodePayload: (plaintext: string, options: {
    encrypt: boolean;
    password?: string;
}) => Promise<{
    stored: string;
    encrypted: boolean;
}>;
export declare const decodePayload: (stored: string, options: {
    encrypted: boolean;
    password?: string;
}) => Promise<string>;
//# sourceMappingURL=crypto.d.ts.map