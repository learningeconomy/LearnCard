import type { Cacao } from './cacao.js';
export declare enum ErrorTypes {
    INVALID_SIGNATURE = "Invalid signature.",
    EXPIRED_MESSAGE = "Expired message.",
    MALFORMED_SESSION = "Malformed session."
}
export declare enum SignatureType {
    PERSONAL_SIGNATURE = "Personal signature"
}
export declare class SiweMessage {
    domain: string;
    address: string;
    statement?: string;
    uri: string;
    version: string;
    nonce?: string;
    issuedAt?: string;
    expirationTime?: string;
    notBefore?: string;
    requestId?: string;
    chainId?: string;
    resources?: Array<string>;
    signature?: string;
    type?: SignatureType;
    constructor(param: string | Partial<SiweMessage>);
    static fromCacao(cacao: Cacao): SiweMessage;
    toMessage(): string;
    signMessage(): string;
}
