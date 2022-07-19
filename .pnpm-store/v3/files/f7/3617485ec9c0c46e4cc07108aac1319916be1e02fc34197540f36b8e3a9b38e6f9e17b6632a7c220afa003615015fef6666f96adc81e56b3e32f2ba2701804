import type { CID } from 'multiformats/cid';
import type { JWE } from 'did-jwt';
import type { RPCClient, RPCConnection, RPCRequest, RPCResponse } from 'rpc-utils';
export declare type CreateJWSParams = {
    payload: string | Record<string, any>;
    protected?: Record<string, any>;
    revocable?: boolean;
    did: string;
};
export declare type DecryptJWEParams = {
    jwe: JWE;
    did?: string;
};
export declare type AuthParams = {
    paths: Array<string>;
    nonce: string;
    aud?: string;
};
export declare type JWSSignature = {
    protected: string;
    signature: string;
};
export declare type DagJWS = {
    payload: string;
    signatures: Array<JWSSignature>;
    link?: CID;
};
export declare type GeneralJWS = {
    payload: string;
    signatures: Array<JWSSignature>;
};
export declare type DIDProviderMethods = {
    did_authenticate: {
        params: AuthParams;
        result: GeneralJWS;
    };
    did_createJWS: {
        params: CreateJWSParams;
        result: {
            jws: GeneralJWS;
        };
    };
    did_decryptJWE: {
        params: DecryptJWEParams;
        result: {
            cleartext: string;
        };
    };
};
export declare type DIDMethodName = keyof DIDProviderMethods;
export declare type DIDRequest<K extends DIDMethodName = DIDMethodName> = RPCRequest<DIDProviderMethods, K>;
export declare type DIDResponse<K extends DIDMethodName = DIDMethodName> = RPCResponse<DIDProviderMethods, K>;
export declare type DIDProvider = RPCConnection<DIDProviderMethods>;
export declare type DIDProviderClient = RPCClient<DIDProviderMethods>;
export declare type DIDProviderOrClient = DIDProvider | DIDProviderClient;
