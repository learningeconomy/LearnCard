import {
    JWK,
    UnsignedVC,
    VC,
    UnsignedVP,
    VP,
    VerificationCheck,
    DidDocument,
} from '@learncard/types';
import { Plugin, LearnCard } from '@learncard/core';
import { ProofOptions, InputMetadata } from '@learncard/didkit-plugin';

/** @group VC Plugin */
export type VCPluginDependentMethods = {
    getSubjectDid: (type: 'key') => string;
    getSubjectKeypair: () => JWK;
    keyToVerificationMethod: (type: string, keypair: JWK) => Promise<string>;
    didToVerificationMethod: (did: string) => Promise<string>;
    issueCredential: (credential: UnsignedVC, options: ProofOptions, keypair: JWK) => Promise<VC>;
    verifyCredential: (credential: VC, options?: ProofOptions) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: JWK
    ) => Promise<VP>;
    verifyPresentation: (
        presentation: VP | string,
        options?: ProofOptions
    ) => Promise<VerificationCheck>;
    resolveDid: (did: string, inputMetadata?: InputMetadata) => Promise<DidDocument>;
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
        presentation: VP | string,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
};

/** @group VC Plugin */
export type VCDependentLearnCard = LearnCard<any, 'id', VCPluginDependentMethods>;

/** @group VC Plugin */
export type VCImplicitLearnCard = LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;

/** @group VC Plugin */
export type VerifyExtension = {
    verifyCredential: (
        credential: VC,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
};

/** @group VC Plugin */
export type VCPlugin = Plugin<'VC', any, VCPluginMethods, 'id', VCPluginDependentMethods>;
