import { ModelAliases } from '@glazed/types';

import { DidKeyPluginConstants, DidKeyPluginMethods } from '@wallet/plugins/didkey/types';
import { IDXPluginMethods } from '@wallet/plugins/idx/types';
import { VCPluginMethods } from '@wallet/plugins/vc/types';

import { UnlockedWallet } from 'types/wallet';

export type LearnCardWallet = UnlockedWallet<
    'DID Key' | 'VC' | 'IDX',
    DidKeyPluginMethods & VCPluginMethods & IDXPluginMethods,
    DidKeyPluginConstants
>;

export type CeramicIDXArgs = {
    modelData: ModelAliases;
    credentialAlias: string;
    ceramicEndpoint: string;
    defaultContentFamily: string;
};
