import type { DID } from 'dids';
import { UnsignedVC, VC, VP } from '@learncard/types';
import { LearnCard, Plugin } from '@learncard/core';
import { ProofOptions } from '@learncard/didkit-plugin';

/** @group LearnCloud Plugin */
export type LearnCloudPluginDependentMethods = {
    getDIDObject: () => DID;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    crypto: () => Crypto;
};

/** @group LearnCloud Plugin */
export type LearnCloudPluginMethods = Record<never, never>;

/** @group LearnCloud Plugin */
export type LearnCloudPlugin = Plugin<
    'LearnCloud',
    'index' | 'read' | 'store',
    LearnCloudPluginMethods,
    'id',
    LearnCloudPluginDependentMethods
>;

/** @group LearnCloud Plugin */
export type LearnCloudDependentLearnCard = LearnCard<any, 'id', LearnCloudPluginDependentMethods>;