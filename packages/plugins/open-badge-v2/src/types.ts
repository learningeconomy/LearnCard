import { Plugin } from '@learncard/core';
import { VC } from '@learncard/types';
import { VCPluginMethods } from '@learncard/vc-plugin';
import { CryptoPluginMethods } from '@learncard/crypto-plugin';

export type OpenBadgeV2PluginDependentMethods = VCPluginMethods & CryptoPluginMethods;

export type OpenBadgeV2PluginMethods = {
    /**
     * Wrap a legacy OpenBadge v2.0 assertion (object or URL) into a self-issued VC
     */
    wrapOpenBadgeV2: (obv2Assertion: object | string) => Promise<VC>;
};

export type OpenBadgeV2Plugin = Plugin<
    'OpenBadgeV2',
    any,
    OpenBadgeV2PluginMethods,
    'id',
    OpenBadgeV2PluginDependentMethods
>;

export const OBV2_WRAPPER_CONTEXT_URL = 'https://ctx.learncard.com/wrappers/obv2/1.0.0.json';
