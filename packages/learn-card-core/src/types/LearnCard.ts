import { ModelAliases } from '@glazed/types';

import { DidKeyPluginConstants, DidKeyPluginMethods } from '@wallet/plugins/didkey/types';
import { IDXCredential, IDXPluginMethods } from '@wallet/plugins/idx/types';
import { VCPluginMethods, UnsignedVC, VC, VerificationCheck, VP } from '@wallet/plugins/vc/types';

import { UnlockedWallet } from 'types/wallet';

export type LearnCardRawWallet = UnlockedWallet<
    'DID Key' | 'VC' | 'IDX',
    DidKeyPluginMethods & VCPluginMethods & IDXPluginMethods,
    DidKeyPluginConstants
>;

export type LearnCardWallet = {
    _wallet: LearnCardRawWallet;

    did: string;
    keypair: Record<string, string>;

    issueCredential: (credential: UnsignedVC) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (credential: VC, holder?: string) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;

    getCredential: (title: string) => Promise<any>;
    getCredentials: () => Promise<any[]>;
    publishCredential: (credential: any) => Promise<string>;
    addCredential: (credential: IDXCredential) => Promise<void>;

    getTestVc: (subject?: string) => UnsignedVC;
};

export type CeramicIDXArgs = {
    modelData: ModelAliases;
    credentialAlias: string;
    ceramicEndpoint: string;
    defaultContentFamily: string;
};
