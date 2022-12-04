import { Plugin } from 'types/wallet';
import { JWK } from '@learncard/types';
import { VC } from '@learncard/types';

export type DWNPluginMethods = {
    postDWNRequest(request: object, request_name?: string): Promise<object>
    featureDetectionRead: () => Promise<object>
    collectionsQuery: () => Promise<object>
    featureDetectionMessageBody: (did:string) => Promise<object>
    writeVCMessageBody: (vc: VC, keyPair?: JWK, did?: string) => Promise<object>,
    permissionsRequestMessageBody: (method: string, schema: string, keyPair?: JWK, did?: string) => Promise<object>,
    getSchemas: () => object | undefined
};

export type DWNConfig = {
    dwnAddressURL?: URL;
    schemas?: object;
};

export type DWNPluginDependantMethods = {
    getSubjectDid: (type: string) => string;
    getSubjectKeypair: (algorithm: string) => JWK;
}

export type DWNPlugin = Plugin<'DWNPlugin', 'store', DWNPluginMethods, any, DWNPluginDependantMethods >;