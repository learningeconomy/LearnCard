import { Plugin } from 'types/wallet';

export type CryptoPluginMethods = {
    crypto: () => Crypto;
};

export type CryptoPluginType = Plugin<'Crypto', any, CryptoPluginMethods>;
