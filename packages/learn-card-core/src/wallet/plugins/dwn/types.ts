import { Plugin } from 'types/wallet';

export type DWNPluginMethods = {
    featureDetectionRead: () => Promise<string>;
};

export type DWNConfig = {
    dwnAddressURL?: URL;
};

export type DWNPlugin = Plugin<'DWNPlugin', any, DWNPluginMethods>;