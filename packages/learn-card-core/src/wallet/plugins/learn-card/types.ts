import {
    JWK,
    UnsignedVC,
    VC,
    UnsignedVP,
    VP,
    VerificationCheck,
    VerificationItem,
} from '@learncard/types';
import { Plugin } from 'types/wallet';
import { ProofOptions } from '../didkit';

export type VerifyCredential = {
    (vc: VC, options?: Partial<ProofOptions>): Promise<VerificationCheck>;
    (vc: VC, options: Partial<ProofOptions>, prettify: true): Promise<VerificationItem[]>;
};

/** @group LearnCard Plugin */
export type LearnCardPluginDependentMethods = {
    issueCredential:
    | ((credential: UnsignedVC, signingOptions?: Partial<ProofOptions>) => Promise<VC>)
    | ((credential: UnsignedVC, options: Partial<ProofOptions>, keypair: JWK) => Promise<VC>);
    verifyCredential: (vc: VC, options?: Partial<ProofOptions>) => Promise<VerificationCheck>;
    issuePresentation:
    | ((presentation: UnsignedVP, signingOptions?: Partial<ProofOptions>) => Promise<VP>)
    | ((presentation: UnsignedVP, options: Partial<ProofOptions>, keypair: JWK) => Promise<VP>);
};

/** @group LearnCard Plugin */
export type LearnCardPluginMethods = {
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    verifyCredential: VerifyCredential;
    issuePresentation: (
        presentation: UnsignedVP,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VP>;
};

/** @group LearnCard Plugin */
export type LearnCardPlugin = Plugin<
    'LearnCard',
    any,
    LearnCardPluginMethods,
    any,
    LearnCardPluginDependentMethods
>;

/** @group LearnCard Plugin */
export type LearnCardPluginNoIssuance = Plugin<
    'LearnCard',
    any,
    Omit<LearnCardPluginMethods, 'issueCredential' | 'issuePresentation'>,
    any,
    Omit<LearnCardPluginDependentMethods, 'issueCredential' | 'issuePresentation'>
>;
