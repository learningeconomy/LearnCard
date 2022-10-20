import { VC, VerificationCheck, VerificationItem } from '@learncard/types';
import { Plugin } from 'types/wallet';
import { ProofOptions } from '../didkit';

/** @group LearnCard Plugin */
export type LearnCardPluginDependentMethods = {
    verifyCredential: (vc: VC, options?: Partial<ProofOptions>) => Promise<VerificationCheck>;
};

/** @group LearnCard Plugin */
export type LearnCardPluginMethods = {
    verifyCredential: (vc: VC, options?: Partial<ProofOptions>) => Promise<VerificationItem[]>;
};

/** @group LearnCard Plugin */
export type LearnCardPlugin = Plugin<
    'Learn Card',
    LearnCardPluginMethods,
    LearnCardPluginDependentMethods
>;
