import { InitInput } from '@didkit/index';

import { DIDKitPlugin, DidMethod } from '@wallet/plugins/didkit/types';
import { DidKeyPlugin } from '@wallet/plugins/didkey/types';
import { VCPlugin } from '@wallet/plugins/vc/types';
import { VCTemplatePlugin } from '@wallet/plugins/vc-templates';
import { VCResolutionPluginType } from '@wallet/plugins/vc-resolution';
import { IDXPlugin, CeramicIDXArgs } from '@wallet/plugins/idx/types';
import { ExpirationPlugin } from '@wallet/plugins/expiration/types';
import { EthereumPlugin, EthereumConfig } from '@wallet/plugins/EthereumPlugin/types';
import { VpqrPlugin } from '@wallet/plugins/vpqr/types';
import { CHAPIPlugin } from '@wallet/plugins/chapi';
import { VCAPIPlugin } from '@wallet/plugins/vc-api/types';

import { InitFunction, GenericInitFunction } from 'types/helpers';
import { Wallet } from 'types/wallet';
import { AllLearnCardMethods } from 'types/methods';

export * from 'types/methods';

// export * from '@learncard/types';

/** @group Universal Wallets */
export type LearnCardRawWallet = Wallet<
    [
        DIDKitPlugin,
        DidKeyPlugin<DidMethod>,
        VCPlugin,
        VCTemplatePlugin,
        VCResolutionPluginType,
        IDXPlugin,
        ExpirationPlugin,
        EthereumPlugin,
        VpqrPlugin,
        CHAPIPlugin
    ]
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
    } & Pick<AllLearnCardMethods, Methods> &
    Pick<RawWallet, 'read' | 'store' | 'index'>;

/**
 * @group LearnCard
 */
export type EmptyLearnCard = LearnCard<
    | 'newCredential'
    | 'newPresentation'
    | 'verifyCredential'
    | 'verifyPresentation'
    | 'resolveDid'
    | 'installChapiHandler'
    | 'activateChapiHandler'
    | 'receiveChapiEvent'
    | 'storePresentationViaChapi'
    | 'storeCredentialViaChapiDidAuth',
    Wallet<[DIDKitPlugin, ExpirationPlugin, VCTemplatePlugin, CHAPIPlugin]>
>;

/**
 * @group LearnCard
 */
export type VCAPILearnCard = LearnCard<
    | 'did'
    | 'newCredential'
    | 'newPresentation'
    | 'issueCredential'
    | 'verifyCredential'
    | 'issuePresentation'
    | 'verifyPresentation'
    | 'getTestVc'
    | 'getTestVp'
    | 'installChapiHandler'
    | 'activateChapiHandler'
    | 'receiveChapiEvent'
    | 'storePresentationViaChapi'
    | 'storeCredentialViaChapiDidAuth',
    Wallet<[VCAPIPlugin, ExpirationPlugin, VCTemplatePlugin, CHAPIPlugin]>
>;

/** @group LearnCard */
export type LearnCardConfig = {
    ceramicIdx: CeramicIDXArgs;
    didkit: InitInput | Promise<InitInput>;
    ethereumConfig: EthereumConfig;
    debug?: typeof console.log;
};

/** @group Init Functions */
export type EmptyWallet = InitFunction<{}, 'didkit' | 'debug', EmptyLearnCard>;
/** @group Init Functions */
export type WalletFromKey = InitFunction<{ seed: string }, keyof LearnCardConfig, LearnCard>;
/** @group Init Functions */
export type WalletFromVcApi = InitFunction<
    { vcApi: true | string; did?: string },
    'debug',
    VCAPILearnCard
>;

/** @group Init Functions */
export type InitLearnCard = GenericInitFunction<[EmptyWallet, WalletFromKey, WalletFromVcApi]>;
