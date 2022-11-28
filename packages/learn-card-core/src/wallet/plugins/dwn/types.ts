import { Plugin } from 'types/wallet';
import { JWK } from '@learncard/types';

export type DWNPluginMethods = {
    postDWNRequest(request: object, request_name?: string): Promise<string>,
    featureDetectionRead: () => Promise<string>;
    collectionsQuery: () => Promise<string>;
    featureDetectionMessageBody: (did:string) => Promise<string>;
};

export type DWNConfig = {
    dwnAddressURL?: URL;
};

export type DWNPluginDependantMethods = {
    getSubjectDid: (type: string) => string;
    getSubjectKeypair: (algorithm: string) => JWK;
}

export type DWNPlugin = Plugin<'DWNPlugin', 'store', DWNPluginMethods, any, DWNPluginDependantMethods >;