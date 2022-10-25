import { VC, VerificationCheck, VerificationItem } from '@learncard/types';
import { Plugin } from 'types/wallet';
import { ProofOptions } from '../didkit';

export type VerifyCredential = {
    (vc: VC, options?: Partial<ProofOptions>): Promise<VerificationCheck>;
    (vc: VC, options: Partial<ProofOptions>, prettify: true): Promise<VerificationItem[]>;
};

/** @group LearnCard Plugin */
export type LearnCardPluginDependentMethods = {
    verifyCredential: (vc: VC, options?: Partial<ProofOptions>) => Promise<VerificationCheck>;
};

/** @group LearnCard Plugin */
export type LearnCardPluginMethods = {
    verifyCredential: VerifyCredential;
};

/** @group LearnCard Plugin */
export type LearnCardPlugin = Plugin<
    'Learn Card',
    any,
    LearnCardPluginMethods,
    any,
    LearnCardPluginDependentMethods
>;
