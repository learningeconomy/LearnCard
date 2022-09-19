import { UnsignedVC, VC, UnsignedVP, VP, VerificationCheck } from '@learncard/types';
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
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: KeyPair
    ) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
};

/** @group VC Plugin */
export type VCPluginMethods = VCPluginDependentMethods & {
    issueCredential: (credential: UnsignedVC) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (credential: UnsignedVP) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;
};

/** @group VC Plugin */
export type VerifyExtension = { verifyCredential: (credential: VC) => Promise<VerificationCheck> };
