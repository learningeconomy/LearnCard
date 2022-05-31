import { generateContentFromSeed } from './generateContentFromSeed';

import { DidKeyPluginMethods, DidKeyPluginConstants, JWK } from './types';
import { Plugin } from 'types/wallet';

export const DidKeyPlugin: Plugin<'DID Key', DidKeyPluginMethods, DidKeyPluginConstants> = {
    pluginMethods: {
        getSubjectDid: wallet =>
            (wallet.contents as JWK[]).find(content => content.name === 'Signing Key')
                ?.controller ?? '',
        getSubjectKeypair: wallet =>
            (wallet.contents as JWK[]).find(content => content.name === 'Signing Key')
                ?.privateKeyJwk,
    },
    pluginConstants: {
        generateContentFromSeed,
    },
};
