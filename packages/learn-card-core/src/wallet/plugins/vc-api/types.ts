import { UnsignedVC, UnsignedVP, VC, VP, VerificationCheck } from '@learncard/types';

/** @group VC-API Plugin */
export type APIOptions = {
    created?: string;
    challenge?: string;
    domain?: string;
};

/** @group VC-API Plugin */
export type VCAPIPluginMethods = {
    getSubjectDid: (type: string) => string;
    issueCredential: (credential: UnsignedVC, signingOptions?: APIOptions) => Promise<VC>;
    verifyCredential: (
        credential: VC,
        options?: Omit<APIOptions, 'created'>
    ) => Promise<VerificationCheck>;
    issuePresentation: (presentation: UnsignedVP, signingOptions?: APIOptions) => Promise<VP>;
    verifyPresentation: (
        presentation: VP,
        options?: Omit<APIOptions, 'created'>
    ) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;
};
