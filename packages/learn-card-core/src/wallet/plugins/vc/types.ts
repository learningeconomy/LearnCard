import { UnsignedVC, VC, UnsignedVP, VP, VerificationCheck } from '@learncard/types';
import { Wallet } from 'types/wallet';
import { KeyPair, ProofOptions } from '../didkit/types';

/** @group VC Plugin */
export type VCPluginDependentMethods = {
    getSubjectDid: (type: 'key') => string;
    getSubjectKeypair: () => KeyPair;
    keyToVerificationMethod: (type: string, keypair: KeyPair) => Promise<string>;
    issueCredential: (
        credential: UnsignedVC,
        options: ProofOptions,
        keypair: KeyPair
    ) => Promise<VC>;
    verifyCredential: (credential: VC, options?: ProofOptions) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: KeyPair
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
export type VCImplicitWallet = Wallet<string, VCPluginMethods & VCPluginDependentMethods>;

/** @group VC Plugin */
export type VerifyExtension = { verifyCredential: (credential: VC) => Promise<VerificationCheck> };
