import { CID } from 'multiformats/cid';
export interface EncodedPayload {
    cid: CID;
    linkedBlock: Uint8Array;
}
export declare function encodePayload(payload: Record<string, any>): Promise<EncodedPayload>;
export declare function toJWSPayload(payload: EncodedPayload | CID): string;
export declare function toJWSStrings(jose: Record<string, unknown>): Array<string>;
export declare function encodeIdentityCID(obj: Record<string, any>): Promise<CID>;
export declare function decodeIdentityCID(cid: CID): Record<string, any>;
export declare function prepareCleartext(cleartext: Record<string, any>, blockSize?: number): Promise<Uint8Array>;
export declare function decodeCleartext(b: Uint8Array): Record<string, any>;
