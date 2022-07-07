import { UnsignedVC, VC, UnsignedVP, VP, VerificationCheck } from '@learncard/types';
import { KeyPair, ProofOptions } from '../didkit/types';

export type DependentMethods = {
    getSubjectDid: () => string;
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

export type VCPluginMethods = {
    issueCredential: (credential: UnsignedVC) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (credential: VC) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;

    // Actively Dependent methods
    getSubjectDid: () => string;
    getSubjectKeypair: () => KeyPair;
};

export type VerifyExtension = { verifyCredential: (credential: VC) => Promise<VerificationCheck> };
