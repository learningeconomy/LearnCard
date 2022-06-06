import { UnsignedVC, VC, VP } from '@learncard/types';

export type VerificationCheck = {
    checks: string[];
    warnings: string[];
    errors: string[];
};

export type VCPluginMethods = {
    issueCredential: (credential: UnsignedVC) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (credential: VC) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;

    // Dependent methods
    getSubjectDid: () => string;
    getSubjectKeypair: () => Record<string, string>;
};

export type VerifyExtension = { verifyCredential: (credential: VC) => Promise<VerificationCheck> };
