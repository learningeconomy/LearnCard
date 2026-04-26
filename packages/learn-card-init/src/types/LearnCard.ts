import { LearnCard } from '@learncard/core';
import { InitInput } from '@learncard/types';

import { CryptoPluginType } from '@learncard/crypto-plugin';
import { DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import { DidKeyPlugin } from '@learncard/didkey-plugin';
import { DynamicLoaderPluginType } from '@learncard/dynamic-loader-plugin';
import { VCPlugin } from '@learncard/vc-plugin';
import { VCTemplatePlugin } from '@learncard/vc-templates-plugin';
import { LearnCloudPlugin } from '@learncard/learn-cloud-plugin';
import { ExpirationPlugin } from '@learncard/expiration-plugin';
import { EthereumPlugin, EthereumConfig } from '@learncard/ethereum-plugin';
import { VpqrPlugin } from '@learncard/vpqr-plugin';
import { CHAPIPlugin } from '@learncard/chapi-plugin';
import { VCAPIPlugin } from '@learncard/vc-api-plugin';
import { LearnCardPlugin } from '@learncard/learn-card-plugin';
import { VerifyBoostPlugin, LearnCardNetworkPlugin } from '@learncard/network-plugin';
import { DidWebPlugin } from '@learncard/did-web-plugin';
import { EncryptionPluginType } from '@learncard/encryption-plugin';
import { OpenID4VCPlugin, OpenID4VCPluginConfig } from '@learncard/openid4vc-plugin';
import { StatusListPlugin, StatusListPluginConfig } from '@learncard/status-list-plugin';

import { InitFunction, GenericInitFunction } from './helpers';

export type GuardianApprovalGetter = () => string | undefined | Promise<string | undefined>;

/** @group LearnCard */
export type LearnCardConfig = {
    cloud?: {
        url?: string;
        unencryptedFields?: string[];
        unencryptedCustomFields?: string[];
        automaticallyAssociateDids?: boolean;
    };
    didkit: InitInput | Promise<InitInput> | 'node';
    allowRemoteContexts?: boolean;
    ethereumConfig: EthereumConfig;
    /**
     * Optional configuration for the OpenID4VC holder plugin
     * (OID4VCI + OID4VP + SIOPv2). The plugin is wired automatically
     * into seed-based wallet shapes; this hook lets hosts customise
     * the network policy (e.g., a trust-pinned fetch, a custom DID
     * resolver for verifying Request Objects, X.509 trust roots).
     * Omitting this works for the common case.
     */
    openid4vc?: OpenID4VCPluginConfig;
    /**
     * Optional configuration for the W3C Bitstring Status List
     * checking plugin. Like `openid4vc` above, the plugin is wired
     * in automatically; the most common reason to override is to
     * supply a host-provided `fetch` so status-list HTTP fetches
     * go through the same trust layer as every other plugin call.
     */
    statusList?: StatusListPluginConfig;
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
            LearnCardPlugin,
            OpenID4VCPlugin,
            StatusListPlugin
        ]
    >
>;

/** @group Init Functions */
export type NetworkLearnCardFromSeed = InitFunction<
    {
        seed: string;
        network: true | string;
        trustedBoostRegistry?: string;
        guardianApprovalGetter?: GuardianApprovalGetter;
    },
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
            LearnCardNetworkPlugin,
            OpenID4VCPlugin,
            StatusListPlugin
        ]
    >
>;

/** @group Init Functions */
export type NetworkLearnCardFromApiKey = InitFunction<
    {
        apiKey: string;
        network: true | string;
        trustedBoostRegistry?: string;
        guardianApprovalGetter?: GuardianApprovalGetter;
    },
    'didkit' | 'allowRemoteContexts' | 'debug',
    LearnCard<
        [
            DynamicLoaderPluginType,
            CryptoPluginType,
            DIDKitPlugin,
            VCPlugin,
            VCTemplatePlugin,
            ExpirationPlugin,
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
            DidWebPlugin,
            OpenID4VCPlugin,
            StatusListPlugin
        ]
    >
>;

/** @group Init Functions */
export type DidWebNetworkLearnCardFromSeed = InitFunction<
    {
        seed: string;
        network: true | string;
        didWeb: string;
        trustedBoostRegistry?: string;
        guardianApprovalGetter?: GuardianApprovalGetter;
    },
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
            LearnCardNetworkPlugin,
            OpenID4VCPlugin,
            StatusListPlugin
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
        CustomLearnCard,
        NetworkLearnCardFromApiKey
    ]
>;
