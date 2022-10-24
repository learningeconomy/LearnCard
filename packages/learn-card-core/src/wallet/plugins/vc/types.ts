import { JWK, UnsignedVC, VC, UnsignedVP, VP, VerificationCheck } from '@learncard/types';
import { Plugin, Wallet } from 'types/wallet';
import { ProofOptions } from '../didkit/types';

/** @group VC Plugin */
export type VCPluginDependentMethods = {
    getSubjectDid: (type: 'key') => string;
    getSubjectKeypair: () => JWK;
    keyToVerificationMethod: (type: string, keypair: JWK) => Promise<string>;
    issueCredential: (credential: UnsignedVC, options: ProofOptions, keypair: JWK) => Promise<VC>;
    verifyCredential: (credential: VC, options?: ProofOptions) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: JWK
    ) => Promise<VP>;
    verifyPresentation: (presentation: VP, options?: ProofOptions) => Promise<VerificationCheck>;
};

/** @group VC Plugin */
export type VCPluginMethods = {
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    verifyCredential: (
        credential: VC,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
    issuePresentation: (
        credential: UnsignedVP,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VP>;
    verifyPresentation: (
        presentation: VP,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;
};

/** @group VC Plugin */
export type VCDependentWallet = Wallet<any, 'id', VCPluginDependentMethods>;

/** @group VC Plugin */
export type VCImplicitWallet = Wallet<any, 'id', VCPluginMethods & VCPluginDependentMethods>;

/** @group VC Plugin */
export type VerifyExtension = { verifyCredential: (credential: VC) => Promise<VerificationCheck> };

/** @group VC Plugin */
export type VCPlugin = Plugin<'VC', VCPluginMethods, 'id', VCPluginDependentMethods>;
