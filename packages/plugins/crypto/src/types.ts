import { Plugin } from '@learncard/core';

export type CryptoPluginMethods = {
    crypto: () => Crypto;
};

export type CryptoPluginType = Plugin<'Crypto', any, CryptoPluginMethods>;
