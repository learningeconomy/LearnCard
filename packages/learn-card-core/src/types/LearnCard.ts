import { InitInput } from '@didkit/index';

import { DIDKitPlugin, DidMethod } from '@wallet/plugins/didkit/types';
import { DidKeyPlugin } from '@wallet/plugins/didkey/types';
import { VCPlugin } from '@wallet/plugins/vc/types';
import { VCTemplatePlugin } from '@wallet/plugins/vc-templates';
import { VCResolutionPluginType } from '@wallet/plugins/vc-resolution';
import { CeramicPlugin, CeramicArgs } from '@wallet/plugins/ceramic/types';
import { IDXPlugin, IDXArgs } from '@wallet/plugins/idx/types';
import { ExpirationPlugin } from '@wallet/plugins/expiration/types';
import { EthereumPlugin, EthereumConfig } from '@wallet/plugins/EthereumPlugin/types';
import { VpqrPlugin } from '@wallet/plugins/vpqr/types';
import { CHAPIPlugin } from '@wallet/plugins/chapi';
import { VCAPIPlugin } from '@wallet/plugins/vc-api/types';
import { LearnCardPlugin } from '@wallet/plugins/learn-card';

import { InitFunction, GenericInitFunction } from 'types/helpers';
import { Wallet } from 'types/wallet';

export * from 'types/methods';

// export * from '@learncard/types';

/** @group Universal Wallets */
export type LearnCardFromKey = Wallet<
    [
        DIDKitPlugin,
        DidKeyPlugin<DidMethod>,
        VCPlugin,
        VCTemplatePlugin,
        VCResolutionPluginType,
        CeramicPlugin,
        IDXPlugin,
        ExpirationPlugin,
        EthereumPlugin,
        VpqrPlugin,
        CHAPIPlugin,
        LearnCardPlugin
    ]
>;

/**
 * @group LearnCard
 */
export type EmptyLearnCard = Wallet<
    [DIDKitPlugin, ExpirationPlugin, VCTemplatePlugin, CHAPIPlugin, LearnCardPlugin]
>;

/**
 * @group LearnCard
 */
export type VCAPILearnCard = Wallet<
    [VCAPIPlugin, ExpirationPlugin, VCTemplatePlugin, CHAPIPlugin, LearnCardPlugin]
>;

/** @group LearnCard */
export type LearnCardConfig = {
    ceramicIdx: CeramicArgs & IDXArgs;
    didkit: InitInput | Promise<InitInput>;
    ethereumConfig: EthereumConfig;
    debug?: typeof console.log;
};

/** @group Init Functions */
export type EmptyWallet = InitFunction<{}, 'didkit' | 'debug', EmptyLearnCard>;
/** @group Init Functions */
export type WalletFromKey = InitFunction<{ seed: string }, keyof LearnCardConfig, LearnCardFromKey>;
/** @group Init Functions */
export type WalletFromVcApi = InitFunction<
    { vcApi: true | string; did?: string },
    'debug',
    VCAPILearnCard
>;

/** @group Init Functions */
export type InitLearnCard = GenericInitFunction<[EmptyWallet, WalletFromKey, WalletFromVcApi]>;
