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

import { DWNConfig, DWNPlugin } from '@wallet/plugins/dwn/types';

import { InitFunction, GenericInitFunction } from 'types/helpers';
import { LearnCard } from 'types/wallet';

// export * from '@learncard/types';

/** @group LearnCard */
export type LearnCardConfig = {
    ceramicIdx: CeramicArgs & IDXArgs;
    didkit: InitInput | Promise<InitInput>;
    ethereumConfig: EthereumConfig;
    dwnConfig: DWNConfig;
    debug?: typeof console.log;
};

/** @group Init Functions */
export type EmptyLearnCard = InitFunction<
    {},
    'didkit' | 'debug',
    LearnCard<[DIDKitPlugin, ExpirationPlugin, VCTemplatePlugin, CHAPIPlugin, LearnCardPlugin]>
>;

/** @group Init Functions */
export type LearnCardFromSeed = InitFunction<
    { seed: string },
    keyof LearnCardConfig,
    LearnCard<
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
            DWNPlugin,
            LearnCardPlugin]
    >
>;

/** @group Init Functions */
export type LearnCardFromVcApi = InitFunction<
    { vcApi: true | string; did?: string },
    'debug',
    LearnCard<[VCAPIPlugin, ExpirationPlugin, VCTemplatePlugin, CHAPIPlugin, LearnCardPlugin]>
>;

/** @group Init Functions */
export type CustomLearnCard = InitFunction<{ custom: true }, 'debug', LearnCard<[]>>;

/** @group Init Functions */
export type InitLearnCard = GenericInitFunction<
    [EmptyLearnCard, LearnCardFromSeed, LearnCardFromVcApi, CustomLearnCard]
>;
