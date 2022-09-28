import { DidMethod } from '@wallet/plugins/didkit/types';
import { DidKeyPluginMethods } from '@wallet/plugins/didkey/types';
import { EthereumPluginMethods } from '@wallet/plugins/EthereumPlugin/types';
import { IDXPluginMethods, CeramicIDXArgs } from '@wallet/plugins/idx/types';
import { VCPluginMethods, VerifyExtension } from '@wallet/plugins/vc/types';
import { DidkitPluginMethods } from '@wallet/plugins/didkit/types';
import { EthereumConfig } from '@wallet/plugins/EthereumPlugin/types';
import { VpqrPluginMethods } from '@wallet/plugins/vpqr/types';
import { InitInput } from '@didkit/index';

import { InitFunction, GenericInitFunction } from 'types/helpers';
import { Wallet } from 'types/wallet';
import { AllLearnCardMethods } from 'types/methods';
import { VCTemplatePluginMethods } from '@wallet/plugins/vc-templates';

export * from 'types/methods';

// export * from '@learncard/types';

/** @group Universal Wallets */
export type LearnCardRawWallet = Wallet<
    'DIDKit' | 'DID Key' | 'VC' | 'VC Templates' | 'IDX' | 'Expiration' | 'Ethereum' | 'Vpqr',
    DidKeyPluginMethods<DidMethod> &
        VCPluginMethods &
        VCTemplatePluginMethods &
        IDXPluginMethods &
        EthereumPluginMethods &
        VpqrPluginMethods
>;

/**
 * @group LearnCard
 */
export type LearnCard<
    Methods extends keyof AllLearnCardMethods = keyof AllLearnCardMethods,
    RawWallet extends Wallet<any, any> = LearnCardRawWallet
> = {
    /** Raw IoE wallet instance. You shouldn't need to drop down to this level! */
    _wallet: RawWallet;
} & Pick<AllLearnCardMethods, Methods>;

/**
 * @group LearnCard
 */
export type EmptyLearnCard = LearnCard<
    'newCredential' | 'newPresentation' | 'verifyCredential' | 'verifyPresentation' | 'resolveDid',
    Wallet<
        'DIDKit' | 'Expiration' | 'VC Templates',
        DidkitPluginMethods & VerifyExtension & VCTemplatePluginMethods
    >
>;

/** @group LearnCard */
export type LearnCardConfig = {
    ceramicIdx: CeramicIDXArgs;
    didkit: InitInput | Promise<InitInput>;
    defaultContents: any[];
    ethereumConfig: EthereumConfig;
};

/** @group Init Functions */
export type EmptyWallet = InitFunction<undefined, 'didkit', EmptyLearnCard>;
/** @group Init Functions */
export type WalletFromKey = InitFunction<{ seed: string }, keyof LearnCardConfig, LearnCard>;

/** @group Init Functions */
export type InitLearnCard = GenericInitFunction<[EmptyWallet, WalletFromKey]>;
