import type { LearnCard } from '@learncard/core';
import type { InitInput } from '@learncard/types';

import type { CryptoPluginType } from '@learncard/crypto-plugin';
import type { DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import type { DidKeyPlugin } from '@learncard/didkey-plugin';
import type { DynamicLoaderPluginType } from '@learncard/dynamic-loader-plugin';
import type { VCPlugin } from '@learncard/vc-plugin';
import type { VCTemplatePlugin } from '@learncard/vc-templates-plugin';
import type { LearnCloudPlugin } from '@learncard/learn-cloud-plugin';
import type { ExpirationPlugin } from '@learncard/expiration-plugin';
import type { EthereumPlugin, EthereumConfig } from '@learncard/ethereum-plugin';
import type { VpqrPlugin } from '@learncard/vpqr-plugin';
import type { CHAPIPlugin } from '@learncard/chapi-plugin';
import type { VCAPIPlugin } from '@learncard/vc-api-plugin';
import type { LearnCardPlugin } from '@learncard/learn-card-plugin';
import type { VerifyBoostPlugin, LearnCardNetworkPlugin } from '@learncard/network-plugin';
import type { DidWebPlugin } from '@learncard/did-web-plugin';
import type { EncryptionPluginType } from '@learncard/encryption-plugin';

import type { InitFunction, GenericInitFunction } from './helpers';

/** @group LearnCard */
export type LearnCardConfig = {
    cloud?: {
        url?: string;
        unencryptedFields?: string[];
        unencryptedCustomFields?: string[];
        automaticallyAssociateDids?: boolean;
    };
    didkit: InitInput | Promise<InitInput>;
    allowRemoteContexts?: boolean;
    ethereumConfig: EthereumConfig;
    debug?: typeof console.log;
};

/** @group Init Functions */
export type EmptyLearnCard = InitFunction<
    {},
    'didkit' | 'debug' | 'allowRemoteContexts',
    LearnCard<
        [
            DynamicLoaderPluginType,
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
            DynamicLoaderPluginType,
            CryptoPluginType,
            DIDKitPlugin,
            DidKeyPlugin<DidMethod>,
            EncryptionPluginType,
            VCPlugin,
            VCTemplatePlugin,
            LearnCloudPlugin,
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
            DynamicLoaderPluginType,
            CryptoPluginType,
            DIDKitPlugin,
            DidKeyPlugin<DidMethod>,
            EncryptionPluginType,
            VCPlugin,
            VCTemplatePlugin,
            LearnCloudPlugin,
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
            DynamicLoaderPluginType,
            CryptoPluginType,
            DIDKitPlugin,
            DidKeyPlugin<DidMethod>,
            EncryptionPluginType,
            VCPlugin,
            VCTemplatePlugin,
            LearnCloudPlugin,
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
export type DidWebNetworkLearnCardFromSeed = InitFunction<
    { seed: string; network: true | string; didWeb: string; trustedBoostRegistry?: string },
    keyof LearnCardConfig,
    LearnCard<
        [
            DynamicLoaderPluginType,
            CryptoPluginType,
            DIDKitPlugin,
            DidKeyPlugin<DidMethod>,
            EncryptionPluginType,
            VCPlugin,
            VCTemplatePlugin,
            LearnCloudPlugin,
            ExpirationPlugin,
            EthereumPlugin,
            VpqrPlugin,
            CHAPIPlugin,
            VerifyBoostPlugin,
            LearnCardPlugin,
            DidWebPlugin,
            LearnCardNetworkPlugin
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
        DidWebNetworkLearnCardFromSeed,
        LearnCardFromVcApi,
        CustomLearnCard
    ]
>;
