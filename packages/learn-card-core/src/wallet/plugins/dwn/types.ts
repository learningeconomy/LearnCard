import { Plugin } from 'types/wallet';
import { JWK } from '@learncard/types';

export type DWNPluginMethods = {
    featureDetectionRead: () => Promise<string>;
};

export type DWNConfig = {
    dwnAddressURL?: URL;
};

export type DWNPluginDependantMethods = {
    getSubjectDid: (type: string) => string;
    getSubjectKeypair: (algorithm: string) => JWK;
}

export type DWNPlugin = Plugin<'DWNPlugin', 'store', DWNPluginMethods, any, DWNPluginDependantMethods >;