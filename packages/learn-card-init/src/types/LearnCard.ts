import { LearnCard } from '@learncard/core';
import { InitInput } from '@learncard/types';

import { CryptoPluginType } from '@learncard/crypto-plugin';
import { DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import { DidKeyPlugin } from '@learncard/didkey-plugin';
import { VCPlugin } from '@learncard/vc-plugin';
import { VCTemplatePlugin } from '@learncard/vc-templates-plugin';
import { LearnCloudPlugin } from '@learncard/learn-cloud-plugin';
import { CeramicPlugin, CeramicArgs } from '@learncard/ceramic-plugin';
import { IDXPlugin, IDXArgs } from '@learncard/idx-plugin';
import { ExpirationPlugin } from '@learncard/expiration-plugin';
import { EthereumPlugin, EthereumConfig } from '@learncard/ethereum-plugin';
import { VpqrPlugin } from '@learncard/vpqr-plugin';
import { CHAPIPlugin } from '@learncard/chapi-plugin';
import { VCAPIPlugin } from '@learncard/vc-api-plugin';
import { LearnCardPlugin } from '@learncard/learn-card-plugin';
import { VerifyBoostPlugin, LearnCardNetworkPlugin } from '@learncard/network-plugin';
import { DidWebPlugin } from '@learncard/did-web-plugin';

import { InitFunction, GenericInitFunction } from 'types/helpers';

/** @group LearnCard */
export type LearnCardConfig = {
    cloud?: { url?: string; unencryptedFields?: string[] };
    ceramicIdx: CeramicArgs & IDXArgs;
    didkit: InitInput | Promise<InitInput>;
    ethereumConfig: EthereumConfig;
    debug?: typeof console.log;
};

/** @group Init Functions */
export type EmptyLearnCard = InitFunction<
    {},
    'didkit' | 'debug',
    LearnCard<
        [
            CryptoPluginType,
            DIDKitPlugin,
            ExpirationPlugin,
            VCTemplatePlugin,
            CHAPIPlugin,
            LearnCardPlugin
        ]
    >
>;

/** @group Init Functions */
export type LearnCardFromSeed = InitFunction<
    { seed: string },
    keyof LearnCardConfig,
    LearnCard<
        [
            CryptoPluginType,
            DIDKitPlugin,
            DidKeyPlugin<DidMethod>,
            VCPlugin,
            VCTemplatePlugin,
            CeramicPlugin,
            LearnCloudPlugin,
            IDXPlugin,
            ExpirationPlugin,
            EthereumPlugin,
            VpqrPlugin,
            CHAPIPlugin,
            LearnCardPlugin
        ]
    >
>;

/** @group Init Functions */
export type NetworkLearnCardFromSeed = InitFunction<
    { seed: string; network: true | string; trustedBoostRegistry?: string },
    keyof LearnCardConfig,
    LearnCard<
        [
            CryptoPluginType,
            DIDKitPlugin,
            DidKeyPlugin<DidMethod>,
            VCPlugin,
            VCTemplatePlugin,
            CeramicPlugin,
            LearnCloudPlugin,
            IDXPlugin,
            ExpirationPlugin,
            EthereumPlugin,
            VpqrPlugin,
            CHAPIPlugin,
            VerifyBoostPlugin,
            LearnCardPlugin,
            LearnCardNetworkPlugin
        ]
    >
>;

/** @group Init Functions */
export type DidWebLearnCardFromSeed = InitFunction<
    { seed: string; didWeb: string; trustedBoostRegistry?: string },
    keyof LearnCardConfig,
    LearnCard<
        [
            CryptoPluginType,
            DIDKitPlugin,
            DidKeyPlugin<DidMethod>,
            VCPlugin,
            VCTemplatePlugin,
            CeramicPlugin,
            LearnCloudPlugin,
            IDXPlugin,
            ExpirationPlugin,
            EthereumPlugin,
            VpqrPlugin,
            CHAPIPlugin,
            LearnCardPlugin,
            DidWebPlugin
        ]
    >
>;

/** @group Init Functions */
export type LearnCardFromVcApi = InitFunction<
    { vcApi: true | string; did?: string },
    'debug',
    LearnCard<
        [
            CryptoPluginType,
            VCAPIPlugin,
            ExpirationPlugin,
            VCTemplatePlugin,
            CHAPIPlugin,
            LearnCardPlugin
        ]
    >
>;

/** @group Init Functions */
export type CustomLearnCard = InitFunction<{ custom: true }, 'debug', LearnCard<[]>>;

/** @group Init Functions */
export type InitLearnCard = GenericInitFunction<
    [
        EmptyLearnCard,
        LearnCardFromSeed,
        NetworkLearnCardFromSeed,
        DidWebLearnCardFromSeed,
        LearnCardFromVcApi,
        CustomLearnCard
    ]
>;
