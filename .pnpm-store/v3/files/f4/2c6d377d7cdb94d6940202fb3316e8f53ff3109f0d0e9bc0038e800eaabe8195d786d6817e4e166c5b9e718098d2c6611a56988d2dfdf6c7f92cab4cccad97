import * as multiformats from 'multiformats';
import { SiweMessage } from './siwe.js';
export declare type Header = {
    t: 'eip4361';
};
export declare type Payload = {
    domain: string;
    iss: string;
    aud: string;
    version: string;
    nonce: string;
    iat: string;
    nbf?: string;
    exp?: string;
    statement?: string;
    requestId?: string;
    resources?: Array<string>;
};
export declare type Signature = {
    t: 'eip191' | 'eip1271';
    s: string;
};
export declare type Cacao = {
    h: Header;
    p: Payload;
    s?: Signature;
};
export declare type VerifyOptions = {
    atTime?: Date;
    revocationPhaseOutSecs?: number;
    clockSkewSecs?: number;
};
export declare namespace Cacao {
    function fromSiweMessage(siweMessage: SiweMessage): Cacao;
    function verify(cacao: Cacao, options?: VerifyOptions): void;
    function verifyEIP191Signature(cacao: Cacao, options: VerifyOptions): void;
}
export declare type CacaoBlock = {
    value: Cacao;
    cid: multiformats.CID;
    bytes: Uint8Array;
};
export declare namespace CacaoBlock {
    function fromCacao(cacao: Cacao): Promise<CacaoBlock>;
}
