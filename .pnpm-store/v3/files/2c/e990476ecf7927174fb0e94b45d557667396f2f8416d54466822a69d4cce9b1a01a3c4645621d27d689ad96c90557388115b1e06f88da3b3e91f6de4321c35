import type { DIDMethodName, DIDProviderMethods, DIDProvider } from 'dids';
import type { RPCRequest, RPCResponse, SendRequestFunc } from 'rpc-utils';
export declare function encodeDID(publicKey: Uint8Array): string;
export declare class Ed25519Provider implements DIDProvider {
    _handle: SendRequestFunc<DIDProviderMethods>;
    constructor(seed: Uint8Array);
    get isDidProvider(): boolean;
    send<Name extends DIDMethodName>(msg: RPCRequest<DIDProviderMethods, Name>): Promise<RPCResponse<DIDProviderMethods, Name> | null>;
}
